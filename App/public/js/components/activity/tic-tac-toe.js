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

        if (result.winning_positions) {
            this.highlightWinningCombination(result.board, result.winning_positions);
        }

        setTimeout(() => {
            gameResult.classList.remove('hidden');
            
            if (result.is_draw) {
                winnerText.textContent = "It's a draw!";
                winnerText.className = 'text-xl font-bold mb-4 text-yellow-400 animate-pulse';
                this.showMessage("Game ended in a draw!", 'info');
            } else if (result.winner_user_id === this.activityManager.userId) {
                winnerText.textContent = 'You won!';
                winnerText.className = 'text-xl font-bold mb-4 text-green-400 animate-bounce';
                this.showMessage('Congratulations! You won!', 'success');
                this.createConfetti();
            } else {
                const winner = this.gameState.players.find(p => p.user_id === result.winner_user_id);
                winnerText.textContent = `${winner ? winner.username : 'Unknown'} won!`;
                winnerText.className = 'text-xl font-bold mb-4 text-red-400';
                this.showMessage(`${winner ? winner.username : 'Unknown'} won the game!`, 'info');
            }
        }, 500);
        
        this.renderBoard();
    }

    highlightWinningCombination(board, winningPositions = null) {
        const gameBoard = document.querySelector('#game-board');
        if (!gameBoard) return;

        const cells = gameBoard.querySelectorAll('button');
        
        if (winningPositions) {
            winningPositions.forEach((index, i) => {
                setTimeout(() => {
                    cells[index].classList.add('winning-cell', 'animate-pulse');
                    cells[index].style.animation = 'winningPulse 0.6s ease-in-out';
                }, i * 200);
            });
        } else {
            const winningCombinations = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6]
            ];

            for (let combination of winningCombinations) {
                const [a, b, c] = combination;
                if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                    combination.forEach((index, i) => {
                        setTimeout(() => {
                            cells[index].classList.add('winning-cell', 'animate-pulse');
                            cells[index].style.animation = 'winningPulse 0.6s ease-in-out';
                        }, i * 200);
                    });
                    break;
                }
            }
        }
    }

    createConfetti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'fixed inset-0 pointer-events-none z-50';
        confettiContainer.id = 'confetti-container';
        document.body.appendChild(confettiContainer);

        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'absolute w-2 h-2 rounded-full';
                confetti.style.backgroundColor = '#5865f2';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = '0%';
                confetti.style.transition = 'all 2s ease';
                
                setTimeout(() => {
                    confetti.style.top = '100vh';
                    confetti.style.opacity = '0';
                }, 10);

                confettiContainer.appendChild(confetti);

                setTimeout(() => {
                    confetti.remove();
                }, 2000);
            }, i * 50);
        }

        setTimeout(() => {
            confettiContainer.remove();
        }, 3000);
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
        this.isMinimized = false;
        this.minimizedPosition = { x: 20, y: 20 };
    }

    static createTicTacToeModal(serverId, userId, username) {
        if (window.activeTicTacToeModal) {
            if (window.activeTicTacToeModal.isMinimized) {
                window.activeTicTacToeModal.toggleMinimize();
            }
            return window.activeTicTacToeModal;
        }
        
        if (document.getElementById('tic-tac-toe-modal')) return;
        
        if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
            if (window.showToast) {
                window.showToast('WebSocket connection not ready. Please wait and try again.', 'error');
            }
            return;
        }
        
        const modal = new TicTacToeModal();
        modal.serverId = serverId;
        modal.userId = userId;
        modal.username = username;
        modal.render();
        modal.setupEventListeners();
        modal.connectToSocket();
        
        window.activeTicTacToeModal = modal;
        return modal;
    }

    render() {
        const modal = document.createElement('div');
        modal.id = 'tic-tac-toe-modal';
        modal.className = 'fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4';
        modal.innerHTML = `
            <div class="tic-tac-toe-modal-content bg-[#313338] rounded-xl w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto max-h-[95vh] sm:max-h-[90vh] overflow-hidden relative flex flex-col">
                <div class="drag-handle"></div>
                
                <div class="modal-header flex justify-between items-center p-3 sm:p-4 md:p-6 pb-2 sm:pb-3 md:pb-4 shrink-0">
                    <h2 class="tic-tac-toe-title text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">Tic Mac Voe</h2>
                    <div class="flex items-center gap-1 sm:gap-2">
                        <button id="minimize-tic-tac-toe" class="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all duration-200">
                            <i class="fas fa-window-minimize text-xs sm:text-sm"></i>
                        </button>
                        <button id="close-tic-tac-toe" class="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all duration-200">
                            <i class="fas fa-times text-xs sm:text-sm"></i>
                        </button>
                    </div>
                </div>
                
                <div id="tic-tac-toe-content" class="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 overflow-y-auto flex-1">
                    <div id="welcome-section" class="text-center">
                        <div class="mb-4 sm:mb-6">
                            <div class="relative mb-3 sm:mb-4">
                                <div class="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto bg-[#5865f2] rounded-full flex items-center justify-center shadow-md">
                                    <i class="fas fa-chess-board text-sm sm:text-lg md:text-2xl text-white"></i>
                                </div>
                            </div>
                            <h3 class="text-base sm:text-lg md:text-xl font-bold text-white mb-2 sm:mb-3">
                                Welcome to the Lobby!
                            </h3>
                            <p class="text-[#b9bbbe] text-xs sm:text-sm mb-1 sm:mb-2">Get ready to play...</p>
                            <div id="lobby-info" class="text-[#72767d] text-xs bg-[#2b2d31] px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
                                Players in lobby: 0
                            </div>
                        </div>
                        
                        <div id="player-list" class="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                        </div>
                        
                        <div id="game-controls" class="space-y-3 sm:space-y-4">
                            <button id="ready-button" class="ready-button w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-bold text-white transition-all duration-200">
                                <span class="relative z-10 text-sm sm:text-base">Ready to Play</span>
                            </button>
                            <button id="play-button" class="play-button w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-bold text-white transition-all duration-200 hidden">
                                <span class="relative z-10 text-sm sm:text-base">Start Game</span>
                            </button>
                            <div class="text-[#72767d] text-xs mt-2">
                                First 2 ready players will start the game automatically
                            </div>
                        </div>
                    </div>
                
                    <div id="game-section" class="hidden">
                        <div id="game-info" class="text-center mb-4 sm:mb-6">
                            <div id="current-turn" class="text-[#b9bbbe] text-sm sm:text-base md:text-lg mb-3 sm:mb-4 font-semibold"></div>
                            <div id="game-players" class="flex justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                            </div>
                        </div>
                        
                        <div class="flex justify-center mb-4 sm:mb-6">
                            <div id="game-board" class="grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl">
                            </div>
                        </div>
                        
                        <div id="game-result" class="text-center hidden">
                            <div id="winner-text" class="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6"></div>
                            <button id="return-lobby-button" class="return-lobby-button py-2 sm:py-3 px-6 sm:px-8 rounded-lg font-bold text-white transition-all duration-200">
                                <span class="relative z-10 text-sm sm:text-base">Return to Lobby</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="resize-handle"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupDragAndResize(modal);
        this.startParticleAnimation();
    }

    generateParticles() {

        return '';
    }

    startParticleAnimation() {

    }

    setupDragAndResize(modal) {
        const modalContent = modal.querySelector('.tic-tac-toe-modal-content');
        const dragHandle = modal.querySelector('.drag-handle');
        const modalHeader = modal.querySelector('.modal-header');
        const resizeHandle = modal.querySelector('.resize-handle');
        
        let isDragging = false;
        let isResizing = false;
        let dragOffset = { x: 0, y: 0 };
        let startSize = { width: 0, height: 0 };
        let startPos = { x: 0, y: 0 };

        const startDrag = (e) => {
            if (isResizing) return;
            isDragging = true;
            const rect = modalContent.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            modalContent.style.position = 'fixed';
            modalContent.style.zIndex = '10000';
            document.body.style.userSelect = 'none';
        };

        const startResize = (e) => {
            e.stopPropagation();
            isResizing = true;
            const rect = modalContent.getBoundingClientRect();
            startSize.width = rect.width;
            startSize.height = rect.height;
            startPos.x = e.clientX;
            startPos.y = e.clientY;
            document.body.style.userSelect = 'none';
        };

        const handleMouseMove = (e) => {
            if (isDragging) {
                const x = e.clientX - dragOffset.x;
                const y = e.clientY - dragOffset.y;
                
                const maxX = window.innerWidth - modalContent.offsetWidth;
                const maxY = window.innerHeight - modalContent.offsetHeight;
                
                const boundedX = Math.max(0, Math.min(x, maxX));
                const boundedY = Math.max(0, Math.min(y, maxY));
                
                modalContent.style.left = boundedX + 'px';
                modalContent.style.top = boundedY + 'px';
                modalContent.style.margin = '0';
            } else if (isResizing) {
                const deltaX = e.clientX - startPos.x;
                const deltaY = e.clientY - startPos.y;
                
                const newWidth = Math.max(400, startSize.width + deltaX);
                const newHeight = Math.max(500, startSize.height + deltaY);
                
                modalContent.style.width = newWidth + 'px';
                modalContent.style.height = newHeight + 'px';
                modalContent.style.maxWidth = 'none';
                modalContent.style.maxHeight = 'none';
            }
        };

        const stopDragResize = () => {
            if (isDragging || isResizing) {
                document.body.style.userSelect = '';
                isDragging = false;
                isResizing = false;
            }
        };

        dragHandle.addEventListener('mousedown', startDrag);
        modalHeader.addEventListener('mousedown', startDrag);
        resizeHandle.addEventListener('mousedown', startResize);
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopDragResize);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    closeModal() {
        const modal = document.getElementById('tic-tac-toe-modal');
        if (modal) {
            if (window.globalSocketManager.isReady()) {
                window.globalSocketManager.io.emit('leave-tic-tac-toe', { server_id: this.serverId });
            }
            modal.remove();
            window.activeTicTacToeModal = null;
        }
    }

    updatePlayerList(players) {
        const playerList = document.getElementById('player-list');
        if (!playerList) return;
        
        playerList.innerHTML = '';
        players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 rounded-lg bg-[#36393f]';
            playerDiv.innerHTML = `
                <div class="relative">
                    <img src="${player.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                         alt="${player.username}" 
                         class="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-2 border-[#5865f2]">
                    <div class="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full ${player.ready ? 'bg-green-400' : 'bg-yellow-400'} border-2 border-[#2f3136]"></div>
                </div>
                <div class="flex-1 text-left">
                    <div class="text-white font-bold text-sm sm:text-base">${player.username}</div>
                    <div class="text-xs sm:text-sm ${player.ready ? 'text-green-400' : 'text-yellow-400'}">
                        ${player.ready ? 'Ready' : 'Not Ready'}
                    </div>
                </div>
                <div class="text-xs sm:text-sm font-semibold">
                    ${player.ready ? 'READY' : 'WAIT'}
                </div>
            `;
            playerList.appendChild(playerDiv);
        });
    }

    createGameBoard() {
        const gameBoard = document.getElementById('game-board');
        if (!gameBoard) {
            return;
        }
        
        gameBoard.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('button');
            cell.className = 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-lg sm:text-2xl md:text-3xl font-bold rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 focus:outline-none border-2 border-[#5865f2] bg-gradient-to-br from-[#2c2f36] to-[#36393f]';
            cell.addEventListener('click', () => this.makeMove(i));
            gameBoard.appendChild(cell);
        }
        
        this.updateGameBoard();
    }

    updateGameBoard() {
        if (!this.currentGameData) {
            return;
        }
        
        if (!this.currentGameData.board || !Array.isArray(this.currentGameData.board)) {
            return;
        }
        
        const cells = document.querySelectorAll('#game-board button');
        if (cells.length !== 9) {
            return;
        }
        
        cells.forEach((cell, index) => {
            const value = this.currentGameData.board[index];
            cell.textContent = value || '';
            cell.disabled = value !== null;
            
            if (value) {
                cell.classList.add('cursor-not-allowed');
                if (value === 'X') {
                    cell.classList.add('text-blue-400');
                } else {
                    cell.classList.add('text-red-400');
                }
            } else {
                cell.classList.remove('cursor-not-allowed', 'text-blue-400', 'text-red-400');
            }
        });
    }

    makeMove(position) {
        if (!this.currentGameData || this.currentGameData.current_turn != this.userId) {
            if (window.showToast) {
                window.showToast('Not your turn!', 'warning');
            }
            return;
        }
        
        if (this.currentGameData.board[position] !== null) {
            if (window.showToast) {
                window.showToast('Invalid move!', 'warning');
            }
            return;
        }
        
        window.globalSocketManager.io.emit('tic-tac-toe-move', { position: position });
    }

    showGameResult(data) {
        const gameResult = document.getElementById('game-result');
        const winnerText = document.getElementById('winner-text');
        
        if (gameResult) gameResult.classList.remove('hidden');
        
        if (data.is_draw) {
            winnerText.textContent = "It's a Draw!";
            winnerText.className = 'text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-yellow-400';
            this.createFireworks('yellow');
        } else if (data.reason === 'opponent_left') {
            if (data.winner_user_id == this.userId) {
                winnerText.textContent = 'You Won by Forfeit!';
                winnerText.className = 'text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-green-400';
                this.createFireworks('green');
                this.createConfetti();
                if (window.showToast) {
                    window.showToast('Your opponent left the game!', 'success');
                }
            } else {
                const winner = data.winner_player || this.currentGameData.players.find(p => p.user_id == data.winner_user_id);
                winnerText.textContent = `${winner ? winner.username : 'Opponent'} Won by Forfeit!`;
                winnerText.className = 'text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-red-400';
                this.createFireworks('red');
            }
        } else if (data.winner_user_id == this.userId) {
            winnerText.textContent = 'You Won!';
            winnerText.className = 'text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-green-400';
            this.createFireworks('green');
            this.createConfetti();
        } else {
            const winner = this.currentGameData.players.find(p => p.user_id == data.winner_user_id);
            winnerText.textContent = `${winner ? winner.username : 'Opponent'} Won!`;
            winnerText.className = 'text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-red-400';
            this.createFireworks('red');
        }

        if (data.winning_positions) {
            this.highlightWinningCells(data.winning_positions);
        }
        
        this.updateGameBoard();
    }
    
    highlightWinningCells(positions) {
        const cells = document.querySelectorAll('#game-board button');
        positions.forEach((position) => {
            if (cells[position]) {
                cells[position].classList.add('winning-cell');
            }
        });
    }
    
    createFireworks(color) {

        const mainColor = color === 'green' ? '#3ba55c' : 
                         color === 'red' ? '#ed4245' : '#faa61a';
        

        const flash = document.createElement('div');
        flash.className = 'fixed inset-0 pointer-events-none z-50';
        flash.style.backgroundColor = mainColor;
        flash.style.opacity = '0.2';
        flash.style.transition = 'opacity 0.5s ease';
        document.body.appendChild(flash);
        
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => {
                flash.remove();
            }, 500);
        }, 100);
    }

    createSingleFirework(colors) {

    }

    createConfetti() {
        const container = document.createElement('div');
        container.className = 'fixed inset-0 pointer-events-none';
        container.style.zIndex = '999999';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100vw';
        container.style.height = '100vh';
        document.body.appendChild(container);

        const colors = ['#10b981', '#059669', '#34d399', '#00ff00', '#32cd32', '#7fff00'];
        
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const confettiPiece = document.createElement('div');
                confettiPiece.className = 'absolute';
                confettiPiece.style.width = (Math.random() * 8 + 6) + 'px';
                confettiPiece.style.height = confettiPiece.style.width;
                confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confettiPiece.style.borderRadius = '50%';
                confettiPiece.style.left = Math.random() * 100 + '%';
                confettiPiece.style.top = '-20px';
                confettiPiece.style.animation = `confettiDrop ${2 + Math.random() * 3}s linear forwards`;
                confettiPiece.style.opacity = '1';
                confettiPiece.style.boxShadow = `0 0 10px ${colors[Math.floor(Math.random() * colors.length)]}`;
                confettiPiece.style.zIndex = '999999';
                
                container.appendChild(confettiPiece);
                
                setTimeout(() => {
                    if (confettiPiece.parentNode) {
                        confettiPiece.remove();
                    }
                }, 6000);
            }, Math.random() * 1000);
        }

        setTimeout(() => {
            if (container.parentNode) {
                container.remove();
            }
        }, 7000);
    }

    setupEventListeners() {
        const modal = document.getElementById('tic-tac-toe-modal');
        const closeButton = modal.querySelector('#close-tic-tac-toe');
        const minimizeButton = modal.querySelector('#minimize-tic-tac-toe');
        const readyButton = modal.querySelector('#ready-button');
        const playButton = modal.querySelector('#play-button');
        const returnLobbyButton = modal.querySelector('#return-lobby-button');
        
        closeButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (window.globalSocketManager.isReady()) {
                window.globalSocketManager.io.emit('leave-tic-tac-toe', { server_id: this.serverId });
            }
            modal.remove();
            window.activeTicTacToeModal = null;
        });
        
        minimizeButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.toggleMinimize();
        });
        
        readyButton.addEventListener('click', () => {
            const isReady = readyButton.textContent.includes('Ready to Play') || readyButton.textContent.includes('Ready for Battle');
            window.globalSocketManager.io.emit('tic-tac-toe-ready', { ready: isReady });
            if (isReady) {
                readyButton.innerHTML = '<span class="relative z-10">Cancel Ready</span>';
                readyButton.className = 'w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300';
            } else {
                readyButton.innerHTML = '<span class="relative z-10">Ready to Play</span>';
                readyButton.className = 'ready-button w-full py-3 px-6 rounded-lg font-bold text-white transition-all duration-300';
            }
        });
        
        playButton.addEventListener('click', () => {
            document.getElementById('welcome-section').classList.add('hidden');
            document.getElementById('game-section').classList.remove('hidden');
        });
        
        if (returnLobbyButton) {
            returnLobbyButton.addEventListener('click', () => {
                document.getElementById('game-section').classList.add('hidden');
                document.getElementById('welcome-section').classList.remove('hidden');
                
                const gameResult = document.getElementById('game-result');
                if (gameResult) {
                    gameResult.classList.add('hidden');
                }
                
                this.currentGameData = null;
                
                if (window.showToast) {
                    window.showToast('Returned to lobby', 'info');
                }
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (window.globalSocketManager.isReady()) {
                    window.globalSocketManager.io.emit('leave-tic-tac-toe', { server_id: this.serverId });
                }
                modal.remove();
                window.activeTicTacToeModal = null;
            }
        });
    }

    connectToSocket() {

        
        window.globalSocketManager.io.emit('join-tic-tac-toe', { server_id: this.serverId });
        
        const io = window.globalSocketManager.io;
        

        
        io.on('tic-tac-toe-joined', (data) => this.updatePlayerList(data.players));
        io.on('tic-tac-toe-player-joined', (data) => this.updatePlayerList(data.players || [data.player]));
        io.on('tic-tac-toe-ready-update', (data) => {
            this.updatePlayerList(data.players);
            const playButton = document.getElementById('play-button');
            const lobbyInfo = document.getElementById('lobby-info');
            
            if (lobbyInfo) {
                lobbyInfo.textContent = `Players in lobby: ${data.lobby_count || data.players.length} | Ready: ${data.ready_count}`;
            }
            
            if (data.can_start && data.ready_count >= 2) {
                if (playButton) {
                    playButton.innerHTML = '<span class="relative z-10">Starting Game...</span>';
                    playButton.disabled = true;
                }
            } else {
                if (playButton) {
                    playButton.classList.add('hidden');
                }
            }
        });
        io.on('tic-tac-toe-game-started-update', (data) => {
            if (window.showToast) {
                window.showToast(data.message, 'info');
            }
            this.updatePlayerList(data.players);
            
            const lobbyInfo = document.getElementById('lobby-info');
            if (lobbyInfo) {
                lobbyInfo.textContent = `Players in lobby: ${data.lobby_count} | Game: ${data.game_players.join(' vs ')}`;
            }
            
            const playButton = document.getElementById('play-button');
            if (playButton) {
                playButton.classList.add('hidden');
                playButton.disabled = false;
                playButton.innerHTML = '<span class="relative z-10">Start Game</span>';
            }
        });
        io.on('tic-tac-toe-game-start', (data) => {

            
            this.currentGameData = data;
            
            const welcomeSection = document.getElementById('welcome-section');
            const gameSection = document.getElementById('game-section');
            const gameResult = document.getElementById('game-result');
            
            if (welcomeSection) {
                welcomeSection.classList.add('hidden');

            }
            
            if (gameSection) {
                gameSection.classList.remove('hidden');

            }
            
            if (gameResult) {
                gameResult.classList.add('hidden');

            }
            
            const playAgainRequest = document.getElementById('play-again-request');
            if (playAgainRequest) {
                playAgainRequest.remove();

            }
            
            this.updateGameInfo();
            this.createGameBoard();
            

            
            if (window.showToast) {
                window.showToast('New game started!', 'success');
            }
        });
        io.on('tic-tac-toe-move-made', (data) => {
            this.currentGameData.board = data.board;
            this.currentGameData.current_turn = data.current_turn;
            this.updateGameBoard();
            this.updateGameInfo();
            this.animateMove(data.position);
        });
        io.on('tic-tac-toe-game-end', (data) => {
            this.showGameResult(data);
        });
        io.on('tic-tac-toe-error', (data) => {
            if (window.showToast) {
                window.showToast('Error: ' + data.message, 'error');
            }
        });
        io.on('tic-tac-toe-player-left', (data) => {
            if (window.showToast) {
                window.showToast(`${data.player.username} left the lobby`, 'info');
            }
            if (data.players) {
                this.updatePlayerList(data.players);
            }
            
            const lobbyInfo = document.getElementById('lobby-info');
            if (lobbyInfo && data.lobby_count !== undefined) {
                lobbyInfo.textContent = `Players in lobby: ${data.lobby_count}`;
            }
        });
        io.on('tic-tac-toe-game-abandoned', (data) => {
            if (window.showToast) {
                window.showToast(`${data.player.username} abandoned the game!`, 'warning');
            }
            
            const gameResult = document.getElementById('game-result');
            const winnerText = document.getElementById('winner-text');
            
            if (gameResult && winnerText) {
                winnerText.textContent = `${data.player.username} left - You win by default!`;
                winnerText.className = 'text-2xl font-bold mb-6 text-green-400';
                gameResult.classList.remove('hidden');
            }
            
            this.currentGameData = null;
        });
        io.on('tic-tac-toe-returned-to-lobby', (data) => {
            if (window.showToast) {
                window.showToast(data.message, 'info');
            }
            
            document.getElementById('game-section').classList.add('hidden');
            document.getElementById('welcome-section').classList.remove('hidden');
            
            this.updatePlayerList(data.players);
            this.currentGameData = null;
            
            const lobbyInfo = document.getElementById('lobby-info');
            if (lobbyInfo) {
                lobbyInfo.textContent = `Players in lobby: ${data.lobby_count}`;
            }
            
            const readyButton = document.querySelector('#ready-button');
            if (readyButton) {
                readyButton.innerHTML = '<span class="relative z-10">Ready to Play</span>';
                readyButton.className = 'ready-button w-full py-3 px-6 rounded-lg font-bold text-white transition-all duration-300';
            }
        });
    }

    animateMove(position) {

        const cells = document.querySelectorAll('#game-board button');
        if (cells[position]) {
            cells[position].classList.add('bg-[#404249]');
            setTimeout(() => {
                cells[position].classList.remove('bg-[#404249]');
            }, 300);
        }
    }

    updateGameInfo() {
        if (!this.currentGameData) {
            return;
        }
        
        const currentTurn = document.getElementById('current-turn');
        const gamePlayers = document.getElementById('game-players');
        
        const currentPlayer = this.currentGameData.players.find(p => p.user_id == this.currentGameData.current_turn);
        const isMyTurn = this.currentGameData.current_turn == this.userId;
        
        if (currentTurn) {
            currentTurn.textContent = isMyTurn ? 'Your turn' : `${currentPlayer ? currentPlayer.username : 'Unknown'}'s turn`;
            currentTurn.className = isMyTurn ? 'text-green-400 text-sm sm:text-base md:text-lg mb-2 sm:mb-3 md:mb-4 font-semibold' : 'text-[#949ba4] text-sm sm:text-base md:text-lg mb-2 sm:mb-3 md:mb-4';
        }
        
        if (gamePlayers) {
            gamePlayers.innerHTML = '';
            this.currentGameData.players.forEach((player, index) => {
                const symbol = index === 0 ? 'X' : 'O';
                const isCurrentTurn = player.user_id == this.currentGameData.current_turn;
                
                const playerDiv = document.createElement('div');
                playerDiv.className = `flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded-md ${isCurrentTurn ? 'bg-[#5865f2]' : 'bg-[#2b2d31]'}`;
                playerDiv.innerHTML = `
                    <img src="${player.avatar_url || '/public/assets/common/default-profile-picture.png'}" alt="${player.username}" class="w-5 h-5 sm:w-6 sm:h-6 rounded-full">
                    <span class="text-white font-medium text-xs sm:text-sm">${player.username}</span>
                    <span class="text-[#949ba4] text-xs sm:text-sm">(${symbol})</span>
                `;
                gamePlayers.appendChild(playerDiv);
            });
        }
    }

    toggleMinimize() {
        const modal = document.getElementById('tic-tac-toe-modal');
        if (!modal) return;
        
        if (this.isMinimized) {
            modal.style.display = 'flex';
            this.isMinimized = false;
        } else {
            modal.style.display = 'none';
            this.isMinimized = true;
        }
    }
}

window.TicTacToeGame = TicTacToeGame;
window.TicTacToeModal = TicTacToeModal;


