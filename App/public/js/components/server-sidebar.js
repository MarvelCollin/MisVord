import { MisVordAjax } from '../core/ajax-handler.js';

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
    });

    const currentPath = window.location.pathname;
    if (currentPath.includes('/server/')) {
        const serverId = currentPath.split('/server/')[1].split('/')[0];
        const activeIcon = document.querySelector(`.server-icon[data-server-id="${serverId}"]`);

        if (activeIcon) {
            activeIcon.classList.add('active');
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