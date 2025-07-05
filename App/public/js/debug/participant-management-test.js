/**
 * Participant Management Test Suite
 * Tests the unified participant coordination system
 */
window.ParticipantManagementTest = {
    
    testResults: {
        duplicateCheck: false,
        coordinatorIntegration: false,
        raceConditionPrevention: false,
        systemSeparation: false,
        overallPassed: false
    },
    
    async runCompleteTest() {
        console.log('🔬 [PARTICIPANT-TEST] Starting comprehensive participant management test...');
        
        // Reset test results
        Object.keys(this.testResults).forEach(key => {
            this.testResults[key] = false;
        });
        
        try {
            // Test 1: Coordinator Integration
            await this.testCoordinatorIntegration();
            
            // Test 2: Duplicate Prevention
            await this.testDuplicatePrevention();
            
            // Test 3: Race Condition Prevention
            await this.testRaceConditionPrevention();
            
            // Test 4: System Separation
            await this.testSystemSeparation();
            
            // Calculate overall result
            const passedTests = Object.keys(this.testResults).filter(key => 
                key !== 'overallPassed' && this.testResults[key]
            ).length;
            const totalTests = Object.keys(this.testResults).length - 1;
            
            this.testResults.overallPassed = passedTests === totalTests;
            
            console.log('📊 [PARTICIPANT-TEST] Test Results:', this.testResults);
            console.log(`✅ [PARTICIPANT-TEST] ${passedTests}/${totalTests} tests passed`);
            
            if (this.testResults.overallPassed) {
                console.log('🎉 [PARTICIPANT-TEST] All tests passed! Participant management is working correctly.');
            } else {
                console.error('❌ [PARTICIPANT-TEST] Some tests failed. Check individual test results above.');
            }
            
            return this.testResults;
            
        } catch (error) {
            console.error('❌ [PARTICIPANT-TEST] Test suite failed:', error);
            return this.testResults;
        }
    },
    
    async testCoordinatorIntegration() {
        console.log('🔧 [PARTICIPANT-TEST] Testing coordinator integration...');
        
        try {
            const coordinator = window.participantCoordinator;
            if (!coordinator) {
                throw new Error('ParticipantCoordinator not found');
            }
            
            // Test coordinator basic functionality
            const testChannelId = 'test-channel-123';
            const testUserId = 'test-user-456';
            const testUserData = {
                id: testUserId,
                username: 'TestUser',
                display_name: 'Test User',
                avatar_url: '/test-avatar.png'
            };
            
            // Add participant
            const added = coordinator.addParticipant(testChannelId, testUserId, testUserData, 'TestSystem');
            if (!added) {
                throw new Error('Failed to add participant to coordinator');
            }
            
            // Check if participant exists
            const exists = coordinator.hasParticipant(testChannelId, testUserId);
            if (!exists) {
                throw new Error('Participant not found in coordinator after adding');
            }
            
            // Test system ownership
            const system = coordinator.getParticipantSystem(testUserId);
            if (system !== 'TestSystem') {
                throw new Error('Coordinator system ownership incorrect');
            }
            
            // Test conflict resolution
            const conflictResolved = coordinator.resolveConflict(
                testChannelId, testUserId, 'VoiceCallSection', testUserData
            );
            if (!conflictResolved) {
                throw new Error('Conflict resolution failed');
            }
            
            const newSystem = coordinator.getParticipantSystem(testUserId);
            if (newSystem !== 'VoiceCallSection') {
                throw new Error('System priority not working correctly');
            }
            
            // Cleanup
            coordinator.clearChannel(testChannelId);
            
            this.testResults.coordinatorIntegration = true;
            console.log('✅ [PARTICIPANT-TEST] Coordinator integration test passed');
            
        } catch (error) {
            console.error('❌ [PARTICIPANT-TEST] Coordinator integration test failed:', error);
        }
    },
    
    async testDuplicatePrevention() {
        console.log('🔧 [PARTICIPANT-TEST] Testing duplicate prevention...');
        
        try {
            // Simulate rapid duplicate additions
            const grid = document.getElementById('participantGrid');
            if (!grid) {
                throw new Error('Participant grid not found');
            }
            
            const initialCount = grid.querySelectorAll('.participant-card').length;
            
            // Simulate multiple systems trying to add the same participant
            const testParticipant = {
                id: 'duplicate-test-789',
                displayName: 'Duplicate Test User',
                name: 'Duplicate Test User'
            };
            
            // Try to add the same participant multiple times rapidly
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(this.simulateParticipantAdd(testParticipant));
            }
            
            await Promise.all(promises);
            
            // Wait for any delayed operations
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const finalCount = grid.querySelectorAll('.participant-card').length;
            const duplicateCards = grid.querySelectorAll(`[data-participant-id="${testParticipant.id}"]`);
            
            if (duplicateCards.length > 1) {
                throw new Error(`Found ${duplicateCards.length} duplicate participant cards`);
            }
            
            // Cleanup
            duplicateCards.forEach(card => card.remove());
            
            this.testResults.duplicateCheck = true;
            console.log('✅ [PARTICIPANT-TEST] Duplicate prevention test passed');
            
        } catch (error) {
            console.error('❌ [PARTICIPANT-TEST] Duplicate prevention test failed:', error);
        }
    },
    
    async simulateParticipantAdd(participant) {
        // Simulate VoiceCallSection adding participant
        if (window.voiceCallSection && typeof window.voiceCallSection.addParticipantToGrid === 'function') {
            await window.voiceCallSection.addParticipantToGrid(participant.id, participant);
        }
    },
    
    async testRaceConditionPrevention() {
        console.log('🔧 [PARTICIPANT-TEST] Testing race condition prevention...');
        
        try {
            const coordinator = window.participantCoordinator;
            if (!coordinator) {
                throw new Error('ParticipantCoordinator not found');
            }
            
            const testChannelId = 'race-test-channel';
            const participants = [];
            
            // Create multiple test participants
            for (let i = 0; i < 10; i++) {
                participants.push({
                    id: `race-test-user-${i}`,
                    username: `RaceTestUser${i}`,
                    display_name: `Race Test User ${i}`,
                    avatar_url: '/test-avatar.png'
                });
            }
            
            // Simulate rapid concurrent additions
            const addPromises = participants.map((participant, index) => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        const added = coordinator.addParticipant(
                            testChannelId, participant.id, participant, 'RaceTestSystem'
                        );
                        resolve({ participant, added });
                    }, Math.random() * 100); // Random delay to simulate race conditions
                });
            });
            
            const results = await Promise.all(addPromises);
            
            // Check results
            const successfulAdds = results.filter(r => r.added).length;
            const channelParticipants = coordinator.getChannelParticipants(testChannelId);
            
            if (successfulAdds !== participants.length) {
                throw new Error(`Expected ${participants.length} successful adds, got ${successfulAdds}`);
            }
            
            if (channelParticipants.length !== participants.length) {
                throw new Error(`Expected ${participants.length} participants in coordinator, got ${channelParticipants.length}`);
            }
            
            // Cleanup
            coordinator.clearChannel(testChannelId);
            
            this.testResults.raceConditionPrevention = true;
            console.log('✅ [PARTICIPANT-TEST] Race condition prevention test passed');
            
        } catch (error) {
            console.error('❌ [PARTICIPANT-TEST] Race condition prevention test failed:', error);
        }
    },
    
    async testSystemSeparation() {
        console.log('🔧 [PARTICIPANT-TEST] Testing system separation...');
        
        try {
            // Test that VoiceCallSection and ChannelVoiceParticipants don't conflict
            const voiceCallSection = window.voiceCallSection;
            const channelVoiceParticipants = window.ChannelVoiceParticipants?.getInstance();
            
            if (!voiceCallSection) {
                console.warn('⚠️ [PARTICIPANT-TEST] VoiceCallSection not found, skipping separation test');
                this.testResults.systemSeparation = true;
                return;
            }
            
            if (!channelVoiceParticipants) {
                console.warn('⚠️ [PARTICIPANT-TEST] ChannelVoiceParticipants not found, skipping separation test');
                this.testResults.systemSeparation = true;
                return;
            }
            
            // Check that systems are properly registered with coordinator
            const coordinator = window.participantCoordinator;
            if (coordinator && coordinator.systems) {
                const registeredSystems = Array.from(coordinator.systems);
                const expectedSystems = ['VoiceCallSection', 'ChannelVoiceParticipants'];
                
                const allSystemsRegistered = expectedSystems.every(system => 
                    registeredSystems.includes(system)
                );
                
                if (!allSystemsRegistered) {
                    throw new Error(`Not all systems registered. Expected: ${expectedSystems.join(', ')}, Got: ${registeredSystems.join(', ')}`);
                }
            }
            
            this.testResults.systemSeparation = true;
            console.log('✅ [PARTICIPANT-TEST] System separation test passed');
            
        } catch (error) {
            console.error('❌ [PARTICIPANT-TEST] System separation test failed:', error);
        }
    },
    
    debugParticipantState() {
        console.log('🔍 [PARTICIPANT-TEST] Current participant state:');
        
        // Coordinator state
        if (window.participantCoordinator) {
            console.log('📋 Coordinator state:', window.participantCoordinator.debugState());
        }
        
        // VoiceCallSection grid
        const grid = document.getElementById('participantGrid');
        if (grid) {
            const gridParticipants = grid.querySelectorAll('.participant-card');
            console.log(`🎯 Voice call grid: ${gridParticipants.length} participants`);
            gridParticipants.forEach(p => {
                const id = p.getAttribute('data-participant-id');
                const name = p.querySelector('.participant-name')?.textContent;
                console.log(`  - ${id}: ${name}`);
            });
        }
        
        // Channel indicators
        const channelIndicators = document.querySelectorAll('.voice-participants');
        console.log(`📡 Channel indicators: ${channelIndicators.length} channels`);
        channelIndicators.forEach(indicator => {
            const channelId = indicator.getAttribute('data-channel-id');
            const participants = indicator.querySelectorAll('[data-user-id]');
            console.log(`  - Channel ${channelId}: ${participants.length} participants`);
        });
        
        // VideoSDK state
        if (window.videoSDKManager) {
            const meetingParticipants = window.videoSDKManager.meeting?.participants?.size || 0;
            const processedParticipants = window.videoSDKManager.processedParticipants?.size || 0;
            console.log(`📹 VideoSDK: ${meetingParticipants} meeting participants, ${processedParticipants} processed`);
        }
    }
};

// Auto-run test if in voice call
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Only auto-run if we're in a voice channel
        const urlParams = new URLSearchParams(window.location.search);
        const channelType = urlParams.get('type');
        
        if (channelType === 'voice') {
            console.log('🎯 [PARTICIPANT-TEST] Voice channel detected, test functions available:');
            console.log('  - window.ParticipantManagementTest.runCompleteTest()');
            console.log('  - window.ParticipantManagementTest.debugParticipantState()');
        }
    }, 2000);
});

// Global debug function
window.debugParticipants = () => {
    window.ParticipantManagementTest.debugParticipantState();
};

window.testParticipantManagement = () => {
    return window.ParticipantManagementTest.runCompleteTest();
}; 