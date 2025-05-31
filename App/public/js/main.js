/**
 * Main JavaScript entry point for MiscVord application
 * This file imports all core utilities and components
 */

// Import core utilities
import './core/toast.js';
import { MiscVordAjax } from './core/ajax-handler.js';
import LazyLoader from './lazy-loader.js';

// Ensure LazyLoader is available globally before anything else
if (!window.LazyLoader) {
    window.LazyLoader = LazyLoader;
}

// Make utilities available globally
window.MiscVordAjax = MiscVordAjax;

// Signal that main modules are loaded
console.log('🔄 Main.js loaded - LazyLoader available globally');
window.dispatchEvent(new CustomEvent('MainModulesReady', { 
    detail: { 
        LazyLoader, 
        MiscVordAjax 
    } 
}));

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('MiscVord application initialized');
    
    // Initialize LazyLoader first
    console.log('🔄 Initializing LazyLoader from main.js');
    LazyLoader.init();
    
    // Import components as needed based on page
    const currentPage = document.body.dataset.page;
      // Load appropriate components based on the current page
    switch(currentPage) {
        case 'auth':
            import('./components/auth.js').then(module => {
                console.log('Authentication components loaded');
                // The authManager is automatically instantiated when imported
                if (module.authManager) {
                    console.log('✅ AuthManager initialized for authentication page');
                }
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