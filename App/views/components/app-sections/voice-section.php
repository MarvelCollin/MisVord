<?php
// Multiple path resolution strategies for robust configuration loading
$configPath = null;
$possiblePaths = [
    // Primary: relative from this file
    dirname(__DIR__, 3) . '/config/videosdk.php',
    // Fallback: using APP_ROOT if defined
    (defined('APP_ROOT') ? APP_ROOT : '') . '/config/videosdk.php',
    // Fallback: absolute from document root
    $_SERVER['DOCUMENT_ROOT'] . '/../config/videosdk.php',
    // Fallback: using realpath
    realpath(dirname(__DIR__, 3) . '/config/videosdk.php'),
];

foreach ($possiblePaths as $path) {
    if (!empty($path) && file_exists($path)) {
        $configPath = $path;
        break;
    }
}

if (!$configPath) {
    error_log('VideoSDK config not found in any of the expected paths');
    error_log('Attempted paths: ' . implode(', ', array_filter($possiblePaths)));
    error_log('Current working directory: ' . getcwd());
    error_log('Voice section file: ' . __FILE__);
    echo '<div class="flex-1 bg-discord-background flex items-center justify-center text-white text-lg">VideoSDK configuration file not found</div>';
    return;
}

require_once $configPath;

try {
    VideoSDKConfig::init();
    $config = VideoSDKConfig::getFrontendConfig();
} catch (Exception $e) {
    error_log('VideoSDK initialization error: ' . $e->getMessage());
    error_log('Config path attempted: ' . $configPath);
    echo '<div class="flex-1 bg-discord-background flex items-center justify-center text-white text-lg">VideoSDK configuration error: ' . htmlspecialchars($e->getMessage()) . '</div>';
    return;
}

if (!isset($currentServer) || empty($currentServer)) {
    echo '<div class="flex-1 bg-discord-background flex items-center justify-center text-white text-lg">Select a server to view channels</div>';
    return;
}

$currentServerId = $currentServer->id ?? 0;
$currentUserId = $_SESSION['user_id'] ?? 0;
$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$activeChannel = $GLOBALS['activeChannel'] ?? null;

if (!$activeChannel) {
    echo '<div class="flex-1 bg-discord-background flex items-center justify-center text-white text-lg">Select a voice channel</div>';
    return;
}

$meetingId = 'voice_channel_' . $activeChannelId;
$userName = $_SESSION['username'] ?? 'Anonymous';
?>

<div class="flex flex-col flex-1 h-screen">
    <!-- Voice channel header -->
    <div class="h-12 border-b border-gray-800 flex items-center px-4 shadow-sm">
        <div class="flex items-center">
            <i class="fas fa-volume-high text-gray-400 mr-2"></i>
            <h2 class="font-semibold text-white"><?php echo htmlspecialchars($activeChannel['name'] ?? 'Voice Channel'); ?></h2>
        </div>
        <?php if (!empty($activeChannel['topic'])): ?>
        <div class="border-l border-gray-600 h-6 mx-4"></div>
        <div class="text-sm text-gray-400 truncate"><?php echo htmlspecialchars($activeChannel['topic']); ?></div>
        <?php endif; ?>
        <div class="flex-1"></div>
        <div class="connection-status text-sm mr-4 flex items-center opacity-75">
            <span class="text-yellow-500">•</span> <span class="ml-1">Ready to connect</span>
        </div>
    </div>

    <!-- Voice chat interface -->
    <div class="flex-1 overflow-hidden bg-discord-background flex">
        <!-- Main video grid -->
        <div class="flex-1 flex flex-col">
            <div id="video-grid" class="flex-1 bg-discord-dark p-4 gap-2 flex flex-wrap overflow-auto">
                <div id="loading-indicator" class="w-full h-full flex items-center justify-center text-white">
                    <div class="text-center">
                        <div class="spinner mb-4"></div>
                        <p>Ready to join voice chat</p>
                        <button id="join-call-btn" class="mt-4 bg-discord-primary hover:bg-discord-primary-dark text-white px-4 py-2 rounded-md">
                            <i class="fas fa-phone-alt mr-2"></i> Join Voice Channel
                        </button>
                    </div>
                </div>
            </div>
            
            <div id="voice-controls" class="p-4 bg-discord-dark border-t border-gray-800 hidden">
                <div class="flex justify-center space-x-4">
                    <button id="mic-btn" class="voice-control-btn bg-gray-700 hover:bg-gray-600 active" title="Toggle Microphone">
                        <i class="fas fa-microphone"></i>
                    </button>
                    <button id="camera-btn" class="voice-control-btn bg-gray-700 hover:bg-gray-600 active" title="Toggle Camera">
                        <i class="fas fa-video"></i>
                    </button>
                    <button id="screen-btn" class="voice-control-btn bg-gray-700 hover:bg-gray-600" title="Share Screen">
                        <i class="fas fa-desktop"></i>
                    </button>
                    <button id="leave-btn" class="voice-control-btn bg-red-600 hover:bg-red-700" title="Leave Voice">
                        <i class="fas fa-phone-slash"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Participants sidebar -->
        <div class="w-60 bg-discord-lighten border-l border-gray-800 hidden md:block">
            <div class="p-4">
                <h3 class="text-white font-medium mb-2">Voice Connected <span id="participant-count">(0)</span></h3>
                <div id="participants-list" class="space-y-2">
                    <!-- Connected participants will appear here -->
                    <div class="text-gray-400 text-sm italic">No one is connected yet</div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.2);
    border-top: 4px solid #5865F2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.voice-control-btn {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    transition: all 0.2s;
    cursor: pointer;
}

