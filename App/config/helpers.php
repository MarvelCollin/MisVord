<?php

// Define paths - only if not already defined
if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__));
if (!defined('VIEWS_PATH')) define('VIEWS_PATH', ROOT_PATH . '/views');
if (!defined('PUBLIC_PATH')) define('PUBLIC_PATH', ROOT_PATH . '/public');
if (!defined('MIGRATIONS_PATH')) define('MIGRATIONS_PATH', ROOT_PATH . '/migrations');

/**
 * Get the URL for an asset file
 * 
 * @param string $path The path to the asset relative to the public assets directory
 * @return string The complete URL to the asset
 */
function asset($path) {
    // Remove any leading slashes for consistency
    $path = ltrim($path, '/');
    
    // Get the base URL from server variables
    $baseUrl = getBaseUrl();
    
    // Return the URL with the assets directory
    return "{$baseUrl}/assets/{$path}";
}

/**
 * Get the URL for a CSS file
 * 
 * @param string $path The path to the CSS file relative to the public css directory
 * @return string The complete URL to the CSS file
 */
function css($path) {
    $path = ltrim($path, '/');
    if (!str_ends_with($path, '.css')) {
        $path .= '.css';
    }
    
    $baseUrl = getBaseUrl();
    return "{$baseUrl}/css/{$path}";
}

/**
 * Get the URL for a JavaScript file
 * 
 * @param string $path The path to the JS file relative to the public js directory
 * @return string The complete URL to the JS file
 */
function js($path) {
    $path = ltrim($path, '/');
    if (!str_ends_with($path, '.js')) {
        $path .= '.js';
    }
    
    $baseUrl = getBaseUrl();
    return "{$baseUrl}/js/{$path}";
}

/**
 * Get the base URL of the application
 * 
 * @return string The base URL
 */
function getBaseUrl() {
    if (php_sapi_name() === 'cli') {
        return 'http://localhost:1001';
    }
    
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost:1001';
    
    $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
    
    return "{$protocol}://{$host}{$scriptDir}";
}

/**
 * Create a new migration file
 * 
 * @param string $name The migration name
 * @return string|false The path to the created file or false on failure
 */
function create_migration($name) {
    $timestamp = date('YmdHis');
    $filename = $timestamp . '_' . snake_case($name) . '.php';
    $filepath = MIGRATIONS_PATH . '/' . $filename;
    
    // Create class name in StudlyCase format
    $className = studly_case($name) . 'Migration';
    
    // Migration file template
    $content = <<<EOT
<?php

class {$className} {
    public function up(\$migration) {
        // Run the migration
        \$migration->createTable('table_name', function(\$table) {
            \$table->id();
            \$table->string('name');
            \$table->timestamps();
        });
    }

    public function down(\$migration) {
        // Reverse the migration
        \$migration->dropTable('table_name', true);
    }
}
EOT;
    
    if (file_put_contents($filepath, $content)) {
        return $filepath;
    }
    
    return false;
}

/**
 * Convert a string to snake_case
 * 
 * @param string $string The string to convert
 * @return string The snake_case string
 */
function snake_case($string) {
    $string = preg_replace('/\s+/', '_', strtolower($string));
    $string = preg_replace('/(.)(?=[A-Z])/', '$1_', $string);
    return strtolower($string);
}

/**
 * Convert a string to StudlyCase
 * 
 * @param string $string The string to convert
 * @return string The StudlyCase string
 */
function studly_case($string) {
    $string = ucwords(str_replace(['-', '_'], ' ', $string));
    return str_replace(' ', '', $string);
}