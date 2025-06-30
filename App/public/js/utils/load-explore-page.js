import { NavigationManager } from './navigation-manager.js';

function loadCSS(cssFiles) {
    if (!cssFiles || !Array.isArray(cssFiles)) return Promise.resolve();
    
    const promises = cssFiles.map(cssFile => {
        return new Promise((resolve, reject) => {
            const href = `/public/css/${cssFile}.css`;
            
            if (document.querySelector(`link[href="${href}"]`)) {
                resolve();
                return;
            }
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = href;
            
            link.onload = () => resolve();
            link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
            
            document.head.appendChild(link);
        });
    });
    
    return Promise.all(promises);
}

function loadJS(jsFiles) {
    if (!jsFiles || !Array.isArray(jsFiles)) return Promise.resolve();
    
    const promises = jsFiles.map(jsFile => {
        return new Promise((resolve, reject) => {
            const src = `/public/js/${jsFile}.js`;
            
            if (document.querySelector(`script[src="${src}"]`)) {
                console.log(`[Explore Loader] Script already loaded: ${src}`);
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.type = 'module';
            script.src = src;
            
            script.onload = () => {
                console.log(`[Explore Loader] Script loaded successfully: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`[Explore Loader] Failed to load script: ${src}`);
                reject(new Error(`Failed to load JS: ${src}`));
            };
            
            document.head.appendChild(script);
        });
    });
    
    return Promise.all(promises);
}

function ensureServerAPI() {
    return new Promise((resolve) => {
        if (typeof window.serverAPI !== 'undefined') {
            console.log('[Explore Loader] Server API already available');
            resolve();
            return;
        }
        
        const serverApiScript = document.querySelector('script[src*="server-api.js"]');
        if (serverApiScript) {
            const checkAPI = () => {
                if (typeof window.serverAPI !== 'undefined') {
                    console.log('[Explore Loader] Server API ready');
                    resolve();
                } else {
                    setTimeout(checkAPI, 100);
                }
            };
            checkAPI();
        } else {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = '/public/js/api/server-api.js';
            script.onload = () => {
                const checkAPI = () => {
                    if (typeof window.serverAPI !== 'undefined') {
                        console.log('[Explore Loader] Server API loaded and ready');
                        resolve();
                    } else {
                        setTimeout(checkAPI, 100);
                    }
                };
                checkAPI();
            };
            document.head.appendChild(script);
        }
    });
}

export function loadExplorePage() {
    if (window.navigationManager) {
        return window.navigationManager.navigateToExplore();
    }
    
    console.error('[Explore Loader] Navigation manager not available, falling back to direct navigation');
    window.location.href = '/explore-servers';
}

function startExploreAjaxLoad() {
    const mainContent = document.querySelector('#app-container .flex.flex-1.overflow-hidden');

    if (mainContent) {
        if (typeof window.handleSkeletonLoading === 'function') {
            window.handleSkeletonLoading(true);
        } else {
            showPageLoading(mainContent);
        }

        const currentChannelId = getCurrentChannelId();
        if (currentChannelId && window.globalSocketManager) {
            window.globalSocketManager.leaveChannel(currentChannelId);
        }

        if (window.voiceManager && typeof window.voiceManager.leaveVoice === 'function') {
            window.voiceManager.leaveVoice();
            window.voiceManager = null;
        }

        $.ajax({
            url: '/explore-servers/layout',
            method: 'GET',
            dataType: 'html',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                if (typeof response === 'string') {
                    updateExploreLayout(response);
                    
                    if (typeof window.handleSkeletonLoading === 'function') {
                        window.handleSkeletonLoading(false);
                    }
                    
                    setTimeout(() => {
                        initializeExploreComponents();
                    }, 200);
                    
                    const event = new CustomEvent('ExplorePageChanged', { 
                        detail: { pageType: 'explore' } 
                    });
                    document.dispatchEvent(event);
                    
                } else if (response && response.data && response.data.redirect) {
                    window.location.href = response.data.redirect;
                } else {
                    window.location.href = '/explore-servers';
                }
            },
            error: function(xhr, status, error) {
                console.error('[Explore Loader] AJAX error:', error);
                if (typeof window.handleSkeletonLoading === 'function') {
                    window.handleSkeletonLoading(false);
                }
                window.location.href = '/explore-servers';
            }
        });
    } else {
        console.error('[Explore Loader] Main content container not found');
        window.location.href = '/explore-servers';
    }
}

function updateExploreLayout(html) {
    const currentLayout = document.querySelector('#app-container .flex.flex-1.overflow-hidden');

    if (currentLayout) {
        currentLayout.innerHTML = html;
        
        window.history.pushState(
            { page: 'explore' }, 
            'Explore Servers - misvord', 
            '/explore-servers'
        );
        
        if (typeof window.updateActiveServer === 'function') {
            window.updateActiveServer('explore');
        }
        
        console.log('[Explore Loader] Layout updated successfully');
    }
}

function initializeExploreComponents() {
    console.log('[Explore Loader] Initializing explore components...');
    
    if (typeof window.initExplorePage === 'function') {
        window.initExplorePage();
        console.log('[Explore Loader] Explore page initialized');
    }
    
    let attempts = 0;
    const maxAttempts = 20;
    
    const initServerDetail = () => {
        attempts++;
        console.log(`[Explore Loader] Attempt ${attempts} to initialize server detail modal...`);
        
        if (typeof window.ServerDetailModal !== 'undefined') {
            if (!window.serverDetailModal) {
                window.serverDetailModal = new window.ServerDetailModal();
                console.log('[Explore Loader] Server detail modal created');
            }
            
            window.showServerDetail = (serverId, serverData) => {
                console.log('[Explore Loader] showServerDetail called with:', serverId, serverData);
                if (window.serverDetailModal) {
                    window.serverDetailModal.showServerDetail(serverId, serverData);
                } else {
                    console.error('[Explore Loader] Server detail modal not available');
                }
            };
            
            console.log('[Explore Loader] Server detail functionality ready');
            
        } else if (attempts < maxAttempts) {
            console.log(`[Explore Loader] ServerDetailModal not ready, retrying in 200ms... (${attempts}/${maxAttempts})`);
            setTimeout(initServerDetail, 200);
        } else {
            console.error('[Explore Loader] Failed to initialize server detail modal after maximum attempts');
        }
    };
    
    initServerDetail();
    
    console.log('[Explore Loader] Setting up server navigation handlers');
    setupExploreServerNavigation();
}

function debugExploreState() {
    console.log('=== EXPLORE DEBUG STATE ===');
    console.log('ServerDetailModal available:', typeof window.ServerDetailModal !== 'undefined');
    console.log('serverDetailModal instance:', !!window.serverDetailModal);
    console.log('showServerDetail function:', typeof window.showServerDetail === 'function');
    console.log('Server API available:', typeof window.serverAPI !== 'undefined');
    console.log('Modal element exists:', !!document.getElementById('server-detail-modal'));
    console.log('Server cards count:', document.querySelectorAll('.explore-server-card').length);
    console.log('Scripts loaded:', Array.from(document.querySelectorAll('script')).map(s => s.src).filter(s => s.includes('server-detail')));
    console.log('=== END EXPLORE DEBUG ===');
}

window.debugExploreState = debugExploreState;

function showPageLoading(container) {
    container.innerHTML = `
        <div class="flex-1 bg-discord-background overflow-y-auto">
            <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                <div class="mb-8">
                    <div class="h-8 bg-gray-700 rounded w-64 mb-3 animate-pulse"></div>
                    <div class="h-4 bg-gray-700 rounded w-96 animate-pulse"></div>
                </div>
                
                <div class="mb-8 flex flex-col sm:flex-row gap-4">
                    <div class="flex-1 h-12 bg-gray-700 rounded animate-pulse"></div>
                    <div class="flex gap-3">
                        <div class="w-32 h-12 bg-gray-700 rounded animate-pulse"></div>
                        <div class="w-24 h-12 bg-gray-700 rounded animate-pulse"></div>
                    </div>
                </div>

                <div class="mb-10">
                    <div class="h-6 bg-gray-700 rounded w-48 mb-6 animate-pulse"></div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        ${Array(3).fill(0).map(() => `
                            <div class="bg-discord-dark rounded-xl overflow-hidden">
                                <div class="h-36 bg-gray-700 animate-pulse"></div>
                                <div class="p-6">
                                    <div class="h-4 bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
                                    <div class="h-3 bg-gray-700 rounded w-1/2 mb-4 animate-pulse"></div>
                                    <div class="h-10 bg-gray-700 rounded animate-pulse"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <div class="h-6 bg-gray-700 rounded w-48 mb-6 animate-pulse"></div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        ${Array(8).fill(0).map(() => `
                            <div class="bg-discord-dark rounded-xl p-5">
                                <div class="flex items-start mb-4">
                                    <div class="w-14 h-14 bg-gray-700 rounded-xl mr-4 animate-pulse"></div>
                                    <div class="flex-1">
                                        <div class="h-4 bg-gray-700 rounded w-3/4 mb-1 animate-pulse"></div>
                                        <div class="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                                    </div>
                                </div>
                                <div class="h-3 bg-gray-700 rounded mb-2 animate-pulse"></div>
                                <div class="h-3 bg-gray-700 rounded w-4/5 mb-4 animate-pulse"></div>
                                <div class="h-10 bg-gray-700 rounded animate-pulse"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getCurrentChannelId() {
    const activeChannelInput = document.getElementById('active-channel-id');
    return activeChannelInput ? activeChannelInput.value : null;
}

function setupExploreServerNavigation() {
    console.log('[Explore Navigation] Setting up server navigation handlers');
    
    setTimeout(() => {
        const serverLinks = document.querySelectorAll('a[href^="/server/"]');
        console.log('[Explore Navigation] Found', serverLinks.length, 'server links');
        
        serverLinks.forEach(link => {
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            
            newLink.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const href = this.getAttribute('href');
                const serverMatch = href.match(/\/server\/(\d+)/);
                
                if (serverMatch) {
                    const serverId = serverMatch[1];
                    console.log('[Explore Navigation] Server link clicked, navigating to server:', serverId);
                    
                    try {
                        if (loadServerPage) {
                            console.log('[Explore Navigation] Using loadServerPage function');
                            await loadServerPage(serverId);
                            
                            if (typeof window.updateActiveServer === 'function') {
                                window.updateActiveServer('server', serverId);
                            }
                        } else {
                            console.log('[Explore Navigation] loadServerPage not available, using fallback');
                            window.location.href = href;
                        }
                    } catch (error) {
                        console.error('[Explore Navigation] Error navigating to server:', error);
                        window.location.href = href;
                    }
                } else {
                    console.warn('[Explore Navigation] Invalid server link:', href);
                    window.location.href = href;
                }
            });
        });
        
        const joinButtons = document.querySelectorAll('button[data-server-id]');
        console.log('[Explore Navigation] Found', joinButtons.length, 'join server buttons');
        
        joinButtons.forEach(button => {
            if (button.textContent.includes('Join') || button.textContent.includes('Visit')) {
                const newButton = button.cloneNode(true);
                button.parentNode.replaceChild(newButton, button);
                
                newButton.addEventListener('click', async function(e) {
                    const serverId = this.getAttribute('data-server-id');
                    
                    if (serverId && !this.textContent.includes('Join')) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('[Explore Navigation] Visit server button clicked, navigating to server:', serverId);
                        
                        try {
                            if (loadServerPage) {
                                console.log('[Explore Navigation] Using loadServerPage function');
                                await loadServerPage(serverId);
                                
                                if (typeof window.updateActiveServer === 'function') {
                                    window.updateActiveServer('server', serverId);
                                }
                            } else {
                                console.log('[Explore Navigation] loadServerPage not available, using fallback');
                                window.location.href = `/server/${serverId}`;
                            }
                        } catch (error) {
                            console.error('[Explore Navigation] Error navigating to server:', error);
                            window.location.href = `/server/${serverId}`;
                        }
                    }
                });
            }
        });
        
        const serverCards = document.querySelectorAll('.explore-server-card, .server-card');
        console.log('[Explore Navigation] Found', serverCards.length, 'server cards');
        
        serverCards.forEach(card => {
            const serverId = card.getAttribute('data-server-id');
            if (serverId) {
                const newCard = card.cloneNode(true);
                card.parentNode.replaceChild(newCard, card);
                
                newCard.addEventListener('click', async function(e) {
                    if (!e.target.closest('button')) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('[Explore Navigation] Server card clicked, navigating to server:', serverId);
                        
                        try {
                            if (loadServerPage) {
                                console.log('[Explore Navigation] Using loadServerPage function');
                                await loadServerPage(serverId);
                                
                                if (typeof window.updateActiveServer === 'function') {
                                    window.updateActiveServer('server', serverId);
                                }
                            } else {
                                console.log('[Explore Navigation] loadServerPage not available, using fallback');
                                window.location.href = `/server/${serverId}`;
                            }
                        } catch (error) {
                            console.error('[Explore Navigation] Error navigating to server:', error);
                            window.location.href = `/server/${serverId}`;
                        }
                    }
                });
            }
        });
        
    }, 300);
}

function debugExploreServerNavigation() {
    console.log('=== EXPLORE SERVER NAVIGATION DEBUG ===');
    console.log('loadServerPage available:', typeof loadServerPage === 'function');
    console.log('Server links:', document.querySelectorAll('a[href^="/server/"]').length);
    console.log('Server cards:', document.querySelectorAll('.explore-server-card, .server-card').length);
    console.log('Join buttons:', document.querySelectorAll('button[data-server-id]').length);
    console.log('updateActiveServer available:', typeof window.updateActiveServer === 'function');
    console.log('=== END DEBUG ===');
}

window.loadExplorePage = loadExplorePage;
window.loadServerPage = loadServerPage;
window.debugExploreServerNavigation = debugExploreServerNavigation; 