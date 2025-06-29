<?php
header('Content-Type: text/html');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Voice Indicator Test</title>
    <script>
        function testVoiceIndicator() {
            console.log('🧪 Testing voice indicator duplication...');
            
            // Check existing indicators
            const existing = document.querySelectorAll('#voice-indicator');
            console.log(`Found ${existing.length} existing indicators`);
            
            // Test creating GlobalVoiceIndicator
            if (window.GlobalVoiceIndicator) {
                console.log('✅ GlobalVoiceIndicator class found');
                
                // Test connection
                if (window.globalVoiceIndicator) {
                    window.globalVoiceIndicator.handleConnect('Test Channel', 'test-123', 'channel-456');
                    
                    setTimeout(() => {
                        const afterConnect = document.querySelectorAll('#voice-indicator');
                        console.log(`After connect: ${afterConnect.length} indicators`);
                        
                        if (afterConnect.length === 1) {
                            console.log('✅ SUCCESS: Only one indicator created');
                        } else {
                            console.log('❌ FAIL: Multiple indicators detected');
                        }
                    }, 1000);
                } else {
                    console.log('❌ globalVoiceIndicator not found');
                }
            } else {
                console.log('❌ GlobalVoiceIndicator class not found');
            }
        }
        
        function loadVoiceScript() {
            const script = document.createElement('script');
            script.src = '/public/js/components/videosdk/global-voice-connected.js';
            script.onload = () => {
                console.log('✅ Voice script loaded');
                setTimeout(testVoiceIndicator, 500);
            };
            document.head.appendChild(script);
        }
    </script>
</head>
<body>
    <h1>Voice Indicator Duplication Test</h1>
    <button onclick="loadVoiceScript()">Load Voice Script</button>
    <button onclick="testVoiceIndicator()">Test Voice Indicator</button>
    
    <div id="results">
        <p>Open console to see test results</p>
    </div>
</body>
</html> 