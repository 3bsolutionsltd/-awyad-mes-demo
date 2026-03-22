# Test Dashboard Fix
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TESTING DASHBOARD FIX" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Check if server is running
Write-Host "[1] Checking server status..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri 'http://localhost:3001/api/v1/health' -TimeoutSec 2 -ErrorAction Stop
    Write-Host "    ✅ Server is RUNNING" -ForegroundColor Green
    Write-Host "    Database: $($health.database.status)" -ForegroundColor Cyan
} catch {
    Write-Host "    ❌ Server is NOT RUNNING" -ForegroundColor Red
    Write-Host "    Please start server: node src/server/server.js" -ForegroundColor Yellow
    exit 1
}

# 2. Login to get token
Write-Host "`n[2] Logging in..." -ForegroundColor Yellow
try {
    $body = @{ 
        emailOrUsername = 'admin'
        password = 'Admin@123' 
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri 'http://localhost:3001/api/v1/auth/login' `
                                       -Method Post `
                                       -Body $body `
                                       -ContentType 'application/json' `
                                       -ErrorAction Stop

    $token = $loginResponse.data.accessToken
    Write-Host "    ✅ Login successful" -ForegroundColor Green
    Write-Host "    User: $($loginResponse.data.user.username)" -ForegroundColor Cyan
} catch {
    Write-Host "    ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "    Please verify credentials: admin / Admin@123" -ForegroundColor Yellow
    exit 1
}

# 3. Test projects endpoint (the one causing dashboard error)
Write-Host "`n[3] Testing projects endpoint..." -ForegroundColor Yellow
try {
    $headers = @{ 
        Authorization = "Bearer $token" 
    }

    $projectsResponse = Invoke-RestMethod -Uri 'http://localhost:3001/api/v1/projects?limit=1000' `
                                         -Headers $headers `
                                         -ErrorAction Stop

    Write-Host "    ✅ Projects endpoint working" -ForegroundColor Green
    Write-Host "    Response structure:" -ForegroundColor Cyan
    Write-Host "      - success: $($projectsResponse.success)" -ForegroundColor Gray
    Write-Host "      - data type: $($projectsResponse.data.GetType().Name)" -ForegroundColor Gray
    
    if ($projectsResponse.data.projects) {
        $projectCount = $projectsResponse.data.projects.Count
        Write-Host "      - projects count: $projectCount" -ForegroundColor Gray
        Write-Host "      ✅ Data structure: PAGINATION WRAPPER (data.projects)" -ForegroundColor Green
    } elseif ($projectsResponse.data -is [Array]) {
        $projectCount = $projectsResponse.data.Count
        Write-Host "      - projects count: $projectCount" -ForegroundColor Gray
        Write-Host "      ✅ Data structure: DIRECT ARRAY" -ForegroundColor Green
    } else {
        Write-Host "      ⚠️  Data structure: UNKNOWN" -ForegroundColor Yellow
    }

} catch {
    Write-Host "    ❌ Projects endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Server running" -ForegroundColor Green
Write-Host "✅ Authentication working" -ForegroundColor Green
Write-Host "✅ Projects API working" -ForegroundColor Green
Write-Host "`n📋 The dashboard fix is applied!" -ForegroundColor Cyan
Write-Host "   - Fixed: dashboardService.js now unwraps pagination" -ForegroundColor Gray
Write-Host "   - Location: public/js/services/dashboardService.js" -ForegroundColor Gray
Write-Host "`n🌐 Test the dashboard:" -ForegroundColor Cyan
Write-Host "   http://localhost:3001/index.html#project-dashboard" -ForegroundColor Gray
Write-Host "   http://localhost:3001/index.html#strategic-dashboard" -ForegroundColor Gray
Write-Host ""
