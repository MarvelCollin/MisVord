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

        console.log('[Home AJAX] Starting request to:', url);
        console.log('[Home AJAX] Request headers:', {
            'X-Requested-With': 'XMLHttpRequest',
            'method': 'GET',
            'dataType': 'text'
        });

        window.ajax({
            url: url,
            method: 'GET',
            dataType: 'text',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                console.log('[Home AJAX] SUCCESS - Response received');
                console.log('[Home AJAX] Response type:', typeof response);
                console.log('[Home AJAX] Response length:', response ? response.length : 'null');
                console.log('[Home AJAX] Response preview:', response ? response.substring(0, 150) + '...' : 'empty');
                
                if (typeof response === 'string') {
                    console.log('[Home AJAX] Processing string response');
                    updateHomeLayout(response);
                    
                    console.log('[Home AJAX] Validating layout update');
                    validateHomeLayoutRendering();
                    
                    if (typeof window.handleSkeletonLoading === 'function') {
                        window.handleSkeletonLoading(false);
                        console.log('[Home AJAX] Skeleton loading disabled');
                    }
                    
                    if (typeof window.initHomePage === 'function') {
                        window.initHomePage();
                        console.log('[Home AJAX] Home page initialized');
                    }
                    
                    console.log('[Home AJAX] Initializing home components');
                    if (typeof window.initFriendsTabManager === 'function') {
                        window.initFriendsTabManager();
                        console.log('[Home AJAX] Friends tab manager initialized');
                    }
                    if (typeof window.initDirectMessageNavigation === 'function') {
                        window.initDirectMessageNavigation();
                        console.log('[Home AJAX] Direct message navigation initialized');
                    }
                    
                    const event = new CustomEvent('HomePageChanged', { 
                        detail: { 
                            pageType,
                            previousChannelId: currentChannelId 
                        } 
                    });
                    document.dispatchEvent(event);
                    console.log('[Home AJAX] HomePageChanged event dispatched');
                    
                } else if (response && response.data && response.data.redirect) {
                    console.log('[Home AJAX] Redirect response:', response.data.redirect);
                    window.location.href = response.data.redirect;
                } else {
                    console.error('[Home AJAX] INVALID RESPONSE FORMAT');
                    console.error('[Home AJAX] Expected string, got:', typeof response);
                    console.error('[Home AJAX] Response content:', response);
                    window.location.href = '/home';
                }
            },
            error: function(xhr, status, error) {
                console.error('[Home AJAX] ERROR - Request failed');
                console.error('[Home AJAX] XHR status:', xhr ? xhr.status : 'unknown');
                console.error('[Home AJAX] XHR statusText:', xhr ? xhr.statusText : 'unknown');
                console.error('[Home AJAX] Error status:', status);
                console.error('[Home AJAX] Error message:', error);
                console.error('[Home AJAX] XHR responseText:', xhr ? xhr.responseText : 'none');
                
                if (typeof window.handleSkeletonLoading === 'function') {
                    window.handleSkeletonLoading(false);
                }
                console.error('[Home AJAX] FALLBACK - Redirecting to /home');
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
    console.log('[Home Layout] Starting home layout replacement');
    console.log('[Home Layout] Input HTML length:', html.length);
    console.log('[Home Layout] HTML preview:', html.substring(0, 200) + '...');
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    console.log('[Home Layout] DOM parsed successfully');
    
    const newLayout = doc.querySelector('.flex.flex-1.overflow-hidden');
    console.log('[Home Layout] New layout element found:', !!newLayout);
    
    if (newLayout) {
        console.log('[Home Layout] New layout innerHTML length:', newLayout.innerHTML.length);
        
        const currentLayout = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
        console.log('[Home Layout] Current layout container found:', !!currentLayout);
        
        if (currentLayout) {
            console.log('[Home Layout] Before replacement - current layout children:', currentLayout.children.length);
            
            console.log('[Home Layout] Hiding server channel section');
            hideServerChannelSection();
            
            console.log('[Home Layout] Replacing layout innerHTML');
            currentLayout.innerHTML = newLayout.innerHTML;
            
            console.log('[Home Layout] After replacement - new layout children:', currentLayout.children.length);
            console.log('[Home Layout] New layout structure:', {
                directChildren: Array.from(currentLayout.children).map(child => ({
                    tagName: child.tagName,
                    className: child.className,
                    id: child.id
                }))
            });
            
            console.log('[Home Layout] Executing inline scripts');
            executeInlineScripts(doc);
            
            console.log('[Home Layout] Updating browser history');
            history.pushState(
                { pageType: 'home', serverId: null }, 
                'misvord - Home', 
                '/home'
            );
            
            if (typeof window.updateActiveServer === 'function') {
                window.updateActiveServer('home');
                console.log('[Home Layout] Active server state updated for home');
            }
            
            console.log('[Home Layout] SUCCESS - Home layout replacement completed');
        } else {
            console.error('[Home Layout] FAILED - Layout container not found');
            console.error('[Home Layout] Available containers:', {
                'app-container': !!document.querySelector('#app-container'),
                'flex.flex-1': !!document.querySelector('.flex.flex-1'),
                'overflow-hidden': !!document.querySelector('.overflow-hidden'),
                'all-flex-elements': document.querySelectorAll('.flex').length
            });
        }
    } else {
        console.error('[Home Layout] FAILED - New layout element not found in response');
        console.error('[Home Layout] Available elements in response:', {
            'flex-elements': doc.querySelectorAll('.flex').length,
            'overflow-elements': doc.querySelectorAll('.overflow-hidden').length,
            'body-children': doc.body ? doc.body.children.length : 0
        });
        console.error('[Home Layout] Response HTML structure preview:', html.substring(0, 500));
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

function validateHomeLayoutRendering() {
    console.log('[Home Validation] Starting layout validation');
    
    const validationChecks = {
        'app-container': !!document.querySelector('#app-container'),
        'main-content-layout': !!document.querySelector('.flex.flex-1.overflow-hidden'),
        'dm-sidebar': !!document.querySelector('.w-60.bg-discord-darker'),
        'friends-section': !!document.querySelector('[class*="Friends"]') || !!document.querySelector('.tab-content'),
        'active-now-section': !!document.querySelector('.w-60.bg-discord-background'),
        'home-layout-structure': !!document.querySelector('#main-content')
    };
    
    console.log('[Home Validation] Layout validation results:', validationChecks);
    
    const failedChecks = Object.keys(validationChecks).filter(key => !validationChecks[key]);
    if (failedChecks.length > 0) {
        console.error('[Home Validation] FAILED VALIDATION - Missing elements:', failedChecks);
        console.error('[Home Validation] Available containers:');
        console.error('[Home Validation] - app-container:', document.querySelector('#app-container'));
        console.error('[Home Validation] - flex containers:', document.querySelectorAll('.flex').length);
        console.error('[Home Validation] - sidebar containers:', document.querySelectorAll('[class*="w-60"]').length);
    } else {
        console.log('[Home Validation] SUCCESS - All layout elements rendered correctly');
    }
    
    const homeIndicators = {
        'url-is-home': window.location.pathname === '/home' || window.location.pathname === '/home/' || window.location.pathname === '/',
        'active-home-icon': !!document.querySelector('.server-icon.active:first-child'),
        'no-server-channels': !document.querySelector('.channel-wrapper') || document.querySelector('.channel-wrapper').style.display === 'none'
    };
    
    console.log('[Home Validation] Home state indicators:', homeIndicators);
    
    return failedChecks.length === 0;
}

function executeInlineScripts(doc) {
    const scripts = doc.querySelectorAll('script:not([src])');
    console.log('[Home Scripts] Found', scripts.length, 'inline scripts to execute');
    scripts.forEach((script, index) => {
        if (script.textContent.trim()) {
            try {
                console.log('[Home Scripts] Executing script', index + 1);
                eval(script.textContent);
            } catch (error) {
                console.error('[Home Scripts] Script execution error for script', index + 1, ':', error);
            }
        }
    });
}

window.loadHomePage = loadHomePage; 