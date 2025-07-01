async function getDefaultChannelForServer(serverId) {
    try {
        const response = await fetch(`/api/servers/${serverId}/channels`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.channels && data.data.channels.length > 0) {
            const textChannel = data.data.channels.find(channel => 
                channel.type === 'text' || channel.type === 0 || channel.type_name === 'text'
            );
            return textChannel ? textChannel.id : data.data.channels[0].id;
        }
        return null;
    } catch (error) {
        console.error('[Server AJAX] Error getting default channel:', error);
        return null;
    }
}

function isAllowedVoicePage(path) {
    const isHomePage = path === '/home' || path === '/home/' || path === '/';
    const isServerPage = path.includes('/server/');
    const isExplorePage = path.includes('/explore-server') || path === '/explore-servers';
    
    return isHomePage || isServerPage || isExplorePage;
}

function shouldPreserveVoiceConnection(targetPath) {
    const currentPath = window.location.pathname;
    const currentAllowed = isAllowedVoicePage(currentPath);
    const targetAllowed = isAllowedVoicePage(targetPath);
    
    return currentAllowed && targetAllowed;
}

export async function loadServerPage(serverId, channelId = null) {
    console.log('[Server AJAX] Loading server page with parameters:', { serverId, channelId });
    
    const mainContent = document.querySelector('#app-container .flex.flex-1.overflow-hidden');

    if (mainContent) {
        if (typeof window.handleSkeletonLoading === 'function') {
            console.log('[Server AJAX] Using global skeleton loading');
            window.handleSkeletonLoading(true);
        } else {
            console.log('[Server AJAX] Using server-specific skeleton loading');
            handleServerSkeletonLoading(true);
        }

        const currentChannelId = getCurrentChannelId();
        console.log('[Server AJAX] Current channel ID:', currentChannelId);
        console.log('[Server AJAX] Target channel ID:', channelId);

        if (currentChannelId && window.globalSocketManager) {
            console.log('[Server Loader] Cleaning up current channel socket: ' + currentChannelId);
            window.globalSocketManager.leaveChannel(currentChannelId);
        }

        const targetPath = `/server/${serverId}`;
        const shouldPreserveVoice = shouldPreserveVoiceConnection(targetPath);
        
        if (window.voiceManager && typeof window.voiceManager.leaveVoice === 'function') {
            if (shouldPreserveVoice) {
                console.log('[Server Loader] Preserving voice connection - navigating between allowed pages');
            } else {
                console.log('[Server Loader] Cleaning up voice manager');
                window.voiceManager.leaveVoice();
            }
        }

        if (!channelId) {
            console.log('[Server AJAX] Getting default channel for server:', serverId);
            channelId = await getDefaultChannelForServer(serverId);
        }

        let url = `/server/${serverId}/layout`;
        if (channelId) {
            url += `?channel=${channelId}`;
        }

        console.log('[Server AJAX] Starting request to:', url);
        console.log('[Server AJAX] Request params:', {
            serverId: serverId,
            channelId: channelId,
            method: 'GET',
            dataType: 'text'
        });
        console.log('[Server AJAX] Request headers:', {
            'X-Requested-With': 'XMLHttpRequest'
        });

        $.ajax({
            url: url,
            method: 'GET',
            dataType: 'text',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                console.log('[Server AJAX] SUCCESS - Response received');
                console.log('[Server AJAX] Response type:', typeof response);
                console.log('[Server AJAX] Response length:', response ? response.length : 0);
                console.log('[Server AJAX] Response preview:', response ? response.substring(0, 100) + '...' : 'empty');

                if (typeof response === 'string' && response.trim().length > 0) {
                    console.log('[Server AJAX] Valid HTML response received, processing...');
                    
                    setTimeout(() => {
                        performServerLayoutUpdate(response, serverId, channelId, currentChannelId);
                    }, 100);
                } else if (response && response.data && response.data.redirect) {
                    console.log('[Server AJAX] Redirect response:', response.data.redirect);
                    console.warn('[Server AJAX] Redirect responses disabled - staying in AJAX mode');
                } else {
                    console.error('[Server AJAX] INVALID RESPONSE FORMAT');
                    console.error('[Server AJAX] Expected string, got:', typeof response);
                    console.error('[Server AJAX] Response content:', response);
                    console.warn('[Server AJAX] Fallback redirects disabled - handling error gracefully');
                }
            },
            error: function(xhr, status, error) {
                console.error('[Server AJAX] ERROR - Request failed');
                console.error('[Server AJAX] XHR status:', xhr ? xhr.status : 'unknown');
                console.error('[Server AJAX] XHR statusText:', xhr ? xhr.statusText : 'unknown');
                console.error('[Server AJAX] Error status:', status);
                console.error('[Server AJAX] Error message:', error);
                console.error('[Server AJAX] XHR responseText:', xhr ? xhr.responseText : 'none');
                console.error('[Server AJAX] Target URL was:', url);
                
                console.log('[Server AJAX] Disabling skeleton loading due to error');
                handleServerSkeletonLoading(false);
                
                if (window.simpleChannelSwitcher) {
                    console.log('[Server AJAX] Keeping simple channel switcher for reuse');
                }
                
                console.error('[Server AJAX] Server loading failed');
                console.warn('[Server AJAX] Error fallback redirects disabled - staying in AJAX mode');
            }
        });
    } else {
        console.error('[Server Loader] No main content container found');
        console.warn('[Server Loader] Container fallback redirects disabled - cannot load server');
    }
}

function performServerLayoutUpdate(response, serverId, channelId, currentChannelId) {
    console.log('[Server Layout] Performing delayed layout update');
    
    updateServerLayout(response, serverId, channelId);
    
    console.log('[Server AJAX] Validating server layout');
    validateServerLayoutRendering(serverId, channelId);
    
    console.log('[Server AJAX] Disabling skeleton loading');
    handleServerSkeletonLoading(false);
    
    console.log('[Server AJAX] Starting component initialization');
    
    cleanupForServerSwitch();
    initializeServerSystems();
    
    setTimeout(() => {
        console.log('[Server Layout] 📄 Dispatching layout change events');
        window.dispatchEvent(new CustomEvent('layoutChanged', { 
            detail: { type: 'server', serverId, channelId } 
        }));
        window.dispatchEvent(new CustomEvent('pageLoaded', { 
            detail: { type: 'server', serverId, channelId } 
        }));
    }, 300);
}

