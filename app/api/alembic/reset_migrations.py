"""
Script to reset all migrations and start fresh with datetime-based migration names.
This will:
1. Drop all tables from the database
2. Remove all migration files
3. Create a new initial migration with datetime format
"""

import asyncio

from sqlalchemy import text

from core.foundation.database.database import engine


async def reset_database() -> None:
    print("🗄️  Dropping all tables and recreating schema...")  # noqa: T201
    async with engine.begin() as conn:
        await conn.execute(text("DROP SCHEMA public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
    print("✅ Database reset complete")  # noqa: T201


if __name__ == "__main__":
    asyncio.run(reset_database())
