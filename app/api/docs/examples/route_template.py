"""
Route Template - Copy this file to create new route modules

Best Practices:
1. Use proper HTTP status codes (200, 201, 204, 400, 401, 403, 404, 409, 422, 500)
2. Use response models: SuccessResponse, CreatedResponse, UpdatedResponse, DeletedResponse
3. Use dependency injection for database connections
4. Handle exceptions with custom exception classes (NotFoundResponse, ValidationError, etc.)
5. Add proper type hints
6. Document endpoints with docstrings
"""

from fastapi import APIRouter, status

from core.foundation.dependencies import MongoDB, PostgresSession
from core.foundation.http.responses import (
    CreatedResponse,
    DeletedResponse,
    PaginatedResponse,
    SuccessResponse,
    UpdatedResponse,
)

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
async def list_items(
    _db: MongoDB,
    _session: PostgresSession,
    page: int = 1,
    page_size: int = 10,
) -> PaginatedResponse[dict]:
    """
    List all items with pagination.

    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 10)
    """
    # Example: Use database connections
    # items = await db.collection.find().skip((page - 1) * page_size).limit(page_size).to_list(length=page_size)
    # total = await db.collection.count_documents({})

    return PaginatedResponse.create(
        items=[],
        total=0,
        page=page,
        page_size=page_size,
    )


@router.get("/{item_id}", status_code=status.HTTP_200_OK)
async def get_item(
    item_id: str,
    _db: MongoDB,
) -> SuccessResponse[dict]:
    """
    Get a specific item by ID.

    - **item_id**: Unique identifier for the item
    """
    # Example: Query database
    # item = await db.collection.find_one({"_id": item_id})
    # if not item:
    #     raise NotFoundResponse("Item", item_id)

    return SuccessResponse(
        message=f"Item {item_id} retrieved successfully",
        data={"id": item_id},
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_item(
    _db: MongoDB,
    _session: PostgresSession,
) -> CreatedResponse[dict]:
    """
    Create a new item.
    """
    # Example: Insert into database
    # result = await db.collection.insert_one(data)
    # created_item = await db.collection.find_one({"_id": result.inserted_id})

    return CreatedResponse(
        message="Item created successfully",
        data={"id": "new-item-id"},
    )


@router.put("/{item_id}", status_code=status.HTTP_200_OK)
async def update_item(
    item_id: str,
    _db: MongoDB,
) -> UpdatedResponse[dict]:
    """
    Update an existing item.

    - **item_id**: Unique identifier for the item
    """
    # Example: Update in database
    # result = await db.collection.update_one({"_id": item_id}, {"$set": data})
    # if result.matched_count == 0:
    #     raise NotFoundResponse("Item", item_id)
    # updated_item = await db.collection.find_one({"_id": item_id})

    return UpdatedResponse(
        message=f"Item {item_id} updated successfully",
        data={"id": item_id},
    )


@router.delete("/{item_id}", status_code=status.HTTP_200_OK)
async def delete_item(
    item_id: str,
    _db: MongoDB,
) -> DeletedResponse:
    """
    Delete an item.

    - **item_id**: Unique identifier for the item
    """
    # Example: Delete from database
    # result = await db.collection.delete_one({"_id": item_id})
    # if result.deleted_count == 0:
    #     raise NotFoundResponse("Item", item_id)

    return DeletedResponse(
        message=f"Item {item_id} deleted successfully",
    )
