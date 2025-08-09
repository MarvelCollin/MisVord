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
}

$auth_scripts = [];
if ($is_auth_page) {
    $auth_scripts[] = 'components/common/validation';
    $auth_scripts[] = 'components/common/captcha';
}
?>


<script src="https://code.jquery.com/jquery-3.7.1.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>


<script src="<?php echo js('utils/fallback-logger'); ?>?v=<?php echo time(); ?>"></script>

<?php if (!$is_auth_page): ?>

<?php endif; ?>

<script>
(function() {
    try {
        const socketHost = document.querySelector('meta[name="socket-host"]')?.content;
        const socketPort = document.querySelector('meta[name="socket-port"]')?.content;
        const socketSecure = document.querySelector('meta[name="socket-secure"]')?.content === 'true';
        
        if (socketHost) window.SOCKET_HOST = socketHost;
        if (socketPort) window.SOCKET_PORT = parseInt(socketPort);
        if (socketSecure !== undefined) window.SOCKET_SECURE = socketSecure;
        
        
        console.log('🔧 Socket configuration from meta tags:', {
            host: socketHost,
            port: socketPort,
            secure: socketSecure,
            windowLocation: {
                hostname: window.location.hostname,
                port: window.location.port,
                protocol: window.location.protocol,
                href: window.location.href
            }
        });
    } catch (error) {
        console.error('❌ Error setting up socket configuration:', error);
    }
})();
</script>

<?php if (!$is_auth_page): ?>

<script src="<?php echo js('api/chat-api'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('api/media-api'); ?>?v=<?php echo time(); ?>"></script>
<script src="<?php echo js('api/user-api'); ?>?v=<?php echo time(); ?>"></script>
<script src="<?php echo js('utils/user-data-helper'); ?>?v=<?php echo time(); ?>"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.userAPI && window.userAPI.getAllUsers) {
    
        } else {
            console.warn("⚠️ UserAPI getAllUsers method not available, will load on demand");
        }
    }, 100);
});
</script>
<script src="<?php echo js('api/friend-api'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('api/channel-api'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('api/server-api'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('components/servers/server-drag'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('api/bot-api'); ?>?v=<?php echo time(); ?>"></script>

<script src="<?php echo js('components/common/image-cutter'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('utils/jaro-winkler'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    if (window.JaroWinkler || window.jaroWinkler) {

    } else {
        console.warn("⚠️ JaroWinkler not loaded");
    }
});
</script>
<?php endif; ?>

<script src="<?php echo js('utils/lazy-loader'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('utils/debug-logging'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script src="<?php echo js('utils/local-storage-manager'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script type="module" src="<?php echo asset('/js/utils/music-loader-static.js'); ?>"></script>
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

<?php if (!$is_auth_page): ?>
<script type="module" src="<?php echo js('utils/channel-switch-manager'); ?>?v=<?php echo time(); ?>"></script>


<script src="/public/js/utils/channel-voice-participants.js?v=<?php echo time(); ?>"></script>


<script src="<?php echo asset('/js/components/voice/voice-events.js'); ?>"></script>
<script src="<?php echo asset('/js/components/voice/voice-manager.js'); ?>"></script>
<?php endif; ?>

<?php if (!$is_auth_page): ?>

<script src="<?php echo js('components/home/friends-tabs'); ?>?v=<?php echo time(); ?>" type="module"></script>
<script type="module" src="<?php echo js('utils/dm-switch-manager'); ?>?v=<?php echo time(); ?>"></script>
<script src="<?php echo js('components/home/direct-message-nav'); ?>?v=<?php echo time(); ?>" type="module"></script>
<?php 
$currentPath = $_SERVER['REQUEST_URI'] ?? '';
$isHomePage = strpos($currentPath, '/home') === 0;
?>
<script src="<?php echo js('components/app-layout'); ?>?v=<?php echo time(); ?>" type="module"></script>

<script type="module" src="<?php echo js('components/common/notification-handler'); ?>"></script>
<?php endif; ?>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const isAuthPage = document.body && document.body.getAttribute('data-page') === 'auth';
    
    if (!isAuthPage) {
        
        if (window.globalPresenceManager) {
            window.globalPresenceManager.startActivityTracking();
        }
        
        if (window.globalSocketManager) {
            window.globalSocketManager.initialize();
        }
        
        if (window.nitroIconManager) {
            window.nitroIconManager.initializeIcons();
        }
    }
});

window.addEventListener('beforeunload', function() {
    const isAuthPage = document.body && document.body.getAttribute('data-page') === 'auth';
    
    if (!isAuthPage) {
        if (window.globalPresenceManager) {
            window.globalPresenceManager.stopActivityTracking();
        }
        
        if (window.globalSocketManager && window.globalSocketManager.disconnect) {
            window.globalSocketManager.disconnect();
        }
    }
  });
  </script>

  <script>
  // Initialize MusicPlayerSystem when available
  function initializeMusicPlayer() {
      if (typeof window !== 'undefined' && !window.musicPlayer && typeof MusicPlayerSystem !== 'undefined') {
          try {
              window.musicPlayer = new MusicPlayerSystem();
              
          } catch (error) {
              console.error('❌ Failed to initialize MusicPlayerSystem:', error);
          }
      }
  }
  
  // Try to initialize immediately if available
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeMusicPlayer);
  } else {
      initializeMusicPlayer();
  }
  
  // Fallback: try again after a short delay if not already initialized
  setTimeout(() => {
      if (!window.musicPlayer && typeof MusicPlayerSystem !== 'undefined') {
          initializeMusicPlayer();
      }
  }, 1000);
  </script>