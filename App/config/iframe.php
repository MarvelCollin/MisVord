<?php

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
    
    return false;
}

function setIframeCookieOptions() {
    if (isIframeRequest()) {
        ini_set('session.cookie_samesite', 'None');
        ini_set('session.cookie_secure', '1');
    }
}