.voice-control-btn:hover {
    transform: translateY(-2px);
}

.voice-control-btn.active {
    background-color: #5865F2 !important;
}

.voice-control-btn.muted, .voice-control-btn.disabled {
    background-color: #f04747 !important;
}

/* VideoSDK custom styling to match Discord */
#video-grid .videosdk-video {
    border-radius: 8px;
    object-fit: cover;
    background-color: #36393f;
}

.participant-item {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    border-radius: 4px;
    background-color: rgba(79, 84, 92, 0.3);
}

.participant-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
    background-color: #5865F2;
    color: white;
    font-weight: bold;
}

.participant-info {
    flex: 1;
}

.participant-name {
    color: white;
    font-size: 14px;
}

.participant-status {
    font-size: 12px;
    color: #b9bbbe;
}

.participant-controls {
    display: flex;
}

.participant-control-btn {
    background: none;
    border: none;
    color: #b9bbbe;
    cursor: pointer;
    padding: 4px;
}

.participant-control-btn:hover {
    color: white;
}
</style>

<!-- Script for debugging -->
<script>
// No more debug code needed
console.log("Starting voice setup...");
</script>

<!-- Enhanced module system compatibility - must be loaded first -->
<script>
(function() {
    'use strict';
    
    // Comprehensive module system polyfill for VideoSDK compatibility
    console.log('🔧 Setting up enhanced module system compatibility...');
    
    // First, create a safe environment that prevents all module-related errors
    const originalError = console.error;
    const moduleErrors = [];
    
    // Override console.error to catch and suppress module errors early
    console.error = function(...args) {
        const message = args[0];
        if (typeof message === 'string' && 
            (message.includes('exports is not defined') || 
             message.includes('module is not defined') ||
             message.includes('require is not defined') ||
             message.includes('global is not defined'))) {
            moduleErrors.push(message);
            console.log('🛡️ Suppressed module error:', message);
            return;
        }
        originalError.apply(console, args);
    };
    
    // CommonJS compatibility with enhanced features
    if (typeof window.exports === 'undefined') {
        window.exports = {};
        console.log('✓ window.exports polyfill added');
    }
    
    if (typeof window.module === 'undefined') {
        window.module = { 
            exports: window.exports,
            id: 'browser',
            filename: window.location.href,
            loaded: false,            children: [],
            paths: []
        };
        console.log('✓ window.module polyfill added');
    }
    
    if (typeof window.global === 'undefined') {
        window.global = window;
        console.log('✓ window.global polyfill added');
    }
    
    // Enhanced process object for Node.js compatibility
    if (typeof window.process === 'undefined') {
        window.process = {
            env: {},
            nextTick: function(callback) { setTimeout(callback, 0); },
            browser: true,
            version: 'v16.0.0',
            versions: { node: '16.0.0' }
        };
        console.log('✓ window.process polyfill added');
    }
    
    // Buffer polyfill for VideoSDK
    if (typeof window.Buffer === 'undefined') {
        window.Buffer = {
            isBuffer: function() { return false; },
            from: function(data) { return new Uint8Array(data); }
        };
        console.log('✓ window.Buffer polyfill added');
    }
    
    // AMD compatibility (if needed)
    if (typeof window.define === 'undefined') {
        window.define = function(name, deps, callback) {
            if (typeof name === 'function') {
                callback = name;
                deps = [];
                name = undefined;
            } else if (typeof deps === 'function') {
                callback = deps;
                deps = [];
            }
            if (callback && typeof callback === 'function') {
                const result = callback();
                if (result !== undefined) {
                    window.exports = result;
                }
            }
        };
        window.define.amd = true;
        console.log('✓ AMD define polyfill added');
    }
      // Enhanced CommonJS require polyfill with better module resolution
    if (typeof window.require === 'undefined') {
        window.require = function(module) {
            console.warn('CommonJS require() called for:', module);
            
            // Enhanced module resolution for known patterns
            switch (module) {
                case 'events':
                    return { 
                        EventEmitter: class EventEmitter {
                            constructor() { this.events = {}; }
                            on(event, listener) { this.events[event] = this.events[event] || []; this.events[event].push(listener); }
                            emit(event, ...args) { (this.events[event] || []).forEach(fn => fn(...args)); }
                        }
                    };
                case 'util':
                    return { 
                        inherits: function(constructor, superConstructor) {
                            constructor.prototype = Object.create(superConstructor.prototype);
                            constructor.prototype.constructor = constructor;
                        }
                    };
                case 'stream':
                    return { Readable: class {}, Writable: class {}, Transform: class {} };
                case 'crypto':
                    return { 
                        createHash: function() { return { update: function() { return this; }, digest: function() { return 'mock-hash'; } }; }
                    };
                case 'path':
                    return { 
                        join: function(...args) { return args.join('/'); },
                        resolve: function(...args) { return args.join('/'); }
                    };
                case 'fs':
                    return { 
                        readFileSync: function() { throw new Error('fs not available in browser'); },
                        writeFileSync: function() { throw new Error('fs not available in browser'); }
                    };
                default:
                    return window.exports || {};
            }
        };
        console.log('✓ Enhanced CommonJS require polyfill added');
    }
      // Ultra-comprehensive error handling
    const originalErrorHandler = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
        if (message && typeof message === 'string') {
            if (message.includes('exports is not defined') || 
                message.includes('module is not defined') ||
                message.includes('require is not defined') ||
                message.includes('global is not defined') ||
                message.includes('process is not defined') ||
                message.includes('Buffer is not defined')) {
                console.log('🛠️ Module system error caught and suppressed:', message);
                return true; // Prevent default error handling
            }
        }
        
        if (originalErrorHandler) {
            return originalErrorHandler.apply(this, arguments);
        }
        return false;
    };
    
    // Enhanced unhandled promise rejection handler
    window.addEventListener('unhandledrejection', function(event) {
        if (event.reason && event.reason.message) {
            const message = event.reason.message;
            if (message.includes('exports is not defined') ||
                message.includes('module is not defined') ||
                message.includes('require is not defined') ||
                message.includes('global is not defined') ||
                message.includes('process is not defined') ||
                message.includes('Buffer is not defined')) {
                console.log('🛠️ Module system promise rejection suppressed:', message);
                event.preventDefault();
                return;
            }
        }
    });
    
    // Intercept and suppress eval errors related to module system
    const originalEval = window.eval;
    window.eval = function(code) {
        try {
            return originalEval.call(this, code);
        } catch (error) {
            if (error.message && (
                error.message.includes('exports is not defined') ||
                error.message.includes('module is not defined') ||
                error.message.includes('require is not defined'))) {
                console.log('🛠️ Eval module error suppressed:', error.message);
                return undefined;
            }
            throw error;
        }
    };
    
    // Restore original console.error after setup
    setTimeout(() => {
        console.error = originalError;
        if (moduleErrors.length > 0) {
            console.log('🛡️ Suppressed', moduleErrors.length, 'module system errors during setup');
        }
    }, 100);
    
    console.log('✅ Enhanced module system compatibility setup complete');
})();
</script>

