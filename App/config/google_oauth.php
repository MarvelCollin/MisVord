<?php

require_once __DIR__ . '/env.php';

$domain = EnvLoader::get('DOMAIN', 'localhost');
$subpath = EnvLoader::get('SUBPATH') ? '/' . trim(EnvLoader::get('SUBPATH'), '/') : '';
$protocol = (EnvLoader::get('USE_HTTPS') === 'true') ? 'https' : 'http';

$baseUrl = $protocol . '://' . $domain . $subpath;

return [

    'client_id' => EnvLoader::get('GOOGLE_CLIENT_ID', ''),

    'client_secret' => EnvLoader::get('GOOGLE_CLIENT_SECRET', ''),

    'redirect_uri' => $baseUrl . '/google/', 

    'scopes' => ['email', 'profile'],

    'auth_url' => 'https://accounts.google.com/o/oauth2/v2/auth',
    'token_url' => 'https://oauth2.googleapis.com/token',
    'user_info_url' => 'https://www.googleapis.com/oauth2/v3/userinfo',
];