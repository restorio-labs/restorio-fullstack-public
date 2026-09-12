from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID, uuid4

from fastapi import APIRouter, Request, Response, status
from sqlalchemy import select

from core.constants import ORDERS_COLLECTION
from core.dto.v1.menus import TenantMenuResponseDTO
from core.dto.v1.public import (
    PublicAcquireTableSessionDTO,
    PublicCreateOrderPaymentDTO,
    PublicCreateOrderPaymentResponseDTO,
    PublicFloorCanvasOverviewDTO,
    PublicFloorTableStatusDTO,
    PublicP24TransactionSyncResponseDTO,
    PublicRefreshTableSessionDTO,
    PublicReleaseTableSessionDTO,
    PublicTableSessionResponseDTO,
    PublicTablesOverviewResponseDTO,
    PublicTenantInfoResponseDTO,
)
from core.dto.v1.tenants.mobile_config import MobileLandingContentDTO
from core.exceptions import BadRequestError, NotFoundResponse
from core.foundation.client_ip import get_client_ip
from core.foundation.dependencies import (
    ExternalClientDep,
    MongoDB,
    P24ServiceDep,
    PostgresSession,
    TableSessionServiceDep,
    TenantMobileFaviconStorageServiceDep,
    TenantServiceDep,
)
from core.foundation.http.responses import CreatedResponse, SuccessResponse
from core.foundation.infra.config import settings
from core.models import FloorCanvas
from core.models.transaction import Transaction
from services.mongo_menu_service import MENU_COLLECTION, normalize_mongo_menu_categories
from services.mobile_payment_sync import apply_mobile_payment_mongo_and_session_effects
from services.payment_service import MONGO_PAYMENT_STATUS_PENDING, resolve_mobile_payment_return_base_url
from services.tenant_mobile_config_service import tenant_mobile_config_service

router = APIRouter()

_KITCHEN_RESERVE_FALLBACK = timedelta(seconds=90)

MONGO_ORDER_STATUS_NEW = "new"
MONGO_ORDER_STATUS_PREPARING = "preparing"
MONGO_ORDER_STATUS_READY = "ready_to_serve"

_RESOURCE_TRANSACTION = "Transaction"


def _coerce_float(value: object) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    return 0.0


def _coerce_optional_int(value: object) -> int | None:
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.strip().isdigit():
        return int(value.strip())
    return None


def _extract_client_fingerprint(request: Request) -> str | None:
    fingerprint = request.headers.get("X-Device-Fingerprint") or request.headers.get("User-Agent")
    if not fingerprint:
        return None
    return fingerprint.strip() or None


def _public_table_session_response(
    *,
    lock_token: str,
    expires_at: datetime,
    owner_type: str,
    table_ref: str,
    table_number: int | None,
    table_status: str = "locked",
    message: str | None = None,
) -> PublicTableSessionResponseDTO:
    return PublicTableSessionResponseDTO(
        lockToken=lock_token,
        expiresAt=expires_at.isoformat(),
        tableStatus=table_status,
        ownerType=owner_type,
        tableRef=table_ref,
        tableNumber=table_number,
        message=message,
    )


@router.get(
    "/{tenant_slug}/info",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[PublicTenantInfoResponseDTO],
)
async def get_public_tenant_info(
    tenant_slug: str,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
) -> SuccessResponse[PublicTenantInfoResponseDTO]:
    tenant = await tenant_service.get_tenant_by_slug(session, tenant_slug)
    mc = await tenant_mobile_config_service.get_by_tenant_id(session, tenant.id)
    favicon_path = f"/public/{tenant.slug}/favicon.ico" if mc and mc.favicon_object_key else None
    landing: MobileLandingContentDTO | None = None
    if mc and mc.landing_content and isinstance(mc.landing_content, dict):
        landing = MobileLandingContentDTO.model_validate(mc.landing_content)

    return SuccessResponse(
        message="Restaurant info retrieved",
        data=PublicTenantInfoResponseDTO(
            name=tenant.name,
            slug=tenant.slug,
            pageTitle=mc.page_title if mc else None,
            faviconPath=favicon_path,
            themeOverride=mc.theme_override if mc else None,
            landingContent=landing,
        ),
    )