<!-- Load VideoSDK properly with proper module system handling -->
<script>
// Create module system compatibility layer BEFORE loading VideoSDK
(function() {
    'use strict';
    
    // Provide module system compatibility for VideoSDK
    if (typeof window.exports === 'undefined') {
        window.exports = {};
    }
    if (typeof window.module === 'undefined') {
        window.module = { exports: window.exports };
    }
    if (typeof window.global === 'undefined') {
        window.global = window;
    }
    
    // Additional CommonJS compatibility
    if (typeof window.require === 'undefined') {
        window.require = function(module) {
            console.warn('CommonJS require() called for:', module);
            return window.exports;
        };
    }
})();

// Configuration validation and debug
const meetingId = "<?php echo $meetingId; ?>";
const userName = "<?php echo addslashes($userName); ?>";
const channelName = "<?php echo addslashes($activeChannel['name'] ?? 'Voice Channel'); ?>";

// Enhanced and defensive VideoSDK configuration validation
let videoSdkConfig = null;
try {
    const configData = <?php echo json_encode($config); ?>;
    console.log('🔍 Raw VideoSDK config received:', configData);
    
    // Enhanced validation with fallback handling
    if (!configData || typeof configData !== 'object') {
        console.error('❌ VideoSDK configuration is invalid or missing');
        throw new Error('VideoSDK configuration is invalid or missing');
    }
    
    // Check for required credentials with detailed logging
    const hasApiKey = configData.apiKey && typeof configData.apiKey === 'string' && configData.apiKey.trim().length > 0;
    const hasToken = configData.token && typeof configData.token === 'string' && configData.token.trim().length > 0;
    
    console.log('🔍 Configuration validation:');
    console.log('  - API Key present:', hasApiKey ? 'YES' : 'NO');
    console.log('  - Token present:', hasToken ? 'YES' : 'NO');
    
    if (!hasApiKey || !hasToken) {
        const missingItems = [];
        if (!hasApiKey) missingItems.push('apiKey');
        if (!hasToken) missingItems.push('token');
        
        const errorMsg = 'VideoSDK credentials missing: ' + missingItems.join(', ') + 
                        '. Please check server configuration.';
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
    }
    
    // Create validated configuration object
    videoSdkConfig = {
        apiKey: configData.apiKey.trim(),
        token: configData.token.trim(),
        isProduction: Boolean(configData.isProduction)
    };
    
    console.log('✅ VideoSDK configuration validated successfully');
    console.log('  - API Key: SET (' + videoSdkConfig.apiKey.substring(0, 8) + '...)');
    console.log('  - Token: SET (' + videoSdkConfig.token.substring(0, 20) + '...)');
    console.log('  - Production Mode:', videoSdkConfig.isProduction);
    
    // Additional validation - ensure no undefined values
    if (!videoSdkConfig.apiKey || !videoSdkConfig.token) {
        throw new Error('Configuration validation failed - credentials became invalid after processing');
    }
    
} catch (error) {
    console.error('❌ VideoSDK configuration error:', error.message);
    videoSdkConfig = null;
}

