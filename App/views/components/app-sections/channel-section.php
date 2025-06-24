<?php
if (!isset($currentServer) || empty($currentServer)) {
    echo '<div class="p-4 text-gray-400 text-center">No server loaded</div>';
    return;
}

$currentServerId = $currentServer->id ?? 0;
$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$channels = $GLOBALS['serverChannels'] ?? [];
$categories = $GLOBALS['serverCategories'] ?? [];

function getChannelIcon($type) {
    return match(strtolower($type ?? 'text')) {
        'voice' => 'volume-high',
        'announcement' => 'bullhorn', 
        'forum' => 'users',
        default => 'hashtag'
    };
}

function renderChannel($channel, $activeChannelId) {
    $type = $channel['type'] ?? 'text';
    if (is_numeric($type)) {
        $type = $type == 2 || $type == '2' ? 'voice' : 'text';
    }
    $icon = getChannelIcon($type);
    $isActive = $activeChannelId == $channel['id'];
    $activeClass = $isActive ? 'bg-discord-lighten text-white' : '';
    
    echo '<div class="channel-item flex items-center py-2 px-3 rounded cursor-pointer text-gray-400 hover:text-gray-300 hover:bg-discord-lighten ' . $activeClass . '" 
              data-channel-id="' . $channel['id'] . '" 
              data-channel-type="' . htmlspecialchars($type) . '" 
              data-channel-name="' . htmlspecialchars($channel['name']) . '">';
    echo '  <i class="fas fa-' . $icon . ' text-xs mr-3 text-gray-500"></i>';
    echo '  <span class="text-sm">' . htmlspecialchars($channel['name']) . '</span>';
    if ($type === 'voice') {
        echo '  <span class="ml-auto text-xs text-gray-500">0</span>';
    }
    echo '</div>';
}

function renderChannelSkeleton($count = 1, $extraClass = '') {
    for ($i = 0; $i < $count; $i++) {
        echo '<div class="flex items-center py-2 px-3 ' . $extraClass . '">';
        echo '  <div class="h-3 w-3 bg-gray-700 rounded-sm mr-3 animate-pulse"></div>';
        echo '  <div class="h-4 bg-gray-700 rounded w-' . rand(16, 32) . ' animate-pulse"></div>';
        echo '</div>';
    }
}

function renderCategorySkeleton($count = 1) {
    for ($i = 0; $i < $count; $i++) {
        echo '<div class="mb-3">';
        echo '  <div class="flex items-center px-3 py-1 mb-1">';
        echo '    <div class="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>';
        echo '    <div class="ml-auto h-3 w-3 bg-gray-700 rounded-sm animate-pulse"></div>';
        echo '  </div>';
        renderChannelSkeleton(rand(2, 4), 'ml-2');
        echo '</div>';
    }
}
?>

<div class="channel-wrapper h-full w-full overflow-y-auto">
    <div class="channel-skeleton p-2 skeleton-loader">
        <div class="h-6 bg-gray-700 rounded w-32 mb-6 mx-auto animate-pulse"></div>
        
        <div class="mb-4">
            <div class="h-5 bg-gray-700 rounded w-32 mb-3 mx-2 animate-pulse"></div>
            <?php renderChannelSkeleton(3); ?>
        </div>
        
        <div class="mb-3">
            <div class="h-5 bg-gray-700 rounded w-24 mb-3 mx-2 animate-pulse"></div>
            <?php renderChannelSkeleton(2); ?>
        </div>
        
        <?php renderCategorySkeleton(2); ?>
    </div>

    <div class="channel-list p-2 hidden" data-server-id="<?php echo $currentServerId; ?>">
        <input type="hidden" id="current-server-id" value="<?php echo $currentServerId; ?>">
        
        <?php
        $uncategorizedChannels = array_filter($channels, function($ch) {
            return !isset($ch['category_id']) || $ch['category_id'] === null || $ch['category_id'] === '';
        });

        if (!empty($uncategorizedChannels)):
            $textChannels = array_filter($uncategorizedChannels, function($ch) {
                return ($ch['type'] ?? 'text') === 'text';
            });
            
            if (!empty($textChannels)):
        ?>
        <div class="channels-section group">
            <?php foreach ($textChannels as $channel): ?>
                <?php renderChannel($channel, $activeChannelId); ?>
            <?php endforeach; ?>
        </div>
        <?php 
            endif;
            
            $voiceChannels = array_filter($uncategorizedChannels, function($ch) {
                return ($ch['type'] ?? 'text') === 'voice';
            });
            
            if (!empty($voiceChannels)):
        ?>
        <div class="voice-channels-section group">
            <?php foreach ($voiceChannels as $channel): ?>
                <?php renderChannel($channel, $activeChannelId); ?>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
        <?php endif; ?>

        <?php if (empty($channels)): ?>
        <div class="p-4 text-gray-400 text-center text-sm">No channels available</div>
        <?php endif; ?>
    </div>
