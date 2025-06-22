<?php
require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/head.php'; ?>
</head>
<body class="<?php echo $body_class ?? 'bg-gray-900'; ?> <?php echo isset($_SESSION['user_id']) ? 'authenticated' : ''; ?>" <?php echo isset($body_attributes) ? $body_attributes : ''; ?>>
    <?php echo $content ?? ''; ?>
    
    <?php if (!isset($data_page) || $data_page !== 'auth'): ?>
        <?php include_once dirname(__DIR__) . '/components/app-sections/create-server-modal.php'; ?>
        <?php include_once dirname(__DIR__) . '/components/app-sections/server-actions-modals.php'; ?>
        <?php include_once dirname(__DIR__) . '/components/common/user-detail.php'; ?>
    <?php endif; ?>
    
    <?php include_once __DIR__ . '/scripts.php'; ?>
    
    <?php if (!isset($data_page) || $data_page !== 'auth'): ?>
        <script type="module" src="<?php echo js('components/servers/server-manager'); ?>"></script>
    <?php endif; ?>
    
    <script type="module" src="<?= asset('/js/components/index.js') ?>"></script>
    <script type="module" src="<?= asset('/js/pages/app.js') ?>"></script>
    
    <!-- CSRF token for AJAX calls -->
    <meta name="csrf-token" content="<?php echo isset($_SESSION['csrf_token']) ? $_SESSION['csrf_token'] : ''; ?>">
</body>
</html>