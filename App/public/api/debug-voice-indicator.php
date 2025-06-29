<?php
header('Content-Type: text/html');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Debug Voice Indicator</title>
    <link rel="stylesheet" href="/public/css/voice-indicator.css">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: #36393f; 
            color: white; 
            padding: 20px; 
        }
        .debug-panel {
            background: #2f3136;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        button {
            background: #5865F2;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover { background: #4752C4; }
        .log { 
            background: #1e1f22; 
            padding: 10px; 
            border-radius: 4px; 
            margin-top: 10px;
            max-height: 300px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <h1>🔧 Voice Indicator Debug Panel</h1>
    
    <div class="debug-panel">
        <h3>Manual Tests</h3>
        <button onclick="loadVoiceScript()">1. Load Voice Script</button>
        <button onclick="testConnect()">2. Test Connect</button>
        <button onclick="testShow()">3. Force Show</button>
        <button onclick="checkDOM()">4. Check DOM</button>
        <button onclick="clearLog()">Clear Log</button>
    </div>
    
    <div class="debug-panel">
        <h3>Status</h3>
        <div id="status">
            <p>Script loaded: <span id="scriptStatus">❌</span></p>
            <p>Global instance: <span id="instanceStatus">❌</span></p>
            <p>Indicator in DOM: <span id="domStatus">❌</span></p>
            <p>Indicator visible: <span id="visibleStatus">❌</span></p>
        </div>
    </div>
    
    <div class="debug-panel">
        <h3>Console Log</h3>
        <div id="log" class="log"></div>
    </div>

    <script>
        // Override console.log to show in our debug panel
        const originalLog = console.log;
        const logDiv = document.getElementById('log');
        
        console.log = function(...args) {
            originalLog.apply(console, args);
            const message = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            logDiv.innerHTML += '<div>' + new Date().toLocaleTimeString() + ': ' + message + '</div>';
            logDiv.scrollTop = logDiv.scrollHeight;
        };
        
        function updateStatus() {
            document.getElementById('scriptStatus').textContent = 
                window.GlobalVoiceIndicator ? '✅' : '❌';
            document.getElementById('instanceStatus').textContent = 
                window.globalVoiceIndicator ? '✅' : '❌';
            document.getElementById('domStatus').textContent = 
                document.getElementById('voice-indicator') ? '✅' : '❌';
            
            const indicator = document.getElementById('voice-indicator');
            document.getElementById('visibleStatus').textContent = 
                (indicator && indicator.offsetWidth > 0 && indicator.offsetHeight > 0) ? '✅' : '❌';
        }
        
        function loadVoiceScript() {
            console.log('🔄 Loading voice script...');
            const script = document.createElement('script');
            script.src = '/public/js/components/videosdk/global-voice-connected.js';
            script.onload = () => {
                console.log('✅ Voice script loaded');
                updateStatus();
            };
            script.onerror = () => {
                console.log('❌ Failed to load voice script');
            };
            document.head.appendChild(script);
        }
        
        function testConnect() {
            console.log('🎤 Testing voice connect...');
            if (window.globalVoiceIndicator) {
                // Manually set connection state
                window.globalVoiceIndicator.isConnected = true;
                window.globalVoiceIndicator.handleConnect('Debug Channel', 'debug-meeting-123', 'debug-channel-456');
                updateStatus();
            } else {
                console.log('❌ Global voice indicator not found');
            }
        }
        
        function testShow() {
            console.log('🎯 Testing force show...');
            if (window.globalVoiceIndicator) {
                window.globalVoiceIndicator.forceShowIndicator();
                updateStatus();
            } else {
                console.log('❌ Global voice indicator not found');
            }
        }
        
        function checkDOM() {
            console.log('🔍 Checking DOM state...');
            const indicators = document.querySelectorAll('#voice-indicator');
            console.log(`Found ${indicators.length} voice indicators`);
            
            indicators.forEach((indicator, index) => {
                console.log(`Indicator ${index}:`, {
                    display: indicator.style.display,
                    opacity: indicator.style.opacity,
                    transform: indicator.style.transform,
                    classes: indicator.className,
                    isVisible: indicator.offsetWidth > 0 && indicator.offsetHeight > 0,
                    computedDisplay: window.getComputedStyle(indicator).display,
                    computedOpacity: window.getComputedStyle(indicator).opacity
                });
            });
            
            updateStatus();
        }
        
        function clearLog() {
            logDiv.innerHTML = '';
        }
        
        // Update status every 2 seconds
        setInterval(updateStatus, 2000);
        updateStatus();
    </script>
</body>
</html> 