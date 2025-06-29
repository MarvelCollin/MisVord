<?php 
$userId = $_SESSION['user_id'] ?? null;
$username = $_SESSION['username'] ?? null;
$serverId = $GLOBALS['server']->id ?? $GLOBALS['currentServer']->id ?? null;
?>

<div id="tic-tac-toe-container" class="p-6 bg-[#313338] rounded-lg max-w-md mx-auto">
    <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-white mb-2 flex items-center justify-center">
            <i class="fas fa-chess-board mr-2 text-[#5865f2]"></i>
            Tic Mac Voe
        </h2>
        <p class="text-[#949ba4] text-sm">Real-time multiplayer Tic-Tac-Toe</p>
    </div>
    
    <div class="text-center">
        <div class="mb-6">
            <button id="start-tic-tac-toe-game" class="bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105 shadow-lg">
                <i class="fas fa-play mr-2"></i>
                Start Game
            </button>
        </div>
        
        <div class="mb-4">
            <p class="text-white mb-2 font-semibold">How to Play:</p>
            <ul class="text-[#949ba4] text-sm space-y-1">
                <li>• Click "Start Game" to join a game room</li>
                <li>• Wait for another player to join</li>
                <li>• Take turns placing X and O</li>
                <li>• Get 3 in a row to win!</li>
            </ul>
        </div>
        
        <div id="tic-tac-toe-status" class="text-xs text-[#949ba4] bg-[#2b2d31] p-3 rounded">
            <p>Server ID: <?php echo htmlspecialchars($serverId ?? 'Unknown'); ?></p>
            <p>User: <?php echo htmlspecialchars($username ?? 'Guest'); ?></p>
            <p id="connection-status">Connection: <span class="text-yellow-400">Checking...</span></p>
        </div>
    </div>
</div>

<div id="tic-tac-toe-fallback" class="hidden p-6 bg-[#313338] rounded-lg max-w-md mx-auto">
    <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-white mb-2">Tic Mac Voe</h2>
        <p class="text-[#949ba4] text-sm">Real-time multiplayer Tic-Tac-Toe</p>
    </div>
    
    <div class="text-center">
        <div class="mb-4">
            <i class="fas fa-chess-board text-6xl text-[#5865f2] mb-4"></i>
            <p class="text-white mb-2">Loading game...</p>
            <p class="text-[#949ba4] text-sm">Please wait while we set up the game board.</p>
        </div>
        
        <div class="loading-spinner mx-auto mb-4"></div>
        
        <div class="text-xs text-[#949ba4]">
            <p>Make sure WebSocket connection is active</p>
            <p>Server ID: <?php echo htmlspecialchars($serverId ?? 'Unknown'); ?></p>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const serverId = <?php echo json_encode($serverId); ?>;
    const userId = <?php echo json_encode($userId); ?>;
    const username = <?php echo json_encode($username); ?>;
    
    const startButton = document.getElementById('start-tic-tac-toe-game');
    const connectionStatus = document.getElementById('connection-status');
    
    function updateConnectionStatus() {
        if (window.globalSocketManager && window.globalSocketManager.isReady()) {
            connectionStatus.innerHTML = 'Connection: <span class="text-green-400">Ready</span>';
            startButton.disabled = false;
            startButton.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            connectionStatus.innerHTML = 'Connection: <span class="text-red-400">Not Ready</span>';
            startButton.disabled = true;
            startButton.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }
    
    function checkConnection() {
        updateConnectionStatus();
        setTimeout(checkConnection, 2000);
    }
    
    checkConnection();
    
    if (startButton) {
        startButton.addEventListener('click', function() {
            if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
                alert('WebSocket connection not ready. Please wait and try again.');
                return;
            }
            
            if (!serverId || !userId || !username) {
                alert('Missing required information. Please make sure you are logged in and on a server.');
                return;
            }
            
            if (window.TicTacToeModal) {
                window.TicTacToeModal.createTicTacToeModal(serverId, userId, username);
            } else {
                console.error('TicTacToeModal not found. Make sure tic-tac-toe.js is loaded.');
                showFallback();
            }
        });
    }
    
    function showFallback() {
        const container = document.getElementById('tic-tac-toe-container');
        const fallback = document.getElementById('tic-tac-toe-fallback');
        
        if (container && fallback) {
            container.classList.add('hidden');
            fallback.classList.remove('hidden');
            
            setTimeout(() => {
                fallback.classList.add('hidden');
                container.classList.remove('hidden');
            }, 5000);
        }
    }
    
    window.addEventListener('globalSocketReady', function() {
        updateConnectionStatus();
    });
    
    window.addEventListener('globalSocketDisconnected', function() {
        updateConnectionStatus();
    });
});

window.openTicTacToe = function(serverId, userId, username) {
    if (window.TicTacToeModal) {
        window.TicTacToeModal.createTicTacToeModal(serverId, userId, username);
    } else {
        console.error('TicTacToeModal not available');
    }
};
</script>
