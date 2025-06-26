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

<div class="flex flex-col min-h-screen bg-discord-dark text-white overflow-hidden">
    <?php require_once dirname(__DIR__) . '/layout/app.php'; ?>

    <div class="flex-1 relative">
        <div class="nitro-hero-section relative">
            <div class="particle-field"></div>
            <div class="matrix-effect"></div>
            
            <div class="max-w-7xl mx-auto px-6 py-24 relative z-10 hero-content">
                <div class="flex justify-start mb-12">
                    <button onclick="history.back()" class="back-button flex items-center gap-3 bg-discord-darker/50 hover:bg-discord-darker/80 text-white px-6 py-3 rounded-xl transition-all duration-500 hover:scale-105 transform backdrop-blur-sm border border-white/10 hover:border-purple-500/50 group">
                        <i class="fas fa-arrow-left group-hover:animate-pulse"></i>
                        <span>Back</span>
                    </button>
                </div>
                
                <div class="text-center relative">
                    <div class="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl animate-pulse floating-particle"></div>
                    <div class="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/25 rounded-full blur-3xl animate-pulse floating-particle"></div>
                    <div class="absolute top-32 left-1/4 w-24 h-24 bg-pink-500/35 rounded-full blur-2xl floating-particle"></div>
                    <div class="absolute bottom-20 right-1/3 w-28 h-28 bg-indigo-500/30 rounded-full blur-3xl floating-particle"></div>
                    <div class="absolute top-10 right-1/4 w-16 h-16 bg-green-500/25 rounded-full blur-2xl floating-particle"></div>
                    <div class="absolute bottom-32 left-1/5 w-20 h-20 bg-yellow-500/25 rounded-full blur-3xl floating-particle"></div>
                    
                    <h1 class="text-7xl md:text-8xl font-bold mb-8 text-white relative inline-block">
                        Get more with Nitro
                    </h1>
                    <p class="text-2xl text-purple-100 mb-16 max-w-3xl mx-auto leading-relaxed">
                        Unlock perks to make your Discord experience even better - bigger file uploads, HD video, custom profiles, and more!
                    </p>
                    
                    <div class="flex justify-center items-center gap-4 mb-12">
                        <div class="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                        <div class="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
                        <div class="w-3 h-3 bg-pink-500 rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
                        <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse" style="animation-delay: 0.6s;"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-6 -mt-32 relative z-20">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
                <div class="bg-discord-light rounded-2xl p-10 border-2 border-purple-500/50 relative transform shadow-2xl nitro-card-hover scroll-reveal hologram-effect">
                    <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold animate-pulse shadow-lg">
                        <i class="fas fa-crown mr-2"></i>PREMIUM EXPERIENCE
                    </div>
                    
                    <div class="flex items-center gap-4 mb-8">
                        <div class="w-16 h-16 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform relative overflow-hidden">
                            <i class="fas fa-crown text-white text-2xl"></i>
                            <div class="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold">Nitro Premium</h3>
                            <p class="text-purple-400 font-semibold text-lg" id="nitro-price">$9.99/month</p>
                        </div>
                    </div>
                    
                    <ul class="space-y-5 mb-10">
                        <li class="flex items-start gap-4 hover:translate-x-2 transition-transform cursor-pointer group">
                            <i class="fas fa-check text-green-500 mt-1 text-lg group-hover:animate-bounce"></i>
                            <span class="text-lg">500MB uploads <span class="text-green-400 font-semibold">(up from 8MB)</span></span>
                        </li>
                        <li class="flex items-start gap-4 hover:translate-x-2 transition-transform cursor-pointer group">
                            <i class="fas fa-check text-green-500 mt-1 text-lg group-hover:animate-bounce"></i>
                            <span class="text-lg">4K 60fps HD video streaming</span>
                        </li>
                        <li class="flex items-start gap-4 hover:translate-x-2 transition-transform cursor-pointer group">
                            <i class="fas fa-check text-green-500 mt-1 text-lg group-hover:animate-bounce"></i>
                            <span class="text-lg">Custom profiles and animated banners</span>
                        </li>
                        <li class="flex items-start gap-4 hover:translate-x-2 transition-transform cursor-pointer group">
                            <i class="fas fa-check text-green-500 mt-1 text-lg group-hover:animate-bounce"></i>
                            <span class="text-lg">2 Server Boosts + 30% off extra Boosts</span>
                        </li>
                        <li class="flex items-start gap-4 hover:translate-x-2 transition-transform cursor-pointer group">
                            <i class="fas fa-check text-green-500 mt-1 text-lg group-hover:animate-bounce"></i>
                            <span class="text-lg">Longer messages (up to 4,000 characters)</span>
                        </li>
                        <li class="flex items-start gap-4 hover:translate-x-2 transition-transform cursor-pointer group">
                            <i class="fas fa-check text-green-500 mt-1 text-lg group-hover:animate-bounce"></i>
                            <span class="text-lg">Custom emoji anywhere</span>
                        </li>
                        <li class="flex items-start gap-4 hover:translate-x-2 transition-transform cursor-pointer group">
                            <i class="fas fa-check text-green-500 mt-1 text-lg group-hover:animate-bounce"></i>
                            <span class="text-lg">Custom server profiles</span>
                        </li>
                    </ul>
                    
                    <button class="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl transition-all nitro-subscribe-btn text-lg relative overflow-hidden">
                        <span class="relative z-10 flex items-center justify-center">
                            <i class="fas fa-crown mr-3"></i>Subscribe Now
                        </span>
                    </button>
                </div>

                <div class="bg-discord-darker rounded-2xl p-10 border border-gray-700/50 hover:border-purple-500/50 transition-colors scroll-reveal hologram-effect">
                    <div class="text-center mb-8">
                        <div class="w-24 h-24 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full flex items-center justify-center mx-auto mb-6 relative hover:scale-110 transition-transform border border-purple-500/30">
                            <i class="fas fa-gift text-purple-400 text-4xl"></i>
                            <div class="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 animate-pulse"></div>
                        </div>
                        <h3 class="text-3xl font-bold mb-3">Got a gift?</h3>
                        <p class="text-gray-400 mb-6 text-lg">Redeem your Nitro code below</p>
                    </div>
                    
                    <div class="space-y-6">
                        <div class="relative transition-all duration-500" id="code-input-container">
                            <input 
                                type="text" 
                                id="nitro-code-input" 
                                placeholder="XXXX-XXXX-XXXX-XXXX" 
                                class="w-full bg-discord-dark/80 border-2 border-gray-600/50 rounded-xl px-6 py-5 pr-16 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-all duration-500 text-lg font-mono"
                                maxlength="19"
                            >
                            <div class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 transition-colors">
                                <i class="fas fa-gift text-xl"></i>
                            </div>
                        </div>
                        
                        <button 
                            id="redeem-code-btn" 
                            class="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-lg relative overflow-hidden"
                            disabled
                        >
                            <span class="relative z-10 flex items-center justify-center">
                                <i class="fas fa-check-circle mr-3"></i>
                                Redeem Code
                            </span>
                        </button>
                        
                        <p class="text-sm text-center text-gray-400 mt-4">
                            <i class="fas fa-info-circle mr-2"></i>
                            Enter a valid code to unlock all Nitro benefits
                        </p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
                <div class="scroll-reveal slide-left">
                    <h2 class="text-4xl font-bold mb-10 relative">
                        <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Nitro Perks</span>
                        <div class="absolute -bottom-2 left-0 w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    </h2>
                    
                    <div class="space-y-8">
                        <div class="flex gap-6 group cursor-pointer perk-item bg-discord-darker/30 p-6 rounded-xl hover:bg-discord-darker/50 transition-all">
                            <div class="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center flex-shrink-0 nitro-perk-icon border border-purple-500/30">
                                <i class="fas fa-upload text-purple-400 text-2xl"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-xl mb-2 group-hover:text-purple-400 transition-colors">Bigger uploads</h4>
                                <p class="text-gray-400 text-lg">Share files up to 500MB with Nitro</p>
                            </div>
                        </div>
                        
                        <div class="flex gap-6 group cursor-pointer perk-item bg-discord-darker/30 p-6 rounded-xl hover:bg-discord-darker/50 transition-all">
                            <div class="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center flex-shrink-0 nitro-perk-icon border border-purple-500/30">
                                <i class="fas fa-video text-purple-400 text-2xl"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-xl mb-2 group-hover:text-purple-400 transition-colors">HD video streaming</h4>
                                <p class="text-gray-400 text-lg">Stream in 1080p 60fps or 4K 60fps</p>
                            </div>
                        </div>
                        
                        <div class="flex gap-6 group cursor-pointer perk-item bg-discord-darker/30 p-6 rounded-xl hover:bg-discord-darker/50 transition-all">
                            <div class="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center flex-shrink-0 nitro-perk-icon border border-purple-500/30">
                                <i class="fas fa-smile text-purple-400 text-2xl"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-xl mb-2 group-hover:text-purple-400 transition-colors">Custom emoji anywhere</h4>
                                <p class="text-gray-400 text-lg">Use custom emoji from any server</p>
                            </div>
                        </div>
                        
                        <div class="flex gap-6 group cursor-pointer perk-item bg-discord-darker/30 p-6 rounded-xl hover:bg-discord-darker/50 transition-all">
                            <div class="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center flex-shrink-0 nitro-perk-icon border border-purple-500/30">
                                <i class="fas fa-palette text-purple-400 text-2xl"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-xl mb-2 group-hover:text-purple-400 transition-colors">Personalize your profile</h4>
                                <p class="text-gray-400 text-lg">Use an animated avatar and profile banner</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="scroll-reveal slide-right">
                    <h2 class="text-4xl font-bold mb-10 relative">
                        <span class="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">Server Boosts Included</span>
                        <div class="absolute -bottom-2 left-0 w-20 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"></div>
                    </h2>
                    
                    <div class="bg-discord-light rounded-2xl p-8 mb-8 hover:scale-[1.02] transition-transform cursor-pointer border border-purple-500/20 hologram-effect">
                        <div class="flex items-center gap-6 mb-6">
                            <div class="w-20 h-20 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform relative overflow-hidden">
                                <i class="fas fa-rocket text-white text-3xl"></i>
                                <div class="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
                            </div>
                            <div>
                                <h4 class="text-2xl font-bold">2 Server Boosts</h4>
                                <p class="text-gray-400 text-lg">Help your favorite servers unlock perks</p>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-6 text-base">
                            <div class="flex items-center gap-3 hover:text-green-400 transition-colors cursor-pointer p-3 rounded-lg hover:bg-green-500/10">
                                <i class="fas fa-check text-green-500 text-lg"></i>
                                <span>Better audio quality</span>
                            </div>
                            <div class="flex items-center gap-3 hover:text-green-400 transition-colors cursor-pointer p-3 rounded-lg hover:bg-green-500/10">
                                <i class="fas fa-check text-green-500 text-lg"></i>
                                <span>More emoji slots</span>
                            </div>
                            <div class="flex items-center gap-3 hover:text-green-400 transition-colors cursor-pointer p-3 rounded-lg hover:bg-green-500/10">
                                <i class="fas fa-check text-green-500 text-lg"></i>
                                <span>Bigger upload limit</span>
                            </div>
                            <div class="flex items-center gap-3 hover:text-green-400 transition-colors cursor-pointer p-3 rounded-lg hover:bg-green-500/10">
                                <i class="fas fa-check text-green-500 text-lg"></i>
                                <span>HD streaming</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 border border-purple-600/40 rounded-2xl p-6 text-center hover:from-purple-600/30 hover:via-pink-600/30 hover:to-purple-600/30 transition-all cursor-pointer relative overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-pulse"></div>
                        <p class="text-purple-300 relative z-10 text-lg font-semibold">
                            <i class="fas fa-tag mr-3 text-xl"></i>
                            Get 30% off additional Server Boosts
                        </p>
                    </div>
                </div>
            </div>

            <div class="text-center py-16 border-t border-gray-700/50 scroll-reveal relative">
                <div class="max-w-2xl mx-auto">
                    <h3 class="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Need Help?
                    </h3>
                    <p class="text-gray-400 mb-8 text-lg">Questions? Check out our support articles or contact us.</p>
                    
                    <div class="flex gap-8 justify-center">
                        <a href="#" class="group flex items-center gap-3 text-purple-400 hover:text-purple-300 transition-all hover:scale-110 transform bg-purple-500/10 px-6 py-3 rounded-xl border border-purple-500/30 hover:border-purple-500/50">
                            <i class="fas fa-book group-hover:animate-bounce text-lg"></i>
                            <span class="font-semibold">Support</span>
                        </a>
                        <a href="#" class="group flex items-center gap-3 text-blue-400 hover:text-blue-300 transition-all hover:scale-110 transform bg-blue-500/10 px-6 py-3 rounded-xl border border-blue-500/30 hover:border-blue-500/50">
                            <i class="fas fa-shield-alt group-hover:animate-pulse text-lg"></i>
                            <span class="font-semibold">Terms</span>
                        </a>
                        <a href="#" class="group flex items-center gap-3 text-green-400 hover:text-green-300 transition-all hover:scale-110 transform bg-green-500/10 px-6 py-3 rounded-xl border border-green-500/30 hover:border-green-500/50">
                            <i class="fas fa-lock group-hover:animate-spin text-lg"></i>
                            <span class="font-semibold">Privacy</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="nitro-success-modal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
    <div class="bg-discord-light rounded-2xl p-10 max-w-md w-full mx-4 text-center animate-fade-in relative overflow-hidden border border-purple-500/30">
        <div class="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-purple-600/20 animate-pulse"></div>
        <div class="relative z-10">
            <div class="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 relative overflow-hidden">
                <i class="fas fa-check text-white text-4xl"></i>
                <div class="absolute inset-0 rounded-full bg-green-400/30 animate-ping"></div>
            </div>
            <h3 class="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Welcome to Nitro!</h3>
            <p class="text-gray-300 mb-8 text-lg">Your Nitro subscription has been activated. Enjoy all the perks!</p>
            <button onclick="location.reload()" class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-4 rounded-xl transition-all hover:scale-105 transform relative overflow-hidden">
                <span class="relative z-10 flex items-center justify-center">
                    <i class="fas fa-rocket mr-3"></i> Awesome!
                </span>
            </button>
        </div>
    </div>
</div>

<script src="<?php echo js('/pages/nitro-page'); ?>"></script>
