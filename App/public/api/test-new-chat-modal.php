<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = 1;
    $_SESSION['username'] = 'testuser';
}

echo "<h1>Testing New Chat Modal Functionality</h1>";

echo "<h2>1. Testing Get All Users Endpoint</h2>";
$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => 'http://localhost/api/users/all',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-Requested-With: XMLHttpRequest',
        'Cookie: ' . session_name() . '=' . session_id()
    ]
]);
$response = curl_exec($curl);
curl_close($curl);

echo "<pre>All Users Response:\n" . htmlspecialchars($response) . "</pre>";

echo "<h2>2. Testing Direct Message Creation</h2>";
$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => 'http://localhost/api/chat/create',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['user_id' => 2]),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-Requested-With: XMLHttpRequest',
        'Cookie: ' . session_name() . '=' . session_id()
    ]
]);
$response = curl_exec($curl);
curl_close($curl);

echo "<pre>Direct Message Response:\n" . htmlspecialchars($response) . "</pre>";

echo "<h2>3. Testing Group Chat Creation</h2>";
$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => 'http://localhost/api/chat/create',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode([
        'user_ids' => [2, 3],
        'group_name' => 'Test Group Chat',
        'group_image' => 'https://example.com/image.jpg'
    ]),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-Requested-With: XMLHttpRequest',
        'Cookie: ' . session_name() . '=' . session_id()
    ]
]);
$response = curl_exec($curl);
curl_close($curl);

echo "<pre>Group Chat Response:\n" . htmlspecialchars($response) . "</pre>";

echo "<h2>4. Testing Existing Chat Detection</h2>";
$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => 'http://localhost/api/chat/create',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['user_id' => 2]),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-Requested-With: XMLHttpRequest',
        'Cookie: ' . session_name() . '=' . session_id()
    ]
]);
$response = curl_exec($curl);
curl_close($curl);

echo "<pre>Existing Chat Test Response:\n" . htmlspecialchars($response) . "</pre>";
?> 