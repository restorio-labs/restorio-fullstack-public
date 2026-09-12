"""add_name_and_surname_to_users

Revision ID: 5c559d8ad32a
Revises: 9ea8f08a9e1f
Create Date: 2026-03-30 00:47:45.844023

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5c559d8ad32a"
down_revision: Union[str, None] = "9ea8f08a9e1f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("name", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("surname", sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "surname")
    op.drop_column("users", "name")
