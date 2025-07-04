class ActivityManager {
    constructor() {
        this.isInitialized = false;
        this.serverId = null;
        this.userId = null;
        this.username = null;
        this.init();
    }

    init() {
        this.loadUserData();
        this.loadServerData();
        this.setupButton();
        this.isInitialized = true;
        
        window.activityManager = this;

    }

    loadUserData() {
        const userIdMeta = document.querySelector('meta[name="user-id"]');
        const usernameMeta = document.querySelector('meta[name="username"]');
        
        this.userId = userIdMeta ? userIdMeta.getAttribute('content') : null;
        this.username = usernameMeta ? usernameMeta.getAttribute('content') : null;
        
        if (!this.userId || !this.username) {
            console.error('User data not found for activity manager');
        }
    }

    loadServerData() {
        const serverIdMeta = document.querySelector('meta[name="server-id"]');
        this.serverId = serverIdMeta ? serverIdMeta.getAttribute('content') : null;
        
        if (!this.serverId) {
            console.error('Server ID not found for activity manager');
        }
    }

    setupButton() {
        const serverSidebar = document.querySelector('.server-sidebar') || document.querySelector('[data-server-sidebar]');
        
        if (!serverSidebar) {
            console.warn('Server sidebar not found, trying alternative locations');
            setTimeout(() => this.setupButton(), 1000);
            return;
        }

        const existingButton = document.getElementById('tic-tac-toe-button');
        if (existingButton) {
            existingButton.remove();
        }

        const button = document.createElement('button');
        button.id = 'tic-tac-toe-button';
        button.className = 'group flex items-center gap-3 w-full px-4 py-3 rounded-lg text-[#949ba4] hover:text-white transition-all duration-300 relative overflow-hidden border border-transparent hover:border-[#5865f2]/30 hover:shadow-lg hover:shadow-[#5865f2]/20';
        button.innerHTML = `
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-[#5865f2]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="relative flex items-center gap-3 w-full">
                <div class="relative">
                    <i class="fas fa-chess-board text-lg transition-all duration-300 group-hover:text-[#5865f2] group-hover:scale-110"></i>
                    <div class="absolute inset-0 bg-[#5865f2] opacity-0 group-hover:opacity-20 rounded-full blur-md transition-opacity duration-300"></div>
                </div>
                <div class="flex flex-col items-start">
                    <span class="font-medium transition-all duration-300 group-hover:text-white">Tic Mac Voe</span>
                    <span class="text-xs opacity-70 group-hover:opacity-100 transition-opacity duration-300">Play with friends</span>
                </div>
                <div class="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0">
                    <i class="fas fa-play text-xs text-[#5865f2]"></i>
                </div>
            </div>
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        `;
        
        button.addEventListener('click', () => this.openTicTacToe());
        
        button.addEventListener('mouseenter', () => {
            if (window.globalSocketManager?.isReady()) {
                button.style.transform = 'translateX(4px)';
            }
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateX(0)';
        });
        
        const insertPoint = serverSidebar.querySelector('.channels-list') || serverSidebar.querySelector('.channel-list') || serverSidebar;
        
        if (insertPoint.classList.contains('channels-list') || insertPoint.classList.contains('channel-list')) {
            const divider = document.createElement('div');
            divider.className = 'w-full h-px bg-gradient-to-r from-transparent via-[#404249] to-transparent my-2';
            insertPoint.appendChild(divider);
            insertPoint.appendChild(button);
        } else {
            insertPoint.insertBefore(button, insertPoint.firstChild);
        }
    }

    openTicTacToe() {
        if (!this.serverId || !window.globalSocketManager?.isReady()) {
            return;
        }

        if (window.TicTacToeModal) {
            window.TicTacToeModal.createTicTacToeModal(this.serverId, this.userId, this.username);
        }
    }
}



if (document.readyState === 'complete') {
    const currentPage = document.body.getAttribute('data-page');
    if (currentPage === 'server') {
        setTimeout(() => {
            if (!window.activityManager) {
                new ActivityManager();
            }
        }, 1000);
    }
}
