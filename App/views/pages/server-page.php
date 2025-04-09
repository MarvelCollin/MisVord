<?php
// Include helper functions if not already included
if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MiscVord - Gaming Server</title>
    
    <!-- Tailwind CSS - Either via CDN or your own compiled version -->
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    
    <style>
        body {
            font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            height: 100vh;
            overflow: hidden;
        }
        
        /* Custom scrollbar styling */
        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-track {
            background: #2e3338;
        }

        ::-webkit-scrollbar-thumb {
            background: #202225;
            border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
    </style>
</head>
<body class="bg-gray-900 text-white">
    <div class="flex h-screen">
        <!-- Server Sidebar - Contains server icons -->
        <div class="server-sidebar bg-gray-900 w-18 h-full flex flex-col items-center py-3 overflow-y-auto">
            <!-- Home Button -->
            <div class="server-icon home-icon mb-2">
                <div class="bg-gray-700 text-white h-12 w-12 rounded-2xl flex items-center justify-center hover:bg-indigo-500 hover:rounded-xl transition-all duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </div>
            </div>
            
            <!-- Server Divider -->
            <div class="w-8 h-0.5 bg-gray-700 rounded my-2"></div>
            
            <!-- Active Server (indicated by pill) -->
            <div class="server-icon active-server my-2 relative">
                <div class="absolute left-0 w-1 h-10 bg-white rounded-r-full"></div>
                <div class="bg-indigo-500 text-white h-12 w-12 rounded-2xl flex items-center justify-center">
                    <span class="text-xl font-semibold">GS</span>
                </div>
            </div>
            
            <!-- Other Servers -->
            <div class="server-icon my-2">
                <div class="bg-gray-700 text-white h-12 w-12 rounded-full flex items-center justify-center hover:bg-purple-600 hover:rounded-xl transition-all duration-200">
                    <span class="text-xl font-semibold">MC</span>
                </div>
            </div>
            
            <div class="server-icon my-2">
                <div class="bg-gray-700 text-white h-12 w-12 rounded-full flex items-center justify-center hover:bg-green-600 hover:rounded-xl transition-all duration-200">
                    <span class="text-xl font-semibold">CS</span>
                </div>
            </div>
            
            <div class="server-icon my-2">
                <div class="bg-gray-700 text-white h-12 w-12 rounded-full flex items-center justify-center hover:bg-yellow-500 hover:rounded-xl transition-all duration-200">
                    <span class="text-xl font-semibold">VL</span>
                </div>
            </div>
            
            <!-- Add Server Button -->
            <div class="server-icon mt-2">
                <div class="bg-gray-700 text-green-500 h-12 w-12 rounded-full flex items-center justify-center hover:bg-green-500 hover:text-white hover:rounded-xl transition-all duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                </div>
            </div>
            
            <!-- Explore Public Servers -->
            <div class="server-icon mt-2">
                <div class="bg-gray-700 text-green-500 h-12 w-12 rounded-full flex items-center justify-center hover:bg-green-500 hover:text-white hover:rounded-xl transition-all duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
        </div>
        
        <!-- Main Discord Interface - Flexbox layout for the 3 main sections -->
        <div class="flex flex-1 overflow-hidden">
            <!-- Channel Section - Left sidebar with channels -->
            <?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/channel-section.php'; ?>
            
            <!-- Main Content Area -->
            <div class="flex flex-col flex-1">
                <!-- Chat Section - Main conversation area -->
                <?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/chat-section.php'; ?>
            </div>
            
            <!-- Participants Section - Right sidebar with member list -->
            <?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/participant-section.php'; ?>
        </div>
    </div>
    
    <!-- User Profile Section - Bottom bar with user controls -->
    <div class="user-profile-section fixed bottom-0 left-18 right-0 h-14 bg-gray-800 flex items-center px-2">
        <div class="flex items-center w-60 px-2">
            <div class="relative mr-3">
                <img src="<?php echo asset('/landing-page/green-egg.webp'); ?>" alt="Your Avatar" class="w-8 h-8 rounded-full">
                <div class="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-800"></div>
            </div>
            <div class="flex-grow">
                <div class="text-white font-medium text-sm">YourUsername</div>
                <div class="text-gray-400 text-xs">#1234</div>
            </div>
            <div class="flex space-x-1">
                <button class="text-gray-400 hover:text-white p-1 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </button>
                <button class="text-gray-400 hover:text-white p-1 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 01.001-7.072m12.728 0a9 9 0 00-12.728 0" />
                    </svg>
                </button>
                <button class="text-gray-400 hover:text-white p-1 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
    
    <style>
        .server-sidebar {
            min-width: 4.5rem;
        }
        
        .left-18 {
            left: 4.5rem;
        }
        
        .server-icon {
            position: relative;
            display: flex;
            justify-content: center;
            width: 100%;
        }
        
        .server-icon.active-server > div {
            border-radius: 1rem !important;
        }
        
        .channel-sidebar {
            border-right: 1px solid #2D3136;
        }
        
        .user-profile-section {
            border-top: 1px solid #2D3136;
            z-index: 10;
        }
    </style>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Server hover effects
            const serverIcons = document.querySelectorAll('.server-icon:not(.active-server)');
            serverIcons.forEach(server => {
                server.addEventListener('mouseenter', function() {
                    const pill = document.createElement('div');
                    pill.className = 'absolute left-0 w-1 h-5 bg-white rounded-r-full transition-all duration-200';
                    pill.style.top = '15px';
                    this.appendChild(pill);
                });
                
                server.addEventListener('mouseleave', function() {
                    const pill = this.querySelector(':scope > div.absolute');
                    if (pill) pill.remove();
                });
            });
        });
    </script>
</body>
</html>
