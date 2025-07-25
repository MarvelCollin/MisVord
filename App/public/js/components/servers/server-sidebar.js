import { LocalStorageManager } from '../../utils/local-storage-manager.js';

let isRendering = false;
let serverDataCache = null;
let cacheExpiry = 0;
let isHandlingClick = false;

let homeIconClickCount = 0;
let lastClickTime = 0;
const CLICK_TIMEOUT = 3000;
const CLICKS_NEEDED = 16; 


function setupScrollBehavior() {
    const serverList = document.getElementById('server-list');
    if (!serverList) return;
    

    const updateMaxHeight = () => {
        const viewportHeight = window.innerHeight;
        const sidebarContainer = document.querySelector('.w-\\[72px\\]') || document.querySelector('[class*="w-[72px]"]');
        

        const topPadding = 24;
        const bottomPadding = 24;
        

        const maxHeight = viewportHeight - (topPadding + bottomPadding);
        serverList.style.maxHeight = `${maxHeight}px`;
        serverList.style.height = '100%';
        

        serverList.style.overflowY = 'auto';
        serverList.style.overflowX = 'hidden';
        

        serverList.style.scrollBehavior = 'smooth';
        

        if (sidebarContainer) {
            sidebarContainer.style.overflowY = 'hidden';
            sidebarContainer.style.height = '100vh';
        }


        const needsScrolling = serverList.scrollHeight > (serverList.clientHeight - 10);
        
        console.log('Scroll debug:', {
            scrollHeight: serverList.scrollHeight,
            clientHeight: serverList.clientHeight,
            needsScrolling: needsScrolling,
            maxHeight: maxHeight
        });
        
        if (needsScrolling) {
            serverList.classList.remove('no-scrollbar');

            serverList.style.paddingRight = '8px';
            serverList.style.overflowY = 'scroll'; 
        } else {
            serverList.classList.add('no-scrollbar');
        }


        serverList.style.pointerEvents = 'auto';
    };
    
    updateMaxHeight();
    window.addEventListener('resize', updateMaxHeight);
    

    if (localStorage.getItem('server_sidebar_scroll')) {
        try {
            const scrollPos = parseInt(localStorage.getItem('server_sidebar_scroll'));
            if (!isNaN(scrollPos)) {
                serverList.scrollTop = scrollPos;
            }
        } catch (e) {
            console.error('Error restoring scroll position:', e);
        }
    }
    

    serverList.addEventListener('scroll', () => {
        localStorage.setItem('server_sidebar_scroll', serverList.scrollTop);
    });
    

    setTimeout(() => {
        checkServerVisibility();
        updateMaxHeight(); 
    }, 200);


    setTimeout(() => {
        updateMaxHeight();
    }, 1000);
}