@router.get(
    "/{tenant_slug}/favicon.ico",
    status_code=status.HTTP_200_OK,
    response_class=Response,
)
async def get_public_tenant_favicon(
    tenant_slug: str,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    storage: TenantMobileFaviconStorageServiceDep,
) -> Response:
    tenant = await tenant_service.get_tenant_by_slug(session, tenant_slug)
    mc = await tenant_mobile_config_service.get_by_tenant_id(session, tenant.id)

    if not mc or not mc.favicon_object_key:
        msg = "Favicon"
        raise NotFoundResponse(msg, tenant_slug)

    stream = storage.get_object_stream(mc.favicon_object_key)
    try:
        data = stream.read()
    finally:
        stream.close()
        stream.release_conn()

    return Response(
        content=data,
        media_type="image/x-icon",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.get(
    "/{tenant_slug}/menu",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TenantMenuResponseDTO],
)
async def get_public_tenant_menu(
    tenant_slug: str,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    db: MongoDB,
) -> SuccessResponse[TenantMenuResponseDTO]:
    tenant = await tenant_service.get_tenant_by_slug(session, tenant_slug)

    document = await db[MENU_COLLECTION].find_one({"tenantPublicId": tenant.public_id})
    if document is None:
        return SuccessResponse(
            message="Menu not yet created",
            data=TenantMenuResponseDTO(menu={}, categories=[], updatedAt=None),
        )

    raw_menu = document.get("menu", {})
    normalized_menu = raw_menu if isinstance(raw_menu, dict) else {}
    categories = normalize_mongo_menu_categories(normalized_menu, active_items_only=True)

    return SuccessResponse(
        message="Menu retrieved",
        data=TenantMenuResponseDTO(
            menu=normalized_menu,
            categories=categories,
            updatedAt=document.get("updatedAt"),
        ),
    )


@router.get(
    "/{tenant_slug}/tables-overview",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[PublicTablesOverviewResponseDTO],
)
async def get_public_tables_overview(
    tenant_slug: str,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    table_session_service: TableSessionServiceDep,
    db: MongoDB,
) -> SuccessResponse[PublicTablesOverviewResponseDTO]:
    tenant = await tenant_service.get_tenant_by_slug(session, tenant_slug)
    active_sessions = await table_session_service.list_active_sessions(session, tenant.id)
    busy_kitchen_refs = await table_session_service.list_table_refs_with_active_kitchen_orders(
        db,
        tenant_public_id=tenant.public_id,
    )
    locked_refs = {s.table_ref for s in active_sessions} | busy_kitchen_refs

    session_expires_by_ref: dict[str, datetime] = {}
    for s in active_sessions:
        prev = session_expires_by_ref.get(s.table_ref)
        if prev is None or s.expires_at > prev:
            session_expires_by_ref[s.table_ref] = s.expires_at

    canvas_result = await session.execute(
        select(FloorCanvas).where(FloorCanvas.tenant_id == tenant.id)
    )
    canvases = list(canvas_result.scalars().all())

    overview_canvases: list[PublicFloorCanvasOverviewDTO] = []
    for fc in canvases:
        tables: list[PublicFloorTableStatusDTO] = []
        raw_elements = fc.elements if isinstance(fc.elements, list) else []
        for raw in raw_elements:
            if not isinstance(raw, dict):
                continue
            if raw.get("type") != "table":
                continue
            tid = raw.get("id")
            if not isinstance(tid, str) or tid.strip() == "":
                continue
            tn = _coerce_optional_int(raw.get("tableNumber"))
            label_raw = raw.get("label")
            label = label_raw.strip() if isinstance(label_raw, str) and label_raw.strip() else None
            seats_raw = raw.get("seats")
            seats = seats_raw if isinstance(seats_raw, int) else None
            rotation = _coerce_float(raw["rotation"]) if "rotation" in raw else None

            is_closed = tid in locked_refs
            reserved_until: datetime | None = None
            if is_closed:
                reserved_until = session_expires_by_ref.get(tid)
                if reserved_until is None:
                    reserved_until = datetime.now(UTC) + _KITCHEN_RESERVE_FALLBACK

            tables.append(
                PublicFloorTableStatusDTO(
                    id=tid,
                    tableNumber=tn,
                    label=label,
                    x=_coerce_float(raw.get("x")),
                    y=_coerce_float(raw.get("y")),
                    w=_coerce_float(raw.get("w")) or 1.0,
                    h=_coerce_float(raw.get("h")) or 1.0,
                    rotation=rotation,
                    seats=seats,
                    status="closed" if is_closed else "open",
                    reserved_until=reserved_until,
                )
            )

        overview_canvases.append(
            PublicFloorCanvasOverviewDTO(
                name=fc.name,
                width=fc.width,
                height=fc.height,
                tables=tables,
            )
        )

    return SuccessResponse(
        message="Tables overview retrieved",
        data=PublicTablesOverviewResponseDTO(canvases=overview_canvases),
    )


