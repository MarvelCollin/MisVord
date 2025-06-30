document.addEventListener('DOMContentLoaded', function() {
    initNitroPage();
});

function initNitroPage() {
    initCodeInput();
    initRedeemButton();
    initSubscriptionButtons();
    checkUserNitroStatus();
    initFloatingParticles();
    initScrollAnimations();
    initInteractiveEffects();
    initHoverEffects();
    initCustomCursor();
    initMagneticElements();
}

function initCustomCursor() {
    if (window.innerWidth <= 768) return;

    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);

    const trails = [];
    const maxTrails = 8;

    for (let i = 0; i < maxTrails; i++) {
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.style.opacity = (maxTrails - i) / maxTrails * 0.5;
        document.body.appendChild(trail);
        trails.push({
            element: trail,
            x: 0,
            y: 0,
            delay: i * 2
        });
    }

    let mouseX = 0;
    let mouseY = 0;
    let isHovering = false;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        cursor.style.left = mouseX - 10 + 'px';
        cursor.style.top = mouseY - 10 + 'px';

        trails.forEach((trail, index) => {
            setTimeout(() => {
                trail.x += (mouseX - trail.x) * 0.3;
                trail.y += (mouseY - trail.y) * 0.3;
                trail.element.style.left = trail.x - 3 + 'px';
                trail.element.style.top = trail.y - 3 + 'px';
            }, trail.delay);
        });
    });

    document.addEventListener('mousedown', () => {
        cursor.classList.add('click');
        createCursorRipple(mouseX, mouseY);
    });

    document.addEventListener('mouseup', () => {
        cursor.classList.remove('click');
    });

    const hoverElements = document.querySelectorAll('button, .nitro-card-hover, .perk-item, .boost-feature, a, input');
    
    hoverElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
            isHovering = true;
        });

        element.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
            isHovering = false;
        });
    });

    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
        trails.forEach(trail => {
            trail.element.style.opacity = '0';
        });
    });

    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
        trails.forEach((trail, index) => {
            trail.element.style.opacity = (maxTrails - index) / maxTrails * 0.5;
        });
    });
}

function createCursorRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.style.position = 'fixed';
    ripple.style.left = x - 15 + 'px';
    ripple.style.top = y - 15 + 'px';
    ripple.style.width = '30px';
    ripple.style.height = '30px';
    ripple.style.border = '2px solid rgba(139, 92, 246, 0.6)';
    ripple.style.borderRadius = '50%';
    ripple.style.pointerEvents = 'none';
    ripple.style.zIndex = '9997';
    ripple.style.transform = 'scale(0)';
    ripple.style.opacity = '1';

    document.body.appendChild(ripple);

    ripple.animate([
        { transform: 'scale(0)', opacity: 1 },
        { transform: 'scale(2)', opacity: 0 }
    ], {
        duration: 400,
        easing: 'ease-out'
    }).onfinish = () => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    };
}

function initMagneticElements() {
    if (window.innerWidth <= 768) return;

    const magneticElements = document.querySelectorAll('.nitro-subscribe-btn, #redeem-code-btn, .back-button');
    
    magneticElements.forEach(element => {
        element.classList.add('magnetic-element');
        
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const deltaX = (e.clientX - centerX) * 0.15;
            const deltaY = (e.clientY - centerY) * 0.15;
            
            element.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = '';
        });
    });
}

function initFloatingParticles() {
    const heroSection = document.querySelector('.nitro-hero-section');
    if (!heroSection) return;

    setInterval(() => {
        createFloatingParticle(heroSection);
    }, 3000);

    for (let i = 0; i < 5; i++) {
        setTimeout(() => createFloatingParticle(heroSection), i * 1000);
    }
}

function createFloatingParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'floating-particles';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 2 + 's';
    particle.style.animationDuration = (8 + Math.random() * 4) + 's';
    container.appendChild(particle);

    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, 12000);
}

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, observerOptions);

    const elementsToAnimate = document.querySelectorAll('.nitro-card-hover, .perk-item, .boost-feature');
    elementsToAnimate.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
        observer.observe(el);
    });
}

function initInteractiveEffects() {
    const perkItems = document.querySelectorAll('.flex.gap-4.group');
    perkItems.forEach(item => {
        item.classList.add('perk-item');
        
        item.addEventListener('click', function() {
            createRippleEffect(item);
        });
    });

    const boostFeatures = document.querySelectorAll('.grid.grid-cols-2 .flex.items-center');
    boostFeatures.forEach(feature => {
        feature.classList.add('boost-feature');
        
        feature.addEventListener('click', function() {
            const icon = feature.querySelector('.fa-check');
            if (icon) {
                icon.style.animation = 'pulse-glow 0.6s ease-in-out';
                setTimeout(() => {
                    icon.style.animation = '';
                }, 600);
            }
        });
    });
}

