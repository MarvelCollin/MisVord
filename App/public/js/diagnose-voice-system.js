// Voice System Diagnostic Script
// Run this in browser console to check voice functionality

function diagnoseVoiceSystem() {
    console.log('🔍 [VOICE-DIAGNOSTIC] Starting voice system analysis...');
    
    // Check VoiceManager availability and state
    console.log('\n📊 VoiceManager Status:');
    console.log('======================');
    
    if (!window.voiceManager) {
        console.error('❌ VoiceManager not available');
        return { status: 'failed', reason: 'VoiceManager not found' };
    }
    
    const vm = window.voiceManager;
    console.log(`✅ VoiceManager: Available`);
    console.log(`   Connected: ${vm.isConnected ? '✅' : '❌'}`);
    console.log(`   Meeting Joined: ${vm.isMeetingJoined ? '✅' : '❌'}`);
    console.log(`   Channel ID: ${vm.currentChannelId || 'None'}`);
    console.log(`   Meeting ID: ${vm.currentMeetingId || 'None'}`);
    console.log(`   Local Participant: ${vm.localParticipant ? '✅' : '❌'}`);
    
    if (vm.localParticipant) {
        console.log(`   Local Participant ID: ${vm.localParticipant.id}`);
    }
    
    // Check VideoSDK state
    console.log('\n📺 VideoSDK Status:');
    console.log('==================');
    
    console.log(`   SDK Loaded: ${vm.sdkLoaded ? '✅' : '❌'}`);
    console.log(`   Meeting Object: ${vm.meeting ? '✅' : '❌'}`);
    
    if (vm.meeting) {
        console.log(`   Meeting ID: ${vm.meeting.meetingId}`);
        console.log(`   Local Participant ID: ${vm.meeting.localParticipant?.id || 'None'}`);
    }
    
    // Check voice states
    console.log('\n🎛️ Voice Control States:');
    console.log('========================');
    
    console.log(`   Mic: ${vm.getMicState() ? 'ON 🟢' : 'OFF 🔴'}`);
    console.log(`   Video: ${vm.getVideoState() ? 'ON 🟢' : 'OFF 🔴'}`);
    console.log(`   Screen Share: ${vm.getScreenShareState() ? 'ON 🟢' : 'OFF 🔴'}`);
    console.log(`   Deafened: ${vm.getDeafenState() ? 'ON 🟢' : 'OFF 🔴'}`);
    
    // Test video toggle function
    console.log('\n🧪 Testing Video Toggle:');
    console.log('========================');
    
    if (!vm.isConnected) {
        console.log('⚠️ Cannot test - not connected to voice');
    } else if (!vm.meeting) {
        console.log('❌ Cannot test - no meeting object');
    } else {
        console.log('🔄 Testing video toggle...');
        
        try {
            const originalState = vm.getVideoState();
            console.log(`   Original video state: ${originalState ? 'ON' : 'OFF'}`);
            
            // Test toggle
            vm.toggleVideo().then(newState => {
                console.log(`   After toggle: ${newState ? 'ON' : 'OFF'}`);
                console.log(`   ✅ Video toggle test ${newState !== originalState ? 'PASSED' : 'FAILED'}`);
                
                // Toggle back
                setTimeout(() => {
                    vm.toggleVideo().then(finalState => {
                        console.log(`   After toggle back: ${finalState ? 'ON' : 'OFF'}`);
                        console.log(`   ✅ Video restore test ${finalState === originalState ? 'PASSED' : 'FAILED'}`);
                    });
                }, 1000);
            }).catch(error => {
                console.error(`   ❌ Video toggle failed:`, error);
            });
        } catch (error) {
            console.error(`   ❌ Video toggle error:`, error);
        }
    }
    
    // Test screen share toggle
    console.log('\n📺 Testing Screen Share Toggle:');
    console.log('===============================');
    
    if (!vm.isConnected) {
        console.log('⚠️ Cannot test - not connected to voice');
    } else if (!vm.meeting) {
        console.log('❌ Cannot test - no meeting object');
    } else {
        console.log('🔄 Testing screen share toggle...');
        
        try {
            const originalState = vm.getScreenShareState();
            console.log(`   Original screen share state: ${originalState ? 'ON' : 'OFF'}`);
            
            // Test toggle
            vm.toggleScreenShare().then(newState => {
                console.log(`   After toggle: ${newState ? 'ON' : 'OFF'}`);
                console.log(`   ✅ Screen share toggle test ${newState !== originalState ? 'PASSED' : 'FAILED'}`);
                
                // Toggle back
                setTimeout(() => {
                    vm.toggleScreenShare().then(finalState => {
                        console.log(`   After toggle back: ${finalState ? 'ON' : 'OFF'}`);
                        console.log(`   ✅ Screen share restore test ${finalState === originalState ? 'PASSED' : 'FAILED'}`);
                    });
                }, 1000);
            }).catch(error => {
                console.error(`   ❌ Screen share toggle failed:`, error);
            });
        } catch (error) {
            console.error(`   ❌ Screen share toggle error:`, error);
        }
    }
    
    // Check participants
    console.log('\n👥 Participants Status:');
    console.log('======================');
    
    console.log(`   Total participants: ${vm.participants.size}`);
    console.log(`   Bot participants: ${vm.botParticipants.size}`);
    
    if (vm.participants.size > 0) {
        console.log('   Participant details:');
        vm.participants.forEach((participant, id) => {
            console.log(`     ${id}: ${participant.name} (User ID: ${participant.user_id}, Local: ${participant.isLocal})`);
        });
    }
    
    // Check UI elements
    console.log('\n🎮 UI Elements Status:');
    console.log('=====================');
    
    const buttons = {
        micBtn: document.getElementById('micBtn'),
        videoBtn: document.getElementById('videoBtn'),
        screenBtn: document.getElementById('screenBtn'),
        deafenBtn: document.getElementById('deafenBtn')
    };
    
    Object.entries(buttons).forEach(([name, element]) => {
        console.log(`   ${name}: ${element ? '✅' : '❌'}`);
        if (element) {
            const rect = element.getBoundingClientRect();
            console.log(`     Visible: ${rect.width > 0 && rect.height > 0 ? '✅' : '❌'}`);
            console.log(`     Size: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
        }
    });
    
    return {
        status: 'completed',
        voiceManagerAvailable: !!vm,
        connected: vm?.isConnected || false,
        meetingJoined: vm?.isMeetingJoined || false,
        localParticipant: !!vm?.localParticipant,
        meeting: !!vm?.meeting,
        participants: vm?.participants.size || 0
    };
}

// Export to window for easy access
window.diagnoseVoiceSystem = diagnoseVoiceSystem;

console.log('Voice System Diagnostic Script Loaded');
console.log('Run diagnoseVoiceSystem() to check voice functionality');
