from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Request, Response, status
from sqlalchemy import select

from core.dto.v1.auth import (
    ActivateResponseData,
    AuthMeSessionData,
    EmptyAuthActionData,
    ForgotPasswordDTO,
    LoginResponseData,
    RegisterCreatedData,
    RegisterDTO,
    ResetPasswordDTO,
    SetPasswordDTO,
    TenantSlugData,
)
from core.dto.v1.users import UserLoginDTO
from core.exceptions import BadRequestError, GoneError, NotFoundResponse
from core.exceptions.http import UnauthorizedError
from core.foundation.auth_cookies import (
    clear_auth_cookies,
    get_refresh_token_from_request,
    set_auth_cookies,
)
from core.foundation.dependencies import (
    AuthServiceDep,
    EmailServiceDep,
    PostgresSession,
    SecurityServiceDep,
)
from core.foundation.http.responses import CreatedResponse, SuccessResponse, UnauthenticatedResponse
from core.foundation.infra.config import settings
from core.foundation.logging.audit import audit
from core.foundation.token_store import (
    generate_family,
    generate_jti,
    refresh_token_store,
)
from core.models.activation_link import ActivationLink
from core.models.enums import AccountType
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole
from core.models.user import User

router = APIRouter()


@router.post(
    "/login",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[LoginResponseData],
    summary="Login a user",
    description="Login a user",
    response_description="Login successful",
)
async def login(
    credentials: UserLoginDTO,
    request: Request,
    response: Response,
    session: PostgresSession,
    auth_service: AuthServiceDep,
) -> SuccessResponse[LoginResponseData]:
    try:
        access_token = await auth_service.login(
            session=session,
            email=credentials.email,
            password=credentials.password,
        )
    except UnauthorizedError:
        audit.login_failure(request=request, email=credentials.email)
        raise

    payload = auth_service.security.decode_access_token(access_token)
    token_data = {
        "sub": payload.get("sub"),
        "email": payload.get("email"),
        "tenant_ids": payload.get("tenant_ids"),
        "account_type": payload.get("account_type"),
    }
    family = generate_family()
    jti = generate_jti()
    refresh_token = auth_service.security.create_access_token(
        {**token_data, "type": "refresh", "jti": jti, "family": family},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )

    set_auth_cookies(
        response=response,
        request=request,
        access_token=access_token,
        refresh_token=refresh_token,
    )
    audit.login_success(request=request, user_id=str(payload.get("sub")), email=credentials.email)
    return SuccessResponse(
        data=LoginResponseData(),
        message="Login successful",
    )


@router.post(
    "/register",
    response_description="User created successfully",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[RegisterCreatedData],
    summary="Register a new user",
    description="Register a new user",
)
async def register(
    data: RegisterDTO,
    request: Request,
    session: PostgresSession,
    auth_service: AuthServiceDep,
    email_service: EmailServiceDep,
) -> CreatedResponse[RegisterCreatedData]:
    user = await auth_service.create_user(
        session=session,
        email=data.email,
        password=data.password,
    )
    activation = await auth_service.create_activation_link(
        session=session,
        email=user.email,
        user_id=user.id,
    )
    activation_link = f"{settings.FRONTEND_URL}/activate?activation_id={activation.id}"
    await email_service.send_activation_email(
        to_email=user.email,
        activation_link=activation_link,
    )
    audit.register(request=request, email=user.email)

    return CreatedResponse(
        data=RegisterCreatedData(
            user_id=str(user.id),
            email=user.email,
        ),
        message="Konto zostało utworzone pomyślnie, wkrótce otrzymasz e-mail z linkiem aktywacyjnym",
    )


@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[EmptyAuthActionData],
    summary="Request password reset email",
    description="Always responds with a generic message; sends email only when an active account exists.",
)
async def forgot_password(
    data: ForgotPasswordDTO,
    request: Request,
    session: PostgresSession,
    auth_service: AuthServiceDep,
    email_service: EmailServiceDep,
) -> SuccessResponse[EmptyAuthActionData]:
    token = await auth_service.request_password_reset(session=session, email=str(data.email))
    if token is not None:
        reset_link = f"{settings.FRONTEND_URL}/reset-password?reset_id={token.id}"
        await email_service.send_password_reset_email(to_email=token.email, reset_link=reset_link)
        audit.password_reset_email_sent(request=request, user_id=str(token.user_id))
    return SuccessResponse(
        data=EmptyAuthActionData(),
        message=(
            "Jeśli podany adres e-mail jest powiązany z aktywnym kontem, "
            "wyślemy na niego instrukcję zresetowania hasła."
        ),
    )


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[EmptyAuthActionData],
    summary="Complete password reset",
    description="Set a new password using a token from the reset email.",
)
async def reset_password(
    data: ResetPasswordDTO,
    request: Request,
    session: PostgresSession,
    auth_service: AuthServiceDep,
) -> SuccessResponse[EmptyAuthActionData]:
    user_id = await auth_service.complete_password_reset(
        session=session,
        reset_token_id=data.reset_token_id,
        password=data.password,
    )
    audit.password_reset_completed(request=request, user_id=str(user_id))
    return SuccessResponse(
        data=EmptyAuthActionData(),
        message="Hasło zostało zmienione. Możesz się zalogować.",
    )


