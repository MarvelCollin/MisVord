class ScrambleText {    constructor() {
    this.chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    this.glitchChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    this.sparkleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    this.elements = [];
    this.isInitialized = false;
    
    this.init();
}    init() {
    if (this.isInitialized) return;
    
    document.addEventListener('DOMContentLoaded', () => {
        this.setupElements();
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
}    revealCharacter(span, index) {
    const char = span.dataset.char;
    
    span.textContent = char;
    span.classList.add('revealed');
    span.style.opacity = '1';
    span.style.color = '#FFFFFF';
    span.style.transform = 'translateY(0) scale(1)';
    span.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
    
    // Add sparkle effect on reveal
    this.createSparkleEffect(span);
}scrambleCharacter(span, scrambleCount) {
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
        }, i * 75); 
    }
}    createMagicParticles(element) {
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
    for (let i = 0; i < 6; i++) {
        const fragment = document.createElement('div');
        fragment.className = 'explosion-fragment';
        
        const angle = (i / 6) * Math.PI * 2;
        const distance = 20 + Math.random() * 15; 
        
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
    }, 2000);    }

easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

slowScrambleFastReveal(t) {
    if (t < 0.85) {
        return Math.pow(t / 0.85, 4) * 0.3;
    } else {
        const fastPhase = (t - 0.85) / 0.15;
        return 0.3 + (1 - 0.3) * this.easeOutCubic(fastPhase);
    }
}


createCelebrationBurst(span) {
    const burstCount = 6;
    
    for (let i = 0; i < burstCount; i++) {
        const burst = document.createElement('div');
        burst.className = 'celebration-particle';
        
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57', '#ff9ff3'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 1 + Math.random() * 2;
        const angle = (i / burstCount) * Math.PI * 2;
        const distance = 10 + Math.random() * 10;
        
        burst.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: celebrationBurst 0.5s ease-out forwards;
            z-index: 999;
            box-shadow: 0 0 8px ${color};
        `;
        
        burst.style.setProperty('--end-x', `${Math.cos(angle) * distance}px`);
        burst.style.setProperty('--end-y', `${Math.sin(angle) * distance}px`);
        
        span.appendChild(burst);
        setTimeout(() => burst.remove(), 500);
    }
}

startFloatingParticles(element) {
    const container = document.createElement('div');
    container.className = 'floating-particles-container';
    container.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
        z-index: -1;
    `;
    
    element.appendChild(container);
    
    const createParticle = () => {
        if (!element.isConnected) return;
        
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        
        const colors = ['#5865F2', '#57F287', '#FEE75C', '#EB459E'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 1 + Math.random() * 2;
        const startX = Math.random() * 100;
        const endX = startX + (Math.random() * 40 - 20);
        const duration = 5 + Math.random() * 10;
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            opacity: 0;
            bottom: -10px;
            left: ${startX}%;
            animation: floatingParticle ${duration}s ease-out forwards;
            box-shadow: 0 0 ${size * 2}px ${color};
            z-index: -1;
        `;
        
        particle.style.setProperty('--end-x', `${endX - startX}px`);
        particle.style.setProperty('--end-y', `-${100 + Math.random() * 50}px`);
        
        container.appendChild(particle);
        setTimeout(() => {
            if (particle.parentNode) {
                particle.remove();
            }
        }, duration * 1000);
        
        if (element.isConnected) {
            setTimeout(createParticle, Math.random() * 1000 + 500);
        }
    };
    
    for (let i = 0; i < 3; i++) {
        setTimeout(createParticle, Math.random() * 1000);
    }
}

addGentleMovement(span) {
    const moveX = Math.random() * 4 - 2;
    const moveY = Math.random() * 4 - 2;
    const rotate = Math.random() * 6 - 3;
    const scale = 1 + Math.random() * 0.1 - 0.05;
    const duration = 0.8 + Math.random() * 0.4;
    
    span.style.transition = `transform ${duration}s cubic-bezier(0.34, 1.56, 0.64, 1)`;
    span.style.transform = `translateX(${moveX}px) translateY(${moveY}px) rotate(${rotate}deg) scale(${scale})`;
    
    setTimeout(() => {
        span.style.transition = `transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)`;
        span.style.transform = `scale(1)`;
    }, duration * 1000);
}

addGlowPulse(span) {
    const originalShadow = span.style.textShadow;
    const hue = Math.random() > 0.5 ? 240 + Math.random() * 60 : 0 + Math.random() * 60;
    
    span.style.transition = 'text-shadow 0.8s ease-in-out';
    span.style.textShadow = `
        0 0 15px hsla(${hue}, 80%, 70%, 0.8),
        0 0 30px hsla(${hue}, 80%, 60%, 0.5)
    `;
    
    setTimeout(() => {
        span.style.textShadow = originalShadow;
    }, 800);
}

addCharacterTwirl(span) {
    const originalTransform = span.style.transform;
    const rotations = Math.random() > 0.5 ? 1 : -1;
    
    span.style.transition = 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
    span.style.transform = `rotate(${rotations * 360}deg) scale(1.2)`;
    
    setTimeout(() => {
        span.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        span.style.transform = originalTransform;
    }, 1000);
}
}

const scrambleText = new ScrambleText();