// State variables
let meeting = null;
let isMicOn = true;
let isCameraOn = true;
let isScreenSharing = false;
let participants = new Map();

// UI elements - initialize with null and query them after DOM is loaded
let micButton = null;
let cameraButton = null;
let screenButton = null;
let leaveButton = null;
let connectionStatus = null;
let joinCallButton = null;
let voiceControls = null;
let loadingIndicator = null;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all UI element references
    micButton = document.getElementById('mic-btn');
    cameraButton = document.getElementById('camera-btn');
    screenButton = document.getElementById('screen-btn');
    leaveButton = document.getElementById('leave-btn');
    connectionStatus = document.querySelector('.connection-status');
    joinCallButton = document.getElementById('join-call-btn');
    voiceControls = document.getElementById('voice-controls');
    loadingIndicator = document.getElementById('loading-indicator');
      if (joinCallButton) {
        joinCallButton.addEventListener('click', function() {
            // Check configuration before attempting to connect
            if (!videoSdkConfig) {
                handleError("VideoSDK configuration not available. Please refresh the page and try again.");
                return;
            }
            
            joinCallButton.disabled = true;
            joinCallButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Connecting...';
            
            // Check if VideoSDK is already loaded
            if (typeof VideoSDKMeeting !== 'undefined') {
                console.log('✓ VideoSDK already loaded, initializing meeting');
                initializeMeeting();
                return;
            }
              console.log('📦 Loading VideoSDK library with enhanced error handling...');
            
            // Temporarily suppress all module-related errors during script load
            const moduleErrorSuppressionActive = true;
            const originalConsoleError = console.error;
            const suppressedErrors = [];
            
            console.error = function(...args) {
                const message = args[0];
                if (moduleErrorSuppressionActive && typeof message === 'string' && 
                    (message.includes('exports is not defined') || 
                     message.includes('module is not defined') ||
                     message.includes('require is not defined') ||
                     message.includes('Any one of') ||
                     message.includes('token') && message.includes('apiKey'))) {
                    suppressedErrors.push(message);
                    console.log('🛡️ Suppressing error during VideoSDK load:', message);
                    return;
                }
                originalConsoleError.apply(console, args);
            };
            
            const script = document.createElement('script');
            script.src = "https://sdk.videosdk.live/rtc-js-prebuilt/0.3.31/rtc-js-prebuilt.js";
            script.async = true;
            
            script.onerror = function(event) {
                console.error = originalConsoleError; // Restore original error handler
                console.error('❌ Failed to load VideoSDK script:', event);
                handleError("Failed to load VideoSDK library. Please check your internet connection and try again.");
                joinCallButton.disabled = false;
                joinCallButton.innerHTML = '<i class="fas fa-phone-alt mr-2"></i> Try Again';
            };
            
            script.onload = function() {
                console.log('✅ VideoSDK script loaded successfully');
                
                // Keep error suppression active for a bit longer to handle initialization
                setTimeout(() => {
                    console.error = originalConsoleError; // Restore original error handler
                    if (suppressedErrors.length > 0) {
                        console.log('🛡️ Suppressed', suppressedErrors.length, 'errors during VideoSDK load');
                    }
                }, 2000);
                
                // Give the script more time to initialize and handle any module conflicts
                setTimeout(function() {
                    console.log('🔍 Checking VideoSDK availability...');
                    console.log('Available VideoSDK objects:', Object.keys(window).filter(key => 
                        key.toLowerCase().includes('video') || key.toLowerCase().includes('sdk')));
                    
                    if (typeof VideoSDKMeeting === 'undefined') {
                        console.error('❌ VideoSDKMeeting class not available after script load');
                        
                        // Try alternative access methods
                        if (window.VideoSDK && window.VideoSDK.VideoSDKMeeting) {
                            window.VideoSDKMeeting = window.VideoSDK.VideoSDKMeeting;
                            console.log('✓ Found VideoSDKMeeting via VideoSDK namespace');
                        } else if (window.rtcJsPrebuilt && window.rtcJsPrebuilt.VideoSDKMeeting) {
                            window.VideoSDKMeeting = window.rtcJsPrebuilt.VideoSDKMeeting;
                            console.log('✓ Found VideoSDKMeeting via rtcJsPrebuilt namespace');
                        } else {
                            handleError("VideoSDK library loaded but VideoSDKMeeting class not found. Please refresh the page and try again.");
                            joinCallButton.disabled = false;
                            joinCallButton.innerHTML = '<i class="fas fa-phone-alt mr-2"></i> Try Again';
                            return;
                        }
                    }
                    
                    console.log('✓ VideoSDKMeeting class confirmed available');
                    initializeMeeting();
                }, 1000);
            };
            
            document.body.appendChild(script);
        });
    }
      setupEventListeners();
    
    // Add configuration validation on page load
    validateConfiguration();
});

