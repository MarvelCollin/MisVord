<?php

// Load environment variables first
require_once __DIR__ . '/env.php';

// Configure sessions based on environment variables before any session_start()
$sessionLifetime = EnvLoader::get('SESSION_LIFETIME', 86400);
$sessionSecure = EnvLoader::get('SESSION_SECURE', 'false') === 'true';
$sessionHttpOnly = EnvLoader::get('SESSION_HTTPONLY', 'true') === 'true';

// Configure session settings before session_start()
ini_set('session.cookie_lifetime', $sessionLifetime);
ini_set('session.cookie_path', '/');
ini_set('session.cookie_domain', '');
ini_set('session.cookie_secure', $sessionSecure ? '1' : '0');
ini_set('session.cookie_httponly', $sessionHttpOnly ? '1' : '0');
ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_samesite', 'Lax');

// Set session name
// session_name('misvord_session');
