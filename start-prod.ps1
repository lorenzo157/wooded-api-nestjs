# Production environment script
Write-Host "Starting production environment..." -ForegroundColor Green

# Stop any running containers
docker-compose down

# Build and start production containers
docker-compose up --build -d

# Show running containers
docker ps

Write-Host "`nProduction environment started!" -ForegroundColor Green
Write-Host "- NestJS (optimized): http://localhost:3000" -ForegroundColor Yellow
Write-Host "- pgAdmin: http://localhost:5050" -ForegroundColor Yellow
Write-Host "- PostgreSQL: localhost:5432" -ForegroundColor Yellow
Write-Host "`nTo see logs: docker-compose logs -f" -ForegroundColor Cyan
