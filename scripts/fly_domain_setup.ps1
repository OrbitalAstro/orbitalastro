param(
  [string]$DomainRoot = "orbitalastro.ca",
  [string]$WebApp = "orbitalastro-web",
  [string]$ApiApp = "orbitalastro-api"
)

$ErrorActionPreference = "Stop"

$www = "www.$DomainRoot"
$api = "api.$DomainRoot"

Write-Host "== Fly TLS certs ==" -ForegroundColor Cyan
Write-Host "Creating/ensuring certificates on Fly for:" -ForegroundColor Cyan
Write-Host "  - $www (app: $WebApp)"
Write-Host "  - $api (app: $ApiApp)"
Write-Host ""

flyctl certs add $www -a $WebApp
Write-Host ""
flyctl certs add $api -a $ApiApp

Write-Host ""
Write-Host "== GoDaddy DNS (recommended) ==" -ForegroundColor Cyan
Write-Host "In GoDaddy > DNS, use the CNAME targets printed by Fly above (they include a unique prefix)." -ForegroundColor Cyan
Write-Host "Example format:" -ForegroundColor Cyan
Write-Host "  - CNAME  www  ->  <random>.$WebApp.fly.dev"
Write-Host "  - CNAME  api  ->  <random>.$ApiApp.fly.dev"
Write-Host ""
Write-Host "Tip: you can add the optional _acme-challenge CNAMEs first to validate TLS before switching traffic." -ForegroundColor Yellow
Write-Host ""

Write-Host "== Quick checks ==" -ForegroundColor Cyan
Write-Host "After DNS propagation, run:" -ForegroundColor Cyan
Write-Host "  Resolve-DnsName $www"
Write-Host "  Resolve-DnsName $api"
Write-Host "  flyctl certs show $www -a $WebApp"
Write-Host "  flyctl certs show $api -a $ApiApp"
