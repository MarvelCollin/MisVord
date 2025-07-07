class NotificationToast {
    constructor() {
        this.toasts = [];
        this.container = null;
        this.init();
    }

    init() {
        this.createContainer();
        this.addStyles();
    }

    createContainer() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-toast-container';
            this.container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none';
            document.body.appendChild(this.container);
        }
        return this.container;
    }

    addStyles() {
        if (document.getElementById('notification-toast-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'notification-toast-styles';
        style.textContent = `
            .toast-enter {
                transform: translateX(100%) scale(0.95);
                opacity: 0;
            }
            
            .toast-enter-active {
                transform: translateX(0) scale(1);
                opacity: 1;
                transition: transform 0.3s ease-out, opacity 0.3s ease-out;
            }
            
            .toast-exit {
                transform: translateX(0) scale(1);
                opacity: 1;
            }
            
            .toast-exit-active {
                transform: translateX(100%) scale(0.95);
                opacity: 0;
                transition: transform 0.3s ease-in, opacity 0.3s ease-in;
            }
            
            .toast-backdrop {
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
            }
            
            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255, 255, 255, 0.4);
                border-radius: 0 0 0.375rem 0.375rem;
                transition: width linear;
            }
        `;
        document.head.appendChild(style);
    }

    show({
        title = 'Notification',
        message = '',
        type = 'info',
        icon = null,
        duration = 5000,
        closable = true,
        progress = true,
        onClick = null,
        avatar = null,
        actions = []
    }) {
        const toast = document.createElement('div');
        toast.className = 'notification-toast pointer-events-auto w-full max-w-sm toast-enter';
        

        const config = this.getToastConfig(type);
        

        if (avatar && !icon) {
            icon = { avatar };
        }

        const toastHTML = `
            <div class="relative overflow-hidden rounded-lg shadow-lg ${config.gradientBorder}">
                <div class="toast-backdrop bg-gray-900/80 border border-gray-700/50 rounded-lg overflow-hidden">
                    <div class="p-4">
                        <div class="flex items-start">
                            ${this.renderIcon(icon || config.icon, config.iconBg)}
                            
                            <div class="ml-3 w-0 flex-1">
                                <div class="flex justify-between items-start">
                                    <p class="text-sm font-medium text-white">${title}</p>
                                    ${closable ? `
                                        <button type="button" class="toast-close ml-3 flex-shrink-0 text-gray-400 hover:text-gray-200 transition-colors">
                                            <span class="sr-only">Close</span>
                                            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                                            </svg>
                                        </button>
                                    ` : ''}
                                </div>
                                
                                ${message ? `
                                    <div class="mt-1 text-sm text-gray-300">
                                        ${message}
                                    </div>
                                ` : ''}
                                
                                ${this.renderActions(actions)}
                            </div>
                        </div>
                    </div>
                    
                    ${progress ? `<div class="toast-progress ${config.progressColor}" style="width: 100%;"></div>` : ''}
                </div>
            </div>
        `;
        
        toast.innerHTML = toastHTML;
        this.container.appendChild(toast);
        

        setTimeout(() => {
            toast.classList.remove('toast-enter');
            toast.classList.add('toast-enter-active');
        }, 10);
        

        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide(toast));
        }
        
        if (onClick) {
            toast.style.cursor = 'pointer';
            toast.addEventListener('click', (e) => {
                if (!e.target.closest('.toast-close, .toast-action')) {
                    onClick(e);
                }
            });
        }
        

        let progressInterval;
        if (progress && duration > 0) {
            const progressBar = toast.querySelector('.toast-progress');
            let timeLeft = duration;
            const interval = 10;
            
            progressInterval = setInterval(() => {
                timeLeft -= interval;
                const percentage = (timeLeft / duration) * 100;
                if (progressBar) progressBar.style.width = `${percentage}%`;
                
                if (timeLeft <= 0) {
                    clearInterval(progressInterval);
                }
            }, interval);
        }
        

        if (duration > 0) {
            setTimeout(() => {
                this.hide(toast);
                if (progressInterval) clearInterval(progressInterval);
            }, duration);
        }
        

        this.toasts.push(toast);
        
        return toast;
    }
    
    hide(toast) {
        toast.classList.remove('toast-enter-active');
        toast.classList.add('toast-exit', 'toast-exit-active');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
                this.toasts = this.toasts.filter(t => t !== toast);
            }
        }, 300);
    }
    
    hideAll() {
        [...this.toasts].forEach(toast => this.hide(toast));
    }
    
    getToastConfig(type) {
        const configs = {
            info: {
                icon: '<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>',
                iconBg: 'bg-blue-500',
                gradientBorder: 'bg-gradient-to-r from-blue-500 to-indigo-600 p-[1px]',
                progressColor: 'bg-blue-400'
            },
            success: {
                icon: '<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
                iconBg: 'bg-green-500',
                gradientBorder: 'bg-gradient-to-r from-green-500 to-emerald-600 p-[1px]',
                progressColor: 'bg-green-400'
            },
            warning: {
                icon: '<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
                iconBg: 'bg-yellow-500',
                gradientBorder: 'bg-gradient-to-r from-yellow-500 to-orange-500 p-[1px]',
                progressColor: 'bg-yellow-400'
            },
            error: {
                icon: '<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
                iconBg: 'bg-red-500',
                gradientBorder: 'bg-gradient-to-r from-red-500 to-pink-600 p-[1px]',
                progressColor: 'bg-red-400'
            },
            mention: {
                icon: '<i class="fas fa-at h-6 w-6"></i>',
                iconBg: 'bg-purple-500',
                gradientBorder: 'bg-gradient-to-r from-purple-500 to-indigo-600 p-[1px]',
                progressColor: 'bg-purple-400'
            },
            discord: {
                icon: '<i class="fab fa-discord h-6 w-6"></i>',
                iconBg: 'bg-indigo-500',
                gradientBorder: 'bg-gradient-to-r from-indigo-500 to-blue-600 p-[1px]',
                progressColor: 'bg-indigo-400'
            }
        };
        
        return configs[type] || configs.info;
    }
    
    renderIcon(icon, bgClass) {
        if (typeof icon === 'object' && icon.avatar) {
            return `
                <div class="flex-shrink-0">
                    <div class="h-10 w-10 rounded-full ${bgClass} flex items-center justify-center text-white overflow-hidden">
                        <img src="${icon.avatar}" alt="User avatar" class="w-full h-full object-cover">
                    </div>
                </div>
            `;
        }
        return `
            <div class="flex-shrink-0">
                <div class="h-10 w-10 rounded-full ${bgClass} flex items-center justify-center text-white">
                    ${icon}
                </div>
            </div>
        `;
    }
    
    renderActions(actions) {
        if (!actions || actions.length === 0) return '';
        
        const actionButtons = actions.map(action => `
            <button 
                type="button" 
                class="toast-action inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${action.primary ? 
                    'bg-white/10 hover:bg-white/20 text-white' : 
                    'text-gray-300 hover:text-white'} 
                focus:outline-none transition-colors"
            >
                ${action.label}
            </button>
        `).join('');
        
        return `
            <div class="mt-3 flex gap-2">
                ${actionButtons}
            </div>
        `;
    }
    

    info(message, options = {}) {
        return this.show({ message, type: 'info', ...options });
    }
    
    success(message, options = {}) {
        return this.show({ message, type: 'success', ...options });
    }
    
    warning(message, options = {}) {
        return this.show({ message, type: 'warning', ...options });
    }
    
    error(message, options = {}) {
        return this.show({ message, type: 'error', ...options });
    }
    
    mention(message, options = {}) {
        const { avatar, ...restOptions } = options;
        const icon = avatar ? { avatar } : null;
        return this.show({ message, type: 'mention', icon, ...restOptions });
    }
    
    discord(message, options = {}) {
        return this.show({ message, type: 'discord', ...options });
    }
}


if (typeof window !== 'undefined') {
    window.notificationToast = window.notificationToast || new NotificationToast();
}

export default NotificationToast;
