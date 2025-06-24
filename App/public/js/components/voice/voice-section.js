/**
 * Voice Section UI Manager
 * Handles Discord-style fullscreen voice UI
 */

class VoiceSectionManager {
    constructor() {
        // Prevent multiple instances
        if (window.voiceSectionManager) {
            console.log('Voice Section Manager already initialized, returning existing instance');
            return window.voiceSectionManager;
        }
        
        this.initialized = false;
        this.fullscreenMode = false;
        this.voiceContainer = null;
        this.serverSidebar = null;
        this.channelSidebar = null;
        this.mainContent = null;
        this.joinBtn = null;
        this.leaveBtn = null;
        this.headerElement = null;
        this.channelName = '';
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
        
        // Try to initialize again after a delay in case elements aren't ready yet
        setTimeout(() => {
            if (!this.initialized) {
                console.log('Retrying voice section manager initialization');
                this.init();
            }
        }, 1500);
        
        // Try one more time with a longer delay
        setTimeout(() => {
            if (!this.initialized || !this.serverSidebar || !this.channelSidebar) {
                console.log('Final attempt at voice section manager initialization');
                this.init();
                
                // Force fullscreen if we're in a voice channel
                if (document.getElementById('joinUI')?.style.display === 'none') {
                    this.enterFullscreenMode(true);
                }
            }
        }, 3000);
        
        // Store instance in window
        window.voiceSectionManager = this;
    }
    
    init() {
        if (this.initialized) return;
        
        // Find main elements - try multiple selectors
        this.voiceContainer = document.getElementById('voice-container') || 
                             document.querySelector('.flex.flex-col.h-screen.bg-\\[\\#313338\\].text-white') ||
                             document.querySelector('.flex.flex-col.h-screen.bg-\\[\\#313338\\]');
                             
        // Find sidebars
        this.findSidebars();
        
        this.mainContent = document.getElementById('main-content');
        this.joinBtn = document.getElementById('joinBtn');
        this.leaveBtn = document.getElementById('leaveBtn');
        
        if (!this.voiceContainer) {
            console.error('Voice container not found');
            return;
        }
        
        // Get channel name
        const channelNameElement = this.voiceContainer.querySelector('.font-medium.text-white');
        this.channelName = channelNameElement ? channelNameElement.textContent : 'Voice Channel';
        
        // Create header for fullscreen mode
        this.createHeader();
        
        // Attach event listeners
        this.attachEventListeners();
        
        // Load CSS
        this.loadCSS();
        
        // Set initialized flag
        this.initialized = true;
        
        console.log('Voice Section Manager initialized');
        
        // Check if we should already be in fullscreen mode (e.g. if we're already connected)
        if (document.getElementById('joinUI')?.style.display === 'none') {
            console.log('Join UI is hidden, entering fullscreen mode');
            this.enterFullscreenMode();
        }
    }
    
