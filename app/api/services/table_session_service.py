from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
import hashlib
import secrets
from uuid import UUID

from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import KITCHEN_ORDERS_COLLECTION
from core.exceptions import BadRequestError, ConflictError, NotFoundResponse
from core.models import AuditLog, FloorCanvas, TableSession, TableSessionOrigin, TableSessionStatus
from core.models.tenant import Tenant

_ACTIVE_LOCK_TTL = timedelta(minutes=10)
_ACTIVE_WAITER_STATUSES = {
    "new",
    "pending",
    "confirmed",
    "placed",
    "preparing",
    "ready",
    "ready_to_serve",
    "delivered",
}


@dataclass(slots=True)
class ResolvedTableIdentity:
    table_ref: str
    table_number: int | None
    table_label: str | None


class TableSessionService:
    async def resolve_table_identity(
        self,
        session: AsyncSession,
        tenant_id: UUID,
        *,
        table_number: int | None = None,
        table_ref: str | None = None,
    ) -> ResolvedTableIdentity:
        result = await session.execute(
            select(FloorCanvas.elements).where(FloorCanvas.tenant_id == tenant_id)
        )

        elements_sets = list(result.scalars().all())
        matched: ResolvedTableIdentity | None = None

        for elements in elements_sets:
            if not isinstance(elements, list):
                continue

            for raw_element in elements:
                if not isinstance(raw_element, dict):
                    continue

                element_type = raw_element.get("type")
                element_id = raw_element.get("id")
                if not isinstance(element_id, str) or element_id.strip() == "":
                    continue

                candidate_number = raw_element.get("tableNumber")
                if element_type == "table":
                    if table_ref and table_ref == element_id:
                        label = raw_element.get("label")
                        return ResolvedTableIdentity(
                            table_ref=element_id,
                            table_number=candidate_number
                            if isinstance(candidate_number, int)
                            else None,
                            table_label=label.strip()
                            if isinstance(label, str) and label.strip()
                            else None,
                        )
                    if table_number is not None and candidate_number == table_number:
                        label = raw_element.get("label")
                        next_identity = ResolvedTableIdentity(
                            table_ref=element_id,
                            table_number=table_number,
                            table_label=label.strip()
                            if isinstance(label, str) and label.strip()
                            else f"Table {table_number}",
                        )
                        if matched is not None:
                            msg = (
                                "This table number exists on more than one floor; use the QR code "
                                "for this table or choose the table from the list in the app."
                            )
                            raise BadRequestError(message=msg)
                        matched = next_identity

        if matched is not None:
            return matched

        if table_ref:
            return ResolvedTableIdentity(
                table_ref=table_ref, table_number=table_number, table_label=None
            )

        msg = "Table" + (" " + str(table_number) if table_number is not None else "")
        raise NotFoundResponse(msg)

    async def list_active_sessions(
        self,
        session: AsyncSession,
        tenant_id: UUID,
    ) -> list[TableSession]:
        await self._expire_stale_sessions(session, tenant_id=tenant_id)
        result = await session.execute(
            select(TableSession)
            .where(
                TableSession.tenant_id == tenant_id,
                TableSession.status == TableSessionStatus.ACTIVE,
            )
            .order_by(TableSession.acquired_at.asc())
        )
        return list(result.scalars().all())

    async def acquire_mobile_session(
        self,
        session: AsyncSession,
        db: AsyncIOMotorDatabase,
        *,
        tenant: Tenant,
        table_number: int,
        table_ref: str | None,
        lock_token: str | None,
        session_id: str | None,
        client_ip: str | None,
        client_fingerprint: str | None,
    ) -> TableSession:
        table_identity = await self.resolve_table_identity(
            session,
            tenant.id,
            table_number=table_number,
            table_ref=table_ref,
        )
        await self._expire_stale_sessions(
            session, tenant_id=tenant.id, table_ref=table_identity.table_ref
        )

        active_session = await self._get_active_session(
            session,
            tenant_id=tenant.id,
            table_ref=table_identity.table_ref,
        )

        if active_session is not None:
            if active_session.origin == TableSessionOrigin.WAITER:
                msg = "This table is currently being served by staff"
                raise ConflictError(msg)
            if lock_token and active_session.lock_token == lock_token:
                return await self._refresh_existing_session(
                    session,
                    active_session,
                    session_id=session_id,
                    client_ip=client_ip,
                    client_fingerprint=client_fingerprint,
                )
            msg = "This table is temporarily unavailable"
            raise ConflictError(msg)

        if await self._has_active_waiter_order(db, tenant.public_id, table_identity.table_ref):
            msg = "This table is currently being served by staff"
            raise ConflictError(msg)

        now = datetime.now(UTC)
        created = TableSession(
            tenant_id=tenant.id,
            tenant_public_id=tenant.public_id,
            tenant_slug=tenant.slug,
            table_ref=table_identity.table_ref,
            table_number=table_identity.table_number,
            table_label=table_identity.table_label,
            lock_token=await self._resolve_new_lock_token(session, lock_token),
            origin=TableSessionOrigin.MOBILE,
            status=TableSessionStatus.ACTIVE,
            session_id=session_id,
            client_fingerprint_hash=self._hash_value(client_fingerprint),
            ip_hash=self._hash_value(client_ip),
            acquired_at=now,
            last_seen_at=now,
            expires_at=now + _ACTIVE_LOCK_TTL,
        )
        session.add(created)
        await session.flush()
        return created

    async def refresh_mobile_session(
        self,
        session: AsyncSession,
        *,
        lock_token: str,
        client_ip: str | None,
        client_fingerprint: str | None,
    ) -> TableSession:
        table_session = await self._get_by_lock_token(session, lock_token)
        await self._expire_session_if_needed(session, table_session)

        if table_session.status != TableSessionStatus.ACTIVE:
            msg = "This table session is no longer active"
            raise ConflictError(msg)
        if table_session.origin != TableSessionOrigin.MOBILE:
            msg = "Only mobile table sessions can be refreshed"
            raise ConflictError(msg)

        return await self._refresh_existing_session(
            session,
            table_session,
            client_ip=client_ip,
            client_fingerprint=client_fingerprint,
        )

    async def release_mobile_session(
        self,
        session: AsyncSession,
        *,
        lock_token: str,
    ) -> TableSession:
        table_session = await self._get_by_lock_token(session, lock_token)
        await self._expire_session_if_needed(session, table_session)
        await self._set_terminal_status(session, table_session, TableSessionStatus.RELEASED)
        return table_session

    async def mark_completed_by_session_id(
        self,
        session: AsyncSession,
        *,
        session_id: str,
    ) -> None:
        result = await session.execute(
            select(TableSession).where(
                TableSession.session_id == session_id,
                TableSession.status == TableSessionStatus.ACTIVE,
            )
        )
        for table_session in result.scalars().all():
            await self._set_terminal_status(session, table_session, TableSessionStatus.COMPLETED)

    async def acquire_waiter_session(
        self,
        session: AsyncSession,
        *,
        tenant: Tenant,
        table_ref: str,
        table_label: str | None,
        waiter_user_id: UUID | None,
        table_number: int | None = None,
    ) -> TableSession:
        await self._expire_stale_sessions(session, tenant_id=tenant.id, table_ref=table_ref)
        active_session = await self._get_active_session(
            session, tenant_id=tenant.id, table_ref=table_ref
        )

        if active_session is not None:
            if active_session.origin == TableSessionOrigin.WAITER:
                active_session.last_seen_at = datetime.now(UTC)
                active_session.expires_at = datetime.now(UTC) + _ACTIVE_LOCK_TTL
                if waiter_user_id is not None:
                    active_session.waiter_user_id = waiter_user_id
                await session.flush()
                return active_session
            msg = "Table is currently locked by a mobile guest"
            raise ConflictError(msg)

        now = datetime.now(UTC)
        created = TableSession(
            tenant_id=tenant.id,
            tenant_public_id=tenant.public_id,
            tenant_slug=tenant.slug,
            table_ref=table_ref,
            table_number=table_number,
            table_label=table_label,
            lock_token=self._generate_lock_token(),
            origin=TableSessionOrigin.WAITER,
            status=TableSessionStatus.ACTIVE,
            waiter_user_id=waiter_user_id,
            acquired_at=now,
            last_seen_at=now,
            expires_at=now + _ACTIVE_LOCK_TTL,
        )
        session.add(created)
        await session.flush()
        return created

    async def release_waiter_table(
        self,
        session: AsyncSession,
        *,
        tenant_id: UUID,
        table_ref: str,
        actor_user_id: UUID | None,
        reason: str,
    ) -> TableSession | None:
        await self._expire_stale_sessions(session, tenant_id=tenant_id, table_ref=table_ref)
        table_session = await self._get_active_session(
            session, tenant_id=tenant_id, table_ref=table_ref
        )
        if table_session is None:
            return None

        await self._set_terminal_status(session, table_session, TableSessionStatus.RELEASED)
        session.add(
            AuditLog(
                tenant_id=tenant_id,
                actor_user_id=actor_user_id,
                action="table_session_released",
                entity_type="table_session",
                entity_id=table_session.id,
                audit_metadata={
                    "origin": table_session.origin.value,
                    "table_ref": table_session.table_ref,
                    "table_number": table_session.table_number,
                    "reason": reason,
                },
            )
        )
        await session.flush()
        return table_session

    async def release_by_table_ref(
        self,
        session: AsyncSession,
        *,
        tenant_id: UUID,
        table_ref: str | None,
        final_status: TableSessionStatus = TableSessionStatus.COMPLETED,
    ) -> None:
        if not table_ref:
            return

        await self._expire_stale_sessions(session, tenant_id=tenant_id, table_ref=table_ref)
        table_session = await self._get_active_session(
            session, tenant_id=tenant_id, table_ref=table_ref
        )
        if table_session is None:
            return
        await self._set_terminal_status(session, table_session, final_status)

    async def _get_active_session(
        self,
        session: AsyncSession,
        *,
        tenant_id: UUID,
        table_ref: str,
    ) -> TableSession | None:
        result = await session.execute(
            select(TableSession).where(
                TableSession.tenant_id == tenant_id,
                TableSession.table_ref == table_ref,
                TableSession.status == TableSessionStatus.ACTIVE,
            )
        )
        return result.scalar_one_or_none()

    async def _get_by_lock_token(self, session: AsyncSession, lock_token: str) -> TableSession:
        result = await session.execute(
            select(TableSession).where(TableSession.lock_token == lock_token)
        )
        table_session = result.scalar_one_or_none()
        if table_session is None:
            msg = "Table session not found"
            raise NotFoundResponse(msg, lock_token)
        return table_session

    async def _resolve_new_lock_token(
        self,
        session: AsyncSession,
        preferred: str | None,
    ) -> str:
        if preferred:
            result = await session.execute(
                select(TableSession.id).where(TableSession.lock_token == preferred)
            )
            if result.scalar_one_or_none() is None:
                return preferred
        return self._generate_lock_token()

    async def _expire_stale_sessions(
        self,
        session: AsyncSession,
        *,
        tenant_id: UUID,
        table_ref: str | None = None,
    ) -> None:
        result = await session.execute(
            select(TableSession).where(
                TableSession.tenant_id == tenant_id,
                TableSession.status == TableSessionStatus.ACTIVE,
                *([TableSession.table_ref == table_ref] if table_ref else []),
            )
        )
        for table_session in result.scalars().all():
            await self._expire_session_if_needed(session, table_session)

    async def _expire_session_if_needed(
        self,
        session: AsyncSession,
        table_session: TableSession,
    ) -> None:
        if (
            table_session.status == TableSessionStatus.ACTIVE
            and table_session.expires_at <= datetime.now(UTC)
        ):
            await self._set_terminal_status(session, table_session, TableSessionStatus.EXPIRED)

    async def _refresh_existing_session(
        self,
        session: AsyncSession,
        table_session: TableSession,
        *,
        session_id: str | None = None,
        client_ip: str | None = None,
        client_fingerprint: str | None = None,
    ) -> TableSession:
        now = datetime.now(UTC)
        table_session.last_seen_at = now
        table_session.expires_at = now + _ACTIVE_LOCK_TTL
        if session_id:
            table_session.session_id = session_id
        if client_ip:
            table_session.ip_hash = self._hash_value(client_ip)
        if client_fingerprint:
            table_session.client_fingerprint_hash = self._hash_value(client_fingerprint)
        await session.flush()
        return table_session

    async def _set_terminal_status(
        self,
        session: AsyncSession,
        table_session: TableSession,
        status: TableSessionStatus,
    ) -> None:
        table_session.status = status
        table_session.released_at = datetime.now(UTC)
        table_session.last_seen_at = datetime.now(UTC)
        await session.flush()

    async def list_table_refs_with_active_kitchen_orders(
        self,
        db: AsyncIOMotorDatabase,
        *,
        tenant_public_id: str,
    ) -> set[str]:
        cursor = db[KITCHEN_ORDERS_COLLECTION].find(
            {
                "restaurantId": tenant_public_id,
                "status": {"$in": list(_ACTIVE_WAITER_STATUSES)},
            },
            {"tableId": 1},
        )
        refs: set[str] = set()
        async for doc in cursor:
            tid = doc.get("tableId")
            if isinstance(tid, str) and tid.strip() != "":
                refs.add(tid)
        return refs

    async def _has_active_waiter_order(
        self,
        db: AsyncIOMotorDatabase,
        tenant_public_id: str,
        table_ref: str,
    ) -> bool:
        doc = await db[KITCHEN_ORDERS_COLLECTION].find_one(
            {
                "restaurantId": tenant_public_id,
                "tableId": table_ref,
                "status": {"$in": list(_ACTIVE_WAITER_STATUSES)},
            },
            {"_id": 1},
        )
        return doc is not None

    def _generate_lock_token(self) -> str:
        return secrets.token_urlsafe(32)

    def _hash_value(self, value: str | None) -> str | None:
        if not value:
            return None
        return hashlib.sha256(value.encode("utf-8")).hexdigest()


table_session_service = TableSessionService()
