<?php if (!isset($_SESSION['user_id'])) return; ?>

<div class="nitro-badge-container inline-flex items-center" style="display: none;">
    <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7V12C2 16.5 4.23 20.68 7.62 23.15L12 24L16.38 23.15C19.77 20.68 22 16.5 22 12V7L12 2M12 4.18L19.5 8.5V12C19.5 15.55 17.84 18.74 15.26 20.62L12 21.47L8.74 20.62C6.16 18.74 4.5 15.55 4.5 12V8.5L12 4.18M9.5 12L8.09 13.41L11 16.32L15.95 11.37L14.54 9.96L11 13.5L9.5 12Z"/>
        </svg>
        NITRO
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const nitroBadgeContainer = document.querySelector('.nitro-badge-container');
    
    if (!nitroBadgeContainer) return;
    
    // Fetch nitro status from API
    fetch('/api/nitro/status', {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success && data.has_nitro) {
            nitroBadgeContainer.style.display = 'inline-flex';
        }
    })
    .catch(error => {
        console.log('Nitro status check failed:', error);
        // Silently fail - badge remains hidden
    });
});
</script> 