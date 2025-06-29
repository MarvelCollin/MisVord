<?php
$additional_js = $additional_js ?? [];

$additional_js = array_filter($additional_js, function($script) {
    return $script !== 'socket.io.min.js' && $script !== 'lib/socket.io.min.js';
});

$is_settings_page = isset($page_css) && $page_css === 'settings-server';
if ($is_settings_page) {
    $additional_js = array_filter($additional_js, function($script) {
        return strpos($script, 'chat-section') === false;
    });
}

$is_auth_page = isset($data_page) && $data_page === 'auth';

$core_scripts = ['core/ui/toast'];
if (!$is_auth_page) {
    $core_scripts[] = 'core/socket/global-socket-manager';
    $core_scripts[] = 'components/messaging/bubble-chat-component';
}

$auth_scripts = [];
if ($is_auth_page) {
    $auth_scripts[] = 'components/common/validation';
    $auth_scripts[] = 'components/common/captcha';
}
?>

<!-- jQuery CDN -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>

<script>
(function() {
    const socketHost = document.querySelector('meta[name="socket-host"]')?.content;
    const socketPort = document.querySelector('meta[name="socket-port"]')?.content;
    const socketSecure = document.querySelector('meta[name="socket-secure"]')?.content === 'true';
    
    if (socketHost) window.SOCKET_HOST = socketHost;
    if (socketPort) window.SOCKET_PORT = parseInt(socketPort);
    if (socketSecure !== undefined) window.SOCKET_SECURE = socketSecure;
})();
</script>

<?php if (!$is_auth_page): ?>
<script src="<?php echo js('api/chat-api'); ?>?v=<?php echo time(); ?>"></script>
<script>

document.addEventListener('DOMContentLoaded', function() {
    if (!window.ChatAPI) {
        window.ChatAPI = new ChatAPI();
        console.log("✅ ChatAPI initialized in scripts.php");
    }
});
</script>
<script src="<?php echo js('api/media-api'); ?>?v=<?php echo time(); ?>"></script>
<script src="<?php echo js('api/user-api'); ?>?v=<?php echo time(); ?>"></script>
<script src="<?php echo js('api/friend-api'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('api/channel-api'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('api/server-api'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('api/bot-api'); ?>?v=<?php echo time(); ?>"></script>
<script src="<?php echo js('components/messaging/chat-bot'); ?>?v=<?php echo time(); ?>"></script>
<script src="<?php echo js('components/bot/music-player-system'); ?>?v=<?php echo time(); ?>"></script>
<?php endif; ?>

<script src="<?php echo js('utils/lazy-loader'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('utils/debug-logging'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('main'); ?>?v=<?php echo time(); ?>" type="module"></script>

<?php if (isset($page_js)): ?>
    <script src="<?php echo js($page_js); ?>?v=<?php echo time(); ?>" type="module"></script>
<?php endif; ?>

<?php foreach($core_scripts as $script): ?>
    <script src="<?php echo js($script); ?>?v=<?php echo time(); ?>" type="module"></script>
<?php endforeach; ?>

<?php foreach($auth_scripts as $script): ?>
    <script src="<?php echo js($script); ?>?v=<?php echo time(); ?>" type="module"></script>
<?php endforeach; ?>

<?php foreach($additional_js as $script): ?>
    <script src="<?php echo js($script); ?>?v=<?php echo time(); ?>" type="module"></script>
<?php endforeach; ?>

<script type="module" src="/public/js/utils/channel-switch-manager.js"></script>
<script type="module" src="/public/js/utils/load-explore-page.js"></script>

<!-- Voice components -->
<script src="<?php echo asset('/js/components/voice/voice-manager.js'); ?>"></script>