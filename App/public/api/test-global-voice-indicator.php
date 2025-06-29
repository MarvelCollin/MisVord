<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Global Voice Indicator Test</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gray-900 text-white p-8">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-6">Global Voice Indicator Test</h1>
        
        <div class="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">Debug Information</h2>
            <div id="debug-info" class="space-y-2 font-mono text-sm">
                <div>Loading...</div>
            </div>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">Test Controls</h2>
            <div class="flex flex-wrap gap-4">
                <button id="trigger-connect" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                    Trigger Voice Connect
                </button>
                <button id="trigger-disconnect" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
                    Trigger Voice Disconnect
                </button>
                <button id="check-indicator" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                    Check Indicator Status
                </button>
                <button id="reload-script" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded">
                    Reload Script
                </button>
            </div>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-6">
            <h2 class="text-xl font-semibold mb-4">Console Log</h2>
            <div id="console-log" class="bg-black rounded p-4 font-mono text-sm max-h-64 overflow-y-auto">
                <div class="text-green-400">Console initialized...</div>
            </div>
        </div>
    </div>

    <script>
        // Console logging override
        const consoleLog = document.getElementById('console-log');
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        function addLogEntry(message, type = 'log') {
            const timestamp = new Date().toLocaleTimeString();
            const colorClass = type === 'error' ? 'text-red-400' : 
                              type === 'warn' ? 'text-yellow-400' : 
                              type === 'info' ? 'text-blue-400' : 'text-green-400';
            
            const logEntry = document.createElement('div');
            logEntry.className = colorClass;
            logEntry.textContent = `[${timestamp}] ${message}`;
            consoleLog.appendChild(logEntry);
            consoleLog.scrollTop = consoleLog.scrollHeight;
        }

        console.log = function(...args) {
            originalLog.apply(console, args);
            addLogEntry(args.join(' '), 'log');
        };

        console.error = function(...args) {
            originalError.apply(console, args);
            addLogEntry(args.join(' '), 'error');
        };

        console.warn = function(...args) {
            originalWarn.apply(console, args);
            addLogEntry(args.join(' '), 'warn');
        };

        // Debug info updater
        function updateDebugInfo() {
            const debugInfo = document.getElementById('debug-info');
            const info = [];
            
            info.push(`window.globalVoiceIndicator: ${typeof window.globalVoiceIndicator}`);
            info.push(`GlobalVoiceIndicator class: ${typeof GlobalVoiceIndicator !== 'undefined' ? 'Available' : 'Not Available'}`);
            info.push(`Voice indicator element: ${document.getElementById('global-voice-indicator') ? 'Present' : 'Not Present'}`);
            info.push(`Current URL: ${window.location.href}`);
            info.push(`User Agent: ${navigator.userAgent}`);
            
            debugInfo.innerHTML = info.map(line => `<div>${line}</div>`).join('');
        }

        // Test functions
        document.getElementById('trigger-connect').addEventListener('click', () => {
            console.log('🎤 Manually triggering voiceConnect event');
            window.dispatchEvent(new CustomEvent('voiceConnect', {
                detail: {
                    channelId: 'test-123',
                    channelName: 'Test Voice Channel',
                    meetingId: 'test-meeting-456'
                }
            }));
        });

        document.getElementById('trigger-disconnect').addEventListener('click', () => {
            console.log('🔇 Manually triggering voiceDisconnect event');
            window.dispatchEvent(new CustomEvent('voiceDisconnect'));
        });

        document.getElementById('check-indicator').addEventListener('click', () => {
            updateDebugInfo();
            
            if (window.globalVoiceIndicator) {
                console.log('✅ Global voice indicator instance found');
                console.log('Connected state:', window.globalVoiceIndicator.isConnected);
            } else {
                console.error('❌ Global voice indicator not found');
            }
            
            const indicatorElement = document.getElementById('global-voice-indicator');
            if (indicatorElement) {
                console.log('✅ Voice indicator DOM element found');
                console.log('Element style:', indicatorElement.style.cssText);
                console.log('Element classes:', indicatorElement.className);
            } else {
                console.log('❌ Voice indicator DOM element not found');
            }
        });

        document.getElementById('reload-script').addEventListener('click', () => {
            console.log('🔄 Reloading global voice indicator script');
            
            // Remove existing script
            const existingScript = document.querySelector('script[src*="global-voice-indicator"]');
            if (existingScript) {
                existingScript.remove();
                console.log('Removed existing script');
            }
            
            // Load fresh script
            const script = document.createElement('script');
            script.type = 'module';
            script.src = '/public/js/components/voice/global-voice-indicator.js?' + Date.now();
            script.onload = () => {
                console.log('✅ Script reloaded successfully');
                updateDebugInfo();
            };
            script.onerror = (error) => {
                console.error('❌ Script failed to load:', error);
            };
            document.head.appendChild(script);
        });

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 Test page loaded');
            updateDebugInfo();
            
            // Load the global voice indicator script
            const script = document.createElement('script');
            script.type = 'module';
            script.src = '/public/js/components/voice/global-voice-indicator.js?' + Date.now();
            script.onload = () => {
                console.log('✅ Global voice indicator script loaded');
                setTimeout(updateDebugInfo, 500);
            };
            script.onerror = (error) => {
                console.error('❌ Failed to load global voice indicator script:', error);
            };
            document.head.appendChild(script);
        });

        // Listen for voice events
        window.addEventListener('voiceConnect', (e) => {
            console.log('🎤 Voice connect event received:', e.detail);
        });

        window.addEventListener('voiceDisconnect', () => {
            console.log('🔇 Voice disconnect event received');
        });
    </script>
</body>
</html> 