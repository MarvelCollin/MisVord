<?php
$currentUserId = $_SESSION['user_id'] ?? 0;

$chatType = $GLOBALS['chatType'] ?? null;
$targetId = $GLOBALS['targetId'] ?? null;
$chatData = $GLOBALS['chatData'] ?? null;
$messages = $GLOBALS['messages'] ?? [];

if (!$chatType) {
    $currentServer = $GLOBALS['currentServer'] ?? null;
    $activeChannelId = $GLOBALS['activeChannelId'] ?? null;
    $channelMessages = $GLOBALS['channelMessages'] ?? [];
    $serverChannels = $GLOBALS['serverChannels'] ?? [];

    if (!isset($currentServer) || empty($currentServer)) {
        echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a server to view channels</div>';
        return;
    }

    $chatType = 'channel';
    $targetId = $activeChannelId;
    $messages = $channelMessages;
    
    $activeChannel = null;
    foreach ($serverChannels as $channel) {
        if ($channel['id'] == $activeChannelId) {
            $activeChannel = $channel;
            break;
        }
    }
    
    if ($activeChannel) {
        $chatData = $activeChannel;
        $chatTitle = $activeChannel['name'];
        $chatIcon = 'fas fa-hashtag';
        $placeholder = "Message #{$chatTitle}";
    } else {
        $chatType = null;
    }
}

if ($chatType === 'channel') {
    $activeChannel = $chatData;
    $chatTitle = $activeChannel['name'] ?? 'Unknown Channel';
    $chatIcon = 'fas fa-hashtag';
    $placeholder = "Message #{$chatTitle}";
} elseif ($chatType === 'direct' || $chatType === 'dm') {
    $chatTitle = $chatData['friend_username'] ?? 'Direct Message';
    $chatIcon = 'fas fa-user';
    $placeholder = "Message @{$chatTitle}";
} else {
    $currentServer = $GLOBALS['currentServer'] ?? null;
    $serverChannels = $GLOBALS['serverChannels'] ?? [];
    
    if ($currentServer) {
        echo '<div class="flex-1 bg-[#313338] flex flex-col items-center justify-center text-white">
            <div class="text-center max-w-md">
                <i class="fas fa-hashtag text-6xl text-gray-600 mb-4"></i>
                <h2 class="text-2xl font-semibold mb-2">Welcome to ' . htmlspecialchars($currentServer->name ?? 'this server') . '!</h2>
                <p class="text-[#b5bac1] mb-4">Select a channel from the sidebar to start chatting with other members.</p>';
        if (!empty($serverChannels)) {
            echo '<button class="bg-[#5865f2] hover:bg-[#4752c4] text-white px-4 py-2 rounded transition-colors" 
                        onclick="document.querySelector(\'.channel-item\')?.click()">
                    Go to first channel
                </button>';
        }
        echo '</div></div>';
    } else {
        echo '<div class="flex-1 bg-[#313338] flex items-center justify-center text-white text-lg">Select a server to view channels</div>';
    }
    return;
}

$additional_js[] = 'components/messaging/chat-section';
$additional_css[] = 'chat-section';
?>

<!-- Direct CSS inclusion to ensure styles are loaded -->
<link rel="stylesheet" href="<?php echo css('chat-section'); ?>?v=<?php echo time(); ?>">

<!-- Backup inline styles for critical elements -->
<style>
.message-group {
    position: relative;
    margin: 0 0 2px 0;
    padding: 5px 16px;
    display: flex;
    align-items: flex-start;
    background-color: transparent;
}

.message-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 10px;
    flex-shrink: 0;
}

.message-content-wrapper {
    flex-grow: 1;
    padding-top: 2px;
}

.message-header {
    display: flex;
    align-items: center;
    margin-bottom: 2px;
}

.message-username {
    font-weight: 600;
    color: #f2f3f5;
    margin-right: 8px;
    font-size: 14px;
}

.message-timestamp {
    font-size: 0.7rem;
    color: #a3a6aa;
}

.message-bubble {
    background-color: #383a40;
    border-radius: 4px;
    padding: 7px 10px;
    margin-top: 0;
    display: inline-block;
    max-width: 90%;
    color: #dcddde;
}

