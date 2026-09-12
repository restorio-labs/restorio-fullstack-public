from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import select

from core.dto.v1.payments import (
    TransactionListItemDTO,
    TransactionListQueryDTO,
    TransactionsReconcileResponseDTO,
)
from core.foundation.dependencies import (
    AuthorizedTenantId,
    ExternalClientDep,
    MongoDB,
    P24ServiceDep,
    PostgresSession,
    TableSessionServiceDep,
    TenantServiceDep,
)
from core.foundation.http.responses import PaginatedResponse, SuccessResponse
from core.models.transaction import Transaction
from services.mobile_payment_sync import apply_mobile_payment_mongo_and_session_effects

router = APIRouter()


@router.get(
    "/transactions",
    status_code=status.HTTP_200_OK,
    response_model=PaginatedResponse[TransactionListItemDTO],
)
async def list_transactions(
    tenant_id: AuthorizedTenantId,
    session: PostgresSession,
    p24_service: P24ServiceDep,
    query: Annotated[TransactionListQueryDTO, Depends()],
) -> PaginatedResponse[TransactionListItemDTO]:
    transactions, total = await p24_service.get_transactions_page(
        session,
        tenant_id,
        date_from=query.date_from,
        date_to=query.date_to,
        page=query.page,
        pagination=query.pagination,
    )

    items = [TransactionListItemDTO.model_validate(t) for t in transactions]

    return PaginatedResponse.create(
        items=items,
        total=total,
        page=query.page,
        page_size=query.pagination,
    )


@router.post(
    "/transactions/reconcile-pending",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TransactionsReconcileResponseDTO],
)
async def reconcile_pending_transactions(
    tenant_id: AuthorizedTenantId,
    session: PostgresSession,
    db: MongoDB,
    p24_service: P24ServiceDep,
    tenant_service: TenantServiceDep,
    external_client: ExternalClientDep,
    table_session_service: TableSessionServiceDep,
) -> SuccessResponse[TransactionsReconcileResponseDTO]:
    pending = await p24_service.get_transactions_pending_reconcile(session, tenant_id)
    scanned = len(pending)
    updated = 0
    failed = 0

    for snapshot in pending:
        try:
            sid = snapshot.session_id
            row = await session.execute(select(Transaction).where(Transaction.session_id == sid))
            transaction = row.scalar_one_or_none()
            if transaction is None:
                failed += 1
                continue

            tenant = await tenant_service.get_tenant(session, transaction.tenant_id)
            await p24_service.apply_p24_lookup_to_transaction(
                external_client,
                transaction=transaction,
                tenant=tenant,
            )
            await session.flush()
            await apply_mobile_payment_mongo_and_session_effects(
                db,
                session,
                table_session_service,
                tenant=tenant,
                transaction=transaction,
                session_id_str=str(sid),
            )
            await session.commit()
            updated += 1
        except Exception:
            await session.rollback()
            failed += 1

    return SuccessResponse(
        message="Reconcile completed",
        data=TransactionsReconcileResponseDTO(scanned=scanned, updated=updated, failed=failed),
    )
