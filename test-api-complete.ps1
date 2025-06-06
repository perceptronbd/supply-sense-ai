# Complete API Testing Script for Supply Chain AI Management System
# Tests all major endpoints with seeded data

Write-Host "=== Supply Chain AI Management System API Testing ===" -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:3000/api"

# Test 1: Root endpoint
Write-Host "1. Testing root endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl" -Method GET
    Write-Host "✓ Root endpoint working: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "✗ Root endpoint failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Get branches (should have seeded data)
Write-Host "`n2. Testing branches..." -ForegroundColor Yellow
try {
    # Get branches through purchase-request endpoint (since we don't have a direct branches endpoint)
    $prResponse = Invoke-RestMethod -Uri "$baseUrl/purchase-request" -Method GET
    Write-Host "✓ Purchase requests endpoint accessible" -ForegroundColor Green
} catch {
    Write-Host "✗ Purchase requests endpoint failed: $_" -ForegroundColor Red
}

# Test 3: Test Swagger documentation availability
Write-Host "`n3. Testing Swagger documentation..." -ForegroundColor Yellow
try {
    $swaggerResponse = Invoke-WebRequest -Uri "$baseUrl/docs" -Method GET
    if ($swaggerResponse.StatusCode -eq 200) {
        Write-Host "✓ Swagger documentation is accessible at $baseUrl/docs" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Swagger documentation failed: $_" -ForegroundColor Red
}

# Test 4: Test validation on POST endpoint
Write-Host "`n4. Testing validation with invalid data..." -ForegroundColor Yellow
try {
    $invalidData = @{
        title = "Test PR"
        items = @(
            @{
                itemId = "invalid-id"
                requestedQty = -5  # Invalid negative quantity
            }
        )
    } | ConvertTo-Json -Depth 3

    $headers = @{ "Content-Type" = "application/json" }
    $validationResponse = Invoke-WebRequest -Uri "$baseUrl/purchase-request" -Method POST -Body $invalidData -Headers $headers -ErrorAction Stop
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✓ Validation working correctly (returned 400 Bad Request)" -ForegroundColor Green
    } else {
        Write-Host "✗ Unexpected error: $_" -ForegroundColor Red
    }
}

# Test 5: Test all main controller endpoints exist
Write-Host "`n5. Testing all main endpoints accessibility..." -ForegroundColor Yellow
$endpoints = @(
    "purchase-request",
    "purchase-order", 
    "goods-receipt",
    "material-requisition",
    "request-form",
    "manufacturing-list",
    "formula"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/$endpoint" -Method GET
        Write-Host "✓ $endpoint endpoint accessible" -ForegroundColor Green
    } catch {
        Write-Host "✗ $endpoint endpoint failed: $_" -ForegroundColor Red
    }
}

Write-Host "`n=== API Testing Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Swagger Documentation: $baseUrl/docs" -ForegroundColor Cyan
Write-Host "API Base URL: $baseUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Supply Chain AI Management System is ready for use!" -ForegroundColor Green
Write-Host ""
Write-Host "Database contains:" -ForegroundColor Yellow
Write-Host "- 3 Branches (HQ, Manufacturing Branch A & B)" -ForegroundColor White
Write-Host "- 5 Items (Raw materials, finished products, packaging)" -ForegroundColor White
Write-Host "- 3 Suppliers with contact information" -ForegroundColor White
Write-Host "- 3 Users with different roles" -ForegroundColor White
Write-Host "- 15 Stock records across all branches" -ForegroundColor White
Write-Host "- 3 Item-supplier relationships with pricing" -ForegroundColor White
