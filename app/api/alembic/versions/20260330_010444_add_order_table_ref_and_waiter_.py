"""add_order_table_ref_and_waiter_assignment

Revision ID: 60ceb07b8990
Revises: 5c559d8ad32a
Create Date: 2026-03-30 01:04:44.839837

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "60ceb07b8990"
down_revision: Union[str, None] = "5c559d8ad32a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("table_ref", sa.String(length=255), nullable=True))
    op.add_column("orders", sa.Column("waiter_user_id", sa.UUID(), nullable=True))
    op.create_index("idx_orders_table_ref", "orders", ["table_ref"], unique=False)
    op.create_index("idx_orders_waiter_user_id", "orders", ["waiter_user_id"], unique=False)
    op.create_foreign_key(
        "orders_waiter_user_id_fkey",
        "orders",
        "users",
        ["waiter_user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("orders_waiter_user_id_fkey", "orders", type_="foreignkey")
    op.drop_index("idx_orders_waiter_user_id", table_name="orders")
    op.drop_index("idx_orders_table_ref", table_name="orders")
    op.drop_column("orders", "waiter_user_id")
    op.drop_column("orders", "table_ref")
