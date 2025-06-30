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
        button.className = 'flex items-center gap-2 w-full px-3 py-2 rounded-md text-[#949ba4] hover:text-white hover:bg-[#404249] transition-colors duration-200';
        button.innerHTML = `
            <i class="fas fa-chess-board text-lg"></i>
            <span class="font-medium">Tic Mac Voe</span>
        `;
        
        button.addEventListener('click', () => this.openTicTacToe());
        
        const insertPoint = serverSidebar.querySelector('.channels-list') || serverSidebar.querySelector('.channel-list') || serverSidebar;
        
        if (insertPoint.classList.contains('channels-list') || insertPoint.classList.contains('channel-list')) {
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

document.addEventListener('DOMContentLoaded', function() {
    const currentPage = document.body.getAttribute('data-page');
    if (currentPage === 'server') {
        setTimeout(() => {
            new ActivityManager();
        }, 1000);
    }
});

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
