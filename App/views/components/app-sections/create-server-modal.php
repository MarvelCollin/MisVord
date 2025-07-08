<?php
$additional_js[] = 'components/servers/create-server-modal';
?>
<div id="create-server-modal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 hidden opacity-0" style="display: none;">
    <div class="bg-discord-background rounded-lg w-full max-w-md p-6 shadow-xl transform scale-95">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-white text-xl font-bold">Create a Server</h2>
            <button id="close-create-server-modal" class="text-gray-400 hover:text-white">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <p class="text-gray-400 mb-4">Your server is where you and your friends hang out. Make yours and start talking.</p>

        <style>
            .upload-container::after {
                content: attr(data-tooltip);
                position: absolute;
                opacity: 0;
                transition: opacity 0.3s;
                background-color: rgba(32, 34, 37, 0.9);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                pointer-events: none;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                white-space: nowrap;
                z-index: 10;
            }
            
            .upload-container:hover::after {
                opacity: 1;
            }
            
            .upload-container:hover i {
                transform: scale(1.2);
            }
            
            @keyframes fadeIn {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
            
            @keyframes fadeOut {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
            
            @keyframes scaleIn {
                0% { 
                    opacity: 0;
                    transform: scale(0.9) translateY(-10px);
                }
                50% {
                    opacity: 0.8;
                }
                100% { 
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
            }
            
            @keyframes scaleOut {
                0% { 
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }
                100% { 
                    opacity: 0;
                    transform: scale(0.95) translateY(10px);
                }
            }
            
            .animate-fade-in {
                animation: fadeIn 0.3s ease-out forwards;
            }
            
            .animate-fade-out {
                animation: fadeOut 0.3s ease-in forwards;
            }
            
            .animate-scale-in {
                animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            
            .animate-scale-out {
                animation: scaleOut 0.3s ease-in forwards;
            }
            
            .modal-step {
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease, transform 0.3s ease;
                transform: translateY(10px);
                position: relative;
            }
            
            .modal-step.active {
                display: block;
                opacity: 1;
                transform: translateY(0);
            }
            
            .modal-step.slide-left-exit {
                animation: slideLeftExit 0.3s forwards;
            }
            
            .modal-step.slide-right-enter {
                animation: slideRightEnter 0.3s forwards;
            }
            
            .modal-step.slide-right-exit {
                animation: slideRightExit 0.3s forwards;
            }
            
            .modal-step.slide-left-enter {
                animation: slideLeftEnter 0.3s forwards;
            }
            
            @keyframes slideLeftExit {
                0% {
                    opacity: 1;
                    transform: translateX(0);
                }
                100% {
                    opacity: 0;
                    transform: translateX(-20px);
                }
            }
            
            @keyframes slideRightEnter {
                0% {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                100% {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes slideRightExit {
                0% {
                    opacity: 1;
                    transform: translateX(0);
                }
                100% {
                    opacity: 0;
                    transform: translateX(20px);
                }
            }
            
            @keyframes slideLeftEnter {
                0% {
                    opacity: 0;
                    transform: translateX(20px);
                }
                100% {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            .step-indicator {
                display: flex;
                justify-content: center;
                margin-bottom: 16px;
            }
            
            .step-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: #4e5058;
                margin: 0 4px;
                transition: all 0.3s;
            }
            
            .step-dot.active {
                background-color: #5865f2;
                transform: scale(1.2);
            }
        </style>

        <form id="create-server-form" action="/api/servers/create" method="POST" class="space-y-4">
            <div class="step-indicator">
                <div class="step-dot active" data-step="1"></div>
                <div class="step-dot" data-step="2"></div>
            </div>
            
            <div id="step-1" class="modal-step active">
                <div class="mb-4">
                    <label for="server-name" class="block text-gray-300 text-sm font-medium mb-2">Server Name <span class="text-red-500">*</span></label>
                    <input type="text" id="server-name" name="name" class="bg-discord-dark text-white w-full px-3 py-2 rounded border border-gray-700 focus:border-discord-blue focus:outline-none" placeholder="My Awesome Server" required>
                </div>

                <div class="mb-4">
                    <label for="server-description" class="block text-gray-300 text-sm font-medium mb-2">Description <span class="text-red-500">*</span></label>
                    <textarea id="server-description" name="description" class="bg-discord-dark text-white w-full px-3 py-2 rounded border border-gray-700 focus:border-discord-blue focus:outline-none" rows="3" placeholder="Tell us what your server is about" required></textarea>
                    <p class="text-xs text-gray-400 mt-1">This will be displayed in server listings</p>
                </div>

                <div class="mb-4">
                    <label for="server-category" class="block text-gray-300 text-sm font-medium mb-2">Server Category <span class="text-red-500">*</span></label>
                    <select id="server-category" name="category" class="bg-discord-dark text-white w-full px-3 py-2 rounded border border-gray-700 focus:border-discord-blue focus:outline-none" required>
                        <option value="">Select a category</option>
                        <option value="gaming">Gaming</option>
                        <option value="music">Music</option>
                        <option value="education">Education</option>
                        <option value="science">Science & Tech</option>
                        <option value="entertainment">Entertainment</option>
                        <option value="community">Community</option>
                    </select>
                    <p class="text-xs text-gray-400 mt-1">Choose a category that best describes your server</p>
                </div>

                <div class="flex justify-end mt-6">
                    <button type="button" id="next-step-btn" class="bg-discord-blue text-white font-medium py-2 px-4 rounded hover:bg-blue-600 transition-colors duration-300">
                        Next Step
                    </button>
                </div>
            </div>

            <div id="step-2" class="modal-step">
                <div id="server-icon-container" class="upload-container group relative w-24 h-24 mx-auto mb-4 rounded-full bg-discord-dark flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-600 hover:border-discord-blue transition-colors cursor-pointer">
                    <img id="server-icon-preview" class="hidden w-full h-full object-cover" src="" alt="Server icon">
                    <div id="server-icon-placeholder" class="flex flex-col items-center justify-center">
                        <i class="fas fa-user text-gray-400 text-xl transition-transform duration-200"></i>
                    </div>
                    <input type="file" id="server-icon-input" name="server_icon" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*">
                </div>

                <div id="server-banner-container" class="upload-container group relative w-full h-32 mx-auto mb-4 rounded-lg bg-discord-dark flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-600 hover:border-discord-blue transition-colors cursor-pointer">
                    <img id="server-banner-preview" class="hidden w-full h-full object-cover" src="" alt="Server banner">
                    <div id="server-banner-placeholder" class="flex flex-col items-center justify-center">
                        <i class="fas fa-image text-gray-400 text-xl transition-transform duration-200"></i>
                    </div>
                    <input type="file" id="server-banner-input" name="server_banner" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*">
                </div>

                <div class="mb-4">
                    <label class="flex items-center cursor-pointer">
                        <input type="hidden" name="is_public" value="0">
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

                <div class="flex justify-between mt-6">
                    <button type="button" id="prev-step-btn" class="bg-discord-dark text-white font-medium py-2 px-4 rounded hover:bg-gray-700 transition-colors duration-300">
                        Back
                    </button>
                    <button type="submit" class="bg-discord-blue text-white font-medium py-2 px-4 rounded hover:bg-green-500 transition-colors duration-300">
                        Create Server
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>