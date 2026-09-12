from core.dto.v1.tenants.requests import UpdateTenantDTO


def test_update_tenant_dto_none_slug():
    dto = UpdateTenantDTO(slug=None)
    assert dto.slug is None
