# MedSysVE - Inject env vars into Coolify app + redeploy
#
# Usage:
#   1. Run scripts/generate-secrets.ps1 first, copy the 3 keys you got
#   2. Paste your keys in the $keys block below
#   3. Run: powershell -ExecutionPolicy Bypass -File scripts\inject-secrets.ps1

$ErrorActionPreference = "Stop"

# PASTE YOUR 3 KEYS HERE (the 3 you generated with generate-secrets.ps1)
$keys = [ordered]@{
    "FIELD_ENCRYPTION_KEY"  = "PASTE_FIELD_ENCRYPTION_KEY_HERE"
    "FIELD_HMAC_KEY"        = "PASTE_FIELD_HMAC_KEY_HERE"
    "BACKUP_ENCRYPTION_KEY" = "PASTE_BACKUP_ENCRYPTION_KEY_HERE"
}

# SSH connection to VPS
$VPS_HOST = "13.140.181.29"
$VPS_USER = "root"
$APP_DIR  = "/data/coolify/applications/hze8mocuh4xqskqwrm3mx50b"
$CONTAINER = "hze8mocuh4xqskqwrm3mx50b-123048882354"

# Optional: Coolify API token for triggering deploys via REST.
# Leave empty if you'll trigger deploys from the UI or via push.
# Get yours from: Coolify dashboard -> Keys & Tokens -> API tokens
$COOLIFY_API_TOKEN = ""

# Validate that all keys are filled
$missing = @()
foreach ($k in $keys.Keys) {
    if ($keys[$k] -eq "PASTE_$($k.ToUpper())_HERE" -or [string]::IsNullOrWhiteSpace($keys[$k])) {
        $missing += $k
    }
}
if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "ERROR: Faltan las siguientes claves:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Edita el script y pega tus claves en la seccion keys block." -ForegroundColor Yellow
    exit 1
}

# Helper: run a command on the VPS via SSH, returns [stdout, exitcode]
function Invoke-SSH {
    param([string]$Command)
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "ssh"
    # Use -tt to force a pty so the remote side runs non-interactively.
    $psi.Arguments = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL $VPS_USER@$VPS_HOST -- $Command"
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $p = [System.Diagnostics.Process]::Start($psi)
    $stdout = $p.StandardOutput.ReadToEnd()
    $stderr = $p.StandardError.ReadToEnd()
    $p.WaitForExit()
    return @{
        stdout = $stdout
        stderr = $stderr
        exitcode = $p.ExitCode
    }
}

# Test SSH connection
Write-Host ""
Write-Host "Conectando a $VPS_USER@$VPS_HOST..." -ForegroundColor Cyan
$test = Invoke-SSH "echo ok"
if ($test.exitcode -ne 0) {
    Write-Host "ERROR: No se pudo conectar al VPS via SSH." -ForegroundColor Red
    Write-Host "stderr: $($test.stderr)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Necesitas tener una SSH key configurada:" -ForegroundColor Yellow
    Write-Host "  ssh-keygen -t ed25519" -ForegroundColor Yellow
    Write-Host "  ssh-copy-id $VPS_USER@$VPS_HOST" -ForegroundColor Yellow
    exit 1
}
Write-Host "  OK" -ForegroundColor Green

# 1. Backup existing .env
Write-Host ""
Write-Host "[1/5] Backup del .env actual..." -ForegroundColor Cyan
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$backupResult = Invoke-SSH "cp $APP_DIR/.env $APP_DIR/.env.backup-$ts && echo done"
if ($backupResult.exitcode -ne 0) {
    Write-Host "ERROR: $($backupResult.stderr)" -ForegroundColor Red
    exit 1
}
Write-Host "  Backup: $APP_DIR/.env.backup-$ts" -ForegroundColor Gray

# 2. Build new env lines
Write-Host ""
Write-Host "[2/5] Preparando env vars a inyectar..." -ForegroundColor Cyan
$envLines = ""
foreach ($k in $keys.Keys) {
    $value = $keys[$k].Replace('"', '\"').Replace("'", "'")
    $envLines += "$k=`"$value`"`n"
    Write-Host "  $k  ($($keys[$k].Length) chars)" -ForegroundColor Gray
}

# 3. Inject atomically
Write-Host ""
Write-Host "[3/5] Inyectando en Coolify .env..." -ForegroundColor Cyan
$keyList = ($keys.Keys -join " ")
# Build the heredoc as a single quoted argument that the remote sh will receive.
# We escape $ as `$, ${ as \${
$remoteScript = @"
set -e
ENV_FILE='$APP_DIR/.env'

# Remove existing keys (any quoting style) - idempotent
for KEY in $keyList; do
    sed -i "/^\${KEY}=/d" \$ENV_FILE
done

# Append new keys (heredoc preserves newlines literally)
cat >> \$ENV_FILE <<'ENVEOF'
$envLines
ENVEOF

echo INJECTED
"@

$injectResult = Invoke-SSH $remoteScript
if ($injectResult.exitcode -ne 0) {
    Write-Host "ERROR: $($injectResult.stderr)" -ForegroundColor Red
    Write-Host "stdout: $($injectResult.stdout)" -ForegroundColor Gray
    exit 1
}
Write-Host "  $($injectResult.stdout.Trim())" -ForegroundColor Green

# 4. Verify
Write-Host ""
Write-Host "[4/5] Verificando .env..." -ForegroundColor Cyan
foreach ($k in $keys.Keys) {
    $lineResult = Invoke-SSH "grep -F '$k=' $APP_DIR/.env"
    if ($lineResult.stdout) {
        $val = ($lineResult.stdout -split "=", 2)[1]
        Write-Host "  OK  $k = $($val.Substring(0, [Math]::Min(20, $val.Length)))..." -ForegroundColor Green
    } else {
        Write-Host "  FAIL  $k no encontrado!" -ForegroundColor Red
    }
}

# 5. Trigger redeploy
Write-Host ""
Write-Host "[5/5] Disparando redeploy de Coolify..." -ForegroundColor Cyan
$deployResult = Invoke-SSH "cd $APP_DIR && docker compose up -d 2>&1"
$deployResult.stdout -split "`n" | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Green
Write-Host "  Listo!" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Esperando 30s para que el contenedor arranque..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "Logs del contenedor:" -ForegroundColor Cyan
$logsResult = Invoke-SSH "docker logs $CONTAINER --tail 25 2>&1"
$logsResult.stdout -split "`n" | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  Proximos pasos:" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  1. Anda a https://medsysve.13.140.181.29.sslip.io/login" -ForegroundColor White
Write-Host "  2. Login con tu cuenta de doctor" -ForegroundColor White
Write-Host "  3. Proba abrir una consulta y verificar que carga todo normal" -ForegroundColor White
Write-Host "  4. Si algo falla, los logs anteriores muestran el error" -ForegroundColor White
Write-Host ""
Write-Host "  Si ves 'FIELD_ENCRYPTION_KEY not set' en los logs," -ForegroundColor Yellow
Write-Host "  las env vars no se montaron -- pegalas manualmente en la UI de Coolify." -ForegroundColor Yellow
Write-Host ""