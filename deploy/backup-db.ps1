<#
.SYNOPSIS
    Copia di sicurezza del database, con rotazione.

.DESCRIPTION
    È la cosa più importante di tutto il deploy. Il resto — l'app, la
    configurazione, il servizio — si ricostruisce in mezz'ora da questo repo.
    I trade no: quelli esistono in un posto solo, e sono l'unica cosa che non si
    può ricomprare.

    Il dump è in formato "custom" di PostgreSQL: compresso, e ripristinabile
    anche solo in parte con pg_restore.

.PARAMETER Destination
    Dove finiscono i backup. Default: C:\Rubric\backup

.PARAMETER KeepDays
    Per quanti giorni tenerli. Default: 30. I file più vecchi vengono cancellati
    a ogni esecuzione, altrimenti la cartella cresce per sempre.

.EXAMPLE
    .\deploy\backup-db.ps1
    .\deploy\backup-db.ps1 -Destination D:\Backup -KeepDays 90

.NOTES
    Per ripristinare:
      pg_restore -h localhost -U postgres -d apex_journal --clean --if-exists <file>
#>
[CmdletBinding()]
param(
    [string]$Destination = 'C:\Rubric\backup',
    [int]$KeepDays = 30,
    [string]$Database = 'apex_journal',
    [string]$User = 'postgres',
    [string]$PgPassword = 'postgres'
)

$ErrorActionPreference = 'Stop'

$pgDump = Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\pg_dump.exe' -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending | Select-Object -First 1
if (-not $pgDump) { throw 'pg_dump non trovato: PostgreSQL è installato?' }

if (-not (Test-Path $Destination)) {
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
}

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$file = Join-Path $Destination "rubric_$stamp.dump"

$env:PGPASSWORD = $PgPassword
try {
    & $pgDump.FullName -h localhost -U $User -d $Database -F c -f $file
    if ($LASTEXITCODE -ne 0) { throw "pg_dump è uscito con codice $LASTEXITCODE" }
} finally {
    # La password non resta nell'ambiente più del necessario.
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

$size = [math]::Round((Get-Item $file).Length / 1KB, 1)
Write-Host "Backup: $file ($size KB)" -ForegroundColor Green

# La rotazione viene **dopo** un dump riuscito: se il backup di oggi fallisse,
# cancellare i vecchi lascerebbe scoperti proprio i giorni che servono.
$cutoff = (Get-Date).AddDays(-$KeepDays)
$old = Get-ChildItem $Destination -Filter 'rubric_*.dump' | Where-Object { $_.LastWriteTime -lt $cutoff }
if ($old) {
    $old | Remove-Item -Force
    Write-Host "Rimossi $($old.Count) backup più vecchi di $KeepDays giorni." -ForegroundColor DarkGray
}
