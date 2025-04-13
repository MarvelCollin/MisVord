<?php
// Include helper functions
require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
?>
<!DOCTYPE html>
<html lang="en">
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
                    },
                    fontFamily: {
                        whitney: ['Whitney', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
                    },
                    animation: {
                        'float': 'float 6s ease-in-out infinite',
                        'float-enhanced': 'float-enhanced 8s ease-in-out infinite',
                        'float2': 'float2 10s ease-in-out infinite',
                        'spin-enhanced': 'spin-enhanced 12s linear infinite',
                        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        'bounce': 'bounce 2s infinite',
                        'wobble': 'wobble 3s ease-in-out infinite',
                        'scale-pulse': 'scale-pulse 3s ease-in-out infinite',
                        'glow': 'glow 2s ease-in-out infinite alternate',
                        'shine': 'shine 8s ease-in-out infinite',
                        'scramble': 'scramble 0.8s ease-in-out',
                    },
                    keyframes: {
                        'float': {
                            '0%, 100%': { transform: 'translateY(0px)' },
                            '50%': { transform: 'translateY(-20px)' },
                        },
                        'float-enhanced': {
                            '0%': { transform: 'translateY(0px) rotate(0deg)' },
                            '25%': { transform: 'translateY(-15px) rotate(5deg)' },
                            '50%': { transform: 'translateY(0px) rotate(0deg)' },
                            '75%': { transform: 'translateY(15px) rotate(-5deg)' },
                            '100%': { transform: 'translateY(0px) rotate(0deg)' },
                        },
                        'float2': {
                            '0%': { transform: 'translateY(0px) translateX(0px)' },
                            '33%': { transform: 'translateY(-10px) translateX(10px)' },
                            '66%': { transform: 'translateY(10px) translateX(-10px)' },
                            '100%': { transform: 'translateY(0px) translateX(0px)' },
                        },
                        'spin-enhanced': {
                            '0%': { transform: 'rotate(0deg) scale(1)' },
                            '50%': { transform: 'rotate(180deg) scale(1.05)' },
                            '100%': { transform: 'rotate(360deg) scale(1)' },
                        },
                        'wobble': {
                            '0%, 100%': { transform: 'rotate(-3deg) translateY(0px)' },
                            '50%': { transform: 'rotate(3deg) translateY(-10px)' },
                        },
                        'scale-pulse': {
                            '0%, 100%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.1)' },
                        },
                        'glow': {
                            '0%': { filter: 'drop-shadow(0 0 2px rgba(88, 101, 242, 0.7))' },
                            '100%': { filter: 'drop-shadow(0 0 8px rgba(88, 101, 242, 0.9))' }
                        },
                        'shine': {
                            '0%': { transform: 'translateX(-100%)' },
                            '50%, 100%': { transform: 'translateX(100%)' }
                        },
                        'scramble': {
                            '0%': { 
                                transform: 'translateY(0) rotate(0deg)', 
                                opacity: '1' 
                            },
                            '20%': { 
                                transform: 'translateY(-6px) rotate(-4deg)', 
                                opacity: '0.8' 
                            },
                            '40%': { 
                                transform: 'translateY(3px) rotate(4deg)', 
                                opacity: '0.6' 
                            },
                            '60%': { 
                                transform: 'translateY(-3px) rotate(-2deg)', 
                                opacity: '0.8' 
                            },
                            '80%': { 
                                transform: 'translateY(2px) rotate(1deg)', 
                                opacity: '0.9' 
                            },
                            '100%': { 
                                transform: 'translateY(0) rotate(0)', 
                                opacity: '1' 
                            }
                        },
                    },
                    backdropBlur: {
                        xs: '2px',
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
        /* Base animation styles */
        .animated-fade-in {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        
        .animated-slide-in-left {
            opacity: 0;
            transform: translateX(-30px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        
        .animated-slide-in-right {
            opacity: 0;
            transform: translateX(30px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        
        .animated-visible {
            opacity: 1;
            transform: translate(0, 0);
        }
        
        /* Glass effect styles */
        .glass-nav {
            background: rgba(32, 34, 37, 0.4);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .glass-hero {
            background: rgba(32, 34, 37, 0.3);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .content-card {
            background: rgba(32, 34, 37, 0.4);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .dark-content-card {
            background: rgba(28, 30, 33, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        /* Neon text effect */
        .neon-text {
            text-shadow: 0 0 5px rgba(88, 101, 242, 0.7),
                         0 0 10px rgba(88, 101, 242, 0.5);
        }
        
        /* Discord button hover effect */
        .discord-btn {
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .discord-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
        }
        
        /* Divider styling */
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent);
        }
        
        /* Particle styling */
        .particle {
            position: absolute;
            border-radius: 50%;
            pointer-events: none;
        }
        
        /* Floating element trail effect */
        .floating-trail {
            position: absolute;
            border-radius: 50%;
            background: rgba(88, 101, 242, 0.15);
            filter: blur(10px);
            z-index: 1;
            opacity: 0;
            transition: opacity 0.5s ease;
            pointer-events: none;
        }
        
        /* Character animation for scramble effect */
        .char {
            display: inline-block;
            transition: all 0.2s ease;
        }
        
        .char.scrambled {
            animation: scramble 0.8s ease-in-out;
        }
        
        /* Section transitions */
        .feature-section {
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        
        /* Set page background for the landing page */
        body.landing-bg {
            background-color: #5865F2;
            background-image: linear-gradient(180deg, #5865F2 0%, #404EED 100%);
            background-attachment: fixed;
        }
    </style>
</head>
<body class="<?php echo isset($body_class) ? $body_class : 'overflow-x-hidden text-white landing-bg'; ?>">
    <!-- Content will be injected here -->
    <?php if (isset($content)): ?>
        <?php echo $content; ?>
    <?php endif; ?>
    
    <!-- Debug panel that is hidden by default and activated by "kowlin" keyword -->
    <div id="debugPanel" class="fixed bottom-0 right-0 p-4 bg-gray-900/90 text-white rounded-tl-lg border border-gray-700 transform translate-y-full transition-transform duration-300 ease-in-out z-50 max-w-md max-h-96 overflow-auto opacity-0 invisible" style="box-shadow: 0 -5px 15px rgba(0,0,0,0.3);">
        <h3 class="text-lg font-bold mb-2 flex justify-between items-center">
            <span>Developer Debug Panel</span>
            <button id="closeDebugBtn" class="text-gray-400 hover:text-white">×</button>
        </h3>
        <div class="divider mb-2"></div>
        
        <!-- Database Connection Info (from authentication page) -->
        <?php if (isset($GLOBALS['debugInfo']) && !empty($GLOBALS['debugInfo'])): ?>
            <?php echo $GLOBALS['debugInfo']; ?>
        <?php endif; ?>
        
        <!-- Route information -->
        <div class="mb-2">
            <h4 class="font-medium text-discord-blue mb-1">Route Information:</h4>
            <div class="text-sm">
                <?php if (isset($GLOBALS['route_info'])): ?>
                    <p><span class="text-gray-400">URI:</span> <?php echo htmlspecialchars($GLOBALS['route_info']['uri']); ?></p>
                    <p><span class="text-gray-400">Matched Route:</span> <?php echo htmlspecialchars($GLOBALS['route_info']['matchedRoute']); ?></p>
                    <p><span class="text-gray-400">View File:</span> <?php echo htmlspecialchars($GLOBALS['route_info']['viewFile']); ?></p>
                <?php else: ?>
                    <p class="text-yellow-400">No route information available</p>
                <?php endif; ?>
            </div>
        </div>
        
        <!-- PHP Info -->
        <div>
            <h4 class="font-medium text-discord-blue mb-1">PHP Information:</h4>
            <div class="text-sm">
                <p><span class="text-gray-400">Version:</span> <?php echo phpversion(); ?></p>
                <p><span class="text-gray-400">Memory Limit:</span> <?php echo ini_get('memory_limit'); ?></p>
                <p><span class="text-gray-400">Max Execution Time:</span> <?php echo ini_get('max_execution_time'); ?> seconds</p>
            </div>
        </div>
    </div>
    
    <!-- Add keyboard detection for "kowlin" -->
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // Set up the keyboard detector for "kowlin"
        let keySequence = '';
        const debugPanel = document.getElementById('debugPanel');
        const closeDebugBtn = document.getElementById('closeDebugBtn');
        const targetWord = 'kowlin';
        
        // Close button functionality
        closeDebugBtn.addEventListener('click', function() {
            debugPanel.classList.add('translate-y-full');
            // After animation completes, hide the panel
            setTimeout(() => {
                debugPanel.classList.add('opacity-0', 'invisible');
            }, 300);
        });
        
        // Keyboard detection
        document.addEventListener('keydown', function(e) {
            // Add the key to the sequence
            keySequence += e.key.toLowerCase();
            
            // Keep only the last N characters where N is the length of the target word
            if (keySequence.length > targetWord.length) {
                keySequence = keySequence.substring(keySequence.length - targetWord.length);
            }
            
            // Check if the sequence matches our target word
            if (keySequence === targetWord) {
                // Show the debug panel with animation
                debugPanel.classList.remove('opacity-0', 'invisible');
                
                // Small delay before sliding up to ensure visibility transition is complete
                setTimeout(() => {
                    debugPanel.classList.remove('translate-y-full');
                    
                    // Add a subtle animation effect
                    debugPanel.classList.add('animate-pulse');
                    setTimeout(() => {
                        debugPanel.classList.remove('animate-pulse');
                    }, 1000);
                }, 50);
                
                // Reset the sequence
                keySequence = '';
            }
        });
    });
    </script>
    
    <?php if (isset($page_js)): ?>
        <script src="<?php echo js($page_js); ?>"></script>
    <?php endif; ?>
</body>
</html>