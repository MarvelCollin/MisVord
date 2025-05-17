<?php
echo "<h1>Apache Mod Rewrite Check</h1>";

if (function_exists('apache_get_modules')) {
    $modules = apache_get_modules();
    $mod_rewrite = in_array('mod_rewrite', $modules);
} else {
    $mod_rewrite = getenv('HTTP_MOD_REWRITE') == 'On' ? true : false;
}

echo "<p>Mod_rewrite is " . ($mod_rewrite ? "enabled" : "not enabled") . "</p>";

echo "<h2>Server Information</h2>";
echo "<pre>";
print_r($_SERVER);
echo "</pre>";

echo "<h2>Current URL Structure</h2>";
echo "<p>Current URL: " . (isset($_SERVER['HTTPS']) ? "https" : "http") . "://{$_SERVER['HTTP_HOST']}{$_SERVER['REQUEST_URI']}</p>";

echo "<h2>Asset Test</h2>";
echo "<p>Below is an image which uses the asset() function:</p>";
echo '<img src="' . asset('landing-page/main-logo.png') . '" alt="Test Image" style="max-width: 300px">';

echo "<h2>CSS Test</h2>";
echo '<link rel="stylesheet" href="' . css('landing-page') . '">';
echo '<div style="padding: 20px; margin: 20px 0; background: #f0f0f0;">If CSS loaded correctly, this should have styles applied.</div>';

function asset($path) {
    return "/assets/{$path}";
}

function css($path) {
    if (!str_ends_with($path, '.css')) {
        $path .= '.css';
    }
    return "/css/{$path}";
} 