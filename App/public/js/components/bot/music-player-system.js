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
        
        console.log('🎵 [MUSIC-PLAYER] Music player system initialized');
        this.setupEventListeners();
        this.setupDebugListeners();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeAudioEvents();
        });
    }

    setupDebugListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === '9') {
                e.preventDefault();
                this.showMusicDebugPanel();
            }
        });
    }

    showMusicDebugPanel() {
        this.removeExistingDebugPanel();
        
        const debugPanel = document.createElement('div');
        debugPanel.id = 'music-debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #2c2f36 0%, #1e2124 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 10000;
            border: 1px solid #5865f2;
        `;
        
        debugPanel.innerHTML = `
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #5865f2; font-size: 20px;">
                    <i class="fas fa-music" style="margin-right: 8px;"></i>Music Player Debug Panel
                </h2>
                <button onclick="window.musicPlayer.removeExistingDebugPanel()" style="
                    background: #ed4245;
                    border: none;
                    color: white;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 16px;
                    margin-left: auto;
                ">×</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div style="background: #36393f; padding: 15px; border-radius: 8px;">
                    <h3 style="margin: 0 0 10px 0; color: #00d166;">Current Status</h3>
                    <div>Playing: ${this.isPlaying ? 'Yes' : 'No'}</div>
                    <div>Song: ${this.currentSong ? this.currentSong.title : 'None'}</div>
                    <div>Artist: ${this.currentSong ? this.currentSong.artist : 'None'}</div>
                    <div>Queue: ${this.queue.length} songs</div>
                    <div>Volume: ${Math.round(this.volume * 100)}%</div>
                </div>
                
                <div style="background: #36393f; padding: 15px; border-radius: 8px;">
                    <h3 style="margin: 0 0 10px 0; color: #faa61a;">Quick Actions</h3>
                    <button onclick="window.musicPlayer.showSearchModal()" style="
                        background: #5865f2; border: none; color: white; padding: 8px 12px; 
                        border-radius: 4px; cursor: pointer; margin: 2px; font-size: 12px;
                    ">🔍 Search Music</button>
                    <button onclick="window.musicPlayer.stop()" style="
                        background: #ed4245; border: none; color: white; padding: 8px 12px; 
                        border-radius: 4px; cursor: pointer; margin: 2px; font-size: 12px;
                    ">⏹️ Stop</button>
                    <button onclick="window.musicPlayer.clearQueue()" style="
                        background: #f23f42; border: none; color: white; padding: 8px 12px; 
                        border-radius: 4px; cursor: pointer; margin: 2px; font-size: 12px;
                    ">🗑️ Clear Queue</button>
                    <button onclick="window.musicPlayer.showQueueModal()" style="
                        background: #57f287; border: none; color: white; padding: 8px 12px; 
                        border-radius: 4px; cursor: pointer; margin: 2px; font-size: 12px;
                    ">📋 View Queue</button>
                </div>
            </div>
            
            <div style="background: #36393f; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h3 style="margin: 0 0 10px 0; color: #eb459e;">Quick Search & Play</h3>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="quick-search-input" placeholder="Search and play instantly..." style="
                        flex: 1; background: #2c2f36; border: 1px solid #5865f2; color: white; 
                        padding: 8px 12px; border-radius: 4px; font-size: 14px;
                    ">
                    <button onclick="window.musicPlayer.quickPlay()" style="
                        background: #00d166; border: none; color: white; padding: 8px 16px; 
                        border-radius: 4px; cursor: pointer; font-weight: bold;
                    ">▶️ Play Now</button>
                </div>
            </div>
            
            <div style="background: #36393f; padding: 15px; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0; color: #fee75c;">Bot Commands Test</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;">
                    <button onclick="window.musicPlayer.testBotCommand('ping')" style="
                        background: #5865f2; border: none; color: white; padding: 6px 10px; 
                        border-radius: 4px; cursor: pointer; font-size: 11px;
                    ">🏓 Ping</button>
                    <button onclick="window.musicPlayer.testBotCommand('stop')" style="
                        background: #ed4245; border: none; color: white; padding: 6px 10px; 
                        border-radius: 4px; cursor: pointer; font-size: 11px;
                    ">⏹️ Stop</button>
                    <button onclick="window.musicPlayer.testBotCommand('next')" style="
                        background: #57f287; border: none; color: white; padding: 6px 10px; 
                        border-radius: 4px; cursor: pointer; font-size: 11px;
                    ">⏭️ Next</button>
                    <button onclick="window.musicPlayer.testBotCommand('prev')" style="
                        background: #fee75c; border: none; color: white; padding: 6px 10px; 
                        border-radius: 4px; cursor: pointer; font-size: 11px;
                    ">⏮️ Prev</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(debugPanel);
        
        document.getElementById('quick-search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.quickPlay();
            }
        });
        
        debugPanel.addEventListener('click', (e) => {
            if (e.target === debugPanel) {
                this.removeExistingDebugPanel();
            }
        });
    }

    removeExistingDebugPanel() {
        const existingPanel = document.getElementById('music-debug-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
    }

    async quickPlay() {
        const input = document.getElementById('quick-search-input');
        if (!input || !input.value.trim()) return;
        
        const query = input.value.trim();
        input.value = '';
        
        console.log('🎵 Quick playing:', query);
        const result = await this.play(query);
        
        if (window.showToast) {
            window.showToast(result, result.includes('❌') ? 'error' : 'success');
        }
    }

    testBotCommand(command) {
        if (!window.chatSection || !window.chatSection.messageInput) {
            if (window.showToast) {
                window.showToast('❌ Chat section not available', 'error');
            }
            return;
        }
        
        let commandText = `/titibot ${command}`;
        if (command === 'play') {
            commandText += ' never gonna give you up';
        } else if (command === 'queue') {
            commandText += ' bohemian rhapsody';
        }
        
        window.chatSection.messageInput.value = commandText;
        window.chatSection.messageInput.focus();
        
        if (window.showToast) {
            window.showToast(`🤖 Bot command ready: ${commandText}`, 'info');
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
        
        if (window.showToast) {
            window.showToast(result, result.includes('❌') ? 'error' : 'success');
        }
    }

    async queueSearchResult(index) {
        const track = this.searchResults[index];
        if (!track) return;
        
        if (!track.previewUrl) {
            if (window.showToast) {
                window.showToast(`❌ No preview available for "${track.title}"`, 'error');
            }
            return;
        }
        
        this.queue.push(track);
        
        if (window.showToast) {
            window.showToast(`➕ Added "${track.title}" to queue (Position: ${this.queue.length})`, 'success');
        }
        
        console.log(`🎵 Added to queue: ${track.title} by ${track.artist}`);
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
            
            if (window.showToast) {
                window.showToast(`🗑️ Removed "${removedTrack.title}" from queue`, 'info');
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
        
        if (window.showToast) {
            window.showToast('🔀 Queue shuffled!', 'success');
        }
        
        this.showQueueModal();
    }

    clearQueue() {
        this.queue = [];
        this.currentIndex = 0;
        
        if (window.showToast) {
            window.showToast('🗑️ Queue cleared', 'info');
        }
        
        this.removeExistingQueueModal();
        console.log('🎵 Queue cleared');
    }

    initializeAudioEvents() {
        if (this.audio) {
            this.audio.addEventListener('ended', () => {
                this.playNext();
            });

            this.audio.addEventListener('error', (e) => {
                console.error('Audio playback error:', e);
                this.showError('Failed to play audio');
            });

            this.audio.addEventListener('loadstart', () => {
                this.showStatus('Loading...');
            });

            this.audio.addEventListener('canplay', () => {
                this.showStatus('Ready to play');
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
            console.error('Music search error:', error);
            return null;
        }
    }

    async play(songName, channelId) {
        this.channelId = channelId;
        
        const track = await this.searchMusic(songName);
        if (!track) {
            return `❌ Could not find "${songName}" on iTunes`;
        }

        if (!track.previewUrl) {
            return `❌ No preview available for "${track.title}" by ${track.artist}`;
        }

        try {
            this.stop();
            
            this.currentSong = track;
            this.audio = new Audio(track.previewUrl);
            this.audio.volume = this.volume;
            
            this.initializeAudioEvents();
            
            await this.audio.play();
            this.isPlaying = true;
            
            this.showNowPlaying(track);
            
            return `🎵 Now playing: **${track.title}** by ${track.artist}`;
        } catch (error) {
            console.error('Playback error:', error);
            return `❌ Failed to play "${track.title}"`;
        }
    }

    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio = null;
        }
        this.isPlaying = false;
        this.currentSong = null;
        this.hideNowPlaying();
        return `⏹️ Music stopped`;
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
        try {
            this.stop();
            
            this.currentSong = track;
            this.audio = new Audio(track.previewUrl);
            this.audio.volume = this.volume;
            
            this.initializeAudioEvents();
            
            await this.audio.play();
            this.isPlaying = true;
            
            this.showNowPlaying(track);
            
            return `🎵 Now playing: **${track.title}** by ${track.artist}`;
        } catch (error) {
            console.error('Playback error:', error);
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
    }

    removeExistingPlayer() {
        const existingPlayer = document.getElementById('music-player-widget');
        if (existingPlayer) {
            existingPlayer.remove();
        }
    }

    showStatus(message) {
        console.log(`🎵 Music Player: ${message}`);
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
}

if (typeof window !== 'undefined') {
    window.musicPlayer = new MusicPlayerSystem();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicPlayerSystem;
}
