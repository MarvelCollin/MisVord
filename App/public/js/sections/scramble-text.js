class ScrambleText {    constructor() {
        this.chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
        this.glitchChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        this.sparkleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        this.elements = [];
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        document.addEventListener('DOMContentLoaded', () => {
            this.setupElements();
            this.injectStyles();
            this.startAnimations();
        });
        
        this.isInitialized = true;
    }

    setupElements() {
        const scrambleElements = document.querySelectorAll('.scramble-text');
        
        scrambleElements.forEach((element, index) => {
            const originalText = element.getAttribute('data-text') || element.textContent.trim();
            
            if (!originalText) return;
            
            element.style.position = 'relative';
            element.style.display = 'inline-block';
            element.innerHTML = '';
            
            const spans = this.createCharacterSpans(originalText, element);
            
            this.elements.push({
                element,
                spans,
                originalText,
                index,
                isAnimating: false,
                completed: false
            });
        });
    }

    createCharacterSpans(text, container) {
        const spans = [];
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const span = document.createElement('span');
            
            span.className = 'scramble-char';
            span.dataset.char = char;
            span.dataset.index = i;
            
            span.style.cssText = `
                display: inline-block;
                position: relative;
                opacity: 0;                transform: translateY(20px) scale(0.8);
                transition: all 1.2s cubic-bezier(0.23, 1, 0.32, 1);
                will-change: transform, opacity, color, text-shadow;
                text-shadow: 0 0 10px transparent;
                color: transparent;
            `;
            
            if (char === ' ') {
                span.innerHTML = '&nbsp;';
                span.classList.add('space');
                span.style.opacity = '1';
                span.style.transform = 'none';
            } else {
                span.textContent = char;
            }
            
            container.appendChild(span);
            spans.push(span);
        }
        
        return spans;
    }    startAnimations() {
        this.elements.forEach((elementData, index) => {
            setTimeout(() => {
                this.animateElement(elementData);
            }, 500 + (index * 300)); // Much faster start timing
        });
    }    animateElement(elementData) {
        const { spans, originalText } = elementData;
        elementData.isAnimating = true;
        
        // Get only non-space characters for animation
        const nonSpaceSpans = spans.filter(span => !span.classList.contains('space'));
        
        const scrambleDuration = 1200; // Each character scrambles for 1.2 seconds
        const scrambleInterval = 50; // Very fast scramble updates
        const characterStartDelay = 100; // Start next character after only 100ms
        
        // Start each character with a staggered delay (overlapping)
        nonSpaceSpans.forEach((span, index) => {
            setTimeout(() => {
                this.animateCharacter(span, index, scrambleDuration, scrambleInterval);
            }, index * characterStartDelay);
        });
        
        // Complete animation when the last character finishes
        const totalAnimationTime = (nonSpaceSpans.length - 1) * characterStartDelay + scrambleDuration;
        setTimeout(() => {
            this.completeAnimation(elementData);
        }, totalAnimationTime + 500);
    }

    animateCharacter(span, index, scrambleDuration, scrambleInterval) {
        let scrambleCount = 0;
        const maxScrambles = scrambleDuration / scrambleInterval;
        
        const scrambleLoop = () => {
            if (scrambleCount < maxScrambles) {
                this.scrambleCharacter(span, scrambleCount);
                scrambleCount++;
                setTimeout(scrambleLoop, scrambleInterval);
            } else {
                // Reveal this character
                this.revealCharacter(span, index);
            }
        };
        
        scrambleLoop();
    }

    revealCharacter(span, index) {
        const char = span.dataset.char;
        
        span.textContent = char;
        span.classList.add('revealed');
        span.style.opacity = '1';
        span.style.color = '#FFFFFF';
        span.style.transform = 'translateY(0) scale(1)';
        span.style.textShadow = `
            0 0 20px rgba(255, 255, 255, 0.5),
            0 0 30px rgba(88, 101, 242, 0.3),
            0 0 40px rgba(88, 101, 242, 0.1)
        `;
        
        // Add sparkle effect on reveal
        this.createSparkleEffect(span);
          // Faster glow effect
        setTimeout(() => {
            span.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
        }, 100); // Reduced from 200ms to 100ms
    }    scrambleCharacter(span, scrambleCount) {
        const intensity = Math.min(scrambleCount / 10, 1); // Intensity builds up over time
        const isGlitch = Math.random() < (0.15 + intensity * 0.1); // More glitches as it progresses
        const isPulse = Math.random() < 0.3; // Random pulse effect
        const charSet = isGlitch ? this.glitchChars : this.chars;
        const randomChar = charSet[Math.floor(Math.random() * charSet.length)];
          span.textContent = randomChar;
        
        // Enhanced opacity with pulsing
        const baseOpacity = 0.8 + (intensity * 0.2);
        span.style.opacity = isPulse ? baseOpacity * 0.7 : baseOpacity;
        
        // Dynamic color variations
        let color;
        if (isGlitch) {
            color = `hsl(${330 + Math.random() * 30}, 80%, ${50 + Math.random() * 20}%)`; // Red variations
        } else {
            color = `hsl(${235 + Math.random() * 25}, 80%, ${60 + Math.random() * 20}%)`; // Blue variations
        }
        span.style.color = color;
          // Enhanced movements with intensity
        const moveRange = 2 + intensity * 2;
        const scaleRange = 0.05 + intensity * 0.05;
        const rotateRange = 2 + intensity * 3;
        
        span.style.transform = `
            translateY(${Math.random() * moveRange - moveRange/2}px) 
            translateX(${Math.random() * moveRange/2 - moveRange/4}px) 
            scale(${0.95 + Math.random() * scaleRange})
            rotate(${Math.random() * rotateRange - rotateRange/2}deg)
        `;
          // Dynamic multi-layer glow effects
        const glowIntensity = 0.3 + intensity * 0.4;
        const pulseGlow = isPulse ? glowIntensity * 1.5 : glowIntensity;
        
        span.style.textShadow = `
            0 0 ${8 + intensity * 10}px ${color.replace('hsl', 'hsla').replace(')', `, ${pulseGlow})`)},
            0 0 ${15 + intensity * 15}px ${color.replace('hsl', 'hsla').replace(')', `, ${pulseGlow * 0.6})`)},
            0 0 ${25 + intensity * 20}px ${color.replace('hsl', 'hsla').replace(')', `, ${pulseGlow * 0.3})`)}
        `;
        
        // Add random spark effects occasionally
        if (Math.random() < 0.1 + intensity * 0.1) {
            this.createScrambleSpark(span);
        }        // Enhanced transition with easing variations
        const easingTypes = ['ease-out', 'ease-in-out', 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'];
        const randomEasing = easingTypes[Math.floor(Math.random() * easingTypes.length)];
        span.style.transition = `all 0.1s ${randomEasing}`;}    completeAnimation(elementData) {
        const { spans, element } = elementData;
        elementData.isAnimating = false;
        elementData.completed = true;
        
        // Add final glow pulse to entire text
        this.addFinalGlowPulse(element);
        
        // Enhanced completion effects for each character
        spans.forEach((span, index) => {
            if (!span.classList.contains('space') && span.classList.contains('revealed')) {
                setTimeout(() => {
                    // Add multiple floating effects
                    span.classList.add('floating', 'breathing', 'shimmer');
                    
                    // Add staggered character celebration
                    this.addCharacterCelebration(span, index);
                    
                    // Start continuous character effects
                    this.startContinuousEffects(span, index);
                }, index * 100);
            }
        });
        
        // Start ambient effects after completion
        setTimeout(() => {
            this.setupInteractiveEffects(elementData);
            this.startAmbientEffects(elementData);
            this.startFloatingParticles(element);
        }, 3000);
    }

    addCharacterCelebration(span, index) {
        // Celebration bounce effect
        span.style.animation = `celebrationBounce 0.8s ease-out ${index * 0.05}s`;
        
        // Add celebration sparkles
        setTimeout(() => {
            this.createCelebrationBurst(span);
        }, index * 50);
        
        // Reset animation after celebration
        setTimeout(() => {
            span.style.animation = '';
        }, 1000 + index * 50);
    }

    startContinuousEffects(span, index) {
        // Random gentle movements
        setInterval(() => {
            if (!span._isHovering && Math.random() < 0.3) {
                this.addGentleMovement(span);
            }
        }, 3000 + Math.random() * 2000);
        
        // Random glow pulses
        setInterval(() => {
            if (!span._isHovering && Math.random() < 0.2) {
                this.addGlowPulse(span);
            }
        }, 5000 + Math.random() * 3000);
        
        // Occasional character twirl
        setInterval(() => {
            if (!span._isHovering && Math.random() < 0.1) {
                this.addCharacterTwirl(span);
            }
        }, 8000 + Math.random() * 4000);
    }

    setupInteractiveEffects(elementData) {
        const { spans } = elementData;
        
        spans.forEach(span => {
            if (span.classList.contains('space')) return;
            
            span.addEventListener('mouseenter', () => this.onCharacterHover(span));
            span.addEventListener('mouseleave', () => this.onCharacterLeave(span));
            span.addEventListener('click', () => this.onCharacterClick(span));
        });
    }

    onCharacterHover(span) {
        if (span._isHovering) return;
        span._isHovering = true;
        
        const originalChar = span.dataset.char;
        let scrambleCount = 0;
        const maxScrambles = 3;
          const hoverEffect = () => {
            if (scrambleCount < maxScrambles && span._isHovering) {
                const sparkleChar = this.sparkleChars[Math.floor(Math.random() * this.sparkleChars.length)];
                span.textContent = sparkleChar;
                
                const hue = 180 + Math.random() * 60;
                span.style.color = `hsl(${hue}, 80%, 70%)`;
                span.style.transform = `scale(1.2) rotate(${Math.random() * 10 - 5}deg)`;
                span.style.textShadow = `
                    0 0 20px hsl(${hue}, 80%, 70%),
                    0 0 30px hsl(${hue}, 80%, 70%),
                    0 0 40px hsl(${hue}, 80%, 70%)
                `;
                
                this.createMagicParticles(span);
                scrambleCount++;
                
                setTimeout(hoverEffect, 200);
            } else if (span._isHovering) {
                span.textContent = originalChar;
                span.style.color = '#FFFFFF';
                span.style.transform = 'scale(1.05)';
                span.style.textShadow = '0 0 15px rgba(255, 255, 255, 0.8)';
            }
        };
        
        hoverEffect();
    }

    onCharacterLeave(span) {
        span._isHovering = false;
        
        setTimeout(() => {
            if (!span._isHovering) {
                span.textContent = span.dataset.char;
                span.style.color = '#FFFFFF';
                span.style.transform = 'scale(1)';
                span.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
            }
        }, 100);
    }

    onCharacterClick(span) {
        this.createExplosionEffect(span);
        
        // Temporary transformation
        span.style.transform = 'scale(1.5) rotate(360deg)';
        span.style.color = '#ff6b6b';
        span.style.textShadow = '0 0 30px #ff6b6b';
        
        setTimeout(() => {
            span.style.transform = 'scale(1)';
            span.style.color = '#FFFFFF';
            span.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
        }, 500);
    }

    startAmbientEffects(elementData) {
        const { spans } = elementData;
        const nonSpaceSpans = spans.filter(span => !span.classList.contains('space'));
          const ambientScramble = () => {
            if (Math.random() < 0.05) { // Much less frequent
                const randomSpan = nonSpaceSpans[Math.floor(Math.random() * nonSpaceSpans.length)];
                if (!randomSpan._isHovering && !randomSpan._isAnimating) {
                    this.quickScramble(randomSpan);
                }
            }
            
            setTimeout(ambientScramble, 4000 + Math.random() * 6000); // Slower ambient effects
        };
        
        setTimeout(ambientScramble, 8000); // Longer initial delay
    }    quickScramble(span) {
        span._isAnimating = true;
        const originalChar = span.dataset.char;
        let count = 0;
        
        const scramble = () => {
            if (count < 2) { // Shorter scramble
                const randomChar = this.chars[Math.floor(Math.random() * this.chars.length)];
                span.textContent = randomChar;
                span.style.color = '#57f287';
                span.style.transform = 'scale(1.05)'; // Subtle scale
                count++;
                setTimeout(scramble, 150); // Slower scramble
            } else {
                span.textContent = originalChar;
                span.style.color = '#FFFFFF';
                span.style.transform = 'scale(1)';
                span._isAnimating = false;
            }
        };
          scramble();
    }

    createScrambleSpark(element) {
        const spark = document.createElement('div');
        spark.className = 'scramble-spark';
        
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57', '#ff9ff3'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 1 + Math.random() * 2;
        const angle = Math.random() * Math.PI * 2;
        const distance = 8 + Math.random() * 8;
        
        spark.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: scrambleSpark 0.4s ease-out forwards;
            z-index: 999;
            box-shadow: 0 0 8px ${color};
        `;
        
        spark.style.setProperty('--end-x', `${Math.cos(angle) * distance}px`);
        spark.style.setProperty('--end-y', `${Math.sin(angle) * distance}px`);
        
        element.appendChild(spark);
        setTimeout(() => spark.remove(), 400);
    }

    createSparkleEffect(element) {
        // Reduced from 3 to 2 sparkles for better performance
        for (let i = 0; i < 2; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'sparkle-particle';
                
                const size = 1.5 + Math.random() * 2; // Smaller particles
                const angle = Math.random() * Math.PI * 2;
                const distance = 12 + Math.random() * 12; // Shorter distance
                
                sparkle.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    background: linear-gradient(45deg, #fff, #5865F2);
                    border-radius: 50%;
                    pointer-events: none;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    animation: sparkleEffect 0.6s ease-out forwards;
                    z-index: 1000;
                `;
                
                sparkle.style.setProperty('--end-x', `${Math.cos(angle) * distance}px`);
                sparkle.style.setProperty('--end-y', `${Math.sin(angle) * distance}px`);
                
                element.appendChild(sparkle);
                
                setTimeout(() => sparkle.remove(), 600);
            }, i * 75); // Slower stagger
        }
    }    createMagicParticles(element) {
        // Reduced from 5 to 3 particles for better performance
        for (let i = 0; i < 3; i++) {
            const particle = document.createElement('div');
            particle.className = 'magic-particle';
            
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particle.style.cssText = `
                position: absolute;
                width: 3px;
                height: 3px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation: magicParticle 0.8s ease-out forwards;
                box-shadow: 0 0 6px ${color};
                z-index: 999;
            `;
            
            element.appendChild(particle);
            setTimeout(() => particle.remove(), 800);
        }
    }    createExplosionEffect(element) {
        // Reduced from 8 to 6 fragments for better performance
        for (let i = 0; i < 6; i++) {
            const fragment = document.createElement('div');
            fragment.className = 'explosion-fragment';
            
            const angle = (i / 6) * Math.PI * 2;
            const distance = 20 + Math.random() * 15; // Shorter distance
            
            fragment.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: #ff6b6b;
                border-radius: 50%;
                pointer-events: none;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                animation: explosionFragment 0.5s ease-out forwards;
                z-index: 1001;
            `;
            
            fragment.style.setProperty('--end-x', `${Math.cos(angle) * distance}px`);
            fragment.style.setProperty('--end-y', `${Math.sin(angle) * distance}px`);
            
            element.appendChild(fragment);
            setTimeout(() => fragment.remove(), 500);
        }
    }createCompletionSparkle(element) {
        // Reduced from 6 to 3 sparkles for better performance
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.className = 'completion-sparkle';
                
                const size = 2 + Math.random() * 2; // Smaller particles
                const angle = Math.random() * Math.PI * 2;
                const distance = 15 + Math.random() * 15; // Shorter distance
                
                sparkle.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    background: linear-gradient(45deg, #fff, #5865F2);
                    border-radius: 50%;
                    pointer-events: none;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    animation: completionSparkle 0.8s ease-out forwards;
                    z-index: 1000;
                    box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
                `;
                
                sparkle.style.setProperty('--end-x', `${Math.cos(angle) * distance}px`);
                sparkle.style.setProperty('--end-y', `${Math.sin(angle) * distance}px`);
                
                element.appendChild(sparkle);
                setTimeout(() => sparkle.remove(), 800);
            }, i * 100); // Slower stagger
        }
    }

    addFinalGlowPulse(element) {
        element.style.animation = 'finalGlowPulse 2s ease-in-out';
        
        setTimeout(() => {
            element.style.animation = '';
        }, 2000);
    }

    injectStyles() {
        if (document.getElementById('scramble-text-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'scramble-text-styles';
        style.textContent = `
            .scramble-char {
                cursor: pointer;
                user-select: none;
            }
              .scramble-char.floating {
                animation: gentleFloat 6s ease-in-out infinite;
                will-change: transform;
            }
            
            .scramble-char.floating:nth-child(odd) {
                animation-delay: -3s;
            }
            
            @keyframes gentleFloat {
                0%, 100% {
                    transform: translateY(0px) scale(1);
                }
                50% {
                    transform: translateY(-1px) scale(1.01);
                }
            }
            
            @keyframes sparkleEffect {
                0% {
                    transform: translate(-50%, -50%) scale(0) rotate(0deg);
                    opacity: 1;
                }
                50% {
                    transform: translate(calc(-50% + var(--end-x, 0px) * 0.5), calc(-50% + var(--end-y, 0px) * 0.5)) scale(1) rotate(180deg);
                    opacity: 1;
                }
                100% {
                    transform: translate(calc(-50% + var(--end-x, 0px)), calc(-50% + var(--end-y, 0px))) scale(0) rotate(360deg);
                    opacity: 0;
                }
            }
            
            @keyframes magicParticle {
                0% {
                    transform: scale(0) rotate(0deg);
                    opacity: 1;
                }
                50% {
                    transform: scale(1) rotate(180deg);
                    opacity: 1;
                }
                100% {
                    transform: scale(0) rotate(360deg);
                    opacity: 0;
                }
            }
            
            @keyframes explosionFragment {
                0% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(calc(-50% + var(--end-x, 0px)), calc(-50% + var(--end-y, 0px))) scale(0);
                    opacity: 0;
                }
            }
              @keyframes completionSparkle {
                0% {
                    transform: translate(-50%, -50%) scale(0) rotate(0deg);
                    opacity: 1;
                }
                50% {
                    transform: translate(calc(-50% + var(--end-x, 0px) * 0.5), calc(-50% + var(--end-y, 0px) * 0.5)) scale(1) rotate(180deg);
                    opacity: 1;
                }
                100% {
                    transform: translate(calc(-50% + var(--end-x, 0px)), calc(-50% + var(--end-y, 0px))) scale(0) rotate(360deg);
                    opacity: 0;
                }
            }
              @keyframes finalGlowPulse {
                0% {
                    filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.3));
                }
                25% {
                    filter: drop-shadow(0 5px 25px rgba(88, 101, 242, 0.5)) drop-shadow(0 0 40px rgba(255, 255, 255, 0.3));
                }
                50% {
                    filter: drop-shadow(0 5px 35px rgba(88, 101, 242, 0.7)) drop-shadow(0 0 60px rgba(255, 255, 255, 0.5));
                    transform: scale(1.02);
                }
                75% {
                    filter: drop-shadow(0 5px 25px rgba(88, 101, 242, 0.5)) drop-shadow(0 0 40px rgba(255, 255, 255, 0.3));
                }
                100% {
                    filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.3));
                    transform: scale(1);
                }
            }
            
            @keyframes scrambleSpark {
                0% {
                    transform: translate(-50%, -50%) scale(0) rotate(0deg);
                    opacity: 1;
                }
                50% {
                    transform: translate(calc(-50% + var(--end-x, 0px) * 0.5), calc(-50% + var(--end-y, 0px) * 0.5)) scale(1) rotate(180deg);
                    opacity: 1;
                }
                100% {
                    transform: translate(calc(-50% + var(--end-x, 0px)), calc(-50% + var(--end-y, 0px))) scale(0) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        
        document.head.appendChild(style);
    }    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    slowScrambleFastReveal(t) {
        // Characters scramble for 85% of the time, then reveal quickly in the last 15%
        if (t < 0.85) {
            // Very slow reveal during scrambling phase
            return Math.pow(t / 0.85, 4) * 0.3; // Only reveal 30% of characters during 85% of time
        } else {
            // Fast reveal in the final 15%
            const fastPhase = (t - 0.85) / 0.15;
            return 0.3 + (1 - 0.3) * this.easeOutCubic(fastPhase);
        }
    }
}

// Initialize the scramble text system
const scrambleText = new ScrambleText();
