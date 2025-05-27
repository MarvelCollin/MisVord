<?php

$routes = require_once __DIR__ . '/routes.php';

$GLOBALS['active_route'] = null;

function displayActiveRoute($uri, $matchedRoute, $viewFile) {
    $style = "
        position: fixed;
        bottom: 10px;
        right: 10px;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        max-width: 300px;
        word-break: break-all;
    ";

    echo "<div style=\"{$style}\">";
    echo "<strong>Active Route Info:</strong><br>";
    echo "Request URI: {$uri}<br>";
    echo "Matched Route: {$matchedRoute}<br>";
    echo "View File: {$viewFile}";
    echo "</div>";
}

function handleRoute($routes) {

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

    error_log("Handling route: " . $uri);

    $method = $_SERVER['REQUEST_METHOD'];

    $methodRoute = $method . ':' . $uri;

    $scriptName = $_SERVER['SCRIPT_NAME'];

    $scriptDir = dirname($scriptName);

    if ($scriptDir !== '/' && !empty($scriptDir)) {

        if (strpos($uri, $scriptDir) === 0) {
            $uri = substr($uri, strlen($scriptDir));
        }
    }

    $uri = '/' . trim($uri, '/');

    if ($uri === '//') {
        $uri = '/';
    }

    error_log("Normalized URI: " . $uri);

    $GLOBALS['active_route'] = $uri;

    if (isset($routes[$methodRoute])) {
        error_log("Found exact method route match: " . $methodRoute);
        if (is_callable($routes[$methodRoute])) {

            $routes[$methodRoute]();
            return;
        }
        $viewFile = $routes[$methodRoute];
        $matchedRoute = $methodRoute;
    } 

    elseif (isset($routes[$uri])) {
        error_log("Found exact route match: " . $uri);
        if (is_callable($routes[$uri])) {

            $routes[$uri]();
            return;
        }
        $viewFile = $routes[$uri];
        $matchedRoute = $uri;
    } 

    else {
        $matched = false;

        foreach ($routes as $pattern => $handler) {

            if (strpos($pattern, '{') === false) {
                continue;
            }

            $methodPattern = null;
            if (strpos($pattern, ':') !== false) {
                list($methodName, $urlPattern) = explode(':', $pattern, 2);
                if ($methodName !== $method) {
                    continue; 
                }
                $methodPattern = $methodName;
                $pattern = $urlPattern;
            }

            $patternRegex = preg_quote($pattern, '#');
            $patternRegex = preg_replace('/\\\{([a-zA-Z0-9_]+)\\\}/', '(?P<$1>[^/]+)', $patternRegex);
            $patternRegex = '#^' . $patternRegex . '$#';

            error_log("Testing pattern: " . $pattern . " against URI: " . $uri . " with regex: " . $patternRegex);

            if (preg_match($patternRegex, $uri, $matches)) {
                error_log("Pattern matched! Extracting parameters: " . json_encode($matches));

                $params = [];

                foreach ($matches as $key => $value) {
                    if (is_string($key)) {
                        $params[$key] = $value;
                    }
                }

                if ($methodPattern !== null) {
                    $pattern = $methodPattern . ':' . $pattern;
                }

                if (is_callable($handler)) {
                    error_log("Executing handler for: " . $pattern . " with params: " . json_encode($params));
                    $handler($params);
                    $matched = true;
                    return;
                } else {
                    error_log("Handler is not callable for: " . $pattern);
                    $viewFile = $handler;
                    $matchedRoute = $pattern;
                    $matched = true;
                    break;
                }
            }
        }

        if (!$matched) {
            error_log("No route matched for: " . $uri);
            $viewFile = $routes['404'];
            $matchedRoute = '404 (Not Found)';
            http_response_code(404);
        }
    }

    $viewsPath = dirname(__DIR__) . '/views/';

    $fullPath = $viewsPath . $viewFile;
    error_log("Loading view file: " . $fullPath);

    $routeInfo = [
        'uri' => $uri,
        'matchedRoute' => $matchedRoute,
        'viewFile' => $viewFile
    ];

    $GLOBALS['route_info'] = $routeInfo;

    if (file_exists($fullPath)) {

        if (isset($_GET['debug']) && $_GET['debug'] === '1') {

            register_shutdown_function(function() use ($uri, $matchedRoute, $viewFile) {
                displayActiveRoute($uri, $matchedRoute, $viewFile);
            });
        }

        require $fullPath;
    } else {

        echo "Error: View file not found at {$fullPath}";
    }

    exit;
}

if (php_sapi_name() !== 'cli') {
    handleRoute($routes);
}