<?php
// Include helper functions
require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($page_title) ? $page_title : 'misvord'; ?></title>
    
    <!-- Favicon -->
    <link rel="shortcut icon" href="<?php echo asset('/favicon.ico'); ?>" type="image/x-icon">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Font Awesome 6 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    
    <!-- Base Tailwind CSS -->
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    
    <!-- Global CSS -->
    <link rel="stylesheet" href="<?php echo asset('/css/global.css'); ?>">
    
    <!-- Page Specific CSS -->
    <?php if (isset($page_css)): ?>
    <link rel="stylesheet" href="<?php echo asset('/css/' . $page_css . '.css'); ?>">
    <?php endif; ?>
    
    <!-- Section CSS -->
    <link rel="stylesheet" href="<?php echo asset('/css/section.css'); ?>">
    
    <!-- Footer CSS -->
    <link rel="stylesheet" href="<?php echo asset('/css/footer.css'); ?>">
</head>
<body class="<?php echo isset($body_class) ? $body_class : ''; ?>">
    <?php echo $content; ?>
    
    <!-- Global JS -->
    <script src="<?php echo asset('/js/global.js'); ?>"></script>
    
    <!-- Page Specific JS -->
    <?php if (isset($page_js)): ?>
    <script src="<?php echo asset('/js/' . $page_js . '.js'); ?>"></script>
    <?php endif; ?>
    
    <!-- Section JS -->
    <script src="<?php echo asset('/js/sections/hero-section.js'); ?>"></script>
</body>
</html>