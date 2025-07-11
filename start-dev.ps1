# Development environment script
Write-Host "Starting development environment..." -ForegroundColor Green

# Stop any running containers
docker-compose -f docker-compose.dev.yml down

# Build and start development containers
docker-compose -f docker-compose.dev.yml up --build -d

# Show running containers
docker ps

Write-Host "`nDevelopment environment started!" -ForegroundColor Green
Write-Host "- NestJS (with hot reload): http://localhost:3000" -ForegroundColor Yellow
Write-Host "- pgAdmin: http://localhost:5050" -ForegroundColor Yellow
Write-Host "- PostgreSQL: localhost:5432" -ForegroundColor Yellow
Write-Host "`nTo see logs: docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor Cyan
