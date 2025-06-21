import { ServerAPI } from '../../api/server-api.js';

document.addEventListener('DOMContentLoaded', function() {
    initServerIconUpload();
    initServerBannerUpload();
    initServerFormSubmission();
});

function initServerIconUpload() {
    const iconInput = document.getElementById('server-icon-input');
    const iconPreview = document.getElementById('server-icon-preview');
    const iconPlaceholder = document.getElementById('server-icon-placeholder');

    if (iconInput) {
        iconInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    iconPreview.src = e.target.result;
                    iconPreview.classList.remove('hidden');
                    iconPlaceholder.classList.add('hidden');
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
}

function initServerBannerUpload() {
    const bannerInput = document.getElementById('server-banner-input');
    const bannerPreview = document.getElementById('server-banner-preview');
    const bannerPlaceholder = document.getElementById('server-banner-placeholder');

    if (bannerInput) {
        bannerInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    bannerPreview.src = e.target.result;
                    bannerPreview.classList.remove('hidden');
                    bannerPlaceholder.classList.add('hidden');
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
}

function initServerFormSubmission() {
    const serverForm = document.getElementById('create-server-form');
    if (serverForm) {
        serverForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleServerCreation(this);
        });
    }
}

function handleServerCreation(form) {
    const formData = new FormData(form);
    const modal = document.getElementById('create-server-modal');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    showLoading(submitBtn);
    
    ServerAPI.createServer(formData)
    .then(data => {
        hideLoading(submitBtn);        if (data.success) {
            const server = data.data.server;
            
            try {
                addServerToSidebar(server);
            } catch (error) {
                console.error('Failed to add server to sidebar dynamically:', error);
                refreshSidebar();
            }
            
            closeModal(modal);
            resetForm(form);
            navigateToNewServer(server.id);
        } else {
            showError(data.message || 'Failed to create server');
        }
    })
    .catch(error => {
        hideLoading(submitBtn);
        showError('Network error occurred');
        console.error('Server creation error:', error);
    });
}

function addServerToSidebar(server) {
    const sidebar = document.querySelector('.w-\\[72px\\]') || 
                   document.querySelector('.server-sidebar') ||
                   document.querySelector('[class*="server"]');
    
    if (sidebar) {
        const addButton = sidebar.querySelector('[data-action="create-server"]');
        const addButtonContainer = addButton ? addButton.closest('.tooltip-wrapper') || addButton.parentElement : null;
        
        if (addButtonContainer) {
            const serverItem = createServerItem(server);
            addButtonContainer.parentNode.insertBefore(serverItem, addButtonContainer);
            setActiveServer(serverItem);
            
            if (!sidebar.querySelector('.w-8.h-0\\.5')) {
                const separator = document.createElement('div');
                separator.className = 'w-8 h-0.5 bg-discord-dark rounded my-1';
                const homeButton = sidebar.querySelector('[href="/"]') || sidebar.querySelector('[href="/home"]');
                const homeContainer = homeButton ? homeButton.closest('.tooltip-wrapper') || homeButton.parentElement : null;
                if (homeContainer && homeContainer.nextSibling) {
                    homeContainer.parentNode.insertBefore(separator, homeContainer.nextSibling);
                }
            }
        }
    }
}

function createServerItem(server) {
    const serverItem = document.createElement('div');
    serverItem.className = 'tooltip-wrapper mb-2';
    
    const serverContent = `
        <div class="relative server-icon" data-server-id="${server.id}">
            <a href="/server/${server.id}" class="block group">
                <div class="w-12 h-12 overflow-hidden rounded-full hover:rounded-2xl bg-discord-dark transition-all duration-200 flex items-center justify-center">
                    ${server.image_url ? 
                        `<img src="${server.image_url}" alt="${server.name}" class="w-full h-full object-cover">` :
                        `<span class="text-white font-bold text-xl">${server.name.substring(0, 1).toUpperCase()}</span>`
                    }
                </div>
            </a>
            <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-white rounded-r-md group-hover:h-5 transition-all duration-150"></div>
        </div>
    `;
    
    serverItem.innerHTML = serverContent;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip tooltip-right opacity-0 invisible absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-black text-white px-2 py-1 rounded text-sm whitespace-nowrap z-10 transition-all duration-200';
    tooltip.textContent = server.name;
    serverItem.appendChild(tooltip);
    
    serverItem.addEventListener('mouseenter', () => {
        tooltip.classList.remove('opacity-0', 'invisible');
    });
    
    serverItem.addEventListener('mouseleave', () => {
        tooltip.classList.add('opacity-0', 'invisible');
    });
    
    return serverItem;
}

