<?php
if (!isset($currentServer) || empty($currentServer)) {
    return;
}

$currentServerId = $currentServer->id ?? 0;
$members = $GLOBALS['serverMembers'] ?? [];

$totalMemberCount = count($members);

$roleGroups = [
    'owner' => [],
    'admin' => [],
    'bot' => [],
    'member' => [],
    'offline' => []
];

foreach ($members as $member) {
    $role = $member['role'] ?? 'member';
    $isBot = isset($member['status']) && $member['status'] === 'bot';
    $isOffline = $member['status'] === 'offline' || $member['status'] === 'invisible';
    
    if ($isBot) {
        $roleGroups['bot'][] = $member;
        continue;
    }
    
    if ($isOffline) {
        $roleGroups['offline'][] = $member;
        continue;
    }
    
    if ($role === 'owner') {
        $roleGroups['owner'][] = $member;
    } else if ($role === 'admin') {
        $roleGroups['admin'][] = $member;
    } else {
        $roleGroups['member'][] = $member;
    }
}
?>

<div class="w-60 bg-discord-dark border-l border-gray-800 flex flex-col h-full max-h-screen">
    <div class="h-12 border-b border-gray-800 flex items-center px-4">
        <input type="text" placeholder="Search" class="w-full bg-black bg-opacity-30 text-white text-sm rounded px-2 py-1 focus:outline-none">
    </div>
    
    <div class="border-b border-gray-800 p-3">
        <button id="temp-tic-tac-toe-button" class="flex items-center gap-2 w-full px-3 py-2 rounded-md text-[#949ba4] hover:text-white hover:bg-[#404249] transition-colors duration-200 bg-[#5865f2] hover:bg-[#4752c4]">
            <i class="fas fa-chess-board text-lg"></i>
            <span class="font-medium text-white">Tic Mac Voe</span>
        </button>
    </div>
    
    <div class="participant-content flex-1 overflow-y-auto p-2" data-lazyload="participant-list">
        <div class="px-2">
            <?php 
            $roleDisplayOrder = ['owner', 'admin', 'bot', 'member', 'offline'];
            foreach ($roleDisplayOrder as $role):
                $roleMembers = $roleGroups[$role];
                if (empty($roleMembers)) continue;
                
                $roleDisplay = match($role) {
                    'offline' => 'Offline',
                    'bot' => 'Bots',
                    default => ucfirst($role)
                };
                
                $roleColor = match($role) {
                    'owner' => 'text-yellow-500',
                    'admin' => 'text-red-500',
                    'bot' => 'text-blue-500',
                    'offline' => 'text-gray-500',
                    default => 'text-gray-400'
                };
            ?>
                <div class="mb-4 role-group" data-role="<?php echo $role; ?>">
                    <h4 class="text-xs font-semibold <?php echo $roleColor; ?> uppercase py-1">
                        <?php echo $roleDisplay; ?> — <span class="role-count"><?php echo count($roleMembers); ?></span>
                    </h4>
                    <div class="space-y-0.5 members-list">
                        <?php foreach ($roleMembers as $member):
                            $statusColor = 'bg-gray-500';
                            
                            switch ($member['status']) {
                                case 'appear':
                                case 'online':
                                    $statusColor = 'bg-discord-green';
                                    break;
                                case 'invisible':
                                    $statusColor = 'bg-gray-500';
                                    break;
                                case 'do_not_disturb':
                                    $statusColor = 'bg-discord-red';
                                    break;
                                case 'offline':
                                    $statusColor = 'bg-[#747f8d]';
                                    break;
                                case 'bot':
                                    $statusColor = 'bg-blue-500';
                                    break;
                                case 'banned':
                                    $statusColor = 'bg-black';
                                    break;
                                default:
                                    $statusColor = 'bg-discord-green';
                            }
                            
                            $isOffline = $member['status'] === 'offline' || $member['status'] === 'invisible';
                            
                            $textColorClass = match($role) {
                                'owner' => $isOffline ? 'text-yellow-700' : 'text-yellow-400',
                                'admin' => $isOffline ? 'text-red-700' : 'text-red-400',
                                'bot' => 'text-blue-400',
                                'offline' => 'text-gray-500',
                                default => $isOffline ? 'text-gray-500' : 'text-gray-300'
                            };
                            
                            $imgOpacityClass = $isOffline ? 'opacity-70' : '';
                        ?>
                            <div class="flex items-center px-2 py-1 rounded hover:bg-discord-light group cursor-pointer user-profile-trigger" 
                                 data-user-id="<?php echo isset($member['id']) ? $member['id'] : '0'; ?>" 
                                 data-server-id="<?php echo $currentServerId; ?>"
                                 data-role="<?php echo $member['role'] ?? 'member'; ?>"
                                 data-status="<?php echo $member['status'] ?? 'offline'; ?>">
                                <div class="relative mr-2">
                                    <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                                        <?php
                                        $avatarUrl = $member['avatar_url'] ?? '';
                                        $username = $member['display_name'] ?? $member['username'] ?? 'User';
                                        
                                        if (!empty($avatarUrl)) {
                                            echo '<img src="' . htmlspecialchars($avatarUrl) . '" alt="Avatar" class="w-full h-full object-cover ' . $imgOpacityClass . '">';
                                        } else {
                                            echo '<div class="w-full h-full flex items-center justify-center bg-discord-dark text-white font-bold">' . strtoupper(substr($username, 0, 1)) . '</div>';
                                        }
                                        ?>
                                    </div>
                                    <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark <?php echo $statusColor; ?> status-indicator"></span>
                                </div>
                                <span class="<?php echo $textColorClass; ?> text-sm truncate font-bold"><?php echo htmlspecialchars($member['nickname'] ?? $member['display_name'] ?? $member['username'] ?? 'Unknown'); ?></span>
                                <?php if ($member['status'] === 'bot'): ?>
                                    <span class="ml-1 px-1 py-0.5 text-[10px] bg-blue-500 text-white rounded">BOT</span>
                                <?php endif; ?>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</div>

