<?php
$additional_js[] = 'components/servers/create-server-modal';
?>
<div id="create-server-modal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 hidden">
    <div class="bg-discord-background rounded-lg w-full max-w-md p-6 shadow-xl">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-white text-xl font-bold">Create a Server</h2>
            <button id="close-server-modal" class="text-gray-400 hover:text-white">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <p class="text-gray-400 mb-4">Your server is where you and your friends hang out. Make yours and start talking.</p>

        <form id="create-server-form" action="/api/servers/create" method="POST" class="space-y-4">
            <div class="group relative w-24 h-24 mx-auto mb-4 rounded-full bg-discord-dark flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-600 hover:border-discord-blue transition-colors cursor-pointer">
                <img id="server-icon-preview" class="hidden w-full h-full object-cover" src="" alt="Server icon">
                <div id="server-icon-placeholder" class="flex flex-col items-center justify-center">
                    <i class="fas fa-camera text-gray-400 text-xl mb-1"></i>
                    <span class="text-gray-400 text-xs text-center">Upload Icon</span>
                </div>
                <input type="file" id="server-icon-input" name="server_icon" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*">
            </div>

            <div class="group relative w-full h-32 mx-auto mb-4 rounded-lg bg-discord-dark flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-600 hover:border-discord-blue transition-colors cursor-pointer">
                <img id="server-banner-preview" class="hidden w-full h-full object-cover" src="" alt="Server banner">
                <div id="server-banner-placeholder" class="flex flex-col items-center justify-center">
                    <i class="fas fa-image text-gray-400 text-xl mb-1"></i>
                    <span class="text-gray-400 text-xs text-center">Upload Banner</span>
                </div>
                <input type="file" id="server-banner-input" name="server_banner" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*">
            </div>

            <div class="mb-4">
                <label for="server-name" class="block text-gray-300 text-sm font-medium mb-2">Server Name</label>
                <input type="text" id="server-name" name="name" class="bg-discord-dark text-white w-full px-3 py-2 rounded border border-gray-700 focus:border-discord-blue focus:outline-none" placeholder="My Awesome Server" required>
            </div>

            <div>
                <button type="submit" class="w-full bg-discord-blue text-white font-medium py-2 px-4 rounded hover:bg-opacity-80 transition-colors">
                    Create Server
                </button>
            </div>
        </form>
    </div>
</div>