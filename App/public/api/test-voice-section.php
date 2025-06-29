<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voice Section Test</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <meta name="channel-id" content="test-channel-123">
    <meta name="username" content="TestUser">
</head>
<body class="bg-gray-900 text-white p-8">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-6">Voice Section Recursion Test</h1>
        
        <div class="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">Test Results</h2>
            <div id="test-results" class="space-y-2 font-mono text-sm">
                <div class="text-green-400">Starting tests...</div>
            </div>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">Voice UI Elements</h2>
            
            <!-- Mock voice channel UI -->
            <div id="joinView" class="bg-[#2f3136] rounded-lg p-6 mb-4">
                <h3 class="text-lg font-medium mb-4">Join Voice Channel</h3>
                <button id="joinBtn" class="bg-[#3ba55c] hover:bg-[#2d7d32] text-white px-6 py-3 rounded-lg transition-colors">
                    <i class="fas fa-microphone mr-2"></i>
                    <span>Join Voice</span>
                </button>
            </div>
            
            <div id="connectingView" class="hidden bg-[#2f3136] rounded-lg p-6 mb-4">
                <h3 class="text-lg font-medium mb-4">Connecting...</h3>
                <div class="animate-pulse">Please wait while we connect you to the voice channel.</div>
            </div>
            
            <div id="videoGrid" class="hidden bg-[#2f3136] rounded-lg p-6">
                <h3 class="text-lg font-medium mb-4">Voice Channel Connected</h3>
                <p>You are now connected to the voice channel!</p>
            </div>
        </div>
        
        <div class="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">Test Controls</h2>
            <div class="flex flex-wrap gap-4">
                <button id="test-auto-join" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
                    Test Auto Join
                </button>
                <button id="test-handle-auto-join" class="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded">
                    Test Handle Auto Join
                </button>
                <button id="test-trigger-voice-auto-join" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                    Test Trigger Voice Auto Join
                </button>
                <button id="reset-test" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
                    Reset Test
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

    <!-- Load jQuery -->
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    
    <script>
        // Mock window.voiceState
        if (!window.voiceState) {
            window.voiceState = { isConnected: false };
        }
        
        // Console logging override
        const consoleLog = document.getElementById('console-log');
        const testResults = document.getElementById('test-results');
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

        function addTestResult(message, status = 'info') {
            const colorClass = status === 'error' ? 'text-red-400' : 
                              status === 'warn' ? 'text-yellow-400' : 
                              status === 'success' ? 'text-green-400' : 'text-blue-400';
            
            const resultEntry = document.createElement('div');
            resultEntry.className = colorClass;
            resultEntry.textContent = `✓ ${message}`;
            testResults.appendChild(resultEntry);
        }

        console.log = function(...args) {
            originalLog.apply(console, args);
            addLogEntry(args.join(' '), 'log');
        };

        console.error = function(...args) {
            originalError.apply(console, args);
            addLogEntry(args.join(' '), 'error');
            addTestResult(`ERROR: ${args.join(' ')}`, 'error');
        };

        console.warn = function(...args) {
            originalWarn.apply(console, args);
            addLogEntry(args.join(' '), 'warn');
            addTestResult(`WARNING: ${args.join(' ')}`, 'warn');
        };

        // Load voice section script
        function loadVoiceSection() {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = '/public/js/components/voice/voice-section.js?' + Date.now();
                script.onload = () => {
                    console.log('✅ Voice section script loaded');
                    addTestResult('Voice section script loaded successfully', 'success');
                    resolve();
                };
                script.onerror = () => {
                    console.error('❌ Failed to load voice section script');
                    addTestResult('Failed to load voice section script', 'error');
                    reject();
                };
                document.head.appendChild(script);
            });
        }

        // Test functions
        let recursionCounter = 0;
        const maxRecursionCheck = 10;

        function resetRecursionCounter() {
            recursionCounter = 0;
        }

        function checkRecursion(functionName) {
            recursionCounter++;
            console.log(`${functionName} called (count: ${recursionCounter})`);
            
            if (recursionCounter > maxRecursionCheck) {
                console.error(`🚨 RECURSION DETECTED: ${functionName} called ${recursionCounter} times!`);
                addTestResult(`RECURSION DETECTED in ${functionName}`, 'error');
                return true;
            }
            return false;
        }

        // Test controls
        document.getElementById('test-auto-join').addEventListener('click', () => {
            console.log('🧪 Testing autoJoin method');
            addTestResult('Testing autoJoin method', 'info');
            resetRecursionCounter();
            
            if (window.voiceSection && window.voiceSection.autoJoin) {
                if (checkRecursion('autoJoin')) return;
                
                try {
                    const result = window.voiceSection.autoJoin();
                    console.log('autoJoin result:', result);
                    addTestResult(`autoJoin completed with result: ${result}`, 'success');
                } catch (error) {
                    console.error('autoJoin error:', error);
                    addTestResult(`autoJoin failed: ${error.message}`, 'error');
                }
            } else {
                console.error('voiceSection.autoJoin not available');
                addTestResult('voiceSection.autoJoin not available', 'error');
            }
        });

        document.getElementById('test-handle-auto-join').addEventListener('click', () => {
            console.log('🧪 Testing handleAutoJoin function');
            addTestResult('Testing handleAutoJoin function', 'info');
            resetRecursionCounter();
            
            if (window.handleAutoJoin) {
                if (checkRecursion('handleAutoJoin')) return;
                
                try {
                    const result = window.handleAutoJoin();
                    console.log('handleAutoJoin result:', result);
                    addTestResult(`handleAutoJoin completed with result: ${result}`, 'success');
                } catch (error) {
                    console.error('handleAutoJoin error:', error);
                    addTestResult(`handleAutoJoin failed: ${error.message}`, 'error');
                }
            } else {
                console.error('handleAutoJoin not available');
                addTestResult('handleAutoJoin not available', 'error');
            }
        });

        document.getElementById('test-trigger-voice-auto-join').addEventListener('click', () => {
            console.log('🧪 Testing triggerVoiceAutoJoin function');
            addTestResult('Testing triggerVoiceAutoJoin function', 'info');
            resetRecursionCounter();
            
            if (window.triggerVoiceAutoJoin) {
                if (checkRecursion('triggerVoiceAutoJoin')) return;
                
                try {
                    const result = window.triggerVoiceAutoJoin();
                    console.log('triggerVoiceAutoJoin result:', result);
                    addTestResult(`triggerVoiceAutoJoin completed with result: ${result}`, 'success');
                } catch (error) {
                    console.error('triggerVoiceAutoJoin error:', error);
                    addTestResult(`triggerVoiceAutoJoin failed: ${error.message}`, 'error');
                }
            } else {
                console.error('triggerVoiceAutoJoin not available');
                addTestResult('triggerVoiceAutoJoin not available', 'error');
            }
        });

        document.getElementById('reset-test').addEventListener('click', () => {
            console.log('🔄 Resetting test');
            window.voiceState.isConnected = false;
            
            // Reset UI
            document.getElementById('joinView').classList.remove('hidden');
            document.getElementById('connectingView').classList.add('hidden');
            document.getElementById('videoGrid').classList.add('hidden');
            
            const joinBtn = document.getElementById('joinBtn');
            joinBtn.removeAttribute('data-processing');
            joinBtn.textContent = 'Join Voice';
            
            // Reset counters
            resetRecursionCounter();
            
            // Clear logs
            consoleLog.innerHTML = '<div class="text-green-400">Console cleared...</div>';
            testResults.innerHTML = '<div class="text-green-400">Test results cleared...</div>';
            
            addTestResult('Test environment reset', 'success');
        });

        // Initialize
        document.addEventListener('DOMContentLoaded', async () => {
            console.log('🚀 Test page loaded');
            addTestResult('Test page initialized', 'success');
            
            try {
                await loadVoiceSection();
                
                // Wait for voice section to initialize
                setTimeout(() => {
                    if (window.voiceSection) {
                        console.log('✅ Voice section instance found');
                        addTestResult('Voice section instance available', 'success');
                    } else {
                        console.warn('⚠️ Voice section instance not found');
                        addTestResult('Voice section instance not found', 'warn');
                    }
                    
                    if (window.handleAutoJoin) {
                        console.log('✅ handleAutoJoin function found');
                        addTestResult('handleAutoJoin function available', 'success');
                    }
                    
                    if (window.triggerVoiceAutoJoin) {
                        console.log('✅ triggerVoiceAutoJoin function found');
                        addTestResult('triggerVoiceAutoJoin function available', 'success');
                    }
                }, 1000);
                
            } catch (error) {
                console.error('❌ Failed to initialize test environment:', error);
                addTestResult('Failed to initialize test environment', 'error');
            }
        });
    </script>
</body>
</html> 