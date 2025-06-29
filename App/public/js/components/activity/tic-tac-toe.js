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

if (typeof window !== 'undefined') {
    window.TicTacToeGame = TicTacToeGame;
}
