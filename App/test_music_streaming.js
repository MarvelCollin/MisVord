function testMusicStreamingFix() {
    console.log('🎵 Testing Music Streaming Fix...');
    
    if (typeof window !== 'undefined' && window.musicPlayer) {
        console.log('✅ Music Player Available');
        
        if (window.voiceManager && window.voiceManager.isConnected) {
            console.log('✅ Voice Manager Connected');
            console.log('📊 Current State:', {
                channelId: window.voiceManager.currentChannelId,
                meetingId: window.voiceManager.currentMeetingId,
                audioContext: !!window.musicPlayer._audioContext,
                audioContextState: window.musicPlayer._audioContext?.state
            });
            
            console.log('🔧 Running Audio Connections Debug...');
            window.musicPlayer.debugAudioConnections();
            
            if (window.musicPlayer.audio && window.musicPlayer.isPlaying) {
                console.log('🎵 Music is playing, testing stream connection...');
                const result = window.musicPlayer.connectAudioToVoiceChannel();
                console.log('🎵 Stream connection result:', result);
            } else {
                console.log('ℹ️ No music currently playing');
            }
        } else {
            console.log('❌ Voice Manager not connected to voice channel');
        }
    } else {
        console.log('❌ Music Player not available');
    }
}

if (typeof window !== 'undefined') {
    window.testMusicStreamingFix = testMusicStreamingFix;
}
