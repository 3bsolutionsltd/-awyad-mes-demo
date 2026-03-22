# AWYAD MES System - Setup Script
# Automates the complete setup process

Write-Host "================================" -ForegroundColor Cyan
Write-Host "AWYAD MES System Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js not found! Please install Node.js v18 or higher." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green

# Check npm version
Write-Host "Checking npm version..." -ForegroundColor Yellow
$npmVersion = npm --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ npm version: $npmVersion" -ForegroundColor Green
Write-Host ""

# Create necessary directories
Write-Host "Creating directory structure..." -ForegroundColor Yellow
$directories = @("public", "data", "logs")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✓ Created $dir/" -ForegroundColor Green
    } else {
        Write-Host "✓ $dir/ already exists" -ForegroundColor Green
    }
}
Write-Host ""

# Copy environment file if it doesn't exist
Write-Host "Setting up environment..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ Created .env file" -ForegroundColor Green
    } else {
        Write-Host "⚠ .env.example not found, using defaults" -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ .env already exists" -ForegroundColor Green
}
Write-Host ""

# Copy mockData to data directory if needed
Write-Host "Checking data files..." -ForegroundColor Yellow
if (Test-Path "mockData.js") {
    if (-not (Test-Path "data\mockData.js")) {
        Copy-Item "mockData.js" "data\mockData.js"
        Write-Host "✓ Copied mockData.js to data/" -ForegroundColor Green
    } else {
        Write-Host "✓ data/mockData.js already exists" -ForegroundColor Green
    }
} else {
    Write-Host "⚠ mockData.js not found in root" -ForegroundColor Yellow
}
Write-Host ""

# Install dependencies
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Installing Dependencies" -ForegroundColor Cyan
Write-Host "This may take 2-3 minutes..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================" -ForegroundColor Green
    Write-Host "✓ Setup Complete!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "To start the server:" -ForegroundColor Cyan
    Write-Host "  npm run dev" -ForegroundColor Yellow
    Write-Host "  (or npm start for production)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Then open:" -ForegroundColor Cyan
    Write-Host "  http://localhost:3000" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Documentation:" -ForegroundColor Cyan
    Write-Host "  - Quick Start: QUICKSTART.md" -ForegroundColor Yellow
    Write-Host "  - Full Docs:   README_NEW.md" -ForegroundColor Yellow
    Write-Host "  - Migration:   MIGRATION_GUIDE.md" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "================================" -ForegroundColor Red
    Write-Host "❌ Setup Failed" -ForegroundColor Red
    Write-Host "================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Delete node_modules and package-lock.json" -ForegroundColor Gray
    Write-Host "2. Run: npm cache clean --force" -ForegroundColor Gray
    Write-Host "3. Run: npm install again" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
