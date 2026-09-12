"""remove_restaurant_tables

Revision ID: 8a9b0c1d2e3f
Revises: 7f8e9d0c1b2a
Create Date: 2026-03-03 22:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = "8a9b0c1d2e3f"
down_revision: Union[str, None] = "7f8e9d0c1b2a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the table_id foreign key constraint from orders table (keep column, just remove FK)
    op.drop_constraint("orders_table_id_fkey", "orders", type_="foreignkey")

    # Make table_id nullable since it no longer references restaurant_tables
    op.alter_column("orders", "table_id", nullable=True)

    # Drop the restaurant_tables table and its indexes
    op.drop_index("idx_restaurant_tables_tenant_id", table_name="restaurant_tables")
    op.drop_table("restaurant_tables")


def downgrade() -> None:
    # Recreate restaurant_tables table
    op.create_table(
        "restaurant_tables",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "tenant_id",
            UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("label", sa.String(50), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint("capacity > 0", name="check_capacity_positive"),
        sa.UniqueConstraint("tenant_id", "label", name="uq_tenant_table_label"),
    )

    # Recreate index
    op.create_index(
        "idx_restaurant_tables_tenant_id", "restaurant_tables", ["tenant_id"], unique=False
    )

    # Add table_id column back to orders
    op.add_column(
        "orders",
        sa.Column(
            "table_id",
            UUID(as_uuid=True),
            nullable=True,  # Nullable during migration
        ),
    )

    # Add foreign key constraint
    op.create_foreign_key(
        "orders_table_id_fkey",
        "orders",
        "restaurant_tables",
        ["table_id"],
        ["id"],
        ondelete="RESTRICT",
    )
