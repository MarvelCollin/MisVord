import serverAPI from '../api/server-api.js';

console.log('Explore servers script loading...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('Explore servers DOM loaded');
    if (typeof window !== 'undefined' && window.logger) {
        window.logger.info('explore', 'Explore servers page initialized');
    }

    initServerCards();
    initCategoryFilter();
    initSearchFilter();
    initJoinServerHandlers();
    initSidebarServerIcons();
    highlightExploreButton();
    initServerDetailTriggers();
    
    console.log('showServerDetail function available:', typeof window.showServerDetail);
});

function highlightExploreButton() {
    // Makes sure the explore button is highlighted
    const exploreButton = document.querySelector('a[href="/explore-servers"]');
    if (exploreButton) {
        const parentDiv = exploreButton.closest('div');
        if (parentDiv) {
            parentDiv.classList.add('active');
        }
    }
}

function initSidebarServerIcons() {
    const serverIcons = document.querySelectorAll('.sidebar-server-icon');
    
    serverIcons.forEach(icon => {
        const parent = icon.parentElement;
        // Add any needed styling to sidebar server icons
        icon.style.display = 'block';
        icon.style.margin = '0 auto 8px auto';
        icon.style.position = 'relative';
        
        if (!icon.getAttribute('data-initialized')) {
            icon.setAttribute('data-initialized', 'true');
        }
    });
}

function initServerCards() {
    const serverCards = document.querySelectorAll('.server-card');
    
    serverCards.forEach(card => {
        card.addEventListener('mouseenter', handleServerCardHover);
        card.addEventListener('mouseleave', handleServerCardLeave);
    });
}

function handleServerCardHover(e) {
    const card = e.currentTarget;
    card.classList.add('transform', 'scale-105', 'shadow-xl');
}

function handleServerCardLeave(e) {
    const card = e.currentTarget;
    card.classList.remove('transform', 'scale-105', 'shadow-xl');
}

function initCategoryFilter() {
    const categoryButtons = document.querySelectorAll('[data-category]');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterServersByCategory(category);
            updateActiveCategory(this);
        });
    });
    
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const category = this.value || 'all';
            filterServersByCategory(category);
        });
    }
}

function filterServersByCategory(category) {
    const serverCards = document.querySelectorAll('.server-card');
    
    serverCards.forEach(card => {
        const serverCategory = card.getAttribute('data-category');
        
        if (category === 'all' || serverCategory === category) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

function updateActiveCategory(activeButton) {
    const categoryButtons = document.querySelectorAll('[data-category]');
    
    categoryButtons.forEach(button => {
        if (button === activeButton) {
            button.classList.add('bg-discord-primary', 'text-white');
            button.classList.remove('bg-discord-dark', 'text-gray-300');
        } else {
            button.classList.remove('bg-discord-primary', 'text-white');
            button.classList.add('bg-discord-dark', 'text-gray-300');
        }
    });
}

function initSearchFilter() {
    const searchInput = document.querySelector('#server-search');
    
    if (searchInput) {
        let debounceTimeout;
        
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                if (query.length >= 2) {
                    performServerSearch(query);
                } else {
                    resetServerSearch();
                }
            }, 300);
        });
    }
}

function performServerSearch(query) {
    const serverGrid = document.querySelector('.server-grid');
    if (!serverGrid) return;
    
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'search-loading';
    loadingIndicator.className = 'text-gray-400 text-center py-4';
    loadingIndicator.textContent = 'Searching...';
    
    serverGrid.innerHTML = '';
    serverGrid.appendChild(loadingIndicator);
    
    serverAPI.searchServers(query)
        .then(data => {
            renderSearchResults(data.servers, data.userServerIds);
        })
        .catch(error => {
            console.error('Error searching servers:', error);
            serverGrid.innerHTML = `<div class="text-red-400 text-center py-4">Error searching servers. Please try again.</div>`;
        });
}

function resetServerSearch() {
    const serverGrid = document.querySelector('.server-grid');
    if (!serverGrid) return;
    
    const allServerCards = document.querySelectorAll('.server-card');
    allServerCards.forEach(card => {
        card.classList.remove('hidden');
    });
}

function renderSearchResults(servers, userServerIds) {
    const serverGrid = document.querySelector('.server-grid');
    if (!serverGrid) return;
    
    serverGrid.innerHTML = '';
    
    if (!servers || servers.length === 0) {
        serverGrid.innerHTML = `<div class="text-gray-400 text-center py-4 col-span-full">No servers found matching your search.</div>`;
        return;
    }
    
    servers.forEach(server => {
        const isJoined = userServerIds.includes(parseInt(server.id));
        server.is_member = isJoined;
        const serverCard = createServerCard(server, isJoined);
        serverGrid.appendChild(serverCard);
    });
    
    initServerCards();
    initJoinServerHandlers();
    initServerDetailTriggers();
}

