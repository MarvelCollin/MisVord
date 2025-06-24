<!-- Discord-style join UI (shows before connecting) -->
<div id="joinUI" class="flex-1 flex flex-col items-center justify-center z-10 bg-gradient-to-b from-[#1e1f3a] via-[#2b2272] to-[#1e203a]">
    <h2 class="text-2xl font-bold text-white mb-2"><?php echo htmlspecialchars($activeChannel['name'] ?? 'Voice Channel'); ?></h2>
    <p class="text-gray-300 text-base mb-6">No one is currently in voice</p>
    
    <button id="joinBtn" class="bg-[#5865F2] hover:bg-[#4752c4] text-white font-medium py-2 px-6 rounded transition-colors">
        Join Voice
    </button>
</div>

<script>
// Apply gradient background only - don't interfere with click handlers
document.addEventListener("DOMContentLoaded", function() {
    const mainContent = document.querySelector('.flex-1.flex.flex-col');
    
    // Apply full-height gradient background only to the voice container section
    if (mainContent) {
        mainContent.style.background = 'linear-gradient(180deg, #1e1f3a 0%, #2b2272 50%, #1e203a 100%)';
    }
    
    // Add visual feedback for join button (without adding a new click handler)
    const joinBtn = document.getElementById('joinBtn');
    if (joinBtn) {
        // Use the capture phase to detect clicks without preventing propagation
        joinBtn.addEventListener('mousedown', function() {
            joinBtn.textContent = 'Connecting...';
            joinBtn.classList.add('opacity-70', 'cursor-not-allowed');
        }, { capture: true, passive: true });
    }
});
</script>
