"""set_force_password_change_default_false

Revision ID: a1d3c5e7f9b2
Revises: 9f2b7a1cd4e8
Create Date: 2026-02-26 23:15:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a1d3c5e7f9b2"
down_revision: Union[str, None] = "9f2b7a1cd4e8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "users",
        "force_password_change",
        existing_type=sa.Boolean(),
        server_default=sa.text("false"),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "force_password_change",
        existing_type=sa.Boolean(),
        server_default=None,
        existing_nullable=False,
    )
