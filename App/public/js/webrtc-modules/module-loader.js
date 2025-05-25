/**
 * WebRTC Module Loader
 * Handles proper loading sequence and initialization of WebRTC modules
 */

// Create namespace
window.WebRTCLoader = window.WebRTCLoader || {};

// Track loaded modules
window.WebRTCLoader.loadedModules = {
    config: false,
    compatibility: false,
    mediaManager: false,
    signaling: false,
    connectionMonitor: false,
    ui: false
};

// Set up module dependency graph
window.WebRTCLoader.dependencies = {
    config: [],
    compatibility: ['config'],
    mediaManager: ['config', 'compatibility'],
    signaling: ['config', 'compatibility'],
    connectionMonitor: ['config', 'signaling'],
    ui: ['config', 'signaling', 'mediaManager']
};

// Module initialization functions
window.WebRTCLoader.initializers = {
    config: function() {
        // Check if config needs to be loaded
        if (!window.WebRTCConfig) {
            console.warn('[WebRTC Loader] WebRTCConfig not found, trying to load it dynamically');
            
            // Try to load webrtc-config.js dynamically
            const configScript = document.createElement('script');
            configScript.src = this.resolvePath('js/webrtc-modules/webrtc-config.js');
            configScript.async = false; // We need this to load synchronously
            
            // We'll return a promise that resolves when the script loads
            return new Promise((resolve, reject) => {
                configScript.onload = function() {
                    console.log('[WebRTC Loader] Successfully loaded WebRTCConfig dynamically');
                    // Run essential config functions
                    if (window.WebRTCConfig && typeof window.WebRTCConfig.enforceHttps === 'function') {
                        window.WebRTCConfig.enforceHttps();
                    }
                    resolve(true);
                };
                
                configScript.onerror = function() {
                    console.error('[WebRTC Loader] Failed to load WebRTCConfig, creating fallback');
                    
                    // Create standardized fallback configuration
                    window.WebRTCConfig = {
                        // Determine if we're in a local environment
                        isLocalEnvironment: function() {
                            return window.location.hostname === 'localhost' || 
                                   window.location.hostname === '127.0.0.1';
                        },
                        
                        // Get the socket URL based on environment
                        getSocketUrl: function() {
                            const isLocal = this.isLocalEnvironment();
                            return isLocal ? 'http://localhost:1002' : 'https://marvelcollin.my.id';
                        },
                        
                        // Get standardized socket path based on environment
                        getSocketPath: function() {
                            const isLocal = this.isLocalEnvironment();
                            return isLocal ? '/socket.io' : '/misvord/socket/socket.io';
                        },
                        
                        // Get socket connection options
                        getSocketOptions: function() {
                            return {
                                path: this.getSocketPath(),
                                transports: ['websocket', 'polling'],
                                reconnectionAttempts: this.isLocalEnvironment() ? 10 : 5,
                                reconnectionDelay: this.isLocalEnvironment() ? 500 : 1000,
                                timeout: this.isLocalEnvironment() ? 10000 : 5000
                            };
                        },
                        
                        // Check if WebRTC needs HTTPS
                        enforceHttps: function() {
                            const isLocal = this.isLocalEnvironment();
                            if (!isLocal && window.location.protocol !== 'https:') {
                                console.warn('[WebRTC Loader] WebRTC requires HTTPS in production. Redirecting...');
                                window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
                                return false;
                            }
                            return true;
                        },
                        
                        // Check if we're in a secure context
                        isSecureContext: function() {
                            const isLocal = this.isLocalEnvironment();
                            return isLocal || window.location.protocol === 'https:';
                        },
                        
                        // Check if WebRTC is supported
                        isWebRTCSupported: function() {
                            return !!(navigator.mediaDevices && 
                                   navigator.mediaDevices.getUserMedia && 
                                   window.RTCPeerConnection);
                        },
                        
                        // Get environment information for debugging
                        getEnvironmentInfo: function() {
                            const isLocal = this.isLocalEnvironment();
                            return {
                                environment: isLocal ? 'LOCAL' : 'PRODUCTION',
                                isLocal: isLocal,
                                isProduction: !isLocal,
                                hostname: window.location.hostname,
                                protocol: window.location.protocol,
                                socketUrl: this.getSocketUrl(),
                                socketPath: this.getSocketPath()
                            };
                        }
                    };
                    
                    // Still resolve since we created a fallback
                    resolve(true);
                };
                
                document.head.appendChild(configScript);
            });
        }
        
        // If WebRTCConfig already exists, just run the initialize function
        if (window.WebRTCConfig && typeof window.WebRTCConfig.enforceHttps === 'function') {
            window.WebRTCConfig.enforceHttps();
        }
        return true;
    },
    compatibility: function() {
        if (window.WebRTCCompatibility && typeof window.WebRTCCompatibility.applyBrowserFixes === 'function') {
            window.WebRTCCompatibility.applyBrowserFixes();
        }
        return true;
    },
    mediaManager: function() {
        if (window.WebRTCMediaManager && typeof window.WebRTCMediaManager.initialize === 'function') {
            window.WebRTCMediaManager.initialize();
        }
        return true;
    },
    signaling: function() {
        if (window.WebRTCSignaling && typeof window.WebRTCSignaling.initialize === 'function') {
            window.WebRTCSignaling.initialize();
        }
        return true;
    },
    connectionMonitor: function() {
        if (window.WebRTCMonitor && typeof window.WebRTCMonitor.init === 'function') {
            window.WebRTCMonitor.init();
        }
        return true;
    },
    ui: function() {
        if (window.WebRTCUI && typeof window.WebRTCUI.initialize === 'function') {
            window.WebRTCUI.initialize();
        }
        return true;
    }
};

