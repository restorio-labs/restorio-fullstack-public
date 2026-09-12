#!/bin/bash
set -e

echo "⚠️  This will DELETE all migrations and reset your database!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo ""
echo "🗑️  Step 1: Removing all migration files..."
rm -f alembic/versions/*.py
echo "✅ Migration files removed"

echo ""
echo "🗄️  Step 2: Resetting database schema..."
docker exec restorio-api uv run python alembic/reset_migrations.py
echo "✅ Database reset complete"

echo ""
echo "📝 Step 3: Creating new initial migration with datetime format..."
docker exec restorio-api uv run alembic revision --autogenerate -m "initial_schema"
echo "✅ Initial migration created"

echo ""
echo "🚀 Step 4: Applying migration..."
docker exec restorio-api uv run alembic upgrade head
echo "✅ Migration applied"

echo ""
echo "🎉 All done! Your migrations are now using datetime format."
echo "Future migrations will be named like: 20260205_223045_description.py"
