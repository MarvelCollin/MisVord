<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<section class="flex flex-col md:flex-row items-center gap-8 md:gap-16 feature-section">
    <div class="w-full md:w-1/2 feature-image">
        <div class="modern-image">
            <img src="<?php echo asset('/images/landing-page/actor.webp'); ?>" alt="Study Group" class="w-full h-auto">
        </div>
    </div>
    <div class="w-full md:w-1/2 feature-content">
        <div class="content-card p-8 md:p-10 rounded-3xl">
            <h2 class="text-3xl md:text-5xl font-bold mb-6 section-title">Create an invite-only place where you belong</h2>
            <p class="text-lg md:text-xl text-gray-200">
                MiscVord servers are organized into topic-based channels where you can collaborate, share, and just talk about your day without clogging up a group chat.
            </p>
        </div>
    </div>
</section>
