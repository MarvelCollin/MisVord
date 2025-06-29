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
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = src;
            
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load JS: ${src}`));
            
            document.head.appendChild(script);
        });
    });
    
    return Promise.all(promises);
}

export function loadExplorePage() {
    const requiredCSS = ['explore-servers', 'server-detail'];
    const requiredJS = ['components/servers/server-detail'];
    
    Promise.all([
        loadCSS(requiredCSS),
        loadJS(requiredJS)
    ]).then(() => {
        console.log('[Explore Loader] All assets loaded successfully');
    }).catch(error => {
        console.error('[Explore Loader] Failed to load assets:', error);
    });
    
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
                    
                    initializeExploreComponents();
                    
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
                if (typeof window.handleSkeletonLoading === 'function') {
                    window.handleSkeletonLoading(false);
                }
                window.location.href = '/explore-servers';
            }
        });
    } else {
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
    }
}

function initializeExploreComponents() {
    if (typeof window.initExplorePage === 'function') {
        window.initExplorePage();
    }
    
    setTimeout(() => {
        if (typeof window.ServerDetailModal !== 'undefined') {
            if (!window.serverDetailModal) {
                window.serverDetailModal = new window.ServerDetailModal();
            }
            
            window.showServerDetail = (serverId, serverData) => {
                if (window.serverDetailModal) {
                    window.serverDetailModal.showServerDetail(serverId, serverData);
                }
            };
        }
    }, 100);
}

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

window.loadExplorePage = loadExplorePage; 