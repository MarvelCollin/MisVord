/**
 * Main JavaScript entry point for MiscVord application
 * This file imports all core utilities and components
 */

// Import core utilities
import './core/toast.js';
import { MiscVordAjax } from './core/ajax-handler.js';

// Make AJAX handler available globally
window.MiscVordAjax = MiscVordAjax;

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('MiscVord application initialized');
    
    // Import components as needed based on page
    const currentPage = document.body.dataset.page;
    
    // Load appropriate components based on the current page
    switch(currentPage) {
        case 'auth':
            import('./components/auth.js').then(module => {
                console.log('Authentication components loaded');
            });
            break;
        case 'server':
            import('./components/server-manager.js').then(module => {
                console.log('Server management components loaded');
            });
            break;
        case 'channel':
            import('./components/channel-manager.js').then(module => {
                console.log('Channel management components loaded');
            });
            break;
        case 'messaging':
            import('./components/messaging.js').then(module => {
                console.log('Messaging components loaded');
            });
            break;
    }
}); 