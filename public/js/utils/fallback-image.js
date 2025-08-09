class FallbackImageHandler {
    constructor() {
        this.defaultImage = '/public/assets/common/default-profile-picture.png';
        this.fallbackInitials = {};
        this.processedImages = new WeakSet();
        this.init();
    }

    init() {
        this.setupImageObserver();
        this.processExistingImages();
    }

    setupImageObserver() {
        if (!window.IntersectionObserver) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.processImage(entry.target);
                }
            });
        });

        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        const images = node.tagName === 'IMG' ? [node] : node.querySelectorAll('img');
                        images.forEach(img => {
                            observer.observe(img);
                            this.processImage(img);
                        });
                    }
                });
            });
        });

        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        document.querySelectorAll('img').forEach(img => {
            observer.observe(img);
        });
    }

    processExistingImages() {
        document.querySelectorAll('img').forEach(img => {
            this.processImage(img);
        });
    }

    processImage(img) {
        if (this.processedImages.has(img)) return;
        this.processedImages.add(img);

        if (!img.dataset.fallbackHandled) {
            this.setupImageFallback(img);
            img.dataset.fallbackHandled = 'true';
        }
    }

    setupImageFallback(img) {
        const originalSrc = img.src;
        const alt = img.alt || '';
        const fallbackName = this.extractNameFromAlt(alt);

        const handleError = () => {
            if (img.src === this.defaultImage) {
                this.showInitialFallback(img, fallbackName);
                return;
            }
            
            img.onerror = () => {
                this.showInitialFallback(img, fallbackName);
            };
            img.src = this.defaultImage;
        };

        const handleLoad = () => {
            if (img.complete && img.naturalHeight !== 0) {
                this.hideInitialFallback(img);
            }
        };

        img.onerror = handleError;
        img.onload = handleLoad;

        if (!originalSrc || originalSrc === '' || originalSrc === 'null' || originalSrc === 'undefined') {
            img.src = this.defaultImage;
        }

        if (img.complete) {
            if (img.naturalHeight === 0) {
                handleError();
            } else {
                handleLoad();
            }
        }
    }

    extractNameFromAlt(alt) {
        if (!alt) return 'U';
        
        const cleanName = alt.replace(/server|icon|image|avatar|profile/gi, '').trim();
        return cleanName.charAt(0).toUpperCase() || 'U';
    }

    showInitialFallback(img, name) {
        const container = img.parentElement;
        if (!container) return;

        let fallbackDiv = container.querySelector('.fallback-initial');
        
        if (!fallbackDiv) {
            fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'fallback-initial';
            container.appendChild(fallbackDiv);
        }

        const isCircular = this.isCircularImage(img);
        const size = this.getImageSize(img);

        fallbackDiv.style.cssText = `
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #5865f2, #7289da);
            color: white;
            font-weight: bold;
            font-size: ${Math.max(size.width * 0.4, 14)}px;
            border-radius: ${isCircular ? '50%' : this.getBorderRadius(img)};
            z-index: 1;
            text-transform: uppercase;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        fallbackDiv.textContent = name;
        img.style.opacity = '0';
    }

    hideInitialFallback(img) {
        const container = img.parentElement;
        if (!container) return;

        const fallbackDiv = container.querySelector('.fallback-initial');
        if (fallbackDiv) {
            fallbackDiv.style.display = 'none';
        }
        img.style.opacity = '1';
    }

    isCircularImage(img) {
        const computedStyle = window.getComputedStyle(img);
        const borderRadius = computedStyle.borderRadius;
        
        return borderRadius === '50%' || 
               borderRadius.includes('50%') ||
               img.classList.contains('rounded-full') ||
               img.closest('.rounded-full') ||
               img.id.includes('modal-icon') ||
               img.classList.contains('server-icon') ||
               img.classList.contains('user-avatar') ||
               img.classList.contains('profile-picture');
    }

    getBorderRadius(img) {
        const computedStyle = window.getComputedStyle(img);
        return computedStyle.borderRadius || '8px';
    }

    getImageSize(img) {
        const rect = img.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(img);
        
        return {
            width: rect.width || parseInt(computedStyle.width) || 48,
            height: rect.height || parseInt(computedStyle.height) || 48
        };
    }

    setImageSrc(img, src, name = null) {
        if (this.processedImages.has(img)) {
            this.processedImages.delete(img);
        }
        
        if (!src || src === 'null' || src === 'undefined' || src === '') {
            img.src = this.defaultImage;
        } else {
            img.src = src;
        }
        
        if (name) {
            img.alt = name;
        }
        
        this.processImage(img);
    }

    updateServerIcon(iconElement, iconUrl, serverName) {
        if (!iconElement) return;

        const fallbackElement = document.getElementById('server-modal-icon-fallback') || 
                               iconElement.parentElement?.querySelector('.fallback-initial');

        if (iconUrl) {
            iconElement.src = iconUrl;
            iconElement.style.display = 'block';
            iconElement.onerror = () => {
                iconElement.src = this.defaultImage;
                iconElement.onerror = () => {
                    iconElement.style.display = 'none';
                    if (fallbackElement) {
                        fallbackElement.style.display = 'flex';
                        fallbackElement.textContent = (serverName || 'S').charAt(0).toUpperCase();
                    }
                };
            };
            iconElement.onload = () => {
                if (fallbackElement) {
                    fallbackElement.style.display = 'none';
                }
            };
        } else {
            iconElement.src = this.defaultImage;
            iconElement.style.display = 'block';
            iconElement.onerror = () => {
                iconElement.style.display = 'none';
                if (fallbackElement) {
                    fallbackElement.style.display = 'flex';
                    fallbackElement.textContent = (serverName || 'S').charAt(0).toUpperCase();
                }
            };
            if (fallbackElement) {
                fallbackElement.style.display = 'none';
            }
        }
    }

    static getInstance() {
        if (!window.fallbackImageHandler) {
            window.fallbackImageHandler = new FallbackImageHandler();
        }
        return window.fallbackImageHandler;
    }
}
    
const fallbackHandler = FallbackImageHandler.getInstance();

window.FallbackImageHandler = FallbackImageHandler;
window.fallbackImageHandler = fallbackHandler;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FallbackImageHandler;
}

document.addEventListener('DOMContentLoaded', () => {
    fallbackHandler.processExistingImages();
});

window.FallbackImageHandler = FallbackImageHandler;
