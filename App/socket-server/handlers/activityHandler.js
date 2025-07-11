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
            players: currentPlayers,
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
        const allPlayers = [];
        const readyPlayers = [];
        const lobbyPlayers = [];
        
        if (roomClients) {
            roomClients.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket && socket.data && socket.data.user_id) {
                    const isReady = socket.data.ticTacToeReady || false;
                    const playerData = {
                        user_id: socket.data.user_id,
                        username: socket.data.username,
                        avatar_url: socket.data.avatar_url || '/public/assets/common/default-profile-picture.png',
                        ready: isReady,
                        socketId: socketId
                    };
                    
                    allPlayers.push(playerData);
                    
                    if (isReady && !socket.data.ticTacToeInGame) {
                        readyPlayers.push(playerData);
                    }
                    
                    if (!socket.data.ticTacToeInGame) {
                        lobbyPlayers.push(playerData);
                    }
                }
            });
        }
        
        const readyCount = readyPlayers.length;
        const canStart = readyCount >= 2;
        
        io.to(roomName).emit('tic-tac-toe-ready-update', {
            player: {
                user_id: client.data.user_id,
                ready: ready
            },
            players: lobbyPlayers,
            ready_count: readyCount,
            can_start: canStart,
            lobby_count: lobbyPlayers.length
        });
        
        if (canStart) {
            const gamePlayers = readyPlayers.slice(0, 2);
            const gameRoomName = `tic-tac-toe-game-${server_id}-${Date.now()}`;
            
            const gameData = {
                players: gamePlayers.map(p => ({
                    user_id: p.user_id,
                    username: p.username,
                    avatar_url: p.avatar_url,
                    ready: true
                })),
                current_turn: gamePlayers[0].user_id,
                board: Array(9).fill(null),
                game_id: `game-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                started_at: Date.now(),
                room_name: gameRoomName
            };
            
            gamePlayers.forEach(player => {
                const socket = io.sockets.sockets.get(player.socketId);
                if (socket) {
                    socket.data.ticTacToeGameData = gameData;
                    socket.data.ticTacToeInGame = true;
                    socket.data.ticTacToeGameRoom = gameRoomName;
                    socket.join(gameRoomName);
                }
            });
            
            io.to(gameRoomName).emit('tic-tac-toe-game-start', gameData);
            
            const remainingLobbyPlayers = allPlayers.filter(p => 
                !gamePlayers.some(gp => gp.user_id === p.user_id)
            ).map(p => ({
                user_id: p.user_id,
                username: p.username,
                avatar_url: p.avatar_url,
                ready: p.ready && !gamePlayers.some(gp => gp.user_id === p.user_id)
            }));
            
            remainingLobbyPlayers.forEach(player => {
                const socket = io.sockets.sockets.get(player.socketId);
                if (socket) {
                    socket.data.ticTacToeReady = false;
                }
            });
            
            io.to(roomName).emit('tic-tac-toe-game-started-update', {
                message: `${gamePlayers[0].username} vs ${gamePlayers[1].username} started playing!`,
                players: remainingLobbyPlayers,
                game_players: gamePlayers.map(p => p.username),
                lobby_count: remainingLobbyPlayers.length
            });
        }
    }
    
    static handleTicTacToeMove(io, client, data) {
        const { position } = data;
        const server_id = client.data.ticTacToeServerId;
        const gameData = client.data.ticTacToeGameData;
        const gameRoomName = client.data.ticTacToeGameRoom;
        
        if (!server_id || !gameData || !gameRoomName) {
            client.emit('tic-tac-toe-error', { message: 'Game not found or not in a game' });
            return;
        }
        
        if (!client.data.ticTacToeInGame) {
            client.emit('tic-tac-toe-error', { message: 'You are not in an active game' });
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
        
        const gameRoomClients = io.sockets.adapter.rooms.get(gameRoomName);
        
        if (gameRoomClients) {
            gameRoomClients.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket) {
                    socket.data.ticTacToeGameData = gameData;
                }
            });
        }

        io.to(gameRoomName).emit('tic-tac-toe-move-made', {
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
                io.to(gameRoomName).emit('tic-tac-toe-game-end', {
                    board: gameData.board,
                    winner: winner,
                    is_draw: isDraw,
                    winner_user_id: winner ? gameData.players[winner === 'X' ? 0 : 1].user_id : null,
                    game_data: gameData,
                    winning_positions: winner ? this.getWinningPositions(gameData.board) : null
                });
                
                const roomName = `tic-tac-toe-server-${server_id}`;
                const remainingLobbyPlayers = [];
                
                if (gameRoomClients) {
                    gameRoomClients.forEach(socketId => {
                        const socket = io.sockets.sockets.get(socketId);
                        if (socket) {
                            socket.data.ticTacToeInGame = false;
                            socket.data.ticTacToeGameData = null;
                            socket.data.ticTacToeGameRoom = null;
                            socket.data.ticTacToeReady = false;
                            socket.leave(gameRoomName);
                            
                            remainingLobbyPlayers.push({
                                user_id: socket.data.user_id,
                                username: socket.data.username,
                                avatar_url: socket.data.avatar_url || '/public/assets/common/default-profile-picture.png',
                                ready: false
                            });
                        }
                    });
                }
                
                setTimeout(() => {
                    io.to(roomName).emit('tic-tac-toe-returned-to-lobby', {
                        players: remainingLobbyPlayers,
                        message: 'Game ended - returned to lobby',
                        lobby_count: remainingLobbyPlayers.length
                    });
                }, 2000);
            }, 800);
        }
    }
    
    static handleTicTacToeLeave(io, client, data) {
        const server_id = client.data.ticTacToeServerId;
        
        if (!server_id) return;
        
        const user_id = client.data.user_id;
        const username = client.data.username;
        const isInGame = client.data.ticTacToeInGame;
        const gameRoomName = client.data.ticTacToeGameRoom;
        
        userService.updatePresence(user_id, 'online', { type: 'idle' });
        io.emit('user-presence-update', {
            user_id: user_id,
            username: username,
            status: 'online',
            activity_details: { type: 'idle' }
        });
        
        const roomName = `tic-tac-toe-server-${server_id}`;
        
        if (isInGame && gameRoomName) {
            const gameRoomClients = io.sockets.adapter.rooms.get(gameRoomName);
            if (gameRoomClients && gameRoomClients.size > 1) {
                client.to(gameRoomName).emit('tic-tac-toe-game-abandoned', {
                    player: {
                        user_id: client.data.user_id,
                        username: client.data.username
                    },
                    reason: 'player_left'
                });
                
                gameRoomClients.forEach(socketId => {
                    const socket = io.sockets.sockets.get(socketId);
                    if (socket && socket.id !== client.id) {
                        socket.data.ticTacToeInGame = false;
                        socket.data.ticTacToeGameData = null;
                        socket.data.ticTacToeGameRoom = null;
                        socket.data.ticTacToeReady = false;
                        socket.leave(gameRoomName);
                    }
                });
            }
            client.leave(gameRoomName);
        }
        
        const roomClientsForLeave = io.sockets.adapter.rooms.get(roomName);
        const remainingPlayers = [];
        
        if (roomClientsForLeave) {
            roomClientsForLeave.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket && socket.data && socket.data.user_id && socket.id !== client.id && !socket.data.ticTacToeInGame) {
                    remainingPlayers.push({
                        user_id: socket.data.user_id,
                        username: socket.data.username,
                        avatar_url: socket.data.avatar_url || '/public/assets/common/default-profile-picture.png',
                        ready: socket.data.ticTacToeReady || false
                    });
                }
            });
        }
        
        client.to(roomName).emit('tic-tac-toe-player-left', {
            player: {
                user_id: client.data.user_id,
                username: client.data.username
            },
            players: remainingPlayers,
            lobby_count: remainingPlayers.length
        });
        
        const roomClients = io.sockets.adapter.rooms.get(roomName);
        if (roomClients && roomClients.size > 1) {
            roomClients.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket && socket.id !== client.id && !socket.data.ticTacToeInGame) {
                    socket.data.ticTacToeReady = false;
                    socket.data.ticTacToeGameData = null;
                }
            });
        }
        
        client.leave(roomName);
        client.data.ticTacToeReady = false;
        client.data.ticTacToeGameData = null;
        client.data.ticTacToeServerId = null;
        client.data.ticTacToeInGame = false;
        client.data.ticTacToeGameRoom = null;
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
}

module.exports = ActivityHandler;
