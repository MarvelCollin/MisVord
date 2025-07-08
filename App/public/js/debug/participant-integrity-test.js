/**
 * Participant Integrity Test Script
 * This script helps verify that our participant deduplication fixes are working correctly
 */

window.ParticipantIntegrityTest = {
    /**
     * Run a complete test suite for participant integrity
     */
    runTests() {
        console.group('🧪 [TEST] Running Participant Integrity Tests');
        
        const results = {
            verifyIntegrity: this.verifyParticipantIntegrity(),
            checkCoordinator: this.checkCoordinatorState(),
            checkChannelParticipants: this.checkChannelParticipantsState(),
            checkDuplicates: this.checkForDuplicateParticipants()
        };
        
        console.log('📊 [TEST] Test Results:', results);
        
        const allPassed = Object.values(results).every(result => 
            result === true || (typeof result === 'object' && result.success === true)
        );
        
        if (allPassed) {
            console.log('✅ [TEST] All tests passed! Participant integrity verified.');
        } else {
            console.error('❌ [TEST] Some tests failed. See details above.');
        }
        
        console.groupEnd();
        return results;
    },
    
    /**
     * Use VoiceCallSection's built-in integrity check
     */
    verifyParticipantIntegrity() {
        if (!window.voiceCallSection) {
            console.warn('⚠️ [TEST] VoiceCallSection not available');
            return false;
        }
        
        const result = window.voiceCallSection.verifyParticipantIntegrity();
        console.log('🔍 [TEST] Participant Integrity Check:', result);
        return result;
    },
    
    /**
     * Check for duplicate participant elements in the DOM
     */
    checkForDuplicateParticipants() {
        // Check for duplicates in the grid
        const grid = document.getElementById('participantGrid');
        if (!grid) {
            console.warn('⚠️ [TEST] Participant grid not found');
            return false;
        }
        
        const participantCards = grid.querySelectorAll('.participant-card, .bot-participant-card');
        const participantIds = Array.from(participantCards).map(card => 
            card.getAttribute('data-participant-id') || card.getAttribute('data-user-id')
        );
        
        const uniqueIds = new Set(participantIds);
        const hasDuplicates = uniqueIds.size !== participantIds.length;
        
        if (hasDuplicates) {
            console.error('❌ [TEST] Found duplicate participant cards in grid:', {
                totalCards: participantIds.length,
                uniqueIds: uniqueIds.size,
                duplicateIds: participantIds.filter((id, index) => 
                    participantIds.indexOf(id) !== index
                )
            });
        } else {
            console.log('✅ [TEST] No duplicate participant cards found in grid');
        }
        
        // Check for duplicates in the sidebar
        const sidebarContainers = document.querySelectorAll('.voice-participants');
        let sidebarDuplicates = false;
        
        sidebarContainers.forEach(container => {
            const participants = container.querySelectorAll('[data-user-id]');
            const ids = Array.from(participants).map(el => el.getAttribute('data-user-id'));
            const uniqueSidebarIds = new Set(ids);
            
            if (uniqueSidebarIds.size !== ids.length) {
                console.error('❌ [TEST] Found duplicate participants in sidebar:', {
                    channelId: container.getAttribute('data-channel-id'),
                    totalParticipants: ids.length,
                    uniqueIds: uniqueSidebarIds.size,
                    duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index)
                });
                sidebarDuplicates = true;
            }
        });
        
        if (!sidebarDuplicates && sidebarContainers.length > 0) {
            console.log('✅ [TEST] No duplicate participants found in sidebar');
        }
        
        return !hasDuplicates && !sidebarDuplicates;
    },
    
    /**
     * Check ParticipantCoordinator state
     */
    checkCoordinatorState() {
        if (!window.participantCoordinator) {
            console.warn('⚠️ [TEST] ParticipantCoordinator not available');
            return false;
        }
        
        const state = window.participantCoordinator.debugState();
        console.log('🔍 [TEST] ParticipantCoordinator state:', state);
        
        // Check for any inconsistencies in the coordinator state
        const channelIds = Object.keys(state.channels || {});
        let hasInconsistencies = false;
        
        channelIds.forEach(channelId => {
            // The channels are returned as objects from Sets, so we need to convert to array
            const participantIdsObj = state.channels[channelId];
            
            // Handle different possible formats of the participantIds
            let participantIds = [];
            
            if (Array.isArray(participantIdsObj)) {
                // If it's already an array, use it directly
                participantIds = participantIdsObj;
            } else if (participantIdsObj && typeof participantIdsObj === 'object') {
                // If it's an object (from Object.fromEntries of a Set), get the keys
                participantIds = Object.keys(participantIdsObj);
            } else if (participantIdsObj === undefined) {
                console.warn('⚠️ [TEST] No participants found for channel:', channelId);
                return;
            }
            
            // Now that we have the participant IDs as an array, check for missing data
            const participantData = participantIds
                .map(id => state.participants[id])
                .filter(Boolean);
            
            if (participantIds.length !== participantData.length) {
                console.error('❌ [TEST] Inconsistency in ParticipantCoordinator:', {
                    channelId,
                    participantIdsCount: participantIds.length,
                    participantDataCount: participantData.length,
                    missingData: participantIds.filter(id => !state.participants[id])
                });
                hasInconsistencies = true;
            }
        });
        
        if (!hasInconsistencies) {
            console.log('✅ [TEST] ParticipantCoordinator state is consistent');
        }
        
        return !hasInconsistencies;
    },
    
    /**
     * Check ChannelVoiceParticipants state
     */
    checkChannelParticipantsState() {
        if (!window.ChannelVoiceParticipants) {
            console.warn('⚠️ [TEST] ChannelVoiceParticipants not available');
            return false;
        }
        
        const instance = window.ChannelVoiceParticipants.getInstance();
        if (!instance) {
            console.warn('⚠️ [TEST] ChannelVoiceParticipants instance not available');
            return false;
        }
        
        // Check if participants map matches DOM
        const participants = instance.participants;
        const containers = document.querySelectorAll('.voice-participants');
        let hasInconsistencies = false;
        
        containers.forEach(container => {
            const channelId = container.getAttribute('data-channel-id');
            if (!channelId) return;
            
            const channelParticipants = participants.get(channelId);
            const domParticipants = container.querySelectorAll('[data-user-id]');
            
            if (!channelParticipants && domParticipants.length > 0) {
                console.error('❌ [TEST] DOM has participants but ChannelVoiceParticipants has none:', {
                    channelId,
                    domCount: domParticipants.length
                });
                hasInconsistencies = true;
            } else if (channelParticipants && channelParticipants.size !== domParticipants.length) {
                console.error('❌ [TEST] Mismatch between ChannelVoiceParticipants and DOM:', {
                    channelId,
                    channelParticipantsSize: channelParticipants.size,
                    domCount: domParticipants.length
                });
                hasInconsistencies = true;
            }
        });
        
        if (!hasInconsistencies) {
            console.log('✅ [TEST] ChannelVoiceParticipants state matches DOM');
        }
        
        return !hasInconsistencies;
    },
    
    /**
     * Simulate a forced leave to test cleanup
     */
    simulateForcedLeave() {
        console.group('🧪 [TEST] Simulating forced leave');
        
        // Store state before leave
        const beforeState = {
            isConnected: window.videoSDKManager?.isConnected,
            channelId: window.voiceManager?.currentChannelId,
            participantCount: document.querySelectorAll('.participant-card').length
        };
        
        console.log('📊 [TEST] State before leave:', beforeState);
        
        // Trigger leave
        if (window.voiceManager && typeof window.voiceManager.leaveVoice === 'function') {
            window.voiceManager.leaveVoice();
            
            // Check state after leave
            setTimeout(() => {
                const afterState = {
                    isConnected: window.videoSDKManager?.isConnected,
                    channelId: window.voiceManager?.currentChannelId,
                    participantCount: document.querySelectorAll('.participant-card').length
                };
                
                console.log('📊 [TEST] State after leave:', afterState);
                
                // Verify cleanup
                const cleanupSuccess = !afterState.isConnected && 
                                      !afterState.channelId && 
                                      afterState.participantCount === 0;
                                      
                if (cleanupSuccess) {
                    console.log('✅ [TEST] Forced leave cleanup successful');
                } else {
                    console.error('❌ [TEST] Forced leave cleanup failed');
                }
                
                console.groupEnd();
                return cleanupSuccess;
            }, 1000);
        } else {
            console.error('❌ [TEST] VoiceManager.leaveVoice not available');
            console.groupEnd();
            return false;
        }
    },
    
    /**
     * Run tests automatically when the voice call is connected
     */
    setupAutoTest() {
        window.addEventListener('videosdkMeetingFullyJoined', () => {
            setTimeout(() => {
                console.log('🔄 [TEST] Voice connected, running auto-tests...');
                this.runTests();
            }, 2000);
        });
        
        window.addEventListener('voiceDisconnect', () => {
            setTimeout(() => {
                console.log('🔄 [TEST] Voice disconnected, running cleanup tests...');
                this.checkForDuplicateParticipants();
            }, 1000);
        });
    }
};

// Auto-setup tests
document.addEventListener('DOMContentLoaded', () => {
    window.ParticipantIntegrityTest.setupAutoTest();
    console.log('✅ [TEST] Participant Integrity Test initialized');
});

// Export for console use
window.testParticipantIntegrity = () => window.ParticipantIntegrityTest.runTests();
window.simulateForcedLeave = () => window.ParticipantIntegrityTest.simulateForcedLeave(); 