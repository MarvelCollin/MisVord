/**
 * MisVord - Main Entry Point
 * This file imports and initializes all application components
 */

// Import core utilities
import { showToast } from './core/toast.js';
import { MisVordAjax } from './core/ajax-handler.js';

// Import components
import * as Components from './components/index.js';

// Global initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('MisVord application initialized');
    
    // Only initialize global UI elements that are always present
    initGlobalUI();
    
    // Conditionally initialize page-specific components
    initPageSpecificComponents();
});

/**
 * Initialize global UI elements
 */
function initGlobalUI() {
    // Initialize tooltips, dropdowns, etc.
    const dropdownTriggers = document.querySelectorAll('[data-dropdown]');
    if (dropdownTriggers.length) {
        dropdownTriggers.forEach(trigger => {
            trigger.addEventListener('click', toggleDropdown);
        });
    }
    
    // Initialize auto-sizing textareas
    const textareas = document.querySelectorAll('textarea[data-autosize]');
    if (textareas.length) {
        textareas.forEach(textarea => {
            textarea.addEventListener('input', autosizeTextarea);
            // Initialize height on page load
            autosizeTextarea({ target: textarea });
        });
    }
}

/**
 * Initialize components based on current page context
 */
function initPageSpecificComponents() {
    const path = window.location.pathname;
    
    // Auth pages
    if (path === '/login' || path === '/register' || path === '/forgot-password') {
        // Auth components handled via inline scripts
    }
    
    // App home page
    else if (path === '/app' || path === '/home') {
        // Home page components
    }
    
    // Server page
    else if (path.includes('/server/')) {
        // Server page needs channel management and messaging
    }
    
    // Explore servers page
    else if (path === '/explore') {
        // Initialize server explorer
    }
}

/**
 * Toggle dropdown visibility
 */
function toggleDropdown(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const trigger = e.currentTarget;
    const targetId = trigger.dataset.dropdown;
    const dropdown = document.getElementById(targetId);
    
    if (!dropdown) return;
    
    const isOpen = dropdown.classList.contains('block');
    
    // Close all other dropdowns
    document.querySelectorAll('.dropdown-menu.block').forEach(menu => {
        if (menu.id !== targetId) {
            menu.classList.remove('block');
            menu.classList.add('hidden');
        }
    });
    
    // Toggle current dropdown
    if (!isOpen) {
        dropdown.classList.remove('hidden');
        dropdown.classList.add('block');
    } else {
        dropdown.classList.remove('block');
        dropdown.classList.add('hidden');
    }
}

/**
 * Auto-resize textarea height based on content
 */
function autosizeTextarea(e) {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('[data-dropdown]') && !e.target.closest('.dropdown-menu')) {
        document.querySelectorAll('.dropdown-menu.block').forEach(dropdown => {
            dropdown.classList.remove('block');
            dropdown.classList.add('hidden');
        });
    }
});

// Make common functions available globally
window.misvord = {
    showToast,
    toggleDropdown,
    autosizeTextarea
};

// Export for module usage
export {
    showToast,
    toggleDropdown,
    autosizeTextarea
}; 