# AmbientScribe — stop the development environment
# Kills the dev server on port 5173. Optionally stops Docker containers.
# Usage:
#   .\dev-stop.ps1          — stops dev server, leaves Docker running
#   .\dev-stop.ps1 -Docker  — stops dev server AND Docker containers

param(
    [switch]$Docker
)

Set-StrictMode -Off

function Write-Step($msg) { Write-Host "  $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  --  $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "  AmbientScribe — dev stop" -ForegroundColor White
Write-Host ""

# ── Stop dev server (port 5173) ─────────────────────────────────────────────
Write-Step "Stopping dev server on port 5173..."
try {
    $conn = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Id $conn.OwningProcess -Force
            Write-Ok "Dev server stopped (was PID $($conn.OwningProcess))"
        } else {
            Write-Warn "Process not found for port 5173"
        }
    } else {
        Write-Warn "Dev server was not running"
    }
} catch {
    Write-Warn "Could not stop dev server: $_"
}

# ── Optionally stop Docker ───────────────────────────────────────────────────
if ($Docker) {
    Write-Step "Stopping Docker containers..."
    docker compose down 2>&1 | Out-Null
    Write-Ok "Docker containers stopped"
} else {
    Write-Host "  --  Docker containers left running  (use -Docker flag to stop them)" -ForegroundColor DarkGray
}

Write-Host ""
