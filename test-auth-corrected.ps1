# Corrected Authentication Test Script
Write-Host "=== Corrected Authentication Test ===" -ForegroundColor Cyan

# Test users with correct passwords based on auth service logic
$testUsers = @(
    @{
        email = "admin@supplychain.com"
        password = "admin123"
        expectedRole = "SYSTEM_ADMIN"
        description = "System Administrator"
    },
    @{
        email = "manager.a@supplychain.com"
        password = "manager123"
        expectedRole = "BRANCH_MANAGER"
        description = "Branch Manager"
    },
    @{
        email = "clerk.b@supplychain.com"
        password = "user123"
        expectedRole = "INVENTORY_CLERK"
        description = "Inventory Clerk"
    }
)

# Test invalid credentials
$invalidCredentials = @(
    @{ email = "admin@supplychain.com"; password = "wrongpassword"; description = "Admin with wrong password" },
    @{ email = "nonexistent@supplychain.com"; password = "admin123"; description = "Non-existent user" }
)

Write-Host "`n=== Testing Valid Login Attempts ===" -ForegroundColor Green

foreach ($user in $testUsers) {
    Write-Host "`n--- Testing $($user.description) ---" -ForegroundColor Yellow
    
    try {
        $loginBody = @{
            email = $user.email
            password = $user.password
        } | ConvertTo-Json
        
        $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type" = "application/json"} -Body $loginBody
        
        Write-Host "✅ Login successful" -ForegroundColor Green
        Write-Host "   Email: $($loginResponse.user.email)"
        Write-Host "   Role: $($loginResponse.user.role)"
        Write-Host "   Name: $($loginResponse.user.firstName) $($loginResponse.user.lastName)"
        Write-Host "   Active: $($loginResponse.user.isActive)"
        Write-Host "   Token: $($loginResponse.access_token.Substring(0, 30))..."
        
        # Test token validation by making a protected request
        $headers = @{
            "Authorization" = "Bearer $($loginResponse.access_token)"
            "Content-Type" = "application/json"
        }
        
        Write-Host "`n   Testing protected endpoint access..." -ForegroundColor Cyan
        try {
            $protectedResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/purchase-request" -Method GET -Headers $headers
            Write-Host "   ✅ Protected endpoint accessible" -ForegroundColor Green
            Write-Host "   Response: $($protectedResponse.GetType().Name)"
        }
        catch {
            $statusCode = $_.Exception.Response.StatusCode
            Write-Host "   ❌ Protected endpoint failed: $statusCode" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)"
        }
        
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "❌ Login failed: $statusCode" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)"
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseText = $reader.ReadToEnd()
            Write-Host "   Response: $responseText"
        }
    }
}

Write-Host "`n=== Testing Invalid Login Attempts ===" -ForegroundColor Red

foreach ($invalid in $invalidCredentials) {
    Write-Host "`n--- Testing $($invalid.description) ---" -ForegroundColor Yellow
    
    try {
        $loginBody = @{
            email = $invalid.email
            password = $invalid.password
        } | ConvertTo-Json
        
        $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type" = "application/json"} -Body $loginBody
        Write-Host "❌ Unexpected success - should have failed!" -ForegroundColor Red
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode
        if ($statusCode -eq 401) {
            Write-Host "✅ Correctly rejected invalid credentials: $statusCode" -ForegroundColor Green
        } else {
            Write-Host "❌ Unexpected error code: $statusCode" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== Authentication Test Complete ===" -ForegroundColor Cyan