</div>

<?php if (isset($_GET['debug'])): ?>
<div style="position:fixed;top:10px;right:10px;background:#000;color:#0f0;padding:10px;font-size:12px;max-width:300px;z-index:9999;border:1px solid #0f0;">
    <strong>Debug Info:</strong><br>
    Channels: <?php echo count($channels); ?><br>
    Categories: <?php echo count($categories); ?><br>
    Server ID: <?php echo $currentServerId; ?><br>
    Active Channel: <?php echo $activeChannelId ?? 'none'; ?><br>
    <pre style="font-size:10px;max-height:200px;overflow:auto;"><?php echo htmlspecialchars(json_encode($channels, JSON_PRETTY_PRINT)); ?></pre>
    <button onclick="this.parentNode.style.display='none'" style="background:#333;color:white;border:none;padding:2px 5px;margin-top:5px;">Close</button>
</div>
<?php endif; ?>

<style>
.channel-item {
    transition: all 0.15s ease;
    border-radius: 4px;
}

.channel-item:hover {
    background-color: rgba(79, 84, 92, 0.16) !important;
}

.group:hover .opacity-0 {
    opacity: 1 !important;
}
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        const skeleton = document.querySelector('.channel-skeleton');
        const channelList = document.querySelector('.channel-list');
        
        if (skeleton && channelList) {
            skeleton.classList.add('hidden');
            channelList.classList.remove('hidden');
        }
    }, 800);
    
    const channelItems = document.querySelectorAll('.channel-item');
    
    channelItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const channelId = this.getAttribute('data-channel-id');
            const channelType = this.getAttribute('data-channel-type'); 
            const channelName = this.getAttribute('data-channel-name') || '';
            const serverId = document.querySelector('#current-server-id')?.value;
            
            if (!channelId || !serverId) return;
            
            channelItems.forEach(el => {
                el.classList.remove('bg-discord-lighten', 'text-white');
            });
            this.classList.add('bg-discord-lighten', 'text-white');
            
            if (window.location.href.includes(`/server/${serverId}`)) {
                loadChannelContent(serverId, channelId, channelType);
                
                const newUrl = `/server/${serverId}?channel=${channelId}${channelType === 'voice' ? '&type=voice' : ''}`;
                
                if (window.history && window.history.pushState) {
                    window.history.pushState({
                        serverId, 
                        channelId, 
                        type: channelType,
                        channelName: channelName
                    }, '', newUrl);
                } else {
                    window.location.href = newUrl;
                }
            } else {
                const url = `/server/${serverId}?channel=${channelId}${channelType === 'voice' ? '&type=voice' : ''}`;
                
                if (typeof MisVordAjax !== 'undefined') {
                    MisVordAjax.get(url, {
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-Page-Request': 'true'
                        }
                    })
                    .then(response => {
                        if (response.success && response.html) {
                            const mainContent = document.getElementById('main-content');
                            if (mainContent) {
                                mainContent.innerHTML = response.html;
                                
                                if (response.title) {
                                    document.title = response.title;
                                }
                                
                                if (window.history && window.history.pushState) {
                                    window.history.pushState({path: url}, '', url);
                                }
                                
                                if (typeof window.reinitUI === 'function') {
                                    window.reinitUI();
                                }
                                
                                if (typeof initializeAllComponents === 'function') {
                                    initializeAllComponents();
                                }
                            }
                        } else {
                            window.location.href = url;
                        }
                    })
                    .catch(error => {
                        console.error('Error loading page:', error);
                        window.location.href = url;
                    });
                } else {
                    window.location.href = url;
                }
            }
        });
    });
    
    window.addEventListener('popstate', function(event) {
        if (event.state) {
            if (event.state.serverId && event.state.channelId) {
                loadChannelContent(event.state.serverId, event.state.channelId, event.state.type || 'text');
                
                const channelItem = document.querySelector(`.channel-item[data-channel-id="${event.state.channelId}"]`);
                if (channelItem) {
                    document.querySelectorAll('.channel-item').forEach(el => {
                        el.classList.remove('bg-discord-lighten', 'text-white');
                    });
                    channelItem.classList.add('bg-discord-lighten', 'text-white');
                }
            } else if (event.state.path) {
                if (typeof MisVordAjax !== 'undefined') {
                    MisVordAjax.get(event.state.path, {
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-Page-Request': 'true'
                        }
                    })
                    .then(response => {
                        if (response.success && response.html) {
                            const mainContent = document.getElementById('main-content');
                            if (mainContent) {
                                mainContent.innerHTML = response.html;
                                
                                if (response.title) {
                                    document.title = response.title;
                                }
                                
                                if (typeof window.reinitUI === 'function') {
                                    window.reinitUI();
                                }
                                
                                if (typeof initializeAllComponents === 'function') {
                                    initializeAllComponents();
                                }
                            }
                        }
                    })
                    .catch(error => {
                        console.error('Error handling popstate:', error);
                    });
                }
            }
        }
    });
});

