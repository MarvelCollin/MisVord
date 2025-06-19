<?php
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<section id="feature-cards-section" class="feature-cards-section scroll-section min-h-screen py-20 relative overflow-hidden">
    <div class="container mx-auto px-4 relative z-10 h-full flex flex-col justify-center">
        <div class="section-title text-center mb-16 opacity-0 transform translate-y-10 transition-all duration-700">
            <h2 class="text-4xl md:text-5xl font-bold text-white mb-4">Discover the Experience</h2>
            <p class="text-xl text-gray-300 max-w-3xl mx-auto">Connect with friends and communities with powerful features designed for you.</p>
        </div>

        <div class="cards-container relative h-96 md:h-[450px] lg:h-[500px]">
            <div class="feature-card opacity-0 transform translate-y-16 transition-all duration-700 delay-100">
                <div class="card-inner">
                    <div class="card-front bg-gradient-to-br from-discord-darker to-discord-background rounded-xl p-6 h-full flex flex-col items-center justify-center text-center shadow-xl">
                        <div class="icon-container mb-4 w-16 h-16 bg-discord-primary bg-opacity-90 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg ring-2 ring-opacity-20 ring-white">
                            <i class="fas fa-comments text-2xl text-white"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-2 text-white">Text Channels</h3>
                        <p class="text-gray-300">Chat with friends and communities with rich text formatting.</p>
                    </div>
                    <div class="card-back bg-gradient-to-br from-discord-primary to-blue-700 rounded-xl p-6 h-full flex flex-col items-center justify-center text-center shadow-xl">
                        <ul class="text-white space-y-2">
                            <li><i class="fas fa-check text-green-300 mr-2"></i> Rich text formatting</li>
                            <li><i class="fas fa-check text-green-300 mr-2"></i> Media sharing</li>
                            <li><i class="fas fa-check text-green-300 mr-2"></i> Thread support</li>
                            <li><i class="fas fa-check text-green-300 mr-2"></i> Message reactions</li>
                        </ul>
                        <button class="mt-4 bg-white text-discord-primary font-bold py-2 px-4 rounded-full hover:bg-opacity-90 transition-all transform hover:scale-105 hover:shadow-lg">
                            Learn More
                        </button>
                    </div>
                </div>
            </div>

            <div class="feature-card opacity-0 transform translate-y-16 transition-all duration-700 delay-200">
                <div class="card-inner">
                    <div class="card-front bg-gradient-to-br from-discord-darker to-discord-background rounded-xl p-6 h-full flex flex-col items-center justify-center text-center shadow-xl">
                        <div class="icon-container mb-4 w-16 h-16 bg-discord-green bg-opacity-90 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg ring-2 ring-opacity-20 ring-white">
                            <i class="fas fa-headset text-2xl text-white"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-2 text-white">Voice Channels</h3>
                        <p class="text-gray-300">Crystal clear voice chat with friends, no matter where they are.</p>
                    </div>
                    <div class="card-back bg-gradient-to-br from-discord-green to-green-700 rounded-xl p-6 h-full flex flex-col items-center justify-center text-center shadow-xl">
                        <ul class="text-white space-y-2">
                            <li><i class="fas fa-check text-green-300 mr-2"></i> High quality audio</li>
                            <li><i class="fas fa-check text-green-300 mr-2"></i> Noise suppression</li>
                            <li><i class="fas fa-check text-green-300 mr-2"></i> Voice activity detection</li>
                            <li><i class="fas fa-check text-green-300 mr-2"></i> Echo cancellation</li>
                        </ul>
                        <button class="mt-4 bg-white text-discord-green font-bold py-2 px-4 rounded-full hover:bg-opacity-90 transition-all transform hover:scale-105 hover:shadow-lg">
                            Learn More
                        </button>
                    </div>
                </div>
            </div>

            <div class="feature-card opacity-0 transform translate-y-16 transition-all duration-700 delay-300">
                <div class="card-inner">
                    <div class="card-front bg-gradient-to-br from-discord-darker to-discord-background rounded-xl p-6 h-full flex flex-col items-center justify-center text-center shadow-xl">
                        <div class="icon-container mb-4 w-16 h-16 bg-purple-600 bg-opacity-90 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg ring-2 ring-opacity-20 ring-white">
                            <i class="fas fa-video text-2xl text-white"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-2 text-white">Video Chat</h3>
                        <p class="text-gray-300">Face-to-face conversations with crystal clear video quality.</p>
                    </div>
                    <div class="card-back bg-gradient-to-br from-purple-600 to-purple-900 rounded-xl p-6 h-full flex flex-col items-center justify-center text-center shadow-xl">
                        <ul class="text-white space-y-2">
                            <li><i class="fas fa-check text-green-300 mr-2"></i> HD video quality</li>
                            <li><i class="fas fa-check text-green-300 mr-2"></i> Screen sharing</li>
                            <li><i class="fas fa-check text-green-300 mr-2"></i> Background blur</li>
                            <li><i class="fas fa-check text-green-300 mr-2"></i> Low-latency streaming</li>
                        </ul>
                        <button class="mt-4 bg-white text-purple-600 font-bold py-2 px-4 rounded-full hover:bg-opacity-90 transition-all transform hover:scale-105 hover:shadow-lg">
                            Learn More
                        </button>
                    </div>
                </div>
            </div>

            <div class="feature-card opacity-0 transform translate-y-16 transition-all duration-700 delay-400">
                <div class="card-inner">
                    <div class="card-front bg-gradient-to-br from-discord-darker to-discord-background rounded-xl p-6 h-full flex flex-col items-center justify-center text-center shadow-xl">
                        <div class="icon-container mb-4 w-16 h-16 bg-discord-yellow bg-opacity-90 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg ring-2 ring-opacity-20 ring-white">
                            <i class="fas fa-shield-alt text-2xl text-white"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-2 text-white">Security</h3>
                        <p class="text-gray-300">End-to-end encryption and advanced privacy controls.</p>
                    </div>
                    <div class="card-back bg-gradient-to-br from-discord-yellow to-amber-700 rounded-xl p-6 h-full flex flex-col items-center justify-center text-center shadow-xl">
                        <ul class="text-white space-y-2">
                            <li><i class="fas fa-check text-green-300 mr-2"></i> Data encryption</li>
                            <li><i class="fas fa-check text-green-300 mr-2"></i> Two-factor authentication</li>
                            <li><i class="fas fa-check text-green-300 mr-2"></i> Permissions system</li>
                            <li><i class="fas fa-check text-green-300 mr-2"></i> IP protection</li>
                        </ul>
                        <button class="mt-4 bg-white text-discord-yellow font-bold py-2 px-4 rounded-full hover:bg-opacity-90 transition-all transform hover:scale-105 hover:shadow-lg">
                            Learn More
                        </button>
                    </div>
                </div>
            </div>

            <div class="feature-card opacity-0 transform translate-y-16 transition-all duration-700 delay-500">
                <div class="card-inner">
                    <div class="card-front bg-gradient-to-br from-discord-darker to-discord-background rounded-xl p-6 h-full flex flex-col items-center justify-center text-center shadow-xl">
                        <div class="icon-container mb-4 w-16 h-16 bg-discord-red bg-opacity-90 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg ring-2 ring-opacity-20 ring-white">
                            <i class="fas fa-puzzle-piece text-2xl text-white"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-2 text-white">Integrations</h3>
                        <p class="text-gray-300">Connect with your favorite apps and services seamlessly.</p>
                    </div>
                    <div class="card-back bg-gradient-to-br from-discord-red to-red-800 rounded-xl p-6 h-full flex flex-col items-center justify-center text-center shadow-xl">
                        <ul class="text-white space-y-2">
                            <li><i class="fas fa-check text-green-300 mr-2"></i> Bot support</li>
                            <li><i class="fas fa-check text-green-300 mr-2"></i> API access</li>
                            <li><i class="fas fa-check text-green-300 mr-2"></i> Webhooks</li>
                            <li><i class="fas fa-check text-green-300 mr-2"></i> Third-party plugins</li>
                        </ul>
                        <button class="mt-4 bg-white text-discord-red font-bold py-2 px-4 rounded-full hover:bg-opacity-90 transition-all transform hover:scale-105 hover:shadow-lg">
                            Learn More
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="absolute inset-0 bg-gradient-to-b from-transparent to-discord-darker z-0"></div>
</section> 