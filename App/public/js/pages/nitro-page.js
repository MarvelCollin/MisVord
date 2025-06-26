document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initNitroPage();
    }, 200);
});

function initNitroPage() {
    setTimeout(() => initCodeInput(), 100);
    setTimeout(() => initRedeemButton(), 200);
    setTimeout(() => initSubscriptionButtons(), 300);
    setTimeout(() => checkUserNitroStatus(), 400);
    setTimeout(() => initHoverEffects(), 500);
    setTimeout(() => initFeatureInteractions(), 600);
    setTimeout(() => initScrollAnimations(), 700);
    setTimeout(() => initFloatingParticles(), 800);
    setTimeout(() => initDynamicBackgrounds(), 900);
    setTimeout(() => initMagicalEffects(), 1000);
    setTimeout(() => initCounterAnimations(), 1100);
    setTimeout(() => initWaveEffects(), 1200);
    setTimeout(() => initMatrixEffect(), 1300);
    setTimeout(() => initCosmicParticles(), 1400);
    setTimeout(() => initHologramEffect(), 1500);
}

function initMatrixEffect() {
    const matrixContainer = document.querySelector('.matrix-effect');
    if (!matrixContainer) return;

    const chars = '01ɴɪᴛʀᴏ◆◇◈◉★☆✦✧';
    const columns = Math.floor(window.innerWidth / 20);
    
    for (let i = 0; i < columns; i++) {
        setTimeout(() => {
            createMatrixColumn(matrixContainer, i * 20, chars);
        }, i * 200);
    }

    setInterval(() => {
        if (Math.random() < 0.3) {
            const randomColumn = Math.floor(Math.random() * columns);
            createMatrixColumn(matrixContainer, randomColumn * 20, chars);
        }
    }, 3000);
}

function createMatrixColumn(container, x, chars) {
    const char = document.createElement('div');
    char.className = 'matrix-char';
    char.textContent = chars[Math.floor(Math.random() * chars.length)];
    char.style.left = x + 'px';
    char.style.animationDelay = Math.random() * 2 + 's';
    char.style.animationDuration = (Math.random() * 8 + 6) + 's';
    char.style.fontSize = (Math.random() * 8 + 12) + 'px';
    char.style.opacity = Math.random() * 0.7 + 0.3;
    
    container.appendChild(char);
    
    setTimeout(() => {
        if (char.parentNode) {
            char.parentNode.removeChild(char);
        }
    }, 15000);
}

function initCosmicParticles() {
    const particleField = document.querySelector('.particle-field');
    if (!particleField) return;

    const colors = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b'];
    
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            createCosmicParticle(particleField, colors);
        }, i * 500);
    }

    setInterval(() => {
        if (Math.random() < 0.4) {
            createCosmicParticle(particleField, colors);
        }
    }, 2000);
}

function createCosmicParticle(container, colors) {
    const particle = document.createElement('div');
    particle.className = 'cosmic-particle';
    
    const size = Math.random() * 6 + 2;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.background = `radial-gradient(circle, ${colors[Math.floor(Math.random() * colors.length)]}, transparent)`;
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = '100%';
    particle.style.animationDelay = Math.random() * 5 + 's';
    particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
    particle.style.opacity = Math.random() * 0.8 + 0.2;
    
    container.appendChild(particle);
    
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, 25000);
}

function initHologramEffect() {
    const hologramElements = document.querySelectorAll('.hologram-effect');
    
    hologramElements.forEach((element, index) => {
        setTimeout(() => {
            element.addEventListener('mouseenter', function() {
                this.style.filter = 'hue-rotate(45deg) saturate(1.2)';
                this.style.background = `linear-gradient(45deg, 
                    rgba(139, 92, 246, 0.15), 
                    rgba(59, 130, 246, 0.15), 
                    rgba(236, 72, 153, 0.15), 
                    rgba(16, 185, 129, 0.15)
                )`;
            });
            
            element.addEventListener('mouseleave', function() {
                this.style.filter = '';
                this.style.background = '';
            });
        }, index * 100);
    });
}

function initFloatingParticles() {
    const heroSection = document.querySelector('.nitro-hero-section');
    if (!heroSection) return;

    setInterval(() => {
        createFloatingParticle(heroSection);
    }, 1500);

    for (let i = 0; i < 25; i++) {
        setTimeout(() => createFloatingParticle(heroSection), i * 600 + Math.random() * 400);
    }
}

function createFloatingParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'floating-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 3 + 's';
    particle.style.opacity = '0';
    particle.style.zIndex = '5';
    
    const colors = ['rgba(139, 92, 246, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)'];
    particle.style.background = `radial-gradient(circle, ${colors[Math.floor(Math.random() * colors.length)]}, transparent)`;
    
    container.appendChild(particle);
    
    setTimeout(() => {
        particle.style.transition = 'opacity 0.8s ease-in-out';
        particle.style.opacity = '1';
    }, 100);

    setTimeout(() => {
        if (particle.parentNode) {
            particle.style.opacity = '0';
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 800);
        }
    }, 18000);
}

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -80px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                    
                    if (entry.target.classList.contains('nitro-card-hover')) {
                        setTimeout(() => animatePricingCard(entry.target), 300);
                    }
                    
                    if (entry.target.classList.contains('perk-item')) {
                        setTimeout(() => animatePerkItem(entry.target), 200);
                    }
                }, index * 200);
            }
        });
    }, observerOptions);

    const elementsToAnimate = document.querySelectorAll('.scroll-reveal');
    elementsToAnimate.forEach((el, index) => {
        if (index % 2 === 0) {
            el.classList.add('slide-left');
        } else {
            el.classList.add('slide-right');
        }
        setTimeout(() => {
            observer.observe(el);
        }, index * 150);
    });
}

function animatePricingCard(card) {
    const features = card.querySelectorAll('li');
    features.forEach((feature, index) => {
        setTimeout(() => {
            feature.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            feature.style.transform = 'translateX(15px) scale(1.02)';
            feature.style.background = 'linear-gradient(90deg, rgba(139, 92, 246, 0.1), transparent)';
            feature.style.borderRadius = '8px';
            feature.style.padding = '8px';
            setTimeout(() => {
                feature.style.transform = '';
                feature.style.background = '';
                feature.style.padding = '';
            }, 600);
        }, (index * 150) + 200);
    });
}

function animatePerkItem(item) {
    const icon = item.querySelector('i');
    if (icon) {
        setTimeout(() => {
            icon.style.animation = 'magical-sparkle 1.5s ease-out';
            icon.style.filter = 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.8))';
            setTimeout(() => {
                icon.style.animation = '';
                icon.style.filter = '';
            }, 1500);
        }, 300);
    }
}

