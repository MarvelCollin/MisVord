class ScrambleText {
  constructor() {
    this.chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    this.glitchChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    this.sparkleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    this.elements = [];
    this.isInitialized = false;
    this.particlePool = [];
    this.activeAnimations = new Set();
    this.rafId = null;
    this.cleanupTasks = [];

    this.init();
  }

  init() {
    if (this.isInitialized) return;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setupAll());
    } else {
      this.setupAll();
    }

    this.isInitialized = true;
  }

  setupAll() {
    this.setupElements();
    this.startAnimationLoop();
    this.startAnimations();
  }

  startAnimationLoop() {
    const loop = () => {
      this.processAnimations();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
    this.cleanupTasks.push(() => {
      if (this.rafId) cancelAnimationFrame(this.rafId);
    });
  }

  processAnimations() {
    this.activeAnimations.forEach((animation) => {
      if (animation.active && animation.callback) {
        animation.callback();
      }
    });
  }

  setupElements() {
    const scrambleElements = document.querySelectorAll(".scramble-text");

    scrambleElements.forEach((element, index) => {
      const originalText =
        element.getAttribute("data-text") || element.textContent.trim();
      if (!originalText) return;

      element.style.cssText += `
        position: relative;
        display: inline-block;
        will-change: filter, transform;
        transform: translateZ(0);
      `;
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
        transform: translateY(20px) scale(0.8) translateZ(0);
        transition: all 1.2s cubic-bezier(0.23, 1, 0.32, 1);
        will-change: transform, opacity, color, text-shadow;
        text-shadow: 0 0 10px transparent;
        color: transparent;
        backface-visibility: hidden;
      `;

      if (char === " ") {
        span.innerHTML = "&nbsp;";
        span.classList.add("space");
        span.style.cssText += "opacity: 1; transform: none;";
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
      const delay = 500 + index * 300;
      const animation = {
        active: true,
        startTime: performance.now() + delay,
        callback: () => {
          if (performance.now() >= animation.startTime) {
            this.animateElement(elementData);
            animation.active = false;
          }
        },
      };
      this.activeAnimations.add(animation);
    });
  }

  animateElement(elementData) {
    const { spans, originalText } = elementData;
    elementData.isAnimating = true;

    const nonSpaceSpans = spans.filter(
      (span) => !span.classList.contains("space")
    );
    const scrambleDuration = 1200;
    const characterStartDelay = 100;

    nonSpaceSpans.forEach((span, index) => {
      const animation = {
        active: true,
        startTime: performance.now() + index * characterStartDelay,
        span,
        index,
        scrambleCount: 0,
        maxScrambles: scrambleDuration / 50,
        lastScramble: 0,
        callback: () => this.processCharacterAnimation(animation),
      };
      this.activeAnimations.add(animation);
    });

    const totalTime =
      (nonSpaceSpans.length - 1) * characterStartDelay + scrambleDuration + 500;
    const completeAnimation = {
      active: true,
      startTime: performance.now() + totalTime,
      callback: () => {
        this.completeAnimation(elementData);
        completeAnimation.active = false;
      },
    };
    this.activeAnimations.add(completeAnimation);
  }

  processCharacterAnimation(animation) {
    const now = performance.now();

    if (now < animation.startTime) return;

    if (animation.scrambleCount < animation.maxScrambles) {
      if (now - animation.lastScramble >= 50) {
        this.scrambleCharacter(animation.span, animation.scrambleCount);
        animation.scrambleCount++;
        animation.lastScramble = now;
      }
    } else {
      this.revealCharacter(animation.span, animation.index);
      animation.active = false;
    }
  }

  revealCharacter(span, index) {
    const char = span.dataset.char;

    requestAnimationFrame(() => {
      span.textContent = char;
      span.classList.add("revealed");
      span.style.cssText += `
        opacity: 1;
        color: #FFFFFF;
        transform: translateY(0) scale(1) translateZ(0);
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
      `;
    });

    this.createSparkleEffect(span);
  }

  scrambleCharacter(span, scrambleCount) {
    const intensity = Math.min(scrambleCount / 10, 1);
    const isGlitch = Math.random() < 0.15 + intensity * 0.1;
    const charSet = isGlitch ? this.glitchChars : this.chars;
    const randomChar = charSet[Math.floor(Math.random() * charSet.length)];

    const baseOpacity = 0.8 + intensity * 0.2;
    const opacity = Math.random() < 0.3 ? baseOpacity * 0.7 : baseOpacity;

    const color = isGlitch
      ? `hsl(${330 + Math.random() * 30}, 80%, ${50 + Math.random() * 20}%)`
      : `hsl(${235 + Math.random() * 25}, 80%, ${60 + Math.random() * 20}%)`;

    const moveRange = 2 + intensity * 2;
    const scaleRange = 0.05 + intensity * 0.05;
    const rotateRange = 2 + intensity * 3;

    const transform = `
      translateY(${Math.random() * moveRange - moveRange / 2}px) 
      translateX(${(Math.random() * moveRange) / 2 - moveRange / 4}px) 
      scale(${0.95 + Math.random() * scaleRange})
      rotate(${Math.random() * rotateRange - rotateRange / 2}deg)
      translateZ(0)
    `;

    const glowIntensity = 0.3 + intensity * 0.4;
    const textShadow = `
      0 0 ${8 + intensity * 10}px ${color
        .replace("hsl", "hsla")
        .replace(")", `, ${glowIntensity})`)},
      0 0 ${15 + intensity * 15}px ${color
        .replace("hsl", "hsla")
        .replace(")", `, ${glowIntensity * 0.6})`)},
      0 0 ${25 + intensity * 20}px ${color
        .replace("hsl", "hsla")
        .replace(")", `, ${glowIntensity * 0.3})`)}
    `;

    requestAnimationFrame(() => {
      span.textContent = randomChar;
      span.style.cssText += `
        opacity: ${opacity};
        color: ${color};
        transform: ${transform};
        text-shadow: ${textShadow};
        transition: all 0.1s ease-out;
      `;
    });

    if (Math.random() < 0.1 + intensity * 0.1) {
      this.createScrambleSpark(span);
    }
  }

  completeAnimation(elementData) {
    const { spans, element } = elementData;
    elementData.isAnimating = false;
    elementData.completed = true;

    this.addFinalGlowPulse(element);

    const batchReveal = () => {
      spans.forEach((span, index) => {
        if (
          !span.classList.contains("space") &&
          span.classList.contains("revealed")
        ) {
          const delay = index * 100;
          const animation = {
            active: true,
            startTime: performance.now() + delay,
            callback: () => {
              span.classList.add("floating", "breathing", "shimmer");
              this.addCharacterCelebration(span, index);
              this.startContinuousEffects(span, index);
              animation.active = false;
            },
          };
          this.activeAnimations.add(animation);
        }
      });
    };

    requestAnimationFrame(batchReveal);

    const finalSetup = {
      active: true,
      startTime: performance.now() + 500,
      callback: () => {
        this.setupInteractiveEffects(elementData);
        this.startAmbientEffects(elementData);
        this.startFloatingParticles(element);
        this.startWaveAnimation(element);
        finalSetup.active = false;
      },
    };
    this.activeAnimations.add(finalSetup);
  }

  startWaveAnimation(element) {
    if (element.classList.contains("hero-title")) {
      const waveSetup = {
        active: true,
        startTime: performance.now() + 200,
        callback: () => {
          element.classList.add(
            "wave-active",
            "animate-float-title",
            "glow-active"
          );
          this.addEnhancedTitleEffects(element);
          waveSetup.active = false;
        },
      };
      this.activeAnimations.add(waveSetup);
    }
  }

  addEnhancedTitleEffects(element) {
    const spans = element.querySelectorAll(".scramble-char");

    requestAnimationFrame(() => {
      spans.forEach((span, index) => {
        if (!span.classList.contains("space")) {
          span.classList.add("wave-char");
          span.style.animationDelay = `${index * 0.1}s`;
        }
      });
    });

    const sparkleInterval = setInterval(() => {
      if (!element.isConnected) {
        clearInterval(sparkleInterval);
        return;
      }
      if (Math.random() < 0.3) {
        this.addTitleSparkle(element);
      }
    }, 2000);
    this.cleanupTasks.push(() => clearInterval(sparkleInterval));

    const pulseInterval = setInterval(() => {
      if (!element.isConnected) {
        clearInterval(pulseInterval);
        return;
      }
      if (Math.random() < 0.2) {
        this.addTitlePulse(element);
      }
    }, 4000);
    this.cleanupTasks.push(() => clearInterval(pulseInterval));
  }

  getParticleFromPool(className) {
    if (this.particlePool.length > 0) {
      const particle = this.particlePool.pop();
      particle.className = className;
      return particle;
    }

    const particle = document.createElement("div");
    particle.className = className;
    return particle;
  }

  returnParticleToPool(particle) {
    if (particle.parentNode) {
      particle.parentNode.removeChild(particle);
    }
    particle.className = "";
    particle.style.cssText = "";
    if (this.particlePool.length < 50) {
      this.particlePool.push(particle);
    }
  }

  addTitleSparkle(element) {
    const sparkle = this.getParticleFromPool("title-sparkle");

    const rect = element.getBoundingClientRect();
    const x = Math.random() * rect.width;
    const y = Math.random() * rect.height;

    sparkle.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 4px;
      height: 4px;
      background: linear-gradient(45deg, #ffffff, #5865F2);
      border-radius: 50%;
      pointer-events: none;
      animation: titleSparkle 1.5s ease-out forwards;
      z-index: 1000;
      box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
      will-change: transform, opacity;
      transform: translateZ(0);
    `;

    element.appendChild(sparkle);

    const cleanup = {
      active: true,
      startTime: performance.now() + 1500,
      callback: () => {
        this.returnParticleToPool(sparkle);
        cleanup.active = false;
      },
    };
    this.activeAnimations.add(cleanup);
  }

  addTitlePulse(element) {
    requestAnimationFrame(() => {
      element.style.animation = "titleMegaPulse 1s ease-out";
    });

    const resetAnimation = {
      active: true,
      startTime: performance.now() + 1000,
      callback: () => {
        element.style.animation = "titleWave 3s ease-in-out infinite";
        resetAnimation.active = false;
      },
    };
    this.activeAnimations.add(resetAnimation);
  }

  createSparkleEffect(element) {
    for (let i = 0; i < 2; i++) {
      const delay = i * 75;
      const sparkleCreate = {
        active: true,
        startTime: performance.now() + delay,
        callback: () => {
          const sparkle = this.getParticleFromPool("sparkle-particle");

          const size = 1.5 + Math.random() * 2;
          const angle = Math.random() * Math.PI * 2;
          const distance = 12 + Math.random() * 12;

          sparkle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: linear-gradient(45deg, #fff, #5865F2);
            border-radius: 50%;
            pointer-events: none;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) translateZ(0);
            animation: sparkleEffect 0.6s ease-out forwards;
            z-index: 1000;
            will-change: transform, opacity;
          `;

          sparkle.style.setProperty("--end-x", `${Math.cos(angle) * distance}px`);
          sparkle.style.setProperty("--end-y", `${Math.sin(angle) * distance}px`);

          element.appendChild(sparkle);

          const cleanup = {
            active: true,
            startTime: performance.now() + 600,
            callback: () => {
              this.returnParticleToPool(sparkle);
              cleanup.active = false;
            },
          };
          this.activeAnimations.add(cleanup);

          sparkleCreate.active = false;
        },
      };
      this.activeAnimations.add(sparkleCreate);
    }
  }

  createScrambleSpark(element) {
    const spark = this.getParticleFromPool("scramble-spark");

    const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#feca57", "#ff9ff3"];
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
      transform: translate(-50%, -50%) translateZ(0);
      animation: scrambleSpark 0.4s ease-out forwards;
      z-index: 999;
      box-shadow: 0 0 8px ${color};
      will-change: transform, opacity;
    `;

    spark.style.setProperty("--end-x", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--end-y", `${Math.sin(angle) * distance}px`);

    element.appendChild(spark);

    const cleanup = {
      active: true,
      startTime: performance.now() + 400,
      callback: () => {
        this.returnParticleToPool(spark);
        cleanup.active = false;
      },
    };
    this.activeAnimations.add(cleanup);
  }

  addCharacterCelebration(span, index) {
    requestAnimationFrame(() => {
      span.style.animation = `celebrationBounce 0.8s ease-out ${index * 0.05}s`;
    });

    const burstCreate = {
      active: true,
      startTime: performance.now() + index * 50,
      callback: () => {
        this.createCelebrationBurst(span);
        burstCreate.active = false;
      },
    };
    this.activeAnimations.add(burstCreate);

    const resetAnimation = {
      active: true,
      startTime: performance.now() + 1000 + index * 50,
      callback: () => {
        span.style.animation = "";
        resetAnimation.active = false;
      },
    };
    this.activeAnimations.add(resetAnimation);
  }

  startContinuousEffects(span, index) {
    const gentleInterval = setInterval(() => {
      if (!span.isConnected) {
        clearInterval(gentleInterval);
        return;
      }
      if (!span._isHovering && Math.random() < 0.3) {
        this.addGentleMovement(span);
      }
    }, 3000 + Math.random() * 2000);
    this.cleanupTasks.push(() => clearInterval(gentleInterval));

    const glowInterval = setInterval(() => {
      if (!span.isConnected) {
        clearInterval(glowInterval);
        return;
      }
      if (!span._isHovering && Math.random() < 0.2) {
        this.addGlowPulse(span);
      }
    }, 5000 + Math.random() * 3000);
    this.cleanupTasks.push(() => clearInterval(glowInterval));

    const twirlInterval = setInterval(() => {
      if (!span.isConnected) {
        clearInterval(twirlInterval);
        return;
      }
      if (!span._isHovering && Math.random() < 0.1) {
        this.addCharacterTwirl(span);
      }
    }, 8000 + Math.random() * 4000);
    this.cleanupTasks.push(() => clearInterval(twirlInterval));
  }

  setupInteractiveEffects(elementData) {
    const { spans } = elementData;

    spans.forEach((span) => {
      if (span.classList.contains("space")) return;

      const hoverHandler = () => this.onCharacterHover(span);
      const leaveHandler = () => this.onCharacterLeave(span);
      const clickHandler = () => this.onCharacterClick(span);

      span.addEventListener("mouseenter", hoverHandler, { passive: true });
      span.addEventListener("mouseleave", leaveHandler, { passive: true });
      span.addEventListener("click", clickHandler, { passive: true });

      this.cleanupTasks.push(() => {
        span.removeEventListener("mouseenter", hoverHandler);
        span.removeEventListener("mouseleave", leaveHandler);
        span.removeEventListener("click", clickHandler);
      });
    });
  }

  onCharacterHover(span) {
    if (span._isHovering) return;
    span._isHovering = true;

    const originalChar = span.dataset.char;
    let scrambleCount = 0;
    const maxScrambles = 3;

    const hoverAnimation = {
      active: true,
      lastScramble: 0,
      callback: () => {
        const now = performance.now();
        if (
          scrambleCount < maxScrambles &&
          span._isHovering &&
          now - hoverAnimation.lastScramble >= 200
        ) {
          const sparkleChar =
            this.sparkleChars[
              Math.floor(Math.random() * this.sparkleChars.length)
            ];
          const hue = 180 + Math.random() * 60;

          requestAnimationFrame(() => {
            span.textContent = sparkleChar;
            span.style.cssText += `
              color: hsl(${hue}, 80%, 70%);
              transform: scale(1.2) rotate(${
                Math.random() * 10 - 5
              }deg) translateZ(0);
              text-shadow: 
                0 0 20px hsl(${hue}, 80%, 70%),
                0 0 30px hsl(${hue}, 80%, 70%),
                0 0 40px hsl(${hue}, 80%, 70%);
            `;
          });

          this.createMagicParticles(span);
          scrambleCount++;
          hoverAnimation.lastScramble = now;
        } else if (scrambleCount >= maxScrambles && span._isHovering) {
          requestAnimationFrame(() => {
            span.textContent = originalChar;
            span.style.cssText += `
              color: #FFFFFF;
              transform: scale(1.05) translateZ(0);
              text-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
            `;
          });
          hoverAnimation.active = false;
        }

        if (!span._isHovering) {
          hoverAnimation.active = false;
        }
      },
    };
    this.activeAnimations.add(hoverAnimation);
  }

  onCharacterLeave(span) {
    span._isHovering = false;

    const leaveAnimation = {
      active: true,
      startTime: performance.now() + 100,
      callback: () => {
        if (!span._isHovering) {
          requestAnimationFrame(() => {
            span.textContent = span.dataset.char;
            span.style.cssText += `
              color: #FFFFFF;
              transform: scale(1) translateZ(0);
              text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
            `;
          });
        }
        leaveAnimation.active = false;
      },
    };
    this.activeAnimations.add(leaveAnimation);
  }

  onCharacterClick(span) {
    this.createExplosionEffect(span);

    requestAnimationFrame(() => {
      span.style.cssText += `
        transform: scale(1.5) rotate(360deg) translateZ(0);
        color: #ff6b6b;
        text-shadow: 0 0 30px #ff6b6b;
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      `;
    });

    const resetClick = {
      active: true,
      startTime: performance.now() + 500,
      callback: () => {
        requestAnimationFrame(() => {
          span.style.cssText += `
            transform: scale(1) translateZ(0);
            color: #FFFFFF;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
          `;
        });
        resetClick.active = false;
      },
    };
    this.activeAnimations.add(resetClick);
  }

  startAmbientEffects(elementData) {
    const { spans } = elementData;
    const nonSpaceSpans = spans.filter(
      (span) => !span.classList.contains("space")
    );

    const ambientLoop = () => {
      if (Math.random() < 0.05) {
        const randomSpan = nonSpaceSpans[Math.floor(Math.random() * nonSpaceSpans.length)];
        if (randomSpan && !randomSpan._isHovering && !randomSpan._isAnimating) {
          this.quickScramble(randomSpan);
        }
      }
    };

    const ambientInterval = setInterval(() => {
      if (!elementData.element.isConnected) {
        clearInterval(ambientInterval);
        return;
      }
      ambientLoop();
    }, 4000 + Math.random() * 6000);
    this.cleanupTasks.push(() => clearInterval(ambientInterval));
  }

  quickScramble(span) {
    span._isAnimating = true;
    const originalChar = span.dataset.char;
    let count = 0;

    const scrambleAnimation = {
      active: true,
      lastScramble: 0,
      callback: () => {
        const now = performance.now();
        if (count < 2 && now - scrambleAnimation.lastScramble >= 150) {
          const randomChar = this.chars[Math.floor(Math.random() * this.chars.length)];
          requestAnimationFrame(() => {
            span.textContent = randomChar;
            span.style.cssText += `
              color: #57f287;
              transform: scale(1.05) translateZ(0);
            `;
          });
          count++;
          scrambleAnimation.lastScramble = now;
        } else if (count >= 2) {
          requestAnimationFrame(() => {
            span.textContent = originalChar;
            span.style.cssText += `
              color: #FFFFFF;
              transform: scale(1) translateZ(0);
            `;
          });
          span._isAnimating = false;
          scrambleAnimation.active = false;
        }
      },
    };
    this.activeAnimations.add(scrambleAnimation);
  }

  createMagicParticles(element) {
    for (let i = 0; i < 3; i++) {
      const particle = this.getParticleFromPool("magic-particle");

      const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1"];
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
        will-change: transform, opacity;
        transform: translateZ(0);
      `;

      element.appendChild(particle);

      const cleanup = {
        active: true,
        startTime: performance.now() + 800,
        callback: () => {
          this.returnParticleToPool(particle);
          cleanup.active = false;
        },
      };
      this.activeAnimations.add(cleanup);
    }
  }

  createExplosionEffect(element) {
    for (let i = 0; i < 6; i++) {
      const fragment = this.getParticleFromPool("explosion-fragment");

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
        transform: translate(-50%, -50%) translateZ(0);
        animation: explosionFragment 0.5s ease-out forwards;
        z-index: 1001;
        will-change: transform, opacity;
      `;

      fragment.style.setProperty("--end-x", `${Math.cos(angle) * distance}px`);
      fragment.style.setProperty("--end-y", `${Math.sin(angle) * distance}px`);

      element.appendChild(fragment);

      const cleanup = {
        active: true,
        startTime: performance.now() + 500,
        callback: () => {
          this.returnParticleToPool(fragment);
          cleanup.active = false;
        },
      };
      this.activeAnimations.add(cleanup);
    }
  }

  createCelebrationBurst(span) {
    const burstCount = 6;

    for (let i = 0; i < burstCount; i++) {
      const burst = this.getParticleFromPool("celebration-particle");

      const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#feca57", "#ff9ff3"];
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
        transform: translate(-50%, -50%) translateZ(0);
        animation: celebrationBurst 0.5s ease-out forwards;
        z-index: 999;
        box-shadow: 0 0 8px ${color};
        will-change: transform, opacity;
      `;

      burst.style.setProperty("--end-x", `${Math.cos(angle) * distance}px`);
      burst.style.setProperty("--end-y", `${Math.sin(angle) * distance}px`);

      span.appendChild(burst);

      const cleanup = {
        active: true,
        startTime: performance.now() + 500,
        callback: () => {
          this.returnParticleToPool(burst);
          cleanup.active = false;
        },
      };
      this.activeAnimations.add(cleanup);
    }
  }

  startFloatingParticles(element) {
    const container = document.createElement("div");
    container.className = "floating-particles-container";
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

      const particle = this.getParticleFromPool("floating-particle");

      const colors = ["#5865F2", "#57F287", "#FEE75C", "#EB459E"];
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
        will-change: transform, opacity;
        transform: translateZ(0);
      `;

      particle.style.setProperty("--end-x", `${endX - startX}px`);
      particle.style.setProperty("--end-y", `-${100 + Math.random() * 50}px`);

      container.appendChild(particle);

      const cleanup = {
        active: true,
        startTime: performance.now() + duration * 1000,
        callback: () => {
          this.returnParticleToPool(particle);
          cleanup.active = false;
        },
      };
      this.activeAnimations.add(cleanup);
    };

    for (let i = 0; i < 3; i++) {
      const particleCreate = {
        active: true,
        startTime: performance.now() + Math.random() * 1000,
        callback: () => {
          createParticle();
          particleCreate.active = false;

          const nextParticle = {
            active: true,
            startTime: performance.now() + Math.random() * 1000 + 500,
            callback: () => {
              if (element.isConnected) {
                createParticle();
                nextParticle.startTime = performance.now() + Math.random() * 1000 + 500;
              } else {
                nextParticle.active = false;
              }
            },
          };
          this.activeAnimations.add(nextParticle);
        },
      };
      this.activeAnimations.add(particleCreate);
    }
  }

  addFinalGlowPulse(element) {
    requestAnimationFrame(() => {
      element.style.animation = "finalGlowPulse 2s ease-in-out";
    });

    const resetGlow = {
      active: true,
      startTime: performance.now() + 2000,
      callback: () => {
        element.style.animation = "";
        resetGlow.active = false;
      },
    };
    this.activeAnimations.add(resetGlow);
  }

  addGentleMovement(span) {
    const moveX = Math.random() * 4 - 2;
    const moveY = Math.random() * 4 - 2;
    const rotate = Math.random() * 6 - 3;
    const scale = 1 + Math.random() * 0.1 - 0.05;
    const duration = 0.8 + Math.random() * 0.4;

    requestAnimationFrame(() => {
      span.style.cssText += `
        transition: transform ${duration}s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform: translateX(${moveX}px) translateY(${moveY}px) rotate(${rotate}deg) scale(${scale}) translateZ(0);
      `;
    });

    const resetMovement = {
      active: true,
      startTime: performance.now() + duration * 1000,
      callback: () => {
        requestAnimationFrame(() => {
          span.style.cssText += `
            transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
            transform: scale(1) translateZ(0);
          `;
        });
        resetMovement.active = false;
      },
    };
    this.activeAnimations.add(resetMovement);
  }

  addGlowPulse(span) {
    const originalShadow = span.style.textShadow;
    const hue =
      Math.random() > 0.5 ? 240 + Math.random() * 60 : 0 + Math.random() * 60;

    requestAnimationFrame(() => {
      span.style.cssText += `
        transition: text-shadow 0.8s ease-in-out;
        text-shadow: 
          0 0 15px hsla(${hue}, 80%, 70%, 0.8),
          0 0 30px hsla(${hue}, 80%, 60%, 0.5);
      `;
    });

    const resetGlow = {
      active: true,
      startTime: performance.now() + 800,
      callback: () => {
        span.style.textShadow = originalShadow;
        resetGlow.active = false;
      },
    };
    this.activeAnimations.add(resetGlow);
  }

  addCharacterTwirl(span) {
    const originalTransform = span.style.transform;
    const rotations = Math.random() > 0.5 ? 1 : -1;

    requestAnimationFrame(() => {
      span.style.cssText += `
        transition: transform 1s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform: rotate(${rotations * 360}deg) scale(1.2) translateZ(0);
      `;
    });

    const resetTwirl = {
      active: true,
      startTime: performance.now() + 1000,
      callback: () => {
        requestAnimationFrame(() => {
          span.style.cssText += `
            transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            transform: ${originalTransform};
          `;
        });
        resetTwirl.active = false;
      },
    };
    this.activeAnimations.add(resetTwirl);
  }

  destroy() {
    this.cleanupTasks.forEach((task) => task());
    this.cleanupTasks = [];
    this.activeAnimations.clear();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.particlePool = [];
    this.elements = [];
  }
}

window.addEventListener("beforeunload", () => {
  if (window.scrambleTextInstance) {
    window.scrambleTextInstance.destroy();
  }
});

const scrambleText = new ScrambleText();
window.scrambleTextInstance = scrambleText;