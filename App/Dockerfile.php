FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libssl-dev \
    libzip-dev \
    wget \
    libwebp-dev \
    libjpeg62-turbo-dev \
    libxpm-dev \
    default-mysql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configure and install PHP extensions in optimized order
RUN docker-php-ext-configure gd --with-webp --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        xml \
        zip \
        soap \
        intl

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy PHP configuration early (before app files)
COPY docker/php/php.ini /usr/local/etc/php/php.ini

# Copy composer files first for better layer caching
COPY composer.json composer.lock* ./

# Install composer dependencies first
RUN composer install --optimize-autoloader --no-dev --no-scripts --no-autoloader

# Copy application code (dockerignore will exclude unnecessary files)
COPY . /var/www/html/

# Complete composer installation
RUN composer dump-autoload --optimize --no-dev

# Create necessary directories with proper permissions
RUN mkdir -p \
    /var/www/html/storage/logs \
    /var/www/html/storage/app \
    /var/www/html/storage/framework/cache \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/public/storage \
    /var/www/html/logs

# Set environment variables
ENV IS_DOCKER=true \
    APACHE_DOCUMENT_ROOT=/var/www/html/public \
    APACHE_LOG_DIR=/var/log/apache2

# Configure PHP settings and Apache in a single optimized layer
RUN { \
        echo "log_errors = On"; \
        echo "error_log = /var/log/php_errors.log"; \
        echo "display_errors = On"; \
        echo "display_startup_errors = On"; \
        echo "error_reporting = E_ALL"; \
        echo "memory_limit = 512M"; \
        echo "max_execution_time = 60"; \
        echo "post_max_size = 100M"; \
        echo "upload_max_filesize = 100M"; \
        echo "max_file_uploads = 20"; \
    } > /usr/local/etc/php/conf.d/misvord.ini \
    && touch /var/log/php_errors.log \
    && sed -i 's/Listen 80/Listen 1001/g' /etc/apache2/ports.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost *:1001>/g' /etc/apache2/sites-available/000-default.conf \
    && echo "ServerName localhost" >> /etc/apache2/apache2.conf \
    && a2enmod rewrite headers \
    && echo "DirectoryIndex index.php index.html" >> /etc/apache2/apache2.conf

# Set ownership and permissions in a single layer (faster and more efficient)
RUN rm -rf /var/www/html/.git* /var/www/html/node_modules /var/www/html/tests /var/www/html/*.md \
    && find /var/www/html -name "*.log" -delete \
    && find /var/www/html -name ".DS_Store" -delete \
    && chown -R www-data:www-data /var/www/html /var/log/php_errors.log \
    && chmod -R 755 /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/public/storage /var/www/html/logs \
    && chmod +x /var/www/html/public/index.php

# Health check for container monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:1001/health || exit 1

EXPOSE 1001

CMD ["apache2-foreground"]