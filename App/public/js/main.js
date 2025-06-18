import { showToast, MisVordAjax, GlobalSocketManager } from './core/index.js';
import * as Components from './components/index.js';
import * as Utils from './utils/index.js';
import { LazyLoader } from './utils/lazy-loader.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('MisVord application initialized');

    window.showToast = showToast;
    window.MisVordAjax = MisVordAjax;
      if (LazyLoader) {
        // Merge the imported LazyLoader with the global one
        window.LazyLoader = Object.assign(window.LazyLoader || {}, LazyLoader);
        window.LazyLoader.init();
    }

    initGlobalUI();
    initGlobalSocketManager();
    initPageSpecificComponents();
    
    window.dispatchEvent(new CustomEvent('MainModulesReady', {
        detail: {
            LazyLoader: window.LazyLoader,
            showToast,
            MisVordAjax
        }
    }));
});

function initGlobalUI() {

    const dropdownTriggers = document.querySelectorAll('[data-dropdown]');
    if (dropdownTriggers.length) {
        dropdownTriggers.forEach(trigger => {
            trigger.addEventListener('click', toggleDropdown);
        });
    }

    const textareas = document.querySelectorAll('textarea[data-autosize]');
    if (textareas.length) {
        textareas.forEach(textarea => {
            textarea.addEventListener('input', autosizeTextarea);

            autosizeTextarea({ target: textarea });
        });
    }
}

function initPageSpecificComponents() {
    const path = window.location.pathname;

    if (path === '/login' || path === '/register' || path === '/forgot-password') {

    }

    else if (path === '/app' || path === '/home') {

    }

    else if (path.includes('/server/')) {

    }

    else if (path === '/explore') {

    }
}

function toggleDropdown(e) {
    e.preventDefault();
    e.stopPropagation();

    const trigger = e.currentTarget;
    const targetId = trigger.dataset.dropdown;
    const dropdown = document.getElementById(targetId);

    if (!dropdown) return;

    const isOpen = dropdown.classList.contains('block');

    document.querySelectorAll('.dropdown-menu.block').forEach(menu => {
        if (menu.id !== targetId) {
            menu.classList.remove('block');
            menu.classList.add('hidden');
        }
    });

    if (!isOpen) {
        dropdown.classList.remove('hidden');
        dropdown.classList.add('block');
    } else {
        dropdown.classList.remove('block');
        dropdown.classList.add('hidden');
    }
}

function autosizeTextarea(e) {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('[data-dropdown]') && !e.target.closest('.dropdown-menu')) {
        document.querySelectorAll('.dropdown-menu.block').forEach(dropdown => {
            dropdown.classList.remove('block');
            dropdown.classList.add('hidden');
        });
    }
});

window.misvord = {
    showToast,
    toggleDropdown,
    autosizeTextarea
};

/**
 * Initialize the global socket manager for real-time features
 * This will be called on every page load to establish WebSocket connection
 * for authenticated users and track all user activity globally
 */
function initGlobalSocketManager() {
    console.log('🌐 Initializing global socket manager...');

    // Get user data from the page
    const userData = getUserDataFromPage();
    
    if (userData && userData.user_id) {
        console.log('👤 User authenticated, initializing socket connection for:', userData.username);
        
        // Create global socket manager instance
        const socketManager = new GlobalSocketManager();
        
        // Initialize with user data
        socketManager.init(userData);
        
        // Make it available globally for other components
        window.globalSocketManager = socketManager;
        
        // Listen for global socket events
        window.addEventListener('globalSocketReady', function(event) {
            console.log('✅ Global socket manager ready:', event.detail);
            
            // Dispatch custom event for other components
            window.dispatchEvent(new CustomEvent('misVordGlobalReady', {
                detail: { socketManager: event.detail.manager }
            }));
        });
        
    } else {
        console.log('👤 Guest user detected, socket connection disabled');
        
        // Still create a minimal instance for API compatibility, but it won't connect
        const socketManager = new GlobalSocketManager();
        window.globalSocketManager = socketManager;
    }
}

/**
 * Extract user data from the current page
 * This looks for user data in various places (meta tags, data attributes, etc.)
 */
function getUserDataFromPage() {
    let userData = null;
    
    // Method 1: Look for data attributes on body or html
    const bodyUserId = document.body.getAttribute('data-user-id');
    const bodyUsername = document.body.getAttribute('data-username');
    
    if (bodyUserId && bodyUsername) {
        userData = {
            user_id: bodyUserId,
            username: bodyUsername
        };
    }
    
    // Method 2: Look for meta tags
    if (!userData) {
        const userIdMeta = document.querySelector('meta[name="user-id"]');
        const usernameMeta = document.querySelector('meta[name="username"]');
        
        if (userIdMeta && usernameMeta) {
            userData = {
                user_id: userIdMeta.content,
                username: usernameMeta.content
            };
        }
    }
    
    // Method 3: Look for hidden inputs or data elements
    if (!userData) {
        const socketData = document.getElementById('socket-data');
        if (socketData) {
            const userId = socketData.getAttribute('data-user-id');
            const username = socketData.getAttribute('data-username');
            
            if (userId && username) {
                userData = {
                    user_id: userId,
                    username: username
                };
            }
        }
    }
    
    // Method 4: Look for hidden form inputs
    if (!userData) {
        const userIdInput = document.querySelector('input[data-user-id]');
        const usernameInput = document.querySelector('input[data-username]');
        
        if (userIdInput && usernameInput) {
            userData = {
                user_id: userIdInput.getAttribute('data-user-id'),
                username: usernameInput.getAttribute('data-username')
            };
        }
    }
    
    console.log('🔍 User data extracted from page:', userData);
    return userData;
}

export {
    showToast,
    toggleDropdown,
    autosizeTextarea
};