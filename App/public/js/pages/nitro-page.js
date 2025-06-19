document.addEventListener('DOMContentLoaded', function() {
    initNitroPage();
});

function initNitroPage() {
    initFaqAccordion();
    initSubscriptionButtons();
}

function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.nitro-faq-item');
    
    faqItems.forEach(item => {
        const header = item.querySelector('div:first-child');
        const content = item.querySelector('.nitro-faq-answer');
        const icon = header.querySelector('i');
        
        header.addEventListener('click', () => {
            const isExpanded = !content.classList.contains('hidden');
            
            faqItems.forEach(otherItem => {
                const otherContent = otherItem.querySelector('.nitro-faq-answer');
                const otherIcon = otherItem.querySelector('i');
                
                if (otherItem !== item) {
                    otherContent.classList.add('hidden');
                    otherIcon.classList.remove('fa-chevron-up');
                    otherIcon.classList.add('fa-chevron-down');
                }
            });
            
            if (isExpanded) {
                content.classList.add('hidden');
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            } else {
                content.classList.remove('hidden');
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            }
        });
    });
}

function initSubscriptionButtons() {
    const buttons = document.querySelectorAll('button');
    let subscribeBasic, subscribePremium;
    
    buttons.forEach(button => {
        if (button.textContent.trim() === 'Subscribe to Basic') {
            subscribeBasic = button;
        } else if (button.textContent.trim() === 'Subscribe to Premium') {
            subscribePremium = button;
        }
    });
    
    if (subscribeBasic) {
        subscribeBasic.addEventListener('click', () => {
            handleSubscription('basic', 4.99);
        });
    }
    
    if (subscribePremium) {
        subscribePremium.addEventListener('click', () => {
            handleSubscription('premium', 9.99);
        });
    }
}

function handleSubscription(tier, price) {
    if (!window.globalSocketManager) {
        console.warn('Socket manager not available for real-time notifications');
    }
    
    fetchPaymentGateway(tier, price)
        .then(response => {
            if (response.success) {
                showPaymentModal(response.paymentUrl, tier);
            } else {
                showErrorToast('Unable to initialize payment process. Please try again later.');
            }
        })
        .catch(error => {
            console.error('Payment process error:', error);
            showErrorToast('Payment service currently unavailable. Please try again later.');
        });
}

function fetchPaymentGateway(tier, price) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                paymentUrl: '/payment/checkout?tier=' + tier + '&price=' + price,
                transactionId: generateTransactionId()
            });
        }, 800);
    });
}

function showPaymentModal(paymentUrl, tier) {
    const modalHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div class="bg-discord-dark rounded-lg max-w-lg w-full p-6 shadow-xl">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">Complete Your Purchase</h3>
                    <button class="text-discord-lighter hover:text-white" id="close-payment-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <p class="mb-4 text-discord-lighter">You're about to subscribe to Nitro ${tier.charAt(0).toUpperCase() + tier.slice(1)}. Complete the payment to activate your benefits immediately.</p>
                <div class="bg-discord-darker p-4 rounded-md mb-4">
                    <div class="flex justify-between mb-2">
                        <span>Subscription</span>
                        <span>Nitro ${tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
                    </div>
                    <div class="flex justify-between font-bold">
                        <span>Total</span>
                        <span>$${tier === 'basic' ? '4.99' : '9.99'}/month</span>
                    </div>
                </div>
                <div class="flex space-x-3">
                    <button class="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors" id="cancel-payment">
                        Cancel
                    </button>
                    <button class="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors" id="confirm-payment">
                        Proceed to Payment
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);
    
    document.getElementById('close-payment-modal').addEventListener('click', closePaymentModal);
    document.getElementById('cancel-payment').addEventListener('click', closePaymentModal);
    document.getElementById('confirm-payment').addEventListener('click', () => {
        window.location.href = paymentUrl;
    });
}

function closePaymentModal() {
    const modal = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-70');
    if (modal) {
        modal.remove();
    }
}

function showErrorToast(message) {
    if (window.showToast) {
        window.showToast(message, 'error');
    } else {
        alert(message);
    }
}

function generateTransactionId() {
    return 'txn_' + Math.random().toString(36).substr(2, 9);
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