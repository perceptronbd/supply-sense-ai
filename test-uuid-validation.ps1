# Get actual UUIDs from the database for testing
# This script fetches real IDs from the seeded database

Write-Host "=== Getting UUIDs from Database ===" -ForegroundColor Green

# Login first to get authentication token
Write-Host "`n1. Logging in to get auth token..." -ForegroundColor Cyan
$loginData = @{
    email = "manager.a@supplychain.com"
    password = "manager123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $authToken = $loginResponse.access_token
    $headers = @{
        Authorization = "Bearer $authToken"
        "Content-Type" = "application/json"
    }
    Write-Host "✅ Login successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get Branch IDs
Write-Host "`n2. Getting Branch IDs..." -ForegroundColor Cyan
try {
    # We'll query items endpoint to get branch info indirectly, or use a debug endpoint
    $debugResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/debug-token" -Method GET -Headers $headers
    Write-Host "✅ User branch ID: $($debugResponse.user.branchId)" -ForegroundColor Green
    $branchId = $debugResponse.user.branchId
} catch {
    Write-Host "❌ Error getting branch info: $($_.Exception.Message)" -ForegroundColor Red
}

# Get Item IDs from database (we need to query some endpoint that lists items)
Write-Host "`n3. Getting available Item and Supplier IDs..." -ForegroundColor Cyan
# Since we don't have direct item endpoints, let's output what we know from seed data structure

# Query the database directly to get actual UUIDs
Write-Host "`n4. Querying database for actual UUIDs..." -ForegroundColor Cyan

# We need to create a simple Node.js script to query the database
$nodeScript = @"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getTestUUIDs() {
  try {
    // Get first item
    const item = await prisma.item.findFirst();
    console.log('TEST_ITEM_ID="' + (item ? item.id : 'NO_ITEM_FOUND') + '"');
    
    // Get first supplier
    const supplier = await prisma.supplier.findFirst();
    console.log('TEST_SUPPLIER_ID="' + (supplier ? supplier.id : 'NO_SUPPLIER_FOUND') + '"');
    
    // Get first branch (from the user's branch)
    const branch = await prisma.branch.findFirst();
    console.log('TEST_BRANCH_ID="' + (branch ? branch.id : 'NO_BRANCH_FOUND') + '"');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.`$disconnect();
  }
}

getTestUUIDs();
"@

# Write the script to a temporary file
$tempScript = "get-test-uuids.js"
$nodeScript | Out-File -FilePath $tempScript -Encoding UTF8

# Run the Node.js script from the backend directory
Write-Host "Running database query..." -ForegroundColor Yellow
Push-Location backend
try {
    $dbOutput = node ..\$tempScript 2>&1
    Write-Host "Database query results:" -ForegroundColor Green
    $dbOutput | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
} catch {
    Write-Host "❌ Error running database query: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Pop-Location
}

# Clean up temp script
Remove-Item $tempScript -ErrorAction SilentlyContinue

Write-Host "`n=== UUIDs Retrieved ===" -ForegroundColor Green
Write-Host "Now update the goods-receipt.e2e-spec.ts file with these IDs" -ForegroundColor Yellow
