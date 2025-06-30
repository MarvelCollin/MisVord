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

        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'absolute w-3 h-3 rounded-full animate-bounce';
                confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 60%)`;
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = '0%';
                confetti.style.animationDelay = Math.random() * 2 + 's';
                confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
                confettiContainer.appendChild(confetti);

                setTimeout(() => {
                    confetti.remove();
                }, 5000);
            }, i * 50);
        }

        setTimeout(() => {
            confettiContainer.remove();
        }, 6000);
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
        modal.className = 'fixed inset-0 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="tic-tac-toe-modal-content bg-[#313338] rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden relative">
                <div class="floating-particles">
                    ${this.generateParticles()}
                </div>
                
                <div class="drag-handle"></div>
                
                <div class="modal-header flex justify-between items-center p-6 pb-4">
                    <h2 class="tic-tac-toe-title text-3xl font-bold">TIC MAC VOE</h2>
                    <div class="flex items-center gap-2">
                        <button id="minimize-tic-tac-toe" class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300">
                            <i class="fas fa-window-minimize text-sm"></i>
                        </button>
                        <button id="close-tic-tac-toe" class="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300">
                            <i class="fas fa-times text-sm"></i>
                        </button>
                    </div>
                </div>
                
                <div id="tic-tac-toe-content" class="px-6 pb-6">
                    <div id="welcome-section" class="text-center">
                        <div class="mb-6">
                            <div class="relative mb-4">
                                <div class="w-20 h-20 mx-auto bg-gradient-to-br from-[#5865f2] to-[#a855f7] rounded-full flex items-center justify-center shadow-lg">
                                    <i class="fas fa-chess-board text-2xl text-white"></i>
                                </div>
                                <div class="absolute inset-0 bg-[#5865f2] opacity-30 rounded-full blur-xl animate-pulse"></div>
                            </div>
                            <h3 class="text-xl font-bold text-white mb-3 bg-gradient-to-r from-white to-[#b9bbbe] bg-clip-text text-transparent">
                                Welcome to the Arena!
                            </h3>
                            <p class="text-[#b9bbbe] text-sm">Prepare for epic battles...</p>
                        </div>
                        
                        <div id="player-list" class="space-y-3 mb-6">
                        </div>
                        
                        <div id="game-controls" class="space-y-4">
                            <button id="ready-button" class="ready-button w-full py-3 px-6 rounded-lg font-bold text-white transition-all duration-300">
                                <span class="relative z-10">Ready for Battle</span>
                            </button>
                            <button id="play-button" class="play-button w-full py-3 px-6 rounded-lg font-bold text-white transition-all duration-300 hidden">
                                <span class="relative z-10">Enter the Arena</span>
                            </button>
                        </div>
                    </div>
                    
                    <div id="game-section" class="hidden">
                        <div id="game-info" class="text-center mb-6">
                            <div id="current-turn" class="text-[#b9bbbe] text-lg mb-4 font-semibold"></div>
                            <div id="game-players" class="flex justify-center gap-4 mb-6">
                            </div>
                        </div>
                        
                        <div class="flex justify-center mb-6">
                            <div id="game-board" class="grid grid-cols-3 gap-3 p-4 rounded-xl">
                            </div>
                        </div>
                        
                        <div id="game-result" class="text-center hidden">
                            <div id="winner-text" class="text-2xl font-bold mb-6"></div>
                            <button id="new-game-button" class="new-game-button py-3 px-8 rounded-lg font-bold text-white transition-all duration-300">
                                <span class="relative z-10">Play Again</span>
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
        let particles = '';
        for (let i = 0; i < 15; i++) {
            const delay = Math.random() * 6;
            const duration = 4 + Math.random() * 4;
            const left = Math.random() * 100;
            
            particles += `
                <div class="particle" style="
                    left: ${left}%;
                    animation-delay: ${delay}s;
                    animation-duration: ${duration}s;
                "></div>
            `;
        }
        return particles;
    }

    startParticleAnimation() {
        const container = document.querySelector('#tic-tac-toe-modal .floating-particles');
        if (!container) return;

        setInterval(() => {
            if (container.children.length < 20) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = '0s';
                particle.style.animationDuration = (4 + Math.random() * 4) + 's';
                container.appendChild(particle);

                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.remove();
                    }
                }, 8000);
            }
        }, 2000);
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
            modalContent.style.transition = 'none';
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
            modalContent.style.transition = 'none';
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
                modalContent.style.transition = '';
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
            modal.style.animation = 'modalExit 0.4s ease-in forwards';
            setTimeout(() => {
                if (window.globalSocketManager.isReady()) {
                    window.globalSocketManager.io.emit('leave-tic-tac-toe', { server_id: this.serverId });
                }
                modal.remove();
                window.activeTicTacToeModal = null;
            }, 400);
        }
    }

    updatePlayerList(players) {
        const playerList = document.getElementById('player-list');
        if (!playerList) return;
        
        playerList.innerHTML = '';
        players.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'flex items-center gap-4 p-4 rounded-lg transition-all duration-400 hover:scale-105';
            playerDiv.innerHTML = `
                <div class="relative">
                    <img src="${player.avatar_url || '/public/assets/common/default-profile-picture.png'}" 
                         alt="${player.username}" 
                         class="w-12 h-12 rounded-full border-2 border-[#5865f2] shadow-lg">
                    <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${player.ready ? 'bg-green-400' : 'bg-yellow-400'} border-2 border-[#1e2124] animate-pulse"></div>
                </div>
                <div class="flex-1 text-left">
                    <div class="text-white font-bold text-lg">${player.username}</div>
                    <div class="text-sm ${player.ready ? 'text-green-400' : 'text-yellow-400'} font-medium">
                        ${player.ready ? 'Ready to Fight!' : 'Getting Prepared...'}
                    </div>
                </div>
                <div class="text-2xl">
                    ${player.ready ? 'READY' : 'WAIT'}
                </div>
            `;
            playerList.appendChild(playerDiv);
        });
    }

    createGameBoard() {
        const gameBoard = document.getElementById('game-board');
        if (!gameBoard) return;
        
        gameBoard.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('button');
            cell.className = 'w-20 h-20 text-3xl font-bold rounded-xl transition-all duration-300 hover:scale-105 focus:outline-none border-2 border-[#5865f2] bg-gradient-to-br from-[#2c2f36] to-[#36393f]';
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
                cell.classList.add('cursor-not-allowed');
                if (value === 'X') {
                    cell.style.color = '#60a5fa';
                    cell.style.textShadow = '0 0 10px #60a5fa';
                } else {
                    cell.style.color = '#f87171';
                    cell.style.textShadow = '0 0 10px #f87171';
                }
            } else {
                cell.classList.remove('cursor-not-allowed');
                cell.style.color = '';
                cell.style.textShadow = '';
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
            winnerText.textContent = "Epic Draw!";
            winnerText.className = 'text-2xl font-bold mb-6 text-yellow-400 animate-pulse';
            this.createFireworks('yellow');
        } else if (data.winner_user_id == this.userId) {
            winnerText.textContent = 'VICTORY!';
            winnerText.className = 'text-2xl font-bold mb-6 text-green-400 animate-bounce';
            this.createFireworks('green');
            this.createConfetti();
        } else {
            const winner = this.currentGameData.players.find(p => p.user_id == data.winner_user_id);
            winnerText.textContent = `${winner ? winner.username : 'Opponent'} Wins!`;
            winnerText.className = 'text-2xl font-bold mb-6 text-red-400';
            this.createFireworks('red');
        }

        if (data.winning_positions) {
            this.highlightWinningCells(data.winning_positions);
        }
        
        this.updateGameBoard();
    }
    
    highlightWinningCells(positions) {
        const cells = document.querySelectorAll('#game-board button');
        positions.forEach((position, i) => {
            setTimeout(() => {
                if (cells[position]) {
                    cells[position].classList.add('winning-cell');
                    cells[position].style.animation = 'winningPulse 0.6s ease-in-out infinite';
                }
            }, i * 200);
        });
    }
    
    createFireworks(color) {
        const colors = {
            green: ['#10b981', '#059669', '#34d399'],
            red: ['#ef4444', '#dc2626', '#f87171'],
            yellow: ['#eab308', '#ca8a04', '#fbbf24']
        };
        
        const fireworkColors = colors[color] || colors.green;
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createSingleFirework(fireworkColors);
            }, i * 200);
        }
    }

    createSingleFirework(colors) {
        const container = document.createElement('div');
        container.className = 'fixed inset-0 pointer-events-none z-50';
        document.body.appendChild(container);

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        for (let i = 0; i < 12; i++) {
            const spark = document.createElement('div');
            spark.className = 'absolute w-2 h-2 rounded-full';
            spark.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            spark.style.left = centerX + 'px';
            spark.style.top = centerY + 'px';
            
            const angle = (i * 30) * Math.PI / 180;
            const distance = 100 + Math.random() * 100;
            const endX = centerX + Math.cos(angle) * distance;
            const endY = centerY + Math.sin(angle) * distance;
            
            spark.style.animation = `firework 0.8s ease-out forwards`;
            spark.style.setProperty('--end-x', endX + 'px');
            spark.style.setProperty('--end-y', endY + 'px');
            
            container.appendChild(spark);
        }

        setTimeout(() => {
            container.remove();
        }, 1000);
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
        const newGameButton = modal.querySelector('#new-game-button');
        
        closeButton.addEventListener('click', () => {
            if (window.globalSocketManager.isReady()) {
                window.globalSocketManager.io.emit('leave-tic-tac-toe', { server_id: this.serverId });
            }
            modal.remove();
            window.activeTicTacToeModal = null;
        });
        
        minimizeButton.addEventListener('click', () => {
            this.toggleMinimize();
        });
        
        readyButton.addEventListener('click', () => {
            const isReady = readyButton.textContent.includes('Ready for Battle');
            window.globalSocketManager.io.emit('tic-tac-toe-ready', { ready: isReady });
            if (isReady) {
                readyButton.innerHTML = '<span class="relative z-10">Cancel Ready</span>';
                readyButton.className = 'w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300';
            } else {
                readyButton.innerHTML = '<span class="relative z-10">Ready for Battle</span>';
                readyButton.className = 'ready-button w-full py-3 px-6 rounded-lg font-bold text-white transition-all duration-300';
            }
        });
        
        playButton.addEventListener('click', () => {
            document.getElementById('welcome-section').classList.add('hidden');
            document.getElementById('game-section').classList.remove('hidden');
        });
        
        newGameButton.addEventListener('click', () => {
            if (window.globalSocketManager.isReady()) {
                window.globalSocketManager.io.emit('tic-tac-toe-play-again-request', {});
                newGameButton.innerHTML = '<span class="relative z-10">Request Sent...</span>';
                newGameButton.disabled = true;
                newGameButton.className = 'w-full bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 opacity-70 cursor-not-allowed';
                
                if (window.showToast) {
                    window.showToast('Play again request sent!', 'info');
                }
            }
        });
        
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
            document.getElementById('game-result').classList.add('hidden');
            
            const playAgainRequest = document.getElementById('play-again-request');
            if (playAgainRequest) {
                playAgainRequest.remove();
            }
            
            this.resetPlayAgainButton();
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
        io.on('tic-tac-toe-play-again-request', (data) => {
            const newGameButton = document.getElementById('new-game-button');
            if (newGameButton && newGameButton.textContent.includes('Request Sent')) {
                if (window.showToast) {
                    window.showToast('Both players want to play again! Starting new game...', 'success');
                }
                newGameButton.innerHTML = '<span class="relative z-10">Starting Game...</span>';
                newGameButton.className = 'w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300';
            } else {
                this.showPlayAgainRequest(data.player);
            }
        });
        io.on('tic-tac-toe-play-again-accepted', (data) => {
            if (window.showToast) {
                window.showToast(`${data.player.username} accepted! Waiting for game start...`, 'success');
            }
        });
        io.on('tic-tac-toe-play-again-declined', (data) => {
            if (window.showToast) {
                window.showToast(`${data.player.username} declined to play again`, 'warning');
            }
            this.resetPlayAgainButton();
        });
    }

    animateMove(position) {
        const cells = document.querySelectorAll('#game-board button');
        if (cells[position]) {
            cells[position].style.transform = 'scale(1.2)';
            cells[position].style.transition = 'transform 0.2s ease';
            setTimeout(() => {
                cells[position].style.transform = 'scale(1)';
            }, 200);
        }
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

    toggleMinimize() {
        const modal = document.getElementById('tic-tac-toe-modal');
        if (!modal) return;
        
        if (this.isMinimized) {
            modal.style.display = 'flex';
            modal.className = 'fixed inset-0 flex items-center justify-center z-50';
            modal.style.width = '';
            modal.style.height = '';
            modal.style.top = '';
            modal.style.left = '';
            modal.style.background = '';
            modal.style.borderRadius = '';
            modal.style.border = '';
            
            const content = modal.querySelector('.tic-tac-toe-modal-content');
            if (content) {
                content.style.transform = '';
                content.style.width = '';
                content.style.height = '';
                content.style.position = '';
                content.style.display = '';
                content.style.alignItems = '';
                content.style.justifyContent = '';
                content.style.padding = '';
            }
            
            const minimizeBtn = modal.querySelector('#minimize-tic-tac-toe i');
            if (minimizeBtn) {
                minimizeBtn.className = 'fas fa-window-minimize';
            }
            
            this.isMinimized = false;
        } else {
            modal.style.display = 'none';
            this.isMinimized = true;
        }
    }

    showPlayAgainRequest(player) {
        const gameResult = document.getElementById('game-result');
        if (!gameResult) return;
        
        const newGameButton = document.getElementById('new-game-button');
        if (newGameButton && newGameButton.textContent.includes('Request Sent')) {
            if (window.showToast) {
                window.showToast('Both players want to play again! Game starting...', 'success');
            }
            return;
        }
        
        const existingRequest = document.getElementById('play-again-request');
        if (existingRequest) {
            existingRequest.remove();
        }
        
        const requestDiv = document.createElement('div');
        requestDiv.id = 'play-again-request';
        requestDiv.className = 'mt-6 p-4 bg-gradient-to-r from-[#1a1d23] to-[#2c2f36] rounded-lg border border-[#5865f2] text-center';
        requestDiv.innerHTML = `
            <p class="text-white text-lg mb-4 font-bold">
                ${player.username} wants to play again!
            </p>
            <div class="flex gap-3 justify-center">
                <button id="accept-play-again" class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all duration-300">
                    Accept
                </button>
                <button id="decline-play-again" class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all duration-300">
                    Decline
                </button>
            </div>
        `;
        
        gameResult.appendChild(requestDiv);
        
        document.getElementById('accept-play-again').addEventListener('click', () => {
            window.globalSocketManager.io.emit('tic-tac-toe-play-again-response', { accepted: true });
            requestDiv.remove();
            if (window.showToast) {
                window.showToast('Accepted! Starting new game...', 'success');
            }
        });
        
        document.getElementById('decline-play-again').addEventListener('click', () => {
            window.globalSocketManager.io.emit('tic-tac-toe-play-again-response', { accepted: false });
            requestDiv.remove();
            if (window.showToast) {
                window.showToast('Play again declined', 'info');
            }
        });
        
        if (window.showToast) {
            window.showToast(`${player.username} wants to play again!`, 'info');
        }
    }

    resetPlayAgainButton() {
        const newGameButton = document.getElementById('new-game-button');
        if (newGameButton) {
            newGameButton.innerHTML = '<span class="relative z-10">Play Again</span>';
            newGameButton.disabled = false;
            newGameButton.className = 'new-game-button py-3 px-8 rounded-lg font-bold text-white transition-all duration-300';
        }
    }
}

if (typeof window !== 'undefined') {
    window.TicTacToeGame = TicTacToeGame;
    window.TicTacToeModal = TicTacToeModal;
    
    window.toggleTicTacToeModal = function(serverId, userId, username) {
        if (window.activeTicTacToeModal) {
            if (window.activeTicTacToeModal.isMinimized) {
                window.activeTicTacToeModal.toggleMinimize();
            } else {
                window.activeTicTacToeModal.toggleMinimize();
            }
        } else {
            if (serverId && userId && username) {
                window.TicTacToeModal.createTicTacToeModal(serverId, userId, username);
            }
        }
    };
}
