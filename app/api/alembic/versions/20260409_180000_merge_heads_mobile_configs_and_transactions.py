"""merge heads after mobile configs and transactions bigint

Revision ID: 20260409_merge_mobile_tx
Revises: 20260409_mobile_configs, e4d3c2b1a9f8
Create Date: 2026-04-09 18:00:00.000000

"""

from typing import Sequence, Union


revision: str = "20260409_merge_mobile_tx"
down_revision: Union[str, tuple[str, ...], None] = ("20260409_mobile_configs", "e4d3c2b1a9f8")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
