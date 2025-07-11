/**
 * Voice Debug Panel
 * Displays real-time information about voice participants across channels
 */


if (typeof window.VoiceDebugPanel === 'undefined') {
    window.VoiceDebugPanel = class VoiceDebugPanel {
        constructor() {
            this.panel = null;
            this.isVisible = false;
            this.participants = {
                local: new Map(),
                external: new Map(),
                bots: new Map()
            };
            this.channels = new Map();
            this.meetingIds = new Map();
            this.updateInterval = null;
            this.testResults = [];
            
            this.init();
        }
        
        init() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }
        
        setup() {
            this.createPanel();
            this.setupToggleButton();
            this.setupEventListeners();
            this.startUpdateCycle();
            console.log('✅ [DEBUG-PANEL] Voice debug panel initialized');
        }
        
        createPanel() {
            if (this.panel) return;
            
            this.panel = document.createElement('div');
            this.panel.id = 'voice-debug-panel';
            
            Object.assign(this.panel.style, {
                position: 'fixed',
                bottom: '10px',
                right: '10px',
                width: '350px',
                maxHeight: '400px',
                overflowY: 'auto',
                background: 'rgba(30, 31, 34, 0.9)',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '8px',
                borderRadius: '6px',
                zIndex: '9999',
                display: 'none',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(79, 84, 92, 0.6)'
            });
            
            this.updatePanelContent();
            document.body.appendChild(this.panel);
        }
        
        setupToggleButton() {

            const existingBtn = document.getElementById('voice-debug-toggle');
            if (existingBtn) {
                existingBtn.remove();
            }
            
            const btn = document.createElement('button');
            btn.id = 'voice-debug-toggle';
            btn.innerHTML = '🎤';
            btn.title = 'Toggle Voice Debug Panel';
            
            Object.assign(btn.style, {
                position: 'fixed',
                bottom: '10px',
                right: '10px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#5865f2',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                zIndex: '10000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            });
            
            btn.addEventListener('click', () => this.togglePanel());
            document.body.appendChild(btn);
        }
        
        togglePanel() {
            this.isVisible = !this.isVisible;
            this.panel.style.display = this.isVisible ? 'block' : 'none';
            

            const toggleBtn = document.getElementById('voice-debug-toggle');
            if (toggleBtn) {
                toggleBtn.style.bottom = this.isVisible ? '410px' : '10px';
            }
            
            if (this.isVisible) {
                this.collectData();
                this.updatePanelContent();
            }
        }
        
        setupEventListeners() {

            window.addEventListener('participantJoined', (e) => {
                this.collectData();
                this.updatePanelContent();
            });
            
            window.addEventListener('participantLeft', (e) => {
                this.collectData();
                this.updatePanelContent();
            });
            

            window.addEventListener('voiceConnect', (e) => {
                this.collectData();
                this.updatePanelContent();
            });
            
            window.addEventListener('voiceDisconnect', (e) => {
                this.collectData();
                this.updatePanelContent();
            });
            

            window.addEventListener('bot-voice-participant-joined', (e) => {
                this.collectData();
                this.updatePanelContent();
            });
            
            window.addEventListener('bot-voice-participant-left', (e) => {
                this.collectData();
                this.updatePanelContent();
            });
            

            if (window.globalSocketManager?.io) {
                this.setupSocketListeners();
            } else {
                window.addEventListener('globalSocketReady', () => this.setupSocketListeners());
            }
        }
        
        setupSocketListeners() {
            const socket = window.globalSocketManager?.io;
            if (!socket) return;
            
            socket.on('voice-meeting-update', (data) => {
                this.collectData();
                this.updatePanelContent();
            });
            
            socket.on('voice-meeting-status', (data) => {
                this.collectData();
                this.updatePanelContent();
            });
        }
        
        startUpdateCycle() {

            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
            
            this.updateInterval = setInterval(() => {
                if (this.isVisible) {
                    this.collectData();
                    this.updatePanelContent();
                    this.runTests();
                }
            }, 3000);
        }
        
        collectData() {

            if (window.voiceManager) {
                this.participants.local = window.voiceManager.getAllParticipants() || new Map();
                this.currentChannelId = window.voiceManager.currentChannelId;
                this.currentMeetingId = window.voiceManager.currentMeetingId;
            }
            

            if (window.ChannelVoiceParticipants) {
                const instance = window.ChannelVoiceParticipants.getInstance();
                if (instance.externalParticipants) {
                    this.participants.external = instance.externalParticipants;
                }
            }
            

            if (window.BotComponent && window.BotComponent.voiceBots) {
                this.participants.bots = window.BotComponent.voiceBots;
            }
            

            this.channels = new Map();
            this.meetingIds = new Map();
            

            document.querySelectorAll('[data-channel-type="voice"]').forEach(channel => {
                const channelId = channel.getAttribute('data-channel-id');
                const meetingId = channel.getAttribute('data-meeting-id');
                if (channelId) {
                    this.channels.set(channelId, {
                        name: channel.querySelector('.channel-name')?.textContent?.trim() || 'Voice Channel',
                        meetingId: meetingId || null
                    });
                    
                    if (meetingId) {
                        this.meetingIds.set(channelId, meetingId);
                    }
                }
            });
            

            if (window.localStorageManager) {
                const voiceState = window.localStorageManager.getUnifiedVoiceState();
                if (voiceState && voiceState.channelId && voiceState.meetingId) {
                    this.unifiedVoiceState = voiceState;
                    if (!this.meetingIds.has(voiceState.channelId)) {
                        this.meetingIds.set(voiceState.channelId, voiceState.meetingId);
                    }
                }
            }
        }
        
        updatePanelContent() {
            if (!this.panel) return;
            
            let html = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <strong>Voice Debug Panel</strong>
                    <div>
                        <button id="run-voice-tests" style="font-size: 10px; padding: 2px 5px; background: #5865f2; border: none; color: white; border-radius: 3px; cursor: pointer; margin-right: 5px;">Run Tests</button>
                        <button id="sync-voice-state" style="font-size: 10px; padding: 2px 5px; background: #3ba55c; border: none; color: white; border-radius: 3px; cursor: pointer;">Sync State</button>
                    </div>
                </div>
                <div style="margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.2);">
                    <div>Current User: ${this.getCurrentUsername() || 'Not logged in'} (${this.getCurrentUserId() || 'Unknown'})</div>
                    <div>Local Voice Channel: ${this.currentChannelId ? `#${this.currentChannelId}` : 'None'}</div>
                    <div>Current Meeting ID: ${this.currentMeetingId || 'None'}</div>
                </div>
            `;
            

            const currentChannel = this.channels.get(this.currentChannelId);
            if (currentChannel) {
                html += `
                    <div style="margin-bottom: 10px; padding: 5px; background: rgba(88, 101, 242, 0.1); border-radius: 4px; border-left: 3px solid #5865f2;">
                        <div><strong>Current Channel:</strong></div>
                        <div>Name: ${currentChannel.name}</div>
                        <div>ID: ${this.currentChannelId}</div>
                        <div>Meeting ID: ${currentChannel.meetingId || 'None'}</div>
                        <div>Participants: ${this.getParticipantCountForChannel(this.currentChannelId)}</div>
                    </div>
                `;
            }
            

            if (this.unifiedVoiceState) {
                const channelMismatch = this.currentChannelId !== this.unifiedVoiceState.channelId;
                const meetingMismatch = currentChannel && currentChannel.meetingId && 
                                       this.unifiedVoiceState.meetingId && 
                                       currentChannel.meetingId !== this.unifiedVoiceState.meetingId;
                const hasMismatch = channelMismatch || meetingMismatch;
                
                html += `
                    <div style="margin-bottom: 10px; padding: 5px; background: rgba(88, 101, 242, 0.2); border-radius: 4px; ${hasMismatch ? 'border-left: 3px solid #ed4245;' : ''}">
                        <div><strong>Unified Voice State:</strong></div>
                        <div>Connected: ${this.unifiedVoiceState.isConnected ? '✅' : '❌'}</div>
                        <div>Channel: ${this.unifiedVoiceState.channelId || 'None'} ${channelMismatch ? '<span style="color:#ed4245;font-weight:bold"> ⚠️ MISMATCH</span>' : ''}</div>
                        <div>Meeting: ${this.unifiedVoiceState.meetingId || 'None'} ${meetingMismatch ? '<span style="color:#ed4245;font-weight:bold"> ⚠️ MISMATCH</span>' : ''}</div>
                        <div>Since: ${this.unifiedVoiceState.connectionTime ? new Date(this.unifiedVoiceState.connectionTime).toLocaleTimeString() : 'N/A'}</div>
                        ${channelMismatch ? `<div style="margin-top: 5px; font-size: 10px; color: #ed4245;">Channel ID mismatch detected! VoiceManager shows ${this.currentChannelId} but localStorage has ${this.unifiedVoiceState.channelId}</div>` : ''}
                        ${meetingMismatch ? `<div style="margin-top: 5px; font-size: 10px; color: #ed4245;">Meeting ID mismatch detected! Current shows ${currentChannel.meetingId} but localStorage has ${this.unifiedVoiceState.meetingId}</div>` : ''}
                    </div>
                `;
            }
            

            html += '<div style="margin-bottom: 10px;"><strong>Channels:</strong></div>';
            
            if (this.channels.size === 0) {
                html += '<div style="padding-left: 10px; color: #aaa;">No voice channels found</div>';
            } else {
                this.channels.forEach((channelData, channelId) => {
                    const meetingId = this.meetingIds.get(channelId);
                    const count = this.getParticipantCountForChannel(channelId);
                    
                    html += `
                        <div style="margin-bottom: 5px; padding: 3px 5px; ${this.currentChannelId === channelId ? 'background: rgba(88, 101, 242, 0.3);' : ''}">
                            <div><strong>#${channelData.name}</strong> (${channelId}) - ${count} participants</div>
                            <div style="font-size: 10px;">Meeting ID: ${meetingId || 'None'}</div>
                            ${this.renderParticipantsForChannel(channelId)}
                        </div>
                    `;
                });
            }
            

            if (this.testResults.length > 0) {
                html += '<div style="margin-top: 10px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.2);"><strong>Test Results:</strong></div>';
                
                this.testResults.forEach(result => {
                    const icon = result.passed ? '✅' : '❌';
                    const color = result.passed ? '#3ba55c' : '#ed4245';
                    
                    html += `
                        <div style="margin-top: 5px; color: ${color};">
                            ${icon} ${result.name}
                        </div>
                        ${result.message ? `<div style="padding-left: 20px; font-size: 10px;">${result.message}</div>` : ''}
                    `;
                });
            }
            
            this.panel.innerHTML = html;
            

            setTimeout(() => {
                const testBtn = document.getElementById('run-voice-tests');
                if (testBtn) {
                    testBtn.addEventListener('click', () => this.runTests());
                }
                
                const syncBtn = document.getElementById('sync-voice-state');
                if (syncBtn) {
                    syncBtn.addEventListener('click', () => this.syncVoiceState());
                }
            }, 0);
        }
        
        renderParticipantsForChannel(channelId) {
            let participants = [];
            

            if (this.currentChannelId === channelId && this.participants.local.size > 0) {
                this.participants.local.forEach((data, id) => {
                    if (!id.startsWith('bot-')) { // 
                        participants.push({
                            id: id,
                            name: data.name || data.username || 'Unknown',
                            isBot: false,
                            isLocal: data.isLocal || false,
                            source: 'local'
                        });
                    }
                });
            }
            

            const externalMap = this.participants.external.get(channelId);
            if (externalMap && externalMap.size > 0) {
                externalMap.forEach((data, id) => {

                    if (!participants.some(p => p.id === id)) {
                        participants.push({
                            id: id,
                            name: data.username || 'Unknown',
                            isBot: false,
                            isLocal: false,
                            source: 'external'
                        });
                    }
                });
            }
            

            if (this.participants.bots && this.participants.bots.size > 0) {
                this.participants.bots.forEach((data, id) => {
                    if (data.channel_id === channelId) {
                        const botId = `bot-${data.bot_id || id}`;

                        if (!participants.some(p => p.id === botId)) {
                            participants.push({
                                id: botId,
                                name: data.username || 'TitiBot',
                                isBot: true,
                                isLocal: false,
                                source: 'bot'
                            });
                        }
                    }
                });
            }
            
            if (participants.length === 0) {
                return '<div style="padding-left: 10px; font-size: 10px; color: #aaa;">No participants</div>';
            }
            
            let html = '<div style="padding-left: 10px; font-size: 11px;">';
            
            participants.forEach(p => {
                const icon = p.isBot ? '🤖' : (p.isLocal ? '👤' : '👥');
                const source = p.source === 'local' ? 'SDK' : (p.source === 'external' ? 'Socket' : 'Bot');
                
                html += `<div>${icon} ${p.name}${p.isLocal ? ' (You)' : ''} <span style="color: #aaa; font-size: 9px;">${source}</span></div>`;
            });
            
            html += '</div>';
            return html;
        }
        
        getParticipantCountForChannel(channelId) {
            let count = 0;
            

            if (this.currentChannelId === channelId && this.participants.local.size > 0) {
                count += this.participants.local.size;
            }
            

            const externalMap = this.participants.external.get(channelId);
            if (externalMap && externalMap.size > 0) {

                if (this.currentChannelId !== channelId) {
                    count += externalMap.size;
                }
            }
            

            if (this.participants.bots && this.participants.bots.size > 0) {
                this.participants.bots.forEach(data => {
                    if (data.channel_id === channelId) {

                        if (this.currentChannelId !== channelId) {
                            count++;
                        }
                    }
                });
            }
            
            return count;
        }
        
        getCurrentUserId() {
            return document.querySelector('meta[name="user-id"]')?.content || 
                   window.currentUserId;
        }
        
        getCurrentUsername() {
            return document.querySelector('meta[name="username"]')?.content || 
                   window.currentUsername;
        }
        
        runTests() {
            this.testResults = [];
            

            this.testDuplicateParticipants();
            

            this.testDomMatchesData();
            

            this.testVoiceManagerMatchesLocalStorage();
            

            this.testOrphanedMeetings();
            

            this.testSidebarCounts();
            

            this.updatePanelContent();
        }
        
        testDuplicateParticipants() {
            const result = {
                name: 'Duplicate Participants Check',
                passed: true,
                message: ''
            };
            
            const allParticipants = new Map();
            const duplicates = [];
            

            if (this.participants.local.size > 0) {
                this.participants.local.forEach((data, id) => {
                    if (allParticipants.has(id)) {
                        duplicates.push({ id, source1: 'local', source2: allParticipants.get(id) });
                        result.passed = false;
                    } else {
                        allParticipants.set(id, 'local');
                    }
                });
            }
            

            this.participants.external.forEach((map, channelId) => {
                map.forEach((data, id) => {
                    if (allParticipants.has(id)) {
                        duplicates.push({ id, source1: 'external', source2: allParticipants.get(id) });
                        result.passed = false;
                    } else {
                        allParticipants.set(id, 'external');
                    }
                });
            });
            

            if (this.participants.bots && this.participants.bots.size > 0) {
                this.participants.bots.forEach((data, id) => {
                    const botId = `bot-${data.bot_id || id}`;
                    if (allParticipants.has(botId)) {
                        duplicates.push({ id: botId, source1: 'bot', source2: allParticipants.get(botId) });
                        result.passed = false;
                    } else {
                        allParticipants.set(botId, 'bot');
                    }
                });
            }
            
            if (!result.passed) {
                result.message = `Found ${duplicates.length} duplicate participant(s): ${duplicates.map(d => `${d.id} (${d.source1}/${d.source2})`).join(', ')}`;
            } else {
                result.message = `No duplicates found among ${allParticipants.size} participants`;
            }
            
            this.testResults.push(result);
        }
        
        testDomMatchesData() {
            const result = {
                name: 'DOM vs Data Consistency',
                passed: true,
                message: ''
            };
            

            const domParticipants = document.querySelectorAll('.voice-participant-card');
            const sidebarParticipantCount = domParticipants.length;
            

            let expectedCount = 0;
            
            if (this.currentChannelId) {

                expectedCount = this.getParticipantCountForChannel(this.currentChannelId);
                
                if (sidebarParticipantCount !== expectedCount) {
                    result.passed = false;
                    result.message = `DOM shows ${sidebarParticipantCount} participants, but data indicates ${expectedCount} participants for channel ${this.currentChannelId}`;
                } else {
                    result.message = `DOM correctly shows ${sidebarParticipantCount} participants for channel ${this.currentChannelId}`;
                }
            } else {
                result.message = 'Not currently in a voice channel, skipping DOM test';
            }
            
            this.testResults.push(result);
        }
        
        testVoiceManagerMatchesLocalStorage() {
            const result = {
                name: 'VoiceManager vs LocalStorage',
                passed: true,
                message: ''
            };
            
            if (!window.voiceManager || !window.localStorageManager) {
                result.passed = false;
                result.message = 'VoiceManager or LocalStorageManager not available';
                this.testResults.push(result);
                return;
            }
            
            const voiceState = window.localStorageManager.getUnifiedVoiceState();
            
            if (!voiceState) {
                result.message = 'No unified voice state in localStorage';
                this.testResults.push(result);
                return;
            }
            

            if (voiceState.isConnected !== window.voiceManager.isConnected) {
                result.passed = false;
                result.message = `Connection state mismatch: localStorage=${voiceState.isConnected}, voiceManager=${window.voiceManager.isConnected}`;
            }
            

            if (voiceState.isConnected && voiceState.channelId !== window.voiceManager.currentChannelId) {
                result.passed = false;
                result.message = (result.message || '') + ` Channel ID mismatch: localStorage=${voiceState.channelId}, voiceManager=${window.voiceManager.currentChannelId}`;
            }
            

            if (voiceState.isConnected && voiceState.meetingId !== window.voiceManager.currentMeetingId) {
                result.passed = false;
                result.message = (result.message || '') + ` Meeting ID mismatch: localStorage=${voiceState.meetingId}, voiceManager=${window.voiceManager.currentMeetingId}`;
            }
            
            if (result.passed) {
                result.message = 'VoiceManager state matches localStorage state';
            }
            
            this.testResults.push(result);
        }
        
        testOrphanedMeetings() {
            const result = {
                name: 'Orphaned Meetings Check',
                passed: true,
                message: ''
            };
            

            const orphanedMeetings = [];
            
            this.meetingIds.forEach((meetingId, channelId) => {
                const count = this.getParticipantCountForChannel(channelId);
                if (count === 0) {
                    orphanedMeetings.push({ channelId, meetingId });
                    result.passed = false;
                }
            });
            
            if (!result.passed) {
                result.message = `Found ${orphanedMeetings.length} orphaned meeting(s): ${orphanedMeetings.map(m => `Channel ${m.channelId} (Meeting ${m.meetingId})`).join(', ')}`;
            } else {
                result.message = 'No orphaned meetings found';
            }
            
            this.testResults.push(result);
        }
        
        testSidebarCounts() {
            const result = {
                name: 'Sidebar Count Accuracy',
                passed: true,
                message: ''
            };
            
            const countMismatches = [];
            
            document.querySelectorAll('[data-channel-type="voice"]').forEach(channel => {
                const channelId = channel.getAttribute('data-channel-id');
                if (!channelId) return;
                
                const countEl = channel.querySelector('.voice-user-count');
                if (!countEl) return;
                
                const domCount = countEl.textContent.trim() === '' ? 0 : parseInt(countEl.textContent.trim());
                const calculatedCount = this.getParticipantCountForChannel(channelId);
                
                if (domCount !== calculatedCount) {
                    countMismatches.push({
                        channelId,
                        domCount,
                        calculatedCount
                    });
                    result.passed = false;
                }
            });
            
            if (!result.passed) {
                result.message = `Found ${countMismatches.length} count mismatch(es): ${countMismatches.map(m => `Channel ${m.channelId} (DOM: ${m.domCount}, Calculated: ${m.calculatedCount})`).join(', ')}`;
            } else {
                result.message = 'All sidebar counts match calculated values';
            }
            
            this.testResults.push(result);
        }

        syncVoiceState() {
            if (!window.voiceManager || !window.localStorageManager) {
                console.error("Cannot sync voice state - required components not available");
                return;
            }
            
            const currentChannel = this.channels.get(this.currentChannelId);
            if (!currentChannel) {
                console.error("Cannot sync voice state - no current channel data");
                return;
            }
            

            const currentState = window.localStorageManager.getUnifiedVoiceState();
            

            const updatedState = {
                ...currentState,
                channelId: this.currentChannelId,
                channelName: currentChannel.name,
                meetingId: currentChannel.meetingId || this.currentMeetingId
            };
            

            window.localStorageManager.setUnifiedVoiceState(updatedState);
            

            if (window.voiceManager) {
                window.voiceManager.currentChannelId = this.currentChannelId;
                window.voiceManager.currentChannelName = currentChannel.name;
                window.voiceManager.currentMeetingId = currentChannel.meetingId || this.currentMeetingId;
            }
            

            if (window.voiceCallSection) {
                window.voiceCallSection.currentChannelId = this.currentChannelId;
                window.voiceCallSection.currentChannelName = currentChannel.name;
                window.voiceCallSection.currentMeetingId = currentChannel.meetingId || this.currentMeetingId;
                if (typeof window.voiceCallSection.syncUnifiedVoiceStateWithCurrentChannel === 'function') {
                    window.voiceCallSection.syncUnifiedVoiceStateWithCurrentChannel();
                }
            }
            
            console.log("✅ [DEBUG-PANEL] Manually synced voice state:", updatedState);
            

            this.collectData();
            this.updatePanelContent();
        }
    };
}


if (!window.voiceDebugPanel) {
    document.addEventListener('DOMContentLoaded', () => {
        window.voiceDebugPanel = new window.VoiceDebugPanel();
    });
}