/**
 * Get base path - handles /misvord/ in production
 * @returns {string} - Base path for module loading
 */
window.WebRTCLoader.getBasePath = function() {
    // Start by checking for <base> tag
    const baseTag = document.querySelector('base[href]');
    if (baseTag) {
        const baseHref = baseTag.getAttribute('href');
        return baseHref.endsWith('/') ? baseHref : baseHref + '/';
    }
    
    // Check if WebRTCConfig is already loaded and has path detection
    if (window.WebRTCConfig && typeof window.WebRTCConfig.getBasePath === 'function') {
        return window.WebRTCConfig.getBasePath();
    }
    
    // Check if we're under a subpath like /misvord/
    const pathParts = window.location.pathname.split('/');
    
    // Check for specific domains
    if (window.location.hostname.includes('marvelcollin.my.id') || 
        window.location.hostname.includes('misvord')) {
        return '/misvord/';
    }
    
    // For other environments, detect from path
    if (pathParts.length > 1 && pathParts[1]) {
        return '/' + pathParts[1] + '/';
    }
    
    return '/'; // Default path
};

/**
 * Resolve a path relative to the application base path
 * @param {string} path - Path to resolve
 * @returns {string} Full path including base path if needed
 */
window.WebRTCLoader.resolvePath = function(path) {
    // If path already starts with http/https or is absolute, return as is
    if (path.startsWith('http') || path.startsWith('/')) {
        return path;
    }
    
    // Otherwise, prepend the base path
    return this.getBasePath() + path;
};

/**
 * Check if a module can be initialized (all dependencies loaded)
 * @param {string} moduleName - Name of the module to check
 * @returns {boolean} - Whether the module can be initialized
 */
window.WebRTCLoader.canInitialize = function(moduleName) {
    const dependencies = this.dependencies[moduleName] || [];
    
    // Check if all dependencies are loaded
    return dependencies.every(dep => this.loadedModules[dep]);
};

/**
 * Check for circular dependencies in the dependency graph
 * @param {string} moduleName - Starting module to check
 * @param {Set} visited - Set of visited modules
 * @param {Set} path - Current path in the dependency graph
 * @returns {boolean} - Whether circular dependencies were found
 */
window.WebRTCLoader.hasCircularDependencies = function(moduleName, visited = new Set(), path = new Set()) {
    if (path.has(moduleName)) {
        console.error(`[WebRTC Loader] Circular dependency detected for ${moduleName}`);
        return true;
    }
    
    if (visited.has(moduleName)) {
        return false;
    }
    
    visited.add(moduleName);
    path.add(moduleName);
    
    const dependencies = this.dependencies[moduleName] || [];
    for (const dep of dependencies) {
        if (this.hasCircularDependencies(dep, visited, path)) {
            return true;
        }
    }
    
    path.delete(moduleName);
    return false;
};

