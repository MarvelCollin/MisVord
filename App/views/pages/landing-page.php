<?php
require_once dirname(dirname(__DIR__)) . '/config/helpers.php';

$page_title = 'misvord - Where Communities Thrive';
$page_css = 'landing-page';
$page_js = 'landing-page';
$body_class = 'modern-landing';

ob_start();
?>

<!-- Completely disable messaging system for landing page -->
<script>
// Set landing page mode and disable all messaging functionality
window.LANDING_PAGE_MODE = true;
window.DISABLE_MESSAGING = true;

// Comprehensive error suppression and messaging system override
(function() {
    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    
    // Patterns to suppress
    const suppressPatterns = [
        'Message container not found',
        'Message form not found in DOM',
        'WebSocket connection error',
        'Invalid namespace',
        'LazyLoader is NOT available globally',
        'Failed to load resource.*favicon.ico',
        'MisVordMessaging',
        'SOCKET_ERROR',
        'Error tracked:',
        'socket.io',
        'messaging.js'
    ];
    
    function shouldSuppress(args) {
        const message = args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                return JSON.stringify(arg);
            }
            return String(arg);
        }).join(' ');
        
        return suppressPatterns.some(pattern => {
            const regex = new RegExp(pattern, 'i');
            return regex.test(message);
        });
    }
    
    // Override console methods
    console.error = function(...args) {
        if (!shouldSuppress(args)) {
            originalError.apply(console, args);
        }
    };
    
    console.warn = function(...args) {
        if (!shouldSuppress(args)) {
            originalWarn.apply(console, args);
        }
    };
    
    console.log = function(...args) {
        if (!shouldSuppress(args)) {
            originalLog.apply(console, args);
        }
    };
    
    // Completely disable MisVordMessaging before it loads
    Object.defineProperty(window, 'MisVordMessaging', {
        value: {
            init: () => false,
            connect: () => false,
            disconnect: () => false,
            sendMessage: () => false,
            error: () => {},
            log: () => {},
            trackError: () => {}
        },
        writable: false,
        configurable: false
    });
    
    // Disable Socket.IO completely
    Object.defineProperty(window, 'io', {
        value: function() {
            return {
                on: () => ({ on: () => {}, emit: () => {}, connect: () => {}, disconnect: () => {} }),
                emit: () => {},
                connect: () => {},
                disconnect: () => {},
                connected: false
            };
        },
        writable: false,
        configurable: false
    });
    
    // Provide LazyLoader stub
    Object.defineProperty(window, 'LazyLoader', {
        value: {
            load: () => Promise.resolve(),
            isAvailable: () => true
        },
        writable: false,
        configurable: false
    });
    
    // Block all messaging-related script execution
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        // Block messaging system event listeners
        if (typeof listener === 'function') {
            const listenerString = listener.toString();
            if (listenerString.includes('MisVordMessaging') || 
                listenerString.includes('socket.io') ||
                listenerString.includes('messaging')) {
                return; // Block the event listener
            }
        }
        return originalAddEventListener.call(this, type, listener, options);
    };
    
    // Override fetch to block messaging-related requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (typeof url === 'string' && 
            (url.includes('socket.io') || url.includes('messaging') || url.includes('ws://'))) {
            return Promise.reject(new Error('Messaging disabled on landing page'));
        }
        return originalFetch.apply(this, arguments);
    };
    
    // Block WebSocket connections
    const OriginalWebSocket = window.WebSocket;
    window.WebSocket = function() {
        throw new Error('WebSocket disabled on landing page');
    };
    
    // Disable any messaging form interactions
    document.addEventListener('DOMContentLoaded', function() {
        // Remove any messaging forms or containers
        const messagingElements = document.querySelectorAll('[id*="message"], [class*="message-form"], [class*="messaging"]');
        messagingElements.forEach(el => {
            if (!el.closest('.discord-mockup')) { // Keep our demo chat
                el.remove();
            }
        });
        
        // Override any remaining messaging functions
        if (window.initMessaging) window.initMessaging = () => {};
        if (window.connectSocket) window.connectSocket = () => {};
        if (window.joinRoom) window.joinRoom = () => {};
    });
    
})();
</script>

<!-- Animated Background -->
<div class="landing-background"></div>

<!-- Hero Section - Full height without navbar -->
<section class="hero-section">
    <!-- Enhanced floating decorative elements -->
    <div class="floating-element floating-1"></div>
    <div class="floating-element floating-2"></div>
    <div class="floating-element floating-3"></div>
    <div class="floating-element floating-4"></div>

    <div class="hero-container">
        <div class="hero-title-section">
            <!-- Add explicit data-text attribute to ensure the scramble text works properly -->
            <h1 class="hero-title scramble-text" data-text="IMAGINE A PLACE...">
                IMAGINE A PLACE...
            </h1>
        </div>

        <div class="hero-content-wrapper">
            <div class="hero-content">
                <p class="hero-description">
                    ...where you can belong to a school club, a gaming group, or a worldwide art community. 
                    Where just you and a handful of friends can spend time together. A place that makes it 
                    easy to talk every day and hang out more often.
                </p>
                
                <!-- Add CTA buttons in hero section since navbar is removed -->
                <div class="hero-actions mt-8 flex flex-col sm:flex-row gap-4">
                    <a href="/login" class="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                        </svg>
                        Open misvord
                    </a>
                    <a href="/register" class="inline-flex items-center justify-center px-8 py-4 border-2 border-white/20 text-white font-medium rounded-lg hover:bg-white/10 hover:border-white/30 transition-all duration-200">
                        Get Started
                    </a>
                </div>
            </div>

            <div class="hero-visual">
                <div class="discord-mockup">
                    <div class="mockup-header">
                        <div class="mockup-avatar">M</div>
                        <div class="mockup-info">
                            <h4>misvord Community</h4>
                            <p class="online-status">🟢 <span class="member-count-static">15,847</span> members online</p>
                        </div>
                    </div>
                    <!-- Properly set up chat container with a specific ID for the chat simulation to target -->
                    <div class="mockup-content" id="chatContainer">
                        <!-- Chat messages will be dynamically added here by JavaScript -->
                    </div>
                    <div class="chat-input-area">
                        <div class="typing-users">
                            <div class="typing-indicator hidden">
                                <div class="typing-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <span class="typing-text">Someone is typing...</span>
                            </div>
                        </div>
                        <div class="chat-input-box">
                            <input 
                                type="text" 
                                id="userMessageInput" 
                                placeholder="Message #general" 
                                maxlength="100" 
                                autocomplete="off"
                                spellcheck="false"
                            >
                            <button id="sendMessageBtn" type="button" aria-label="Send message">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22,2 15,22 11,13 2,9"></polygon>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Add a direct initialization script to ensure functionality works -->
