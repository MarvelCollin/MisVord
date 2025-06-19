import { showToast, MisVordAjax, GlobalSocketManager } from './core/index.js';
import * as Components from './components/index.js';
import * as Utils from './utils/index.js';
import { LazyLoader } from './utils/lazy-loader.js';

if (typeof window !== 'undefined' && !window.logger) {
    window.logger = {
        info: (...args) => console.log('[INFO]', ...args),
        debug: (...args) => console.log('[DEBUG]', ...args),
        warn: (...args) => console.warn('[WARN]', ...args),
        error: (...args) => console.error('[ERROR]', ...args)
    };
}

document.addEventListener('DOMContentLoaded', function() {
    logger.info('general', 'MisVord application initialized');

    window.showToast = showToast;
    window.MisVordAjax = MisVordAjax;
      if (LazyLoader) {
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

function initGlobalSocketManager() {
    logger.info('socket', 'Initializing global socket manager...');

    const userData = getUserDataFromPage();
    
    if (userData && userData.user_id) {
        logger.info('socket', 'User authenticated, initializing socket connection for:', userData.username);
        
        const socketManager = new GlobalSocketManager();
        
        socketManager.init(userData);
        
        window.globalSocketManager = socketManager;
          window.addEventListener('globalSocketReady', function(event) {
            logger.info('socket', 'Global socket manager ready:', event.detail);
            
            window.dispatchEvent(new CustomEvent('misVordGlobalReady', {
                detail: { socketManager: event.detail.manager }
            }));
        });    } else {
        logger.info('socket', 'Guest user detected, socket connection disabled');
        
        const socketManager = new GlobalSocketManager();
        window.globalSocketManager = socketManager;
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
    logger.debug('general', 'User data extracted from page:', userData);
    return userData;
}

export {
    showToast,
    toggleDropdown,
    autosizeTextarea
};