/**
 * Initialize a specific module if possible
 * @param {string} moduleName - Name of the module to initialize
 * @returns {boolean} - Whether initialization was successful
 */
window.WebRTCLoader.initializeModule = function(moduleName) {
    // Skip if already loaded
    if (this.loadedModules[moduleName]) {
        return true;
    }
    
    // Check if dependencies are met
    if (!this.canInitialize(moduleName)) {
        console.log(`[WebRTC Loader] Cannot initialize ${moduleName} yet, dependencies not ready`);
        return false;
    }
    
    console.log(`[WebRTC Loader] Initializing module: ${moduleName}`);
    
    // Run initializer if available
    if (this.initializers[moduleName]) {
        try {
            const result = this.initializers[moduleName]();
            this.loadedModules[moduleName] = result;
            console.log(`[WebRTC Loader] Module ${moduleName} initialized successfully`);
            
            // Check if any pending modules can now be initialized
            this.checkPendingModules();
            
            return result;
        } catch (e) {
            console.error(`[WebRTC Loader] Error initializing module ${moduleName}:`, e);
            return false;
        }
    } else {
        // No initializer, mark as loaded
        this.loadedModules[moduleName] = true;
        console.log(`[WebRTC Loader] Module ${moduleName} marked as loaded (no initializer)`);
        this.checkPendingModules();
        return true;
    }
};

/**
 * Check and initialize any modules that can now be initialized
 */
window.WebRTCLoader.checkPendingModules = function() {
    let progress = false;
    let maxIterations = 10; // Prevent infinite loops
    let iterations = 0;
    
    // Keep initializing modules while making progress
    while (++iterations <= maxIterations) {
        progress = false;
        
        // Try to initialize each module that's not loaded yet
        Object.keys(this.loadedModules).forEach(moduleName => {
            if (!this.loadedModules[moduleName] && this.canInitialize(moduleName)) {
                const success = this.initializeModule(moduleName);
                progress = progress || success;
            }
        });
        
        // If no progress was made, we're done
        if (!progress) {
            break;
        }
    }
    
    if (iterations > maxIterations) {
        console.warn('[WebRTC Loader] Possible circular dependency detected');
    }
};

/**
 * Mark a module as loaded and initialize it
 * @param {string} moduleName - Name of the module that was loaded
 */
window.WebRTCLoader.moduleLoaded = function(moduleName) {
    console.log(`[WebRTC Loader] Module script loaded: ${moduleName}`);
    this.initializeModule(moduleName);
};

/**
 * Verify that all required modules are properly loaded
 * @returns {boolean} - Whether all modules are properly loaded
 */
window.WebRTCLoader.verifyAllModulesLoaded = function() {
    let allLoaded = true;
    const missingModules = [];
    
    Object.keys(this.loadedModules).forEach(moduleName => {
        if (!this.loadedModules[moduleName]) {
            allLoaded = false;
            missingModules.push(moduleName);
        }
    });
    
    if (!allLoaded) {
        console.warn(`[WebRTC Loader] Not all modules loaded. Missing: ${missingModules.join(', ')}`);
    }
    
    return allLoaded;
};

/**
 * Load all WebRTC modules in proper order
 * @param {Object} options - Options for loading modules
 */
