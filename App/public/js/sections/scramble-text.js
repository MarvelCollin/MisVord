class ScrambleText {
  constructor() {
    this.chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    this.glitchChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    this.sparkleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    this.elements = [];
    this.isInitialized = false;
    this.activeIntervals = new Set();
    this.activeTimeouts = new Set();
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    if (this.isInitialized) return;

    document.addEventListener("DOMContentLoaded", () => {
      this.setupElements();
      this.startAnimations();
    });

    this.isInitialized = true;
  }

  setupElements() {
    const scrambleElements = document.querySelectorAll(".scramble-text");

    scrambleElements.forEach((element, index) => {
      const originalText =
        element.getAttribute("data-text") || element.textContent.trim();

      if (!originalText) return;

      element.style.position = "relative";
      element.style.display = "inline-block";
      element.innerHTML = "";

      const spans = this.createCharacterSpans(originalText, element);

      this.elements.push({
        element,
        spans,
        originalText,
        index,
        isAnimating: false,
        completed: false,
      });
    });
  }

  createCharacterSpans(text, container) {
    const spans = [];
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const span = document.createElement("span");

      span.className = "scramble-char";
      span.dataset.char = char;
      span.dataset.index = i;

      span.style.cssText = `
            display: inline-block;
            position: relative;
            opacity: 0;
            transform: translateY(20px) scale(0.8);
            will-change: transform, opacity;
        `;

      if (char === " ") {
        span.innerHTML = "&nbsp;";
        span.classList.add("space");
        span.style.opacity = "1";
        span.style.transform = "none";
      } else {
        span.textContent = char;
      }

      fragment.appendChild(span);
      spans.push(span);
    }
    
    container.appendChild(fragment);
    return spans;
  }

  startAnimations() {
    this.elements.forEach((elementData, index) => {
      setTimeout(() => {
        this.animateElement(elementData);
      }, 500 + index * 300);
    });
  }
  animateElement(elementData) {
    const { spans, originalText } = elementData;
    elementData.isAnimating = true;

    const nonSpaceSpans = spans.filter(
      (span) => !span.classList.contains("space")
    );

    const scrambleDuration = 1200;
    const scrambleInterval = 50;
    const characterStartDelay = 100;

    nonSpaceSpans.forEach((span, index) => {
      setTimeout(() => {
        this.animateCharacter(span, index, scrambleDuration, scrambleInterval);
      }, index * characterStartDelay);
    });

    const totalAnimationTime =
      (nonSpaceSpans.length - 1) * characterStartDelay + scrambleDuration;
    setTimeout(() => {
      this.completeAnimation(elementData);
    }, totalAnimationTime + 500);
  }

  animateCharacter(span, index, scrambleDuration, scrambleInterval) {
    let scrambleCount = 0;
    const maxScrambles = Math.min(scrambleDuration / scrambleInterval, 15);
    let animationFrame;

    const scrambleLoop = () => {
      if (scrambleCount < maxScrambles) {
        this.scrambleCharacter(span, scrambleCount);
        scrambleCount++;
        animationFrame = requestAnimationFrame(() => {
          const timeout = setTimeout(scrambleLoop, scrambleInterval);
          this.activeTimeouts.add(timeout);
        });
      } else {
        this.revealCharacter(span, index);
      }
    };

    scrambleLoop();
  }
  revealCharacter(span, index) {
    const char = span.dataset.char;

    span.textContent = char;
    span.classList.add("revealed");
    span.style.cssText += `
      opacity: 1;
      color: #FFFFFF;
      transform: translateY(0) scale(1);
      transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
    `;

    if (!this.isReducedMotion && Math.random() < 0.7) {
      this.createOptimizedSparkle(span);
    }
  }
  scrambleCharacter(span, scrambleCount) {
    const intensity = Math.min(scrambleCount / 8, 1);
    const isGlitch = Math.random() < 0.1;
    const charSet = isGlitch ? this.glitchChars : this.chars;
    const randomChar = charSet[Math.floor(Math.random() * charSet.length)];
    
    span.textContent = randomChar;

    const baseOpacity = 0.7 + intensity * 0.3;
    span.style.opacity = baseOpacity;

    if (isGlitch) {
      span.style.color = `hsl(${330 + Math.random() * 30}, 70%, 60%)`;
    } else {
      span.style.color = `hsl(${235 + Math.random() * 25}, 70%, 65%)`;
    }

    const moveRange = 1 + intensity;
    span.style.transform = `
        translateY(${Math.random() * moveRange - moveRange / 2}px) 
        translateX(${(Math.random() * moveRange) / 2 - moveRange / 4}px) 
        scale(${0.95 + Math.random() * 0.1})
    `;

    if (!this.isReducedMotion && Math.random() < 0.05) {
      this.createOptimizedSpark(span);
    }
  }

  completeAnimation(elementData) {
    const { spans, element } = elementData;
    elementData.isAnimating = false;
    elementData.completed = true;

    if (!this.isReducedMotion) {
      this.addFinalGlowPulse(element);
    }

    spans.forEach((span, index) => {
      if (!span.classList.contains("space") && span.classList.contains("revealed")) {
        const timeout = setTimeout(() => {
          span.classList.add("floating");
          if (!this.isReducedMotion) {
            this.addOptimizedCelebration(span, index);
          }
        }, index * 50);
        this.activeTimeouts.add(timeout);
      }
    });

    const timeout = setTimeout(() => {
      this.setupInteractiveEffects(elementData);
      if (!this.isReducedMotion) {
        this.startOptimizedAmbientEffects(elementData);
        this.startWaveAnimation(element);
      }
    }, 300);
    this.activeTimeouts.add(timeout);
  }

  startWaveAnimation(element) {
    if (element.classList.contains('hero-title')) {
      const timeout = setTimeout(() => {
        element.classList.add('wave-active');
        element.classList.add('animate-float-title');
        if (!this.isReducedMotion) {
          element.classList.add('glow-active');
          this.addOptimizedTitleEffects(element);
        }
      }, 200);
      this.activeTimeouts.add(timeout);
    }
  }

  addOptimizedTitleEffects(element) {
    const spans = element.querySelectorAll('.scramble-char');
    
    spans.forEach((span, index) => {
      if (!span.classList.contains('space')) {
        span.classList.add('wave-char');
        span.style.animationDelay = `${index * 0.1}s`;
      }
    });

    if (!this.isReducedMotion) {
      const sparkleInterval = setInterval(() => {
        if (Math.random() < 0.2) {
          this.addOptimizedTitleSparkle(element);
        }
      }, 3000);
      this.activeIntervals.add(sparkleInterval);
    }
  }

  addOptimizedTitleSparkle(element) {
    const sparkle = document.createElement('div');
    sparkle.className = 'title-sparkle';
    
    const rect = element.getBoundingClientRect();
    const x = Math.random() * rect.width;
    const y = Math.random() * rect.height;
    
    sparkle.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 3px;
      height: 3px;
      background: linear-gradient(45deg, #ffffff, #5865F2);
      border-radius: 50%;
      pointer-events: none;
      animation: titleSparkle 1s ease-out forwards;
      z-index: 1000;
    `;
    
    element.appendChild(sparkle);
    const timeout = setTimeout(() => sparkle.remove(), 1000);
    this.activeTimeouts.add(timeout);
  }
  addOptimizedCelebration(span, index) {
    span.style.animation = `celebrationBounce 0.6s ease-out ${index * 0.02}s`;

    const timeout = setTimeout(() => {
      span.style.animation = "";
    }, 600 + index * 20);
    this.activeTimeouts.add(timeout);
  }

  startOptimizedAmbientEffects(elementData) {
    const { spans } = elementData;
    const nonSpaceSpans = spans.filter(span => !span.classList.contains("space"));
    
    const ambientScramble = () => {
      if (Math.random() < 0.03) {
        const randomSpan = nonSpaceSpans[Math.floor(Math.random() * nonSpaceSpans.length)];
        if (!randomSpan._isHovering && !randomSpan._isAnimating) {
          this.quickScramble(randomSpan);
        }
      }

      const timeout = setTimeout(ambientScramble, 6000 + Math.random() * 4000);
      this.activeTimeouts.add(timeout);
    };

    const timeout = setTimeout(ambientScramble, 10000);
    this.activeTimeouts.add(timeout);
  }

  setupInteractiveEffects(elementData) {
    const { spans } = elementData;

    spans.forEach((span) => {
      if (span.classList.contains("space")) return;

      span.addEventListener("mouseenter", () => this.onCharacterHover(span));
      span.addEventListener("mouseleave", () => this.onCharacterLeave(span));
      span.addEventListener("click", () => this.onCharacterClick(span));
    });
  }

  onCharacterHover(span) {
    if (span._isHovering || this.isReducedMotion) return;
    span._isHovering = true;

    const originalChar = span.dataset.char;
    let scrambleCount = 0;
    const maxScrambles = 2;
    
    const hoverEffect = () => {
      if (scrambleCount < maxScrambles && span._isHovering) {
        const sparkleChar = this.sparkleChars[Math.floor(Math.random() * this.sparkleChars.length)];
        span.textContent = sparkleChar;

        const hue = 180 + Math.random() * 60;
        span.style.color = `hsl(${hue}, 70%, 65%)`;
        span.style.transform = `scale(1.15)`;

        scrambleCount++;
        const timeout = setTimeout(hoverEffect, 150);
        this.activeTimeouts.add(timeout);
      } else if (span._isHovering) {
        span.textContent = originalChar;
        span.style.color = "#FFFFFF";
        span.style.transform = "scale(1.05)";
      }
    };

    hoverEffect();
  }

  onCharacterLeave(span) {
    span._isHovering = false;

    const timeout = setTimeout(() => {
      if (!span._isHovering) {
        span.textContent = span.dataset.char;
        span.style.color = "#FFFFFF";
        span.style.transform = "scale(1)";
        span.style.textShadow = "";
      }
    }, 50);
    this.activeTimeouts.add(timeout);
  }

  onCharacterClick(span) {
    if (this.isReducedMotion) return;
    
    this.createOptimizedExplosion(span);

    span.style.transform = "scale(1.3)";
    span.style.color = "#ff6b6b";

    const timeout = setTimeout(() => {
      span.style.transform = "scale(1)";
      span.style.color = "#FFFFFF";
    }, 300);
    this.activeTimeouts.add(timeout);
  }

  startAmbientEffects(elementData) {
    const { spans } = elementData;
    const nonSpaceSpans = spans.filter(
      (span) => !span.classList.contains("space")
    );
    const ambientScramble = () => {
      if (Math.random() < 0.05) {
        const randomSpan =
          nonSpaceSpans[Math.floor(Math.random() * nonSpaceSpans.length)];
        if (!randomSpan._isHovering && !randomSpan._isAnimating) {
          this.quickScramble(randomSpan);
        }
      }

      setTimeout(ambientScramble, 4000 + Math.random() * 6000);
    };

    setTimeout(ambientScramble, 8000);
  }
  quickScramble(span) {
    span._isAnimating = true;
    const originalChar = span.dataset.char;
    let count = 0;

    const scramble = () => {
      if (count < 2) {
        const randomChar = this.chars[Math.floor(Math.random() * this.chars.length)];
        span.textContent = randomChar;
        span.style.color = "#57f287";
        span.style.transform = "scale(1.02)";
        count++;
        const timeout = setTimeout(scramble, 100);
        this.activeTimeouts.add(timeout);
      } else {
        span.textContent = originalChar;
        span.style.color = "#FFFFFF";
        span.style.transform = "scale(1)";
        span._isAnimating = false;
      }
    };
    scramble();
  }

  createOptimizedSpark(element) {
    const spark = document.createElement("div");
    spark.className = "scramble-spark";

    const size = 1;
    const angle = Math.random() * Math.PI * 2;
    const distance = 4 + Math.random() * 4;

    spark.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: #5865F2;
        border-radius: 50%;
        pointer-events: none;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: scrambleSpark 0.3s ease-out forwards;
        z-index: 999;
    `;

    spark.style.setProperty("--end-x", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--end-y", `${Math.sin(angle) * distance}px`);

    element.appendChild(spark);
    const timeout = setTimeout(() => spark.remove(), 300);
    this.activeTimeouts.add(timeout);
  }

  createOptimizedSparkle(element) {
    const sparkle = document.createElement("div");
    sparkle.className = "sparkle-particle";

    const size = 1.5;
    const angle = Math.random() * Math.PI * 2;
    const distance = 8 + Math.random() * 8;

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
        animation: sparkleEffect 0.4s ease-out forwards;
        z-index: 1000;
    `;

    sparkle.style.setProperty("--end-x", `${Math.cos(angle) * distance}px`);
    sparkle.style.setProperty("--end-y", `${Math.sin(angle) * distance}px`);

    element.appendChild(sparkle);
    const timeout = setTimeout(() => sparkle.remove(), 400);
    this.activeTimeouts.add(timeout);
  }

  createOptimizedExplosion(element) {
    for (let i = 0; i < 4; i++) {
      const fragment = document.createElement("div");
      fragment.className = "explosion-fragment";

      const angle = (i / 4) * Math.PI * 2;
      const distance = 12 + Math.random() * 8;

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
        animation: explosionFragment 0.4s ease-out forwards;
        z-index: 1001;
      `;

      fragment.style.setProperty("--end-x", `${Math.cos(angle) * distance}px`);
      fragment.style.setProperty("--end-y", `${Math.sin(angle) * distance}px`);

      element.appendChild(fragment);
      const timeout = setTimeout(() => fragment.remove(), 400);
      this.activeTimeouts.add(timeout);
    }
  }

  addFinalGlowPulse(element) {
    element.style.animation = "finalGlowPulse 1.5s ease-in-out";

    const timeout = setTimeout(() => {
      element.style.animation = "";
    }, 1500);
    this.activeTimeouts.add(timeout);
  }

  cleanup() {
    this.activeIntervals.forEach(interval => clearInterval(interval));
    this.activeTimeouts.forEach(timeout => clearTimeout(timeout));
    this.activeIntervals.clear();
    this.activeTimeouts.clear();
  }
}

window.addEventListener('beforeunload', () => {
  if (window.scrambleText) {
    window.scrambleText.cleanup();
  }
});

const scrambleText = new ScrambleText();
window.scrambleText = scrambleText;