<?php
    $channel = $channel ?? null;
    $active = $active ?? false;
    
    if (!$channel) return;
    
    $channelId = $channel['id'] ?? 0;
    $channelName = $channel['name'] ?? '';
    $channelType = $channel['type'] ?? 1;
    $typeName = $channel['type_name'] ?? 'text';
    $isPrivate = $channel['is_private'] ?? false;
    
    // Channel icon mapping
    $icon = '#';
    if ($typeName == 'voice') {
        $icon = '<i class="fas fa-volume-up"></i>';
    } elseif ($typeName == 'announcement') {
        $icon = '<i class="fas fa-bullhorn"></i>';
    }
?>

<div class="channel-item <?= $active ? 'active' : '' ?>" data-channel-id="<?= $channelId ?>">
    <div class="d-flex align-items-center">
        <span class="channel-hash"><?= $icon ?></span>
        <span class="channel-name"><?= htmlspecialchars($channelName) ?></span>
        <?php if ($isPrivate): ?>
            <i class="fas fa-lock ml-auto" title="Private channel"></i>
        <?php endif; ?>
    </div>
</div> 