.message-main-text {
    color: #dcddde;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 14px;
    line-height: 1.3;
}

.message-contents {
    margin-top: 0;
}

.message-content {
    margin-bottom: 2px;
}
</style>

<meta name="chat-type" content="<?php echo htmlspecialchars($chatType ?? 'channel'); ?>">
<meta name="chat-id" content="<?php echo htmlspecialchars($targetId ?? ''); ?>">
<meta name="channel-id" content="<?php echo htmlspecialchars($chatType === 'channel' ? $targetId : ''); ?>">
<meta name="user-id" content="<?php echo htmlspecialchars($currentUserId); ?>">
<meta name="username" content="<?php echo htmlspecialchars($_SESSION['username'] ?? ''); ?>">
<meta name="chat-title" content="<?php echo htmlspecialchars($chatTitle ?? ''); ?>">
<meta name="chat-placeholder" content="<?php echo htmlspecialchars($placeholder ?? ''); ?>">

<div class="flex flex-col flex-1 h-screen chat-container bg-[#313338]">
    <!-- Channel Header -->
    <div class="h-12 border-b border-[#1e1f22] flex items-center px-4 shadow-sm bg-[#313338]">
        <div class="flex items-center">
            <i class="<?php echo $chatIcon; ?> text-[#b5bac1] mr-2"></i>
            <h2 class="font-semibold text-white"><?php echo htmlspecialchars($chatTitle); ?></h2>
        </div>
        <?php if ($chatType === 'channel' && !empty($activeChannel['topic'])): ?>
        <div class="border-l border-[#3f4147] h-6 mx-4"></div>
        <div class="text-sm text-[#b5bac1] truncate"><?php echo htmlspecialchars($activeChannel['topic']); ?></div>
        <?php endif; ?>
        <div class="flex-1"></div>
        <div class="flex space-x-4">
            <?php if ($chatType === 'channel'): ?>
            <button class="text-[#b5bac1] hover:text-white">
                <i class="fas fa-bell-slash"></i>
            </button>
            <button class="text-[#b5bac1] hover:text-white">
                <i class="fas fa-thumbtack"></i>
            </button>
            <button class="text-[#b5bac1] hover:text-white">
                <i class="fas fa-user-plus"></i>
            </button>
            <?php endif; ?>
            <button class="text-[#b5bac1] hover:text-white">
                <i class="fas fa-magnifying-glass"></i>
            </button>
            <button class="text-[#b5bac1] hover:text-white">
                <i class="fas fa-inbox"></i>
            </button>
            <button class="text-[#b5bac1] hover:text-white">
                <i class="fas fa-circle-question"></i>
            </button>
        </div>
    </div>

    <!-- Chat Messages Area -->
    <div class="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#1e1f22] scrollbar-track-transparent bg-[#313338]" id="chat-messages" data-lazyload="chat">
        <!-- Messages will be loaded here -->
    </div>

    <!-- Example Message Structure - This is hidden and only for reference
    <div class="message-group flex p-1 px-4 py-1 relative hover:bg-[rgba(4,4,5,0.07)]">
        <div class="message-avatar flex-shrink-0 mr-3 mt-0.5">
            <img src="/assets/default-avatar.svg" class="w-10 h-10 rounded-full" alt="Username's avatar">
        </div>
        <div class="flex-grow relative">
            <div class="message-header flex items-center mb-0.5">
                <span class="message-username font-medium text-[#f2f3f5] hover:underline cursor-pointer">Username</span>
                <span class="message-timestamp text-xs text-[#a3a6aa]">14:52</span>
            </div>
            <div class="message-contents">
                <div class="message-content py-0.5 hover:bg-[rgba(4,4,5,0.07)] rounded px-1 -ml-1 relative">
                    <div class="message-bubble text-[#dcddde]">
                        <div class="message-main-text text-[#dbdee1] whitespace-pre-wrap break-words">
                            Message content goes here
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    -->

    <!-- Typing Indicator -->
    <div id="typing-indicator" class="text-xs text-[#b5bac1] pb-1 pl-5 flex items-center hidden">
        <div class="flex items-center mr-2">
            <span class="h-1 w-1 bg-[#b5bac1] rounded-full animate-bounce mr-0.5" style="animation-delay: 0ms"></span>
            <span class="h-1 w-1 bg-[#b5bac1] rounded-full animate-bounce mx-0.5" style="animation-delay: 200ms"></span>
            <span class="h-1 w-1 bg-[#b5bac1] rounded-full animate-bounce ml-0.5" style="animation-delay: 400ms"></span>
        </div>
        <span>Someone is typing...</span>
    </div>

    <!-- Message Input Area -->
    <div class="px-4 pb-6 bg-[#313338]">
        <div class="relative">
            <form id="message-form" class="relative" onsubmit="return false;">
                <div class="bg-[#383a40] rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-[#5865f2] transition-colors">
                    <div class="flex items-center px-4 py-2">
                        <button type="button" class="text-[#b5bac1] hover:text-[#dcddde] flex-shrink-0" title="Upload File">
                            <i class="fas fa-circle-plus"></i>
                        </button>
                        <div class="flex-1 relative mx-3">
                            <textarea 
                                id="message-input" 
                                name="content"
                                class="w-full bg-transparent text-[#dcddde] placeholder-[#95999e] resize-none border-none outline-none text-base leading-6 max-h-40 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#1e1f22]"
                                placeholder="<?php echo htmlspecialchars($placeholder); ?>"
                                rows="1"
                                maxlength="2000"
                                autocomplete="off"
                                spellcheck="true"
                                style="min-height: 24px;"></textarea>
                        </div>

                        <div class="flex items-center space-x-3 flex-shrink-0">
                            <button type="button" class="text-[#b5bac1] hover:text-[#dcddde]" title="Gift">
                                <i class="fas fa-gift"></i>
                            </button>
                            
                            <button type="button" class="text-[#b5bac1] hover:text-[#dcddde] font-bold" title="GIF">
                                GIF
                            </button>
                            
                            <button type="button" class="text-[#b5bac1] hover:text-[#dcddde]" title="Sticker">
                                <i class="far fa-note-sticky"></i>
                            </button>
                            
                            <button type="button" class="text-[#b5bac1] hover:text-[#dcddde]" title="Emoji">
                                <i class="far fa-face-smile"></i>
                            </button>
                            
                            <button 
                                type="button" 
                                id="send-button" 
                                class="text-[#b5bac1] hover:text-white transition-colors"
                                title="Send Message"
                                disabled>
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Context Menu Template (Hidden by default) -->
    <div id="message-context-menu" class="hidden fixed bg-[#18191c] rounded-md shadow-lg z-50 py-2 min-w-[180px] text-sm font-medium">
        <div class="px-1">
            <button data-action="reaction" class="flex items-center justify-between w-full px-2 py-1.5 text-[#b5bac1] hover:bg-[#5865f2] hover:text-white rounded">
                <span>Add Reaction</span>
                <i class="far fa-face-smile w-4"></i>
            </button>
            <button data-action="edit" class="flex items-center justify-between w-full px-2 py-1.5 text-[#b5bac1] hover:bg-[#5865f2] hover:text-white rounded">
                <span>Edit Message</span>
                <i class="fas fa-pen-to-square w-4"></i>
            </button>
            <button data-action="reply" class="flex items-center justify-between w-full px-2 py-1.5 text-[#b5bac1] hover:bg-[#5865f2] hover:text-white rounded">
                <span>Reply</span>
                <i class="fas fa-reply w-4"></i>
            </button>
            <button data-action="copy" class="flex items-center justify-between w-full px-2 py-1.5 text-[#b5bac1] hover:bg-[#5865f2] hover:text-white rounded">
                <span>Copy Text</span>
                <i class="fas fa-copy w-4"></i>
            </button>
            <button data-action="pin" class="flex items-center justify-between w-full px-2 py-1.5 text-[#b5bac1] hover:bg-[#5865f2] hover:text-white rounded">
                <span>Pin Message</span>
                <i class="fas fa-thumbtack w-4"></i>
            </button>
        </div>
    </div>
</div>

</script>