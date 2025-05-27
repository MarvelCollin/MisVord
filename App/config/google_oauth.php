<?php

$domain = getenv('DOMAIN') ?: 'localhost';
$subpath = getenv('SUBPATH') ? '/' . trim(getenv('SUBPATH'), '/') : '';
$protocol = (getenv('USE_HTTPS') === 'true') ? 'https' : 'http';

$baseUrl = $protocol . '://' . $domain . $subpath;

return [

    'client_id' => getenv('GOOGLE_CLIENT_ID') ?: '',

    'client_secret' => getenv('GOOGLE_CLIENT_SECRET') ?: '',

    'redirect_uri' => $baseUrl . '/google/', 

    'scopes' => ['email', 'profile'],

    'auth_url' => 'https://accounts.google.com/o/oauth2/v2/auth',
    'token_url' => 'https://oauth2.googleapis.com/token',
    'user_info_url' => 'https://www.googleapis.com/oauth2/v3/userinfo',
];