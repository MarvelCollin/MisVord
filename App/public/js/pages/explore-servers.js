document.addEventListener('DOMContentLoaded', function () {
    if (typeof window !== 'undefined' && window.logger) {
        window.logger.info('explore', 'Explore servers page initialized');
    }
    initExplorePage();
});

function initExplorePage() {
    if (window.misvordExplore && window.misvordExplore.initialData) {
        const initialData = window.misvordExplore.initialData;
        currentPage = initialData.current_page || 1;
        totalPages = initialData.total_pages || 1;
        hasMore = initialData.has_more || false;
    }

    const container = document.getElementById('all-servers');
    if (container) {
        initOriginalCategoryCounts();
        showLoadingSkeletons();
        
        setTimeout(() => {
            hideLoadingSkeletons();
            
            const serverWrappers = container.querySelectorAll('.misvord-initial-server-card');
            serverWrappers.forEach((wrapper, index) => {
                setTimeout(() => {
                    wrapper.style.display = 'block';
                    const card = wrapper.querySelector('.explore-server-card');
                    if (card) {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0) scale(1)';
                    }
                }, index * 50);
            });
        }, 800);
    }
    
    initServerCards();
    initCategoryFilter();
    initSearchFilter();
    initSortFunctionality();
    initJoinServerHandlers();
    initSidebarServerIcons();
    highlightExploreButton();
    initServerDetailTriggers();
    initScrollAnimations();
    initInfiniteScroll();
    initMobileExploreSidebar();
}

window.initExplorePage = initExplorePage;

let currentPage = 1;
let totalPages = 1;
let hasMore = true;
let isLoading = false;
let currentSort = 'alphabetical';
let currentCategory = '';
let currentSearch = '';
let originalCategoryCounts = {};

function asset(path) {
    const basePath = window.location.origin;
    return `${basePath}/public/assets/${path}`;
}

function initOriginalCategoryCounts() {
    const categoryCounts = {};
    let totalCount = 0;
    
    document.querySelectorAll('.category-item').forEach(item => {
        const category = item.getAttribute('data-category') || '';
        const countEl = item.querySelector('.misvord-category-count');
        if (countEl) {
            const count = parseInt(countEl.getAttribute('data-count') || '0');
            categoryCounts[category] = count;
            if (category === '') {
                totalCount = count;
            }
        }
    });
    
    originalCategoryCounts = categoryCounts;
}

function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.slide-up, .fade-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = `${Math.random() * 0.5}s`;
                entry.target.classList.add('animate');
            }
        });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => observer.observe(el));
}

function initServerCards() {
    const serverCards = document.querySelectorAll('.misvord-initial-server-card .explore-server-card');
    
    serverCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        
        const joinButton = card.querySelector('.join-server-btn');
        const serverId = card.getAttribute('data-server-id');
        
        if (joinButton && serverId) {
            const newButton = joinButton.cloneNode(true);
            joinButton.parentNode.replaceChild(newButton, joinButton);
            
            newButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                handleJoinServer(serverId, newButton);
            });
        }
    });
}

function initCategoryFilter() {
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            categoryItems.forEach(cat => cat.classList.remove('active', 'bg-discord-light', 'text-white'));
            categoryItems.forEach(cat => cat.classList.add('text-discord-lighter'));
            
            this.classList.add('active', 'bg-discord-light', 'text-white');
            this.classList.remove('text-discord-lighter');
            
            const category = this.getAttribute('data-category');
            currentCategory = category;
            currentPage = 1;
            hasMore = true;
            applyFilters();
        });
    });
}

function initSearchFilter() {
    const searchInput = document.getElementById('server-search');
    
    if (searchInput) {
        let debounceTimeout;

        searchInput.addEventListener('input', function () {
            currentSearch = this.value.toLowerCase().trim();

            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                applyFilters();
            }, 300);
        });
        
        searchInput.addEventListener('focus', function() {
            this.style.transform = 'translateY(-2px)';
        });

        searchInput.addEventListener('blur', function() {
            this.style.transform = 'translateY(0)';
        });
        
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                this.blur();
                currentSearch = '';
                applyFilters();
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    });
}

