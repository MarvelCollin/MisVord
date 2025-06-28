<div class="user-detail-modal" id="user-detail-modal">
    <div class="user-detail-container">
        <div class="user-detail-header">
            <div class="user-banner"></div>
            <div id="user-detail-avatar-container" class="user-avatar-container">
                <div class="user-avatar">
                    <img src="/assets/common/default-profile-picture.png" alt="Avatar" id="user-detail-avatar">
                    <div class="user-status-indicator"></div>
                </div>
            </div>
            <button class="user-detail-close-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        
        <div class="user-detail-info">
            <div class="user-detail-name-container">
                <h2 class="user-detail-name" id="user-detail-name"></h2>
                <div class="user-detail-discriminator" id="user-detail-discriminator"></div>
            </div>
            
            <div class="user-detail-mutual">
                <div class="user-detail-mutual-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    <span id="user-detail-mutual-servers">0 Mutual Servers</span>
                </div>
                <div class="user-detail-mutual-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    <span id="user-detail-mutual-friends">0 Mutual Friends</span>
                </div>
            </div>
            
            <div class="user-detail-divider"></div>
            
            <div class="user-detail-section" id="user-detail-bio-section">
                <h3 class="user-detail-section-title">ABOUT ME</h3>
                <div class="user-detail-bio" id="user-detail-bio"></div>
            </div>
            
            <div class="user-detail-divider"></div>
            
            <div class="user-detail-section" id="user-detail-server-section">
                <h3 class="user-detail-section-title">MEMBER SINCE</h3>
                <div class="user-detail-server-info" id="user-detail-server-info"></div>
            </div>
            
            <div class="user-detail-divider"></div>
            
            <div class="user-detail-section user-detail-message-section">
                <h3 class="user-detail-section-title">MESSAGE</h3>
                <div class="user-detail-send-message-container">
                    <input type="text" class="user-detail-message-input" id="user-detail-message-input" placeholder="Message @username">
                    <button class="user-detail-send-btn" id="user-detail-send-btn" aria-label="Send Message">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                    </button>
                </div>
            </div>
            
            <div class="user-detail-divider"></div>
            
            <div class="user-detail-actions">
                <button class="user-detail-action-btn message-btn" id="user-detail-message-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    Message
                </button>
                <div class="user-detail-action-separator"></div>
                <button class="user-detail-action-btn" id="user-detail-add-friend-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                    Add Friend
                </button>
            </div>
        </div>
    </div>
</div>
