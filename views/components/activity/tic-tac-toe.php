<?php 
$userId = $_SESSION['user_id'] ?? null;
$username = $_SESSION['username'] ?? null;
$serverId = $GLOBALS['server']->id ?? $GLOBALS['currentServer']->id ?? null;
?>

<link rel="stylesheet" href="/css/tic-tac-toe.css">

<div id="tic-tac-toe-container" class="relative p-8 rounded-2xl max-w-lg mx-auto">
    <div class="relative z-10">
        <div class="text-center mb-8">
            <h2 class="tic-tac-toe-title text-4xl font-bold mb-4">
                Tic Mac Voe
            </h2>
            <p class="text-lg font-bold tracking-wider text-gray-200">
                GAME ARENA
            </p>
            <div class="w-32 h-1 mx-auto mt-4 bg-[#5865f2]"></div>
        </div>
        
        <div class="text-center">
            <div class="mb-8">
                <button id="start-tic-tac-toe-game" class="relative py-4 px-8 rounded-xl font-bold text-white text-lg tracking-wider shadow-2xl bg-[#5865f2] hover:bg-[#4752c4] transition-all duration-200">
                    <span class="relative z-10 flex items-center justify-center">
                        <i class="fas fa-gamepad mr-3 text-xl"></i>
                        START GAME
                        <i class="fas fa-gamepad ml-3 text-xl"></i>
                    </span>
                </button>
            </div>
            
            <div class="mb-6 border border-[#5865f2] rounded-xl">
                <div class="bg-[#36393f] p-6 rounded-xl">
                    <p class="text-[#5865f2] mb-4 font-bold text-xl flex items-center justify-center">
                        <i class="fas fa-info-circle mr-3"></i>
                        HOW TO PLAY
                    </p>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between p-3 bg-[#2f3136] rounded-lg border border-[#5865f2]/30">
                            <span class="text-sm">START GAME</span>
                            <span class="text-[#5865f2] text-xs">CLICK START</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-[#2f3136] rounded-lg border border-[#5865f2]/30">
                            <span class="text-sm">WAIT FOR OPPONENT</span>
                            <span class="text-[#5865f2] text-xs">GET READY</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-[#2f3136] rounded-lg border border-[#5865f2]/30">
                            <span class="text-sm">MAKE YOUR MOVES</span>
                            <span class="text-[#5865f2] text-xs">PLAY</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-[#2f3136] rounded-lg border border-[#5865f2]/30">
                            <span class="text-sm">WIN THE GAME</span>
                            <span class="text-[#5865f2] text-xs">VICTORY</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="tic-tac-toe-status" class="border border-[#5865f2] rounded-xl">
                <div class="bg-[#36393f] p-6 rounded-xl text-xs">
                    <div class="grid grid-cols-1 gap-4">
                        <div class="flex items-center justify-between p-3 bg-[#2f3136] rounded-lg border-l-4 border-[#5865f2]">
                            <span class="text-[#5865f2]">SERVER:</span>
                            <span class="font-mono bg-[#202225] px-3 py-1 rounded text-white text-xs">
                                <?php echo htmlspecialchars($serverId ?? 'UNKNOWN'); ?>
                            </span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-[#2f3136] rounded-lg border-l-4 border-[#5865f2]">
                            <span class="text-[#5865f2]">PLAYER:</span>
                            <span class="text-white font-bold">
                                <?php echo htmlspecialchars($username ?? 'GUEST'); ?>
                            </span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-[#2f3136] rounded-lg border-l-4 border-[#5865f2]">
                            <span class="text-[#5865f2]">STATUS:</span>
                            <span id="connection-status" class="flex items-center">
                                <div class="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                                <span class="text-yellow-400 font-bold">CONNECTING...</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
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
            connectionStatus.innerHTML = `
                <div class="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                <span class="text-green-400 font-bold">ONLINE</span>
            `;
            startButton.disabled = false;
            startButton.classList.remove('opacity-50', 'cursor-not-allowed');
            startButton.classList.add('hover:bg-[#4752c4]');
        } else {
            connectionStatus.innerHTML = `
                <div class="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                <span class="text-red-400 font-bold">OFFLINE</span>
            `;
            startButton.disabled = true;
            startButton.classList.add('opacity-50', 'cursor-not-allowed');
            startButton.classList.remove('hover:bg-[#4752c4]');
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
                if (window.showToast) {
                    window.showToast('Connection not ready. Please wait and try again.', 'error');
                } else {
                    alert('Connection not ready. Please wait and try again.');
                }
                return;
            }
            
            if (!serverId || !userId || !username) {
                if (window.showToast) {
                    window.showToast('Authentication required. Please make sure you are logged in.', 'error');
                } else {
                    alert('Authentication required. Please make sure you are logged in.');
                }
                return;
            }
            
            startButton.innerHTML = `
                <span class="relative z-10 flex items-center justify-center">
                    <div class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    LOADING...
                </span>
            `;
            startButton.disabled = true;
            
            setTimeout(() => {
                if (window.TicTacToeModal) {
                    window.TicTacToeModal.createTicTacToeModal(serverId, userId, username);
                    startButton.innerHTML = `
                        <span class="relative z-10 flex items-center justify-center">
                            <i class="fas fa-gamepad mr-3 text-xl"></i>
                            START GAME
                            <i class="fas fa-gamepad ml-3 text-xl"></i>
                        </span>
                    `;
                    startButton.disabled = false;
                } else {
                    console.error('TicTacToeModal not found. Make sure tic-tac-toe.js is loaded.');
                }
            }, 1000);
        });
    }
    
    window.addEventListener('globalSocketReady', function() {
        updateConnectionStatus();
        if (window.showToast) {
            window.showToast('Connection established!', 'success');
        }
    });
    
    window.addEventListener('globalSocketDisconnected', function() {
        updateConnectionStatus();
        if (window.showToast) {
            window.showToast('Connection lost. Reconnecting...', 'warning');
        }
    });
});

window.openTicTacToe = function(serverId, userId, username) {
    if (window.TicTacToeModal) {
        window.TicTacToeModal.createTicTacToeModal(serverId, userId, username);
    } else {
        console.error('TicTacToeModal not available');
        if (window.showToast) {
            window.showToast('Game component not loaded. Please refresh the page.', 'error');
        }
    }
};
</script>
