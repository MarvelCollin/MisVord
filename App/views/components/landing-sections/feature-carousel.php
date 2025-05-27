<?php

if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<section class="py-20 px-6 relative overflow-hidden" id="feature-carousel-section">
    <div class="container mx-auto">

        <div class="text-center mb-12">
            <h2 class="text-4xl md:text-6xl font-bold mb-6 text-white section-title animated-fade-in">
                <span class="bg-gradient-to-r from-discord-green to-discord-blue bg-clip-text text-transparent">
                    Discord Features
                </span>
            </h2>
            <p class="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto animated-fade-in mb-2">
                Everything you need to create your community
            </p>
        </div>

        <div class="feature-carousel relative rounded-2xl overflow-hidden shadow-2xl" tabindex="0">

            <div class="carousel-nav mt-8 flex flex-col items-center">

            </div>
        </div>
    </div>
</section>