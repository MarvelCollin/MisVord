<?php
require_once dirname(dirname(__DIR__)) . '/config/env.php';

$pageTitle = 'Nitro';

$additionalStyles = [
    'nitro-page' 
];

require_once dirname(__DIR__) . '/layout/head.php';
?>

<script>
document.addEventListener('DOMContentLoaded', function() {
    document.body.setAttribute('data-page', 'nitro');
});
</script>

<div class="flex flex-col min-h-screen bg-discord-dark text-white">
    <?php require_once dirname(__DIR__) . '/layout/app.php'; ?>

    <div class="flex-1">
        <div class="nitro-hero-section bg-gradient-to-b from-purple-600 via-purple-700 to-discord-dark">
            <div class="max-w-7xl mx-auto px-6 py-16">
                <div class="text-center">
                    <h1 class="text-6xl font-bold mb-6 text-white">
                        Get more with Nitro
                    </h1>
                    <p class="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                        Unlock perks to make your Discord experience even better - bigger file uploads, HD video, custom profiles, and more!
                    </p>
                    <div class="flex gap-4 justify-center mb-12">
                        <button class="bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                            Monthly Billing
                        </button>
                        <button class="bg-purple-800/50 text-white px-8 py-3 rounded-full font-semibold hover:bg-purple-800/70 transition-colors">
                            Yearly Billing
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-6 -mt-24 relative z-10">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                <!-- Single Nitro Tier -->
                <div class="bg-discord-light rounded-lg p-8 border-2 border-purple-500 relative transform shadow-2xl nitro-card-hover">
                    <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                        PREMIUM EXPERIENCE
                    </div>
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                            <i class="fas fa-crown text-white text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold">Nitro</h3>
                            <p class="text-purple-400 font-semibold">$9.99/month</p>
                        </div>
                    </div>
                    <ul class="space-y-4 mb-8">
                        <li class="flex items-start gap-3">
                            <i class="fas fa-check text-green-500 mt-1"></i>
                            <span>500MB uploads (up from 8MB)</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <i class="fas fa-check text-green-500 mt-1"></i>
                            <span>HD video streaming</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <i class="fas fa-check text-green-500 mt-1"></i>
                            <span>Custom profiles and animated banners</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <i class="fas fa-check text-green-500 mt-1"></i>
                            <span>2 Server Boosts + 30% off extra Boosts</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <i class="fas fa-check text-green-500 mt-1"></i>
                            <span>Longer messages (up to 4,000 characters)</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <i class="fas fa-check text-green-500 mt-1"></i>
                            <span>Custom emoji anywhere</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <i class="fas fa-check text-green-500 mt-1"></i>
                            <span>Custom server profiles</span>
                        </li>
                    </ul>
                    <button class="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 rounded-md transition-all nitro-subscribe-btn">
                        Subscribe
                    </button>
                </div>

                <div class="bg-discord-darker rounded-lg p-8 border border-gray-700">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-gift text-gray-400 text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-2">Got a gift?</h3>
                        <p class="text-gray-400">Redeem your Nitro code</p>
                    </div>
                    <div class="space-y-4">
                        <input 
                            type="text" 
                            id="nitro-code-input" 
                            placeholder="XXXX-XXXX-XXXX-XXXX" 
                            class="w-full bg-discord-dark border border-gray-600 rounded-md px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                            maxlength="19"
                        >
                        <button 
                            id="redeem-code-btn" 
                            class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            Redeem Code
                        </button>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                <div>
                    <h2 class="text-3xl font-bold mb-8">Nitro Perks</h2>
                    <div class="space-y-6">
                        <div class="flex gap-4">
                            <div class="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-upload text-purple-400 text-xl"></i>
                            </div>
                            <div>
                                <h4 class="font-semibold text-lg mb-1">Bigger uploads</h4>
                                <p class="text-gray-400">Share files up to 500MB with Nitro</p>
                            </div>
                        </div>
                        <div class="flex gap-4">
                            <div class="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-video text-purple-400 text-xl"></i>
                            </div>
                            <div>
                                <h4 class="font-semibold text-lg mb-1">HD video streaming</h4>
                                <p class="text-gray-400">Stream in 1080p 60fps or 4K 60fps</p>
                            </div>
                        </div>
                        <div class="flex gap-4">
                            <div class="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-smile text-purple-400 text-xl"></i>
                            </div>
                            <div>
                                <h4 class="font-semibold text-lg mb-1">Custom emoji anywhere</h4>
                                <p class="text-gray-400">Use custom emoji from any server</p>
                            </div>
                        </div>
                        <div class="flex gap-4">
                            <div class="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-palette text-purple-400 text-xl"></i>
                            </div>
                            <div>
                                <h4 class="font-semibold text-lg mb-1">Personalize your profile</h4>
                                <p class="text-gray-400">Use an animated avatar and profile banner</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 class="text-3xl font-bold mb-8">Server Boosts Included</h2>
                    <div class="bg-discord-light rounded-lg p-6 mb-6">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                                <i class="fas fa-rocket text-white text-2xl"></i>
                            </div>
                            <div>
                                <h4 class="text-xl font-semibold">2 Server Boosts</h4>
                                <p class="text-gray-400">Help your favorite servers unlock perks</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-check text-green-500"></i>
                                <span>Better audio quality</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <i class="fas fa-check text-green-500"></i>
                                <span>More emoji slots</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <i class="fas fa-check text-green-500"></i>
                                <span>Bigger upload limit</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <i class="fas fa-check text-green-500"></i>
                                <span>HD streaming</span>
                            </div>
                        </div>
                    </div>
                    <div class="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4 text-center">
                        <p class="text-purple-300">
                            <i class="fas fa-tag mr-2"></i>
                            Get 30% off additional Server Boosts
                        </p>
                    </div>
                </div>
            </div>

            <div class="text-center py-12 border-t border-gray-700">
                <p class="text-gray-400 mb-4">Questions? Check out our support articles or contact us.</p>
                <div class="flex gap-4 justify-center">
                    <a href="#" class="text-purple-400 hover:text-purple-300 transition-colors">
                        <i class="fas fa-book mr-2"></i>Support
                    </a>
                    <a href="#" class="text-purple-400 hover:text-purple-300 transition-colors">
                        <i class="fas fa-shield-alt mr-2"></i>Terms
                    </a>
                    <a href="#" class="text-purple-400 hover:text-purple-300 transition-colors">
                        <i class="fas fa-lock mr-2"></i>Privacy
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="nitro-success-modal" class="hidden fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-discord-light rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <div class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <i class="fas fa-check text-white text-3xl"></i>
        </div>
        <h3 class="text-2xl font-bold mb-4">Welcome to Nitro!</h3>
        <p class="text-gray-300 mb-6">Your Nitro subscription has been activated. Enjoy all the perks!</p>
        <button onclick="location.reload()" class="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-md transition-colors">
            Awesome!
        </button>
    </div>
</div>

<script src="<?php echo js('/pages/nitro-page'); ?>"></script>

<?php 
// This file doesn't exist, it's not required for the page to work
// require_once dirname(__DIR__) . '/layout/foot.php'; 
?>
