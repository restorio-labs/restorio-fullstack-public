"""add_tenant_profiles

Revision ID: 7f8e9d0c1b2a
Revises: 932c4186f8ba
Create Date: 2026-03-02 20:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = "7f8e9d0c1b2a"
down_revision: Union[str, None] = "932c4186f8ba"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tenant_profiles",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "tenant_id",
            UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("nip", sa.String(10), nullable=False),
        sa.Column("company_name", sa.String(255), nullable=False),
        sa.Column("logo_url", sa.String(512), nullable=True),
        sa.Column("contact_email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("address_street", sa.String(255), nullable=False),
        sa.Column("address_city", sa.String(100), nullable=False),
        sa.Column("address_postal_code", sa.String(10), nullable=False),
        sa.Column("address_country", sa.String(100), nullable=False, server_default="Polska"),
        sa.Column("owner_first_name", sa.String(100), nullable=False),
        sa.Column("owner_last_name", sa.String(100), nullable=False),
        sa.Column("owner_email", sa.String(255), nullable=True),
        sa.Column("owner_phone", sa.String(20), nullable=True),
        sa.Column("contact_person_first_name", sa.String(100), nullable=True),
        sa.Column("contact_person_last_name", sa.String(100), nullable=True),
        sa.Column("contact_person_email", sa.String(255), nullable=True),
        sa.Column("contact_person_phone", sa.String(20), nullable=True),
        sa.Column("social_facebook", sa.String(512), nullable=True),
        sa.Column("social_instagram", sa.String(512), nullable=True),
        sa.Column("social_tiktok", sa.String(512), nullable=True),
        sa.Column("social_website", sa.String(512), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("tenant_profiles")
