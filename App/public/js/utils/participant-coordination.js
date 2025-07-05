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
        
        const channelParticipants = this.activeParticipants.get(normalizedChannelId);
        if (!channelParticipants) {
            return false;
        }
        
        // Check if this system has authority to remove
        const existingData = this.participantData.get(normalizedUserId);
        if (existingData && existingData.addedBy !== systemName) {
            // Only allow removal if it's the same system that added it
            return false;
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
        }
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
