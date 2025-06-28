export function loadServerPage(serverId) {
    const mainContent = document.querySelector('.flex-1') ||
        document.querySelector('[class*="server-content"]') ||
        document.querySelector('main');

    if (mainContent) {
        if (typeof window.handleSkeletonLoading === 'function') {
            window.handleSkeletonLoading(true);
        } else {
            if (typeof window.toggleChannelLoading === 'function') {
                window.toggleChannelLoading(true);
            }

            if (typeof window.toggleParticipantLoading === 'function') {
                window.toggleParticipantLoading(true);
            }

            showPageLoading(mainContent);
        }

        const currentChannelId = getCurrentChannelId();
        if (currentChannelId && window.globalSocketManager) {
            console.log(`🧹 Cleaning up current channel socket: ${currentChannelId}`);
            window.globalSocketManager.leaveChannel(currentChannelId);
        }

        if (window.voiceManager) {
            console.log('🎤 Cleaning up voice manager');
            window.voiceManager.cleanup();
            window.voiceManager = null;
        }

        window.serverAPI.getServerPageHTML(serverId)
            .then(response => {
                if (typeof response === 'string') {
                    if (window.pageUtils) {
                        window.pageUtils.updatePageContent(mainContent, response);
                    } else {
                        updatePageContent(mainContent, response);
                    }
                    
                    if (typeof window.handleSkeletonLoading === 'function') {
                        window.handleSkeletonLoading(false);
                    } else {
                        if (typeof window.toggleChannelLoading === 'function') {
                            window.toggleChannelLoading(false);
                        }

                        if (typeof window.toggleParticipantLoading === 'function') {
                            window.toggleParticipantLoading(false);
                        }
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
                            previousChannelId: currentChannelId 
                        } 
                    });
                    document.dispatchEvent(event);
                    
                    const urlParams = new URLSearchParams(window.location.search);
                    const targetChannelId = urlParams.get('channel');
                    
                    if (!targetChannelId) {
                        console.log('No channel specified, loading default channel');
                        loadDefaultChannel(serverId);
                    }
                    
                } else if (response && response.data && response.data.redirect) {
                    window.location.href = response.data.redirect;
                } else {
                    window.location.href = `/server/${serverId}`;
                }
            })
            .catch(error => {
                console.error('Error loading server page:', error);
                if (typeof window.handleSkeletonLoading === 'function') {
                    window.handleSkeletonLoading(false);
                } else {
                    if (typeof window.toggleChannelLoading === 'function') {
                        window.toggleChannelLoading(false);
                    }

                    if (typeof window.toggleParticipantLoading === 'function') {
                        window.toggleParticipantLoading(false);
                    }
                }
                window.location.href = `/server/${serverId}`;
            });
    } else {
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

async function loadDefaultChannel(serverId) {
    try {
        const response = await fetch(`/api/servers/${serverId}/channels`);
        const data = await response.json();
        
        if (data.success && data.data && data.data.channels && data.data.channels.length > 0) {
            const firstChannel = data.data.channels[0];
            
            if (window.channelSwitchManager) {
                const channelElement = document.querySelector(`[data-channel-id="${firstChannel.id}"]`);
                await window.channelSwitchManager.switchToChannel(serverId, firstChannel.id, channelElement);
            }
        }
    } catch (error) {
        console.error('Failed to load default channel:', error);
    }
}

function updatePageContent(container, html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newContent = doc.querySelector('.flex-1') || 
                      doc.querySelector('[class*="server-content"]') ||
                      doc.body;
    
    if (newContent) {
        container.innerHTML = newContent.innerHTML;
        executeInlineScripts(doc);
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