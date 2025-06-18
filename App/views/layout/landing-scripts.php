<?php
$additional_js = $additional_js ?? [];
$cache_version = time();

// Remove any socket-related scripts for landing page
$additional_js = array_filter($additional_js, function($script) {
    return !in_array($script, ['socket.io.min.js', 'lib/socket.io.min.js', 'global-socket-manager']);
});
?>

<!-- Landing page protection script - MUST load first -->
<?php if (isset($page_js) && $page_js === 'pages/landing-page'): ?>
    <script src="<?php echo js($page_js); ?>?v=<?php echo $cache_version; ?>"></script>
<?php endif; ?>

<!-- Landing page specific scripts - no WebSocket required -->
<script src="<?php echo js('utils/debug-logging'); ?>?v=<?php echo $cache_version; ?>" type="module"></script>
<script src="<?php echo js('landing-main'); ?>?v=<?php echo $cache_version; ?>" type="module"></script>

<?php if (isset($page_js) && $page_js !== 'pages/landing-page'): ?>
    <script src="<?php echo js($page_js); ?>?v=<?php echo $cache_version; ?>"></script>
<?php endif; ?>

<?php foreach($additional_js as $script): ?>
    <script src="<?php echo js(rtrim($script, '.js')); ?>?v=<?php echo $cache_version; ?>" type="module"></script>
<?php endforeach; ?>