<script>
const SOCKET_URL = window.SOCKET_URL || 'http://localhost:1002';
const ENABLE_USER_SECTION_MOVEMENT = false;
window.ENABLE_USER_SECTION_MOVEMENT = ENABLE_USER_SECTION_MOVEMENT;

let socketConnectionStatus = 'disconnected';
let lastSocketEvent = null;

function loadSocketIO(callback) {
    if (window.io) {
        callback();
        return;
    }
    
    const socketScript = document.createElement('script');
    socketScript.src = SOCKET_URL + '/socket.io/socket.io.js';
    socketScript.async = true;
    socketScript.onload = callback;
    socketScript.onerror = function() {
        console.error('Failed to load Socket.io client');
    };
    document.head.appendChild(socketScript);
}

document.addEventListener('DOMContentLoaded', function() {
    const participantContainer = document.querySelector('[data-lazyload="participant-list"]');
    if (participantContainer) {
        if (window.LazyLoader && typeof window.LazyLoader.triggerDataLoaded === 'function') {
            const isEmpty = <?php echo empty($members) ? 'true' : 'false'; ?>;
            window.LazyLoader.triggerDataLoaded('participant-list', isEmpty);
        }
    }
    
    loadSocketIO(initializeSocketConnection);
    initializeParticipantHover();
    initializeTempTicTacToeButton();
});

function initializeTempTicTacToeButton() {
    const tempButton = document.getElementById('temp-tic-tac-toe-button');
    if (tempButton) {
        tempButton.addEventListener('click', function() {
            if (window.activityManager) {
                window.activityManager.openTicTacToe();
            } else {
                setTimeout(() => {
                    if (window.activityManager) {
                        window.activityManager.openTicTacToe();
                    } else {
                        createTempTicTacToeModal();
                    }
                }, 1000);
            }
        });
    }
}

function createTempTicTacToeModal() {
    if (document.getElementById('tic-tac-toe-modal')) return;
    
    const serverId = <?php echo $currentServerId; ?>;
    const userId = <?php echo $_SESSION['user_id'] ?? 0; ?>;
    const username = '<?php echo $_SESSION['username'] ?? 'Unknown'; ?>';
    
    if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
        alert('WebSocket connection not ready. Please wait and try again.');
        return;
    }
    
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
    
    const closeButton = modal.querySelector('#close-tic-tac-toe');
    const readyButton = modal.querySelector('#ready-button');
    const playButton = modal.querySelector('#play-button');
    const newGameButton = modal.querySelector('#new-game-button');
    
    closeButton.addEventListener('click', () => {
        if (window.globalSocketManager.isReady()) {
            window.globalSocketManager.io.emit('leave-tic-tac-toe', { server_id: serverId });
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
        createGameBoard();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (window.globalSocketManager.isReady()) {
                window.globalSocketManager.io.emit('leave-tic-tac-toe', { server_id: serverId });
            }
            modal.remove();
        }
    });
    
    window.globalSocketManager.io.emit('join-tic-tac-toe', { server_id: serverId });
    
    const io = window.globalSocketManager.io;
    
    io.on('tic-tac-toe-joined', (data) => updatePlayerList(data.players));
    io.on('tic-tac-toe-player-joined', (data) => updatePlayerList([data.player]));
    io.on('tic-tac-toe-ready-update', (data) => {
        updatePlayerList(data.players);
        if (data.can_start) {
            playButton.classList.remove('hidden');
        } else {
            playButton.classList.add('hidden');
        }
    });
    io.on('tic-tac-toe-game-start', (data) => {
        window.currentGameData = data;
        document.getElementById('welcome-section').classList.add('hidden');
        document.getElementById('game-section').classList.remove('hidden');
        updateGameInfo();
        createGameBoard();
    });
    io.on('tic-tac-toe-move-made', (data) => {
        window.currentGameData.board = data.board;
        window.currentGameData.current_turn = data.current_turn;
        updateGameBoard();
        updateGameInfo();
    });
    io.on('tic-tac-toe-game-end', (data) => {
        showGameResult(data);
    });
    io.on('tic-tac-toe-error', (data) => {
        alert('Error: ' + data.message);
    });
}

