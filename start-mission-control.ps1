# Mission Control — Auto-start script
# Starts Next.js dev server and opens browser
# Called by Windows Task Scheduler on login

$APP_DIR = "C:\Users\samee\.openclaw\workspace\builds\mission-control"
$LOG_FILE = "$APP_DIR\mission-control.log"
$PID_FILE = "$APP_DIR\mission-control.pid"
$PORT = 3000
$URL = "http://localhost:$PORT"

# Kill any existing instance on this port
$existing = Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    $existing | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

# Start Next.js in background
$proc = Start-Process -FilePath "npm" `
    -ArgumentList "run", "dev" `
    -WorkingDirectory $APP_DIR `
    -RedirectStandardOutput $LOG_FILE `
    -RedirectStandardError "$APP_DIR\mission-control-err.log" `
    -WindowStyle Hidden `
    -PassThru

$proc.Id | Out-File $PID_FILE -Encoding ASCII -NoNewline
Write-Host "Mission Control started: PID $($proc.Id)"

# Wait for server to be ready (max 30s)
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-WebRequest -Uri $URL -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
}

# Open browser
if ($ready) {
    Start-Process $URL
    Write-Host "Mission Control ready at $URL"
} else {
    Write-Host "Server may still be starting — opening browser anyway"
    Start-Process $URL
}
