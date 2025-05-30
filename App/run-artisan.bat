@echo off
echo Setting database connection to use db:1003
docker-compose exec -e DB_HOST=db -e DB_PORT=1003 -e DB_USER=root -e DB_PASS=kolin123 -e DB_NAME=misvord -e IS_DOCKER=true app php artisan %*