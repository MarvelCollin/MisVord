<div class="user-detail-modal" id="user-detail-modal">
    <div class="user-detail-container">
        <div class="user-detail-header">
            <div class="user-banner"></div>
            <div id="user-detail-avatar-container" class="user-avatar-container">
            </div>
            <button class="user-detail-close-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="user-detail-info">
            <div class="user-detail-name-container">
                <h2 class="user-detail-name" id="user-detail-name" data-user-id=""></h2>
                <div class="user-detail-username" id="user-detail-username"></div>
                <div class="user-detail-discriminator" id="user-detail-discriminator"></div>
            </div>
            
            <div class="user-detail-mutual">
                <div class="user-detail-mutual-item cursor-pointer" id="mutual-servers-item">
                    <i class="fas fa-project-diagram"></i>
                    <span id="user-detail-mutual-servers">0 Mutual Servers</span>
                </div>
                <div class="user-detail-mutual-item cursor-pointer" id="mutual-friends-item">
                    <i class="fas fa-user-friends"></i>
                    <span id="user-detail-mutual-friends">0 Mutual Friends</span>
                </div>
            </div>
            
            <div class="user-detail-divider"></div>
            
            <div class="user-detail-section" id="user-detail-bio-section">
                <h3 class="user-detail-section-title">ABOUT ME</h3>
                <div class="user-detail-bio" id="user-detail-bio">
                </div>
            </div>

            <div id="user-detail-roles-wrapper" style="display: none;">
                <div class="user-detail-divider"></div>
                <div class="user-detail-section">
                    <h3 class="user-detail-section-title">ROLES</h3>
                    <div class="user-detail-roles" id="user-detail-roles"></div>
                </div>
            </div>
            
            <div class="user-detail-divider"></div>
            
            <div class="user-detail-section" id="user-detail-server-section">
                <h3 class="user-detail-section-title">MEMBER SINCE</h3>
                <div class="user-detail-server-info" id="user-detail-server-info">
                </div>
            </div>
        </div>
        
    </div>
    
    <div class="mutual-detail-modal" id="mutual-detail-modal">
        <div class="mutual-detail-container">
            <div class="mutual-detail-header">
                <h3 id="mutual-detail-title">Mutual Servers</h3>
                <button class="mutual-detail-close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="mutual-detail-content" id="mutual-detail-content">
                <div class="mutual-detail-loading">Loading...</div>
            </div>
        </div>
    </div>
</div>
