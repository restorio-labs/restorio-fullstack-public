"""merge p24 fields and auth branches

Revision ID: eed96e2247c3
Revises: f2a3b4c5d6e7, b91f3583d0ac
Create Date: 2026-02-18 03:10:29.470235

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "eed96e2247c3"
down_revision: Union[str, None] = ("f2a3b4c5d6e7", "b91f3583d0ac")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
