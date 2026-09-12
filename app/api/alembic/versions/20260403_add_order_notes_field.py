"""Add notes field to orders table

Revision ID: add_order_notes_field
Revises: 20260402_merge_heads_orders_branch_and_archived_orders
Create Date: 2026-04-03

"""

from alembic import op
import sqlalchemy as sa

revision = "20260403_add_order_notes_field"
down_revision = "7a8b9c0d1e2f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("notes", sa.String(1000), nullable=True))


def downgrade() -> None:
    op.drop_column("orders", "notes")
