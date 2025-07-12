<?php

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__));
if (!defined('VIEWS_PATH')) define('VIEWS_PATH', ROOT_PATH . '/views');
if (!defined('PUBLIC_PATH')) define('PUBLIC_PATH', ROOT_PATH . '/public');
if (!defined('MIGRATIONS_PATH')) define('MIGRATIONS_PATH', ROOT_PATH . '/migrations');

function asset($path) {
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
    
    $envDomain = EnvLoader::get('DOMAIN', 'localhost');
    $isVPS = EnvLoader::get('IS_VPS', 'false') === 'true';
    $useHttps = EnvLoader::get('USE_HTTPS', 'false') === 'true';
    
    $isMatchingDomain = strpos($host, $envDomain) !== false && $envDomain !== 'localhost';
    
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https://" : "http://";
    if ($isVPS || $useHttps || $isMatchingDomain) {
        $protocol = "https://";
        $host = preg_replace('/:\d+$/', '', $host);
    }

    $basePath = '';
    if (php_sapi_name() === 'cli' || $host === 'localhost' || strpos($host, '127.0.0.1') !== false || $isVPS || $isMatchingDomain) {
        $basePath = '/misvord';
    }

    if (strpos($basePath, '/public') === false) {
        $basePath = $basePath . '/public';
    }

    $path = '/' . ltrim($path, '/');

    if (strpos($path, '/css/') === 0 || strpos($path, '/js/') === 0) {

    } 

    else if (strpos($path, '/assets/') !== 0) {
        $path = '/assets' . $path;
    }

    return $protocol . $host . $basePath . $path;
}

function css($path) {
    $path = ltrim($path, '/');
    if (!str_ends_with($path, '.css')) {
        $path .= '.css';
    }

    $baseUrl = getBaseUrl();

    $host = $_SERVER['HTTP_HOST'] ?? '';
    $envDomain = EnvLoader::get('DOMAIN', 'localhost');
    $isVPS = EnvLoader::get('IS_VPS', 'false') === 'true';
    
    $isMatchingDomain = strpos($host, $envDomain) !== false && $envDomain !== 'localhost';

    if ($isVPS || $isMatchingDomain) {
        $finalUrl = preg_replace('#:\d+#', '', $baseUrl) . "/css/{$path}";
        if (strpos($finalUrl, '/misvord') === false) {
            $finalUrl = str_replace('/public/', '/misvord/public/', $finalUrl);
        }
    } else {
        $finalUrl = "{$baseUrl}/css/{$path}";
    }

    $finalUrl = preg_replace('#([^:])//+#', '$1/', $finalUrl);

    return $finalUrl;
}

function js($path) {
    $path = ltrim($path, '/');
    if (!str_ends_with($path, '.js')) {
        $path .= '.js';
    }

    $baseUrl = getBaseUrl();

    $host = $_SERVER['HTTP_HOST'] ?? '';
    $envDomain = EnvLoader::get('DOMAIN', 'localhost');
    $isVPS = EnvLoader::get('IS_VPS', 'false') === 'true';
    
    $isMatchingDomain = strpos($host, $envDomain) !== false && $envDomain !== 'localhost';

    if ($isVPS || $isMatchingDomain) {
        $finalUrl = preg_replace('#:\d+#', '', $baseUrl) . "/js/{$path}";
        if (strpos($finalUrl, '/misvord') === false) {
            $finalUrl = str_replace('/public/', '/misvord/public/', $finalUrl);
        }
    } else {
        $finalUrl = "{$baseUrl}/js/{$path}";
    }

    $finalUrl = preg_replace('#([^:])//+#', '$1/', $finalUrl);

    return $finalUrl;
}

function getBaseUrl() {
    if (php_sapi_name() === 'cli') {
        return EnvLoader::get('APP_URL', 'http://localhost:8000') . '/public';
    }

    $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
    
    $envDomain = EnvLoader::get('DOMAIN', 'localhost');
    $isVPS = EnvLoader::get('IS_VPS', 'false') === 'true';
    $useHttps = EnvLoader::get('USE_HTTPS', 'false') === 'true';
    
    $isMatchingDomain = strpos($host, $envDomain) !== false && $envDomain !== 'localhost';
    
    if (!$isVPS && !$isMatchingDomain && !strpos($host, ':') && isset($_SERVER['SERVER_PORT'])) {
        $port = $_SERVER['SERVER_PORT'];
        if ($port != '80' && $port != '443') {
            $host .= ':' . $port;
        }
    }

    $useHttpsProtocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    if ($isVPS || $useHttps || $isMatchingDomain) {
        $useHttpsProtocol = true;
        $host = preg_replace('/:\d+$/', '', $host);
    }

    $protocol = $useHttpsProtocol ? 'https' : 'http';
    $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');

    if ($isVPS || $isMatchingDomain) {
        if (strpos($scriptDir, '/misvord') === false) {
            $scriptDir = '/misvord';
        }
    }

    if (strpos($scriptDir, '/public') === false) {
        $scriptDir = $scriptDir . '/public';
    }

    $baseUrl = "{$protocol}://{$host}{$scriptDir}";

    return $baseUrl;
}

function create_migration($name) {
    $timestamp = date('YmdHis');
    $filename = $timestamp . '_' . snake_case($name) . '.php';
    $filepath = MIGRATIONS_PATH . '/' . $filename;

    $className = studly_case($name) . 'Migration';

    $content = <<<EOT
<?php

class {$className} {
    public function up(\$migration) {

        \$migration->createTable('table_name', function(\$table) {
            \$table->id();
            \$table->string('name');
            \$table->timestamps();
        });
    }

    public function down(\$migration) {

        \$migration->dropTable('table_name', true);
    }
}
EOT;

    if (file_put_contents($filepath, $content)) {
        return $filepath;
    }

    return false;
}

function snake_case($string) {
    $string = preg_replace('/\s+/', '_', strtolower($string));
    $string = preg_replace('/(.)(?=[A-Z])/', '$1_', $string);
    return strtolower($string);
}

function studly_case($string) {
    $string = ucwords(str_replace(['-', '_'], ' ', $string));
    return str_replace(' ', '', $string);
}

function indonesiaTime($format = 'Y-m-d H:i:s') {
    $timezone = new DateTimeZone('Asia/Jakarta');
    $date = new DateTime('now', $timezone);
    return $date->format($format);
}

function formatDate($date, $format = 'd M Y') {
    $timezone = new DateTimeZone('Asia/Jakarta');
    if (is_numeric($date)) {
        $dateObj = new DateTime('@' . $date);
        $dateObj->setTimezone($timezone);
        return $dateObj->format($format);
    }
    $dateObj = new DateTime($date, $timezone);
    return $dateObj->format($format);
}

function truncateText($text, $length = 100, $append = '...') {
    if (strlen($text) > $length) {
        $text = substr($text, 0, $length) . $append;
    }
    return $text;
}

function getDefaultAvatar($username = 'User') {
    return '';
}

function getUserAvatar($avatarUrl, $username = 'User') {
    return htmlspecialchars($avatarUrl ?? '');
}

function getDefaultAvatarUrl() {
    return '';
}