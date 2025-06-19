if (typeof window !== 'undefined' && !window.LazyLoader) {
    const safeLog = {
        debug: (module, ...args) => {
            if (typeof window.logger !== 'undefined') {
                window.logger.debug(module, ...args);
            } else {
                console.log(`[${module.toUpperCase()}]`, ...args);
            }
        }
    };

    window.LazyLoader = {
        init() {
            this.setupObserver();
            document.querySelectorAll('[data-lazyload]').forEach(element => {
                this.showLoadingState(element);
            });
            this.addGlobalLoadingIndicator();
            this.listenForDataEvents();
            safeLog.debug('ui', 'Lazy Loader initialized');
        },

        setupObserver() {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const lazyElements = node.querySelectorAll ? 
                                    node.querySelectorAll('[data-lazyload]') : [];

                                lazyElements.forEach(element => {
                                    this.showLoadingState(element);
                                });

                                if (node.hasAttribute && node.hasAttribute('data-lazyload')) {
                                    this.showLoadingState(node);
                                }
                            }
                        });
                    }
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },

        showLoadingState() {
            console.log('LazyLoader method executed from global object');
        },
        
        triggerDataLoaded(type, isEmpty = false) {
            safeLog.debug('ui', `Data loaded for type: ${type}, isEmpty: ${isEmpty}`);
        },
        
        addGlobalLoadingIndicator() {
        },
        
        listenForDataEvents() {
        }
    };
    
    safeLog.debug('ui', 'LazyLoader assigned to window object for backward compatibility');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.dispatchEvent(new CustomEvent('LazyLoaderReady', { detail: window.LazyLoader }));
        });
    } else {
        window.dispatchEvent(new CustomEvent('LazyLoaderReady', { detail: window.LazyLoader }));
    }
}

