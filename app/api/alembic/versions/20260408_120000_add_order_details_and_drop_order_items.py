"""add order_details and drop order_items

Revision ID: 20260408_order_details
Revises: 20260403_add_order_notes_field
Create Date: 2026-04-08 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "20260408_order_details"
down_revision: Union[str, None] = "20260403_add_order_notes_field"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "order_details",
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("notes", sa.String(length=1000), nullable=True),
        sa.Column(
            "items_snapshot",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("order_id"),
    )

    op.execute(
        """
        INSERT INTO order_details (order_id, notes, items_snapshot, created_at, updated_at)
        SELECT
            o.id,
            o.notes,
            COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', oi.id::text,
                            'menuItemId', oi.product_id,
                            'name', oi.name_snapshot,
                            'quantity', oi.quantity,
                            'basePrice', oi.unit_price,
                            'selectedModifiers', '[]'::jsonb,
                            'totalPrice', oi.unit_price * oi.quantity
                        )
                        ORDER BY oi.created_at
                    )
                    FROM order_items oi
                    WHERE oi.order_id = o.id
                ),
                '[]'::jsonb
            ),
            o.created_at,
            o.updated_at
        FROM orders o
        """
    )

    op.drop_index("idx_order_items_order_id", table_name="order_items")
    op.drop_table("order_items")
    op.drop_column("orders", "notes")


def downgrade() -> None:
    op.add_column("orders", sa.Column("notes", sa.String(length=1000), nullable=True))

    op.create_table(
        "order_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", sa.String(length=255), nullable=False),
        sa.Column("name_snapshot", sa.String(length=255), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.CheckConstraint("quantity > 0", name="check_quantity_positive"),
        sa.CheckConstraint("unit_price >= 0", name="check_unit_price_non_negative"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_order_items_order_id", "order_items", ["order_id"], unique=False)

    op.execute(
        """
        UPDATE orders o
        SET notes = od.notes
        FROM order_details od
        WHERE od.order_id = o.id
        """
    )

    op.execute(
        """
        INSERT INTO order_items (id, order_id, product_id, name_snapshot, quantity, unit_price, created_at)
        SELECT
            gen_random_uuid(),
            od.order_id,
            COALESCE(item->>'menuItemId', item->>'product_id', ''),
            COALESCE(item->>'name', ''),
            COALESCE((item->>'quantity')::integer, 1),
            COALESCE((item->>'basePrice')::numeric, (item->>'unit_price')::numeric, 0),
            od.created_at
        FROM order_details od
        CROSS JOIN LATERAL jsonb_array_elements(od.items_snapshot) AS item
        """
    )

    op.drop_table("order_details")
