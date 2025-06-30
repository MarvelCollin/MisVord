<?php
require_once dirname(dirname(__DIR__)) . '/config/helpers.php';

$page_title = 'misvord - Chat & Share with Friends';
$body_class = 'bg-gray-900 text-white';
$page_css = 'landing-page';
$page_js = 'pages/landing-page';

$include_socket_io = false;
$include_channel_loader = false;
$additional_js = [];

ob_start();
?>

<section class="hero-section scroll-section min-h-screen flex items-center justify-center">
    <div class="hero-background">
        <div class="bg-gradient"></div>
        <div class="parallax-layer stars-layer" data-depth="0.1">
            <?php for ($i = 0; $i < 50; $i++): ?>
                <div class="star small" style="top: <?php echo rand(5, 95) . '%; left: ' . rand(5, 95); ?>%;"></div>
            <?php endfor; ?>

            <?php for ($i = 0; $i < 30; $i++): ?>
                <div class="star medium" style="top: <?php echo rand(5, 95) . '%; left: ' . rand(5, 95); ?>%;"></div>
            <?php endfor; ?>

            <?php for ($i = 0; $i < 15; $i++): ?>
                <div class="star large" style="top: <?php echo rand(5, 95) . '%; left: ' . rand(5, 95); ?>%;"></div>
            <?php endfor; ?>
        </div>

        <div class="parallax-layer nebulas-layer" data-depth="0.2">
            <div class="nebula nebula-1"></div>
            <div class="nebula nebula-2"></div>
            <div class="nebula nebula-3"></div>
        </div>
    </div>

    <div class="text-center">
        <h1 class="hero-title floating scramble-text text-6xl md:text-8xl font-bold mb-8" data-text="IMAGINE A PLACE...">
            IMAGINE A PLACE...
        </h1>
    </div>

    <div class="scroll-down-indicator">
        <div class="arrow"></div>
    </div>
</section>

<?php
$content = ob_get_clean();
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($page_title); ?></title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

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
                        },
                        backgroundImage: {
                            'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                        }
                    }
                },
                fontFamily: {
                    sans: ['Inter', 'sans-serif']
                }
            }
        }
    </script>
    
    <link rel="stylesheet" href="<?php echo css('global'); ?>?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="<?php echo css('landing-page'); ?>?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="<?php echo css('scramble-text'); ?>?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="<?php echo css('featured-cards'); ?>?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="<?php echo css('carousel-section'); ?>?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="<?php echo css('nitro-section'); ?>?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="<?php echo css('swipe-wrapper'); ?>?v=<?php echo time(); ?>">
    
    <style>
        .login-icon-container {
            position: fixed;
            top: 2rem;
            right: 2rem;
            z-index: 1000;
            cursor: pointer;
        }

        .login-icon {
            display: flex;
            align-items: center;
            padding: 0.75rem;
            background: rgba(88, 101, 242, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(88, 101, 242, 0.3);
            border-radius: 50px;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            position: relative;
            overflow: hidden;
            width: 48px;
            height: 48px;
            justify-content: center;
        }

        .login-icon::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.6s;
        }

        .login-icon:hover::before {
            left: 100%;
        }

        .login-icon:hover {
            width: auto;
            padding: 0.75rem 1.5rem 0.75rem 0.75rem;
            transform: translateY(-2px) scale(1.05);
            background: rgba(88, 101, 242, 0.2);
            border-color: rgba(88, 101, 242, 0.6);
            box-shadow: 0 10px 30px rgba(88, 101, 242, 0.3);
        }

        .login-icon i {
            font-size: 1.25rem;
            color: #5865F2;
            transition: all 0.3s ease;
        }

        .login-icon:hover i {
            transform: rotate(360deg);
            color: #ffffff;
            text-shadow: 0 0 10px rgba(88, 101, 242, 0.8);
        }

        .login-text {
            font-weight: 600;
            color: #B9BBBE;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            font-size: 0.875rem;
            opacity: 0;
            transform: translateX(-10px) scale(0.8);
            white-space: nowrap;
            width: 0;
            overflow: hidden;
        }

        .login-icon:hover .login-text {
            color: #ffffff;
            opacity: 1;
            transform: translateX(0) scale(1);
            width: auto;
            margin-left: 0.5rem;
        }

        .login-icon:active {
            transform: translateY(0) scale(0.98);
        }

        @keyframes pulse-glow {
            0%, 100% {
                box-shadow: 0 10px 30px rgba(88, 101, 242, 0.3);
            }
            50% {
                box-shadow: 0 10px 30px rgba(88, 101, 242, 0.5);
            }
        }

        .login-icon:hover {
            animation: pulse-glow 2s infinite;
        }

        @media (max-width: 768px) {
            .login-icon-container {
                top: 1rem;
                right: 1rem;
            }
            
            .login-icon {
                padding: 0.5rem;
                width: 44px;
                height: 44px;
            }
            
            .login-icon:hover {
                padding: 0.5rem;
                width: 44px;
                transform: translateY(-2px) scale(1.05);
            }
            
            .login-text {
                display: none !important;
            }
            
            .login-icon i {
                font-size: 1.5rem;
            }
        }
    </style>
</head>

<body class="<?php echo $body_class; ?>">
    <div class="login-icon-container">
        <div class="login-icon" id="loginIcon">
            <i class="fas fa-user-circle"></i>
            <span class="login-text">Login</span>
        </div>
    </div>
    
    <?php echo $content; ?>
    
    <div id="swipe-wrapper" class="swipe-wrapper">
        <?php include dirname(dirname(__DIR__)) . '/views/components/landing-sections/featured-cards-section.php'; ?>
        <?php include dirname(dirname(__DIR__)) . '/views/components/landing-sections/carousel-section.php'; ?>
        <?php include dirname(dirname(__DIR__)) . '/views/components/landing-sections/nitro-section.php'; ?>
    </div>

    <div class="section-navigation">
        <div class="nav-dot active" data-section="0" title="Featured Extensions"></div>
        <div class="nav-dot" data-section="1" title="Success Stories"></div>
        <div class="nav-dot" data-section="2" title="Nitro Premium"></div>
    </div>

    <div class="swipe-hint">
        <i class="fas fa-chevron-left"></i> Scroll or swipe horizontally to navigate <i class="fas fa-chevron-right"></i>
    </div>

    <script src="<?php echo js('sections/scramble-text'); ?>?v=<?php echo time(); ?>"></script>
    <script src="<?php echo js('sections/parallax-scroll'); ?>?v=<?php echo time(); ?>"></script>
    <script src="<?php echo js('sections/horizontal-navigation'); ?>?v=<?php echo time(); ?>"></script>
    <script src="<?php echo js('sections/featured-cards'); ?>?v=<?php echo time(); ?>"></script>
    <script src="<?php echo js('sections/carousel-section'); ?>?v=<?php echo time(); ?>"></script>
    <script src="<?php echo js('sections/nitro-section'); ?>?v=<?php echo time(); ?>"></script>
    <script src="<?php echo js('pages/landing-page'); ?>?v=<?php echo time(); ?>"></script>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof ScrambleText !== 'undefined') {
                new ScrambleText();
            }
        });
    </script>
</body>

</html>