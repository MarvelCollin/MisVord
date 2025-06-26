document.addEventListener('DOMContentLoaded', function() {
        initNitroPage();
});

function initNitroPage() {
    initCodeInput();
    initRedeemButton();
    initSubscriptionButtons();
    checkUserNitroStatus();
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
            redeemBtn.disabled = value.length < 10;
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
}

function initRedeemButton() {
    const redeemBtn = document.getElementById('redeem-code-btn');
    const codeInput = document.getElementById('nitro-code-input');
    
    if (!redeemBtn || !codeInput) return;

    redeemBtn.addEventListener('click', async function() {
        if (redeemBtn.disabled) return;
        
        const rawCode = codeInput.value.trim();
        const code = rawCode.replace(/-/g, '');
        
        if (code.length < 10) {
            showToast('Please enter a valid code (at least 10 characters)', 'error');
            return;
        }

        redeemBtn.disabled = true;
        redeemBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Redeeming...';

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
            }
        } catch (error) {
            console.error('Redeem error:', error);
            showToast('Failed to redeem code: ' + error.message, 'error');
            redeemBtn.disabled = false;
        } finally {
            redeemBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Redeem Code';
        }
    });
}

function initSubscriptionButtons() {
    const subscribeButtons = document.querySelectorAll('button');
    
    subscribeButtons.forEach(button => {
        if (button.textContent.includes('Subscribe')) {
                button.addEventListener('click', function() {
                    const tier = 'premium';
                    const price = 9.99;
                        handleSubscription(tier, price);
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
            <div class="bg-discord-light rounded-lg max-w-md w-full p-6">
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
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.remove();
    }
}

function showSuccessModal() {
    const modal = document.getElementById('nitro-success-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
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
            <div class="fixed bottom-4 right-4 bg-${type === 'error' ? 'red' : 'green'}-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
                ${message}
            </div>
        `;
        
        const toast = document.createElement('div');
        toast.innerHTML = toastHtml;
        const toastElement = toast.firstElementChild;
        document.body.appendChild(toastElement);
        
        setTimeout(() => {
            if (toastElement) {
                toastElement.remove();
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

 