# ================================================
# API Import Script - AWYAD MES
# ================================================
# Imports demo data via REST API for testing automation

param(
    [string]$BaseUrl = "http://localhost:3001/api/v1",
    [string]$Email = "admin@awyad.org",
    [string]$Password = "!23@M&ETool"
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AWYAD MES - API Data Import" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Login and get token
Write-Host "🔐 Logging in..." -ForegroundColor Yellow
try {
    $loginBody = @{
        emailOrUsername = $Email
        password = $Password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody

    $token = $loginResponse.data.accessToken
    $headers = @{
        Authorization = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    Write-Host "✅ Logged in as: $($loginResponse.data.user.email)`n" -ForegroundColor Green
}
catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Function to create entity
function Create-Entity {
    param($Endpoint, $Data, $Name)
    
    try {
        $body = $Data | ConvertTo-Json -Depth 10
        $response = Invoke-RestMethod -Uri "$BaseUrl/$Endpoint" `
            -Method POST `
            -Headers $headers `
            -Body $body
        
        Write-Host "  + Created: $Name" -ForegroundColor Green
        return $response.data
    }
    catch {
        Write-Host "  x Failed to create $Name : $_" -ForegroundColor Red
        return $null
    }
}

# ================================================
# Create Thematic Areas
# ================================================
Write-Host "📁 Creating Thematic Areas..." -ForegroundColor Cyan

$ta1 = Create-Entity "thematic-areas" @{
    code = "RESULT 2"
    name = "Local partners effectively respond to GBV and prot..."
    description = "Local partners effectively respond to GBV and protection risks among new arrivals appropriate to their age, gender, and disability."
} "GBV Thematic Area"

$ta2 = Create-Entity "thematic-areas" @{
    code = "RESULT 3"
    name = "Local partners effectively respond to Child Protec..."
    description = "Local partners effectively respond to Child Protection risks among new arrivals appropriate to their age, gender, and disability"
} "Child Protection Thematic Area"

if (-not $ta1 -or -not $ta2) {
    Write-Host "`n⚠️  Some thematic areas failed to create" -ForegroundColor Yellow
}

Write-Host ""

# ================================================
# Create Projects
# ================================================
Write-Host "📊 Creating Projects..." -ForegroundColor Cyan

$prj1 = Create-Entity "projects" @{
    name = "GBV Response and Protection"
    code = "PRJ-001"
    donor = "UNFPA"
    thematicAreaId = $ta1.id
    status = "active"
    startDate = "2024-01-15"
    endDate = "2025-12-31"
    budget = 500000
    locations = @("Nakivale", "Kampala", "Nyakabande")
} "GBV Project"

$prj2 = Create-Entity "projects" @{
    name = "Child Protection Program"
    code = "PRJ-002"
    donor = "UNICEF"
    thematicAreaId = $ta2.id
    status = "active"
    startDate = "2024-03-01"
    endDate = "2026-02-28"
    budget = 420000
    locations = @("Nakivale", "Kampala")
} "Child Protection Project"

if (-not $prj1 -or -not $prj2) {
    Write-Host "`n⚠️  Some projects failed to create" -ForegroundColor Yellow
}

Write-Host ""

# ================================================
# Create Indicators
# ================================================
Write-Host "📈 Creating Indicators..." -ForegroundColor Cyan

$indicators = @(
    @{
        code = "I.2.1"
        name = "Number of survivors who receive an appropriate response to GBV"
        thematicAreaId = $ta1.id
        indicatorType = "outcome"
        baseline = 0
        baselineDate = "2024-01-01"
        lopTarget = 550
        annualTarget = 550
        unit = "Individuals"
        q1Target = 137; q2Target = 137; q3Target = 137; q4Target = 137
        projectId = $prj1.id
    },
    @{
        code = "I.2.2"
        name = "Number of participants showing increased knowledge on protection"
        thematicAreaId = $ta1.id
        indicatorType = "outcome"
        baseline = 0
        baselineDate = "2024-01-01"
        lopTarget = 130
        annualTarget = 130
        unit = "Individuals"
        q1Target = 32; q2Target = 32; q3Target = 32; q4Target = 32
        projectId = $prj1.id
    },
    @{
        code = "I.3.1"
        name = "Number of children provided with child protection case management"
        thematicAreaId = $ta2.id
        indicatorType = "outcome"
        baseline = 0
        baselineDate = "2024-01-01"
        lopTarget = 1000
        annualTarget = 1000
        unit = "Individuals"
        q1Target = 250; q2Target = 250; q3Target = 250; q4Target = 250
        projectId = $prj2.id
    }
)

$createdIndicators = @()
foreach ($ind in $indicators) {
    $created = Create-Entity "indicators" $ind "Indicator $($ind.code)"
    if ($created) {
        $createdIndicators += $created
    }
}

Write-Host ""

# ================================================
# Create Activities
# ================================================
Write-Host "📋 Creating Activities..." -ForegroundColor Cyan

if ($createdIndicators.Count -gt 0) {
    $act1 = Create-Entity "activities" @{
        activityCode = "3.2.2"
        name = "Conduct community conversations on GBV prevention"
        indicatorId = $createdIndicators[0].id
        projectId = $prj1.id
        target = 700
        achieved = 567
        status = "completed"
        activityDate = "2024-11-15"
        location = "Nakivale, Kampala"
        reportedBy = "Community Mobilizer"
        approvalStatus = "approved"
        budget = 42000
        expenditure = 34020
    } "GBV Community Conversations"

    $act2 = Create-Entity "activities" @{
        activityCode = "4.1.1"
        name = "Conduct child protection case assessments"
        indicatorId = $createdIndicators[2].id
        projectId = $prj2.id
        target = 1000
        achieved = 756
        status = "in_progress"
        activityDate = "2024-10-20"
        location = "Nakivale, Kampala"
        reportedBy = "Case Manager"
        approvalStatus = "approved"
        budget = 50000
        expenditure = 37800
    } "Child Protection Assessments"
}

Write-Host ""

# ================================================
# Create Cases
# ================================================
Write-Host "📝 Creating Cases..." -ForegroundColor Cyan

$case1 = Create-Entity "cases" @{
    caseNumber = "GBV-NK-2025-001"
    caseType = "sexual_assault"
    projectId = $prj1.id
    dateReported = "2025-01-10"
    followUpDate = "2025-02-15"
    status = "active"
    location = "Nakivale"
    beneficiaryGender = "female"
    beneficiaryAge = 28
    nationality = "Sudanese"
    caseWorker = "Jane Doe"
    servicesProvided = @("Psychosocial Support", "Medical Care", "Legal Aid")
} "GBV Case 001"

$case2 = Create-Entity "cases" @{
    caseNumber = "CP-NK-2025-003"
    caseType = "child_abuse"
    projectId = $prj2.id
    dateReported = "2025-01-08"
    followUpDate = "2025-02-10"
    status = "active"
    location = "Nakivale"
    beneficiaryGender = "male"
    beneficiaryAge = 12
    nationality = "South Sudanese"
    caseWorker = "Sarah Johnson"
    servicesProvided = @("Case Management", "Family Reunification")
} "CP Case 003"

Write-Host ""

# ================================================
# Summary
# ================================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✨ Import Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  • Thematic Areas: Created" -ForegroundColor Yellow
Write-Host "  • Projects: Created" -ForegroundColor Yellow
Write-Host "  • Indicators: $($createdIndicators.Count) created" -ForegroundColor Yellow
Write-Host "  • Activities: Created" -ForegroundColor Yellow
Write-Host "  • Cases: Created" -ForegroundColor Yellow
Write-Host "`n  >> View at: http://localhost:3001`n" -ForegroundColor Cyan
