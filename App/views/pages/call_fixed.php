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

<!-- VideoSDK Script -->
<script src="https://sdk.videosdk.live/js-sdk/0.1.6/videosdk.js"></script>

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
        
        // Configure VideoSDK with token
        VideoSDK.config(this.token);
        
        // Hide loading and show join form
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('join-form').style.display = 'flex';
        
        // Setup event listeners
        this.setupEventListeners();
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
            
            // Create or join meeting
            if (meetingIdInput) {
                // Join existing meeting
                this.meetingId = meetingIdInput;
            } else {
                // Create new meeting
                this.meetingId = await this.createMeeting();
            }
            
            // Initialize meeting
            this.meeting = VideoSDK.initMeeting({
                meetingId: this.meetingId,
                name: this.participantName,
                micEnabled: this.localMicOn,
                webcamEnabled: this.localWebcamOn
            });
            
            // Setup meeting event listeners
            this.setupMeetingEventListeners();
            
            // Join the meeting
            this.meeting.join();
            
        } catch (error) {
            console.error('❌ Failed to join meeting:', error);
            this.showError('Failed to join meeting: ' + error.message);
            document.getElementById('join-btn').textContent = '📹 Start Video Call';
            document.getElementById('join-btn').disabled = false;
        }
    }
    
    async createMeeting() {
        try {
            const response = await fetch('https://api.videosdk.live/v2/rooms', {
                method: 'POST',
                headers: {
                    'Authorization': this.token,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to create meeting: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ Meeting created:', data.roomId);
            return data.roomId;
            
        } catch (error) {
            console.error('❌ Error creating meeting:', error);
            throw error;
        }
    }
    
    setupMeetingEventListeners() {
        // Meeting joined
        this.meeting.on('meeting-joined', () => {
            console.log('✅ Meeting joined successfully');
            this.onMeetingJoined();
        });
        
        // Participant joined
        this.meeting.on('participant-joined', (participant) => {
            console.log('👥 Participant joined:', participant.displayName);
            this.onParticipantJoined(participant);
        });
        
        // Participant left
        this.meeting.on('participant-left', (participant) => {
            console.log('👋 Participant left:', participant.displayName);
            this.onParticipantLeft(participant);
        });
        
        // Stream events
        this.meeting.on('stream-enabled', (stream) => {
            console.log('📹 Stream enabled:', stream.kind);
            this.onStreamEnabled(stream);
        });
        
        this.meeting.on('stream-disabled', (stream) => {
            console.log('📹 Stream disabled:', stream.kind);
            this.onStreamDisabled(stream);
        });
        
        // Error handling
        this.meeting.on('error', (error) => {
            console.error('❌ Meeting error:', error);
            this.showError('Meeting error: ' + error.message);
        });
    }
    
    onMeetingJoined() {
        // Hide join form and show video interface
        document.getElementById('join-form').style.display = 'none';
        document.getElementById('video-interface').style.display = 'block';
        
        // Add local participant
        this.addVideoTile('local', this.participantName, true);
        
        // Setup local video stream
        this.setupLocalVideo();
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
        const displayName = document.createElement('div');
        displayName.className = 'participant-name';
        displayName.textContent = displayName + (isLocal ? ' (You)' : '');
        
        // Status indicators
        const statusDiv = document.createElement('div');
        statusDiv.className = 'participant-status';
        statusDiv.innerHTML = `
            <div class="status-indicator mic-on" id="mic-${participantId}">🎤</div>
            <div class="status-indicator cam-off" id="cam-${participantId}">📹</div>
        `;
        
        videoFrame.appendChild(videoPlaceholder);
        videoFrame.appendChild(displayName);
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
        const micIndicator = document.getElementById(`mic-${participantId}`);
        if (micIndicator) {
            micIndicator.className = `status-indicator ${micOn ? 'mic-on' : 'mic-off'}`;
        }
    }
    
    updateCameraStatus(participantId, webcamOn) {
        const camIndicator = document.getElementById(`cam-${participantId}`);
        if (camIndicator) {
            camIndicator.className = `status-indicator ${webcamOn ? 'cam-on' : 'cam-off'}`;
        }
    }
    
    onStreamEnabled(stream) {
        if (stream.kind === 'video') {
            this.displayVideo(stream.participantId, stream.stream);
        } else if (stream.kind === 'audio') {
            this.displayAudio(stream.participantId, stream.stream);
        }
    }
    
    onStreamDisabled(stream) {
        if (stream.kind === 'video') {
            this.removeVideo(stream.participantId);
        } else if (stream.kind === 'audio') {
            this.removeAudio(stream.participantId);
        }
    }
    
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
    
    toggleMic() {
        if (this.localMicOn) {
            this.meeting.muteMic();
            this.localMicOn = false;
            document.getElementById('mic-btn').className = 'control-btn mic-off';
        } else {
            this.meeting.unmuteMic();
            this.localMicOn = true;
            document.getElementById('mic-btn').className = 'control-btn mic-on';
        }
        
        this.updateMicStatus('local', this.localMicOn);
    }
    
    toggleWebcam() {
        if (this.localWebcamOn) {
            this.meeting.disableWebcam();
            this.localWebcamOn = false;
            document.getElementById('cam-btn').className = 'control-btn cam-off';
            this.removeVideo('local');
        } else {
            this.meeting.enableWebcam();
            this.localWebcamOn = true;
            document.getElementById('cam-btn').className = 'control-btn cam-on';
        }
        
        this.updateCameraStatus('local', this.localWebcamOn);
    }
    
    toggleScreenShare() {
        if (this.isScreenSharing) {
            this.meeting.disableScreenShare();
            this.isScreenSharing = false;
            document.getElementById('screen-btn').className = 'control-btn screen-share';
        } else {
            this.meeting.enableScreenShare();
            this.isScreenSharing = true;
            document.getElementById('screen-btn').className = 'control-btn screen-share active';
        }
    }
    
    leaveMeeting() {
        if (this.meeting) {
            this.meeting.leave();
        }
        
        // Redirect to home or show leave message
        window.location.href = '/';
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
require_once dirname(__DIR__) . '/layout.php';
?>
