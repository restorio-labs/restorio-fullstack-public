"""merge heads: orders/waiter branch and archived orders branch

Revision ID: 7a8b9c0d1e2f
Revises: 60ceb07b8990, e7f8a9b0c1d2
Create Date: 2026-04-02 12:00:00.000000

"""

from typing import Sequence, Union


revision: str = "7a8b9c0d1e2f"
down_revision: Union[str, tuple[str, ...], None] = ("60ceb07b8990", "e7f8a9b0c1d2")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
