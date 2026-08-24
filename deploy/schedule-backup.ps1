<#
.SYNOPSIS
    Fa girare il backup ogni giorno, da solo.

.DESCRIPTION
    Da eseguire come amministratore, una volta sola. Registra un'attività
    pianificata che lancia backup-db.ps1 ogni giorno all'ora indicata.

    `-StartWhenAvailable` è la ragione per cui questo funziona su un PC di casa:
    se alle 20:00 la macchina era spenta, l'attività parte alla prima accensione
    utile invece di saltare il giorno.

.PARAMETER At
    Ora dell'esecuzione. Default: 20:00, cioè a mercati chiusi.

.EXAMPLE
    .\deploy\schedule-backup.ps1
    .\deploy\schedule-backup.ps1 -At 23:30
#>
[CmdletBinding()]
param(
    [datetime]$At = '20:00',
    [string]$Destination = 'C:\Rubric\backup',
    [int]$KeepDays = 30
)

$ErrorActionPreference = 'Stop'
$taskName = 'Rubric — Backup database'

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    throw 'Questo script va eseguito da un PowerShell aperto come amministratore.'
}

$script = Join-Path $PSScriptRoot 'backup-db.ps1'
if (-not (Test-Path $script)) { throw "Non trovo $script" }

$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`" -Destination `"$Destination`" -KeepDays $KeepDays"

$trigger = New-ScheduledTaskTrigger -Daily -At $At

$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -DontStopIfGoingOnBatteries `
    -AllowStartIfOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 15)

Register-ScheduledTask -TaskName $taskName `
    -Action $action -Trigger $trigger -Settings $settings `
    -RunLevel Highest -User 'SYSTEM' -Force | Out-Null

Write-Host "Attività registrata: «$taskName», ogni giorno alle $($At.ToString('HH:mm'))." -ForegroundColor Green
Write-Host 'Provala subito con:  Start-ScheduledTask -TaskName "' -NoNewline -ForegroundColor Cyan
Write-Host "$taskName`"" -ForegroundColor Cyan
