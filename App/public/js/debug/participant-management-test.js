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
        
        

        Object.keys(this.testResults).forEach(key => {
            this.testResults[key] = false;
        });
        
        try {

            await this.testCoordinatorIntegration();
            

            await this.testDuplicatePrevention();
            

            await this.testRaceConditionPrevention();
            

            await this.testSystemSeparation();
            

            const passedTests = Object.keys(this.testResults).filter(key => 
                key !== 'overallPassed' && this.testResults[key]
            ).length;
            const totalTests = Object.keys(this.testResults).length - 1;
            
            this.testResults.overallPassed = passedTests === totalTests;
            
            
            
            
            if (this.testResults.overallPassed) {
                
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
        
        
        try {
            const coordinator = window.participantCoordinator;
            if (!coordinator) {
                throw new Error('ParticipantCoordinator not found');
            }
            

            const testChannelId = 'test-channel-123';
            const testUserId = 'test-user-456';
            const testUserData = {
                id: testUserId,
                username: 'TestUser',
                display_name: 'Test User',
                avatar_url: '/test-avatar.png'
            };
            

            const added = coordinator.addParticipant(testChannelId, testUserId, testUserData, 'TestSystem');
            if (!added) {
                throw new Error('Failed to add participant to coordinator');
            }
            

            const exists = coordinator.hasParticipant(testChannelId, testUserId);
            if (!exists) {
                throw new Error('Participant not found in coordinator after adding');
            }
            

            const system = coordinator.getParticipantSystem(testUserId);
            if (system !== 'TestSystem') {
                throw new Error('Coordinator system ownership incorrect');
            }
            

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
            

            coordinator.clearChannel(testChannelId);
            
            this.testResults.coordinatorIntegration = true;
            
            
        } catch (error) {
            console.error('❌ [PARTICIPANT-TEST] Coordinator integration test failed:', error);
        }
    },
    
    async testDuplicatePrevention() {
        
        
        try {

            const grid = document.getElementById('participantGrid');
            if (!grid) {
                throw new Error('Participant grid not found');
            }
            
            const initialCount = grid.querySelectorAll('.participant-card').length;
            

            const testParticipant = {
                id: 'duplicate-test-789',
                displayName: 'Duplicate Test User',
                name: 'Duplicate Test User'
            };
            

            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(this.simulateParticipantAdd(testParticipant));
            }
            
            await Promise.all(promises);
            

            await new Promise(resolve => setTimeout(resolve, 500));
            
            const finalCount = grid.querySelectorAll('.participant-card').length;
            const duplicateCards = grid.querySelectorAll(`[data-participant-id="${testParticipant.id}"]`);
            
            if (duplicateCards.length > 1) {
                throw new Error(`Found ${duplicateCards.length} duplicate participant cards`);
            }
            

            duplicateCards.forEach(card => card.remove());
            
            this.testResults.duplicateCheck = true;
            
            
        } catch (error) {
            console.error('❌ [PARTICIPANT-TEST] Duplicate prevention test failed:', error);
        }
    },
    
    async simulateParticipantAdd(participant) {
        window.dispatchEvent(new CustomEvent('videosdkParticipantJoined', {
            detail: {
                participant: participant.id,
                participantObj: participant
            }
        }));
    },
    
    async testRaceConditionPrevention() {
        
        
        try {
            const coordinator = window.participantCoordinator;
            if (!coordinator) {
                throw new Error('ParticipantCoordinator not found');
            }
            
            const testChannelId = 'race-test-channel';
            const participants = [];
            

            for (let i = 0; i < 10; i++) {
                participants.push({
                    id: `race-test-user-${i}`,
                    username: `RaceTestUser${i}`,
                    display_name: `Race Test User ${i}`,
                    avatar_url: '/test-avatar.png'
                });
            }
            

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
            

            const successfulAdds = results.filter(r => r.added).length;
            const channelParticipants = coordinator.getChannelParticipants(testChannelId);
            
            if (successfulAdds !== participants.length) {
                throw new Error(`Expected ${participants.length} successful adds, got ${successfulAdds}`);
            }
            
            if (channelParticipants.length !== participants.length) {
                throw new Error(`Expected ${participants.length} participants in coordinator, got ${channelParticipants.length}`);
            }
            

            coordinator.clearChannel(testChannelId);
            
            this.testResults.raceConditionPrevention = true;
            
            
        } catch (error) {
            console.error('❌ [PARTICIPANT-TEST] Race condition prevention test failed:', error);
        }
    },
    
    async testSystemSeparation() {
        
        
        try {

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
            
            
        } catch (error) {
            console.error('❌ [PARTICIPANT-TEST] System separation test failed:', error);
        }
    },
    
    debugParticipantState() {
        
        

        if (window.participantCoordinator) {
            
        }
        

        const grid = document.getElementById('participantGrid');
        if (grid) {
            const gridParticipants = grid.querySelectorAll('.participant-card');
            
            gridParticipants.forEach(p => {
                const id = p.getAttribute('data-participant-id');
                const name = p.querySelector('.participant-name')?.textContent;
                
            });
        }
        

        const channelIndicators = document.querySelectorAll('.voice-participants');
        
        channelIndicators.forEach(indicator => {
            const channelId = indicator.getAttribute('data-channel-id');
            const participants = indicator.querySelectorAll('[data-user-id]');
            
        });
        

        if (window.videoSDKManager) {
            const meetingParticipants = window.videoSDKManager.meeting?.participants?.size || 0;
            const processedParticipants = window.videoSDKManager.processedParticipants?.size || 0;
            
        }
    }
};


document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {

        const urlParams = new URLSearchParams(window.location.search);
        const channelType = urlParams.get('type');
        
        if (channelType === 'voice') {
            
            
            
        }
    }, 2000);
});


window.debugParticipants = () => {
    window.ParticipantManagementTest.debugParticipantState();
};

window.testParticipantManagement = () => {
    return window.ParticipantManagementTest.runCompleteTest();
}; 