"""rename_restaurant_profiles_to_tenant_profiles

Revision ID: c4d5e6f7a8b9
Revises: 8a9b0c1d2e3f
Create Date: 2026-03-04 21:50:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c4d5e6f7a8b9"
down_revision: Union[str, None] = "8a9b0c1d2e3f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "restaurant_profiles" in tables and "tenant_profiles" not in tables:
        op.rename_table("restaurant_profiles", "tenant_profiles")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "tenant_profiles" in tables and "restaurant_profiles" not in tables:
        op.rename_table("tenant_profiles", "restaurant_profiles")
