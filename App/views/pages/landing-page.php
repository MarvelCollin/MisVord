<?php
require_once dirname(dirname(__DIR__)) . '/config/helpers.php';

$page_title = 'misvord - Chat & Share with Friends';
$body_class = 'bg-gray-900 text-white';
$page_css = 'landing-page';
$page_js = 'pages/landing-page';

ob_start();
?>

<!-- Simple Hero Section with Scramble Text Only -->
<section class="hero-section min-h-screen flex items-center justify-center">
    <div class="text-center">
        <h1 class="hero-title scramble-text text-6xl md:text-8xl font-bold mb-8" data-text="IMAGINE A PLACE...">
            IMAGINE A PLACE...
        </h1>
    </div>
</section>

<?php
$content = ob_get_clean();
require_once dirname(__DIR__) . '/layout/landing.php';
?>