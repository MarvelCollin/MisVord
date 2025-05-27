<?php
require_once dirname(__DIR__, 2) . '/config/videosdk.php';

// Initialize VideoSDK
VideoSDKConfig::init();

// Handle meeting creation or joining
$meetingId = $_GET['meetingId'] ?? null;
$action = $_GET['action'] ?? 'join';

if ($action === 'create') {
    try {
        $meeting = VideoSDKConfig::createMeeting();
        $meetingId = $meeting['roomId'];
        header("Location: ?meetingId=" . $meetingId);
        exit;
    } catch (Exception $e) {
        $error = "Failed to create meeting: " . $e->getMessage();
    }
}

// Get VideoSDK configuration
$config = VideoSDKConfig::getFrontendConfig();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>misvord - Video Call</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            max-width: 1200px;
            width: 100%;
            height: 90vh;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background: #2c3e50;
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .meeting-info {
            display: flex;
            flex-direction: column;
        }
        
        .meeting-id {
            font-size: 14px;
            opacity: 0.8;
        }
        
        .participants-count {
            font-size: 12px;
            opacity: 0.7;
        }
        
        .main-content {
            flex: 1;
            display: flex;
            position: relative;
        }
        
        .video-grid {
            flex: 1;
            background: #1a1a1a;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 10px;
            padding: 10px;
        }
        
        .video-container {
            background: #333;
            border-radius: 10px;
            position: relative;
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .video-element {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 10px;
        }
        
        .participant-name {
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
        }
        
        .avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: #667eea;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        
        .controls {
            background: #34495e;
            padding: 15px 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
        }
        
        .control-btn {
            width: 50px;
            height: 50px;
            border: none;
            border-radius: 50%;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            font-size: 20px;
        }
        
        .control-btn.mic {
            background: #27ae60;
        }
        
        .control-btn.mic.muted {
            background: #e74c3c;
        }
        
        .control-btn.camera {
            background: #3498db;
        }
        
        .control-btn.camera.disabled {
            background: #e74c3c;
        }
        
        .control-btn.leave {
            background: #e74c3c;
        }
        
        .control-btn.screen {
            background: #9b59b6;
        }
        
        .control-btn:hover {
            transform: scale(1.1);
        }
        
        .join-form {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 100%;
        }
        
        .join-form h2 {
            margin-bottom: 30px;
            color: #2c3e50;
        }
        
        .form-group {
            margin-bottom: 20px;
            text-align: left;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #555;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 5px;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
        }
        
        .btn-primary:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
        }
        
        .btn-secondary {
            background: #95a5a6;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #7f8c8d;
        }
        
        .error {
            color: #e74c3c;
            margin-top: 10px;
            padding: 10px;
            background: #ffeaea;
            border-radius: 5px;
        }
        
        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <?php if (!$meetingId): ?>
        <!-- Join/Create Meeting Form -->
        <div class="join-form">
            <h2>🎥 misvord Call</h2>
            
            <?php if (isset($error)): ?>
                <div class="error"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            
            <form method="GET" id="joinForm">
                <div class="form-group">
                    <label for="meetingId">Meeting ID (optional)</label>
                    <input type="text" id="meetingId" name="meetingId" placeholder="Enter meeting ID to join">
                </div>
                
                <div class="form-group">
                    <label for="userName">Your Name</label>
                    <input type="text" id="userName" name="userName" placeholder="Enter your name" required>
                </div>
                
                <button type="submit" class="btn btn-primary">Join Meeting</button>
                <button type="button" class="btn btn-secondary" onclick="createMeeting()">Create New Meeting</button>
            </form>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Setting up your meeting...</p>
            </div>
        </div>
    <?php else: ?>
        <!-- Video Call Interface -->
        <div class="container">
            <div class="header">
                <div class="meeting-info">
                    <div class="meeting-id">Meeting ID: <?php echo htmlspecialchars($meetingId); ?></div>
                    <div class="participants-count" id="participantCount">Participants: 0</div>
                </div>
                <div>
                    <button class="btn btn-secondary" onclick="copyMeetingId()">📋 Copy ID</button>
                </div>
            </div>
            
            <div class="main-content">
                <div class="video-grid" id="videoGrid">
                    <!-- Videos will be added here dynamically -->
                </div>
            </div>
            
            <div class="controls">
                <button class="control-btn mic" id="micBtn" onclick="toggleMic()">🎤</button>
                <button class="control-btn camera" id="cameraBtn" onclick="toggleCamera()">📹</button>
                <button class="control-btn screen" id="screenBtn" onclick="toggleScreenShare()">🖥️</button>
                <button class="control-btn leave" onclick="leaveMeeting()">📞</button>
            </div>
        </div>
    <?php endif; ?>

    <script src="https://sdk.videosdk.live/rtc-js-prebuilt/0.3.30/rtc-js-prebuilt.js"></script>
    <script>
        // VideoSDK Configuration
        const config = <?php echo json_encode($config); ?>;
        const meetingId = <?php echo json_encode($meetingId); ?>;
        const userName = new URLSearchParams(window.location.search).get('userName') || 'Anonymous';
        
        let meeting = null;
        let isMicOn = true;
        let isCameraOn = true;
        let isScreenSharing = false;
        
        <?php if ($meetingId): ?>
        // Initialize VideoSDK meeting
        initializeMeeting();
        <?php endif; ?>
        
        function createMeeting() {
            const userName = document.getElementById('userName').value;
            if (!userName.trim()) {
                alert('Please enter your name');
                return;
            }
            
            document.getElementById('loading').style.display = 'block';
            window.location.href = '?action=create&userName=' + encodeURIComponent(userName);
        }
        
        function initializeMeeting() {
            const videoSDKMeeting = new VideoSDKMeeting();
            
            const meetingConfig = {
                name: userName,
                meetingId: meetingId,
                apiKey: config.apiKey,
                
                containerId: null,
                
                micEnabled: true,
                webcamEnabled: true,
                
                participantCanToggleSelfWebcam: true,
                participantCanToggleSelfMic: true,
                
                chatEnabled: true,
                screenShareEnabled: true,
                
                branding: {
                    enabled: true,
                    logoURL: "<?php echo asset('/images/main-logo.png'); ?>",
                    name: "misvord",
                    poweredBy: false
                },
                
                permissions: {
                    askToJoin: false,
                    toggleParticipantMic: true,
                    toggleParticipantWebcam: true,
                    removeParticipant: true,
                    endMeeting: true,
                    drawOnWhiteboard: true,
                    toggleWhiteboard: true,
                    toggleRecording: true
                },
                
                joinScreen: {
                    visible: false
                },
                
                leftScreen: {
                    actionButton: {
                        label: "Join Another Meeting",
                        href: window.location.origin + window.location.pathname
                    }
                },
                
                notificationSoundEnabled: true,
                
                debug: <?php echo $config['isProduction'] ? 'false' : 'true'; ?>,
                
                theme: "DARK",
                
                mode: "CONFERENCE"
            };
            
            meeting = videoSDKMeeting.init(meetingConfig);
        }
        
        function toggleMic() {
            if (meeting) {
                const micBtn = document.getElementById('micBtn');
                if (isMicOn) {
                    meeting.muteMic();
                    micBtn.classList.add('muted');
                    micBtn.innerHTML = '🎤';
                } else {
                    meeting.unmuteMic();
                    micBtn.classList.remove('muted');
                    micBtn.innerHTML = '🎤';
                }
                isMicOn = !isMicOn;
            }
        }
        
        function toggleCamera() {
            if (meeting) {
                const cameraBtn = document.getElementById('cameraBtn');
                if (isCameraOn) {
                    meeting.disableWebcam();
                    cameraBtn.classList.add('disabled');
                    cameraBtn.innerHTML = '📹';
                } else {
                    meeting.enableWebcam();
                    cameraBtn.classList.remove('disabled');
                    cameraBtn.innerHTML = '📹';
                }
                isCameraOn = !isCameraOn;
            }
        }
        
        function toggleScreenShare() {
            if (meeting) {
                if (isScreenSharing) {
                    meeting.disableScreenShare();
                } else {
                    meeting.enableScreenShare();
                }
                isScreenSharing = !isScreenSharing;
            }
        }
        
        function leaveMeeting() {
            if (confirm('Are you sure you want to leave the meeting?')) {
                if (meeting) {
                    meeting.leave();
                }
                window.location.href = window.location.pathname;
            }
        }
        
        function copyMeetingId() {
            navigator.clipboard.writeText(meetingId).then(() => {
                alert('Meeting ID copied to clipboard!');
            }).catch(() => {
                prompt('Copy this meeting ID:', meetingId);
            });
        }
        
        // Handle form submission
        document.getElementById('joinForm')?.addEventListener('submit', function(e) {
            const meetingIdInput = document.getElementById('meetingId').value;
            if (!meetingIdInput.trim()) {
                e.preventDefault();
                createMeeting();
            }
        });
    </script>
</body>
</html>
