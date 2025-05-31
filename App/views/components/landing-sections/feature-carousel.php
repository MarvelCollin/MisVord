<?php

if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<section class="py-20 px-6 relative overflow-hidden bg-gradient-to-b from-[#36393f] to-[#2f3136]" id="feature-carousel-section">
    <div class="container mx-auto">
        <div class="text-center mb-12">
            <h2 class="text-4xl md:text-6xl font-bold mb-6 text-white section-title animated-fade-in">
                <span class="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Powerful Features
                </span>
            </h2>
            <p class="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto animated-fade-in mb-8">
                Everything you need to build and manage your community
            </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <!-- Text Chat Feature -->
            <div class="feature-card bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300 transform hover:scale-105">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">Text Chat</h3>
                    <p class="text-gray-300 text-sm">Rich messaging with emoji, file sharing, and formatting</p>
                </div>
            </div>

            <!-- Voice Channels Feature -->
            <div class="feature-card bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-green-500/30 transition-all duration-300 transform hover:scale-105">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">Voice Channels</h3>
                    <p class="text-gray-300 text-sm">Crystal clear voice chat with noise suppression</p>
                </div>
            </div>

            <!-- Screen Share Feature -->
            <div class="feature-card bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300 transform hover:scale-105">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">Screen Share</h3>
                    <p class="text-gray-300 text-sm">Share your screen with low latency streaming</p>
                </div>
            </div>
        </div>
    </div>
</section>