async function initializeVoiceSystems() {
    console.log('[Voice Systems] Initializing comprehensive voice systems for server');
    
    try {
        await ensureVoiceScriptsAreLoadedSequentially();
        
        console.log('[Voice Systems] ✅ All voice scripts loaded, starting component initialization');
        
        if (!window.voiceManager && typeof window.VoiceManager === 'function') {
            try {
                window.voiceManager = new window.VoiceManager();
                console.log('[Voice Systems] ✅ VoiceManager instance created');
                
                if (window.voiceManager.preloadResources && typeof window.voiceManager.preloadResources === 'function') {
                    await window.voiceManager.preloadResources();
                    console.log('[Voice Systems] ✅ VoiceManager resources preloaded');
                }
            } catch (error) {
                console.error('[Voice Systems] ❌ Error creating VoiceManager:', error);
            }
        } else if (window.voiceManager) {
            console.log('[Voice Systems] ✅ VoiceManager already initialized');
        } else {
            console.warn('[Voice Systems] ⚠️ VoiceManager class not available yet');
        }
        
        if (!window.globalVoiceIndicator && typeof window.GlobalVoiceIndicator === 'function') {
            try {
                window.globalVoiceIndicator = new window.GlobalVoiceIndicator();
                console.log('[Voice Systems] ✅ Global Voice Indicator initialized');
            } catch (error) {
                console.error('[Voice Systems] ❌ Error creating Global Voice Indicator:', error);
            }
        } else if (window.globalVoiceIndicator) {
            if (window.globalVoiceIndicator.ensureIndicatorVisible && typeof window.globalVoiceIndicator.ensureIndicatorVisible === 'function') {
                window.globalVoiceIndicator.ensureIndicatorVisible();
            }
            console.log('[Voice Systems] ✅ Global Voice Indicator already initialized');
        } else {
            console.warn('[Voice Systems] ⚠️ Global Voice Indicator class not available yet');
        }
        
        if (typeof window.initializeVoiceSection === 'function') {
            try {
                window.initializeVoiceSection();
                console.log('[Voice Systems] ✅ Voice Section initialized');
            } catch (error) {
                console.error('[Voice Systems] ❌ Error initializing Voice Section:', error);
            }
        } else {
            console.warn('[Voice Systems] ⚠️ Voice Section initializer not available');
        }
        
        if (typeof window.initializeVoiceDependencyLoader === 'function') {
            try {
                window.initializeVoiceDependencyLoader();
                console.log('[Voice Systems] ✅ Voice Dependency Loader initialized');
            } catch (error) {
                console.error('[Voice Systems] ❌ Error initializing Voice Dependency Loader:', error);
            }
        } else if (window.VoiceDependencyLoader && typeof window.VoiceDependencyLoader.init === 'function') {
            try {
                window.VoiceDependencyLoader.init();
                console.log('[Voice Systems] ✅ Voice Dependency Loader class initialized');
            } catch (error) {
                console.error('[Voice Systems] ❌ Error initializing Voice Dependency Loader class:', error);
            }
        } else {
            console.warn('[Voice Systems] ⚠️ Voice Dependency Loader not available');
        }
        
        if (typeof window.initializeVoiceEvents === 'function') {
            try {
                window.initializeVoiceEvents();
                console.log('[Voice Systems] ✅ Voice Events initialized');
            } catch (error) {
                console.error('[Voice Systems] ❌ Error initializing Voice Events:', error);
            }
        } else if (window.VoiceEvents && typeof window.VoiceEvents.init === 'function') {
            try {
                window.VoiceEvents.init();
                console.log('[Voice Systems] ✅ Voice Events class initialized');
            } catch (error) {
                console.error('[Voice Systems] ❌ Error initializing Voice Events class:', error);
            }
        } else {
            console.warn('[Voice Systems] ⚠️ Voice Events not available');
        }
        
        if (window.VoiceUtils && typeof window.VoiceUtils.init === 'function') {
            try {
                window.VoiceUtils.init();
                console.log('[Voice Systems] ✅ Voice Utils initialized');
            } catch (error) {
                console.error('[Voice Systems] ❌ Error initializing Voice Utils:', error);
            }
        } else if (typeof window.initializeVoiceUtils === 'function') {
            try {
                window.initializeVoiceUtils();
                console.log('[Voice Systems] ✅ Voice Utils function initialized');
            } catch (error) {
                console.error('[Voice Systems] ❌ Error initializing Voice Utils function:', error);
            }
        } else {
            console.warn('[Voice Systems] ⚠️ Voice Utils not available');
        }
        
        if (window.VoiceStateManager && typeof window.VoiceStateManager.init === 'function') {
            try {
                window.VoiceStateManager.init();
                console.log('[Voice Systems] ✅ Voice State Manager initialized');
            } catch (error) {
                console.error('[Voice Systems] ❌ Error initializing Voice State Manager:', error);
            }
        } else if (typeof window.initializeVoiceStateManager === 'function') {
            try {
                window.initializeVoiceStateManager();
                console.log('[Voice Systems] ✅ Voice State Manager function initialized');
            } catch (error) {
                console.error('[Voice Systems] ❌ Error initializing Voice State Manager function:', error);
            }
        } else {
            console.warn('[Voice Systems] ⚠️ Voice State Manager not available');
        }
        
        if (window.MusicLoaderStatic && typeof window.MusicLoaderStatic.init === 'function') {
            try {
                window.MusicLoaderStatic.init();
                console.log('[Voice Systems] ✅ Music Loader Static (Sound Effects) initialized');
            } catch (error) {
                console.error('[Voice Systems] ❌ Error initializing Music Loader Static:', error);
            }
        } else if (typeof window.initializeMusicLoaderStatic === 'function') {
            try {
                window.initializeMusicLoaderStatic();
                console.log('[Voice Systems] ✅ Music Loader Static function initialized');
            } catch (error) {
                console.error('[Voice Systems] ❌ Error initializing Music Loader Static function:', error);
            }
        } else {
            console.warn('[Voice Systems] ⚠️ Music Loader Static (Sound Effects) not available');
        }
        
        if (window.userProfileVoiceControls && !window.userProfileVoiceControls.initialized) {
            try {
                window.userProfileVoiceControls.init();
                console.log('[Voice Systems] ✅ User Profile Voice Controls initialized');
            } catch (error) {
                console.error('[Voice Systems] ❌ Error initializing User Profile Voice Controls:', error);
            }
        } else {
            console.log('[Voice Systems] ✅ User Profile Voice Controls already initialized');
        }
        
        if (window.VoiceConnectionTracker && typeof window.VoiceConnectionTracker.init === 'function') {
            try {
                window.VoiceConnectionTracker.init();
                console.log('[Voice Systems] ✅ Voice Connection Tracker initialized');
            } catch (error) {
                console.error('[Voice Systems] ❌ Error initializing Voice Connection Tracker:', error);
            }
        }
        
        setTimeout(() => {
            verifyVoiceSystemsIntegration();
        }, 1000);
        
        console.log('[Voice Systems] ✅ Comprehensive voice systems initialization completed');
        
    } catch (error) {
        console.error('[Voice Systems] ❌ Critical error during voice systems initialization:', error);
    }
}

