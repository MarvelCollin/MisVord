<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

// Load environment loader first
require_once dirname(dirname(__DIR__)) . '/config/env.php';

require_once dirname(dirname(__DIR__)) . '/config/videosdk.php';

$page_title = 'MiscVord - Video Call';
$body_class = 'bg-gray-900 text-white overflow-hidden';

// Initialize VideoSDK configuration
$videoSDKConfig = null;
try {
    VideoSDKConfig::init();
    $videoSDKConfig = VideoSDKConfig::getFrontendConfig();
    
    // Debug: ensure we have the required config
    if (!$videoSDKConfig || !isset($videoSDKConfig['apiKey']) || !isset($videoSDKConfig['token'])) {
        throw new Exception('VideoSDK configuration incomplete - missing apiKey or token');
    }
    
    // Debug output
    error_log('DEBUG: VideoSDK config loaded successfully - API Key: ' . substr($videoSDKConfig['apiKey'] ?? 'missing', 0, 8) . '...');
    
} catch (Exception $e) {
    error_log('VideoSDK Configuration Error: ' . $e->getMessage());
    
    // Fallback: try to get credentials directly
    try {
        $envVars = EnvLoader::getEnv();
        if (isset($envVars['VIDEOSDK_API_KEY']) && isset($envVars['VIDEOSDK_SECRET_KEY'])) {
            // Create minimal config directly
            $videoSDKConfig = [
                'apiKey' => $envVars['VIDEOSDK_API_KEY'],
                'token' => VideoSDKConfig::generateToken(),
                'isProduction' => false,
                'domain' => 'localhost'
            ];
            error_log('DEBUG: VideoSDK fallback config created - API Key: ' . substr($videoSDKConfig['apiKey'], 0, 8) . '...');
        }
    } catch (Exception $fallbackError) {
        error_log('VideoSDK Fallback Error: ' . $fallbackError->getMessage());
        $videoSDKConfig = null;
    }
}

// Final check and debug
if (!$videoSDKConfig) {
    error_log('CRITICAL: VideoSDK config is null in call.php');
} else {
    error_log('SUCCESS: VideoSDK config ready for frontend');
}

// Environment detection for proper URL configuration
$is_production = getenv('APP_ENV') === 'production';
$is_vps = getenv('IS_VPS') === 'true';
$use_https = getenv('USE_HTTPS') === 'true';
$domain = getenv('DOMAIN') ?: 'localhost';

