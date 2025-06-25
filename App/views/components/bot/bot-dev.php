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
                    <option value="">Loading servers...</option>
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
    async function loadUserServersDev() {
        try {
            const response = await fetch('/api/user/servers', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            const data = await response.json();
            const serverSelect = document.getElementById('bot-dev-server');
            
            if (data.success && data.servers) {
                serverSelect.innerHTML = '<option value="">Select a server...</option>';
                data.servers.forEach(server => {
                    const option = document.createElement('option');
                    option.value = server.id;
                    option.textContent = server.name;
                    serverSelect.appendChild(option);
                });
            } else {
                serverSelect.innerHTML = '<option value="">No servers available</option>';
            }
        } catch (error) {
            console.error('Failed to load servers:', error);
            document.getElementById('bot-dev-server').innerHTML = '<option value="">Error loading servers</option>';
        }
    }

    window.openBotDevModal = function() {
        document.getElementById('bot-dev-modal').classList.remove('hidden');
        loadUserServersDev();
    };

    window.closeBotDevModal = function() {
        document.getElementById('bot-dev-modal').classList.add('hidden');
        clearBotDevForm();
    };

    window.initBotDev = async function() {
        const username = document.getElementById('bot-dev-username').value.trim();
        const email = document.getElementById('bot-dev-email').value.trim();
        const serverId = document.getElementById('bot-dev-server').value;
        const statusDiv = document.getElementById('bot-dev-status');
        
        if (!username) {
            statusDiv.innerHTML = '<div class="text-red-400">❌ Bot username is required</div>';
            return;
        }
        
        if (!email) {
            statusDiv.innerHTML = '<div class="text-red-400">❌ Bot email is required</div>';
            return;
        }
        
        statusDiv.innerHTML = '<div class="text-yellow-400">⏳ Creating bot...</div>';
        
        try {
            const response = await fetch('/api/bots/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    server_id: serverId || null
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                statusDiv.innerHTML = `<div class="text-green-400">✅ Bot created successfully! ID: ${data.bot.id}, Discriminator: ${data.bot.discriminator}</div>`;
                if (data.server_joined) {
                    statusDiv.innerHTML += `<div class="text-blue-400">🎉 Bot joined server successfully!</div>`;
                }
                if (data.server_join_error) {
                    statusDiv.innerHTML += `<div class="text-orange-400">⚠️ Server join error: ${data.server_join_error}</div>`;
                }
            } else {
                statusDiv.innerHTML = `<div class="text-red-400">❌ ${data.message || 'Failed to create bot'}</div>`;
            }
        } catch (error) {
            console.error('Bot creation error:', error);
            statusDiv.innerHTML = '<div class="text-red-400">❌ Network error occurred</div>';
        }
    };

    window.checkBotDev = async function() {
        const username = document.getElementById('bot-dev-username').value.trim();
        const statusDiv = document.getElementById('bot-dev-status');
        
        if (!username) {
            statusDiv.innerHTML = '<div class="text-red-400">❌ Bot username is required</div>';
            return;
        }
        
        statusDiv.innerHTML = '<div class="text-yellow-400">⏳ Checking bot...</div>';
        
        try {
            const response = await fetch(`/api/bots/check/${encodeURIComponent(username)}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            const data = await response.json();
            
            if (data.success && data.exists) {
                if (data.is_bot) {
                    statusDiv.innerHTML = `<div class="text-green-400">✅ Bot exists! ID: ${data.bot.id}, Status: ${data.bot.status}, Discriminator: ${data.bot.discriminator}</div>`;
                } else {
                    statusDiv.innerHTML = '<div class="text-orange-400">⚠️ User exists but is not a bot</div>';
                }
            } else {
                statusDiv.innerHTML = '<div class="text-orange-400">⚠️ Bot does not exist</div>';
            }
        } catch (error) {
            console.error('Bot check error:', error);
            statusDiv.innerHTML = '<div class="text-red-400">❌ Network error occurred</div>';
        }
    };

    window.listBotsDev = async function() {
        const statusDiv = document.getElementById('bot-dev-status');
        const listDiv = document.getElementById('bot-dev-list');
        const listContent = document.getElementById('bot-dev-list-content');
        
        statusDiv.innerHTML = '<div class="text-yellow-400">⏳ Loading bots...</div>';
        
        try {
            const response = await fetch('/api/bots', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                statusDiv.innerHTML = `<div class="text-green-400">✅ Found ${data.total} bots</div>`;
                
                if (data.bots.length > 0) {
                    listContent.innerHTML = data.bots.map(bot => `
                        <div class="bg-discord-dark p-2 rounded mb-2 text-sm">
                            <div class="text-white font-medium">${bot.username}#${bot.discriminator}</div>
                            <div class="text-gray-400">ID: ${bot.id} | Status: ${bot.status}</div>
                            <div class="text-gray-500 text-xs">${bot.email}</div>
                        </div>
                    `).join('');
                    listDiv.classList.remove('hidden');
                } else {
                    listDiv.classList.add('hidden');
                }
            } else {
                statusDiv.innerHTML = `<div class="text-red-400">❌ ${data.message || 'Failed to load bots'}</div>`;
                listDiv.classList.add('hidden');
            }
        } catch (error) {
            console.error('Bot list error:', error);
            statusDiv.innerHTML = '<div class="text-red-400">❌ Network error occurred</div>';
            listDiv.classList.add('hidden');
        }
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
