"""Fix owner_id location from user_tenants to tenants

Revision ID: e1f2a3b4c5d6
Revises: d9e0f1a2b3c4
Create Date: 2026-02-17 13:00:00.000000

"""

from typing import Sequence, Union

from alembic import op

revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, None] = "d9e0f1a2b3c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_id UUID")
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'fk_tenants_owner_id_users'
            ) THEN
                ALTER TABLE tenants
                ADD CONSTRAINT fk_tenants_owner_id_users
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
            END IF;
        END
        $$;
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_tenants_owner_id ON tenants(owner_id)")

    op.execute("DROP INDEX IF EXISTS ix_user_tenants_owner_id")
    op.execute("ALTER TABLE user_tenants DROP CONSTRAINT IF EXISTS fk_user_tenants_owner_id_users")
    op.execute("ALTER TABLE user_tenants DROP COLUMN IF EXISTS owner_id")


def downgrade() -> None:
    op.execute("ALTER TABLE user_tenants ADD COLUMN IF NOT EXISTS owner_id UUID")
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname = 'fk_user_tenants_owner_id_users'
            ) THEN
                ALTER TABLE user_tenants
                ADD CONSTRAINT fk_user_tenants_owner_id_users
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
            END IF;
        END
        $$;
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_user_tenants_owner_id ON user_tenants(owner_id)")

    op.execute("DROP INDEX IF EXISTS ix_tenants_owner_id")
    op.execute("ALTER TABLE tenants DROP CONSTRAINT IF EXISTS fk_tenants_owner_id_users")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS owner_id")
