if (typeof window !== 'undefined' && window.MusicPlayerSystem) {

} else {

class MusicPlayerSystem {
    constructor() {
        this.currentSong = null;
        this.queue = [];
        this.currentIndex = 0;
        this.audio = new Audio();
        this.audio.crossOrigin = "anonymous";
        this.audio.preload = "none";
        this.isPlaying = false;
        this.volume = 0.5;
        this.channelId = null;
        this.searchResults = [];
        this.searchModal = null;
        this.debugMode = false;
        this.currentTrack = null;
        this.processedMessageIds = new Set();
        this.initialized = false;
        this.botParticipantAdded = false; // Track if bot participant is shown
        this.botParticipantId = 'music-bot'; // Unique ID for dummy bot card
        

        this.setupEventListeners();
        this.forceInitialize();

        this.audio.addEventListener('error', (e) => {
            console.error('🎵 [MUSIC-PLAYER] Audio playback error:', e, 'Audio src:', this.audio.src);
            this.handlePlaybackError();
        });

        this.audio.addEventListener('ended', () => {
            this.playNext();
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

    forceInitialize() {

        
        if (typeof window !== 'undefined') {
            window.musicPlayer = this;
            window.MusicPlayerSystem = MusicPlayerSystem;
        }
        
        this.setupImmediateListeners();
        
        this.initialized = true;
        

    }

    setupImmediateListeners() {
        if (typeof window !== 'undefined') {
            window.addEventListener('bot-music-command', (e) => {

                this.processBotMusicCommand(e.detail);
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
        
        const { music_data } = data;
        const { action, query, track } = music_data;
        
        this.showStatus(`Processing ${action} command...`);
        
        try {
            switch (action) {
                case 'play':

                    if (query && query.trim()) {
                        this.showStatus(`Searching for: ${query}`);
                        const searchResult = await this.searchMusic(query.trim());
                        if (searchResult && searchResult.previewUrl) {
                            await this.playTrack(searchResult);
                            this.showNowPlaying(searchResult);
                            this.showStatus(`Now playing: ${searchResult.title}`);

                        } else {
                            console.warn('⚠️ [MUSIC-PLAYER] No playable track found for:', query);
                            this.showError('No playable track found for: ' + query);
                        }
                    } else if (track && track.previewUrl) {
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
            console.error('❌ [MUSIC-PLAYER] Error processing bot music command:', error);
            this.showError('Failed to process music command: ' + error.message);
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
            const apiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=1`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const track = data.results[0];
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
            console.error('Music search erfror:', error);
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

             Start playback
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
        } catch (error) {
            console.error('🎵 Error stopping playback:', error);
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

            
            await this.stop();
            
            this.currentSong = track;
            this.audio.volume = this.volume;
            this.audio.crossOrigin = "anonymous";
            this.audio.preload = "metadata";
            
            return new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    console.error('🎵 [MUSIC-PLAYER] Audio loading timeout for:', track.title);
                    cleanup();
                    reject(new Error('Audio loading timeout'));
                }, 15000);

                const cleanup = () => {
                    clearTimeout(timeoutId);
                    this.audio.removeEventListener('canplay', onCanPlay);
                    this.audio.removeEventListener('canplaythrough', onCanPlayThrough);
                    this.audio.removeEventListener('error', onError);
                    this.audio.removeEventListener('loadeddata', onLoadedData);
                };

                const onCanPlay = async () => {
                    cleanup();
                    try {

                        await this.audio.play();
                        this.isPlaying = true;
                        this.showNowPlaying(track);

                        resolve(`🎵 Now playing: **${track.title}** by ${track.artist}`);
                    } catch (playError) {
                        console.error('🎵 [MUSIC-PLAYER] Play error:', playError);
                        reject(playError);
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
                    
                    reject(new Error(`Failed to load "${track.title}". This might be due to CORS restrictions or the preview is no longer available.`));
                };

                this.audio.addEventListener('canplay', onCanPlay, { once: true });
                this.audio.addEventListener('canplaythrough', onCanPlayThrough, { once: true });
                this.audio.addEventListener('loadeddata', onLoadedData, { once: true });
                this.audio.addEventListener('error', onError, { once: true });


                this.audio.src = track.previewUrl;
                this.audio.load();
            });
        } catch (error) {
            console.error('🎵 [MUSIC-PLAYER] Playback error:', error);
            this.isPlaying = false;
            
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
        
         === NEW: Inject bot participant card into voice grid ===
        try {
            if (!this.botParticipantAdded) {
                const botData = {
                    user_id: this.botParticipantId,
                    username: 'TitiBot',
                    avatar_url: '/public/assets/common/default-profile-picture.png'
                };
                if (window.voiceCallSection && typeof window.voiceCallSection.addBotParticipant === 'function') {
                    window.voiceCallSection.addBotParticipant(botData);
                    this.botParticipantAdded = true;

                } else {
                     Fallback: dispatch event for voice-call-section listener
                    window.dispatchEvent(new CustomEvent('bot-voice-participant-joined', { detail: { participant: botData } }));
                    this.botParticipantAdded = true;

                }
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
                        <button onclick="window.musicPlayer.showMusicDebugPanel()" style="
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
                        ">🎛️</button>
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
         === NEW: Remove bot participant card when music stops ===
        try {
            if (this.botParticipantAdded) {
                if (window.voiceCallSection && typeof window.voiceCallSection.removeBotParticipant === 'function') {
                    window.voiceCallSection.removeBotParticipant(this.botParticipantId);
                } else {
                    window.dispatchEvent(new CustomEvent('bot-voice-participant-left', { detail: { participant: { user_id: this.botParticipantId } } }));
                }
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

    }

    showError(message) {
        console.error(`🎵 Music Player Error: ${message}`);
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

}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicPlayerSystem;
}

}  End of conditional block
