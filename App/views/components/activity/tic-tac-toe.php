<?php 
$userId = $_SESSION['user_id'] ?? null;
$username = $_SESSION['username'] ?? null;
$serverId = $GLOBALS['server']->id ?? $GLOBALS['currentServer']->id ?? null;
?>

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
    setTimeout(() => {
        const fallback = document.getElementById('tic-tac-toe-fallback');
        if (fallback && !document.getElementById('tic-tac-toe-modal')) {
            if (!window.globalSocketManager || !window.globalSocketManager.isReady()) {
                fallback.classList.remove('hidden');
                setTimeout(() => {
                    fallback.classList.add('hidden');
                }, 5000);
            }
        }
    }, 2000);
});
</script>