@router.post(
    "/table-sessions/acquire",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[PublicTableSessionResponseDTO],
)
async def acquire_public_table_session(
    payload: PublicAcquireTableSessionDTO,
    request: Request,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    table_session_service: TableSessionServiceDep,
    db: MongoDB,
) -> CreatedResponse[PublicTableSessionResponseDTO]:
    tenant = await tenant_service.get_tenant_by_slug(session, payload.tenant_slug)
    table_session = await table_session_service.acquire_mobile_session(
        session,
        db,
        tenant=tenant,
        table_number=payload.table_number,
        table_ref=payload.table_ref,
        lock_token=payload.lock_token,
        session_id=None,
        client_ip=get_client_ip(request),
        client_fingerprint=_extract_client_fingerprint(request),
    )
    return CreatedResponse(
        message="Table session acquired",
        data=_public_table_session_response(
            lock_token=table_session.lock_token,
            expires_at=table_session.expires_at,
            owner_type=table_session.origin.value,
            table_ref=table_session.table_ref,
            table_number=table_session.table_number,
        ),
    )


@router.post(
    "/table-sessions/refresh",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[PublicTableSessionResponseDTO],
)
async def refresh_public_table_session(
    payload: PublicRefreshTableSessionDTO,
    request: Request,
    session: PostgresSession,
    table_session_service: TableSessionServiceDep,
) -> SuccessResponse[PublicTableSessionResponseDTO]:
    table_session = await table_session_service.refresh_mobile_session(
        session,
        lock_token=payload.lock_token,
        client_ip=get_client_ip(request),
        client_fingerprint=_extract_client_fingerprint(request),
    )
    return SuccessResponse(
        message="Table session refreshed",
        data=_public_table_session_response(
            lock_token=table_session.lock_token,
            expires_at=table_session.expires_at,
            owner_type=table_session.origin.value,
            table_ref=table_session.table_ref,
            table_number=table_session.table_number,
        ),
    )


@router.post(
    "/table-sessions/release",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[PublicTableSessionResponseDTO],
)
async def release_public_table_session(
    payload: PublicReleaseTableSessionDTO,
    session: PostgresSession,
    table_session_service: TableSessionServiceDep,
) -> SuccessResponse[PublicTableSessionResponseDTO]:
    table_session = await table_session_service.release_mobile_session(
        session,
        lock_token=payload.lock_token,
    )
    return SuccessResponse(
        message="Table session released",
        data=_public_table_session_response(
            lock_token=table_session.lock_token,
            expires_at=table_session.expires_at,
            owner_type=table_session.origin.value,
            table_ref=table_session.table_ref,
            table_number=table_session.table_number,
            table_status="released",
            message="released",
        ),
    )


