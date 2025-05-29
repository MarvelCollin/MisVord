// Server Sidebar Functionality
console.log('server-sidebar.js loaded');

document.addEventListener('DOMContentLoaded', function() {
    initServerSidebar();
});

function initServerSidebar() {
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
        }
    });
    
    // Handle active server highlighting
    const currentPath = window.location.pathname;
    if (currentPath.includes('/server/')) {
        const serverId = currentPath.split('/server/')[1].split('/')[0];
        const activeIcon = document.querySelector(`.server-icon[data-server-id="${serverId}"]`);
        
        if (activeIcon) {
            activeIcon.classList.add('active');
        }
    }
} 