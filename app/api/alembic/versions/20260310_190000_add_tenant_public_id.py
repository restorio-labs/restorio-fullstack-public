"""add tenant public_id column

Revision ID: d1e2f3a4b5c6
Revises: c8b96a8eaa38
Create Date: 2026-03-10 19:00:00.000000

"""

import secrets
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, None] = "c8b96a8eaa38"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add nullable column first
    op.add_column("tenants", sa.Column("public_id", sa.String(32), nullable=True))

    # 2. Backfill existing rows with unique public_ids
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id FROM tenants WHERE public_id IS NULL")).fetchall()
    for row in rows:
        public_id = secrets.token_urlsafe(16)
        conn.execute(
            sa.text("UPDATE tenants SET public_id = :pid WHERE id = :tid"),
            {"pid": public_id, "tid": row[0]},
        )

    # 3. Set NOT NULL and add unique index
    op.alter_column("tenants", "public_id", nullable=False)
    op.create_unique_constraint("uq_tenants_public_id", "tenants", ["public_id"])
    op.create_index("ix_tenants_public_id", "tenants", ["public_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_tenants_public_id", table_name="tenants")
    op.drop_constraint("uq_tenants_public_id", "tenants", type_="unique")
    op.drop_column("tenants", "public_id")
