<?php

require_once __DIR__ . '/../database/models/User.php';

class GoogleAuthController {
    private $clientId;
    private $clientSecret;
    private $redirectUri;
    
    /**
     * Constructor - initialize Google OAuth settings
     */
    public function __construct() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Load OAuth configuration
        $config = require __DIR__ . '/../config/google_oauth.php';
        
        // Initialize OAuth credentials
        $this->clientId = $config['client_id'];
        $this->clientSecret = $config['client_secret'];
        $this->redirectUri = $config['redirect_uri'];
        
        error_log("GoogleAuthController initialized with: clientId={$this->clientId}, redirectUri={$this->redirectUri}");
    }
    
    /**
     * Redirect to Google OAuth page
     */
    public function redirect() {
        // Generate a random state parameter for CSRF protection
        $state = bin2hex(random_bytes(16));
        $_SESSION['oauth_state'] = $state;
        
        // Build the OAuth URL
        $params = [
            'client_id' => $this->clientId,
            'redirect_uri' => $this->redirectUri,
            'response_type' => 'code',
            'scope' => 'email profile',
            'state' => $state,
            'prompt' => 'select_account',
        ];
        
        $url = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
        error_log("Redirecting to Google OAuth: $url");
        
        // Redirect to Google
        header('Location: ' . $url);
        exit;
    }
    
    /**
     * Handle OAuth callback
     */
    public function callback() {
        error_log("Google OAuth callback received: " . json_encode($_GET));
        
        // Verify state parameter
        if (!isset($_GET['state']) || !isset($_SESSION['oauth_state']) || $_GET['state'] !== $_SESSION['oauth_state']) {
            error_log("OAuth state validation failed. Received: " . ($_GET['state'] ?? 'null') . ", Expected: " . ($_SESSION['oauth_state'] ?? 'not set'));
            $_SESSION['errors'] = ['auth' => 'Invalid state parameter. Possible CSRF attack.'];
            header('Location: /login');
            exit;
        }
        
        // Check for error
        if (isset($_GET['error'])) {
            error_log("Google OAuth error: " . $_GET['error']);
            $_SESSION['errors'] = ['auth' => 'Google authentication error: ' . $_GET['error']];
            header('Location: /login');
            exit;
        }
        
        // Get authorization code
        if (!isset($_GET['code'])) {
            error_log("No authorization code received from Google");
            $_SESSION['errors'] = ['auth' => 'No authorization code received from Google.'];
            header('Location: /login');
            exit;
        }
        
        $code = $_GET['code'];
        error_log("Received authorization code: " . substr($code, 0, 10) . "...");
        
        try {
            // Exchange code for access token
            $tokenData = $this->getAccessToken($code);
            
            if (!isset($tokenData['access_token'])) {
                $errorMsg = isset($tokenData['error']) ? 
                    "Failed to get access token: {$tokenData['error']} - {$tokenData['error_description']}" : 
                    "Failed to get access token: " . json_encode($tokenData);
                    
                error_log($errorMsg);
                throw new Exception($errorMsg);
            }
            
            // Get user info using the access token
            $userInfo = $this->getUserInfo($tokenData['access_token']);
            error_log("Google user info received: " . json_encode($userInfo));
            
            // Find or create user
            $this->authenticateUser($userInfo);
            
            // Redirect to app
            header('Location: /app');
            exit;
            
        } catch (Exception $e) {
            error_log('Google OAuth error: ' . $e->getMessage());
            $_SESSION['errors'] = ['auth' => 'Google authentication error: ' . $e->getMessage()];
            header('Location: /login');
            exit;
        }
    }
    
    /**
     * Exchange authorization code for access token
     */
    private function getAccessToken($code) {
        $params = [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'code' => $code,
            'redirect_uri' => $this->redirectUri,
            'grant_type' => 'authorization_code'
        ];
        
        // Log request parameters (without showing client secret)
        error_log("Token request parameters: client_id={$this->clientId}, redirect_uri={$this->redirectUri}, grant_type=authorization_code");
        
        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
        
        // For debugging
        curl_setopt($ch, CURLOPT_VERBOSE, true);
        $verbose = fopen('php://temp', 'w+');
        curl_setopt($ch, CURLOPT_STDERR, $verbose);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            
            // Log verbose output
            rewind($verbose);
            $verboseLog = stream_get_contents($verbose);
            error_log("cURL verbose log: " . $verboseLog);
            
            throw new Exception('cURL error when getting access token: ' . $error);
        }
        
        // Log verbose output
        rewind($verbose);
        $verboseLog = stream_get_contents($verbose);
        error_log("cURL verbose log: " . $verboseLog);
        
        curl_close($ch);
        
        // Log response details
        error_log("Token response HTTP code: " . $httpCode);
        error_log("Token response body: " . $response);
        
        return json_decode($response, true);
    }
    
    /**
     * Get user info using access token
     */
    private function getUserInfo($accessToken) {
        $ch = curl_init('https://www.googleapis.com/oauth2/v3/userinfo');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken
        ]);
        
        $response = curl_exec($ch);
        
        if (curl_errno($ch)) {
            throw new Exception('cURL error when getting user info: ' . curl_error($ch));
        }
        
        curl_close($ch);
        return json_decode($response, true);
    }
    
    /**
     * Authenticate or create user with Google data
     */
    private function authenticateUser($googleData) {
        if (!isset($googleData['sub']) || !isset($googleData['email'])) {
            throw new Exception("Incomplete user data received from Google");
        }
        
        $googleId = $googleData['sub'];
        $email = $googleData['email'];
        $name = $googleData['name'] ?? null;
        $firstName = $googleData['given_name'] ?? null;
        $lastName = $googleData['family_name'] ?? null;
        $picture = $googleData['picture'] ?? null;
        
        error_log("Authenticating Google user: email={$email}, name={$name}, picture=" . ($picture ? "provided" : "not provided"));
        
        // Try to find user by Google ID first
        $user = User::findByGoogleId($googleId);
        
        if (!$user) {
            // Try to find by email
            $user = User::findByEmail($email);
            
            if ($user) {
                // User exists but hasn't used Google login before
                error_log("User found by email, updating Google ID: user_id={$user->id}");
                $user->google_id = $googleId;
                $user->avatar_url = $picture;
                $user->save();
            } else {
                // Create new user
                error_log("Creating new user from Google data");
                $user = new User();
                $user->username = $name ?? $email;
                $user->email = $email;
                $user->google_id = $googleId;
                $user->avatar_url = $picture;
                $user->status = 'online';
                
                if (!$user->save()) {
                    throw new Exception("Failed to create user account");
                }
                error_log("Created new user: user_id={$user->id}");
            }
        } else {
            error_log("User found by Google ID: user_id={$user->id}");
            // Update existing user's avatar if needed
            if ($user->avatar_url != $picture) {
                $user->avatar_url = $picture;
                $user->save();
            }
        }
        
        // Log user in
        $_SESSION['user_id'] = $user->id;
        $_SESSION['username'] = $user->username;
        $_SESSION['avatar_url'] = $user->avatar_url;
        
        // Update user status
        $user->status = 'online';
        $user->save();
        
        error_log("User authenticated successfully: user_id={$user->id}, username={$user->username}");
    }
}
