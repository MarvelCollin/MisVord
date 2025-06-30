<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$response = [
    'status' => 'success',
    'message' => 'Global Voice Indicator Test',
    'data' => [
        'test_scenarios' => [
            [
                'scenario' => 'Connect to voice channel',
                'event' => 'voiceConnect',
                'payload' => [
                    'channelName' => 'Test Voice Channel',
                    'meetingId' => 'test_meeting_123',
                    'timestamp' => time()
                ]
            ],
            [
                'scenario' => 'Voice state change',
                'event' => 'voiceStateChanged',
                'payload' => [
                    'isMuted' => false,
                    'isDeafened' => false,
                    'isVideoOn' => false,
                    'isScreenSharing' => false
                ]
            ],
            [
                'scenario' => 'Disconnect from voice',
                'event' => 'voiceDisconnect',
                'payload' => []
            ]
        ],
        'test_javascript' => "
            // Test Global Voice Indicator
            function testGlobalVoiceIndicator() {
                console.log('Testing Global Voice Indicator...');
                
                // Test 1: Connect to voice
                setTimeout(() => {
                    console.log('🎤 Simulating voice connect...');
                    window.dispatchEvent(new CustomEvent('voiceConnect', {
                        detail: {
                            channelName: 'Test Voice Channel',
                            meetingId: 'test_meeting_123'
                        }
                    }));
                }, 1000);
                
                // Test 2: Update voice state
                setTimeout(() => {
                    console.log('🔄 Simulating voice state change...');
                    window.dispatchEvent(new CustomEvent('voiceStateChanged', {
                        detail: {
                            isMuted: true,
                            isDeafened: false
                        }
                    }));
                }, 3000);
                
                // Test 3: Force update indicator
                setTimeout(() => {
                    console.log('🔄 Force updating indicator...');
                    if (window.globalVoiceIndicator) {
                        window.globalVoiceIndicator.forceUpdateIndicator();
                    }
                }, 5000);
                
                // Test 4: Disconnect after 10 seconds
                setTimeout(() => {
                    console.log('🔇 Simulating voice disconnect...');
                    window.dispatchEvent(new CustomEvent('voiceDisconnect'));
                }, 10000);
            }
            
            // Check if global voice indicator exists
            if (window.globalVoiceIndicator) {
                console.log('✅ Global Voice Indicator is available');
                console.log('Indicator state:', {
                    isConnected: window.globalVoiceIndicator.isConnected,
                    channelName: window.globalVoiceIndicator.channelName,
                    hasIndicator: !!window.globalVoiceIndicator.indicator
                });
            } else {
                console.log('❌ Global Voice Indicator not found');
            }
            
            // Auto-run test if not on voice page
            if (window.globalVoiceIndicator && !window.globalVoiceIndicator.isOnVoiceChannelPage()) {
                testGlobalVoiceIndicator();
            }
        "
    ],
    'timestamp' => date('Y-m-d H:i:s')
];

echo json_encode($response, JSON_PRETTY_PRINT);
?> 