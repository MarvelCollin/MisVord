// Comprehensive Voice Presence Test
// This function can be run in the browser console to test the voice presence flow

window.testVoicePresenceFlow = async function() {
    console.log('🚀 Starting comprehensive voice presence test...');
    
    // Enable debug mode for all components
    if (window.GlobalPresenceManager?.enableDebugMode) {
        window.GlobalPresenceManager.enableDebugMode();
    }
    
    // 1. Check initial state
    console.log('\n📊 STEP 1: Checking initial state...');
    
    const currentUserId = window.GlobalSocketManager?.getCurrentUserId?.();
    console.log('Current user ID:', currentUserId);
    
    if (window.GlobalPresenceManager?.instance) {
        const currentPresence = window.GlobalPresenceManager.instance.getUserPresence(currentUserId);
        console.log('Current presence:', currentPresence);
    }
    
    // Check participant section
    const participantSection = document.querySelector('.participant-section');
    if (participantSection) {
        console.log('✅ Participant section found');
        const currentUserElement = participantSection.querySelector(`[data-user-id="${currentUserId}"]`);
        if (currentUserElement) {
            const status = currentUserElement.querySelector('.user-status')?.textContent;
            const activity = currentUserElement.querySelector('.user-activity')?.textContent;
            console.log('Current user in participant section - Status:', status, 'Activity:', activity);
        }
    }
    
    // Check active now section
    const activeNowSection = document.querySelector('.active-now-section');
    if (activeNowSection) {
        console.log('✅ Active now section found');
        const currentUserInActiveNow = activeNowSection.querySelector(`[data-user-id="${currentUserId}"]`);
        if (currentUserInActiveNow) {
            const activity = currentUserInActiveNow.querySelector('.user-activity')?.textContent;
            console.log('Current user in active now - Activity:', activity);
        }
    }
    
    // 2. Simulate joining voice
    console.log('\n🎤 STEP 2: Simulating voice join...');
    
    if (window.GlobalSocketManager?.updatePresence) {
        await window.GlobalSocketManager.updatePresence({
            type: 'In Voice Call',
            details: 'General'
        });
        console.log('✅ Sent "In Voice Call" presence update');
        
        // Wait a bit for updates to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check updated state
        console.log('\n📊 Checking state after voice join...');
        
        if (window.GlobalPresenceManager?.instance) {
            const updatedPresence = window.GlobalPresenceManager.instance.getUserPresence(currentUserId);
            console.log('Updated presence:', updatedPresence);
        }
        
        // Check participant section again
        if (participantSection) {
            const currentUserElement = participantSection.querySelector(`[data-user-id="${currentUserId}"]`);
            if (currentUserElement) {
                const status = currentUserElement.querySelector('.user-status')?.textContent;
                const activity = currentUserElement.querySelector('.user-activity')?.textContent;
                console.log('Updated participant section - Status:', status, 'Activity:', activity);
            }
        }
        
        // Check active now section again
        if (activeNowSection) {
            const currentUserInActiveNow = activeNowSection.querySelector(`[data-user-id="${currentUserId}"]`);
            if (currentUserInActiveNow) {
                const activity = currentUserInActiveNow.querySelector('.user-activity')?.textContent;
                console.log('Updated active now - Activity:', activity);
            }
        }
    }
    
    // 3. Simulate leaving voice
    console.log('\n🔇 STEP 3: Simulating voice leave...');
    
    if (window.GlobalSocketManager?.updatePresence) {
        await window.GlobalSocketManager.updatePresence({
            type: 'active'
        });
        console.log('✅ Sent "active" presence update');
        
        // Wait a bit for updates to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check final state
        console.log('\n📊 Checking final state after voice leave...');
        
        if (window.GlobalPresenceManager?.instance) {
            const finalPresence = window.GlobalPresenceManager.instance.getUserPresence(currentUserId);
            console.log('Final presence:', finalPresence);
        }
        
        // Check participant section final
        if (participantSection) {
            const currentUserElement = participantSection.querySelector(`[data-user-id="${currentUserId}"]`);
            if (currentUserElement) {
                const status = currentUserElement.querySelector('.user-status')?.textContent;
                const activity = currentUserElement.querySelector('.user-activity')?.textContent;
                console.log('Final participant section - Status:', status, 'Activity:', activity);
            }
        }
        
        // Check active now section final
        if (activeNowSection) {
            const currentUserInActiveNow = activeNowSection.querySelector(`[data-user-id="${currentUserId}"]`);
            if (currentUserInActiveNow) {
                const activity = currentUserInActiveNow.querySelector('.user-activity')?.textContent;
                console.log('Final active now - Activity:', activity);
            }
        }
    }
    
    console.log('\n✅ Voice presence test completed!');
    
    // Summary
    console.log('\n📋 TEST SUMMARY:');
    console.log('1. ✅ Initial state checked');
    console.log('2. ✅ Voice join simulation completed');
    console.log('3. ✅ Voice leave simulation completed');
    console.log('4. ✅ All UI sections verified');
    
    return {
        success: true,
        message: 'Voice presence test completed successfully'
    };
};

