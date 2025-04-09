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
    <!-- GSAP for advanced animations -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.5/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.5/ScrollTrigger.min.js"></script>
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
                        float: 'float 6s ease-in-out infinite',
                        float2: 'float 8s ease-in-out infinite',
                        spin: 'spin 8s linear infinite',
                        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        bounce: 'bounce 2s infinite',
                        wobble: 'wobble 3s ease-in-out infinite',
                    },
                    keyframes: {
                        float: {
                            '0%, 100%': { transform: 'translateY(0px)' },
                            '50%': { transform: 'translateY(-20px)' },
                        },
                        wobble: {
                            '0%, 100%': { transform: 'rotate(-3deg)' },
                            '50%': { transform: 'rotate(3deg)' },
                        }
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
</head>
<body class="<?php echo isset($body_class) ? $body_class : 'overflow-x-hidden text-white'; ?>">
    <!-- Content will be injected here -->
    <?php if (isset($content)): ?>
        <?php echo $content; ?>
    <?php endif; ?>
    
    <?php if (isset($page_js)): ?>
        <script src="<?php echo js($page_js); ?>"></script>
    <?php endif; ?>
</body>
</html>
