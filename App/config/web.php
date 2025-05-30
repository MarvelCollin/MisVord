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
    
    $GLOBALS['active_route'] = $uri;
    
    $viewFile = null;
    $matchedRoute = null;
    
    if (isset($routes[$methodRoute])) {
        // Found exact method route match
        if (is_callable($routes[$methodRoute])) {
            $routes[$methodRoute]();
            return;
        }
        $viewFile = $routes[$methodRoute];
        $matchedRoute = $methodRoute;
    } elseif (isset($routes[$uri])) {
        // Found exact route match
        if (is_callable($routes[$uri])) {
            $routes[$uri]();
            return;
        }
        $viewFile = $routes[$uri];
        $matchedRoute = $uri;
    } else {
        $matched = false;

        foreach ($routes as $pattern => $handler) {
            if (strpos($pattern, '{') === false && !preg_match('/\([^)]+\)/', $pattern)) {
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

            if (strpos($pattern, '{') !== false) {
                $patternRegex = preg_quote($pattern, '#');
                $patternRegex = preg_replace('/\\\{([a-zA-Z0-9_]+)\\\}/', '(?P<$1>[^/]+)', $patternRegex);
                $patternRegex = '#^' . $patternRegex . '$#';
            } else {
                $patternRegex = '#^' . $pattern . '$#';
            }

            if (preg_match($patternRegex, $uri, $matches)) {
                if (strpos($pattern, '{') !== false) {
                    $params = [];
                    foreach ($matches as $key => $value) {
                        if (is_string($key)) {
                            $params[$key] = $value;
                        }
                    }
                } else {
                    $params = isset($matches[1]) ? $matches[1] : $matches[0];
                }

                if ($methodPattern !== null) {
                    $pattern = $methodPattern . ':' . $pattern;
                }
                
                if (is_callable($handler)) {
                    $handler($params);
                    $matched = true;
                    return;
                } else {
                    $viewFile = $handler;
                    $matchedRoute = $pattern;
                    $matched = true;
                    break;
                }
            }
        }
        
        if (!$matched) {
            // No route matched
            $viewFile = $routes['404'] ?? 'pages/404.php';
            $matchedRoute = '404 (Not Found)';
            http_response_code(404);
        }
    }
    
    $viewsPath = dirname(__DIR__) . '/views/';
    $fullPath = $viewsPath . $viewFile;

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
        // Error: View file not found
        http_response_code(404);
        echo "<h1>Page Not Found</h1>";
        echo "<p>The requested page could not be found.</p>";
        echo "<p>Error: View file not found at {$fullPath}</p>";
    }
}

if (php_sapi_name() !== 'cli') {
    handleRoute($routes);
}