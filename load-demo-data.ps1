# ================================================
# Load Demo Data - AWYAD MES
# ================================================
# This script loads the demo data seed file into PostgreSQL

param(
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbName = "awyad_mes",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "postgres"
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AWYAD MES - Load Demo Data" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Set PostgreSQL password environment variable
$env:PGPASSWORD = $DbPassword

$seedFile = "database\seeds\002_demo_data.sql"

if (-not (Test-Path $seedFile)) {
    Write-Host "❌ Error: Seed file not found: $seedFile" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Database: $DbName@$DbHost" -ForegroundColor Yellow
Write-Host "📁 Seed File: $seedFile" -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "🔄 Loading demo data..." -ForegroundColor Green
    
    # Execute the seed file
    $result = psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $seedFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Demo data loaded successfully!`n" -ForegroundColor Green
        
        # Show summary
        Write-Host "📈 Summary:" -ForegroundColor Cyan
        $summary = psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -c "
            SELECT '  • ' || entity || ': ' || count::text 
            FROM (
                SELECT 'Thematic Areas' as entity, COUNT(*) as count FROM thematic_areas WHERE id > 1
                UNION ALL SELECT 'Projects', COUNT(*) FROM projects WHERE id > 0
                UNION ALL SELECT 'Indicators', COUNT(*) FROM indicators WHERE id > 0
                UNION ALL SELECT 'Activities', COUNT(*) FROM activities WHERE id > 0
                UNION ALL SELECT 'Cases', COUNT(*) FROM cases WHERE id > 0
            ) summary
            ORDER BY entity;
        " 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host $summary
        }
        
        Write-Host "`n✨ All demo data is now available in the system!" -ForegroundColor Green
        Write-Host "   Login to http://localhost:3001 to explore the data`n" -ForegroundColor Yellow
    }
    else {
        Write-Host "❌ Error loading data:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
finally {
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
