# Apply Migration 036 - Add Reporting Month to Activities
# This script applies the database migration to add the reporting_month field

Write-Host "Applying Migration 036 - Add Reporting Month to Activities..." -ForegroundColor Cyan
Write-Host ""

# Run the Node.js migration script
node apply-reporting-month-migration.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Migration failed!" -ForegroundColor Red
    exit 1
}