async function loadChannelContent(serverId, channelId, type = 'text') {
    try {
        if (!serverId || !channelId) {
            console.error('Missing required parameters', { serverId, channelId, type });
            if (typeof showToast === 'function') {
                showToast('Missing channel information. Please try again.', 'error');
            }
            return;
        }

        const chatSection = document.querySelector('.chat-section-wrapper') || document.querySelector('.chat-container');
        const participantSection = document.querySelector('.participant-section-wrapper');
        
        if (!chatSection) {
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                const loadingSpinner = `
                    <div class="flex items-center justify-center h-full w-full">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                    </div>
                `;
                mainContent.innerHTML = loadingSpinner;
            }
            
            const newUrl = `/server/${serverId}?channel=${channelId}${type === 'voice' ? '&type=voice' : ''}`;
            if (typeof MisVordAjax !== 'undefined') {
                MisVordAjax.get(newUrl, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-Page-Request': 'true'
                    }
                })
                .then(response => {
                    if (response.success && response.html) {
                        const mainContent = document.getElementById('main-content');
                        if (mainContent) {
                            mainContent.innerHTML = response.html;
                            
                            if (response.title) {
                                document.title = response.title;
                            }
                            
                            if (window.history && window.history.pushState) {
                                window.history.pushState({path: newUrl}, '', newUrl);
                            }
                            
                            if (typeof window.reinitUI === 'function') {
                                window.reinitUI();
                            }
                            
                            initializeAllComponents();
                        }
                    } else {
                        console.error('Invalid response format', response);
                        window.location.href = newUrl;
                    }
                })
                .catch(error => {
                    console.error('Error loading page:', error);
                    window.location.href = newUrl;
                });
            } else {
                window.location.href = newUrl;
            }
            return;
        }
        
        const loadingSpinner = `
            <div class="flex items-center justify-center h-full w-full">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        `;
        
        chatSection.innerHTML = loadingSpinner;
        
        const channelItems = document.querySelectorAll('.channel-item');
        channelItems.forEach(item => {
            if (item.getAttribute('data-channel-id') === channelId) {
                item.classList.add('bg-discord-lighten', 'text-white');
            } else {
                item.classList.remove('bg-discord-lighten', 'text-white');
            }
        });
        
        console.log('Fetching channel content for:', { serverId, channelId, type });
        const response = await window.channelAPI.getChannelContent(serverId, channelId, type);
        console.log('Channel content response:', response);
        
        if (response && response.success) {
            const isVoiceChannel = type === 'voice';
            
            if (isVoiceChannel && chatSection.classList.contains('chat-container')) {
                const url = `/server/${serverId}?channel=${channelId}&type=voice`;
                
                if (typeof MisVordAjax !== 'undefined') {
                    MisVordAjax.get(url, {
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-Page-Request': 'true'
                        }
                    })
                    .then(response => {
                        if (response.success && response.html) {
                            const mainContent = document.getElementById('main-content');
                            if (mainContent) {
                                mainContent.innerHTML = response.html;
                                
                                if (response.title) {
                                    document.title = response.title;
                                }
                                
                                if (window.history && window.history.pushState) {
                                    window.history.pushState({
                                        serverId, 
                                        channelId, 
                                        type: 'voice',
                                        channelName: response.data.channel_name || (response.data.channel && response.data.channel.name)
                                    }, '', url);
                                }
                                
                                if (typeof window.reinitUI === 'function') {
                                    window.reinitUI();
                                }
                                
                                if (typeof initializeAllComponents === 'function') {
                                    initializeAllComponents();
                                }
                            }
                        } else {
                            console.error('Invalid response format', response);
                            window.location.href = url;
                        }
                    })
                    .catch(error => {
                        console.error('Error loading voice channel:', error);
                        window.location.href = url;
                    });
                } else {
                    window.location.href = url;
                }
                return;
            }
            
            chatSection.innerHTML = response.data.html.chat_section || '';
            
            if (participantSection) {
                participantSection.innerHTML = response.data.html.participant_section || '';
            }
            
            const metaTags = document.querySelectorAll('meta[name^="chat-"]');
            metaTags.forEach(tag => {
                if (tag.getAttribute('name') === 'chat-id') {
                    tag.setAttribute('content', channelId);
                } else if (tag.getAttribute('name') === 'channel-id') {
                    tag.setAttribute('content', channelId);
                } else if (tag.getAttribute('name') === 'chat-type') {
                    tag.setAttribute('content', 'channel');
                } else if (tag.getAttribute('name') === 'chat-title' && response.data.channel) {
                    tag.setAttribute('content', response.data.channel.name || '');
                }
            });
            
            if (response.data.channel && response.data.channel.name) {
                document.title = `${response.data.channel.name} | MisVord`;
            } else if (response.data.channel_name) {
                document.title = `${response.data.channel_name} | MisVord`;
            } else {
                const channelItem = document.querySelector(`.channel-item[data-channel-id="${channelId}"]`);
                if (channelItem) {
                    const channelName = channelItem.getAttribute('data-channel-name');
                    if (channelName) {
                        document.title = `${channelName} | MisVord`;
                    }
                }
            }
            
            if (window.chatSection) {
                if (window.chatSection.typingTimeout) {
                    clearTimeout(window.chatSection.typingTimeout);
                }
                
                if (window.chatSection.chatMessages) {
                    const oldChatMessages = document.getElementById('chat-messages');
                    if (oldChatMessages) {
                        const newChatMessages = oldChatMessages.cloneNode(false);
                        if (oldChatMessages.parentNode) {
                            oldChatMessages.parentNode.replaceChild(newChatMessages, oldChatMessages);
                        }
                    }
                }
            }
            
            if (window.globalSocketManager && window.globalSocketManager.isReady()) {
                window.globalSocketManager.setupChannelListeners(channelId);
            }
            
            if (!isVoiceChannel && typeof window.initializeChatSection === 'function') {
                window.initializeChatSection();
            }
            
            if (isVoiceChannel && typeof initializeVoiceChannel === 'function') {
                setTimeout(initializeVoiceChannel, 100);
            } else {
                initializeRemainingComponents();
            }
            
            document.dispatchEvent(new CustomEvent('channelChanged', { 
                detail: { 
                    serverId,
                    channelId,
                    channelType: type,
                    channel: response.data.channel || {}
                }
            }));
        } else {
            throw new Error(response?.message || 'Failed to load channel content');
        }
    } catch (error) {
        console.error('Error loading channel content:', error);
        if (typeof showToast === 'function') {
            showToast('Failed to load channel content. Please try again.', 'error');
        } else {
            alert('Failed to load channel content. Please try again.');
        }
        
        const chatSection = document.querySelector('.chat-section-wrapper') || document.querySelector('.chat-container');
        if (chatSection) {
            chatSection.innerHTML = `
                <div class="flex flex-col h-full items-center justify-center text-white">
                    <div class="text-4xl mb-4">🙁</div>
                    <div class="text-xl mb-2">Oops! Something went wrong</div>
                    <div class="text-sm text-gray-400 mb-4">We couldn't load this channel</div>
                    <button onclick="window.location.reload()" class="bg-discord-primary hover:bg-discord-primary-darker px-4 py-2 rounded text-white">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }
}

function initializeAllComponents() {
    // Initialize chat section
    if (typeof window.initializeChatSection === 'function') {
        window.initializeChatSection();
    }
    
    initializeRemainingComponents();
}

function initializeRemainingComponents() {
    // Initialize message components
    if (typeof initializeMessageComponents === 'function') {
        initializeMessageComponents();
    }
    
    // Initialize lazy loading
    if (window.LazyLoader && typeof window.LazyLoader.init === 'function') {
        window.LazyLoader.init();
    }
    
    // Initialize message input
    const messageInput = document.querySelector('#message-input');
    if (messageInput) {
        messageInput.focus();
        // Add input handlers if needed
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const sendButton = document.querySelector('#send-message-btn');
                if (sendButton) {
                    sendButton.click();
                }
            }
        });
    }
    
    // Scroll chat to bottom
    const messagesContainer = document.querySelector('#chat-messages');
    if (messagesContainer) {
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }
}

function openCreateChannelModal(type = 'text') {
    console.log('Create channel modal:', type);
}

function toggleChannelLoading(loading = true) {
    const channelWrapper = document.querySelector('.channel-wrapper');
    if (!channelWrapper) return;
    
    const skeleton = channelWrapper.querySelector('.channel-skeleton');
    const channelList = channelWrapper.querySelector('.channel-list');
    
    if (loading) {
        if (skeleton) skeleton.classList.remove('hidden');
        if (channelList) channelList.classList.add('hidden');
    } else {
        if (skeleton) skeleton.classList.add('hidden');
        if (channelList) channelList.classList.remove('hidden');
    }
}

window.toggleChannelLoading = toggleChannelLoading;
</script>