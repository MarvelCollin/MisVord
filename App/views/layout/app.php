<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/head.php'; ?>
</head>
    <?php
// Check if this is content from an auth page, in which case the body tag is already included
$isAuthPage = strpos($content ?? '', '<body data-page="auth">') !== false;

// Only output the body tag if not an auth page
if (!$isAuthPage):
?>
<body class="bg-discord-background text-white">
<?php endif; ?>

<?php echo $content ?? ''; ?>

<?php 
// Only close the body tag if we opened it (not an auth page)
if (!$isAuthPage): 
?>
</body>
<?php endif; ?>

<?php include_once __DIR__ . '/scripts.php'; ?>
</html>