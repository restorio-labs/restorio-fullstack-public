"""add_force_password_change_to_users

Revision ID: 9f2b7a1cd4e8
Revises: 932c4186f8ba
Create Date: 2026-02-25 21:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "9f2b7a1cd4e8"
down_revision: Union[str, None] = "932c4186f8ba"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "force_password_change",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.alter_column("users", "force_password_change", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "force_password_change")
