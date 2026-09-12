"""Add tenant and owner relationships

Revision ID: d9e0f1a2b3c4
Revises: b2c3d4e5f6a1
Create Date: 2026-02-17 12:15:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "d9e0f1a2b3c4"
down_revision: Union[str, None] = "b2c3d4e5f6a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_users_tenant_id_tenants",
        "users",
        "tenants",
        ["tenant_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_users_tenant_id", "users", ["tenant_id"], unique=False)

    op.add_column("tenants", sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_tenants_owner_id_users",
        "tenants",
        "users",
        ["owner_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_tenants_owner_id", "tenants", ["owner_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_tenants_owner_id", table_name="tenants")
    op.drop_constraint("fk_tenants_owner_id_users", "tenants", type_="foreignkey")
    op.drop_column("tenants", "owner_id")

    op.drop_index("ix_users_tenant_id", table_name="users")
    op.drop_constraint("fk_users_tenant_id_tenants", "users", type_="foreignkey")
    op.drop_column("users", "tenant_id")
