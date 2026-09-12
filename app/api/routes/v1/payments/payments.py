from typing import Any

from fastapi import APIRouter, status

from core.dto.v1.payments import (
    CreateTransactionDTO,
)
from core.foundation.dependencies import (
    AuthorizedTenantId,
    ExternalClientDep,
    P24ServiceDep,
    PostgresSession,
    TenantServiceDep,
)
from core.foundation.http.responses import CreatedResponse
from core.models.transaction import Transaction

router = APIRouter()


@router.post(
    "/{tenant_public_id}/create",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[dict[str, Any]],
)
async def create_payment(
    tenant_public_id: str,  # noqa: ARG001
    request: CreateTransactionDTO,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    p24_service: P24ServiceDep,
    external_client: ExternalClientDep,
    authorized_tenant_id: AuthorizedTenantId,
) -> CreatedResponse[dict[str, Any]]:
    tenant = await tenant_service.get_tenant(session, authorized_tenant_id)
    p24_service.validate_tenant_p24_credentials(tenant)

    result = await p24_service.register_transaction(
        external_client,
        merchant_id=tenant.p24_merchantid,
        api_key=tenant.p24_api,
        crc=tenant.p24_crc,
        amount=request.amount,
        email=request.email,
        description=request.note or "",
    )

    transaction = Transaction(
        session_id=result.session_id,
        tenant_id=authorized_tenant_id,
        merchant_id=result.merchant_id,
        pos_id=result.pos_id,
        amount=result.amount,
        currency=result.currency,
        description=result.description,
        email=result.email,
        country=result.country,
        language=result.language,
        url_return=result.url_return,
        url_status=result.url_status,
        sign=result.sign,
        wait_for_result=result.wait_for_result,
        regulation_accept=result.regulation_accept,
        status=0,
        order=request.order,
        note=request.note,
    )
    session.add(transaction)
    await session.flush()

    return CreatedResponse[dict[str, Any]](
        message="Payment transaction created successfully",
        data=result.p24_response,
    )
