"""add landing_content to tenant_mobile_configs

Revision ID: 20260414_mobile_landing
Revises: 20260409_table_sessions
Create Date: 2026-04-14

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "20260414_mobile_landing"
down_revision: Union[str, tuple[str, ...], None] = "20260409_table_sessions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tenant_mobile_configs",
        sa.Column("landing_content", JSONB(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("tenant_mobile_configs", "landing_content")
