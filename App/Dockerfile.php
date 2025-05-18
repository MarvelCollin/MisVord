FROM php:8.0-apache

RUN apt-get update && apt-get install -y \
    libzip-dev \
    zip \
    unzip \
    curl \
    && docker-php-ext-install zip pdo_mysql

# Enable Apache rewrite module
RUN a2enmod rewrite

# Set up PHP configuration
RUN echo "memory_limit=256M" > /usr/local/etc/php/conf.d/memory-limit.ini
RUN echo "upload_max_filesize=100M" > /usr/local/etc/php/conf.d/upload-limit.ini
RUN echo "post_max_size=100M" > /usr/local/etc/php/conf.d/post-limit.ini

# Enable environment variables to be read by PHP
ENV APACHE_ENVVARS=/etc/apache2/envvars
RUN echo "export DB_HOST=\${DB_HOST}" >> $APACHE_ENVVARS
RUN echo "export DB_NAME=\${DB_NAME}" >> $APACHE_ENVVARS
RUN echo "export DB_USER=\${DB_USER}" >> $APACHE_ENVVARS
RUN echo "export DB_PASS=\${DB_PASS}" >> $APACHE_ENVVARS
RUN echo "export DB_CHARSET=\${DB_CHARSET}" >> $APACHE_ENVVARS
RUN echo "export SOCKET_SERVER=\${SOCKET_SERVER}" >> $APACHE_ENVVARS
RUN echo "export SOCKET_API_KEY=\${SOCKET_API_KEY}" >> $APACHE_ENVVARS

# Configure Apache
COPY docker/apache/000-default.conf /etc/apache2/sites-available/000-default.conf

# Set working directory
WORKDIR /var/www/html

# Copy core PHP files
COPY index.php /var/www/html/
COPY router.php /var/www/html/
COPY config /var/www/html/config
COPY views /var/www/html/views
COPY public /var/www/html/public
COPY controllers /var/www/html/controllers
COPY bootstrap /var/www/html/bootstrap
COPY migrations /var/www/html/migrations
COPY database /var/www/html/database
COPY utils /var/www/html/utils
COPY .htaccess /var/www/html/

# Create storage directory with proper permissions
RUN mkdir -p /var/www/html/storage && \
    chown -R www-data:www-data /var/www/html/storage && \
    chmod -R 777 /var/www/html/storage

# Copy PHP configuration
COPY docker/php/php.ini /usr/local/etc/php/conf.d/app.ini

# Fix permissions
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80

CMD ["apache2-foreground"]