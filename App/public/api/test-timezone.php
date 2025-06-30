<?php
require_once __DIR__ . '/../../config/app.php';

header('Content-Type: application/json');

$response = [
    'system_timezone' => date_default_timezone_get(),
    'current_time_php' => date('Y-m-d H:i:s'),
    'current_time_indonesia_helper' => indonesiaTime(),
    'current_time_indonesia_object' => (new DateTime('now', new DateTimeZone('Asia/Jakarta')))->format('Y-m-d H:i:s'),
    'formatted_bubble_timestamp' => '',
    'test_message' => [
        'sent_at' => indonesiaTime(),
        'formatted_time' => ''
    ]
];

$testSentAt = indonesiaTime();
$response['test_message']['sent_at'] = $testSentAt;

$testDate = new DateTime($testSentAt, new DateTimeZone('Asia/Jakarta'));
$now = new DateTime('now', new DateTimeZone('Asia/Jakarta'));
$diffDays = $now->diff($testDate)->days;

if ($diffDays === 0) {
    $response['formatted_bubble_timestamp'] = 'Today at ' . $testDate->format('g:i A');
} elseif ($diffDays === 1) {
    $response['formatted_bubble_timestamp'] = 'Yesterday at ' . $testDate->format('g:i A');
} else {
    $response['formatted_bubble_timestamp'] = $testDate->format('M j, Y g:i A');
}

$response['test_message']['formatted_time'] = $response['formatted_bubble_timestamp'];

echo json_encode($response, JSON_PRETTY_PRINT); 