from typing import Annotated
from uuid import UUID

from pydantic import Field

EntityId = Annotated[UUID, Field(description="Unique identifier for an entity")]
CurrencyCode = Annotated[str, Field(min_length=3, max_length=3, pattern="^[A-Z]{3}$")]
