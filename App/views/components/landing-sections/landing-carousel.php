<!-- Add CSS links for the carousel to the head of the document -->
<link rel="stylesheet" href="<?php echo asset('css/landing-carousel.css'); ?>">
<link rel="stylesheet" href="<?php echo asset('css/landing-carousel-features.css'); ?>">
<link rel="stylesheet" href="<?php echo asset('css/feature-sections.css'); ?>">

<!-- Modern Interactive 3D Carousel Section with Advanced Animations -->
<section class="py-16 feature-section carousel-section overflow-hidden relative">
    <!-- Dynamic animated background -->
    <div class="absolute inset-0 -z-10">
        <div class="animated-bg">
            <div class="gradient-orb orb1"></div>
            <div class="gradient-orb orb2"></div>
            <div class="gradient-orb orb3"></div>
            <div class="gradient-lines"></div>
        </div>
    </div>

    <h2 class="text-3xl md:text-5xl font-bold mb-16 text-center section-title animate-fade-in-up">
        Discover MiscVord Features
        <div class="title-underline mx-auto mt-4">
            <div class="underline-progress"></div>
        </div>
    </h2>
    
    <!-- 3D Interactive Feature Cards -->
    <div class="modern-carousel">
        <div class="carousel-track">
            <!-- Feature Card 1: Text Chat -->
            <div class="feature-card" data-feature="chat">
                <div class="card-content">
                    <div class="card-front">
                        <div class="card-icon-wrapper">
                            <div class="card-icon bg-discord-blue bg-opacity-20 animate-pulse-slow">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                </svg>
                                <div class="icon-glow blue-glow"></div>
                            </div>
                        </div>
                        <h3 class="card-title animate-gradient-text">Text Chat</h3>
                        <p class="card-description">Send messages, share files, and stay connected with your community.</p>
                        <div class="card-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <button class="card-expand-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    <div class="card-back">
                        <div class="chat-simulation">
                            <div class="chat-message incoming">
                                <div class="message-avatar"></div>
                                <div class="message-content">
                                    <div class="message-author">CoolUser123</div>
                                    <div class="message-text">Hey everyone! Who's joining the game tonight?</div>
                                </div>
                            </div>
                            <div class="chat-message outgoing">
                                <div class="message-content">
                                    <div class="message-text">I'll be there! Just installing the new update.</div>
                                </div>
                            </div>
                            <div class="chat-message incoming delayed-1">
                                <div class="message-avatar"></div>
                                <div class="message-content">
                                    <div class="message-author">GameMaster</div>
                                    <div class="message-text">Perfect! We'll start at 9pm, don't forget to join voice!</div>
                                </div>
                            </div>
                            <div class="chat-message outgoing delayed-2">
                                <div class="message-content">
                                    <div class="message-text">Sounds good 👍</div>
                                </div>
                            </div>
                        </div>
                        <button class="card-collapse-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Feature Card 2: Voice Chat -->
            <div class="feature-card" data-feature="voice">
                <div class="card-content">
                    <div class="card-front">
                        <div class="card-icon-wrapper">
                            <div class="card-icon bg-discord-green bg-opacity-20 animate-pulse-slow">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                <div class="icon-glow green-glow"></div>
                            </div>
                        </div>
                        <h3 class="card-title animate-gradient-text">Voice Chat</h3>
                        <p class="card-description">High quality, low-latency voice calls for seamless conversations.</p>
                        <div class="card-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <button class="card-expand-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    <div class="card-back">
                        <div class="voice-simulation">
                            <div class="voice-channel">
                                <div class="channel-header">🎮 Gaming Channel</div>
                                <div class="voice-users">
                                    <div class="voice-user speaking">
                                        <div class="user-avatar"></div>
                                        <div class="user-name">GameMaster</div>
                                        <div class="audio-waves">
                                            <span></span><span></span><span></span><span></span>
                                        </div>
                                    </div>
                                    <div class="voice-user">
                                        <div class="user-avatar"></div>
                                        <div class="user-name">CoolUser123</div>
                                        <div class="audio-waves hidden">
                                            <span></span><span></span><span></span><span></span>
                                        </div>
                                    </div>
                                    <div class="voice-user speaking delayed">
                                        <div class="user-avatar"></div>
                                        <div class="user-name">PixelPro</div>
                                        <div class="audio-waves">
                                            <span></span><span></span><span></span><span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button class="card-collapse-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Feature Card 3: Video Chat -->
            <div class="feature-card" data-feature="video">
                <div class="card-content">
                    <div class="card-front">
                        <div class="card-icon-wrapper">
                            <div class="card-icon bg-discord-pink bg-opacity-20 animate-pulse-slow">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <div class="icon-glow pink-glow"></div>
                            </div>
                        </div>
                        <h3 class="card-title animate-gradient-text">Video Chat</h3>
                        <p class="card-description">Face-to-face meetings with crystal clear video quality.</p>
                        <div class="card-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <button class="card-expand-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    <div class="card-back">
                        <div class="video-simulation">
                            <div class="video-grid">
                                <div class="video-user main-video">
                                    <div class="video-frame">
                                        <div class="video-placeholder"></div>
                                        <div class="video-name">You</div>
                                        <div class="video-controls">
                                            <span class="video-mic"></span>
                                            <span class="video-camera"></span>
                                            <span class="video-screen"></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="video-user">
                                    <div class="video-frame">
                                        <div class="video-placeholder"></div>
                                        <div class="video-name">GameMaster</div>
                                    </div>
                                </div>
                                <div class="video-user">
                                    <div class="video-frame">
                                        <div class="video-placeholder"></div>
                                        <div class="video-name">PixelPro</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button class="card-collapse-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Feature Card 4: Nitro -->
            <div class="feature-card" data-feature="nitro">
                <div class="card-content">
                    <div class="card-front">
                        <div class="card-icon-wrapper">
                            <div class="card-icon bg-discord-yellow bg-opacity-20 animate-pulse-slow">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <div class="icon-glow yellow-glow"></div>
                            </div>
                        </div>
                        <h3 class="card-title animate-gradient-text">Nitro Boost</h3>
                        <p class="card-description">Level up your experience with premium features and perks.</p>
                        <div class="card-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <button class="card-expand-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    <div class="card-back">
                        <div class="nitro-simulation">
                            <div class="nitro-perks">
                                <div class="perk-badge boost-badge">
                                    <div class="badge-icon">⚡</div>
                                    <div class="badge-info">
                                        <h4>Server Boosting</h4>
                                        <p>Power up your favorite servers</p>
                                    </div>
                                </div>
                                <div class="perk-badge emoji-badge">
                                    <div class="badge-icon">😎</div>
                                    <div class="badge-info">
                                        <h4>Custom Emoji</h4>
                                        <p>Use your emojis everywhere</p>
                                    </div>
                                </div>
                                <div class="perk-badge upload-badge">
                                    <div class="badge-icon">📤</div>
                                    <div class="badge-info">
                                        <h4>100MB Uploads</h4>
                                        <p>Share HD videos and files</p>
                                    </div>
                                </div>
                                <div class="rocket-animation">
                                    <div class="rocket">🚀</div>
                                    <div class="rocket-trail"></div>
                                </div>
                            </div>
                        </div>
                        <button class="card-collapse-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Feature Card 5: Community -->
            <div class="feature-card" data-feature="community">
                <div class="card-content">
                    <div class="card-front">
                        <div class="card-icon-wrapper">
                            <div class="card-icon bg-discord-purple bg-opacity-20 animate-pulse-slow">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <div class="icon-glow purple-glow"></div>
                            </div>
                        </div>
                        <h3 class="card-title animate-gradient-text">Community</h3>
                        <p class="card-description">Join or create thriving communities around your interests.</p>
                        <div class="card-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <button class="card-expand-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    <div class="card-back">
                        <div class="community-simulation">
                            <div class="server-channels">
                                <div class="server-header">
                                    <h4>Gaming Paradise</h4>
                                    <div class="members-count">1,245 members</div>
                                </div>
                                <div class="channel-list">
                                    <div class="channel-category">TEXT CHANNELS</div>
                                    <div class="channel active"># welcome</div>
                                    <div class="channel"># announcements</div>
                                    <div class="channel"># general</div>
                                    <div class="channel-category">VOICE CHANNELS</div>
                                    <div class="channel"># General Voice</div>
                                    <div class="channel"># Gaming Zone</div>
                                </div>
                                <div class="community-bubbles">
                                    <div class="community-bubble"></div>
                                    <div class="community-bubble"></div>
                                    <div class="community-bubble"></div>
                                    <div class="community-connections"></div>
                                </div>
                            </div>
                        </div>
                        <button class="card-collapse-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Feature Card 6: Server Stats -->
            <div class="feature-card" data-feature="stats">
                <div class="card-content">
                    <div class="card-front">
                        <div class="card-icon-wrapper">
                            <div class="card-icon bg-discord-cyan bg-opacity-20 animate-pulse-slow">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <div class="icon-glow cyan-glow"></div>
                            </div>
                        </div>
                        <h3 class="card-title animate-gradient-text">Server Stats</h3>
                        <p class="card-description">Track engagement and growth with detailed analytics.</p>
                        <div class="card-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <button class="card-expand-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    <div class="card-back">
                        <div class="stats-simulation">
                            <div class="stats-dashboard">
                                <div class="stats-header">Server Analytics</div>
                                <div class="stats-metrics">
                                    <div class="metric">
                                        <div class="metric-value">1,245</div>
                                        <div class="metric-label">Members</div>
                                        <div class="metric-growth positive">+12%</div>
                                    </div>
                                    <div class="metric">
                                        <div class="metric-value">8,932</div>
                                        <div class="metric-label">Messages</div>
                                        <div class="metric-growth positive">+23%</</div>
                                    </div>
                                    <div class="metric">
                                        <div class="metric-value">432</div>
                                        <div class="metric-label">Active Users</div>
                                        <div class="metric-growth positive">+5%</div>
                                    </div>
                                </div>
                                <div class="stats-chart">
                                    <div class="chart-bar" style="--growth: 20%"></div>
                                    <div class="chart-bar" style="--growth: 35%"></div>
                                    <div class="chart-bar" style="--growth: 28%"></div>
                                    <div class="chart-bar" style="--growth: 45%"></div>
                                    <div class="chart-bar" style="--growth: 52%"></div>
                                    <div class="chart-bar active" style="--growth: 78%"></div>
                                    <div class="chart-bar highlight" style="--growth: 65%"></div>
                                </div>
                            </div>
                        </div>
                        <button class="card-collapse-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Navigation controls with interactive animations -->
        <div class="carousel-navigation">
            <button class="nav-btn prev-btn">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <div class="nav-indicators">
                <button class="indicator active" data-index="0"></button>
                <button class="indicator" data-index="1"></button>
                <button class="indicator" data-index="2"></button>
                <button class="indicator" data-index="3"></button>
                <button class="indicator" data-index="4"></button>
                <button class="indicator" data-index="5"></button>
            </div>
            <button class="nav-btn next-btn">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    </div>
    
    <!-- Interactive 3D Feature Highlight Section -->
    <div class="feature-highlight mt-24">
        <div class="highlight-container">
            <div class="highlight-card">
                <div class="card-3d-layer layer-1"></div>
                <div class="card-3d-layer layer-2"></div>
                <div class="card-3d-layer layer-3"></div>
                <div class="highlight-content">
                    <h3 class="text-2xl font-bold mb-4 animate-gradient-text">All Features Work Together Seamlessly</h3>
                    <p class="text-gray-200 mb-6">Chat, voice, video, and community features integrate perfectly for the ultimate communication experience.</p>
                    <div class="highlight-icons">
                        <div class="highlight-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                            </svg>
                        </div>
                        <div class="connector"></div>
                        <div class="highlight-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <div class="connector"></div>
                        <div class="highlight-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="particles-container"></div>
            </div>
        </div>
    </div>
