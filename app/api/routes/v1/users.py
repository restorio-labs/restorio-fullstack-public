from uuid import UUID

from fastapi import APIRouter, Request, status
from sqlalchemy import func, select

from core.dto.v1.auth import (
    BulkCreateUsersDTO,
    CreateUserDTO,
    StaffInviteNotification,
    StaffUserCreatedData,
)
from core.exceptions import ConflictError, NotFoundResponse
from core.foundation.dependencies import (
    AuthorizedTenantId,
    AuthServiceDep,
    EmailServiceDep,
    PostgresSession,
    UserServiceDep,
)
from core.foundation.http.responses import CreatedResponse, SuccessResponse, UnauthenticatedResponse
from core.foundation.infra.config import settings
from core.foundation.role_guard import RequireOwner
from core.models.enums import AccountType
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole
from core.models.user import User

router = APIRouter()


def _staff_invite_notification(
    send_activation_email: bool,
    account_type: AccountType,
) -> StaffInviteNotification:
    if send_activation_email:
        return StaffInviteNotification.ACTIVATION
    if account_type == AccountType.WAITER:
        return StaffInviteNotification.EXISTING_WAITER_NOTICE
    return StaffInviteNotification.EXISTING_ACCOUNT_LINKED


@router.post(
    "/{tenant_public_id}/bulk",
    status_code=status.HTTP_200_OK,
    summary="Create multiple staff users",
    description=(
        "Create staff users. New accounts receive an activation email; existing waiters linked to the "
        "tenant receive a Polish notification about the new restaurant assignment. Returns partial results."
    ),
)
async def bulk_create_users(
    _role: RequireOwner,
    data: BulkCreateUsersDTO,
    request: Request,
    tenant_id: AuthorizedTenantId,
    session: PostgresSession,
    auth_service: AuthServiceDep,
    user_service: UserServiceDep,
    email_service: EmailServiceDep,
) -> dict:
    tenant = await session.get(Tenant, tenant_id)
    if tenant is None:
        raise UnauthenticatedResponse(message="Unauthorized")

    requester = getattr(request.state, "user", None)
    requester_email = requester.get("email", "").lower() if isinstance(requester, dict) else ""

    seen: set[str] = set()
    results: list[dict[str, str | dict | None]] = []

    for entry in data.users:
        email_lower = entry.email.lower()

        if email_lower == requester_email:
            results.append(
                {
                    "email": entry.email,
                    "status": "failed",
                    "error": "Cannot add yourself as a staff member",
                }
            )
            continue

        if email_lower in seen:
            results.append(
                {
                    "email": entry.email,
                    "status": "failed",
                    "error": "Duplicate email in request",
                }
            )
            continue

        seen.add(email_lower)

    rejected_emails = {str(r["email"]).lower() for r in results}

    for entry in data.users:
        if entry.email.lower() in rejected_emails:
            continue

        try:
            temp_password = user_service.generate_temporary_password()
            created_user, _, send_activation_email = await user_service.create_user_for_tenant(
                session=session,
                email=entry.email,
                password=temp_password,
                tenant_id=tenant_id,
                account_type=entry.access_level,
                name=entry.name,
                surname=entry.surname,
                force_password_change=True,
            )

            if send_activation_email:
                activation = await auth_service.create_activation_link(
                    session=session,
                    email=created_user.email,
                    user_id=created_user.id,
                    tenant_id=tenant.id,
                )
                activation_link = f"{settings.FRONTEND_URL}/activate?activation_id={activation.id}"
                await email_service.send_activation_email(
                    to_email=created_user.email,
                    restaurant_name=tenant.name,
                    activation_link=activation_link,
                )
            elif entry.access_level == AccountType.WAITER:
                await email_service.send_waiter_added_existing_account_email(
                    to_email=created_user.email,
                    restaurant_name=tenant.name,
                    waiter_panel_url=settings.WAITER_PANEL_URL,
                )

            invite_note = _staff_invite_notification(send_activation_email, entry.access_level)

            results.append(
                {
                    "email": entry.email,
                    "status": "created",
                    "notification": invite_note.value,
                    "data": {
                        "user_id": str(created_user.id),
                        "tenant_id": tenant.public_id,
                        "tenant_name": tenant.name,
                        "tenant_slug": tenant.slug,
                    },
                }
            )
        except ConflictError as exc:
            results.append(
                {
                    "email": entry.email,
                    "status": "failed",
                    "error": str(exc),
                }
            )
        except Exception as exc:
            results.append(
                {
                    "email": entry.email,
                    "status": "failed",
                    "error": str(exc) if str(exc) else "Unexpected error",
                }
            )

    created_count = sum(1 for r in results if r["status"] == "created")
    total = len(results)

    return {
        "message": f"{created_count}/{total} users created successfully",
        "results": results,
    }


