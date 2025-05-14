FROM php:8.1-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . /var/www/html

# Configure Apache
RUN a2enmod rewrite
COPY docker/apache/000-default.conf /etc/apache2/sites-available/000-default.conf

# Create .env file if it doesn't exist
RUN if [ ! -f .env ]; then cp .env.example .env || echo "No .env.example file found"; fi

# Ensure the storage directory is writable
RUN mkdir -p /var/www/html/storage/logs \
    && chmod -R 775 /var/www/html/storage \
    && chown -R www-data:www-data /var/www/html

# Install project dependencies
RUN composer install --no-interaction

# Expose port 80
EXPOSE 80

# Start Apache server
CMD ["apache2-foreground"] 