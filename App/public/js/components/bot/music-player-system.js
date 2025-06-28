class MusicPlayerSystem {
    constructor() {
        this.currentSong = null;
        this.queue = [];
        this.currentIndex = 0;
        this.audio = null;
        this.isPlaying = false;
        this.volume = 0.5;
        this.channelId = null;
        
        console.log('🎵 [MUSIC-PLAYER] Music player system initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeAudioEvents();
        });
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
