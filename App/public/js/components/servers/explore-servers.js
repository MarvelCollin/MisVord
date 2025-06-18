import { MisVordAjax } from '../core/ajax-handler.js';
import { showToast } from '../core/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    initExploreServers();
});

export function initExploreServers() {
    initServerSearch();
    initCategoryFilter();
    initServerSort();
}

function initServerSearch() {
    const searchInput = document.getElementById('server-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        const serverCards = document.querySelectorAll('.server-card');

        serverCards.forEach(card => {
            const serverName = card.querySelector('.server-name')?.textContent.toLowerCase() || '';
            const serverDesc = card.querySelector('.server-description')?.textContent.toLowerCase() || '';

            if (serverName.includes(searchTerm) || serverDesc.includes(searchTerm)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });

        checkEmptyResults();
    });
}

function initCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;

    categoryFilter.addEventListener('change', function() {
        const selectedCategory = this.value.toLowerCase();
        const serverCards = document.querySelectorAll('.server-card');

        if (!selectedCategory) {
            serverCards.forEach(card => card.classList.remove('hidden'));
        } else {
            serverCards.forEach(card => {
                const serverCategory = card.dataset.category?.toLowerCase() || '';

                if (serverCategory === selectedCategory) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        }

        checkEmptyResults();
    });
}

function initServerSort() {
    const sortButton = document.getElementById('sort-btn');
    if (!sortButton) return;

    let sortDirection = 'desc'; 

    sortButton.addEventListener('click', function() {
        const serversContainer = document.getElementById('all-servers');
        if (!serversContainer) return;

        const serverCards = Array.from(serversContainer.querySelectorAll('.server-card'));

        sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
        updateSortIcon();

        serverCards.sort((a, b) => {
            const aMembers = getMemberCount(a);
            const bMembers = getMemberCount(b);

            if (sortDirection === 'asc') {
                return aMembers - bMembers;
            } else {
                return bMembers - aMembers;
            }
        });

        serverCards.forEach(card => serversContainer.appendChild(card));
    });

    function getMemberCount(card) {
        const memberText = card.querySelector('.flex.items-center.text-xs')?.textContent || '';
        const match = memberText.match(/(\d+)/);
        return match ? parseInt(match[1].replace(/,/g, '')) : 0;
    }

    function updateSortIcon() {
        const icon = sortButton.querySelector('i');
        if (icon) {
            if (sortDirection === 'asc') {
                icon.className = 'fas fa-sort-amount-up mr-2';
                sortButton.innerHTML = '<i class="fas fa-sort-amount-up mr-2"></i>Sort: Least Members';
            } else {
                icon.className = 'fas fa-sort-amount-down mr-2';
                sortButton.innerHTML = '<i class="fas fa-sort-amount-down mr-2"></i>Sort: Most Members';
            }
        }
    }
}

function checkEmptyResults() {
    const allServersContainer = document.getElementById('all-servers');
    const featuredServersContainer = document.getElementById('featured-servers');

    checkContainer(allServersContainer, 'No servers match your search', 'search');
    checkContainer(featuredServersContainer, 'No featured servers match your search', 'star');
}

function checkContainer(container, message, icon) {
    if (!container) return;

    const visibleCards = container.querySelectorAll('.server-card:not(.hidden)');
    const existingEmptyMessage = container.querySelector('.empty-results-message');

    if (visibleCards.length === 0 && !existingEmptyMessage) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'col-span-full bg-discord-dark rounded-lg p-6 text-center empty-results-message';
        emptyMessage.innerHTML = `
            <i class="fas fa-${icon} text-3xl text-discord-lighter mb-3"></i>
            <h3 class="text-lg font-bold mb-1">${message}</h3>
            <p class="text-discord-lighter">Try adjusting your search or filters</p>
        `;
        container.appendChild(emptyMessage);
    } else if (visibleCards.length > 0 && existingEmptyMessage) {
        existingEmptyMessage.remove();
    }
}

export const ServerExplorer = {
    initExploreServers,
    initServerSearch,
    initCategoryFilter,
    initServerSort
};