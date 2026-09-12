"""transactions p24_order_id bigint

Przelewy24 orderId can exceed 32-bit signed integer range.

Revision ID: e4d3c2b1a9f8
Revises: 60ceb07b8990
Create Date: 2026-04-02

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e4d3c2b1a9f8"
down_revision: Union[str, None] = "60ceb07b8990"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "transactions",
        "p24_order_id",
        existing_type=sa.INTEGER(),
        type_=sa.BigInteger(),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "transactions",
        "p24_order_id",
        existing_type=sa.BigInteger(),
        type_=sa.INTEGER(),
        existing_nullable=True,
        postgresql_using="p24_order_id::integer",
    )
