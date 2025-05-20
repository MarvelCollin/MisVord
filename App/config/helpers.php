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
    
    // Check file extension to determine the appropriate directory
    $extension = pathinfo($path, PATHINFO_EXTENSION);
    
    $finalUrl = '';
    
    // Special override for marvelcollin.my.id domain to ensure paths are correct
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $isMarvelDomain = strpos($host, 'marvelcollin.my.id') !== false;
    
    // Route to the appropriate directory based on file extension
    if ($extension === 'js' || strpos($path, 'webrtc-modules/') !== false) {
        // JavaScript files go to /js/ directory
        if ($isMarvelDomain && strpos($baseUrl, '/misvord') === false) {
            // Force /misvord prefix for marvelcollin domain
            $finalUrl = str_replace("://{$host}", "://{$host}/misvord", $baseUrl) . "/js/{$path}";
        } else {
            $finalUrl = "{$baseUrl}/js/{$path}";
        }
    } elseif ($extension === 'css') {
        // CSS files go to /css/ directory
        if ($isMarvelDomain && strpos($baseUrl, '/misvord') === false) {
            // Force /misvord prefix for marvelcollin domain
            $finalUrl = str_replace("://{$host}", "://{$host}/misvord", $baseUrl) . "/css/{$path}";
        } else {
            $finalUrl = "{$baseUrl}/css/{$path}";
        }
    } else {
        // All other assets go to /assets/ directory
        if ($isMarvelDomain && strpos($baseUrl, '/misvord') === false) {
            // Force /misvord prefix for marvelcollin domain
            $finalUrl = str_replace("://{$host}", "://{$host}/misvord", $baseUrl) . "/assets/{$path}";
        } else {
            $finalUrl = "{$baseUrl}/assets/{$path}";
        }
    }
    
    // Normalize URL to prevent double slashes
    $finalUrl = preg_replace('#([^:])//+#', '$1/', $finalUrl);
    
    // Log the asset URL for debugging (only in development)
    if (getenv('APP_ENV') !== 'production') {
        error_log("Asset URL for '{$path}': {$finalUrl}");
    }
    
    return $finalUrl;
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
    
    // Special override for marvelcollin.my.id domain to ensure paths are correct
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $isMarvelDomain = strpos($host, 'marvelcollin.my.id') !== false;
    
    if ($isMarvelDomain && strpos($baseUrl, '/misvord') === false) {
        // Force /misvord prefix for marvelcollin domain
        $finalUrl = str_replace("://{$host}", "://{$host}/misvord", $baseUrl) . "/css/{$path}";
    } else {
        $finalUrl = "{$baseUrl}/css/{$path}";
    }
    
    // Normalize URL to prevent double slashes
    $finalUrl = preg_replace('#([^:])//+#', '$1/', $finalUrl);
    
    // Log the CSS URL for debugging (only in development)
    if (getenv('APP_ENV') !== 'production') {
        error_log("CSS URL for '{$path}': {$finalUrl}");
    }
    
    return $finalUrl;
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
    
    // Special override for marvelcollin.my.id domain to ensure paths are correct
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $isMarvelDomain = strpos($host, 'marvelcollin.my.id') !== false;
    
    if ($isMarvelDomain && strpos($baseUrl, '/misvord') === false) {
        // Force /misvord prefix for marvelcollin domain
        $finalUrl = str_replace("://{$host}", "://{$host}/misvord", $baseUrl) . "/js/{$path}";
    } else {
        $finalUrl = "{$baseUrl}/js/{$path}";
    }
    
    // Normalize URL to prevent double slashes
    $finalUrl = preg_replace('#([^:])//+#', '$1/', $finalUrl);
    
    // Log the JS URL for debugging (only in development)
    if (getenv('APP_ENV') !== 'production') {
        error_log("JS URL for '{$path}': {$finalUrl}");
    }
    
    return $finalUrl;
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
    
    // In production, and especially for marvelcollin.my.id, always use HTTPS
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost:1001';
    
    // Force HTTPS for production domains and when accessed via HTTPS
    $useHttps = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    
    // Always use HTTPS for marvelcollin.my.id domain
    if (strpos($host, 'marvelcollin.my.id') !== false) {
        $useHttps = true;
    }
    
    $protocol = $useHttps ? 'https' : 'http';
    $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
    
    // Enhanced debugging for path construction
    if (getenv('APP_ENV') !== 'production') {
        error_log("Host: {$host}");
        error_log("Script Name: " . ($_SERVER['SCRIPT_NAME'] ?? 'Not Set'));
        error_log("Script Directory: {$scriptDir}");
    }
    
    // Special handling for marvelcollin.my.id domain - always add /misvord to the path
    if (strpos($host, 'marvelcollin.my.id') !== false) {
        // Check if /misvord is already in the path
        if (strpos($scriptDir, '/misvord') === false) {
            // If not, add it
            $scriptDir = '/misvord';
            if (getenv('APP_ENV') !== 'production') {
                error_log("Detected marvelcollin.my.id domain, forcing path to: {$scriptDir}");
            }
        }
    }
    
    $baseUrl = "{$protocol}://{$host}{$scriptDir}";
    
    // Log the final URL for debugging
    if (getenv('APP_ENV') !== 'production') {
        error_log("Final base URL: {$baseUrl}");
    }
    
    return $baseUrl;
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