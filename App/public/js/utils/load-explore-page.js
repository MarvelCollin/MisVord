

function loadCSS(cssFiles) {
    if (!cssFiles || !Array.isArray(cssFiles)) return Promise.resolve();
    
    const promises = cssFiles.map(cssFile => {
        return new Promise((resolve, reject) => {
            const href = `/public/css/${cssFile}.css`;
            
            if (document.querySelector(`link[href="${href}"]`)) {
                resolve();
                return;
            }
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = href;
            
            link.onload = () => resolve();
            link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
            
            document.head.appendChild(link);
        });
    });
    
    return Promise.all(promises);
}

function loadJS(jsFiles) {
    if (!jsFiles || !Array.isArray(jsFiles)) return Promise.resolve();
    
    const promises = jsFiles.map(jsFile => {
        return new Promise((resolve, reject) => {
            const src = `/public/js/${jsFile}.js`;
            
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.type = 'module';
            script.src = src;
            
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load JS: ${src}`));
            
            document.head.appendChild(script);
        });
    });
    
    return Promise.all(promises);
}

export function loadExplorePage() {
    const mainContent = document.querySelector('#app-container .flex.flex-1.overflow-hidden');

    if (mainContent) {
        if (typeof window.handleSkeletonLoading === 'function') {
            window.handleSkeletonLoading(true);
        } else {
            showPageLoading(mainContent);
        }

        const currentChannelId = getCurrentChannelId();
        if (currentChannelId && window.globalSocketManager) {
            window.globalSocketManager.leaveChannel(currentChannelId);
        }

        const targetPath = '/explore-servers';
        const shouldPreserveVoice = shouldPreserveVoiceConnection(targetPath);
        
        if (window.voiceManager && typeof window.voiceManager.leaveVoice === 'function') {
            if (shouldPreserveVoice) {
                console.log('[Explore Loader] Preserving voice connection - navigating between allowed pages');
            } else {
                console.log('[Explore Loader] Cleaning up voice manager');
                window.voiceManager.leaveVoice();
            }
        }

        Promise.all([
            loadCSS(['explore-servers', 'server-detail']),
            loadJS([
                'logger-init',
                'components/servers/server-detail',
                'pages/explore-servers',
                'components/servers/server-dropdown'
            ])
        ]).then(() => {
            $.ajax({
                url: '/explore-servers/layout',
                method: 'GET',
                dataType: 'html',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                success: function(response) {
                    if (typeof response === 'string') {
                        updateExploreLayout(response);
                        
                        if (typeof window.handleSkeletonLoading === 'function') {
                            window.handleSkeletonLoading(false);
                        }
                        
                        setTimeout(() => {
                            initializeExploreComponents();
                        }, 200);
                        
                        const event = new CustomEvent('ExplorePageChanged', { 
                            detail: { pageType: 'explore' } 
                        });
                        document.dispatchEvent(event);
                        
                    } else if (response && response.data && response.data.redirect) {
                        window.location.href = response.data.redirect;
                    } else {
                        window.location.href = '/explore-servers';
                    }
                },
                error: function(xhr, status, error) {
                    console.error('[Explore Loader] AJAX error:', error);
                    if (typeof window.handleSkeletonLoading === 'function') {
                        window.handleSkeletonLoading(false);
                    }
                    window.location.href = '/explore-servers';
                }
            });
        }).catch(error => {
            console.error('[Explore Loader] Resource loading error:', error);
            if (typeof window.handleSkeletonLoading === 'function') {
                window.handleSkeletonLoading(false);
            }
            window.location.href = '/explore-servers';
        });
    } else {
        window.location.href = '/explore-servers';
    }
}

function updateExploreLayout(html) {
    const currentLayout = document.querySelector('#app-container .flex.flex-1.overflow-hidden');

    if (currentLayout) {
        currentLayout.innerHTML = html;
        
        window.history.pushState(
            { page: 'explore' }, 
            'Explore Servers - misvord', 
            '/explore-servers'
        );
        
        if (typeof window.updateActiveServer === 'function') {
            window.updateActiveServer('explore');
        }
    }
}

function initializeExploreComponents() {
    setTimeout(() => {
        if (typeof window.initExplorePage === 'function') {
            window.initExplorePage();
        }
        
        if (typeof window.ServerDetailModal !== 'undefined' && !window.serverDetailModal) {
            window.serverDetailModal = new window.ServerDetailModal();
        }
        
        if (typeof window.showServerDetail !== 'function') {
            window.showServerDetail = (serverId, serverData) => {
                if (window.serverDetailModal && window.serverDetailModal.initialized) {
                    window.serverDetailModal.showServerDetail(serverId, serverData);
                }
            };
        }
        
        initializeFilterSort();
        setupExploreServerNavigation();
    }, 100);
}

function initializeFilterSort() {
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('server-search');
    const sortBtn = document.getElementById('sort-btn');
    const sortDropdown = document.getElementById('sort-dropdown');
    
    if (categoryFilter) {
        categoryFilter.style.opacity = '1';
        categoryFilter.style.transform = 'translateY(0)';
    }
    
    if (searchInput) {
        searchInput.style.opacity = '1';
        searchInput.style.transform = 'translateY(0)';
        searchInput.disabled = false;
    }
    
    if (sortBtn && sortDropdown) {
        sortBtn.style.opacity = '1';
        sortBtn.style.transform = 'translateY(0)';
        sortBtn.disabled = false;
        
        sortDropdown.classList.remove('active');
        sortBtn.classList.remove('active');
        
        const sortIcon = sortBtn.querySelector('i');
        if (sortIcon) {
            sortIcon.style.transform = 'rotate(0deg)';
        }
    }
    
    const serverCards = document.querySelectorAll('.explore-server-card');
    serverCards.forEach((card, index) => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0) scale(1)';
        card.style.display = 'block';
        card.style.animationDelay = `${index * 0.05}s`;
    });
    
    const noResultsMessage = document.getElementById('no-results-message');
    if (noResultsMessage) {
        noResultsMessage.remove();
    }
}

function showPageLoading(container) {
    container.innerHTML = `
        <div class="flex-1 bg-discord-background overflow-y-auto">
            <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                <div class="mb-8">
                    <div class="h-8 bg-gray-700 rounded w-64 mb-3 animate-pulse"></div>
                    <div class="h-4 bg-gray-700 rounded w-96 animate-pulse"></div>
                </div>
                
                <div class="mb-8 flex flex-col sm:flex-row gap-4">
                    <div class="flex-1 h-12 bg-gray-700 rounded animate-pulse"></div>
                    <div class="flex gap-3">
                        <div class="w-32 h-12 bg-gray-700 rounded animate-pulse"></div>
                        <div class="w-24 h-12 bg-gray-700 rounded animate-pulse"></div>
                    </div>
                </div>

                <div class="mb-10">
                    <div class="h-6 bg-gray-700 rounded w-48 mb-6 animate-pulse"></div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        ${Array(3).fill(0).map(() => `
                            <div class="bg-discord-dark rounded-xl overflow-hidden">
                                <div class="h-36 bg-gray-700 animate-pulse"></div>
                                <div class="p-6">
                                    <div class="h-4 bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
                                    <div class="h-3 bg-gray-700 rounded w-1/2 mb-4 animate-pulse"></div>
                                    <div class="h-10 bg-gray-700 rounded animate-pulse"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <div class="h-6 bg-gray-700 rounded w-48 mb-6 animate-pulse"></div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        ${Array(8).fill(0).map(() => `
                            <div class="bg-discord-dark rounded-xl p-5">
                                <div class="flex items-start mb-4">
                                    <div class="w-14 h-14 bg-gray-700 rounded-xl mr-4 animate-pulse"></div>
                                    <div class="flex-1">
                                        <div class="h-4 bg-gray-700 rounded w-3/4 mb-1 animate-pulse"></div>
                                        <div class="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                                    </div>
                                </div>
                                <div class="h-3 bg-gray-700 rounded mb-2 animate-pulse"></div>
                                <div class="h-3 bg-gray-700 rounded w-4/5 mb-4 animate-pulse"></div>
                                <div class="h-10 bg-gray-700 rounded animate-pulse"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getCurrentChannelId() {
    const activeChannelInput = document.getElementById('active-channel-id');
    return activeChannelInput ? activeChannelInput.value : null;
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
        console.error('[Explore Navigation] Error getting default channel:', error);
        return null;
    }
}

function setupExploreServerNavigation() {
    setTimeout(() => {
        const visitServerButtons = document.querySelectorAll('button[data-action="visit-server"]');
        
        visitServerButtons.forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const serverId = this.getAttribute('data-server-id');
                
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
                    console.error('[Explore Navigation] Error navigating to server:', error);
                    if (window.showToast) {
                        window.showToast('Unable to access server. You may need to join first.', 'error');
                    }
                }
            });
        });
        
        const serverCards = document.querySelectorAll('.server-card, .explore-server-card');
        
        serverCards.forEach(card => {
            const serverId = card.getAttribute('data-server-id');
            if (serverId) {
                const newCard = card.cloneNode(true);
                card.parentNode.replaceChild(newCard, card);
                
                newCard.addEventListener('click', async function(e) {
                    if (!e.target.closest('button')) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const joinButton = this.querySelector('.join-server-btn');
                        const isJoined = joinButton && (joinButton.textContent.includes('Joined') || joinButton.classList.contains('bg-discord-green'));
                        
                        if (isJoined) {
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
                                console.error('[Explore Navigation] Error navigating to server:', error);
                                if (window.showToast) {
                                    window.showToast('Unable to access server', 'error');
                                }
                            }
                        } else {
                            const serverData = extractServerDataFromCard(this);
                            if (typeof window.showServerDetail === 'function') {
                                window.showServerDetail(serverId, serverData);
                            }
                        }
                    }
                });
            }
        });
        
    }, 300);
}