function initHoverEffects() {
    const cards = document.querySelectorAll('.nitro-card-hover');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function(e) {
            createCardGlow(e, card);
        });

        card.addEventListener('mousemove', function(e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / centerY * 5;
            const rotateY = (centerX - x) / centerX * 5;
            
            card.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', function() {
            card.style.transform = '';
        });
    });
}

function createCardGlow(e, container) {
    const rect = container.getBoundingClientRect();
    const glow = document.createElement('div');
    const size = 100;
    
    glow.style.position = 'absolute';
    glow.style.left = (e.clientX - rect.left - size / 2) + 'px';
    glow.style.top = (e.clientY - rect.top - size / 2) + 'px';
    glow.style.width = size + 'px';
    glow.style.height = size + 'px';
    glow.style.background = 'radial-gradient(circle, rgba(139, 92, 246, 0.3), transparent 70%)';
    glow.style.borderRadius = '50%';
    glow.style.pointerEvents = 'none';
    glow.style.zIndex = '2';
    glow.style.opacity = '0';
    
    container.style.position = 'relative';
    container.appendChild(glow);
    
    setTimeout(() => {
        glow.style.transition = 'opacity 0.3s ease-out';
        glow.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        glow.style.opacity = '0';
        setTimeout(() => {
            if (glow.parentNode) {
                glow.parentNode.removeChild(glow);
            }
        }, 300);
    }, 1000);
}

function createRippleEffect(element) {
    const ripple = document.createElement('div');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.position = 'absolute';
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
    ripple.style.background = 'radial-gradient(circle, rgba(139, 92, 246, 0.4), transparent 70%)';
    ripple.style.borderRadius = '50%';
    ripple.style.pointerEvents = 'none';
    ripple.style.zIndex = '1';
    ripple.style.transform = 'translate(-50%, -50%) scale(0)';
    ripple.style.opacity = '1';
    
    element.style.position = 'relative';
    element.appendChild(ripple);
    
    ripple.animate([
        { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 }
    ], {
        duration: 600,
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

    const container = document.getElementById('code-input-container');
    if (container) {
        container.classList.add('code-input-container');
    }

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
        if (redeemBtn) {
            const isValid = value.length >= 10;
            redeemBtn.disabled = !isValid;
            
            if (isValid) {
                redeemBtn.style.boxShadow = '0 0 15px rgba(34, 197, 94, 0.4)';
                container?.style.setProperty('box-shadow', '0 0 20px rgba(139, 92, 246, 0.4)');
            } else {
                redeemBtn.style.boxShadow = '';
                container?.style.setProperty('box-shadow', '');
            }
        }
    });

    codeInput.addEventListener('paste', function(e) {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        const cleanedText = pastedText.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        const event = new Event('input', { bubbles: true });
        codeInput.value = cleanedText;
        codeInput.dispatchEvent(event);
        
        createRippleEffect(container || codeInput.parentElement);
    });

    codeInput.addEventListener('focus', function() {
        container?.style.setProperty('transform', 'scale(1.02)');
        container?.style.setProperty('box-shadow', '0 0 25px rgba(139, 92, 246, 0.3)');
    });

    codeInput.addEventListener('blur', function() {
        container?.style.setProperty('transform', '');
        if (!codeInput.value || codeInput.value.replace(/-/g, '').length < 10) {
            container?.style.setProperty('box-shadow', '');
        }
    });
}

