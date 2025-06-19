<?php

require_once __DIR__ . '/../database/repositories/UserRepository.php';

class GoogleAuthController
{
    private $clientId;
    private $clientSecret;
    private $redirectUri;
    private $userRepository;

    public function __construct()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $this->userRepository = new UserRepository();

        $config = require __DIR__ . '/../config/google_oauth.php';

        $this->clientId = $config['client_id'];
        $this->clientSecret = $config['client_secret'];
        $this->redirectUri = $config['redirect_uri'];

        error_log("GoogleAuthController initialized with: clientId={$this->clientId}, redirectUri={$this->redirectUri}");
    }

    public function redirect()
    {

        $state = bin2hex(random_bytes(16));
        $_SESSION['oauth_state'] = $state;

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

        header('Location: ' . $url);
        exit;
    }

    public function callback()
    {
        error_log("Google OAuth callback received: " . json_encode($_GET));

        if (!isset($_GET['state']) || !isset($_SESSION['oauth_state']) || $_GET['state'] !== $_SESSION['oauth_state']) {
            error_log("OAuth state validation failed. Received: " . ($_GET['state'] ?? 'null') . ", Expected: " . ($_SESSION['oauth_state'] ?? 'not set'));
            $_SESSION['errors'] = ['auth' => 'Invalid state parameter. Possible CSRF attack.'];
            header('Location: /login');
            exit;
        }

        if (isset($_GET['error'])) {
            error_log("Google OAuth error: " . $_GET['error']);
            $_SESSION['errors'] = ['auth' => 'Google authentication error: ' . $_GET['error']];
            header('Location: /login');
            exit;
        }

        if (!isset($_GET['code'])) {
            error_log("No authorization code received from Google");
            $_SESSION['errors'] = ['auth' => 'No authorization code received from Google.'];
            header('Location: /login');
            exit;
        }

        $code = $_GET['code'];
        error_log("Received authorization code: " . substr($code, 0, 10) . "...");

        try {

            $tokenData = $this->getAccessToken($code);

            if (!isset($tokenData['access_token'])) {
                $errorMsg = isset($tokenData['error']) ?
                    "Failed to get access token: {$tokenData['error']} - {$tokenData['error_description']}" :
                    "Failed to get access token: " . json_encode($tokenData);

                error_log($errorMsg);
                throw new Exception($errorMsg);
            }

            $userInfo = $this->getUserInfo($tokenData['access_token']);
            error_log("Google user info received: " . json_encode($userInfo));

            $this->authenticateUser($userInfo);

            header('Location: /app');
            exit;
        } catch (Exception $e) {
            error_log('Google OAuth error: ' . $e->getMessage());
            $_SESSION['errors'] = ['auth' => 'Google authentication error: ' . $e->getMessage()];
            header('Location: /login');
            exit;
        }
    }

    private function getAccessToken($code)
    {
        $params = [
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'code' => $code,
            'redirect_uri' => $this->redirectUri,
            'grant_type' => 'authorization_code'
        ];

        error_log("Token request parameters: client_id={$this->clientId}, redirect_uri={$this->redirectUri}, grant_type=authorization_code");

        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

        curl_setopt($ch, CURLOPT_VERBOSE, true);
        $verbose = fopen('php://temp', 'w+');
        curl_setopt($ch, CURLOPT_STDERR, $verbose);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);

            rewind($verbose);
            $verboseLog = stream_get_contents($verbose);
            error_log("cURL verbose log: " . $verboseLog);

            throw new Exception('cURL error when getting access token: ' . $error);
        }

        rewind($verbose);
        $verboseLog = stream_get_contents($verbose);
        error_log("cURL verbose log: " . $verboseLog);

        curl_close($ch);

        error_log("Token response HTTP code: " . $httpCode);
        error_log("Token response body: " . $response);

        return json_decode($response, true);
    }

    private function getUserInfo($accessToken)
    {
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

    private function authenticateUser($googleData)
    {
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

        $user = $this->userRepository->findByGoogleId($googleId);

        if (!$user) {
            $user = $this->userRepository->findByEmail($email);
            if ($user) {
                error_log("User found by email, updating Google ID: user_id={$user->id}");
                $user->google_id = $googleId;
                $user->avatar_url = $picture;
                $user->save();
            } else {
                error_log("Creating new user from Google data");

                $userData = [
                    'username' => $name ?? $email,
                    'email' => $email,
                    'discriminator' => User::generateDiscriminator(),
                    'google_id' => $googleId,
                    'avatar_url' => $picture
                ];

                $user = $this->userRepository->create($userData);
                if (!$user) {
                    throw new Exception("Failed to create user account");
                }
                error_log("Created new user: user_id={$user->id}");
            }
        } else {
            error_log("User found by Google ID: user_id={$user->id}");

            if ($user->avatar_url != $picture) {
                $user->avatar_url = $picture;
                $user->save();
            }
        }

        $_SESSION['user_id'] = $user->id;
        $_SESSION['username'] = $user->username;
        $_SESSION['discriminator'] = $user->discriminator;
        $_SESSION['avatar_url'] = $user->avatar_url;

        $user->save();

        error_log("User authenticated successfully: user_id={$user->id}, username={$user->username}");
    }
}
