"""move_active_layout_to_tenants_and_remove_venues

Revision ID: c3d4e5f6a7b8
Revises: 2a8f3c5d7e9b
Create Date: 2026-02-17

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "2a8f3c5d7e9b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column("active_layout_version_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

    op.execute("""
        UPDATE tenants
        SET active_layout_version_id = (
            SELECT active_layout_version_id
            FROM venues
            WHERE venues.tenant_id = tenants.id
            LIMIT 1
        )
    """)

    op.add_column(
        "floor_canvases",
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

    op.execute("""
        UPDATE floor_canvases
        SET tenant_id = (
            SELECT tenant_id
            FROM venues
            WHERE venues.id = floor_canvases.venue_id
        )
    """)

    op.alter_column("floor_canvases", "tenant_id", nullable=False)

    op.drop_constraint("floor_canvases_venue_id_fkey", "floor_canvases", type_="foreignkey")
    op.drop_index("idx_floor_canvases_venue_id", table_name="floor_canvases")
    op.drop_column("floor_canvases", "venue_id")

    op.create_foreign_key(
        "fk_floor_canvases_tenant_id",
        "floor_canvases",
        "tenants",
        ["tenant_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("idx_floor_canvases_tenant_id", "floor_canvases", ["tenant_id"], unique=False)

    op.create_foreign_key(
        "fk_tenants_active_layout_version_id",
        "tenants",
        "floor_canvases",
        ["active_layout_version_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.drop_constraint("fk_venues_active_layout_version_id", "venues", type_="foreignkey")
    op.drop_index("idx_venues_tenant_id", table_name="venues")
    op.drop_table("venues")


def downgrade() -> None:
    op.create_table(
        "venues",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("active_layout_version_id", postgresql.UUID(as_uuid=True), nullable=True),
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

    op.drop_constraint("fk_tenants_active_layout_version_id", "tenants", type_="foreignkey")
    op.drop_column("tenants", "active_layout_version_id")

    op.add_column(
        "floor_canvases",
        sa.Column("venue_id", postgresql.UUID(as_uuid=True), nullable=True),
    )

    op.execute("""
        UPDATE floor_canvases
        SET venue_id = (
            SELECT id
            FROM venues
            WHERE venues.tenant_id = floor_canvases.tenant_id
            LIMIT 1
        )
    """)

    op.alter_column("floor_canvases", "venue_id", nullable=False)

    op.drop_constraint("fk_floor_canvases_tenant_id", "floor_canvases", type_="foreignkey")
    op.drop_index("idx_floor_canvases_tenant_id", table_name="floor_canvases")
    op.drop_column("floor_canvases", "tenant_id")

    op.create_foreign_key(
        "floor_canvases_venue_id_fkey",
        "floor_canvases",
        "venues",
        ["venue_id"],
        ["id"],
        ondelete="CASCADE",
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
