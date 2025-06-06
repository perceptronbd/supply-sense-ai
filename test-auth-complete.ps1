# Comprehensive Authentication and Role-Based Access Control Test
Write-Host "=== Comprehensive Authentication & RBAC Test ===" -ForegroundColor Cyan

# Test users with different roles
$testUsers = @(
    @{
        email = "admin@supplychain.com"
        password = "password123"
        expectedRole = "SYSTEM_ADMIN"
        description = "System Administrator"
    },
    @{
        email = "manager.a@supplychain.com"
        password = "password123"
        expectedRole = "BRANCH_MANAGER"
        description = "Branch Manager"
    },
    @{
        email = "clerk.b@supplychain.com"
        password = "password123"
        expectedRole = "INVENTORY_CLERK"
        description = "Inventory Clerk"
    }
)

# Test endpoints for each role
$testEndpoints = @(    @{ url = "http://localhost:3000/api/request-form"; name = "Request Forms" },
    @{ url = "http://localhost:3000/api/purchase-order"; name = "Purchase Orders" },
    @{ url = "http://localhost:3000/api/material-requisition"; name = "Material Requisitions" },
    @{ url = "http://localhost:3000/api/manufacturing-list"; name = "Manufacturing Lists" },
    @{ url = "http://localhost:3000/api/formula"; name = "Formulas" },
    @{ url = "http://localhost:3000/api/goods-receipt"; name = "Goods Receipts" }
)

foreach ($user in $testUsers) {
    Write-Host "`n=== Testing $($user.description) ($($user.email)) ===" -ForegroundColor Yellow
    
    # Login test
    try {
        $loginBody = @{
            email = $user.email
            password = $user.password
        } | ConvertTo-Json
        
        $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type" = "application/json"} -Body $loginBody
        
        Write-Host "✅ Login successful" -ForegroundColor Green
        Write-Host "   User ID: $($loginResponse.user.id)"
        Write-Host "   Role: $($loginResponse.user.role)"
        Write-Host "   Branch: $($loginResponse.user.branch.name)"
        
        # Verify expected role
        if ($loginResponse.user.role -eq $user.expectedRole) {
            Write-Host "✅ Role verification passed" -ForegroundColor Green
        } else {
            Write-Host "❌ Role mismatch! Expected: $($user.expectedRole), Got: $($loginResponse.user.role)" -ForegroundColor Red
        }
        
        # Test authenticated endpoints
        $authHeaders = @{
            "Authorization" = "Bearer $($loginResponse.access_token)"
            "Content-Type" = "application/json"
        }
        
        Write-Host "`n   Testing Endpoint Access:" -ForegroundColor White
        foreach ($endpoint in $testEndpoints) {            try {
                $response = Invoke-RestMethod -Uri $endpoint.url -Headers $authHeaders -ErrorAction Stop
                Write-Host "   [OK] $($endpoint.name): Accessible" -ForegroundColor Green
            } catch {
                $statusCode = $_.Exception.Response.StatusCode.value__
                if ($statusCode -eq 403) {
                    Write-Host "   [BLOCKED] $($endpoint.name): Access Denied (403 - Role restriction)" -ForegroundColor Yellow
                } elseif ($statusCode -eq 401) {
                    Write-Host "   [AUTH FAIL] $($endpoint.name): Authentication Failed (401)" -ForegroundColor Red
                } else {
                    Write-Host "   [ERROR] $($endpoint.name): Error ($statusCode)" -ForegroundColor Magenta
                }
            }
        }
        
    } catch {
        Write-Host "❌ Login failed for $($user.email)" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)"
    }
}

# Test invalid credentials
Write-Host "`n=== Testing Invalid Credentials ===" -ForegroundColor Yellow
try {
    $invalidBody = @{
        email = "invalid@example.com"
        password = "wrongpassword"
    } | ConvertTo-Json
    
    $invalidResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type" = "application/json"} -Body $invalidBody -ErrorAction Stop
    Write-Host "❌ Invalid credentials test failed - should have been rejected" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✅ Invalid credentials properly rejected (401)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unexpected status code: $statusCode" -ForegroundColor Yellow
    }
}

# Test unauthenticated access
Write-Host "`n=== Testing Unauthenticated Access ===" -ForegroundColor Yellow
try {
    $unauthResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/request-form" -ErrorAction Stop
    Write-Host "❌ Unauthenticated access test failed - should have been rejected" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✅ Unauthenticated access properly rejected (401)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unexpected status code: $statusCode" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Authentication & RBAC Test Complete ===" -ForegroundColor Cyan
