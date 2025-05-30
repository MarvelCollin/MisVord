<?php require_once __DIR__ . '/../layout/header.php'; ?>

<main class="main-content">
    <!-- Include reusable components -->
    <?php require_once __DIR__ . '/../components/app-sections/server-sidebar.php'; ?>
    <?php require_once __DIR__ . '/../components/app-sections/channel-list.php'; ?>
    
    <div class="chat-area">
        <?php require_once __DIR__ . '/../components/app-sections/message-list.php'; ?>
        <?php require_once __DIR__ . '/../components/app-sections/message-input.php'; ?>
    </div>
</main>

<?php require_once __DIR__ . '/../layout/footer.php'; ?>
