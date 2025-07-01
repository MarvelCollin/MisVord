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

function initializeVoiceSystems() {
    if (!window.voiceManager) {
        if (typeof window.VoiceManager === 'function') {
            window.voiceManager = new window.VoiceManager();
            if (window.voiceManager.preloadResources) {
                window.voiceManager.preloadResources();
            }
        }
    }
    
    if (!window.globalVoiceIndicator) {
        if (typeof window.GlobalVoiceIndicator === 'function') {
            window.globalVoiceIndicator = new window.GlobalVoiceIndicator();
        }
    } else {
        if (window.globalVoiceIndicator.ensureIndicatorVisible) {
            window.globalVoiceIndicator.ensureIndicatorVisible();
        }
    }
    
    if (window.userProfileVoiceControls && !window.userProfileVoiceControls.initialized) {
        window.userProfileVoiceControls.init();
    }
    
    setTimeout(() => {
        if (typeof window.waitForVoiceManager === 'function') {
            window.waitForVoiceManager().then(() => {
            }).catch(error => {
            });
        }
    }, 500);
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
            'server-layout-structure': !!document.querySelector('#main-content')
        };
        
        console.log('[Server Validation] Layout validation results (attempt ' + attempts + '):', validationChecks);
        
        const failedChecks = Object.keys(validationChecks).filter(key => !validationChecks[key]);
        
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
        
        const componentStatus = checkServerComponentsInitialization();
        console.log('[Server Loader] Component status:', componentStatus);
        
        console.log('[Server Loader] Initializing voice systems');
        initializeVoiceSystems();
        
        console.log('[Server Loader] Initializing chat systems');
        initializeChatSystems();
        
        console.log('[Server Loader] Initializing channel switching systems');
        initializeChannelSwitchingSystems();
        
        if (typeof window.initializeParticipantSection === 'function') {
            window.initializeParticipantSection();
            console.log('[Server Loader] Participant section initialized');
        }
        
        if (typeof window.initializeChannelSection === 'function') {
            window.initializeChannelSection();
            console.log('[Server Loader] Channel section initialized');
        }
        
        if (!window.initializeServerPage) {
            const module = await import('./server-initializer.js');
            window.initializeServerPage = module.initializeServerPage;
        }
        
        await window.initializeServerPage();
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
        'Voice Manager': typeof window.VoiceManager === 'function',
        'Global Voice Indicator': typeof window.GlobalVoiceIndicator === 'function',
        'Simple Channel Switcher': typeof window.SimpleChannelSwitcher === 'function',
        'Socket Manager': !!window.globalSocketManager,
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