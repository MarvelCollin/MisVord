<?php
require_once dirname(dirname(__DIR__)) . '/config/session.php';

if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    session_start();
}

if (!function_exists('asset')) {
    require_once dirname(dirname(__DIR__)) . '/config/helpers.php';
}

require_once dirname(dirname(__DIR__)) . '/controllers/HomeController.php';
$homeController = new HomeController();
$homeData = $homeController->index();

$currentUserId = $homeData['currentUserId'];
$userServers = $homeData['userServers'];
$memberships = $homeData['memberships'];

$contentType = 'home';
if (isset($_SESSION['active_dm']) && !empty($_SESSION['active_dm'])) {
    $contentType = 'dm';
    $activeDmId = $_SESSION['active_dm'];
    
    require_once dirname(__DIR__) . '/../controllers/ChatController.php';
    $chatController = new ChatController();
    
    $GLOBALS['chatType'] = 'direct';
    $GLOBALS['targetId'] = $activeDmId;
    
    require_once dirname(__DIR__) . '/../database/repositories/ChatRoomRepository.php';
    $chatRoomRepository = new ChatRoomRepository();
    
    $chatRoom = $chatRoomRepository->find($activeDmId);
    if ($chatRoom) {
        $participants = $chatRoomRepository->getParticipants($activeDmId);
        $friend = null;
        
        foreach ($participants as $participant) {
            if ($participant['user_id'] != $currentUserId) {
                $friend = [
                    'id' => $participant['user_id'],
                    'username' => $participant['username'],
                    'avatar_url' => $participant['avatar_url']
                ];
                break;
            }
        }
        
        $chatData = [
            'friend_username' => $friend['username'] ?? 'Unknown User',
            'friend_id' => $friend['id'] ?? null,
            'friend_avatar_url' => $friend['avatar_url'] ?? null
        ];
        
        $GLOBALS['chatData'] = $chatData;
        
        $messages = $chatRoomRepository->getMessages($activeDmId, 20, 0);
        $GLOBALS['messages'] = $messages;
    }
}

$page_title = 'misvord - Home';
$body_class = 'bg-discord-dark text-white';
$page_css = 'app';
$page_js = 'pages/app';
$additional_js = [
    'components/servers/server-dropdown', 
    'components/servers/server-sidebar'
];
$head_scripts = ['logger-init'];
?>

<?php ob_start(); ?>

<?php if (isset($_GET['debug'])): ?>
<div style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 5px; z-index: 1000; color: white; max-width: 500px; overflow: auto; max-height: 80%;">
    <h3>Debug Info</h3>
    <p>User ID: <?php echo $currentUserId; ?></p>
    <p>Memberships: <?php echo count($memberships); ?></p>
    <ul>
    <?php foreach($memberships as $m): ?>
        <li>Server ID: <?php echo $m['server_id']; ?>, Role: <?php echo $m['role']; ?></li>
    <?php endforeach; ?>
    </ul>
    <p>Servers: <?php echo count($GLOBALS['userServers']); ?></p>
    <pre><?php print_r($GLOBALS['userServers']); ?></pre>
</div>
<?php endif; ?>

<!-- Socket data for JavaScript access -->
<div id="socket-data" style="display: none;" 
     data-user-id="<?php echo htmlspecialchars($currentUserId); ?>"
     data-username="<?php echo htmlspecialchars($GLOBALS['currentUser']['username'] ?? ''); ?>"
     data-channel-id=""></div>

<?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/app-layout.php'; ?>

<?php include dirname(dirname(__DIR__)) . '/views/components/app-sections/create-server-modal.php'; ?>

<?php 
$content = ob_get_clean(); 
include dirname(dirname(__DIR__)) . '/views/layout/main-app.php';
?>