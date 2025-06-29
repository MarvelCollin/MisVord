document.addEventListener('DOMContentLoaded', function () {
    console.log('Explore servers DOM loaded');
    if (typeof window !== 'undefined' && window.logger) {
        window.logger.info('explore', 'Explore servers page initialized');
    }

    initExplorePage();
});

function initExplorePage() {
    console.log('Initializing explore page components');

    initServerCards();
    initCategoryFilter();
    initSearchFilter();
    initJoinServerHandlers();
    initSidebarServerIcons();
    highlightExploreButton();
    initServerDetailTriggers();
    initScrollAnimations();

    console.log('showServerDetail function available:', typeof window.showServerDetail);
}

window.initExplorePage = initExplorePage;

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
            const query = this.value.toLowerCase().trim();

            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                if (query.length >= 2) {
                    performServerSearch(query);
                } else if (query.length === 0) {
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
    const allServerCards = document.querySelectorAll('.server-card');
    let visibleCount = 0;

    allServerCards.forEach((card, index) => {
        const serverName = card.querySelector('.server-name')?.textContent.toLowerCase() || '';
        const serverDescription = card.querySelector('.server-description')?.textContent.toLowerCase() || '';
        
        const matches = serverName.includes(query) || serverDescription.includes(query);
        
        if (matches) {
            card.style.display = 'block';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0) scale(1)';
            }, visibleCount * 50);
            visibleCount++;
        } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(-10px) scale(0.95)';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });

    if (visibleCount === 0) {
        showNoResults();
    } else {
        hideNoResults();
    }
}

function resetServerSearch() {
    const allServerCards = document.querySelectorAll('.server-card');
    allServerCards.forEach((card, index) => {
        card.style.display = 'block';
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
        }, index * 50);
    });
    hideNoResults();
}

function showNoResults() {
    let noResultsDiv = document.getElementById('no-results-message');
    if (!noResultsDiv) {
        const serverGrid = document.querySelector('.server-grid');
        if (serverGrid) {
            noResultsDiv = document.createElement('div');
            noResultsDiv.id = 'no-results-message';
            noResultsDiv.className = 'col-span-full text-center py-12';
            noResultsDiv.innerHTML = `
                <div class="w-20 h-20 bg-discord-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-search text-3xl text-discord-primary"></i>
                </div>
                <h3 class="text-xl font-bold mb-2 text-white">No Results Found</h3>
                <p class="text-discord-lighter">No servers match your search criteria.</p>
            `;
            serverGrid.appendChild(noResultsDiv);
        }
    }
    if (noResultsDiv) {
        noResultsDiv.style.display = 'block';
    }
}

function hideNoResults() {
    const noResultsDiv = document.getElementById('no-results-message');
    if (noResultsDiv) {
        noResultsDiv.style.display = 'none';
    }
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

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/servers/join';
    form.style.display = 'none';

    const serverIdInput = document.createElement('input');
    serverIdInput.type = 'hidden';
    serverIdInput.name = 'server_id';
    serverIdInput.value = serverId;

    form.appendChild(serverIdInput);
    document.body.appendChild(form);

    fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
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
                if (window.loadServerPage && typeof window.loadServerPage === 'function') {
                    window.loadServerPage(serverId);
                } else {
                    window.location.href = `/server/${serverId}`;
                }
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
        button.innerHTML = originalText;
        button.className = originalClasses;
        button.disabled = false;
        button.style.opacity = '1';

        if (window.showToast) {
            window.showToast('Error joining server', 'error');
        }
    })
    .finally(() => {
        document.body.removeChild(form);
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