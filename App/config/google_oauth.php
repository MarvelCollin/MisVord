<?php
/**
 * Google OAuth Configuration
 * 
 * This file contains settings for Google OAuth integration.
 */

return [
    // Google OAuth Client ID
    'client_id' => '833443291583-i4ae59d75dflj5va4fff64j0vug6ab49.apps.googleusercontent.com',
    
    // Google OAuth Client Secret
    'client_secret' => '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',
    
    // OAuth redirect URL
    'redirect_uri' => 'http://localhost:8000/google/',
    
    // OAuth scopes
    'scopes' => ['email', 'profile'],
    
    // OAuth endpoints
    'auth_url' => 'https://accounts.google.com/o/oauth2/v2/auth',
    'token_url' => 'https://oauth2.googleapis.com/token',
    'user_info_url' => 'https://www.googleapis.com/oauth2/v3/userinfo',
];