// Protocol detection
$is_https = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || 
            (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
            (isset($_SERVER['HTTP_X_FORWARDED_SSL']) && $_SERVER['HTTP_X_FORWARDED_SSL'] === 'on');
$protocol = $is_https ? 'https' : 'http';

// Build the additional head content with proper escaping
$additional_head = '';
$additional_head .= '<!-- VideoSDK Configuration -->' . "\n";
$additional_head .= '<meta name="videosdk-api-key" content="' . ($videoSDKConfig ? htmlspecialchars($videoSDKConfig['apiKey'], ENT_QUOTES, 'UTF-8') : '') . '">' . "\n";
$additional_head .= '<meta name="videosdk-token" content="' . ($videoSDKConfig ? htmlspecialchars($videoSDKConfig['token'], ENT_QUOTES, 'UTF-8') : '') . '">' . "\n";
$additional_head .= '<meta name="app-domain" content="' . htmlspecialchars($domain, ENT_QUOTES, 'UTF-8') . '">' . "\n";
$additional_head .= '<meta name="app-protocol" content="' . htmlspecialchars($protocol, ENT_QUOTES, 'UTF-8') . '">' . "\n";
$additional_head .= "\n<!-- VideoSDK Styles -->\n";
$additional_head .= '<style>
    .video-call-container {
        height: 100vh;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        position: relative;
        overflow: hidden;
    }
    
    .video-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
        padding: 1rem;
        height: calc(100vh - 120px);
        overflow-y: auto;
    }
    
    .video-tile {
        position: relative;
        background: #2d3748;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        min-height: 225px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .video-tile:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    }
    
    .video-tile.local {
        border: 2px solid #4CAF50;
    }
    
    .video-tile.remote {
        border: 2px solid #2196F3;
    }
    
    .video-tile.screen-share {
        grid-column: 1 / -1;
        min-height: 400px;
        border: 2px solid #FF9800;
    }
    
    .video-element {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 10px;
    }
    
    .video-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #718096;
        font-size: 1.2rem;
    }
    
    .video-placeholder .icon {
        font-size: 3rem;
        margin-bottom: 0.5rem;
    }
    
    .participant-name {
        position: absolute;
        bottom: 12px;
        left: 12px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .participant-status {
        position: absolute;
        top: 12px;
        right: 12px;
        display: flex;
        gap: 6px;
    }
    
    .status-indicator {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
    }
    
    .status-indicator.mic-on { background: #4CAF50; }
    .status-indicator.mic-off { background: #F44336; }
    .status-indicator.cam-on { background: #2196F3; }
    .status-indicator.cam-off { background: #757575; }
    
    .controls-panel {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(26, 32, 44, 0.9);
        backdrop-filter: blur(10px);
        padding: 16px 24px;
        border-radius: 50px;
        display: flex;
        gap: 12px;
        align-items: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .control-btn {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        cursor: pointer;
        transition: all 0.3s ease;
        color: white;
    }
    
    .control-btn:hover {
        transform: translateY(-2px);
    }
    
    .control-btn.mic-on { background: #4CAF50; }
    .control-btn.mic-off { background: #F44336; }
    .control-btn.cam-on { background: #2196F3; }
    .control-btn.cam-off { background: #757575; }
    .control-btn.screen-share { background: #FF9800; }
    .control-btn.screen-share.active { background: #E65100; }
    .control-btn.leave { background: #F44336; }
    
    .join-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    }
    
    .join-form {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        padding: 2rem;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        text-align: center;
        max-width: 400px;
        width: 90%;
    }
    
    .join-form h2 {
        margin-bottom: 1.5rem;
        color: white;
        font-size: 1.8rem;
        font-weight: 600;
    }
    
    .form-group {
        margin-bottom: 1.5rem;
    }
    
    .form-group input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 1rem;
    }
    
    .form-group input::placeholder {
        color: rgba(255, 255, 255, 0.7);
    }
    
    .form-group input:focus {
        outline: none;
        border-color: #4CAF50;
    }
    
    .join-btn {
        width: 100%;
        padding: 12px 24px;
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .join-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(76, 175, 80, 0.3);
    }
    
    .join-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }
    
    .error-message {
        background: rgba(244, 67, 54, 0.1);
        border: 1px solid rgba(244, 67, 54, 0.3);
        color: #FF6B6B;
        padding: 12px 16px;
        border-radius: 10px;
        margin-bottom: 1rem;
        text-align: center;
    }
    
    @media (max-width: 768px) {
        .video-grid {
            grid-template-columns: 1fr;
            padding: 0.5rem;
            height: calc(100vh - 100px);
        }
        
        .video-tile {
            min-height: 200px;
        }
        
        .controls-panel {
            padding: 12px 16px;
            gap: 8px;
        }
        
        .control-btn {
            width: 40px;
            height: 40px;
            font-size: 1rem;
        }
        
        .join-form {
            margin: 1rem;
            width: calc(100% - 2rem);
        }
    }
</style>';

ob_start();
?>

<div id="app" class="video-call-container">
    <!-- Loading State -->
    <div id="loading-state" class="join-container">
        <div class="join-form">
            <h2>🔄 Loading MiscVord...</h2>
            <p>Setting up your video calling experience</p>
        </div>
    </div>

    <!-- Join Form -->
    <div id="join-form" class="join-container" style="display: none;">
        <div class="join-form">
            <h2>🎥 Join Video Call</h2>
            <div id="error-container"></div>
            <form id="meeting-form">
                <div class="form-group">
                    <input 
                        type="text" 
                        id="meeting-id" 
                        placeholder="Enter Meeting ID (optional)" 
                        maxlength="50"
                    >
                </div>
                <div class="form-group">
                    <input 
                        type="text" 
                        id="participant-name" 
                        placeholder="Your Name" 
                        required 
                        maxlength="30"
                    >
                </div>
                <button type="submit" id="join-btn" class="join-btn">
                    📹 Start Video Call
                </button>
            </form>
        </div>
    </div>

    <!-- Video Call Interface -->
    <div id="video-interface" style="display: none;">
        <!-- Video Grid -->
        <div id="video-grid" class="video-grid">
            <!-- Video tiles will be dynamically added here -->
        </div>

        <!-- Controls Panel -->
        <div class="controls-panel">
            <button id="mic-btn" class="control-btn mic-on" title="Mute/Unmute">
                🎤
            </button>
            <button id="cam-btn" class="control-btn cam-on" title="Camera On/Off">
                📹
            </button>
            <button id="screen-btn" class="control-btn screen-share" title="Share Screen">
                📺
            </button>
            <button id="leave-btn" class="control-btn leave" title="Leave Call">
                📞
            </button>
        </div>
    </div>
</div>

<!-- VideoSDK Script - Latest Version with Aggressive Cache Busting -->
<script>
// CRITICAL: Completely clear any old VideoSDK versions and force latest
(function() {
    // Clear any existing VideoSDK from global scope
    if (window.VideoSDK) {
        console.warn('⚠️ Clearing existing VideoSDK instance');
        delete window.VideoSDK;
    }
    
    // Remove any existing VideoSDK scripts
    const existingScripts = document.querySelectorAll('script[src*="videosdk"]');
    existingScripts.forEach(script => {
        console.warn('⚠️ Removing existing VideoSDK script:', script.src);
        script.remove();
    });
    
    // Force browser cache refresh with multiple cache-busting parameters
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const version = '0.2.7';
    
    // Create new script with aggressive cache busting
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = false; // Load synchronously to ensure order
    script.src = `https://sdk.videosdk.live/js-sdk/${version}/videosdk.js?v=${timestamp}&r=${random}&bust=${Date.now()}&force=true&nocache=1`;
    
    script.onload = function() {
        console.log('✅ VideoSDK v' + version + ' loaded successfully from primary CDN');
        console.log('📦 VideoSDK object:', window.VideoSDK);
        if (window.VideoSDK) {
            console.log('🔍 VideoSDK version check:', window.VideoSDK.version || 'version property not available');
            console.log('🔧 Available methods:', Object.getOwnPropertyNames(window.VideoSDK).filter(prop => typeof window.VideoSDK[prop] === 'function'));
            
            // Verify this is the correct version by checking for v2 API methods
            if (typeof window.VideoSDK.config === 'function' && typeof window.VideoSDK.initMeeting === 'function') {
                console.log('✅ VideoSDK v2 API methods confirmed');
            } else {
                console.error('❌ VideoSDK v2 API methods missing - wrong version loaded');
            }
        }
    };
    
    script.onerror = function(error) {
        console.error('❌ Failed to load VideoSDK from primary CDN:', error);
        console.log('🔄 Trying alternative CDN...');
        
        // Try alternative CDN sources
        const fallbackSources = [
            `https://cdn.jsdelivr.net/npm/@videosdk.live/js-sdk@${version}/dist/videosdk.min.js?v=${timestamp}&r=${random}`,
            `https://unpkg.com/@videosdk.live/js-sdk@${version}/dist/videosdk.min.js?v=${timestamp}&r=${random}`,
            `https://sdk.videosdk.live/js-sdk/${version}/videosdk.min.js?v=${timestamp}&r=${random}`
        ];
        
        let currentFallback = 0;
        
        function tryFallback() {
            if (currentFallback >= fallbackSources.length) {
                console.error('❌ All VideoSDK sources failed');
                const errorMsg = 'Failed to load VideoSDK from all sources. Please check your internet connection and try again.';
                document.getElementById('loading-state').innerHTML = `<div class="join-form"><h2>❌ Loading Error</h2><p>${errorMsg}</p><button onclick="location.reload()">🔄 Retry</button></div>`;
                return;
            }
            
            const fallbackScript = document.createElement('script');
            fallbackScript.type = 'text/javascript';
            fallbackScript.src = fallbackSources[currentFallback];
            
            fallbackScript.onload = function() {
                console.log(`✅ VideoSDK loaded from fallback CDN #${currentFallback + 1}`);
                if (window.VideoSDK) {
                    console.log('📦 VideoSDK object from fallback:', window.VideoSDK);
                }
            };
            
            fallbackScript.onerror = function() {
                console.warn(`⚠️ Fallback CDN #${currentFallback + 1} failed`);
                currentFallback++;
                setTimeout(tryFallback, 500); // Brief delay before next attempt
            };
            
            document.head.appendChild(fallbackScript);
        }
        
        tryFallback();
    };
    
    // Add to head and start loading
    console.log('🚀 Loading VideoSDK v' + version + ' with cache-busting...');
    document.head.appendChild(script);
})();
</script>

<script>
/**
 * MiscVord VideoSDK Integration
 * Complete video calling solution with voice, video, and screen sharing
 */

class MiscVordVideoCall {
    constructor() {
        this.meeting = null;
        this.participants = new Map();
        this.localMicOn = true;
        this.localWebcamOn = true;
        this.isScreenSharing = false;
        this.meetingId = null;
        this.participantName = '';
        
        // Get configuration from meta tags
        this.apiKey = document.querySelector('meta[name="videosdk-api-key"]')?.content;
        this.token = document.querySelector('meta[name="videosdk-token"]')?.content;
        
        // Debug configuration values
        console.log('🔑 VideoSDK API Key:', this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'MISSING');
        console.log('🎫 VideoSDK Token:', this.token ? 'Present (' + this.token.length + ' chars)' : 'MISSING');
        
        if (!this.apiKey || this.apiKey.trim() === '') {
            this.showError('VideoSDK API Key not found. Please check your .env file contains VIDEOSDK_API_KEY.');
            return;
        }
        
        if (!this.token || this.token.trim() === '') {
            this.showError('VideoSDK Token not found. Please check your .env file contains VIDEOSDK_SECRET_KEY.');
            return;
        }
          this.init();
    }
    
    init() {
        console.log('🚀 Initializing MiscVord VideoCall');
        
        // Wait for VideoSDK to be available (in case it's still loading)
        const waitForVideoSDK = () => {
            if (typeof window.VideoSDK !== 'undefined') {
                this.initializeVideoSDK();
            } else {
                console.log('⏳ Waiting for VideoSDK to load...');
                setTimeout(waitForVideoSDK, 100);
            }
        };
        
        waitForVideoSDK();
    }
      initializeVideoSDK() {
        console.log('🔍 Starting VideoSDK initialization...');
        
        // Extensive debugging of VideoSDK state
        console.log('🔍 VideoSDK Debug Information:');
        console.log('- VideoSDK available:', typeof window.VideoSDK !== 'undefined');
        console.log('- VideoSDK object:', window.VideoSDK);
        console.log('- Window location:', window.location.href);
        
        if (window.VideoSDK) {
            console.log('- VideoSDK constructor type:', typeof window.VideoSDK);
            console.log('- VideoSDK properties:', Object.getOwnPropertyNames(window.VideoSDK));
            console.log('- VideoSDK methods:', Object.getOwnPropertyNames(window.VideoSDK).filter(prop => typeof window.VideoSDK[prop] === 'function'));
            
            // Try to get version info
            if (window.VideoSDK.version) {
                console.log('- VideoSDK version:', window.VideoSDK.version);
            } else if (window.VideoSDK.VERSION) {
                console.log('- VideoSDK VERSION:', window.VideoSDK.VERSION);
            } else {
                console.log('- VideoSDK version: Not available');
            }
        }
        
        // Ensure VideoSDK is available
        if (!window.VideoSDK) {
            const errorMsg = 'VideoSDK library not loaded. This could be due to network issues or browser blocking the script.';
            console.error('❌ ' + errorMsg);
            this.showError(errorMsg + ' Please check your internet connection and try refreshing the page.');
            return;
        }
        
        // Check for required v2 API methods
        const requiredMethods = ['config', 'initMeeting'];
        const availableMethods = requiredMethods.filter(method => typeof window.VideoSDK[method] === 'function');
        const missingMethods = requiredMethods.filter(method => typeof window.VideoSDK[method] !== 'function');
        
        console.log('✅ Available VideoSDK methods:', availableMethods);
        if (missingMethods.length > 0) {
            console.error('❌ Missing VideoSDK methods:', missingMethods);
        }
        
        // Check if this looks like the old v1 API that uses the deprecated endpoint
        if (typeof window.VideoSDK.config !== 'function') {
            const errorMsg = 'VideoSDK v1 API detected! This version uses deprecated endpoints. The latest v2 API is required.';
            console.error('❌ ' + errorMsg);
            console.log('🔧 Attempting to force reload latest VideoSDK...');
            
            // Force reload the page to clear any cached scripts
            if (confirm('VideoSDK v1 detected (uses deprecated endpoints). Force reload to get latest version?')) {
                window.location.reload(true);
            }
            
            this.showError(errorMsg + ' Please clear your browser cache completely and refresh the page.');
            return;
        }
        
        // Additional validation - check if config method exists and is callable
        try {
            if (typeof window.VideoSDK.config === 'function') {
                console.log('✅ VideoSDK.config method is available and callable');
            } else {
                throw new Error('VideoSDK.config is not a function');
            }
        } catch (validationError) {
            console.error('❌ VideoSDK method validation failed:', validationError);
            this.showError('VideoSDK API validation failed: ' + validationError.message);
            return;
        }
        
        // Configure VideoSDK with token
        try {
            console.log('🔧 Configuring VideoSDK with token...');
            console.log('🎫 Token (first 20 chars):', this.token.substring(0, 20) + '...');
            
            window.VideoSDK.config(this.token);
            
            console.log('✅ VideoSDK configured successfully');
            console.log('🎯 VideoSDK should now use v2 API endpoints (e.g., /v2/rooms)');
            
        } catch (configError) {
            console.error('❌ VideoSDK configuration error:', configError);
            this.showError('Failed to configure VideoSDK: ' + configError.message);
            return;
        }
        
        // Hide loading and show join form
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('join-form').style.display = 'flex';
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('🎉 VideoSDK initialization completed successfully');
    }
    
    setupEventListeners() {
        // Meeting form submission
        document.getElementById('meeting-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.joinMeeting();
        });
        
        // Control buttons
        document.getElementById('mic-btn').addEventListener('click', () => this.toggleMic());
        document.getElementById('cam-btn').addEventListener('click', () => this.toggleWebcam());
        document.getElementById('screen-btn').addEventListener('click', () => this.toggleScreenShare());
        document.getElementById('leave-btn').addEventListener('click', () => this.leaveMeeting());
    }
    
    async joinMeeting() {
        try {
            // Get form values
            const meetingIdInput = document.getElementById('meeting-id').value.trim();
            const participantNameInput = document.getElementById('participant-name').value.trim();
            
            if (!participantNameInput) {
                this.showError('Please enter your name');
                return;
            }
            
            this.participantName = participantNameInput;
              // Show joining state
            document.getElementById('join-btn').textContent = 'Joining...';
            document.getElementById('join-btn').disabled = true;
            
            // Request media permissions first
            console.log('🎥 Requesting camera and microphone permissions...');
            try {
                await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                console.log('✅ Media permissions granted');
            } catch (permError) {
                console.warn('⚠️ Media permission denied:', permError);
                // Continue with meeting join but disable media initially
                this.localMicOn = false;
                this.localWebcamOn = false;
                this.showError('Media permissions denied. You can enable them later in the call.');
            }
            
            // Create or join meeting
            if (meetingIdInput) {
                // Join existing meeting
                this.meetingId = meetingIdInput;
            } else {
                // Create new meeting
                this.meetingId = await this.createMeeting();
            }
              // Initialize meeting
            console.log('🔧 Initializing VideoSDK meeting...');
            console.log('📝 Meeting config:', {
                meetingId: this.meetingId,
                name: this.participantName,
                micEnabled: this.localMicOn,
                webcamEnabled: this.localWebcamOn
            });
            
            this.meeting = window.VideoSDK.initMeeting({
                meetingId: this.meetingId,
                name: this.participantName,
                micEnabled: this.localMicOn,
                webcamEnabled: this.localWebcamOn
            });
            
            if (!this.meeting) {
                throw new Error('Failed to initialize VideoSDK meeting');
            }
            
            console.log('✅ Meeting initialized successfully');
            
            // Setup meeting event listeners
            this.setupMeetingEventListeners();
            
            // Join the meeting
            console.log('🚪 Joining meeting...');
            this.meeting.join();
            
        } catch (error) {
            console.error('❌ Failed to join meeting:', error);
            this.showError('Failed to join meeting: ' + error.message);
            document.getElementById('join-btn').textContent = '📹 Start Video Call';
            document.getElementById('join-btn').disabled = false;
        }
    }    async createMeeting() {
        try {
            console.log('🔑 Creating new meeting room...');
            console.log('🎫 Using token:', this.token.substring(0, 20) + '...');
            
            const response = await fetch('https://api.videosdk.live/v2/rooms', {
                method: 'POST',
                headers: {
                    'Authorization': this.token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    // Optional: Set region for better performance
                    region: 'sg001', // Singapore region for better latency in Asia
                    // Optional: Set custom meeting options
                    customRoomId: null, // Let VideoSDK generate unique ID
                })
            });
            
            console.log('📡 Create meeting API response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error Response:', errorText);
                
                // Handle specific API errors
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please check your VideoSDK credentials.');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again in a moment.');
                } else {
                    throw new Error(`Failed to create meeting: ${response.status} ${response.statusText} - ${errorText}`);
                }
            }
            
            const data = await response.json();
            console.log('✅ Meeting room created successfully:', data);
            console.log('🎯 Room ID:', data.roomId);
            console.log('🌐 Meeting will use v2 API endpoints');
            
            return data.roomId;
            
        } catch (error) {
            console.error('❌ Error creating meeting room:', error);
            
            // Provide user-friendly error messages
            if (error.message.includes('fetch')) {
                throw new Error('Network error. Please check your internet connection and try again.');
            } else if (error.message.includes('Authentication')) {
                throw new Error('VideoSDK authentication failed. Please contact support.');
            } else {
                throw error;
            }
        }
    }    setupMeetingEventListeners() {
        console.log('🔗 Setting up meeting event listeners for real-time functionality...');
        
        // Meeting joined successfully
        this.meeting.on('meeting-joined', () => {
            console.log('✅ Successfully joined meeting');
            this.onMeetingJoined();
        });
        
        // New participant joined (real-time)
        this.meeting.on('participant-joined', (participant) => {
            console.log('👥 New participant joined:', participant.displayName, participant.id);
            this.onParticipantJoined(participant);
        });
        
        // Participant left (real-time)
        this.meeting.on('participant-left', (participant) => {
            console.log('👋 Participant left:', participant.displayName, participant.id);
            this.onParticipantLeft(participant);
        });

        // Stream events for real-time media updates
        this.meeting.on('stream-enabled', (stream) => {
            console.log('📹 Stream enabled in real-time:', stream.kind, 'from participant:', stream.participantId);
            this.onStreamEnabled(stream);
        });

        this.meeting.on('stream-disabled', (stream) => {
            console.log('📹 Stream disabled in real-time:', stream.kind, 'from participant:', stream.participantId);
            this.onStreamDisabled(stream);
        });

        // Meeting left
        this.meeting.on('meeting-left', () => {
            console.log('👋 Left meeting successfully');
            this.onMeetingLeft();
        });

        // Meeting state changes for better debugging
        this.meeting.on('meeting-state-changed', (data) => {
            console.log('🔄 Meeting state changed:', data.state);
            if (data.state === 'CONNECTED') {
                console.log('🌐 Meeting connection established - ready for real-time communication');
            }
        });

        // Screen sharing events (real-time)
        this.meeting.on('presenter-changed', (activePresenterId) => {
            console.log('📺 Screen share presenter changed:', activePresenterId);
            if (activePresenterId) {
                console.log('🖥️ Screen sharing started by participant:', activePresenterId);
            } else {
                console.log('🛑 Screen sharing stopped');
                this.removeScreenShare('all'); // Remove any active screen shares
            }
        });

        // Webcam state changes (real-time)
        this.meeting.on('webcam-state-changed', (data) => {
            console.log('📷 Webcam state changed:', data.participantId, data.status);
            this.updateCameraStatus(data.participantId, data.status === 'WEBCAM_ENABLED');
        });

        // Microphone state changes (real-time)
        this.meeting.on('mic-state-changed', (data) => {
            console.log('🎤 Microphone state changed:', data.participantId, data.status);
            this.updateMicStatus(data.participantId, data.status === 'MIC_ENABLED');
        });

        // Error handling for real-time issues
        this.meeting.on('error', (error) => {
            console.error('❌ Real-time meeting error:', error);
            this.showError('Meeting error: ' + error.message);
        });

        // Connection quality events
        this.meeting.on('connection-change', (data) => {
            console.log('🌐 Connection quality changed:', data.status);
            if (data.status === 'POOR' || data.status === 'VERY_POOR') {
                this.showWarning('Poor connection detected. Video quality may be reduced.');
            }
        });

        // Recording events (if you plan to add recording)
        this.meeting.on('recording-state-changed', (data) => {
            console.log('🔴 Recording state changed:', data.status);
        });

        console.log('✅ All real-time event listeners configured');
    }
      onMeetingJoined() {
        console.log('🎉 Meeting joined successfully - setting up real-time interface...');
        
        // Hide join form and show video interface
        document.getElementById('join-form').style.display = 'none';
        document.getElementById('video-interface').style.display = 'block';
        
        // Add local participant first
        this.addVideoTile('local', this.participantName, true);
        
        // Setup local video stream if webcam is enabled
        this.setupLocalVideo();
        
        // Add existing participants (in case we joined a meeting in progress)
        const existingParticipants = this.meeting.participants;
        if (existingParticipants && existingParticipants.size > 0) {
            console.log('👥 Found', existingParticipants.size, 'existing participants in meeting');
            existingParticipants.forEach((participant, participantId) => {
                console.log('➕ Adding existing participant:', participant.displayName, participantId);
                this.onParticipantJoined(participant);
            });
        }
        
        // Display meeting info for users
        this.showMeetingInfo();
        
        console.log('✅ Real-time video interface ready');
    }

    showMeetingInfo() {
        // Show meeting ID so others can join
        const meetingInfo = document.createElement('div');
        meetingInfo.id = 'meeting-info';
        meetingInfo.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-family: monospace;
            z-index: 100;
            max-width: 300px;
        `;
        meetingInfo.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px;">📋 Meeting Info</div>
            <div><strong>Meeting ID:</strong> ${this.meetingId}</div>
            <div><strong>Participants:</strong> <span id="participant-count">${this.participants.size + 1}</span></div>
            <div style="margin-top: 10px; font-size: 12px; opacity: 0.8;">
                Share this Meeting ID with others to join
            </div>
            <button onclick="this.parentElement.style.display='none'" style="
                position: absolute;
                top: 5px;
                right: 5px;
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                font-size: 16px;
            ">×</button>
        `;
        
        // Remove existing info if present
        const existingInfo = document.getElementById('meeting-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        document.body.appendChild(meetingInfo);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (meetingInfo.parentElement) {
                meetingInfo.style.opacity = '0.5';
            }
        }, 10000);
    }

    updateParticipantCount() {
        const countElement = document.getElementById('participant-count');
        if (countElement) {
            countElement.textContent = this.participants.size + 1; // +1 for local participant
        }
    }
    
    onMeetingLeft() {
        console.log('👋 Meeting left, cleaning up...');
        
        // Reset local state
        this.meeting = null;
        this.participants.clear();
        this.localMicOn = true;
        this.localWebcamOn = true;
        this.isScreenSharing = false;
        
        // Clear video grid
        document.getElementById('video-grid').innerHTML = '';
        
        // Show join form again
        document.getElementById('video-interface').style.display = 'none';
        document.getElementById('join-form').style.display = 'flex';
        
        // Reset form
        document.getElementById('join-btn').textContent = '📹 Start Video Call';
        document.getElementById('join-btn').disabled = false;
        document.getElementById('meeting-id').value = '';
        document.getElementById('participant-name').value = '';
        
        console.log('✅ Cleanup completed');
    }
    
    onParticipantJoined(participant) {
        this.participants.set(participant.id, participant);
        this.addVideoTile(participant.id, participant.displayName, false);
        
        // Setup participant streams
        this.setupParticipantStreams(participant);
    }
    
    onParticipantLeft(participant) {
        this.participants.delete(participant.id);
        this.removeVideoTile(participant.id);
    }
    
    onStreamEnabled(stream) {
        console.log('📹 Stream enabled:', stream.kind, 'from participant:', stream.participantId);
        
        if (stream.kind === 'video') {
            this.displayVideo(stream.participantId, stream.stream);
        } else if (stream.kind === 'audio') {
            this.displayAudio(stream.participantId, stream.stream);
        } else if (stream.kind === 'share') {
            console.log('🖥️ Screen share enabled');
            this.displayScreenShare(stream.participantId, stream.stream);
        }
    }
    
    onStreamDisabled(stream) {
        console.log('📹 Stream disabled:', stream.kind, 'from participant:', stream.participantId);
        
        if (stream.kind === 'video') {
            this.removeVideo(stream.participantId);
        } else if (stream.kind === 'audio') {
            this.removeAudio(stream.participantId);
        } else if (stream.kind === 'share') {
            console.log('🖥️ Screen share disabled');
            this.removeScreenShare(stream.participantId);
        }
    }
    
    findParticipantByStream(stream) {
        // Check if it's a local stream
        if (stream.producerId === this.meeting?.localParticipant?.id) {
            return { id: 'local', displayName: this.participantName };
        }
        
        // Search through remote participants
        for (const [participantId, participant] of this.participants) {
            if (participant.id === stream.producerId) {
                return participant;
            }
        }
        
        return null;
    }
    
    addVideoTile(participantId, displayName, isLocal = false) {
        const videoGrid = document.getElementById('video-grid');
        
        // Create video tile
        const videoFrame = document.createElement('div');
        videoFrame.id = `video-${participantId}`;
        videoFrame.className = 'video-tile';
        if (isLocal) videoFrame.classList.add('local');
        else videoFrame.classList.add('remote');
        
        // Video placeholder
        const videoPlaceholder = document.createElement('div');
        videoPlaceholder.className = 'video-placeholder';
        videoPlaceholder.innerHTML = `
            <div class="icon">👤</div>
            <div>Camera Off</div>
        `;
          // Participant name
        const nameElement = document.createElement('div');
        nameElement.className = 'participant-name';
        nameElement.textContent = displayName + (isLocal ? ' (You)' : '');
        
        // Status indicators
        const statusDiv = document.createElement('div');
        statusDiv.className = 'participant-status';
        statusDiv.innerHTML = `
            <div class="status-indicator mic-on" id="mic-${participantId}">🎤</div>
            <div class="status-indicator cam-off" id="cam-${participantId}">📹</div>
        `;
          videoFrame.appendChild(videoPlaceholder);
        videoFrame.appendChild(nameElement);
        videoFrame.appendChild(statusDiv);
        
        videoGrid.appendChild(videoFrame);
    }
    
    removeVideoTile(participantId) {
        const videoTile = document.getElementById(`video-${participantId}`);
        if (videoTile) {
            videoTile.remove();
        }
    }
    
    setupLocalVideo() {
        if (this.localWebcamOn && this.meeting.localWebcam) {
            this.displayVideo('local', this.meeting.localWebcam.stream);
        }
    }
      setupParticipantStreams(participant) {
        // Video stream
        if (participant.webcamOn && participant.webcamStream) {
            this.displayVideo(participant.id, participant.webcamStream);
        }
        
        // Audio stream
        if (participant.micOn && participant.micStream) {
            this.displayAudio(participant.id, participant.micStream);
        }
        
        // Screen share stream
        if (participant.screenShareOn && participant.screenShareStream) {
            this.displayScreenShare(participant.id, participant.screenShareStream);
        }
        
        // Setup participant event listeners for real-time updates
        participant.on('stream-enabled', (stream) => {
            console.log(`📹 ${participant.displayName} enabled ${stream.kind} stream`);
            this.onStreamEnabled(stream);
        });
        
        participant.on('stream-disabled', (stream) => {
            console.log(`📹 ${participant.displayName} disabled ${stream.kind} stream`);
            this.onStreamDisabled(stream);
        });
        
        // Update status indicators
        this.updateParticipantStatus(participant.id, participant.micOn, participant.webcamOn);
    }
    
    displayVideo(participantId, stream) {
        const videoTile = document.getElementById(`video-${participantId}`);
        if (!videoTile) return;
        
        // Remove placeholder
        const placeholder = videoTile.querySelector('.video-placeholder');
        if (placeholder) placeholder.remove();
        
        // Add video element
        const videoElement = document.createElement('video');
        videoElement.className = 'video-element';
        videoElement.srcObject = stream;
        videoElement.autoplay = true;
        videoElement.muted = participantId === 'local'; // Mute local video to prevent echo
        
        videoTile.insertBefore(videoElement, videoTile.firstChild);
        
        // Update camera status
        this.updateCameraStatus(participantId, true);
    }
    
    displayAudio(participantId, stream) {
        // Create audio element for remote participants
        if (participantId !== 'local') {
            const audioElement = document.createElement('audio');
            audioElement.srcObject = stream;
            audioElement.autoplay = true;
            audioElement.id = `audio-${participantId}`;
            document.body.appendChild(audioElement);
        }
    }
    
    updateParticipantStatus(participantId, micOn, webcamOn) {
        this.updateMicStatus(participantId, micOn);
        this.updateCameraStatus(participantId, webcamOn);
    }
    
    updateMicStatus(participantId, micOn) {
        const videoTile = document.getElementById(`video-${participantId}`);
        if (!videoTile) return;
        
        const micIcon = videoTile.querySelector('.mic-status');
        if (micIcon) {
            micIcon.className = `mic-status fas ${micOn ? 'fa-microphone text-green-500' : 'fa-microphone-slash text-red-500'}`;
        }
    }
    
    updateCameraStatus(participantId, webcamOn) {
        const videoTile = document.getElementById(`video-${participantId}`);
        if (!videoTile) return;
        
        const camIcon = videoTile.querySelector('.cam-status');
        if (camIcon) {
            camIcon.className = `cam-status fas ${webcamOn ? 'fa-video text-green-500' : 'fa-video-slash text-red-500'}`;
        }
          // Also update video visibility
        if (!webcamOn) {
            this.removeVideo(participantId);
        }
    }

    // Audio and video removal methods
    removeVideo(participantId) {
        const videoTile = document.getElementById(`video-${participantId}`);
        if (!videoTile) return;
        
        // Remove video element
        const videoElement = videoTile.querySelector('.video-element');
        if (videoElement) {
            videoElement.remove();
        }
        
        // Add placeholder back
        if (!videoTile.querySelector('.video-placeholder')) {
            const placeholder = document.createElement('div');
            placeholder.className = 'video-placeholder';
            placeholder.innerHTML = `
                <div class="icon">👤</div>
                <div>Camera Off</div>
            `;
            videoTile.insertBefore(placeholder, videoTile.firstChild);
        }
        
        // Update camera status
        this.updateCameraStatus(participantId, false);
    }

    removeAudio(participantId) {
        const audioElement = document.getElementById(`audio-${participantId}`);
        if (audioElement) {
            audioElement.remove();
        }
    }

    displayScreenShare(participantId, stream) {
        console.log('🖥️ Displaying screen share from:', participantId);
        
        // Create or update screen share element
        let screenShareContainer = document.getElementById('screen-share-container');
        if (!screenShareContainer) {
            screenShareContainer = document.createElement('div');
            screenShareContainer.id = 'screen-share-container';
            screenShareContainer.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            document.body.appendChild(screenShareContainer);
        }
        
        // Remove existing screen share video
        const existingVideo = screenShareContainer.querySelector('video');
        if (existingVideo) {
            existingVideo.remove();
        }
        
        // Add new screen share video
        const screenVideo = document.createElement('video');
        screenVideo.srcObject = stream;
        screenVideo.autoplay = true;
        screenVideo.style.cssText = 'max-width: 90%; max-height: 90%; border-radius: 10px;';
        
        screenShareContainer.appendChild(screenVideo);
        
        // Add close button
        if (!screenShareContainer.querySelector('.close-btn')) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-btn';
            closeBtn.innerHTML = '✕';
            closeBtn.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                cursor: pointer;
                font-size: 18px;
            `;
            closeBtn.onclick = () => this.removeScreenShare(participantId);
            screenShareContainer.appendChild(closeBtn);
        }
    }

    removeScreenShare(participantId) {
        console.log('🖥️ Removing screen share from:', participantId);
        const screenShareContainer = document.getElementById('screen-share-container');
        if (screenShareContainer) {
            screenShareContainer.remove();
        }
    }

    // Control methods - these were missing!
    toggleMic() {
        console.log('🎤 Toggling microphone...');
        if (!this.meeting) {
            console.error('❌ Meeting not initialized');
            return;
        }

        if (this.localMicOn) {
            this.meeting.muteMic();
            this.localMicOn = false;
            document.getElementById('mic-btn').className = 'control-btn mic-off';
            document.getElementById('mic-btn').innerHTML = '🎤';
            console.log('🔇 Microphone muted');
        } else {
            this.meeting.unmuteMic();
            this.localMicOn = true;
            document.getElementById('mic-btn').className = 'control-btn mic-on';
            document.getElementById('mic-btn').innerHTML = '🎤';
            console.log('🎤 Microphone unmuted');
        }
        
        this.updateMicStatus('local', this.localMicOn);
    }

    toggleWebcam() {
        console.log('📹 Toggling webcam...');
        if (!this.meeting) {
            console.error('❌ Meeting not initialized');
            return;
        }

        if (this.localWebcamOn) {
            this.meeting.disableWebcam();
            this.localWebcamOn = false;
            document.getElementById('cam-btn').className = 'control-btn cam-off';
            document.getElementById('cam-btn').innerHTML = '📹';
            this.removeVideo('local');
            console.log('📷 Webcam disabled');
        } else {
            this.meeting.enableWebcam();
            this.localWebcamOn = true;
            document.getElementById('cam-btn').className = 'control-btn cam-on';
            document.getElementById('cam-btn').innerHTML = '📹';
            console.log('📹 Webcam enabled');
        }
        
        this.updateCameraStatus('local', this.localWebcamOn);
    }

    toggleScreenShare() {
        console.log('🖥️ Toggling screen share...');
        if (!this.meeting) {
            console.error('❌ Meeting not initialized');
            return;
        }

        if (this.isScreenSharing) {
            this.meeting.disableScreenShare();
            this.isScreenSharing = false;
            document.getElementById('screen-btn').className = 'control-btn screen-share';
            document.getElementById('screen-btn').innerHTML = '📺';
            this.removeScreenShare('local');
            console.log('🛑 Screen sharing stopped');
        } else {
            this.meeting.enableScreenShare();
            this.isScreenSharing = true;
            document.getElementById('screen-btn').className = 'control-btn screen-share active';
            document.getElementById('screen-btn').innerHTML = '📺';
            console.log('📺 Screen sharing started');
        }
    }

    leaveMeeting() {
        console.log('👋 Leaving meeting...');
        if (!this.meeting) {
            console.warn('⚠️ No meeting to leave');
            return;
        }

        try {
            this.meeting.leave();
            console.log('✅ Successfully left meeting');
        } catch (error) {
            console.error('❌ Error leaving meeting:', error);
        }

        // Clean up UI immediately
        this.onMeetingLeft();
    }

    showError(message) {
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
        } else {
            console.error('❌ Error:', message);
            alert('Error: ' + message);
        }
    }
}

// Initialize the video call when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 MiscVord VideoCall starting...');
    window.videoCall = new MiscVordVideoCall();
});
</script>

<?php
$content = ob_get_clean();

// Include the main layout
require_once dirname(__DIR__) . '/layout/main-app.php';
?>