const LazyLoader = {
    safeLog: {
        debug: (module, ...args) => {
            if (typeof window.logger !== 'undefined') {
                window.logger.debug(module, ...args);
            } else {
                console.log(`[${module.toUpperCase()}]`, ...args);
            }
        }
    },

    init() {
        this.setupObserver();
        document.querySelectorAll('[data-lazyload]').forEach(element => {
            this.showLoadingState(element);
        });
        this.addGlobalLoadingIndicator();
        this.listenForDataEvents();
        this.safeLog.debug('ui', 'Lazy Loader initialized');
        
        if (typeof window !== 'undefined' && window.LazyLoader) {
            Object.assign(window.LazyLoader, this);
        }
    },

    setupObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const type = element.getAttribute('data-lazyload');

                    this.triggerLoad(element, type);
                    
                    this.observer.unobserve(element);
                }
            });
        }, options);

        document.querySelectorAll('[data-lazyload]').forEach(element => {
            this.observer.observe(element);
        });
    },

    showLoadingState(element) {
        if (element.classList.contains('content-loaded')) return;
        
        element.classList.add('content-loading');
        
        const type = element.getAttribute('data-lazyload');
        const hasSkeletonLoader = element.querySelector('.skeleton-loader');
        
        if (!hasSkeletonLoader) {
            const loader = this.createSkeletonLoader(type);
            if (loader) {
                element.appendChild(loader);
            }
        }
    },

    createSkeletonLoader(type) {
        const wrapper = document.createElement('div');
        wrapper.className = 'skeleton-loader';

        switch (type) {
            case 'user-list':
        for (let i = 0; i < 5; i++) {
                    const item = document.createElement('div');
                    item.className = 'skeleton-user-item';

                const avatar = document.createElement('div');
                    avatar.className = 'skeleton-avatar';

            const content = document.createElement('div');
                    content.className = 'skeleton-content';
                    
                    item.appendChild(avatar);
                    item.appendChild(content);
                    wrapper.appendChild(item);
                }
                break;
                
            case 'message-list':
        for (let i = 0; i < 8; i++) {
                    const item = document.createElement('div');
                    item.className = 'skeleton-message';

            const avatar = document.createElement('div');
                    avatar.className = 'skeleton-avatar';
                    
                    const content = document.createElement('div');
                    content.className = 'skeleton-content';
                    
                    const line1 = document.createElement('div');
                    line1.className = 'skeleton-line short';
                    
                    const line2 = document.createElement('div');
                    line2.className = 'skeleton-line medium';
                    
                    content.appendChild(line1);
                    content.appendChild(line2);
                    
                    item.appendChild(avatar);
                    item.appendChild(content);
                    wrapper.appendChild(item);
                }
                break;
                
            case 'channel-list':
        for (let i = 0; i < 6; i++) {
                    const item = document.createElement('div');
                    item.className = 'skeleton-channel';
                    
                    const icon = document.createElement('div');
                    icon.className = 'skeleton-icon';
                    
                    const line = document.createElement('div');
                    line.className = 'skeleton-line medium';
                    
                    item.appendChild(icon);
                    item.appendChild(line);
                    wrapper.appendChild(item);
                }
                break;
                
            case 'server-list':
                for (let i = 0; i < 4; i++) {
                    const item = document.createElement('div');
                    item.className = 'skeleton-server';
                    wrapper.appendChild(item);
                }
                break;
                
            default:
                const pulseLoader = document.createElement('div');
                pulseLoader.className = 'dot-loader';
                
                for (let i = 0; i < 3; i++) {
                    const dot = document.createElement('div');
                    pulseLoader.appendChild(dot);
                }
                
                wrapper.appendChild(pulseLoader);
        }
        
        return wrapper;
    },

    addGlobalLoadingIndicator() {
        if (document.getElementById('globalLoadingIndicator')) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'globalLoadingIndicator';
        indicator.className = 'fixed top-0 left-0 w-full h-1 bg-transparent z-50 pointer-events-none';
        
        const progress = document.createElement('div');
        progress.className = 'h-full bg-gradient-to-r from-blue-500 to-purple-500 w-0 transition-all duration-300 ease-out';
        
        indicator.appendChild(progress);
        document.body.appendChild(indicator);
    },

    updateGlobalLoadingProgress(percent) {
        const indicator = document.getElementById('globalLoadingIndicator');
        if (!indicator) return;
        
        const progress = indicator.querySelector('div');
        if (progress) {
            progress.style.width = `${percent}%`;
            
            if (percent >= 100) {
                setTimeout(() => {
                    progress.style.width = '0%';
                }, 500);
            }
        }
    },

    triggerLoad(element, type) {
        console.log(`🔄 Triggering lazy load for type: ${type}`);
        
        const event = new CustomEvent('LazyLoad', {
            detail: { 
                element, 
                type 
            }
        });
        
        document.dispatchEvent(event);
        element.dispatchEvent(event);
        
        if (type === 'channel-list') {
            console.log('📂 Channel list loading dispatched');
        }
        
        this.updateGlobalLoadingProgress(25);
    },

    triggerDataLoaded(type, isEmpty = false) {
        console.log(`✅ Data loaded for type: ${type}, isEmpty: ${isEmpty}`);
        
        const event = new CustomEvent('LazyLoadComplete', {
            detail: { 
                type,
                isEmpty,
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(event);
        
        this.updateGlobalLoadingProgress(100);
        
        const elements = document.querySelectorAll(`[data-lazyload="${type}"]`);
        elements.forEach(element => {
            element.classList.remove('content-loading');
            element.classList.add('content-loaded');
            
            const skeletonLoader = element.querySelector('.skeleton-loader');
            if (skeletonLoader) {
                skeletonLoader.classList.add('fade-out');
                setTimeout(() => {
                    if (skeletonLoader.parentNode === element) {
                        element.removeChild(skeletonLoader);
                    }
                }, 300);
            }
        });
    },

    listenForDataEvents() {
        document.addEventListener('LazyLoadStart', (event) => {
            const { element } = event.detail;
            if (element) {
                this.showLoadingState(element);
                this.updateGlobalLoadingProgress(50);
            }
        });
        
        document.addEventListener('LazyLoadComplete', (event) => {
            const { element } = event.detail;
            if (element) {
                element.classList.remove('content-loading');
                element.classList.add('content-loaded');
                
                const skeletonLoader = element.querySelector('.skeleton-loader');
                if (skeletonLoader) {
                    skeletonLoader.classList.add('fade-out');
                setTimeout(() => {
                        if (skeletonLoader.parentNode === element) {
                            element.removeChild(skeletonLoader);
                    }
                }, 300);
                }
                
                this.updateGlobalLoadingProgress(100);
            }
        });
    }
};

if (typeof window !== 'undefined') {
    window.LazyLoader = Object.assign(window.LazyLoader || {}, LazyLoader);
    LazyLoader.safeLog.debug('ui', 'LazyLoader assigned to window object');

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.dispatchEvent(new CustomEvent('LazyLoaderReady', { detail: LazyLoader }));
        });
    } else {
        window.dispatchEvent(new CustomEvent('LazyLoaderReady', { detail: LazyLoader }));
    }
}

export { LazyLoader };