document.addEventListener('DOMContentLoaded', function() {

    initServerSidebar();
    initializeHomeIconEasterEgg();
    setupScrollBehavior(); 
    

    setTimeout(() => {
        setupAllTooltips();
        
    }, 100);
    

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.server-sidebar-icon') && !e.target.closest('.group-header')) {
            hideAllTooltips();
        }
    });
    

    document.addEventListener('mousemove', function(e) {
        const sidebar = document.querySelector('.w-\\[72px\\]');
        if (sidebar) {
            const rect = sidebar.getBoundingClientRect();
            if (e.clientX > rect.right + 200) {
                hideAllTooltips();
            }
        }
    });
    
    document.addEventListener('click', async function(e) {
        const homeLink = e.target.closest('a[href="/home"]') || 
                        e.target.closest('a[href="/"]') ||
                        e.target.closest('.server-sidebar-icon:first-child a');
        if (homeLink && !isHandlingClick) {
            e.preventDefault();
            
            handleEasterEggLogic();
            
            isHandlingClick = true;
            try {
                await handleHomeClick(e);
            } catch (error) {
                console.error('[Click Handler] ERROR in home navigation:', error);
            } finally {
                isHandlingClick = false;
            }
            return;
        }

        const exploreLink = e.target.closest('a[href="/explore-servers"]') ||
                           e.target.closest('a[href="/explore"]');
        if (exploreLink && !isHandlingClick) {
            e.preventDefault();
            
            isHandlingClick = true;
            try {
                await handleExploreClick(e);
            } catch (error) {
                console.error('[Click Handler] ERROR in explore navigation:', error);
            } finally {
                isHandlingClick = false;
            }
            return;
        }

        const serverLink = e.target.closest('.server-icon a[href^="/server/"]');
        if (serverLink && !isHandlingClick) {
            e.preventDefault(); 
            
            const serverId = serverLink.getAttribute('data-server-id');
            if (serverId) {
                isHandlingClick = true;
                try {
                    await handleServerClick(serverId, e);
                } catch (error) {
                    console.error('[Click Handler] ERROR in server navigation:', error);
                } finally {
                    isHandlingClick = false;
                }
            }
        }
    });
    
    window.addEventListener('popstate', function(event) {

        const serverId = event.state?.serverId;
        const pageType = event.state?.pageType;
        
        if (pageType === 'home') {
            handleHomeClick();
        } else if (serverId) {
            handleServerClick(serverId);
        } else {
            const currentPath = window.location.pathname;
            if (currentPath === '/home' || currentPath === '/home/' || currentPath === '/') {
                handleHomeClick();
            }
        }
    });
});


