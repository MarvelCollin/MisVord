<?php 
$userId = $_SESSION['user_id'] ?? null;
$username = $_SESSION['username'] ?? null;
$serverId = $GLOBALS['server']->id ?? $GLOBALS['currentServer']->id ?? null;
?>

<link rel="stylesheet" href="/css/tic-tac-toe.css">

<div id="tic-tac-toe-container" class="relative p-8 rounded-2xl max-w-lg mx-auto cyber-grid hologram-effect">
    <div class="energy-orb"></div>
    
    <div class="relative z-10">
        <div class="text-center mb-8">
            <div class="portal-effect mx-auto mb-6"></div>
            
            <h2 class="tic-tac-toe-title text-4xl font-bold mb-4 neon-text">
                TIC MAC VOE
            </h2>
            <p class="cyber-text text-lg font-bold tracking-wider">
                CYBER ARENA AWAITS
            </p>
            <div class="w-32 h-1 mx-auto mt-4 bg-gradient-to-r from-transparent via-[#00ff00] to-transparent animate-pulse"></div>
        </div>
        
        <div class="text-center">
            <div class="mb-8">
                <button id="start-tic-tac-toe-game" class="epic-button group relative py-4 px-8 rounded-xl font-bold text-white text-lg tracking-wider shadow-2xl">
                    <span class="relative z-10 flex items-center justify-center">
                        <i class="fas fa-rocket mr-3 text-xl animate-bounce"></i>
                        ENTER THE MATRIX
                        <i class="fas fa-rocket ml-3 text-xl animate-bounce"></i>
                    </span>
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </button>
            </div>
            
            <div class="glow-border mb-6">
                <div class="bg-gradient-to-br from-[#1a1d23] to-[#2c2f36] p-6 rounded-xl">
                    <p class="neon-text text-[#00ff00] mb-4 font-bold text-xl flex items-center justify-center">
                        <i class="fas fa-terminal mr-3"></i>
                        BATTLE PROTOCOLS
                    </p>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-[#00ff00]/30">
                            <span class="cyber-text text-sm">INITIALIZE COMBAT</span>
                            <span class="text-[#00ff00] text-xs">CLICK ENTER</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-[#0080ff]/30">
                            <span class="cyber-text text-sm">AWAIT OPPONENT</span>
                            <span class="text-[#0080ff] text-xs">STANDBY</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-[#ff0080]/30">
                            <span class="cyber-text text-sm">DEPLOY STRATEGY</span>
                            <span class="text-[#ff0080] text-xs">ENGAGE</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-[#ffff00]/30">
                            <span class="cyber-text text-sm">ACHIEVE VICTORY</span>
                            <span class="text-[#ffff00] text-xs">DOMINATE</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="tic-tac-toe-status" class="quantum-border">
                <div class="bg-gradient-to-br from-[#0a0a0a] to-[#1a1d23] p-6 rounded-xl text-xs">
                    <div class="grid grid-cols-1 gap-4">
                        <div class="flex items-center justify-between p-3 bg-gradient-to-r from-[#001100] to-[#002200] rounded-lg border-l-4 border-[#00ff00]">
                            <span class="cyber-text text-[#00ff00]">SERVER NODE:</span>
                            <span class="font-mono bg-black px-3 py-1 rounded text-[#00ff00] text-xs glitch-effect" data-text="<?php echo htmlspecialchars($serverId ?? 'UNKNOWN'); ?>">
                                <?php echo htmlspecialchars($serverId ?? 'UNKNOWN'); ?>
                            </span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gradient-to-r from-[#000011] to-[#000022] rounded-lg border-l-4 border-[#0080ff]">
                            <span class="cyber-text text-[#0080ff]">OPERATOR:</span>
                            <span class="text-white font-bold neon-text">
                                <?php echo htmlspecialchars($username ?? 'GUEST'); ?>
                            </span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-gradient-to-r from-[#110000] to-[#220000] rounded-lg border-l-4 border-[#ff0080]">
                            <span class="cyber-text text-[#ff0080]">NET STATUS:</span>
                            <span id="connection-status" class="flex items-center">
                                <div class="w-3 h-3 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
                                <span class="text-yellow-400 font-bold cyber-text">SCANNING...</span>
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
                <div class="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span class="text-green-400 font-bold cyber-text">ONLINE</span>
            `;
            startButton.disabled = false;
            startButton.classList.remove('opacity-50', 'cursor-not-allowed');
            startButton.classList.add('hover:scale-105');
        } else {
            connectionStatus.innerHTML = `
                <div class="w-3 h-3 bg-red-400 rounded-full mr-2 animate-pulse"></div>
                <span class="text-red-400 font-bold cyber-text">OFFLINE</span>
            `;
            startButton.disabled = true;
            startButton.classList.add('opacity-50', 'cursor-not-allowed');
            startButton.classList.remove('hover:scale-105');
        }
    }
    
    function checkConnection() {
        updateConnectionStatus();
        setTimeout(checkConnection, 2000);
    }
    
    checkConnection();
    
    function createMatrixEffect() {
        const container = document.querySelector('#tic-tac-toe-container');
        if (!container) return;
        
        const chars = ['0', '1', 'X', 'O', 'FIRE', 'BOLT', 'SKULL', 'CROWN'];
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const char = document.createElement('div');
                char.className = 'matrix-char';
                char.textContent = chars[Math.floor(Math.random() * chars.length)];
                char.style.left = Math.random() * 100 + '%';
                char.style.animationDuration = (2 + Math.random() * 3) + 's';
                char.style.color = `hsl(${Math.random() * 60 + 100}, 100%, 50%)`;
                
                const matrixContainer = container.querySelector('.cyber-grid') || container;
                matrixContainer.appendChild(char);
                
                setTimeout(() => {
                    char.remove();
                }, 5000);
            }, i * 1000);
        }
    }
    
    setInterval(createMatrixEffect, 3000);
    
    if (startButton) {
        startButton.addEventListener('click', function() {
            if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
                if (window.showToast) {
                    window.showToast('NEURAL LINK OFFLINE - RETRY CONNECTION', 'error');
                } else {
                    alert('Neural link not ready. Please wait and try again.');
                }
                return;
            }
            
            if (!serverId || !userId || !username) {
                if (window.showToast) {
                    window.showToast('AUTHENTICATION REQUIRED - LOGIN TO MATRIX', 'error');
                } else {
                    alert('Authentication required. Please make sure you are logged in.');
                }
                return;
            }
            
            startButton.innerHTML = `
                <span class="relative z-10 flex items-center justify-center">
                    <div class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    INITIALIZING MATRIX...
                </span>
            `;
            startButton.disabled = true;
            
            setTimeout(() => {
                if (window.TicTacToeModal) {
                    window.TicTacToeModal.createTicTacToeModal(serverId, userId, username);
                    startButton.innerHTML = `
                        <span class="relative z-10 flex items-center justify-center">
                            <i class="fas fa-rocket mr-3 text-xl animate-bounce"></i>
                            ENTER THE MATRIX
                            <i class="fas fa-rocket ml-3 text-xl animate-bounce"></i>
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
            window.showToast('NEURAL LINK ESTABLISHED - MATRIX ONLINE!', 'success');
        }
        
        createLightningEffect();
    });
    
    function createLightningEffect() {
        const container = document.querySelector('#tic-tac-toe-container');
        if (!container) return;
        
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const lightning = document.createElement('div');
                lightning.className = 'lightning-effect';
                lightning.style.left = Math.random() * 100 + '%';
                lightning.style.top = Math.random() * 100 + '%';
                lightning.style.animationDelay = '0s';
                
                container.appendChild(lightning);
                
                setTimeout(() => {
                    lightning.remove();
                }, 200);
            }, i * 100);
        }
    }
    
    window.addEventListener('globalSocketDisconnected', function() {
        updateConnectionStatus();
        if (window.showToast) {
            window.showToast('NEURAL LINK SEVERED - RECONNECTING...', 'warning');
        }
    });
});

window.openTicTacToe = function(serverId, userId, username) {
    if (window.TicTacToeModal) {
        window.TicTacToeModal.createTicTacToeModal(serverId, userId, username);
    } else {
        console.error('TicTacToeModal not available');
        if (window.showToast) {
            window.showToast('MATRIX ACCESS DENIED - REFRESH NEURAL LINK', 'error');
        }
    }
};
</script>
