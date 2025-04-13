<?php
// Include helper functions
require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
?>
<!DOCTYPE html>
<html lang="en" class="h-full w-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($page_title) ? $page_title : 'MiscVord - Your Place to Talk and Hang Out'; ?></title>
    <!-- Tailwind CSS via CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'discord-blue': '#5865F2',
                        'discord-bg': '#404EED',
                        'discord-dark': '#23272A',
                        'discord-light': '#F6F6F6',
                        'discord-pink': '#EB459E',
                        'discord-green': '#57F287'
                    }
                }
            }
        }
    </script>
    
    <?php if (isset($page_css)): ?>
        <link rel="stylesheet" href="<?php echo css($page_css); ?>">
    <?php endif; ?>
    
    <?php if (isset($additional_head)): ?>
        <?php echo $additional_head; ?>
    <?php endif; ?>
    
    <style>
        /* Ensure full height and width */
        html, body {
            height: 100% !important;
            width: 100% !important;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
        }
        
        /* Landing page background */
        body.landing-bg {
            background-color: #5865F2;
            background-image: linear-gradient(180deg, #5865F2 0%, #404EED 100%);
            background-attachment: fixed;
            background-size: cover;
            min-height: 100vh;
        }
        
        /* Authentication page specific */
        body.authentication-page {
            height: 100% !important;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #202225;
            min-height: 100vh;
        }
        
        /* Main content container */
        .content-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            width: 100%;
        }
    </style>
</head>
<body class="<?php echo isset($body_class) ? $body_class : 'overflow-x-hidden text-white landing-bg'; ?>">
    <!-- Main content container -->
    <div class="content-container">
        <!-- Content will be injected here -->
        <?php if (isset($content)): ?>
            <?php echo $content; ?>
        <?php endif; ?>
    </div>
    
    <!-- Hidden debug panel - only shown with "kowlin" keyword -->
    <div id="debugPanel" class="fixed bottom-0 right-0 p-4 bg-gray-900/90 text-white rounded-tl-lg border border-gray-700 transform translate-y-full transition-transform duration-300 ease-in-out z-50 max-w-md max-h-96 overflow-auto opacity-0 invisible" style="box-shadow: 0 -5px 15px rgba(0,0,0,0.3);">
        <h3 class="text-lg font-bold mb-2 flex justify-between items-center">
            <span>Debug Panel</span>
            <button id="closeDebugBtn" class="text-gray-400 hover:text-white">×</button>
        </h3>
        
        <!-- Debug content will appear here when "kowlin" is typed -->
        <?php if (isset($GLOBALS['debugInfo']) && !empty($GLOBALS['debugInfo'])): ?>
            <?php echo $GLOBALS['debugInfo']; ?>
        <?php endif; ?>
    </div>
    
    <!-- Simple keyboard detection for "kowlin" -->
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        const keySequence = [];
        const debugPanel = document.getElementById('debugPanel');
        const closeDebugBtn = document.getElementById('closeDebugBtn');
        const targetWord = 'kowlin';
        
        // Close button
        if(closeDebugBtn) {
            closeDebugBtn.addEventListener('click', function() {
                debugPanel.classList.add('translate-y-full');
                setTimeout(() => {
                    debugPanel.classList.add('opacity-0', 'invisible');
                }, 300);
            });
        }
        
        // Keyboard detection
        document.addEventListener('keydown', function(e) {
            keySequence.push(e.key.toLowerCase());
            if (keySequence.length > targetWord.length) {
                keySequence.shift();
            }
            
            if (keySequence.join('') === targetWord) {
                debugPanel.classList.remove('opacity-0', 'invisible');
                setTimeout(() => {
                    debugPanel.classList.remove('translate-y-full');
                }, 50);
            }
        });
    });
    </script>
    
    <?php if (isset($page_js)): ?>
        <script src="<?php echo js($page_js); ?>"></script>
    <?php endif; ?>
</body>
</html>