export function scrollToActiveServer() {
    const activeServer = document.querySelector('.server-sidebar-icon.active');
    if (!activeServer) return;
    
    const serverList = document.getElementById('server-list');
    if (!serverList) return;
    
    const serverRect = activeServer.getBoundingClientRect();
    const listRect = serverList.getBoundingClientRect();
    

    if (serverRect.top < listRect.top || serverRect.bottom > listRect.bottom) {
        activeServer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}


function checkServerVisibility() {
    const serverList = document.getElementById('server-list');
    if (!serverList) return;
    

    const allVisibleIcons = serverList.querySelectorAll('.server-sidebar-icon:not([style*="display: none"])');
    const totalVisibleItems = allVisibleIcons.length;
    

    const needsScrollbar = serverList.scrollHeight > serverList.clientHeight;
    
    if (!needsScrollbar || totalVisibleItems <= 5) {
        serverList.classList.add('no-scrollbar');
    } else {
        serverList.classList.remove('no-scrollbar');
        

        serverList.style.overflowY = 'auto';
    }
}

function handleEasterEggLogic() {
    const currentTime = Date.now();
    
    if (currentTime - lastClickTime > CLICK_TIMEOUT) {
        homeIconClickCount = 1;
    } else {
        homeIconClickCount++;
    }
    
    lastClickTime = currentTime;
    
    if (homeIconClickCount >= CLICKS_NEEDED) {
        homeIconClickCount = 0;
        if (window.MusicLoaderStatic?.playDiscordoSound) {
            window.MusicLoaderStatic.playDiscordoSound();
        }
    }
}

function initializeHomeIconEasterEgg() {
}

function initServerSidebar() {
    if (window.__SIDEBAR_INITIALIZED__) {
        return;
    }
    window.__SIDEBAR_INITIALIZED__ = true;
    
    performCompleteRender();
    

    setTimeout(() => {
        checkServerVisibility();
        scrollToActiveServer();
    }, 500);
}

function performCompleteRender() {
    clearAllPreviousState();
    
    document.querySelectorAll('.server-sidebar-icon[data-server-id]').forEach(icon => {
        icon.removeAttribute('data-setup');
    });
    
    renderFolders();
    

    setTimeout(() => {
        try {

            const allServerElements = document.querySelectorAll('.server-sidebar-icon[data-server-id]');
            const allServerIds = Array.from(allServerElements).map(el => el.getAttribute('data-server-id'));
            

            const mainListServers = document.querySelectorAll('#server-list > .server-sidebar-icon[data-server-id]:not([style*="display: none"])');
            const groupServers = document.querySelectorAll('.server-sidebar-group .server-sidebar-icon[data-server-id]:not([style*="display: none"])');
            
            const visibleServerIds = new Set([
                ...Array.from(mainListServers).map(el => el.getAttribute('data-server-id')),
                ...Array.from(groupServers).map(el => el.getAttribute('data-server-id'))
            ]);
            

            const missingServerIds = allServerIds.filter(id => !visibleServerIds.has(id));
            

            if (missingServerIds.length > 0) {
                console.warn('[Server Sidebar] Found missing servers after render, restoring:', missingServerIds);
                
                missingServerIds.forEach(serverId => {

                    const serverElement = document.querySelector(`.server-sidebar-icon[data-server-id="${serverId}"]`);
                    if (serverElement) {

                        LocalStorageManager.removeServerFromAllGroups(serverId);
                        

                        serverElement.classList.remove('in-group');
                        serverElement.style.display = '';
                        

                        const mainList = document.getElementById('server-list');
                        const addServerButton = mainList.querySelector('.discord-add-server-button')?.parentNode;
                        
                        if (mainList && addServerButton && serverElement.parentNode !== mainList) {
                            if (serverElement.parentNode) {
                                serverElement.parentNode.removeChild(serverElement);
                            }
                            mainList.insertBefore(serverElement, addServerButton);
                        }
                    }
                });
            }
        } catch (error) {
            console.error('[Server Sidebar] Error in safety check:', error);
        }
    }, 200);
}

function clearAllPreviousState() {
    resetServersToMainList();
    
    document.querySelectorAll('.server-sidebar-icon[data-setup]').forEach(icon => {
        icon.removeAttribute('data-setup');
        icon.classList.remove('in-group');
        
        if (!icon.classList.contains('in-group')) {
            icon.style.display = '';
        }
        
        if (!icon.hasAttribute('data-original-stored')) {
            const img = icon.querySelector('.server-sidebar-button img');
            const span = icon.querySelector('.server-sidebar-button span');
            
            if (img && img.src) {
                icon.setAttribute('data-original-img', img.src);
            }
            
            if (span && span.textContent) {
                icon.setAttribute('data-original-text', span.textContent);
            }
            
            icon.setAttribute('data-original-stored', 'true');
        }
    });
    
    document.querySelectorAll('.server-sidebar-group').forEach(folder => {
        folder.remove();
    });
    
    document.querySelectorAll('.drag-over, .drop-target').forEach(el => {
        el.classList.remove('drag-over', 'drop-target');
    });
    
    const existingMenu = document.getElementById('group-context-menu');
    if (existingMenu) existingMenu.remove();
}

async function renderFolders() {
    if (isRendering) return;
    isRendering = true;
    
    try {
        setupAllTooltips();
        checkServerVisibility();
    } catch (error) {
        console.error('Error in renderFolders:', error);
    } finally {
        isRendering = false;
    }
}

function resetServersToMainList() {
    const mainList = document.getElementById('server-list');
    if (!mainList) return;
    
    document.querySelectorAll('.server-sidebar-icon[data-server-id].in-group').forEach(serverIcon => {
        serverIcon.classList.remove('in-group');
        serverIcon.style.display = '';  
    });
}

function setupTooltipForElement(element) {
    const tooltip = element.querySelector('.tooltip');
    if (!tooltip || tooltip.getAttribute('data-has-clone') === 'true') return;
    
    const tooltipContainer = document.getElementById('tooltip-container');
    if (!tooltipContainer) return;
    

    const tooltipId = 'tooltip-' + Math.random().toString(36).substr(2, 9);
    tooltip.id = tooltipId;
    
    const clone = tooltip.cloneNode(true);
    clone.setAttribute('data-for-element', tooltipId);
    tooltipContainer.appendChild(clone);
    

    tooltip.style.display = 'none';
    tooltip.setAttribute('data-has-clone', 'true');
    
    const showTooltip = (e) => {

        hideAllTooltips();
        
        const rect = element.getBoundingClientRect();
        clone.style.left = (rect.right + 10) + 'px';
        clone.style.top = (rect.top + rect.height/2) + 'px';
        clone.style.transform = 'translateY(-50%)';
        clone.classList.remove('hidden');
        clone.style.display = 'block';
        clone.style.opacity = '1';
    };
    
    const hideTooltip = () => {
        clone.classList.add('hidden');
        clone.style.opacity = '0';
        setTimeout(() => {
            if (clone.classList.contains('hidden')) {
                clone.style.display = 'none';
            }
        }, 200);
    };


    element.removeEventListener('mouseenter', showTooltip);
    element.removeEventListener('mouseleave', hideTooltip);
    

    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
}

function setupAllTooltips() {
    
    document.querySelectorAll('.server-sidebar-icon, .server-sidebar-group .group-header').forEach(icon => {
        setupTooltipForElement(icon);
    });
}

async function buildServerImageData() {
    const serverImageData = new Map();
    
    const serverData = await getServerData();
    
    document.querySelectorAll('.server-sidebar-icon[data-server-id]').forEach(icon => {
        const serverId = icon.getAttribute('data-server-id');
        

        restoreServerContent(icon);
        
        const existingImg = icon.querySelector('.server-sidebar-button img');
        const existingText = icon.querySelector('.server-sidebar-button span');
        
        if (existingImg && existingImg.src && !existingImg.src.includes('default-profile-picture')) {
            serverImageData.set(serverId, {
                type: 'image',
                src: existingImg.src,
                alt: existingImg.alt || 'Server'
            });
        } else if (existingText && existingText.textContent.trim()) {
            serverImageData.set(serverId, {
                type: 'text',
                text: existingText.textContent.trim().charAt(0).toUpperCase()
            });
        } else {
            const apiServer = serverData[serverId];
            if (apiServer && apiServer.image_url) {
                 serverImageData.set(serverId, {
                    type: 'image',
                    src: apiServer.image_url,
                    alt: apiServer.name || 'Server'
                });
            } else if (apiServer && apiServer.name) {
                serverImageData.set(serverId, {
                    type: 'text',
                    text: (apiServer.name || 'S').charAt(0).toUpperCase()
                });
            } else {
                 serverImageData.set(serverId, { type: 'text', text: '?' });
            }
        }
    });
    
    return serverImageData;
}

function restoreServerContent(icon) {
    if (!icon) return;
    
    const serverButton = icon.querySelector('.server-sidebar-button');
    if (!serverButton) return;
    

    const hasImage = !!serverButton.querySelector('img');
    const hasText = !!serverButton.querySelector('span');
    
    if (!hasImage && !hasText) {
        const originalImg = icon.getAttribute('data-original-img');
        const originalText = icon.getAttribute('data-original-text');
        
        if (originalImg) {

            const img = document.createElement('img');
            img.src = originalImg;
            img.alt = 'Server';
            img.className = 'w-full h-full object-cover rounded-full';
            serverButton.innerHTML = '';
            serverButton.appendChild(img);
        } else if (originalText) {

            const span = document.createElement('span');
            span.textContent = originalText.charAt(0).toUpperCase();
            span.className = 'text-white font-bold text-xl';
            serverButton.innerHTML = '';
            serverButton.appendChild(span);
        }
    }
}

















async function getServerData() {
    try {
        const response = await fetch('/api/user/servers', {
            method: 'GET',
            credentials: 'include',
            headers: { 
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        
        if (data.data && data.data.servers) {
            const serverMap = {};
            data.data.servers.forEach(server => {
                serverMap[server.id] = server;
            });
            serverDataCache = serverMap;
            cacheExpiry = Date.now() + 300000;
            return serverMap;
        }
    } catch (error) {
        console.error('Failed to fetch server data:', error);
    }
    
    return serverDataCache || {};
}

export function updateActiveServer(pageType = null, serverId = null) {

    
    document.querySelectorAll('.server-sidebar-icon.active').forEach(icon => {
        icon.classList.remove('active');
    });
    
    document.querySelectorAll('.discord-explore-server-button.active').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (!pageType) {
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/server/')) {
            pageType = 'server';
            serverId = currentPath.split('/server/')[1].split('/')[0];
        } else if (currentPath === '/home' || currentPath === '/home/' || currentPath === '/') {
            pageType = 'home';
        } else if (currentPath.includes('/explore')) {
            pageType = 'explore';
        }
    }
    

    
    switch (pageType) {
        case 'server':
            if (serverId) {
                const serverIdStr = String(serverId);

                
                const serverLink = document.querySelector(`a[data-server-id="${serverIdStr}"]`);
                const activeIcon = serverLink ? serverLink.closest('.server-icon') : null;
                if (activeIcon) {
                    activeIcon.classList.add('active');

                } else {
                    console.warn('[Update Active Server] Server icon not found for ID:', serverIdStr);
                    const allServerLinks = document.querySelectorAll('a[data-server-id]');
                    const availableIds = Array.from(allServerLinks).map(link => link.getAttribute('data-server-id'));

                    
                    if (availableIds.length === 0) {

                    }
                }
            }
            break;
            
        case 'home':
                            const homeIcon = document.querySelector('.server-sidebar-icon:first-child');
                if (homeIcon) {
                    homeIcon.classList.add('active');

                } else {
                    console.warn('[Update Active Server] Home icon not found');
                }
            break;
            
        case 'explore':
            const exploreButton = document.querySelector('.discord-explore-server-button');
            if (exploreButton) {
                exploreButton.classList.add('active');

            } else {
                console.warn('[Update Active Server] Explore button not found');
            }
            break;
            
        default:

    }
}

export async function handleHomeClick(event) {

    
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    if (window.location.pathname === '/home' || window.location.pathname === '/home/' || window.location.pathname === '/') {

        return;
    }

    try {

        const isVoiceConnected = window.unifiedVoiceStateManager?.getState()?.isConnected || 
                                window.voiceManager?.isConnected || 
                                window.videoSDKManager?.isConnected;
        
        const currentPath = window.location.pathname;
        const isOnAllowedPage = currentPath === '/home' || currentPath === '/home/' || currentPath === '/' || 
                               currentPath.includes('/server/') || currentPath.includes('/explore');
        
        if (isVoiceConnected && isOnAllowedPage) {

            

            if (window.unifiedVoiceStateManager) {
                const voiceState = window.unifiedVoiceStateManager.getState();

            }
            

            history.pushState({ 
                pageType: 'home',
                preserveVoice: true 
            }, 'Home', '/home');
        }
        

        window.location.href = '/home';

    } catch (error) {
        console.error('[Home Navigation] ERROR in handleHomeClick:', error);
    }
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
        console.error('[Server Navigation] Error getting default channel:', error);
        return null;
    }
}

export async function handleServerClick(serverId, event) {

    
    if (!serverId) {
        console.error('[Server Navigation] No server ID provided');
        return;
    }

    try {

        const isVoiceConnected = window.unifiedVoiceStateManager?.getState()?.isConnected || 
                                window.voiceManager?.isConnected || 
                                window.videoSDKManager?.isConnected;
        
        const currentPath = window.location.pathname;
        const isOnAllowedPage = currentPath === '/home' || currentPath === '/home/' || currentPath === '/' || 
                               currentPath.includes('/server/') || currentPath.includes('/explore');
        
        if (isVoiceConnected && isOnAllowedPage) {

            

            if (window.unifiedVoiceStateManager) {
                const voiceState = window.unifiedVoiceStateManager.getState();

            }
        }
        
        let defaultChannelId = null;
        

        defaultChannelId = await getDefaultChannelForServer(serverId);

        
        let redirectUrl = `/server/${serverId}`;
        if (defaultChannelId) {
            redirectUrl += `?channel=${defaultChannelId}`;
        }
        

        

        if (isVoiceConnected && isOnAllowedPage) {

            history.pushState({ 
                serverId: serverId, 
                channelId: defaultChannelId,
                preserveVoice: true 
            }, `Server ${serverId}`, redirectUrl);
        }
        
        window.location.href = redirectUrl;
        
    } catch (error) {
        console.error('[Server Navigation] ERROR in handleServerClick:', error);
    }
}

export async function handleExploreClick(event) {

    
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    if (window.location.pathname === '/explore-servers' || window.location.pathname === '/explore') {

        return;
    }
    
    try {

        window.location.href = '/explore-servers';

    } catch (error) {
        console.error('[Explore Navigation] ERROR in handleExploreClick:', error);
    }
}

function getActiveChannelFromResponse(layoutContainer) {
    if (!layoutContainer) return null;
    
    const activeChannelInput = layoutContainer.querySelector('#active-channel-id');
    if (activeChannelInput && activeChannelInput.value) {
        return activeChannelInput.value;
    }
    
    const activeChannelElement = layoutContainer.querySelector('.channel-item.active-channel, .channel-item.active');
    if (activeChannelElement) {
        return activeChannelElement.getAttribute('data-channel-id');
    }
    
    const firstTextChannel = layoutContainer.querySelector('.channel-item[data-channel-type="text"]');
    if (firstTextChannel) {
        return firstTextChannel.getAttribute('data-channel-id');
    }
    
    return null;
}

function showServerChannelSection() {
    const serverChannelSelectors = [
        '.w-60.bg-discord-dark.flex.flex-col',
        'div[class*="w-60"][class*="bg-discord-dark"]',  
        'div[class*="w-60 bg-discord-dark"]'
    ];
    
    let found = false;
    serverChannelSelectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {

            element.style.display = 'flex';
            found = true;
        }
    });
    
    if (!found) {

    }
}

