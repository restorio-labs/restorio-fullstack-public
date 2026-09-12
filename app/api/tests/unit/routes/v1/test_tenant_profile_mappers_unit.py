from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import uuid4

from routes.v1.mappers.tenant_profile_mappers import tenant_profile_to_response


def test_tenant_profile_to_response() -> None:
    pid, tid = uuid4(), uuid4()
    now = datetime.now(UTC)
    p = SimpleNamespace(
        id=pid,
        tenant_id=tid,
        nip="1234567890",
        company_name="Co",
        logo="https://l/x",
        contact_email="c@e.com",
        phone="1",
        address_street_name="S",
        address_street_number="1",
        address_city="W",
        address_postal_code="00-001",
        address_country="PL",
        owner_first_name="A",
        owner_last_name="B",
        owner_email="o@e.com",
        owner_phone="2",
        contact_person_first_name=None,
        contact_person_last_name=None,
        contact_person_email=None,
        contact_person_phone=None,
        social_facebook=None,
        social_instagram=None,
        social_tiktok=None,
        social_website=None,
        created_at=now,
        updated_at=now,
    )
    r = tenant_profile_to_response(p)
    assert r.tenant_id == tid
    assert r.company_name == "Co"