function initDynamicBackgrounds() {
    const heroSection = document.querySelector('.nitro-hero-section');
    if (!heroSection) return;

    const waveElement = document.createElement('div');
    waveElement.className = 'wave-effect';
    heroSection.appendChild(waveElement);

    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetX = 0.5;
    let targetY = 0.5;
    let animationId;
    let lastUpdate = 0;

    const backgroundGradient = document.createElement('div');
    backgroundGradient.className = 'dynamic-background-gradient';
    backgroundGradient.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2;
        opacity: 0.6;
        transition: opacity 0.4s ease;
    `;
    heroSection.insertBefore(backgroundGradient, heroSection.firstChild);

    function updateBackground() {
        const now = performance.now();
        if (now - lastUpdate < 16) {
            animationId = requestAnimationFrame(updateBackground);
            return;
        }
        lastUpdate = now;

        mouseX += (targetX - mouseX) * 0.08;
        mouseY += (targetY - mouseY) * 0.08;

        backgroundGradient.style.background = `
            radial-gradient(circle at ${mouseX * 100}% ${mouseY * 100}%, 
            rgba(139, 92, 246, 0.5) 0%, 
            rgba(59, 130, 246, 0.3) 25%, 
            rgba(236, 72, 153, 0.2) 50%, 
            rgba(16, 185, 129, 0.15) 75%, 
            transparent 90%)
        `;

        if (Math.abs(targetX - mouseX) > 0.001 || Math.abs(targetY - mouseY) > 0.001) {
            animationId = requestAnimationFrame(updateBackground);
        }
    }

    let cardAnimationTimer;
    document.addEventListener('mousemove', (e) => {
        targetX = e.clientX / window.innerWidth;
        targetY = e.clientY / window.innerHeight;

        if (!animationId) {
            animationId = requestAnimationFrame(updateBackground);
        }

        clearTimeout(cardAnimationTimer);
        cardAnimationTimer = setTimeout(() => {
            const cards = document.querySelectorAll('.nitro-card-hover');
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const cardCenterX = rect.left + rect.width / 2;
                const cardCenterY = rect.top + rect.height / 2;
                
                const deltaX = (e.clientX - cardCenterX) / 20;
                const deltaY = (e.clientY - cardCenterY) / 20;
                
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    card.style.transition = 'transform 0.3s ease-out';
                    card.style.transform = `perspective(1200px) rotateY(${deltaX * 0.1}deg) rotateX(${-deltaY * 0.1}deg) translateZ(10px)`;
                }
            });
        }, 10);
    });

    document.addEventListener('mouseleave', () => {
        targetX = 0.5;
        targetY = 0.5;
        if (!animationId) {
            animationId = requestAnimationFrame(updateBackground);
        }
    });
}

function initMagicalEffects() {
    const sparkleElements = document.querySelectorAll('.nitro-card-hover, .nitro-subscribe-btn, #redeem-code-btn, .perk-item');
    
    sparkleElements.forEach((element, index) => {
        setTimeout(() => {
            element.addEventListener('click', createBurstEffect);
            element.addEventListener('mouseenter', createSparkleEffect);
        }, index * 50);
    });
}

function createSparkleEffect(e) {
    const rect = e.target.getBoundingClientRect();
    const sparkleCount = 12;
    
    for (let i = 0; i < sparkleCount; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.style.position = 'absolute';
            sparkle.style.left = Math.random() * rect.width + 'px';
            sparkle.style.top = Math.random() * rect.height + 'px';
            sparkle.style.width = Math.random() * 6 + 3 + 'px';
            sparkle.style.height = sparkle.style.width;
            sparkle.style.background = `hsl(${Math.random() * 60 + 260}, 80%, 70%)`;
            sparkle.style.borderRadius = '50%';
            sparkle.style.pointerEvents = 'none';
            sparkle.style.zIndex = '1000';
            sparkle.style.opacity = '0';
            sparkle.style.animation = 'magical-sparkle 1.2s ease-out forwards';
            
            e.target.style.position = 'relative';
            e.target.appendChild(sparkle);
            
            setTimeout(() => {
                sparkle.style.opacity = '1';
            }, 30);
            
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 1200);
        }, i * 100);
    }
}

function createBurstEffect(e) {
    const rect = e.target.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    for (let i = 0; i < 16; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            const angle = (i / 16) * Math.PI * 2;
            const velocity = 60 + Math.random() * 40;
            
            particle.style.position = 'absolute';
            particle.style.left = centerX + 'px';
            particle.style.top = centerY + 'px';
            particle.style.width = Math.random() * 8 + 4 + 'px';
            particle.style.height = particle.style.width;
            particle.style.background = `hsl(${Math.random() * 80 + 240}, 80%, 60%)`;
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            particle.style.opacity = '0';
            particle.style.filter = 'drop-shadow(0 0 5px currentColor)';
            
            e.target.style.position = 'relative';
            e.target.appendChild(particle);
            
            setTimeout(() => {
                particle.style.opacity = '1';
            }, 10);
            
            const endX = centerX + Math.cos(angle) * velocity;
            const endY = centerY + Math.sin(angle) * velocity;
            
            particle.animate([
                { transform: `translate(0, 0) scale(1)`, opacity: 1 },
                { transform: `translate(${endX - centerX}px, ${endY - centerY}px) scale(0)`, opacity: 0 }
            ], {
                duration: 1000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            };
        }, i * 50);
    }
}

function initCounterAnimations() {
    const priceElements = document.querySelectorAll('[id*="price"]');
    
    priceElements.forEach((element, index) => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        animateCounter(entry.target);
                    }, 500);
                    observer.unobserve(entry.target);
                }
            });
        });
        setTimeout(() => {
            observer.observe(element);
        }, index * 200);
    });
}

function animateCounter(element) {
    const text = element.textContent;
    const numbers = text.match(/[\d.]+/g);
    
    if (numbers) {
        const finalNumber = parseFloat(numbers[0]);
        const duration = 2000;
        const steps = 80;
        const increment = finalNumber / steps;
        let currentNumber = 0;
        let step = 0;
        
        const timer = setInterval(() => {
            currentNumber += increment;
            step++;
            
            element.textContent = text.replace(numbers[0], currentNumber.toFixed(2));
            
            if (step >= steps) {
                clearInterval(timer);
                element.textContent = text;
            }
        }, duration / steps);
    }
}

function initWaveEffects() {
    const containers = document.querySelectorAll('.bg-discord-light, .bg-discord-darker');
    
    containers.forEach((container, index) => {
        setTimeout(() => {
            container.addEventListener('mouseenter', function(e) {
                setTimeout(() => {
                    createRippleEffect(e, container);
                }, 100);
            });
        }, index * 100);
    });
}

function createRippleEffect(e, container) {
    const rect = container.getBoundingClientRect();
    const ripple = document.createElement('div');
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.position = 'absolute';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
    ripple.style.background = 'radial-gradient(circle, rgba(139, 92, 246, 0.3), transparent 70%)';
    ripple.style.borderRadius = '50%';
    ripple.style.pointerEvents = 'none';
    ripple.style.zIndex = '1';
    ripple.style.transform = 'scale(0)';
    ripple.style.opacity = '0';
    
    container.style.position = 'relative';
    container.appendChild(ripple);
    
    setTimeout(() => {
        ripple.style.opacity = '1';
    }, 20);
    
    ripple.animate([
        { transform: 'scale(0)', opacity: 1 },
        { transform: 'scale(1)', opacity: 0 }
    ], {
        duration: 1000,
        easing: 'ease-out'
    }).onfinish = () => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    };
}

function initCodeInput() {
    const codeInput = document.getElementById('nitro-code-input');
    if (!codeInput) return;

    codeInput.addEventListener('input', function(e) {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        let formatted = '';
        for (let i = 0; i < value.length && i < 16; i++) {
            if (i > 0 && i % 4 === 0) {
                formatted += '-';
            }
            formatted += value[i];
        }
        
        e.target.value = formatted;
        
        const redeemBtn = document.getElementById('redeem-code-btn');
        const iconElement = codeInput.parentElement.querySelector('.fa-gift');
        const container = document.getElementById('code-input-container');
        
        if (redeemBtn) {
            const isValidCode = value.length >= 10;
            
            setTimeout(() => {
                redeemBtn.disabled = !isValidCode;
                
                if (isValidCode) {
                    setTimeout(() => {
                        redeemBtn.classList.add('animate-pulse');
                        if (iconElement) {
                            iconElement.style.transition = 'all 0.8s ease-in-out';
                            iconElement.style.color = '#8b5cf6';
                            iconElement.style.animation = 'magical-sparkle 2s ease-out';
                            iconElement.style.filter = 'drop-shadow(0 0 10px #8b5cf6)';
                        }
                        if (container) {
                            container.style.transition = 'all 0.8s ease-in-out';
                            container.style.boxShadow = '0 0 40px rgba(139, 92, 246, 0.8)';
                            container.style.transform = 'scale(1.02)';
                        }
                    }, 200);
                    
                    setTimeout(() => {
                        redeemBtn.classList.remove('animate-pulse');
                        if (iconElement) iconElement.style.animation = '';
                    }, 2000);
                } else {
                    if (iconElement) {
                        iconElement.style.transition = 'all 0.5s ease-in-out';
                        iconElement.style.color = '';
                        iconElement.style.filter = '';
                    }
                    if (container) {
                        container.style.transition = 'all 0.5s ease-in-out';
                        container.style.boxShadow = '';
                        container.style.transform = '';
                    }
                }
            }, 100);
        }
    });

    codeInput.addEventListener('paste', function(e) {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        const cleanedText = pastedText.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        const event = new Event('input', { bubbles: true });
        codeInput.value = cleanedText;
        codeInput.dispatchEvent(event);
        
        setTimeout(() => {
            createBurstEffect({ target: codeInput.parentElement });
        }, 300);
    });
    
    codeInput.addEventListener('focus', function() {
        const container = document.getElementById('code-input-container');
        if (container) {
            setTimeout(() => {
                container.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                container.style.transform = 'scale(1.05) translateY(-5px)';
                container.style.boxShadow = '0 20px 50px rgba(139, 92, 246, 0.5)';
                
                setTimeout(() => {
                    createRippleEffect({ 
                        clientX: container.getBoundingClientRect().left + container.offsetWidth / 2,
                        clientY: container.getBoundingClientRect().top + container.offsetHeight / 2
                    }, container);
                }, 300);
            }, 100);
        }
    });
    
    codeInput.addEventListener('blur', function() {
        const container = document.getElementById('code-input-container');
        if (container) {
            setTimeout(() => {
                container.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                container.style.transform = '';
                container.style.boxShadow = '';
            }, 100);
        }
    });
}

function initRedeemButton() {
    const redeemBtn = document.getElementById('redeem-code-btn');
    const codeInput = document.getElementById('nitro-code-input');
    
    if (!redeemBtn || !codeInput) return;

    redeemBtn.addEventListener('click', async function() {
        if (redeemBtn.disabled) return;
        
        const rawCode = codeInput.value.trim();
        const code = rawCode.replace(/-/g, '');
        
        console.log('Redeem attempt:', {
            rawCode: rawCode,
            cleanCode: code,
            codeLength: code.length,
            userId: window.currentUserId
        });
        
        if (code.length < 10) {
            showToast('Please enter a valid code (at least 10 characters)', 'error');
            createBurstEffect({ target: redeemBtn });
            return;
        }

        redeemBtn.disabled = true;
        redeemBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Redeeming...';
        
        createLoadingEffect(redeemBtn);

        try {
            console.log('Sending request to /api/nitro/redeem with code:', code);
            
            const response = await fetch('/api/nitro/redeem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                credentials: 'same-origin',
                body: JSON.stringify({ code: code })
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const textResponse = await response.text();
                console.error('Non-JSON response:', textResponse);
                throw new Error('Server returned invalid response format');
            }

            console.log('Response data:', data);

            if (response.ok && data.success) {
                showSuccessModal();
                codeInput.value = '';
                createCelebrationEffect();
                showToast('Nitro code redeemed successfully!', 'success');
                
                if (window.globalSocketManager) {
                    window.globalSocketManager.emit('nitro_activated', {
                        userId: window.currentUserId
                    });
                }
            } else {
                const errorMessage = data.error?.message || data.message || 'Invalid or already used code';
                console.error('Redeem failed:', errorMessage);
                showToast(errorMessage, 'error');
                redeemBtn.disabled = false;
                createBurstEffect({ target: redeemBtn });
            }
        } catch (error) {
            console.error('Redeem error:', error);
            showToast('Failed to redeem code: ' + error.message, 'error');
            redeemBtn.disabled = false;
            createBurstEffect({ target: redeemBtn });
        } finally {
            redeemBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Redeem Code';
        }
    });
}

function createLoadingEffect(element) {
    const particles = [];
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.background = '#8b5cf6';
            particle.style.borderRadius = '50%';
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            particle.style.opacity = '0';
            
            element.style.position = 'relative';
            element.appendChild(particle);
            
            const angle = (i / 6) * Math.PI * 2;
            const radius = 20;
            
            setTimeout(() => {
                particle.style.opacity = '1';
            }, 50);
            
            particle.animate([
                { 
                    transform: `translate(-50%, -50%) rotate(${angle}rad) translateX(${radius}px) rotate(-${angle}rad)`,
                    opacity: 1
                },
                { 
                    transform: `translate(-50%, -50%) rotate(${angle + Math.PI * 2}rad) translateX(${radius}px) rotate(-${angle + Math.PI * 2}rad)`,
                    opacity: 0.3
                }
            ], {
                duration: 1200,
                iterations: Infinity,
                easing: 'linear'
            });
            
            particles.push(particle);
        }, i * 100);
    }
    
    setTimeout(() => {
        particles.forEach(particle => {
            if (particle.parentNode) {
                particle.style.opacity = '0';
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 300);
            }
        });
    }, 4000);
}

function createCelebrationEffect() {
    const colors = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            confetti.style.width = Math.random() * 8 + 4 + 'px';
            confetti.style.height = confetti.style.width;
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '10000';
            confetti.style.opacity = '0';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.style.transition = 'opacity 0.3s ease-in-out';
                confetti.style.opacity = '1';
            }, 100);
            
            confetti.animate([
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: `translateY(${window.innerHeight + 20}px) rotate(720deg)`, opacity: 0 }
            ], {
                duration: Math.random() * 2500 + 2500,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            };
        }, i * 120);
    }
}

function showSuccessModal() {
    const modal = document.getElementById('nitro-success-modal');
    if (modal) {
        modal.classList.remove('hidden');
        createCelebrationEffect();
        
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                });
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                });
            }, 250);
        }
    }
}

function initSubscriptionButtons() {
    const subscribeButtons = document.querySelectorAll('button');
    
    subscribeButtons.forEach((button, index) => {
        if (button.textContent.includes('Subscribe')) {
            setTimeout(() => {
                button.addEventListener('click', function() {
                    const tier = 'premium';
                    const price = 9.99;
                    
                    setTimeout(() => {
                        handleSubscription(tier, price);
                    }, 100);
                    
                    setTimeout(() => {
                        button.style.transition = 'all 0.2s ease-out';
                        button.style.transform = 'scale(0.95)';
                        createBurstEffect({ target: button });
                        setTimeout(() => {
                            button.style.transform = '';
                        }, 200);
                    }, 80);
                });
            }, index * 150);
        }
    });
}

function handleSubscription(tier, price) {
    showPaymentModal(tier, price);
}

function showPaymentModal(tier, price) {
    const displayPrice = `$${price}/month`;
    
    const modalHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" id="payment-modal">
            <div class="bg-discord-light rounded-lg max-w-md w-full p-6 animate-fade-in scroll-reveal">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold">Confirm Subscription</h3>
                    <button class="text-gray-400 hover:text-white transition-colors" onclick="closePaymentModal()">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="bg-discord-darker rounded-lg p-4 mb-6">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-gray-300">Plan</span>
                        <span class="font-semibold">Nitro ${tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-300">Price</span>
                        <span class="font-semibold">${displayPrice}</span>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <button class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-md transition-colors flex items-center justify-center hover:scale-105 transform nitro-subscribe-btn">
                        <i class="fab fa-cc-stripe mr-2"></i>
                        Pay with Card
                    </button>
                    <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md transition-colors flex items-center justify-center hover:scale-105 transform nitro-subscribe-btn">
                        <i class="fab fa-paypal mr-2"></i>
                        PayPal
                    </button>
                </div>
                
                <p class="text-gray-400 text-sm text-center mt-4">
                    By subscribing, you agree to our Terms of Service
                </p>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    setTimeout(() => {
        const modal = document.getElementById('payment-modal');
        const modalContent = modal.querySelector('.bg-discord-light');
        modalContent.classList.add('revealed');
    }, 100);
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

function initHoverEffects() {
    const perkCards = document.querySelectorAll('.flex.gap-4.group');
    perkCards.forEach((card, index) => {
        setTimeout(() => {
            card.addEventListener('mouseenter', function() {
                const icon = card.querySelector('.nitro-perk-icon');
                if (icon) {
                    setTimeout(() => {
                        icon.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                        icon.style.transform = 'scale(1.3) rotate(10deg)';
                        icon.style.filter = 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.8))';
                    }, 150);
                }
            });
            
            card.addEventListener('mouseleave', function() {
                const icon = card.querySelector('.nitro-perk-icon');
                if (icon) {
                    setTimeout(() => {
                        icon.style.transition = 'all 0.3s ease-out';
                        icon.style.transform = '';
                        icon.style.filter = '';
                    }, 50);
                }
            });
            
            card.addEventListener('click', function() {
                setTimeout(() => {
                    createBurstEffect({ target: card });
                }, 100);
            });
        }, index * 80);
    });
    
    const nitroCards = document.querySelectorAll('.nitro-card-hover');
    nitroCards.forEach((card, index) => {
        setTimeout(() => {
            card.addEventListener('mouseenter', function() {
                setTimeout(() => {
                    card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                    card.style.transform = 'translateY(-12px) scale(1.03)';
                    card.style.zIndex = '20';
                }, 80);
                setTimeout(() => {
                    createRippleEffect({ 
                        clientX: card.getBoundingClientRect().left + card.offsetWidth / 2,
                        clientY: card.getBoundingClientRect().top + card.offsetHeight / 2
                    }, card);
                }, 300);
            });
            
            card.addEventListener('mouseleave', function() {
                setTimeout(() => {
                    card.style.transition = 'all 0.3s ease-out';
                    card.style.transform = '';
                    card.style.zIndex = '';
                }, 50);
            });
        }, index * 100);
    });
}

function initFeatureInteractions() {
    const featureItems = document.querySelectorAll('li[class*="hover:translate-x-1"]');
    featureItems.forEach((item, index) => {
        setTimeout(() => {
            item.addEventListener('mouseenter', function() {
                setTimeout(() => {
                    item.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                    item.style.transform = 'translateX(0.5rem) scale(1.02)';
                    item.style.background = 'linear-gradient(90deg, rgba(139, 92, 246, 0.1), transparent)';
                    item.style.borderRadius = '8px';
                }, 120);
            });
            
            item.addEventListener('mouseleave', function() {
                setTimeout(() => {
                    item.style.transition = 'all 0.3s ease-out';
                    item.style.transform = '';
                    item.style.background = '';
                    item.style.borderRadius = '';
                }, 50);
            });
            
            item.addEventListener('click', function() {
                const checkIcon = item.querySelector('.fa-check');
                if (checkIcon) {
                    setTimeout(() => {
                        checkIcon.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                        checkIcon.style.transform = 'scale(1.5)';
                        checkIcon.style.color = '#10b981';
                        checkIcon.style.filter = 'drop-shadow(0 0 10px #10b981)';
                        setTimeout(() => {
                            checkIcon.style.transform = '';
                            checkIcon.style.color = '';
                            checkIcon.style.filter = '';
                        }, 400);
                    }, 150);
                }
            });
        }, index * 60);
    });
    
    const boostFeatures = document.querySelectorAll('.grid.grid-cols-2 .flex.items-center');
    boostFeatures.forEach((feature, index) => {
        setTimeout(() => {
            feature.addEventListener('mouseenter', function() {
                setTimeout(() => {
                    feature.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                    feature.style.transform = 'scale(1.05)';
                    feature.style.background = 'rgba(139, 92, 246, 0.1)';
                    feature.style.borderRadius = '6px';
                }, 100);
            });
            
            feature.addEventListener('mouseleave', function() {
                setTimeout(() => {
                    feature.style.transition = 'all 0.3s ease-out';
                    feature.style.transform = '';
                    feature.style.background = '';
                    feature.style.borderRadius = '';
                }, 50);
            });
            
            feature.addEventListener('click', function() {
                const icon = feature.querySelector('.fa-check');
                if (icon) {
                    setTimeout(() => {
                        icon.style.animation = 'magical-sparkle 0.8s ease-in-out';
                        icon.style.filter = 'drop-shadow(0 0 10px #10b981)';
                        setTimeout(() => {
                            icon.style.animation = '';
                            icon.style.filter = '';
                        }, 800);
                    }, 100);
                }
                setTimeout(() => {
                    createBurstEffect({ target: feature });
                }, 200);
            });
        }, index * 80);
    });
}

async function checkUserNitroStatus() {
    try {
        const response = await fetch('/api/auth/check', {
            credentials: 'same-origin'
        });
        
        const data = await response.json();
        
        if (data.authenticated && data.user_id) {
            window.currentUserId = data.user_id;
        }
    } catch (error) {
        console.error('Failed to check user status:', error);
    }
}

function showToast(message, type = 'info') {
    if (window.showToast) {
        window.showToast(message, type);
    } else {
        const toastHtml = `
            <div class="fixed bottom-4 right-4 bg-${type === 'error' ? 'red' : 'green'}-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up flex items-center gap-2">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
                ${message}
            </div>
        `;
        
        const toast = document.createElement('div');
        toast.innerHTML = toastHtml;
        const toastElement = toast.firstElementChild;
        document.body.appendChild(toastElement);
        
        setTimeout(() => {
            const toastEl = document.querySelector('.animate-slide-up');
            if (toastEl) {
                toastEl.style.opacity = '0';
                toastEl.style.transform = 'translateY(20px) scale(0.9)';
                setTimeout(() => toastEl.remove(), 300);
            }
        }, 3000);
    }
}

if (typeof confetti === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    document.head.appendChild(script);
}

document.querySelector = document.querySelector || function() { return null; };
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

 