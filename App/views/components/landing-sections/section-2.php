<?php

if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<section class="py-20 px-6 relative overflow-hidden bg-gradient-to-b from-[#36393f] to-[#2f3136] feature-section-hangout">

    <div class="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div class="wave-bg wave-1"></div>
        <div class="wave-bg wave-2"></div>
        <div class="wave-bg wave-3"></div>
    </div>

    <div class="container mx-auto relative z-10">

        <div class="text-center mb-16">
            <h2 class="text-4xl md:text-6xl font-bold mb-6 text-white section-title animated-fade-in">
                <span class="bg-gradient-to-r from-discord-pink to-discord-blue bg-clip-text text-transparent">
                    Where hanging out is easy
                </span>
            </h2>
            <p class="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto animated-fade-in">
                Drop in, hang out, and talk with your friends without complicated scheduling
            </p>
        </div>

        <div class="timeline-container my-24 relative">

            <div class="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-discord-blue to-discord-pink transform md:translate-x-[-50%] z-0"></div>

            <div class="timeline-items space-y-32">

                <div class="timeline-item flex flex-col md:flex-row">
                    <div class="timeline-dot absolute left-[-10px] md:left-1/2 top-12 w-5 h-5 rounded-full bg-discord-blue shadow-glow-blue transform md:translate-x-[-50%] z-10"></div>

                    <div class="md:w-1/2 pr-0 md:pr-16 timeline-content animated-slide-in-left">
                        <div class="glass-panel p-6 md:p-8 rounded-xl">
                            <h3 class="text-2xl font-bold mb-4 text-white hover:text-discord-blue transition-colors">Join Voice Channels</h3>
                            <p class="text-gray-300">
                                Grab a seat in a voice channel when you're free. Friends in your server can see you're around and instantly pop in to talk without having to call.
                            </p>
                        </div>
                    </div>

                    <div class="md:w-1/2 pl-0 md:pl-16 mt-6 md:mt-0 timeline-visual animated-slide-in-right">
                        <div class="glass-panel p-2 rounded-xl overflow-hidden hover-float">
                            <img src="<?php echo asset('/assets/landing-page/actor-sit.webp'); ?>" alt="Voice channels" class="w-full h-auto rounded-lg">

                            <div class="audio-wave-overlay">
                                <div class="audio-wave flex items-center justify-center h-8 px-4">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="timeline-item flex flex-col md:flex-row-reverse">
                    <div class="timeline-dot absolute left-[-10px] md:left-1/2 top-12 w-5 h-5 rounded-full bg-discord-pink shadow-glow-pink transform md:translate-x-[-50%] z-10"></div>

                    <div class="md:w-1/2 pl-0 md:pl-16 timeline-content animated-slide-in-right">
                        <div class="glass-panel p-6 md:p-8 rounded-xl">
                            <h3 class="text-2xl font-bold mb-4 text-white hover:text-discord-pink transition-colors">Share Your Screen</h3>
                            <p class="text-gray-300">
                                Stream your gameplay, share your desktop, or collaborate on projects with high-quality, low-latency screen sharing.
                            </p>
                        </div>
                    </div>

                    <div class="md:w-1/2 pr-0 md:pr-16 mt-6 md:mt-0 timeline-visual animated-slide-in-left">
                        <div class="glass-panel p-2 rounded-xl overflow-hidden hover-float">
                            <img src="<?php echo asset('/assets/landing-page/computer.webp'); ?>" alt="Screen share" class="w-full h-auto rounded-lg">

                            <div class="screen-overlay">
                                <div class="screen-controls flex justify-center space-x-3 p-2">
                                    <div class="control-btn bg-discord-dark hover:bg-discord-pink transition-colors"></div>
                                    <div class="control-btn bg-discord-dark hover:bg-discord-blue transition-colors"></div>
                                    <div class="control-btn bg-discord-dark hover:bg-discord-green transition-colors"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="timeline-item flex flex-col md:flex-row">
                    <div class="timeline-dot absolute left-[-10px] md:left-1/2 top-12 w-5 h-5 rounded-full bg-discord-green shadow-glow-green transform md:translate-x-[-50%] z-10"></div>

                    <div class="md:w-1/2 pr-0 md:pr-16 timeline-content animated-slide-in-left">
                        <div class="glass-panel p-6 md:p-8 rounded-xl">
                            <h3 class="text-2xl font-bold mb-4 text-white hover:text-discord-green transition-colors">Video Chat</h3>
                            <p class="text-gray-300">
                                Turn on your camera to wave hello, watch friends stream their games, or gather up for a virtual hangout.
                            </p>
                        </div>
                    </div>

                    <div class="md:w-1/2 pl-0 md:pl-16 mt-6 md:mt-0 timeline-visual animated-slide-in-right">
                        <div class="glass-panel p-2 rounded-xl overflow-hidden hover-float">
                            <img src="<?php echo asset('/assets/landing-page/wumpus_happy.webp'); ?>" alt="Video chat" class="w-full h-auto rounded-lg">

                            <div class="video-chat-overlay">
                                <div class="video-frame absolute inset-0 border-4 border-discord-green rounded-lg opacity-0 transition-opacity duration-300"></div>
                                <div class="video-controls absolute bottom-2 right-2 bg-black bg-opacity-50 rounded-full p-2">
                                    <div class="w-3 h-3 bg-discord-green rounded-full pulse-animation"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</section>