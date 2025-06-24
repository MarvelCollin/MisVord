import { MisVordAjax } from '../../core/ajax/ajax-handler.js';

document.addEventListener('DOMContentLoaded', function() {
    initServerSidebar();
});

export function initServerSidebar() {
    const serverIcons = document.querySelectorAll('.server-icon');

    serverIcons.forEach(icon => {

        if (!icon.hasAttribute('data-initialized')) {
            icon.setAttribute('data-initialized', 'true');

            const tooltip = icon.querySelector('.tooltip');
            if (tooltip) {
                icon.addEventListener('mouseenter', () => {
                    tooltip.classList.remove('hidden');
                    tooltip.classList.add('opacity-100');
                });

                icon.addEventListener('mouseleave', () => {
                    tooltip.classList.add('hidden');
                    tooltip.classList.remove('opacity-100');
                });
            }

            icon.addEventListener('click', (e) => {

                if (icon.classList.contains('active')) return;

                const serverId = icon.getAttribute('data-server-id');
                if (!serverId) return;

                e.preventDefault();

                handleServerClick(serverId);
            });
        }
    });

    updateActiveServer();
}

export function updateActiveServer() {
    document.querySelectorAll('.server-icon.active').forEach(icon => {
        icon.classList.remove('active');
        
        const serverDiv = icon.querySelector('.w-12.h-12');
        if (serverDiv) {
            serverDiv.classList.remove('rounded-2xl', 'bg-discord-primary');
            serverDiv.classList.add('rounded-full', 'bg-discord-dark');
        }
        
        const indicator = icon.querySelector('.w-1');
        if (indicator) {
            indicator.classList.remove('h-10');
            indicator.classList.add('h-0');
        }
    });

    const currentPath = window.location.pathname;
    if (currentPath.includes('/server/')) {
        const serverId = currentPath.split('/server/')[1].split('/')[0];
        const activeIcon = document.querySelector(`.server-icon[data-server-id="${serverId}"]`);

        if (activeIcon) {
            // Add active state
            activeIcon.classList.add('active');
            
            // Update server icon styling
            const serverDiv = activeIcon.querySelector('.w-12.h-12');
            if (serverDiv) {
                serverDiv.classList.remove('rounded-full', 'bg-discord-dark');
                serverDiv.classList.add('rounded-2xl', 'bg-discord-primary');
            }
            
            // Update indicator
            const indicator = activeIcon.querySelector('.w-1');
            if (indicator) {
                indicator.classList.remove('h-0');
                indicator.classList.add('h-10');
            } else {
                // If no indicator exists, create one
                const indicatorDiv = document.createElement('div');
                indicatorDiv.className = 'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-md';
                activeIcon.appendChild(indicatorDiv);
            }
            
            console.log(`Server ${serverId} set as active`);
        } else {
            console.warn(`Could not find server icon for ID: ${serverId}`);
        }
    }
}

export function handleServerClick(serverId) {

    document.body.classList.add('content-loading');

    window.location.href = `/server/${serverId}`;
}

export const ServerSidebar = {
    initServerSidebar,
    updateActiveServer,
    handleServerClick
};