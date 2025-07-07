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
        
        // Initialize audio properly
        this.initializeAudio();
        
        this.setupEventListeners();
        this.forceInitialize();
    }

    initializeAudio() {
        try {
            // Create audio element
            this.audio = new Audio();
            this.audio.crossOrigin = "anonymous";
            this.audio.preload = "none";
            this.audio.volume = this.volume;
            
            // Initialize audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this._audioContext = new AudioContext();
                
                // Connect audio element to context
                try {
                    this._audioSourceNode = this._audioContext.createMediaElementSource(this.audio);
                    this._audioSourceNode.connect(this._audioContext.destination);
                    console.log('🎵 [MUSIC-PLAYER] Audio connected to context on initialization');
                } catch (e) {
                    console.warn('🎵 [MUSIC-PLAYER] Could not connect audio to context:', e);
                }
                
                console.log('🎵 [MUSIC-PLAYER] Audio context initialized');
            }
            
            // Set up basic event listeners
            this.audio.addEventListener('error', (e) => {
                console.error('🎵 [MUSIC-PLAYER] Audio playback error:', e, 'Audio src:', this.audio.src);
                this.handlePlaybackError();
            });

            this.audio.addEventListener('ended', () => {
                this.playNext();
            });
            
            // Add more comprehensive event listeners for debugging
            ['loadstart', 'canplay', 'canplaythrough', 'abort', 'stalled',
             'suspend', 'waiting', 'loadedmetadata', 'loadeddata', 'play',
             'playing', 'pause'].forEach(eventName => {
                this.audio.addEventListener(eventName, () => {
                    console.log(`🎵 [MUSIC-PLAYER] Audio event: ${eventName}`);
                });
            });
            
            this._audioInitialized = true;
            console.log('🎵 [MUSIC-PLAYER] Audio system initialized successfully');
        } catch (e) {
            console.error('🎵 [MUSIC-PLAYER] Failed to initialize audio system:', e);
            // Fallback to basic audio
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
        
        // Ensure audio is initialized
        if (!this._audioInitialized) {
            this.initializeAudio();
        }
        
        // Ensure we have a valid audio context
        if (!this._audioContext && typeof window !== 'undefined') {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this._audioContext = new AudioContext();
                    console.log('🎵 [MUSIC-PLAYER] Audio context initialized on force init');
                    
                    // Try to connect audio to context
                    if (this.audio && !this._audioSourceNode) {
                        try {
                            this._audioSourceNode = this._audioContext.createMediaElementSource(this.audio);
                            this._audioSourceNode.connect(this._audioContext.destination);
                            console.log('🎵 [MUSIC-PLAYER] Audio connected to context on force init');
                        } catch (e) {
                            console.warn('🎵 [MUSIC-PLAYER] Could not connect audio to context on force init:', e);
                        }
                    }
                }
            } catch (e) {
                console.warn('🎵 [MUSIC-PLAYER] Could not initialize AudioContext on force init:', e);
            }
        }
        
        // Add a test sound to verify audio is working
        setTimeout(() => {
            this.playTestSound();
        }, 1000);
    }
    
    playTestSound() {
        // Create a short silent audio to test the audio system
        try {
            const testAudio = new Audio();
            testAudio.volume = 0.1; // Slightly audible for testing
            // Use a short beep sound instead of silent audio
            testAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
            
            // Play and immediately pause to initialize audio system
            const playPromise = testAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setTimeout(() => {
                        testAudio.pause();
                        console.log('🎵 [MUSIC-PLAYER] Audio system test successful');
                    }, 100);
                }).catch(e => {
                    console.warn('🎵 [MUSIC-PLAYER] Audio system test failed:', e);
                    // Try with user gesture simulation
                    this.unlockAudio();
                });
            }
        } catch (e) {
            console.warn('🎵 [MUSIC-PLAYER] Audio system test error:', e);
        }
    }
    
    unlockAudio() {
        try {
            // Create a user gesture
            const tempButton = document.createElement('button');
            tempButton.style.display = 'none';
            document.body.appendChild(tempButton);
            tempButton.click();
            
            // Try to resume audio context
            if (this._audioContext && this._audioContext.state === 'suspended') {
                this._audioContext.resume().then(() => {
                    console.log('🎵 [MUSIC-PLAYER] Audio context unlocked');
                }).catch(e => {
                    console.warn('🎵 [MUSIC-PLAYER] Failed to unlock audio context:', e);
                });
            }
            
            // Try a short sound
            const unlockAudio = new Audio();
            unlockAudio.volume = 0.1;
            unlockAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
            unlockAudio.play().then(() => {
                console.log('🎵 [MUSIC-PLAYER] Audio unlocked successfully');
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
            
            // Set up automatic audio unlock on any user interaction
            const autoUnlockEvents = ['click', 'touch', 'keydown', 'mousedown'];
            const autoUnlock = () => {
                if (this._audioContext && this._audioContext.state === 'suspended') {
                    this._audioContext.resume().then(() => {
                        console.log('🎵 [MUSIC-PLAYER] Audio context auto-unlocked');
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

                this.processBotMusicCommand(data);
            });
        }
        
        window.addEventListener('bot-music-command', (e) => {

            this.processBotMusicCommand(e.detail);
        });
        
        this.setupSocketListeners();
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
                console.log('🎵 [MUSIC-PLAYER] Received bot-music-command:', data);
                this.processBotMusicCommand(data);
            });
        };
        
        setupListeners();
    }

    async processBotMusicCommand(data) {
        console.log('🎵 [MUSIC-PLAYER] Processing bot music command:', data);
        
        if (!data || !data.music_data) {
            console.warn('⚠️ [MUSIC-PLAYER] Invalid bot music command data:', data);
            return;
        }
        
        if (!this.initialized) {
            console.log('🎵 [MUSIC-PLAYER] Not initialized, forcing initialization...');
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
                        
                        // Try to wake up audio system first
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
                            
                            // Make sure any previous audio is stopped
                            await this.stop();
                            
                            // Try to create user interactions to overcome autoplay restrictions
                            try {
                                // Method 1: Simulate click
                                const tempButton = document.createElement('button');
                                tempButton.style.display = 'none';
                                document.body.appendChild(tempButton);
                                tempButton.click();
                                document.body.removeChild(tempButton);
                                
                                // Method 2: Resume audio context if suspended
                                if (this._audioContext && this._audioContext.state === 'suspended') {
                                    await this._audioContext.resume();
                                }
                                
                                // Method 3: Unlock audio with a silent play
                                this.unlockAudio();
                            } catch (e) {
                                console.warn('🎵 [MUSIC-PLAYER] Failed to create user gesture:', e);
                            }
                            
                            await this.playTrack(searchResult);
                            this.showNowPlaying(searchResult);
                            this.showStatus(`Now playing: ${searchResult.title}`);

                        } else {
                            console.warn('⚠️ [MUSIC-PLAYER] No playable track found for:', query);
                            this.showError('No playable track found for: ' + query);
                        }
                    } else if (track && track.previewUrl) {
                        this.showStatus(`Preparing to play "${track.title}"...`);
                        
                        // Make sure any previous audio is stopped
                        await this.stop();
                        
                        await this.playTrack(track);
                        this.showNowPlaying(track);
                        this.showStatus(`Now playing: ${track.title}`);

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
            // Use a more reliable API endpoint with better CORS support
            const apiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=5&country=us`;
            
            console.log('🎵 [MUSIC-PLAYER] Searching for:', query);
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                // Find the first track with a valid preview URL
                const track = data.results.find(t => t.previewUrl) || data.results[0];
                
                console.log('🎵 [MUSIC-PLAYER] Found track:', track.trackName);
                
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
            
            // Try an alternative search API if iTunes fails
            try {
                console.log('🎵 [MUSIC-PLAYER] Trying alternative search method');
                // This is a placeholder - in a real implementation you might use another API
                // For now we'll just create a mock track for testing
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

            // Start playback
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
                
                // Disconnect any audio source nodes if using Web Audio API
                if (this._audioSourceNode) {
                    try {
                        this._audioSourceNode.disconnect();
                        this._audioSourceNode = null;
                    } catch (e) {
                        console.warn('🎵 [MUSIC-PLAYER] Error disconnecting audio source:', e);
                    }
                }
                
                // Reset the audio element
                this.audio.removeAttribute('src');
                this.audio.load();
            }
            
            // Update UI
            this.hideNowPlaying();
            this.showStatus('Music stopped');
            
            return true;
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Error stopping playback:', error);
            return false;
        }
    }
    
    // New method to connect audio to Web Audio API for better control
    connectToAudioContext() {
        if (!this._audioContext || !this.audio) return false;
        
        try {
            // Resume audio context if it's suspended (browser autoplay policy)
            if (this._audioContext.state === 'suspended') {
                this._audioContext.resume();
            }
            
            // Disconnect any existing connections
            if (this._audioSourceNode) {
                try {
                    this._audioSourceNode.disconnect();
                } catch (e) {
                    console.warn('🎵 [MUSIC-PLAYER] Error disconnecting existing source:', e);
                }
            }
            
            // Create a new media element source
            try {
                this._audioSourceNode = this._audioContext.createMediaElementSource(this.audio);
                // Connect to destination (speakers)
                this._audioSourceNode.connect(this._audioContext.destination);
                
                console.log('🎵 [MUSIC-PLAYER] Connected to Audio Context');
                return true;
            } catch (mediaError) {
                // If we get an error about the media element already being connected
                console.warn('🎵 [MUSIC-PLAYER] Media element connection error:', mediaError);
                
                // Try recreating the audio element
                const currentSrc = this.audio.src;
                const currentTime = this.audio.currentTime;
                const wasPlaying = !this.audio.paused;
                
                // Create new audio element
                const newAudio = new Audio();
                newAudio.crossOrigin = "anonymous";
                newAudio.preload = "auto";
                newAudio.volume = this.volume;
                newAudio.src = currentSrc;
                newAudio.currentTime = currentTime;
                
                // Connect new element
                this._audioSourceNode = this._audioContext.createMediaElementSource(newAudio);
                this._audioSourceNode.connect(this._audioContext.destination);
                
                // Replace old element
                const oldAudio = this.audio;
                this.audio = newAudio;
                
                // Set up basic event listeners
                this.audio.addEventListener('error', (e) => {
                    console.error('🎵 [MUSIC-PLAYER] Audio playback error:', e);
                    this.handlePlaybackError();
                });
                
                this.audio.addEventListener('ended', () => {
                    this.playNext();
                });
                
                // Resume playback if needed
                if (wasPlaying) {
                    this.audio.play().catch(e => {
                        console.warn('🎵 [MUSIC-PLAYER] Failed to resume playback after recreation:', e);
                    });
                }
                
                // Clean up old element
                oldAudio.pause();
                oldAudio.src = '';
                
                console.log('🎵 [MUSIC-PLAYER] Recreated and connected audio element');
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
            
            // Make sure audio is initialized
            if (!this._audioInitialized) {
                this.initializeAudio();
            }
            
            await this.stop();
            
            // Unlock audio system
            this.unlockAudio();
            
            this.currentSong = track;
            this.audio.volume = this.volume;
            this.audio.crossOrigin = "anonymous";
            this.audio.preload = "auto"; // Changed from metadata to auto for more reliable loading
            
            // Try to wake up the audio context if needed
            if (this._audioContext && this._audioContext.state === 'suspended') {
                try {
                    await this._audioContext.resume();
                    console.log('🎵 [MUSIC-PLAYER] Audio context resumed');
                } catch (e) {
                    console.warn('🎵 [MUSIC-PLAYER] Failed to resume audio context:', e);
                }
            }
            
            // Add to queue if not already in it
            if (!this.queue.some(t => t.id === track.id)) {
                this.queue.push(track);
                this.currentIndex = this.queue.length - 1;
            }
            
            // Try direct playback first for faster response
            try {
                this.audio.src = track.previewUrl;
                this.audio.load();
                
                // Create user interaction for autoplay
                this.unlockAudio();
                
                const playPromise = this.audio.play();
                if (playPromise !== undefined) {
                    await playPromise;
                }
                
                this.isPlaying = true;
                this.showNowPlaying(track);
                console.log('🎵 [MUSIC-PLAYER] Direct playback started successfully');
                return `🎵 Now playing: **${track.title}** by ${track.artist}`;
            } catch (directPlayError) {
                console.warn('🎵 [MUSIC-PLAYER] Direct play failed, trying with events:', directPlayError);
                // If autoplay is blocked, show user-friendly message
                if (directPlayError.name === 'NotAllowedError') {
                    this.showStatus('Click anywhere to enable music playback');
                }
                // Continue with the promise-based approach if direct play fails
            }
            
            return new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    console.error('🎵 [MUSIC-PLAYER] Audio loading timeout for:', track.title);
                    cleanup();
                    reject(new Error('Audio loading timeout'));
                }, 20000); // Increase timeout for slower connections
                
                // Create a backup timer to force playback attempt if metadata loading is slow
                const backupTimerId = setTimeout(() => {
                    console.log('🎵 [MUSIC-PLAYER] Backup timer triggered - forcing playback attempt');
                    this.audio.preload = "auto";
                    if (this.audio.readyState < 2) {
                        this.audio.load(); // Reload with auto preload
                    }
                    
                    // Try to play directly from the backup timer
                    try {
                        this.audio.play().then(() => {
                            console.log('🎵 [MUSIC-PLAYER] Backup timer play successful');
                            cleanup();
                            this.isPlaying = true;
                            this.showNowPlaying(track);
                            resolve(`🎵 Now playing: **${track.title}** by ${track.artist}`);
                        }).catch(e => {
                            console.warn('🎵 [MUSIC-PLAYER] Backup timer play failed:', e);
                            // Don't reject, let the event handlers try
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
                    console.log('🎵 [MUSIC-PLAYER] Metadata loaded, setting preload to auto');
                    this.audio.preload = "auto";
                };

                const onCanPlay = async () => {
                    cleanup();
                    try {
                        console.log('🎵 [MUSIC-PLAYER] Audio can play, attempting playback');
                        
                        // Force unmute if browser might have muted audio
                        this.audio.muted = false;
                        
                        // Try to connect to audio context for better playback
                        if (this._audioContext && !this._audioSourceNode) {
                            try {
                                this.connectToAudioContext();
                            } catch (e) {
                                console.warn('🎵 [MUSIC-PLAYER] Failed to connect to audio context:', e);
                            }
                        }
                        
                        // Create user gesture simulation to help with autoplay restrictions
                        this.unlockAudio();
                        
                        await this.audio.play();
                        this.isPlaying = true;
                        this.showNowPlaying(track);
                        console.log('🎵 [MUSIC-PLAYER] Playback started successfully');

                        resolve(`🎵 Now playing: **${track.title}** by ${track.artist}`);
                    } catch (playError) {
                        console.error('🎵 [MUSIC-PLAYER] Play error:', playError);
                        
                        // Try one more time with user interaction simulation
                        try {
                            console.log('🎵 [MUSIC-PLAYER] Attempting second play with different approach');
                            
                            // Try to unlock audio context again
                            this.unlockAudio();
                            
                            const playPromise = this.audio.play();
                            if (playPromise !== undefined) {
                                playPromise
                                    .then(() => {
                                        console.log('🎵 [MUSIC-PLAYER] Second play attempt succeeded');
                                        this.isPlaying = true;
                                        this.showNowPlaying(track);
                                        resolve(`🎵 Now playing: **${track.title}** by ${track.artist}`);
                                    })
                                    .catch(err => {
                                        console.error('🎵 [MUSIC-PLAYER] Second play attempt failed:', err);
                                        
                                        // Try with a different approach - recreate audio element
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
                    
                    // Try with a proxy if direct URL failed (CORS issues)
                    if (!this.audio.src.includes('cors-anywhere') && !this._triedProxy) {
                        console.log('🎵 [MUSIC-PLAYER] Attempting to use CORS proxy');
                        this._triedProxy = true;
                        const proxyUrl = `https://cors-anywhere.herokuapp.com/${track.previewUrl}`;
                        this.audio.src = proxyUrl;
                        this.audio.load();
                        return; // Don't reject yet, give the proxy a chance
                    }
                    
                    // Try with a recreated audio element as last resort
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

                // Add more event listeners for debugging
                const debugEvents = ['abort', 'stalled', 'suspend', 'waiting'];
                debugEvents.forEach(event => {
                    this.audio.addEventListener(event, () => {
                        console.log(`🎵 [MUSIC-PLAYER] Audio event: ${event}`);
                    }, { once: true });
                });

                // Set source and load
                if (!this.audio.src || this.audio.src !== track.previewUrl) {
                    this.audio.src = track.previewUrl;
                    this.audio.load();
                }
            });
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Playback error:', error);
            this.isPlaying = false;
            
            // Try with recreated audio element as last resort
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
    
    // New method to recreate audio element as a last resort
    async recreateAudioElement(track) {
        console.log('🎵 [MUSIC-PLAYER] Attempting to recreate audio element for:', track.title);
        
        try {
            // Disconnect old audio element
            if (this._audioSourceNode) {
                try {
                    this._audioSourceNode.disconnect();
                    this._audioSourceNode = null;
                } catch (e) {
                    console.warn('🎵 [MUSIC-PLAYER] Error disconnecting audio source:', e);
                }
            }
            
            // Create a fresh audio element
            const newAudio = new Audio();
            newAudio.crossOrigin = "anonymous";
            newAudio.preload = "auto";
            newAudio.volume = this.volume;
            newAudio.src = track.previewUrl;
            
            // Try to connect to audio context
            if (this._audioContext) {
                try {
                    await this._audioContext.resume();
                    this._audioSourceNode = this._audioContext.createMediaElementSource(newAudio);
                    this._audioSourceNode.connect(this._audioContext.destination);
                } catch (e) {
                    console.warn('🎵 [MUSIC-PLAYER] Failed to connect recreated audio to context:', e);
                }
            }
            
            // Create user gesture
            const tempButton = document.createElement('button');
            tempButton.style.display = 'none';
            document.body.appendChild(tempButton);
            tempButton.click();
            document.body.removeChild(tempButton);
            
            // Play the audio
            await newAudio.play();
            
            // Replace the old audio element
            if (this.audio) {
                this.audio.pause();
                this.audio.src = '';
            }
            this.audio = newAudio;
            
            // Set up basic event listeners on new audio element
            this.audio.addEventListener('error', (e) => {
                console.error('🎵 [MUSIC-PLAYER] Recreated audio error:', e);
                this.handlePlaybackError();
            });
            
            this.audio.addEventListener('ended', () => {
                this.playNext();
            });
            
            this.isPlaying = true;
            this.showNowPlaying(track);
            
            console.log('🎵 [MUSIC-PLAYER] Recreated audio element playing successfully');
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
        
        // === NEW: Inject bot participant card into voice grid ===
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
        console.log(`🎵 [MUSIC-PLAYER] ${message}`);
        
        // Update bot participant status if available
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
        
        // Show toast notification if available
        if (window.toast && typeof window.toast.info === 'function') {
            window.toast.info(message);
        }
    }

    showError(message) {
        console.error(`🎵 [MUSIC-PLAYER] Error: ${message}`);
        
        // Update bot participant status if available
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
        
        // Show toast notification if available
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