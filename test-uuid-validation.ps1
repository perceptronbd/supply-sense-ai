# Test API with UUID validation
# First, let's get some data from a known endpoint

Write-Host "=== Testing API UUID Validation ===" -ForegroundColor Green

# Test 1: Get all purchase requests (should be empty but validate endpoint)
Write-Host "`n1. Testing GET /api/purchase-request..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/purchase-request" -Method GET
    Write-Host "✅ Purchase Request endpoint works. Count: $($response.Count)" -ForegroundColor Green
    if ($response.Count -gt 0) {
        Write-Host "Sample ID: $($response[0].id)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Try to create a purchase request with invalid UUID (should fail)
Write-Host "`n2. Testing POST with invalid UUID (should fail)..." -ForegroundColor Cyan
$invalidData = @{
    title = "Test PR"
    description = "Test purchase request"
    requiredDate = "2025-06-15"
    branchId = "invalid-uuid"  # This should fail UUID validation
    items = @(
        @{
            itemId = "also-invalid"
            requestedQty = 10.5
            estimatedPrice = 25.00
            requiredDate = "2025-06-15"
        }
    )
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/purchase-request" -Method POST -Body $invalidData -ContentType "application/json"
    Write-Host "❌ This should have failed but didn't!" -ForegroundColor Red
} catch {
    Write-Host "✅ Correctly rejected invalid UUID: $($_.Exception.Message)" -ForegroundColor Green
}

# Test 3: Try with valid UUID format (should work if IDs exist)
Write-Host "`n3. Testing POST with valid UUID format..." -ForegroundColor Cyan
$validData = @{
    title = "Test PR with Valid UUIDs"
    description = "Test purchase request with proper UUID format"
    requiredDate = "2025-06-15"
    branchId = "550e8400-e29b-41d4-a716-446655440001"  # Valid UUID format
    items = @(
        @{
            itemId = "550e8400-e29b-41d4-a716-446655440002"
            requestedQty = 10.5
            estimatedPrice = 25.00
            requiredDate = "2025-06-15"
        }
    )
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/purchase-request" -Method POST -Body $validData -ContentType "application/json"
    Write-Host "✅ Created PR successfully: $($response.id)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Failed (expected - these UUIDs don't exist): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n=== Test completed ===" -ForegroundColor Green
