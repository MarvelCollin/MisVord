FROM php:8.1.27-apache-bullseye-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl=7.74.0-1.3+deb11u10 \
    libpng-dev=1.6.37-3 \
    libonig-dev=6.9.6-1.1 \
    libxml2-dev=2.9.10+dfsg-6.7+deb11u4 \
    zip=3.0-12 \
    unzip=6.0-26+deb11u1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    /tmp/* \
    /var/tmp/* \
    /usr/share/doc/* \
    /usr/share/man/*

RUN docker-php-ext-install -j$(nproc) pdo_mysql mbstring exif bcmath gd

COPY --from=composer:2.6.5 /usr/bin/composer /usr/bin/composer

RUN groupadd -g 1000 appuser && \
    useradd -u 1000 -g appuser -m -s /bin/bash appuser

WORKDIR /var/www/html

RUN a2enmod rewrite headers && \
    sed -i 's/ServerTokens OS/ServerTokens Prod/' /etc/apache2/conf-available/security.conf && \
    sed -i 's/ServerSignature On/ServerSignature Off/' /etc/apache2/conf-available/security.conf && \
    a2enconf security

COPY docker/apache/000-default.conf /etc/apache2/sites-available/000-default.conf

COPY --chown=appuser:appuser composer.json composer.lock ./
COPY --chown=appuser:appuser public public/
COPY --chown=appuser:appuser views views/
COPY --chown=appuser:appuser controllers controllers/
COPY --chown=appuser:appuser config config/
COPY --chown=appuser:appuser bootstrap bootstrap/
COPY --chown=appuser:appuser migrations migrations/
COPY --chown=appuser:appuser router.php index.php artisan serve.php ./

RUN if [ -f .env.example ]; then \
        cp .env.example .env; \
    else \
        echo "APP_ENV=production" > .env; \
    fi

RUN mkdir -p /var/www/html/storage/logs \
    && mkdir -p /var/www/html/storage/framework/cache \
    && mkdir -p /var/www/html/storage/framework/sessions \
    && mkdir -p /var/www/html/storage/framework/views \
    && chown -R appuser:appuser /var/www/html/storage

RUN composer install --no-dev --no-interaction --optimize-autoloader

RUN { \
    echo 'expose_php = Off'; \
    echo 'display_errors = Off'; \
    echo 'display_startup_errors = Off'; \
    echo 'log_errors = On'; \
    echo 'error_log = /var/log/php_errors.log'; \
    echo 'memory_limit = 128M'; \
    echo 'max_execution_time = 30'; \
    echo 'upload_max_filesize = 10M'; \
    echo 'post_max_size = 10M'; \
    echo 'date.timezone = UTC'; \
    } > /usr/local/etc/php/conf.d/production.ini

EXPOSE 80

USER appuser

CMD ["apache2-foreground"] 