/**
 * Toast notification system for MiscVord
 * Provides consistent notification display across the application
 */

class ToastManager {
    constructor() {
        this.init();
    }

    init() {
        // We initialize when this module loads
        console.log('Toast manager initialized');
    }

    /**
     * Create toast container if not exists
     */
    createToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed top-0 right-0 p-4 z-50 flex flex-col items-end space-y-2';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Create a new toast element
     */
    createToast(message, type = 'info') {
        const toast = document.createElement('div');
        const toastClass = this.getToastClass(type);
        
        toast.className = `transform transition-all duration-300 ease-out translate-x-full 
                          flex items-center p-3 rounded shadow-lg max-w-md ${toastClass}`;
        
        // Add icon based on type
        const icon = this.getIconForType(type);
        
        toast.innerHTML = `
            <div class="mr-2">${icon}</div>
            <div class="flex-grow text-sm">${message}</div>
            <button type="button" class="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none" aria-label="Close">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;
        
        // Add event listener to close button
        const closeBtn = toast.querySelector('button');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        return toast;
    }

    /**
     * Get appropriate CSS class based on toast type
     */
    getToastClass(type) {
        switch (type.toLowerCase()) {
            case 'success':
                return 'bg-green-600 text-white';
            case 'error':
                return 'bg-red-600 text-white';
            case 'warning':
                return 'bg-yellow-500 text-white';
            default:
                return 'bg-discord-blue text-white';
        }
    }

    /**
     * Get appropriate icon based on toast type
     */
    getIconForType(type) {
        switch (type.toLowerCase()) {
            case 'success':
                return '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
            case 'error':
                return '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
            case 'warning':
                return '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
            default:
                return '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
        }
    }

    /**
     * Add the toast to the DOM and animate it
     */
    showToast(toast) {
        const container = this.createToastContainer();
        container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 10);
        
        // Auto-remove after delay (for non-error toasts)
        const type = toast.classList.contains('bg-red-600') ? 'error' : 'other';
        const timeout = type === 'error' ? 8000 : 5000;
        
        setTimeout(() => {
            if (toast.parentNode) {
                this.removeToast(toast);
            }
        }, timeout);
    }

    /**
     * Remove the toast with animation
     */
    removeToast(toast) {
        // Animate out
        toast.classList.add('translate-x-full');
        
        // Remove after animation completes
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            
            // Clean up container if empty
            const container = document.getElementById('toast-container');
            if (container && !container.hasChildNodes()) {
                container.remove();
            }
        }, 300);
    }
    
    /**
     * Public method to show toast
     */
    show(message, type = 'info') {
        if (!message) return;
        const toast = this.createToast(message, type);
        this.showToast(toast);
        return toast;
    }
}

// Create singleton instance
const toastManager = new ToastManager();

// Export for ES modules
export function showToast(message, type = 'info') {
    return toastManager.show(message, type);
}

// Also make available globally for backwards compatibility
window.showToast = showToast; 