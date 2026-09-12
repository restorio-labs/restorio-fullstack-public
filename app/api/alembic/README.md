# Database Migrations

This module manages relational database schema evolution using **Alembic** in conjunction with the asynchronous SQLAlchemy ORM. All migrations target the PostgreSQL database and are version-controlled alongside the application source code.

## Command Reference

The following table lists the available migration commands. Each command may be invoked either through the Makefile or directly via the `uv run alembic` interface:

| Operation | Command |
|---|---|
| Apply all pending migrations | `make migrate` |
| Generate a new migration script | `make migrate-create NAME="description"` |
| Display migration history | `make migrate-history` |
| Display the current revision | `make migrate-current` |
| Revert the most recent migration | `make migrate-downgrade` |

## Mechanism of Operation

The migration subsystem operates according to the following principles:

- Alembic performs automatic schema comparison against the SQLAlchemy ORM models defined in `core/models/`, generating migration scripts that reflect detected changes.
- Generated migration scripts are stored in the `alembic/versions/` directory, each identified by a unique revision hash and a descriptive message.
- Connection and environment configuration is specified in `alembic.ini` (database URL) and `alembic/env.py` (asynchronous engine initialisation).
- The migration runner utilises the asynchronous SQLAlchemy engine provided by the `core.foundation` module.

## Migration Workflow

The recommended procedure for creating and applying a new migration is as follows:

```bash
# 1. Modify or create an ORM model in core/models/
# 2. Generate the corresponding migration script
make migrate-create NAME="add_user_email_index"

# 3. Review the auto-generated script in alembic/versions/
# 4. Apply the migration to the database
make migrate
```

## Recommended Practices

1. **Review all auto-generated migration scripts manually.** Alembic's automatic detection may fail to identify column renames, complex data migrations, or certain constraint modifications.
2. **Validate migrations against a development database** prior to applying them in staging or production environments.
3. **Do not modify existing migration files.** If a correction is required, create a new migration to apply the necessary changes.
4. **Create a database backup** before executing migrations in production environments.
5. **Use descriptive migration names** that clearly communicate the nature of the change, for example: `"add_tenant_profile_table"` or `"drop_legacy_columns"`.

## Development: Resetting Migrations

During development, it may be necessary to discard the existing migration history and regenerate a fresh initial migration. The provided reset script facilitates this operation:

```bash
./reset_migrations.sh
```
