<?php

require_once __DIR__ . '/env.php';

$sessionLifetime = EnvLoader::get('SESSION_LIFETIME', 86400);
$sessionSecure = EnvLoader::get('SESSION_SECURE', 'false') === 'true';
$sessionHttpOnly = EnvLoader::get('SESSION_HTTPONLY', 'true') === 'true';
$sessionSameSite = EnvLoader::get('SESSION_SAMESITE', 'Lax');

ini_set('session.cookie_lifetime', $sessionLifetime);
ini_set('session.gc_maxlifetime', $sessionLifetime);
ini_set('session.cookie_path', '/');
ini_set('session.cookie_domain', '');
ini_set('session.cookie_secure', $sessionSecure ? '1' : '0');
ini_set('session.cookie_httponly', $sessionHttpOnly ? '1' : '0');
ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_samesite', $sessionSameSite);
ini_set('session.use_only_cookies', '1');
ini_set('session.sid_length', '48');
ini_set('session.sid_bits_per_character', '6');
ini_set('session.hash_function', 'sha256');
ini_set('session.cache_limiter', 'nocache');

if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    session_start();
}

