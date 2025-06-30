<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once dirname(dirname(__DIR__)) . '/config/helpers.php';

$isAuthenticated = isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
$username = $_SESSION['username'] ?? '';
$discriminator = $_SESSION['discriminator'] ?? '';
$avatarUrl = $_SESSION['avatar_url'] ?? '';

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

        <div class="parallax-layer assets-layer-1" data-depth="0.15">
            <div class="floating-asset robot" style="top: 15%; left: 10%;">
                <img src="<?php echo asset('landing-page/robot.webp'); ?>" alt="Robot">
            </div>
            <div class="floating-asset trophy" style="top: 20%; right: 15%;">
                <img src="<?php echo asset('landing-page/thropy.webp'); ?>" alt="Trophy">
            </div>
            <div class="floating-asset wumpus" style="bottom: 25%; left: 8%;">
                <img src="<?php echo asset('landing-page/wumpus_happy.webp'); ?>" alt="Happy Wumpus">
            </div>
        </div>

        <div class="parallax-layer assets-layer-2" data-depth="0.25">
            <div class="floating-asset flying-cat" style="top: 30%; right: 8%;">
                <img src="<?php echo asset('landing-page/flying-cat.webp'); ?>" alt="Flying Cat">
            </div>
            <div class="floating-asset box" style="bottom: 30%; right: 12%;">
                <img src="<?php echo asset('landing-page/box.webp'); ?>" alt="Box">
            </div>
            <div class="floating-asset green-egg" style="top: 60%; left: 15%;">
                <img src="<?php echo asset('landing-page/green-egg.webp'); ?>" alt="Green Egg">
            </div>
        </div>

        <div class="parallax-layer assets-layer-3" data-depth="0.35">
            <div class="floating-asset leaf" style="top: 45%; left: 5%;">
                <img src="<?php echo asset('landing-page/leaf.webp'); ?>" alt="Leaf">
            </div>
            <div class="floating-asset pan" style="bottom: 15%; right: 20%;">
                <img src="<?php echo asset('landing-page/pan.png'); ?>" alt="Pan">
            </div>
        </div>
    </div>

    <div class="text-center">
        <h1 class="hero-title floating scramble-text text-6xl md:text-8xl font-bold mb-8" data-text="MisVord">
            MisVord
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
            cursor: pointer;
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
            animation: pulse-glow 2s infinite;
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

        .user-dropdown-container {
            position: relative;
        }

        .user-icon {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem;
            background: rgba(88, 101, 242, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(88, 101, 242, 0.3);
            border-radius: 50px;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }

        .user-icon::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.6s;
        }

        .user-icon:hover::before {
            left: 100%;
        }

        .user-icon:hover {
            transform: translateY(-2px) scale(1.05);
            background: rgba(88, 101, 242, 0.2);
            border-color: rgba(88, 101, 242, 0.6);
            box-shadow: 0 10px 30px rgba(88, 101, 242, 0.3);
        }

        .user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .user-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .user-avatar i {
            font-size: 1.5rem;
            color: #5865F2;
        }

        .username-text {
            font-weight: 600;
            color: #B9BBBE;
            font-size: 0.875rem;
            transition: all 0.3s ease;
        }

        .user-icon:hover .username-text {
            color: #ffffff;
        }

        .dropdown-arrow {
            font-size: 0.75rem;
            color: #B9BBBE;
            transition: all 0.3s ease;
        }

        .user-icon:hover .dropdown-arrow {
            color: #ffffff;
            transform: rotate(180deg);
        }

        .user-dropdown {
            position: absolute;
            top: calc(100% + 0.5rem);
            right: 0;
            min-width: 200px;
            background: rgba(32, 34, 37, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(88, 101, 242, 0.3);
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            overflow: hidden;
        }

        .user-dropdown.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .dropdown-header {
            padding: 1rem;
            border-bottom: 1px solid rgba(88, 101, 242, 0.2);
        }

        .display-name {
            font-weight: 600;
            color: #ffffff;
            font-size: 0.875rem;
        }

        .dropdown-divider {
            height: 1px;
            background: rgba(88, 101, 242, 0.2);
            margin: 0.5rem 0;
        }

        .dropdown-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #B9BBBE;
        }

        .dropdown-item:hover {
            background: rgba(88, 101, 242, 0.1);
            color: #ffffff;
        }

        .dropdown-item i {
            font-size: 1rem;
            width: 16px;
            text-align: center;
        }

        @keyframes pulse-glow {
            0%, 100% {
                box-shadow: 0 10px 30px rgba(88, 101, 242, 0.3);
            }
            50% {
                box-shadow: 0 10px 30px rgba(88, 101, 242, 0.5);
            }
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

            .user-icon {
                padding: 0.5rem;
            }

            .username-text {
                display: none;
            }

            .dropdown-arrow {
                display: none;
            }

            .user-dropdown {
                min-width: 160px;
            }
        }

        @font-face {
            font-family: 'ABCGintoPlus';
            src: url('<?php echo asset('fonts/ABCGintoPlusVariable-Trial-BF651b7b7ae8e89.woff'); ?>') format('woff');
            font-weight: 100 900;
            font-style: normal;
            font-display: swap;
        }

        .hero-title {
            font-family: 'ABCGintoPlus', 'Inter', sans-serif !important;
            font-weight: 900 !important;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            background: linear-gradient(135deg, #ffffff 0%, #e6f0ff 50%, #5865F2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            position: relative;
        }

        .hero-title.wave-active {
            animation: titleWave 3s ease-in-out infinite;
        }

        @keyframes titleWave {
            0%, 100% {
                transform: translateY(0px) rotateX(0deg);
                filter: drop-shadow(0 5px 15px rgba(88, 101, 242, 0.3));
            }
            25% {
                transform: translateY(-8px) rotateX(5deg);
                filter: drop-shadow(0 15px 25px rgba(88, 101, 242, 0.5));
            }
            50% {
                transform: translateY(-12px) rotateX(0deg);
                filter: drop-shadow(0 20px 35px rgba(88, 101, 242, 0.7));
            }
            75% {
                transform: translateY(-8px) rotateX(-5deg);
                filter: drop-shadow(0 15px 25px rgba(88, 101, 242, 0.5));
            }
        }

        .assets-layer-1, .assets-layer-2, .assets-layer-3 {
            position: absolute;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }

        .floating-asset {
            position: absolute;
            opacity: 0;
            transform: translateY(20px) scale(0.8);
            transition: all 1s ease-out;
            will-change: transform, opacity;
        }

        .floating-asset.animate {
            opacity: 0.9;
            transform: translateY(0) scale(1);
        }

        .floating-asset img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
        }

        .floating-asset.robot {
            width: 80px;
            height: 80px;
            animation: robotFloat 4s ease-in-out infinite;
        }

        .floating-asset.trophy {
            width: 70px;
            height: 70px;
            animation: trophyGlow 3s ease-in-out infinite;
        }

        .floating-asset.wumpus {
            width: 90px;
            height: 90px;
            animation: wumpusBounce 2.5s ease-in-out infinite;
        }

        .floating-asset.flying-cat {
            width: 100px;
            height: 100px;
            animation: catFly 3.5s ease-in-out infinite;
        }

        .floating-asset.box {
            width: 60px;
            height: 60px;
            animation: boxTilt 4s ease-in-out infinite;
        }

        .floating-asset.green-egg {
            width: 50px;
            height: 50px;
            animation: eggSpin 5s linear infinite;
        }

        .floating-asset.leaf {
            width: 40px;
            height: 40px;
            animation: leafSway 3s ease-in-out infinite;
        }

        .floating-asset.pan {
            width: 65px;
            height: 65px;
            animation: panRotate 4.5s ease-in-out infinite;
        }

        @keyframes robotFloat {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(5deg); }
        }

        @keyframes trophyGlow {
            0%, 100% { 
                transform: scale(1);
                filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2)) drop-shadow(0 0 0px rgba(255, 215, 0, 0));
            }
            50% { 
                transform: scale(1.1);
                filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.6));
            }
        }

        @keyframes wumpusBounce {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-12px) scale(1.05); }
        }

        @keyframes catFly {
            0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
            25% { transform: translateX(10px) translateY(-8px) rotate(3deg); }
            75% { transform: translateX(-5px) translateY(-5px) rotate(-2deg); }
        }

        @keyframes boxTilt {
            0%, 100% { transform: rotate(0deg) translateY(0); }
            50% { transform: rotate(10deg) translateY(-8px); }
        }

        @keyframes eggSpin {
            0% { transform: rotate(0deg) scale(1); }
            25% { transform: rotate(90deg) scale(1.1); }
            50% { transform: rotate(180deg) scale(1); }
            75% { transform: rotate(270deg) scale(1.1); }
            100% { transform: rotate(360deg) scale(1); }
        }

        @keyframes leafSway {
            0%, 100% { transform: rotate(-5deg) translateY(0); }
            50% { transform: rotate(5deg) translateY(-10px); }
        }

        @keyframes panRotate {
            0%, 100% { transform: rotate(0deg) translateY(0); }
            25% { transform: rotate(-10deg) translateY(-5px); }
            75% { transform: rotate(10deg) translateY(-8px); }
        }

        @media (max-width: 768px) {
            .floating-asset {
                transform: scale(0.7);
            }
            
            .floating-asset.robot { width: 60px; height: 60px; }
            .floating-asset.trophy { width: 50px; height: 50px; }
            .floating-asset.wumpus { width: 70px; height: 70px; }
            .floating-asset.flying-cat { width: 80px; height: 80px; }
            .floating-asset.box { width: 45px; height: 45px; }
            .floating-asset.green-egg { width: 35px; height: 35px; }
            .floating-asset.leaf { width: 30px; height: 30px; }
            .floating-asset.pan { width: 50px; height: 50px; }
        }
    </style>
