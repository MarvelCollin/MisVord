<?php

require_once __DIR__ . '/env.php';

$sessionLifetime = EnvLoader::get('SESSION_LIFETIME', 86400);
$sessionSecure = false;
$sessionHttpOnly = false;
$sessionSameSite = 'None';

ini_set('session.cookie_lifetime', $sessionLifetime);
ini_set('session.gc_maxlifetime', $sessionLifetime);
ini_set('session.cookie_path', '/');
ini_set('session.cookie_domain', '');
ini_set('session.cookie_secure', '0');
ini_set('session.cookie_httponly', '0');
ini_set('session.use_strict_mode', '0');
ini_set('session.cookie_samesite', $sessionSameSite);
ini_set('session.use_only_cookies', '1');
ini_set('session.sid_length', '48');
ini_set('session.sid_bits_per_character', '6');
ini_set('session.hash_function', 'sha256');
ini_set('session.cache_limiter', 'nocache');
ini_set('session.trans_sid_hosts', '');
ini_set('session.trans_sid_tags', '');
ini_set('session.referer_check', '');

ini_set('session.gc_probability', 1);
ini_set('session.gc_divisor', 100);

if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    session_start();
    
    if (!isset($_SESSION['last_activity'])) {
        $_SESSION['last_activity'] = time();
    } elseif (time() - $_SESSION['last_activity'] > $sessionLifetime) {
        session_unset();
        session_destroy();
        session_start();
        $_SESSION['last_activity'] = time();
    }
    
    $_SESSION['last_activity'] = time();
    
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
}

