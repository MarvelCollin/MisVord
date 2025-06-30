export function loadServerPage(serverId, channelId = null) {
    console.log('[Server Loader] Starting loadServerPage with serverId:', serverId, 'channelId:', channelId);
    
    if (window.globalSwitchLock) {
        console.log('[Server Loader] Global switch lock active, server switch blocked');
        return;
    }
    
    window.globalSwitchLock = true;
    console.log('[Server Loader] Global switch lock acquired for server loading');
    
    setTimeout(() => {
        if (window.globalSwitchLock) {
            console.warn('[Server Loader] Global switch lock timeout - force releasing after 30 seconds');
            window.globalSwitchLock = false;
        }
    }, 30000);
    
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
            dataType: 'html',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                console.log('[Server AJAX] SUCCESS - Response received');
                console.log('[Server AJAX] Response type:', typeof response);
                console.log('[Server AJAX] Response length:', response ? response.length : 'null');
                console.log('[Server AJAX] Response preview:', response ? response.substring(0, 150) + '...' : 'empty');
                
                if (typeof response === 'string') {
                    console.log('[Server AJAX] Processing string response');
                    updateServerLayout(response, serverId, channelId);
                    
                    console.log('[Server AJAX] Validating server layout');
                    validateServerLayoutRendering(serverId, channelId);
                    
                    if (typeof window.handleSkeletonLoading === 'function') {
                        window.handleSkeletonLoading(false);
                        console.log('[Server AJAX] Skeleton loading disabled');
                    }
                    
                    if (typeof window.initServerPage === 'function') {
                        window.initServerPage();
                        console.log('[Server AJAX] Server page initialized');
                    }
                    
                    if (typeof window.ChannelSwitchManager !== 'undefined') {
                        if (window.channelSwitchManager) {
                            console.log('[Server AJAX] Cleaning up existing channel switch manager');
                            try {
                                window.channelSwitchManager.cleanup();
                            } catch (cleanupError) {
                                console.warn('[Server AJAX] Error during cleanup:', cleanupError);
                            }
                            window.channelSwitchManager = null;
                        }
                        
                        // Add a small delay to ensure cleanup is complete
                        setTimeout(() => {
                            if (!window.channelSwitchManager) {
                                console.log('[Server AJAX] Creating new channel switch manager for server:', serverId);
                                window.channelSwitchManager = new window.ChannelSwitchManager();
                                console.log('[Server AJAX] Channel switch manager initialized');
                            } else {
                                console.log('[Server AJAX] Channel switch manager already exists, skipping creation');
                            }
                        }, 100);
                    } else {
                        console.warn('[Server AJAX] ChannelSwitchManager class not available');
                    }
                    
                    if (typeof window.initServerDropdown === 'function') {
                        console.log('[Server AJAX] Re-initializing server dropdown');
                        window.initServerDropdown();
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
                    
                    // Release global switch lock immediately after successful completion
                    window.globalSwitchLock = false;
                    console.log('[Server AJAX] Global switch lock released after server loading');
                    
                } else if (response && response.data && response.data.redirect) {
                    console.log('[Server AJAX] Redirect response:', response.data.redirect);
                    window.globalSwitchLock = false;
                    window.location.href = response.data.redirect;
                } else {
                    console.error('[Server AJAX] INVALID RESPONSE FORMAT');
                    console.error('[Server AJAX] Expected string, got:', typeof response);
                    console.error('[Server AJAX] Response content:', response);
                    window.globalSwitchLock = false;
                    window.location.href = `/server/${serverId}`;
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
                
                if (typeof window.handleSkeletonLoading === 'function') {
                    window.handleSkeletonLoading(false);
                }
                
                if (window.channelSwitchManager && typeof window.channelSwitchManager.cleanup === 'function') {
                    console.log('[Server AJAX] Cleaning up channel switch manager due to error');
                    window.channelSwitchManager.cleanup();
                }
                
                window.globalSwitchLock = false;
                console.error('[Server AJAX] Global switch lock released due to error');
                
                setTimeout(() => {
                console.error('[Server AJAX] FALLBACK - Redirecting to /server/' + serverId);
                window.location.href = `/server/${serverId}`;
                }, 100);
            }
            });
    } else {
        console.error('[Server Loader] No main content container found');
        window.globalSwitchLock = false;
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
    
    console.log('[Server Validation] Layout validation results:', validationChecks);
    
    const failedChecks = Object.keys(validationChecks).filter(key => !validationChecks[key]);
    if (failedChecks.length > 0) {
        console.error('[Server Validation] FAILED VALIDATION - Missing elements:', failedChecks);
        console.error('[Server Validation] Available containers:');
        console.error('[Server Validation] - app-container:', document.querySelector('#app-container'));
        console.error('[Server Validation] - flex containers:', document.querySelectorAll('.flex').length);
        console.error('[Server Validation] - w-60 containers:', document.querySelectorAll('.w-60').length);
        console.error('[Server Validation] - channel items:', document.querySelectorAll('.channel-item').length);
    } else {
        console.log('[Server Validation] SUCCESS - All server layout elements rendered correctly');
    }
    
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
    
    return failedChecks.length === 0;
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

window.loadServerPage = loadServerPage; 