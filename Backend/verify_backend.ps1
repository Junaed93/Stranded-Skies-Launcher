$ErrorActionPreference = "Stop"

# Wait for server to be ready
Write-Host "Waiting for server to start on port 8080..."
$retries = 30
while ($retries -gt 0) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("localhost", 8080)
        $tcp.Close()
        Write-Host "Server is up!"
        break
    } catch {
        Start-Sleep -Seconds 2
        $retries--
        Write-Host "." -NoNewline
    }
}

if ($retries -eq 0) {
    Write-Error "Server failed to start in time."
    exit 1
}

# 1. Guest Login
Write-Host "`nAttempting Guest Login..."
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/auth/guest" -Method Post
    $token = $loginResponse.token
    if (-not $token) { throw "No token received" }
    Write-Host "Success! Token: $token"
} catch {
    Write-Error "Login failed: $_"
    exit 1
}

# 2. Submit Score
Write-Host "`nSubmitting Score..."
try {
    $headers = @{ Authorization = "Bearer $token" }
    $body = @{
        finalScore = 12345
        gameMode = "TestMode"
        timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/scores" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "Score submitted successfully."
} catch {
    Write-Error "Score submission failed: $_"
    exit 1
}

# 3. Check Leaderboard
Write-Host "`nChecking Leaderboard..."
try {
    $leaderboard = Invoke-RestMethod -Uri "http://localhost:8080/api/leaderboard" -Method Get
    $entry = $leaderboard | Where-Object { $_.score -eq 12345 }
    if ($entry) {
        Write-Host "Success! Found entry on leaderboard: $($entry | ConvertTo-Json -Depth 1)"
    } else {
        Write-Error "Score not found in leaderboard."
        Write-Host "Current Leaderboard: $($leaderboard | ConvertTo-Json)"
        exit 1
    }
} catch {
    Write-Error "Leaderboard check failed: $_"
    exit 1
}

Write-Host "`nAll verification steps passed!"