window.WebRTCLoader.loadModules = function(options = {}) {
    // Check for circular dependencies
    for (const moduleName of Object.keys(this.dependencies)) {
        if (this.hasCircularDependencies(moduleName)) {
            console.error(`[WebRTC Loader] Circular dependencies detected for module: ${moduleName}`);
            if (typeof options.onError === 'function') {
                options.onError('Circular dependencies detected');
            }
            return;
        }
    }

    const basePath = options.basePath || (this.getBasePath() + 'js/webrtc-modules/');
    const moduleOrder = [
        { name: 'config', path: 'webrtc-config.js' },
        { name: 'compatibility', path: 'browser-compatibility.js' },
        { name: 'mediaManager', path: 'media-manager.js' },
        { name: 'signaling', path: 'signaling.js' },
        { name: 'connectionMonitor', path: 'connection-monitor.js' },
        { name: 'ui', path: 'webrtc-ui.js' }
    ];
    
    // Keep track of loading progress
    let loadedCount = 0;
    let failedCount = 0;
    const totalToLoad = moduleOrder.length - (options.skip ? options.skip.length : 0);
    
    // Check if all modules are loaded
    const checkAllLoaded = () => {
        if (loadedCount + failedCount >= totalToLoad) {
            console.log(`[WebRTC Loader] Modules loaded: ${loadedCount}, failed: ${failedCount}`);
            
            // Ensure all modules are initialized
            this.checkPendingModules();
            
            // Verify all required modules loaded
            const allLoaded = this.verifyAllModulesLoaded();
            
            // Call onComplete callback with status if provided
            if (typeof options.onComplete === 'function') {
                console.log('[WebRTC Loader] Calling onComplete callback');
                // Use longer timeout to ensure async initializations complete
                setTimeout(() => options.onComplete({
                    success: failedCount === 0 && allLoaded,
                    loaded: loadedCount,
                    failed: failedCount,
                    allModulesReady: allLoaded
                }), 200);
            }
            
            // Call onError if there were failures
            if (failedCount > 0 && typeof options.onError === 'function') {
                options.onError(`Failed to load ${failedCount} modules`);
            }
        }
    };
    
    // Function to load a script
    const loadScript = (name, path) => {
        const script = document.createElement('script');
        
        // Handle both relative and absolute URLs
        if (path.startsWith('http') || path.startsWith('/')) {
            script.src = path;
        } else {
            script.src = `${basePath}${path}`;
        }
        
        script.async = false; // Keep execution order
        
        // Set a timeout for script loading
        const timeoutId = setTimeout(() => {
            console.error(`[WebRTC Loader] Timeout loading ${name}`);
            script.onload = script.onerror = null;
            failedCount++;
            checkAllLoaded();
        }, 15000); // 15 second timeout
        
        script.onload = () => {
            clearTimeout(timeoutId);
            this.moduleLoaded(name);
            loadedCount++;
            checkAllLoaded();
        };
        
        script.onerror = (e) => {
            clearTimeout(timeoutId);
            console.error(`[WebRTC Loader] Failed to load ${name}:`, e);
            failedCount++;
            checkAllLoaded();
        };
        
        document.head.appendChild(script);
        console.log(`[WebRTC Loader] Loading ${name} from ${script.src}`);
    };
    
    // Load modules in order
    moduleOrder.forEach(module => {
        if (options.skip && options.skip.includes(module.name)) {
            console.log(`[WebRTC Loader] Skipping module: ${module.name}`);
            return;
        }
        loadScript(module.name, module.path);
    });
    
    // If no modules to load, call onComplete immediately
    if (totalToLoad === 0 && typeof options.onComplete === 'function') {
        console.log('[WebRTC Loader] No modules to load, calling onComplete immediately');
        setTimeout(() => options.onComplete({
            success: true, 
            loaded: 0, 
            failed: 0,
            allModulesReady: true
        }), 0);
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // If WebRTC modules are already being loaded explicitly, don't auto-load
    const scriptTags = document.querySelectorAll('script');
    let manualLoading = false;
    
    scriptTags.forEach(script => {
        if (script.src && script.src.includes('webrtc-modules') && !script.src.includes('module-loader.js')) {
            manualLoading = true;
        }
    });
    
    if (!manualLoading) {
        console.log('[WebRTC Loader] Auto-initializing WebRTC modules');
        window.WebRTCLoader.loadModules({
            // Use the dynamically determined base path
            basePath: window.WebRTCLoader.getBasePath() + 'js/webrtc-modules/',
            onError: function(error) {
                console.error(`[WebRTC Loader] Initialization error: ${error}`);
            }
        });
    } else {
        console.log('[WebRTC Loader] Manual loading detected, will initialize modules as they load');
    }
});

// Export for Node.js environment if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.WebRTCLoader;
} 