<?php
// Include helper functions
require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $page_title ?? 'misvord'; ?></title>
    <link rel="stylesheet" href="<?php echo css('global'); ?>">
    <?php if (isset($page_css)): ?>
    <link rel="stylesheet" href="<?php echo css($page_css); ?>">
    <?php endif; ?>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
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
</head>
<body class="<?php echo $body_class ?? 'bg-discord-background text-white'; ?>">
    <?php echo $content ?? ''; ?>
    
    <!-- Include modal components -->
    <?php include_once dirname(__DIR__) . '/components/app-sections/create-server-modal.php'; ?>
    <?php include_once dirname(__DIR__) . '/components/app-sections/server-actions-modals.php'; ?>
    
    <!-- Scripts -->
    <script src="<?php echo js('socket.io.min'); ?>?v=<?php echo time(); ?>"></script>
    <script src="<?php echo js('global'); ?>?v=<?php echo time(); ?>"></script>
    <script src="<?php echo js('app'); ?>?v=<?php echo time(); ?>"></script>
    <?php if (isset($page_js)): ?>
    <script src="<?php echo js($page_js); ?>?v=<?php echo time(); ?>"></script>
    <?php endif; ?>
    <?php if (isset($additional_js) && is_array($additional_js)): ?>
        <?php foreach($additional_js as $js_file): ?>
        <script src="<?php echo js(rtrim($js_file, '.js')); ?>?v=<?php echo time(); ?>"></script>
        <?php endforeach; ?>
    <?php endif; ?>
</body>
</html>