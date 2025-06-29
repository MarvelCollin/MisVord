export function loadServerPage(serverId, channelId = null) {
    console.log('[Server Loader] Starting loadServerPage with serverId:', serverId, 'channelId:', channelId);
    
    const mainContent = document.querySelector('.flex-1') ||
        document.querySelector('[class*="server-content"]') ||
        document.querySelector('main');

    console.log('[Server Loader] Found main content:', !!mainContent);
    if (mainContent) {
        if (typeof window.handleSkeletonLoading === 'function') {
            window.handleSkeletonLoading(true);
        } else {
            showPageLoading(mainContent);
        }

        const currentChannelId = getCurrentChannelId();
        if (currentChannelId && window.globalSocketManager) {
            console.log('[Server Loader] Cleaning up current channel socket: ' + currentChannelId);
            window.globalSocketManager.leaveChannel(currentChannelId);
        }

        if (window.voiceManager && typeof window.voiceManager.leaveVoice === 'function') {
            console.log('[Server Loader] Cleaning up voice manager');
            window.voiceManager.leaveVoice();
            window.voiceManager = null;
        }

        let url = `/server/${serverId}/layout`;
        if (channelId) {
            url += `?channel=${channelId}`;
        }

        console.log('[Server Loader] Fetching server layout from:', url);

        window.ajax({
            url: url,
            method: 'GET',
            dataType: 'text',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                console.log('[Server Loader] Received response, length:', response.length);
                if (typeof response === 'string') {
                    updateServerLayout(response, serverId, channelId);
                    
                    if (typeof window.handleSkeletonLoading === 'function') {
                        window.handleSkeletonLoading(false);
                    }
                    
                    if (typeof window.initServerPage === 'function') {
                        window.initServerPage();
                    }
                    
                    if (typeof window.initializeChannelClickHandlers === 'function') {
                        window.initializeChannelClickHandlers();
                    }
                    
                    const event = new CustomEvent('ServerChanged', { 
                        detail: { 
                            serverId,
                            channelId,
                            previousChannelId: currentChannelId 
                        } 
                    });
                    document.dispatchEvent(event);
                    
                } else if (response && response.data && response.data.redirect) {
                    window.location.href = response.data.redirect;
                } else {
                    console.error('[Server Loader] Invalid response format');
                    window.location.href = `/server/${serverId}`;
                }
            },
            error: function(error) {
                console.error('[Server Loader] Error loading server page:', error);
                if (typeof window.handleSkeletonLoading === 'function') {
                    window.handleSkeletonLoading(false);
                }
                window.location.href = `/server/${serverId}`;
            }
        });
    } else {
        console.error('[Server Loader] No main content container found');
        window.location.href = `/server/${serverId}`;
    }
}

function getCurrentChannelId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('channel');
}

function showPageLoading(container) {
    if (!container) return;
    container.innerHTML = `
        <div class="flex items-center justify-center h-full">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    `;
}



function updateServerLayout(html, serverId, channelId) {
    console.log('[Server Loader] Starting server layout update');
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newLayout = doc.querySelector('.flex.flex-1.overflow-hidden');
    
    if (newLayout) {
        const currentLayout = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
        if (currentLayout) {
            console.log('[Server Loader] Replacing entire server layout structure');
            showServerChannelSection();
            currentLayout.innerHTML = newLayout.innerHTML;
            executeInlineScripts(doc);
            
            let url = `/server/${serverId}`;
            if (channelId) {
                url += `?channel=${channelId}`;
            }
            
            history.pushState(
                { pageType: 'server', serverId, channelId }, 
                `misvord - Server`, 
                url
            );
            console.log('[Server Loader] Server layout update completed successfully');
        } else {
            console.error('[Server Loader] Could not find layout container to update');
            console.log('[Server Loader] Available containers:', {
                'app-container': !!document.querySelector('#app-container'),
                'flex.flex-1': !!document.querySelector('.flex.flex-1'),
                'overflow-hidden': !!document.querySelector('.overflow-hidden')
            });
        }
    } else {
        console.error('[Server Loader] Could not find new layout in response');
        console.log('[Server Loader] Response preview:', html.substring(0, 200));
    }
}

function showServerChannelSection() {
    const serverChannelSelectors = [
        '.w-60.bg-discord-dark.flex.flex-col',
        'div[class*="w-60"][class*="bg-discord-dark"]',  
        'div[class*="w-60 bg-discord-dark"]'
    ];
    
    let found = false;
    serverChannelSelectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            console.log('[Server Loader] Showing server channel section with selector:', selector);
            element.style.display = 'flex';
            found = true;
        }
    });
    
    if (!found) {
        console.log('[Server Loader] No server channel section found to show');
    }
}

function executeInlineScripts(doc) {
    const scripts = doc.querySelectorAll('script:not([src])');
    scripts.forEach(script => {
        if (script.textContent.trim()) {
            try {
                eval(script.textContent);
            } catch (error) {
                console.error('Script execution error:', error);
            }
        }
    });
}

window.loadServerPage = loadServerPage; 