function initSortFunctionality() {
    const sortBtn = document.getElementById('sort-btn');
    const sortDropdown = document.getElementById('sort-dropdown');
    const sortOptions = document.querySelectorAll('.sort-option');

    if (sortBtn && sortDropdown) {
        sortBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isActive = sortDropdown.classList.contains('active');
            
            if (isActive) {
                closeSortDropdown();
            } else {
                openSortDropdown();
            }
        });

        document.addEventListener('click', function(e) {
            if (!sortBtn.contains(e.target) && !sortDropdown.contains(e.target)) {
                closeSortDropdown();
            }
        });

        sortOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const sortType = this.getAttribute('data-sort');
                selectSortOption(sortType, this);
                closeSortDropdown();
            });
        });
    }
}

function openSortDropdown() {
    const sortBtn = document.getElementById('sort-btn');
    const sortDropdown = document.getElementById('sort-dropdown');
    
    if (sortBtn && sortDropdown) {
        sortBtn.classList.add('active');
        sortDropdown.classList.add('active');
        
        const icon = sortBtn.querySelector('i');
        if (icon) {
            icon.style.transform = 'rotate(180deg)';
        }
    }
}

function closeSortDropdown() {
    const sortBtn = document.getElementById('sort-btn');
    const sortDropdown = document.getElementById('sort-dropdown');
    
    if (sortBtn && sortDropdown) {
        sortBtn.classList.remove('active');
        sortDropdown.classList.remove('active');
        
        const icon = sortBtn.querySelector('i');
        if (icon) {
            icon.style.transform = 'rotate(0deg)';
        }
    }
}

function selectSortOption(sortType, optionElement) {
    const sortOptions = document.querySelectorAll('.sort-option');
    
    sortOptions.forEach(option => {
        option.classList.remove('active');
    });
    
    optionElement.classList.add('active');
    currentSort = sortType;
    
    const sortBtn = document.getElementById('sort-btn');
    const sortText = sortBtn.querySelector('span');
    const sortIcon = sortBtn.querySelector('i');
    
    if (sortText && sortIcon) {
        sortText.textContent = optionElement.querySelector('span').textContent;
        
        const newIcon = optionElement.querySelector('i').className;
        sortIcon.className = newIcon;
    }
    
    applyFilters();
}

function applyFilters() {
    currentPage = 1;
    hasMore = true;
    
    const isDefaultState = currentSort === 'alphabetical' && currentCategory === '' && currentSearch === '';
    
    if (isDefaultState) {
        showInitialCards();
        hideAllApiCards();
        hideNoResults();
    } else {
        filterInitialCards();
    }
}