@router.post(
    "/activate",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[ActivateResponseData],
    summary="Activate an account",
    description="Activate an account",
    response_description="Account activated successfully",
)
async def activate(
    activation_id: UUID,
    request: Request,
    response: Response,
    session: PostgresSession,
    auth_service: AuthServiceDep,
) -> SuccessResponse[ActivateResponseData]:
    activation_link = await session.get(ActivationLink, activation_id)
    if activation_link is None:
        msg = "Activation link not found"
        raise NotFoundResponse(msg, str(activation_id))

    user = await session.get(User, activation_link.user_id)
    if user is None:
        msg = "Account"
        raise NotFoundResponse(msg, "activation link")

    if activation_link.used_at is None and user.force_password_change and not user.is_active:
        tenant_slug: str | None = None
        if activation_link.tenant_id is not None:
            tenant = await session.get(Tenant, activation_link.tenant_id)
            if tenant is not None:
                tenant_slug = tenant.slug
        return SuccessResponse(
            data=ActivateResponseData(tenant_slug=tenant_slug, requires_password_change=True),
            message="Password change required",
        )

    tenant, already_activated = await auth_service.activate_account(
        session=session, activation_id=activation_id
    )

    if activation_link is not None:
        activated_user = await session.get(User, activation_link.user_id)
        if activated_user is not None:
            tenant_ids = [tenant.public_id] if tenant is not None else []
            account_type = AccountType.OWNER.value if tenant is not None else None
            token_data: dict[str, str | list[str] | None] = {
                "sub": str(user.id),
                "email": user.email,
                "tenant_ids": tenant_ids,
                "account_type": account_type,
            }
            access_token = auth_service.security.create_access_token(token_data)
            act_family = generate_family()
            act_jti = generate_jti()
            refresh_token = auth_service.security.create_access_token(
                {**token_data, "type": "refresh", "jti": act_jti, "family": act_family},
                expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            )
            set_auth_cookies(
                response=response,
                request=request,
                access_token=access_token,
                refresh_token=refresh_token,
            )
            audit.activation_success(
                request=request,
                user_id=str(user.id),
                tenant_id=tenant.public_id if tenant is not None else None,
            )
    return SuccessResponse(
        data=ActivateResponseData(
            tenant_slug=tenant.slug if tenant is not None else None,
            requires_password_change=False,
        ),
        message="Account already activated"
        if already_activated
        else "Account activated successfully",
    )


@router.post(
    "/set-password",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[ActivateResponseData],
    summary="Set password and activate account",
    description="Set password for activation link and activate account",
    response_description="Password set and account activated successfully",
)
async def set_password(
    data: SetPasswordDTO,
    request: Request,
    response: Response,
    session: PostgresSession,
    auth_service: AuthServiceDep,
) -> SuccessResponse[ActivateResponseData]:
    activation_link = await session.get(ActivationLink, data.activation_id)
    if activation_link is None:
        msg = "Activation link not found"
        raise NotFoundResponse(msg, str(data.activation_id))

    now = datetime.now(tz=UTC)
    if activation_link.expires_at < now:
        msg = "Activation link has expired"
        raise GoneError(msg)
    if activation_link.used_at is not None:
        msg = "Account already activated"
        raise BadRequestError(msg)

    user = await session.get(User, activation_link.user_id)
    if user is None:
        msg = "Account"
        raise NotFoundResponse(msg, "activation link")

    user.password_hash = auth_service.security.hash_password(data.password)
    user.force_password_change = False

    tenant, _ = await auth_service.activate_account(
        session=session,
        activation_id=data.activation_id,
    )

    access_token = await auth_service.login(
        session=session,
        email=user.email,
        password=data.password,
    )
    payload = auth_service.security.decode_access_token(access_token)
    token_data = {
        "sub": payload.get("sub"),
        "email": payload.get("email"),
        "tenant_ids": payload.get("tenant_ids"),
        "account_type": payload.get("account_type"),
    }
    sp_family = generate_family()
    sp_jti = generate_jti()
    refresh_token = auth_service.security.create_access_token(
        {**token_data, "type": "refresh", "jti": sp_jti, "family": sp_family},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    set_auth_cookies(
        response=response,
        request=request,
        access_token=access_token,
        refresh_token=refresh_token,
    )
    audit.password_set(request=request, user_id=str(user.id))

    return SuccessResponse(
        data=ActivateResponseData(
            tenant_slug=tenant.slug if tenant is not None else None,
            requires_password_change=False,
        ),
        message="Password set and account activated successfully",
    )


@router.post(
    "/resend-activation",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TenantSlugData],
    summary="Resend activation link",
    description="Resend activation link",
    response_description="Activation email sent",
)
async def resend_activation(
    activation_id: UUID,
    session: PostgresSession,
    auth_service: AuthServiceDep,
    email_service: EmailServiceDep,
) -> SuccessResponse[TenantSlugData]:
    new_link, tenant = await auth_service.resend_activation_link(
        session=session, activation_id=activation_id
    )
    activation_url = f"{settings.FRONTEND_URL}/activate?activation_id={new_link.id}"
    await email_service.send_activation_email(
        to_email=new_link.email,
        activation_link=activation_url,
        restaurant_name=tenant.name if tenant is not None else None,
    )
    return SuccessResponse(
        data=TenantSlugData(tenant_slug=tenant.slug if tenant is not None else None),
        message="Activation email sent",
    )