@router.post(
    "/{tenant_public_id}",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[StaffUserCreatedData],
    summary="Create an inactive staff user",
    description=(
        "Creates a staff membership. New users get an activation email; existing waiters get a notification "
        "that they can select the restaurant after logging into the waiter panel."
    ),
)
async def create_user(
    _role: RequireOwner,
    data: CreateUserDTO,
    request: Request,
    tenant_id: AuthorizedTenantId,
    session: PostgresSession,
    auth_service: AuthServiceDep,
    user_service: UserServiceDep,
    email_service: EmailServiceDep,
) -> CreatedResponse[StaffUserCreatedData]:
    tenant = await session.get(Tenant, tenant_id)
    if tenant is None:
        raise UnauthenticatedResponse(message="Unauthorized")

    requester = getattr(request.state, "user", None)
    if isinstance(requester, dict):
        requester_email = requester.get("email", "").lower()
        if data.email.lower() == requester_email:
            msg = "Cannot add yourself as a staff member"
            raise ConflictError(msg)

    temp_password = user_service.generate_temporary_password()
    created_user, _, send_activation_email = await user_service.create_user_for_tenant(
        session=session,
        email=data.email,
        password=temp_password,
        tenant_id=tenant_id,
        account_type=data.access_level,
        name=data.name,
        surname=data.surname,
        force_password_change=True,
    )

    if send_activation_email:
        activation = await auth_service.create_activation_link(
            session=session,
            email=created_user.email,
            user_id=created_user.id,
            tenant_id=tenant.id,
        )
        activation_link = f"{settings.FRONTEND_URL}/activate?activation_id={activation.id}"
        await email_service.send_activation_email(
            to_email=created_user.email,
            restaurant_name=tenant.name,
            activation_link=activation_link,
        )
    elif data.access_level == AccountType.WAITER:
        await email_service.send_waiter_added_existing_account_email(
            to_email=created_user.email,
            restaurant_name=tenant.name,
            waiter_panel_url=settings.WAITER_PANEL_URL,
        )

    notification = _staff_invite_notification(send_activation_email, data.access_level)

    return CreatedResponse(
        data=StaffUserCreatedData(
            user_id=str(created_user.id),
            email=created_user.email,
            tenant_id=tenant.public_id,
            tenant_name=tenant.name,
            tenant_slug=tenant.slug,
            notification=notification,
        ),
        message=(
            "User created successfully, activation email sent"
            if send_activation_email
            else (
                "User added to tenant, waiter notification email sent"
                if notification == StaffInviteNotification.EXISTING_WAITER_NOTICE
                else "User added to tenant"
            )
        ),
    )


@router.get(
    "/{tenant_public_id}",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[list[dict[str, str | bool | None]]],
    summary="List tenant staff users",
    description="List waiter and kitchen users for current tenant",
)
async def list_tenant_users(
    tenant_id: AuthorizedTenantId,
    session: PostgresSession,
) -> SuccessResponse[list[dict[str, str | bool | None]]]:
    stmt = (
        select(
            User.id, User.email, User.name, User.surname, User.is_active, TenantRole.account_type
        )
        .join(TenantRole, TenantRole.account_id == User.id)
        .where(
            TenantRole.tenant_id == tenant_id,
            TenantRole.account_type.in_([AccountType.WAITER, AccountType.KITCHEN]),
        )
    )
    rows = await session.execute(stmt)

    users = [
        {
            "id": str(user_id),
            "email": email,
            "name": name,
            "surname": surname,
            "is_active": is_active,
            "account_type": account_type.value,
        }
        for user_id, email, name, surname, is_active, account_type in rows.all()
    ]

    if len(users) == 0:
        return SuccessResponse(
            message="No users found for this tenant",
            data=[],
        )

    return SuccessResponse(
        message="Users retrieved successfully",
        data=users,
    )


@router.delete(
    "/{tenant_public_id}/{user_id}",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict[str, str]],
    summary="Delete staff user",
    description="Remove a staff user from the current tenant",
)
async def delete_user(
    _role: RequireOwner,
    tenant_id: AuthorizedTenantId,
    user_id: UUID,
    session: PostgresSession,
) -> SuccessResponse[dict[str, str]]:
    resource_name = "User"

    stmt = select(TenantRole).where(
        TenantRole.account_id == user_id,
        TenantRole.tenant_id == tenant_id,
        TenantRole.account_type.in_([AccountType.WAITER, AccountType.KITCHEN]),
    )
    role = await session.scalar(stmt)
    if role is None:
        raise NotFoundResponse(resource_name, str(user_id))

    await session.delete(role)
    await session.flush()

    remaining_roles = await session.scalar(
        select(func.count()).select_from(TenantRole).where(TenantRole.account_id == user_id)
    )
    if (remaining_roles or 0) == 0:
        orphan = await session.get(User, user_id)
        if orphan is not None:
            await session.delete(orphan)
            await session.flush()

    return SuccessResponse(
        message="User deleted successfully",
        data={"deleted_user_id": str(user_id)},
    )