function initRedeemButton() {
    const redeemBtn = document.getElementById('redeem-code-btn');
    const codeInput = document.getElementById('nitro-code-input');
    
    if (!redeemBtn || !codeInput) return;

    redeemBtn.addEventListener('click', async function() {
        if (redeemBtn.disabled) {
            if (redeemBtn.classList.contains('nitro-already-redeemed')) {
                showToast('You already have Nitro active!', 'info');
                createRippleEffect(redeemBtn);
            }
            return;
        }
        
        const rawCode = codeInput.value.trim();
        const code = rawCode.replace(/-/g, '');
        
        if (code.length < 10) {
            showToast('Please enter a valid code (at least 10 characters)', 'error');
            shakeElement(redeemBtn);
            return;
        }

        redeemBtn.disabled = true;
        redeemBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Redeeming...';
        createLoadingRipple(redeemBtn);

        try {
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

            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const textResponse = await response.text();
                console.error('Non-JSON response:', textResponse);
                throw new Error('Server returned invalid response format');
            }

            if (response.ok && data.success) {
                showSuccessModal();
                codeInput.value = '';
                showToast('Nitro code redeemed successfully!', 'success');
                createSuccessAnimation(redeemBtn);
                
                setTimeout(() => {
                    checkUserNitroStatus();
                }, 1000);
                
                const emitNitroActivation = () => {
                    if (window.globalSocketManager?.isReady()) {
                        window.globalSocketManager.io.emit('nitro_activated', {
                            userId: window.currentUserId
                        });
                    } else {
                        console.warn('Socket not ready, waiting for connection...');
                        setTimeout(emitNitroActivation, 500);
                    }
                };
                    
                emitNitroActivation();
            } else {
                const errorMessage = data.error?.message || data.message || 'Invalid or already used code';
                console.error('Redeem failed:', errorMessage);
                showToast(errorMessage, 'error');
                redeemBtn.disabled = false;
                shakeElement(redeemBtn);
            }
        } catch (error) {
            console.error('Redeem error:', error);
            showToast('Failed to redeem code: ' + error.message, 'error');
            redeemBtn.disabled = false;
            shakeElement(redeemBtn);
        } finally {
            if (!redeemBtn.classList.contains('nitro-already-redeemed')) {
                redeemBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Redeem Code';
            }
        }
    });
}

function createLoadingRipple(element) {
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.inset = '0';
    ripple.style.background = 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)';
    ripple.style.animation = 'loading-sweep 1s linear infinite';
    ripple.style.pointerEvents = 'none';
    
    element.style.position = 'relative';
    element.appendChild(ripple);
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes loading-sweep {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }, 3000);
}

function shakeElement(element) {
    element.style.animation = 'shake 0.5s ease-in-out';
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        element.style.animation = '';
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }, 500);
}

function createSuccessAnimation(element) {
    const sparkles = [];
    for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('div');
        sparkle.style.position = 'absolute';
        sparkle.style.width = '4px';
        sparkle.style.height = '4px';
        sparkle.style.background = '#10b981';
        sparkle.style.borderRadius = '50%';
        sparkle.style.pointerEvents = 'none';
        sparkle.style.zIndex = '1000';
        
        const angle = (i / 8) * Math.PI * 2;
        const distance = 30;
        sparkle.style.left = '50%';
        sparkle.style.top = '50%';
        
        element.style.position = 'relative';
        element.appendChild(sparkle);
        
        sparkle.animate([
            { 
                transform: 'translate(-50%, -50%) scale(0)',
                opacity: 1
            },
            { 
                transform: `translate(${Math.cos(angle) * distance - 50}%, ${Math.sin(angle) * distance - 50}%) scale(1)`,
                opacity: 0
            }
        ], {
            duration: 800,
            easing: 'ease-out'
        }).onfinish = () => {
            if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
            }
        };
        
        sparkles.push(sparkle);
    }
}

function initSubscriptionButtons() {
    const subscribeButtons = document.querySelectorAll('button');
    
    subscribeButtons.forEach(button => {
        if (button.textContent.includes('Subscribe')) {
            button.addEventListener('click', function() {
                const tier = 'premium';
                const price = 9.99;
                handleSubscription(tier, price);
                createRippleEffect(button);
            });
        }
    });
}

function handleSubscription(tier, price) {
    showPaymentModal(tier, price);
}

function showPaymentModal(tier, price) {
    const displayPrice = `$${price}/month`;
    
    const modalHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" id="payment-modal" style="animation: fadeIn 0.3s ease-out;">
            <div class="bg-discord-light rounded-lg max-w-md w-full p-6" style="animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);">
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
                    <button class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-md transition-colors flex items-center justify-center">
                        <i class="fab fa-cc-stripe mr-2"></i>
                        Pay with Card
                    </button>
                    <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md transition-colors flex items-center justify-center">
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
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideIn {
            from { opacity: 0; transform: scale(0.8) translateY(-20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => modal.remove(), 300);
    }
}

function showSuccessModal() {
    const modal = document.getElementById('nitro-success-modal');
    if (modal) {
        modal.classList.remove('hidden');
        createFireworks();
    }
}

function createFireworks() {
    const colors = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b'];
    
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const firework = document.createElement('div');
            firework.style.position = 'fixed';
            firework.style.left = Math.random() * window.innerWidth + 'px';
            firework.style.top = '-10px';
            firework.style.width = Math.random() * 6 + 3 + 'px';
            firework.style.height = firework.style.width;
            firework.style.background = colors[Math.floor(Math.random() * colors.length)];
            firework.style.borderRadius = '50%';
            firework.style.pointerEvents = 'none';
            firework.style.zIndex = '10000';
            
            document.body.appendChild(firework);
            
            firework.animate([
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: `translateY(${window.innerHeight + 20}px) rotate(360deg)`, opacity: 0 }
            ], {
                duration: Math.random() * 2000 + 2000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => {
                if (firework.parentNode) {
                    firework.parentNode.removeChild(firework);
                }
            };
        }, i * 100);
    }
}

