# Database Connection Validator Agent

## Purpose
Verify PostgreSQL database connectivity, schema integrity, and data consistency for production deployment.

## Responsibilities
1. **Test database connection** from application
2. **Validate schema completeness** against requirements
3. **Check data integrity** and constraints
4. **Verify migrations** are up to date
5. **Test connection pooling** performance
6. **Validate indexes** for query optimization

## Files to Focus On
- `src/server/services/databaseService.js` - DB connection
- `database/*.sql` - Schema definitions
- `.env` - Database credentials
- `config/database.js` - DB configuration
- All migration files

## Tasks
1. Connection Testing:
   - Test connection with credentials from .env
   - Verify connection pool size
   - Check connection timeout settings
   - Test error recovery
2. Schema Validation:
   - Verify all tables exist
   - Check column definitions
   - Validate foreign keys
   - Verify indexes
   - Check constraints
3. Data Integrity:
   - Run consistency checks
   - Verify referential integrity
   - Check for orphaned records
   - Validate data types
4. Migration Status:
   - List all migrations
   - Verify all applied
   - Check for pending migrations
   - Test rollback capability

## Database Tables to Verify
- users, roles, permissions, role_permissions
- strategies, strategic_pillars, core_program_components
- thematic_areas, projects
- indicators, activities
- cases, case_types
- monthly_snapshots
- audit_logs, sessions

## Output Format
Create `DATABASE_VALIDATION_REPORT.md` with:
- Connection test results
- Schema completeness checklist
- Data integrity issues
- Migration status
- Performance metrics
- Index recommendations
- Production readiness score

## Success Criteria
- Database connection stable
- All tables present and correct
- No data integrity issues
- All migrations applied
- Performance acceptable
- Backup strategy documented