@router.post(
    "/payments/create",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[PublicCreateOrderPaymentResponseDTO],
)
async def create_public_order_payment(
    request: PublicCreateOrderPaymentDTO,
    http_request: Request,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    p24_service: P24ServiceDep,
    external_client: ExternalClientDep,
    table_session_service: TableSessionServiceDep,
    db: MongoDB,
) -> CreatedResponse[PublicCreateOrderPaymentResponseDTO]:
    tenant = await tenant_service.get_tenant_by_slug(session, request.tenant_slug)
    p24_service.validate_tenant_p24_credentials(tenant)

    total_amount = sum(round(item.unit_price * item.quantity * 100) for item in request.items)
    if total_amount <= 0:
        raise BadRequestError(message="Order total must be greater than zero")

    checkout_session_id = str(uuid4())
    table_session = await table_session_service.acquire_mobile_session(
        session,
        db,
        tenant=tenant,
        table_number=request.table_number,
        table_ref=request.table_ref,
        lock_token=request.lock_token,
        session_id=checkout_session_id,
        client_ip=get_client_ip(http_request),
        client_fingerprint=_extract_client_fingerprint(http_request),
    )

    invoice_dict: dict[str, Any] | None = None
    if request.invoice_data:
        invoice_dict = {
            "companyName": request.invoice_data.company_name,
            "nip": request.invoice_data.nip,
            "street": request.invoice_data.street,
            "city": request.invoice_data.city,
            "postalCode": request.invoice_data.postal_code,
            "country": request.invoice_data.country,
        }

    order_dict: dict[str, Any] = {
        "tableNumber": request.table_number,
        "tableRef": table_session.table_ref,
        "source": "mobile",
        "items": [
            {
                "name": item.name,
                "quantity": item.quantity,
                "unitPrice": item.unit_price,
            }
            for item in request.items
        ],
        "note": request.note,
        "invoiceData": invoice_dict,
    }

    description = f"Zamówienie - stolik {request.table_number} - {tenant.name}"
    return_url = f"{resolve_mobile_payment_return_base_url(http_request)}/payment/return"

    result = await p24_service.register_transaction(
        external_client,
        merchant_id=tenant.p24_merchantid,
        api_key=tenant.p24_api,
        crc=tenant.p24_crc,
        amount=total_amount,
        email=request.email,
        description=description,
        url_return=return_url,
        session_id=checkout_session_id,
    )

    transaction = Transaction(
        session_id=result.session_id,
        tenant_id=tenant.id,
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
        order=order_dict,
        note=request.note,
    )
    session.add(transaction)
    await session.flush()

    p24_response = result.p24_response
    token = p24_response.get("data", {}).get("token", "")
    if not token:
        raise BadRequestError(message="Payment registration failed - no token received")

    now = datetime.now(UTC)
    mongo_order: dict[str, Any] = {
        "tenantPublicId": tenant.public_id,
        "tenantSlug": tenant.slug,
        "tableNumber": request.table_number,
        "tableRef": table_session.table_ref,
        "items": order_dict["items"],
        "totalAmount": total_amount,
        "currency": "PLN",
        "email": request.email,
        "status": MONGO_ORDER_STATUS_NEW,
        "paymentStatus": MONGO_PAYMENT_STATUS_PENDING,
        "sessionId": str(result.session_id),
        "note": request.note,
        "createdAt": now,
    }
    if invoice_dict:
        mongo_order["invoiceData"] = invoice_dict
    await db[ORDERS_COLLECTION].insert_one(mongo_order)

    base_url = settings.PRZELEWY24_API_URL.replace("/api/v1", "")
    redirect_url = f"{base_url}/trnRequest/{token}"

    return CreatedResponse(
        message="Payment created successfully",
        data=PublicCreateOrderPaymentResponseDTO(
            token=token,
            redirectUrl=redirect_url,
            lockToken=table_session.lock_token,
            expiresAt=table_session.expires_at.isoformat(),
            tableStatus="locked",
            ownerType=table_session.origin.value,
        ),
    )


@router.post(
    "/payments/sessions/{session_id}/p24-sync",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[PublicP24TransactionSyncResponseDTO],
)
async def sync_public_transaction_from_p24(
    session_id: UUID,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    p24_service: P24ServiceDep,
    external_client: ExternalClientDep,
    table_session_service: TableSessionServiceDep,
    db: MongoDB,
) -> SuccessResponse[PublicP24TransactionSyncResponseDTO]:
    result = await session.execute(select(Transaction).where(Transaction.session_id == session_id))
    transaction = result.scalar_one_or_none()
    if transaction is None:
        raise NotFoundResponse(_RESOURCE_TRANSACTION, str(session_id))

    tenant = await tenant_service.get_tenant(session, transaction.tenant_id)
    data, p24_response_code = await p24_service.apply_p24_lookup_to_transaction(
        external_client,
        transaction=transaction,
        tenant=tenant,
    )

    await apply_mobile_payment_mongo_and_session_effects(
        db,
        session,
        table_session_service,
        tenant=tenant,
        transaction=transaction,
        session_id_str=str(session_id),
    )
    await session.flush()

    p24_status_raw = data.get("status")
    if not isinstance(p24_status_raw, int):
        raise BadRequestError(message="Invalid Przelewy24 transaction status")

    return SuccessResponse(
        message="Transaction synced from Przelewy24",
        data=PublicP24TransactionSyncResponseDTO(
            sessionId=str(transaction.session_id),
            status=transaction.status,
            p24OrderId=transaction.p24_order_id,
            amount=transaction.amount,
            currency=transaction.currency,
            p24Status=p24_status_raw,
            responseCode=p24_response_code,
            statement=data.get("statement") if isinstance(data.get("statement"), str) else None,
            date=data.get("date") if isinstance(data.get("date"), str) else None,
            dateOfTransaction=data.get("dateOfTransaction")
            if isinstance(data.get("dateOfTransaction"), str)
            else None,
        ),
    )
