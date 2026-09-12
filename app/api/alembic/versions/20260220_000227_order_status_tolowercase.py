"""order_status_tolowercase

Revision ID: 932c4186f8ba
Revises: 40e549d0648d
Create Date: 2026-02-20 00:02:27.466673

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "932c4186f8ba"
down_revision: Union[str, None] = "40e549d0648d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Column must be cast to text first so we can drop the type
    op.execute("ALTER TABLE orders ALTER COLUMN status TYPE TEXT")
    op.execute("DROP TYPE order_status")
    op.execute(
        "CREATE TYPE order_status AS ENUM ("
        "'placed', 'paid', 'cancelled', 'new', 'pending', 'confirmed', "
        "'preparing', 'ready', 'delivered'"
        ")"
    )
    op.execute(
        "ALTER TABLE orders ALTER COLUMN status TYPE order_status USING status::order_status"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE orders ALTER COLUMN status TYPE TEXT")
    op.execute("DROP TYPE order_status")
    op.execute("CREATE TYPE order_status AS ENUM ('OrderStatus')")
    op.execute(
        "ALTER TABLE orders ALTER COLUMN status TYPE order_status USING status::order_status"
    )
