"""Move users.account_type to tenant_roles

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-02-17 14:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "f2a3b4c5d6e7"
down_revision: Union[str, None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    account_type_enum = postgresql.ENUM(
        "owner",
        "waiter",
        "kitchen",
        "manager",
        name="account_type",
        create_type=False,
    )

    op.create_table(
        "tenant_roles",
        sa.Column("account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("account_type", account_type_enum, nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("account_id", "tenant_id"),
    )
    op.create_index("ix_tenant_roles_tenant_id", "tenant_roles", ["tenant_id"], unique=False)

    op.execute(
        """
        INSERT INTO tenant_roles (account_id, tenant_id, account_type)
        SELECT id, tenant_id, account_type
        FROM users
        WHERE tenant_id IS NOT NULL
        """
    )

    op.drop_column("users", "account_type")


def downgrade() -> None:
    account_type_enum = postgresql.ENUM(
        "owner",
        "waiter",
        "kitchen",
        "manager",
        name="account_type",
        create_type=False,
    )

    op.add_column(
        "users",
        sa.Column("account_type", account_type_enum, server_default="owner", nullable=False),
    )
    op.execute(
        """
        UPDATE users
        SET account_type = tr.account_type
        FROM tenant_roles tr
        WHERE tr.account_id = users.id
          AND tr.tenant_id = users.tenant_id
        """
    )
    op.alter_column("users", "account_type", server_default=None)

    op.drop_index("ix_tenant_roles_tenant_id", table_name="tenant_roles")
    op.drop_table("tenant_roles")