<script>
// Direct initialization script to ensure functionality works
document.addEventListener('DOMContentLoaded', function() {
    // Force initialization after a small delay
    setTimeout(function() {
        console.log("Direct script initialization running...");
        
        // Ultra-enhanced scramble text animation with fluid transitions and particle effects
        const heroTitle = document.querySelector('.hero-title.scramble-text');
        if (heroTitle) {
            console.log("Found hero title, initializing ultra-enhanced scramble effect");
            const originalText = heroTitle.getAttribute('data-text') || heroTitle.textContent.trim();
            
            if (originalText) {
                console.log("Hero title text:", originalText);
                
                // Set up a canvas for particle effects
                const particleCanvas = document.createElement('canvas');
                particleCanvas.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: -1;
                `;
                
                heroTitle.style.position = 'relative';
                heroTitle.appendChild(particleCanvas);
                
                // Initialize particle system
                const ctx = particleCanvas.getContext('2d');
                const particles = [];
                let canvasWidth = 0;
                let canvasHeight = 0;
                
                function resizeCanvas() {
                    canvasWidth = heroTitle.clientWidth;
                    canvasHeight = heroTitle.clientHeight;
                    particleCanvas.width = canvasWidth;
                    particleCanvas.height = canvasHeight;
                }
                
                resizeCanvas();
                window.addEventListener('resize', resizeCanvas);
                
                function createParticle(x, y, color) {
                    // Enhanced particle creation with more properties
                    const baseSpeed = 2 + Math.random() * 2;
                    const angle = Math.random() * Math.PI * 2;
                    
                    // Calculate speeds based on angle for proper directional movement
                    const speedX = Math.cos(angle) * baseSpeed;
                    const speedY = Math.sin(angle) * baseSpeed;
                    
                    // Random color selection if none provided
                    let particleColor = color;
                    if (!particleColor) {
                        const colorOptions = [
                            '#5865F2', // Discord blue
                            '#57F287', // Discord green
                            '#FEE75C', // Discord yellow
                            '#EB459E', // Discord pink
                            '#FFFFFF'  // White for variety
                        ];
                        particleColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
                    }
                    
                    // Add slight color variation
                    if (Math.random() > 0.7 && particleColor.startsWith('#')) {
                        // Slightly modify the color for variation
                        const r = parseInt(particleColor.slice(1, 3), 16);
                        const g = parseInt(particleColor.slice(3, 5), 16);
                        const b = parseInt(particleColor.slice(5, 7), 16);
                        
                        // Add slight variation (±20)
                        const vr = Math.min(255, Math.max(0, r + (Math.random() * 40 - 20)));
                        const vg = Math.min(255, Math.max(0, g + (Math.random() * 40 - 20)));
                        const vb = Math.min(255, Math.max(0, b + (Math.random() * 40 - 20)));
                        
                        particleColor = `rgb(${Math.floor(vr)}, ${Math.floor(vg)}, ${Math.floor(vb)})`;
                    }
                    
                    return {
                        x,
                        y,
                        size: 1 + Math.random() * 3,
                        color: particleColor,
                        speedX: speedX,
                        speedY: speedY,
                        life: 1, // 1 = full life, 0 = dead
                        decay: 0.01 + Math.random() * 0.03,
                        // Add rotation for more visual interest
                        rotation: Math.random() * 360,
                        rotationSpeed: (Math.random() - 0.5) * 5,
                        // Add pulsation
                        pulsate: Math.random() > 0.7,
                        pulsateSpeed: 0.05 + Math.random() * 0.1
                    };
                }
                
                function drawParticles() {
                    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                    
                    for (let i = particles.length - 1; i >= 0; i--) {
                        const p = particles[i];
                        p.life -= p.decay;
                        
                        if (p.life <= 0) {
                            particles.splice(i, 1);
                            continue;
                        }
                        
                        p.x += p.speedX;
                        p.y += p.speedY;
                        p.rotation += p.rotationSpeed;
                        
                        // Add slight gravity effect - particles slow down and fall
                        p.speedX *= 0.99;
                        p.speedY *= 0.99;
                        p.speedY += 0.02;
                        
                        ctx.save();
                        ctx.globalAlpha = p.life;
                        ctx.fillStyle = p.color;
                        
                        // Rotate particle for more dynamic look
                        ctx.translate(p.x, p.y);
                        ctx.rotate(p.rotation * Math.PI/180);
                        
                        // Pulsate size for some particles
                        let displaySize = p.size;
                        if (p.pulsate) {
                            displaySize *= (1 + Math.sin(Date.now() * p.pulsateSpeed) * 0.2) * p.life;
                        }
                        
                        // Draw particle with optional shape variation
                        if (Math.random() > 0.8) {
                            // Occasionally draw square particles
                            ctx.fillRect(-displaySize/2, -displaySize/2, displaySize, displaySize);
                        } else {
                            // Mostly circular particles
                            ctx.beginPath();
                            ctx.arc(0, 0, displaySize * p.life, 0, Math.PI * 2);
                            ctx.fill();
                            
                            // Add a subtle glow effect
                            ctx.globalAlpha = p.life * 0.5;
                            ctx.beginPath();
                            ctx.arc(0, 0, displaySize * 1.5 * p.life, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        
                        ctx.restore();
                    }
                    
                    if (particles.length > 0) {
                        requestAnimationFrame(drawParticles);
                    }
                }
                
                function emitParticles(x, y, count, color) {
                    for (let i = 0; i < count; i++) {
                        particles.push(createParticle(x, y, color));
                    }
                    
                    if (particles.length === count) { // If this is the first batch
                        requestAnimationFrame(drawParticles);
                    }
                }
                
                // Clear the element first
                heroTitle.style.display = 'inline-block';
                heroTitle.style.opacity = '1';
                heroTitle.style.visibility = 'visible';
                heroTitle.innerHTML = '';
                
                // Enhanced character set with more special characters
                const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?▓▒░█▄▀◤◥◢◣●■□▪▫▬▭▮▯☆★⚡✨⚒☄✺";
                const spans = [];
                
                // Color schemes for a cohesive look
                const colorSchemes = [
                    { primary: '#5865F2', glow: 'rgba(88, 101, 242, 0.8)' }, // Discord blue
                    { primary: '#EB459E', glow: 'rgba(235, 69, 158, 0.8)' },  // Pink
                    { primary: '#57F287', glow: 'rgba(87, 242, 135, 0.8)' },  // Green
                    { primary: '#FEE75C', glow: 'rgba(254, 231, 92, 0.8)' }   // Yellow
                ];
                
                // Create spans for each character with enhanced styling
                for (let i = 0; i < originalText.length; i++) {
                    const span = document.createElement('span');
                    span.className = 'char';
                    span.style.cssText = `
                        display: inline-block;
                        position: relative;
                        opacity: 0;
                        color: transparent;
                        transform: translateY(30px) perspective(100px) rotateX(20deg) scale(0.8);
                        transition: transform 0.6s cubic-bezier(0.11, 0.99, 0.38, 1), 
                                  opacity 0.6s cubic-bezier(0.11, 0.99, 0.38, 1), 
                                  color 0.4s cubic-bezier(0.11, 0.99, 0.38, 1),
                                  text-shadow 0.4s cubic-bezier(0.11, 0.99, 0.38, 1);
                        will-change: transform, opacity, color, text-shadow;
                        transform-origin: bottom center;
                        transform-style: preserve-3d;
                        backface-visibility: hidden;
                    `;
                    
                    if (originalText[i] === ' ') {
                        span.innerHTML = '&nbsp;';
                        span.classList.add('space');
                        span.style.opacity = '1';
                        span.style.color = 'transparent';
                        span.style.minWidth = '0.3em';
                    } else {
                        // Start with a random character
                        span.textContent = chars[Math.floor(Math.random() * chars.length)];
                        span.dataset.finalChar = originalText[i];
                        span.dataset.charIndex = i;
                        span.dataset.isGlitching = 'false';
                        
                        // Randomize initial state for more organic feel
                        span.style.transformOrigin = `${50 + (Math.random() - 0.5) * 20}% ${100 + (Math.random() - 0.5) * 20}%`;
                    }
                    
                    heroTitle.appendChild(span);
                    spans.push(span);
                }
                
                // Enhanced animation with ultra-smooth staggered reveals
                const baseDelay = 80; // Base delay before starting
                const charRevealBaseDelay = 60; // Base delay between characters
                const charRevealRandomDelay = 40; // Random additional delay
                const scrambleIterations = 8; // More iterations for extended effect
                const scrambleBaseSpeed = 30; // Base time between scramble iterations
                const scrambleRandomSpeed = 20; // Random additional time
                
                // Function to create advanced spark effect
                function createAdvancedSpark(span, isBlast = false) {
                    const sparkCount = isBlast ? 20 + Math.floor(Math.random() * 15) : 5 + Math.floor(Math.random() * 5);
                    const rect = span.getBoundingClientRect();
                    const heroRect = heroTitle.getBoundingClientRect();
                    
                    // Calculate position relative to the canvas
                    const x = rect.left + rect.width/2 - heroRect.left;
                    const y = rect.top + rect.height/2 - heroRect.top;
                    
                    // Get a color scheme
                    const colorScheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
                    
                    // Emit particles
                    emitParticles(x, y, sparkCount, colorScheme.primary);
                }
                
                // Create a wave animation that moves through the text
                function animateTextWave() {
                    const nonSpaceSpans = spans.filter(span => !span.classList.contains('space'));
                    const totalDuration = 3000; // Total wave duration in ms
                    const waveWidth = 4; // How many characters the wave affects at once
                    
                    function animateWave() {
                        const now = Date.now();
                        const startTime = now;
                        const endTime = now + totalDuration;
                        
                        function updateWave() {
                            const currentTime = Date.now();
                            if (currentTime >= endTime) return;
                            
                            const progress = (currentTime - startTime) / totalDuration;
                            const wavePosition = progress * (nonSpaceSpans.length + waveWidth) - waveWidth/2;
                            
                            nonSpaceSpans.forEach((span, idx) => {
                                // Calculate how close this character is to the wave center
                                const distanceFromWave = Math.abs(idx - wavePosition);
                                if (distanceFromWave < waveWidth/2) {
                                    // This character is in the wave
                                    const waveIntensity = 1 - (distanceFromWave / (waveWidth/2));
                                    
                                    const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
                                    span.style.color = scheme.primary;
                                    span.style.textShadow = `0 0 10px ${scheme.glow}, 0 0 20px ${scheme.glow}`;
                                    span.style.transform = `translateY(${-5 * waveIntensity}px) scale(${1 + 0.2 * waveIntensity})`;
                                } else {
                                    // Reset characters outside the wave
                                    if (!span.matches(':hover') && span.dataset.isGlitching !== 'true') {
                                        span.style.color = '#FFFFFF';
                                        span.style.textShadow = '0 0 5px rgba(255, 255, 255, 0.3)';
                                        span.style.transform = 'translateY(0) scale(1)';
                                    }
                                }
                            });
                            
                            requestAnimationFrame(updateWave);
                        }
                        
                        updateWave();
                    }
                    
                    // Start wave animation and schedule next one
                    animateWave();
                    setTimeout(animateTextWave, totalDuration + 1000 + Math.random() * 2000);
                }
                
                // Character-by-character animation with enhanced visual effects
                spans.forEach((span, index) => {
                    if (span.classList.contains('space')) return;
                    
                    // Calculate staggered delay with randomness for organic feel
                    const staggeredDelay = baseDelay + 
                        (index * charRevealBaseDelay) + 
                        (Math.random() * charRevealRandomDelay);
                    
                    // Super-enhanced scramble effect before revealing final character
                    for (let i = 0; i < scrambleIterations; i++) {
                        setTimeout(() => {
                            // Only scramble if not yet revealed
                            if (!span.classList.contains('revealed')) {
                                // Different colors and transforms during scrambling
                                const randomChar = chars[Math.floor(Math.random() * chars.length)];
                                span.textContent = randomChar;
                                
                                // Calculate progress through the scramble sequence
                                const progress = i / scrambleIterations;
                                
                                // Apply increasingly dramatic visual effects during scrambling
                                if (i === scrambleIterations - 1) {
                                    // Final scramble frame before reveal
                                    const colorScheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
                                    span.style.color = colorScheme.primary;
                                    span.style.textShadow = `0 0 15px ${colorScheme.glow}, 0 0 30px ${colorScheme.glow}`;
                                    span.style.transform = 'translateY(-8px) perspective(100px) rotateX(-10deg) scale(1.3)';
                                    span.style.opacity = '1';
                                    
                                    // Add multiple spark effects at the climax
                                    createAdvancedSpark(span);
                                    
                                } else {
                                    // Intermediate scramble frames
                                    const colorProgress = Math.sin(progress * Math.PI);
                                    const hue = 220 + (colorProgress * 40); // Blue to purple range
                                    const lightness = 50 + (colorProgress * 20); // Brighter towards the end
                                    
                                    span.style.color = `hsl(${hue}, 80%, ${lightness}%)`;
                                    span.style.opacity = 0.3 + (progress * 0.7);
                                    
                                    // Create a rising effect with perspective
                                    const translateY = 30 - (progress * 35); // 30px to -5px
                                    const rotateX = 20 - (progress * 30); // 20deg to -10deg
                                    const scale = 0.8 + (progress * 0.5); // 0.8 to 1.3
                                    
                                    span.style.transform = `translateY(${translateY}px) perspective(100px) rotateX(${rotateX}deg) scale(${scale})`;
                                    
                                    // Add occasional mini-sparks during scramble for visual interest
                                    if (Math.random() > 0.85) {
                                        createAdvancedSpark(span);
                                    }
                                    
                                    // Subtle rotation for extra dynamism
                                    if (Math.random() > 0.5) {
                                        const rotateZ = (Math.random() - 0.5) * 15;
                                        span.style.transform += ` rotateZ(${rotateZ}deg)`;
                                    }
                                }
                            }
                        }, staggeredDelay + (i * scrambleBaseSpeed) + (Math.random() * scrambleRandomSpeed));
                    }
                    
                    // Reveal the final character with a satisfying transition
                    setTimeout(() => {
                        span.textContent = span.dataset.finalChar;
                        span.classList.add('revealed');
                        
                        // Apply smooth transition to final state with subtle glow
                        span.style.opacity = '1';
                        span.style.color = '#FFFFFF';
                        span.style.transform = 'translateY(0) perspective(100px) rotateX(0deg) scale(1)';
                        span.style.textShadow = '0 0 8px rgba(255, 255, 255, 0.5), 0 0 16px rgba(88, 101, 242, 0.3)';
                        
                        // Extra particle effect on character reveal
                        createAdvancedSpark(span, true);
                        
                        // Add subtle floating animation after revealing
                        setTimeout(() => {
                            span.classList.add('floating');
                            
                            // Assign a different floating animation to each character for variety
                            const animationTypes = ['charFloat1', 'charFloat2', 'charFloat3'];
                            const randomAnim = animationTypes[Math.floor(Math.random() * animationTypes.length)];
                            span.style.animation = `${randomAnim} ${4 + Math.random() * 2}s ease-in-out infinite`;
                            span.style.animationDelay = `${Math.random() * 2}s`;
                        }, 300);
                    }, staggeredDelay + (scrambleIterations * scrambleBaseSpeed) + (scrambleRandomSpeed * scrambleIterations / 2));
                });
                
                // Start wave animation after text is fully revealed
                const totalRevealTime = baseDelay + 
                    (originalText.length * charRevealBaseDelay) + 
                    (charRevealRandomDelay) + 
                    (scrambleIterations * scrambleBaseSpeed) + 
                    (scrambleRandomSpeed * scrambleIterations / 2) + 
                    1000;
                
                setTimeout(() => {
                    animateTextWave();
                    initSuperGlitchEffects(spans, chars);
                }, totalRevealTime);
                
                // Add ultra-responsive hover effects after animation completes
                setTimeout(() => {
                    addUltraResponsiveHoverEffects(spans, chars);
                }, totalRevealTime);
                
                // Super-enhanced glitch effects that are more subtle and refined
                function initSuperGlitchEffects(spans, chars) {
                    const nonSpaceSpans = spans.filter(span => !span.classList.contains('space'));
                    
                    // Enhanced periodic glitch rate - more frequent glitches
                    function glitchRandomCharacters() {
                        // Increase max glitches for more visual activity
                        const maxGlitchesAtOnce = Math.floor(Math.random() * 3) + 1; // 1-3 glitches at once
                        let glitchCount = 0;
                        
                        // Find spans that aren't currently being hovered or already glitching
                        const availableSpans = nonSpaceSpans.filter(span => 
                            !span.matches(':hover') && 
                            span.dataset.isGlitching !== 'true' &&
                            !span.classList.contains('user-hover')
                        );
                        
                        if (availableSpans.length === 0) {
                            scheduleNextGlitch();
                            return;
                        }
                        
                        // Pick random spans to glitch
                        const numToGlitch = Math.min(maxGlitchesAtOnce, availableSpans.length);
                        
                        for (let i = 0; i < numToGlitch; i++) {
                            if (availableSpans.length === 0) break;
                            
                            const randomIndex = Math.floor(Math.random() * availableSpans.length);
                            const targetSpan = availableSpans.splice(randomIndex, 1)[0];
                            
                            if (targetSpan) {
                                superGlitchCharacter(targetSpan);
                                glitchCount++;
                            }
                        }
                        
                        scheduleNextGlitch();
                    }
                    
                    function superGlitchCharacter(span) {
                        if (span.dataset.isGlitching === 'true') return;
                        
                        span.dataset.isGlitching = 'true';
                        const originalChar = span.dataset.finalChar;
                        const originalTransform = span.style.transform;
                        const originalColor = span.style.color;
                        const originalShadow = span.style.textShadow;
                        
                        // Choose a glitch style with weighted randomness - favoring more visible glitches
                        const glitchStylesWeighted = ['subtle', 'subtle', 'medium', 'medium', 'medium', 'intense', 'intense'];
                        const glitchStyle = glitchStylesWeighted[Math.floor(Math.random() * glitchStylesWeighted.length)];
                        
                        // Duration and frame count based on glitch style - increased animation frames
                        let glitchDuration, frameInterval;
                        
                        switch (glitchStyle) {
                            case 'intense':
                                glitchDuration = 800 + Math.random() * 600; // Longer duration
                                frameInterval = 25 + Math.random() * 15; // Faster frame rate
                                break;
                            case 'medium': 
                                glitchDuration = 500 + Math.random() * 400;
                                frameInterval = 30 + Math.random() * 20;
                                break;
                            case 'subtle':
                            default:
                                glitchDuration = 300 + Math.random() * 200;
                                frameInterval = 50 + Math.random() * 30;
                                break;
                        }
                        
                        const framesCount = Math.floor(glitchDuration / frameInterval);
                        let frameIndex = 0;
                        
                        // Save original animation
                        const originalAnimation = span.style.animation;
                        span.style.animation = 'none';
                        
                        // Create a very subtle particle at start of glitch
                        if (glitchStyle !== 'subtle') {
                            createAdvancedSpark(span);
                        }
                        
                        function glitchFrame() {
                            if (frameIndex >= framesCount || span.matches(':hover') || span.classList.contains('user-hover')) {
                                // Restore original state with smooth transition
                                span.style.transition = 'all 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)';
                                span.textContent = originalChar;
                                span.style.color = originalColor;
                                span.style.textShadow = originalShadow;
                                span.style.transform = originalTransform;
                                
                                // Delayed animation restoration
                                setTimeout(() => {
                                    span.style.animation = originalAnimation;
                                    span.style.transition = '';
                                    span.dataset.isGlitching = 'false';
                                }, 300);
                                
                                return;
                            }
                            
                            // Enhanced glitching behavior - based on current frame and style
                            const frameProgress = frameIndex / framesCount;
                            
                            // More sophisticated random character selection
                            let showRandomChar = false;
                            
                            // Dynamic probability curves for showing random chars
                            switch (glitchStyle) {
                                case 'intense':
                                    // Pulsing pattern for intense glitches
                                    showRandomChar = Math.sin(frameProgress * Math.PI * 8) > 0.3;
                                    break;
                                case 'medium':
                                    // Medium shows more chars at beginning and end
                                    showRandomChar = Math.random() > (0.4 + Math.sin(frameProgress * Math.PI) * 0.3);
                                    break;
                                case 'subtle':
                                    // Subtle has occasional glitches
                                    showRandomChar = Math.random() > 0.7 + Math.sin(frameProgress * Math.PI * 4) * 0.1;
                                    break;
                            }
                            
                            if (showRandomChar) {
                                // Enhanced random character selection with special characters more likely during intense glitches
                                const charSet = glitchStyle === 'intense' ? 
                                    chars + "☢☠⚠⚡✴✵✶✸✹" : 
                                    chars;
                                const randomChar = charSet[Math.floor(Math.random() * charSet.length)];
                                span.textContent = randomChar;
                                
                                switch (glitchStyle) {
                                    case 'intense':
                                        // Intense color changes with hue shifts based on frame progress
                                        const hueBase = 180 + Math.sin(frameProgress * Math.PI * 3) * 180;
                                        const hue = Math.floor(hueBase % 360);
                                        span.style.color = `hsl(${hue}, 80%, 60%)`;
                                        span.style.textShadow = `
                                            0 0 8px hsl(${hue}, 80%, 60%), 
                                            0 0 12px hsl(${hue}, 80%, 40%)
                                        `;
                                        
                                        // Dramatic transform with displacement patterns
                                        const oscillation = Math.sin(frameProgress * Math.PI * 8);
                                        const shiftX = (Math.random() - 0.5) * 6 * (1 - frameProgress) + oscillation * 3;
                                        const shiftY = (Math.random() - 0.5) * 6 * (1 - frameProgress) - Math.abs(oscillation) * 2;
                                        const scale = 0.9 + Math.random() * 0.4 + Math.sin(frameProgress * Math.PI * 6) * 0.1;
                                        const rotate = (Math.random() - 0.5) * 15 * (1 - frameProgress) + oscillation * 5;
                                        
                                        span.style.transform = `translate(${shiftX}px, ${shiftY}px) scale(${scale}) rotate(${rotate}deg)`;
                                        
                                        // Occasionally add a mini-spark during intense glitching
                                        if (Math.random() > 0.9) {
                                            createAdvancedSpark(span);
                                        }
                                        break;
                                        
                                    case 'medium':
                                        // Medium glitch with smoother transitions
                                        const blueHue = 220 + Math.floor(Math.random() * 40) + Math.sin(frameProgress * Math.PI * 4) * 20;
                                        span.style.color = `hsl(${blueHue}, 70%, 65%)`;
                                        span.style.textShadow = `0 0 6px hsl(${blueHue}, 70%, 60%)`;
                                        
                                        // Smooth wave-like motion
                                        const waveProgress = Math.sin(frameProgress * Math.PI * 3);
                                        const mildShiftX = (Math.random() - 0.5) * 3 * (1 - frameProgress) + waveProgress;
                                        const mildShiftY = (Math.random() - 0.5) * 3 * (1 - frameProgress) - Math.abs(waveProgress);
                                        const mildScale = 0.95 + Math.random() * 0.2 + Math.sin(frameProgress * Math.PI * 2) * 0.05;
                                        
                                        span.style.transform = `translate(${mildShiftX}px, ${mildShiftY}px) scale(${mildScale})`;
                                        break;
                                        
                                    case 'subtle':
                                        // Subtle effect with gentle pulses
                                        const subtleHue = 210 + Math.sin(frameProgress * Math.PI) * 20;
                                        span.style.color = `hsl(${subtleHue}, 60%, 70%)`;
                                        span.style.textShadow = '0 0 4px rgba(88, 101, 242, 0.4)';
                                        
                                        // Very slight movements
                                        const subtlePulse = Math.sin(frameProgress * Math.PI * 2) * 0.8;
                                        const tinyShiftX = (Math.random() - 0.5) * 1.2 * (1 - frameProgress);
                                        const tinyShiftY = subtlePulse - 0.4; // Slight upward bias
                                        
                                        span.style.transform = `translate(${tinyShiftX}px, ${tinyShiftY}px)`;
                                        break;
                                }
                            } else {
                                // Show original character with slight styling
                                span.textContent = originalChar;
                                
                                // Subtle effects even when showing original char
                                if (glitchStyle !== 'subtle') {
                                    const glitchIntensity = Math.sin(frameProgress * Math.PI * 4) * 0.3;
                                    span.style.color = `hsl(210, ${70 + glitchIntensity * 10}%, ${70 + glitchIntensity * 10}%)`;
                                    span.style.textShadow = `0 0 ${3 + glitchIntensity * 6}px rgba(88, 101, 242, ${0.3 + glitchIntensity * 0.2})`;
                                    
                                    // Subtle movement even when showing original char
                                    const moveX = Math.sin(frameProgress * Math.PI * 6) * 0.8;
                                    const moveY = Math.cos(frameProgress * Math.PI * 4) * 0.8;
                                    span.style.transform = `translate(${moveX}px, ${moveY}px)`;
                                } else {
                                    span.style.color = originalColor;
                                    span.style.textShadow = originalShadow;
                                    span.style.transform = originalTransform;
                                }
                            }
                            
                            frameIndex++;
                            setTimeout(glitchFrame, frameInterval);
                        }
                        
                        // Start glitching
                        glitchFrame();
                    }
                    
                    function scheduleNextGlitch() {
                        // More frequent glitches with varied intervals
                        const baseDelay = 2000; // Reduced base delay
                        const randomVariation = Math.random() * 3000;
                        // Occasional rapid sequence of glitches
                        const rapidSequence = Math.random() > 0.8;
                        
                        if (rapidSequence) {
                            // Schedule a quick series of glitches
                            let rapidCount = Math.floor(Math.random() * 3) + 2; // 2-4 rapid glitches
                            let nextDelay = 200;
                            
                            const scheduleRapid = () => {
                                setTimeout(() => {
                                    glitchRandomCharacters();
                                    rapidCount--;
                                    if (rapidCount > 0) {
                                        scheduleRapid();
                                    } else {
                                        setTimeout(glitchRandomCharacters, baseDelay + randomVariation);
                                    }
                                }, nextDelay);
                                nextDelay += 100 + Math.random() * 300; // Increasing intervals
                            };
                            
                            scheduleRapid();
                        } else {
                            setTimeout(glitchRandomCharacters, baseDelay + randomVariation);
                        }
                    }
                    
                    // Start the random glitching process immediately
                    glitchRandomCharacters();
                }
                
                // Ultra-responsive hover effects with advanced interactions
                function addUltraResponsiveHoverEffects(spans, chars) {
                    spans.forEach(span => {
                        if (span.classList.contains('space')) return;
                        
                        // Mouse enter effect with enhanced visual feedback
                        span.addEventListener('mouseenter', () => {
                            span.classList.add('user-hover');
                            
                            // Stop any ongoing animations
                            span.style.animation = 'none';
                            
                            // Randomly select a color scheme for this hover instance
                            const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
                            
                            // Apply dramatic visual change
                            span.style.color = scheme.primary;
                            span.style.transform = 'translateY(-10px) scale(1.5) rotate(5deg)';
                            span.style.textShadow = `0 0 15px ${scheme.glow}, 0 0 30px ${scheme.glow}`;
                            span.style.transition = 'all 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.0)';
                            span.style.zIndex = '100';
                            
                            // Create particle burst effect
                            createAdvancedSpark(span, true);
                            
                            // Temporarily scramble on hover with sophisticated effect
                            let scrambleCount = 0;
                            const maxScrambles = 3 + Math.floor(Math.random() * 3); // 3-5 scrambles
                            
                            function hoverScramble() {
                                if (scrambleCount >= maxScrambles || !span.classList.contains('user-hover')) return;
                                
                                const randomChar = chars[Math.floor(Math.random() * chars.length)];
                                span.textContent = randomChar;
                                
                                setTimeout(() => {
                                    span.textContent = span.dataset.finalChar;
                                    scrambleCount++;
                                    
                                    // Each scramble gets progressively faster
                                    const nextDelay = 60 - (scrambleCount * 10);
                                    setTimeout(hoverScramble, nextDelay);
                                }, 60);
                            }
                            
                            hoverScramble();
                            
                            // Create a ripple effect through neighboring spans
                            const allSpans = Array.from(spans);
                            const currentIndex = allSpans.indexOf(span);
                            
                            allSpans.forEach((neighborSpan, i) => {
                                if (neighborSpan.classList.contains('space')) return;
                                if (neighborSpan === span) return;
                                
                                const distance = Math.abs(i - currentIndex);
                                if (distance <= 5) { // Affect up to 5 characters away
                                    const intensity = Math.pow(0.7, distance); // Exponential falloff: 0.7, 0.49, 0.343, etc.
                                    
                                    // Calculate delay based on distance (ripple effect)
                                    const rippleDelay = distance * 30; // 30ms per character
                                    
                                    setTimeout(() => {
                                        if (!neighborSpan.classList.contains('user-hover') && neighborSpan.dataset.isGlitching !== 'true') {
                                            neighborSpan.style.transform = `translateY(${-7 * intensity}px) scale(${1 + 0.3 * intensity})`;
                                            neighborSpan.style.color = `hsl(${240 - distance * 10}, ${90 * intensity}%, 70%)`;
                                            neighborSpan.style.textShadow = `0 0 ${10 * intensity}px rgba(88, 101, 242, ${0.8 * intensity})`;
                                            neighborSpan.style.transition = 'all 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.0)';
                                            neighborSpan.style.zIndex = `${10 - distance}`;
                                        }
                                    }, rippleDelay);
                                }
                            });
                        });
                        
                        // Mouse leave effect with smooth return to normal
                        span.addEventListener('mouseleave', () => {
                            span.classList.remove('user-hover');
                            
                            // Smooth transition back
                            span.style.color = '#FFFFFF';
                            span.style.transform = 'translateY(0) scale(1) rotate(0deg)';
                            span.style.textShadow = '0 0 5px rgba(255, 255, 255, 0.3)';
                            span.style.zIndex = '1';
                            span.style.transition = 'all 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.0)';
                            
                            // Restore floating animation after a short delay
                            setTimeout(() => {
                                if (!span.matches(':hover') && span.dataset.isGlitching !== 'true') {
                                    const animationTypes = ['charFloat1', 'charFloat2', 'charFloat3'];
                                    const randomAnim = animationTypes[Math.floor(Math.random() * animationTypes.length)];
                                    span.style.animation = `${randomAnim} ${4 + Math.random() * 2}s ease-in-out infinite`;
                                    span.style.animationDelay = `${Math.random() * 2}s`;
                                }
                            }, 500);
                            
                            // Restore neighboring spans to normal
                            spans.forEach(neighborSpan => {
                                if (!neighborSpan.matches(':hover') && 
                                    !neighborSpan.classList.contains('space') && 
                                    !neighborSpan.classList.contains('user-hover') &&
                                    neighborSpan.dataset.isGlitching !== 'true') {
                                    
                                    neighborSpan.style.transform = 'translateY(0) scale(1)';
                                    neighborSpan.style.color = '#FFFFFF';
                                    neighborSpan.style.textShadow = '0 0 5px rgba(255, 255, 255, 0.3)';
                                    neighborSpan.style.zIndex = '1';
                                    neighborSpan.style.transition = 'all 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.0)';
                                    
                                    // Restore floating animation with a varied delay
                                    setTimeout(() => {
                                        if (!neighborSpan.matches(':hover') && 
                                            neighborSpan.dataset.isGlitching !== 'true' &&
                                            !neighborSpan.classList.contains('user-hover')) {
                                            
                                            const animationTypes = ['charFloat1', 'charFloat2', 'charFloat3'];
                                            const randomAnim = animationTypes[Math.floor(Math.random() * animationTypes.length)];
                                            neighborSpan.style.animation = `${randomAnim} ${4 + Math.random() * 2}s ease-in-out infinite`;
                                        }
                                    }, 200 + Math.random() * 300);
                                }
                            });
                        });
                    });
                }
            }
        } else {
            console.log("Hero title not found");
        }
        
        // Manually initialize chat
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) {
            console.log("Found chat container, adding messages");
            
            // Clear chat container
            chatContainer.innerHTML = '';
            
            // Add initial messages
            const messages = [
                { author: 'GamingWizard', text: 'Hey everyone! Excited about the new server features? 🎮', time: '2m ago', color: '#7289da' },
                { author: 'DesignMaster', text: 'Yeah, definitely! The new voice channels are amazing. ✨', time: '1m ago', color: '#43b581' },
                { author: 'CodeNinja', text: 'I\'ve been using them for my study groups. Works perfectly! 💻', time: '30s ago', color: '#faa61a' }
            ];
            
            messages.forEach((msg, idx) => {
                setTimeout(() => {
                    const messageEl = document.createElement('div');
                    messageEl.className = 'chat-message visible';
                    messageEl.innerHTML = `
                        <div class="message-avatar" style="background: ${msg.color};">
                            ${msg.author.charAt(0).toUpperCase()}
                        </div>
                        <div class="message-content">
                            <div class="message-author">
                                ${msg.author} 
                                <span class="message-timestamp">${msg.time}</span>
                            </div>
                            <div class="message-text">${msg.text}</div>
                        </div>
                    `;
                    chatContainer.appendChild(messageEl);
                    
                    // Scroll to bottom
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }, 500 + idx * 1000);
            });
            
            // Setup message input
            const messageInput = document.getElementById('userMessageInput');
            const sendButton = document.getElementById('sendMessageBtn');
            
            if (messageInput && sendButton) {
                const sendMessage = function() {
                    const text = messageInput.value.trim();
                    if (!text) return;
                    
                    // Add user message
                    const userMessageEl = document.createElement('div');
                    userMessageEl.className = 'chat-message user-message visible';
                    userMessageEl.innerHTML = `
                        <div class="message-avatar" style="background: linear-gradient(135deg, #5865F2 0%, #7c3aed 100%);">
                            Y
                        </div>
                        <div class="message-content">
                            <div class="message-author">
                                You
                                <span class="message-timestamp">just now</span>
                            </div>
                            <div class="message-text">${text}</div>
                        </div>
                    `;
                    chatContainer.appendChild(userMessageEl);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                    messageInput.value = '';
                    
                    // Auto-reply
                    setTimeout(() => {
                        const responses = [
                            "That's interesting! Tell me more. 🤔",
                            "I see what you mean. Great point! 👍",
                            "Thanks for sharing that with us! 😊"
                        ];
                        
                        const botMessageEl = document.createElement('div');
                        botMessageEl.className = 'chat-message bot-message visible';
                        botMessageEl.innerHTML = `
                            <div class="message-avatar" style="background: #ed4245;">
                                M
                            </div>
                            <div class="message-content">
                                <div class="message-author">
                                    ModBot
                                    <span class="message-timestamp">just now</span>
                                </div>
                                <div class="message-text">${responses[Math.floor(Math.random() * responses.length)]}</div>
                            </div>
                        `;
                        chatContainer.appendChild(botMessageEl);
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }, 1000);
                };
                
                sendButton.addEventListener('click', sendMessage);
                messageInput.addEventListener('keypress', e => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        sendMessage();
                    }
                });
            }
        } else {
            console.log("Chat container not found");
        }
    }, 500); // Reduced delay for faster initialization
});
</script>

<!-- Feature Sections -->
<main class="main-content">
    <section class="scroll-reveal" id="features">
        <?php include_once dirname(__DIR__) . '/components/landing-sections/feature-carousel.php'; ?>
    </section>

    <section class="scroll-reveal">
        <?php include_once dirname(__DIR__) . '/components/landing-sections/section-1.php'; ?>
    </section>

    <section class="scroll-reveal">
        <?php include_once dirname(__DIR__) . '/components/landing-sections/section-2.php'; ?>
    </section>

    <section class="scroll-reveal">
        <?php include_once dirname(__DIR__) . '/components/landing-sections/section-3.php'; ?>
    </section>
</main>

<!-- Modern Footer -->
<footer class="modern-footer">
    <div class="footer-container">
        <div class="footer-content">
            <div class="footer-brand">
                <h3>IMAGINE A PLACE</h3>
                <div class="language-selector">
                    <img src="<?php echo asset('/images/landing-page/discord-logo.webp'); ?>" alt="Flag" width="24" height="18">
                    <span>English, USA</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6,9 12,15 18,9"></polyline>
                    </svg>
                </div>
                <div class="social-links">
                    <a href="#" class="social-link">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                        </svg>
                    </a>
                    <a href="#" class="social-link">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                            <circle cx="4" cy="4" r="2"/>
                        </svg>
                    </a>
                    <a href="#" class="social-link">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                            <polyline points="2,17 12,12 22,17"/>
                        </svg>
                    </a>
                </div>
            </div>

            <div class="footer-links">
                <div class="link-column">
                    <h4>Product</h4>
                    <a href="#">Download</a>
                    <a href="#">Nitro</a>
                    <a href="#">Status</a>
                </div>
                <div class="link-column">
                    <h4>Company</h4>
                    <a href="#">About</a>
                    <a href="#">Jobs</a>
                    <a href="#">Brand</a>
                    <a href="#">Newsroom</a>
                </div>
                <div class="link-column">
                    <h4>Resources</h4>
                    <a href="#">College</a>
                    <a href="#">Support</a>
                    <a href="#">Safety</a>
                    <a href="#">Blog</a>
                </div>
                <div class="link-column">
                    <h4>Policies</h4>
                    <a href="#">Terms</a>
                    <a href="#">Privacy</a>
                    <a href="#">Cookie Settings</a>
                    <a href="#">Guidelines</a>
                </div>
            </div>
        </div>

        <div class="footer-bottom">
            <img src="<?php echo asset('/assets/landing-page/main-logo.svg'); ?>" alt="misvord" height="32">
            <a href="/register" class="footer-cta">Sign up</a>
        </div>
    </div>
</footer>

<?php
$content = ob_get_clean();
require_once dirname(__DIR__) . '/layout/main-app.php';
?>