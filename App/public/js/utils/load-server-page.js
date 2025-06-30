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

export async function loadServerPage(serverId, channelId = null) {
    console.log('[Server AJAX] Starting direct AJAX server page load');
    
    const mainContent = document.querySelector('.flex-1') ||
        document.querySelector('[class*="server-content"]') ||
        document.querySelector('main');

    console.log('[Server Loader] Found main content:', !!mainContent);
    if (mainContent) {
        console.log('[Server Loader] Starting skeleton loading for server content');
        handleServerSkeletonLoading(true);
        
        window.serverSkeletonStartTime = Date.now();

        const currentChannelId = getCurrentChannelId();
        if (currentChannelId && window.globalSocketManager) {
            console.log('[Server Loader] Cleaning up current channel socket: ' + currentChannelId);
            window.globalSocketManager.leaveChannel(currentChannelId);
        }

        if (window.voiceManager && typeof window.voiceManager.leaveVoice === 'function') {
            console.log('[Server Loader] Cleaning up voice manager');
            window.voiceManager.leaveVoice();
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
                    window.location.href = response.data.redirect;
                } else {
                    console.error('[Server AJAX] INVALID RESPONSE FORMAT');
                    console.error('[Server AJAX] Expected string, got:', typeof response);
                    console.error('[Server AJAX] Response content:', response);
                    const fallbackUrl = channelId ? `/server/${serverId}?channel=${channelId}` : `/server/${serverId}`;
                    window.location.href = fallbackUrl;
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
                
                if (window.channelSwitchManager && typeof window.channelSwitchManager.cleanup === 'function') {
                    console.log('[Server AJAX] Cleaning up channel switch manager due to error');
                    window.channelSwitchManager.cleanup();
                }
                
                console.error('[Server AJAX] Server loading failed');
                
                setTimeout(() => {
                const fallbackUrl = channelId ? `/server/${serverId}?channel=${channelId}` : `/server/${serverId}`;
                console.error('[Server AJAX] FALLBACK - Redirecting to', fallbackUrl);
                window.location.href = fallbackUrl;
                }, 100);
            }
        });
    } else {
        console.error('[Server Loader] No main content container found');
        const fallbackUrl = channelId ? `/server/${serverId}?channel=${channelId}` : `/server/${serverId}`;
        window.location.href = fallbackUrl;
    }
}

function performServerLayoutUpdate(response, serverId, channelId, currentChannelId) {
    console.log('[Server Layout] Performing delayed layout update');
    
    updateServerLayout(response, serverId, channelId);
    
    console.log('[Server AJAX] Validating server layout');
    validateServerLayoutRendering(serverId, channelId);
    
    console.log('[Server AJAX] Disabling skeleton loading');
    handleServerSkeletonLoading(false);
    
    console.log('[Server AJAX] Waiting for AJAX dependencies to load...');
    
    function performInitialization() {
        console.log('[Server AJAX] Starting component initialization');
        
        if (typeof window.initServerPage === 'function') {
            window.initServerPage();
            console.log('[Server AJAX] Server page initialized');
        }
        
        console.log('[Server AJAX] Initializing core server components');
        

        
        cleanupForServerSwitch();
        
        console.log('[Server AJAX] Initializing voice systems');
        initializeVoiceSystems();
        
        console.log('[Server AJAX] Initializing chat systems');
        initializeChatSystems();
        
        if (typeof window.initializeServerDropdown === 'function') {
            console.log('[Server AJAX] Re-initializing server dropdown');
            window.initializeServerDropdown();
        } else {
            console.log('[Server AJAX] Manually initializing server dropdown');
            initServerDropdownManual();
        }
        
        if (typeof window.initializeParticipantSection === 'function') {
            window.initializeParticipantSection();
            console.log('[Server AJAX] Participant section initialized');
        }
        
        if (typeof window.updateActiveServer === 'function') {
            window.updateActiveServer('server', serverId);
            console.log('[Server AJAX] Active server state updated');
        }
        
        const event = new CustomEvent('ServerChanged', { 
            detail: { 
                serverId,
                channelId,
                previousChannelId: currentChannelId 
            } 
        });
        document.dispatchEvent(event);
        console.log('[Server AJAX] ServerChanged event dispatched');
    }
    
    let initializationCompleted = false;
    
    document.addEventListener('ServerLayoutAjaxComplete', function(event) {
        if (!initializationCompleted) {
            console.log('[Server AJAX] AJAX dependencies loaded, proceeding with initialization');
            initializationCompleted = true;
            performInitialization();
        }
    }, { once: true });
    
    setTimeout(() => {
        if (!initializationCompleted) {
            console.log('[Server AJAX] Timeout reached, proceeding with initialization without AJAX dependencies');
            initializationCompleted = true;
            performInitialization();
        }
    }, 3000);
}

