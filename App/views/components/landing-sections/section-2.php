<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(dirname(__DIR__))) . '/config/helpers.php';
}
?>

<!-- Feature section 2: Where hanging out is easy - Horizontal Timeline Layout -->
<section class="feature-section-2 py-20 px-6 relative overflow-hidden">
    <!-- Background gradient wave effect -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-wave">
        <!-- Animated wave patterns -->
        <div class="wave wave1"></div>
        <div class="wave wave2"></div>
        <div class="wave wave3"></div>
    </div>

    <div class="container mx-auto relative z-10">
        <!-- Section Heading with Split Text Animation -->
        <div class="text-center mb-12 split-text-container">
            <h2 class="text-4xl md:text-6xl font-bold mb-6 gradient-text-purple section-title-2">Where hanging out is easy</h2>
            <p class="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto split-text">
                Drop in, hang out, and talk with your friends without complicated scheduling
            </p>
        </div>
        
        <!-- Horizontal Timeline Layout -->
        <div class="timeline-container mt-20">
            <!-- Timeline Track -->
            <div class="timeline-track"></div>
            
            <!-- Timeline Nodes -->
            <div class="timeline-items">
                <!-- Item 1 -->
                <div class="timeline-item" data-step="1">
                    <div class="timeline-node"></div>
                    <div class="timeline-content left">
                        <h3 class="text-2xl font-bold mb-4 glitch-hover">Join Voice Channels</h3>
                        <p class="text-gray-300">Grab a seat in a voice channel when you're free. Friends in your server can see you're around and instantly pop in to talk without having to call.</p>
                    </div>
                    <div class="timeline-visual right">
                        <div class="visual-container">
                            <img src="<?php echo asset('/landing-page/actor-sit.webp'); ?>" alt="Voice channels" class="timeline-image">
                            
                            <!-- Audio wave animation overlay -->
                            <div class="audio-wave-container">
                                <div class="audio-wave">
                                    <span></span><span></span><span></span><span></span><span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Item 2 -->
                <div class="timeline-item" data-step="2">
                    <div class="timeline-node"></div>
                    <div class="timeline-content right">
                        <h3 class="text-2xl font-bold mb-4 glitch-hover">Share Your Screen</h3>
                        <p class="text-gray-300">Stream your gameplay, share your desktop, or collaborate on projects with high-quality, low-latency screen sharing.</p>
                    </div>
                    <div class="timeline-visual left">
                        <div class="visual-container">
                            <img src="<?php echo asset('/landing-page/computer.webp'); ?>" alt="Screen share" class="timeline-image">
                            
                            <!-- Screen glitch effect overlay -->
                            <div class="screen-glitch"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Item 3 -->
                <div class="timeline-item" data-step="3">
                    <div class="timeline-node"></div>
                    <div class="timeline-content left">
                        <h3 class="text-2xl font-bold mb-4 glitch-hover">Video Chat</h3>
                        <p class="text-gray-300">Turn on your camera to wave hello, watch friends stream their games, or gather up for a virtual hangout.</p>
                    </div>
                    <div class="timeline-visual right">
                        <div class="visual-container">
                            <img src="<?php echo asset('/landing-page/wumpus_happy.webp'); ?>" alt="Video chat" class="timeline-image">
                            
                            <!-- Video frame overlay -->
                            <div class="video-overlay">
                                <div class="video-controls">
                                    <span class="video-mic"></span>
                                    <span class="video-cam"></span>
                                    <span class="video-screen"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Interactive Demo -->
        <div class="mt-16 demo-container">
            <div class="demo-header text-center mb-8">
                <h3 class="text-2xl font-bold gradient-text-purple">Try it out</h3>
            </div>
            <div class="demo-interface glass-panel">
                <div class="server-list">
                    <div class="server-icon active"><span>M</span></div>
                    <div class="server-icon"><span>G</span></div>
                    <div class="server-icon"><span>D</span></div>
                    <div class="server-icon add-server">+</div>
                </div>
                <div class="channel-area">
                    <div class="channel-header">
                        <h4>MiscVord Server</h4>
                    </div>
                    <div class="channel-list">
                        <div class="channel-category">TEXT CHANNELS</div>
                        <div class="channel-item"># general</div>
                        <div class="channel-item"># announcements</div>
                        <div class="channel-item"># off-topic</div>
                        
                        <div class="channel-category">VOICE CHANNELS</div>
                        <div class="channel-item voice active">
                            <span>🔊 General Voice</span>
                            <div class="voice-users">
                                <div class="voice-user">👤 User 1</div>
                                <div class="voice-user">👤 User 2</div>
                            </div>
                        </div>
                        <div class="channel-item voice">🔊 Gaming</div>
                        <div class="channel-item voice">🔊 Music</div>
                    </div>
                </div>
                <div class="chat-area">
                    <div class="chat-header">
                        <h4>General Voice</h4>
                    </div>
                    <div class="voice-status">
                        <div class="connected-voice">
                            <div class="status-indicator"></div>
                            <span>Voice Connected</span>
                        </div>
                        <div class="voice-controls">
                            <button class="control-btn">🎤</button>
                            <button class="control-btn">🎧</button>
                            <button class="control-btn">⚙️</button>
                        </div>
                    </div>
                    <div class="voice-participants">
                        <div class="participant">
                            <div class="avatar">U1</div>
                            <div class="participant-name">User 1</div>
                            <div class="speaking-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                        <div class="participant">
                            <div class="avatar">U2</div>
                            <div class="participant-name">User 2</div>
                            <div class="speaking-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                        <div class="participant you">
                            <div class="avatar">Y</div>
                            <div class="participant-name">You</div>
                            <div class="speaking-indicator active">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<style>
