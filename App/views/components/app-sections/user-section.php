<?php
/**
 * User Section Component
 * Displays users/members list in the right sidebar
 */
?>

<div class="user-section">
    <!-- Section Headers -->
    <div class="role-category">
        <h3>ONLINE — 5</h3>
        
        <!-- Online Users -->
        <div class="user-list">
            <!-- Server Owner -->
            <div class="user">
                <div class="user-avatar owner">
                    <span>OW</span>
                </div>
                <div class="user-details">
                    <span class="username owner-name">ServerOwner</span>
                    <span class="user-status">Playing MiscVord</span>
                </div>
            </div>
            
            <!-- Admin -->
            <div class="user">
                <div class="user-avatar admin">
                    <span>AD</span>
                </div>
                <div class="user-details">
                    <span class="username admin-name">Admin</span>
                    <span class="user-status">Online</span>
                </div>
            </div>
            
            <!-- Moderator -->
            <div class="user">
                <div class="user-avatar mod">
                    <span>MO</span>
                </div>
                <div class="user-details">
                    <span class="username mod-name">Moderator</span>
                    <span class="user-status">Idle</span>
                </div>
            </div>
            
            <!-- Current User -->
            <div class="user">
                <div class="user-avatar">
                    <span>ME</span>
                </div>
                <div class="user-details">
                    <span class="username">CurrentUser</span>
                    <span class="user-status">Online</span>
                </div>
            </div>
            
            <!-- Regular User -->
            <div class="user">
                <div class="user-avatar">
                    <span>JS</span>
                </div>
                <div class="user-details">
                    <span class="username">JaneSmith</span>
                    <span class="user-status">Streaming</span>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Offline Section -->
    <div class="role-category offline">
        <h3>OFFLINE — 3</h3>
        
        <!-- Offline Users -->
        <div class="user-list">
            <div class="user offline-user">
                <div class="user-avatar offline">
                    <span>U1</span>
                </div>
                <span class="username offline-name">User1</span>
            </div>
            
            <div class="user offline-user">
                <div class="user-avatar offline">
                    <span>U2</span>
                </div>
                <span class="username offline-name">User2</span>
            </div>
            
            <div class="user offline-user">
                <div class="user-avatar offline">
                    <span>U3</span>
                </div>
                <span class="username offline-name">User3</span>
            </div>
        </div>
    </div>

    <style>
        .user-section {
            width: 240px;
            background-color: var(--discord-secondary);
            height: 100%;
            padding: 16px 8px;
            overflow-y: auto;
            flex-shrink: 0;
        }

        .role-category h3 {
            color: var(--discord-channels);
            font-size: 12px;
            font-weight: 600;
            padding: 8px;
            margin-bottom: 4px;
        }

        .user-list {
            margin-bottom: 16px;
        }

        .user {
            display: flex;
            align-items: center;
            padding: 6px 8px;
            border-radius: 4px;
            cursor: pointer;
        }

        .user:hover {
            background-color: rgba(79,84,92,0.3);
        }

        .user-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: #7289da;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            font-weight: bold;
            font-size: 12px;
            margin-right: 8px;
            position: relative;
        }

        .user-avatar.owner {
            background-color: #faa61a;
        }

        .user-avatar.admin {
            background-color: #ed4245;
        }

        .user-avatar.mod {
            background-color: #5865f2;
        }

        .user-avatar.offline {
            background-color: #747f8d;
        }

        .user-avatar::after {
            content: '';
            position: absolute;
            bottom: 0;
            right: 0;
            width: 10px;
            height: 10px;
            background-color: var(--discord-green);
            border-radius: 50%;
            border: 2px solid var(--discord-secondary);
        }

        .user-avatar.offline::after {
            background-color: #747f8d;
        }

        .user-details {
            display: flex;
            flex-direction: column;
        }

        .username {
            font-weight: 600;
            font-size: 14px;
        }

        .owner-name {
            color: #faa61a;
        }

        .admin-name {
            color: #ed4245;
        }

        .mod-name {
            color: #5865f2;
        }

        .offline-name {
            color: #96989d;
        }

        .user-status {
            color: var(--discord-channels);
            font-size: 12px;
        }

        .offline-user {
            opacity: 0.6;
        }
    </style>
</div>