</section>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        // Card front & back flip functionality
        setupCardFlip();
        
        // Enhanced card interactions and animations
        setupEnhancedCardAnimations();
        
        // Create particles for the highlight section
        createHighlightParticles();
        
        // Add animated background effects
        createAnimatedBackground();
    });

    function setupCardFlip() {
        const cards = document.querySelectorAll('.feature-card');
        
        cards.forEach(card => {
            const expandBtn = card.querySelector('.card-expand-btn');
            const collapseBtn = card.querySelector('.card-collapse-btn');
            
            if (expandBtn) {
                expandBtn.addEventListener('click', () => {
                    cards.forEach(c => c.classList.remove('expanded'));
                    card.classList.add('expanded');
                    
                    // Trigger specific animations for the expanded card
                    triggerCardAnimations(card);
                });
            }
            
            if (collapseBtn) {
                collapseBtn.addEventListener('click', () => {
                    card.classList.remove('expanded');
                });
            }
        });
    }
    
    function setupEnhancedCardAnimations() {
        const cards = document.querySelectorAll('.feature-card');
        
        cards.forEach(card => {
            // 3D tilt effect on hover
            card.addEventListener('mousemove', e => {
                if (card.classList.contains('expanded')) return;
                
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const angleX = (y - centerY) / 20;
                const angleY = (centerX - x) / 20;
                
                const cardContent = card.querySelector('.card-content');
                if (cardContent) {
                    cardContent.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
                    
                    // Add depth effect to card elements
                    const icon = card.querySelector('.card-icon');
                    const title = card.querySelector('.card-title');
                    const description = card.querySelector('.card-description');
                    
                    if (icon) icon.style.transform = `translateZ(25px)`;
                    if (title) title.style.transform = `translateZ(20px)`;
                    if (description) description.style.transform = `translateZ(15px)`;
                }
            });
            
            // Reset on mouse leave
            card.addEventListener('mouseleave', () => {
                if (card.classList.contains('expanded')) return;
                
                const cardContent = card.querySelector('.card-content');
                const icon = card.querySelector('.card-icon');
                const title = card.querySelector('.card-title');
                const description = card.querySelector('.card-description');
                
                if (cardContent) cardContent.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
                if (icon) icon.style.transform = '';
                if (title) title.style.transform = '';
                if (description) description.style.transform = '';
            });
        });
    }

    function triggerCardAnimations(card) {
        const feature = card.dataset.feature;
        
        switch (feature) {
            case 'chat':
                animateChatMessages(card);
                break;
            case 'voice':
                animateVoiceWaves(card);
                break;
            case 'nitro':
                animateRocket(card);
                break;
            case 'video':
                animateVideoPlaceholders(card);
                break;
            case 'community':
                animateCommunityBubbles(card);
                break;
            case 'stats':
                animateStatsCharts(card);
                break;
        }
    }

    function animateChatMessages(card) {
        const messages = card.querySelectorAll('.chat-message');
        
        messages.forEach((msg, index) => {
            msg.style.opacity = '0';
            msg.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                msg.style.opacity = '1';
                msg.style.transform = 'translateY(0)';
                msg.style.transition = 'all 0.5s ease';
                
                // Animate text appearing letter by letter for incoming messages
                if (msg.classList.contains('incoming')) {
                    const textElement = msg.querySelector('.message-text');
                    if (textElement) {
                        const text = textElement.textContent;
                        textElement.textContent = '';
                        
                        let charIndex = 0;
                        const typeInterval = setInterval(() => {
                            if (charIndex < text.length) {
                                textElement.textContent += text[charIndex];
                                charIndex++;
                            } else {
                                clearInterval(typeInterval);
                            }
                        }, 30);
                    }
                }
            }, index * 600);
        });
    }

    function animateVoiceWaves(card) {
        const waves = card.querySelectorAll('.audio-waves');
        
        waves.forEach(wave => {
            if (!wave.parentElement.classList.contains('speaking')) return;
            
            const spans = wave.querySelectorAll('span');
            
            // Create animation for each wave bar
            spans.forEach((span, i) => {
                setInterval(() => {
                    const height = 3 + Math.random() * 12;
                    span.style.height = `${height}px`;
                    span.style.transition = 'height 0.2s ease';
                }, 200 + (i * 50));
            });
        });
    }

    function animateRocket(card) {
        const rocket = card.querySelector('.rocket');
        if (!rocket) return;
        
        // Initial position
        rocket.style.bottom = '0';
        
        setInterval(() => {
            // Launch animation
            rocket.style.bottom = '110%';
            rocket.style.opacity = '0';
            rocket.style.transition = 'bottom 2s ease-out, opacity 0.5s ease-out 1.5s';
            
            setTimeout(() => {
                // Reset position without animation
                rocket.style.transition = 'none';
                rocket.style.bottom = '0';
                rocket.style.opacity = '1';
                
                // Force reflow
                rocket.offsetHeight;
            }, 2500);
        }, 4000);
    }

    function animateVideoPlaceholders(card) {
        const placeholders = card.querySelectorAll('.video-placeholder');
        
        placeholders.forEach(placeholder => {
            // Add pulsing effect
            placeholder.style.animation = 'pulse 2s infinite';
            
            // Add random subtle movement
            setInterval(() => {
                const xMove = (Math.random() - 0.5) * 6;
                const yMove = (Math.random() - 0.5) * 6;
                placeholder.style.transform = `translate(${xMove}px, ${yMove}px)`;
                placeholder.style.transition = 'transform 2s ease';
            }, 2000);
        });
    }

    function animateCommunityBubbles(card) {
        const bubbles = card.querySelectorAll('.community-bubble');
        
        bubbles.forEach((bubble, index) => {
            // Set initial position
            const initialX = parseInt(bubble.style.left) || 0;
            const initialY = parseInt(bubble.style.top) || 0;
            
            // Animate with floating effect
            setInterval(() => {
                const xMove = initialX + (Math.random() - 0.5) * 20;
                const yMove = initialY + (Math.random() - 0.5) * 20;
                bubble.style.transform = `translate(${xMove}px, ${yMove}px)`;
                bubble.style.transition = 'transform 3s ease';
            }, 3000);
        });
    }

    function animateStatsCharts(card) {
        const bars = card.querySelectorAll('.chart-bar');
        
        // Animate bars growing from bottom
        bars.forEach((bar, index) => {
            bar.style.transform = 'scaleY(0)';
            
            setTimeout(() => {
                bar.style.transform = 'scaleY(1)';
                bar.style.transition = 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
            }, index * 150);
        });
        
        // Animate metric numbers counting up
        const metrics = card.querySelectorAll('.metric-value');
        metrics.forEach((metric) => {
            const finalValue = parseInt(metric.textContent.replace(/,/g, ''));
            metric.textContent = '0';
            
            let currentValue = 0;
            const increment = Math.ceil(finalValue / 50);
            
            const interval = setInterval(() => {
                currentValue += increment;
                if (currentValue >= finalValue) {
                    currentValue = finalValue;
                    clearInterval(interval);
                }
                metric.textContent = currentValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }, 20);
        });
    }

    function createHighlightParticles() {
        const container = document.querySelector('.particles-container');
        if (!container) return;
        
        // Create particles with different sizes and colors
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'highlight-particle';
            
            // Randomize properties
            const size = 2 + Math.random() * 5;
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const opacity = 0.1 + Math.random() * 0.5;
            const animationDuration = 5 + Math.random() * 10;
            const animationDelay = Math.random() * 5;
            
            // Apply styles
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            particle.style.opacity = opacity.toString();
            particle.style.animation = `particle-float ${animationDuration}s infinite ease-in-out ${animationDelay}s`;
            
            container.appendChild(particle);
        }
    }

    function createAnimatedBackground() {
        const section = document.querySelector('.carousel-section');
        if (!section) return;
        
        // Create dynamic gradient animation in background
        const bg = document.querySelector('.animated-bg');
        if (bg) {
            setInterval(() => {
                const hue1 = Math.floor(Math.random() * 360);
                const hue2 = (hue1 + 180) % 360; // Complementary color
                
                document.documentElement.style.setProperty('--gradient-hue1', hue1.toString());
                document.documentElement.style.setProperty('--gradient-hue2', hue2.toString());
            }, 5000);
        }
        
        // Create floating elements that follow mouse movement
        section.addEventListener('mousemove', e => {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;
            
            const orbs = document.querySelectorAll('.gradient-orb');
            orbs.forEach((orb, index) => {
                const speed = 0.03 + (index * 0.01);
                const xRange = 30 + (index * 10);
                const yRange = 30 + (index * 10);
                
                const x = ((mouseX - 0.5) * xRange).toFixed(1);
                const y = ((mouseY - 0.5) * yRange).toFixed(1);
                
                orb.style.transform = `translate(${x}px, ${y}px)`;
                orb.style.transition = 'transform 1s ease-out';
            });
        });
    }
</script>
