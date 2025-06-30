import { loadServerPage } from './load-server-page.js';

export function loadHomePage(pageType = 'friends') {
    console.log('[Home Loader] Starting loadHomePage with pageType:', pageType);
    
    const mainContent = document.querySelector('.flex-1') ||
        document.querySelector('[class*="server-content"]') ||
        document.querySelector('main');

    console.log('[Home Loader] Found main content:', !!mainContent);
    if (mainContent) {
            console.log('[Home Loader] Starting skeleton loading for home content');
    handleHomeSkeletonLoading(true);
    
    // Track when skeleton started for minimum display time
    window.homeSkeletonStartTime = Date.now();

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

        $.ajax({
            url: url,
            method: 'GET',
            dataType: 'html',
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
                    
                    console.log('[Home AJAX] Disabling skeleton loading');
                    handleHomeSkeletonLoading(false);
                    
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
                    
                    console.log('[Home AJAX] Setting up server navigation handlers');
                    
                    // Disable any competing server navigation handlers
                    if (typeof window.handleServerClick === 'function') {
                        console.log('[Home AJAX] Temporarily disabling global handleServerClick');
                        window.originalHandleServerClick = window.handleServerClick;
                        window.handleServerClick = function(serverId) {
                            console.log('[Home AJAX] Intercepted handleServerClick, using loadServerPage instead');
                            return loadServerPage(serverId);
                        };
                    }
                    
                    setupHomeServerNavigation();
                    
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
                
                console.log('[Home AJAX] Disabling skeleton loading due to error');
                handleHomeSkeletonLoading(false);
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

function handleHomeSkeletonLoading(show) {
    console.log('[Home Skeleton] Handle skeleton loading:', show);
    
    if (show) {
        showHomeSkeletonLoading();
    } else {
        hideHomeSkeletonLoading();
    }
}

function showHomeSkeletonLoading() {
    console.log('[Home Skeleton] Showing home skeleton loading');
    
    const mainLayoutContainer = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
    if (!mainLayoutContainer) {
        console.warn('[Home Skeleton] Main layout container not found');
        return;
    }
    
    // Create skeleton for home layout
    const skeletonHTML = `
        <div class="home-skeleton-loading flex flex-1 overflow-hidden">
            <!-- DM Sidebar Skeleton -->
            <div class="w-60 bg-discord-darker flex flex-col">
                <div class="p-4 border-b border-gray-700">
                    <div class="h-6 bg-gray-700 rounded w-32 animate-pulse"></div>
                </div>
                
                <div class="p-3">
                    <div class="h-8 bg-gray-700 rounded w-full mb-3 animate-pulse"></div>
                </div>
                
                <div class="flex-1 p-2">
                    ${Array(6).fill().map(() => `
                        <div class="flex items-center py-2 px-3 rounded mb-1">
                            <div class="w-8 h-8 bg-gray-700 rounded-full mr-3 animate-pulse"></div>
                            <div class="flex-1">
                                <div class="h-4 bg-gray-700 rounded w-24 mb-1 animate-pulse"></div>
                                <div class="h-3 bg-gray-700 rounded w-16 animate-pulse"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="p-4 border-t border-gray-700">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-gray-700 rounded-full mr-3 animate-pulse"></div>
                        <div class="flex-1">
                            <div class="h-4 bg-gray-700 rounded w-20 mb-1 animate-pulse"></div>
                            <div class="h-3 bg-gray-700 rounded w-16 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Main Content Skeleton -->
            <div class="flex-1 bg-discord-background flex flex-col">
                <!-- Header -->
                <div class="h-12 border-b border-gray-700 px-6 flex items-center">
                    <div class="h-6 bg-gray-700 rounded w-40 animate-pulse"></div>
                    <div class="ml-auto flex space-x-3">
                        ${Array(4).fill().map(() => `<div class="w-8 h-8 bg-gray-700 rounded animate-pulse"></div>`).join('')}
                    </div>
                </div>
                
                <!-- Content Area -->
                <div class="flex-1 p-6">
                    <!-- Friends List Header -->
                    <div class="mb-6">
                        <div class="h-8 bg-gray-700 rounded w-48 mb-4 animate-pulse"></div>
                        <div class="flex space-x-4 mb-4">
                            ${Array(4).fill().map(() => `<div class="h-8 bg-gray-700 rounded w-20 animate-pulse"></div>`).join('')}
                        </div>
                    </div>
                    
                    <!-- Friends List -->
                    <div class="space-y-3">
                        ${Array(8).fill().map(() => `
                            <div class="flex items-center justify-between p-3 bg-discord-dark rounded">
                                <div class="flex items-center">
                                    <div class="w-10 h-10 bg-gray-700 rounded-full mr-3 animate-pulse"></div>
                                    <div>
                                        <div class="h-4 bg-gray-700 rounded w-24 mb-1 animate-pulse"></div>
                                        <div class="h-3 bg-gray-700 rounded w-16 animate-pulse"></div>
                                    </div>
                                </div>
                                <div class="flex space-x-2">
                                    <div class="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
                                    <div class="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Active Now Sidebar Skeleton -->
            <div class="w-60 bg-discord-background border-l border-gray-700 flex flex-col">
                <div class="p-4 border-b border-gray-700">
                    <div class="h-5 bg-gray-700 rounded w-24 animate-pulse"></div>
                </div>
                
                <div class="flex-1 p-4">
                    <div class="text-center py-8">
                        <div class="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 animate-pulse"></div>
                        <div class="h-4 bg-gray-700 rounded w-32 mx-auto mb-2 animate-pulse"></div>
                        <div class="h-3 bg-gray-700 rounded w-24 mx-auto animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    mainLayoutContainer.innerHTML = skeletonHTML;
    mainLayoutContainer.setAttribute('data-skeleton', 'home');
    console.log('[Home Skeleton] Home skeleton displayed');
}

function hideHomeSkeletonLoading() {
    console.log('[Home Skeleton] Hiding home skeleton loading');
    
    const minDisplayTime = 800; // Minimum 800ms display time
    const startTime = window.homeSkeletonStartTime || 0;
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
    
    console.log('[Home Skeleton] Elapsed time:', elapsedTime + 'ms', 'Remaining time:', remainingTime + 'ms');
    
    if (remainingTime > 0) {
        console.log('[Home Skeleton] Delaying hide to ensure minimum display time');
        setTimeout(() => {
            actuallyHideHomeSkeleton();
        }, remainingTime);
    } else {
        actuallyHideHomeSkeleton();
    }
}

function actuallyHideHomeSkeleton() {
    const mainLayoutContainer = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
    if (mainLayoutContainer && mainLayoutContainer.getAttribute('data-skeleton') === 'home') {
        // Remove skeleton attribute
        mainLayoutContainer.removeAttribute('data-skeleton');
        console.log('[Home Skeleton] Home skeleton actually hidden');
    }
    
    // Clear start time
    window.homeSkeletonStartTime = null;
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

function setupHomeServerNavigation() {
    console.log('[Home Navigation] Setting up server navigation handlers');
    
    // Disable any auto-redirect logic during server navigation
    window.homeNavigationInProgress = false;
    
    setTimeout(() => {
        const serverLinks = document.querySelectorAll('a[href^="/server/"]');
        console.log('[Home Navigation] Found', serverLinks.length, 'server links');
        
        serverLinks.forEach(link => {
            // Remove all existing event listeners
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            
            newLink.addEventListener('click', async function(e) {
                console.log('[Home Navigation] Server link clicked - preventing all defaults');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                if (window.homeNavigationInProgress) {
                    console.log('[Home Navigation] Navigation already in progress, ignoring');
                    return false;
                }
                
                window.homeNavigationInProgress = true;
                
                const href = this.getAttribute('href');
                const serverMatch = href.match(/\/server\/(\d+)/);
                
                if (serverMatch) {
                    const serverId = serverMatch[1];
                    console.log('[Home Navigation] Server link clicked, navigating to server:', serverId);
                    
                                    try {
                    if (loadServerPage) {
                        console.log('[Home Navigation] Using loadServerPage function');
                        await loadServerPage(serverId);
                        
                        if (typeof window.updateActiveServer === 'function') {
                            window.updateActiveServer('server', serverId);
                        }
                        
                        console.log('[Home Navigation] Server navigation completed successfully');
                        
                        // Clear navigation state immediately after successful navigation
                        window.homeNavigationInProgress = false;
                        console.log('[Home Navigation] Navigation state cleared');
                        
                    } else {
                        console.log('[Home Navigation] loadServerPage not available, using fallback');
                        window.homeNavigationInProgress = false;
                        window.location.href = href;
                    }
                } catch (error) {
                    console.error('[Home Navigation] Error navigating to server:', error);
                    window.homeNavigationInProgress = false;
                    window.location.href = href;
                }
                } else {
                    console.warn('[Home Navigation] Invalid server link:', href);
                    window.homeNavigationInProgress = false;
                    window.location.href = href;
                }
                
                return false;
            }, true); // Use capture phase
        });
        
        const serverButtons = document.querySelectorAll('button[data-server-id]');
        console.log('[Home Navigation] Found', serverButtons.length, 'server buttons');
        
        serverButtons.forEach(button => {
            // Remove all existing event listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', async function(e) {
                console.log('[Home Navigation] Server button clicked - preventing all defaults');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                if (window.homeNavigationInProgress) {
                    console.log('[Home Navigation] Navigation already in progress, ignoring');
                    return false;
                }
                
                window.homeNavigationInProgress = true;
                
                const serverId = this.getAttribute('data-server-id');
                console.log('[Home Navigation] Server button clicked, navigating to server:', serverId);
                
                try {
                    if (loadServerPage) {
                        console.log('[Home Navigation] Using loadServerPage function');
                        await loadServerPage(serverId);
                        
                        if (typeof window.updateActiveServer === 'function') {
                            window.updateActiveServer('server', serverId);
                        }
                        
                        console.log('[Home Navigation] Server navigation completed successfully');
                        
                        // Clear navigation state immediately after successful navigation
                        window.homeNavigationInProgress = false;
                        console.log('[Home Navigation] Navigation state cleared');
                        
                    } else {
                        console.log('[Home Navigation] loadServerPage not available, using fallback');
                        window.homeNavigationInProgress = false;
                        window.location.href = `/server/${serverId}`;
                    }
                } catch (error) {
                    console.error('[Home Navigation] Error navigating to server:', error);
                    window.homeNavigationInProgress = false;
                    window.location.href = `/server/${serverId}`;
                }
                
                return false;
            }, true); // Use capture phase
        });
        
        // Prevent any competing navigation handlers
        preventCompetingHandlers();
        
    }, 200);
}

function preventCompetingHandlers() {
    console.log('[Home Navigation] Setting up navigation protection');
    
    // Only protect during navigation, then clean up
    if (window.homeNavigationProtectionActive) {
        console.log('[Home Navigation] Protection already active, skipping');
        return;
    }
    
    window.homeNavigationProtectionActive = true;
    
    // Monitor for unexpected home redirects - but only for a short time
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
        if (window.homeNavigationInProgress && args[2] && (args[2].includes('/home') || args[2] === '/')) {
            console.warn('[Home Navigation] Blocked unexpected redirect to home during server navigation:', args[2]);
            return;
        }
        return originalPushState.apply(this, args);
    };
    
    window.history.replaceState = function(...args) {
        if (window.homeNavigationInProgress && args[2] && (args[2].includes('/home') || args[2] === '/')) {
            console.warn('[Home Navigation] Blocked unexpected replace to home during server navigation:', args[2]);
            return;
        }
        return originalReplaceState.apply(this, args);
    };
    
    // Clean up protection after navigation is definitely complete
    setTimeout(() => {
        console.log('[Home Navigation] Cleaning up navigation protection');
        window.history.pushState = originalPushState;
        window.history.replaceState = originalReplaceState;
        window.homeNavigationInProgress = false;
        window.homeNavigationProtectionActive = false;
    }, 3000); // 3 seconds should be enough for navigation to complete
}

function debugHomeServerNavigation() {
    console.log('=== HOME SERVER NAVIGATION DEBUG ===');
    console.log('loadServerPage available:', typeof loadServerPage === 'function');
    console.log('Server links:', document.querySelectorAll('a[href^="/server/"]').length);
    console.log('Server buttons:', document.querySelectorAll('button[data-server-id]').length);
    console.log('updateActiveServer available:', typeof window.updateActiveServer === 'function');
    console.log('homeNavigationInProgress:', window.homeNavigationInProgress);
    console.log('Current URL:', window.location.href);
    
    // Check for competing event handlers
    const serverLinks = document.querySelectorAll('a[href^="/server/"]');
    serverLinks.forEach((link, index) => {
        console.log(`Server link ${index}:`, {
            href: link.href,
            hasListeners: link.onclick || link.addEventListener,
            parentListeners: link.parentElement?.onclick || link.parentElement?.addEventListener
        });
    });
    
    console.log('=== END DEBUG ===');
}

function debugNavigationEvents() {
    console.log('=== NAVIGATION EVENTS DEBUG ===');
    
    // Monitor all navigation events
    window.addEventListener('beforeunload', () => console.log('[Nav Event] beforeunload'));
    window.addEventListener('unload', () => console.log('[Nav Event] unload'));
    window.addEventListener('popstate', (e) => console.log('[Nav Event] popstate:', e.state));
    window.addEventListener('hashchange', () => console.log('[Nav Event] hashchange'));
    
    // Monitor all clicks on the page
    document.addEventListener('click', function(e) {
        if (window.homeNavigationInProgress) {
            console.log('[Click Monitor] Click during home navigation:', {
                target: e.target.tagName,
                classList: e.target.classList.toString(),
                href: e.target.href,
                prevented: e.defaultPrevented
            });
        }
    }, true);
    
    console.log('Navigation event monitoring enabled');
    console.log('=== END DEBUG ===');
}

function forceResetNavigationState() {
    console.log('=== FORCE RESET NAVIGATION STATE ===');
    
    // Clear all navigation flags
    window.homeNavigationInProgress = false;
    window.homeNavigationProtectionActive = false;
    window.globalSwitchLock = false;
    
    // Clear any stuck skeleton loading
    window.homeSkeletonStartTime = null;
    handleHomeSkeletonLoading(false);
    
    // Clean up any existing intervals
    if (window.navigationCheckInterval) {
        clearInterval(window.navigationCheckInterval);
        window.navigationCheckInterval = null;
    }
    
    // Reset channel switch manager if it exists
    if (window.channelSwitchManager && window.channelSwitchManager.isLoading) {
        window.channelSwitchManager.isLoading = false;
        console.log('Reset channel switch manager loading state');
    }
    
    console.log('Navigation state reset completed');
    console.log('Current state:', {
        homeNavigationInProgress: window.homeNavigationInProgress,
        globalSwitchLock: window.globalSwitchLock,
        channelSwitchManagerLoading: window.channelSwitchManager?.isLoading,
        currentURL: window.location.href
    });
    console.log('=== END RESET ===');
}

function testHomeServerNavigation() {
    console.log('=== TESTING HOME SERVER NAVIGATION ===');
    
    // Check current state
    console.log('Current state check:', {
        page: window.location.pathname,
        homeNavigationInProgress: window.homeNavigationInProgress,
        globalSwitchLock: window.globalSwitchLock,
        loadServerPageAvailable: typeof loadServerPage === 'function',
        channelSwitchManager: !!window.channelSwitchManager,
        isLoading: window.channelSwitchManager?.isLoading
    });
    
    // Check if we're on home page
    if (!window.location.pathname.includes('/home')) {
        console.warn('Not on home page, navigation test may not work properly');
    }
    
    // Check for server links
    const serverLinks = document.querySelectorAll('a[href^="/server/"]');
    const serverButtons = document.querySelectorAll('button[data-server-id]');
    
    console.log('Navigation elements found:', {
        serverLinks: serverLinks.length,
        serverButtons: serverButtons.length
    });
    
    if (serverLinks.length === 0 && serverButtons.length === 0) {
        console.error('No server navigation elements found!');
        return false;
    }
    
    // Test if navigation handlers are properly set up
    const testLink = serverLinks[0];
    if (testLink) {
        console.log('Test link found:', {
            href: testLink.href,
            hasClickHandler: !!testLink.onclick
        });
    }
    
    console.log('✅ Test completed - check logs above for issues');
    console.log('To reset if stuck: forceResetNavigationState()');
    console.log('=== END TEST ===');
    
    return {
        serverLinks: serverLinks.length,
        serverButtons: serverButtons.length,
        canNavigate: (serverLinks.length > 0 || serverButtons.length > 0),
        state: 'ready'
    };
}

window.loadHomePage = loadHomePage;
window.loadServerPage = loadServerPage;
window.debugHomeServerNavigation = debugHomeServerNavigation;
window.debugNavigationEvents = debugNavigationEvents;
window.forceResetNavigationState = forceResetNavigationState;
window.testHomeServerNavigation = testHomeServerNavigation; 