/* Section 2 specific styles */
.feature-section-2 {
    min-height: 100vh;
}

.gradient-text-purple {
    background: linear-gradient(to right, #EB459E, #5865F2);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    display: inline-block;
}

/* Animated background waves */
.bg-wave {
    background: linear-gradient(135deg, rgba(88, 101, 242, 0.05), rgba(235, 69, 158, 0.05));
}

.wave {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0.3;
    background-size: 400% 400%;
}

.wave1 {
    background-image: linear-gradient(45deg, #5865F2, #EB459E);
    animation: wave 15s ease-in-out infinite;
}

.wave2 {
    background-image: linear-gradient(-45deg, #57F287, #5865F2);
    animation: wave 18s ease-in-out infinite;
    animation-delay: -5s;
}

.wave3 {
    background-image: linear-gradient(135deg, #EB459E, #FEE75C);
    animation: wave 20s ease-in-out infinite;
    animation-delay: -10s;
}

@keyframes wave {
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
}

/* Split text animation */
.split-text-container {
    opacity: 0;
    transform: translateY(30px);
}

.split-text span {
    display: inline-block;
    opacity: 0;
    transform: translateY(20px);
    transition: transform 0.5s ease, opacity 0.5s ease;
}

/* Timeline layout */
.timeline-container {
    position: relative;
    padding: 2rem 0;
    max-width: 1200px;
    margin: 0 auto;
}

.timeline-track {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 4px;
    background: linear-gradient(to bottom, #5865F2, #EB459E);
    transform: translateX(-50%);
    opacity: 0.7;
}

.timeline-items {
    position: relative;
}

.timeline-item {
    position: relative;
    margin-bottom: 120px;
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s ease, transform 0.8s ease;
}

.timeline-node {
    position: absolute;
    left: 50%;
    width: 20px;
    height: 20px;
    background: #5865F2;
    border-radius: 50%;
    transform: translate(-50%, 0);
    box-shadow: 0 0 15px rgba(88, 101, 242, 0.8);
    z-index: 2;
}

.timeline-node::before {
    content: attr(data-step);
    position: absolute;
    width: 40px;
    height: 40px;
    border: 2px solid rgba(88, 101, 242, 0.5);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    top: 50%;
    left: 50%;
    opacity: 0.7;
}

.timeline-content {
    width: 45%;
    padding: 20px;
    background: rgba(30, 30, 40, 0.6);
    backdrop-filter: blur(10px);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.timeline-content.left {
    margin-right: 55%;
}

.timeline-content.right {
    margin-left: 55%;
}

.timeline-visual {
    position: absolute;
    width: 45%;
    top: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.timeline-visual.left {
    left: 0;
}

.timeline-visual.right {
    right: 0;
}

.visual-container {
    position: relative;
    width: 100%;
    max-width: 350px;
    overflow: hidden;
    border-radius: 10px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
}

.timeline-image {
    width: 100%;
    height: auto;
    display: block;
    transition: transform 0.5s ease;
}

.visual-container:hover .timeline-image {
    transform: scale(1.05);
}

/* Audio wave animation */
.audio-wave-container {
    position: absolute;
    bottom: 10px;
    left: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 5px;
    padding: 8px;
}

.audio-wave {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 20px;
}

.audio-wave span {
    display: inline-block;
    width: 3px;
    height: 5px;
    margin: 0 2px;
    background-color: #5865F2;
    border-radius: 1px;
    animation: wave-jump 1.2s ease infinite alternate;
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

@keyframes wave-jump {
    0% {
        height: 5px;
    }
    50% {
        height: 15px;
    }
    100% {
        height: 5px;
    }
}

/* Screen glitch effect */
.screen-glitch {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(88, 101, 242, 0.1);
    opacity: 0;
    pointer-events: none;
}

.visual-container:hover .screen-glitch {
    opacity: 1;
    animation: glitch 0.5s cubic-bezier(.25, .46, .45, .94) both infinite;
}

@keyframes glitch {
    0% {
        transform: translate(0);
    }
    20% {
        transform: translate(-3px, 3px);
    }
    40% {
        transform: translate(-3px, -3px);
    }
    60% {
        transform: translate(3px, 3px);
    }
    80% {
        transform: translate(3px, -3px);
    }
    100% {
        transform: translate(0);
    }
}

/* Video overlay */
.video-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), transparent, rgba(0, 0, 0, 0.3));
    opacity: 0;
    transition: opacity 0.3s ease;
}

.visual-container:hover .video-overlay {
    opacity: 1;
}

.video-controls {
    position: absolute;
    bottom: 10px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 15px;
}

.video-controls span {
    width: 30px;
    height: 30px;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s ease, background-color 0.2s ease;
}

.video-controls span:hover {
    transform: scale(1.1);
    background-color: rgba(88, 101, 242, 0.7);
}

.video-mic::before {
    content: "🎤";
    font-size: 12px;
}

.video-cam::before {
    content: "📷";
    font-size: 12px;
}

.video-screen::before {
    content: "💻";
    font-size: 12px;
}

/* Glitch hover effect for headings */
.glitch-hover {
    position: relative;
    cursor: pointer;
}

.glitch-hover:hover {
    animation: glitch-text 0.4s linear both;
}

@keyframes glitch-text {
    0% {
        text-shadow: 0 0 0 transparent;
    }
    20% {
        text-shadow: 3px 0 0 rgba(235, 69, 158, 0.5), -3px 0 0 rgba(88, 101, 242, 0.5);
    }
    40%, 60% {
        text-shadow: -3px 0 0 rgba(235, 69, 158, 0.5), 3px 0 0 rgba(88, 101, 242, 0.5);
    }
    80%, 100% {
        text-shadow: 0 0 0 transparent;
    }
}

/* Interactive demo interface */
.demo-container {
    margin-top: 80px;
}

.glass-panel {
    background: rgba(30, 30, 40, 0.6);
    backdrop-filter: blur(10px);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    height: 400px;
    display: flex;
}

.demo-interface {
    display: flex;
    max-width: 900px;
    margin: 0 auto;
    height: 400px;
}

.server-list {
    width: 70px;
    background: rgba(20, 20, 30, 0.8);
    padding: 15px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

.server-icon {
    width: 50px;
    height: 50px;
    border-radius: 15px;
    background: rgba(60, 60, 70, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.server-icon:hover, .server-icon.active {
    background: #5865F2;
    border-radius: 15px;
}

.add-server {
    background: rgba(60, 60, 70, 0.4);
    color: #57F287;
}

.add-server:hover {
    background: #57F287;
    color: white;
}

.channel-area {
    width: 240px;
    background: rgba(40, 40, 50, 0.7);
    padding: 15px;
    display: flex;
    flex-direction: column;
}

.channel-header {
    padding-bottom: 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-weight: bold;
}

.channel-list {
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.channel-category {
    font-size: 12px;
    color: #aaa;
    margin-bottom: 5px;
    margin-top: 10px;
}

.channel-item {
    padding: 5px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.channel-item:hover, .channel-item.active {
    background: rgba(88, 101, 242, 0.3);
}

.channel-item.voice {
    display: flex;
    flex-direction: column;
}

.voice-users {
    margin-left: 20px;
    margin-top: 5px;
    font-size: 12px;
    color: #ddd;
}

.chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 15px;
}

.chat-header {
    padding-bottom: 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-weight: bold;
}

.voice-status {
    margin-top: 15px;
    background: rgba(30, 30, 40, 0.7);
    padding: 10px 15px;
    border-radius: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.connected-voice {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-indicator {
    width: 10px;
    height: 10px;
    background: #57F287;
    border-radius: 50%;
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

.voice-controls {
    display: flex;
    gap: 10px;
}

.control-btn {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(60, 60, 70, 0.8);
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.control-btn:hover {
    background: #5865F2;
}

.voice-participants {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.participant {
    display: flex;
    align-items: center;
    padding: 8px 15px;
    border-radius: 5px;
    background: rgba(40, 40, 50, 0.5);
}

.avatar {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    background: #5865F2;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-right: 10px;
}

.you .avatar {
    background: #EB459E;
}

.participant-name {
    flex: 1;
}

.speaking-indicator {
    display: flex;
    align-items: center;
    gap: 2px;
}

.speaking-indicator span {
    width: 3px;
    height: 5px;
    background-color: #888;
    border-radius: 1px;
}

.speaking-indicator.active span {
    background-color: #57F287;
    animation: wave-jump 1.2s ease infinite alternate;
}

.speaking-indicator.active span:nth-child(2) {
    animation-delay: 0.2s;
}

.speaking-indicator.active span:nth-child(3) {
    animation-delay: 0.4s;
}

/* Media queries for responsiveness */
@media screen and (max-width: 768px) {
    .timeline-track {
        left: 30px;
    }
    
    .timeline-node {
        left: 30px;
    }
    
    .timeline-content {
        width: calc(100% - 80px);
        margin-left: 80px !important;
        margin-right: 0 !important;
    }
    
    .timeline-visual {
        position: relative;
        width: calc(100% - 80px);
        margin-left: 80px;
        margin-top: 20px;
        height: auto;
    }
    
    .timeline-item {
        margin-bottom: 60px;
        display: flex;
        flex-direction: column;
    }
    
    .demo-interface {
        flex-direction: column;
        height: auto;
    }
    
    .server-list {
        width: 100%;
        flex-direction: row;
        padding: 10px 0;
        overflow-x: auto;
        justify-content: center;
    }
    
    .channel-area {
        width: 100%;
    }
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Initialize GSAP animations for Section 2
    gsap.registerPlugin(ScrollTrigger);
    
    // Split text animation for the heading
    const splitTextContainer = document.querySelector('.split-text-container');
    const splitTextElement = document.querySelector('.split-text');
    const splitTextContent = splitTextElement.textContent;
    
    // Clear the text and create individual spans
    splitTextElement.textContent = '';
    splitTextContent.split('').forEach(char => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        splitTextElement.appendChild(span);
    });
    
    // Animate the split text container and characters
    gsap.to(splitTextContainer, {
        opacity: 1,
        y: 0,
        duration: 1,
        scrollTrigger: {
            trigger: '.feature-section-2',
            start: 'top 80%'
        }
    });
    
    // Animate each character with a staggered delay
    gsap.to('.split-text span', {
        opacity: 1,
        y: 0,
        stagger: 0.03,
        delay: 0.5,
        scrollTrigger: {
            trigger: '.feature-section-2',
            start: 'top 80%'
        }
    });
    
    // Timeline animation
    gsap.utils.toArray('.timeline-item').forEach((item, index) => {
        // Set step number
        const node = item.querySelector('.timeline-node');
        node.setAttribute('data-step', index + 1);
        
        // Animate timeline items when scrolled into view
        gsap.to(item, {
            opacity: 1,
            y: 0,
            duration: 1,
            scrollTrigger: {
                trigger: item,
                start: 'top 80%'
            }
        });
    });
    
    // Interactive elements for demo
    const serverIcons = document.querySelectorAll('.server-icon');
    const channelItems = document.querySelectorAll('.channel-item');
    const participantSpeaking = document.querySelector('.speaking-indicator.active');
    
    // Server icon interaction
    serverIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            serverIcons.forEach(i => i.classList.remove('active'));
            icon.classList.add('active');
        });
    });
    
    // Channel item interaction
    channelItems.forEach(channel => {
        channel.addEventListener('click', () => {
            channelItems.forEach(c => c.classList.remove('active'));
            channel.classList.add('active');
        });
    });
    
    // Simulate speaking animation
    let speakingActive = true;
    setInterval(() => {
        if (speakingActive) {
            participantSpeaking.classList.remove('active');
            speakingActive = false;
        } else {
            participantSpeaking.classList.add('active');
            speakingActive = true;
        }
    }, 3000);
    
    // Audio wave animation trigger on hover
    const audioWaveContainers = document.querySelectorAll('.audio-wave-container');
    audioWaveContainers.forEach(container => {
        const parentContainer = container.closest('.visual-container');
        parentContainer.addEventListener('mouseenter', () => {
            container.style.opacity = '1';
        });
        parentContainer.addEventListener('mouseleave', () => {
            container.style.opacity = '0.7';
        });
    });
});
</script>
