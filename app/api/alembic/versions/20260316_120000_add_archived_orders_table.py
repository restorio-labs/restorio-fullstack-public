"""add_archived_orders_table

Revision ID: f3b4c5d6e7f8
Revises: 9ea8f08a9e1f
Create Date: 2026-03-16 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID


revision: str = "f3b4c5d6e7f8"
down_revision: Union[str, None] = "9ea8f08a9e1f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "archived_orders",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("original_order_id", sa.String(64), nullable=False),
        sa.Column("tenant_id", sa.String(64), nullable=False),
        sa.Column("restaurant_id", sa.String(64), nullable=False),
        sa.Column("table_id", sa.String(64), nullable=True),
        sa.Column("table_label", sa.String(128), nullable=False, server_default=""),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("payment_status", sa.String(32), nullable=False, server_default="completed"),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("tax", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("total", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(3), nullable=False, server_default="PLN"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("items_snapshot", JSONB, nullable=False, server_default="[]"),
        sa.Column("order_created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "archived_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
    )
    op.create_index(
        "idx_archived_orders_tenant_restaurant", "archived_orders", ["tenant_id", "restaurant_id"]
    )
    op.create_index("idx_archived_orders_archived_at", "archived_orders", ["archived_at"])
    op.create_index("idx_archived_orders_status", "archived_orders", ["status"])


def downgrade() -> None:
    op.drop_index("idx_archived_orders_status", table_name="archived_orders")
    op.drop_index("idx_archived_orders_archived_at", table_name="archived_orders")
    op.drop_index("idx_archived_orders_tenant_restaurant", table_name="archived_orders")
    op.drop_table("archived_orders")
