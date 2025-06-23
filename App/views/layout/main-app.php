<?php
require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/head.php'; ?>
    <script>
        // Emergency recovery code - detects white screen and provides a recovery path
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
                    
                    // Add error message and recovery button
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
                    
                    // Append to body
                    document.body.appendChild(recoveryUI);
                    
                    // Add event listener to clear session button
                    document.getElementById('clearSessionBtn').addEventListener('click', function() {
                        // Clear browser storage
                        localStorage.clear();
                        sessionStorage.clear();
                        
                        // Clear cookies by setting expired date
                        document.cookie.split(";").forEach(function(c) {
                            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                        });
                        
                        // Redirect to login with fresh=1 parameter
                        window.location.href = '/login?fresh=1';
                    });
                }
            }, 1000); // Check after 1 second
        });
    </script>
</head>
<body class="<?php echo $body_class ?? 'bg-gray-900'; ?> <?php echo isset($_SESSION['user_id']) && !empty($_SESSION['user_id']) ? 'authenticated' : ''; ?>" <?php echo isset($body_attributes) ? $body_attributes : ''; ?>>
    <?php echo $content ?? ''; ?>
    
    <?php if (!isset($data_page) || $data_page !== 'auth'): ?>
        <?php include_once dirname(__DIR__) . '/components/app-sections/create-server-modal.php'; ?>
        <?php include_once dirname(__DIR__) . '/components/app-sections/server-actions-modals.php'; ?>
        <?php include_once dirname(__DIR__) . '/components/common/user-detail.php'; ?>
    <?php endif; ?>
    
    <?php include_once __DIR__ . '/scripts.php'; ?>
    
    <?php if (!isset($data_page) || $data_page !== 'auth'): ?>
        <script type="module" src="<?php echo js('components/servers/server-manager'); ?>"></script>
    <?php endif; ?>
    
    <script type="module" src="<?= asset('/js/components/index.js') ?>"></script>
    <script type="module" src="<?= asset('/js/pages/app.js') ?>"></script>
    
    <!-- CSRF token for AJAX calls -->
    <meta name="csrf-token" content="<?php echo isset($_SESSION['csrf_token']) ? $_SESSION['csrf_token'] : ''; ?>">
</body>
</html>