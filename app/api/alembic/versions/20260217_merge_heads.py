"""merge_heads

Revision ID: c03e4694e1bd
Revises: c3d4e5f6a7b8, f2a3b4c5d6e7
Create Date: 2026-02-17

"""

from typing import Sequence, Union

from alembic import op


revision: str = "c03e4694e1bd"
down_revision: Union[str, tuple[str, ...], None] = ("c3d4e5f6a7b8", "f2a3b4c5d6e7")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
