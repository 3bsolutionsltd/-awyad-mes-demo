# AWYAD MES - Database Migration Runner
# Description: Executes all Phase 1 database migrations
# Usage: .\run-migrations.ps1

param(
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbName = "awyad_mes",
    [string]$DbUser = "postgres",
    [switch]$Rollback = $false,
    [switch]$Backup = $true
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "AWYAD MES - Database Migration Runner" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Get database directory
$migrationDir = Join-Path $PSScriptRoot "database\migrations"

if (-not (Test-Path $migrationDir)) {
    Write-Host "❌ Migration directory not found: $migrationDir" -ForegroundColor Red
    exit 1
}

# Check if psql is available
try {
    $psqlVersion = psql --version
    Write-Host "✓ PostgreSQL client found: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL client (psql) not found in PATH" -ForegroundColor Red
    Write-Host "   Please install PostgreSQL or add psql to your PATH" -ForegroundColor Yellow
    exit 1
}

# Prompt for password
$DbPassword = Read-Host "Enter database password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DbPassword)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set environment variable for password
$env:PGPASSWORD = $PlainPassword

Write-Host ""

# Create backup if requested
if ($Backup -and -not $Rollback) {
    Write-Host "Creating database backup..." -ForegroundColor Yellow
    $backupFile = "awyad_mes_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    $backupPath = Join-Path $PSScriptRoot $backupFile
    
    try {
        pg_dump -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $backupPath 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Backup created: $backupFile" -ForegroundColor Green
        } else {
            Write-Host "⚠ Backup failed but continuing..." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠ Could not create backup: $_" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Change to migration directory
Push-Location $migrationDir

if ($Rollback) {
    # Run rollback
    Write-Host "Running rollback script..." -ForegroundColor Yellow
    Write-Host ""
    
    psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f "rollback_all_migrations.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Rollback completed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Rollback failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
} else {
    # Run migrations
    Write-Host "Running all migrations..." -ForegroundColor Yellow
    Write-Host ""
    
    psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f "run_all_migrations.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ All migrations completed successfully!" -ForegroundColor Green
        
        # Run verification queries
        Write-Host ""
        Write-Host "Running verification checks..." -ForegroundColor Yellow
        
        $verifyQuery = @"
SELECT 
    COUNT(*) as total_tables,
    (SELECT COUNT(*) FROM strategies) as strategies,
    (SELECT COUNT(*) FROM pillars) as pillars,
    (SELECT COUNT(*) FROM core_program_components) as components,
    (SELECT COUNT(*) FROM case_types) as case_types,
    (SELECT COUNT(*) FROM non_program_categories) as non_program_cats,
    (SELECT COUNT(*) FROM currency_rates) as currency_rates,
    (SELECT COUNT(*) FROM system_configurations) as configurations
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
"@
        
        psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $verifyQuery
        
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host "Migration Summary" -ForegroundColor Cyan
        Write-Host "=========================================" -ForegroundColor Cyan
        Write-Host "✓ 001 - Strategic Hierarchy" -ForegroundColor Green
        Write-Host "✓ 002 - Project Updates" -ForegroundColor Green
        Write-Host "✓ 003 - Indicator Enhancements" -ForegroundColor Green
        Write-Host "✓ 004 - Activity Enhancements" -ForegroundColor Green
        Write-Host "✓ 005 - Case Management Overhaul" -ForegroundColor Green
        Write-Host "✓ 006 - Monthly Snapshots" -ForegroundColor Green
        Write-Host "✓ 007 - Non-Program Activities" -ForegroundColor Green
        Write-Host "✓ 008 - System Configurations" -ForegroundColor Green
        Write-Host "✓ 009 - Enhanced User Roles" -ForegroundColor Green
        Write-Host "=========================================" -ForegroundColor Cyan
        
    } else {
        Write-Host ""
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        Write-Host "   Check error messages above for details" -ForegroundColor Yellow
        Write-Host "   You can rollback using: .\run-migrations.ps1 -Rollback" -ForegroundColor Yellow
        Pop-Location
        exit 1
    }
}

# Return to original directory
Pop-Location

# Clear password from environment
$env:PGPASSWORD = ""

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the verification output above" -ForegroundColor White
Write-Host "2. Test database connectivity from application" -ForegroundColor White
Write-Host "3. Proceed with API route development (Task 2.1-2.9)" -ForegroundColor White
Write-Host ""
