document.addEventListener('DOMContentLoaded', function() {
    initNitroPage();
});

function initNitroPage() {
    initCodeInput();
    initRedeemButton();
    initSubscriptionButtons();

    checkUserNitroStatus();
    initHoverEffects();
    initFeatureInteractions();
    initScrollAnimations();
    initFloatingParticles();
    initDynamicBackgrounds();
    initMagicalEffects();
    initCounterAnimations();
    initWaveEffects();

}

function initFloatingParticles() {
    const heroSection = document.querySelector('.nitro-hero-section');
    if (!heroSection) return;

    setInterval(() => {
        createFloatingParticle(heroSection);
    }, 1000);

    for (let i = 0; i < 15; i++) {
        setTimeout(() => createFloatingParticle(heroSection), i * 400 + Math.random() * 300);
    }
}

function createFloatingParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'floating-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 2 + 's';
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
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                
                if (entry.target.classList.contains('pricing-card')) {
                    animatePricingCard(entry.target);
                }
                
                if (entry.target.classList.contains('perk-item')) {
                    animatePerkItem(entry.target);
                }
            }
        });
    }, observerOptions);

    const elementsToAnimate = document.querySelectorAll('.nitro-card-hover, .flex.gap-4.group, .bg-discord-light, .bg-discord-darker');
    elementsToAnimate.forEach((el, index) => {
        el.classList.add('scroll-reveal');
        if (index % 2 === 0) {
            el.classList.add('slide-left');
        } else {
            el.classList.add('slide-right');
        }
        setTimeout(() => {
            observer.observe(el);
        }, index * 100);
    });
}

function animatePricingCard(card) {
    const features = card.querySelectorAll('li');
    features.forEach((feature, index) => {
        setTimeout(() => {
            feature.style.transform = 'translateX(10px)';
            feature.style.opacity = '1';
            feature.style.color = '#8b5cf6';
            setTimeout(() => {
                feature.style.transform = '';
                feature.style.color = '';
            }, 300);
        }, (index * 150) + 200);
    });
}

function animatePerkItem(item) {
    const icon = item.querySelector('i');
    if (icon) {
        setTimeout(() => {
            icon.style.animation = 'magical-sparkle 1s ease-out';
            setTimeout(() => {
                icon.style.animation = '';
            }, 1000);
        }, 300);
    }
}

function initDynamicBackgrounds() {
    const heroSection = document.querySelector('.nitro-hero-section');
    if (!heroSection) return;

    const waveElement = document.createElement('div');
    waveElement.className = 'wave-effect';
    heroSection.appendChild(waveElement);

    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        const cards = document.querySelectorAll('.nitro-card-hover');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const cardCenterX = rect.left + rect.width / 2;
            const cardCenterY = rect.top + rect.height / 2;
            
            const deltaX = (e.clientX - cardCenterX) / 20;
            const deltaY = (e.clientY - cardCenterY) / 20;
            
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                card.style.transform = `perspective(1000px) rotateY(${deltaX * 0.1}deg) rotateX(${-deltaY * 0.1}deg)`;
            }
        });
        
        heroSection.style.background = `
            radial-gradient(circle at ${mouseX * 100}% ${mouseY * 100}%, 
            rgba(139, 92, 246, 0.3) 0%, 
            rgba(59, 130, 246, 0.2) 30%, 
            rgba(236, 72, 153, 0.1) 60%, 
            transparent 80%)
        `;
    });
}

function initMagicalEffects() {
    const sparkleElements = document.querySelectorAll('.nitro-card-hover, .nitro-subscribe-btn, #redeem-code-btn');
    
    sparkleElements.forEach(element => {
        element.addEventListener('click', createBurstEffect);
    });
}