function validateConfiguration() {
    console.log('🔍 Validating VideoSDK configuration...');
    
    const issues = [];
    
    if (!videoSdkConfig) {
        issues.push('VideoSDK configuration object is missing');
    } else {
        if (!videoSdkConfig.apiKey) {
            issues.push('VideoSDK API Key is missing');
        }
        if (!videoSdkConfig.token) {
            issues.push('VideoSDK Token is missing');
        }
        
        // Log configuration status
        console.log('📊 Configuration status:');
        console.log('- API Key:', videoSdkConfig.apiKey ? '✓ Present' : '❌ Missing');
        console.log('- Token:', videoSdkConfig.token ? '✓ Present' : '❌ Missing');
        console.log('- Production Mode:', videoSdkConfig.isProduction ? 'Yes' : 'No');
    }
    
    if (!meetingId) {
        issues.push('Meeting ID is missing');
    }
    
    if (!userName) {
        issues.push('User name is missing');
    }
    
    if (issues.length > 0) {
        console.error('❌ Configuration validation failed:');
        issues.forEach(issue => console.error('  -', issue));
        
        // Show warning but don't prevent joining
        if (joinCallButton) {
            joinCallButton.style.opacity = '0.7';
            joinCallButton.title = 'Configuration issues detected: ' + issues.join(', ');
        }
    } else {
        console.log('✅ Configuration validation passed');
    }
}