async function ensureVoiceScriptsAreLoadedSequentially() {
    console.log('[Voice Scripts] Checking voice components availability...');
    
    await waitForExistingScriptsToLoad();
    
    if (window.videoSDKManager && !window.videoSDKManager.initialized) {
        console.log('[Voice Scripts] Initializing VideoSDK Manager...');
        try {
            await window.videoSDKManager.init();
            console.log('[Voice Scripts] ✅ VideoSDK Manager initialized');
        } catch (error) {
            console.warn('[Voice Scripts] ⚠️ VideoSDK Manager initialization failed:', error);
        }
    }
    
    console.log('[Voice Scripts] ✅ All voice components ready');
}

async function waitForExistingScriptsToLoad() {
    console.log('[Voice Scripts] Waiting for scripts already loaded in page to be processed...');
    
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        const checkComponents = () => {
            attempts++;
            
            const components = {
                VideoSDK: typeof VideoSDK !== 'undefined',
                videoSDKManager: !!window.videoSDKManager,
                VoiceManager: !!window.VoiceManager,
                VoiceSection: !!window.VoiceSection,
                GlobalVoiceIndicator: !!window.GlobalVoiceIndicator,
                ActivityManager: !!window.ActivityManager,
                initializeMessageHandler: typeof window.initializeMessageHandler === 'function',
                initializeSocketHandler: typeof window.initializeSocketHandler === 'function',
                initializeChannelManager: typeof window.initializeChannelManager === 'function',
                initializeVoiceSection: typeof window.initializeVoiceSection === 'function'
            };
            
            const readyComponents = Object.values(components).filter(Boolean).length;
            const totalComponents = Object.keys(components).length;
            
            console.log(`[Voice Scripts] Component loading progress: ${readyComponents}/${totalComponents} (attempt ${attempts}/${maxAttempts})`);
            
            if (readyComponents >= totalComponents - 2 || attempts >= maxAttempts) {
                console.log('[Voice Scripts] ✅ Sufficient components available:', Object.keys(components).filter(key => components[key]));
                if (readyComponents < totalComponents - 2) {
                    console.warn('[Voice Scripts] ⚠️ Some components still missing after timeout:', Object.keys(components).filter(key => !components[key]));
                }
                resolve();
            } else {
                console.log('[Voice Scripts] Still waiting for components:', Object.keys(components).filter(key => !components[key]));
                setTimeout(checkComponents, 200);
            }
        };
        
        checkComponents();
    });
}



function initializeChatSystems() {
    console.log('[Chat Systems] Initializing chat systems');
    
    if (typeof window.initializeChatSection === 'function') {
        window.initializeChatSection();
        console.log('[Chat Systems] Chat section initialized');
    }
    
    if (typeof window.initializeMessageHandler === 'function') {
        window.initializeMessageHandler();
        console.log('[Chat Systems] Message handler initialized');
    }
    
    if (typeof window.initializeSocketHandler === 'function') {
        window.initializeSocketHandler();
        console.log('[Chat Systems] Socket handler initialized');
    }
    
    if (window.globalSocketManager && window.globalSocketManager.isReady()) {
        const activeChannelId = getCurrentChannelId();
        if (activeChannelId) {
            console.log('[Chat Systems] Joining channel socket room:', activeChannelId);
            window.globalSocketManager.joinChannel(activeChannelId);
        }
    }
    
    setTimeout(() => {
        if (typeof window.initializeChannelManager === 'function') {
            window.initializeChannelManager();
            console.log('[Chat Systems] Channel manager initialized');
        }
    }, 200);
}

function handleServerSkeletonLoading(show) {
    console.log('[Server Skeleton] Handle skeleton loading:', show);
    
    if (show) {
        showServerSkeletonLoading();
                } else {
        hideServerSkeletonLoading();
    }
}

