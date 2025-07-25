<?php

require_once __DIR__ . '/../database/repositories/UserRepository.php';

class GoogleAuthController
{
    private $clientId;
    private $clientSecret;
    private $redirectUri;
    private $userRepository;

    public function __construct()
    {        if (session_status() === PHP_SESSION_NONE) {
            require_once __DIR__ . '/../config/session.php';
            session_start();
        }

        $this->userRepository = new UserRepository();

        $config = require __DIR__ . '/../config/google_oauth.php';

        $this->clientId = $config['client_id'];
        $this->clientSecret = $config['client_secret'];
        $this->redirectUri = $config['redirect_uri'];

            }

    public function redirectToGoogle()
    {
        $state = bin2hex(random_bytes(16));
        $_SESSION['oauth_state'] = $state;

        $isPopup = isset($_GET['popup']) && $_GET['popup'] === '1';
        if ($isPopup) {
            $_SESSION['oauth_popup'] = true;
        }

        $params = [
            'client_id' => $this->clientId,
            'redirect_uri' => $this->redirectUri,
            'response_type' => 'code',
            'scope' => 'email profile',
            'state' => $state,
            'prompt' => 'select_account',
            'access_type' => 'offline',
            'include_granted_scopes' => 'true'
        ];

        $url = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
        header('Location: ' . $url);
        exit;
    }

    public function callback()
    {
        if (!isset($_GET['state']) || !isset($_SESSION['oauth_state']) || $_GET['state'] !== $_SESSION['oauth_state']) {
            $this->handleAuthError('Invalid state parameter. Possible CSRF attack.');
            return;
        }

        if (isset($_GET['error'])) {
            $this->handleAuthError('Google authentication error: ' . $_GET['error']);
            return;
        }

        if (!isset($_GET['code'])) {
            $this->handleAuthError('No authorization code received from Google.');
            return;
        }

        $code = $_GET['code'];
        $isPopup = isset($_SESSION['oauth_popup']) && $_SESSION['oauth_popup'] === true;
        
        try {
            $tokenData = $this->getAccessToken($code);

            if (!isset($tokenData['access_token'])) {
                $errorMsg = isset($tokenData['error']) ?
                    "Failed to get access token: {$tokenData['error']} - {$tokenData['error_description']}" :
                    "Failed to get access token: " . json_encode($tokenData);

                throw new Exception($errorMsg);
            }

            $userInfo = $this->getUserInfo($tokenData['access_token']);
            $this->authenticateUser($userInfo);

            unset($_SESSION['oauth_popup']);

            if ($isPopup) {
                $this->sendPopupResponse(true, '/home');
            } else {
                header('Location: /home');
                exit;
            }
        } catch (Exception $e) {
            $this->handleAuthError('Google authentication error: ' . $e->getMessage());
        }
    }

    private function handleAuthError($message)
    {
        $isPopup = isset($_SESSION['oauth_popup']) && $_SESSION['oauth_popup'] === true;
        unset($_SESSION['oauth_popup']);

        if ($isPopup) {
            $this->sendPopupResponse(false, null, $message);
        } else {
            $_SESSION['errors'] = ['auth' => $message];
            header('Location: /login');
            exit;
        }
    }

    private function sendPopupResponse($success, $redirect = null, $message = null)
    {
        $response = [
            'type' => $success ? 'GOOGLE_AUTH_SUCCESS' : 'GOOGLE_AUTH_ERROR'
        ];

        if ($success && $redirect) {
            $response['redirect'] = $redirect;
        }

        if (!$success && $message) {
            $response['message'] = $message;
        }

        echo '<!DOCTYPE html>
<html>
<head>
    <title>Authentication</title>
</head>
<body>
    <script>
        window.opener.postMessage(' . json_encode($response) . ', window.location.origin);
        window.close();
    </script>
</body>
</html>';
        exit;
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
                        throw new Exception('cURL error when getting access token: ' . $error);
        }

        rewind($verbose);
        $verboseLog = stream_get_contents($verbose);
                curl_close($ch);

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
                $user = $this->userRepository->findByGoogleId($googleId);

        if (!$user) {
            $user = $this->userRepository->findByEmail($email);
            if ($user) {
                                $user->google_id = $googleId;
                $user->avatar_url = $picture;
                $user->save();
            } else {
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
                            }
        } else {
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

            }
}
