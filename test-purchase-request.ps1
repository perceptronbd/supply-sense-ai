# Test Purchase Request Creation

# Get manager token
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type" = "application/json"} -Body '{"email":"manager.a@supplychain.com","password":"manager123"}'
$token = $loginResponse.access_token
$userId = $loginResponse.user.id

Write-Host "✅ Login successful" -ForegroundColor Green
Write-Host "   User: $($loginResponse.user.firstName) $($loginResponse.user.lastName)"
Write-Host "   ID: $userId"
Write-Host "   Role: $($loginResponse.user.role)"
Write-Host "   Branch: $($loginResponse.user.branchId)"
Write-Host "   Token: $($token.Substring(0, 30))..."

# Set headers with token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test GET request to purchase-request
Write-Host "`n--- Testing GET purchase-request ---" -ForegroundColor Yellow
try {
    $getResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/purchase-request" -Method GET -Headers $headers
    Write-Host "✅ GET purchase-request successful" -ForegroundColor Green
    Write-Host "   Found $($getResponse.Count) purchase requests"
} catch {
    $statusCode = $_.Exception.Response.StatusCode
    Write-Host "❌ GET purchase-request failed: $statusCode" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseText = $reader.ReadToEnd()
        Write-Host "   Response: $responseText" -ForegroundColor Red
    }
}

# Read the JSON file
$prData = Get-Content -Path "test-purchase-request.json" -Raw | ConvertFrom-Json
Write-Host "`n--- Purchase Request Data ---" -ForegroundColor Yellow
Write-Host $prData | ConvertTo-Json -Depth 3

# Test POST request to create purchase-request
Write-Host "`n--- Testing POST purchase-request ---" -ForegroundColor Yellow
try {
    $postResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/purchase-request" -Method POST -Headers $headers -Body (ConvertTo-Json $prData -Depth 4)
    Write-Host "✅ Purchase request created successfully" -ForegroundColor Green
    Write-Host "   ID: $($postResponse.id)" -ForegroundColor Green
    Write-Host "   PR Number: $($postResponse.prNumber)" -ForegroundColor Green
    Write-Host "   Status: $($postResponse.status)" -ForegroundColor Green
    Write-Host "   Creator ID: $($postResponse.createdById)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode
    Write-Host "❌ Purchase request creation failed: $statusCode" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseText = $reader.ReadToEnd()
        Write-Host "   Response: $responseText" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