function showServerSkeletonLoading() {
    console.log('[Server Skeleton] Showing server skeleton loading');
    
    const mainLayoutContainer = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
    if (!mainLayoutContainer) {
        console.warn('[Server Skeleton] Main layout container not found');
        return;
    }
    
    const skeletonHTML = `
        <div class="server-skeleton-loading flex flex-1 overflow-hidden">
            <!-- Channel Sidebar Skeleton -->
            <div class="w-60 bg-discord-dark flex flex-col">
                <div class="p-4 border-b border-gray-700">
                    <div class="h-6 bg-gray-700 rounded w-40 animate-pulse"></div>
                </div>
                
                <div class="flex-1 p-2">
                    ${Array(3).fill().map(() => `
                        <div class="mb-4">
                            <div class="h-4 bg-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                            ${Array(4).fill().map(() => `
                                <div class="flex items-center py-1.5 px-2 rounded mb-1">
                                    <div class="w-4 h-4 bg-gray-700 rounded mr-2 animate-pulse"></div>
                                    <div class="h-3 bg-gray-700 rounded w-20 animate-pulse"></div>
                                </div>
                            `).join('')}
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
                    <div class="h-6 bg-gray-700 rounded w-32 animate-pulse"></div>
                    <div class="ml-auto flex space-x-3">
                        ${Array(4).fill().map(() => `<div class="w-8 h-8 bg-gray-700 rounded animate-pulse"></div>`).join('')}
                    </div>
                </div>
                
                <!-- Chat Messages Skeleton -->
                <div class="flex-1 p-4 overflow-y-auto">
                    ${Array(8).fill().map(() => `
                        <div class="flex mb-6">
                            <div class="w-10 h-10 bg-gray-700 rounded-full mr-3 flex-shrink-0 animate-pulse"></div>
                            <div class="flex-grow">
                                <div class="flex items-center mb-1">
                                    <div class="h-4 bg-gray-700 rounded w-24 mr-2 animate-pulse"></div>
                                    <div class="h-3 bg-gray-700 rounded w-16 animate-pulse opacity-75"></div>
                                </div>
                                <div class="h-4 bg-gray-700 rounded w-full mb-1 animate-pulse"></div>
                                <div class="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Message Input Skeleton -->
                <div class="p-4 border-t border-gray-700">
                    <div class="h-10 bg-gray-700 rounded-lg w-full animate-pulse"></div>
                </div>
            </div>
            
            <!-- Participant Sidebar Skeleton -->
            <div class="w-60 bg-discord-background border-l border-gray-700 flex flex-col">
                <div class="p-4 border-b border-gray-700">
                    <div class="h-5 bg-gray-700 rounded w-20 animate-pulse"></div>
                </div>
                
                <div class="flex-1 p-4">
                    ${Array(6).fill().map(() => `
                        <div class="flex items-center py-2 px-2 rounded mb-2">
                            <div class="w-8 h-8 bg-gray-700 rounded-full mr-3 animate-pulse"></div>
                            <div class="flex-1">
                                <div class="h-4 bg-gray-700 rounded w-24 mb-1 animate-pulse"></div>
                                <div class="h-3 bg-gray-700 rounded w-16 animate-pulse"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    mainLayoutContainer.innerHTML = skeletonHTML;
    mainLayoutContainer.setAttribute('data-skeleton', 'server');
    console.log('[Server Skeleton] Server skeleton displayed');
}

function hideServerSkeletonLoading() {
    console.log('[Server Skeleton] Hiding server skeleton loading');
    actuallyHideServerSkeleton();
}

function actuallyHideServerSkeleton() {
    const mainLayoutContainer = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
    if (mainLayoutContainer && mainLayoutContainer.getAttribute('data-skeleton') === 'server') {
        mainLayoutContainer.removeAttribute('data-skeleton');
        console.log('[Server Skeleton] Server skeleton actually hidden');
    }
    
    window.serverSkeletonStartTime = null;
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
    console.log('[Server Layout] Starting server layout replacement');
    console.log('[Server Layout] Input params:', { serverId, channelId });
    console.log('[Server Layout] Input HTML length:', html.length);
    console.log('[Server Layout] HTML preview:', html.substring(0, 200) + '...');
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    console.log('[Server Layout] DOM parsed successfully');
    
    const newLayout = doc.querySelector('.flex.flex-1.overflow-hidden');
    console.log('[Server Layout] New layout element found:', !!newLayout);
    
    if (newLayout) {
        console.log('[Server Layout] New layout innerHTML length:', newLayout.innerHTML.length);
        console.log('[Server Layout] New layout structure preview:', {
            'has-channel-wrapper': newLayout.innerHTML.includes('channel-wrapper'),
            'has-main-content': newLayout.innerHTML.includes('main-content'),
            'has-participant-section': newLayout.innerHTML.includes('participant')
        });
        
        const currentLayout = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
        console.log('[Server Layout] Current layout container found:', !!currentLayout);
        
        if (currentLayout) {
            console.log('[Server Layout] Before replacement - current layout children:', currentLayout.children.length);
            console.log('[Server Layout] Current layout has:', {
                'dm-sidebar': !!currentLayout.querySelector('[class*="direct-message"]'),
                'channel-wrapper': !!currentLayout.querySelector('.channel-wrapper'), 
                'main-content': !!currentLayout.querySelector('#main-content'),
                'active-now': !!currentLayout.querySelector('[class*="active-now"]'),
                'participant': !!currentLayout.querySelector('[class*="participant"]')
            });
            
            console.log('[Server Layout] Replacing layout innerHTML with server structure');
            currentLayout.innerHTML = newLayout.innerHTML;
            
            console.log('[Server Layout] After replacement - new layout children:', currentLayout.children.length);
            console.log('[Server Layout] New layout structure:', {
                directChildren: Array.from(currentLayout.children).map(child => ({
                    tagName: child.tagName,
                    className: child.className,
                    id: child.id
                }))
            });
            
            console.log('[Server Layout] Checking for server-specific elements:', {
                'channel-wrapper': !!document.querySelector('.channel-wrapper'),
                'channel-items': document.querySelectorAll('.channel-item').length,
                'chat-section': !!document.querySelector('.chat-section'),
                'voice-section': !!document.querySelector('.voice-section'),
                'main-content': !!document.querySelector('#main-content'),
                'participant-section': !!document.querySelector('.w-60.bg-discord-dark.border-l') || !!document.querySelector('[class*="participant"]'),
            });
            
            console.log('[Server Layout] Executing inline scripts');
            executeInlineScripts(doc);
            
            const actualChannelId = getActiveChannelFromLayout(currentLayout) || channelId;
            let url = `/server/${serverId}`;
            if (actualChannelId) {
                url += `?channel=${actualChannelId}`;
            }
            
            console.log('[Server Layout] Updating browser history to:', url);
            console.log('[Server Layout] Active channel ID:', actualChannelId);
            history.pushState(
                { pageType: 'server', serverId, channelId: actualChannelId }, 
                `misvord - Server`, 
                url
            );
            if (typeof window.updateActiveServer === 'function') {
                window.updateActiveServer('server', serverId);
                console.log('[Server Layout] Active server state updated for server:', serverId);
            }
            
            console.log('[Server Layout] SUCCESS - Server layout replacement completed');
        } else {
            console.error('[Server Layout] FAILED - Layout container not found');
            console.error('[Server Layout] Available containers:', {
                'app-container': !!document.querySelector('#app-container'),
                'flex-1-containers': document.querySelectorAll('.flex-1').length,
                'overflow-hidden-containers': document.querySelectorAll('.overflow-hidden').length,
                'combined-selector': document.querySelectorAll('.flex.flex-1.overflow-hidden').length
            });
        }
    } else {
        console.error('[Server Layout] FAILED - New layout element not found in response');
        console.error('[Server Layout] Available elements in response:', {
            'flex-elements': doc.querySelectorAll('.flex').length,
            'flex-1-elements': doc.querySelectorAll('.flex-1').length,
            'overflow-elements': doc.querySelectorAll('.overflow-hidden').length,
            'combined-elements': doc.querySelectorAll('.flex.flex-1.overflow-hidden').length,
            'body-children': doc.body ? doc.body.children.length : 0
        });
        console.error('[Server Layout] Response HTML structure preview:', html.substring(0, 500));
    }
}

function validateServerLayoutRendering(serverId, channelId) {
    console.log('[Server Validation] Starting server layout validation');
    console.log('[Server Validation] Target server:', serverId, 'channel:', channelId);
    
    let attempts = 0;
    const maxAttempts = 5;
    const retryDelay = 200;
    
    const performValidation = () => {
        attempts++;
        console.log('[Server Validation] Validation attempt', attempts, 'of', maxAttempts);
        
        const validationChecks = {
            'app-container': !!document.querySelector('#app-container'),
            'main-content-layout': !!document.querySelector('.flex.flex-1.overflow-hidden'),
            'server-channels-sidebar': !!document.querySelector('.w-60.bg-discord-dark'),
            'channel-wrapper': !!document.querySelector('.channel-wrapper'),
            'chat-section': !!document.querySelector('.chat-section'),
            'voice-section': !!document.querySelector('.voice-section'),
            'participant-section': !!document.querySelector('.w-60.bg-discord-dark.border-l') || !!document.querySelector('[class*="participant"]'),
            'main-content-area': !!document.querySelector('.main-content-area'),
            'server-layout-structure': !!document.querySelector('#main-content'),
            'Bot Component': !!window.BotComponent,
            'channelAPI': !!window.channelAPI,
            'serverAPI': !!window.serverAPI,
            'chatAPI': !!(window.ChatAPI || window.chatAPI),
            'userAPI': !!window.userAPI,
            'mediaAPI': !!window.MediaAPI,
            'botAPI': !!window.botAPI,
            'friendAPI': !!window.FriendAPI
        };
        
        // Check activity components separately (they load asynchronously)
        const activityChecks = {
            'Activity Manager': !!window.ActivityManager,
            'Tic Tac Toe Modal': !!window.TicTacToeModal
        };
        
        console.log('[Server Validation] Layout validation results (attempt ' + attempts + '):', validationChecks);
        console.log('[Server Validation] Activity components status:', activityChecks);
        
        const failedChecks = Object.keys(validationChecks).filter(key => !validationChecks[key]);
        const missingActivityComponents = Object.keys(activityChecks).filter(key => !activityChecks[key]);
        
        if (missingActivityComponents.length > 0) {
            console.warn('[Server Validation] ⚠️ Activity components still loading:', missingActivityComponents);
        }
        
        if (failedChecks.length === 0) {
            console.log('[Server Validation] SUCCESS - All server layout elements rendered correctly');
            
            const serverIndicators = {
                'url-is-server': window.location.pathname.includes('/server/'),
                'correct-server-id': window.location.pathname.includes(`/server/${serverId}`),
                'active-server-icon': !!document.querySelector(`.server-icon.active[data-server-id="${serverId}"]`),
                'server-channels-visible': !!document.querySelector('.channel-wrapper') && document.querySelector('.channel-wrapper').style.display !== 'none',
                'no-home-elements': !document.querySelector('.tab-content') || document.querySelector('.tab-content').style.display === 'none'
            };
            
            console.log('[Server Validation] Server state indicators:', serverIndicators);
            
            const channelItems = document.querySelectorAll('.channel-item');
            console.log('[Server Validation] Found', channelItems.length, 'channel items');
            if (channelItems.length > 0) {
                console.log('[Server Validation] Channel items:', Array.from(channelItems).map(item => ({
                    id: item.dataset.channelId,
                    name: item.textContent.trim(),
                    type: item.dataset.channelType
                })));
            }
            
            return true;
        } else if (attempts < maxAttempts) {
            console.log('[Server Validation] RETRYING - Missing elements:', failedChecks, '- attempt', attempts, 'of', maxAttempts);
            setTimeout(performValidation, retryDelay);
            return false;
        } else {
            console.warn('[Server Validation] FAILED VALIDATION after', maxAttempts, 'attempts - Missing elements:', failedChecks);
            console.warn('[Server Validation] Available containers:');
            console.warn('[Server Validation] - app-container:', document.querySelector('#app-container'));
            console.warn('[Server Validation] - flex containers:', document.querySelectorAll('.flex').length);
            console.warn('[Server Validation] - w-60 containers:', document.querySelectorAll('.w-60').length);
            console.warn('[Server Validation] - channel items:', document.querySelectorAll('.channel-item').length);
            return false;
        }
    };
    
    setTimeout(performValidation, 100);
}

function executeInlineScripts(doc) {
    const scripts = doc.querySelectorAll('script:not([src])');
    console.log('[Server Scripts] Found', scripts.length, 'inline scripts to execute');
    scripts.forEach((script, index) => {
        if (script.textContent.trim()) {
            try {
                console.log('[Server Scripts] Executing script', index + 1);
                eval(script.textContent);
            } catch (error) {
                console.error('[Server Scripts] Script execution error for script', index + 1, ':', error);
            }
        }
    });
}

function getActiveChannelFromLayout(layoutContainer) {
    if (!layoutContainer) return null;
    
    const activeChannelInput = layoutContainer.querySelector('#active-channel-id');
    if (activeChannelInput && activeChannelInput.value) {
        console.log('[Server Layout] Found active channel from input:', activeChannelInput.value);
        return activeChannelInput.value;
    }
    
    const activeChannelElement = layoutContainer.querySelector('.channel-item.active-channel, .channel-item.active');
    if (activeChannelElement) {
        const channelId = activeChannelElement.getAttribute('data-channel-id');
        console.log('[Server Layout] Found active channel from element:', channelId);
        return channelId;
    }
    
    const firstTextChannel = layoutContainer.querySelector('.channel-item[data-channel-type="text"]');
    if (firstTextChannel) {
        const channelId = firstTextChannel.getAttribute('data-channel-id');
        console.log('[Server Layout] Using first text channel as active:', channelId);
        return channelId;
    }
    
    const chatSection = layoutContainer.querySelector('.chat-section[data-channel-id]');
    if (chatSection) {
        const channelId = chatSection.getAttribute('data-channel-id');
        console.log('[Server Layout] Found active channel from chat section:', channelId);
        return channelId;
    }
    
    console.log('[Server Layout] No active channel found in layout');
    return null;
}

function cleanupForServerSwitch() {
    console.log('[Server AJAX] Cleaning up for server switch');
    
    if (window.chatSection) {
        console.log('[Server AJAX] Cleaning up existing chat section');
        if (typeof window.chatSection.leaveCurrentSocketRoom === 'function') {
            window.chatSection.leaveCurrentSocketRoom();
        }
        if (typeof window.chatSection.cleanup === 'function') {
            window.chatSection.cleanup();
        }
        window.chatSection = null;
    }
    
    if (window.simpleChannelSwitcher) {
        console.log('[Server AJAX] Keeping existing simple channel switcher for reuse');
    }
    
    console.log('[Server AJAX] Cleanup completed');
}

async function initializeServerSystems() {
    console.log('[Server Loader] Starting comprehensive server initialization');
    
    try {
        console.log('[Server Loader] Waiting for APIs to load...');
        await waitForAPIsToLoad();
        
        console.log('[Server Loader] Initializing voice systems');
        await initializeVoiceSystems();
        
        console.log('[Server Loader] Checking component availability after voice initialization');
        const componentStatus = checkServerComponentsInitialization();
        console.log('[Server Loader] Component status:', componentStatus);
        
        console.log('[Server Loader] Initializing chat systems');
        initializeChatSystems();
        
        console.log('[Server Loader] Initializing channel switching systems');
        initializeChannelSwitchingSystems();
        
        console.log('[Server Loader] Initializing bot systems');
        initializeBotSystems();
        
        console.log('[Server Loader] Initializing activity systems');
        initializeActivitySystems();
        
        console.log('[Server Loader] Verifying voice systems integration');
        setTimeout(() => verifyVoiceSystemsIntegration(), 1000);
        
        if (window.globalSocketManager && !window.globalSocketManager.leaveDMRoom) {
            console.log('[Server Loader] Adding missing leaveDMRoom method to socket manager');
            window.globalSocketManager.leaveDMRoom = function(roomId) {
                if (typeof this.leaveRoom === 'function') {
                    return this.leaveRoom('dm', roomId);
                } else {
                    console.warn('⚠️ [SOCKET] leaveRoom method not available');
                    return false;
                }
            };
        }
        
        if (typeof window.initializeParticipantSection === 'function') {
            window.initializeParticipantSection();
            console.log('[Server Loader] Participant section initialized');
        }
        
        if (typeof window.initializeChannelSection === 'function') {
            window.initializeChannelSection();
            console.log('[Server Loader] Channel section initialized');
        }
        
        if (!window.initializeServerPage) {
            try {
                const module = await import('./server-initializer.js');
                window.initializeServerPage = module.initializeServerPage;
            } catch (error) {
                console.warn('[Server Loader] Server initializer module not found, skipping');
            }
        }
        
        if (window.initializeServerPage) {
            await window.initializeServerPage();
        }
        
        console.log('[Server Loader] ✅ Complete server initialization finished');
    } catch (error) {
        console.error('[Server Loader] ❌ Server initialization failed:', error);
    }
}

function checkServerComponentsInitialization() {
    console.log('[Server Components] Checking server component initialization status');
    
    const requiredComponents = {
        'Chat Section': typeof window.initializeChatSection === 'function',
        'Message Handler': typeof window.initializeMessageHandler === 'function',
        'Socket Handler': typeof window.initializeSocketHandler === 'function',
        'Channel Manager': typeof window.initializeChannelManager === 'function',
        'Voice Manager': !!(window.voiceManager || (typeof window.VoiceManager === 'function')),
        'Global Voice Indicator': !!(window.globalVoiceIndicator || (typeof window.GlobalVoiceIndicator === 'function')),
        'Voice Section': typeof window.initializeVoiceSection === 'function',
        'Voice Dependency Loader': !!(window.VoiceDependencyLoader || typeof window.initializeVoiceDependencyLoader === 'function'),
        'Voice Events': !!(window.VoiceEvents || typeof window.initializeVoiceEvents === 'function'),
        'Voice Utils': !!(window.VoiceUtils || typeof window.initializeVoiceUtils === 'function'),
        'Voice State Manager': !!(window.VoiceStateManager || typeof window.initializeVoiceStateManager === 'function'),
        'Music Loader Static': !!(window.MusicLoaderStatic || typeof window.initializeMusicLoaderStatic === 'function'),
        'VideoSDK': !!(window.videoSDKManager || (typeof VideoSDK !== 'undefined')),
        'Simple Channel Switcher': typeof window.SimpleChannelSwitcher === 'function',
        'Socket Manager': !!window.globalSocketManager,
        'Bot Component': !!window.BotComponent,
        'Activity Manager': !!window.ActivityManager,
        'Tic Tac Toe Modal': !!window.TicTacToeModal,
        'channelAPI': !!window.channelAPI,
        'serverAPI': !!window.serverAPI,
        'chatAPI': !!(window.ChatAPI || window.chatAPI),
        'userAPI': !!window.userAPI,
        'mediaAPI': !!window.MediaAPI,
        'botAPI': !!window.botAPI,
        'friendAPI': !!window.FriendAPI
    };
    
    const missing = Object.keys(requiredComponents).filter(key => !requiredComponents[key]);
    const available = Object.keys(requiredComponents).filter(key => requiredComponents[key]);
    
    console.log('[Server Components] ✅ Available components:', available);
    if (missing.length > 0) {
        console.warn('[Server Components] ⚠️ Missing components:', missing);
        
        missing.forEach(component => {
            if (component.includes('API')) {
                console.warn(`[Server Components] 📝 ${component} - Check if the API file is loaded in pages/server-page.php`);
            } else if (component.includes('initialize')) {
                console.warn(`[Server Components] 🔧 ${component} - Check if the component module is loaded`);
            } else {
                console.warn(`[Server Components] 🏗️ ${component} - Check if the class/object is available`);
            }
        });
    }
    
    return {
        available: available.length,
        missing: missing.length,
        total: Object.keys(requiredComponents).length,
        missingComponents: missing,
        availableComponents: available
    };
}

function initializeChannelSwitchingSystems() {
    console.log('[Channel Switch] Initializing channel switching systems');
    
    if (!window.SimpleChannelSwitcher) {
        console.error('[Channel Switch] ❌ SimpleChannelSwitcher class not available');
        return false;
    }
    
    if (!window.simpleChannelSwitcher) {
        try {
            window.simpleChannelSwitcher = new window.SimpleChannelSwitcher();
            console.log('[Channel Switch] ✅ SimpleChannelSwitcher initialized');
        } catch (error) {
            console.error('[Channel Switch] ❌ Failed to initialize SimpleChannelSwitcher:', error);
            return false;
        }
    }
    
    if (typeof window.initializeChannelManager === 'function') {
        window.initializeChannelManager();
        console.log('[Channel Switch] ✅ Channel manager initialized');
    }
    
    if (typeof window.initializeChatSection === 'function') {
        window.initializeChatSection();
        console.log('[Channel Switch] ✅ Chat section initialized');
    }
    
    const requiredAPIs = {
        'channelAPI': window.channelAPI,
        'chatAPI': window.ChatAPI || window.chatAPI, 
        'serverAPI': window.serverAPI
    };
    
    const missingAPIs = Object.keys(requiredAPIs).filter(key => !requiredAPIs[key]);
    if (missingAPIs.length > 0) {
        console.warn('[Channel Switch] ⚠️ Missing APIs:', missingAPIs);
    } else {
        console.log('[Channel Switch] ✅ All required APIs available');
    }
    
    if (window.globalSocketManager && window.globalSocketManager.isReady()) {
        console.log('[Channel Switch] ✅ Socket manager ready for channel operations');
    } else {
        console.warn('[Channel Switch] ⚠️ Socket manager not ready - channel switching may be limited');
    }
    
    return true;
}

function initializeBotSystems() {
    console.log('[Bot Systems] Initializing bot systems for server');
    
    // Initialize main bot component
    if (window.BotComponent && typeof window.BotComponent.init === 'function') {
        if (!window.BotComponent.isInitialized()) {
            window.BotComponent.init();
            console.log('[Bot Systems] ✅ Main bot component initialized');
        } else {
            console.log('[Bot Systems] ✅ Main bot component already initialized');
        }
    } else {
        console.warn('[Bot Systems] ⚠️ Main bot component not available');
    }
    
    // Check bot API availability
    if (window.botAPI) {
        console.log('[Bot Systems] ✅ Bot API available');
    } else {
        console.warn('[Bot Systems] ⚠️ Bot API not available');
    }
    
    // Initialize server-specific bot systems if available
    if (typeof window.initializeBotSystems === 'function') {
        try {
            window.initializeBotSystems();
            console.log('[Bot Systems] ✅ Server-specific bot systems initialized');
        } catch (error) {
            console.error('[Bot Systems] ❌ Error initializing server-specific bot systems:', error);
        }
    }
    
    // Ensure bot is active for current server
    const serverId = getServerIdFromUrl();
    if (serverId && window.globalSocketManager && window.globalSocketManager.isReady()) {
        console.log('[Bot Systems] Ensuring bot active for server:', serverId);
        // Bot activation happens automatically when socket is ready
    }
    
    console.log('[Bot Systems] Bot systems initialization completed');
}

function verifyBotFunctionality() {
    console.log('🤖 [BOT VERIFY] Running bot functionality verification');
    
    const botStatus = {
        'BotComponent Available': !!window.BotComponent,
        'BotComponent Initialized': window.BotComponent ? window.BotComponent.isInitialized() : false,
        'Bot API Available': !!window.botAPI,
        'ChatBot Available': !!window.ChatBot,
        'Socket Ready': window.globalSocketManager ? window.globalSocketManager.isReady() : false,
        'Socket Authenticated': window.globalSocketManager ? window.globalSocketManager.authenticated : false
    };
    
    console.log('🤖 [BOT VERIFY] Bot Status:', botStatus);
    
    if (window.BotComponent) {
        console.log('🤖 [BOT VERIFY] Active Bots:', window.BotComponent.getActiveBots());
        console.log('🤖 [BOT VERIFY] Voice Bots:', window.BotComponent.getVoiceBots());
    }
    
    if (window.chatSection && window.chatSection.chatBot) {
        console.log('🤖 [BOT VERIFY] Chat Bot Ready:', window.chatSection.chatBot.botReady);
        console.log('🤖 [BOT VERIFY] Chat Bot Initialized:', window.chatSection.chatBot.initialized);
    }
    
    const serverId = getServerIdFromUrl();
    if (serverId) {
        console.log('🤖 [BOT VERIFY] Current Server ID:', serverId);
        console.log('🤖 [BOT VERIFY] You can test the bot by sending: /titibot play never gonna give you up');
    }
    
    return botStatus;
}

function initializeActivitySystems() {
    console.log('[Activity Systems] Initializing activity systems for server');
    
    // Wait for all components to be loaded first
    setTimeout(() => {
        // Initialize Activity Manager
        if (window.ActivityManager && typeof window.ActivityManager === 'function') {
            if (!window.activityManager) {
                try {
                    window.activityManager = new window.ActivityManager();
                    console.log('[Activity Systems] ✅ Activity Manager initialized');
                } catch (error) {
                    console.error('[Activity Systems] ❌ Error initializing Activity Manager:', error);
                }
            } else {
                console.log('[Activity Systems] ✅ Activity Manager already initialized');
            }
        } else {
            console.warn('[Activity Systems] ⚠️ Activity Manager class not available, checking script loading...');
            
            // Check if script is loaded
            const activityScript = document.querySelector('script[src*="activity.js"]');
            if (activityScript) {
                console.log('[Activity Systems] 📜 Activity script found in DOM, retrying in 500ms...');
                setTimeout(() => initializeActivitySystems(), 500);
                return;
            } else {
                console.error('[Activity Systems] ❌ Activity script not found in DOM');
            }
        }
        
        // Initialize Tic Tac Toe Modal
        if (window.TicTacToeModal && typeof window.TicTacToeModal === 'function') {
            console.log('[Activity Systems] ✅ Tic Tac Toe Modal available');
        } else {
            console.warn('[Activity Systems] ⚠️ Tic Tac Toe Modal not available, checking script loading...');
            
            // Check if script is loaded
            const ticTacToeScript = document.querySelector('script[src*="tic-tac-toe.js"]');
            if (ticTacToeScript) {
                console.log('[Activity Systems] 📜 Tic Tac Toe script found in DOM, retrying in 500ms...');
                setTimeout(() => initializeActivitySystems(), 500);
                return;
            } else {
                console.error('[Activity Systems] ❌ Tic Tac Toe script not found in DOM');
            }
        }
        
        // Check for existing activity manager
        const existingButton = document.getElementById('tic-tac-toe-button');
        if (existingButton) {
            console.log('[Activity Systems] ✅ Tic Tac Toe button already exists');
        } else {
            // Try to create activity manager if not exists
            setTimeout(() => {
                if (!window.activityManager && document.body.getAttribute('data-page') === 'server') {
                    try {
                        if (window.ActivityManager) {
                            window.activityManager = new window.ActivityManager();
                            console.log('[Activity Systems] ✅ Activity Manager created via timeout');
                        }
                    } catch (error) {
                        console.error('[Activity Systems] ❌ Error creating Activity Manager via timeout:', error);
                    }
                }
            }, 1000);
        }
        
        // Setup tic-tac-toe CSS if not exists
        if (!document.getElementById('tic-tac-toe-styles')) {
            const style = document.createElement('style');
            style.id = 'tic-tac-toe-styles';
            style.textContent = `
                @keyframes winningPulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(88, 101, 242, 0.5); }
                    50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(88, 101, 242, 0.8); }
                }
                .winning-cell {
                    background: linear-gradient(45deg, #5865f2, #a855f7) !important;
                    color: white !important;
                }
                .particle {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: linear-gradient(45deg, #5865f2, #a855f7);
                    border-radius: 50%;
                    animation: float 6s infinite ease-in-out;
                    opacity: 0.6;
                }
                @keyframes float {
                    0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
                    10% { opacity: 0.6; }
                    90% { opacity: 0.6; }
                    100% { transform: translateY(-10px) rotate(360deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
            console.log('[Activity Systems] ✅ Tic Tac Toe styles added');
        }
        
        console.log('[Activity Systems] Activity systems initialization completed');
        
        // Final verification after initialization
        setTimeout(() => {
            console.log('[Activity Systems] 🔍 Final component verification:', {
                'ActivityManager available': !!window.ActivityManager,
                'TicTacToeModal available': !!window.TicTacToeModal,
                'activityManager instance': !!window.activityManager,
                'tic-tac-toe button exists': !!document.getElementById('tic-tac-toe-button')
            });
        }, 2000);
        
    }, 100); // Initial delay to ensure DOM is ready
}

function verifyVoiceSystemsIntegration() {
    console.log('🎙️ [VOICE VERIFY] Running voice systems integration verification');
    
    const voiceStatus = {
        'VoiceManager Available': !!window.voiceManager,
        'VoiceManager Ready': window.voiceManager ? window.voiceManager.isReady() : false,
        'Global Voice Indicator': !!window.globalVoiceIndicator,
        'Voice Section': typeof window.initializeVoiceSection === 'function',
        'Voice Dependency Loader': !!(window.VoiceDependencyLoader || typeof window.initializeVoiceDependencyLoader === 'function'),
        'Voice Events': !!(window.VoiceEvents || typeof window.initializeVoiceEvents === 'function'),
        'Voice Utils': !!(window.VoiceUtils || typeof window.initializeVoiceUtils === 'function'),
        'Voice State Manager': !!(window.VoiceStateManager || typeof window.initializeVoiceStateManager === 'function'),
        'Music Loader Static': !!(window.MusicLoaderStatic || typeof window.initializeMusicLoaderStatic === 'function'),
        'VideoSDK': !!(window.VideoSDK || typeof window.initializeVideoSDK === 'function'),
        'Voice Connection Tracker': !!window.VoiceConnectionTracker,
        'User Profile Voice Controls': !!window.userProfileVoiceControls,
        'Socket Ready': window.globalSocketManager ? window.globalSocketManager.isReady() : false,
        'WebRTC Supported': !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    };
    
    console.log('🎙️ [VOICE VERIFY] Voice Systems Status:', voiceStatus);
    
    // Check voice UI elements
    const voiceUIElements = {
        'Voice Section Element': !!document.querySelector('.voice-section'),
        'Voice Controls': !!document.querySelector('[data-voice-controls]'),
        'Mic Button': !!document.querySelector('#mic-button'),
        'Speaker Button': !!document.querySelector('#speaker-button'),
        'Voice Indicator': !!document.querySelector('.voice-indicator')
    };
    
    console.log('🎙️ [VOICE VERIFY] Voice UI Elements:', voiceUIElements);
    
    // Check voice permissions
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.permissions?.query({name: 'microphone'}).then(permission => {
            console.log('🎙️ [VOICE VERIFY] Microphone Permission:', permission.state);
        }).catch(error => {
            console.log('🎙️ [VOICE VERIFY] Cannot check microphone permission:', error.message);
        });
        
        navigator.permissions?.query({name: 'camera'}).then(permission => {
            console.log('🎙️ [VOICE VERIFY] Camera Permission:', permission.state);
        }).catch(error => {
            console.log('🎙️ [VOICE VERIFY] Cannot check camera permission:', error.message);
        });
    }
    
    const serverId = getServerIdFromUrl();
    if (serverId) {
        console.log('🎙️ [VOICE VERIFY] Current Server ID:', serverId);
        console.log('🎙️ [VOICE VERIFY] You can test voice by joining a voice channel');
    }
    
    // Report missing components
    const missingVoice = Object.keys(voiceStatus).filter(key => !voiceStatus[key]);
    const missingUI = Object.keys(voiceUIElements).filter(key => !voiceUIElements[key]);
    
    if (missingVoice.length > 0) {
        console.warn('🎙️ [VOICE VERIFY] ⚠️ Missing Voice Components:', missingVoice);
    }
    
    if (missingUI.length > 0) {
        console.warn('🎙️ [VOICE VERIFY] ⚠️ Missing Voice UI Elements:', missingUI);
    }
    
    if (missingVoice.length === 0 && missingUI.length <= 2) {
        console.log('🎙️ [VOICE VERIFY] ✅ Voice systems integration verified successfully');
    }
    
    return voiceStatus;
}