function createSparkleEffect(e) {
    const rect = e.target.getBoundingClientRect();
    const sparkleCount = 8;
    
    for (let i = 0; i < sparkleCount; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.style.position = 'absolute';
            sparkle.style.left = Math.random() * rect.width + 'px';
            sparkle.style.top = Math.random() * rect.height + 'px';
            sparkle.style.width = '4px';
            sparkle.style.height = '4px';
            sparkle.style.background = '#8b5cf6';
            sparkle.style.borderRadius = '50%';
            sparkle.style.pointerEvents = 'none';
            sparkle.style.zIndex = '1000';
            sparkle.style.animation = 'magical-sparkle 0.8s ease-out forwards';
            
            e.target.appendChild(sparkle);
            
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 800);
        }, i * 100);
    }
}

function createBurstEffect(e) {
    const rect = e.target.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        const angle = (i / 12) * Math.PI * 2;
        const velocity = 50 + Math.random() * 30;
        
        particle.style.position = 'absolute';
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        particle.style.width = '6px';
        particle.style.height = '6px';
        particle.style.background = `hsl(${Math.random() * 60 + 260}, 70%, 60%)`;
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1000';
        
        e.target.appendChild(particle);
        
        const endX = centerX + Math.cos(angle) * velocity;
        const endY = centerY + Math.sin(angle) * velocity;
        
        particle.animate([
            { transform: `translate(0, 0) scale(1)`, opacity: 1 },
            { transform: `translate(${endX - centerX}px, ${endY - centerY}px) scale(0)`, opacity: 0 }
        ], {
            duration: 600,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }).onfinish = () => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        };
    }
}

function initCounterAnimations() {
    const priceElements = document.querySelectorAll('[id*="price"]');
    
    priceElements.forEach(element => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        });
        observer.observe(element);
    });
}

function animateCounter(element) {
    const text = element.textContent;
    const numbers = text.match(/[\d.]+/g);
    
    if (numbers) {
        const finalNumber = parseFloat(numbers[0]);
        const duration = 1500;
        const steps = 60;
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
    
    containers.forEach(container => {
        container.addEventListener('mouseenter', function(e) {
            createRippleEffect(e, container);
        });
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
    ripple.style.opacity = '1';
    
    container.style.position = 'relative';
    container.appendChild(ripple);
    
    ripple.animate([
        { transform: 'scale(0)', opacity: 1 },
        { transform: 'scale(1)', opacity: 0 }
    ], {
        duration: 800,
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
            redeemBtn.disabled = !isValidCode;
            
            if (isValidCode) {
                redeemBtn.classList.add('animate-pulse');
                if (iconElement) {
                    iconElement.style.color = '#8b5cf6';
                    iconElement.style.animation = 'magical-sparkle 1s ease-out';
                }
                if (container) {
                    container.style.boxShadow = '0 0 30px rgba(139, 92, 246, 0.6)';
                }
                setTimeout(() => {
                    redeemBtn.classList.remove('animate-pulse');
                    if (iconElement) iconElement.style.animation = '';
                }, 1000);
            } else {
                if (iconElement) {
                    iconElement.style.color = '';
                }
                if (container) {
                    container.style.boxShadow = '';
                }
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
        
        createBurstEffect({ target: codeInput.parentElement });
    });
    
    codeInput.addEventListener('focus', function() {
        const container = document.getElementById('code-input-container');
        if (container) {
            container.style.transform = 'scale(1.03)';
            container.style.boxShadow = '0 15px 35px rgba(139, 92, 246, 0.4)';
            createRippleEffect({ 
                clientX: container.getBoundingClientRect().left + container.offsetWidth / 2,
                clientY: container.getBoundingClientRect().top + container.offsetHeight / 2
            }, container);
        }
    });
    
    codeInput.addEventListener('blur', function() {
        const container = document.getElementById('code-input-container');
        if (container) {
            container.style.transform = '';
            container.style.boxShadow = '';
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
        
        element.style.position = 'relative';
        element.appendChild(particle);
        
        const angle = (i / 6) * Math.PI * 2;
        const radius = 20;
        
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
            duration: 1000,
            iterations: Infinity,
            easing: 'linear'
        });
        
        particles.push(particle);
    }
    
    setTimeout(() => {
        particles.forEach(particle => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        });
    }, 3000);
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
            
            document.body.appendChild(confetti);
            
            confetti.animate([
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: `translateY(${window.innerHeight + 20}px) rotate(720deg)`, opacity: 0 }
            ], {
                duration: Math.random() * 2000 + 2000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            };
        }, i * 50);
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
    
    subscribeButtons.forEach(button => {
        if (button.textContent.includes('Subscribe')) {

            
            button.addEventListener('click', function() {
                const tier = 'premium';
                const price = 9.99;
                handleSubscription(tier, price);
                
                setTimeout(() => {
                    button.style.transform = 'scale(0.95)';
                    createBurstEffect({ target: button });
                    setTimeout(() => {
                        button.style.transform = '';
                    }, 150);
                }, 50);
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
        card.addEventListener('mouseenter', function() {
            const icon = card.querySelector('.nitro-perk-icon');
            if (icon) {
                setTimeout(() => {
                    icon.style.transform = 'scale(1.3) rotate(10deg)';
                    icon.style.filter = 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.8))';
                }, 100);
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = card.querySelector('.nitro-perk-icon');
            if (icon) {
                icon.style.transform = '';
                icon.style.filter = '';
            }
        });
        
        card.addEventListener('click', function() {
            createBurstEffect({ target: card });
        });
    });
    
    const nitroCards = document.querySelectorAll('.nitro-card-hover');
    nitroCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            setTimeout(() => {
                card.style.transform = 'translateY(-12px) scale(1.03)';
                card.style.zIndex = '20';
            }, 50);
            setTimeout(() => {
                createRippleEffect({ 
                    clientX: card.getBoundingClientRect().left + card.offsetWidth / 2,
                    clientY: card.getBoundingClientRect().top + card.offsetHeight / 2
                }, card);
            }, 200);
        });
        
        card.addEventListener('mouseleave', function() {
            card.style.transform = '';
            card.style.zIndex = '';
        });
    });
    

}

