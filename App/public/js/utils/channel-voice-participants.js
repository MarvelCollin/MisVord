class ChannelVoiceParticipants {
    constructor() {
        this.participantsByChannel = {}; // { channelId: [ {user_id, username, avatar_url} ] }
        this.friendsManager = null;
        this.initialised = false;
        this.setup();
    }

    static getInstance() {
        if (!window.__CHANNEL_VOICE_PARTICIPANT_INSTANCE__) {
            window.__CHANNEL_VOICE_PARTICIPANT_INSTANCE__ = new ChannelVoiceParticipants();
        }
        return window.__CHANNEL_VOICE_PARTICIPANT_INSTANCE__;
    }

    setup() {
        this.waitForDependencies(() => {
            this.initialised = true;
            this.hookFriendPresence();
            this.hookSocketVoiceUpdates();
            this.updateAllChannelsFromPresence();
        });
    }

    waitForDependencies(callback, tries = 0) {
        if (window.FriendsManager) {
            this.friendsManager = window.FriendsManager.getInstance();
            callback();
        } else if (tries < 40) { // ~2s
            setTimeout(() => this.waitForDependencies(callback, tries + 1), 50);
        } else {
            console.warn('[VOICE-PARTICIPANTS] FriendsManager not available after waiting');
            callback();
        }
    }

    hookFriendPresence() {
        if (!this.friendsManager) return;

        // React to presence events broadcast by FriendsManager
        this.friendsManager.subscribe((type) => {
            if (
                type === 'user-online' ||
                type === 'user-offline' ||
                type === 'user-presence-update' ||
                type === 'online-users-updated'
            ) {
                this.scheduleUpdate();
            }
        });
    }

    hookSocketVoiceUpdates() {
        if (window.globalSocketManager?.io) {
            window.globalSocketManager.io.on('voice-meeting-update', () => {
                // voice-meeting-update already triggers presence updates from server,
                // but listen anyway for safety.
                this.scheduleUpdate();
            });
        }
    }

    scheduleUpdate() {
        clearTimeout(this._updateTimer);
        this._updateTimer = setTimeout(() => this.updateAllChannelsFromPresence(), 50);
    }

    /* -------------------------------------------------- */
    /*                   CORE LOGIC                       */
    /* -------------------------------------------------- */
    updateAllChannelsFromPresence() {
        const onlineUsers = this.friendsManager?.cache?.onlineUsers || {};

        // Rebuild mapping
        this.participantsByChannel = {};
        Object.values(onlineUsers).forEach((user) => {
            const activity = user.activity_details;
            if (activity && activity.type && activity.type.startsWith('In Voice - ') && activity.channel_id) {
                const channelId = String(activity.channel_id);
                if (!this.participantsByChannel[channelId]) {
                    this.participantsByChannel[channelId] = [];
                }
                this.participantsByChannel[channelId].push({
                    user_id: user.user_id,
                    username: this.getUsername(user.user_id, user.username),
                    avatar_url: this.getAvatar(user.user_id, user.avatar_url || user.avatar || null),
                    status: user.status
                });
            }
        });

        // Update every container currently in the DOM
        const containers = document.querySelectorAll('.voice-participants[data-channel-id]');
        containers.forEach((container) => {
            const channelId = container.getAttribute('data-channel-id');
            this.updateParticipantContainer(channelId, container);
        });
    }

    /* -------------------------------------------------- */
    /*               USER INFO FALLBACKS                  */
    /* -------------------------------------------------- */
    getAvatar(userId, fallback = null) {
        if (fallback) return fallback;

        const profileEl = document.querySelector(`.user-profile-trigger[data-user-id="${userId}"] img`);
        if (profileEl && profileEl.src) {
            return profileEl.src;
        }

        // Try global default
        return '/public/assets/common/default-profile-picture.png';
    }

    getUsername(userId, fallback = 'User') {
        const nameEl = document.querySelector(`.member-username[data-user-id="${userId}"]`);
        if (nameEl) {
            return nameEl.textContent.replace(/Nitro\s*Member/gi, '').trim();
        }
        return (fallback || '').replace(/Nitro\s*Member/gi, '').trim();
    }

    /**
     * Update (or re-render) one container. If container element is
     * omitted it will be looked up in DOM.
     */
    updateParticipantContainer(channelId, containerEl = null) {
        const participants = this.participantsByChannel[String(channelId)] || [];

        if (!containerEl) {
            containerEl = document.querySelector(`.voice-participants[data-channel-id="${channelId}"]`);
            if (!containerEl) return; // nothing to do
        }

        const countElement = document.querySelector(`.channel-item[data-channel-id="${channelId}"] .voice-user-count`);

        if (participants.length === 0) {
            containerEl.innerHTML = '';
            containerEl.classList.add('hidden');
            if (countElement) {
                countElement.innerHTML = '';
                countElement.classList.add('hidden');
            }
            return;
        }

        // Show container & count
        containerEl.classList.remove('hidden');

        // ---------------- Inline (global) count ------------------
        if (countElement) {
            const maxInline = 3;
            const inlineParticipants = participants.slice(0, maxInline);
            const inlineExtra = participants.length - maxInline;

            const inlineHtml = [
                ...inlineParticipants.map((p, idx) => {
                    const avatar = p.avatar_url || '/public/assets/common/default-profile-picture.png';
                    // Use relative wrapper so status badge could be added later
                    return `<span class="relative ${idx !== 0 ? 'ml-[-6px]' : ''}"><img src="${avatar}" class="w-5 h-5 rounded-full user-avatar" onerror="this.src='/public/assets/common/default-profile-picture.png'"></span>`;
                }),
                inlineExtra > 0 ? `<span class="text-[10px] text-gray-400 ml-1">+${inlineExtra}</span>` : ''
            ].join('');

            countElement.innerHTML = inlineHtml;
            countElement.classList.remove('hidden');
            countElement.classList.add('flex');
        }

        // ---------------- Full list below channel ------------------
        const maxVisible = 5;
        const visibleParticipants = participants.slice(0, maxVisible);
        const extraCount = participants.length - maxVisible;

        const html = [
            ...visibleParticipants.map((p) => {
                const avatar = p.avatar_url || '/public/assets/common/default-profile-picture.png';
                return `<div class="flex items-center mb-1" data-no-nitro="1">
                            <div class="relative mr-2" data-no-nitro="1">
                                <img src="${avatar}" alt="${p.username}" class="w-5 h-5 rounded-full user-avatar border-2 border-discord-darker" onerror="this.src='/public/assets/common/default-profile-picture.png'" data-no-nitro="1">
                            </div>
                            <span class="text-xs text-gray-300 truncate" data-no-nitro="1">${p.username}</span>
                        </div>`;
            }),
            extraCount > 0 ? `<span class="text-xs text-gray-400 ml-1" data-no-nitro="1">+${extraCount}</span>` : ''
        ].join('');

        containerEl.innerHTML = html;

        // Ensure any existing crowns are removed (in case Manager processed before our exclusion rule)
        containerEl.querySelectorAll('.nitro-crown-wrapper').forEach(el => el.remove());

        // Remove any stray 'Nitro Member' text nodes or elements
        containerEl.querySelectorAll('*').forEach(node => {
            if (node.textContent && node.textContent.trim() === 'Nitro Member') {
                node.remove();
            }
        });
    }

    /**
     * Manual helper (used by tests) to inject participant.
     */
    addParticipant(channelId, userId, username = 'Unknown') {
        if (!this.participantsByChannel[channelId]) {
            this.participantsByChannel[channelId] = [];
        }
        const existing = this.participantsByChannel[channelId].find((p) => String(p.user_id) === String(userId));
        if (!existing) {
            this.participantsByChannel[channelId].push({ user_id: userId, username });
            this.updateParticipantContainer(channelId);
        }
    }

    updateChannelCount(channelId, count) {
        const countElement = document.querySelector(`.channel-item[data-channel-id="${channelId}"] .voice-user-count`);
        if (countElement) {
            if (count > 0) {
                countElement.textContent = count;
                countElement.classList.remove('hidden');
            } else {
                countElement.textContent = '';
                countElement.classList.add('hidden');
            }
        }
    }

    /**
     * Sync participants when using VideoSDK (optional). Keeps stub simple.
     */
    syncWithVideoSDK() {
        if (!window.videoSDKManager?.meeting?.participants) return;

        const channelId = window.voiceManager?.currentChannelId || null;
        if (!channelId) return;

        const participants = Array.from(window.videoSDKManager.meeting.participants.values()).map((p) => ({
            user_id: p.id,
            username: p.displayName || p.name || 'User',
            avatar_url: null,
            status: 'online'
        }));

        this.participantsByChannel[channelId] = participants;
        this.updateParticipantContainer(channelId);
    }
}

// Expose globally
window.ChannelVoiceParticipants = ChannelVoiceParticipants;

// Auto-initialise after DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ChannelVoiceParticipants.getInstance());
} else {
    ChannelVoiceParticipants.getInstance();
}
