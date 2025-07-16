if (typeof window !== 'undefined' && window.MusicPlayerSystem) {
    console.log('🎵 [MUSIC-PLAYER] MusicPlayerSystem already exists, skipping redefinition');
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
        this._audioInitialized = false;
        this._musicStreamDestination = null;
        this._musicMediaStream = null;
        this._gainNode = null;
        this._lastCommandTime = 0;
        this._commandDebounce = 1000;
        
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
                this.audio.volume = this.volume;
                this.setupAudioEventListeners();
            }
            
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext && !this._audioContext) {
                this._audioContext = new AudioContext();
                console.log('🎵 [MUSIC-PLAYER] Created AudioContext, state:', this._audioContext.state);
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
            window.debugMusicStream = () => this.debugForceStream();
            window.debugAudioState = () => this.debugAudioState();
            window.testVoiceStreaming = () => this.connectAudioToVoiceChannel();
            window.testStreamingPipeline = () => this.testStreamingPipeline();
            window.testPlaySampleTrack = () => this.testPlaySampleTrack();
            window.testPlaySpotifyPreview = () => this.testPlaySpotifyPreview();
            window.testBasicAudioPlayback = () => this.testBasicAudioPlayback();
            window.testSearchAndPlay = (query) => this.testSearchAndPlay(query);
            window.checkSystemReadiness = () => this.checkSystemReadiness();
            window.playTestTrack = () => this.playTestTrack();
            window.playLocalTestTrack = () => this.playLocalTestTrack();
            window.forcePlayAnyTrack = () => this.forcePlayAnyTrack();
            window.quickAudioTest = () => this.quickAudioTest();
            window.checkMusicPlayerState = () => this.checkMusicPlayerState();
        }
        
        this.setupImmediateListeners();
        
        this.initialized = true;
        
        if (!this._audioInitialized) {
            this.initializeAudio();
        }
        
        if (!this._audioContext && typeof window !== 'undefined') {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this._audioContext = new AudioContext();
                    console.log('🎵 [MUSIC-PLAYER] Force created AudioContext, state:', this._audioContext.state);
                    
                    if (this.audio && !this._audioSourceNode) {
                        try {
                            this._audioSourceNode = this._audioContext.createMediaElementSource(this.audio);
                            this._audioSourceNode.connect(this._audioContext.destination);
                            console.log('🎵 [MUSIC-PLAYER] Connected audio source to context');
                        } catch (e) {
                            console.warn('🎵 [MUSIC-PLAYER] Could not connect audio to context on force init:', e);
                        }
                    }
                }
            } catch (e) {
                console.warn('🎵 [MUSIC-PLAYER] Could not initialize AudioContext on force init:', e);
            }
        }
        
        const userInteractionEvents = ['click', 'touchstart', 'keydown'];
        const resumeAudioContext = () => {
            if (this._audioContext && this._audioContext.state === 'suspended') {
                this._audioContext.resume().then(() => {
                    console.log('🎵 [MUSIC-PLAYER] AudioContext resumed after user interaction');
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
            this.playNext();
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
        if (typeof window !== 'undefined') {
            window.addEventListener('bot-music-command', (e) => {
                this.processBotMusicCommand(e.detail);
            });
            

            const autoUnlockEvents = ['click', 'touch', 'keydown', 'mousedown'];
            const autoUnlock = () => {
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
            });
            
            if (window.globalSocketManager?.io) {
                window.globalSocketManager.io.on('bot-music-command', (data) => {
                    this.processBotMusicCommand(data);
                });
                window.globalSocketManager.io.on('music-state-sync', (data) => {
                    this.handleMusicStateSync(data);
                });
                window.globalSocketManager.io.on('music-state-request', (data) => {
                    this.handleMusicStateRequest(data);
                });
            } else {
                setTimeout(() => this.setupImmediateListeners(), 1000);
            }
        }
    }

    setupEventListeners() {
        window.addEventListener('bot-music-command', (e) => {
            this.processBotMusicCommand(e.detail);
        });

        window.addEventListener('voiceConnect', (e) => {
            if (e.detail && e.detail.channelId) {
                this.channelId = e.detail.channelId;
                
                if (this.isPlaying && this.audio) {
                    console.log('🎵 [MUSIC-PLAYER] User joined voice while music playing, setting up streaming');
                    this.setupAudioStreaming();
                }
            }
        });
        
        window.addEventListener('voiceDisconnect', (e) => {
            this.channelId = null;
            this.disconnectFromVoiceChannel();
            if (this.isPlaying) {
                this.showStatus('Music continues locally - left voice channel');
            }
        });

        window.addEventListener('bot-voice-participant-joined', (e) => {
            if (e.detail && e.detail.participant && e.detail.participant.channelId) {
                
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
                console.log('🎵 [MUSIC-PLAYER] Socket received bot-music-command:', data);
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
            console.log('🎵 [MUSIC-PLAYER] Command debounced, ignoring rapid requests');
            return;
        }
        this._lastCommandTime = now;

        console.log('🎵 [MUSIC-PLAYER] Received bot music command:', {
            userId: window.globalSocketManager?.userId,
            username: window.globalSocketManager?.username,
            commandChannelId: data.channel_id,
            action: data.music_data?.action,
            query: data.music_data?.query,
            isInVoiceChannel: this.isUserInTargetVoiceChannel(data.channel_id),
            fullData: data
        });

        if (!data || !data.music_data) {
            console.warn('⚠️ [MUSIC-PLAYER] Invalid bot music command data:', data);
            return;
        }

        const isInTargetChannel = this.isUserInTargetVoiceChannel(data.channel_id);
        if (!isInTargetChannel) {
            console.log('🎵 [MUSIC-PLAYER] User not in target voice channel but checking if in voice participants...');
            
            const hasVoiceParticipants = window.ChannelVoiceParticipants && 
                                       window.ChannelVoiceParticipants.getInstance().externalParticipants.has(data.channel_id);
            
            if (!hasVoiceParticipants) {
                console.log('🎵 [MUSIC-PLAYER] User not in voice participants either, ignoring music command');
                return;
            } else {
                console.log('🎵 [MUSIC-PLAYER] User found in voice participants, proceeding with music command');
            }
        }

        if (data.channel_id && !this.channelId) {
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
                        await this.playSharedTrack(track, data.current_time || 0);
                    } else if (query && query.trim()) {
                        this.showStatus(`Searching for: ${query}`);
                        
                        if (this._audioContext && this._audioContext.state === 'suspended') {
                            try {
                                await this._audioContext.resume();
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
                                
                                await this.playTrack(searchResult);
                                this.showNowPlaying(searchResult);
                                this.showStatus(`Now playing: ${searchResult.title}`);
                                this.isPlaying = true;
                                
                            } catch (playError) {
                                this.showError(`Failed to play: ${searchResult.title}`);
                            }
                        } else {
                            this.showError('No playable track found for: ' + query);
                        }
                    } else if (track && track.previewUrl) {
                        this.showStatus(`Preparing to play "${track.title}"...`);
                        
                        await this.stop();
                        await this.playTrack(track);
                        this.showNowPlaying(track);
                        this.showStatus(`Now playing: ${track.title}`);
                        this.isPlaying = true;
                        this.currentSong = track;
                        
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
                    await this.playNext();
                    this.showStatus('Playing next song');
                    break;
                    
                case 'prev':
                    await this.playPrevious();
                    this.showStatus('Playing previous song');
                    break;
                    
                case 'queue':

                    if (query && query.trim()) {
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
        
        console.log('🔄 [MUSIC-PLAYER] Syncing music state:', data);
        
        if (data.action === 'stop') {
            if (this.isPlaying) {
                await this.stop();
                this.hideNowPlaying();
                this.showStatus('Music stopped by another user');
            }
        }
    }

    handleMusicStateRequest(data) {
        if (!data || !data.channel_id) return;
        
        if (!this.isUserInTargetVoiceChannel(data.channel_id)) return;
        
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
        
        if (!this.isUserInTargetVoiceChannel(data.channel_id)) {
            console.log('🎵 [MUSIC-PLAYER] Ignoring sync command - not in target voice channel');
            return;
        }
        
        if (data.broadcaster_id === window.globalSocketManager?.userId) {
            console.log('🎵 [MUSIC-PLAYER] Ignoring own broadcast');
            return;
        }
        
        console.log('🎵 [MUSIC-PLAYER] Handling synchronized music state:', data);
        
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
            console.log('🎵 [MUSIC-PLAYER] Synchronized pause');
        }
    }

    syncResume(currentTime = 0) {
        if (this.audio && this.audio.paused) {
            if (currentTime > 0) {
                this.audio.currentTime = currentTime;
            }
            this.audio.play();
            this.isPlaying = true;
            console.log('🎵 [MUSIC-PLAYER] Synchronized resume');
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
        console.log('🎵 [MUSIC-PLAYER] Synchronized stop');
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
            if (!this._audioInitialized) {
                this.initializeAudio();
            }
            
            this.currentTrack = track;
            
            if (!this.audio) {
                this.audio = new Audio();
                this.audio.volume = this.volume;
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
            
            setTimeout(() => {
                this.setupAudioStreaming();
            }, 500);

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
            
            await this.restoreMicrophoneState();
            this.hideNowPlaying();
            this.showStatus('Music stopped');
            
            return true;
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error stopping playback:', error);
            return false;
        }
    }
    

    connectToAudioContext() {
        if (!this._audioContext || !this.audio) return false;
        
        try {

            if (this._audioContext.state === 'suspended') {
                this._audioContext.resume();
            }
            

            if (this._audioSourceNode) {
                try {
                    this._audioSourceNode.disconnect();
                } catch (e) {
                    console.warn('🎵 [MUSIC-PLAYER] Error disconnecting existing source:', e);
                }
            }
            

            try {
                this._audioSourceNode = this._audioContext.createMediaElementSource(this.audio);

                this._audioSourceNode.connect(this._audioContext.destination);
                
                
                return true;
            } catch (mediaError) {

                console.warn('🎵 [MUSIC-PLAYER] Media element connection error:', mediaError);
                

                const currentSrc = this.audio.src;
                const currentTime = this.audio.currentTime;
                const wasPlaying = !this.audio.paused;
                

                const newAudio = new Audio();
                newAudio.crossOrigin = "anonymous";
                newAudio.preload = "auto";
                newAudio.volume = this.volume;
                newAudio.src = currentSrc;
                newAudio.currentTime = currentTime;
                

                this._audioSourceNode = this._audioContext.createMediaElementSource(newAudio);
                this._audioSourceNode.connect(this._audioContext.destination);
                

                const oldAudio = this.audio;
                this.audio = newAudio;
                
                this.setupAudioEventListeners();
                

                if (wasPlaying) {
                    this.audio.play().catch(e => {
                        console.warn('🎵 [MUSIC-PLAYER] Failed to resume playback after recreation:', e);
                    });
                }
                

                oldAudio.pause();
                oldAudio.src = '';
                
                
                return true;
            }
        } catch (e) {
            console.error('🎵 [MUSIC-PLAYER] Failed to connect to Audio Context:', e);
            return false;
        }
    }

    handlePlaybackError() {
        this.isPlaying = false;
        this.hideNowPlaying();
        
        if (this.currentTrack || this.currentSong) {
            const failedTrack = this.currentTrack || this.currentSong;
            this.queue = this.queue.filter(t => t.id !== failedTrack.id);
            
            if (this.queue.length > 0) {
                this.currentIndex = Math.min(this.currentIndex, this.queue.length - 1);
                this.playNext();
            }
        }
    }

    async playNext() {
        if (this.queue.length === 0) {
            return this.stop();
        }

        this.currentIndex = (this.currentIndex + 1) % this.queue.length;
        const nextSong = this.queue[this.currentIndex];
        
        return await this.playTrack(nextSong);
    }

    async playPrevious() {
        if (this.queue.length === 0) {
            return `❌ No songs in queue`;
        }

        this.currentIndex = this.currentIndex === 0 ? this.queue.length - 1 : this.currentIndex - 1;
        const prevSong = this.queue[this.currentIndex];
        
        return await this.playTrack(prevSong);
    }

    async playTrack(track) {
        if (!track || !track.previewUrl) {
            return `❌ No preview available for this track`;
        }

        try {
            if (!this._audioInitialized) {
                this.initializeAudio();
            }
            
            this.currentTrack = track;
            this.currentSong = track;
            
            if (!this.queue.includes(track)) {
                this.queue.push(track);
                this.currentIndex = this.queue.length - 1;
            } else {
                this.currentIndex = this.queue.findIndex(t => t.id === track.id);
            }
            
            if (this._audioContext && this._audioContext.state === 'suspended') {
                await this._audioContext.resume();
            }
            
            if (!this.audio) {
                this.audio = new Audio();
                this.audio.volume = this.volume;
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
                
                this.audio.addEventListener('canplay', onCanPlay, { once: true });
                this.audio.addEventListener('error', onError, { once: true });
            });
            
            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                await playPromise;
            }
            
            this.isPlaying = true;
            this.showNowPlaying(track);
            
            setTimeout(() => {
                this.setupAudioStreaming();
            }, 500);
            
            return `🎵 Now playing: **${track.title}** by ${track.artist}`;
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error playing track:', error);
            this.isPlaying = false;
            this.showError(`Failed to play: ${track.title} - ${error.message}`);
            return `❌ Failed to play: ${track.title}`;
        }
    }

    async addToQueue(songName) {
        const track = await this.searchMusic(songName);
        if (!track) {
            return `❌ Could not find "${songName}" on iTunes`;
        }

        if (!track.previewUrl) {
            return `❌ No preview available for "${track.title}" by ${track.artist}`;
        }

        this.queue.push(track);
        return `➕ Added to queue: **${track.title}** by ${track.artist} (Position: ${this.queue.length})`;
    }

    getQueueStatus() {
        if (this.queue.length === 0) {
            return `📝 Queue is empty`;
        }

        let status = `📝 **Queue (${this.queue.length} songs):**\n`;
        this.queue.forEach((track, index) => {
            const indicator = index === this.currentIndex ? '▶️' : `${index + 1}.`;
            status += `${indicator} ${track.title} - ${track.artist}\n`;
        });
        
        return status;
    }

    showNowPlaying(track) {
        this.removeExistingPlayer();
        


        
        const playerHtml = `
            <div id="music-player-widget" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                max-width: 300px;
                z-index: 9999;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1);
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="
                        width: 50px;
                        height: 50px;
                        background: url('${track.artworkUrl}') center/cover;
                        border-radius: 8px;
                        border: 2px solid rgba(255,255,255,0.2);
                    "></div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="
                            font-weight: 600;
                            font-size: 14px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            margin-bottom: 2px;
                        ">${track.title}</div>
                        <div style="
                            font-size: 12px;
                            opacity: 0.8;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        ">${track.artist}</div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <button id="play-pause-btn" onclick="window.musicPlayer.togglePlayPause()" style="
                            background: rgba(255,255,255,0.2);
                            border: none;
                            color: white;
                            width: 30px;
                            height: 30px;
                            border-radius: 50%;
                            cursor: pointer;
                            font-size: 12px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">${this.isPlaying ? '⏸️' : '▶️'}</button>
                        <button onclick="window.musicPlayer.debugAudioState()" style="
                            background: rgba(255,255,255,0.2);
                            border: none;
                            color: white;
                            width: 30px;
                            height: 30px;
                            border-radius: 50%;
                            cursor: pointer;
                            font-size: 10px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">🔧</button>
                        <button onclick="window.musicPlayer.stop()" style="
                            background: rgba(255,255,255,0.2);
                            border: none;
                            color: white;
                            width: 30px;
                            height: 30px;
                            border-radius: 50%;
                            cursor: pointer;
                            font-size: 12px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">✕</button>
                    </div>
                </div>
                <div style="
                    margin-top: 10px;
                    height: 3px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 2px;
                    overflow: hidden;
                ">
                    <div id="music-progress" style="
                        height: 100%;
                        background: white;
                        width: 0%;
                        border-radius: 2px;
                        transition: width 0.1s ease;
                    "></div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', playerHtml);
        this.startProgressUpdate();
    }

    startProgressUpdate() {
        if this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        this.progressInterval = setInterval(() => {
            if (this.audio && this.audio.duration) {
                const progress = (this.audio.currentTime / this.audio.duration) * 100;
                const progressBar = document.getElementById('music-progress');
                if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                }
            }
        }, 100);
    }

    hideNowPlaying() {
        this.removeExistingPlayer();
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }

    }

    removeExistingPlayer() {
        const existingPlayer = document.getElementById('music-player-widget');
        if (existingPlayer) {
            existingPlayer.remove();
        }
    }

    showStatus(message) {
        
        

        try {
            const botCard = document.querySelector('[data-participant-id="bot-4"]');
            if (botCard) {
                const statusElement = botCard.querySelector('.music-status');
                if (statusElement) {
                    statusElement.innerHTML = `<i class="fas fa-music mr-1"></i>${message}`;
                }
            }
        } catch (e) {
            console.warn('⚠️ [MUSIC-PLAYER] Failed to update status display:', e);
        }
        

        if (window.toast && typeof window.toast.info === 'function') {
            window.toast.info(message);
        }
    }

    showError(message) {
        console.error(`🎵 [MUSIC-PLAYER] Error: ${message}`);
        

        try {
            const botCard = document.querySelector('[data-participant-id="bot-4"]');
            if (botCard) {
                const statusElement = botCard.querySelector('.music-status');
                if (statusElement) {
                    statusElement.innerHTML = `<i class="fas fa-exclamation-triangle mr-1"></i>${message}`;
                }
            }
        } catch (e) {
            console.warn('⚠️ [MUSIC-PLAYER] Failed to update error display:', e);
        }
        

        if (window.toast && typeof window.toast.error === 'function') {
            window.toast.error(message);
        }
    }

    getCurrentStatus() {
        if (!this.currentSong) {
            return `🎵 No music currently playing`;
        }
        
        const status = this.isPlaying ? 'Playing' : 'Paused';
        return `🎵 ${status}: **${this.currentSong.title}** by ${this.currentSong.artist}`;
    }

    showMusicDebugPanel() {
        console.log('🎵 Audio State:', {
            src: this.audio.src,
            currentSrc: this.audio.currentSrc,
            readyState: this.audio.readyState,
            networkState: this.audio.networkState,
            error: this.audio.error,
            paused: this.audio.paused,
            ended: this.audio.ended,
            volume: this.audio.volume,
            crossOrigin: this.audio.crossOrigin
        });
    }

    validateMusicState() {

        const audioActive = this.audio && !this.audio.paused && this.audio.src;
        const stateValid = this.isPlaying === audioActive;
        const songValid = audioActive ? (!!this.currentSong && !!this.currentTrack) : true;
        
        console.log('🎵 [MUSIC-STATE-VALIDATOR] Music Player State:', {
            audioElement: {
                exists: !!this.audio,
                src: this.audio?.src ? 'Set' : 'Empty',
                paused: this.audio?.paused,
                currentTime: Math.round(this.audio?.currentTime || 0),
                duration: Math.round(this.audio?.duration || 0)
            },
            stateFlags: {
                isPlaying: this.isPlaying,
                audioActive: audioActive,
                stateConsistent: stateValid,
                songDataValid: songValid
            },
            trackData: {
                currentSong: this.currentSong ? 
                    { title: this.currentSong.title, artist: this.currentSong.artist } : null,
                currentTrack: this.currentTrack ? 
                    { title: this.currentTrack.title, artist: this.currentTrack.artist } : null,
                queueLength: this.queue.length,
                currentIndex: this.currentIndex
            }
        });
        

        return {
            isPlaying: audioActive,
            stateConsistent: stateValid,
            songDataValid: songValid,
            currentSongTitle: this.currentSong?.title || this.currentTrack?.title || null,
            recommendations: !stateValid ? 
                ["isPlaying flag does not match audio element state"] : 
                (!songValid ? ["Current song data missing while audio is playing"] : [])
        };
    }

    debugAudioState() {
        console.log('🎵 [MUSIC-DEBUG] Full Audio State:', {
            audioExists: !!this.audio,
            audioSrc: this.audio?.src,
            audioPaused: this.audio?.paused,
            audioCurrentTime: this.audio?.currentTime,
            audioDuration: this.audio?.duration,
            audioVolume: this.audio?.volume,
            audioReadyState: this.audio?.readyState,
            audioNetworkState: this.audio?.networkState,
            audioError: this.audio?.error,
            isPlaying: this.isPlaying,
            contextState: this._audioContext?.state,
            contextExists: !!this._audioContext,
            sourceNodeExists: !!this._audioSourceNode,
            gainNodeExists: !!this._gainNode,
            streamDestinationExists: !!this._musicStreamDestination,
            streamExists: !!this._musicMediaStream,
            currentTrack: this.currentTrack?.title,
            currentSong: this.currentSong?.title,
            voiceManagerState: {
                exists: !!window.voiceManager,
                initialized: window.voiceManager?.initialized,
                connected: window.voiceManager?.isConnected,
                hasMeeting: !!window.voiceManager?.meeting,
                hasLocalParticipant: !!window.voiceManager?.localParticipant,
                micOn: window.voiceManager?._micOn
            }
        });
        
        if (this.audio) {
            console.log('🎵 [MUSIC-DEBUG] Attempting manual play...');
            this.audio.play()
                .then(() => console.log('🎵 [MUSIC-DEBUG] Manual play succeeded'))
                .catch(e => console.log('🎵 [MUSIC-DEBUG] Manual play failed:', e));
        }
        
        if (this.isPlaying) {
            console.log('🎵 [MUSIC-DEBUG] Attempting manual audio streaming...');
            this.setupAudioStreaming();
        }
    }

    async testStreamingPipeline() {
        console.log('🎵 [TEST] Testing complete streaming pipeline...');
        
        const state = this.debugAudioState();
        
        if (!this.audio || !this.isPlaying) {
            console.error('🎵 [TEST] No music playing - start music first');
            return false;
        }
        
        if (!window.voiceManager?.meeting?.localParticipant) {
            console.error('🎵 [TEST] Not connected to voice channel');
            return false;
        }
        
        try {
            console.log('🎵 [TEST] Step 1: Setup audio streaming');
            const streamResult = await this.debugForceStream();
            
            if (!streamResult) {
                console.error('🎵 [TEST] Audio streaming setup failed');
                return false;
            }
            
            console.log('🎵 [TEST] Step 2: Verify stream is active');
            setTimeout(() => {
                const finalState = this.debugAudioState();
                
                const success = finalState.mediaStream.exists && 
                               finalState.mediaStream.active && 
                               finalState.mediaStream.audioTracks > 0 &&
                               finalState.meeting.hasMicProducer;
                
                if (success) {
                    console.log('✅ [TEST] Streaming pipeline test PASSED - Music should be audible to other participants');
                } else {
                    console.log('❌ [TEST] Streaming pipeline test FAILED - Check debug output above');
                }
                
                return success;
            }, 1000);
            
            return true;
            
        } catch (error) {
            console.error('🎵 [TEST] Streaming pipeline test error:', error);
            return false;
        }
    }

    async testPlaySampleTrack() {
        console.log('🎵 [TEST] Testing sample track playback...');
        
        const testTrack = {
            id: 'test-track-001',
            title: 'Test Song',
            artist: 'Test Artist',
            previewUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
        };
        
        console.log('🎵 [TEST] Attempting to play test track:', testTrack);
        
        try {
            const result = await this.playTrack(testTrack);
            console.log('🎵 [TEST] Play result:', result);
            
            setTimeout(() => {
                console.log('🎵 [TEST] Current state after play attempt:', {
                    isPlaying: this.isPlaying,
                    hasAudio: !!this.audio,
                    audioSrc: this.audio?.src,
                    audioPaused: this.audio?.paused,
                    audioCurrentTime: this.audio?.currentTime,
                    audioReadyState: this.audio?.readyState
                });
            }, 1000);
            
            return result;
        } catch (error) {
            console.error('🎵 [TEST] Test track failed:', error);
            return false;
        }
    }

    async testPlaySpotifyPreview() {
        console.log('🎵 [TEST] Testing with Spotify preview URL...');
        
        const spotifyTestTrack = {
            id: 'spotify-test-001',
            title: 'Blinding Lights',
            artist: 'The Weeknd',
            previewUrl: 'https://p.scdn.co/mp3-preview/6b9e6b81d6c2946b50f8b66ec42faa4eda3ebcf7'
        };
        
        console.log('🎵 [TEST] Attempting Spotify preview:', spotifyTestTrack);
        
        try {
            const result = await this.playTrack(spotifyTestTrack);
            console.log('🎵 [TEST] Spotify preview result:', result);
            return result;
        } catch (error) {
            console.error('🎵 [TEST] Spotify preview failed:', error);
            return false;
        }
    }

    async testBasicAudioPlayback() {
        console.log('🎵 [TEST] Testing basic audio element functionality...');
        
        if (!this.audio) {
            console.log('🎵 [TEST] Creating new audio element...');
            this.audio = new Audio();
            this.audio.crossOrigin = "anonymous";
            this.audio.volume = 0.5;
            this.setupAudioEventListeners();
        }
        
        const testUrl = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==';
        
        try {
            console.log('🎵 [TEST] Setting test audio source...');
            this.audio.src = testUrl;
            this.audio.load();
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Load timeout')), 5000);
                
                this.audio.addEventListener('canplay', () => {
                    clearTimeout(timeout);
                    console.log('🎵 [TEST] Audio can play');
                    resolve();
                }, { once: true });
                
                this.audio.addEventListener('error', (e) => {
                    clearTimeout(timeout);
                    console.error('🎵 [TEST] Audio load error:', e);
                    reject(e);
                }, { once: true });
            });
            
            console.log('🎵 [TEST] Attempting to play...');
            const playResult = await this.audio.play();
            console.log('🎵 [TEST] Play successful:', playResult);
            
            this.isPlaying = true;
            
            setTimeout(() => {
                this.audio.pause();
                this.isPlaying = false;
                console.log('🎵 [TEST] Test audio stopped');
            }, 2000);
            
            return true;
            
        } catch (error) {
            console.error('🎵 [TEST] Basic audio test failed:', error);
            return false;
        }
    }

    async testSearchAndPlay(query = 'the weeknd blinding lights') {
        console.log('🎵 [TEST] Testing search and play with query:', query);
        
        try {
            console.log('🎵 [TEST] Step 1: Searching for music...');
            const track = await this.searchMusic(query);
            
            if (!track) {
                console.error('🎵 [TEST] No track found for query:', query);
                return false;
            }
            
            console.log('🎵 [TEST] Step 2: Found track:', {
                title: track.title,
                artist: track.artist,
                previewUrl: track.previewUrl
            });
            
            if (!track.previewUrl) {
                console.error('🎵 [TEST] No preview URL available');
                return false;
            }
            
            console.log('🎵 [TEST] Step 3: Playing track...');
            const result = await this.playTrack(track);
            console.log('🎵 [TEST] Play result:', result);
            
            setTimeout(() => {
                console.log('🎵 [TEST] Final state check:', {
                    isPlaying: this.isPlaying,
                    hasAudio: !!this.audio,
                    audioSrc: this.audio?.src,
                    audioPaused: this.audio?.paused,
                    audioCurrentTime: this.audio?.currentTime
                });
                
                if (this.isPlaying && this.audio && !this.audio.paused) {
                    console.log('✅ [TEST] Music is playing successfully!');
                    console.log('🎵 [TEST] Now testing voice streaming...');
                    this.testStreamingPipeline();
                } else {
                    console.log('❌ [TEST] Music is not playing properly');
                }
            }, 2000);
            
            return result;
            
        } catch (error) {
            console.error('🎵 [TEST] Search and play test failed:', error);
            return false;
        }
    }

    checkSystemReadiness() {
        const readiness = {
            musicPlayer: {
                initialized: this.initialized,
                hasAudio: !!this.audio,
                audioInitialized: this._audioInitialized,
                hasAudioContext: !!this._audioContext,
                audioContextState: this._audioContext?.state
            },
            browser: {
                hasAudioContext: !!(window.AudioContext || window.webkit.AudioContext),
                hasUserGesture: this._audioContext?.state !== 'suspended',
                crossOriginSupport: true
            },
            apis: {
                iTunesApiReachable: 'testing...',
                corsEnabled: 'testing...'
            }
        };
        
        console.log('🎵 [SYSTEM] Readiness check:', readiness);
        
        fetch('https://itunes.apple.com/search?term=test&media=music&limit=1')
            .then(response => {
                console.log('🎵 [SYSTEM] iTunes API test:', response.ok ? 'SUCCESS' : 'FAILED');
                readiness.apis.iTunesApiReachable = response.ok;
            })
            .catch(err => {
                console.log('🎵 [SYSTEM] iTunes API test: FAILED -', err.message);
                readiness.apis.iTunesApiReachable = false;
            });
            
        return readiness;
    }

    async quickAudioTest() {
        console.log('🎵 [QUICK-TEST] Running quick audio test...');
        
        try {
            // Test 1: Check if Audio constructor works
            const testAudio = new Audio();
            console.log('✅ [QUICK-TEST] Audio constructor works');
            
            // Test 2: Check if AudioContext works
            const AudioContext = window.AudioContext || window.webkit.AudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                console.log('✅ [QUICK-TEST] AudioContext works, state:', ctx.state);
                
                if (ctx.state === 'suspended') {
                    await ctx.resume();
                    console.log('✅ [QUICK-TEST] AudioContext resumed');
                }
            } else {
                console.error('❌ [QUICK-TEST] AudioContext not supported');
                return false;
            }
            
            // Test 3: Try to play a data URL audio (beep sound)
            const beepDataUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaMmkGEe';
            
            testAudio.src = beepDataUrl;
            
            const playPromise = testAudio.play();
            if (playPromise) {
                await playPromise;
                console.log('✅ [QUICK-TEST] Basic audio playback works');
                
                // Stop after 1 second
                setTimeout(() => {
                    testAudio.pause();
                    testAudio.currentTime = 0;
                }, 1000);
                
                return true;
            }
            
        } catch (error) {
            console.error('❌ [QUICK-TEST] Quick audio test failed:', error);
            return false;
        }
    }

    async checkMusicPlayerState() {
        console.log('🎵 [STATE-CHECK] Checking music player state...');
        
        const state = {
            initialized: this.initialized,
            audioInitialized: this._audioInitialized,
            hasAudio: !!this.audio,
            isPlaying: this.isPlaying,
            currentTrack: this.currentTrack?.title || 'None',
            queueLength: this.queue?.length || 0,
            volume: this.volume,
            hasAudioContext: !!this._audioContext,
            audioContextState: this._audioContext?.state || 'None'
        };
        
        console.log('🎵 [STATE-CHECK] Current state:', state);
        
        if (!state.initialized) {
            console.log('🎵 [STATE-CHECK] Music player not initialized, calling forceInitialize...');
            this.forceInitialize();
        }
        
        if (!state.audioInitialized) {
            console.log('🎵 [STATE-CHECK] Audio not initialized, calling initializeAudio...');
            this.initializeAudio();
        }
        
        return state;
    }

    // ...existing code...
}

if (typeof window !== 'undefined' && !window.musicPlayer) {
    window.MusicPlayerSystem = MusicPlayerSystem;
    window.musicPlayer = new MusicPlayerSystem();
    
    console.log('🎵 [MUSIC-PLAYER] Global music player initialized');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.musicPlayer.forceInitialize();
        });
    } else {
        window.musicPlayer.forceInitialize();
    }
}

}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicPlayerSystem;
}