function initFeatureInteractions() {
    const featureItems = document.querySelectorAll('li[class*="hover:translate-x-1"]');
    featureItems.forEach((item, index) => {
        item.addEventListener('mouseenter', function() {
            setTimeout(() => {
                item.style.transform = 'translateX(0.5rem) scale(1.02)';
                item.style.background = 'linear-gradient(90deg, rgba(139, 92, 246, 0.1), transparent)';
                item.style.borderRadius = '8px';
            }, 100);
        });
        
        item.addEventListener('mouseleave', function() {
            item.style.transform = '';
            item.style.background = '';
            item.style.borderRadius = '';
        });
        
        item.addEventListener('click', function() {
            const checkIcon = item.querySelector('.fa-check');
            if (checkIcon) {
                setTimeout(() => {
                    checkIcon.style.transform = 'scale(1.5)';
                    checkIcon.style.color = '#10b981';
                    checkIcon.style.filter = 'drop-shadow(0 0 10px #10b981)';
                    setTimeout(() => {
                        checkIcon.style.transform = '';
                        checkIcon.style.color = '';
                        checkIcon.style.filter = '';
                    }, 300);
                }, 100);
            }
        });
    });
    
    const boostFeatures = document.querySelectorAll('.grid.grid-cols-2 .flex.items-center');
    boostFeatures.forEach(feature => {
        feature.addEventListener('mouseenter', function() {
            setTimeout(() => {
                feature.style.transform = 'scale(1.05)';
                feature.style.background = 'rgba(139, 92, 246, 0.1)';
                feature.style.borderRadius = '6px';
            }, 80);
        });
        
        feature.addEventListener('mouseleave', function() {
            feature.style.transform = '';
            feature.style.background = '';
            feature.style.borderRadius = '';
        });
        
        feature.addEventListener('click', function() {
            const icon = feature.querySelector('.fa-check');
            if (icon) {
                icon.style.animation = 'magical-sparkle 0.5s ease-in-out';
                icon.style.filter = 'drop-shadow(0 0 10px #10b981)';
                setTimeout(() => {
                    icon.style.animation = '';
                    icon.style.filter = '';
                }, 500);
            }
            createBurstEffect({ target: feature });
        });
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

 