function initializeMeeting() {
    console.log('🔄 Initializing VideoSDK meeting with enhanced validation...');
    
    // First check if configuration is available
    if (!videoSdkConfig) {
        console.error('❌ VideoSDK configuration is not available');
        handleError("VideoSDK configuration is not available. Please check server configuration and refresh the page.");
        return;
    }
    
    // Check if VideoSDK library is loaded
    if (typeof VideoSDKMeeting === 'undefined') {
        console.error('❌ VideoSDKMeeting class not found');
        console.log('Available VideoSDK objects:', Object.keys(window).filter(key => key.toLowerCase().includes('video')));
        handleError("VideoSDK library not properly loaded. Please refresh the page and try again.");
        return;
    }
    
    try {
        console.log('✓ VideoSDK library and configuration available');
        
        // Enhanced configuration validation with detailed logging
        console.log('🔍 Validating meeting configuration...');
        
        const configValidation = {
            hasApiKey: videoSdkConfig.apiKey && typeof videoSdkConfig.apiKey === 'string' && videoSdkConfig.apiKey.trim().length > 0,
            hasToken: videoSdkConfig.token && typeof videoSdkConfig.token === 'string' && videoSdkConfig.token.trim().length > 0,
            hasMeetingId: meetingId && typeof meetingId === 'string' && meetingId.trim().length > 0,
            hasUserName: userName && typeof userName === 'string' && userName.trim().length > 0
        };
        
        console.log('Configuration validation results:', configValidation);
        
        const missingItems = [];
        if (!configValidation.hasApiKey) missingItems.push('apiKey');
        if (!configValidation.hasToken) missingItems.push('token');
        if (!configValidation.hasMeetingId) missingItems.push('meetingId');
        if (!configValidation.hasUserName) missingItems.push('userName');
        
        if (missingItems.length > 0) {
            const errorMsg = 'Missing required configuration: ' + missingItems.join(', ') + '. Please check server setup.';
            console.error('❌ Configuration validation failed:', errorMsg);
            throw new Error(errorMsg);
        }
        
        const validMeetingId = "misvord-voice-" + meetingId.replace(/[^a-zA-Z0-9]/g, "-");
        console.log('🎯 Creating meeting with validated ID:', validMeetingId);
          // Create meeting configuration object with explicit property assignment
        const meetingConfig = {
            containerId: 'video-grid',
            meetingId: validMeetingId,
            name: userName.trim(),
            micEnabled: true,
            webcamEnabled: false, // Start with camera off by default
            participantId: "user-" + Math.floor(Math.random() * 10000),
            joinScreen: { visible: false },
            
            // Event handlers
            joined: function() {
                console.log('✅ Successfully joined meeting');
                updateConnectionStatus('connected');
                document.getElementById('loading-indicator').style.display = 'none';
                document.getElementById('voice-controls').classList.remove('hidden');
            },
            
            participantJoined: function(participant) {
                console.log('👤 Participant joined:', participant.displayName || participant.id);
                participants.set(participant.id, {
                    id: participant.id,
                    name: participant.displayName || "User",
                    isLocal: participant.isLocal,
                    isMicOn: true,
                    isWebcamOn: true
                });
                updateParticipantsList();
            },
            
            participantLeft: function(participant) {
                console.log('👤 Participant left:', participant.displayName || participant.id);
                participants.delete(participant.id);
                updateParticipantsList();
            },
              error: function(error) {
                console.error('💥 Meeting error:', error);
                updateConnectionStatus('error', error.message);
                handleError("Error in meeting: " + error.message);
            }
        };
        
          console.log('📋 Meeting configuration prepared:');
        console.log('  - Meeting ID:', meetingConfig.meetingId);
        console.log('  - User Name:', meetingConfig.name);
        console.log('  - API Key: AVAILABLE (' + videoSdkConfig.apiKey.substring(0, 8) + '...)');
        console.log('  - Token: AVAILABLE (' + videoSdkConfig.token.substring(0, 20) + '...)');
        console.log('  - Container:', meetingConfig.containerId);
          console.log('📋 Basic meeting configuration:', {
            meetingId: meetingConfig.meetingId,
            name: meetingConfig.name,
            containerId: meetingConfig.containerId
        });
        
        // Create and initialize the meeting
        meeting = new VideoSDKMeeting(meetingConfig);
        
        if (typeof meeting.init === 'function') {
            // Prepare initialization configuration with credentials
            const initConfig = {
                apiKey: videoSdkConfig.apiKey.trim(),
                token: videoSdkConfig.token.trim(),
                meetingId: meetingConfig.meetingId,
                name: meetingConfig.name,
                micEnabled: meetingConfig.micEnabled,
                webcamEnabled: meetingConfig.webcamEnabled,
                participantId: meetingConfig.participantId
            };
            
            console.log('🚀 Initializing meeting with credentials:', {
                apiKey: initConfig.apiKey ? 'SET (' + initConfig.apiKey.substring(0, 8) + '...)' : 'MISSING',
                token: initConfig.token ? 'SET (' + initConfig.token.substring(0, 20) + '...)' : 'MISSING',
                meetingId: initConfig.meetingId,
                name: initConfig.name
            });
            
            meeting.init(initConfig);
            console.log('✅ Meeting initialization started with credentials');
        } else {
            throw new Error('Meeting object does not have init() method');
        }
        
    } catch (error) {
        console.error('❌ Failed to create meeting:', error);
        handleError("Failed to create meeting: " + error.message);
        
        // Reset the join button
        const joinBtn = document.getElementById('join-call-btn');
        if (joinBtn) {
            joinBtn.disabled = false;
            joinBtn.innerHTML = '<i class="fas fa-phone-alt mr-2"></i> Try Again';
        }
    }
}