export function refreshServerGroups() {

    
    performCompleteRender();
}

window.updateActiveServer = updateActiveServer;
window.handleServerClick = handleServerClick;
window.handleHomeClick = handleHomeClick;

export const ServerSidebar = {
    updateActiveServer,
    handleServerClick,
    renderFolders: () => performCompleteRender(),
    refresh: () => performCompleteRender(),
    scrollToActiveServer,
    setupScroll: () => setupScrollBehavior()
};

function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    try {
        const date = new Date(timestamp);
        date.setTime(date.getTime() + (7 * 60 * 60 * 1000));
        
        const now = new Date();
        now.setTime(now.getTime() + (7 * 60 * 60 * 1000));
        
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
        } else {
            return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', timeZone: 'Asia/Jakarta' });
        }
    } catch (e) {
        console.error('Error formatting timestamp:', e);
        return '';
    }
}

function formatMessageContent(content) {
    if (!content) return '';
    
    let formattedContent = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');
    
    formattedContent = formattedContent
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/```([\s\S]*?)```/g, '<div class="bg-[#2b2d31] p-2 my-1 rounded text-sm font-mono"><code>$1</code></div>')
        .replace(/`(.*?)`/g, '<code class="bg-[#2b2d31] px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    
    return formattedContent;
}

function groupMessagesByUser(messages) {
    const groups = [];
    let currentGroup = null;
    
    messages.forEach(message => {
        if (!currentGroup || currentGroup.userId !== message.user_id) {
            currentGroup = {
                userId: message.user_id,
                username: message.username,
                avatarUrl: message.avatar_url,
                messages: []
            };
            groups.push(currentGroup);
        }
        currentGroup.messages.push(message);
    });
    
    return groups;
}


function hideAllTooltips() {
    const tooltipContainer = document.getElementById('tooltip-container');
    if (tooltipContainer) {
        tooltipContainer.querySelectorAll('.tooltip').forEach(tooltip => {
            tooltip.classList.add('hidden');
        });
    }
}

window.hideAllTooltips = hideAllTooltips;