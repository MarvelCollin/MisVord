/**
 * WebRTC Configuration Module
 * Provides standardized configuration for WebRTC components
 */

// Initialize WebRTC configuration in global scope
window.WebRTCConfig = window.WebRTCConfig || {};

// Determine if we're in a local environment
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname === '';

// Environment detection - has more granularity than just isLocalhost
const ENVIRONMENT = {
    // Local development environment
    LOCAL: isLocalhost,
    
    // Production/VPS environment
    PRODUCTION: !isLocalhost && window.location.hostname.includes('marvelcollin.my.id'),
    
    // Specific environments can be detected
    STAGING: !isLocalhost && window.location.hostname.includes('staging'),
    
    // Access the current environment name as a string
    get current() {
        if (this.LOCAL) return 'LOCAL';
        if (this.STAGING) return 'STAGING';
        if (this.PRODUCTION) return 'PRODUCTION';
        return 'UNKNOWN';
    },
    
    // Helper to check if we're in a specific environment
    is: function(env) {
        return this[env.toUpperCase()] === true;
    },
    
    // Get the base path for the current environment
    get basePath() {
        // In production, we're under /misvord/ path
        if (this.PRODUCTION) {
            return '/misvord/';
        }
        // Local development is at root path
        return '/';
    }
};

// Set standard socket connection parameters
const SOCKET_BASE_URL_PROD = 'https://marvelcollin.my.id';
const SOCKET_BASE_URL_LOCAL = 'http://localhost:1002';
const SOCKET_PATH_PROD = '/misvord/socket/socket.io';
const SOCKET_PATH_LOCAL = '/socket.io';

/**
 * Get the base path for the application
 * Handles different path roots in different environments
 * @returns {string} Base path to use for assets and API calls
 */
window.WebRTCConfig.getBasePath = function() {
    // Check if there's a specific base path set in the DOM
    const basePathMeta = document.querySelector('meta[name="base-path"]');
    if (basePathMeta && basePathMeta.content) {
        return basePathMeta.content;
    }
    
    // Otherwise use environment-based detection
    return ENVIRONMENT.basePath;
};

/**
 * Resolve a path relative to the application base path
 * @param {string} path - Path to resolve
 * @returns {string} Full path including base path if needed
 */
window.WebRTCConfig.resolvePath = function(path) {
    // If path already starts with http/https or is absolute, return as is
    if (path.startsWith('http') || path.startsWith('/')) {
        return path;
    }
    
    // Otherwise, prepend the base path
    return this.getBasePath() + path;
};

/**
 * Get the socket server URL based on current environment
 * @returns {string} Socket server URL
 */
window.WebRTCConfig.getSocketUrl = function() {
    // Check if ENV_CONFIG is available with custom settings
    if (window.ENV_CONFIG && window.ENV_CONFIG.SOCKET_BASE_URL_PROD && window.ENV_CONFIG.SOCKET_BASE_URL_LOCAL) {
        return ENVIRONMENT.LOCAL ? window.ENV_CONFIG.SOCKET_BASE_URL_LOCAL : window.ENV_CONFIG.SOCKET_BASE_URL_PROD;
    }
    
    // Default fallback if ENV_CONFIG is not available
    return ENVIRONMENT.LOCAL ? SOCKET_BASE_URL_LOCAL : SOCKET_BASE_URL_PROD;
};

/**
 * Get socket connection options
 * @returns {Object} Socket.IO connection options
 */
window.WebRTCConfig.getSocketOptions = function() {
    // Get the correct socket path based on environment
    const socketPath = ENVIRONMENT.LOCAL ? SOCKET_PATH_LOCAL : SOCKET_PATH_PROD;

    // Check if ENV_CONFIG has custom path settings
    const path = window.ENV_CONFIG && window.ENV_CONFIG.SOCKET_IO_PATH ? 
                 window.ENV_CONFIG.SOCKET_IO_PATH : socketPath;
    
    // Determine the correct namespace based on environment
    // In VPS environment, we need to use a specific namespace to match server configuration
    const namespace = ENVIRONMENT.PRODUCTION ? '/video-chat' : '';
                 
    // Return standard Socket.IO options with enhanced settings based on environment
    return {
        path: path,
        namespace: namespace, // Add namespace configuration
        transports: ['websocket', 'polling'],
        reconnectionAttempts: ENVIRONMENT.LOCAL ? 10 : 5, // More attempts in local development
        reconnectionDelay: ENVIRONMENT.LOCAL ? 500 : 1000, // Faster retries in local development  
        timeout: ENVIRONMENT.LOCAL ? 10000 : 5000, // Longer timeout for local development
        query: {
            clientVersion: '1.0.0',
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            environment: ENVIRONMENT.current
        },
        autoConnect: true, // Enable automatic connection
        forceNew: false    // Reuse existing connection if possible
    };
};

