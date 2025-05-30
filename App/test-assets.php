<?php
// Load helper functions
require_once __DIR__ . '/config/helpers.php';

// Test all helper functions
echo "<h2>Asset URL Tests</h2>";
echo "<p>Current Host: " . ($_SERVER['HTTP_HOST'] ?? 'unknown') . "</p>";

echo "<h3>CSS Files</h3>";
echo "<p>css('global'): " . css('global') . "</p>";
echo "<p>css('authentication-page'): " . css('authentication-page') . "</p>";

echo "<h3>JavaScript Files</h3>";
echo "<p>js('global'): " . js('global') . "</p>";
echo "<p>js('app'): " . js('app') . "</p>";
echo "<p>js('socket.io.min'): " . js('socket.io.min') . "</p>";

echo "<h3>Image Assets</h3>";
echo "<p>asset('/landing-page/main-logo.png'): " . asset('/landing-page/main-logo.png') . "</p>";

echo "<h3>Direct Links for Testing</h3>";
echo "<p><a href='" . css('global') . "' target='_blank'>Test global.css</a></p>";
echo "<p><a href='" . js('global') . "' target='_blank'>Test global.js</a></p>";
echo "<p><a href='" . asset('/landing-page/main-logo.png') . "' target='_blank'>Test main-logo.png</a></p>"; 