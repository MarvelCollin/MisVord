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
        this._audioInitialized = false;
        

        this.initializeAudio();
        
        this.setupEventListeners();
        this.forceInitialize();
    }

    initializeAudio() {
        try {
            this.audio = new Audio();
            this.audio.crossOrigin = "anonymous";
            this.audio.preload = "auto"; 
            this.audio.volume = this.volume;
            
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext && !this._audioContext) {
                this._audioContext = new AudioContext();
            }
            
            this.setupAudioEventListeners();
            this._audioInitialized = true;
            
        } catch (e) {
            console.error('🎵 [MUSIC-PLAYER] Failed to initialize audio system:', e);
            this.audio = new Audio();
            this.audio.crossOrigin = "anonymous";
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
    
    setupAudioEventListeners() {
        if (!this.audio) return;
        
        this.audio.addEventListener('error', (e) => {
            this.isPlaying = false;
            this.hideNowPlaying();
            this.playNext();
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
            } else {
                setTimeout(() => this.setupImmediateListeners(), 1000);
            }
        }
    }

    setupEventListeners() {
        
        if (window.globalSocketManager?.io) {
            window.globalSocketManager.io.on('bot-music-command', (data) => {
                
                this.processBotMusicCommand(data);
            });
        }
        
        window.addEventListener('bot-music-command', (e) => {
            
            this.processBotMusicCommand(e.detail);
        });
        

        window.addEventListener('voiceConnect', (e) => {
            if (e.detail && e.detail.channelId) {
                
                this.channelId = e.detail.channelId;
            }
        });
        
        window.addEventListener('voiceDisconnect', (e) => {
            this.channelId = null;
            if (this.isPlaying) {
                this.stop();
                this.showStatus('Music stopped - left voice channel');
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
            
            io.on('bot-music-command', (data) => {
                
                this.processBotMusicCommand(data);
            });
        };
        
        setupListeners();
    }

    async processBotMusicCommand(data) {
        
        
        if (!data || !data.music_data) {
            console.warn('⚠️ [MUSIC-PLAYER] Invalid bot music command data:', data);
            return;
        }


        const voiceContext = window.debugTitiBotVoiceContext ? window.debugTitiBotVoiceContext() : null;
        

        if (data.channel_id) {
            const isInVoiceChannel = voiceContext && 
                                    voiceContext.userInVoice && 
                                    voiceContext.voiceChannelId === data.channel_id;
            

            console.log('🎵 [MUSIC-PLAYER] Voice context check:', {
                userVoiceContext: voiceContext,
                commandChannelId: data.channel_id,
                isInVoiceChannel: isInVoiceChannel
            });
            


            if (!isInVoiceChannel) {
                
                

                if (data.channel_id && !this.channelId) {
                    this.channelId = data.channel_id;
                    
                }
            }
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
                    

                    if (query && query.trim()) {
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
            
            await this.stop();
            
            this.unlockAudio();
            
            if (this._audioContext && this._audioContext.state === 'suspended') {
                await this._audioContext.resume();
            }
            
            this.connectAudioToContext();
            
            this.audio.volume = this.volume;
            this.audio.crossOrigin = "anonymous";
            this.audio.src = track.previewUrl;
            this.audio.load();
            
            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                await playPromise;
            }
            
            this.isPlaying = true;
            this.showNowPlaying(track);
            
            return `🎵 Now playing: **${track.title}** by ${track.artist}`;
            
        } catch (error) {
            this.isPlaying = false;
            this.hideNowPlaying();
            
            if (this.queue.length > 0) {
                this.queue = this.queue.filter(t => t.id !== track.id);
                if (this.queue.length > 0) {
                    this.currentIndex = Math.min(this.currentIndex, this.queue.length - 1);
                    return this.playNext();
                }
            }
            
            return `❌ Failed to play "${track.title}"`;
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
        console.log('🎵 [MUSIC-DEBUG] Audio State:', {
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
            currentTrack: this.currentTrack?.title,
            currentSong: this.currentSong?.title
        });
        
        if (this.audio) {
            console.log('🎵 [MUSIC-DEBUG] Attempting manual play...');
            this.audio.play()
                .then(() => console.log('🎵 [MUSIC-DEBUG] Manual play succeeded'))
                .catch(e => console.log('🎵 [MUSIC-DEBUG] Manual play failed:', e));
        }
    }

    async togglePlayPause() {
        if (!this.audio) return;
        
        try {
            if (this.isPlaying) {
                this.audio.pause();
                this.isPlaying = false;
                this.showStatus('Music paused');
            } else {
                this.unlockAudio();
                
                if (this._audioContext && this._audioContext.state === 'suspended') {
                    await this._audioContext.resume();
                }
                
                await this.audio.play();
                this.isPlaying = true;
                this.showStatus('Music resumed');
            }
            
            const playPauseBtn = document.getElementById('play-pause-btn');
            if (playPauseBtn) {
                playPauseBtn.innerHTML = this.isPlaying ? '⏸️' : '▶️';
            }
        } catch (error) {
            this.showError('Failed to toggle playback');
        }
    }

    connectAudioToContext() {
        if (!this._audioContext || !this.audio) return;
        
        try {
            if (!this._audioSourceNode) {
                this._audioSourceNode = this._audioContext.createMediaElementSource(this.audio);
                this._audioSourceNode.connect(this._audioContext.destination);
            }
        } catch (e) {
            console.warn('🎵 [MUSIC-PLAYER] Could not connect audio to context:', e);
        }
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

}