</head>

<body class="<?php echo $body_class; ?>">
    <div class="login-icon-container">
        <?php if ($isAuthenticated): ?>
            <div class="user-dropdown-container">
                <div class="user-icon" id="userIcon">
                    <div class="user-avatar">
                        <?php if ($avatarUrl): ?>
                            <img src="<?php echo htmlspecialchars($avatarUrl); ?>" alt="Avatar">
                        <?php else: ?>
                            <i class="fas fa-user-circle"></i>
                        <?php endif; ?>
                    </div>
                    <span class="username-text"><?php echo htmlspecialchars($username); ?></span>
                    <i class="fas fa-chevron-down dropdown-arrow"></i>
                </div>
                <div class="user-dropdown" id="userDropdown">
                    <div class="dropdown-header">
                        <div class="user-info">
                            <div class="display-name"><?php echo htmlspecialchars($username); ?>#<?php echo htmlspecialchars($discriminator); ?></div>
                        </div>
                    </div>
                    <div class="dropdown-divider"></div>
                    <div class="dropdown-item" id="logoutItem">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </div>
                </div>
            </div>
        <?php else: ?>
            <div class="login-icon" id="loginIcon">
                <i class="fas fa-user-circle"></i>
                <span class="login-text">Login</span>
            </div>
        <?php endif; ?>
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