function setActiveServer(serverItem) {
    document.querySelectorAll('.server-icon').forEach(item => {
        item.classList.remove('active');
        const serverDiv = item.querySelector('.w-12.h-12');
        const indicator = item.querySelector('.w-1');
        
        if (serverDiv) {
            serverDiv.classList.remove('rounded-2xl', 'bg-discord-primary');
            serverDiv.classList.add('rounded-full', 'bg-discord-dark');
        }
        if (indicator) {
            indicator.classList.remove('h-10');
            indicator.classList.add('h-0');
        }
    });
    
    const newServerIcon = serverItem.querySelector('.server-icon');
    if (newServerIcon) {
        newServerIcon.classList.add('active');
        const serverDiv = newServerIcon.querySelector('.w-12.h-12');
        const indicator = newServerIcon.querySelector('.w-1');
        
        if (serverDiv) {
            serverDiv.classList.remove('rounded-full', 'bg-discord-dark');
            serverDiv.classList.add('rounded-2xl', 'bg-discord-primary');
        }
        if (indicator) {
            indicator.classList.remove('h-0');
            indicator.classList.add('h-10');
        }
    }
}

function navigateToNewServer(serverId) {
    const currentPath = window.location.pathname;
    const newPath = `/server/${serverId}`;
    
    if (currentPath !== newPath) {
        history.pushState({serverId: serverId}, `Server ${serverId}`, newPath);
        loadServerPage(serverId);
    }
}

function loadServerPage(serverId) {
    const mainContent = document.querySelector('.flex-1') || 
                       document.querySelector('[class*="server-content"]') ||
                       document.querySelector('main');
    
    if (mainContent) {
        showPageLoading(mainContent);
        
        ServerAPI.redirectToServer(serverId)
        .then(html => {
            updatePageContent(mainContent, html);
        })
        .catch(error => {
            console.error('Error loading server page:', error);
            window.location.href = `/server/${serverId}`;
        });
    } else {
        window.location.href = `/server/${serverId}`;
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

function refreshSidebar() {
    const sidebar = document.querySelector('.w-\\[72px\\]') || 
                   document.querySelector('.server-sidebar');
    
    if (sidebar) {
        ServerAPI.getSidebar()
        .then(html => {
            sidebar.innerHTML = html;
        })
        .catch(error => {
            console.error('Failed to refresh sidebar:', error);
            window.location.reload();
        });
    }
}

function showLoading(button) {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating...';
}

function hideLoading(button) {
    button.disabled = false;
    button.innerHTML = 'Create Server';
}

function showPageLoading(container) {
    container.innerHTML = `
        <div class="flex items-center justify-center h-full">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-discord-blue mx-auto mb-4"></div>
                <p class="text-gray-400">Loading server...</p>
            </div>
        </div>
    `;
}

function closeModal(modal) {
    if (modal) {
        modal.classList.add('hidden');
    }
}

function resetForm(form) {
    form.reset();
    const iconPreview = document.getElementById('server-icon-preview');
    const iconPlaceholder = document.getElementById('server-icon-placeholder');
    const bannerPreview = document.getElementById('server-banner-preview');
    const bannerPlaceholder = document.getElementById('server-banner-placeholder');
    
    if (iconPreview) iconPreview.classList.add('hidden');
    if (iconPlaceholder) iconPlaceholder.classList.remove('hidden');
    if (bannerPreview) bannerPreview.classList.add('hidden');
    if (bannerPlaceholder) bannerPlaceholder.classList.remove('hidden');
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

window.navigateToServer = function(serverId) {
    navigateToNewServer(serverId);
};

window.openCreateServerModal = function() {
    const modal = document.getElementById('create-server-modal');
    if (modal) {
        modal.classList.remove('hidden');
        const nameInput = document.getElementById('server-name');
        if (nameInput) {
            nameInput.focus();
        }
    }
};

document.addEventListener('click', function(e) {
    const modal = document.getElementById('create-server-modal');
    const closeBtn = document.getElementById('close-server-modal');
    
    if (e.target === closeBtn || (e.target === modal)) {
        closeModal(modal);
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('create-server-modal');
        if (modal && !modal.classList.contains('hidden')) {
            closeModal(modal);
        }
    }
});