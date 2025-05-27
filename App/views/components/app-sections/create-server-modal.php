<?php
// Create Server Modal
?>
<div id="create-server-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 hidden">
    <div class="w-full max-w-md">
        <div class="bg-discord-background rounded-lg shadow-lg overflow-hidden">
            <div class="p-6">
                <div class="flex justify-between mb-6">
                    <h2 class="text-2xl font-bold">Create a Server</h2>
                    <button id="close-server-modal" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="text-center mb-6">
                    <p class="text-gray-400">Your server is where you and your friends hang out. Make yours and start talking.</p>
                </div>
                
                <form id="server-form" class="space-y-4" enctype="multipart/form-data">
                    <div class="flex flex-col items-center mb-6">
                        <div id="server-image-preview" class="w-24 h-24 rounded-full bg-discord-dark flex items-center justify-center cursor-pointer overflow-hidden mb-2">
                            <i class="fas fa-camera text-discord-lighter text-xl"></i>
                        </div>
                        <input type="file" id="server-image" name="image_file" class="hidden" accept="image/*">
                        <button type="button" id="upload-image-btn" class="text-sm text-discord-primary hover:underline">Upload Image</button>
                    </div>
                    
                    <div>
                        <label for="server-name" class="block text-sm font-medium text-gray-300 mb-1">SERVER NAME <span class="text-discord-red">*</span></label>
                        <input type="text" id="server-name" name="name" class="w-full bg-discord-dark border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-discord-primary" 
                               placeholder="Enter server name" required>
                    </div>
                    
                    <div>
                        <label for="server-description" class="block text-sm font-medium text-gray-300 mb-1">SERVER DESCRIPTION</label>
                        <textarea id="server-description" name="description" rows="3" class="w-full bg-discord-dark border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-discord-primary resize-none"
                                  placeholder="What's this server about? (optional)"></textarea>
                    </div>
                    
                    <div class="flex items-center">
                        <input type="checkbox" id="server-public" name="is_public" value="1" class="h-4 w-4 accent-discord-primary bg-discord-dark border-gray-700" checked>
                        <label for="server-public" class="ml-2 text-sm text-gray-300">Make this server public</label>
                        <span class="ml-2 text-gray-500 text-xs cursor-help" title="Public servers can be found by anyone in the server browser">
                            <i class="fas fa-question-circle"></i>
                        </span>
                    </div>
                    
                    <div class="pt-4">
                        <button type="submit" id="create-server-btn" class="w-full bg-discord-primary hover:bg-discord-primary/90 text-white font-medium py-2 px-4 rounded">
                            Create Server
                        </button>
                    </div>
                    
                    <div id="error-message" class="text-discord-red text-sm text-center mt-2 hidden"></div>
                    <div id="success-message" class="text-discord-green text-sm text-center mt-2 hidden"></div>
                </form>
            </div>
        </div>
    </div>
</div> 