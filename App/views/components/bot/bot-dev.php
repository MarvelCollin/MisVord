<?php if (!isset($_SESSION['user_id'])) return; ?>

<div id="bot-dev-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
    <div class="bg-discord-darker p-6 rounded-lg w-96 max-w-full mx-4">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-white text-xl font-bold">🤖 Bot Development</h2>
            <button onclick="closeBotDevModal()" class="text-gray-400 hover:text-white">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="space-y-4">
            <div>
                <label class="block text-gray-300 text-sm mb-2">Bot Username</label>
                <input type="text" id="bot-dev-username" class="w-full bg-discord-dark text-white px-3 py-2 rounded border border-gray-600 focus:border-discord-primary" placeholder="Enter bot username">
            </div>
            
            <div>
                <label class="block text-gray-300 text-sm mb-2">Bot Email</label>
                <input type="email" id="bot-dev-email" class="w-full bg-discord-dark text-white px-3 py-2 rounded border border-gray-600 focus:border-discord-primary" placeholder="bot@example.com">
            </div>
            
            <div>
                <label class="block text-gray-300 text-sm mb-2">Select Server to Join</label>
                <select id="bot-dev-server" class="w-full bg-discord-dark text-white px-3 py-2 rounded border border-gray-600 focus:border-discord-primary">
                    <option value="">AJAX disabled - Use WebSocket instead</option>
                </select>
            </div>
            
            <div class="flex space-x-3">
                <button onclick="initBotDev()" class="flex-1 bg-discord-primary text-white py-2 px-4 rounded hover:bg-opacity-80">
                    Initialize Bot
                </button>
                <button onclick="checkBotDev()" class="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-500">
                    Check Bot
                </button>
            </div>
            
            <div class="flex space-x-3">
                <button onclick="listBotsDev()" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-500">
                    List Bots
                </button>
                <button onclick="clearBotDevForm()" class="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-400">
                    Clear
                </button>
            </div>
        </div>
        
        <div id="bot-dev-status" class="mt-4 text-sm"></div>
        
        <div id="bot-dev-list" class="mt-4 hidden">
            <h3 class="text-white font-bold mb-2">Existing Bots:</h3>
            <div id="bot-dev-list-content" class="max-h-40 overflow-y-auto"></div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    function showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('bot-dev-status');
        const colors = {
            success: 'text-green-400',
            error: 'text-red-400',
            warning: 'text-orange-400',
            loading: 'text-yellow-400',
            info: 'text-blue-400'
        };
        statusDiv.innerHTML = `<div class="${colors[type]}">${message}</div>`;
    }

    window.openBotDevModal = function() {
        document.getElementById('bot-dev-modal').classList.remove('hidden');
        showStatus('⚠️ Bot AJAX operations have been disabled. Use WebSocket-based bot commands instead.', 'warning');
    };

    window.closeBotDevModal = function() {
        document.getElementById('bot-dev-modal').classList.add('hidden');
        clearBotDevForm();
    };

    window.initBotDev = function() {
        showStatus('❌ Bot creation via AJAX has been disabled. Use WebSocket methods instead.', 'error');
    };

    window.checkBotDev = function() {
        showStatus('❌ Bot check via AJAX has been disabled. Use WebSocket methods instead.', 'error');
    };

    window.listBotsDev = function() {
        const listDiv = document.getElementById('bot-dev-list');
        showStatus('❌ Bot listing via AJAX has been disabled. Use WebSocket methods instead.', 'error');
        listDiv.classList.add('hidden');
    };

    window.clearBotDevForm = function() {
        document.getElementById('bot-dev-username').value = '';
        document.getElementById('bot-dev-email').value = '';
        document.getElementById('bot-dev-server').value = '';
        document.getElementById('bot-dev-status').innerHTML = '';
        document.getElementById('bot-dev-list').classList.add('hidden');
    };

    document.getElementById('bot-dev-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeBotDevModal();
        }
    });
});
</script>
