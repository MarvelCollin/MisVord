<?php
require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/head.php'; ?>
</head>
<body class="<?php echo $body_class ?? 'bg-discord-background text-white'; ?>"<?php echo isset($data_page) ? ' data-page="' . $data_page . '"' : ''; ?>>
    <?php echo $content ?? ''; ?>
    
    <?php if (!isset($data_page) || $data_page !== 'auth'): ?>
        <?php include_once dirname(__DIR__) . '/components/app-sections/create-server-modal.php'; ?>
        <?php include_once dirname(__DIR__) . '/components/app-sections/server-actions-modals.php'; ?>
    <?php endif; ?>
    
    <?php include_once __DIR__ . '/scripts.php'; ?>
    
    <?php if (!isset($data_page) || $data_page !== 'auth'): ?>
        <script type="module" src="<?php echo js('components/servers/server-manager'); ?>"></script>
    <?php endif; ?>
</body>
</html>