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

<!-- Simple Hero Section with Scramble Text Only -->
<section class="hero-section min-h-screen flex items-center justify-center">
    <div class="text-center">
        <h1 class="hero-title scramble-text text-6xl md:text-8xl font-bold mb-8" data-text="IMAGINE A PLACE...">
            IMAGINE A PLACE...
        </h1>
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
</head>
<body class="<?php echo $body_class; ?>">
    <?php echo $content; ?>
    
    <script src="<?php echo js('sections/scramble-text'); ?>?v=<?php echo time(); ?>"></script>
</body>
</html>