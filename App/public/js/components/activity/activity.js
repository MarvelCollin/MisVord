class ActivityManager {
    constructor() {
        this.isInitialized = false;
        this.currentActivity = null;
        this.serverId = null;
        this.userId = null;
        this.username = null;
        this.modal = null;
        this.init();
    }

    init() {
        this.loadUserData();
        this.loadServerData();
        this.setupButton();
        this.setupSocketListeners();
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

    setupSocketListeners() {
        if (!window.globalSocketManager) {
            window.addEventListener('globalSocketReady', () => this.setupSocketListeners());
            return;
        }

        const io = window.globalSocketManager.io;
        if (!io) return;

        io.on('tic-tac-toe-joined', (data) => this.handleJoined(data));
        io.on('tic-tac-toe-player-joined', (data) => this.handlePlayerJoined(data));
        io.on('tic-tac-toe-player-left', (data) => this.handlePlayerLeft(data));
        io.on('tic-tac-toe-ready-update', (data) => this.handleReadyUpdate(data));
        io.on('tic-tac-toe-game-start', (data) => this.handleGameStart(data));
        io.on('tic-tac-toe-move-made', (data) => this.handleMoveMade(data));
        io.on('tic-tac-toe-game-end', (data) => this.handleGameEnd(data));
        io.on('tic-tac-toe-game-reset', (data) => this.handleGameReset(data));
        io.on('tic-tac-toe-error', (data) => this.handleError(data));
    }

    openTicTacToe() {
        if (!this.serverId) {
            console.error('Cannot open Tic-Tac-Toe: No server ID');
            return;
        }

        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            console.error('Cannot open Tic-Tac-Toe: Socket not ready');
            return;
        }

        this.createModal();
        this.joinGame();
    }

    createModal() {
        if (this.modal) {
            this.modal.remove();
        }

        this.modal = document.createElement('div');
        this.modal.id = 'tic-tac-toe-modal';
        this.modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        this.modal.innerHTML = `
            <div class="bg-[#313338] rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-white">Tic Mac Voe</h2>
                    <button id="close-tic-tac-toe" class="text-[#949ba4] hover:text-white text-xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div id="tic-tac-toe-content">
                    <div id="welcome-section" class="text-center">
                        <div class="mb-4">
                            <h3 class="text-lg font-medium text-white mb-2">Welcome to Tic Mac Voe!</h3>
                            <p class="text-[#949ba4] text-sm">Waiting for players to join...</p>
                        </div>
                        
                        <div id="player-list" class="space-y-3 mb-6">
                        </div>
                        
                        <div id="game-controls" class="space-y-3">
                            <button id="ready-button" class="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                Ready
                            </button>
                            <button id="play-button" class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 hidden">
                                Play
                            </button>
                        </div>
                    </div>
                    
                    <div id="game-section" class="hidden">
                        <div id="game-info" class="text-center mb-4">
                            <div id="current-turn" class="text-[#949ba4] text-sm mb-2"></div>
                            <div id="game-players" class="flex justify-center gap-4 mb-4">
                            </div>
                        </div>
                        
                        <div id="game-board" class="grid grid-cols-3 gap-2 mb-4 max-w-xs mx-auto">
                        </div>
                        
                        <div id="game-result" class="text-center hidden">
                            <div id="winner-text" class="text-xl font-bold mb-4"></div>
                            <button id="new-game-button" class="bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2 px-4 rounded-md transition-colors duration-200">
                                New Game
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
        this.setupModalEvents();
    }

    setupModalEvents() {
        const closeButton = this.modal.querySelector('#close-tic-tac-toe');
        const readyButton = this.modal.querySelector('#ready-button');
        const playButton = this.modal.querySelector('#play-button');
        const newGameButton = this.modal.querySelector('#new-game-button');

        closeButton.addEventListener('click', () => this.closeModal());
        readyButton.addEventListener('click', () => this.toggleReady());
        playButton.addEventListener('click', () => this.startGame());
        newGameButton.addEventListener('click', () => this.resetGame());

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }

    closeModal() {
        if (this.modal) {
            this.leaveGame();
            this.modal.remove();
            this.modal = null;
        }
    }

    joinGame() {
        if (!window.globalSocketManager.isReady()) return;

        window.globalSocketManager.io.emit('join-tic-tac-toe', {
            server_id: this.serverId
        });
    }

    leaveGame() {
        if (!window.globalSocketManager.isReady()) return;

        window.globalSocketManager.io.emit('leave-tic-tac-toe', {
            server_id: this.serverId
        });
    }

    toggleReady() {
        if (!window.globalSocketManager.isReady()) return;

        const readyButton = this.modal.querySelector('#ready-button');
        const isReady = readyButton.textContent === 'Ready';

        window.globalSocketManager.io.emit('tic-tac-toe-ready', {
            ready: isReady
        });

        readyButton.textContent = isReady ? 'Not Ready' : 'Ready';
        readyButton.className = isReady 
            ? 'w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200'
            : 'w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2 px-4 rounded-md transition-colors duration-200';
    }

    startGame() {
        const welcomeSection = this.modal.querySelector('#welcome-section');
        const gameSection = this.modal.querySelector('#game-section');
        
        welcomeSection.classList.add('hidden');
        gameSection.classList.remove('hidden');
    }

    resetGame() {
        const gameResult = this.modal.querySelector('#game-result');
        const gameBoard = this.modal.querySelector('#game-board');
        
        gameResult.classList.add('hidden');
        this.createGameBoard();
    }

    handleJoined(data) {
        this.updatePlayerList(data.players);
    }

    handlePlayerJoined(data) {
        this.updatePlayerList([data.player]);
    }

    handlePlayerLeft(data) {
        this.removePlayerFromList(data.player.user_id);
    }

    handleReadyUpdate(data) {
        this.updatePlayerList(data.players);
        
        const playButton = this.modal.querySelector('#play-button');
        if (data.can_start) {
            playButton.classList.remove('hidden');
        } else {
            playButton.classList.add('hidden');
        }
    }

    handleGameStart(data) {
        this.gameData = data;
        this.startGame();
        this.updateGameInfo();
        this.createGameBoard();
    }

    handleMoveMade(data) {
        this.gameData.board = data.board;
        this.gameData.current_turn = data.current_turn;
        this.updateGameBoard();
        this.updateGameInfo();
    }

    handleGameEnd(data) {
        this.gameData = data.game_data;
        this.showGameResult(data);
    }

    handleGameReset(data) {
        this.resetToWelcome();
    }

    handleError(data) {
        console.error('Tic-Tac-Toe error:', data.message);
        if (window.showToast) {
            window.showToast(data.message, 'error');
        }
    }

    updatePlayerList(players) {
        const playerList = this.modal.querySelector('#player-list');
        playerList.innerHTML = '';

        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'flex items-center gap-3 p-3 bg-[#2b2d31] rounded-md';
            playerDiv.innerHTML = `
                <img src="${player.avatar_url}" alt="${player.username}" class="w-8 h-8 rounded-full">
                <div class="flex-1 text-left">
                    <div class="text-white font-medium">${player.username}</div>
                    <div class="text-[#949ba4] text-sm">${player.ready ? 'Ready' : 'Not Ready'}</div>
                </div>
                ${player.ready ? '<i class="fas fa-check text-green-400"></i>' : '<i class="fas fa-clock text-yellow-400"></i>'}
            `;
            playerList.appendChild(playerDiv);
        });
    }

    removePlayerFromList(userId) {
        const playerList = this.modal.querySelector('#player-list');
        const players = Array.from(playerList.children);
        players.forEach(player => {
            if (player.dataset.userId === userId) {
                player.remove();
            }
        });
    }

    updateGameInfo() {
        const currentTurn = this.modal.querySelector('#current-turn');
        const gamePlayers = this.modal.querySelector('#game-players');
        
        const currentPlayer = this.gameData.players.find(p => p.user_id === this.gameData.current_turn);
        currentTurn.textContent = `${currentPlayer ? currentPlayer.username : 'Unknown'}'s turn`;
        
        gamePlayers.innerHTML = '';
        this.gameData.players.forEach((player, index) => {
            const symbol = index === 0 ? 'X' : 'O';
            const isCurrentTurn = player.user_id === this.gameData.current_turn;
            
            const playerDiv = document.createElement('div');
            playerDiv.className = `flex items-center gap-2 p-2 rounded-md ${isCurrentTurn ? 'bg-[#5865f2]' : 'bg-[#2b2d31]'}`;
            playerDiv.innerHTML = `
                <img src="${player.avatar_url}" alt="${player.username}" class="w-6 h-6 rounded-full">
                <span class="text-white font-medium">${player.username}</span>
                <span class="text-[#949ba4]">(${symbol})</span>
            `;
            gamePlayers.appendChild(playerDiv);
        });
    }

    createGameBoard() {
        const gameBoard = this.modal.querySelector('#game-board');
        gameBoard.innerHTML = '';
        
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('button');
            cell.className = 'w-16 h-16 bg-[#2b2d31] hover:bg-[#404249] text-white text-2xl font-bold rounded-md transition-colors duration-200';
            cell.dataset.position = i;
            cell.addEventListener('click', () => this.makeMove(i));
            gameBoard.appendChild(cell);
        }
        
        this.updateGameBoard();
    }

    updateGameBoard() {
        const cells = this.modal.querySelectorAll('#game-board button');
        cells.forEach((cell, index) => {
            const value = this.gameData.board[index];
            cell.textContent = value || '';
            cell.disabled = value !== null;
            
            if (value) {
                cell.className = 'w-16 h-16 bg-[#404249] text-white text-2xl font-bold rounded-md cursor-not-allowed';
            }
        });
    }

    makeMove(position) {
        if (!window.globalSocketManager.isReady()) return;
        
        if (this.gameData.current_turn !== this.userId) {
            if (window.showToast) {
                window.showToast('Not your turn!', 'warning');
            }
            return;
        }

        window.globalSocketManager.io.emit('tic-tac-toe-move', {
            position: position
        });
    }

    showGameResult(data) {
        const gameResult = this.modal.querySelector('#game-result');
        const winnerText = this.modal.querySelector('#winner-text');
        
        gameResult.classList.remove('hidden');
        
        if (data.is_draw) {
            winnerText.textContent = "It's a draw!";
            winnerText.className = 'text-xl font-bold mb-4 text-yellow-400';
        } else if (data.winner_user_id === this.userId) {
            winnerText.textContent = 'You won!';
            winnerText.className = 'text-xl font-bold mb-4 text-green-400';
        } else {
            const winner = this.gameData.players.find(p => p.user_id === data.winner_user_id);
            winnerText.textContent = `${winner ? winner.username : 'Unknown'} won!`;
            winnerText.className = 'text-xl font-bold mb-4 text-red-400';
        }
        
        this.updateGameBoard();
    }

    resetToWelcome() {
        const welcomeSection = this.modal.querySelector('#welcome-section');
        const gameSection = this.modal.querySelector('#game-section');
        const readyButton = this.modal.querySelector('#ready-button');
        
        gameSection.classList.add('hidden');
        welcomeSection.classList.remove('hidden');
        
        readyButton.textContent = 'Ready';
        readyButton.className = 'w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2 px-4 rounded-md transition-colors duration-200';
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
