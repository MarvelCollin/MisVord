if (typeof window !== 'undefined' && window.MusicPlayerSystem) {
    
} else {

class MusicPlayerSystem {
    constructor() {
        this.currentSong = null;
        this.queue = [];
        this.currentIndex = 0;
        this.audio = null; 
        this.isPlaying = false;
        this.volume = 0.5;
        this.channelId = null;
        this.searchResults = [];
        this.searchModal = null;
        this.debugMode = false;
        this.currentTrack = null;
        this.processedMessageIds = new Set();
        this.initialized = false;
        this.botParticipantAdded = false;
        this.botParticipantId = '4';
        this._audioContext = null;
        this._audioSourceNode = null;
        this._musicSourceNode = null;
        this._audioInitialized = false;
        this._musicStreamDestination = null;
        this._musicMediaStream = null;
        this._gainNode = null;
        this._lastCommandTime = 0;
        this._commandDebounce = 1000;
        this._eventListeners = [];
        this._destroyed = false;
        this._savedVolume = null;
        this._isDeafenMuted = false;
        
        this.restoreMicrophoneState = () => {
            console.log('🎵 [MUSIC-PLAYER] Default restore microphone state - no action needed');
        };
        
        this.initializeAudio();
        this.setupEventListeners();
        this.forceInitialize();
    }

    initializeAudio() {
        try {
            if (!this.audio) {
                this.audio = new Audio();
                this.audio.crossOrigin = "anonymous";
                this.audio.preload = "metadata";
                this.audio.volume = this._isDeafenMuted ? 0 : this.volume;
                this.setupAudioEventListeners();
            }
            
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext && !this._audioContext) {
                this._audioContext = new AudioContext();
            }
            
            this._audioInitialized = true;
            
        } catch (e) {
            console.error('🎵 [MUSIC-PLAYER] Failed to initialize audio system:', e);
            this.audio = new Audio();
            this.audio.crossOrigin = "anonymous";
            this.audio.volume = this.volume;
        }
    }

    forceInitialize() {
        if (typeof window !== 'undefined') {
            window.musicPlayer = this;
            window.MusicPlayerSystem = MusicPlayerSystem;
        }
        
        this.setupImmediateListeners();
        
        this.initialized = true;
        
        if (!this._audioInitialized) {
            this.initializeAudio();
        }
        
        this.checkInitialDeafenState();
        
        if (!this._audioContext && typeof window !== 'undefined') {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this._audioContext = new AudioContext();
                    
                    if (this.audio && !this._audioSourceNode) {
                        try {
                            this._audioSourceNode = this._audioContext.createMediaElementSource(this.audio);
                        } catch (e) {
                            console.warn('🎵 [MUSIC-PLAYER] Could not connect audio to context on force init:', e);
                        }
                    }
                }
            } catch (e) {
                console.error('🎵 [MUSIC-PLAYER] Failed to create AudioContext:', e);
            }
        }
    }
        
    setupEventListeners() {
        const userInteractionEvents = ['click', 'touchstart', 'keydown'];
        const resumeAudioContext = () => {
            if (this._audioContext && this._audioContext.state === 'suspended') {
                this._audioContext.resume().then(() => {
                    userInteractionEvents.forEach(event => {
                        document.removeEventListener(event, resumeAudioContext);
                    });
                });
            }
        };
        
        userInteractionEvents.forEach(event => {
            document.addEventListener(event, resumeAudioContext, { once: true });
        });
    }
    
    setupAudioEventListeners() {
        if (!this.audio) return;
        
        this.audio.addEventListener('error', (e) => {
            console.error('🎵 [MUSIC-PLAYER] Audio playback error:', {
                error: e,
                audioSrc: this.audio?.src,
                audioError: this.audio?.error,
                currentTrack: this.currentTrack?.title
            });
            
            this.isPlaying = false;
            this.hideNowPlaying();
            
            if (this.currentTrack) {
                this.showError(`Failed to play: ${this.currentTrack.title}`);
            }
        });

        this.audio.addEventListener('ended', () => {
            
            this.isPlaying = false;
            
            this.hideNowPlaying();
            this.showStatus('Playback finished');
        });
        
        this.audio.addEventListener('playing', () => {
            this.isPlaying = true;
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
        });
    }
    
    playTestSound() {

        try {
            const testAudio = new Audio();
            testAudio.volume = 0.1; 

            testAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
            

            const playPromise = testAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setTimeout(() => {
                        testAudio.pause();
                        
                    }, 100);
                }).catch(e => {
                    console.warn('🎵 [MUSIC-PLAYER] Audio system test failed:', e);

                    this.unlockAudio();
                });
            }
        } catch (e) {
            console.warn('🎵 [MUSIC-PLAYER] Audio system test error:', e);
        }
    }
    
    unlockAudio() {
        try {

            const tempButton = document.createElement('button');
            tempButton.style.display = 'none';
            document.body.appendChild(tempButton);
            tempButton.click();
            

            if (this._audioContext && this._audioContext.state === 'suspended') {
                this._audioContext.resume().then(() => {
                    
                }).catch(e => {
                    console.warn('🎵 [MUSIC-PLAYER] Failed to unlock audio context:', e);
                });
            }
            

            const unlockAudio = new Audio();
            unlockAudio.volume = 0.1;
            unlockAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
            unlockAudio.play().then(() => {
                
                setTimeout(() => unlockAudio.pause(), 100);
            }).catch(e => {
                console.warn('🎵 [MUSIC-PLAYER] Failed to unlock audio with play:', e);
            });
            
            document.body.removeChild(tempButton);
        } catch (e) {
            console.warn('🎵 [MUSIC-PLAYER] Error in unlockAudio:', e);
        }
    }

    setupImmediateListeners() {
        if (typeof window !== 'undefined' && !this._destroyed) {
            const botMusicCommandHandler = (e) => {
                if (this._destroyed) return;
                this.processBotMusicCommand(e.detail);
            };
            window.addEventListener('bot-music-command', botMusicCommandHandler);
            this._eventListeners.push({ element: window, event: 'bot-music-command', handler: botMusicCommandHandler });

            const autoUnlockEvents = ['click', 'touch', 'keydown', 'mousedown'];
            const autoUnlock = () => {
                if (this._destroyed) return;
                if (this._audioContext && this._audioContext.state === 'suspended') {
                    this._audioContext.resume().then(() => {
                        autoUnlockEvents.forEach(event => {
                            document.removeEventListener(event, autoUnlock);
                        });
                    });
                }
            };
            
            autoUnlockEvents.forEach(event => {
                document.addEventListener(event, autoUnlock, { once: true });
                this._eventListeners.push({ element: document, event, handler: autoUnlock });
            });
            
            if (window.globalSocketManager?.io) {
                
            } else {
                setTimeout(() => this.setupImmediateListeners(), 1000);
            }
        }
    }

    setupEventListeners() {
        window.addEventListener('voiceConnect', (e) => {
            if (e.detail && e.detail.channelId) {
                this.channelId = e.detail.channelId;
                
                if (this.isPlaying && this.audio) {
                    
                    this.setupAudioStreaming();
                }
            }
        });
        
        window.addEventListener('voiceDisconnect', async (e) => {
            this.channelId = null;
            this.disconnectFromVoiceChannel();
            if (this.isPlaying) {
                await this.stop();
                this.showStatus('Music stopped - user left voice channel');
            }
        });

        window.addEventListener('bot-voice-participant-joined', (e) => {
            if (e.detail && e.detail.participant && e.detail.participant.channelId) {
                
            }
        });

        window.addEventListener('participantLeft', async (e) => {
            if (this.isPlaying && window.voiceManager) {
                const humanParticipants = window.voiceManager.getHumanParticipants();
                if (humanParticipants.size === 0) {
                    await this.stop();
                    this.showStatus('Music stopped - no participants in voice channel');
                }
            }
        });

        window.addEventListener('participantJoined', (e) => {
            if (this.isPlaying && e.detail && e.detail.participant) {
                const participantId = e.detail.participant;
                const participantData = e.detail.data;
                
                if (participantData && !participantData.isBot && this.channelId) {
                    this.shareCurrentMusicStateWithParticipant(participantId);
                }
            }
        });

        window.addEventListener('localVoiceStateChanged', (e) => {
            
            if (e.detail && e.detail.type === 'deafen') {
                this.handleDeafenStateChange(e.detail.state);
            }
        });

        window.addEventListener('voiceStateChanged', (e) => {
            
            if (e.detail && e.detail.type === 'deafen') {
                this.handleDeafenStateChange(e.detail.state);
            }
        });
        
        this.setupSocketListeners();

        this.patchVoiceDetection();
    }
    
    patchVoiceDetection() {

        const originalFn = window.debugTitiBotVoiceContext;
        
        if (originalFn) {
            window.debugTitiBotVoiceContext = function() {

                const originalResult = originalFn();
                

                if (originalResult && originalResult.userInVoice && originalResult.voiceChannelId) {
                    return originalResult;
                }
                

                
                
                let voiceChannelId = null;
                let userInVoice = false;
                

                if (window.unifiedVoiceStateManager?.getState?.()) {
                    const state = window.unifiedVoiceStateManager.getState();
                    if (state.isConnected && state.channelId) {
                        voiceChannelId = state.channelId;
                        userInVoice = true;
                        
                    }
                }
                

                if (!voiceChannelId && window.voiceManager) {
                    if (window.voiceManager.isConnected && window.voiceManager.currentChannelId) {
                        voiceChannelId = window.voiceManager.currentChannelId;
                        userInVoice = true;
                        
                    }
                }
                

                if (!voiceChannelId && sessionStorage.getItem('isInVoiceCall') === 'true') {
                    voiceChannelId = sessionStorage.getItem('voiceChannelId') || 
                                     sessionStorage.getItem('currentVoiceChannelId');
                    if (voiceChannelId) {
                        userInVoice = true;
                        
                    }
                }
                

                if (!voiceChannelId) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const channelId = urlParams.get('channel');
                    const channelType = urlParams.get('type') || document.querySelector('meta[name="channel-type"]')?.content;
                    
                    if (channelType === 'voice' && channelId) {
                        voiceChannelId = channelId;

                        userInVoice = true;
                        
                    }
                }
                
                return {
                    userInVoice,
                    voiceChannelId,
                    detectionMethod: 'patched'
                };
            };
            
            
        }
    }

    setupSocketListeners() {
        const setupListeners = () => {
            if (!window.globalSocketManager?.isReady()) {
                setTimeout(setupListeners, 500);
                return;
            }
            
            const io = window.globalSocketManager.io;

            io.off('bot-music-command');
            io.off('music-state-sync');
            io.off('music-state-request');
            
            io.on('bot-music-command', (data) => {
                
                this.processBotMusicCommand(data);
            });
            
            io.on('music-state-sync', (data) => {
                this.handleMusicStateSync(data);
            });
            
            io.on('music-state-request', (data) => {
                this.handleMusicStateRequest(data);
            });
        };
        
        setupListeners();
    }

    async processBotMusicCommand(data) {
        const now = Date.now();
        if (now - this._lastCommandTime < this._commandDebounce) {
            
            return;
        }
        this._lastCommandTime = now;

        const commandId = `${data.channel_id}-${data.music_data?.action}-${data.music_data?.query || data.music_data?.track?.title || ''}-${data.timestamp || now}`;
        if (this.processedMessageIds.has(commandId)) {
            console.log('🎵 [MUSIC-PLAYER] Duplicate command ignored:', commandId);
            return;
        }
        this.processedMessageIds.add(commandId);

        if (this.processedMessageIds.size > 50) {
            const oldestCommand = Array.from(this.processedMessageIds)[0];
            this.processedMessageIds.delete(oldestCommand);
        }

        console.log('🎵 [MUSIC-PLAYER] Received bot music command:', {
            userId: window.globalSocketManager?.userId,
            username: window.globalSocketManager?.username,
            commandChannelId: data.channel_id,
            action: data.music_data?.action,
            query: data.music_data?.query,
            fullData: data
        });

        if (!data || !data.music_data) {
            console.warn('⚠️ [MUSIC-PLAYER] Invalid bot music command data:', data);
            return;
        }

        if (!data.channel_id) {
            console.warn('⚠️ [MUSIC-PLAYER] No channel ID in music command:', data);
            return;
        }

        const isInAnyVoiceChannel = this.isUserInAnyVoiceChannel();
        if (!isInAnyVoiceChannel) {
            console.log('🎵 [MUSIC-PLAYER] User not in any voice channel, ignoring music command');
            return;
        }
        
        console.log('🎵 [MUSIC-PLAYER] User is in a voice channel, processing music command:', {
            commandChannelId: data.channel_id,
            action: data.music_data?.action
        });

        if (data.channel_id) {
            this.channelId = data.channel_id;
        }
        
        if (!this.initialized) {
            this.forceInitialize();
        }
        
        const { music_data } = data;
        const { action, query, track } = music_data;
        
        this.showStatus(`Processing ${action} command...`);
        
        try {
            switch (action) {
                case 'play':
                    if (track && track.previewUrl) {
                        this.showStatus(`Playing: ${track.title} by ${track.artist}`);
                        
                        await this.stop();
                        this.currentSong = track;
                        this.currentTrack = track;
                        
                        this.queue = [track];
                        this.currentIndex = 0;
                        
                        await this.playTrack(track);
                        
                        if (data.current_time && data.current_time > 0 && this.audio) {
                            this.audio.currentTime = data.current_time;
                        }
                        
                        this.showNowPlaying(track);
                        this.isPlaying = true;
                        
                    } else if (query && query.trim()) {
                        this.showStatus(`Searching for: ${query}`);
                        
                        if (this._audioContext && this._audioContext.state === 'suspended') {
                            try {
                                await this._audioContext.resume();
                                console.log('🎵 [MUSIC-PLAYER] Audio context resumed successfully');
                            } catch (e) {
                                console.warn('🎵 [MUSIC-PLAYER] Failed to resume audio context:', e);
                            }
                        }
                        
                        const searchResult = await this.searchMusic(query.trim());
                        
                        if (searchResult && searchResult.previewUrl) {
                            this.showStatus(`Found "${searchResult.title}" - preparing playback...`);
                            
                            try {
                                await this.stop();
                                this.currentSong = searchResult;
                                this.currentTrack = searchResult;
                                
                                this.queue = [searchResult];
                                this.currentIndex = 0;
                                
                                const playSuccess = await this.playTrack(searchResult);
                                if (playSuccess) {
                                    this.showNowPlaying(searchResult);
                                    this.showStatus(`Now playing: ${searchResult.title}`);
                                    this.isPlaying = true;
                                    console.log('🎵 [MUSIC-PLAYER] Successfully started playing:', searchResult.title);
                                } else {
                                    this.showError(`Failed to start playback: ${searchResult.title}`);
                                }
                                
                            } catch (playError) {
                                console.error('🎵 [MUSIC-PLAYER] Play error:', playError);
                                this.showError(`Failed to play: ${searchResult.title}`);
                            }
                        } else {
                            this.showError('No playable track found for: ' + query);
                        }
                    } else {
                        this.showError('No song specified or found');
                    }
                    break;
                    
                case 'stop':
                    await this.stop();
                    this.hideNowPlaying();
                    this.showStatus('Music stopped');
                    break;
                    
                case 'next':
                    if (track && track.previewUrl) {
                        await this.stop();
                        this.currentSong = track;
                        this.currentTrack = track;
                        this.queue = [track];
                        this.currentIndex = 0;
                        await this.playTrack(track);
                        this.showNowPlaying(track);
                        this.isPlaying = true;
                        this.showStatus(`Playing next: ${track.title} by ${track.artist}`);
                    } else {
                        await this.playNext();
                        this.showStatus('Playing next song');
                    }
                    break;
                    
                case 'prev':
                    if (track && track.previewUrl) {
                        await this.stop();
                        this.currentSong = track;
                        this.currentTrack = track;
                        this.queue = [track];
                        this.currentIndex = 0;
                        await this.playTrack(track);
                        this.showNowPlaying(track);
                        this.isPlaying = true;
                        this.showStatus(`Playing previous: ${track.title} by ${track.artist}`);
                    } else {
                        await this.playPrevious();
                        this.showStatus('Playing previous song');
                    }
                    break;
                    
                case 'queue':
                    if (track && track.previewUrl) {
                        this.queue.push(track);
                        this.showStatus(`Added to queue: ${track.title} by ${track.artist}`);
                    } else if (query && query.trim()) {
                        await this.addToQueue(query.trim());
                        this.showStatus('Added to queue: ' + query);
                    } else {
                        this.showError('No song specified for queue');
                    }
                    break;
                    
                default:
                    console.warn('⚠️ [MUSIC-PLAYER] Unknown music action:', action);
                    this.showError('Unknown music command: ' + action);
            }
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error processing command:', error);
            this.showError(`Failed to process ${action} command: ${error.message}`);
        }
    }

    async handleMusicStateSync(data) {
        if (!data || !data.channel_id) return;
        
        if (!this.isUserInAnyVoiceChannel()) {
            console.log('🎵 [MUSIC-PLAYER] User not in any voice channel, ignoring music state sync');
            return;
        }
        
        console.log('🎵 [MUSIC-PLAYER] Processing music state sync:', {
            action: data.action,
            channelId: data.channel_id
        });
        
        if (data.action === 'stop') {
            if (this.isPlaying) {
                await this.stop();
                this.hideNowPlaying();
                this.showStatus('Music stopped by another user');
            }
        }
    }

    shareCurrentMusicStateWithParticipant(participantId) {
        if (!this.isPlaying || !this.currentSong || !this.channelId || !window.globalSocketManager?.io) {
            return;
        }

        const musicCommandData = {
            channel_id: this.channelId,
            music_data: {
                action: 'play',
                track: this.currentSong
            },
            current_time: this.audio ? this.audio.currentTime : 0,
            is_playing: this.isPlaying,
            timestamp: Date.now(),
            target_participant: participantId
        };
        
        console.log('🎵 [MUSIC-PLAYER] Sharing current music state with new participant:', {
            participantId,
            currentSong: this.currentSong?.title,
            currentTime: musicCommandData.current_time
        });
        
        window.globalSocketManager.io.emit('bot-music-command', musicCommandData);
    }

    handleMusicStateRequest(data) {
        if (!data || !data.channel_id) return;
        
        if (!this.isUserInAnyVoiceChannel()) {
            console.log('🎵 [MUSIC-PLAYER] User not in any voice channel, ignoring music state request');
            return;
        }
        
        console.log('🎵 [MUSIC-PLAYER] Processing music state request from channel:', data.channel_id);
        
        if (this.isPlaying && this.currentSong && window.globalSocketManager?.io) {
            const musicCommandData = {
                channel_id: data.channel_id,
                music_data: {
                    action: 'play',
                    track: this.currentSong
                },
                current_time: this.audio ? this.audio.currentTime : 0,
                is_playing: this.isPlaying,
                timestamp: Date.now()
            };
            
            console.log('🎵 [MUSIC-PLAYER] Sharing current music state with new participant:', {
                requester: data.requester_id,
                currentSong: this.currentSong?.title
            });
            
            window.globalSocketManager.io.emit('bot-music-command', musicCommandData);
        }
    }

    async handleSyncMusicState(data) {
        if (!data || !data.channel_id) return;
        
        if (data.broadcaster_id === window.globalSocketManager?.userId) {
            
            return;
        }
        
        if (!this.isUserInAnyVoiceChannel()) {
            console.log('🎵 [MUSIC-PLAYER] User not in any voice channel, ignoring sync music state');
            return;
        }
        
        console.log('🎵 [MUSIC-PLAYER] Processing sync music state:', {
            action: data.action,
            channelId: data.channel_id
        });
        
        try {
            switch (data.action) {
                case 'sync_play':
                    if (data.track && data.track.previewUrl) {
                        await this.syncPlayTrack(data.track, data.current_time || 0);
                    }
                    break;
                case 'sync_pause':
                    this.syncPause();
                    break;
                case 'sync_stop':
                    this.syncStop();
                    break;
                case 'sync_resume':
                    this.syncResume(data.current_time || 0);
                    break;
            }
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Failed to handle sync state:', error);
        }
    }

    async syncPlayTrack(track, startTime = 0) {
        console.log('🎵 [MUSIC-PLAYER] Syncing track playback:', { 
            title: track.title, 
            startTime 
        });
        
        try {
            // Fixed syntax check
            if (this.audio) {
                this.audio.pause();
                this.audio = null;
            }
            
            await this.playTrack(track);
            
            if (startTime > 0 && this.audio) {
                this.audio.currentTime = startTime;
            }
            
            this.showNowPlaying(track);
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Failed to sync play track:', error);
        }
    }

    syncPause() {
        if (this.audio && !this.audio.paused) {
            this.audio.pause();
            this.isPlaying = false;
            
        }
    }

    syncResume(currentTime = 0) {
        if (this.audio && this.audio.paused) {
            if (currentTime > 0) {
                this.audio.currentTime = currentTime;
            }
            this.audio.play();
            this.isPlaying = true;
            
        }
    }

    syncStop() {
        if (this.audio) {
            this.audio.pause();
            this.audio = null;
        }
        this.isPlaying = false;
        this.currentSong = null;
        this.hideNowPlaying();
        
    }

    showSearchModal() {
        this.removeExistingSearchModal();
        
        const modal = document.createElement('div');
        modal.id = 'music-search-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #2c2f36 0%, #1e2124 100%);
                color: white;
                padding: 25px;
                border-radius: 12px;
                width: 90%;
                max-width: 700px;
                max-height: 80vh;
                overflow: hidden;
                border: 1px solid #5865f2;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: #5865f2;">
                        <i class="fas fa-search" style="margin-right: 8px;"></i>Search Music
                    </h2>
                    <button onclick="window.musicPlayer.removeExistingSearchModal()" style="
                        background: #ed4245; border: none; color: white; width: 30px; height: 30px;
                        border-radius: 50%; cursor: pointer; font-size: 16px;
                    ">×</button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="music-search-input" placeholder="Search for songs, artists, albums..." style="
                            flex: 1; background: #36393f; border: 1px solid #5865f2; color: white;
                            padding: 12px 15px; border-radius: 6px; font-size: 16px;
                        ">
                        <button onclick="window.musicPlayer.performSearch()" style="
                            background: #5865f2; border: none; color: white; padding: 12px 20px;
                            border-radius: 6px; cursor: pointer; font-weight: bold;
                        ">🔍 Search</button>
                    </div>
                </div>
                
                <div id="search-results" style="
                    max-height: 400px; overflow-y: auto; background: #36393f; 
                    border-radius: 8px; padding: 10px;
                ">
                    <div style="text-align: center; color: #72767d; padding: 40px;">
                        Enter a search term to find music
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.searchModal = modal;
        
        document.getElementById('music-search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
        
        document.getElementById('music-search-input').focus();
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.removeExistingSearchModal();
            }
        });
    }

    async performSearch() {
        const input = document.getElementById('music-search-input');
        const resultsDiv = document.getElementById('search-results');
        
        if (!input || !resultsDiv) return;
        
        const query = input.value.trim();
        if (!query) return;
        
        resultsDiv.innerHTML = `
            <div style="text-align: center; color: #faa61a; padding: 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i>
                <div>Searching for "${query}"...</div>
            </div>
        `;
        
        try {
            const results = await this.searchMultiple(query);
            this.searchResults = results;
            this.displaySearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            resultsDiv.innerHTML = `
                <div style="text-align: center; color: #ed4245; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <div>Search failed. Please try again.</div>
                </div>
            `;
        }
    }

    async searchMultiple(query) {
        try {
            const apiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=10`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                return data.results
                    .filter(track => track.previewUrl)
                    .map(track => ({
                        title: track.trackName,
                        artist: track.artistName,
                        album: track.collectionName,
                        previewUrl: track.previewUrl,
                        artworkUrl: track.artworkUrl100,
                        duration: track.trackTimeMillis,
                        id: track.trackId,
                        price: track.trackPrice,
                        releaseDate: track.releaseDate
                    }));
            }
            return [];
        } catch (error) {
            return [];
        }
    }

    displaySearchResults(results) {
        const resultsDiv = document.getElementById('search-results');
        if (!resultsDiv) return;
        
        if (results.length === 0) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; color: #72767d; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <div>No results found. Try a different search term.</div>
                </div>
            `;
            return;
        }
        
        resultsDiv.innerHTML = results.map((track, index) => `
            <div style="
                display: flex; align-items: center; padding: 12px; margin-bottom: 8px;
                background: #2c2f36; border-radius: 8px; cursor: pointer;
                transition: background 0.2s ease;
            " onmouseover="this.style.background='#40444b'" onmouseout="this.style.background='#2c2f36'"
               onclick="window.musicPlayer.selectSearchResult(${index})">
                <div style="
                    width: 50px; height: 50px; margin-right: 12px;
                    background: url('${track.artworkUrl}') center/cover;
                    border-radius: 6px; border: 1px solid #5865f2;
                "></div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: white; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${track.title}
                    </div>
                    <div style="color: #b9bbbe; font-size: 14px; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${track.artist}
                    </div>
                    <div style="color: #72767d; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${track.album} ${track.duration ? `• ${Math.floor(track.duration / 60000)}:${String(Math.floor((track.duration % 60000) / 1000)).padStart(2, '0')}` : ''}
                    </div>
                </div>
                <div style="display: flex; gap: 8px; margin-left: 12px;">
                    <button onclick="event.stopPropagation(); window.musicPlayer.playSearchResult(${index})" style="
                        background: #00d166; border: none; color: white; padding: 6px 12px;
                        border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;
                    ">▶️ Play</button>
                    <button onclick="event.stopPropagation(); window.musicPlayer.queueSearchResult(${index})" style="
                        background: #5865f2; border: none; color: white; padding: 6px 12px;
                        border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;
                    ">➕ Queue</button>
                </div>
            </div>
        `).join('');
    }

    selectSearchResult(index) {
        this.playSearchResult(index);
    }

    async playSearchResult(index) {
        const track = this.searchResults[index];
        if (!track) return;
        
        const result = await this.playTrack(track);
        this.removeExistingSearchModal();
    }

    async queueSearchResult(index) {
        const track = this.searchResults[index];
        if (!track) return;
        
        if (!track.previewUrl) {
            console.warn(`❌ No preview available for "${track.title}"`);
            return;
        }
        
        this.queue.push(track);

        

    }

    removeExistingSearchModal() {
        const existingModal = document.getElementById('music-search-modal');
        if (existingModal) {
            existingModal.remove();
        }
        this.searchModal = null;
    }

    showQueueModal() {
        this.removeExistingQueueModal();
        
        const modal = document.createElement('div');
        modal.id = 'music-queue-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;
        
        const queueHtml = this.queue.length === 0 ? 
            '<div style="text-align: center; color: #72767d; padding: 40px;">Queue is empty</div>' :
            this.queue.map((track, index) => `
                <div style="
                    display: flex; align-items: center; padding: 12px; margin-bottom: 8px;
                    background: ${index === this.currentIndex ? '#5865f2' : '#2c2f36'}; 
                    border-radius: 8px; cursor: pointer;
                " onclick="window.musicPlayer.playQueueIndex(${index})">
                    <div style="
                        width: 40px; height: 40px; margin-right: 12px;
                        background: url('${track.artworkUrl}') center/cover;
                        border-radius: 6px;
                    "></div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; color: white; margin-bottom: 2px;">
                            ${index === this.currentIndex ? '▶️ ' : `${index + 1}. `}${track.title}
                        </div>
                        <div style="color: #b9bbbe; font-size: 14px;">
                            ${track.artist}
                        </div>
                    </div>
                    <button onclick="event.stopPropagation(); window.musicPlayer.removeFromQueue(${index})" style="
                        background: #ed4245; border: none; color: white; padding: 4px 8px;
                        border-radius: 4px; cursor: pointer; font-size: 12px;
                    ">🗑️</button>
                </div>
            `).join('');
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #2c2f36 0%, #1e2124 100%);
                color: white; padding: 25px; border-radius: 12px;
                width: 90%; max-width: 600px; max-height: 80vh;
                overflow: hidden; border: 1px solid #5865f2;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: #5865f2;">
                        <i class="fas fa-list" style="margin-right: 8px;"></i>Music Queue (${this.queue.length})
                    </h2>
                    <button onclick="window.musicPlayer.removeExistingQueueModal()" style="
                        background: #ed4245; border: none; color: white; width: 30px; height: 30px;
                        border-radius: 50%; cursor: pointer; font-size: 16px;
                    ">×</button>
                </div>
                
                <div style="max-height: 400px; overflow-y: auto;">
                    ${queueHtml}
                </div>
                
                ${this.queue.length > 0 ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #40444b;">
                    <button onclick="window.musicPlayer.shuffleQueue()" style="
                        background: #fee75c; border: none; color: #2c2f36; padding: 8px 16px;
                        border-radius: 4px; cursor: pointer; font-weight: bold; margin-right: 10px;
                    ">🔀 Shuffle</button>
                    <button onclick="window.musicPlayer.clearQueue()" style="
                        background: #ed4245; border: none; color: white; padding: 8px 16px;
                        border-radius: 4px; cursor: pointer; font-weight: bold;
                    ">🗑️ Clear All</button>
                </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.removeExistingQueueModal();
            }
        });
    }

    removeExistingQueueModal() {
        const existingModal = document.getElementById('music-queue-modal');
        if (existingModal) {
            existingModal.remove();
        }
    }

    playQueueIndex(index) {
        if (index >= 0 && index < this.queue.length) {
            this.currentIndex = index;
            this.playTrack(this.queue[index]);
            this.removeExistingQueueModal();
        }
    }

    removeFromQueue(index) {
        if (index >= 0 && index < this.queue.length) {
            const removedTrack = this.queue.splice(index, 1)[0];
            
            if (index < this.currentIndex) {
                this.currentIndex--;
            } else if (index === this.currentIndex && this.queue.length > 0) {
                if (this.currentIndex >= this.queue.length) {
                    this.currentIndex = 0;
                }
            }
            

            
            this.showQueueModal();
        }
    }

    shuffleQueue() {
        if (this.queue.length <= 1) return;
        
        const currentSong = this.queue[this.currentIndex];
        
        for (let i = this.queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
        }
        
        this.currentIndex = this.queue.findIndex(track => track.id === currentSong.id);
        if (this.currentIndex === -1) this.currentIndex = 0;
        
        this.showQueueModal();
    }

    clearQueue() {
        this.queue = [];
        this.currentIndex = 0;
        
        this.removeExistingQueueModal();

    }

    async searchMusic(query) {
        try {
            const apiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=5&country=us`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const track = data.results.find(t => t.previewUrl);
                
                if (!track) {
                    return null;
                }
                
                return {
                    title: track.trackName,
                    artist: track.artistName,
                    album: track.collectionName,
                    previewUrl: track.previewUrl,
                    artworkUrl: track.artworkUrl100,
                    duration: track.trackTimeMillis,
                    id: track.trackId
                };
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async play(track) {
        if (!track || !track.previewUrl) {
            console.error('🎵 Invalid track or missing preview URL');
            return false;
        }

        try {
            if (this.isPlaying && this.audio) {
                this.audio.pause();
                this.audio.currentTime = 0;
                this.isPlaying = false;
            }
            
            if (!this._audioInitialized) {
                this.initializeAudio();
            }
            
            this.currentTrack = track;
            
            if (!this.audio) {
                this.audio = new Audio();
                this.audio.volume = this._isDeafenMuted ? 0 : this.volume;
                this.audio.crossOrigin = "anonymous";
                this.setupAudioEventListeners();
            }
            
            this.audio.pause();
            this.audio.src = track.previewUrl;
            this.audio.load();
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Audio load timeout after 10 seconds'));
                }, 10000);
                
                const onCanPlay = () => {
                    clearTimeout(timeout);
                    this.audio.removeEventListener('canplay', onCanPlay);
                    this.audio.removeEventListener('error', onError);
                    resolve();
                };
                
                const onError = (e) => {
                    clearTimeout(timeout);
                    this.audio.removeEventListener('canplay', onCanPlay);
                    this.audio.removeEventListener('error', onError);
                    reject(new Error(`Audio load failed: ${this.audio.error?.message || 'Unknown error'}`));
                };
                
                this.audio.addEventListener('canplay', onCanPlay);
                this.audio.addEventListener('error', onError);
            });

            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                await playPromise;
            }
            
            this.isPlaying = true;
            
            this.setupAudioStreaming();

            return true;
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error in play method:', error);
            this.isPlaying = false;
            this.showError(`Failed to play: ${track.title} - ${error.message}`);
            return false;
        }
    }

    async stop() {
        try {
            this.isPlaying = false;
            
            if (this.audio) {
                this.audio.pause();
                this.audio.currentTime = 0;
            }
            
            this.hideNowPlaying();
            this.showStatus('Music stopped');
            
            await this.restoreMicrophoneState();
            this.cleanupAudioResources();
            
            return true;
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error stopping playback:', error);
            return false;
        }
    }

    handleDeafenStateChange(isDeafened) {
        
        
        if (!this.audio) return;

        if (isDeafened) {
            if (!this._isDeafenMuted) {
                this._savedVolume = this.audio.volume;
                this.audio.volume = 0;
                this._isDeafenMuted = true;
                
            }
        } else {
            if (this._isDeafenMuted) {
                this.audio.volume = this._savedVolume !== null ? this._savedVolume : this.volume;
                this._isDeafenMuted = false;
                this._savedVolume = null;
                
            }
        }
    }

    checkInitialDeafenState() {
        
        
        if (window.localStorageManager) {
            const voiceState = window.localStorageManager.getUnifiedVoiceState();
            
            if (voiceState && voiceState.isDeafened) {
                
                this.handleDeafenStateChange(true);
                return;
            }
        }
        
        if (window.voiceManager && window.voiceManager.getDeafenState) {
            const isDeafened = window.voiceManager.getDeafenState();
            
            if (isDeafened) {
                
                this.handleDeafenStateChange(true);
                return;
            }
        }
        
        
    }



    setupAudioStreaming() {
        try {
            
            
            if (!this.audio || !this.isPlaying) {
                return false;
            }

            if (this._audioContext && this._audioContext.state === 'suspended') {
                this._audioContext.resume().catch(e => {
                    console.warn('🎵 [MUSIC-PLAYER] Failed to resume audio context:', e);
                });
            }

            this.connectAudioToVoiceChannel();
            return true;
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error setting up audio streaming:', error);
            return false;
        }
    }

    connectAudioToVoiceChannel() {
        try {
            if (!this.audio || !this._audioContext) {
                console.warn('🎵 [MUSIC-PLAYER] Audio or AudioContext not available for streaming');
                return false;
            }

            if (!window.voiceManager || !window.voiceManager.meeting) {
                console.warn('🎵 [MUSIC-PLAYER] Voice manager or meeting not available');
                return false;
            }

            if (this._musicStreamDestination) {
                this._musicStreamDestination.disconnect();
                this._musicStreamDestination = null;
            }

            if (this._musicMediaStream) {
                this._musicMediaStream.getTracks().forEach(track => track.stop());
                this._musicMediaStream = null;
            }

            if (!this._audioSourceNode) {
                this._audioSourceNode = this._audioContext.createMediaElementSource(this.audio);
            }

            if (!this._gainNode) {
                this._gainNode = this._audioContext.createGain();
                this._gainNode.gain.value = 0.7;
            }

            this._musicStreamDestination = this._audioContext.createMediaStreamDestination();

            this._audioSourceNode.connect(this._gainNode);
            this._gainNode.connect(this._musicStreamDestination);

            this._musicMediaStream = this._musicStreamDestination.stream;

            const audioTrack = this._musicMediaStream.getAudioTracks()[0];
            if (audioTrack && window.voiceManager.meeting) {
                console.log('🎵 [MUSIC-PLAYER] Music audio track created, mixing with voice...');
                
                this.setupAudioMixer(audioTrack);
                return true;
            }

            return false;
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error connecting audio to voice channel:', error);
            return false;
        }
    }

    setupAudioMixer(musicAudioTrack) {
        try {
            console.log('🎵 [MUSIC-PLAYER] Setting up audio mixer...');
            
            if (this._mixerContext) {
                this._mixerContext.close();
                this._mixerContext = null;
            }
            
            if (this._musicSourceNode) {
                this._musicSourceNode.disconnect();
                this._musicSourceNode = null;
            }
            
            this._mixerContext = new (window.AudioContext || window.webkitAudioContext)();
            
            navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }, 
                video: false 
            })
                .then(micStream => {
                    const micSource = this._mixerContext.createMediaStreamSource(micStream);
                    
                    try {
                        this._musicSourceNode = this._mixerContext.createMediaElementSource(this.audio);
                    } catch (error) {
                        if (error.name === 'InvalidStateError') {
                            console.log('🎵 [MUSIC-PLAYER] Audio element already connected, creating new audio element');
                            const newAudio = new Audio();
                            newAudio.src = this.audio.src;
                            newAudio.currentTime = this.audio.currentTime;
                            newAudio.volume = this.audio.volume;
                            newAudio.crossOrigin = "anonymous";
                            newAudio.play();
                            this._musicSourceNode = this._mixerContext.createMediaElementSource(newAudio);
                        } else {
                            throw error;
                        }
                    }
                    
                    const mixerDestination = this._mixerContext.createMediaStreamDestination();
                    
                    const micGain = this._mixerContext.createGain();
                    const musicGain = this._mixerContext.createGain();
                    
                    micGain.gain.value = 1.0;
                    musicGain.gain.value = 0.6;
                    
                    micSource.connect(micGain);
                    this._musicSourceNode.connect(musicGain);
                    
                    micGain.connect(mixerDestination);
                    musicGain.connect(mixerDestination);
                    
                    const mixedStream = mixerDestination.stream;
                    
                    if (window.voiceManager && window.voiceManager.meeting) {
                        const mixedTrack = mixedStream.getAudioTracks()[0];
                        if (mixedTrack) {
                            window.voiceManager.meeting.changeMic(mixedTrack);
                            console.log('🎵 [MUSIC-PLAYER] Audio mixer setup complete - voice and music combined');
                        }
                        
                        this._originalMicStream = micStream;
                        this._mixedStream = mixedStream;
                        
                        this.restoreMicrophoneState = () => {
                            try {
                                if (window.voiceManager && window.voiceManager.meeting && this._originalMicStream) {
                                    const originalTrack = this._originalMicStream.getAudioTracks()[0];
                                    if (originalTrack) {
                                        window.voiceManager.meeting.changeMic(originalTrack);
                                        console.log('🎵 [MUSIC-PLAYER] Restored original microphone stream');
                                    }
                                }
                                if (this._mixerContext) {
                                    this._mixerContext.close();
                                    this._mixerContext = null;
                                }
                                if (this._musicSourceNode) {
                                    this._musicSourceNode.disconnect();
                                    this._musicSourceNode = null;
                                }
                            } catch (error) {
                                console.error('🎵 [MUSIC-PLAYER] Error restoring microphone:', error);
                            }
                        };
                    }
                })
                .catch(error => {
                    console.error('🎵 [MUSIC-PLAYER] Failed to get microphone stream for mixing:', error);
                });
                
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error setting up audio mixer:', error);
        }
    }

    async playTrack(track) {
        return await this.play(track);
    }

    async playSharedTrack(track, startTime = 0) {
        try {
            console.log('🎵 [MUSIC-PLAYER] Playing shared track:', { 
                title: track.title, 
                startTime 
            });
            
            const result = await this.play(track);
            
            if (startTime > 0 && this.audio) {
                this.audio.currentTime = startTime;
            }
            
            return result;
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error playing shared track:', error);
            return false;
        }
    }

    disconnectFromVoiceChannel() {
        try {
            
            this.channelId = null;
            
            if (this._musicStreamDestination) {
                this._musicStreamDestination.disconnect();
                this._musicStreamDestination = null;
            }

            if (this._musicMediaStream) {
                this._musicMediaStream.getTracks().forEach(track => track.stop());
                this._musicMediaStream = null;
            }

            this.restoreMicrophoneState();
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error disconnecting from voice channel:', error);
        }
    }

    async playNext() {
        try {
            if (this.queue.length === 0) {
                
                this.showStatus('Queue is empty');
                return false;
            }

            if (this.currentIndex >= this.queue.length - 1) {
                
                await this.stop();
                this.showStatus('Reached end of queue');
                return false;
            }

            this.currentIndex = this.currentIndex + 1;
            const nextTrack = this.queue[this.currentIndex];
            
            
            await this.playTrack(nextTrack);
            this.showNowPlaying(nextTrack);
            this.currentSong = nextTrack;
            
            return true;
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error playing next track:', error);
            return false;
        }
    }

    async playPrevious() {
        try {
            if (this.queue.length === 0) {
                
                this.showStatus('Queue is empty');
                return false;
            }

            if (this.currentIndex <= 0) {
                
                this.showStatus('Already at first song');
                return false;
            }

            this.currentIndex = this.currentIndex - 1;
            const prevTrack = this.queue[this.currentIndex];
            
            
            await this.playTrack(prevTrack);
            this.showNowPlaying(prevTrack);
            this.currentSong = prevTrack;
            
            return true;
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error playing previous track:', error);
            return false;
        }
    }

    async addToQueue(songName) {
        try {
            
            
            const searchResult = await this.searchMusic(songName);
            if (searchResult && searchResult.previewUrl) {
                this.queue.push(searchResult);
                this.showStatus(`Added to queue: ${searchResult.title}`);
                
                return `Added to queue: ${searchResult.title}`;
            } else {
                this.showError(`Could not find: ${songName}`);
                return `Could not find: ${songName}`;
            }
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error adding to queue:', error);
            this.showError(`Failed to add to queue: ${songName}`);
            return `Failed to add to queue: ${songName}`;
        }
    }

    showNowPlaying(track) {
        try {
            this.removeExistingPlayer();
            this.startProgressUpdate();
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error showing now playing:', error);
        }
    }

    hideNowPlaying() {
        try {
            const existingPlayer = document.getElementById('music-now-playing');
            if (existingPlayer) {
                existingPlayer.remove();
            }
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error hiding now playing:', error);
        }
    }

    removeExistingPlayer() {
        try {
            const existingPlayer = document.getElementById('music-now-playing');
            if (existingPlayer) {
                existingPlayer.remove();
            }
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error removing existing player:', error);
        }
    }

    startProgressUpdate() {
        try {
            if (this.progressInterval) {
                clearInterval(this.progressInterval);
            }
            
            this.progressInterval = setInterval(() => {
                if (!this.audio || this.audio.paused) {
                    clearInterval(this.progressInterval);
                    return;
                }
                
                const progress = (this.audio.currentTime / this.audio.duration) * 100;
                const progressBar = document.querySelector('#music-now-playing .progress-bar');
                if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                }
            }, 1000);
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error starting progress update:', error);
        }
    }

    showStatus(message) {
        
    }

    showError(message) {
        console.error('🎵 [MUSIC-PLAYER] Error:', message);
    }

    isUserInAnyVoiceChannel() {
        try {
            if (window.voiceManager && window.voiceManager.isConnected) {
                console.log('🎵 [MUSIC-PLAYER] User connected via voice manager');
                return true;
            }

            if (window.localStorageManager) {
                const voiceState = window.localStorageManager.getUnifiedVoiceState();
                if (voiceState && voiceState.isConnected) {
                    console.log('🎵 [MUSIC-PLAYER] User connected via storage state');
                    return true;
                }
            }

            if (window.voiceFacade) {
                const currentState = window.voiceFacade.getCurrentState();
                if (currentState && currentState.isConnected) {
                    console.log('🎵 [MUSIC-PLAYER] User connected via voice facade');
                    return true;
                }
            }

            if (window.voiceCallSection && window.voiceCallSection.currentChannelId) {
                console.log('🎵 [MUSIC-PLAYER] User connected via voice call section');
                return true;
            }

            const metaChannelId = document.querySelector('meta[name="channel-id"]')?.content;
            if (metaChannelId) {
                console.log('🎵 [MUSIC-PLAYER] User in voice channel via meta tag');
                return true;
            }

            return false;
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error checking voice channel status:', error);
            return true;
        }
    }

    isUserInTargetVoiceChannel(targetChannelId) {
        try {
            if (!targetChannelId) {
                console.warn('🎵 [MUSIC-PLAYER] No target channel ID provided for validation');
                return false;
            }

            const targetChannelIdStr = String(targetChannelId);

            if (window.voiceManager && window.voiceManager.isConnected) {
                const currentChannelIdStr = String(window.voiceManager.currentChannelId || '');
                const isInTargetChannel = currentChannelIdStr === targetChannelIdStr;
                console.log('🎵 [MUSIC-PLAYER] Voice manager validation:', {
                    currentChannelId: currentChannelIdStr,
                    targetChannelId: targetChannelIdStr,
                    isInTargetChannel
                });
                return isInTargetChannel;
            }

            if (window.localStorageManager) {
                const voiceState = window.localStorageManager.getUnifiedVoiceState();
                if (voiceState && voiceState.isConnected) {
                    const storedChannelIdStr = String(voiceState.channelId || '');
                    if (storedChannelIdStr === targetChannelIdStr) {
                        console.log('🎵 [MUSIC-PLAYER] Storage state validation successful:', {
                            storedChannelId: storedChannelIdStr,
                            targetChannelId: targetChannelIdStr
                        });
                        return true;
                    }
                }
            }

            if (window.voiceFacade) {
                const currentState = window.voiceFacade.getCurrentState();
                if (currentState && currentState.isConnected) {
                    const currentChannelIdStr = String(currentState.channelId || '');
                    if (currentChannelIdStr === targetChannelIdStr) {
                        console.log('🎵 [MUSIC-PLAYER] Voice facade validation successful:', {
                            currentChannelId: currentChannelIdStr,
                            targetChannelId: targetChannelIdStr
                        });
                        return true;
                    }
                }
            }

            if (window.voiceCallSection && window.voiceCallSection.currentChannelId) {
                const callSectionChannelIdStr = String(window.voiceCallSection.currentChannelId || '');
                if (callSectionChannelIdStr === targetChannelIdStr) {
                    console.log('🎵 [MUSIC-PLAYER] Voice call section validation successful:', {
                        currentChannelId: callSectionChannelIdStr,
                        targetChannelId: targetChannelIdStr
                    });
                    return true;
                }
            }

            const metaChannelId = document.querySelector('meta[name="channel-id"]')?.content;
            if (metaChannelId) {
                const metaChannelIdStr = String(metaChannelId);
                if (metaChannelIdStr === targetChannelIdStr) {
                    console.log('🎵 [MUSIC-PLAYER] Meta channel validation successful:', {
                        metaChannelId: metaChannelIdStr,
                        targetChannelId: targetChannelIdStr
                    });
                    return true;
                }
            }

            console.log('🎵 [MUSIC-PLAYER] User not in target voice channel:', {
                targetChannelId: targetChannelIdStr,
                voiceManagerAvailable: !!window.voiceManager,
                voiceManagerConnected: window.voiceManager?.isConnected,
                currentChannelId: String(window.voiceManager?.currentChannelId || ''),
                metaChannelId: String(metaChannelId || '')
            });
            return false;

        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error validating voice channel:', error);
            return false;
        }
    }

    debugAudioConnections() {
        console.log('🎵 [MUSIC-PLAYER] Audio connections debug:', {
            audioContextState: this._audioContext?.state,
            audioSourceNode: !!this._audioSourceNode,
            gainNode: !!this._gainNode,
            musicStreamDestination: !!this._musicStreamDestination,
            musicMediaStream: !!this._musicMediaStream,
            voiceManagerMeeting: !!window.voiceManager?.meeting,
            isPlaying: this.isPlaying
        });
    }
    
    destroy() {
        if (this._destroyed) return;
        
        this._destroyed = true;
        
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            this.audio.load();
            this.audio = null;
        }
        
        if (this._audioSourceNode) {
            this._audioSourceNode.disconnect();
            this._audioSourceNode = null;
        }
        
        if (this._gainNode) {
            this._gainNode.disconnect();
            this._gainNode = null;
        }
        
        if (this._musicStreamDestination) {
            this._musicStreamDestination.disconnect();
            this._musicStreamDestination = null;
        }
        
        if (this._musicMediaStream) {
            this._musicMediaStream.getTracks().forEach(track => track.stop());
            this._musicMediaStream = null;
        }
        
        if (this._audioContext && this._audioContext.state !== 'closed') {
            this._audioContext.close();
            this._audioContext = null;
        }
        
        this._eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this._eventListeners = [];
        
        this.removeExistingSearchModal();
        this.removeExistingQueueModal();
        this.hideNowPlaying();
        
        this.currentSong = null;
        this.queue = [];
        this.searchResults = [];
        this.currentTrack = null;
        this.processedMessageIds.clear();
    }

    cleanupProcessedMessages() {
        if (this.processedMessageIds.size > this.maxProcessedMessages) {
            const messagesToRemove = Math.floor(this.maxProcessedMessages / 2);
            const messageArray = Array.from(this.processedMessageIds);
            for (let i = 0; i < messagesToRemove; i++) {
                this.processedMessageIds.delete(messageArray[i]);
            }
            
        }
    }

    cleanupAudioResources() {
        try {
            if (this._musicSourceNode) {
                this._musicSourceNode.disconnect();
                this._musicSourceNode = null;
            }
            
            if (this._mixerContext) {
                this._mixerContext.close();
                this._mixerContext = null;
            }
            
            if (this._originalMicStream) {
                this._originalMicStream.getTracks().forEach(track => track.stop());
                this._originalMicStream = null;
            }
            
            if (this._mixedStream) {
                this._mixedStream.getTracks().forEach(track => track.stop());
                this._mixedStream = null;
            }
            
            if (this._audioSourceNode) {
                this._audioSourceNode.disconnect();
                this._audioSourceNode = null;
            }
            
            if (this._audioContext && this._audioContext.state !== 'closed') {
                this._audioContext.close();
                this._audioContext = null;
            }
            
            console.log('🎵 [MUSIC-PLAYER] Audio resources cleaned up');
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error cleaning up audio resources:', error);
        }
    }
}

if (typeof window !== 'undefined' && !window.musicPlayer) {
    window.MusicPlayerSystem = MusicPlayerSystem;
    window.musicPlayer = new MusicPlayerSystem();
    
    
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.musicPlayer && !window.musicPlayer._destroyed) {
                window.musicPlayer.forceInitialize();
            }
        });
    } else {
        if (window.musicPlayer && !window.musicPlayer._destroyed) {
            window.musicPlayer.forceInitialize();
        }
    }
} else if (typeof window !== 'undefined' && window.musicPlayer && window.musicPlayer._destroyed) {
    window.musicPlayer = new MusicPlayerSystem();
}

}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicPlayerSystem;
}