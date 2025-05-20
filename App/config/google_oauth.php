<?php
/**
 * Google OAuth Configuration
 * 
 * This file contains settings for Google OAuth integration.
 */

$domain = getenv('DOMAIN') ?: 'localhost';
$subpath = getenv('SUBPATH') ? '/' . trim(getenv('SUBPATH'), '/') : '';
$protocol = (getenv('USE_HTTPS') === 'true') ? 'https' : 'http';

// Construct the base URL
$baseUrl = $protocol . '://' . $domain . $subpath;

return [
    // Google OAuth Client ID - Loaded from environment
    'client_id' => getenv('GOOGLE_CLIENT_ID') ?: '',
    
    // Google OAuth Client Secret - Loaded from environment
    'client_secret' => getenv('GOOGLE_CLIENT_SECRET') ?: '',
    
    // OAuth redirect URL - Dynamically constructed
    'redirect_uri' => $baseUrl . '/google/', // Assuming /google/ is your callback endpoint
    
    // OAuth scopes
    'scopes' => ['email', 'profile'],
    
    // OAuth endpoints
    'auth_url' => 'https://accounts.google.com/o/oauth2/v2/auth',
    'token_url' => 'https://oauth2.googleapis.com/token',
    'user_info_url' => 'https://www.googleapis.com/oauth2/v3/userinfo',
];
