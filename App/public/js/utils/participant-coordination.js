/**
 * Centralized Participant Coordination System
 * Prevents duplicate participants across different systems
 */
if (typeof window !== 'undefined' && window.ParticipantCoordinator) {
    // Already loaded, skip redefinition
} else {
    
class ParticipantCoordinator {
    constructor() {
        this.activeParticipants = new Map(); // channelId -> Set of userIds
        this.participantData = new Map(); // userId -> participant data
        this.systems = new Set(); // Track which systems have been initialized
        this.processedParticipants = new Set(); // Track processed participants to prevent duplicates
        this.lastUpdate = new Map(); // Track last update time per participant
        this.explicitLeaveRequested = false; // Flag to track if leave was explicitly requested by leave button
        this.pageUnloading = false; // New flag to track page unload/reload
        
        // Setup page unload listener
        this.setupPageUnloadListener();
    }

    // Add method to handle page unload
    setupPageUnloadListener() {
        window.addEventListener('beforeunload', () => {
            this.pageUnloading = true;
            this.explicitLeaveRequested = true; // Treat page unload as explicit leave
            
            // Get current channel ID from voice manager
            const currentChannelId = window.voiceManager?.currentChannelId;
            if (!currentChannelId) return;
            
            // Current user's ID
            const currentUserId = window.currentUserId || window.globalSocketManager?.userId;
            if (!currentUserId) return;
            
            // Log for debugging
            console.log('[PARTICIPANT] Page unloading, allowing participant removal');
            
            // Clean up bot participants if music player is active (same as leave button)
            if (window.musicPlayer) {
                try {
                    window.musicPlayer.stop();
                } catch (e) {
                    console.warn('[PARTICIPANT] Failed to stop music on page unload:', e);
                }
            }
            
            // Notify server about disconnection (same as leave button)
            if (window.globalSocketManager?.io) {
                try {
                    window.globalSocketManager.io.emit('unregister-voice-meeting', {
                        channel_id: currentChannelId
                    });
                    
                    // Also notify about bot leaving (same as leave button)
                    window.globalSocketManager.io.emit('bot-left-voice', {
                        channel_id: currentChannelId,
                        bot_id: '4'
                    });
                } catch (e) {
                    console.warn('[PARTICIPANT] Failed to emit socket events on page unload:', e);
                }
            }
            
            // Dispatch voice disconnect event (same as leave button)
            window.dispatchEvent(new CustomEvent('voiceDisconnect'));
        });
    }

    registerSystem(systemName) {
        this.systems.add(systemName);
    }

    addParticipant(channelId, userId, participantData, systemName) {
        const normalizedUserId = userId.toString();
        const normalizedChannelId = channelId.toString();
        const participantKey = `${normalizedChannelId}-${normalizedUserId}`;
        
        // Prevent rapid duplicate additions
        const now = Date.now();
        const lastUpdate = this.lastUpdate.get(participantKey);
        if (lastUpdate && (now - lastUpdate) < 500) {
            return false;
        }
        this.lastUpdate.set(participantKey, now);
        
        if (!this.activeParticipants.has(normalizedChannelId)) {
            this.activeParticipants.set(normalizedChannelId, new Set());
        }
        
        const channelParticipants = this.activeParticipants.get(normalizedChannelId);
        
        // Check if participant already exists
        if (channelParticipants.has(normalizedUserId)) {
            // Update existing data if needed
            const existingData = this.participantData.get(normalizedUserId);
            if (existingData && existingData.addedBy !== systemName) {
                // Allow VoiceCallSection to take over from ChannelVoiceParticipants
                if (systemName === 'VoiceCallSection' && existingData.addedBy === 'ChannelVoiceParticipants') {
                    this.participantData.set(normalizedUserId, {
                        ...participantData,
                        channelId: normalizedChannelId,
                        addedBy: systemName,
                        addedAt: Date.now(),
                        previousSystem: existingData.addedBy
                    });
                    return true;
                }
            }
            return false; // Already exists
        }
        
        // Add new participant
        channelParticipants.add(normalizedUserId);
        this.participantData.set(normalizedUserId, {
            ...participantData,
            channelId: normalizedChannelId,
            addedBy: systemName,
            addedAt: Date.now()
        });
        
        this.processedParticipants.add(participantKey);
        this.broadcastParticipantUpdate(normalizedChannelId, 'added', this.participantData.get(normalizedUserId));
        
        return true; // Successfully added
    }

    removeParticipant(channelId, userId, systemName) {
        const normalizedUserId = userId.toString();
        const normalizedChannelId = channelId.toString();
        const participantKey = `${normalizedChannelId}-${normalizedUserId}`;
        
        // MODIFIED: Allow removal if explicitly requested through leave button
        // or if the page is unloading/reloading
        const channelParticipants = this.activeParticipants.get(normalizedChannelId);
        if (!channelParticipants) {
            return false;
        }
        
        // Check if this system has authority to remove
        const existingData = this.participantData.get(normalizedUserId);
        if (existingData && existingData.addedBy !== systemName) {
            // Allow removal if:
            // 1. It's an explicit leave request
            // 2. The page is unloading/reloading
            // 3. It's the leave button action
            if (!this.explicitLeaveRequested && !this.pageUnloading && systemName !== 'leave-button-action') {
                console.log(`[PARTICIPANT] Preventing removal of ${normalizedUserId} from ${normalizedChannelId} by ${systemName} - not authorized`);
                return false;
            }
        }
        
        const removed = channelParticipants.delete(normalizedUserId);
        if (removed) {
            this.participantData.delete(normalizedUserId);
            this.processedParticipants.delete(participantKey);
            this.lastUpdate.delete(participantKey);
            
            // Clean up empty channel
            if (channelParticipants.size === 0) {
                this.activeParticipants.delete(normalizedChannelId);
            }
        }
        
        this.broadcastParticipantUpdate(normalizedChannelId, 'removed', { userId: normalizedUserId });
        
        return removed;
    }

    // Add a new method to handle explicit leave actions from the leave button
    setExplicitLeaveRequested(value = true) {
        this.explicitLeaveRequested = value;
        // Reset after a short delay to prevent unintended consequences
        if (value) {
            setTimeout(() => {
                // Only reset if page is not unloading
                if (!this.pageUnloading) {
                    this.explicitLeaveRequested = false;
                }
            }, 2000);
        }
    }

    hasParticipant(channelId, userId) {
        const normalizedUserId = userId.toString();
        const normalizedChannelId = channelId.toString();
        
        const channelParticipants = this.activeParticipants.get(normalizedChannelId);
        return channelParticipants ? channelParticipants.has(normalizedUserId) : false;
    }

    getChannelParticipants(channelId) {
        const normalizedChannelId = channelId.toString();
        const channelParticipants = this.activeParticipants.get(normalizedChannelId);
        
        if (!channelParticipants) {
            return [];
        }
        
        return Array.from(channelParticipants).map(userId => this.participantData.get(userId)).filter(Boolean);
    }

    getParticipantData(userId) {
        return this.participantData.get(userId.toString());
    }

    clearChannel(channelId) {
        // MODIFIED: Allow clearing if it's an explicit leave request or page unload
        if (!this.explicitLeaveRequested && !this.pageUnloading) {
            console.log(`[PARTICIPANT] Preventing clearChannel for ${channelId} - not an explicit leave request`);
            return false;
        }

        const normalizedChannelId = channelId.toString();
        const channelParticipants = this.activeParticipants.get(normalizedChannelId);
        
        if (channelParticipants) {
            // Clean up participant data and tracking
            channelParticipants.forEach(userId => {
                this.participantData.delete(userId);
                const participantKey = `${normalizedChannelId}-${userId}`;
                this.processedParticipants.delete(participantKey);
                this.lastUpdate.delete(participantKey);
            });
            
            // Clear the channel
            this.activeParticipants.delete(normalizedChannelId);
            return true;
        }
        return false;
    }

    validateParticipant(channelId, userId, expectedData) {
        const existingData = this.getParticipantData(userId);
        if (!existingData) {
            return false;
        }
        
        // Validate channel consistency
        return existingData.channelId === channelId.toString();
    }

    // New method to handle system transfers
    transferParticipant(channelId, userId, fromSystem, toSystem) {
        const normalizedUserId = userId.toString();
        const existingData = this.participantData.get(normalizedUserId);
        
        if (!existingData || existingData.addedBy !== fromSystem) {
            return false;
        }
        
        // Update the system ownership
        this.participantData.set(normalizedUserId, {
            ...existingData,
            addedBy: toSystem,
            previousSystem: fromSystem,
            transferredAt: Date.now()
        });
        
        return true;
    }

    // New method to get system ownership
    getParticipantSystem(userId) {
        const data = this.participantData.get(userId.toString());
        return data ? data.addedBy : null;
    }

    // New method to handle conflicts
    resolveConflict(channelId, userId, systemName, participantData) {
        const existingData = this.getParticipantData(userId);
        
        if (!existingData) {
            return this.addParticipant(channelId, userId, participantData, systemName);
        }
        
        // Priority system: VoiceCallSection > ChannelVoiceParticipants
        const systemPriority = {
            'VoiceCallSection': 2,
            'ChannelVoiceParticipants': 1
        };
        
        const currentPriority = systemPriority[existingData.addedBy] || 0;
        const newPriority = systemPriority[systemName] || 0;
        
        if (newPriority > currentPriority) {
            return this.transferParticipant(channelId, userId, existingData.addedBy, systemName);
        }
        
        return false;
    }

    broadcastParticipantUpdate(channelId, action, participantData) {
        window.dispatchEvent(new CustomEvent('voiceParticipantUpdate', {
            detail: { channelId, action, participant: participantData }
        }));
    }

    // Debug method
    debugState() {
        return {
            channels: Object.fromEntries(this.activeParticipants),
            participants: Object.fromEntries(this.participantData),
            systems: Array.from(this.systems),
            processed: Array.from(this.processedParticipants)
        };
    }

    static getInstance() {
        if (!window.participantCoordinator) {
            window.participantCoordinator = new ParticipantCoordinator();
        }
        return window.participantCoordinator;
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.ParticipantCoordinator = ParticipantCoordinator;
    window.participantCoordinator = ParticipantCoordinator.getInstance();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticipantCoordinator;
}

} // End of conditional block
