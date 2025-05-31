<?php
// Include helper functions
require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $page_title ?? 'MisVord'; ?></title>
    <link rel="stylesheet" href="<?php echo css('global'); ?>">
    <link rel="stylesheet" href="<?php echo css('lazy-loading'); ?>">
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
<body class="<?php echo $body_class ?? 'bg-discord-background text-white'; ?>"<?php echo isset($data_page) ? ' data-page="' . $data_page . '"' : ''; ?>>
    <?php echo $content ?? ''; ?>
    
    <!-- Include modal components -->
    <?php include_once dirname(__DIR__) . '/components/app-sections/create-server-modal.php'; ?>
    <?php include_once dirname(__DIR__) . '/components/app-sections/server-actions-modals.php'; ?>
    <!-- Server action modals now include channel and category creation -->
    
    <!-- Scripts -->
    <?php include_once __DIR__ . '/scripts.php'; ?>
    
    <!-- Load server manager before other scripts -->
    <script type="module" src="<?php echo js('components/server-manager'); ?>"></script>
</body>
</html>