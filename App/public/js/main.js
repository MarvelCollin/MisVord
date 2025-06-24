import { logger } from './logger.js';

if (typeof window !== 'undefined' && !window.logger) {
    window.logger = {
        info: (module, ...args) => console.log(`[${module.toUpperCase()}]`, ...args),
        debug: (module, ...args) => console.log(`[${module.toUpperCase()}]`, ...args),
        warn: (module, ...args) => console.warn(`[${module.toUpperCase()}]`, ...args),
        error: (module, ...args) => console.error(`[${module.toUpperCase()}]`, ...args)
    };
}

import { showToast, MisVordAjax } from './core/index.js';
import globalSocketManager from './core/socket/global-socket-manager.js';
import PageLoader from './core/page-loader.js';
import * as Components from './components/index.js';
import * as Utils from './utils/index.js';
import { LazyLoader } from './utils/lazy-loader.js';

document.addEventListener('DOMContentLoaded', function() {
    window.logger.info('general', 'MisVord application initialized');

    window.showToast = showToast;
    window.MisVordAjax = MisVordAjax;
    
    PageLoader.init();

      if (LazyLoader) {
        window.LazyLoader = Object.assign(window.LazyLoader || {}, LazyLoader);
        window.LazyLoader.init();
    }    initGlobalUI();
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

function initGlobalSocketManager() {
    const isAuthPage = document.body && document.body.getAttribute('data-page') === 'auth';
    if (isAuthPage) {
        window.logger.info('socket', 'Authentication page detected, skipping socket initialization');
        return;
    }

    if (typeof io === 'undefined') {
        window.logger.error('socket', 'Socket.io library not loaded, skipping socket initialization');
        return;
    }
    
    if (window.globalSocketManager) {
        window.logger.info('socket', 'Global socket manager already initialized, skipping...');
        return;
    }
    
    window.logger.info('socket', 'Initializing global socket manager...');

    const userData = getUserDataFromPage();
    
    if (userData && userData.user_id) {
        window.logger.info('socket', 'User authenticated, initializing socket connection for:', userData.username);
        
        try {
            globalSocketManager.init(userData);
            window.globalSocketManager = globalSocketManager;
            
            window.addEventListener('globalSocketReady', function(event) {
                window.logger.info('socket', 'Global socket manager ready:', event.detail);
                
                window.dispatchEvent(new CustomEvent('misVordGlobalReady', {
                    detail: { socketManager: event.detail.manager }
                }));
            });
        } catch (error) {
            window.logger.error('socket', 'Failed to initialize socket manager:', error);
        }
    } else {
        window.logger.info('socket', 'Guest user detected, socket connection disabled');
        window.globalSocketManager = globalSocketManager;
    }
}

function getUserDataFromPage() {
    let userData = null;
    
    const bodyUserId = document.body.getAttribute('data-user-id');
    const bodyUsername = document.body.getAttribute('data-username');
    
    if (bodyUserId && bodyUsername) {
        userData = {
            user_id: bodyUserId,
            username: bodyUsername
        };
    }
    
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
    window.logger.debug('general', 'User data extracted from page:', userData);
    return userData;
}

export function reinitUI() {
    initGlobalUI();
}

export {
    showToast,
    toggleDropdown,
    autosizeTextarea
};