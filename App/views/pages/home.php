<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

if (!isset($_SESSION['user_id'])) {
    header('Location: /login');
    exit;
}

$page_title = 'misvord - Home';
$body_class = 'bg-gray-900 text-white overflow-hidden';
$page_css = 'home-page';
$page_js = 'home-page';

$socketServerUrl = $_ENV['SOCKET_SERVER'] ?? 'http://localhost:1002';
?>

<?php ob_start(); ?>

<div class="flex h-screen" 
     data-user-id="<?php echo htmlspecialchars($_SESSION['user_id']); ?>" 
     data-username="<?php echo htmlspecialchars($_SESSION['username']); ?>" 
     data-socket-url="<?php echo htmlspecialchars($socketServerUrl); ?>"
     id="app-container">
    
    <?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/server-sidebar.php'; ?>

    <div class="flex flex-1 overflow-hidden">
        <div class="w-60 bg-gray-800 flex-shrink-0 flex flex-col h-full">
            <!-- DM Header -->
            <div class="p-4 border-b border-gray-700">
                <div class="relative">
                    <input type="text" placeholder="Find or start a conversation..." 
                           class="w-full bg-gray-900 text-gray-200 text-sm rounded px-3 py-2 focus:outline-none">
                    <span class="absolute right-2 top-2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                </div>
            </div>

            <!-- Direct Messages Nav -->
            <div class="flex flex-col flex-1 overflow-y-auto">
                <!-- Friends Button -->
                <div class="px-2 py-3">
                    <button class="flex items-center w-full px-2 py-1 text-gray-300 hover:bg-gray-700 rounded">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Friends
                    </button>
                </div>

                <!-- Nitro/Premium Button -->
                <div class="px-2 pb-2">
                    <button class="flex items-center w-full px-2 py-1 text-gray-300 hover:bg-gray-700 rounded">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Premium
                    </button>
                </div>

                <!-- Shop Button -->
                <div class="px-2 pb-3 border-b border-gray-700">
                    <button class="flex items-center w-full px-2 py-1 text-gray-300 hover:bg-gray-700 rounded">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Shop
                    </button>
                </div>

                <!-- Direct Messages List -->
                <div class="px-2 py-2">
                    <div class="flex justify-between items-center px-2 text-xs text-gray-400 font-semibold mb-1">
                        <span>DIRECT MESSAGES</span>
                        <button class="hover:text-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>

                    <!-- DM Items -->
                    <div class="space-y-1">
                        <!-- Example DM Item 1 -->
                        <div class="flex items-center px-2 py-1 rounded hover:bg-gray-700 cursor-pointer">
                            <div class="relative mr-3">
                                <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                    A
                                </div>
                                <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                            </div>
                            <span class="text-gray-300">Aldric</span>
                        </div>
                        
                        <!-- Example DM Item 2 -->
                        <div class="flex items-center px-2 py-1 rounded hover:bg-gray-700 cursor-pointer">
                            <div class="relative mr-3">
                                <div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white">
                                    C
                                </div>
                                <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-500 rounded-full border-2 border-gray-800"></div>
                            </div>
                            <span class="text-gray-300">Chann</span>
                        </div>
                        
                        <!-- Example DM Item 3 -->
                        <div class="flex items-center px-2 py-1 rounded hover:bg-gray-700 cursor-pointer">
                            <div class="relative mr-3">
                                <div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                                    F
                                </div>
                                <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                            </div>
                            <span class="text-gray-300">Faust</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- User Profile Bar -->
            <div class="p-2 bg-gray-900 flex items-center">
                <div class="flex items-center flex-1">
                    <div class="relative mr-2">
                        <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                            <?php echo substr($_SESSION['username'] ?? 'U', 0, 1); ?>
                        </div>
                        <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                    </div>
                    <div class="text-sm">
                        <div class="font-semibold text-white"><?php echo htmlspecialchars($_SESSION['username'] ?? 'User'); ?></div>
                        <div class="text-xs text-gray-400">#<?php echo rand(1000, 9999); ?></div>
                    </div>
                </div>

                <div class="flex space-x-1">
                    <button class="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </button>
                    <button class="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    <button class="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <div class="flex flex-col flex-1">
            <!-- Home Content Area -->
            <div class="flex-1 bg-gray-700 flex flex-col">
                <!-- Home Header -->
                <div class="h-12 bg-gray-800 border-b border-gray-900 flex items-center px-4">
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span class="font-semibold">Friends</span>
                    </div>
                    <div class="border-l border-gray-700 h-6 mx-4"></div>
                    <div class="flex space-x-4 text-sm">
                        <button class="text-gray-300 hover:text-white">Online</button>
                        <button class="text-gray-300 hover:text-white">All</button>
                        <button class="text-gray-300 hover:text-white">Pending</button>
                        <button class="text-gray-300 hover:text-white">Blocked</button>
                        <button class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded">Add Friend</button>
                    </div>
                </div>

                <!-- Friends Content -->
                <div class="flex-1 p-4 overflow-y-auto">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-gray-400 font-bold text-xs uppercase">Online — 3</h2>
                        <div class="relative">
                            <input type="text" placeholder="Search" class="bg-gray-900 text-gray-200 text-sm rounded px-3 py-1.5 focus:outline-none w-60">
                            <div class="absolute right-3 top-2 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <!-- Friend List -->
                    <div class="space-y-1">
                        <!-- Friend Item 1 -->
                        <div class="flex justify-between items-center p-2 rounded hover:bg-gray-800">
                            <div class="flex items-center">
                                <div class="relative mr-3">
                                    <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                        A
                                    </div>
                                    <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-700"></div>
                                </div>
                                <div>
                                    <div class="font-medium text-white">Aldric</div>
                                    <div class="text-xs text-gray-400">Idle</div>
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <button class="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </button>
                                <button class="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Friend Item 2 -->
                        <div class="flex justify-between items-center p-2 rounded hover:bg-gray-800">
                            <div class="flex items-center">
                                <div class="relative mr-3">
                                    <div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                                        F
                                    </div>
                                    <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-700"></div>
                                </div>
                                <div>
                                    <div class="font-medium text-white">Faust</div>
                                    <div class="text-xs text-gray-400">Playing Visual Studio Code</div>
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <button class="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </button>
                                <button class="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Friend Item 3 -->
                        <div class="flex justify-between items-center p-2 rounded hover:bg-gray-800">
                            <div class="flex items-center">
                                <div class="relative mr-3">
                                    <div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white">
                                        H
                                    </div>
                                    <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-700"></div>
                                </div>
                                <div>
                                    <div class="font-medium text-white">HayaL</div>
                                    <div class="text-xs text-gray-400">Playing Marvel Rivals</div>
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <button class="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </button>
                                <button class="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Right sidebar for active now friends -->
        <div class="w-60 bg-gray-800 flex-shrink-0 p-4 border-l border-gray-900 hidden lg:block">
            <h2 class="font-semibold text-md mb-3">Active Now</h2>
            
            <!-- Active Friend Cards -->
            <div class="space-y-3">
                <!-- Card 1 -->
                <div class="bg-gray-700 rounded-lg p-3">
                    <div class="flex items-center mb-2">
                        <div class="relative mr-2">
                            <div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white">
                                H
                            </div>
                            <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-700"></div>
                        </div>
                        <div>
                            <div class="font-medium text-white">HayaL</div>
                            <div class="text-xs text-gray-400">Marvel Rivals - 23m</div>
                        </div>
                    </div>
                    <div class="flex items-center text-sm bg-gray-800 rounded p-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-gray-300">Playing a game</span>
                    </div>
                </div>
                
                <!-- Card 2 -->
                <div class="bg-gray-700 rounded-lg p-3">
                    <div class="flex items-center mb-2">
                        <div class="relative mr-2">
                            <div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                                F
                            </div>
                            <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-700"></div>
                        </div>
                        <div>
                            <div class="font-medium text-white">Faust</div>
                            <div class="text-xs text-gray-400">Visual Studio Code - 20h</div>
                        </div>
                    </div>
                    <div class="flex items-center text-sm bg-gray-800 rounded p-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span class="text-gray-300">Coding something cool</span>
                    </div>
                </div>
                
                <!-- Card 3 -->
                <div class="bg-gray-700 rounded-lg p-3">
                    <div class="flex items-center mb-2">
                        <div class="relative mr-2">
                            <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                R
                            </div>
                            <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-700"></div>
                        </div>
                        <div>
                            <div class="font-medium text-white">Reikii</div>
                            <div class="text-xs text-gray-400">Roblox - 53m</div>
                        </div>
                    </div>
                    <div class="flex items-center text-sm bg-gray-800 rounded p-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="text-gray-300">Playing a game</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php 
$content = ob_get_clean(); 

include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>
