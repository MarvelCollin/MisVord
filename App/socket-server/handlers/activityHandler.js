const roomManager = require('../services/roomManager');
const userService = require('../services/userService');

class ActivityHandler {
    static handleTicTacToeJoin(io, client, data) {
        const { server_id } = data;
        const user_id = client.data.user_id;
        const username = client.data.username;
        const avatar_url = client.data.avatar_url || '/public/assets/common/default-profile-picture.png';
        
        if (!server_id || !user_id) {
            client.emit('tic-tac-toe-error', { message: 'Missing server_id or user authentication' });
            return;
        }
        
        userService.updatePresence(user_id, 'online', { type: 'playing Tic Tac Toe' });
        io.emit('user-presence-update', {
            user_id: user_id,
            username: username,
            status: 'online',
            activity_details: { type: 'playing Tic Tac Toe' }
        });
        
        const roomName = `tic-tac-toe-server-${server_id}`;
        
        client.join(roomName);
        
        const roomClients = io.sockets.adapter.rooms.get(roomName);
        const currentPlayers = [];
        
        if (roomClients) {
            roomClients.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket && socket.data && socket.data.user_id) {
                    currentPlayers.push({
                        user_id: socket.data.user_id,
                        username: socket.data.username,
                        avatar_url: socket.data.avatar_url || '/public/assets/common/default-profile-picture.png',
                        ready: socket.data.ticTacToeReady || false
                    });
                }
            });
        }
        
        client.data.ticTacToeReady = false;
        client.data.ticTacToeServerId = server_id;
        
        client.emit('tic-tac-toe-joined', {
            players: currentPlayers,
            room_name: roomName
        });
        
        client.to(roomName).emit('tic-tac-toe-player-joined', {
            player: {
                user_id: user_id,
                username: username,
                avatar_url: avatar_url,
                ready: false
            },
            total_players: currentPlayers.length
        });
    }
    
    static handleTicTacToeReady(io, client, data) {
        const { ready } = data;
        const server_id = client.data.ticTacToeServerId;
        
        if (!server_id) {
            client.emit('tic-tac-toe-error', { message: 'Not in a tic-tac-toe room' });
            return;
        }
        
        const roomName = `tic-tac-toe-server-${server_id}`;
        client.data.ticTacToeReady = ready;
        
        const roomClients = io.sockets.adapter.rooms.get(roomName);
        const players = [];
        let readyCount = 0;
        
        if (roomClients) {
            roomClients.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket && socket.data && socket.data.user_id) {
                    const isReady = socket.data.ticTacToeReady || false;
                    players.push({
                        user_id: socket.data.user_id,
                        username: socket.data.username,
                        avatar_url: socket.data.avatar_url || '/public/assets/common/default-profile-picture.png',
                        ready: isReady
                    });
                    if (isReady) readyCount++;
                }
            });
        }
        
        io.to(roomName).emit('tic-tac-toe-ready-update', {
            player: {
                user_id: client.data.user_id,
                ready: ready
            },
            players: players,
            ready_count: readyCount,
            can_start: readyCount === 2 && players.length === 2
        });
        
        if (readyCount === 2 && players.length === 2) {
            const gameData = {
                players: players,
                current_turn: players[0].user_id,
                board: Array(9).fill(null),
                game_id: `game-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                started_at: Date.now()
            };
            
            roomClients.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket) {
                    socket.data.ticTacToeGameData = gameData;
                }
            });
            
            io.to(roomName).emit('tic-tac-toe-game-start', gameData);
        }
    }
    
    static handleTicTacToeMove(io, client, data) {
        const { position } = data;
        const server_id = client.data.ticTacToeServerId;
        const gameData = client.data.ticTacToeGameData;
        
        if (!server_id || !gameData) {
            client.emit('tic-tac-toe-error', { message: 'Game not found' });
            return;
        }
        
        if (gameData.current_turn !== client.data.user_id) {
            client.emit('tic-tac-toe-error', { message: 'Not your turn' });
            return;
        }
        
        if (position < 0 || position > 8 || gameData.board[position] !== null) {
            client.emit('tic-tac-toe-error', { message: 'Invalid move' });
            return;
        }
        
        const playerIndex = gameData.players.findIndex(p => p.user_id === client.data.user_id);
        const symbol = playerIndex === 0 ? 'X' : 'O';
        
        gameData.board[position] = symbol;
        gameData.current_turn = gameData.players[1 - playerIndex].user_id;
        
        const roomName = `tic-tac-toe-server-${server_id}`;
        const roomClients = io.sockets.adapter.rooms.get(roomName);
        
        if (roomClients) {
            roomClients.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket) {
                    socket.data.ticTacToeGameData = gameData;
                }
            });
        }

        io.to(roomName).emit('tic-tac-toe-move-made', {
            position: position,
            symbol: symbol,
            board: gameData.board,
            current_turn: gameData.current_turn,
            player: {
                user_id: client.data.user_id,
                username: client.data.username
            }
        });
        
        const winner = this.checkWinner(gameData.board);
        const isDraw = !winner && gameData.board.every(cell => cell !== null);
        
        if (winner || isDraw) {
            gameData.finished = true;
            gameData.winner = winner;
            gameData.is_draw = isDraw;
            gameData.finished_at = Date.now();
            
            setTimeout(() => {
                io.to(roomName).emit('tic-tac-toe-game-end', {
                    board: gameData.board,
                    winner: winner,
                    is_draw: isDraw,
                    winner_user_id: winner ? gameData.players[winner === 'X' ? 0 : 1].user_id : null,
                    game_data: gameData,
                    winning_positions: winner ? this.getWinningPositions(gameData.board) : null
                });
                
                if (roomClients) {
                    roomClients.forEach(socketId => {
                        const socket = io.sockets.sockets.get(socketId);
                        if (socket) {
                            socket.data.ticTacToeReady = false;
                            socket.data.ticTacToeGameData = null;
                        }
                    });
                }
            }, 800);
        }
    }
    
    static handleTicTacToeLeave(io, client, data) {
        const server_id = client.data.ticTacToeServerId;
        
        if (!server_id) return;
        
        const user_id = client.data.user_id;
        const username = client.data.username;
        
        userService.updatePresence(user_id, 'online', { type: 'idle' });
        io.emit('user-presence-update', {
            user_id: user_id,
            username: username,
            status: 'online',
            activity_details: { type: 'idle' }
        });
        
        const roomName = `tic-tac-toe-server-${server_id}`;
        
        client.to(roomName).emit('tic-tac-toe-player-left', {
            player: {
                user_id: client.data.user_id,
                username: client.data.username
            }
        });
        
        const roomClients = io.sockets.adapter.rooms.get(roomName);
        if (roomClients && roomClients.size > 1) {
            roomClients.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket && socket.id !== client.id) {
                    socket.data.ticTacToeReady = false;
                    socket.data.ticTacToeGameData = null;
                }
            });
            
            client.to(roomName).emit('tic-tac-toe-game-reset', {
                reason: 'player_left'
            });
        }
        
        client.leave(roomName);
        client.data.ticTacToeReady = false;
        client.data.ticTacToeGameData = null;
        client.data.ticTacToeServerId = null;
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

    static getWinningPositions(board) {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        
        for (let line of lines) {
            const [a, b, c] = line;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return line;
            }
        }
        
        return null;
    }

    static handleTicTacToePlayAgainRequest(io, client, data) {
        const server_id = client.data.ticTacToeServerId;
        
        if (!server_id) {
            client.emit('tic-tac-toe-error', { message: 'Not in a tic-tac-toe room' });
            return;
        }
        
        const roomName = `tic-tac-toe-server-${server_id}`;
        const roomClients = io.sockets.adapter.rooms.get(roomName);
        
        if (!roomClients || roomClients.size !== 2) {
            client.emit('tic-tac-toe-error', { message: 'Need exactly 2 players for play again' });
            return;
        }
        

        
        client.data.ticTacToePlayAgainRequest = true;
        
        const players = [];
        const playAgainRequests = [];
        
        roomClients.forEach(socketId => {
            const socket = io.sockets.sockets.get(socketId);
            if (socket && socket.data && socket.data.user_id) {
                players.push({
                    user_id: socket.data.user_id,
                    username: socket.data.username,
                    avatar_url: socket.data.avatar_url || '/public/assets/common/default-profile-picture.png',
                    ready: true
                });
                
                const hasRequest = socket.data.ticTacToePlayAgainRequest || false;
                playAgainRequests.push(hasRequest);

            }
        });
        
        const bothWantPlayAgain = playAgainRequests.every(request => request === true);

        
        if (bothWantPlayAgain) {

            
            const gameData = {
                players: players,
                current_turn: players[Math.floor(Math.random() * 2)].user_id,
                board: Array(9).fill(null),
                game_id: `game-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                started_at: Date.now()
            };
            
            roomClients.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket) {
                    socket.data.ticTacToeGameData = gameData;
                    socket.data.ticTacToePlayAgainRequest = false;
                    socket.data.ticTacToeReady = true;
                }
            });
            

            io.to(roomName).emit('tic-tac-toe-game-start', gameData);
        } else {

            client.to(roomName).emit('tic-tac-toe-play-again-request', {
                player: {
                    user_id: client.data.user_id,
                    username: client.data.username
                }
            });
        }
    }

    static handleTicTacToePlayAgainResponse(io, client, data) {
        const { accepted } = data;
        const server_id = client.data.ticTacToeServerId;
        
        if (!server_id) {
            client.emit('tic-tac-toe-error', { message: 'Not in a tic-tac-toe room' });
            return;
        }
        
        const roomName = `tic-tac-toe-server-${server_id}`;
        const roomClients = io.sockets.adapter.rooms.get(roomName);
        
        if (!roomClients || roomClients.size !== 2) {
            client.emit('tic-tac-toe-error', { message: 'Need exactly 2 players for play again' });
            return;
        }
        
        if (accepted) {
            const players = [];
            let bothWantPlayAgain = true;
            
            roomClients.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket && socket.data && socket.data.user_id) {
                    players.push({
                        user_id: socket.data.user_id,
                        username: socket.data.username,
                        avatar_url: socket.data.avatar_url || '/public/assets/common/default-profile-picture.png',
                        ready: true
                    });
                    
                    if (!socket.data.ticTacToePlayAgainRequest && socket.id !== client.id) {
                        bothWantPlayAgain = false;
                    }
                    
                    socket.data.ticTacToeReady = true;
                    socket.data.ticTacToeGameData = null;
                    socket.data.ticTacToePlayAgainRequest = false;
                }
            });
            
            if (bothWantPlayAgain) {
                const gameData = {
                    players: players,
                    current_turn: players[Math.floor(Math.random() * 2)].user_id,
                    board: Array(9).fill(null),
                    game_id: `game-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    started_at: Date.now()
                };
                
                roomClients.forEach(socketId => {
                    const socket = io.sockets.sockets.get(socketId);
                    if (socket) {
                        socket.data.ticTacToeGameData = gameData;
                    }
                });
                
                io.to(roomName).emit('tic-tac-toe-game-start', gameData);
            } else {
                io.to(roomName).emit('tic-tac-toe-play-again-accepted', {
                    player: {
                        user_id: client.data.user_id,
                        username: client.data.username
                    }
                });
            }
        } else {
            roomClients.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket) {
                    socket.data.ticTacToePlayAgainRequest = false;
                }
            });
            
            io.to(roomName).emit('tic-tac-toe-play-again-declined', {
                player: {
                    user_id: client.data.user_id,
                    username: client.data.username
                }
            });
        }
    }
}

module.exports = ActivityHandler;