function getServerIdFromUrl() {
    const match = window.location.pathname.match(/\/server\/(\d+)/);
    return match ? match[1] : null;
}

function waitForAPIsToLoad() {
    return new Promise((resolve) => {
        const checkAPIs = () => {
            const requiredAPIs = ['channelAPI', 'serverAPI', 'chatAPI', 'userAPI', 'botAPI', 'friendAPI', 'mediaAPI'];
            const availableAPIs = requiredAPIs.filter(api => {
                if (api === 'chatAPI') {
                    return !!(window.ChatAPI || window.chatAPI);
                } else if (api === 'mediaAPI') {
                    return !!window.MediaAPI;
                } else if (api === 'friendAPI') {
                    return !!window.FriendAPI;
                } else {
                    return !!window[api];
                }
            });
            
            console.log(`[API Loading] ${availableAPIs.length}/${requiredAPIs.length} APIs loaded:`, availableAPIs);
            
            if (availableAPIs.length >= requiredAPIs.length - 1) {
                console.log('[API Loading] ✅ Sufficient APIs loaded');
                resolve(true);
            } else {
                setTimeout(checkAPIs, 100);
            }
        };
        
        checkAPIs();
        
        setTimeout(() => {
            console.warn('[API Loading] ⚠️ Timeout waiting for APIs, proceeding anyway');
            resolve(false);
        }, 5000);
    });
}

window.loadServerPage = loadServerPage; 
window.handleServerSkeletonLoading = handleServerSkeletonLoading;
window.hideServerSkeletonLoading = hideServerSkeletonLoading; 
window.checkServerComponentsInitialization = checkServerComponentsInitialization;
window.initializeChannelSwitchingSystems = initializeChannelSwitchingSystems;
window.initializeBotSystems = initializeBotSystems;
window.initializeActivitySystems = initializeActivitySystems;
window.verifyBotFunctionality = verifyBotFunctionality;
window.verifyVoiceSystemsIntegration = verifyVoiceSystemsIntegration; 