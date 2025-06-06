$body = @{
    email = "manager.a@supplychain.com"
    password = "manager123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type" = "application/json"} -Body $body

Write-Host "Token: $($response.access_token)"
Write-Host "User ID: $($response.user.id)"

# Save token to file for later use
$response.access_token | Out-File -FilePath "token.txt"
