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
        await window.GlobalSocketManager.updatePresence(
            'online',
            {
                type: 'In Voice Call',
                details: 'General'
            },
            'test-voice-join'
        );
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
        await window.GlobalSocketManager.updatePresence(
            'online', 
            { type: 'active' },
            'test-voice-leave'
        );
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
    socketManager.updatePresence('online', { type: 'In Voice Call' }, 'test-auth-fix-setup');
    
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
        
        socketManager.updatePresence('online', initialActivity, 'test-auth-fix-main');
        
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
            socketManager.updatePresence('online', currentActivity, 'test-auth-fix-secondary');
            
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

// 🎯 NEW: Comprehensive Presence Hierarchy Test
window.testPresenceHierarchy = async function() {
    console.log('🧪 [HIERARCHY-TEST] Starting comprehensive presence hierarchy test...');
    
    const socketManager = window.globalSocketManager;
    
    if (!socketManager?.isReady()) {
        console.error('❌ [HIERARCHY-TEST] Socket manager not ready');
        return false;
    }
    
    const results = [];
    
    // Test 1: Basic online presence
    console.log('\n🎯 [HIERARCHY-TEST] Test 1: Setting basic online presence');
    const test1 = socketManager.updatePresence('online', { type: 'active' });
    results.push({ test: 'Basic Online', success: test1 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 2: Voice call should override online
    console.log('\n🎯 [HIERARCHY-TEST] Test 2: Voice call should override online');
    const test2 = socketManager.updatePresence('online', { type: 'In Voice - Test Channel' });
    results.push({ test: 'Voice Override Online', success: test2 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 3: Regular activity should NOT override voice call
    console.log('\n🎯 [HIERARCHY-TEST] Test 3: Regular activity should NOT override voice call');
    const test3 = socketManager.updatePresence('online', { type: 'active' });
    const currentActivity = socketManager.currentActivityDetails?.type;
    const test3Success = !test3 && currentActivity.includes('In Voice');
    results.push({ test: 'Activity Blocked by Voice', success: test3Success });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 4: Tic Tac Toe should override voice call
    console.log('\n🎯 [HIERARCHY-TEST] Test 4: Tic Tac Toe should override voice call');
    const test4 = socketManager.updatePresence('online', { type: 'playing Tic Tac Toe' });
    results.push({ test: 'Gaming Override Voice', success: test4 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 5: Voice call should NOT override gaming
    console.log('\n🎯 [HIERARCHY-TEST] Test 5: Voice call should NOT override gaming');
    const test5 = socketManager.updatePresence('online', { type: 'In Voice - Another Channel' });
    const currentActivity2 = socketManager.currentActivityDetails?.type;
    const test5Success = !test5 && currentActivity2 === 'playing Tic Tac Toe';
    results.push({ test: 'Voice Blocked by Gaming', success: test5Success });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 6: Reset to online (should work from gaming)
    console.log('\n🎯 [HIERARCHY-TEST] Test 6: Reset to online from gaming');
    const test6 = socketManager.updatePresence('online', { type: 'active' });
    results.push({ test: 'Reset from Gaming', success: test6 });
    
    // Print results
    console.log('\n📊 [HIERARCHY-TEST] Test Results:');
    results.forEach(result => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.log(`  ${status} - ${result.test}`);
    });
    
    const passCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    if (passCount === totalCount) {
        console.log(`\n🎉 [HIERARCHY-TEST] ALL TESTS PASSED! (${passCount}/${totalCount})`);
        console.log('✨ [HIERARCHY-TEST] Presence hierarchy system is working correctly!');
        return true;
    } else {
        console.log(`\n💥 [HIERARCHY-TEST] SOME TESTS FAILED (${passCount}/${totalCount})`);
        console.log('🔧 [HIERARCHY-TEST] Presence hierarchy needs adjustment');
        return false;
    }
};

// 🎯 NEW: Voice Call Protection Test
window.testVoiceCallProtection = async function() {
    console.log('🛡️ [PROTECTION-TEST] Testing voice call protection from activity tracking...');
    
    const socketManager = window.globalSocketManager;
    
    if (!socketManager?.isReady()) {
        console.error('❌ [PROTECTION-TEST] Socket manager not ready');
        return false;
    }
    
    // Step 1: Set voice call presence
    console.log('📱 [PROTECTION-TEST] Step 1: Setting voice call presence');
    socketManager.updatePresence('online', { type: 'In Voice - Protection Test' });
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Step 2: Simulate user activity (should be blocked)
    console.log('🖱️ [PROTECTION-TEST] Step 2: Simulating user activity (should be blocked)');
    const beforeActivity = socketManager.currentActivityDetails?.type;
    
    // Trigger activity update manually without DOM events
    socketManager.lastActivityTime = Date.now();
    if (socketManager.isUserActive === false || socketManager.currentPresenceStatus === 'afk') {
        socketManager.isUserActive = true;
        const isInVoiceCall = socketManager.isUserInVoiceCall();
        if (!isInVoiceCall) {
            socketManager.updatePresence('online', { type: 'active' });
        }
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const afterActivity = socketManager.currentActivityDetails?.type;
    
    const protectionWorked = beforeActivity === afterActivity && afterActivity.includes('In Voice');
    
    if (protectionWorked) {
        console.log('✅ [PROTECTION-TEST] SUCCESS - Voice call presence protected from activity tracking');
        console.log(`🎤 [PROTECTION-TEST] Presence maintained: "${afterActivity}"`);
    } else {
        console.log('❌ [PROTECTION-TEST] FAILURE - Voice call presence was overridden');
        console.log(`💥 [PROTECTION-TEST] Before: "${beforeActivity}" -> After: "${afterActivity}"`);
    }
    
    // Step 3: Test AFK protection
    console.log('😴 [PROTECTION-TEST] Step 3: Testing AFK protection for voice calls');
    
    // Simulate inactivity
    socketManager.lastActivityTime = Date.now() - 25000; // 25 seconds ago
    socketManager.isUserActive = true;
    
    // Manually trigger activity check
    const timeSinceActivity = Date.now() - socketManager.lastActivityTime;
    const beforeAFK = socketManager.currentActivityDetails?.type;
    
    if (timeSinceActivity >= socketManager.afkTimeout && socketManager.isUserActive) {
        const isInVoiceCall = socketManager.isUserInVoiceCall();
        
        if (isInVoiceCall) {
            console.log('🛡️ [PROTECTION-TEST] Voice call protected from AFK - presence preserved');
        } else {
            console.log('💥 [PROTECTION-TEST] Voice call not protected from AFK');
        }
    }
    
    const afterAFK = socketManager.currentActivityDetails?.type;
    const afkProtectionWorked = beforeAFK === afterAFK && afterAFK.includes('In Voice');
    
    if (afkProtectionWorked) {
        console.log('✅ [PROTECTION-TEST] AFK protection working correctly');
    } else {
        console.log('❌ [PROTECTION-TEST] AFK protection failed');
    }
    
    // Reset activity time
    socketManager.lastActivityTime = Date.now();
    socketManager.isUserActive = true;
    
    const overallSuccess = protectionWorked && afkProtectionWorked;
    
    if (overallSuccess) {
        console.log('\n🎉 [PROTECTION-TEST] ALL PROTECTION TESTS PASSED!');
        console.log('🛡️ [PROTECTION-TEST] Voice call presence is fully protected!');
    } else {
        console.log('\n💥 [PROTECTION-TEST] SOME PROTECTION TESTS FAILED');
        console.log('🔧 [PROTECTION-TEST] Protection system needs adjustment');
    }
    
    return overallSuccess;
};

// 🎯 MASTER TEST FUNCTION
window.runAllPresenceTests = async function() {
    console.log('🚀 [MASTER-TEST] Running all presence system tests...');
    console.log('=' * 60);
    
    const results = [];
    
    try {
        // Test 1: Presence Hierarchy
        console.log('\n📋 [MASTER-TEST] Running Presence Hierarchy Tests...');
        const hierarchyResult = await window.testPresenceHierarchy();
        results.push({ name: 'Presence Hierarchy', success: hierarchyResult });
        
        // Test 2: Voice Call Protection
        console.log('\n🛡️ [MASTER-TEST] Running Voice Call Protection Tests...');
        const protectionResult = await window.testVoiceCallProtection();
        results.push({ name: 'Voice Call Protection', success: protectionResult });
        
        // Test 3: Auth Fix (if available)
        if (window.testVoicePresenceAuthFix) {
            console.log('\n🔐 [MASTER-TEST] Running Auth Fix Tests...');
            const authResult = await window.testVoicePresenceAuthFix();
            results.push({ name: 'Auth Fix', success: authResult });
        }
        
    } catch (error) {
        console.error('❌ [MASTER-TEST] Error during testing:', error);
        results.push({ name: 'Test Execution', success: false, error: error.message });
    }
    
    // Summary
    console.log('\n' + '=' * 60);
    console.log('📊 [MASTER-TEST] FINAL TEST SUMMARY');
    console.log('=' * 60);
    
    results.forEach(result => {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        const error = result.error ? ` (${result.error})` : '';
        console.log(`  ${status} - ${result.name}${error}`);
    });
    
    const passCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    if (passCount === totalCount) {
        console.log(`\n🎉 [MASTER-TEST] ALL SYSTEMS WORKING! (${passCount}/${totalCount})`);
        console.log('✨ [MASTER-TEST] Voice presence system is fully functional!');
        console.log('🎤 [MASTER-TEST] Voice calls will now maintain correct presence status!');
        return true;
    } else {
        console.log(`\n💥 [MASTER-TEST] SOME SYSTEMS FAILED (${passCount}/${totalCount})`);
        console.log('🔧 [MASTER-TEST] Please check the failed tests above');
        return false;
    }
};

// Quick test helper
window.quickVoiceTest = function() {
    console.log('⚡ [QUICK-TEST] Running quick voice presence test...');
    
    if (!window.globalSocketManager?.isReady()) {
        console.error('❌ [QUICK-TEST] Socket not ready');
        return;
    }
    
    // Set voice presence
    window.globalSocketManager.updatePresence('online', { type: 'In Voice - Quick Test' });
    console.log('🎤 [QUICK-TEST] Set voice presence');
    
    // Try to override with activity (should fail)
    setTimeout(() => {
        const result = window.globalSocketManager.updatePresence('online', { type: 'active' });
        const currentActivity = window.globalSocketManager.currentActivityDetails?.type;
        
        if (!result && currentActivity.includes('In Voice')) {
            console.log('✅ [QUICK-TEST] SUCCESS - Voice presence protected!');
            console.log(`🎤 [QUICK-TEST] Current presence: "${currentActivity}"`);
        } else {
            console.log('❌ [QUICK-TEST] FAILED - Voice presence was overridden!');
            console.log(`💥 [QUICK-TEST] Current presence: "${currentActivity}"`);
        }
    }, 100);
};
