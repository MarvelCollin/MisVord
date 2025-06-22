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
    default-mysql-client

RUN apt-get clean && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-webp --with-jpeg
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd xml zip soap intl

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . /var/www/html/

RUN composer install --optimize-autoloader --no-dev

RUN mkdir -p /var/www/html/storage

COPY docker/php/php.ini /usr/local/etc/php/php.ini

ENV IS_DOCKER=true
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN echo "log_errors = On" >> /usr/local/etc/php/conf.d/debug.ini && \
    echo "error_log = /var/log/php_errors.log" >> /usr/local/etc/php/conf.d/debug.ini && \
    echo "display_errors = On" >> /usr/local/etc/php/conf.d/debug.ini && \
    echo "display_startup_errors = On" >> /usr/local/etc/php/conf.d/debug.ini && \
    echo "error_reporting = -1" >> /usr/local/etc/php/conf.d/debug.ini && \
    echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/debug.ini && \
    echo "max_execution_time = 30" >> /usr/local/etc/php/conf.d/debug.ini

RUN touch /var/log/php_errors.log && \
    chown www-data:www-data /var/log/php_errors.log

RUN chown -R www-data:www-data /var/www/html/
RUN chmod -R 775 /var/www/html/storage

RUN sed -i 's/Listen 80/Listen 1001/g' /etc/apache2/ports.conf
RUN sed -i 's/<VirtualHost \*:80>/<VirtualHost *:1001>/g' /etc/apache2/sites-available/000-default.conf

RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

RUN a2enmod rewrite headers ssl

EXPOSE 1001

CMD ["apache2-foreground"]