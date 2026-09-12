from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from core.foundation.infra.config import settings


class DatabaseConnections:
    _mongo_client: AsyncIOMotorClient | None = None

    @classmethod
    def get_mongo_client(cls) -> AsyncIOMotorClient:
        if cls._mongo_client is None:
            cls._mongo_client = AsyncIOMotorClient(
                settings.DATABASE_URL,
                serverSelectionTimeoutMS=8000,
                connectTimeoutMS=8000,
            )
        return cls._mongo_client


def get_mongo_client() -> AsyncIOMotorClient:
    return DatabaseConnections.get_mongo_client()


def get_mongo_db() -> AsyncIOMotorDatabase:
    client = get_mongo_client()
    return client[settings.DATABASE_NAME]
