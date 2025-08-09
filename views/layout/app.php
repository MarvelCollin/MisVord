<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/head.php'; ?>
</head>
    <?php
$isAuthPage = strpos($content ?? '', '<body data-page="auth">') !== false;

if (!$isAuthPage):
?>
<body class="bg-discord-background text-white">
<?php endif; ?>

<?php echo $content ?? ''; ?>

<?php 
if (!$isAuthPage): 
?>
</body>
<?php endif; ?>

<?php include_once __DIR__ . '/scripts.php'; ?>
</html>