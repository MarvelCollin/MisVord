<?php
$additional_js[] = 'components/servers/create-server-modal';
?>
<div id="create-server-modal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 hidden transform transition-all duration-300 ease-in-out opacity-0 scale-95">
    <div class="bg-discord-background rounded-lg w-full max-w-md p-6 shadow-xl transform transition-all duration-300 ease-in-out scale-95">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-white text-xl font-bold">Create a Server</h2>
            <button id="close-server-modal" class="text-gray-400 hover:text-white">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <p class="text-gray-400 mb-4">Your server is where you and your friends hang out. Make yours and start talking.</p>

        <form id="create-server-form" action="/api/servers/create" method="POST" class="space-y-4">
            <div id="server-icon-container" class="group relative w-24 h-24 mx-auto mb-4 rounded-full bg-discord-dark flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-600 hover:border-discord-blue transition-colors cursor-pointer">
                <img id="server-icon-preview" class="hidden w-full h-full object-cover" src="" alt="Server icon">
                <div id="server-icon-placeholder" class="flex flex-col items-center justify-center">
                    <i class="fas fa-user-plus text-gray-400 text-xl"></i>
                </div>
                <input type="file" id="server-icon-input" name="server_icon" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*">
            </div>

            <div id="server-banner-container" class="group relative w-full h-32 mx-auto mb-4 rounded-lg bg-discord-dark flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-600 hover:border-discord-blue transition-colors cursor-pointer">
                <img id="server-banner-preview" class="hidden w-full h-full object-cover" src="" alt="Server banner">
                <div id="server-banner-placeholder" class="flex flex-col items-center justify-center">
                    <i class="fas fa-images text-gray-400 text-xl"></i>
                </div>
                <input type="file" id="server-banner-input" name="server_banner" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*">
            </div>

            <div class="mb-4">
                <label for="server-name" class="block text-gray-300 text-sm font-medium mb-2">Server Name</label>
                <input type="text" id="server-name" name="name" class="bg-discord-dark text-white w-full px-3 py-2 rounded border border-gray-700 focus:border-discord-blue focus:outline-none" placeholder="My Awesome Server" required>
            </div>

            <div class="mb-4">
                <label class="flex items-center cursor-pointer">
                    <input type="checkbox" id="is-public" name="is_public" value="1" class="sr-only peer">
                    <div class="relative w-11 h-6 bg-discord-dark rounded-full peer 
                        peer-focus:ring-2 peer-focus:ring-discord-blue 
                        peer-checked:bg-green-500 transition-colors duration-300 ease-in-out
                        before:content-[''] before:absolute before:top-[2px] before:left-[2px] 
                        before:bg-white before:rounded-full before:h-5 before:w-5 
                        before:transition-all before:duration-300 before:ease-in-out
                        peer-checked:before:translate-x-5 before:shadow-sm">
                    </div>
                    <span class="ms-3 text-sm font-medium text-gray-300">Make server public</span>
                </label>
                <p class="text-xs text-gray-400 mt-1">Public servers can be found in the explore page</p>
            </div>

            <div>
                <button type="submit" class="w-full bg-discord-blue text-white font-medium py-2 px-4 rounded hover:bg-opacity-80 transition-colors">
                    Create Server
                </button>
            </div>
        </form>
    </div>
</div>