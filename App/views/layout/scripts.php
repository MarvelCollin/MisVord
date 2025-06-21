<?php
$additional_js = $additional_js ?? [];

$additional_js = array_filter($additional_js, function($script) {
    return $script !== 'socket.io.min.js' && $script !== 'lib/socket.io.min.js';
});

$core_scripts = ['core/ui/toast', 'core/ajax/ajax-handler', 'core/socket/global-socket-manager'];
?>

<script src="https://cdn.socket.io/4.7.2/socket.io.min.js" crossorigin="anonymous"></script>

<script>
(function() {
    const socketHost = document.querySelector('meta[name="socket-host"]')?.content;
    const socketPort = document.querySelector('meta[name="socket-port"]')?.content;
    
    if (socketHost) window.SOCKET_HOST = socketHost;
    if (socketPort) window.SOCKET_PORT = parseInt(socketPort);
})();
</script>

<script src="<?php echo js('utils/socket-status'); ?>?v=<?php echo time(); ?>"></script>

<script src="<?php echo js('api/friend-api'); ?>?v=<?php echo time(); ?>"></script>
<script src="<?php echo js('api/chat-api'); ?>?v=<?php echo time(); ?>"></script>

<script src="<?php echo js('utils/lazy-loader'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('utils/debug-logging'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('components/messaging/unified-chat-manager'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('main'); ?>?v=<?php echo time(); ?>" type="module"></script>

<?php if (isset($page_js)): ?>
    <script src="<?php echo js($page_js); ?>?v=<?php echo time(); ?>" type="module"></script>
<?php endif; ?>

<?php foreach($additional_js as $script): ?>
    <script src="<?php echo js(rtrim($script, '.js')); ?>?v=<?php echo time(); ?>" type="module"></script>
<?php endforeach; ?>

<?php if (isset($_ENV['APP_DEBUG']) && $_ENV['APP_DEBUG'] === 'true'): ?>
<script src="<?php echo js('debug-user-auth'); ?>?v=<?php echo time(); ?>"></script>
<!-- Temporarily disabled to avoid connection conflicts
<script src="<?php echo js('test-docker-connectivity'); ?>?v=<?php echo time(); ?>"></script>
<script src="<?php echo js('debug-socket-connection'); ?>?v=<?php echo time(); ?>"></script>
<script src="<?php echo js('minimal-socket-test'); ?>?v=<?php echo time(); ?>"></script>
<script src="<?php echo js('verify-docker-websocket'); ?>?v=<?php echo time(); ?>"></script>
-->
<?php endif; ?>