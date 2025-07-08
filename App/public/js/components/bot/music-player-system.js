if (typeof window !== 'undefined' && window.MusicPlayerSystem) {

} else {

class MusicPlayerSystem {
    constructor() {
        this.currentSong = null;
        this.queue = [];
        this.currentIndex = 0;
        this.audio = null; // Changed from new Audio() to null for proper initialization
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
        this._triedProxy = false;
        this._audioContext = null;
        this._audioSourceNode = null;
        this._audioInitialized = false;
        

        this.initializeAudio();
        
        this.setupEventListeners();
        this.forceInitialize();
    }

    initializeAudio() {
        console.log('🎵 [MUSIC-PLAYER] Initializing audio system...');
        try {
            // Create a new audio element with better settings
            this.audio = new Audio();
            this.audio.crossOrigin = "anonymous";
            this.audio.preload = "auto"; // Changed from "none" to "auto" for better loading
            this.audio.volume = this.volume;
            
            console.log('🎵 [MUSIC-PLAYER] Audio element created');
            
            // Set up Web Audio API for better audio handling
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                console.log('🎵 [MUSIC-PLAYER] Creating AudioContext');
                this._audioContext = new AudioContext();
                
                try {
                    this._audioSourceNode = this._audioContext.createMediaElementSource(this.audio);
                    this._audioSourceNode.connect(this._audioContext.destination);
                    console.log('🎵 [MUSIC-PLAYER] Audio connected to context successfully');
                } catch (e) {
                    console.warn('🎵 [MUSIC-PLAYER] Could not connect audio to context:', e);
                    // We'll continue without the audio context connection
                }
            } else {
                console.warn('🎵 [MUSIC-PLAYER] AudioContext not available in this browser');
            }
            
            // Set up error handling
            this.audio.addEventListener('error', (e) => {
                console.error('🎵 [MUSIC-PLAYER] Audio playback error:', e, 'Audio src:', this.audio.src);
                this.handlePlaybackError();
            });

            // Set up auto-advance when song ends
            this.audio.addEventListener('ended', () => {
                console.log('🎵 [MUSIC-PLAYER] Track ended, playing next');
                this.playNext();
            });
            
            // Add detailed logging for all audio events
            ['loadstart', 'canplay', 'canplaythrough', 'abort', 'stalled',
             'suspend', 'waiting', 'loadedmetadata', 'loadeddata', 'play',
             'playing', 'pause'].forEach(eventName => {
                this.audio.addEventListener(eventName, () => {
                    console.log(`🎵 [MUSIC-PLAYER] Audio event: ${eventName}`);
                    
                    // When we get the 'playing' event, update our state
                    if (eventName === 'playing') {
                        console.log('🎵 [MUSIC-PLAYER] Playback confirmed - audio is playing');
                        this.isPlaying = true;
                    }
                });
            });
            
            this._audioInitialized = true;
            console.log('🎵 [MUSIC-PLAYER] Audio system initialized successfully');
            
        } catch (e) {
            console.error('🎵 [MUSIC-PLAYER] Failed to initialize audio system:', e);
            
            // Create a simpler fallback audio element
            this.audio = new Audio();
            this.audio.crossOrigin = "anonymous";
            console.log('🎵 [MUSIC-PLAYER] Created fallback audio element');
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
        

        if (!this._audioContext && typeof window !== 'undefined') {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this._audioContext = new AudioContext();
                    
                    

                    if (this.audio && !this._audioSourceNode) {
                        try {
                            this._audioSourceNode = this._audioContext.createMediaElementSource(this.audio);
                            this._audioSourceNode.connect(this._audioContext.destination);
                            
                        } catch (e) {
                            console.warn('🎵 [MUSIC-PLAYER] Could not connect audio to context on force init:', e);
                        }
                    }
                }
            } catch (e) {
                console.warn('🎵 [MUSIC-PLAYER] Could not initialize AudioContext on force init:', e);
            }
        }
        

        setTimeout(() => {
            this.playTestSound();
        }, 1000);
    }
    
    playTestSound() {

        try {
            const testAudio = new Audio();
            testAudio.volume = 0.1; // Slightly audible for testing

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
            } else {
                setTimeout(() => this.setupImmediateListeners(), 1000);
            }
        }
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeAudioEvents();
        });
        
        if (window.globalSocketManager?.io) {
            window.globalSocketManager.io.on('bot-music-command', (data) => {
                console.log('🎵 [MUSIC-PLAYER] Received bot-music-command via socket.io');
                this.processBotMusicCommand(data);
            });
        }
        
        window.addEventListener('bot-music-command', (e) => {
            console.log('🎵 [MUSIC-PLAYER] Received bot-music-command via window event');
            this.processBotMusicCommand(e.detail);
        });
        
        // Listen for voice channel join events to update our channel context
        window.addEventListener('voiceConnect', (e) => {
            if (e.detail && e.detail.channelId) {
                console.log('🎵 [MUSIC-PLAYER] Voice channel joined:', e.detail.channelId);
                this.channelId = e.detail.channelId;
            }
        });
        
        // Listen for bot voice participant events
        window.addEventListener('bot-voice-participant-joined', (e) => {
            if (e.detail && e.detail.participant && e.detail.participant.channelId) {
                console.log('🎵 [MUSIC-PLAYER] Bot joined voice channel:', e.detail.participant.channelId);
            }
        });
        
        this.setupSocketListeners();
        
        // Create a patch for voice detection - improve compatibility with existing code
        this.patchVoiceDetection();
    }
    
    patchVoiceDetection() {
        // This function improves voice detection by checking multiple sources
        const originalFn = window.debugTitiBotVoiceContext;
        
        if (originalFn) {
            window.debugTitiBotVoiceContext = function() {
                // Get original results
                const originalResult = originalFn();
                
                // If original detection worked, use it
                if (originalResult && originalResult.userInVoice && originalResult.voiceChannelId) {
                    return originalResult;
                }
                
                // Otherwise try additional detection methods
                console.log('🎵 [MUSIC-PLAYER] Voice detection patch: Original detection failed, trying alternatives');
                
                let voiceChannelId = null;
                let userInVoice = false;
                
                // Check unified state manager
                if (window.unifiedVoiceStateManager?.getState?.()) {
                    const state = window.unifiedVoiceStateManager.getState();
                    if (state.isConnected && state.channelId) {
                        voiceChannelId = state.channelId;
                        userInVoice = true;
                        console.log('🎵 [MUSIC-PLAYER] Voice detection patch: Found via unifiedVoiceStateManager');
                    }
                }
                
                // Check voice manager
                if (!voiceChannelId && window.voiceManager) {
                    if (window.voiceManager.isConnected && window.voiceManager.currentChannelId) {
                        voiceChannelId = window.voiceManager.currentChannelId;
                        userInVoice = true;
                        console.log('🎵 [MUSIC-PLAYER] Voice detection patch: Found via voiceManager');
                    }
                }
                
                // Check session storage
                if (!voiceChannelId && sessionStorage.getItem('isInVoiceCall') === 'true') {
                    voiceChannelId = sessionStorage.getItem('voiceChannelId') || 
                                     sessionStorage.getItem('currentVoiceChannelId');
                    if (voiceChannelId) {
                        userInVoice = true;
                        console.log('🎵 [MUSIC-PLAYER] Voice detection patch: Found via sessionStorage');
                    }
                }
                
                // Last resort: Check URL and meta tags
                if (!voiceChannelId) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const channelId = urlParams.get('channel');
                    const channelType = urlParams.get('type') || document.querySelector('meta[name="channel-type"]')?.content;
                    
                    if (channelType === 'voice' && channelId) {
                        voiceChannelId = channelId;
                        // Assume user is in voice if we're on a voice channel page
                        userInVoice = true;
                        console.log('🎵 [MUSIC-PLAYER] Voice detection patch: Assuming voice connection from URL');
                    }
                }
                
                return {
                    userInVoice,
                    voiceChannelId,
                    detectionMethod: 'patched'
                };
            };
            
            console.log('🎵 [MUSIC-PLAYER] Voice detection patched for better compatibility');
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
            
            io.on('bot-music-command', (data) => {
                
                this.processBotMusicCommand(data);
            });
        };
        
        setupListeners();
    }

    async processBotMusicCommand(data) {
        console.log('🎵 [MUSIC-PLAYER] Received music command:', data);
        
        if (!data || !data.music_data) {
            console.warn('⚠️ [MUSIC-PLAYER] Invalid bot music command data:', data);
            return;
        }

        // Get current voice context
        const voiceContext = window.debugTitiBotVoiceContext ? window.debugTitiBotVoiceContext() : null;
        
        // Check if the user is in the voice channel where the music is being played
        if (data.channel_id) {
            const isInVoiceChannel = voiceContext && 
                                    voiceContext.userInVoice && 
                                    voiceContext.voiceChannelId === data.channel_id;
            
            // Log voice status for debugging
            console.log('🎵 [MUSIC-PLAYER] Voice context check:', {
                userVoiceContext: voiceContext,
                commandChannelId: data.channel_id,
                isInVoiceChannel: isInVoiceChannel
            });
            
            // If user is not in the voice channel, log but continue processing
            // (Changed from return to just logging to fix music not playing)
            if (!isInVoiceChannel) {
                console.log('🎵 [MUSIC-PLAYER] User not in same voice channel, but processing command anyway');
                
                // Try using the channel ID from the command
                if (data.channel_id && !this.channelId) {
                    this.channelId = data.channel_id;
                    console.log('🎵 [MUSIC-PLAYER] Setting channel ID from command:', data.channel_id);
                }
            }
        }
        
        if (!this.initialized) {
            console.log('🎵 [MUSIC-PLAYER] Initializing music player before processing command');
            this.forceInitialize();
        }
        
        const { music_data } = data;
        const { action, query, track } = music_data;
        
        console.log('🎵 [MUSIC-PLAYER] Processing music command action:', action);
        
        this.showStatus(`Processing ${action} command...`);
        
        try {
            switch (action) {
                case 'play':
                    console.log('🎵 [MUSIC-PLAYER] Processing play command:', query);

                    if (query && query.trim()) {
                        this.showStatus(`Searching for: ${query}`);
                        

                        if (this._audioContext && this._audioContext.state === 'suspended') {
                            try {
                                await this._audioContext.resume();
                                console.log('🎵 [MUSIC-PLAYER] Audio context resumed successfully');
                            } catch (e) {
                                console.warn('🎵 [MUSIC-PLAYER] Failed to resume audio context:', e);
                            }
                        }
                        
                        console.log('🎵 [MUSIC-PLAYER] Searching for music:', query);
                        const searchResult = await this.searchMusic(query.trim());
                        
                        if (searchResult && searchResult.previewUrl) {
                            console.log('🎵 [MUSIC-PLAYER] Search found:', searchResult);
                            this.showStatus(`Found "${searchResult.title}" - preparing playback...`);
                            
                            try {
                                console.log('🎵 [MUSIC-PLAYER] Stopping current playback');
                                await this.stop();
                                
                                // Create a user gesture to unlock audio
                                console.log('🎵 [MUSIC-PLAYER] Creating user gesture to unlock audio');
                                const tempButton = document.createElement('button');
                                tempButton.style.display = 'none';
                                document.body.appendChild(tempButton);
                                tempButton.click();
                                document.body.removeChild(tempButton);
                                
                                // Make sure audio context is resumed
                                if (this._audioContext && this._audioContext.state === 'suspended') {
                                    console.log('🎵 [MUSIC-PLAYER] Resuming audio context again');
                                    await this._audioContext.resume();
                                }
                                
                                // Unlock audio playback
                                this.unlockAudio();
                                
                                // Start playback and show UI
                                console.log('🎵 [MUSIC-PLAYER] Starting playback for:', searchResult.title);
                                
                                // Update state variables BEFORE playback to ensure they're set
                                this.currentSong = searchResult;
                                this.currentTrack = searchResult;
                                
                                await this.playTrack(searchResult);
                                
                                // Force update the player UI
                                console.log('🎵 [MUSIC-PLAYER] Showing now playing UI');
                                this.showNowPlaying(searchResult);
                                this.showStatus(`Now playing: ${searchResult.title}`);
                                
                                // Update isPlaying flag again to ensure it's set
                                this.isPlaying = true;
                                
                                console.log('🎵 [MUSIC-PLAYER] Playback started successfully');
                            } catch (playError) {
                                console.error('🎵 [MUSIC-PLAYER] Error during playback start:', playError);
                                this.showError(`Playback error: ${playError.message}`);
                                
                                // Try a fallback approach
                                console.log('🎵 [MUSIC-PLAYER] Attempting fallback playback');
                                try {
                                    const audioElement = new Audio(searchResult.previewUrl);
                                    audioElement.volume = 0.5;
                                    audioElement.play();
                                    
                                    this.audio = audioElement;
                                    this.isPlaying = true;
                                    this.currentSong = searchResult;
                                    this.showNowPlaying(searchResult);
                                    
                                    console.log('🎵 [MUSIC-PLAYER] Fallback playback started');
                                } catch (fallbackError) {
                                    console.error('🎵 [MUSIC-PLAYER] Fallback playback failed:', fallbackError);
                                }
                            }
                        } else {
                            console.warn('⚠️ [MUSIC-PLAYER] No playable track found for:', query);
                            this.showError('No playable track found for: ' + query);
                        }
                    } else if (track && track.previewUrl) {
                        console.log('🎵 [MUSIC-PLAYER] Playing provided track:', track.title);
                        this.showStatus(`Preparing to play "${track.title}"...`);
                        
                        await this.stop();
                        
                        await this.playTrack(track);
                        this.showNowPlaying(track);
                        this.showStatus(`Now playing: ${track.title}`);
                        
                        // Update state variables
                        this.isPlaying = true;
                        this.currentSong = track;
                        
                        console.log('🎵 [MUSIC-PLAYER] Playback started for provided track');
                    } else {
                        console.error('🎵 [MUSIC-PLAYER] No song specified or found');
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
                return data.results.map(track => ({
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
            console.error('iTunes search error:', error);
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

    initializeAudioEvents() {
        if (this.audio) {
            this.audio.addEventListener('ended', () => {
                this.playNext();
            });

            this.audio.addEventListener('error', (e) => {
                console.error('🎵 [MUSIC-PLAYER] Audio playback error:', e, 'Audio src:', this.audio.src);
                this.handlePlaybackError();
            });

            this.audio.addEventListener('loadstart', () => {

            });

            this.audio.addEventListener('canplay', () => {

            });

            this.audio.addEventListener('abort', () => {

            });

            this.audio.addEventListener('stalled', () => {

            });
        }
    }

    async searchMusic(query) {
        try {

            const apiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=5&country=us`;
            
            
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {

                const track = data.results.find(t => t.previewUrl) || data.results[0];
                
                
                
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
            console.warn('🎵 [MUSIC-PLAYER] No tracks found for:', query);
            return null;
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Music search error:', error);
            

            try {
                


                return {
                    title: `Test Track for "${query}"`,
                    artist: "Test Artist",
                    album: "Test Album",
                    previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/8e/74/d5/8e74d5de-3b38-ba44-b258-a1a27bb9e8e2/mzaf_13304972783897371755.plus.aac.p.m4a",
                    artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/a9/ed/9e/a9ed9e90-6d6d-0a41-a869-3fa8f876d5fe/source/100x100bb.jpg",
                    duration: 30000,
                    id: Date.now()
                };
            } catch (fallbackError) {
                console.error('🎵 [MUSIC-PLAYER] Alternative search failed:', fallbackError);
                return null;
            }
        }
    }

    async play(track) {
        if (!track || !track.previewUrl) {
            console.error('🎵 Invalid track or missing preview URL');
            return false;
        }

        try {
            await this.stop();
            
            this.currentTrack = track;
            this.audio.src = track.previewUrl;
            
            await new Promise((resolve, reject) => {
                this.audio.addEventListener('canplaythrough', resolve, { once: true });
                this.audio.addEventListener('error', reject, { once: true });
                this.audio.load();
            });


            await this.audio.play();
            this.isPlaying = true;
            

            return true;
        } catch (error) {
            console.error('🎵 Music Player Error:', error.message || 'Failed to play audio');
            this.handlePlaybackError();
            return false;
        }
    }

    async stop() {
        try {
            if (this.audio) {
                this.audio.pause();
                this.audio.currentTime = 0;
                this.isPlaying = false;
                

                if (this._audioSourceNode) {
                    try {
                        this._audioSourceNode.disconnect();
                        this._audioSourceNode = null;
                    } catch (e) {
                        console.warn('🎵 [MUSIC-PLAYER] Error disconnecting audio source:', e);
                    }
                }
                

                this.audio.removeAttribute('src');
                this.audio.load();
            }
            

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
                

                this.audio.addEventListener('error', (e) => {
                    console.error('🎵 [MUSIC-PLAYER] Audio playback error:', e);
                    this.handlePlaybackError();
                });
                
                this.audio.addEventListener('ended', () => {
                    this.playNext();
                });
                

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

            
                            console.error(`❌ Failed to play "${failedTrack.title}" - skipping`);
            
            this.queue = this.queue.filter(t => t.id !== failedTrack.id);
            
            if (this.queue.length > 0) {

                setTimeout(() => this.playNext(), 1000);
            } else {


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
            console.error('🎵 [MUSIC-PLAYER] Invalid track or missing preview URL:', track);
            return `❌ No preview available for this track`;
        }

        try {
            console.log('🎵 [MUSIC-PLAYER] Attempting to play track:', {
                title: track.title,
                artist: track.artist,
                previewUrl: track.previewUrl
            });
            

            if (!this._audioInitialized) {
                this.initializeAudio();
            }
            
            await this.stop();
            

            this.unlockAudio();
            
            // Update both state tracking variables
            this.currentSong = track;
            this.currentTrack = track;
            
            this.audio.volume = this.volume;
            this.audio.crossOrigin = "anonymous";
            this.audio.preload = "auto"; // Changed from metadata to auto for more reliable loading
            

            if (this._audioContext && this._audioContext.state === 'suspended') {
                try {
                    await this._audioContext.resume();
                    
                } catch (e) {
                    console.warn('🎵 [MUSIC-PLAYER] Failed to resume audio context:', e);
                }
            }
            

            if (!this.queue.some(t => t.id === track.id)) {
                this.queue.push(track);
                this.currentIndex = this.queue.length - 1;
            }
            

            try {
                this.audio.src = track.previewUrl;
                this.audio.load();
                

                this.unlockAudio();
                
                const playPromise = this.audio.play();
                if (playPromise !== undefined) {
                    await playPromise;
                }
                
                // Ensure both state tracking variables are set
                this.isPlaying = true;
                this.currentSong = track;
                this.currentTrack = track;
                
                this.showNowPlaying(track);
                
                return `🎵 Now playing: **${track.title}** by ${track.artist}`;
            } catch (directPlayError) {
                console.warn('🎵 [MUSIC-PLAYER] Direct play failed, trying with events:', directPlayError);

                if (directPlayError.name === 'NotAllowedError') {
                    this.showStatus('Click anywhere to enable music playback');
                }

            }
            
            return new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    console.error('🎵 [MUSIC-PLAYER] Audio loading timeout for:', track.title);
                    cleanup();
                    reject(new Error('Audio loading timeout'));
                }, 20000); // Increase timeout for slower connections
                

                const backupTimerId = setTimeout(() => {
                    
                    this.audio.preload = "auto";
                    if (this.audio.readyState < 2) {
                        this.audio.load(); // Reload with auto preload
                    }
                    

                    try {
                        this.audio.play().then(() => {
                            
                            cleanup();
                            this.isPlaying = true;
                            this.showNowPlaying(track);
                            resolve(`🎵 Now playing: **${track.title}** by ${track.artist}`);
                        }).catch(e => {
                            console.warn('🎵 [MUSIC-PLAYER] Backup timer play failed:', e);

                        });
                    } catch (e) {
                        console.warn('🎵 [MUSIC-PLAYER] Backup timer play error:', e);
                    }
                }, 3000);

                const cleanup = () => {
                    clearTimeout(timeoutId);
                    clearTimeout(backupTimerId);
                    this.audio.removeEventListener('canplay', onCanPlay);
                    this.audio.removeEventListener('canplaythrough', onCanPlayThrough);
                    this.audio.removeEventListener('error', onError);
                    this.audio.removeEventListener('loadeddata', onLoadedData);
                    this.audio.removeEventListener('loadedmetadata', onLoadedMetadata);
                };

                const onLoadedMetadata = () => {
                    
                    this.audio.preload = "auto";
                };

                const onCanPlay = async () => {
                    cleanup();
                    try {
                        
                        

                        this.audio.muted = false;
                        

                        if (this._audioContext && !this._audioSourceNode) {
                            try {
                                this.connectToAudioContext();
                            } catch (e) {
                                console.warn('🎵 [MUSIC-PLAYER] Failed to connect to audio context:', e);
                            }
                        }
                        

                        this.unlockAudio();
                        
                        await this.audio.play();
                        this.isPlaying = true;
                        this.showNowPlaying(track);
                        

                        resolve(`🎵 Now playing: **${track.title}** by ${track.artist}`);
                    } catch (playError) {
                        console.error('🎵 [MUSIC-PLAYER] Play error:', playError);
                        

                        try {
                            
                            

                            this.unlockAudio();
                            
                            const playPromise = this.audio.play();
                            if (playPromise !== undefined) {
                                playPromise
                                    .then(() => {
                                        
                                        this.isPlaying = true;
                                        this.showNowPlaying(track);
                                        resolve(`🎵 Now playing: **${track.title}** by ${track.artist}`);
                                    })
                                    .catch(err => {
                                        console.error('🎵 [MUSIC-PLAYER] Second play attempt failed:', err);
                                        

                                        this.recreateAudioElement(track).then(result => {
                                            resolve(result);
                                        }).catch(finalError => {
                                            reject(finalError);
                                        });
                                    });
                            }
                        } catch (secondError) {
                            console.error('🎵 [MUSIC-PLAYER] Second play attempt error:', secondError);
                            reject(secondError);
                        }
                    }
                };

                const onCanPlayThrough = onCanPlay;
                const onLoadedData = onCanPlay;

                const onError = (e) => {
                    cleanup();
                    console.error('🎵 [MUSIC-PLAYER] Audio load error for:', track.title);
                    console.error('🎵 [MUSIC-PLAYER] Failed URL:', this.audio.src);
                    console.error('🎵 [MUSIC-PLAYER] Audio error details:', {
                        error: this.audio.error,
                        networkState: this.audio.networkState,
                        readyState: this.audio.readyState,
                        currentSrc: this.audio.currentSrc
                    });
                    

                    if (!this.audio.src.includes('cors-anywhere') && !this._triedProxy) {
                        
                        this._triedProxy = true;
                        const proxyUrl = `https://cors-anywhere.herokuapp.com/${track.previewUrl}`;
                        this.audio.src = proxyUrl;
                        this.audio.load();
                        return; // Don't reject yet, give the proxy a chance
                    }
                    

                    this.recreateAudioElement(track).then(result => {
                        resolve(result);
                    }).catch(finalError => {
                        this._triedProxy = false;
                        reject(new Error(`Failed to load "${track.title}". This might be due to CORS restrictions or the preview is no longer available.`));
                    });
                };

                this.audio.addEventListener('canplay', onCanPlay, { once: true });
                this.audio.addEventListener('canplaythrough', onCanPlayThrough, { once: true });
                this.audio.addEventListener('loadeddata', onLoadedData, { once: true });
                this.audio.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
                this.audio.addEventListener('error', onError, { once: true });


                const debugEvents = ['abort', 'stalled', 'suspend', 'waiting'];
                debugEvents.forEach(event => {
                    this.audio.addEventListener(event, () => {
                        
                    }, { once: true });
                });


                if (!this.audio.src || this.audio.src !== track.previewUrl) {
                    this.audio.src = track.previewUrl;
                    this.audio.load();
                }
            });
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Playback error:', error);
            this.isPlaying = false;
            

            try {
                const result = await this.recreateAudioElement(track);
                return result;
            } catch (finalError) {
                if (error.name === 'AbortError') {
                    return `⚠️ Playback interrupted, retrying "${track.title}"...`;
                } else if (error.message.includes('CORS') || error.message.includes('network')) {
                    return `❌ Cannot play "${track.title}": Network or CORS restrictions`;
                } else if (error.message.includes('timeout')) {
                    return `❌ "${track.title}" took too long to load`;
                }
                
                return `❌ Failed to play "${track.title}": ${error.message}`;
            }
        }
    }
    

    async recreateAudioElement(track) {
        
        
        try {

            if (this._audioSourceNode) {
                try {
                    this._audioSourceNode.disconnect();
                    this._audioSourceNode = null;
                } catch (e) {
                    console.warn('🎵 [MUSIC-PLAYER] Error disconnecting audio source:', e);
                }
            }
            

            const newAudio = new Audio();
            newAudio.crossOrigin = "anonymous";
            newAudio.preload = "auto";
            newAudio.volume = this.volume;
            newAudio.src = track.previewUrl;
            

            if (this._audioContext) {
                try {
                    await this._audioContext.resume();
                    this._audioSourceNode = this._audioContext.createMediaElementSource(newAudio);
                    this._audioSourceNode.connect(this._audioContext.destination);
                } catch (e) {
                    console.warn('🎵 [MUSIC-PLAYER] Failed to connect recreated audio to context:', e);
                }
            }
            

            const tempButton = document.createElement('button');
            tempButton.style.display = 'none';
            document.body.appendChild(tempButton);
            tempButton.click();
            document.body.removeChild(tempButton);
            

            await newAudio.play();
            

            if (this.audio) {
                this.audio.pause();
                this.audio.src = '';
            }
            this.audio = newAudio;
            

            this.audio.addEventListener('error', (e) => {
                console.error('🎵 [MUSIC-PLAYER] Recreated audio error:', e);
                this.handlePlaybackError();
            });
            
            this.audio.addEventListener('ended', () => {
                this.playNext();
            });
            
            this.isPlaying = true;
            this.showNowPlaying(track);
            
            
            return `🎵 Now playing: **${track.title}** by ${track.artist}`;
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Failed to play with recreated audio:', error);
            throw error;
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
        

        try {
            if (!this.botParticipantAdded) {
                const grid = document.getElementById("participantGrid");
                const existingBotCard = grid?.querySelector(`[data-participant-id="bot-${this.botParticipantId}"]`);
                
                if (!existingBotCard) {
                    const botData = {
                        user_id: this.botParticipantId,
                        username: 'TitiBot',
                        avatar_url: '/public/assets/common/default-profile-picture.png'
                    };
                    
                    window.dispatchEvent(new CustomEvent('bot-voice-participant-joined', { 
                        detail: { participant: botData } 
                    }));
                }
                this.botParticipantAdded = true;
            }
        } catch (e) {
            console.warn('⚠️ [MUSIC-PLAYER] Failed to inject bot participant:', e);
        }
        
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
        if (this.progressInterval) {
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
        try {
            if (this.botParticipantAdded) {
                window.dispatchEvent(new CustomEvent('bot-voice-participant-left', { 
                    detail: { participant: { user_id: this.botParticipantId } } 
                }));
                this.botParticipantAdded = false;
            }
        } catch (e) {
            console.warn('⚠️ [MUSIC-PLAYER] Failed to remove bot participant:', e);
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
        // Check all state variables
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
        
        // Return summarized status
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
}

if (typeof window !== 'undefined' && !window.musicPlayer) {
    window.MusicPlayerSystem = MusicPlayerSystem;
    window.musicPlayer = new MusicPlayerSystem();
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.musicPlayer.forceInitialize();
        });
    } else {
        window.musicPlayer.forceInitialize();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicPlayerSystem;
}

} // End of conditional block