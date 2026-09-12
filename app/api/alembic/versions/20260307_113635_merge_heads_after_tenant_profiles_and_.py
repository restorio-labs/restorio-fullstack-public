"""merge heads after tenant profiles and force password

Revision ID: c8b96a8eaa38
Revises: c119274a702d, a1d3c5e7f9b2, c4d5e6f7a8b9
Create Date: 2026-03-07 11:36:35.399437

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c8b96a8eaa38"
down_revision: Union[str, None] = ("c119274a702d", "a1d3c5e7f9b2", "c4d5e6f7a8b9")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
