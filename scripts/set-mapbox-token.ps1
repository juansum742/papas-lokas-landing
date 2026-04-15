param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Token,

  [Parameter(Position = 1)]
  [string]$Repo = "juansum742/papas-lokas-landing",

  [switch]$SkipGitHub,

  [switch]$SkipDeploy
)

if (-not $Token.StartsWith("pk")) {
  throw "El token de Mapbox para frontend debe ser publico y empezar con 'pk'."
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot ".env"
$envContent = "VITE_MAPBOX_TOKEN=$Token"

Set-Content -LiteralPath $envPath -Value $envContent -Encoding utf8
Write-Host "Archivo .env actualizado en $envPath"

if ($SkipGitHub) {
  Write-Host "Se omitio GitHub. El token quedo configurado solo en local."
  exit 0
}

gh auth status | Out-Null
gh secret set VITE_MAPBOX_TOKEN -R $Repo -b $Token

Write-Host "Secret VITE_MAPBOX_TOKEN actualizado en $Repo"

if ($SkipDeploy) {
  Write-Host "Se omitio el deploy. El siguiente push a main publicara la web con el mapa real."
  exit 0
}

gh workflow run deploy-pages.yml -R $Repo | Out-Null

Write-Host "Deploy de GitHub Pages disparado para $Repo"
Write-Host "URL publica esperada: https://juansum742.github.io/papas-lokas-landing/"
