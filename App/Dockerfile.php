FROM php:8.1-apache

# Install system dependencies
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

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-configure gd --with-webp --with-jpeg
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd xml zip soap intl

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . /var/www/html/

# Install dependencies
RUN composer install --optimize-autoloader --no-dev

# Create storage directory if it doesn't exist
RUN mkdir -p /var/www/html/storage

# Set permissions
RUN chown -R www-data:www-data /var/www/html/
RUN chmod -R 775 /var/www/html/storage

# Configure Apache to listen on port 1001 instead of 80
RUN sed -i 's/Listen 80/Listen 1001/g' /etc/apache2/ports.conf
RUN sed -i 's/:80/:1001/g' /etc/apache2/sites-available/000-default.conf

# Enable Apache modules
RUN a2enmod rewrite headers ssl

# Expose port 1001 instead of 80
EXPOSE 1001

# Start Apache
CMD ["apache2-foreground"]