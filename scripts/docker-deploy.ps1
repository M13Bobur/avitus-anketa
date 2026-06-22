# Avitus Anketa — Docker deploy (Windows 11)
# Ishlatish: PowerShell da loyiha ildizidan:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\scripts\docker-deploy.ps1

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RootDir

if (-not (Test-Path ".env")) {
    Write-Host ">>> .env topilmadi. .env.docker.example dan nusxa olinmoqda..." -ForegroundColor Yellow
    Copy-Item ".env.docker.example" ".env"
    Write-Host ">>> .env faylini tahrirlang: JWT_SECRET, TELEGRAM_BOT_TOKEN, CORS_ORIGIN" -ForegroundColor Red
    exit 1
}

Write-Host ">>> Docker image build qilinmoqda..." -ForegroundColor Cyan
docker compose build --no-cache

Write-Host ">>> Containerlar ishga tushirilmoqda..." -ForegroundColor Cyan
docker compose up -d

Write-Host ""
Write-Host ">>> Holat:" -ForegroundColor Green
docker compose ps

$appPort = "3000"
$envContent = Get-Content ".env" -ErrorAction SilentlyContinue
foreach ($line in $envContent) {
    if ($line -match '^\s*APP_PORT\s*=\s*(.+)\s*$') {
        $appPort = $Matches[1].Trim()
        break
    }
}

Write-Host ""
Write-Host ">>> Tayyor!" -ForegroundColor Green
Write-Host "    Admin:   http://localhost:${appPort}/login/"
Write-Host "    Swagger: http://localhost:${appPort}/api/docs"
Write-Host "    Login:   admin / admin123  (agar .env da o'zgartirmagan bo'lsangiz)"
Write-Host ""
Write-Host "Loglar: docker compose logs -f backend"
