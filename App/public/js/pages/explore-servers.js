document.addEventListener('DOMContentLoaded', function () {
    if (typeof window !== 'undefined' && window.logger) {
        window.logger.info('explore', 'Explore servers page initialized');
    }
    initExplorePage();
});

function initExplorePage() {
    const container = document.getElementById('all-servers');
    if (container) {
        showLoadingSkeletons();
        
        setTimeout(() => {
            hideLoadingSkeletons();
            hideCategoryCountSkeletons();
            
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
    } else {
        setTimeout(() => {
            hideCategoryCountSkeletons();
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
}

window.initExplorePage = initExplorePage;

let currentSort = 'alphabetical';
let currentCategory = '';
let currentSearch = '';

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
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function () {
            currentCategory = this.value || '';
            applyFilters();
            
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    }
    
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            const categoryValue = this.getAttribute('data-category') || '';
            
            categoryItems.forEach(cat => cat.classList.remove('active'));
            this.classList.add('active');
            
            currentCategory = categoryValue;
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
    const serverWrappers = Array.from(document.querySelectorAll('.misvord-initial-server-card'));
    const container = document.getElementById('all-servers');
    
    if (!container) return;
    
    let filteredWrappers = serverWrappers.filter(wrapper => {
        const card = wrapper.querySelector('.explore-server-card');
        if (!card) return false;
        
        const matchesCategory = !currentCategory || card.getAttribute('data-category') === currentCategory;
        const matchesSearch = !currentSearch || matchesSearchQuery(card, currentSearch);
        return matchesCategory && matchesSearch;
    });

    const filteredCards = filteredWrappers.map(wrapper => wrapper.querySelector('.explore-server-card')).filter(card => card);
    const sortedCards = sortServerCards(filteredCards, currentSort);
    
    updateCategoryCounts(filteredCards);
    
    hideLoadingSkeletons();
    showLoadingSkeletons();
    
    serverWrappers.forEach(wrapper => {
        wrapper.style.display = 'none';
    });
    
    setTimeout(() => {
        hideLoadingSkeletons();
        hideNoResults();
        
        const sortedFragment = document.createDocumentFragment();
        sortedCards.forEach(card => {
            const wrapper = card.closest('.misvord-initial-server-card');
            if (wrapper) {
                sortedFragment.appendChild(wrapper);
            } else {
                sortedFragment.appendChild(card);
            }
        });
        container.appendChild(sortedFragment);
        
        sortedCards.forEach((card, index) => {
            const wrapper = card.closest('.misvord-initial-server-card');
            if (wrapper) {
                wrapper.style.display = 'block';
            }
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
        });
        
        if (filteredCards.length === 0) {
            showNoResults();
        }
    }, 200);
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

function showCategoryCountSkeletons() {
    const countElements = document.querySelectorAll('.misvord-category-count');
    countElements.forEach(countEl => {
        countEl.classList.add('misvord-category-count-skeleton');
        countEl.textContent = '';
    });
}

function hideCategoryCountSkeletons() {
    const countElements = document.querySelectorAll('.misvord-category-count');
    countElements.forEach(countEl => {
        countEl.classList.remove('misvord-category-count-skeleton');
        const originalCount = countEl.getAttribute('data-count');
        countEl.textContent = originalCount || '0';
    });
}

function updateCategoryCounts(filteredCards) {
    const categoryCounts = {};
    const categoryItems = document.querySelectorAll('.category-item[data-category]');
    
    categoryItems.forEach(item => {
        const category = item.getAttribute('data-category');
        if (category) {
            categoryCounts[category] = 0;
        }
    });
    
    const allServerCards = document.querySelectorAll('.misvord-initial-server-card .explore-server-card');
    allServerCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (category && categoryCounts.hasOwnProperty(category)) {
            categoryCounts[category]++;
        }
    });
    
    const allServersCount = document.querySelector('.category-item[data-category=""] .misvord-category-count');
    if (allServersCount) {
        allServersCount.textContent = allServerCards.length;
    }
    
    categoryItems.forEach(item => {
        const category = item.getAttribute('data-category');
        const countEl = item.querySelector('.misvord-category-count');
        if (category && countEl && categoryCounts.hasOwnProperty(category)) {
            countEl.textContent = categoryCounts[category];
        }
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

function matchesSearchQuery(card, query) {
    const serverName = card.querySelector('.server-name')?.textContent.toLowerCase() || '';
    const serverDescription = card.querySelector('.server-description')?.textContent.toLowerCase() || '';
    const serverCategory = card.getAttribute('data-category')?.toLowerCase() || '';
    
    return serverName.includes(query) || 
           serverDescription.includes(query) || 
           serverCategory.includes(query);
}

function sortServerCards(cards, sortType) {
    const cardsCopy = [...cards];
    
    switch (sortType) {
        case 'alphabetical':
            return cardsCopy.sort((a, b) => {
                const nameA = a.querySelector('.server-name')?.textContent || '';
                const nameB = b.querySelector('.server-name')?.textContent || '';
                return nameA.localeCompare(nameB);
            });
            
        case 'alphabetical-desc':
            return cardsCopy.sort((a, b) => {
                const nameA = a.querySelector('.server-name')?.textContent || '';
                const nameB = b.querySelector('.server-name')?.textContent || '';
                return nameB.localeCompare(nameA);
            });
            
        case 'members-desc':
            return cardsCopy.sort((a, b) => {
                const membersA = extractMemberCount(a);
                const membersB = extractMemberCount(b);
                return membersB - membersA;
            });
            
        case 'members-asc':
            return cardsCopy.sort((a, b) => {
                const membersA = extractMemberCount(a);
                const membersB = extractMemberCount(b);
                return membersA - membersB;
            });
            
        case 'newest':
            return cardsCopy.sort((a, b) => {
                const idA = parseInt(a.getAttribute('data-server-id')) || 0;
                const idB = parseInt(b.getAttribute('data-server-id')) || 0;
                return idB - idA;
            });
            
        case 'oldest':
            return cardsCopy.sort((a, b) => {
                const idA = parseInt(a.getAttribute('data-server-id')) || 0;
                const idB = parseInt(b.getAttribute('data-server-id')) || 0;
                return idA - idB;
            });
            
        default:
            return cardsCopy;
    }
}

function extractMemberCount(card) {
    const memberCountElem = card.querySelector('.server-stats span');
    if (memberCountElem) {
        const memberMatch = memberCountElem.textContent.match(/[\d,]+/);
        return memberMatch ? parseInt(memberMatch[0].replace(/,/g, '')) : 0;
    }
    return 0;
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
        console.error('Error joining server:', error);
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