function filterInitialCards() {
    const container = document.getElementById('all-servers');
    if (!container) return;
    
    const initialCards = container.querySelectorAll('.misvord-initial-server-card');
    let hasVisibleCards = false;
    
    initialCards.forEach(card => {
        const serverCard = card.querySelector('.explore-server-card');
        if (!serverCard) {
            card.style.display = 'none';
            return;
        }
        
        const category = serverCard.getAttribute('data-category') || '';
        const serverName = serverCard.querySelector('.server-name')?.textContent?.toLowerCase() || '';
        const serverDescription = serverCard.querySelector('.server-description')?.textContent?.toLowerCase() || '';
        
        let matchesCategory = currentCategory === '' || category === currentCategory;
        let matchesSearch = currentSearch === '' || 
                           serverName.includes(currentSearch) || 
                           serverDescription.includes(currentSearch);
        
        if (matchesCategory && matchesSearch) {
            card.style.display = 'block';
            hasVisibleCards = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    fetchAndRenderServers(false);
}

function showInitialCards() {
    const container = document.getElementById('all-servers');
    if (!container) return;
    
    const initialCards = container.querySelectorAll('.misvord-initial-server-card');
    initialCards.forEach((card, index) => {
        card.style.display = 'block';
    });
}

function hideAllApiCards() {
    const container = document.getElementById('all-servers');
    if (!container) return;
    
    const apiCards = container.querySelectorAll('.misvord-api-server-card');
    apiCards.forEach(card => card.remove());
}

function showLoadingSkeletons() {
    const container = document.getElementById('all-servers');
    if (!container) return;
    
    hideNoResults();
    hideLoadingSkeletons();
    
    const serverCards = document.querySelectorAll('.misvord-initial-server-card .explore-server-card');
    const skeletonCount = Math.min(Math.max(serverCards.length, 2), 6);
    
    for (let i = 0; i < skeletonCount; i++) {
        const skeletonCard = createSkeletonCard();
        container.appendChild(skeletonCard);
    }
}

function hideLoadingSkeletons() {
    const skeletonCards = document.querySelectorAll('.misvord-skeleton-loading-card');
    skeletonCards.forEach(card => {
        card.classList.add('hiding');
        setTimeout(() => {
            if (card && card.parentNode) {
                card.parentNode.removeChild(card);
            }
        }, 100);
    });
}

function createSkeletonCard() {
    const card = document.createElement('div');
    card.className = 'misvord-skeleton-loading-card explore-server-card server-card bg-discord-dark rounded-xl overflow-hidden transition-all cursor-pointer group';
    
    card.innerHTML = `
        <div class="server-banner h-32 bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 relative overflow-hidden">
            <div class="misvord-skeleton-shimmer w-full h-full"></div>
        </div>
        <div class="relative px-5 pt-5 pb-5">
            <div class="misvord-skeleton-icon-placeholder absolute -top-8 left-5 w-16 h-16 rounded-xl">
                <div class="misvord-skeleton-shimmer w-full h-full rounded-xl"></div>
            </div>
            <div class="mt-8 pl-2">
                <div class="flex items-center gap-2 mb-2">
                    <div class="misvord-skeleton-shimmer misvord-skeleton-title flex-1"></div>
                    <div class="misvord-skeleton-shimmer misvord-skeleton-category"></div>
                </div>
                <div class="misvord-skeleton-shimmer misvord-skeleton-description mb-3"></div>
                <div class="misvord-skeleton-shimmer misvord-skeleton-created mb-3"></div>
                <div class="misvord-skeleton-shimmer misvord-skeleton-stats mb-4"></div>
                <div class="mt-4 space-y-2">
                    <div class="misvord-skeleton-shimmer misvord-skeleton-button"></div>
                    <div class="misvord-skeleton-shimmer misvord-skeleton-invite-button"></div>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

function showNoResults() {
    const container = document.getElementById('all-servers');
    if (container && !document.getElementById('no-results-message')) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.id = 'no-results-message';
        noResultsDiv.className = 'col-span-full text-center py-12';
        noResultsDiv.innerHTML = `
            <div class="text-gray-400 mb-4">
                <i class="fas fa-search text-4xl mb-4"></i>
                <h3 class="text-xl font-semibold mb-2">No servers found</h3>
                <p>Try adjusting your search terms or filters</p>
            </div>
        `;
        container.appendChild(noResultsDiv);
    }
}

function hideNoResults() {
    const noResultsMessage = document.getElementById('no-results-message');
    if (noResultsMessage) {
        noResultsMessage.remove();
    }
}

function initJoinServerHandlers() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('join-server-btn') || e.target.closest('.join-server-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            const button = e.target.closest('.join-server-btn');
            const card = button.closest('.explore-server-card');
            const serverId = card ? card.getAttribute('data-server-id') : null;
            
            if (serverId && button) {
                handleJoinServer(serverId, button);
            }
        }
        
        if (e.target.closest('button') && e.target.closest('button').textContent.includes('Copy Invite')) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
}

function handleJoinServer(serverId, button) {
    if (!serverId || !button) return;
    
    const isJoined = button.textContent.includes('Joined') || button.classList.contains('bg-discord-green');
    
    if (isJoined) return;
    
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Joining...';
    
    fetch('/api/servers/join', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ server_id: serverId })
    })
    .then(response => response.json())
    .then(data => {
        
        
        if (data.success) {
            const redirectUrl = data.redirect;
            
            
            if (redirectUrl) {
                
                window.location.href = redirectUrl;
                return;
            }
            
            button.innerHTML = '<i class="fas fa-check mr-2"></i>Joined';
            button.classList.remove('bg-discord-primary', 'hover:bg-discord-primary-dark');
            button.classList.add('bg-discord-green');
            button.disabled = false;
            
            if (window.showToast) {
                window.showToast('Successfully joined the server!', 'success');
            }
        } else {
            throw new Error(data.message || 'Failed to join server');
        }
    })
    .catch(error => {
        console.error('Join server error:', error);
        button.innerHTML = '<i class="fas fa-plus mr-2"></i>Join Server';
        button.disabled = false;
        
        if (window.showToast) {
            window.showToast('Failed to join server. Please try again.', 'error');
        }
    });
}

function initSidebarServerIcons() {
    const serverIcons = document.querySelectorAll('.server-sidebar-icon');
    
    serverIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        icon.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

function highlightExploreButton() {
    const exploreButtons = document.querySelectorAll('.discord-explore-server-button');
    
    exploreButtons.forEach(button => {
        button.classList.add('explore-button-active');
        
        const indicator = button.nextElementSibling;
        if (indicator && indicator.classList.contains('absolute')) {
            indicator.style.height = '40px';
        }
    });
}

function initServerDetailTriggers() {
    const serverCards = document.querySelectorAll('.misvord-initial-server-card .explore-server-card');
    
    serverCards.forEach(card => {
        const serverId = card.getAttribute('data-server-id');
        if (serverId) {
            card.addEventListener('click', function(e) {
                if (!e.target.closest('button')) {
                    const serverData = extractServerDataFromCard(this);
                    if (typeof window.showServerDetail === 'function') {
                        window.showServerDetail(serverId, serverData);
                    }
                }
            });
        }
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
    const bannerImg = card.querySelector('.server-banner img');
    if (bannerImg && bannerImg.src && !bannerImg.src.includes('default-profile-picture.png')) {
        bannerUrl = bannerImg.src;
    }

    let iconUrl = null;
    const iconImg = card.querySelector('.explore-server-icon-small img, .server-icon');
    if (iconImg && iconImg.src && !iconImg.src.includes('default-profile-picture.png')) {
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

function initInfiniteScrollIfNeeded() {
    const container = document.getElementById('all-servers');
    if (!container) return;

    const existingTrigger = document.getElementById('infinite-loading-indicator');
    if (existingTrigger) return;

    const visibleInitialCards = Array.from(container.querySelectorAll('.misvord-initial-server-card'))
        .filter(card => card.style.display !== 'none' && card.querySelector('.explore-server-card[data-server-id]')).length;
    const apiCards = Array.from(container.querySelectorAll('.misvord-api-server-card .explore-server-card'))
        .filter(card => card.getAttribute('data-server-id')).length;
    const publicServerCount = visibleInitialCards + apiCards;
    
    if (publicServerCount < 6) return;

    let loadMoreTrigger = document.createElement('div');
    loadMoreTrigger.id = 'infinite-loading-indicator';
    loadMoreTrigger.className = 'col-span-full';
    container.parentElement.appendChild(loadMoreTrigger);
    
    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
            loadMoreServers();
        } else if (entries[0].isIntersecting && !isLoading && !hasMore) {
            loadMoreServers();
        }
    }, {
        rootMargin: '0px 0px 500px 0px',
    });

    observer.observe(loadMoreTrigger);
}

function initInfiniteScroll() {
    const container = document.getElementById('all-servers');
    if (!container) return;

    let loadMoreTrigger = document.getElementById('infinite-loading-indicator');
    if (!loadMoreTrigger) {
        loadMoreTrigger = document.createElement('div');
        loadMoreTrigger.id = 'infinite-loading-indicator';
        loadMoreTrigger.className = 'col-span-full';
        container.parentElement.appendChild(loadMoreTrigger);
    }
    
    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
            loadMoreServers();
        }
    }, {
        rootMargin: '0px 0px 500px 0px',
    });

    observer.observe(loadMoreTrigger);
}

function loadMoreServers() {
    if (isLoading) return;

    if (!hasMore) {
        currentPage = 1;
    } else {
        currentPage++;
    }
    fetchAndRenderServers(true);
}

async function fetchAndRenderServers(append = false) {
    if (isLoading) return;
    isLoading = true;

    const indicator = document.getElementById('infinite-loading-indicator');
    if (indicator && append) {
        indicator.innerHTML = `
            <div class="grid-container p-4">
                ${Array.from({ length: 3 }, () => createSkeletonCard().outerHTML).join('')}
            </div>
        `;
    }
    
    const container = document.getElementById('all-servers');

    try {
        const response = await fetch('/api/servers/explore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                page: currentPage,
                per_page: 6,
                sort: currentSort,
                category: currentCategory,
                search: currentSearch
            })
        });
        
        const data = await response.json();

        if (data.success) {
            if (!append) {
                hideLoadingSkeletons();
                const apiCards = container.querySelectorAll('.misvord-api-server-card');
                apiCards.forEach(card => card.remove());
            }

            hasMore = data.has_more;
            currentPage = data.page;
            totalPages = data.total_pages || Math.ceil(data.total / 6);

            if (data.servers.length > 0) {
                const existingServerIds = Array.from(container.querySelectorAll('.explore-server-card'))
                    .map(card => card.getAttribute('data-server-id'))
                    .filter(id => id);
                
                const fragment = document.createDocumentFragment();
                data.servers.forEach((server, index) => {
                    if (!existingServerIds.includes(server.id.toString())) {
                        const cardWrapper = createServerCardElement(server);
                        cardWrapper.style.opacity = '0';
                        cardWrapper.style.transform = 'translateY(20px)';
                        fragment.appendChild(cardWrapper);
                    }
                });
                container.appendChild(fragment);
                
                const newCards = container.querySelectorAll('.misvord-api-server-card[style*="opacity: 0"]');
                newCards.forEach((card, index) => {
                    setTimeout(() => {
                        card.style.transition = 'all 0.5s ease-out';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                        card.classList.add('fade-in-up');
                    }, index * 100);
                });
                
                initJoinServerHandlersForNewCards(container);
                initServerDetailTriggersForNewCards(container);
                initLazyLoadingForNewCards(container);
            }

            const visibleCards = container.querySelectorAll('.misvord-initial-server-card[style*="block"], .misvord-api-server-card');
            if (visibleCards.length === 0 && data.servers.length === 0) {
                showNoResults();
            } else {
                hideNoResults();
            }

            const initialCards = container.querySelectorAll('.misvord-initial-server-card');
            initialCards.forEach(card => {
                const serverCard = card.querySelector('.explore-server-card');
                if (!serverCard) {
                    card.style.display = 'none';
                    return;
                }
                
                const category = serverCard.getAttribute('data-category') || '';
                const serverName = serverCard.querySelector('.server-name')?.textContent?.toLowerCase() || '';
                const serverDescription = serverCard.querySelector('.server-description')?.textContent?.toLowerCase() || '';
                
                let matchesCategory = currentCategory === '' || category === currentCategory;
                let matchesSearch = currentSearch === '' || 
                                   serverName.includes(currentSearch) || 
                                   serverDescription.includes(currentSearch);
                
                if (matchesCategory && matchesSearch) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });

        } else {
            if (window.showToast) window.showToast(data.message || 'Error loading servers.', 'error');
        }
    } catch (err) {
        console.error("Failed to fetch servers", err);
        if (window.showToast) window.showToast('Could not connect to server.', 'error');
    } finally {
        isLoading = false;
        if (indicator) {
            indicator.innerHTML = '';
        }
        if (!append) {
            hideLoadingSkeletons();
        }
    }
}

function updateCategoryCounts() {
    document.querySelectorAll('.category-item').forEach(item => {
        const category = item.getAttribute('data-category') || '';
        const countEl = item.querySelector('.misvord-category-count');
        
        if (countEl && originalCategoryCounts[category] !== undefined) {
            countEl.textContent = originalCategoryCounts[category].toString();
        }
    });
}

function initJoinServerHandlersForNewCards(container) {
    const newButtons = container.querySelectorAll('.join-server-btn:not([data-handler-attached])');
    newButtons.forEach(button => {
        button.setAttribute('data-handler-attached', 'true');
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const serverId = button.closest('.explore-server-card').getAttribute('data-server-id');
            if (serverId) {
                handleJoinServer(serverId, button);
            }
        });
    });
}

function initServerDetailTriggersForNewCards(container) {
    const newCards = container.querySelectorAll('.misvord-api-server-card .explore-server-card:not([data-detail-handler])');
    
    newCards.forEach(card => {
        card.setAttribute('data-detail-handler', 'true');
        const serverId = card.getAttribute('data-server-id');
        if (serverId) {
            card.addEventListener('click', function(e) {
                if (!e.target.closest('button')) {
                    const serverData = extractServerDataFromCard(this);
                    if (typeof window.showServerDetail === 'function') {
                        window.showServerDetail(serverId, serverData);
                    }
                }
            });
        }
    });
}

function initLazyLoadingForNewCards(container) {
    const newImages = container.querySelectorAll('.misvord-api-server-card img[data-src]:not([data-lazy-loaded])');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src');
                img.removeAttribute('data-src');
                img.setAttribute('data-lazy-loaded', 'true');
                imageObserver.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px'
    });
    
    newImages.forEach(img => imageObserver.observe(img));
}

function createServerCardElement(server) {
    const wrapper = document.createElement('div');
    wrapper.className = 'misvord-api-server-card';
    
    const card = document.createElement('div');
    card.className = 'explore-server-card server-card bg-discord-dark rounded-xl overflow-hidden transition-all cursor-pointer group';
    card.setAttribute('data-server-id', server.id);
    card.setAttribute('data-category', server.category || '');
    
    const bannerUrl = server.banner_url || '';
    const iconUrl = server.image_url || asset('common/default-profile-picture.png');
    const isJoined = server.is_member || false;
    
    card.innerHTML = `
        <div class="server-banner h-32 bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 relative overflow-hidden">
            ${bannerUrl ? `<img src="${bannerUrl}" alt="${server.name} banner" class="w-full h-full object-cover">` : ''}
        </div>
        <div class="relative px-5 pt-5 pb-5">
            <div class="explore-server-icon-small server-icon-small absolute -top-8 left-5">
                <div class="w-full h-full rounded-xl bg-discord-dark p-1 shadow-xl relative overflow-hidden">
                    <img src="${iconUrl}" alt="${server.name}" class="w-full h-full object-cover rounded-lg server-icon">
                    <div class="absolute inset-0 ring-2 ring-white/20 rounded-lg"></div>
                </div>
            </div>
            <div class="mt-8 pl-2">
                <div class="flex items-center gap-2 mb-2">
                    <h3 class="server-name font-bold text-lg text-white transition-colors flex-1">${server.name}</h3>
                    ${server.category ? `<span class="category-badge">${server.category.charAt(0).toUpperCase() + server.category.slice(1)}</span>` : ''}
                </div>
                <p class="server-description text-discord-lighter text-sm mb-3 line-clamp-2 leading-relaxed">${server.description || 'No description available'}</p>
                ${server.created_at ? `
                    <div class="server-created text-xs text-discord-lighter mb-3 flex items-center">
                        <i class="fas fa-calendar-plus mr-1"></i>
                        <span>Created ${new Date(server.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                ` : ''}
                <div class="server-stats flex items-center text-xs text-discord-lighter mb-4">
                    <span class="font-medium">${server.member_count || 0} members</span>
                </div>
                <div class="mt-4 space-y-2">
                    ${isJoined ? `
                        <button class="join-server-btn w-full bg-discord-green/20 text-discord-green text-center py-2.5 text-sm rounded-lg hover:bg-discord-green/30 transition-all font-semibold border border-discord-green/30" data-server-id="${server.id}">
                            <i class="fas fa-check mr-2"></i>Joined
                        </button>
                    ` : `
                        <button class="join-server-btn w-full bg-discord-primary text-white text-center py-2.5 text-sm rounded-lg hover:bg-discord-primary/90 transition-all font-semibold" data-server-id="${server.id}">
                            <i class="fas fa-plus mr-2"></i>Join Server
                        </button>
                    `}
                    ${server.invite_link ? `
                        <button onclick="navigator.clipboard.writeText('${server.invite_link}'); if(window.showToast) window.showToast('Invite link copied!', 'success');" class="w-full bg-discord-lighter/10 text-discord-lighter text-center py-2 text-xs rounded-lg hover:bg-discord-lighter/20 transition-all font-medium border border-discord-lighter/20">
                            <i class="fas fa-link mr-1"></i>Copy Invite
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    wrapper.appendChild(card);
    return wrapper;
}

function copyInviteLink(inviteCode) {
    const inviteUrl = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
        if (window.showToast) {
            window.showToast('Invite link copied to clipboard!', 'success');
        }
    }).catch(err => {
        console.error('Failed to copy invite link:', err);
        if (window.showToast) {
            window.showToast('Failed to copy invite link', 'error');
        }
    });
}

function initMobileExploreSidebar() {
    const toggleBtn = document.getElementById('mobile-explore-sidebar-toggle');
    const closeBtn = document.getElementById('mobile-explore-sidebar-close');
    const sidebar = document.querySelector('[data-sidebar="explore"]');
    const overlay = document.getElementById('explore-sidebar-overlay');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', function() {
            sidebar.classList.add('active');
            if (overlay) {
                overlay.classList.add('active');
            }
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeBtn && sidebar) {
        closeBtn.addEventListener('click', function() {
            sidebar.classList.remove('active');
            if (overlay) {
                overlay.classList.remove('active');
            }
            document.body.style.overflow = '';
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
}

window.copyInviteLink = copyInviteLink;