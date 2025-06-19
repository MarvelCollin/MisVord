<?php
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<section id="featured-cards" class="featured-cards-section scroll-section min-h-screen relative flex items-center justify-center overflow-hidden py-16">
    <!-- Floating orbs for ambient effect -->
    <div class="floating-orb"></div>
    <div class="floating-orb"></div>
    <div class="floating-orb"></div>
    <div class="floating-orb"></div>
    
    <div class="container mx-auto px-4 relative z-10">
        <div class="text-center mb-16">
            <h2 class="text-5xl md:text-7xl font-bold text-white mb-10 opacity-0 transform translate-y-10 transition-all duration-700 section-title relative">
                Everything You Need
            </h2>
            <p class="text-lg md:text-xl text-white/70 max-w-2xl mx-auto opacity-0 transform translate-y-5 transition-all duration-700 section-subtitle">
                Discover powerful features designed to bring communities together
            </p>
        </div>
        
        <div class="cards-container relative h-[500px] perspective-1000 flex items-center justify-center">
            <div class="card-wrapper absolute inset-0 flex items-center justify-center">
                <!-- Card 1 -->
                <div class="feature-card" data-card-index="0" data-tooltip="Connect through text messages, share files, and build conversations with your community">
                    <div class="card-inner">
                        <!-- Front face - Icon only -->
                        <div class="card-face card-front">
                            <div class="card-icon">
                                <i class="fa fa-comments text-3xl"></i>
                            </div>
                            <h3 class="icon-label">Text Chat</h3>
                        </div>
                        
                        <!-- Back face - Description -->
                        <div class="card-face card-back">
                            <h3 class="card-title">Text Chat</h3>
                            <div class="card-divider"></div>
                            <p class="card-description">
                                Send messages, share media, and keep the conversation flowing with friends and communities.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Card 2 -->
                <div class="feature-card" data-card-index="1" data-tooltip="Join voice channels for real-time conversations and crystal-clear audio communication">
                    <div class="card-inner">
                        <!-- Front face - Icon only -->
                        <div class="card-face card-front">
                            <div class="card-icon">
                                <i class="fa fa-headset text-3xl"></i>
                            </div>
                            <h3 class="icon-label">Voice Channels</h3>
                        </div>
                        
                        <!-- Back face - Description -->
                        <div class="card-face card-back">
                            <h3 class="card-title">Voice Channels</h3>
                            <div class="card-divider"></div>
                            <p class="card-description">
                                Hang out with crystal-clear voice chat that makes you feel like you're in the same room.
                            </p>
                        </div>
                    </div>
                </div>                <!-- Card 3 (Center) -->
                <div class="feature-card" data-card-index="2" data-tooltip="Discover and join vibrant communities that share your interests and passions">
                    <div class="card-inner">
                        <!-- Front face - Icon only -->
                        <div class="card-face card-front">
                            <div class="card-icon">
                                <i class="fa fa-users text-3xl"></i>
                            </div>
                            <h3 class="icon-label">Communities</h3>
                        </div>
                        
                        <!-- Back face - Description -->
                        <div class="card-face card-back">
                            <h3 class="card-title">Communities</h3>
                            <div class="card-divider"></div>
                            <p class="card-description">
                                Join thousands of communities centered around your interests, passions and hobbies.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Card 4 -->
                <div class="feature-card" data-card-index="3" data-tooltip="Enterprise-grade security with end-to-end encryption and privacy protection">
                    <div class="card-inner">
                        <!-- Front face - Icon only -->
                        <div class="card-face card-front">
                            <div class="card-icon">
                                <i class="fa fa-shield-alt text-3xl"></i>
                            </div>
                            <h3 class="icon-label">Security</h3>
                        </div>
                        
                        <!-- Back face - Description -->
                        <div class="card-face card-back">
                            <h3 class="card-title">Security</h3>
                            <div class="card-divider"></div>
                            <p class="card-description">
                                Advanced security features keep your conversations private and your data protected.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Card 5 -->
                <div class="feature-card" data-card-index="4" data-tooltip="High-quality video calls and screen sharing for seamless collaboration">
                    <div class="card-inner">
                        <!-- Front face - Icon only -->
                        <div class="card-face card-front">
                            <div class="card-icon">
                                <i class="fa fa-video text-3xl"></i>
                            </div>
                            <h3 class="icon-label">Video Chat</h3>
                        </div>
                        
                        <!-- Back face - Description -->
                        <div class="card-face card-back">
                            <h3 class="card-title">Video Chat</h3>
                            <div class="card-divider"></div>
                            <p class="card-description">
                                Share your screen, go live, or just chat face-to-face with friends like you're together.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Background elements -->
    <div class="absolute inset-0 z-0 bg-gradient-to-b from-gray-900 to-purple-900 opacity-80"></div>
      <!-- Enhanced gradient circles in the background -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/10 blur-3xl z-0 transform -translate-x-1/2 -translate-y-1/2 floating-orb-1"></div>
    <div class="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-gradient-to-tr from-indigo-500/15 to-purple-500/5 blur-3xl z-0 floating-orb-2"></div>
    <div class="absolute top-2/3 right-1/3 w-64 h-64 rounded-full bg-gradient-to-tr from-purple-500/15 to-pink-500/10 blur-3xl z-0 floating-orb-3"></div>
    <div class="absolute top-1/2 left-1/6 w-72 h-72 rounded-full bg-gradient-to-tr from-green-500/12 to-blue-500/8 blur-3xl z-0 floating-orb-1"></div>
    <div class="absolute bottom-1/4 left-2/3 w-88 h-88 rounded-full bg-gradient-to-tr from-red-500/10 to-orange-500/6 blur-3xl z-0 floating-orb-2"></div>
      <!-- Subtle pattern overlay -->
    <div class="absolute inset-0 z-0 opacity-10" style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zm20.97 0l9.315 9.314-1.414 1.414L34.828 0h2.83zM22.344 0L13.03 9.314l1.414 1.414L25.172 0h-2.83zM32 0l12.142 12.142-1.414 1.414L30 .828 17.272 13.556l-1.414-1.414L28 0h4zM.284 0l28 28-1.414 1.414L0 2.544V0h.284zM0 5.373l25.456 25.455-1.414 1.415L0 8.2V5.374zm0 5.656l22.627 22.627-1.414 1.414L0 13.86v-2.83zm0 5.656l19.8 19.8-1.415 1.413L0 19.514v-2.83zm0 5.657l16.97 16.97-1.414 1.415L0 25.172v-2.83zM0 28l14.142 14.142-1.414 1.414L0 30.828V28zm0 5.657L11.314 44.97 9.9 46.386l-9.9-9.9v-2.828zm0 5.657L8.485 47.8 7.07 49.214 0 42.143v-2.83zm0 5.657l5.657 5.657-1.414 1.415L0 47.8v-2.83zm0 5.657l2.828 2.83-1.414 1.413L0 53.456v-2.83zM54.627 60L30 35.373 5.373 60H8.2L30 38.2 51.8 60h2.827zm-5.656 0L30 41.03 11.03 60h2.828L30 43.858 46.142 60h2.83zm-5.656 0L30 46.686 16.686 60h2.83L30 49.515 40.485 60h2.83zm-5.657 0L30 52.343 22.344 60h2.83L30 55.172 34.828 60h2.83zM32 60l-2-2-2 2h4zM59.716 0l-28 28 1.414 1.414L60 2.544V0h-.284zM60 5.373L34.544 30.828l1.414 1.415L60 8.2V5.374zm0 5.656L37.373 33.656l1.414 1.414L60 13.86v-2.83zm0 5.656l-19.8 19.8 1.415 1.413L60 19.514v-2.83zm0 5.657l-16.97 16.97 1.414 1.415L60 25.172v-2.83zM60 28L45.858 42.142l1.414 1.414L60 30.828V28zm0 5.657L48.686 44.97l1.415 1.415 9.9-9.9v-2.828zm0 5.657L51.515 47.8l1.414 1.415 7.07-7.07v-2.83zm0 5.657l-5.657 5.657 1.414 1.415L60 47.8v-2.83zm0 5.657l-2.828 2.83 1.414 1.413L60 53.456v-2.83zM39.9 16.385l1.414-1.414L30 3.658 18.686 14.97l1.415 1.415 9.9-9.9 9.9 9.9zm-2.83 2.828l1.415-1.414L30 9.313 21.515 17.8l1.414 1.413L30 12.143l7.07 7.07zm-2.827 2.83l1.414-1.416L30 14.97l-5.657 5.657 1.414 1.415L30 17.8l4.242 4.242zm-2.83 2.827l1.415-1.414L30 20.626l-2.828 2.83 1.414 1.414L30 23.456l1.414 1.414zM56.87 59.414L58.284 58 30 29.716 1.716 58l1.414 1.414L30 32.544l26.87 26.87z\' fill=\'%23ffffff\' fill-opacity=\'0.2\' fill-rule=\'evenodd\'/%3E%3C/svg%3E')"></div>
      <!-- Modern Tooltip -->
    <div id="modern-tooltip" class="modern-tooltip">
        <div class="modern-tooltip-content"></div>
        <div class="modern-tooltip-arrow"></div>
    </div>
</section>