    createHeader() {
        // Create header element for fullscreen mode
        this.headerElement = document.createElement('div');
        this.headerElement.className = 'voice-header';
        this.headerElement.innerHTML = `
            <div class="channel-name">
                <i class="fas fa-volume-high mr-2"></i>
                ${this.channelName}
            </div>
            <button class="close-btn" id="exitFullscreenBtn">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Hide initially
        this.headerElement.style.display = 'none';
        
        // Add to voice container
        if (this.voiceContainer) {
            this.voiceContainer.appendChild(this.headerElement);
        }
    }
    
    attachEventListeners() {
        // Join button should enter fullscreen mode
        if (this.joinBtn) {
            this.joinBtn.addEventListener('click', () => {
                // Wait for the voice connection to establish
                setTimeout(() => this.enterFullscreenMode(), 500);
            });
        }
        
        // Leave button should exit fullscreen mode
        if (this.leaveBtn) {
            this.leaveBtn.addEventListener('click', () => {
                this.exitFullscreenMode();
            });
        }
        
        // Exit fullscreen button
        const exitBtn = document.getElementById('exitFullscreenBtn');
        if (exitBtn) {
            exitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exitFullscreenMode();
            });
        }
        
        // Listen for escape key to exit fullscreen
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.fullscreenMode) {
                this.exitFullscreenMode();
            }
        });
        
        // Listen for voice connection events
        window.addEventListener('voiceConnect', () => {
            this.enterFullscreenMode();
        });
        
        window.addEventListener('voiceDisconnect', () => {
            this.exitFullscreenMode();
        });
    }
    
    enterFullscreenMode(force = false) {
        if (this.fullscreenMode && !force) return;
        
        console.log('Entering fullscreen voice mode');
        
        // Try to find sidebars again if they weren't found before
        if (!this.serverSidebar || !this.channelSidebar) {
            this.findSidebars();
        }
        
        // Add transition class
        if (this.voiceContainer) {
            this.voiceContainer.classList.add('voice-fullscreen-transition');
        }
        
        // Add fullscreen class to body to hide sidebars via CSS
        document.body.classList.add('voice-fullscreen-active');
        
        // Hide server and channel sidebars - use multiple approaches to ensure they're hidden
        if (this.serverSidebar) {
            this.serverSidebar.style.display = 'none';
        }
        
        if (this.channelSidebar) {
            this.channelSidebar.style.display = 'none';
        }
        
        // Add fullscreen class to voice container
        if (this.voiceContainer) {
            this.voiceContainer.classList.add('voice-fullscreen-mode');
        }
        
        // Show header
        if (this.headerElement) {
            this.headerElement.style.display = 'flex';
        }
        
        // Set flag
        this.fullscreenMode = true;
    }
    
    exitFullscreenMode() {
        if (!this.fullscreenMode) return;
        
        console.log('Exiting fullscreen voice mode');
        
        // Remove fullscreen class from body
        document.body.classList.remove('voice-fullscreen-active');
        
        // Remove fullscreen class
        if (this.voiceContainer) {
            this.voiceContainer.classList.remove('voice-fullscreen-mode');
        }
        
        // Show server and channel sidebars
        if (this.serverSidebar) {
            this.serverSidebar.style.display = 'flex';
        }
        
        if (this.channelSidebar) {
            this.channelSidebar.style.display = 'flex';
        }
        
        // Hide header
        if (this.headerElement) {
            this.headerElement.style.display = 'none';
        }
        
        // Remove transition class after animation completes
        setTimeout(() => {
            if (this.voiceContainer) {
                this.voiceContainer.classList.remove('voice-fullscreen-transition');
            }
        }, 300);
        
        // Set flag
        this.fullscreenMode = false;
    }
    
    loadCSS() {
        // Check if CSS is already loaded
        if (document.querySelector('link[href*="voice-section.css"]')) {
            console.log('Voice section CSS already loaded');
            return;
        }
        
        // Create link element
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = '/css/voice-section.css';
        
        // Append to head
        document.head.appendChild(link);
        console.log('Voice section CSS loaded');
    }
    
    findSidebars() {
        // Try to find by ID first
        this.serverSidebar = document.getElementById('server-sidebar');
        this.channelSidebar = document.getElementById('channel-sidebar');
        
        // If not found by ID, try to find by class/structure
        if (!this.serverSidebar) {
            // Try different selectors for server sidebar
            this.serverSidebar = 
                document.querySelector('#app-container > .flex > .flex.flex-col.bg-discord-dark') ||
                document.querySelector('.bg-discord-dark.flex.flex-col.w-\\[72px\\]') ||
                document.querySelector('.flex.flex-col.bg-\\[\\#1e1f22\\]') ||
                document.querySelector('.flex.flex-col.w-\\[72px\\]');
                
            if (this.serverSidebar) {
                this.serverSidebar.id = 'server-sidebar';
                console.log('Found server sidebar by class');
            }
        }
        
        if (!this.channelSidebar) {
            // Try different selectors for channel sidebar
            this.channelSidebar = 
                document.querySelector('#app-container > .flex > .w-60.flex.flex-col.bg-discord-light') ||
                document.querySelector('.w-60.flex.flex-col.bg-\\[\\#2b2d31\\]') ||
                document.querySelector('.w-60.bg-\\[\\#2b2d31\\]') ||
                document.querySelector('.w-60.flex.flex-col') ||
                document.querySelector('.w-60');
                
            if (this.channelSidebar) {
                this.channelSidebar.id = 'channel-sidebar';
                console.log('Found channel sidebar by class');
            }
        }
        
        // If still not found, try to find by position in DOM
        if (!this.serverSidebar || !this.channelSidebar) {
            const appContainer = document.getElementById('app-container') || document.querySelector('.flex.h-screen.w-screen');
            if (appContainer) {
                const children = appContainer.children;
                if (children.length >= 3) {
                    // Typically the first child is server sidebar, second is channel sidebar
                    if (!this.serverSidebar && children[0]) {
                        this.serverSidebar = children[0];
                        this.serverSidebar.id = 'server-sidebar';
                        console.log('Found server sidebar by position');
                    }
                    
                    if (!this.channelSidebar && children[1]) {
                        this.channelSidebar = children[1];
                        this.channelSidebar.id = 'channel-sidebar';
                        console.log('Found channel sidebar by position');
                    }
                }
            }
        }
        
        // If we still can't find them, try to find any element that looks like a sidebar
        if (!this.serverSidebar) {
            const possibleServerSidebars = document.querySelectorAll('.flex.flex-col');
            for (const el of possibleServerSidebars) {
                // Server sidebar is typically narrow
                const rect = el.getBoundingClientRect();
                if (rect.width < 100 && rect.height > 300) {
                    this.serverSidebar = el;
                    this.serverSidebar.id = 'server-sidebar';
                    console.log('Found server sidebar by size');
                    break;
                }
            }
        }
        
        if (!this.channelSidebar) {
            const possibleChannelSidebars = document.querySelectorAll('.flex.flex-col');
            for (const el of possibleChannelSidebars) {
                // Channel sidebar is typically wider than server sidebar but narrower than main content
                const rect = el.getBoundingClientRect();
                if (rect.width > 100 && rect.width < 300 && rect.height > 300) {
                    this.channelSidebar = el;
                    this.channelSidebar.id = 'channel-sidebar';
                    console.log('Found channel sidebar by size');
                    break;
                }
            }
        }
        
        console.log('Sidebars found:', {
            server: !!this.serverSidebar,
            channel: !!this.channelSidebar
        });
    }
}

// Initialize the manager
window.voiceSectionManager = new VoiceSectionManager();

// Export for module usage
if (typeof module !== 'undefined') {
    module.exports = { VoiceSectionManager };
}
