document.addEventListener('DOMContentLoaded', function() {
    initNitroPage();
});

function initNitroPage() {
    initCodeInput();
    initRedeemButton();
    initSubscriptionButtons();
    initBillingToggle();
    checkUserNitroStatus();
    initHoverEffects();
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
        if (redeemBtn) {
            const isValidCode = value.length === 16;
            redeemBtn.disabled = !isValidCode;
            
            if (isValidCode) {
                redeemBtn.classList.add('animate-pulse');
                setTimeout(() => {
                    redeemBtn.classList.remove('animate-pulse');
                }, 1000);
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
    });
    
    codeInput.addEventListener('focus', function() {
        codeInput.parentElement.classList.add('transform', 'scale-[1.02]', 'shadow-lg');
    });
    
    codeInput.addEventListener('blur', function() {
        codeInput.parentElement.classList.remove('transform', 'scale-[1.02]', 'shadow-lg');
    });
}

function initRedeemButton() {
    const redeemBtn = document.getElementById('redeem-code-btn');
    const codeInput = document.getElementById('nitro-code-input');
    
    if (!redeemBtn || !codeInput) return;

    redeemBtn.addEventListener('click', async function() {
        if (redeemBtn.disabled) return;
        
        const code = codeInput.value.replace(/-/g, '');
        
        if (code.length !== 16) {
            showToast('Please enter a valid 16-character code', 'error');
            return;
        }

        redeemBtn.disabled = true;
        redeemBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Redeeming...';

        try {
            const response = await fetch('/api/nitro/redeem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                body: JSON.stringify({ code })
            });

            const data = await response.json();

            if (data.success) {
                showSuccessModal();
                codeInput.value = '';
                
                if (window.globalSocketManager) {
                    window.globalSocketManager.emit('nitro_activated', {
                        userId: window.currentUserId
                    });
                }
            } else {
                showToast(data.message || 'Invalid or already used code', 'error');
                redeemBtn.disabled = false;
            }
        } catch (error) {
            console.error('Redeem error:', error);
            showToast('Failed to redeem code. Please try again.', 'error');
            redeemBtn.disabled = false;
        } finally {
            redeemBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Redeem Code';
        }
    });
}

function showSuccessModal() {
    const modal = document.getElementById('nitro-success-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }
}

function initSubscriptionButtons() {
    const subscribeButtons = document.querySelectorAll('button');
    
    subscribeButtons.forEach(button => {
        if (button.textContent.includes('Subscribe')) {
            button.addEventListener('click', function() {
                const tier = 'premium';
                const price = document.querySelector('.pricing-toggle-highlight').style.transform.includes('36') ? 99.99 : 9.99;
                handleSubscription(tier, price);
                
                button.classList.add('animate-pulse');
                setTimeout(() => {
                    button.classList.remove('animate-pulse');
                }, 1000);
            });
        }
    });
}

function handleSubscription(tier, price) {
    showPaymentModal(tier, price);
}

function showPaymentModal(tier, price) {
    const isPricingYearly = price > 20;
    const displayPrice = isPricingYearly ? `$${price}/year` : `$${price}/month`;
    
    const modalHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" id="payment-modal">
            <div class="bg-discord-light rounded-lg max-w-md w-full p-6 animate-fade-in">
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
                    ${isPricingYearly ? '<div class="mt-2 bg-green-900/30 p-2 rounded text-xs text-green-400 font-semibold">You save 16% with yearly billing!</div>' : ''}
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
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.remove();
    }
}

function initBillingToggle() {
    const monthlyBtn = document.getElementById('monthly-btn');
    const yearlyBtn = document.getElementById('yearly-btn');
    const toggleHighlight = document.querySelector('.pricing-toggle-highlight');
    
    if (monthlyBtn && yearlyBtn && toggleHighlight) {
        monthlyBtn.addEventListener('click', function() {
            toggleHighlight.style.transform = 'translateX(0)';
            monthlyBtn.classList.add('text-gray-900');
            monthlyBtn.classList.remove('text-white');
            yearlyBtn.classList.add('text-white');
            yearlyBtn.classList.remove('text-gray-900');
            updatePrices('monthly');
        });
        
        yearlyBtn.addEventListener('click', function() {
            toggleHighlight.style.transform = 'translateX(136px)';
            yearlyBtn.classList.add('text-gray-900');
            yearlyBtn.classList.remove('text-white');
            monthlyBtn.classList.add('text-white');
            monthlyBtn.classList.remove('text-gray-900');
            updatePrices('yearly');
        });
    }
}

function updatePrices(billing) {
    const priceElements = document.querySelectorAll('.text-purple-400.font-semibold');
    priceElements.forEach(element => {
        if (element.textContent.includes('$9.99')) {
            element.textContent = billing === 'yearly' ? '$99.99/year' : '$9.99/month';
        }
    });
}

function initHoverEffects() {
    const perkCards = document.querySelectorAll('.flex.gap-4.group');
    perkCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = card.querySelector('.nitro-perk-icon');
            if (icon) {
                icon.style.transform = 'scale(1.2) rotate(5deg)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = card.querySelector('.nitro-perk-icon');
            if (icon) {
                icon.style.transform = '';
            }
        });
    });
    
    const nitroCards = document.querySelectorAll('.nitro-card-hover');
    nitroCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            card.style.transform = '';
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
            <div class="fixed bottom-4 right-4 bg-${type === 'error' ? 'red' : 'green'}-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up">
                ${message}
            </div>
        `;
        
        const toast = document.createElement('div');
        toast.innerHTML = toastHtml;
        document.body.appendChild(toast.firstElementChild);
        
        setTimeout(() => {
            const toastEl = document.querySelector('.animate-slide-up');
            if (toastEl) toastEl.remove();
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