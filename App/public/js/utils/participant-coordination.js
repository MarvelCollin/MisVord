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
    }

    registerSystem(systemName) {
        this.systems.add(systemName);
    }

    addParticipant(channelId, userId, participantData, systemName) {
        const normalizedUserId = userId.toString();
        const normalizedChannelId = channelId.toString();
        
        if (!this.activeParticipants.has(normalizedChannelId)) {
            this.activeParticipants.set(normalizedChannelId, new Set());
        }
        
        const channelParticipants = this.activeParticipants.get(normalizedChannelId);
        

        if (channelParticipants.has(normalizedUserId)) {
            return false; // Already exists, don't add
        }
        

        channelParticipants.add(normalizedUserId);
        this.participantData.set(normalizedUserId, {
            ...participantData,
            channelId: normalizedChannelId,
            addedBy: systemName,
            addedAt: Date.now()
        });
        
        return true; // Successfully added
    }

    removeParticipant(channelId, userId, systemName) {
        const normalizedUserId = userId.toString();
        const normalizedChannelId = channelId.toString();
        
        const channelParticipants = this.activeParticipants.get(normalizedChannelId);
        if (!channelParticipants) {
            return false;
        }
        
        const removed = channelParticipants.delete(normalizedUserId);
        if (removed) {
            this.participantData.delete(normalizedUserId);
            

            if (channelParticipants.size === 0) {
                this.activeParticipants.delete(normalizedChannelId);
            }
        }
        
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

            channelParticipants.forEach(userId => {
                this.participantData.delete(userId);
            });
            

            this.activeParticipants.delete(normalizedChannelId);
        }
    }

    validateParticipant(channelId, userId, expectedData) {
        const existingData = this.getParticipantData(userId);
        if (!existingData) {
            return false;
        }
        

        return existingData.channelId === channelId.toString();
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
