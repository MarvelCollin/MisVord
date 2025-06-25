<?php

$page_title = 'MisVord - Accept Invite';
$page_css = ['app', 'accept-invite'];
$page_js = 'pages/accept-invite';
$additional_js = [];


if (session_status() === PHP_SESSION_NONE) {
    require_once dirname(dirname(__DIR__)) . '/config/session.php';
    session_start();
    
    if (function_exists('logger')) {
        logger()->debug("Session started in accept-invite.php", [
            'session_id' => session_id(),
            'user_id' => $_SESSION['user_id'] ?? 'not_set',
            'session_data' => $_SESSION
        ]);
    }
}

$server = $GLOBALS['inviteServer'] ?? null;
$inviteCode = $GLOBALS['inviteCode'] ?? null;
$invite = $GLOBALS['invite'] ?? null;
$inviteError = $GLOBALS['inviteError'] ?? null;
$username = $_SESSION['username'] ?? 'there';

if (function_exists('logger')) {
    logger()->debug("Accept invite page loaded", [
        'session_id' => session_id(),
        'user_id' => $_SESSION['user_id'] ?? 'not_set',
        'is_authenticated' => isset($_SESSION['user_id']),
        'server' => $server ? ['id' => $server->id, 'name' => $server->name] : null,
        'invite_code' => $inviteCode,
        'has_error' => !empty($inviteError)
    ]);
}

ob_start();
?>
<div class="invite-container">
    <div class="invite-card">
        <?php if ($inviteError): ?>
            <div id="invite-error-container" class="invite-body">
                <div class="invite-error">
                    <p><i class="fas fa-exclamation-triangle"></i> <span id="error-message"><?php echo htmlspecialchars($inviteError); ?></span></p>
                    <p class="error-description">The invite may have expired or been revoked by the server owner.</p>
                </div>
                <div class="btn-container">
                    <a href="/app" class="btn btn-secondary">Back to App</a>
                </div>
            </div>
        <?php else: ?>
            <div id="invite-error-container" class="invite-body hidden">
                <div class="invite-error">
                    <p><i class="fas fa-exclamation-triangle"></i> <span id="error-message">This invite link is invalid or has expired</span></p>
                    <p class="error-description">The invite may have expired or been revoked by the server owner.</p>
                </div>
                <div class="btn-container">
                    <a href="/app" class="btn btn-secondary">Back to App</a>
                </div>
            </div>
            
            <div id="invite-content" <?php echo $inviteError ? 'class="hidden"' : ''; ?>>
                <?php if ($server): ?>
                    <?php if (!empty($server->banner_url)): ?>
                    <div class="server-banner">
                        <img src="<?php echo htmlspecialchars($server->banner_url); ?>" alt="<?php echo htmlspecialchars($server->name); ?> banner">
                    </div>
                    <?php endif; ?>
                    
                    <div class="invite-header">
                        <div class="server-icon">
                            <?php if ($server->image_url): ?>
                                <img src="<?php echo htmlspecialchars($server->image_url); ?>" alt="<?php echo htmlspecialchars($server->name); ?>">
                            <?php else: ?>
                                <?php echo substr($server->name, 0, 1); ?>
                            <?php endif; ?>
                        </div>
                        <h2 class="server-name"><?php echo htmlspecialchars($server->name); ?></h2>

                        <?php if ($server->description): ?>
                            <p class="server-description"><?php echo htmlspecialchars($server->description); ?></p>
                        <?php endif; ?>
                        
                        <?php if ($invite && $invite->expires_at): ?>
                            <div class="invite-expiry">
                                <i class="fas fa-clock"></i>
                                This invite expires on <?php echo date('F j, Y, g:i a', strtotime($invite->expires_at)); ?>
                            </div>
                        <?php endif; ?>
                    </div>

                    <div class="invite-body">
                        <div class="invite-message">
                            <p class="welcome-message">Hi <?php echo htmlspecialchars($username); ?>!</p>
                            <p>You've been invited to join <strong><?php echo htmlspecialchars($server->name); ?></strong>.</p>
                        </div>

                        <?php if (!isset($_SESSION['user_id'])): ?>
                            <div class="login-required">
                                <p>
                                    <i class="fas fa-info-circle"></i> 
                                    You need to log in before you can accept this invitation.
                                </p>
                                <div class="auth-options">
                                    <a href="/login?redirect=<?php echo urlencode('/join/' . $inviteCode); ?>" class="btn btn-primary">
                                        Log In
                                    </a>
                                    <a href="/register?redirect=<?php echo urlencode('/join/' . $inviteCode); ?>" class="btn btn-secondary">
                                        Register
                                    </a>
                                </div>
                            </div>
                        <?php else: ?>
                            <div id="join-options" class="btn-container">
                                <a href="/api/servers/join/<?php echo htmlspecialchars($inviteCode); ?>" id="join-server-btn" class="btn btn-primary">
                                    Accept Invitation
                                </a>
                                <a href="/app" class="btn btn-secondary">
                                    Cancel
                                </a>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php else: ?>
                    <div class="invite-invalid">
                        <div class="icon">
                            <i class="fas fa-link-slash"></i>
                        </div>
                        <h2>Invalid Invite</h2>
                        <p>This invite may be expired, or you might not have permission to join.</p>
                        <a href="/app" class="btn btn-primary">
                            Back to App
                        </a>
                    </div>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>
</div>
<?php
$content = ob_get_clean();

$body_class = 'bg-discord-dark text-white min-h-screen';

include dirname(__DIR__) . '/layout/main-app.php';
?>