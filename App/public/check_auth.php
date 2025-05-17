<?php
// Show all errors
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>Authentication Page Test</h1>";

try {
    // Try to include the authentication page
    ob_start();
    include dirname(__DIR__) . '/views/pages/authentication-page.php';
    $content = ob_get_clean();
    echo "<p style='color: green;'>Authentication page included successfully!</p>";
    echo "<p>Content length: " . strlen($content) . " bytes</p>";
} catch (Throwable $e) {
    echo "<p style='color: red;'>Error including authentication page:</p>";
    echo "<pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
    echo "<p>File: " . $e->getFile() . " on line " . $e->getLine() . "</p>";
} 