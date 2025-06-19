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
        <h1 class="hero-title scramble-text text-6xl md:text-8xl font-bold mb-8" data-text="IMAGINE A PLACE...">
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
    <link rel="stylesheet" href="<?php echo css('featured-cards-clean'); ?>?v=<?php echo time(); ?>">
</head>

<body class="<?php echo $body_class; ?>">
    <?php echo $content; ?>
    <?php include dirname(dirname(__DIR__)) . '/views/components/landing-sections/featured-cards-section.php'; ?>

    <script src="<?php echo js('sections/parallax-scroll'); ?>?v=<?php echo time(); ?>"></script>
    <script src="<?php echo js('sections/scramble-text'); ?>?v=<?php echo time(); ?>"></script>
    <script src="<?php echo js('sections/featured-cards'); ?>?v=<?php echo time(); ?>"></script>
    <script src="<?php echo js('pages/landing-page'); ?>?v=<?php echo time(); ?>"></script>
</body>

</html>