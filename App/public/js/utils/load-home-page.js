export function loadHomePage(pageType = 'friends') {
    console.log('[Home AJAX] Starting direct AJAX home page load');
    console.log('[Home AJAX] Page type:', pageType);
    
    const mainContent = document.querySelector('#app-container .flex.flex-1.overflow-hidden');

    if (mainContent) {
        handleHomeSkeletonLoading(true);
        window.homeSkeletonStartTime = Date.now();

        const currentChannelId = getCurrentChannelId();
        if (currentChannelId && window.globalSocketManager) {
            console.log('Cleaning up current channel socket:', currentChannelId);
            window.globalSocketManager.leaveChannel(currentChannelId);
        }

        const targetPath = '/home';
        const shouldPreserveVoice = shouldPreserveVoiceConnection(targetPath);
        
        if (window.voiceManager && typeof window.voiceManager.leaveVoice === 'function') {
            if (shouldPreserveVoice) {
                console.log('[Home Loader] Preserving voice connection - navigating between allowed pages');
            } else {
                console.log('[Home Loader] Cleaning up voice manager');
                window.voiceManager.leaveVoice();
            }
        }

        let url = '/home/layout';
        if (pageType && pageType !== 'friends') {
            url += '?type=' + pageType;
        }

        console.log('[Home AJAX] Starting request to:', url);

        $.ajax({
            url: url,
            method: 'GET',
            dataType: 'html',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                console.log('[Home AJAX] SUCCESS - Response received');
                
                if (typeof response === 'string') {
                    console.log('[Home AJAX] Processing string response');
                    
                    const minDisplayTime = 800;
                    const startTime = window.homeSkeletonStartTime || 0;
                    const elapsedTime = Date.now() - startTime;
                    const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
                    
                    console.log('[Home Skeleton] Response ready - Elapsed time:', elapsedTime + 'ms', 'Remaining time:', remainingTime + 'ms');
                    
                    if (remainingTime > 0) {
                        console.log('[Home Skeleton] Delaying content replacement to ensure minimum display time');
                        setTimeout(() => {
                            performHomeLayoutUpdate(response, pageType, currentChannelId);
                        }, remainingTime);
                    } else {
                        performHomeLayoutUpdate(response, pageType, currentChannelId);
                    }
                    
                } else if (response && response.data && response.data.redirect) {
                    console.log('[Home AJAX] Redirect response:', response.data.redirect);
                    window.location.href = response.data.redirect;
                } else {
                    console.error('[Home AJAX] INVALID RESPONSE FORMAT');
                    window.location.href = '/home';
                }
            },
            error: function(xhr, status, error) {
                console.error('[Home AJAX] ERROR - Request failed');
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
    
    const skeletonHTML = `
        <div class="home-skeleton-loading flex flex-1 overflow-hidden">
            <div class="w-60 bg-discord-dark flex flex-col">
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
            
            <div class="flex-1 bg-discord-background flex flex-col">
                <div class="h-12 border-b border-gray-700 px-6 flex items-center">
                    <div class="h-6 bg-gray-700 rounded w-40 animate-pulse"></div>
                    <div class="ml-auto flex space-x-3">
                        ${Array(4).fill().map(() => `<div class="w-8 h-8 bg-gray-700 rounded animate-pulse"></div>`).join('')}
                    </div>
                </div>
                
                <div class="flex-1 p-6">
                    <div class="mb-6">
                        <div class="h-8 bg-gray-700 rounded w-48 mb-4 animate-pulse"></div>
                        <div class="flex space-x-4 mb-4">
                            ${Array(4).fill().map(() => `<div class="h-8 bg-gray-700 rounded w-20 animate-pulse"></div>`).join('')}
                        </div>
                    </div>
                    
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
            
            <div class="w-60 bg-discord-dark border-l border-gray-800 flex flex-col h-full max-h-screen">
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
    actuallyHideHomeSkeleton();
}

function actuallyHideHomeSkeleton() {
    const mainLayoutContainer = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
    if (mainLayoutContainer && mainLayoutContainer.getAttribute('data-skeleton') === 'home') {
        mainLayoutContainer.removeAttribute('data-skeleton');
        console.log('[Home Skeleton] Home skeleton actually hidden');
    }
    
    window.homeSkeletonStartTime = null;
}

function updateHomeLayout(html) {
    console.log('[Home Layout] Starting home layout replacement');
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    console.log('[Home Layout] DOM parsed successfully');
    
    const newLayout = doc.querySelector('.flex.flex-1.overflow-hidden');
    console.log('[Home Layout] New layout element found:', !!newLayout);
    
    if (newLayout) {
        const currentLayout = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
        console.log('[Home Layout] Current layout container found:', !!currentLayout);
        
        if (currentLayout) {
            console.log('[Home Layout] Hiding server channel section');
            hideServerChannelSection();
            
            console.log('[Home Layout] Replacing layout innerHTML');
            currentLayout.innerHTML = newLayout.innerHTML;
            
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
        }
    } else {
        console.error('[Home Layout] FAILED - New layout element not found in response');
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
    }
}

function validateHomeLayoutRendering() {
    console.log('[Home Validation] Starting layout validation');
    
    const validationChecks = {
        'app-container': !!document.querySelector('#app-container'),
        'main-content-layout': !!document.querySelector('.flex.flex-1.overflow-hidden'),
        'dm-sidebar': !!document.querySelector('.w-60.bg-discord-dark.flex.flex-col'),
        'friends-section': !!document.querySelector('[class*="Friends"]') || !!document.querySelector('.tab-content'),
        'active-now-section': !!document.querySelector('.w-60.bg-discord-dark.border-l'),
        'home-layout-structure': !!document.querySelector('#main-content')
    };
    
    console.log('[Home Validation] Layout validation results:', validationChecks);
    
    const failedChecks = Object.keys(validationChecks).filter(key => !validationChecks[key]);
    if (failedChecks.length > 0) {
        console.error('[Home Validation] FAILED VALIDATION - Missing elements:', failedChecks);
    } else {
        console.log('[Home Validation] SUCCESS - All layout elements rendered correctly');
    }
    
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

async function loadHomeDependencies() {
    console.log('[Home Dependencies] Loading home page dependencies');
    
    const dependencies = [
        '/public/js/api/friend-api.js',
        '/public/js/api/chat-api.js', 
        '/public/js/api/user-api.js',
        '/public/js/api/channel-api.js',
        '/public/js/core/socket/global-socket-manager.js',
        '/public/js/components/messaging/message-handler.js',
        '/public/js/components/messaging/socket-handler.js',
        '/public/js/components/messaging/chat-ui-handler.js',
        '/public/js/components/messaging/send-receive-handler.js',
        '/public/js/components/messaging/mention-handler.js',
        '/public/js/components/messaging/chat-section.js',
        '/public/js/components/home/friends-tabs.js',
        '/public/js/components/home/direct-message-nav.js',
        '/public/js/components/common/user-detail.js',
        '/public/js/core/ui/toast.js'
    ];
    
    const loadPromises = dependencies.map(dep => {
        return import(dep).catch(error => {
            console.warn('[Home Dependencies] Failed to load:', dep, error);
            return null;
        });
    });
    
    try {
        await Promise.all(loadPromises);
        console.log('[Home Dependencies] All dependencies loaded');
        return true;
    } catch (error) {
        console.error('[Home Dependencies] Error loading dependencies:', error);
        return false;
    }
}

function initializeHomePage() {
    console.log('[Home Initialize] Initializing home page components');
    
    if (typeof window.initFriendsTabManager === 'function') {
        window.initFriendsTabManager();
        console.log('[Home Initialize] Friends tab manager initialized');
    }
    
    if (typeof window.initDirectMessageNavigation === 'function') {
        window.initDirectMessageNavigation();
        console.log('[Home Initialize] Direct message navigation initialized');
    }
    
    if (typeof window.initializeUserDetail === 'function') {
        window.initializeUserDetail();
        console.log('[Home Initialize] User detail modal initialized');
    }
    
    initializeFriendRequestHandlers();
    initializeSearchHandlers();
    
    console.log('[Home Initialize] Home page initialization completed');
}

function initializeFriendRequestHandlers() {
    console.log('[Home Friends] Initializing friend request handlers');
    
    const friendInput = document.getElementById('friend-username-input');
    const sendButton = document.getElementById('send-friend-request');
    const errorDiv = document.getElementById('friend-request-error');
    const successDiv = document.getElementById('friend-request-success');
    
    if (friendInput && sendButton) {
        friendInput.addEventListener('input', function() {
            const username = this.value.trim();
            sendButton.disabled = username.length < 2;
        });
        
        sendButton.addEventListener('click', async function() {
            const username = friendInput.value.trim();
            if (!username) return;
            
            if (errorDiv) errorDiv.classList.add('hidden');
            if (successDiv) successDiv.classList.add('hidden');
            
            try {
                if (window.FriendAPI) {
                    const result = await window.FriendAPI.sendFriendRequest(username);
                    if (result.success) {
                        friendInput.value = '';
                        sendButton.disabled = true;
                        if (successDiv) {
                            successDiv.textContent = 'Friend request sent successfully!';
                            successDiv.classList.remove('hidden');
                        }
                    } else {
                        throw new Error(result.error || 'Failed to send friend request');
                    }
                } else {
                    throw new Error('Friend API not available');
                }
            } catch (error) {
                console.error('[Home Friends] Error sending friend request:', error);
                if (errorDiv) {
                    errorDiv.textContent = error.message;
                    errorDiv.classList.remove('hidden');
                }
            }
        });
    }
    
    window.acceptFriendRequest = async function(friendshipId) {
        try {
            if (window.FriendAPI) {
                const result = await window.FriendAPI.acceptFriendRequest(friendshipId);
                if (result.success) {
                    location.reload();
                }
            }
        } catch (error) {
            console.error('[Home Friends] Error accepting friend request:', error);
        }
    };
    
    window.ignoreFriendRequest = async function(friendshipId) {
        try {
            if (window.FriendAPI) {
                const result = await window.FriendAPI.declineFriendRequest(friendshipId);
                if (result.success) {
                    location.reload();
                }
            }
        } catch (error) {
            console.error('[Home Friends] Error declining friend request:', error);
        }
    };
    
    window.cancelFriendRequest = async function(userId) {
        try {
            if (window.FriendAPI) {
                const result = await window.FriendAPI.cancelFriendRequest(userId);
                if (result.success) {
                    location.reload();
                }
            }
        } catch (error) {
            console.error('[Home Friends] Error canceling friend request:', error);
        }
    };
    
    window.createDirectMessage = async function(friendId) {
        try {
            if (window.ChatAPI) {
                const result = await window.ChatAPI.createDirectMessage(friendId);
                if (result.success && result.data.channel_id) {
                    if (window.directMessageNavigation) {
                        const friendEl = document.querySelector(`[data-user-id="${friendId}"]`);
                        const username = friendEl ? friendEl.dataset.username : 'User';
                        window.directMessageNavigation.switchToDirectMessage(result.data.channel_id, username);
                    }
                }
            }
        } catch (error) {
            console.error('[Home Friends] Error creating direct message:', error);
        }
    };
}

function initializeSearchHandlers() {
    console.log('[Home Search] Initializing search handlers');
    
    const searchInputs = {
        'online-search': '#online-friends-container .friend-item',
        'all-search': '#all-friends-container .friend-item', 
        'pending-search': '#pending-requests > div'
    };
    
    Object.entries(searchInputs).forEach(([inputId, selector]) => {
        const searchInput = document.getElementById(inputId);
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const items = document.querySelectorAll(selector);
                
                items.forEach(item => {
                    const username = item.querySelector('.friend-name, .font-medium')?.textContent.toLowerCase() || '';
                    const shouldShow = username.includes(searchTerm);
                    item.style.display = shouldShow ? '' : 'none';
                });
            });
        }
    });
}

function initializeChatSystems() {
    console.log('[Home Chat Systems] Initializing chat systems for home page');
    
    if (typeof window.initializeChatSection === 'function') {
        window.initializeChatSection();
        console.log('[Home Chat Systems] Chat section initialized');
    } else {
        console.warn('[Home Chat Systems] initializeChatSection function not available');
    }
    
    if (typeof window.initializeMessageHandler === 'function') {
        window.initializeMessageHandler();
        console.log('[Home Chat Systems] Message handler initialized');
    } else {
        console.warn('[Home Chat Systems] initializeMessageHandler function not available');
    }
    
    if (typeof window.initializeSocketHandler === 'function') {
        window.initializeSocketHandler();
        console.log('[Home Chat Systems] Socket handler initialized');
    } else {
        console.warn('[Home Chat Systems] initializeSocketHandler function not available');
    }
    
    if (window.globalSocketManager && window.globalSocketManager.isReady()) {
        const activeChannelId = getCurrentChannelId();
        if (activeChannelId) {
            console.log('[Home Chat Systems] Joining channel socket room:', activeChannelId);
            window.globalSocketManager.joinChannel(activeChannelId);
        } else {
            console.log('[Home Chat Systems] No active channel ID found for direct messages');
        }
    } else {
        console.warn('[Home Chat Systems] Global socket manager not ready');
    }
    
    setTimeout(() => {
        if (typeof window.initializeChannelManager === 'function') {
            window.initializeChannelManager();
            console.log('[Home Chat Systems] Channel manager initialized');
        } else {
            console.warn('[Home Chat Systems] initializeChannelManager function not available');
        }
    }, 200);
}

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
        console.error('[Home Navigation] Error getting default channel:', error);
        return null;
    }
}

function setupHomeServerNavigation() {
    console.log('[Home Navigation] Setting up server navigation handlers');
    
    setTimeout(() => {
        const serverLinks = document.querySelectorAll('a[href^="/server/"]');
        console.log('[Home Navigation] Found', serverLinks.length, 'server links');
        
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
                    console.log('[Home Navigation] Server link clicked, navigating to server:', serverId);
                    
                    try {
                        const defaultChannelId = await getDefaultChannelForServer(serverId);
                        
                        if (window.loadServerPage) {
                            await window.loadServerPage(serverId, defaultChannelId);
                            
                            if (typeof window.updateActiveServer === 'function') {
                                window.updateActiveServer('server', serverId);
                            }
                        } else {
                            const fallbackUrl = defaultChannelId ? `/server/${serverId}?channel=${defaultChannelId}` : `/server/${serverId}`;
                            window.location.href = fallbackUrl;
                        }
                    } catch (error) {
                        console.error('[Home Navigation] Error navigating to server:', error);
                        window.location.href = `/server/${serverId}`;
                    }
                }
            });
        });
        
        const serverButtons = document.querySelectorAll('button[data-server-id]');
        console.log('[Home Navigation] Found', serverButtons.length, 'server buttons');
        
        serverButtons.forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const serverId = this.getAttribute('data-server-id');
                console.log('[Home Navigation] Server button clicked, navigating to server:', serverId);
                
                try {
                    const defaultChannelId = await getDefaultChannelForServer(serverId);
                    
                    if (window.loadServerPage) {
                        await window.loadServerPage(serverId, defaultChannelId);
                        
                        if (typeof window.updateActiveServer === 'function') {
                            window.updateActiveServer('server', serverId);
                        }
                    } else {
                        const fallbackUrl = defaultChannelId ? `/server/${serverId}?channel=${defaultChannelId}` : `/server/${serverId}`;
                        window.location.href = fallbackUrl;
                    }
                } catch (error) {
                    console.error('[Home Navigation] Error navigating to server:', error);
                    window.location.href = `/server/${serverId}`;
                }
            });
        });
        
        const serverCards = document.querySelectorAll('.server-card, .explore-server-card');
        console.log('[Home Navigation] Found', serverCards.length, 'server cards');
        
        serverCards.forEach(card => {
            const serverId = card.getAttribute('data-server-id');
            if (serverId) {
                const newCard = card.cloneNode(true);
                card.parentNode.replaceChild(newCard, card);
                
                newCard.addEventListener('click', async function(e) {
                    if (!e.target.closest('button')) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        console.log('[Home Navigation] Server card clicked, navigating to server:', serverId);
                        
                        try {
                            const defaultChannelId = await getDefaultChannelForServer(serverId);
                            
                            if (window.loadServerPage) {
                                await window.loadServerPage(serverId, defaultChannelId);
                                
                                if (typeof window.updateActiveServer === 'function') {
                                    window.updateActiveServer('server', serverId);
                                }
                            } else {
                                const fallbackUrl = defaultChannelId ? `/server/${serverId}?channel=${defaultChannelId}` : `/server/${serverId}`;
                                window.location.href = fallbackUrl;
                            }
                        } catch (error) {
                            console.error('[Home Navigation] Error navigating to server:', error);
                            window.location.href = `/server/${serverId}`;
                        }
                    }
                });
            }
        });
        
    }, 300);
}

function performHomeLayoutUpdate(response, pageType, currentChannelId) {
    console.log('[Home Layout] Performing delayed layout update');
    
    updateHomeLayout(response);
    
    console.log('[Home AJAX] Validating layout update');
    validateHomeLayoutRendering();
    
    console.log('[Home AJAX] Disabling skeleton loading');
    handleHomeSkeletonLoading(false);
    
    console.log('[Home AJAX] Loading dependencies and initializing');
    loadHomeDependencies().then(() => {
        initializeHomePage();
        
        console.log('[Home AJAX] Initializing chat systems');
        initializeChatSystems();
        
        console.log('[Home AJAX] Setting up server navigation handlers');
        setupHomeServerNavigation();
        
        const event = new CustomEvent('HomePageChanged', { 
            detail: { 
                pageType,
                previousChannelId: currentChannelId 
            } 
        });
        document.dispatchEvent(event);
        console.log('[Home AJAX] HomePageChanged event dispatched');
        
        setTimeout(() => {
            console.log('[Home Layout] Dispatching layout change events');
            window.dispatchEvent(new CustomEvent('layoutChanged', { 
                detail: { type: 'home', pageType } 
            }));
            window.dispatchEvent(new CustomEvent('pageLoaded', { 
                detail: { type: 'home', pageType } 
            }));
        }, 300);
    });
}

window.loadHomePage = loadHomePage;