/**
 * Check if we're in a local environment
 * @returns {boolean} True if running locally
 */
window.WebRTCConfig.isLocalEnvironment = function() {
    return ENVIRONMENT.LOCAL;
};

/**
 * Get environment information for debugging
 * @returns {Object} Environment information
 */
window.WebRTCConfig.getEnvironmentInfo = function() {
    return {
        environment: ENVIRONMENT.current,
        isLocal: ENVIRONMENT.LOCAL,
        isProduction: ENVIRONMENT.PRODUCTION,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        port: window.location.port,
        socketUrl: this.getSocketUrl(),
        socketPath: this.getSocketOptions().path,
        isSecure: this.isSecureContext()
    };
};

// Initialize ENV_CONFIG with our config values for backwards compatibility
window.ENV_CONFIG = window.ENV_CONFIG || {
    SOCKET_BASE_URL_PROD: SOCKET_BASE_URL_PROD,
    SOCKET_BASE_URL_LOCAL: SOCKET_BASE_URL_LOCAL,
    SOCKET_IO_PATH: isLocalhost ? SOCKET_PATH_LOCAL : SOCKET_PATH_PROD,
    IS_LOCAL: isLocalhost
};

// Export for Node.js environment if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.WebRTCConfig;
}

// Log configuration status
console.log('[WebRTC Config] Environment:', isLocalhost ? 'Development/Local' : 'Production');
console.log('[WebRTC Config] Socket URL:', window.WebRTCConfig.getSocketUrl());
console.log('[WebRTC Config] Socket Path:', window.WebRTCConfig.getSocketOptions().path);
console.log('[WebRTC Config] WebRTC Supported:', window.WebRTCConfig.isWebRTCSupported());
console.log('[WebRTC Config] Secure Context:', window.WebRTCConfig.isSecureContext());

/**
 * Check if WebRTC is supported in the current browser
 * @return {boolean} True if WebRTC is supported
 */
window.WebRTCConfig.isWebRTCSupported = function() {
    return !!(navigator.mediaDevices && 
           navigator.mediaDevices.getUserMedia && 
           window.RTCPeerConnection);
};

/**
 * Check if the current page is being served over HTTPS
 * (Required for WebRTC except on localhost)
 * @return {boolean} True if using HTTPS or localhost
 */
window.WebRTCConfig.isSecureContext = function() {
    return ENVIRONMENT.LOCAL || window.location.protocol === 'https:';
};

/**
 * Enforce HTTPS for WebRTC in production environments
 * Should be called early to redirect if needed
 */
window.WebRTCConfig.enforceHttps = function() {
    // Only enforce in production environments
    if (!ENVIRONMENT.LOCAL && window.location.protocol !== 'https:') {
        console.warn('[WebRTC Config] WebRTC requires HTTPS in production. Redirecting to secure version.');
        
        // Show warning to user
        if (typeof window.WebRTCUI === 'object' && typeof window.WebRTCUI.addLogEntry === 'function') {
            window.WebRTCUI.addLogEntry('WebRTC requires HTTPS. Redirecting to secure version...', 'warn');
        }
        
        // Redirect to HTTPS version of the same URL
        window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
        
        return false; // Redirecting
    }
    
    return true; // Already secure or local development
};

/**
 * Check if WebRTC is fully supported in current environment
 * @returns {Object} Object with support status and any errors
 */
window.WebRTCConfig.checkSupport = function() {
    const secureContext = this.isSecureContext();
    const webRTCSupported = this.isWebRTCSupported();
    const mediaDevicesSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    
    // Build comprehensive support info
    const support = {
        fullSupport: secureContext && webRTCSupported && mediaDevicesSupported,
        secureContext: secureContext,
        webRTCSupported: webRTCSupported,
        mediaDevicesSupported: mediaDevicesSupported,
        errors: []
    };
    
    // Add specific errors
    if (!secureContext) {
        support.errors.push('WebRTC requires a secure context (HTTPS) except on localhost');
    }
    
    if (!webRTCSupported) {
        support.errors.push('WebRTC is not supported in this browser');
    }
    
    if (!mediaDevicesSupported) {
        support.errors.push('Media devices API is not supported in this browser');
    }
    
    return support;
};