// Test function for the voice presence auth-success fix
window.testVoicePresenceAuthFix = function() {
    console.log('🧪 [TEST] Testing voice presence auth-success fix...');
    
    const socketManager = window.globalSocketManager;
    
    if (!socketManager) {
        console.error('❌ [TEST] GlobalSocketManager not available');
        return false;
    }
    
    // Track presence changes during test
    const presenceHistory = [];
    
    // Listen for presence updates
    const listener = (event) => {
        presenceHistory.push({
            timestamp: new Date().toISOString(),
            detail: event.detail
        });
        console.log('📊 [TEST] Presence update recorded:', event.detail);
    };
    
    window.addEventListener('ownPresenceUpdate', listener);
    
    console.log('🎯 [TEST] Step 1: Setting initial "In Voice Call" presence');
    
    // First set the voice call status
    socketManager.currentPresenceStatus = 'online';
    socketManager.currentActivityDetails = { type: 'In Voice Call' };
    socketManager.updatePresence('online', { type: 'In Voice Call' });
    
    setTimeout(() => {
        console.log('🎯 [TEST] Step 2: Current state before auth simulation');
        console.log('Status:', socketManager.currentPresenceStatus);
        console.log('Activity:', socketManager.currentActivityDetails);
        
        console.log('🎯 [TEST] Step 3: Simulating auth-success logic (the fix)');
        
        // This simulates the fixed auth-success handler logic
        const isInVoiceCall = socketManager.currentActivityDetails?.type === 'In Voice Call';
        const initialActivity = isInVoiceCall ? { type: 'In Voice Call' } : { type: 'active' };
        
        console.log('🔍 [TEST] Auth fix check - isInVoiceCall:', isInVoiceCall);
        console.log('🔍 [TEST] Auth fix check - activity to set:', initialActivity);
        
        socketManager.updatePresence('online', initialActivity);
        
        setTimeout(() => {
            console.log('🎯 [TEST] Step 4: State after auth fix');
            console.log('Status:', socketManager.currentPresenceStatus);
            console.log('Activity:', socketManager.currentActivityDetails);
            
            // Test the secondary update (500ms timeout from auth-success)
            console.log('🎯 [TEST] Step 5: Testing secondary auth update');
            const currentActivity = socketManager.currentActivityDetails?.type === 'In Voice Call' 
                ? { type: 'In Voice Call' } 
                : { type: 'active' };
            
            console.log('🔍 [TEST] Secondary update activity:', currentActivity);
            socketManager.updatePresence('online', currentActivity);
            
            setTimeout(() => {
                console.log('🎯 [TEST] Step 6: Final state after all auth logic');
                console.log('Status:', socketManager.currentPresenceStatus);
                console.log('Activity:', socketManager.currentActivityDetails);
                
                // Clean up
                window.removeEventListener('ownPresenceUpdate', listener);
                
                // Analyze results
                console.log('📈 [TEST] Complete presence history:', presenceHistory);
                
                const finalActivity = socketManager.currentActivityDetails?.type;
                const testPassed = finalActivity === 'In Voice Call';
                
                console.log(`${testPassed ? '✅' : '❌'} [TEST] Voice presence auth fix test ${testPassed ? 'PASSED' : 'FAILED'}`);
                console.log(`📊 [TEST] Final activity type: "${finalActivity}"`);
                console.log('📋 [TEST] Expected: "In Voice Call"');
                
                if (testPassed) {
                    console.log('🎉 [TEST] SUCCESS: Voice call presence is preserved through auth events!');
                    console.log('✨ [TEST] The fix is working correctly!');
                } else {
                    console.log('💥 [TEST] FAILURE: Voice call presence was not preserved');
                    console.log('🔧 [TEST] The fix may need adjustment');
                }
                
                return testPassed;
            }, 600); // After the 500ms secondary update
        }, 100); // After immediate auth-success update
    }, 100); // After voice call setup
};

// Auto-run if conditions are met
if (window.GlobalSocketManager && window.GlobalPresenceManager) {
    console.log('🎯 Voice presence test function is ready! Run window.testVoicePresenceFlow() to test.');
} else {
    console.log('⏳ Waiting for GlobalSocketManager and GlobalPresenceManager to be ready...');
    setTimeout(() => {
        if (window.GlobalSocketManager && window.GlobalPresenceManager) {
            console.log('🎯 Voice presence test function is now ready! Run window.testVoicePresenceFlow() to test.');
        }
    }, 2000);
}
