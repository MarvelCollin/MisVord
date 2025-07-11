if (typeof window !== 'undefined' && !window.LazyLoader) {
    const safeLog = {
        debug: (module, ...args) => {
            if (typeof window.logger !== 'undefined') {
                window.logger.debug(module, ...args);
            } else {

            }
        }
    };

    window.LazyLoader = {
        init() {
            this.setupObserver();
            document.querySelectorAll('[data-lazyload]').forEach(element => {
                this.showLoadingState(element);
            });
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

        },
        
        triggerDataLoaded(type, isEmpty = false) {
            safeLog.debug('ui', `Data loaded for type: ${type}, isEmpty: ${isEmpty}`);
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

            }
        }
    },        init() {
            this.setupObserver();
            document.querySelectorAll('[data-lazyload]').forEach(element => {
                this.showLoadingState(element);
            });
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

    triggerLoad(element, type) {

        
        const event = new CustomEvent('LazyLoad', {
            detail: { 
                element, 
                type 
            }
        });
        
        document.dispatchEvent(event);
        element.dispatchEvent(event);
        
        if (type === 'channel-list') {

        }
    },

    triggerDataLoaded(type, isEmpty = false) {

        
        const event = new CustomEvent('LazyLoadComplete', {
            detail: { 
                type,
                isEmpty,
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(event);
        
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