function updatePlayerList(players) {
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

function updateGameInfo() {
    if (!window.currentGameData) return;
    
    const currentTurn = document.getElementById('current-turn');
    const gamePlayers = document.getElementById('game-players');
    const userId = <?php echo $_SESSION['user_id'] ?? 0; ?>;
    
    const currentPlayer = window.currentGameData.players.find(p => p.user_id == window.currentGameData.current_turn);
    const isMyTurn = window.currentGameData.current_turn == userId;
    
    if (currentTurn) {
        currentTurn.textContent = isMyTurn ? 'Your turn' : `${currentPlayer ? currentPlayer.username : 'Unknown'}'s turn`;
        currentTurn.className = isMyTurn ? 'text-green-400 text-sm mb-2 font-semibold' : 'text-[#949ba4] text-sm mb-2';
    }
    
    if (gamePlayers) {
        gamePlayers.innerHTML = '';
        window.currentGameData.players.forEach((player, index) => {
            const symbol = index === 0 ? 'X' : 'O';
            const isCurrentTurn = player.user_id == window.currentGameData.current_turn;
            
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

function createGameBoard() {
    const gameBoard = document.getElementById('game-board');
    if (!gameBoard) return;
    
    gameBoard.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('button');
        cell.className = 'w-16 h-16 bg-[#2b2d31] hover:bg-[#404249] text-white text-2xl font-bold rounded-md transition-colors duration-200';
        cell.addEventListener('click', () => makeMove(i));
        gameBoard.appendChild(cell);
    }
    updateGameBoard();
}

function updateGameBoard() {
    if (!window.currentGameData) return;
    
    const cells = document.querySelectorAll('#game-board button');
    cells.forEach((cell, index) => {
        const value = window.currentGameData.board[index];
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

function makeMove(position) {
    const userId = <?php echo $_SESSION['user_id'] ?? 0; ?>;
    
    if (!window.currentGameData || window.currentGameData.current_turn != userId) {
        alert('Not your turn!');
        return;
    }
    
    if (window.currentGameData.board[position] !== null) {
        alert('Invalid move!');
        return;
    }
    
    window.globalSocketManager.io.emit('tic-tac-toe-move', { position: position });
}

function showGameResult(data) {
    const gameResult = document.getElementById('game-result');
    const winnerText = document.getElementById('winner-text');
    const userId = <?php echo $_SESSION['user_id'] ?? 0; ?>;
    
    if (gameResult) gameResult.classList.remove('hidden');
    
    if (data.is_draw) {
        winnerText.textContent = "It's a draw!";
        winnerText.className = 'text-xl font-bold mb-4 text-yellow-400';
    } else if (data.winner_user_id == userId) {
        winnerText.textContent = 'You won! 🎉';
        winnerText.className = 'text-xl font-bold mb-4 text-green-400';
    } else {
        const winner = window.currentGameData.players.find(p => p.user_id == data.winner_user_id);
        winnerText.textContent = `${winner ? winner.username : 'Unknown'} won!`;
        winnerText.className = 'text-xl font-bold mb-4 text-red-400';
    }
    
    updateGameBoard();
}

function initializeParticipantHover() {
    const participantItems = document.querySelectorAll('.participant-content .user-profile-trigger');
    
    participantItems.forEach(item => {
        item.addEventListener('mouseover', function() {
            this.classList.add('bg-discord-light');
        });
        
        item.addEventListener('mouseout', function() {
            this.classList.remove('bg-discord-light');
        });
    });
}

function initializeSocketConnection() {
    if (!window.io) {
        console.warn('Socket.io not loaded');
        return;
    }
    
    const serverId = <?php echo $currentServerId; ?>;
    const currentUserId = <?php echo $_SESSION['user_id'] ?? 0; ?>;
    
    try {
        const socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
        
        socket.on('connect', function() {
            console.log('Socket connected for participant list');
            socketConnectionStatus = 'connected';
            
            socket.emit('authenticate', {
                user_id: currentUserId,
                username: '<?php echo $_SESSION['username'] ?? 'Unknown'; ?>'
            });
            
            socket.emit('get-online-users');
        });
        
        socket.on('online-users-response', function(data) {
            console.log(`Received online users: ${Object.keys(data.users || {}).length} users`);
            lastSocketEvent = {type: 'online-users-response', timestamp: Date.now()};
            updateOnlineStatus(data.users);
        });
        
        socket.on('user-presence-update', function(data) {
            console.log(`User presence update: ${data.userId} => ${data.status}`);
            lastSocketEvent = {type: 'user-presence-update', userId: data.userId, status: data.status, timestamp: Date.now()};
            updateUserStatus(data.userId, data.status);
        });
        
        socket.on('user-offline', function(data) {
            console.log(`User went offline: ${data.userId}`);
            lastSocketEvent = {type: 'user-offline', userId: data.userId, timestamp: Date.now()};
            updateUserStatus(data.userId, 'offline');
        });
        
        socket.on('disconnect', function() {
            console.log('Socket disconnected from participant list');
            socketConnectionStatus = 'disconnected';
        });
        
        socket.on('error', function(error) {
            console.error('Socket error:', error);
            socketConnectionStatus = 'error';
        });
        
        socket.on('connect_error', function(error) {
            console.error('Socket connection error:', error);
            socketConnectionStatus = 'connection_error';
        });
        
        window.participantSocket = socket;
        window.getSocketStatus = function() {
            return {
                connectionStatus: socketConnectionStatus,
                lastEvent: lastSocketEvent,
                connectedAt: socket.connected ? new Date(socket.connectTime) : null
            };
        };
        
    } catch (error) {
        console.error('Error connecting to socket:', error);
    }
}

function updateOnlineStatus(onlineUsers) {
    if (!onlineUsers) return;
    
    Object.keys(onlineUsers).forEach(userId => {
        updateUserStatus(userId, onlineUsers[userId].status || 'online');
    });
}

function updateUserStatus(userId, status) {
    const userElement = document.querySelector(`.user-profile-trigger[data-user-id="${userId}"]`);
    if (!userElement) return;
    
    const isOffline = status === 'offline' || status === 'invisible';
    const currentRole = userElement.getAttribute('data-role');
    const currentStatus = userElement.getAttribute('data-status');
    
    if ((isOffline && currentStatus !== 'offline') || (!isOffline && currentStatus === 'offline')) {
        moveUserToSection(userElement, isOffline ? 'offline' : currentRole);
    }
    
    const statusIndicator = userElement.querySelector('.status-indicator');
    if (statusIndicator) {
        const statusClass = getStatusClass(status);
        statusIndicator.classList.remove('bg-discord-green', 'bg-discord-yellow', 'bg-discord-red', 'bg-gray-500', 'bg-[#747f8d]');
        statusIndicator.classList.add(statusClass);
    }
    
    const userNameElement = userElement.querySelector('.text-sm');
    const userImage = userElement.querySelector('img');
    
    if (userNameElement) {
        if (isOffline) {
            userNameElement.classList.remove('text-gray-300');
            userNameElement.classList.add('text-gray-500');
            userImage?.classList.add('opacity-70');
        } else {
            userNameElement.classList.remove('text-gray-500');
            userNameElement.classList.add('text-gray-300');
            userImage?.classList.remove('opacity-70');
        }
    }
    
    userElement.setAttribute('data-status', status);
}

function moveUserToSection(userElement, targetRole) {
    const targetSection = document.querySelector(`.role-group[data-role="${targetRole}"]`);
    const sourceSection = userElement.closest('.role-group');
    
    if (targetSection && sourceSection) {
        const membersList = targetSection.querySelector('.members-list');
        if (membersList) {
            membersList.appendChild(userElement);
            
            updateRoleCount(sourceSection);
            updateRoleCount(targetSection);
            
            if (sourceSection.querySelector('.members-list').children.length === 0) {
                sourceSection.style.display = 'none';
            }
            targetSection.style.display = 'block';
        }
    }
}

function updateRoleCount(section) {
    const countElement = section.querySelector('.role-count');
    const membersList = section.querySelector('.members-list');
    if (countElement && membersList) {
        countElement.textContent = membersList.children.length;
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'online':
        case 'appear':
            return 'bg-discord-green';
        case 'idle':
            return 'bg-discord-yellow';
        case 'do_not_disturb':
            return 'bg-discord-red';
        case 'invisible':
        case 'offline':
        default:
            return 'bg-[#747f8d]';
    }
}

window.initializeParticipantSection = function() {
    console.log('Initializing participant section');
    
    loadSocketIO(initializeSocketConnection);
    initializeParticipantHover();
};

window.toggleParticipantLoading = function(loading = true) {
    console.log('Participant loading toggle called but using simple DOM - no skeleton');
};
</script>
