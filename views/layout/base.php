<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/head.php'; ?>
    <?php if (isset($pageTitle)): ?>
        <title><?= htmlspecialchars($pageTitle) ?> - <?= APP_NAME ?></title>
    <?php else: ?>
        <title><?= APP_NAME ?></title>
    <?php endif; ?>
    
    <?php if (isset($additionalStyles)): ?>
        <?php foreach ($additionalStyles as $style): ?>
            <link rel="stylesheet" href="<?= htmlspecialchars($style) ?>">
        <?php endforeach; ?>
    <?php endif; ?>
</head>
<body class="bg-discord-background text-white">
    <?php if (isset($bodyClasses)): ?>
        <script>document.body.className += ' <?= htmlspecialchars($bodyClasses) ?>';</script>
    <?php endif; ?>
    
    <?php if (isset($showNavigation) && $showNavigation): ?>
        <?php include_once __DIR__ . '/../components/navigation.php'; ?>
    <?php endif; ?>
    
    <main class="main-content">
        <?php if (isset($content)): ?>
            <?= $content ?>
        <?php else: ?>
            <?php include_once $viewFile ?? __DIR__ . '/../pages/404.php'; ?>
        <?php endif; ?>
    </main>
    
    <?php if (isset($showFooter) && $showFooter): ?>
        <?php include_once __DIR__ . '/../components/footer.php'; ?>
    <?php endif; ?>
    
    <?php include_once __DIR__ . '/scripts.php'; ?>
    
    <?php if (isset($additionalScripts)): ?>
        <?php foreach ($additionalScripts as $script): ?>
            <script src="<?= htmlspecialchars($script) ?>"></script>
        <?php endforeach; ?>
    <?php endif; ?>
</body>
</html>
