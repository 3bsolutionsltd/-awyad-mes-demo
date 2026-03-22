@echo off
REM AWYAD MES - Migration Runner (Batch Script)
REM This script finds PostgreSQL and runs migrations

echo =========================================
echo AWYAD MES - Database Migration Runner
echo =========================================
echo.

REM Try to find PostgreSQL in common locations
set PSQL_PATH=

if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    set PSQL_PATH=C:\Program Files\PostgreSQL\15\bin
    echo Found PostgreSQL 15
) else if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" (
    set PSQL_PATH=C:\Program Files\PostgreSQL\14\bin
    echo Found PostgreSQL 14
) else if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    set PSQL_PATH=C:\Program Files\PostgreSQL\16\bin
    echo Found PostgreSQL 16
) else if exist "C:\Program Files\PostgreSQL\13\bin\psql.exe" (
    set PSQL_PATH=C:\Program Files\PostgreSQL\13\bin
    echo Found PostgreSQL 13
) else (
    echo ERROR: PostgreSQL not found in standard locations
    echo.
    echo Please install PostgreSQL or update this script with your installation path
    echo Common locations:
    echo   C:\Program Files\PostgreSQL\15\bin
    echo   C:\Program Files\PostgreSQL\14\bin
    echo.
    pause
    exit /b 1
)

echo.

REM Set database details
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=awyad_mes
set DB_USER=postgres

REM Get password
set /p PGPASSWORD="Enter password for user '%DB_USER%': "

echo.
echo Navigating to migrations directory...
cd /d "%~dp0database\migrations"

echo.
echo Running all migrations...
echo.

"%PSQL_PATH%\psql.exe" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f run_all_migrations.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =========================================
    echo SUCCESS! All migrations completed
    echo =========================================
    echo.
    echo Verifying results...
    "%PSQL_PATH%\psql.exe" -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) as new_tables FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('strategies', 'pillars', 'core_program_components', 'indicator_mappings', 'activity_budget_transfers', 'currency_rates', 'case_types', 'case_categories', 'monthly_snapshots', 'non_program_categories', 'non_program_activities', 'system_configurations', 'role_hierarchy');"
) else (
    echo.
    echo =========================================
    echo ERROR: Migration failed
    echo =========================================
    echo.
    echo To rollback, run: run-migrations-rollback.bat
)

echo.
pause
