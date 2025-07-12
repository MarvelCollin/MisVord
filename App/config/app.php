<?php

date_default_timezone_set('Asia/Jakarta');

require_once __DIR__ . '/env.php';

require_once __DIR__ . '/db.php';

require_once __DIR__ . '/session.php';

require_once __DIR__ . '/helpers.php';

require_once __DIR__ . '/route_manager.php';

require_once __DIR__ . '/config_manager.php';

require_once __DIR__ . '/../utils/AppLogger.php';

define('APP_NAME', 'MisVord');
define('APP_VERSION', '1.0.0');

$isProduction = EnvLoader::get('APP_ENV') === 'production';
$isDevelopment = EnvLoader::get('APP_ENV') === 'development';

if ($isProduction) {
    error_reporting(E_ERROR | E_PARSE);
    ini_set('display_errors', 0);
    AppLogger::getInstance()->configure(false, true);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    AppLogger::getInstance()->configure(true, true);
}

set_error_handler(function($severity, $message, $file, $line) {
    $context = [
        'file' => $file,
        'line' => $line,
        'severity' => $severity
    ];

    if ($severity & (E_ERROR | E_CORE_ERROR | E_COMPILE_ERROR | E_USER_ERROR)) {
        logger()->error("PHP Error: $message", $context);
    } elseif ($severity & (E_WARNING | E_CORE_WARNING | E_COMPILE_WARNING | E_USER_WARNING)) {
        logger()->warning("PHP Warning: $message", $context);
    } else {
        logger()->debug("PHP Notice: $message", $context);
    }

    return false; 
});

set_exception_handler(function($exception) {
    logger()->exception($exception);

    $isApiRoute = isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/api/') === 0;
    
    if ($isApiRoute) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => [
                'code' => 500,
                'message' => EnvLoader::get('APP_ENV') !== 'production' 
                    ? $exception->getMessage() 
                    : 'Internal server error'
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        exit;
    }

    if (EnvLoader::get('APP_ENV') !== 'production') {
        echo "<h1>Uncaught Exception</h1>";
        echo "<pre>" . $exception->getMessage() . "\n";
        echo $exception->getTraceAsString() . "</pre>";
    } else {
        echo "An error occurred. Please try again later.";
    }
});

logger()->info('Application starting', [
    'version' => APP_VERSION,
    'environment' => EnvLoader::get('APP_ENV', 'development'),
    'timestamp' => date('Y-m-d H:i:s')
]);

if (file_exists(__DIR__ . '/videosdk.php')) {
    require_once __DIR__ . '/videosdk.php';
}

if (file_exists(__DIR__ . '/google_oauth.php')) {
    require_once __DIR__ . '/google_oauth.php';
}