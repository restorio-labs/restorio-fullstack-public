"""add_tenant_p24_fields

Revision ID: b91f3583d0ac
Revises: c03e4694e1bd
Create Date: 2026-02-17

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b91f3583d0ac"
down_revision: Union[str, None] = "c03e4694e1bd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tenants", sa.Column("p24_merchantid", sa.Integer(), nullable=True))
    op.add_column("tenants", sa.Column("p24_api", sa.String(length=32), nullable=True))
    op.add_column("tenants", sa.Column("p24_crc", sa.String(length=16), nullable=True))


def downgrade() -> None:
    op.drop_column("tenants", "p24_crc")
    op.drop_column("tenants", "p24_api")
    op.drop_column("tenants", "p24_merchantid")
