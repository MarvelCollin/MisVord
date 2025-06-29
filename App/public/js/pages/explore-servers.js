document.addEventListener('DOMContentLoaded', function () {
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
    initScrollAnimations();

    console.log('showServerDetail function available:', typeof window.showServerDetail);
});

function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.slide-up, .fade-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => {
        if (el.classList.contains('slide-up')) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        } else if (el.classList.contains('fade-in')) {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.8s ease-out';
        }
        observer.observe(el);
    });
}

function showLoadingSkeleton() {
    const serverGrid = document.querySelector('.server-grid');
    const loadingSkeleton = document.getElementById('loading-skeleton');
    
    if (serverGrid && loadingSkeleton) {
        serverGrid.style.display = 'none';
        loadingSkeleton.classList.remove('hidden');
        loadingSkeleton.style.display = 'grid';
    }
}

function hideLoadingSkeleton() {
    const serverGrid = document.querySelector('.server-grid');
    const loadingSkeleton = document.getElementById('loading-skeleton');
    
    if (serverGrid && loadingSkeleton) {
        loadingSkeleton.style.display = 'none';
        loadingSkeleton.classList.add('hidden');
        serverGrid.style.display = 'grid';
        
        const cards = serverGrid.querySelectorAll('.server-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
}

function highlightExploreButton() {
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

    serverCards.forEach((card, index) => {
        card.addEventListener('mouseenter', handleServerCardHover);
        card.addEventListener('mouseleave', handleServerCardLeave);
        
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

function handleServerCardHover(e) {
    const card = e.currentTarget;
    const icon = card.querySelector('.server-icon, .w-14, .w-12');
    
    if (icon) {
        icon.style.transform = 'scale(1.1) rotate(3deg)';
        icon.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    }
}

function handleServerCardLeave(e) {
    const card = e.currentTarget;
    const icon = card.querySelector('.server-icon, .w-14, .w-12');
    
    if (icon) {
        icon.style.transform = 'scale(1) rotate(0deg)';
    }
}

function initCategoryFilter() {
    const categoryButtons = document.querySelectorAll('[data-category]');

    categoryButtons.forEach(button => {
        button.addEventListener('click', function () {
            const category = this.getAttribute('data-category');
            filterServersByCategory(category);
            updateActiveCategory(this);
        });
    });

    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function () {
            const category = this.value || 'all';
            filterServersByCategory(category);
            
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    }
}

function filterServersByCategory(category) {
    const serverCards = document.querySelectorAll('.server-card:not(#featured-servers .server-card)');

    serverCards.forEach((card, index) => {
        const serverCategory = card.getAttribute('data-category');

        if (category === 'all' || serverCategory === category) {
            card.style.display = 'block';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) scale(1)';
            }, index * 50);
        } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(-10px) scale(0.95)';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
}

function updateActiveCategory(activeButton) {
    const categoryButtons = document.querySelectorAll('[data-category]');

    categoryButtons.forEach(button => {
        if (button === activeButton) {
            button.classList.add('bg-discord-green', 'text-white');
            button.classList.remove('bg-discord-dark', 'text-gray-300');
            button.style.transform = 'scale(1.05)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 200);
        } else {
            button.classList.remove('bg-discord-green', 'text-white');
            button.classList.add('bg-discord-dark', 'text-gray-300');
        }
    });
}

function initSearchFilter() {
    const searchInput = document.querySelector('#server-search');

    if (searchInput) {
        let debounceTimeout;

        searchInput.addEventListener('input', function () {
            const query = this.value.toLowerCase();

            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                if (query.length >= 2) {
                    showLoadingSkeleton();
                    performServerSearch(query);
                } else {
                    resetServerSearch();
                }
            }, 300);
        });

        searchInput.addEventListener('focus', function() {
            this.style.transform = 'translateY(-2px)';
        });

        searchInput.addEventListener('blur', function() {
            this.style.transform = 'translateY(0)';
        });
    }
}

function performServerSearch(query) {
    window.serverAPI.searchServers(query)
        .then(data => {
            setTimeout(() => {
                renderSearchResults(data.servers, data.userServerIds);
                hideLoadingSkeleton();
            }, 800);
        })
        .catch(error => {
            console.error('Error searching servers:', error);
            hideLoadingSkeleton();
            const serverGrid = document.querySelector('.server-grid');
            if (serverGrid) {
                serverGrid.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <div class="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-exclamation-triangle text-3xl text-red-400"></i>
                        </div>
                        <h3 class="text-xl font-bold mb-2 text-white">Search Error</h3>
                        <p class="text-red-400">Unable to search servers. Please try again.</p>
                    </div>
                `;
            }
        });
}

function resetServerSearch() {
    const serverGrid = document.querySelector('.server-grid');
    if (!serverGrid) return;

    const allServerCards = document.querySelectorAll('.server-card');
    allServerCards.forEach((card, index) => {
        card.style.display = 'block';
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
        }, index * 50);
    });
}

function renderSearchResults(servers, userServerIds) {
    const serverGrid = document.querySelector('.server-grid');
    if (!serverGrid) return;

    serverGrid.innerHTML = '';

    if (!servers || servers.length === 0) {
        serverGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="w-20 h-20 bg-discord-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-search text-3xl text-discord-primary"></i>
                </div>
                <h3 class="text-xl font-bold mb-2 text-white">No Results Found</h3>
                <p class="text-discord-lighter">No servers match your search criteria.</p>
            </div>
        `;
        return;
    }

    servers.forEach((server, index) => {
        const isJoined = userServerIds.includes(parseInt(server.id));
        server.is_member = isJoined;
        const serverCard = createServerCard(server, isJoined);
        
        serverCard.style.opacity = '0';
        serverCard.style.transform = 'translateY(30px)';
        serverGrid.appendChild(serverCard);
        
        setTimeout(() => {
            serverCard.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            serverCard.style.opacity = '1';
            serverCard.style.transform = 'translateY(0)';
        }, index * 100);
    });

    initServerCards();
    initJoinServerHandlers();
    initServerDetailTriggers();
}

function createServerCard(server, isJoined) {
    const card = document.createElement('div');
    card.className = 'server-card bg-discord-dark rounded-xl overflow-hidden transition-all cursor-pointer group';
    card.setAttribute('data-category', server.category || 'all');
    card.setAttribute('data-server-id', server.id);

    const memberCount = server.member_count || 0;
    const onlineCount = Math.floor(Math.random() * Math.min(memberCount, 50)) + 1;

    card.innerHTML = `
        <div class="p-5">
            <div class="flex items-start mb-4">
                <div class="w-14 h-14 rounded-xl bg-discord-primary overflow-hidden mr-4 flex-shrink-0 shadow-lg">
                    ${server.image_url ? 
                        `<img src="${server.image_url}" class="w-full h-full object-cover" alt="${server.name} icon">` :
                        `<div class="w-full h-full flex items-center justify-center">
                            <span class="text-white font-bold text-lg">${server.name.charAt(0).toUpperCase()}</span>
                        </div>`
                    }
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="server-name font-bold text-lg mb-1 text-white transition-colors truncate">${server.name}</h3>
                    <div class="server-stats flex items-center text-xs text-discord-lighter">
                        <span class="font-medium">${memberCount.toLocaleString()} members</span>
                        <span class="mx-2">•</span>
                        <div class="flex items-center">
                            <div class="online-dot"></div>
                            <span class="font-medium">${onlineCount} online</span>
                        </div>
                    </div>
                </div>
            </div>
            <p class="server-description text-discord-lighter text-sm mb-4 line-clamp-2 leading-relaxed">${server.description || 'No description available.'}</p>
            <button onclick="event.preventDefault(); event.stopPropagation();" 
                    class="join-server-btn w-full ${isJoined ? 'bg-discord-green/20 text-discord-green border border-discord-green/30' : 'bg-discord-primary text-white'} text-center py-2.5 text-sm rounded-lg transition-all font-semibold" 
                    data-server-id="${server.id}" ${isJoined ? 'disabled' : ''}>
                <i class="fas fa-${isJoined ? 'check' : 'plus'} mr-2"></i>${isJoined ? 'Joined' : 'Join'}
            </button>
        </div>
    `;

    return card;
}

function initJoinServerHandlers() {
    const joinButtons = document.querySelectorAll('.join-server-btn:not([data-listener])');

    joinButtons.forEach(button => {
        button.setAttribute('data-listener', 'true');
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.disabled) return;
            
            const serverId = this.getAttribute('data-server-id');
            joinServer(serverId, this);
        });
    });
}

function joinServer(serverId, button) {
    if (!serverId || button.disabled) return;

    const originalText = button.innerHTML;
    const originalClasses = button.className;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Joining...';
    button.disabled = true;
    button.style.opacity = '0.7';

    window.serverAPI.joinServer({ server_id: serverId })
        .then(data => {
            if (data.success) {
                button.innerHTML = '<i class="fas fa-check mr-2"></i>Joined!';
                button.className = 'join-server-btn w-full bg-discord-green text-white text-center py-2.5 text-sm rounded-lg transition-all font-semibold';
                button.style.opacity = '1';

                button.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    button.style.transform = 'scale(1)';
                }, 200);

                if (window.showToast) {
                    window.showToast('Successfully joined server!', 'success');
                }

                setTimeout(() => {
                    window.location.href = `/server/${serverId}`;
                }, 1500);
            } else {
                button.innerHTML = originalText;
                button.className = originalClasses;
                button.disabled = false;
                button.style.opacity = '1';

                if (window.showToast) {
                    window.showToast(data.message || 'Failed to join server', 'error');
                }
            }
        })
        .catch(error => {
            console.error('Error joining server:', error);
            button.innerHTML = originalText;
            button.className = originalClasses;
            button.disabled = false;
            button.style.opacity = '1';

            if (window.showToast) {
                window.showToast('Error joining server', 'error');
            }
        });
}

function initServerDetailTriggers() {
    const serverCards = document.querySelectorAll('.server-card:not([data-detail-listener])');

    serverCards.forEach(card => {
        card.setAttribute('data-detail-listener', 'true');

        card.addEventListener('click', function (e) {
            if (e.target.closest('.join-server-btn')) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);

            const serverId = this.getAttribute('data-server-id');
            if (!serverId) return;

            const serverData = extractServerDataFromCard(this);

            if (window.showServerDetail) {
                window.showServerDetail(serverId, serverData);
            }
        });
    });
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
    const iconImg = card.querySelector('.server-icon img') || card.querySelector('.rounded-xl img') || card.querySelector('.rounded-2xl img') || card.querySelector('.w-14 img');
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