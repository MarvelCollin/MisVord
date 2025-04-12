<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<!-- Feature section 2: Where hanging out is easy - Horizontal Timeline Layout -->
<section class="py-20 px-6 relative overflow-hidden bg-gradient-to-b from-[#36393f] to-[#2f3136] feature-section-hangout">
    <!-- Background animated waves -->
    <div class="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div class="wave-bg wave-1"></div>
        <div class="wave-bg wave-2"></div>
        <div class="wave-bg wave-3"></div>
    </div>

    <div class="container mx-auto relative z-10">
        <!-- Section heading with nice animation -->
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
        
        <!-- Timeline container -->
        <div class="timeline-container my-24 relative">
            <!-- Vertical timeline line -->
            <div class="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-discord-blue to-discord-pink transform md:translate-x-[-50%] z-0"></div>
            
            <!-- Timeline items -->
            <div class="timeline-items space-y-32">
                <!-- Item 1 -->
                <div class="timeline-item flex flex-col md:flex-row">
                    <div class="timeline-dot absolute left-[-10px] md:left-1/2 top-12 w-5 h-5 rounded-full bg-discord-blue shadow-glow-blue transform md:translate-x-[-50%] z-10"></div>
                    
                    <!-- Content for larger screens -->
                    <div class="md:w-1/2 pr-0 md:pr-16 timeline-content animated-slide-in-left">
                        <div class="glass-panel p-6 md:p-8 rounded-xl">
                            <h3 class="text-2xl font-bold mb-4 text-white hover:text-discord-blue transition-colors">Join Voice Channels</h3>
                            <p class="text-gray-300">
                                Grab a seat in a voice channel when you're free. Friends in your server can see you're around and instantly pop in to talk without having to call.
                            </p>
                        </div>
                    </div>
                    
                    <!-- Image for larger screens -->
                    <div class="md:w-1/2 pl-0 md:pl-16 mt-6 md:mt-0 timeline-visual animated-slide-in-right">
                        <div class="glass-panel p-2 rounded-xl overflow-hidden hover-float">
                            <img src="<?php echo asset('/landing-page/actor-sit.webp'); ?>" alt="Voice channels" class="w-full h-auto rounded-lg">
                            
                            <!-- Audio wave indicator -->
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
                
                <!-- Item 2 -->
                <div class="timeline-item flex flex-col md:flex-row-reverse">
                    <div class="timeline-dot absolute left-[-10px] md:left-1/2 top-12 w-5 h-5 rounded-full bg-discord-pink shadow-glow-pink transform md:translate-x-[-50%] z-10"></div>
                    
                    <!-- Content for larger screens -->
                    <div class="md:w-1/2 pl-0 md:pl-16 timeline-content animated-slide-in-right">
                        <div class="glass-panel p-6 md:p-8 rounded-xl">
                            <h3 class="text-2xl font-bold mb-4 text-white hover:text-discord-pink transition-colors">Share Your Screen</h3>
                            <p class="text-gray-300">
                                Stream your gameplay, share your desktop, or collaborate on projects with high-quality, low-latency screen sharing.
                            </p>
                        </div>
                    </div>
                    
                    <!-- Image for larger screens -->
                    <div class="md:w-1/2 pr-0 md:pr-16 mt-6 md:mt-0 timeline-visual animated-slide-in-left">
                        <div class="glass-panel p-2 rounded-xl overflow-hidden hover-float">
                            <img src="<?php echo asset('/landing-page/computer.webp'); ?>" alt="Screen share" class="w-full h-auto rounded-lg">
                            
                            <!-- Screen sharing overlay -->
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
                
                <!-- Item 3 -->
                <div class="timeline-item flex flex-col md:flex-row">
                    <div class="timeline-dot absolute left-[-10px] md:left-1/2 top-12 w-5 h-5 rounded-full bg-discord-green shadow-glow-green transform md:translate-x-[-50%] z-10"></div>
                    
                    <!-- Content for larger screens -->
                    <div class="md:w-1/2 pr-0 md:pr-16 timeline-content animated-slide-in-left">
                        <div class="glass-panel p-6 md:p-8 rounded-xl">
                            <h3 class="text-2xl font-bold mb-4 text-white hover:text-discord-green transition-colors">Video Chat</h3>
                            <p class="text-gray-300">
                                Turn on your camera to wave hello, watch friends stream their games, or gather up for a virtual hangout.
                            </p>
                        </div>
                    </div>
                    
                    <!-- Image for larger screens -->
                    <div class="md:w-1/2 pl-0 md:pl-16 mt-6 md:mt-0 timeline-visual animated-slide-in-right">
                        <div class="glass-panel p-2 rounded-xl overflow-hidden hover-float">
                            <img src="<?php echo asset('/landing-page/wumpus_happy.webp'); ?>" alt="Video chat" class="w-full h-auto rounded-lg">
                            
                            <!-- Video chat overlay -->
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
        
        <!-- Server demo UI section -->
        <div class="server-demo mt-32 max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold text-center mb-10">
                <span class="bg-gradient-to-r from-discord-blue to-discord-green bg-clip-text text-transparent">
                    Experience it yourself
                </span>
            </h2>
            
            <div class="demo-ui flex flex-col md:flex-row bg-discord-dark rounded-xl overflow-hidden shadow-2xl">
                <!-- Server sidebar -->
                <div class="server-sidebar bg-[#202225] w-20 py-4 flex flex-col items-center space-y-4">
                    <div class="server-icon w-12 h-12 rounded-full bg-discord-blue flex items-center justify-center text-white font-bold">
                        M
                    </div>
                    <div class="server-divider w-8 h-0.5 bg-gray-700"></div>
                    <div class="server-icon w-12 h-12 rounded-2xl bg-[#36393f] hover:bg-discord-green hover:rounded-xl transition-all duration-300 flex items-center justify-center text-white font-bold">
                        G
                    </div>
                    <div class="server-icon w-12 h-12 rounded-2xl bg-[#36393f] hover:bg-discord-pink hover:rounded-xl transition-all duration-300 flex items-center justify-center text-white font-bold">
                        D
                    </div>
                    <div class="server-icon w-12 h-12 rounded-2xl bg-[#36393f] hover:bg-discord-blue hover:rounded-xl transition-all duration-300 flex items-center justify-center text-green-500 font-bold">
                        +
                    </div>
                </div>
                
                <!-- Channel sidebar -->
                <div class="channel-sidebar bg-[#2f3136] w-60 py-4 px-3 hidden md:block">
                    <div class="channel-header border-b border-gray-700 pb-3 mb-4">
                        <h3 class="text-white font-semibold">MiscVord Server</h3>
                    </div>
                    
                    <div class="channel-category text-xs text-gray-400 font-semibold mt-4 mb-1">TEXT CHANNELS</div>
                    <div class="channel-item flex items-center py-1 px-2 text-gray-400 hover:bg-gray-700 hover:text-gray-200 rounded transition-colors">
                        # welcome
                    </div>
                    <div class="channel-item flex items-center py-1 px-2 text-gray-400 hover:bg-gray-700 hover:text-gray-200 rounded transition-colors">
                        # announcements
                    </div>
                    <div class="channel-item flex items-center py-1 px-2 text-gray-400 hover:bg-gray-700 hover:text-gray-200 rounded transition-colors">
                        # general
                    </div>
                    
                    <div class="channel-category text-xs text-gray-400 font-semibold mt-4 mb-1">VOICE CHANNELS</div>
                    <div class="channel-item flex items-center py-1 px-2 text-gray-200 bg-gray-700 bg-opacity-30 rounded transition-colors">
                        <div class="flex flex-col w-full">
                            <div class="flex items-center">
                                <svg class="w-5 h-5 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2s2-.9 2-2V4c0-1.1-.9-2-2-2z"></path>
                                    <path d="M19 10h-2c0 2.2-1.8 4-4 4s-4-1.8-4-4H7c0 3.3 2.7 6 6 6s6-2.7 6-6z"></path>
                                    <path d="M7 19h10v2H7z"></path>
                                </svg>
                                <span>General Voice</span>
                            </div>
                            <div class="ml-6 mt-1">
                                <div class="flex items-center text-xs text-gray-400">
                                    <div class="w-2 h-2 bg-discord-green rounded-full mr-2"></div>
                                    <span>User 1</span>
                                </div>
                                <div class="flex items-center text-xs text-gray-400">
                                    <div class="w-2 h-2 bg-discord-green rounded-full mr-2"></div>
                                    <span>User 2</span>
                                </div>
                                <div class="flex items-center text-xs text-discord-green">
                                    <div class="w-2 h-2 bg-discord-green rounded-full mr-2 pulse-animation"></div>
                                    <span>You</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="channel-item flex items-center py-1 px-2 text-gray-400 hover:bg-gray-700 hover:text-gray-200 rounded transition-colors">
                        <svg class="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2s2-.9 2-2V4c0-1.1-.9-2-2-2z"></path>
                            <path d="M19 10h-2c0 2.2-1.8 4-4 4s-4-1.8-4-4H7c0 3.3 2.7 6 6 6s6-2.7 6-6z"></path>
                            <path d="M7 19h10v2H7z"></path>
                        </svg>
                        <span>Gaming</span>
                    </div>
                </div>
                
                <!-- Chat area -->
                <div class="chat-area bg-[#36393f] flex-1 flex flex-col">
                    <div class="chat-header border-b border-gray-700 py-3 px-4 flex justify-between items-center">
                        <div class="flex items-center">
                            <svg class="w-5 h-5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2s2-.9 2-2V4c0-1.1-.9-2-2-2z"></path>
                                <path d="M19 10h-2c0 2.2-1.8 4-4 4s-4-1.8-4-4H7c0 3.3 2.7 6 6 6s6-2.7 6-6z"></path>
                                <path d="M7 19h10v2H7z"></path>
                            </svg>
                            <span class="font-semibold">General Voice</span>
                        </div>
                        <div class="flex space-x-2">
                            <button class="p-1.5 rounded-full hover:bg-gray-700 transition-colors">
                                <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"></path>
                                </svg>
                            </button>
                            <button class="p-1.5 rounded-full hover:bg-gray-700 transition-colors">
                                <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex-1 p-4">
                        <div class="voice-indicator bg-discord-dark bg-opacity-40 rounded-md p-3 flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="w-3 h-3 bg-discord-green rounded-full pulse-animation mr-3"></div>
                                <span class="text-sm text-gray-300">Voice Connected</span>
                            </div>
                            <div class="flex space-x-2">
                                <button class="p-1.5 rounded-full bg-discord-dark hover:bg-discord-blue transition-colors">
                                    <svg class="w-5 h-5 text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2s2-.9 2-2V4c0-1.1-.9-2-2-2z"></path>
                                        <path d="M19 10h-2c0 2.2-1.8 4-4 4s-4-1.8-4-4H7c0 3.3 2.7 6 6 6s6-2.7 6-6z"></path>
                                        <path d="M7 19h10v2H7z"></path>
                                    </svg>
                                </button>
                                <button class="p-1.5 rounded-full bg-discord-dark hover:bg-discord-blue transition-colors">
                                    <svg class="w-5 h-5 text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 3a9 9 0 00-9 9v7a3 3 0 003 3h12a3 3 0 003-3v-7a9 9 0 00-9-9zm0 2a7 7 0 017 7v7a1 1 0 01-1 1h-4v-2h-4v2H6a1 1 0 01-1-1v-7a7 7 0 017-7z"></path>
                                    </svg>
                                </button>
                                <button class="p-1.5 rounded-full bg-discord-dark hover:bg-discord-blue transition-colors">
                                    <svg class="w-5 h-5 text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.45.17-.49.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Voice participants -->
                        <div class="voice-participants mt-4 space-y-3">
                            <div class="participant flex items-center bg-discord-dark bg-opacity-20 rounded-md p-3">
                                <div class="w-9 h-9 bg-discord-blue rounded-full flex items-center justify-center text-white font-semibold mr-3">U1</div>
                                <div class="flex-1 text-gray-300">User 1</div>
                                <div class="audio-indicator flex space-x-0.5">
                                    <span class="w-0.5 h-3 bg-gray-500 rounded"></span>
                                    <span class="w-0.5 h-4 bg-gray-500 rounded"></span>
                                    <span class="w-0.5 h-2 bg-gray-500 rounded"></span>
                                    <span class="w-0.5 h-3 bg-gray-500 rounded"></span>
                                </div>
                            </div>
                            
                            <div class="participant flex items-center bg-discord-dark bg-opacity-20 rounded-md p-3">
                                <div class="w-9 h-9 bg-discord-pink rounded-full flex items-center justify-center text-white font-semibold mr-3">U2</div>
                                <div class="flex-1 text-gray-300">User 2</div>
                                <div class="audio-indicator flex space-x-0.5">
                                    <span class="w-0.5 h-3 bg-gray-500 rounded"></span>
                                    <span class="w-0.5 h-4 bg-gray-500 rounded"></span>
                                    <span class="w-0.5 h-2 bg-gray-500 rounded"></span>
                                    <span class="w-0.5 h-3 bg-gray-500 rounded"></span>
                                </div>
                            </div>
                            
                            <div class="participant flex items-center bg-discord-dark bg-opacity-30 rounded-md p-3 border border-discord-green border-opacity-50">
                                <div class="w-9 h-9 bg-discord-green rounded-full flex items-center justify-center text-white font-semibold mr-3">Y</div>
                                <div class="flex-1 text-discord-green font-medium">You</div>
                                <div class="audio-indicator flex space-x-0.5">
                                    <span class="w-0.5 h-3 bg-discord-green rounded speaking"></span>
                                    <span class="w-0.5 h-4 bg-discord-green rounded speaking speaking-delay-1"></span>
                                    <span class="w-0.5 h-2 bg-discord-green rounded speaking speaking-delay-2"></span>
                                    <span class="w-0.5 h-3 bg-discord-green rounded speaking speaking-delay-3"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<style>
