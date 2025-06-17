<?php
/**
 * Consolidated Head Section
 * This file contains all meta tags, CSS, and critical JS for the entire application
 * It eliminates duplication across different layout files
 */

// Include helper functions if not already loaded
if (!function_exists('css')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

// Set default values
$page_title = $page_title ?? $title ?? 'MiscVord';
$page_description = $page_description ?? 'A modern Discord-like communication platform';
$cache_version = time(); // Consistent cache busting
?>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="<?php echo htmlspecialchars($page_description); ?>">
<meta name="author" content="MiscVord Team">
<meta name="robots" content="index, follow">

<!-- Title -->
<title><?php echo htmlspecialchars($page_title); ?></title>

<!-- Preconnect to external domains for better performance -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdnjs.cloudflare.com">
<link rel="preconnect" href="https://cdn.tailwindcss.com">

<!-- Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

<!-- External CSS -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
<script src="https://cdn.tailwindcss.com"></script>

<!-- Tailwind Configuration -->
<script>
    tailwind.config = {
        theme: {
            extend: {
                colors: {
                    discord: {
                        'primary': '#5865F2',
                        'green': '#3BA55C',
                        'yellow': '#FAA61A',
                        'red': '#ED4245',
                        'background': '#36393F',
                        'dark': '#202225',
                        'darker': '#18191C',
                        'light': '#42464D',
                        'lighter': '#B9BBBE',
                    }
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif']
            }
        }
    }
</script>

<!-- Core CSS Files -->
<link rel="stylesheet" href="<?php echo css('global'); ?>?v=<?php echo $cache_version; ?>">
<link rel="stylesheet" href="<?php echo css('lazy-loading'); ?>?v=<?php echo $cache_version; ?>">

<!-- Page-specific CSS -->
<?php if (isset($page_css)): ?>
    <link rel="stylesheet" href="<?php echo css($page_css); ?>?v=<?php echo $cache_version; ?>">
<?php endif; ?>

<?php if (isset($extraCss) && is_array($extraCss)): ?>
    <?php foreach ($extraCss as $css_file): ?>
        <link rel="stylesheet" href="<?php echo $css_file; ?>?v=<?php echo $cache_version; ?>">
    <?php endforeach; ?>
<?php endif; ?>

<!-- Legacy CSS support for older pages -->
<?php if (isset($include_legacy_css) && $include_legacy_css): ?>
    <link rel="stylesheet" href="/css/landing-page.css?v=<?php echo $cache_version; ?>">
    <link rel="stylesheet" href="/css/authentication.css?v=<?php echo $cache_version; ?>">
<?php endif; ?>

<!-- Critical JavaScript - loaded in head for immediate availability -->
<?php if (isset($include_socket_io) && $include_socket_io): ?>
    <script src="<?php echo js('socket.io.min'); ?>?v=<?php echo $cache_version; ?>"></script>
<?php endif; ?>

<?php if (isset($include_channel_loader) && $include_channel_loader): ?>
    <script src="/js/channel-loader.js?v=<?php echo $cache_version; ?>"></script>
<?php endif; ?>

<!-- Page-specific head scripts -->
<?php if (isset($head_scripts) && is_array($head_scripts)): ?>
    <?php foreach ($head_scripts as $script): ?>
        <script src="<?php echo $script; ?>?v=<?php echo $cache_version; ?>"></script>
    <?php endforeach; ?>
<?php endif; ?>
