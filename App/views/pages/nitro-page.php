<?php
require_once dirname(dirname(__DIR__)) . '/config/env.php';

$pageTitle = 'Nitro';

$page_css = 'nitro-page';

require_once dirname(__DIR__) . '/layout/head.php';
?>

<script>
document.addEventListener('DOMContentLoaded', function() {
    document.body.setAttribute('data-page', 'nitro');
});
</script>

<div class="flex flex-col min-h-screen text-white nitro-page-bg">
    <?php require_once dirname(__DIR__) . '/layout/app.php'; ?>

    <div class="flex-1">
        <div class="nitro-hero-section bg-gradient-to-b from-transparent via-purple-800/30 to-transparent">
            <div class="max-w-7xl mx-auto px-6 py-16">
                <div class="flex justify-start mb-8">
                    <button onclick="history.back()" class="back-button flex items-center gap-2 bg-discord-darker/50 hover:bg-discord-darker/80 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 transform backdrop-blur-sm border border-white/10 hover:border-purple-500/50">
                        <i class="fas fa-arrow-left"></i>
                        <span>Back</span>
                    </button>
                </div>
                <div class="text-center relative z-10">
                    <div class="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse floating-particle"></div>
                    <div class="absolute -top-5 -right-5 w-24 h-24 bg-blue-500/20 rounded-full blur-3xl animate-pulse floating-particle"></div>
                    <div class="absolute top-20 left-1/4 w-16 h-16 bg-pink-500/30 rounded-full blur-2xl floating-particle"></div>
                    <div class="absolute bottom-10 right-1/3 w-20 h-20 bg-indigo-500/25 rounded-full blur-3xl floating-particle"></div>
                    <h1 class="text-6xl font-bold mb-6 text-white relative inline-block">
                        Get more with Nitro
                    </h1>
                    <p class="text-xl text-purple-100 mb-12 max-w-2xl mx-auto">
                        Unlock perks to make your Discord experience even better - bigger file uploads, HD video, custom profiles, and more!
                    </p>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-6 -mt-16 relative z-10">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 mt-8">
                <div class="bg-discord-light rounded-lg p-8 border-2 border-purple-500 relative transform shadow-2xl nitro-card-hover scroll-reveal" style="z-index: 20;">
                    <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse" style="z-index: 30;">
                        PREMIUM EXPERIENCE
                    </div>
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                            <i class="fas fa-crown text-white text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold">Nitro</h3>
                            <p class="text-purple-400 font-semibold" id="nitro-price">$9.99/month</p>
                        </div>
                    </div>
                    <ul class="space-y-4 mb-8">
                        <li class="flex items-start gap-3 hover:translate-x-1 transition-transform cursor-pointer">
                            <i class="fas fa-check text-green-500 mt-1"></i>
                            <span>500MB uploads <span class="text-green-400">(up from 8MB)</span></span>
                        </li>
                        <li class="flex items-start gap-3 hover:translate-x-1 transition-transform cursor-pointer">
                            <i class="fas fa-check text-green-500 mt-1"></i>
                            <span>4K 60fps HD video streaming</span>
                        </li>
                        <li class="flex items-start gap-3 hover:translate-x-1 transition-transform cursor-pointer">
                            <i class="fas fa-check text-green-500 mt-1"></i>
                            <span>Custom profiles and animated banners</span>
                        </li>
                        <li class="flex items-start gap-3 hover:translate-x-1 transition-transform cursor-pointer">
                            <i class="fas fa-check text-green-500 mt-1"></i>
                            <span>2 Server Boosts + 30% off extra Boosts</span>
                        </li>
                        <li class="flex items-start gap-3 hover:translate-x-1 transition-transform cursor-pointer">
                            <i class="fas fa-check text-green-500 mt-1"></i>
                            <span>Longer messages (up to 4,000 characters)</span>
                        </li>
                        <li class="flex items-start gap-3 hover:translate-x-1 transition-transform cursor-pointer">
                            <i class="fas fa-check text-green-500 mt-1"></i>
                            <span>Custom emoji anywhere</span>
                        </li>
                        <li class="flex items-start gap-3 hover:translate-x-1 transition-transform cursor-pointer">
                            <i class="fas fa-check text-green-500 mt-1"></i>
                            <span>Custom server profiles</span>
                        </li>
                    </ul>
                    <button class="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 rounded-md transition-all nitro-subscribe-btn">
                        <i class="fas fa-crown mr-2"></i>Subscribe
                    </button>
                </div>

                <div class="bg-discord-darker rounded-lg p-8 border border-gray-700 hover:border-purple-500 transition-colors scroll-reveal">
                    <div class="text-center mb-6">
                        <div class="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 relative hover:scale-110 transition-transform">
                            <i class="fas fa-gift text-gray-400 text-3xl"></i>
                            <div class="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 animate-pulse"></div>
                        </div>
                        <h3 class="text-2xl font-bold mb-2">Got a gift?</h3>
                        <p class="text-gray-400 mb-4">Redeem your Nitro code below</p>
                    </div>
                    <div class="space-y-4">
                        <div class="relative transition-all duration-300" id="code-input-container">
                            <input 
                                type="text" 
                                id="nitro-code-input" 
                                placeholder="XXXX-XXXX-XXXX-XXXX" 
                                class="w-full bg-discord-dark border border-gray-600 rounded-md px-4 py-4 pr-12 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-all duration-300"
                                maxlength="19"
                            >
                            <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 transition-colors">
                                <i class="fas fa-gift text-lg"></i>
                            </div>
                        </div>
                        <button 
                            id="redeem-code-btn" 
                            class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                            disabled
                        >
                            <i class="fas fa-check-circle mr-2"></i>
                            Redeem Code
                        </button>
                        <p class="text-xs text-center text-gray-400 mt-2">
                            Enter a valid code to unlock all Nitro benefits
                        </p>
                    </div>

                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                <div class="scroll-reveal slide-left">
                    <h2 class="text-3xl font-bold mb-8 relative">
                        Nitro Perks
                    </h2>
                    <div class="space-y-6">
                        <div class="flex gap-4 group cursor-pointer perk-item">
                            <div class="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0 nitro-perk-icon">
                                <i class="fas fa-upload text-purple-400 text-xl"></i>
                            </div>
                            <div>
                                <h4 class="font-semibold text-lg mb-1 group-hover:text-purple-400 transition-colors">Bigger uploads</h4>
                                <p class="text-gray-400">Share files up to 500MB with Nitro</p>
                            </div>
                        </div>
                        <div class="flex gap-4 group cursor-pointer perk-item">
                            <div class="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0 nitro-perk-icon">
                                <i class="fas fa-video text-purple-400 text-xl"></i>
                            </div>
                            <div>
                                <h4 class="font-semibold text-lg mb-1 group-hover:text-purple-400 transition-colors">HD video streaming</h4>
                                <p class="text-gray-400">Stream in 1080p 60fps or 4K 60fps</p>
                            </div>
                        </div>
                        <div class="flex gap-4 group cursor-pointer perk-item">
                            <div class="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0 nitro-perk-icon">
                                <i class="fas fa-smile text-purple-400 text-xl"></i>
                            </div>
                            <div>
                                <h4 class="font-semibold text-lg mb-1 group-hover:text-purple-400 transition-colors">Custom emoji anywhere</h4>
                                <p class="text-gray-400">Use custom emoji from any server</p>
                            </div>
                        </div>
                        <div class="flex gap-4 group cursor-pointer perk-item">
                            <div class="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0 nitro-perk-icon">
                                <i class="fas fa-palette text-purple-400 text-xl"></i>
                            </div>
                            <div>
                                <h4 class="font-semibold text-lg mb-1 group-hover:text-purple-400 transition-colors">Personalize your profile</h4>
                                <p class="text-gray-400">Use an animated avatar and profile banner</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="scroll-reveal slide-right">
                    <h2 class="text-3xl font-bold mb-8 relative">
                        Server Boosts Included
                    </h2>
                    <div class="bg-discord-light rounded-lg p-6 mb-6 hover:scale-[1.02] transition-transform cursor-pointer">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform relative">
                                <i class="fas fa-rocket text-white text-2xl"></i>
                                <div class="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
                            </div>
                            <div>
                                <h4 class="text-xl font-semibold">2 Server Boosts</h4>
                                <p class="text-gray-400">Help your favorite servers unlock perks</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div class="flex items-center gap-2 hover:text-green-400 transition-colors cursor-pointer">
                                <i class="fas fa-check text-green-500"></i>
                                <span>Better audio quality</span>
                            </div>
                            <div class="flex items-center gap-2 hover:text-green-400 transition-colors cursor-pointer">
                                <i class="fas fa-check text-green-500"></i>
                                <span>More emoji slots</span>
                            </div>
                            <div class="flex items-center gap-2 hover:text-green-400 transition-colors cursor-pointer">
                                <i class="fas fa-check text-green-500"></i>
                                <span>Bigger upload limit</span>
                            </div>
                            <div class="flex items-center gap-2 hover:text-green-400 transition-colors cursor-pointer">
                                <i class="fas fa-check text-green-500"></i>
                                <span>HD streaming</span>
                            </div>
                        </div>
                    </div>
                    <div class="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4 text-center hover:bg-purple-600/20 transition-colors cursor-pointer relative overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
                        <p class="text-purple-300 relative z-10">
                            <i class="fas fa-tag mr-2"></i>
                            Get 30% off additional Server Boosts
                        </p>
                    </div>
                </div>
            </div>

            <div class="text-center py-12 border-t border-gray-700 scroll-reveal">
                <p class="text-gray-400 mb-4">Questions? Check out our support articles or contact us.</p>
                <div class="flex gap-6 justify-center">
                    <a href="#" class="text-purple-400 hover:text-purple-300 transition-all hover:scale-110 transform flex items-center gap-2 group">
                        <i class="fas fa-book group-hover:animate-bounce"></i>Support
                    </a>
                    <a href="#" class="text-purple-400 hover:text-purple-300 transition-all hover:scale-110 transform flex items-center gap-2 group">
                        <i class="fas fa-shield-alt group-hover:animate-pulse"></i>Terms
                    </a>
                    <a href="#" class="text-purple-400 hover:text-purple-300 transition-all hover:scale-110 transform flex items-center gap-2 group">
                        <i class="fas fa-lock group-hover:animate-spin"></i>Privacy
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="nitro-success-modal" class="hidden fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-discord-light rounded-lg p-8 max-w-md w-full mx-4 text-center animate-fade-in relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-purple-600/20 animate-pulse"></div>
        <div class="relative z-10">
            <div class="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <i class="fas fa-check text-white text-3xl"></i>
                <div class="absolute inset-0 rounded-full bg-green-400/30 animate-ping"></div>
            </div>
            <h3 class="text-2xl font-bold mb-4">Welcome to Nitro!</h3>
            <p class="text-gray-300 mb-6">Your Nitro subscription has been activated. Enjoy all the perks!</p>
            <button onclick="location.reload()" class="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-md transition-colors hover:scale-105 transform relative overflow-hidden">
                <span class="relative z-10 flex items-center justify-center">
                    <i class="fas fa-rocket mr-2"></i> Awesome!
                </span>
                <div class="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full transition-transform duration-700 group-hover:translate-x-full"></div>
            </button>
        </div>
    </div>
</div>

<script src="<?php echo js('/pages/nitro-page'); ?>"></script>

<?php 
?>