function initializeVoiceSystems() {
    if (!window.voiceManager) {
        if (typeof window.VoiceManager === 'function') {
            window.voiceManager = new window.VoiceManager();
            if (window.voiceManager.preloadResources) {
                window.voiceManager.preloadResources();
            }
        }
    } else {
        if (typeof window.voiceManager.resetState === 'function') {
            window.voiceManager.resetState();
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
    
    setTimeout(() => {
        if (typeof window.waitForVoiceManager === 'function') {
            window.waitForVoiceManager().then(() => {
            }).catch(error => {
            });
        }
    }, 500);
}

function initializeChatSystems() {
    console.log('[Chat Systems] Starting chat system initialization');
    
    if (!window.ChatAPI) {
        console.log('[Chat Systems] ChatAPI not available, waiting...');
        setTimeout(() => {
            if (window.ChatAPI) {
                console.log('[Chat Systems] ChatAPI now available');
                proceedWithChatInitialization();
            } else {
                console.warn('[Chat Systems] ChatAPI still not available after timeout');
            }
        }, 200);
    } else {
        console.log('[Chat Systems] ChatAPI already available');
        proceedWithChatInitialization();
    }
}

function proceedWithChatInitialization() {
    console.log('[Chat Systems] Proceeding with chat initialization');
    
    if (window.chatSection) {
        console.log('[Chat Systems] Existing chat section found, cleaning up');
        try {
            if (window.chatSection._roomCheckInterval) {
                clearInterval(window.chatSection._roomCheckInterval);
            }
            window.chatSection = null;
        } catch (error) {
            console.warn('[Chat Systems] Error during chat cleanup:', error);
        }
    }
    
    setTimeout(() => {
        if (typeof window.initializeChatSection === 'function') {
            console.log('[Chat Systems] Calling global chat section initializer');
            window.initializeChatSection();
        } else if (typeof window.ChatSection === 'function') {
            console.log('[Chat Systems] Creating new chat section instance');
            try {
                window.chatSection = new window.ChatSection();
            } catch (error) {
                console.error('[Chat Systems] Error creating chat section:', error);
            }
        } else {
            console.warn('[Chat Systems] No chat initialization methods available');
        }
    }, 300);
    
    console.log('[Chat Systems] Chat system initialization completed');
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
                'participant-section': !!document.querySelector('[class*="w-60"][class*="bg-discord-background"]')
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
            'participant-section': !!document.querySelector('.w-60.bg-discord-background') || !!document.querySelector('[class*="participant"]'),
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

function initServerDropdownManual() {
    console.log('[Server Loader] Manual server dropdown initialization');
    
    setTimeout(() => {
        const dropdownBtn = document.getElementById('server-dropdown-btn');
        const dropdown = document.getElementById('server-dropdown');
        
        console.log('[Server Loader] Dropdown elements:', { 
            dropdownBtn: !!dropdownBtn, 
            dropdown: !!dropdown 
        });
        
        if (dropdownBtn && dropdown) {
            const newBtn = dropdownBtn.cloneNode(true);
            dropdownBtn.parentNode.replaceChild(newBtn, dropdownBtn);
            
            newBtn.addEventListener('click', function(e) {
                console.log('[Server Loader] Dropdown button clicked');
                e.preventDefault();
                e.stopPropagation();
                dropdown.classList.toggle('hidden');
            });
            
            document.addEventListener('click', function(e) {
                if (!dropdown.contains(e.target) && !newBtn.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            });
            
            const dropdownItems = document.querySelectorAll('.server-dropdown-item');
            dropdownItems.forEach(item => {
                const newItem = item.cloneNode(true);
                item.parentNode.replaceChild(newItem, item);
                
                newItem.addEventListener('click', function(e) {
                    e.preventDefault();
                    const actionText = this.querySelector('span').textContent.trim();
                    dropdown.classList.add('hidden');
                    
                    console.log('[Server Loader] Dropdown action:', actionText);
                    
                    switch(actionText) {
                        case 'Invite People':
                            if (typeof window.showInvitePeopleModal === 'function') {
                                window.showInvitePeopleModal();
                            }
                            break;
                        case 'Server Settings':
                            if (typeof window.redirectToServerSettings === 'function') {
                                window.redirectToServerSettings();
                            }
                            break;
                        case 'Create Channel':
                            if (typeof window.showCreateChannelModal === 'function') {
                                window.showCreateChannelModal();
                            }
                            break;
                        case 'Create Category':
                            if (typeof window.showCreateCategoryModal === 'function') {
                                window.showCreateCategoryModal();
                            }
                            break;
                        case 'Leave Server':
                            if (typeof window.showLeaveServerConfirmation === 'function') {
                                window.showLeaveServerConfirmation();
                            }
                            break;
                    }
                });
            });
            
            console.log('[Server Loader] Server dropdown initialized successfully');
        } else {
            console.error('[Server Loader] Server dropdown elements not found');
        }
    }, 150);
}

function reinitializeChannelSwitchManager() {
    console.log('[Server AJAX] ChannelSwitchManager will auto-initialize when needed');
}

function cleanupForServerSwitch() {
    console.log('[Server AJAX] Cleaning up for server switch');
    
    const currentServerId = window.location.pathname.match(/\/server\/(\d+)/)?.[1];
    const isActualServerSwitch = window._lastServerId && window._lastServerId !== currentServerId;
    
    if (isActualServerSwitch) {
        console.log('[Server AJAX] Actual server switch detected, cleaning up channel switch manager');
        if (window.channelSwitchManager && typeof window.channelSwitchManager.cleanup === 'function') {
            window.channelSwitchManager.cleanup();
            window.channelSwitchManager = null;
        }
    } else {
        console.log('[Server AJAX] Same server navigation, preserving channel switch manager');
    }
    
    if (window.chatSection && typeof window.chatSection.cleanup === 'function') {
        console.log('[Server AJAX] Cleaning up existing chat section');
        window.chatSection.cleanup();
        window.chatSection = null;
    }
    
    window._lastServerId = currentServerId;
    console.log('[Server AJAX] Cleanup completed - preserving global socket manager');
}

window.loadServerPage = loadServerPage; 
window.handleServerSkeletonLoading = handleServerSkeletonLoading;
window.hideServerSkeletonLoading = hideServerSkeletonLoading; 