function extractServerDataFromCard(card) {
    const serverId = card.getAttribute('data-server-id');
    const serverName = card.querySelector('.server-name')?.textContent;
    const serverDescription = card.querySelector('.server-description')?.textContent;

    let memberCount = 0;
    const memberCountElem = card.querySelector('.server-stats span');
    if (memberCountElem) {
        const memberMatch = memberCountElem.textContent.match(/[\d,]+/);
        memberCount = memberMatch ? parseInt(memberMatch[0].replace(/,/g, '')) : 0;
    }

    const joinButton = card.querySelector('.join-server-btn');
    const isJoined = joinButton ? (joinButton.textContent.includes('Joined') || joinButton.classList.contains('bg-discord-green')) : false;

    let bannerUrl = null;
    const bannerImg = card.querySelector('.server-banner img') || card.querySelector('.h-32 img') || card.querySelector('.h-36 img');
    if (bannerImg) {
        bannerUrl = bannerImg.src;
    }

    let iconUrl = null;
    const iconImg = card.querySelector('.explore-server-icon img') || card.querySelector('.rounded-xl img') || card.querySelector('.rounded-2xl img') || card.querySelector('.explore-server-icon-small img');
    if (iconImg) {
        iconUrl = iconImg.src;
    }

    const category = card.getAttribute('data-category');

    return {
        id: serverId,
        name: serverName || 'Unknown Server',
        description: serverDescription || 'No description available.',
        member_count: memberCount,
        is_member: isJoined,
        banner_url: bannerUrl,
        image_url: iconUrl,
        category: category
    };
}

window.loadExplorePage = loadExplorePage; 