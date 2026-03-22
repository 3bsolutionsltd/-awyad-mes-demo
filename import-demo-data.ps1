# ================================================
# API Import Script - AWYAD MES
# ================================================
# Imports demo data via REST API

param(
    [string]$BaseUrl = "http://localhost:3001/api/v1",
    [string]$Email = "admin@awyad.org",
    [string]$Password = "!23@M&ETool"
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AWYAD MES - API Data Import" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Login
Write-Host ">> Logging in..." -ForegroundColor Yellow
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
    
    Write-Host ">> Logged in as: $($loginResponse.data.user.email)`n" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Login failed - $_" -ForegroundColor Red
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
        
        Write-Host "  [+] Created: $Name" -ForegroundColor Green
        return $response.data
    }
    catch {
        Write-Host "  [X] Failed: $Name - $_" -ForegroundColor Red
        return $null
    }
}

# Create Thematic Areas
Write-Host "Creating Thematic Areas..." -ForegroundColor Cyan

$ta1 = Create-Entity "thematic-areas" @{
    code = "RESULT 2"
    name = "GBV and Protection Response"
    description = "Local partners effectively respond to GBV and protection risks among new arrivals"
} "GBV Thematic Area"

$ta2 = Create-Entity "thematic-areas" @{
    code = "RESULT 3"
    name = "Child Protection Response"
    description = "Local partners effectively respond to Child Protection risks among new arrivals"
} "Child Protection Thematic Area"

Write-Host ""

# Create Projects
Write-Host "Creating Projects..." -ForegroundColor Cyan

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

Write-Host ""

# Create Indicators
Write-Host "Creating Indicators..." -ForegroundColor Cyan

$ind1 = Create-Entity "indicators" @{
    code = "I.2.1"
    name = "Number of survivors who receive appropriate GBV response"
    thematicAreaId = $ta1.id
    indicatorType = "outcome"
    baseline = 0
    baselineDate = "2024-01-01"
    lopTarget = 550
    annualTarget = 550
    unit = "Individuals"
    q1Target = 137; q2Target = 137; q3Target = 137; q4Target = 137
    projectId = $prj1.id
} "GBV Indicator 1"

$ind2 = Create-Entity "indicators" @{
    code = "I.2.2"
    name = "Number of participants with increased protection knowledge"
    thematicAreaId = $ta1.id
    indicatorType = "outcome"
    baseline = 0
    baselineDate = "2024-01-01"
    lopTarget = 130
    annualTarget = 130
    unit = "Individuals"
    q1Target = 32; q2Target = 32; q3Target = 32; q4Target = 32
    projectId = $prj1.id
} "GBV Indicator 2"

$ind3 = Create-Entity "indicators" @{
    code = "I.3.1"
    name = "Number of children receiving case management services"
    thematicAreaId = $ta2.id
    indicatorType = "outcome"
    baseline = 0
    baselineDate = "2024-01-01"
    lopTarget = 1000
    annualTarget = 1000
    unit = "Individuals"
    q1Target = 250; q2Target = 250; q3Target = 250; q4Target = 250
    projectId = $prj2.id
} "CP Indicator 1"

Write-Host ""

# Create Activities
Write-Host "Creating Activities..." -ForegroundColor Cyan

if ($ind1) {
    Create-Entity "activities" @{
        activityCode = "3.2.2"
        name = "Community conversations on GBV prevention"
        indicatorId = $ind1.id
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
    } "GBV Activity" | Out-Null
}

if ($ind3) {
    Create-Entity "activities" @{
        activityCode = "4.1.1"
        name = "Child protection case assessments"
        indicatorId = $ind3.id
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
    } "CP Activity" | Out-Null
}

Write-Host ""

# Create Cases
Write-Host "Creating Cases..." -ForegroundColor Cyan

Create-Entity "cases" @{
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
} "GBV Case" | Out-Null

Create-Entity "cases" @{
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
} "CP Case" | Out-Null

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ">> Import Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  View at: http://localhost:3001`n" -ForegroundColor Yellow
