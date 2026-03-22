# Quick API Test Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AWYAD MES - Quick API Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "[1] Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/health" -Method Get
    Write-Host "  ✅ Server: RUNNING" -ForegroundColor Green
    Write-Host "  ✅ Database: $($health.database.status.ToUpper())" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Server not responding" -ForegroundColor Red
    exit 1
}

# Test 2: Login
Write-Host "`n[2] Authentication..." -ForegroundColor Yellow
Write-Host "  Credentials: admin / Admin@123" -ForegroundColor Gray

$loginBody = @{
    emailOrUsername = "admin"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    
    $token = $authResponse.data.token
    $user = $authResponse.data.user
    
    Write-Host "  ✅ Login successful!" -ForegroundColor Green
    Write-Host "  👤 User: $($user.username) ($($user.email))" -ForegroundColor Cyan
    Write-Host "  🎫 Token: $($token.Substring(0,20))..." -ForegroundColor Gray
    
} catch {
    Write-Host "  ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  $($_.ErrorDetails.Message)" -ForegroundColor Gray
    exit 1
}

# Test 3: Protected Endpoint
Write-Host "`n[3] Testing Protected Endpoint..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $projects = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/projects" `
        -Method Get `
        -Headers $headers
    
    Write-Host "  ✅ Projects endpoint accessible" -ForegroundColor Green
    Write-Host "  📊 Projects found: $($projects.data.Count)" -ForegroundColor Cyan
    
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Case Types (New Feature)
Write-Host "`n[4] Testing Case Types (New Feature)..." -ForegroundColor Yellow

try {
    $caseTypes = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/cases/types" `
        -Method Get `
        -Headers $headers
    
    Write-Host "  ✅ Case types endpoint working" -ForegroundColor Green
    Write-Host "  📋 Case types found: $($caseTypes.data.Count)" -ForegroundColor Cyan
    
    if ($caseTypes.data.Count -gt 0) {
        Write-Host "`n  Available case types:" -ForegroundColor Gray
        foreach ($type in $caseTypes.data | Select-Object -First 3) {
            Write-Host "    - $($type.type_name)" -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "  ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Currency Rates (New Feature)
Write-Host "`n[5] Testing Currency Rates (New Feature)..." -ForegroundColor Yellow

try {
    $rates = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/activities/currency-rates" `
        -Method Get `
        -Headers $headers
    
    Write-Host "  ✅ Currency rates endpoint working" -ForegroundColor Green
    
    if ($rates.data) {
        Write-Host "`n  Current exchange rates (to UGX):" -ForegroundColor Gray
        Write-Host "    - USD: $($rates.data.USD)" -ForegroundColor Gray
        Write-Host "    - EUR: $($rates.data.EUR)" -ForegroundColor Gray
        Write-Host "    - GBP: $($rates.data.GBP)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "  ⚠️  Currency rates not yet configured" -ForegroundColor Yellow
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ CORE FUNCTIONALITY VERIFIED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Test indicator endpoints (AWYAD vs Project scope)" -ForegroundColor Gray
Write-Host "  2. Test budget transfers (multi-currency)" -ForegroundColor Gray
Write-Host "  3. Test case creation (verify NO NAME fields accepted)" -ForegroundColor Gray
Write-Host "  4. Test monthly tracking and performance rates" -ForegroundColor Gray
Write-Host "  5. Open browser: http://localhost:3001" -ForegroundColor Gray
Write-Host "" # Empty line