function createServerCard(server, isJoined) {
    const card = document.createElement('div');
    card.className = 'server-card bg-discord-dark rounded-lg overflow-hidden shadow-lg transition-all duration-200 cursor-pointer';
    card.setAttribute('data-category', server.category || 'all');
    card.setAttribute('data-server-id', server.id);
    
    const memberCount = server.member_count || 0;
    
    card.innerHTML = `
        <div class="server-banner">
            ${server.banner_url ? `<img src="${server.banner_url}" class="w-full h-full object-cover" alt="${server.name} banner">` : ''}
            <div class="server-icon">
                ${server.image_url ? `<img src="${server.image_url}" class="w-full h-full object-cover" alt="${server.name} icon">` : 
                `<div class="w-full h-full flex items-center justify-center bg-discord-primary text-white font-bold text-xl">
                    ${server.name.charAt(0).toUpperCase()}
                </div>`}
            </div>
        </div>
        <div class="p-4 pt-8">
            <h3 class="server-name text-white font-semibold text-lg">${server.name}</h3>
            <p class="server-description text-gray-400 text-sm line-clamp-2 mt-1 mb-3">${server.description || 'No description available.'}</p>
            <div class="flex items-center justify-between mt-2">
                <div class="server-stats">
                    <span><span class="online-dot"></span> ${memberCount} ${memberCount === 1 ? 'member' : 'members'}</span>
                </div>
                <button class="join-server-btn px-4 py-1 rounded text-white font-medium text-sm ${isJoined ? 'bg-discord-green' : 'bg-discord-primary hover:bg-discord-primary/90'}" 
                        data-server-id="${server.id}" ${isJoined ? 'disabled' : ''}>
                    ${isJoined ? 'Joined' : 'Join'}
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function filterServersBySearch(query) {
    // This function is now only used for local filtering
    if (query.length < 2) {
        resetServerSearch();
        return;
    }
    
    const serverCards = document.querySelectorAll('.server-card');
    
    serverCards.forEach(card => {
        const serverName = card.querySelector('.server-name')?.textContent.toLowerCase() || '';
        const serverDescription = card.querySelector('.server-description')?.textContent.toLowerCase() || '';
        
        if (serverName.includes(query) || serverDescription.includes(query)) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

function initJoinServerHandlers() {
    const joinButtons = document.querySelectorAll('.join-server-btn');
    
    joinButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const serverId = this.getAttribute('data-server-id');
            joinServer(serverId, this);
        });
    });
}

function joinServer(serverId, button) {
    if (!serverId) return;
    
    const originalText = button.textContent;
    button.textContent = 'Joining...';
    button.disabled = true;
    
    serverAPI.joinServer({ server_id: serverId })
        .then(data => {
            if (data.success) {
                button.textContent = 'Joined!';
                button.classList.remove('bg-discord-primary', 'hover:bg-discord-primary/90');
                button.classList.add('bg-discord-green');
                
                if (window.showToast) {
                    window.showToast('Successfully joined server!', 'success');
                }
                
                setTimeout(() => {
                    window.location.href = `/server/${serverId}`;
                }, 1500);
            } else {
                button.textContent = originalText;
                button.disabled = false;
                
                if (window.showToast) {
                    window.showToast(data.message || 'Failed to join server', 'error');
                }
            }
        })
        .catch(error => {
            console.error('Error joining server:', error);
            button.textContent = originalText;
            button.disabled = false;
            
            if (window.showToast) {
                window.showToast('Error joining server', 'error');
            }
        });
}

function initServerDetailTriggers() {
    console.log('Initializing server detail triggers');
    const serverCards = document.querySelectorAll('.server-card');
    const featuredCards = document.querySelectorAll('#featured-servers .server-card');
    
    console.log('Server cards found:', serverCards.length);
    console.log('Featured cards found:', featuredCards.length);
    
    const allCards = [...serverCards, ...featuredCards];
    
    allCards.forEach(card => {
        console.log('Adding click handler to card:', card.getAttribute('data-server-id'));
        card.addEventListener('click', function(e) {
            console.log('Card clicked:', this.getAttribute('data-server-id'));
            
            if (e.target.closest('.join-server-btn')) {
                console.log('Click was on join button, ignoring');
                return;
            }
            
            const serverId = this.getAttribute('data-server-id');
            
            if (!serverId) {
                console.error('No server ID found on clicked card');
                return;
            }
            
            console.log('Extracting server data from card');
            const serverData = extractServerDataFromCard(this);
            console.log('Server data extracted:', serverData);
            
            if (window.showServerDetail) {
                console.log('Calling window.showServerDetail with ID:', serverId);
                window.showServerDetail(serverId, serverData);
            } else {
                console.error('Server detail modal function not available');
            }
            
            // Prevent default and stop propagation to avoid any navigation
            e.preventDefault();
            e.stopPropagation();
        });
    });
}

function extractServerDataFromCard(card) {
    const serverId = card.getAttribute('data-server-id');
    const serverName = card.querySelector('.server-name')?.textContent;
    const serverDescription = card.querySelector('.server-description')?.textContent;
    const memberCountText = card.querySelector('.server-stats span')?.textContent;
    const memberCount = memberCountText ? parseInt(memberCountText.match(/\d+/)[0]) : 0;
    
    const joinButton = card.querySelector('.join-server-btn');
    const isJoined = joinButton ? joinButton.textContent.includes('Joined') : false;
    
    const bannerImg = card.querySelector('.server-banner img');
    const bannerUrl = bannerImg ? bannerImg.src : null;
    
    const iconImg = card.querySelector('.server-icon img');
    const iconUrl = iconImg ? iconImg.src : null;
    
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
