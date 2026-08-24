<#
.SYNOPSIS
    Registra Rubric come servizio di Windows, così parte con la macchina.

.DESCRIPTION
    Da eseguire **come amministratore**, una volta sola. Il servizio parte
    all'accensione, prima ancora del login: il journal c'è appena il PC è acceso.

    I segreti (chiave JWT, password del database) stanno nelle variabili
    d'ambiente del servizio, non in appsettings.json — che è tracciato da git e
    finirebbe nella storia del repo. ASP.NET legge le variabili con il doppio
    underscore: `Jwt__Secret` diventa la sezione `Jwt`, chiave `Secret`.

    La chiave JWT, se non la si passa, viene generata qui: 32 byte casuali da un
    generatore crittografico. Cambiarla invalida le sessioni aperte, il che
    significa solo rifare il login.

.PARAMETER Path
    La cartella prodotta da publish.ps1. Default: C:\Rubric

.PARAMETER Port
    Porta di ascolto. Default: 8080 — sopra la 1024 non serve nulla di
    particolare, e non litiga con eventuali server già presenti sulla 80.

.PARAMETER ConnectionString
    Stringa di connessione a PostgreSQL. Default: il database di sviluppo su
    questa macchina, che è dove stanno già i trade.

.EXAMPLE
    .\deploy\install-service.ps1
    .\deploy\install-service.ps1 -Port 9000
#>
[CmdletBinding()]
param(
    [string]$Path = 'C:\Rubric',
    [int]$Port = 8080,
    [string]$ConnectionString = 'Host=localhost;Port=5432;Database=apex_journal;Username=postgres;Password=postgres',
    [string]$JwtSecret
)

$ErrorActionPreference = 'Stop'
$serviceName = 'Rubric'

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    throw 'Questo script va eseguito da un PowerShell aperto come amministratore.'
}

$exe = Join-Path $Path 'Apex.API.exe'
if (-not (Test-Path $exe)) {
    throw "Non trovo $exe. Esegui prima .\deploy\publish.ps1"
}

if (-not $JwtSecret) {
    # 32 byte veri, non un GUID: un GUID è comodo e non è imprevedibile per
    # costruzione, e questa chiave è ciò che firma i token di sessione.
    #
    # `Create()` e non `Fill()`: Windows PowerShell 5.1 gira su .NET Framework,
    # dove il metodo statico non esiste. Questo funziona su entrambi.
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $bytes = New-Object byte[] 32
        $rng.GetBytes($bytes)
        $JwtSecret = [Convert]::ToBase64String($bytes)
    } finally {
        $rng.Dispose()
    }
    Write-Host 'Chiave JWT generata.' -ForegroundColor Cyan
}

$existing = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host 'Servizio già presente: lo fermo e lo riconfiguro.' -ForegroundColor Yellow
    if ($existing.Status -ne 'Stopped') { Stop-Service -Name $serviceName -Force }
    sc.exe delete $serviceName | Out-Null
    Start-Sleep -Seconds 2
}

New-Service -Name $serviceName `
    -BinaryPathName "`"$exe`"" `
    -DisplayName 'Rubric — Trading Journal' `
    -Description 'Il tuo trading journal. Serve API e interfaccia sulla stessa porta.' `
    -StartupType Automatic | Out-Null

# Le variabili d'ambiente di un servizio si scrivono nel registro, sotto la sua
# chiave: `Environment` è un REG_MULTI_SZ di righe NOME=valore.
$key = "HKLM:\SYSTEM\CurrentControlSet\Services\$serviceName"
Set-ItemProperty -Path $key -Name 'Environment' -Value @(
    'ASPNETCORE_ENVIRONMENT=Production',
    "ASPNETCORE_URLS=http://0.0.0.0:$Port",
    "ConnectionStrings__DefaultConnection=$ConnectionString",
    "JwtSettings__Secret=$JwtSecret"
) -Type MultiString

# Se il database non è ancora pronto all'avvio della macchina il servizio muore:
# meglio che riprovi da solo invece di restare giù fino al riavvio successivo.
sc.exe failure $serviceName reset= 86400 actions= restart/5000/restart/15000/restart/60000 | Out-Null

Start-Service -Name $serviceName
Start-Sleep -Seconds 3

$status = (Get-Service -Name $serviceName).Status
Write-Host ''
Write-Host "Servizio $serviceName : $status" -ForegroundColor Green
Write-Host "Da questa macchina:  http://localhost:$Port" -ForegroundColor Green
Write-Host ''
Write-Host 'Per raggiungerlo dal telefono, installa Tailscale su PC e telefono' -ForegroundColor Cyan
Write-Host "e apri  http://<nome-di-questo-pc>:$Port  dal tailnet." -ForegroundColor Cyan
