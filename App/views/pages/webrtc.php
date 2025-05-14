<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}


$page_title = 'MiscVord - Global Video Chat';
$body_class = 'bg-gray-900 text-white overflow-hidden';


$additional_head = '
<style>
    .video-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
    }
    
    .video-container {
        position: relative;
        border-radius: 0.5rem;
        overflow: hidden;
        background-color: #2D3748;
        aspect-ratio: 4/3;
        min-height: 225px;
    }
    
    .video-container video {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .video-container .username {
        position: absolute;
        bottom: 0.5rem;
        left: 0.5rem;
        background-color: rgba(0, 0, 0, 0.5);
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.875rem;
    }
    
    .controls {
        display: flex;
        justify-content: center;
        gap: 1rem;
        padding: 1rem;
        background-color: #1A202C;
        border-radius: 0.5rem;
        position: fixed;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 50;
    }
    
    .control-btn {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .control-btn:hover {
        opacity: 0.8;
    }
    
    .control-btn.active {
        background-color: #48BB78;
    }
    
    .control-btn.inactive {
        background-color: #718096;
    }
    
    .control-btn.danger {
        background-color: #F56565;
    }
    
    .local-video-container {
        position: fixed;
        bottom: 5rem;
        right: 1rem;
        width: 200px;
        height: 150px;
        border-radius: 0.5rem;
        overflow: hidden;
        z-index: 40;
        border: 2px solid #4A5568;
    }
    
    .local-video-container video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: scaleX(-1); 
    }
    
    .participants-panel {
        position: fixed;
        right: 0;
        top: 0;
        bottom: 0;
        width: 250px;
        background-color: #1A202C;
        border-left: 1px solid #2D3748;
        padding: 1rem;
        overflow-y: auto;
    }
    
    .participant-item {
        display: flex;
        align-items: center;
        padding: 0.5rem;
        margin-bottom: 0.5rem;
        border-radius: 0.25rem;
        background-color: #2D3748;
    }
    
    .participant-avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        background-color: #4A5568;
        margin-right: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }
    
    .main-content {
        margin-right: 250px;
        height: 100vh;
        padding: 1rem;
    }
    
    .username-modal {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 100;
    }
    
    .connection-status {
        padding: 0.5rem 1rem;
        background-color: #2D3748;
        border-radius: 0.25rem;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .status-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
    }
    
    .status-indicator.connected {
        background-color: #48BB78;
    }
    
    .status-indicator.connecting {
        background-color: #ECC94B;
    }
    
    .status-indicator.disconnected {
        background-color: #F56565;
    }
    
    @media (max-width: 768px) {
        .participants-panel {
            display: none;
        }
        
        .main-content {
            margin-right: 0;
        }
    }
    
    
    .socket-logs {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        bottom: 5rem;
        width: 90%;
        max-width: 800px;
        height: 200px;
        background-color: rgba(0, 0, 0, 0.8);
        color: #48BB78;
        font-family: monospace;
        font-size: 0.75rem;
        padding: 0.5rem;
        border-radius: 0.25rem;
        overflow-y: auto;
        z-index: 35;
        display: none;
    }
    
    .socket-logs.visible {
        display: block;
    }
    
    .log-entry {
        margin-bottom: 0.25rem;
        border-bottom: 1px solid #4A5568;
        padding-bottom: 0.25rem;
    }
    
    .log-entry.sent {
        color: #4299E1;
    }
    
    .log-entry.received {
        color: #48BB78;
    }
    
    .log-entry.error {
        color: #F56565;
    }
    
    .log-controls {
        position: fixed;
        bottom: 0.5rem;
        left: 1rem;
        z-index: 36;
    }
</style>';
?>


<?php ob_start(); ?>


<div id="permissionRequest" class="username-modal">
    <div class="bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h3 class="text-xl font-bold mb-4">Camera & Microphone Access</h3>
        <p class="mb-4 text-gray-300">Please allow access to your camera and microphone when prompted by your browser.</p>
        <div id="permissionStatus" class="p-3 bg-gray-700 rounded mb-4 text-center">
            Waiting for permission...
        </div>
        <button id="retryPermissionBtn" class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Retry</button>
    </div>
</div>

<div class="flex h-screen">
    <div class="main-content flex-1 flex flex-col">
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-xl font-bold">Global Video Chat</h1>
            <div id="connectionStatus" class="connection-status">
                <div class="status-indicator disconnected" id="statusIndicator"></div>
                <span id="statusText">Disconnected</span>
                <button id="retryConnection" class="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                    Retry
                </button>
            </div>
        </div>
        
        <div class="video-grid flex-1" id="videoGrid"></div>
        
        <div class="local-video-container">
            <video id="localVideo" autoplay muted playsinline></video>
        </div>
        
        <div class="controls">
            <div class="control-btn active" id="toggleVideoBtn" title="Toggle Video">
                <svg xmlns="http:
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            </div>
            <div class="control-btn active" id="toggleAudioBtn" title="Toggle Audio">
                <svg xmlns="http:
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </div>
            <div class="control-btn inactive" id="toggleScreenBtn" title="Share Screen">
                <svg xmlns="http:
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            </div>
            <div class="control-btn bg-blue-600" id="pingBtn" title="Ping All Users">
                <svg xmlns="http:
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <div class="control-btn danger" id="hangupBtn" title="Leave Chat">
                <svg xmlns="http:
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
            </div>
        </div>
    </div>
    
    <div class="participants-panel">
        <h2 class="text-lg font-bold mb-4">Participants</h2>
        <div id="participantsList"></div>
    </div>
</div>


<div id="socketLogs" class="socket-logs">
    <div id="logEntries"></div>
</div>


<div class="log-controls">
    <button id="toggleLogs" class="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600">
        Show Socket Logs
    </button>
    <button id="clearLogs" class="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 ml-2">
        Clear Logs
    </button>
</div>


<script src="https:

<script src="<?php echo js('webrtc-modules/browser-compatibility'); ?>"></script>
<script src="<?php echo js('webrtc-modules/video-debug'); ?>"></script>
<script src="<?php echo js('webrtc-modules/video-player'); ?>"></script>

<script src="<?php echo js('webrtc'); ?>"></script>

<?php 

$content = ob_get_clean(); 


include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>

