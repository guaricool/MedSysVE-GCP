# MedSysVE — Generador de claves secretas
# Ejecutar en PowerShell: .\scripts\generate-secrets.ps1
#
# Genera las 3 claves criptográficas que necesita MedSysVE en producción:
#   1. FIELD_ENCRYPTION_KEY    (32 bytes, AES-256-GCM) — cifra cédulas, RIF, anamnesis, plan
#   2. FIELD_HMAC_KEY          (32 bytes, HMAC-SHA-256) — búsqueda encriptada de cédulas
#   3. BACKUP_ENCRYPTION_KEY   (32 bytes, AES-256-GCM) — cifra los backups de Postgres
#
# + También rota NEXTAUTH_SECRET y CRON_SECRET.

$ErrorActionPreference = "Stop"
$bytes = 32

function New-Secret([int]$n) {
    $buf = New-Object byte[] $n
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($buf)
    $rng.Dispose()
    return [Convert]::ToBase64String($buf)
}

function New-HexSecret([int]$n) {
    $buf = New-Object byte[] $n
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($buf)
    $rng.Dispose()
    $hex = ""
    foreach ($b in $buf) { $hex += "{0:x2}" -f $b }
    return $hex
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  MedSysVE — Generador de claves secretas" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "  • Guarda cada clave en un lugar seguro (gestor de passwords como 1Password/Bitwarden)."
Write-Host "  • NO las commitees al repo."
Write-Host "  • Pegalas en Coolify → Application medsysve → Environment Variables."
Write-Host "  • Rota cada 90-180 dias."
Write-Host ""

$keys = [ordered]@{
    "FIELD_ENCRYPTION_KEY"  = (New-Secret $bytes)
    "FIELD_HMAC_KEY"        = (New-Secret $bytes)
    "BACKUP_ENCRYPTION_KEY" = (New-Secret $bytes)
    "NEXTAUTH_SECRET"       = (New-Secret $bytes)
    "CRON_SECRET"           = (New-HexSecret 32)
}

foreach ($k in $keys.Keys) {
    Write-Host ("{0,-26} = {1}" -f $k, $keys[$k]) -ForegroundColor Green
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Backup script (R2 — opcional)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si vas a usar Cloudflare R2 para los backups cifrados, tambien necesitas:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  R2_ENDPOINT            = https://<accountid>.r2.cloudflarestorage.com"
Write-Host "  R2_ACCESS_KEY_ID       = (de Cloudflare dashboard)"
Write-Host "  R2_SECRET_ACCESS_KEY   = (de Cloudflare dashboard)"
Write-Host "  R2_BUCKET              = medsysve-backups"
Write-Host ""
Write-Host "Tambien recorda actualizar el .env.example en el repo si tu setup cambia."
Write-Host ""

# Also offer to copy to clipboard (Windows)
$copy = Read-Host "Copiar al portapapeles como .env? (S/N)"
if ($copy -eq "S" -or $copy -eq "s") {
    $envContent = ""
    foreach ($k in $keys.Keys) {
        $envContent += "$k=`"$($keys[$k])`"`n"
    }
    Set-Clipboard -Value $envContent
    Write-Host ""
    Write-Host "Copiado al portapapeles. Pega en Coolify → Environment Variables." -ForegroundColor Green
}

Write-Host ""
Write-Host "Listo. Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Pegar las claves en Coolify → medsysve → Environment"
Write-Host "  2. Esperar el auto-deploy (~13 min)"
Write-Host "  3. Login con 2FA (Fase 1 ya implementado)"
Write-Host "  4. Hacer un deploy de prueba: ssh root@13.140.181.29 'docker exec hze8mocuh4xqskqwrm3mx50b-123048882354 psql ...'"
Write-Host ""