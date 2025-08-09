<?php

define('IS_DEVELOPMENT', true);

function isIframeRequest() {
    $secFetchDest = $_SERVER['HTTP_SEC_FETCH_DEST'] ?? '';
    $secFetchSite = $_SERVER['HTTP_SEC_FETCH_SITE'] ?? '';
    $secFetchMode = $_SERVER['HTTP_SEC_FETCH_MODE'] ?? '';
    
    if ($secFetchDest === 'iframe') {
        return true;
    }
    
    if ($secFetchSite === 'cross-site' || $secFetchSite === 'same-site') {
        return true;
    }
    
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    $host = $_SERVER['HTTP_HOST'] ?? '';
    
    if ($referer && !empty($host)) {
        $refererHost = parse_url($referer, PHP_URL_HOST);
        if ($refererHost && $refererHost !== $host) {
            return true;
        }
    }
    
    if (isset($_COOKIE['iframe_session']) || isset($_GET['iframe']) || isset($_POST['iframe'])) {
        return true;
    }
    
    if (isset($_SERVER['HTTP_X_IFRAME_REQUEST']) || isset($_SERVER['HTTP_X_REQUESTED_WITH'])) {
        return true;
    }
    
    return false;
}

function validateIframeAccess() {
    if (IS_DEVELOPMENT || defined('BYPASS_IFRAME_CHECK')) {
        return true;
    }
    
    if (!isIframeRequest()) {
        if (!headers_sent()) {
            header('Location: /not-allowed');
        }
        exit;
    }
    
    return true;
}

function setIframeCookieOptions() {
    if (isIframeRequest()) {
        ini_set('session.cookie_samesite', 'None');
        ini_set('session.cookie_secure', '1');
        ini_set('session.cookie_httponly', '0');
        
        if (function_exists('session_set_cookie_params')) {
            session_set_cookie_params([
                'lifetime' => 86400,
                'path' => '/',
                'domain' => '',
                'secure' => true,
                'httponly' => false,
                'samesite' => 'None'
            ]);
        }
    }
}
