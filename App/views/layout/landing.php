<?php
require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/landing-head.php'; ?>
</head>
<body class="<?php echo $body_class ?? 'bg-white'; ?>"<?php echo isset($data_page) ? ' data-page="' . $data_page . '"' : ''; ?>>
    <?php echo $content ?? ''; ?>
    
    <?php include_once __DIR__ . '/landing-scripts.php'; ?>
</body>
</html>
