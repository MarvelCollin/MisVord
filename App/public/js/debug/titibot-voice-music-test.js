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
    


    
    // Phase 1: Environment validation

    
    const urlParams = new URLSearchParams(window.location.search);
    const channelType = urlParams.get('type');
    const channelId = urlParams.get('channel');
    
    if (channelType !== 'voice') {
        console.error('❌ [TITIBOT-TEST] Must be in a voice channel. Current type:', channelType);

        return false;
    }
    

    
    // Phase 2: Component availability check

    
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

    } else {

    }
    
    // Phase 3: Voice connection check

    
    const voiceChecks = {
        unifiedVoiceState: window.unifiedVoiceStateManager?.getState(),
        videoSDKConnected: window.videoSDKManager?.isConnected,
        videoSDKMeetingJoined: window.videoSDKManager?.isMeetingJoined,
        voiceManagerConnected: window.voiceManager?.isConnected
    };
    

    
    const userConnectedToVoice = voiceChecks.videoSDKConnected && voiceChecks.videoSDKMeetingJoined;
    if (userConnectedToVoice) {

    } else {

    }
    
    // Phase 4: Bot voice join test
    if (!skipBotJoin) {

        
        const participantGrid = document.getElementById('participantGrid');
        const existingBotCard = participantGrid?.querySelector('[data-participant-id="bot-4"]');
        
        if (existingBotCard) {

        } else {

            
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

                } else {
                    console.error('❌ [TITIBOT-TEST] Bot failed to join voice channel');
                }
            }, 1000);
        }
    }
    
    // Phase 5: Music command test
    if (!skipMusicCommand) {
        setTimeout(() => {

            
            if (!window.chatSection || !window.chatSection.messageInput) {
                console.error('❌ [TITIBOT-TEST] Chat section not available');
                return;
            }
            
            const command = `/titibot play ${songName}`;

            
            // Set the command in the input
            window.chatSection.messageInput.value = command;
            
            // Trigger the send
            if (window.chatSection.sendReceiveHandler?.sendMessage) {
                window.chatSection.sendReceiveHandler.sendMessage();

                
                // Monitor for bot response
                setTimeout(() => {

                    const messages = document.querySelectorAll('.bubble-message-content');
                    const botMessages = Array.from(messages).filter(msg => 
                        msg.textContent.includes('TitiBot') || 
                        msg.textContent.includes('MUSIGGGGGGG')
                    );
                    
                    if (botMessages.length > 0) {

                    } else {

                    }
                    
                    // Check music player status
                    if (window.musicPlayer) {
                        setTimeout(() => {
                            const musicStatus = {
                                currentSong: window.musicPlayer.currentSong,
                                isPlaying: window.musicPlayer.isPlaying,
                                queueLength: window.musicPlayer.queue?.length || 0
                            };

                            
                            if (musicStatus.currentSong || musicStatus.isPlaying) {

                            } else {

                            }
                        }, 2000);
                    }
                }, 5000);
                
            } else {
                console.error('❌ [TITIBOT-TEST] Send message handler not available');
            }
            
        }, skipBotJoin ? 1000 : 3000);
    }
    

    return true;
};

// Quick test functions
window.testBotJoinOnly = () => testTitiBotVoiceMusicIntegration({ skipMusicCommand: true });
window.testMusicCommandOnly = () => testTitiBotVoiceMusicIntegration({ skipBotJoin: true });





