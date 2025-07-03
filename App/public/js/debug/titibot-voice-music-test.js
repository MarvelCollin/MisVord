/**
 * TitiBot Voice Music Integration Test Script
 * 
 * This script tests the complete flow of:
 * 1. User joining voice channel
 * 2. Typing /titibot play command
 * 3. Bot joining voice as participant
 * 4. Music starting to play
 * 
 * Usage: 
 * 1. Join a voice channel
 * 2. Open browser console
 * 3. Run: testTitiBotVoiceMusicIntegration()
 */

window.testTitiBotVoiceMusicIntegration = function(options = {}) {
    const {
        songName = 'never gonna give you up',
        skipBotJoin = false,
        skipMusicCommand = false
    } = options;
    
    console.log('🧪 [TITIBOT-TEST] Starting voice music integration test...');
    console.log('🎵 [TITIBOT-TEST] Test song:', songName);
    
    // Phase 1: Environment validation
    console.log('\n📋 [TITIBOT-TEST] Phase 1: Environment Validation');
    
    const urlParams = new URLSearchParams(window.location.search);
    const channelType = urlParams.get('type');
    const channelId = urlParams.get('channel');
    
    if (channelType !== 'voice') {
        console.error('❌ [TITIBOT-TEST] Must be in a voice channel. Current type:', channelType);
        console.log('💡 [TITIBOT-TEST] Please navigate to a voice channel and try again.');
        return false;
    }
    
    console.log('✅ [TITIBOT-TEST] In voice channel:', channelId);
    
    // Phase 2: Component availability check
    console.log('\n🔧 [TITIBOT-TEST] Phase 2: Component Availability');
    
    const components = {
        musicPlayer: !!window.musicPlayer,
        botComponent: !!window.BotComponent,
        chatBot: !!window.chatBot,
        voiceCallSection: !!window.voiceCallSection,
        globalSocketManager: !!window.globalSocketManager?.io,
        chatSection: !!window.chatSection,
        videoSDKManager: !!window.videoSDKManager
    };
    
    console.table(components);
    
    const missingComponents = Object.keys(components).filter(key => !components[key]);
    if (missingComponents.length > 0) {
        console.warn('⚠️ [TITIBOT-TEST] Missing components:', missingComponents);
        console.log('💡 [TITIBOT-TEST] Some features may not work properly.');
    } else {
        console.log('✅ [TITIBOT-TEST] All components available!');
    }
    
    // Phase 3: Voice connection check
    console.log('\n🎤 [TITIBOT-TEST] Phase 3: Voice Connection Status');
    
    const voiceChecks = {
        unifiedVoiceState: window.unifiedVoiceStateManager?.getState(),
        videoSDKConnected: window.videoSDKManager?.isConnected,
        videoSDKMeetingJoined: window.videoSDKManager?.isMeetingJoined,
        voiceManagerConnected: window.voiceManager?.isConnected
    };
    
    console.log('🔍 [TITIBOT-TEST] Voice status:', voiceChecks);
    
    const userConnectedToVoice = voiceChecks.videoSDKConnected && voiceChecks.videoSDKMeetingJoined;
    if (userConnectedToVoice) {
        console.log('✅ [TITIBOT-TEST] User connected to voice channel');
    } else {
        console.log('⚠️ [TITIBOT-TEST] User not connected to voice (this is OK for testing)');
    }
    
    // Phase 4: Bot voice join test
    if (!skipBotJoin) {
        console.log('\n🤖 [TITIBOT-TEST] Phase 4: Bot Voice Join Test');
        
        const participantGrid = document.getElementById('participantGrid');
        const existingBotCard = participantGrid?.querySelector('[data-participant-id="bot-4"]');
        
        if (existingBotCard) {
            console.log('ℹ️ [TITIBOT-TEST] Bot already in voice channel');
        } else {
            console.log('🔄 [TITIBOT-TEST] Simulating bot join...');
            
            const mockBotData = {
                id: 'bot-voice-4',
                user_id: '4',
                username: 'TitiBot',
                avatar_url: '/public/assets/common/default-profile-picture.png',
                isBot: true,
                channelId: channelId,
                meetingId: `voice_channel_${channelId}`,
                joinedAt: Date.now()
            };
            
            window.dispatchEvent(new CustomEvent('bot-voice-participant-joined', {
                detail: { participant: mockBotData }
            }));
            
            setTimeout(() => {
                const botCard = document.querySelector('[data-participant-id="bot-4"]');
                if (botCard) {
                    console.log('✅ [TITIBOT-TEST] Bot successfully joined voice channel');
                } else {
                    console.error('❌ [TITIBOT-TEST] Bot failed to join voice channel');
                }
            }, 1000);
        }
    }
    
    // Phase 5: Music command test
    if (!skipMusicCommand) {
        setTimeout(() => {
            console.log('\n🎵 [TITIBOT-TEST] Phase 5: Music Command Test');
            
            if (!window.chatSection || !window.chatSection.messageInput) {
                console.error('❌ [TITIBOT-TEST] Chat section not available');
                return;
            }
            
            const command = `/titibot play ${songName}`;
            console.log('📝 [TITIBOT-TEST] Simulating command:', command);
            
            // Set the command in the input
            window.chatSection.messageInput.value = command;
            
            // Trigger the send
            if (window.chatSection.sendReceiveHandler?.sendMessage) {
                window.chatSection.sendReceiveHandler.sendMessage();
                console.log('✅ [TITIBOT-TEST] Command sent successfully');
                
                // Monitor for bot response
                setTimeout(() => {
                    console.log('🔍 [TITIBOT-TEST] Checking for bot response...');
                    const messages = document.querySelectorAll('.bubble-message-content');
                    const botMessages = Array.from(messages).filter(msg => 
                        msg.textContent.includes('TitiBot') || 
                        msg.textContent.includes('MUSIGGGGGGG')
                    );
                    
                    if (botMessages.length > 0) {
                        console.log('✅ [TITIBOT-TEST] Bot responded to command');
                    } else {
                        console.log('⚠️ [TITIBOT-TEST] No bot response detected yet');
                    }
                    
                    // Check music player status
                    if (window.musicPlayer) {
                        setTimeout(() => {
                            const musicStatus = {
                                currentSong: window.musicPlayer.currentSong,
                                isPlaying: window.musicPlayer.isPlaying,
                                queueLength: window.musicPlayer.queue?.length || 0
                            };
                            console.log('🎼 [TITIBOT-TEST] Music player status:', musicStatus);
                            
                            if (musicStatus.currentSong || musicStatus.isPlaying) {
                                console.log('🎉 [TITIBOT-TEST] SUCCESS! Music is playing');
                            } else {
                                console.log('⚠️ [TITIBOT-TEST] Music not detected (may still be loading)');
                            }
                        }, 2000);
                    }
                }, 5000);
                
            } else {
                console.error('❌ [TITIBOT-TEST] Send message handler not available');
            }
            
        }, skipBotJoin ? 1000 : 3000);
    }
    
    console.log('\n🏁 [TITIBOT-TEST] Test initiated. Watch the console for results...');
    return true;
};

// Quick test functions
window.testBotJoinOnly = () => testTitiBotVoiceMusicIntegration({ skipMusicCommand: true });
window.testMusicCommandOnly = () => testTitiBotVoiceMusicIntegration({ skipBotJoin: true });

console.log('🎯 [TITIBOT-TEST] Test functions loaded:');
console.log('  testTitiBotVoiceMusicIntegration() - Full integration test');
console.log('  testBotJoinOnly() - Test bot joining voice only');  
console.log('  testMusicCommandOnly() - Test music command only');
