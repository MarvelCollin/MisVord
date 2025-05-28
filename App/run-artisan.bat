@echo off
docker-compose exec -e DB_HOST=db -e DB_PORT=3306 -e DB_USER=root -e DB_PASS=password app php artisan %* 