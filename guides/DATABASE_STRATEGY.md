# Database Management Strategy

## Current Structure (Good!)

```
create_database.sql     # Schema (tables, constraints, indexes)
test_data.sql          # Initial/seed data (roles, cities, etc.)
local_backup.sql       # User data export/import
```

## Recommended Structure for Production

```
database/
├── schema/
│   ├── 001_initial_schema.sql
│   ├── 002_add_indexes.sql
│   └── 003_alter_user_table.sql
├── seed_data/
│   ├── roles.sql
│   ├── cities.sql
│   └── provinces.sql
├── migrations/
│   ├── migration_001.sql
│   └── migration_002.sql
└── backups/
    ├── production_backup_2025-08-11.sql
    └── staging_backup_2025-08-11.sql
```

## Why This Approach?

### 1. Schema Separation

- **Maintainable**: Easy to track changes
- **Versionable**: Each migration is numbered
- **Rollback**: Can undo specific changes
- **Team-friendly**: Multiple developers can work safely

### 2. Data Separation

- **Seed Data**: Static reference data (roles, cities)
- **User Data**: Dynamic content (users, trees)
- **Test Data**: For development/testing

## Migration Strategy for Future

### TypeORM Approach (Recommended)

```typescript
// Enable migrations in your database config
{
  synchronize: false,     // NEVER true in production
  migrationsRun: true,    // Auto-run migrations
  migrations: ['dist/migrations/*.js'],
  cli: {
    migrationsDir: 'src/migrations'
  }
}
```

### Commands for Migrations

```bash
# Generate migration from entity changes
npm run typeorm migration:generate -- -n AddNewColumn

# Create empty migration
npm run typeorm migration:create -- -n CustomMigration

# Run migrations
npm run typeorm migration:run

# Revert last migration
npm run typeorm migration:revert
```

## Current Setup Recommendation

For your current Docker setup, I recommend:

1. **Keep separate files** (as you have now)
2. **Always run schema first, then data**
3. **Use environment-specific data**

## Best Practices for Future

### 1. Never use synchronize: true in production

### 2. Always backup before migrations

### 3. Test migrations on staging first

### 4. Use transactions for complex migrations

### 5. Keep migrations small and focused