function setupEventListeners() {
    // Mic toggle
    if (micButton) {
        micButton.addEventListener('click', toggleMic);
    }
    
    // Camera toggle
    if (cameraButton) {
        cameraButton.addEventListener('click', toggleCamera);
    }
    
    // Screen share toggle
    if (screenButton) {
        screenButton.addEventListener('click', toggleScreenShare);
    }
    
    // Leave button
    if (leaveButton) {
        leaveButton.addEventListener('click', leaveVoiceChannel);
    }
}

function toggleMic() {
    if (!meeting) return;
    
    try {
        // For the prebuilt SDK, we need to use toggle methods
        meeting.toggle.mic();
        console.log("Microphone toggled");
        
        // Update the state (it may take a moment for the actual state to change)
        setTimeout(() => {
            if (meeting.localParticipant) {
                isMicOn = meeting.localParticipant.isMicEnabled;
                updateMicButton();
            }
        }, 500);
    } catch (error) {
        console.error("Error toggling mic:", error);
    }
}

function toggleCamera() {
    if (!meeting) return;
    
    try {
        // For the prebuilt SDK, use the toggle methods
        meeting.toggle.webcam();
        console.log("Camera toggled");
        
        // Update the state (it may take a moment for the actual state to change)
        setTimeout(() => {
            if (meeting.localParticipant) {
                isCameraOn = meeting.localParticipant.isWebcamEnabled;
                updateCameraButton();
            }
        }, 500);
    } catch (error) {
        console.error("Error toggling camera:", error);
    }
}

function toggleScreenShare() {
    if (!meeting) return;
    
    try {
        // For the prebuilt SDK, use the toggle methods
        meeting.toggle.screenShare();
        console.log("Screen sharing toggled");
        
        // Update state after a delay to allow the operation to complete
        setTimeout(() => {
            if (meeting.localParticipant) {
                isScreenSharing = meeting.presenterId === meeting.localParticipant.id;
                updateScreenButton();
            }
        }, 500);
    } catch (error) {
        console.error("Error toggling screen share:", error);
    }
}

function leaveVoiceChannel() {
    if (!meeting) return;
    
    try {
        // For the prebuilt SDK
        meeting.leave();
        console.log("Left meeting");
        
        // Redirect back to text channel of the same server
        const serverId = "<?php echo $currentServerId; ?>";
        const firstTextChannel = findFirstTextChannel();
        
        if (firstTextChannel) {
            window.location.href = `/server/${serverId}?channel=${firstTextChannel}`;
        } else {
            window.location.href = `/server/${serverId}`;
        }
    } catch (error) {
        console.error("Error leaving voice channel:", error);
    }
}

function findFirstTextChannel() {
    // Try to find a text channel in the sidebar
    const channelItems = document.querySelectorAll('.channel-item[data-channel-type="text"]');
    if (channelItems.length > 0) {
        return channelItems[0].getAttribute('data-channel-id');
    }
    return null;
}

function updateMicButton() {
    if (!micButton) return;
    
    if (isMicOn) {
        micButton.classList.add('active');
        micButton.classList.remove('muted');
        micButton.innerHTML = '<i class="fas fa-microphone"></i>';
    } else {
        micButton.classList.remove('active');
        micButton.classList.add('muted');
        micButton.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    }
}

function updateCameraButton() {
    if (!cameraButton) return;
    
    if (isCameraOn) {
        cameraButton.classList.add('active');
        cameraButton.classList.remove('disabled');
        cameraButton.innerHTML = '<i class="fas fa-video"></i>';
    } else {
        cameraButton.classList.remove('active');
        cameraButton.classList.add('disabled');
        cameraButton.innerHTML = '<i class="fas fa-video-slash"></i>';
    }
}

function updateScreenButton() {
    if (!screenButton) return;
    
    if (isScreenSharing) {
        screenButton.classList.add('active');
    } else {
        screenButton.classList.remove('active');
    }
}

function updateConnectionStatus(status, message = null) {
    if (!connectionStatus) return;
    
    let statusText = '';
    let statusClass = '';
    
    switch(status) {
        case 'connecting':
            statusText = '• Connecting...';
            statusClass = 'text-yellow-500';
            break;
        case 'connected':
            statusText = '• Connected to voice';
            statusClass = 'text-green-500';
            break;
        case 'disconnected':
            statusText = '• Disconnected';
            statusClass = 'text-gray-500';
            break;
        case 'error':
            statusText = '• ' + (message || 'Error connecting');
            statusClass = 'text-red-500';
            break;
        default:
            statusText = '• ' + status;
            statusClass = 'text-yellow-500';
    }
    
    connectionStatus.innerHTML = '<span class="' + statusClass + '">' + statusText + '</span>';
}

