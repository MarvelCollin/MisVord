import { ServerAPI } from '../api/server-api.js';

document.addEventListener('DOMContentLoaded', function() {
    if (typeof window !== 'undefined' && window.logger) {
        window.logger.info('explore', 'Explore servers page initialized');
    }

    initServerCards();
    initCategoryFilter();
    initSearchFilter();
    initJoinServerHandlers();
    initSidebarServerIcons();
});

function initSidebarServerIcons() {
    const serverIcons = document.querySelectorAll('.sidebar-server-icon');
    
    serverIcons.forEach(icon => {
        if (icon.closest('.w-[72px]')) {
            icon.style.display = 'block';
            icon.style.margin = '0 auto 8px auto';
            icon.style.position = 'relative';
        }
        
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
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            filterServersBySearch(query);
        });
    }
}

function filterServersBySearch(query) {
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
    
    ServerAPI.joinServer({ server_id: serverId })
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
