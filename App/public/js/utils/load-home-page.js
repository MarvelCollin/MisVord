export function loadHomePage(pageType = 'friends') {
    console.log('[Home Loader] Starting loadHomePage with pageType:', pageType);
    
    const mainContent = document.querySelector('.flex-1') ||
        document.querySelector('[class*="server-content"]') ||
        document.querySelector('main');

    console.log('[Home Loader] Found main content:', !!mainContent);
    if (mainContent) {
        if (typeof window.handleSkeletonLoading === 'function') {
            window.handleSkeletonLoading(true);
        } else {
            showPageLoading(mainContent);
        }

        const currentChannelId = getCurrentChannelId();
        if (currentChannelId && window.globalSocketManager) {
            console.log('Cleaning up current channel socket: ' + currentChannelId);
            window.globalSocketManager.leaveChannel(currentChannelId);
        }

        if (window.voiceManager && typeof window.voiceManager.leaveVoice === 'function') {
            console.log('Cleaning up voice manager');
            window.voiceManager.leaveVoice();
            window.voiceManager = null;
        }

        let url = '/home/layout';
        if (pageType && pageType !== 'friends') {
            url += '?type=' + pageType;
        }

        window.ajax({
            url: url,
            method: 'GET',
            dataType: 'text',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                if (typeof response === 'string') {
                    updateHomeLayout(response);
                    
                    if (typeof window.handleSkeletonLoading === 'function') {
                        window.handleSkeletonLoading(false);
                    }
                    
                    if (typeof window.initHomePage === 'function') {
                        window.initHomePage();
                    }
                    
                    const event = new CustomEvent('HomePageChanged', { 
                        detail: { 
                            pageType,
                            previousChannelId: currentChannelId 
                        } 
                    });
                    document.dispatchEvent(event);
                    
                } else if (response && response.data && response.data.redirect) {
                    window.location.href = response.data.redirect;
                } else {
                    window.location.href = '/home';
                }
            },
            error: function(error) {
                console.error('Error loading home page:', error);
                if (typeof window.handleSkeletonLoading === 'function') {
                    window.handleSkeletonLoading(false);
                }
                window.location.href = '/home';
            }
        });
    } else {
        window.location.href = '/home';
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

function updateHomeLayout(html) {
    console.log('[Home Loader] Starting layout update');
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newLayout = doc.querySelector('.flex.flex-1.overflow-hidden');
    
    if (newLayout) {
        const currentLayout = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
        if (currentLayout) {
            console.log('[Home Loader] Replacing entire home layout structure');
            hideServerChannelSection();
            currentLayout.innerHTML = newLayout.innerHTML;
            executeInlineScripts(doc);
            
            history.pushState(
                { pageType: 'home', serverId: null }, 
                'misvord - Home', 
                '/home'
            );
            console.log('[Home Loader] Layout update completed successfully');
        } else {
            console.error('[Home Loader] Could not find layout container to update');
            console.log('[Home Loader] Available containers:', {
                'app-container': !!document.querySelector('#app-container'),
                'flex.flex-1': !!document.querySelector('.flex.flex-1'),
                'overflow-hidden': !!document.querySelector('.overflow-hidden')
            });
        }
    } else {
        console.error('[Home Loader] Could not find new layout in response');
        console.log('[Home Loader] Response preview:', html.substring(0, 200));
    }
}

function hideServerChannelSection() {
    const serverChannelSelectors = [
        '.w-60.bg-discord-dark.flex.flex-col',
        'div[class*="w-60"][class*="bg-discord-dark"]',  
        'div[class*="w-60 bg-discord-dark"]'
    ];
    
    let found = false;
    serverChannelSelectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            console.log('[Home Loader] Found server channel section with selector:', selector);
            element.style.display = 'none';
            found = true;
        }
    });
    
    if (!found) {
        console.log('[Home Loader] No server channel section found to hide');
        const allElements = document.querySelectorAll('div[class*="w-60"]');
        console.log('[Home Loader] Available w-60 elements:', allElements.length);
        allElements.forEach((el, i) => {
            console.log(`[Home Loader] Element ${i}:`, el.className);
        });
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

window.loadHomePage = loadHomePage; 