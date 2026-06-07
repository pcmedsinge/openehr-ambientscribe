# AmbientScribe — start the full development environment
# Checks Docker, starts EHRbase if needed, uploads template if missing, starts dev server.

Set-StrictMode -Off
$ErrorActionPreference = "Stop"

function Write-Step($msg)  { Write-Host "  $msg" -ForegroundColor Cyan }
function Write-Ok($msg)    { Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-Warn($msg)  { Write-Host "  --  $msg" -ForegroundColor Yellow }
function Write-Fail($msg)  { Write-Host "  ERR $msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "  AmbientScribe — dev start" -ForegroundColor White
Write-Host "  $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor DarkGray
Write-Host ""

# ── 1. Docker running? ──────────────────────────────────────────────────────
Write-Step "Checking Docker..."
try { docker info 2>&1 | Out-Null } catch { Write-Fail "Docker is not running. Start Docker Desktop first." }
Write-Ok "Docker is running"

# ── 2. EHRbase container up? ────────────────────────────────────────────────
Write-Step "Checking EHRbase container..."
$running = docker ps --filter "name=ambientscribe-ehrbase" --filter "status=running" -q 2>$null

if (-not $running) {
    Write-Warn "Container not running — starting docker compose..."
    docker compose up -d 2>&1 | Out-Null

    Write-Step "Waiting for EHRbase to be ready (up to 60s)..."
    $ready = $false
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 3
        try {
            $r = Invoke-WebRequest `
                -Uri "http://localhost:8086/ehrbase/rest/openehr/v1/definition/template/adl1.4" `
                -Headers @{ Authorization = "Basic ZWhyYmFzZS11c2VyOlN1cGVyU2VjcmV0UGFzc3dvcmQx" } `
                -UseBasicParsing -TimeoutSec 3 2>$null
            if ($r.StatusCode -eq 200) { $ready = $true; break }
        } catch { }
    }
    if (-not $ready) { Write-Fail "EHRbase did not become ready in time. Check: docker logs ambientscribe-ehrbase" }
    Write-Ok "EHRbase is ready"
} else {
    Write-Ok "EHRbase container already running"
}

# ── 3. Template uploaded? ───────────────────────────────────────────────────
Write-Step "Checking template..."
try {
    $r = Invoke-WebRequest `
        -Uri "http://localhost:8086/ehrbase/rest/openehr/v1/definition/template/adl1.4" `
        -Headers @{ Authorization = "Basic ZWhyYmFzZS11c2VyOlN1cGVyU2VjcmV0UGFzc3dvcmQx" } `
        -UseBasicParsing 2>$null
    $templates = $r.Content | ConvertFrom-Json
    $hasTemplate = $templates | Where-Object { $_.template_id -eq "outpatient_encounter" }
} catch { $hasTemplate = $null }

if (-not $hasTemplate) {
    Write-Warn "Template missing — uploading..."
    Push-Location "$PSScriptRoot\scripts"
    npx tsx upload-template.ts ../templates/outpatient_encounter.opt
    Pop-Location
    Write-Ok "Template uploaded"
} else {
    Write-Ok "Template already loaded"
}

# ── 4. Start dev server in a new terminal ───────────────────────────────────
Write-Step "Starting dev server..."
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "cd '$frontendPath'; Write-Host 'AmbientScribe dev server' -ForegroundColor Cyan; npm run dev"

Start-Sleep -Seconds 2
Write-Ok "Dev server started"

Write-Host ""
Write-Host "  http://localhost:5173" -ForegroundColor White
Write-Host ""
