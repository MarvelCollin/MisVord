class TicTacToeGame {
    constructor(activityManager) {
        this.activityManager = activityManager;
        this.gameState = {
            board: Array(9).fill(null),
            currentPlayer: 'X',
            gameActive: false,
            players: [],
            currentTurn: null,
            gameId: null
        };
    }

    initializeGame(gameData) {
        this.gameState = {
            board: gameData.board || Array(9).fill(null),
            currentPlayer: gameData.players[0]?.user_id === this.activityManager.userId ? 'X' : 'O',
            gameActive: true,
            players: gameData.players,
            currentTurn: gameData.current_turn,
            gameId: gameData.game_id
        };
        
        this.renderBoard();
        this.updateTurnIndicator();
    }

    makeMove(position) {
        if (!this.isValidMove(position)) {
            return false;
        }

        if (!this.isPlayerTurn()) {
            this.showMessage('Not your turn!', 'warning');
            return false;
        }

        return true;
    }

    isValidMove(position) {
        return position >= 0 && 
               position < 9 && 
               this.gameState.board[position] === null && 
               this.gameState.gameActive;
    }

    isPlayerTurn() {
        return this.gameState.currentTurn === this.activityManager.userId;
    }

    updateBoard(board, currentTurn) {
        this.gameState.board = board;
        this.gameState.currentTurn = currentTurn;
        this.renderBoard();
        this.updateTurnIndicator();
    }

    renderBoard() {
        const gameBoard = document.querySelector('#game-board');
        if (!gameBoard) return;

        const cells = gameBoard.querySelectorAll('button');
        cells.forEach((cell, index) => {
            const value = this.gameState.board[index];
            cell.textContent = value || '';
            
            if (value) {
                cell.disabled = true;
                cell.className = 'w-16 h-16 bg-[#404249] text-white text-2xl font-bold rounded-md cursor-not-allowed';
                
                if (value === 'X') {
                    cell.classList.add('text-blue-400');
                } else {
                    cell.classList.add('text-red-400');
                }
            } else {
                cell.disabled = false;
                cell.className = 'w-16 h-16 bg-[#2b2d31] hover:bg-[#404249] text-white text-2xl font-bold rounded-md transition-colors duration-200';
            }
        });
    }

    updateTurnIndicator() {
        const currentTurnElement = document.querySelector('#current-turn');
        if (!currentTurnElement) return;

        const currentPlayer = this.gameState.players.find(p => p.user_id === this.gameState.currentTurn);
        const isMyTurn = this.gameState.currentTurn === this.activityManager.userId;
        
        if (isMyTurn) {
            currentTurnElement.textContent = 'Your turn';
            currentTurnElement.className = 'text-green-400 text-sm mb-2 font-semibold';
        } else {
            currentTurnElement.textContent = `${currentPlayer ? currentPlayer.username : 'Unknown'}'s turn`;
            currentTurnElement.className = 'text-[#949ba4] text-sm mb-2';
        }
    }

    endGame(result) {
        this.gameState.gameActive = false;
        this.showGameResult(result);
    }

    showGameResult(result) {
        const gameResult = document.querySelector('#game-result');
        const winnerText = document.querySelector('#winner-text');
        
        if (!gameResult || !winnerText) return;

        gameResult.classList.remove('hidden');
        
        if (result.is_draw) {
            winnerText.textContent = "It's a draw!";
            winnerText.className = 'text-xl font-bold mb-4 text-yellow-400';
            this.showMessage("Game ended in a draw!", 'info');
        } else if (result.winner_user_id === this.activityManager.userId) {
            winnerText.textContent = 'You won! 🎉';
            winnerText.className = 'text-xl font-bold mb-4 text-green-400';
            this.showMessage('Congratulations! You won!', 'success');
        } else {
            const winner = this.gameState.players.find(p => p.user_id === result.winner_user_id);
            winnerText.textContent = `${winner ? winner.username : 'Unknown'} won!`;
            winnerText.className = 'text-xl font-bold mb-4 text-red-400';
            this.showMessage(`${winner ? winner.username : 'Unknown'} won the game!`, 'info');
        }
        
        this.highlightWinningCombination(result.board);
        this.renderBoard();
    }

    highlightWinningCombination(board) {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (let combination of winningCombinations) {
            const [a, b, c] = combination;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                const gameBoard = document.querySelector('#game-board');
                if (gameBoard) {
                    const cells = gameBoard.querySelectorAll('button');
                    combination.forEach(index => {
                        cells[index].classList.add('bg-green-600', 'text-white');
                    });
                }
                break;
            }
        }
    }

    resetGame() {
        this.gameState = {
            board: Array(9).fill(null),
            currentPlayer: 'X',
            gameActive: false,
            players: [],
            currentTurn: null,
            gameId: null
        };
        
        const gameResult = document.querySelector('#game-result');
        if (gameResult) {
            gameResult.classList.add('hidden');
        }
        
        this.renderBoard();
    }

    showMessage(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    getPlayerSymbol(userId) {
        const playerIndex = this.gameState.players.findIndex(p => p.user_id === userId);
        return playerIndex === 0 ? 'X' : 'O';
    }

    formatGameTime(startTime) {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    static validateMove(board, position) {
        return position >= 0 && position < 9 && board[position] === null;
    }

    static checkWinner(board) {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        
        for (let line of lines) {
            const [a, b, c] = line;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        
        return null;
    }

    static isDraw(board) {
        return board.every(cell => cell !== null) && !TicTacToeGame.checkWinner(board);
    }
}

class TicTacToeModal {
    constructor() {
        this.currentGameData = null;
        this.serverId = null;
        this.userId = null;
        this.username = null;
    }

    static createTicTacToeModal(serverId, userId, username) {
        if (document.getElementById('tic-tac-toe-modal')) return;
        
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            alert('WebSocket connection not ready. Please wait and try again.');
            return;
        }
        
        const modal = new TicTacToeModal();
        modal.serverId = serverId;
        modal.userId = userId;
        modal.username = username;
        modal.render();
        modal.setupEventListeners();
        modal.connectToSocket();
        
        return modal;
    }

    render() {
        const modal = document.createElement('div');
        modal.id = 'tic-tac-toe-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
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
                            <button id="ready-button" class="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2 px-4 rounded-md transition-colors duration-200">
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
        
        document.body.appendChild(modal);
    }

    setupEventListeners() {
        const modal = document.getElementById('tic-tac-toe-modal');
        const closeButton = modal.querySelector('#close-tic-tac-toe');
        const readyButton = modal.querySelector('#ready-button');
        const playButton = modal.querySelector('#play-button');
        const newGameButton = modal.querySelector('#new-game-button');
        
        closeButton.addEventListener('click', () => {
            if (window.globalSocketManager.isReady()) {
                window.globalSocketManager.io.emit('leave-tic-tac-toe', { server_id: this.serverId });
            }
            modal.remove();
        });
        
        readyButton.addEventListener('click', () => {
            const isReady = readyButton.textContent === 'Ready';
            window.globalSocketManager.io.emit('tic-tac-toe-ready', { ready: isReady });
            readyButton.textContent = isReady ? 'Not Ready' : 'Ready';
            readyButton.className = isReady 
                ? 'w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200'
                : 'w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium py-2 px-4 rounded-md transition-colors duration-200';
        });
        
        playButton.addEventListener('click', () => {
            document.getElementById('welcome-section').classList.add('hidden');
            document.getElementById('game-section').classList.remove('hidden');
        });
        
        newGameButton.addEventListener('click', () => {
            document.getElementById('game-result').classList.add('hidden');
            this.createGameBoard();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (window.globalSocketManager.isReady()) {
                    window.globalSocketManager.io.emit('leave-tic-tac-toe', { server_id: this.serverId });
                }
                modal.remove();
            }
        });
    }

    connectToSocket() {
        window.globalSocketManager.io.emit('join-tic-tac-toe', { server_id: this.serverId });
        
        const io = window.globalSocketManager.io;
        
        io.on('tic-tac-toe-joined', (data) => this.updatePlayerList(data.players));
        io.on('tic-tac-toe-player-joined', (data) => this.updatePlayerList([data.player]));
        io.on('tic-tac-toe-ready-update', (data) => {
            this.updatePlayerList(data.players);
            const playButton = document.getElementById('play-button');
            if (data.can_start) {
                playButton.classList.remove('hidden');
            } else {
                playButton.classList.add('hidden');
            }
        });
        io.on('tic-tac-toe-game-start', (data) => {
            this.currentGameData = data;
            document.getElementById('welcome-section').classList.add('hidden');
            document.getElementById('game-section').classList.remove('hidden');
            this.updateGameInfo();
            this.createGameBoard();
        });
        io.on('tic-tac-toe-move-made', (data) => {
            this.currentGameData.board = data.board;
            this.currentGameData.current_turn = data.current_turn;
            this.updateGameBoard();
            this.updateGameInfo();
        });
        io.on('tic-tac-toe-game-end', (data) => {
            this.showGameResult(data);
        });
        io.on('tic-tac-toe-error', (data) => {
            alert('Error: ' + data.message);
        });
    }

    updatePlayerList(players) {
        const playerList = document.getElementById('player-list');
        if (!playerList) return;
        
        playerList.innerHTML = '';
        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'flex items-center gap-3 p-3 bg-[#2b2d31] rounded-md';
            playerDiv.innerHTML = `
                <img src="${player.avatar_url || '/public/assets/common/default-profile-picture.png'}" alt="${player.username}" class="w-8 h-8 rounded-full">
                <div class="flex-1 text-left">
                    <div class="text-white font-medium">${player.username}</div>
                    <div class="text-[#949ba4] text-sm">${player.ready ? 'Ready' : 'Not Ready'}</div>
                </div>
                ${player.ready ? '<i class="fas fa-check text-green-400"></i>' : '<i class="fas fa-clock text-yellow-400"></i>'}
            `;
            playerList.appendChild(playerDiv);
        });
    }

    updateGameInfo() {
        if (!this.currentGameData) return;
        
        const currentTurn = document.getElementById('current-turn');
        const gamePlayers = document.getElementById('game-players');
        
        const currentPlayer = this.currentGameData.players.find(p => p.user_id == this.currentGameData.current_turn);
        const isMyTurn = this.currentGameData.current_turn == this.userId;
        
        if (currentTurn) {
            currentTurn.textContent = isMyTurn ? 'Your turn' : `${currentPlayer ? currentPlayer.username : 'Unknown'}'s turn`;
            currentTurn.className = isMyTurn ? 'text-green-400 text-sm mb-2 font-semibold' : 'text-[#949ba4] text-sm mb-2';
        }
        
        if (gamePlayers) {
            gamePlayers.innerHTML = '';
            this.currentGameData.players.forEach((player, index) => {
                const symbol = index === 0 ? 'X' : 'O';
                const isCurrentTurn = player.user_id == this.currentGameData.current_turn;
                
                const playerDiv = document.createElement('div');
                playerDiv.className = `flex items-center gap-2 p-2 rounded-md ${isCurrentTurn ? 'bg-[#5865f2]' : 'bg-[#2b2d31]'}`;
                playerDiv.innerHTML = `
                    <img src="${player.avatar_url || '/public/assets/common/default-profile-picture.png'}" alt="${player.username}" class="w-6 h-6 rounded-full">
                    <span class="text-white font-medium">${player.username}</span>
                    <span class="text-[#949ba4]">(${symbol})</span>
                `;
                gamePlayers.appendChild(playerDiv);
            });
        }
    }

    createGameBoard() {
        const gameBoard = document.getElementById('game-board');
        if (!gameBoard) return;
        
        gameBoard.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('button');
            cell.className = 'w-16 h-16 bg-[#2b2d31] hover:bg-[#404249] text-white text-2xl font-bold rounded-md transition-colors duration-200';
            cell.addEventListener('click', () => this.makeMove(i));
            gameBoard.appendChild(cell);
        }
        this.updateGameBoard();
    }

    updateGameBoard() {
        if (!this.currentGameData) return;
        
        const cells = document.querySelectorAll('#game-board button');
        cells.forEach((cell, index) => {
            const value = this.currentGameData.board[index];
            cell.textContent = value || '';
            cell.disabled = value !== null;
            
            if (value) {
                cell.className = 'w-16 h-16 bg-[#404249] text-white text-2xl font-bold rounded-md cursor-not-allowed';
                if (value === 'X') {
                    cell.classList.add('text-blue-400');
                } else {
                    cell.classList.add('text-red-400');
                }
            }
        });
    }

    makeMove(position) {
        if (!this.currentGameData || this.currentGameData.current_turn != this.userId) {
            alert('Not your turn!');
            return;
        }
        
        if (this.currentGameData.board[position] !== null) {
            alert('Invalid move!');
            return;
        }
        
        window.globalSocketManager.io.emit('tic-tac-toe-move', { position: position });
    }

    showGameResult(data) {
        const gameResult = document.getElementById('game-result');
        const winnerText = document.getElementById('winner-text');
        
        if (gameResult) gameResult.classList.remove('hidden');
        
        if (data.is_draw) {
            winnerText.textContent = "It's a draw!";
            winnerText.className = 'text-xl font-bold mb-4 text-yellow-400';
        } else if (data.winner_user_id == this.userId) {
            winnerText.textContent = 'You won! 🎉';
            winnerText.className = 'text-xl font-bold mb-4 text-green-400';
        } else {
            const winner = this.currentGameData.players.find(p => p.user_id == data.winner_user_id);
            winnerText.textContent = `${winner ? winner.username : 'Unknown'} won!`;
            winnerText.className = 'text-xl font-bold mb-4 text-red-400';
        }
        
        this.updateGameBoard();
    }
}

if (typeof window !== 'undefined') {
    window.TicTacToeGame = TicTacToeGame;
    window.TicTacToeModal = TicTacToeModal;
}