/* Custom styles for section-2 */
.feature-section-hangout {
    min-height: 100vh;
}

/* Wave background animation */
.wave-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.05;
    background-size: 400% 400%;
}

.wave-1 {
    background-image: linear-gradient(45deg, #5865F2, #EB459E);
    animation: wave-animation 25s ease infinite;
}

.wave-2 {
    background-image: linear-gradient(-45deg, #57F287, #5865F2);
    animation: wave-animation 30s ease infinite;
    animation-delay: -5s;
}

.wave-3 {
    background-image: linear-gradient(135deg, #EB459E, #FEE75C);
    animation: wave-animation 35s ease infinite;
    animation-delay: -10s;
}

@keyframes wave-animation {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* Glass panel styling */
.glass-panel {
    background: rgba(32, 34, 37, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.glass-panel:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
}

/* Timeline styling */
.timeline-dot {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.timeline-item:hover .timeline-dot {
    transform: scale(1.5) translateX(-50%);
}

/* Shadow glow effects */
.shadow-glow-blue {
    box-shadow: 0 0 15px rgba(88, 101, 242, 0.7);
}

.shadow-glow-pink {
    box-shadow: 0 0 15px rgba(235, 69, 158, 0.7);
}

.shadow-glow-green {
    box-shadow: 0 0 15px rgba(87, 242, 135, 0.7);
}

/* Hover float effect */
.hover-float {
    transition: transform 0.3s ease;
}

.hover-float:hover {
    transform: translateY(-7px);
}

/* Audio wave effects */
.audio-wave-overlay {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
    padding: 20px 10px 5px 10px;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.glass-panel:hover .audio-wave-overlay {
    opacity: 1;
}

.audio-wave {
    display: flex;
    justify-content: center;
    align-items: center;
}

.audio-wave span {
    width: 3px;
    height: 10px;
    margin: 0 2px;
    background-color: #5865F2;
    border-radius: 3px;
    animation: audio-wave 0.8s ease infinite alternate;
}

.audio-wave span:nth-child(2) {
    animation-delay: 0.2s;
}

.audio-wave span:nth-child(3) {
    animation-delay: 0.4s;
}

.audio-wave span:nth-child(4) {
    animation-delay: 0.6s;
}

.audio-wave span:nth-child(5) {
    animation-delay: 0.8s;
}

@keyframes audio-wave {
    0% { height: 3px; }
    100% { height: 15px; }
}

/* Screen overlay effects */
.screen-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: flex-end;
    padding-bottom: 10px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.glass-panel:hover .screen-overlay {
    opacity: 1;
}

.control-btn {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    transition: transform 0.15s ease, background-color 0.15s ease;
}

.control-btn:hover {
    transform: scale(1.2);
}

/* Video chat overlay */
.video-chat-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.glass-panel:hover .video-chat-overlay {
    opacity: 1;
}

.pulse-animation {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(87, 242, 135, 0.7);
    }
    70% {
        box-shadow: 0 0 0 10px rgba(87, 242, 135, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(87, 242, 135, 0);
    }
}

/* Voice speaking indicators */
.audio-indicator .speaking {
    animation: audio-speaking 0.8s ease-in-out infinite alternate;
}

.speaking-delay-1 {
    animation-delay: 0.2s !important;
}

.speaking-delay-2 {
    animation-delay: 0.4s !important;
}

.speaking-delay-3 {
    animation-delay: 0.6s !important;
}

@keyframes audio-speaking {
    0% { height: 2px; }
    100% { height: 15px; }
}

/* Responsive styling */
@media (max-width: 768px) {
    .timeline-dot {
        top: 0;
    }
    
    .timeline-content, .timeline-visual {
        margin-left: 15px;
    }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations using Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe elements with animation classes
    document.querySelectorAll('.animated-fade-in, .animated-slide-in-left, .animated-slide-in-right').forEach(element => {
        observer.observe(element);
    });
    
    // Audio wave hover effect
    const timelineVisuals = document.querySelectorAll('.timeline-visual');
    timelineVisuals.forEach(visual => {
        const overlayElement = visual.querySelector('.audio-wave-overlay, .screen-overlay, .video-chat-overlay');
        if (overlayElement) {
            visual.addEventListener('mouseenter', () => {
                overlayElement.style.opacity = '1';
            });
            
            visual.addEventListener('mouseleave', () => {
                overlayElement.style.opacity = '0';
            });
        }
    });
    
    // Simulate voice activity for the demo
    function toggleSpeakingAnimation() {
        const audioIndicators = document.querySelectorAll('.audio-indicator');
        audioIndicators.forEach(indicator => {
            // Toggle between active and inactive state randomly
            if (Math.random() > 0.7) {
                const spans = indicator.querySelectorAll('span');
                spans.forEach(span => {
                    if (Math.random() > 0.5) {
                        span.classList.toggle('speaking');
                    }
                });
            }
        });
    }
    
    // Start the speaking simulation
    setInterval(toggleSpeakingAnimation, 2000);
});
</script>