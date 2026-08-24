<#
.SYNOPSIS
    Costruisce Rubric in un'unica cartella pronta da eseguire.

.DESCRIPTION
    Tre passaggi: build del frontend, copia dentro wwwroot del backend,
    pubblicazione del backend. Il risultato è una cartella con dentro un .exe e
    i file statici — si copia dove si vuole e parte.

    Il frontend finisce **dentro** il backend di proposito: un processo solo
    significa niente CORS, niente seconda porta e niente reverse proxy. Per
    un'installazione a utente singolo è tutto ciò che serve, e toglie di mezzo
    i tre pezzi che si rompono più spesso.

.PARAMETER Destination
    Dove finisce l'applicazione pronta. Default: C:\Rubric

.EXAMPLE
    .\deploy\publish.ps1
    .\deploy\publish.ps1 -Destination D:\Apps\Rubric
#>
[CmdletBinding()]
param(
    [string]$Destination = 'C:\Rubric'
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root 'frontend'
$api = Join-Path $root 'backend\Apex\Apex.API'
$wwwroot = Join-Path $api 'wwwroot'

Write-Host '── 1/3  Frontend' -ForegroundColor Cyan
Push-Location $frontend
try {
    # L'indirizzo dell'API lo azzera `frontend/.env.production`, che è versionato
    # apposta (vedi il commento lì dentro): una variabile d'ambiente vuota non
    # basta, Vite la considera non impostata e il `.env` di sviluppo vince
    # comunque, portandosi localhost:7106 dentro la build di produzione.
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'La build del frontend è fallita.' }
} finally {
    Pop-Location
}

Write-Host '── 2/3  Copia in wwwroot' -ForegroundColor Cyan
# Si svuota prima: i nomi dei file di Vite contengono un hash, quindi senza
# pulizia la cartella accumulerebbe per sempre le versioni vecchie.
if (Test-Path $wwwroot) { Remove-Item $wwwroot -Recurse -Force }
New-Item -ItemType Directory -Path $wwwroot -Force | Out-Null
Copy-Item (Join-Path $frontend 'dist\*') $wwwroot -Recurse -Force

Write-Host '── 3/3  Backend' -ForegroundColor Cyan
# Il servizio non deve arrestarsi se la cartella si sposta, quindi si pubblica
# tutto insieme invece di dipendere da un runtime installato altrove.
dotnet publish $api -c Release -o $Destination --nologo
if ($LASTEXITCODE -ne 0) { throw 'La pubblicazione del backend è fallita.' }

# appsettings.json finisce nella cartella pubblicata, ma i segreti veri stanno
# nelle variabili d'ambiente del servizio (vedi install-service.ps1): quel file
# resta con i valori di sviluppo, che in produzione nessuno legge.
Write-Host ''
Write-Host "Pronto in $Destination" -ForegroundColor Green
Write-Host 'Prossimo passo: .\deploy\install-service.ps1 (come amministratore)' -ForegroundColor Green
