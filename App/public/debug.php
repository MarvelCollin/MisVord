<?php
// Show all errors
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>MiscVord Debug Page</h1>";

// Test loading key files
echo "<h2>Testing File Loading:</h2>";
$files_to_test = [
    dirname(__DIR__) . '/config/helpers.php',
    dirname(__DIR__) . '/views/layout/main-app.php',
    dirname(__DIR__) . '/views/pages/landing-page.php',
    dirname(__DIR__) . '/views/components/landing-sections/section-1.php',
    dirname(__DIR__) . '/views/components/landing-sections/section-2.php',
    dirname(__DIR__) . '/views/components/landing-sections/section-3.php',
    dirname(__DIR__) . '/views/components/landing-sections/feature-carousel.php',
];

echo "<ul>";
foreach ($files_to_test as $file) {
    echo "<li>" . basename($file) . ": ";
    if (file_exists($file)) {
        echo "<span style='color: green;'>EXISTS</span> (size: " . filesize($file) . " bytes)";
    } else {
        echo "<span style='color: red;'>MISSING</span>";
    }
    echo "</li>";
}
echo "</ul>";

// Test asset URLs
require_once dirname(__DIR__) . '/config/helpers.php';
echo "<h2>Testing Asset URLs:</h2>";
echo "<ul>";
echo "<li>Background URL: " . asset('landing-page/background.png') . "</li>";
echo "<li>CSS URL: " . css('landing-page') . "</li>";
echo "<li>JS URL: " . js('landing-page') . "</li>";
echo "</ul>";

// Get current PHP memory usage
echo "<h2>Memory Usage:</h2>";
echo "<p>Current Memory Usage: " . number_format(memory_get_usage() / 1024 / 1024, 2) . " MB</p>";
echo "<p>Peak Memory Usage: " . number_format(memory_get_peak_usage() / 1024 / 1024, 2) . " MB</p>";

// Check for any ob_* buffering issues
echo "<h2>Output Buffer Status:</h2>";
$status = ob_get_status(true);
echo "<pre>";
print_r($status);
echo "</pre>";

// Display PHP Info in a collapsible section
echo "<h2 onclick='togglePhpInfo()' style='cursor: pointer;'>PHP Info (click to toggle)</h2>";
echo "<div id='phpinfo' style='display: none;'>";
ob_start();
phpinfo();
$phpinfo = ob_get_clean();
echo $phpinfo;
echo "</div>";

// Add toggle script
echo "<script>
function togglePhpInfo() {
    var div = document.getElementById('phpinfo');
    if (div.style.display === 'none') {
        div.style.display = 'block';
    } else {
        div.style.display = 'none';
    }
}
</script>";

// Let's also check if the landing page content is being generated properly
echo "<h2>Landing Page Content Generation Test:</h2>";
echo "<div style='border: 1px solid #ccc; padding: 10px;'>";
ob_start();
include dirname(__DIR__) . '/views/pages/landing-page.php';
$content = ob_get_clean();
echo "<p>Content size: " . strlen($content) . " bytes</p>";
echo "<p>Content starts with: " . htmlspecialchars(substr($content, 0, 100)) . "...</p>";
echo "</div>"; 