async function checkUserNitroStatus() {
    try {
        const authResponse = await fetch('/api/auth/check', {
            credentials: 'same-origin'
        });
        
        const authData = await authResponse.json();
        
        if (authData.authenticated && authData.user_id) {
            window.currentUserId = authData.user_id;
            
            const nitroResponse = await fetch('/api/nitro/status', {
                credentials: 'same-origin'
            });
            
            const nitroData = await nitroResponse.json();
            
            if (nitroData.success && nitroData.data) {
                handleNitroStatus(nitroData.data);
            }
        }
    } catch (error) {
        console.error('Failed to check user status:', error);
    }
}

function handleNitroStatus(nitroData) {
    const codeInput = document.getElementById('nitro-code-input');
    const redeemBtn = document.getElementById('redeem-code-btn');
    const container = document.getElementById('code-input-container');
    const giftSection = codeInput?.closest('.bg-discord-darker');
    
    if (nitroData.has_nitro && nitroData.codes_redeemed > 0) {
        if (codeInput) {
            codeInput.disabled = true;
            codeInput.placeholder = 'You already have Nitro!';
            codeInput.classList.add('nitro-already-redeemed');
        }
        
        if (redeemBtn) {
            redeemBtn.disabled = true;
            redeemBtn.innerHTML = '<i class="fas fa-crown mr-2"></i>Already Redeemed';
            redeemBtn.classList.add('nitro-already-redeemed');
        }
        
        if (container) {
            container.classList.add('nitro-already-redeemed');
        }
        
        if (giftSection) {
            giftSection.classList.add('nitro-already-redeemed');
            
            const statusDiv = document.createElement('div');
            statusDiv.className = 'nitro-status-display';
            statusDiv.innerHTML = `
                <div class="flex items-center gap-3 mb-4 p-4 bg-purple-600/20 border border-purple-500/30 rounded-lg">
                    <div class="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                        <i class="fas fa-crown text-white text-xl"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-purple-300">Nitro Active</h4>
                        <p class="text-sm text-gray-400">You have redeemed ${nitroData.codes_redeemed} code${nitroData.codes_redeemed > 1 ? 's' : ''}</p>
                    </div>
                </div>
            `;
            
            const existingStatus = giftSection.querySelector('.nitro-status-display');
            if (!existingStatus) {
                const titleElement = giftSection.querySelector('h3');
                if (titleElement) {
                    titleElement.parentNode.insertBefore(statusDiv, titleElement.nextSibling);
                }
            }
        }
        
        createNitroActiveEffect();
    }
}

function createNitroActiveEffect() {
    const giftSection = document.querySelector('.bg-discord-darker.nitro-already-redeemed');
    if (!giftSection) return;
    
    const sparkles = [];
    for (let i = 0; i < 6; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'nitro-sparkle';
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = Math.random() * 100 + '%';
        sparkle.style.animationDelay = Math.random() * 2 + 's';
        giftSection.appendChild(sparkle);
        sparkles.push(sparkle);
    }
    
    setTimeout(() => {
        sparkles.forEach(sparkle => {
            if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
            }
        });
    }, 5000);
}

function showToast(message, type = 'info') {
    if (window.showToast) {
        window.showToast(message, type);
    } else {
        const toastHtml = `
            <div class="fixed bottom-4 right-4 bg-${type === 'error' ? 'red' : 'green'}-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2" style="animation: slideUp 0.3s ease-out;">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
                ${message}
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
        
        const toast = document.createElement('div');
        toast.innerHTML = toastHtml;
        const toastElement = toast.firstElementChild;
        document.body.appendChild(toastElement);
        
        setTimeout(() => {
            if (toastElement) {
                toastElement.style.animation = 'slideUp 0.3s ease-out reverse';
                setTimeout(() => toastElement.remove(), 300);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
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

 