@router.post(
    "/refresh",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict[str, str]],
)
async def refresh_token(
    request: Request,
    response: Response,
    session: PostgresSession,
    security_service: SecurityServiceDep,
) -> SuccessResponse[dict[str, str]]:
    refresh_token_value = get_refresh_token_from_request(request)
    if refresh_token_value is None:
        raise UnauthorizedError(message="Unauthorized")

    payload = security_service.decode_access_token(refresh_token_value)
    if payload.get("type") != "refresh":
        raise UnauthorizedError(message="Unauthorized")

    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise UnauthorizedError(message="Unauthorized")

    old_jti = payload.get("jti", "")
    family = payload.get("family", "")

    if family and refresh_token_store.is_family_revoked(family):
        audit.token_reuse_detected(request=request, user_id=user_id, family=family)
        clear_auth_cookies(response=response, request=request)
        raise UnauthorizedError(message="Unauthorized")

    if family and old_jti and refresh_token_store.is_revoked(family, old_jti):
        audit.token_reuse_detected(request=request, user_id=user_id, family=family)
        refresh_token_store.revoke_family(family)
        clear_auth_cookies(response=response, request=request)
        raise UnauthorizedError(message="Unauthorized")

    if family and old_jti:
        refresh_token_store.revoke(family, old_jti)

    user_uuid = UUID(user_id)
    tenant_role_ids = list(
        await session.scalars(
            select(TenantRole.tenant_id).where(TenantRole.account_id == user_uuid)
        )
    )

    tenant_ids: list[str] = []
    if tenant_role_ids:
        rows = await session.execute(select(Tenant.public_id).where(Tenant.id.in_(tenant_role_ids)))
        tenant_ids = [row[0] for row in rows.all()]

    role = await session.scalar(
        select(TenantRole).where(TenantRole.account_id == user_uuid).limit(1)
    )

    email = payload.get("email")
    token_data: dict[str, str | list[str] | None] = {
        "sub": user_id,
        "tenant_ids": tenant_ids,
        "account_type": role.account_type.value if role is not None else None,
        "email": email if isinstance(email, str) else None,
    }
    access_token = security_service.create_access_token(token_data)
    new_jti = generate_jti()
    next_refresh_token = security_service.create_access_token(
        {**token_data, "type": "refresh", "jti": new_jti, "family": family or generate_family()},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )

    set_auth_cookies(
        response=response,
        request=request,
        access_token=access_token,
        refresh_token=next_refresh_token,
    )
    audit.token_refresh(request=request, user_id=user_id, family=family)

    return SuccessResponse(
        message="Token refreshed",
        data={"refreshed": "true"},
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict[str, str]],
)
async def logout(
    request: Request,
    response: Response,
    security_service: SecurityServiceDep,
) -> SuccessResponse[dict[str, str]]:
    refresh_token_value = get_refresh_token_from_request(request)
    if refresh_token_value is not None:
        try:
            payload = security_service.decode_access_token(refresh_token_value)
            family = payload.get("family", "")
            if family:
                refresh_token_store.revoke_family(family)
        except Exception:
            pass
    user = getattr(request.state, "user", None)
    user_id = user.get("sub") if isinstance(user, dict) else None
    audit.logout(request=request, user_id=user_id)
    clear_auth_cookies(response=response, request=request)
    return SuccessResponse(
        message="Logout successful",
        data={"logged_out": "true"},
    )


@router.get(
    "/me",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[AuthMeSessionData],
)
async def me(request: Request) -> SuccessResponse[AuthMeSessionData]:
    user = getattr(request.state, "user", None)
    if not isinstance(user, dict):
        raise UnauthenticatedResponse(message="Unauthorized")

    subject = user.get("sub")
    if not isinstance(subject, str):
        raise UnauthenticatedResponse(message="Unauthorized")

    account_type = user.get("account_type")

    return SuccessResponse(
        data=AuthMeSessionData(account_type=account_type),
        message="Authenticated",
    )
