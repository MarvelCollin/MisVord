/**
 * Server Sidebar Component for MiscVord
 * Handles the server list sidebar with tooltips and navigation
 */

import { MisVordAjax } from '../core/ajax-handler.js';

document.addEventListener('DOMContentLoaded', function() {
    initServerSidebar();
});

/**
 * Initialize server sidebar functionality
 */
export function initServerSidebar() {
    const serverIcons = document.querySelectorAll('.server-icon');
    
    serverIcons.forEach(icon => {
        // Add hover effects and tooltips if not already initialized
        if (!icon.hasAttribute('data-initialized')) {
            icon.setAttribute('data-initialized', 'true');
            
            // Server icon tooltip functionality
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
            
            // Add server click handler
            icon.addEventListener('click', (e) => {
                // Don't handle if it's already the active server
                if (icon.classList.contains('active')) return;
                
                // Get server ID
                const serverId = icon.getAttribute('data-server-id');
                if (!serverId) return;
                
                // Prevent default link behavior
                e.preventDefault();
                
                // Handle server click
                handleServerClick(serverId);
            });
        }
    });
    
    // Handle active server highlighting
    updateActiveServer();
}

/**
 * Update the active server indicator based on current URL
 */
export function updateActiveServer() {
    // Remove active class from all server icons
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

/**
 * Handle server click - load server content and update UI
 * @param {string} serverId - The server ID
 */
export function handleServerClick(serverId) {
    // Show loading state
    document.body.classList.add('content-loading');
    
    // Redirect to server page
    window.location.href = `/server/${serverId}`;
}

// Export the functionality
export const ServerSidebar = {
    initServerSidebar,
    updateActiveServer,
    handleServerClick
}; 