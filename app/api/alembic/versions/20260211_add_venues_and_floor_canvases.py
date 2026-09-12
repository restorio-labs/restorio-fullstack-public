"""add_venues_and_floor_canvases

Revision ID: 2a8f3c5d7e9b
Revises: 165824d5181d
Create Date: 2026-02-11

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "2a8f3c5d7e9b"
down_revision: Union[str, None] = "b2c3d4e5f6a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "venues",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("active_layout_version_id", sa.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_venues_tenant_id", "venues", ["tenant_id"], unique=False)

    op.create_table(
        "floor_canvases",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("venue_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False, server_default="800"),
        sa.Column("height", sa.Integer(), nullable=False, server_default="600"),
        sa.Column(
            "elements",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_floor_canvases_venue_id", "floor_canvases", ["venue_id"], unique=False)

    op.create_foreign_key(
        "fk_venues_active_layout_version_id",
        "venues",
        "floor_canvases",
        ["active_layout_version_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_venues_active_layout_version_id", "venues", type_="foreignkey")
    op.drop_index("idx_floor_canvases_venue_id", table_name="floor_canvases")
    op.drop_table("floor_canvases")
    op.drop_index("idx_venues_tenant_id", table_name="venues")
    op.drop_table("venues")
