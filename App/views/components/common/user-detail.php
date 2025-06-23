<!-- User Detail Modal Component -->
<div class="user-detail-modal" id="user-detail-modal">
    <div class="user-detail-container">
        <!-- Header with banner and avatar -->
        <div class="user-detail-header">
            <div class="user-banner"></div>
            <div id="user-detail-avatar-container" class="user-avatar-container">
                <!-- Avatar will be inserted here by JavaScript -->
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
            
            <!-- About Me section -->
            <div class="user-detail-section">
                <h3 class="user-detail-section-title">ABOUT ME</h3>
                <div class="user-detail-about" id="user-detail-about">
                    <!-- About me content will be inserted here -->
                </div>
            </div>
            
            <div class="user-detail-divider"></div>
            
            <!-- Member Since section -->
            <div class="user-detail-section">
                <h3 class="user-detail-section-title">MEMBER SINCE</h3>
                <div class="user-detail-member-since" id="user-detail-member-since">
                    <!-- Join date will be inserted here -->
                </div>
            </div>
            
            <div class="user-detail-divider"></div>
            
            <!-- Roles section -->
            <div class="user-detail-section" id="user-detail-roles-section">
                <h3 class="user-detail-section-title">ROLES</h3>
                <div class="user-detail-roles" id="user-detail-roles">
                    <!-- Roles will be inserted here -->
                </div>
            </div>
            
            <div class="user-detail-divider"></div>
            
            <!-- Note section -->
            <div class="user-detail-section">
                <h3 class="user-detail-section-title">NOTE</h3>
                <textarea class="user-detail-note" id="user-detail-note" placeholder="Click to add a note"></textarea>
            </div>
        </div>
        
        <!-- Action buttons -->
        <div class="user-detail-actions">
            <button class="user-detail-action-btn message-btn" id="user-detail-message-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                Message
            </button>
            <div class="user-detail-action-separator"></div>
            <button class="user-detail-action-btn add-friend-btn" id="user-detail-add-friend-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                Add Friend
            </button>
        </div>
    </div>
</div>