function updateParticipantsList() {
    const participantsList = document.getElementById('participants-list');
    const participantCount = document.getElementById('participant-count');
    
    if (!participantsList || !participantCount) return;
    
    // Update count
    participantCount.textContent = `(${participants.size})`;
    
    // Clear list
    participantsList.innerHTML = '';
    
    if (participants.size === 0) {
        participantsList.innerHTML = '<div class="text-gray-400 text-sm italic">No one is connected yet</div>';
        return;
    }
    
    // Add each participant
    participants.forEach(participant => {
        const item = document.createElement('div');
        item.className = 'participant-item';
        item.dataset.participantId = participant.id;
        
        // Get first letter of name for avatar
        const initial = participant.name.charAt(0).toUpperCase();
        
        item.innerHTML = '<div class="participant-avatar">' + initial + '</div>' +
            '<div class="participant-info">' +
            '<div class="participant-name">' + participant.name + (participant.isLocal ? ' (you)' : '') + '</div>' +
            '<div class="participant-status">Speaking</div>' +
            '</div>' +
            '<div class="participant-controls">' +
            (participant.isLocal ? '' : 
            '<button class="participant-control-btn" title="' + (participant.isMicOn ? 'Mute' : 'Unmute') + '">' +
            '<i class="fas fa-' + (participant.isMicOn ? 'microphone' : 'microphone-slash') + '"></i>' +
            '</button>' +
            '<button class="participant-control-btn" title="' + (participant.isWebcamOn ? 'Turn off camera' : 'Turn on camera') + '">' +
            '<i class="fas fa-' + (participant.isWebcamOn ? 'video' : 'video-slash') + '"></i>' +
            '</button>') +
            '</div>';
        
        participantsList.appendChild(item);
    });
}

function handleError(message, details = null) {
    console.error('🚨 Voice chat error:', message);
    if (details) {
        console.error('🔍 Error details:', details);
    }
    
    if (loadingIndicator) {
        let errorHtml = 
            '<div class="text-center p-4">' +
            '<i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>' +
            '<p class="text-lg text-red-400 mb-2">' + message + '</p>';
        
        // Add debug information if in development
        if (!videoSdkConfig || !videoSdkConfig.isProduction) {
            errorHtml += '<div class="text-xs text-gray-500 mt-4 p-2 bg-gray-800 rounded">';
            errorHtml += '<p><strong>Debug Info:</strong></p>';
            errorHtml += '<p>Config available: ' + (videoSdkConfig ? 'Yes' : 'No') + '</p>';
            if (videoSdkConfig) {
                errorHtml += '<p>API Key: ' + (videoSdkConfig.apiKey ? 'Set' : 'Missing') + '</p>';
                errorHtml += '<p>Token: ' + (videoSdkConfig.token ? 'Set' : 'Missing') + '</p>';
            }
            errorHtml += '<p>VideoSDK Loaded: ' + (typeof VideoSDKMeeting !== 'undefined' ? 'Yes' : 'No') + '</p>';
            if (details && typeof details === 'string') {
                errorHtml += '<p>Details: ' + details + '</p>';
            }
            errorHtml += '</div>';
        }
        
        errorHtml += 
            '<div class="mt-4 space-x-2">' +
            '<button id="retry-button" class="bg-discord-primary hover:bg-discord-primary-dark text-white py-2 px-4 rounded transition-colors">' +
            '<i class="fas fa-redo mr-2"></i>Try Again' +
            '</button>' +
            '<button id="refresh-button" class="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors">' +
            '<i class="fas fa-refresh mr-2"></i>Refresh Page' +
            '</button>' +
            '</div>' +
            '</div>';
            
        loadingIndicator.innerHTML = errorHtml;
        
        // Add event listeners
        const retryButton = document.getElementById('retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', function() {
                // Reset and try again
                const joinBtn = document.getElementById('join-call-btn');
                if (joinBtn) {
                    joinBtn.disabled = false;
                    joinBtn.innerHTML = '<i class="fas fa-phone-alt mr-2"></i> Join Voice Channel';
                    joinBtn.click();
                }
            });
        }
        
        const refreshButton = document.getElementById('refresh-button');
        if (refreshButton) {
            refreshButton.addEventListener('click', function() {
                window.location.reload();
            });
        }
    }
    
    if (voiceControls) voiceControls.classList.add('hidden');
    
    // Update connection status
    updateConnectionStatus('error', message);
}
</script>
