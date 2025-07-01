import { showToast } from './core/index.js';
import { logger } from './logger.js';
import { globalSocketManager } from './core/socket/global-socket-manager.js';
import PageLoader from './core/page-loader.js';
import * as Components from './components/index.js';
import { LazyLoader } from './utils/lazy-loader.js';
import { loadCSS, unloadCSS } from './utils/css-loader.js';
import NitroCrownManager from './utils/nitro-crown-manager.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Main application loaded');
    
    if (typeof window !== 'undefined') {
        window.showToast = showToast;
        window.logger = logger;
        window.globalSocketManager = globalSocketManager;
        window.loadCSS = loadCSS;
        window.unloadCSS = unloadCSS;
        
        if (!window.nitroCrownManager) {
            window.nitroCrownManager = new NitroCrownManager();
        }
        
        logger.info('general', 'Global utilities loaded:', {
            showToast: typeof showToast,
            logger: typeof logger,
            globalSocketManager: typeof globalSocketManager,
            nitroCrownManager: typeof window.nitroCrownManager
        });
        
        const currentPage = window.location.pathname;
        
        logger.debug('general', 'Page loaded:', currentPage);
        
        logger.debug('general', 'Available globals:', [
            'showToast',
            'logger', 
            'globalSocketManager'
        ].join(', '));
    }

    initGlobalSocketManager();
    
    PageLoader.init();

    if (LazyLoader) {
        window.LazyLoader = Object.assign(window.LazyLoader || {}, LazyLoader);
        window.LazyLoader.init();
    }

    initGlobalUI();
    initPageSpecificComponents();
    initNitroCrowns();
    
    window.dispatchEvent(new CustomEvent('MainModulesReady', {
        detail: {
            LazyLoader: window.LazyLoader,
            showToast,
            logger,
            nitroCrownManager: window.nitroCrownManager
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

    else if (path === '/home') {

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
    autosizeTextarea,
    loadCSS,
    unloadCSS
};

function initGlobalSocketManager() {
    const isAuthPage = document.body && document.body.getAttribute('data-page') === 'auth';
    if (isAuthPage) {
        logger.info('socket', 'Authentication page detected, skipping socket initialization');
        return;
    }

    if (typeof io === 'undefined') {
        logger.error('socket', 'Socket.io library not loaded');
        return;
    }
    
    initSocketAfterLoad();
}

function initSocketAfterLoad() {
    if (window.__SOCKET_INITIALISED__) {
        logger.info('socket', 'Socket already initialized, skipping...');
        window.__MAIN_SOCKET_READY__ = true;
        return;
    }
    
    logger.info('socket', 'Initializing global socket manager...');

    const userData = getUserDataFromPage();
    
    try {
        const result = globalSocketManager.init(userData);
        window.globalSocketManager = globalSocketManager;
        
        if (result) {
            logger.info('socket', 'Socket initialization started');
        } else {
            logger.warn('socket', 'Socket initialization bypassed or already running');
            window.__MAIN_SOCKET_READY__ = true;
        }
        
        window.addEventListener('globalSocketReady', function(event) {
            logger.info('socket', 'Global socket manager ready:', event.detail);
            window.__MAIN_SOCKET_READY__ = true;
            
            window.dispatchEvent(new CustomEvent('misVordGlobalReady', {
                detail: { socketManager: event.detail.manager }
            }));
        });
        
        window.addEventListener('socketAuthenticated', function(event) {
            logger.info('socket', 'Socket authenticated:', event.detail);
            window.__MAIN_SOCKET_READY__ = true;
        });
        
        setTimeout(() => {
            if (!window.__MAIN_SOCKET_READY__) {
                logger.warn('socket', 'Socket initialization taking longer than expected, marking ready anyway');
                window.__MAIN_SOCKET_READY__ = true;
            }
        }, 5000);
        
    } catch (error) {
        logger.error('socket', 'Failed to initialize socket manager:', error);
        window.__MAIN_SOCKET_READY__ = true;
    }
}

function initNitroCrowns() {
    if (!window.nitroCrownManager) {
        logger.warn('nitro', 'Nitro Crown Manager not available');
        return;
    }
    
    logger.info('nitro', 'Initializing Nitro crown system');
    
    const initializeCrowns = () => {
        if (document.readyState === 'complete') {
            window.nitroCrownManager.scanAndUpdateExistingElements();
            window.nitroCrownManager.observeUserElements();
            logger.info('nitro', 'Nitro crown system initialized');
        } else {
            setTimeout(initializeCrowns, 50);
        }
    };
    
    setTimeout(initializeCrowns, 100);
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

export function reinitUI() {
    initGlobalUI();
}

export {
    showToast,
    toggleDropdown,
    autosizeTextarea,
    loadCSS,
    unloadCSS
};

async function initializeNavigation() {
    console.log('[Main] Initializing navigation system');
    
    try {
        if (!window.loadHomePage) {
            console.log('[Main] Loading home page navigation');
            await import('./utils/load-home-page.js');
        }
        
        if (!window.loadServerPage) {
            console.log('[Main] Loading server page navigation');
            await import('./utils/load-server-page.js');
        }
        
        if (!window.loadExplorePage) {
            console.log('[Main] Loading explore page navigation');
            await import('./utils/load-explore-page.js');
        }
        
        console.log('[Main] Navigation system initialized successfully');
        return true;
    } catch (error) {
        console.error('[Main] Failed to initialize navigation system:', error);
        return false;
    }
}

async function initializeApplication() {
    console.log('[Main] Starting application initialization');
    
    await initializeNavigation();
    
    if (document.readyState === 'complete') {
        console.log('[Main] Document ready, initializing components');
        initializeComponents();
    } else {
        console.log('[Main] Waiting for document ready');
        document.addEventListener('DOMContentLoaded', initializeComponents);
    }
}

function initializeComponents() {
    console.log('[Main] Initializing core components');
    
    const isAuthenticated = document.querySelector('meta[name="user-authenticated"]')?.content === 'true';
    
    if (isAuthenticated) {
        console.log('[Main] User authenticated, setting up navigation');
        
        setTimeout(() => {
            if (typeof window.initServerSidebar === 'function') {
                window.initServerSidebar();
            }
            
            if (typeof window.updateActiveServer === 'function') {
                setTimeout(() => {
                    const currentPath = window.location.pathname;
                    if (currentPath.includes('/server/')) {
                        const serverId = currentPath.split('/server/')[1].split('/')[0];
                        window.updateActiveServer('server', serverId);
                    } else if (currentPath === '/home' || currentPath === '/') {
                        window.updateActiveServer('home');
                    } else if (currentPath.includes('/explore')) {
                        window.updateActiveServer('explore');
                    }
                }, 200);
            }
        }, 100);
    }
}

initializeApplication();