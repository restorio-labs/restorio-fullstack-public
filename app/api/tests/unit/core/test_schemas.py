from core.foundation.http.responses import PaginatedResponse


class TestPaginatedResponseCreate:
    def test_create_with_positive_page_size(self) -> None:
        result = PaginatedResponse.create(
            items=[1, 2, 3],
            total=3,
            page=1,
            page_size=2,
        )

        assert result.total_pages == 2  # noqa: PLR2004
        assert result.items == [1, 2, 3]

    def test_create_with_zero_page_size(self) -> None:
        result = PaginatedResponse.create(
            items=[],
            total=0,
            page=1,
            page_size=0,
        )

        assert result.total_pages == 0
