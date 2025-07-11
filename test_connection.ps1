.# PowerShell script to test PostgreSQL connection
# This script tests if we can connect to the Docker PostgreSQL from outside

Write-Host "Testing PostgreSQL Docker Container Connection" -ForegroundColor Green
Write-Host "Container: wooded-postgres on port 5432" -ForegroundColor Yellow

# Test if the port is accessible
$tcpConnection = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue

if ($tcpConnection.TcpTestSucceeded) {
    Write-Host "✅ Port 5432 is accessible!" -ForegroundColor Green
    Write-Host "Host: localhost" -ForegroundColor White
    Write-Host "Port: 5432" -ForegroundColor White
    Write-Host "Database: arbolado" -ForegroundColor White
    Write-Host "Username: postgres" -ForegroundColor White
    Write-Host "Password: laucha12" -ForegroundColor White
    Write-Host ""
    Write-Host "Connection details for pgAdmin:" -ForegroundColor Cyan
    Write-Host "- Server Name: Docker Arbolado" -ForegroundColor White
    Write-Host "- Host: localhost" -ForegroundColor White
    Write-Host "- Port: 5432" -ForegroundColor White
    Write-Host "- Database: arbolado" -ForegroundColor White
    Write-Host "- Username: postgres" -ForegroundColor White
    Write-Host "- Password: laucha12" -ForegroundColor White
    
    # Test direct connection using Docker
    Write-Host ""
    Write-Host "Testing direct database connection..." -ForegroundColor Yellow
    docker exec wooded-postgres psql -U postgres -d arbolado -c "\dt"
    
} else {
    Write-Host "❌ Port 5432 is not accessible!" -ForegroundColor Red
    Write-Host "This might be a Windows Firewall or Docker Desktop issue." -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Cyan
    Write-Host "1. Make sure Docker Desktop is running" -ForegroundColor White
    Write-Host "2. Check Windows Firewall settings" -ForegroundColor White
    Write-Host "3. Try restarting Docker Desktop" -ForegroundColor White
}
