<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $title ?? 'MiscVord App'; ?></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'discord-primary': '#5865F2',
                        'discord-green': '#3ba55c',
                        'discord-yellow': '#faa61a',
                        'discord-red': '#ed4245',
                        'discord-background': '#36393f',
                        'discord-dark': '#2f3136',
                        'discord-darker': '#202225',
                        'discord-light': '#40444b',
                        'discord-lighter': '#b9bbbe'
                    }
                }
            }
        }
    </script>
    <link rel="stylesheet" href="/css/app.css">
    <link rel="stylesheet" href="/css/lazy-loading.css">
    <?php if (isset($extraCss)): ?>
        <?php foreach ($extraCss as $css): ?>
            <link rel="stylesheet" href="<?php echo $css; ?>">
        <?php endforeach; ?>
    <?php endif; ?>
</head>
<body class="bg-discord-background text-white">
    <?php echo $content ?? ''; ?>
    
    <script src="/js/global.js"></script>
    <script src="/js/lazy-loader.js"></script>
    <?php if (isset($extraJs)): ?>
        <?php foreach ($extraJs as $js): ?>
            <script src="<?php echo $js; ?>"></script>
        <?php endforeach; ?>
    <?php endif; ?>
</body>
</html> 