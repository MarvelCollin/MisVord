<?php
/**
 * Application Configuration
 * 
 * This file loads all necessary configuration files for the application
 */

// Load environment variables
require_once __DIR__ . '/env.php';

// Load database configuration
require_once __DIR__ . '/db.php';

// Load helper functions
require_once __DIR__ . '/helpers.php';

// Application name and version
define('APP_NAME', 'MiscVord');
define('APP_VERSION', '1.0.0');

// Set default timezone
date_default_timezone_set('Asia/Jakarta');

// Error reporting settings
if (getenv('APP_ENV') === 'production') {
    error_reporting(E_ERROR | E_PARSE);
    ini_set('display_errors', 0);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// Load any additional configurations
if (file_exists(__DIR__ . '/videosdk.php')) {
    require_once __DIR__ . '/videosdk.php';
}

if (file_exists(__DIR__ . '/google_oauth.php')) {
    require_once __DIR__ . '/google_oauth.php';
} 