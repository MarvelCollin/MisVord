<?php
require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/head.php'; ?>
    <script>
        window.addEventListener('load', function() {
            setTimeout(function() {
                if (document.body && document.body.innerHTML.trim() === '') {
                    console.error('Empty body detected, showing recovery UI');
                    
                    document.body.style.backgroundColor = '#36393f';
                    
                    const recoveryUI = document.createElement('div');
                    recoveryUI.style.display = 'flex';
                    recoveryUI.style.flexDirection = 'column';
                    recoveryUI.style.alignItems = 'center';
                    recoveryUI.style.justifyContent = 'center';
                    recoveryUI.style.height = '100vh';
                    recoveryUI.style.color = 'white';
                    recoveryUI.style.fontFamily = 'Inter, sans-serif';
                    recoveryUI.style.padding = '20px';
                    recoveryUI.style.textAlign = 'center';
                    
                    recoveryUI.innerHTML = `
                        <h1 style="font-size: 24px; margin-bottom: 20px;">Connection Issue Detected</h1>
                        <p style="font-size: 16px; margin-bottom: 30px;">We encountered a problem loading the page.</p>
                        <a href="/login?fresh=1" style="background-color: #5865F2; color: white; padding: 12px 24px; 
                           border-radius: 4px; text-decoration: none; font-weight: 500; margin-bottom: 20px;">
                           Return to Login
                        </a>
                        <button id="clearSessionBtn" style="background-color: #4f545c; color: white; padding: 8px 16px; 
                                border-radius: 4px; border: none; cursor: pointer; margin-top: 10px;">
                            Clear Session Data
                        </button>
                    `;
                    
                    document.body.appendChild(recoveryUI);
                    
                    document.getElementById('clearSessionBtn').addEventListener('click', function() {
                        localStorage.clear();
                        sessionStorage.clear();
                        
                        document.cookie.split(";").forEach(function(c) {
                            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                        });
                        
                        window.location.href = '/login?fresh=1';
                    });
                }
            }, 1000); 
        });
    </script>
</head>
<body class="<?php echo $body_class ?? 'bg-gray-900'; ?> <?php echo isset($_SESSION['user_id']) && !empty($_SESSION['user_id']) ? 'authenticated' : ''; ?>" <?php echo isset($body_attributes) ? $body_attributes : ''; ?>>
    <?php echo $content ?? ''; ?>
    
    <?php if (!isset($data_page) || ($data_page !== 'auth' && $data_page !== 'settings-user')): ?>
        <?php include_once dirname(__DIR__) . '/components/app-sections/create-server-modal.php'; ?>
        <?php include_once dirname(__DIR__) . '/components/app-sections/server-actions-modals.php'; ?>
        <?php include_once dirname(__DIR__) . '/components/common/user-detail.php'; ?>
        <?php include_once dirname(__DIR__) . '/components/explore/server-detail.php'; ?>
        <script type="module" src="<?php echo js('components/common/user-detail'); ?>"></script>
    <?php endif; ?>
    
    <?php include_once __DIR__ . '/scripts.php'; ?>
    
    <?php if (!isset($data_page) || ($data_page !== 'auth' && $data_page !== 'settings-user')): ?>
        <script type="module" src="<?php echo js('components/servers/server-manager'); ?>"></script>
        <script type="module" src="<?php echo js('components/common/wifi-strength'); ?>"></script>
        <script type="module" src="<?php echo js('utils/voice-state-manager'); ?>"></script>
        <script type="module" src="<?php echo js('utils/friends-manager'); ?>"></script>
        <script type="module" src="<?php echo js('core/socket/global-socket-manager'); ?>"></script>
        
        <script>
        document.addEventListener('DOMContentLoaded', async function() {
            const isLandingPage = window.location.pathname === '/';
            const isAuthPage = window.location.pathname.includes('/login') || 
                              window.location.pathname.includes('/register') ||
                              window.location.pathname.includes('/authentication');
            
            if (!isLandingPage && !isAuthPage) {
                console.log('🌐 [GLOBAL-PRESENCE] Initializing global presence system...');
                
                const waitForDependencies = async () => {
                    let attempts = 0;
                    const maxAttempts = 50;
                    
                    while (attempts < maxAttempts) {
                        if (window.FriendsManager && window.globalSocketManager) {
                            return true;
                        }
                        await new Promise(resolve => setTimeout(resolve, 100));
                        attempts++;
                    }
                    return false;
                };
                
                const dependenciesLoaded = await waitForDependencies();
                
                if (dependenciesLoaded) {
                    console.log('✅ [GLOBAL-PRESENCE] Dependencies loaded, starting presence system');
                    
                    const friendsManager = window.FriendsManager.getInstance();
                    
                    if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                        await friendsManager.getOnlineUsers(true);
                    } else {
                        window.addEventListener('globalSocketReady', async () => {
                            await friendsManager.getOnlineUsers(true);
                        });
                    }
                    
                    console.log('✅ [GLOBAL-PRESENCE] Global presence system initialized');
                } else {
                    console.warn('⚠️ [GLOBAL-PRESENCE] Failed to load dependencies');
                }
            }
        });
        </script>
    <?php endif; ?>
    
    <script type="module" src="<?= asset('/js/utils/fallback-image.js') ?>"></script>
    <script type="module" src="<?= asset('/js/components/index.js') ?>"></script>
    <script type="module" src="<?= asset('/js/pages/app.js') ?>"></script>
    
    <!-- Debug create server modal -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                const modal = document.getElementById('create-server-modal');
                const createButton = document.querySelector('[data-action="create-server"]');
            }, 1000);
        });
    </script>
    
    <meta name="csrf-token" content="<?php echo isset($_SESSION['csrf_token']) ? $_SESSION['csrf_token'] : ''; ?>">
</body>
</html>