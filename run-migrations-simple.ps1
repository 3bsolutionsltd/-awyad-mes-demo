# Simple Migration Runner - No Dependencies
# Usage: .\run-migrations-simple.ps1 -PgPath "C:\Program Files\PostgreSQL\15\bin"

param(
    [Parameter(Mandatory=$true)]
    [string]$PgPath,
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbName = "awyad_mes",
    [string]$DbUser = "postgres"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "AWYAD MES - Simple Migration Runner" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Verify PostgreSQL path
$psqlExe = Join-Path $PgPath "psql.exe"
if (-not (Test-Path $psqlExe)) {
    Write-Host "❌ psql.exe not found at: $psqlExe" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common PostgreSQL locations:" -ForegroundColor Yellow
    Write-Host "  C:\Program Files\PostgreSQL\15\bin" -ForegroundColor White
    Write-Host "  C:\Program Files\PostgreSQL\14\bin" -ForegroundColor White
    Write-Host "  C:\Program Files\PostgreSQL\16\bin" -ForegroundColor White
    Write-Host ""
    Write-Host "Please check your PostgreSQL installation." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Found PostgreSQL at: $PgPath" -ForegroundColor Green
Write-Host ""

# Get password
$DbPassword = Read-Host "Enter database password for user '$DbUser'" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DbPassword)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
$env:PGPASSWORD = $PlainPassword

Write-Host ""

# Get migration directory
$migrationDir = Join-Path $PSScriptRoot "database\migrations"

if (-not (Test-Path $migrationDir)) {
    Write-Host "❌ Migration directory not found: $migrationDir" -ForegroundColor Red
    exit 1
}

# Change to migration directory
Push-Location $migrationDir

Write-Host "Running migrations..." -ForegroundColor Yellow
Write-Host ""

# Run master migration script
& $psqlExe -h $DbHost -p $DbPort -U $DbUser -d $DbName -f "run_all_migrations.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ All migrations completed successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Run verification
    Write-Host "Running verification..." -ForegroundColor Yellow
    $verifyQuery = @"
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tables,
  (SELECT COUNT(*) FROM case_types) as case_types,
  (SELECT COUNT(*) FROM non_program_categories) as non_program_cats,
  (SELECT COUNT(*) FROM currency_rates) as currency_rates,
  (SELECT COUNT(*) FROM system_configurations) as configurations;
"@
    
    & $psqlExe -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $verifyQuery
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "SUCCESS! Migrations Complete" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Review verification output above" -ForegroundColor White
    Write-Host "2. Test database from your application" -ForegroundColor White
    Write-Host "3. Begin API development (Phase 1 Week 2)" -ForegroundColor White
    
} else {
    Write-Host ""
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To rollback, run:" -ForegroundColor Yellow
    Write-Host "  .\run-migrations-simple.ps1 -PgPath `"$PgPath`" -Rollback" -ForegroundColor White
}

# Return to original directory
Pop-Location

# Clear password
$env:PGPASSWORD = ""

Write-Host ""