// Run SSL enforcement on load
window.addEventListener('DOMContentLoaded', function() {
    window.WebRTCConfig.enforceHttps();
});

/**
 * Get ICE server configuration for WebRTC peer connections
 * This provides STUN/TURN servers for NAT traversal
 * @returns {Array} Array of ICE server configurations
 */
window.WebRTCConfig.getIceServers = function() {
    // Default public STUN servers
    const defaultStunServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ];
    
    // Default free TURN servers for testing (limited capacity, not for production)
    // For production, set up your own TURN server or use a commercial service
    const defaultTurnServers = [
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ];
    
    // Combine STUN and TURN servers
    const defaultIceServers = [...defaultStunServers, ...defaultTurnServers];
    
    // Validate an ICE server configuration
    const isValidIceServer = (server) => {
        // Must have urls property
        if (!server.urls) {
            console.warn('[WebRTC Config] Invalid ICE server missing urls:', server);
            return false;
        }
        
        // Check if it's a TURN server that requires credentials
        if ((typeof server.urls === 'string' && server.urls.startsWith('turn:')) || 
            (Array.isArray(server.urls) && server.urls.some(url => url.startsWith('turn:')))) {
            // TURN servers need username and credential
            if (!server.username || !server.credential) {
                console.warn('[WebRTC Config] TURN server missing credentials:', server);
                return false;
            }
        }
        
        return true;
    };
    
    // Check if we have custom ICE servers defined (e.g., from a TURN service)
    if (window.ENV_CONFIG && window.ENV_CONFIG.ICE_SERVERS) {
        try {
            let customServers = [];
            
            if (typeof window.ENV_CONFIG.ICE_SERVERS === 'string') {
                // Parse JSON string if provided that way
                customServers = JSON.parse(window.ENV_CONFIG.ICE_SERVERS);
            } else if (Array.isArray(window.ENV_CONFIG.ICE_SERVERS)) {
                // Use directly if it's already an array
                customServers = window.ENV_CONFIG.ICE_SERVERS;
            }
            
            // Validate each server config
            const validCustomServers = customServers.filter(isValidIceServer);
            
            if (validCustomServers.length > 0) {
                console.log(`[WebRTC Config] Using ${validCustomServers.length} custom ICE servers`);
                
                // If any servers were invalid, log a warning
                if (validCustomServers.length < customServers.length) {
                    console.warn(`[WebRTC Config] Skipped ${customServers.length - validCustomServers.length} invalid ICE server configurations`);
                }
                
                return validCustomServers;
            } else {
                console.warn('[WebRTC Config] No valid custom ICE servers found, using defaults');
                return defaultIceServers;
            }
        } catch(e) {
            console.error('[WebRTC Config] Error parsing ICE server configuration:', e);
            return defaultIceServers;
        }
    }
    
    // Check for individual TURN server credentials (common configuration method)
    if (window.ENV_CONFIG && 
        window.ENV_CONFIG.TURN_SERVER && 
        window.ENV_CONFIG.TURN_USERNAME && 
        window.ENV_CONFIG.TURN_CREDENTIAL) {
        
        const customTurnServer = {
            urls: window.ENV_CONFIG.TURN_SERVER,
            username: window.ENV_CONFIG.TURN_USERNAME,
            credential: window.ENV_CONFIG.TURN_CREDENTIAL
        };
        
        if (isValidIceServer(customTurnServer)) {
            console.log('[WebRTC Config] Using custom TURN server:', customTurnServer.urls);
            return [...defaultStunServers, customTurnServer];
        } else {
            console.warn('[WebRTC Config] Invalid custom TURN server configuration, using defaults');
            return defaultIceServers;
        }
    }
    
    // Return default servers if no custom configuration
    return defaultIceServers;
};

/**
 * Get RTCPeerConnection configuration
 * @returns {Object} Configuration object for RTCPeerConnection
 */
window.WebRTCConfig.getPeerConnectionConfig = function() {
    return {
        iceServers: this.getIceServers(),
        iceTransportPolicy: 'all',
        bundlePolicy: 'balanced',
        rtcpMuxPolicy: 'require',
        iceCandidatePoolSize: 10
    };
}; 