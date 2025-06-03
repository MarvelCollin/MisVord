<?php

require_once __DIR__ . '/env.php';

require_once __DIR__ . '/db.php';

require_once __DIR__ . '/helpers.php';

define('APP_NAME', 'MiscVord');
define('APP_VERSION', '1.0.0');

date_default_timezone_set('Asia/Jakarta');

if (EnvLoader::get('APP_ENV') === 'production') {
    error_reporting(E_ERROR | E_PARSE);
    ini_set('display_errors', 0);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

if (file_exists(__DIR__ . '/videosdk.php')) {
    require_once __DIR__ . '/videosdk.php';
}

if (file_exists(__DIR__ . '/google_oauth.php')) {
    require_once __DIR__ . '/google_oauth.php';
}