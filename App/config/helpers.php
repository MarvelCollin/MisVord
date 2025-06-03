<?php

if (!defined('ROOT_PATH')) define('ROOT_PATH', dirname(__DIR__));
if (!defined('VIEWS_PATH')) define('VIEWS_PATH', ROOT_PATH . '/views');
if (!defined('PUBLIC_PATH')) define('PUBLIC_PATH', ROOT_PATH . '/public');
if (!defined('MIGRATIONS_PATH')) define('MIGRATIONS_PATH', ROOT_PATH . '/migrations');

function asset($path) {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https://" : "http://";
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';

    $basePath = '';
    if (php_sapi_name() === 'cli' || $host === 'localhost' || strpos($host, '127.0.0.1') !== false) {
        $basePath = '/misvord';
    }

    if (strpos($host, 'marvelcollin.my.id') !== false) {
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
    $isMarvelDomain = strpos($host, 'marvelcollin.my.id') !== false;

    if ($isMarvelDomain && strpos($baseUrl, '/misvord') === false) {
        $finalUrl = str_replace("://{$host}", "://{$host}/misvord", $baseUrl) . "/css/{$path}";
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
    $isMarvelDomain = strpos($host, 'marvelcollin.my.id') !== false;

    if ($isMarvelDomain && strpos($baseUrl, '/misvord') === false) {
        $finalUrl = str_replace("://{$host}", "://{$host}/misvord", $baseUrl) . "/js/{$path}";
    } else {
        $finalUrl = "{$baseUrl}/js/{$path}";
    }

    $finalUrl = preg_replace('#([^:])//+#', '$1/', $finalUrl);

    return $finalUrl;
}

function getBaseUrl() {
    if (php_sapi_name() === 'cli') {
        return 'http://localhost:1001/public';
    }

    $host = $_SERVER['HTTP_HOST'] ?? 'localhost:1001';

    $useHttps = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';

    if (strpos($host, 'marvelcollin.my.id') !== false) {
        $useHttps = true;
    }

    $protocol = $useHttps ? 'https' : 'http';
    $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');

    if (strpos($host, 'marvelcollin.my.id') !== false) {
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

function formatDate($date, $format = 'd M Y') {
    if (is_numeric($date)) {
        return date($format, $date);
    }
    return date($format, strtotime($date));
}

function truncateText($text, $length = 100, $append = '...') {
    if (strlen($text) > $length) {
        $text = substr($text, 0, $length) . $append;
    }
    return $text;
}