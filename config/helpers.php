<?php

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__));
if (!defined('VIEWS_PATH')) define('VIEWS_PATH', ROOT_PATH . '/views');
if (!defined('PUBLIC_PATH')) define('PUBLIC_PATH', ROOT_PATH . '/public');
if (!defined('MIGRATIONS_PATH')) define('MIGRATIONS_PATH', ROOT_PATH . '/migrations');

if (!class_exists('EnvLoader')) {
    require_once __DIR__ . '/env.php';
}

function asset($path) {
    $isVPS = EnvLoader::get('IS_VPS', 'false') === 'true';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $vpsHost = EnvLoader::get('DOMAIN', 'localhost');
    $isVPSDomain = ($isVPS || strpos($host, $vpsHost) !== false) && $vpsHost !== 'localhost';
    
    $useHttps = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
    if ($isVPSDomain) {
        $useHttps = true;
        $host = str_replace(':1001', '', $host);
    }
    
    $protocol = $useHttps ? "https://" : "http://";
    $basePath = '/public';
    
    $path = '/' . ltrim($path, '/');
    
    if (strpos($path, '/css/') === 0 || strpos($path, '/js/') === 0) {
        
    } else if (strpos($path, '/assets/') !== 0) {
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
    $finalUrl = "{$baseUrl}/css/{$path}";
    $finalUrl = preg_replace('#([^:])//+#', '$1/', $finalUrl);

    return $finalUrl;
}

function js($path) {
    $path = ltrim($path, '/');
    if (!str_ends_with($path, '.js')) {
        $path .= '.js';
    }

    $baseUrl = getBaseUrl();
    $finalUrl = "{$baseUrl}/js/{$path}";
    $finalUrl = preg_replace('#([^:])//+#', '$1/', $finalUrl);

    return $finalUrl;
}

function getBaseUrl() {
    if (php_sapi_name() === 'cli') {
        return EnvLoader::get('APP_URL', 'http://localhost:8000') . '/public';
    }

    $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
    $isVPS = EnvLoader::get('IS_VPS', 'false') === 'true';
    $vpsHost = EnvLoader::get('DOMAIN', 'localhost');
    $isVPSDomain = ($isVPS || strpos($host, $vpsHost) !== false) && $vpsHost !== 'localhost';
    
    if (!$isVPSDomain && !strpos($host, ':') && isset($_SERVER['SERVER_PORT'])) {
        $port = $_SERVER['SERVER_PORT'];
        if ($port != '80' && $port != '443') {
            $host .= ':' . $port;
        }
    }

    $useHttps = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    if ($isVPSDomain) {
        $useHttps = true;
        $host = str_replace(':1001', '', $host);
    }

    $protocol = $useHttps ? 'https' : 'http';
    $scriptDir = '/public';

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