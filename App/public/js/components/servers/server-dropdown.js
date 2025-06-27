import { showToast } from '../../core/ui/toast.js';
if (typeof window !== 'undefined' && window.logger) {
    window.logger.info('server', 'server-dropdown.js loaded successfully - UPDATED VERSION');
}
window.SERVER_DROPDOWN_VERSION = '2.0';
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window !== 'undefined' && window.logger) {
        window.logger.debug('server', 'server-dropdown.js DOMContentLoaded triggered - UPDATED VERSION');
    }
    
    const isServerPage = document.getElementById('server-dropdown-btn') !== null;
    
    if (isServerPage) {
        const dropdownBtn = document.getElementById('server-dropdown-btn');
        const dropdown = document.getElementById('server-dropdown');
        console.log('Dropdown elements found:', { dropdownBtn: !!dropdownBtn, dropdown: !!dropdown });
        initServerDropdown();
        initServerActions();
    } else {
        console.log('Not on a server page, skipping server dropdown initialization');
    }
});

window.testDropdown = function() {
    console.log('Testing dropdown...');
    const btn = document.getElementById('server-dropdown-btn');
    const dropdown = document.getElementById('server-dropdown');

    console.log('Test results:', {
        button: !!btn,
        dropdown: !!dropdown,
        buttonVisible: btn ? !btn.style.display || btn.style.display !== 'none' : false,
        dropdownHidden: dropdown ? dropdown.classList.contains('hidden') : false
    });

    if (btn && dropdown) {
        dropdown.classList.toggle('hidden');
        console.log('Toggled dropdown, now hidden:', dropdown.classList.contains('hidden'));
    }

    return { btn, dropdown };
};

function initServerDropdown() {
    console.log('initServerDropdown called');

    setTimeout(() => {
        const dropdownBtn = document.getElementById('server-dropdown-btn');
        const dropdown = document.getElementById('server-dropdown');

        console.log('Elements after timeout:', { 
            dropdownBtn: !!dropdownBtn, 
            dropdown: !!dropdown,
            dropdownBtnElement: dropdownBtn,
            dropdownElement: dropdown
        });

        if (dropdownBtn && dropdown) {
            console.log('Setting up dropdown functionality');

            const newBtn = dropdownBtn.cloneNode(true);
            dropdownBtn.parentNode.replaceChild(newBtn, dropdownBtn);

            newBtn.addEventListener('click', function(e) {
                console.log('Dropdown button clicked!');
                e.preventDefault();
                e.stopPropagation();
                dropdown.classList.toggle('hidden');
                console.log('Dropdown visible:', !dropdown.classList.contains('hidden'));
            });

            document.addEventListener('click', function(e) {
                if (!dropdown.contains(e.target) && !newBtn.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            });

            console.log('Dropdown setup complete');

        } else {
            console.error('Dropdown elements not found!');
            console.log('All buttons:', document.querySelectorAll('button'));
            console.log('All elements with server in id:', document.querySelectorAll('[id*="server"]'));
        }
    }, 100);
}

function initServerActions() {
    const dropdownItems = document.querySelectorAll('.server-dropdown-item');

    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const actionText = this.querySelector('span').textContent.trim();

            const dropdown = document.getElementById('server-dropdown');
            if (dropdown) dropdown.classList.add('hidden');

            switch(actionText) {
                case 'Invite People':
                    showInvitePeopleModal();
                    break;
                case 'Server Settings':
                    redirectToServerSettings();
                    break;
                case 'Create Channel':
                    showCreateChannelModal();
                    break;
                case 'Create Category':
                    showCreateCategoryModal();
                    break;
                case 'Notification Settings':
                    showNotificationSettingsModal();
                    break;
                case 'Edit Per-server Profile':
                    showEditProfileModal();
                    break;
                case 'Leave Server':
                    showLeaveServerConfirmation();
                    break;
            }
        });
    });
}

function showInvitePeopleModal() {
    const serverId = getCurrentServerId();
    const modal = document.getElementById('invite-people-modal');

    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.zIndex = '9999';
        
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('animate-fade-in');
            modalContent.style.maxHeight = '80vh';
            modalContent.style.width = '450px';
            modalContent.style.maxWidth = '95vw';
            modalContent.style.overflowY = 'auto';
            modalContent.style.position = 'relative';
            modalContent.style.margin = '0 auto';
            modalContent.style.padding = '24px';
            modalContent.style.borderRadius = '8px';
            modalContent.style.backgroundColor = '#36393f';
            modalContent.style.boxShadow = '0 0 0 1px rgba(32,34,37,.6), 0 2px 10px 0 rgba(0,0,0,.2)';
        }
        
        loadInviteLink(serverId);

        const copyBtn = document.getElementById('copy-invite-link');
        const generateBtn = document.getElementById('generate-new-invite');
        const closeBtn = document.getElementById('close-invite-modal');
        const expirationSelect = document.getElementById('invite-expiration');
        const expirationInfo = document.getElementById('invite-expiration-info');
        const friendSearchInput = document.getElementById('friend-search');
        const sendInvitesBtn = document.getElementById('send-invites-btn');
        const inviteLinkSection = document.getElementById('invite-link-section');
        const friendsSection = document.getElementById('invite-friends-section');
        const searchResults = document.getElementById('friend-search-results');
        
        
        if (friendsSection) {
            friendsSection.style.position = 'relative';
        }

        
        if (inviteLinkSection) {
            inviteLinkSection.style.marginBottom = '24px';
            inviteLinkSection.style.padding = '16px';
            inviteLinkSection.style.borderRadius = '8px';
            inviteLinkSection.style.backgroundColor = '#2f3136';
            inviteLinkSection.style.border = '1px solid #202225';
        }
        
        if (friendsSection) {
            friendsSection.style.padding = '16px';
            friendsSection.style.borderRadius = '8px';
            friendsSection.style.backgroundColor = '#2f3136';
            friendsSection.style.border = '1px solid #202225';
            friendsSection.style.marginBottom = '40px'; 
        }
        
        
        if (searchResults) {
            searchResults.style.position = 'absolute';
            searchResults.style.zIndex = '10000';
            searchResults.style.width = '100%';
            searchResults.style.left = '0';
            searchResults.style.marginTop = '4px';
            searchResults.style.maxHeight = '300px'; 
            searchResults.style.overflowY = 'auto';
            searchResults.style.backgroundColor = '#36393f';
            searchResults.style.borderRadius = '4px';
            searchResults.style.border = '1px solid #202225';
            searchResults.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.24)';
        }

        
        const inviteLinkInput = document.getElementById('invite-link');
        if (inviteLinkInput) {
            inviteLinkInput.style.backgroundColor = '#36393f';
            inviteLinkInput.style.color = 'white';
            inviteLinkInput.style.border = '1px solid #202225';
            inviteLinkInput.style.borderRadius = '4px';
            inviteLinkInput.style.padding = '8px 10px';
            inviteLinkInput.style.width = '100%';
            inviteLinkInput.style.marginBottom = '8px';
        }
        
        if (expirationSelect) {
            expirationSelect.style.backgroundColor = '#36393f';
            expirationSelect.style.color = 'white';
            expirationSelect.style.border = '1px solid #202225';
            expirationSelect.style.borderRadius = '4px';
            expirationSelect.style.padding = '8px 10px';
            expirationSelect.style.width = '100%';
            expirationSelect.style.marginBottom = '12px';
            expirationSelect.style.cursor = 'pointer';
        }
        
        if (generateBtn) {
            generateBtn.style.backgroundColor = '#3ba55c';
            generateBtn.style.color = 'white';
            generateBtn.style.border = 'none';
            generateBtn.style.borderRadius = '4px';
            generateBtn.style.padding = '8px 16px';
            generateBtn.style.cursor = 'pointer';
            generateBtn.style.fontWeight = 'bold';
            generateBtn.style.transition = 'background-color 0.2s';
            generateBtn.style.display = 'block';
            generateBtn.style.margin = '0 auto';
            generateBtn.style.width = 'auto';
            
            generateBtn.addEventListener('mouseover', () => {
                generateBtn.style.backgroundColor = '#2d7d46';
            });
            
            generateBtn.addEventListener('mouseout', () => {
                generateBtn.style.backgroundColor = '#3ba55c';
            });
            
            if (!generateBtn.hasAttribute('data-listener')) {
            generateBtn.addEventListener('click', () => {
                const expirationValue = expirationSelect ? expirationSelect.value : null;
                generateNewInvite(serverId, expirationValue);
            });
            generateBtn.setAttribute('data-listener', 'true');
            }
        }
        
        if (copyBtn && !copyBtn.hasAttribute('data-listener')) {
            copyBtn.style.backgroundColor = '#5865f2';
            copyBtn.style.color = 'white';
            copyBtn.style.border = 'none';
            copyBtn.style.borderRadius = '4px';
            copyBtn.style.padding = '8px 16px';
            copyBtn.style.cursor = 'pointer';
            copyBtn.style.transition = 'background-color 0.2s';
            
            copyBtn.addEventListener('mouseover', () => {
                copyBtn.style.backgroundColor = '#4752c4';
            });
            
            copyBtn.addEventListener('mouseout', () => {
                copyBtn.style.backgroundColor = '#5865f2';
            });
            
            copyBtn.addEventListener('click', copyInviteLink);
            copyBtn.setAttribute('data-listener', 'true');
        }

        if (closeBtn && !closeBtn.hasAttribute('data-listener')) {
            closeBtn.style.position = 'absolute';
            closeBtn.style.top = '16px';
            closeBtn.style.right = '16px';
            closeBtn.style.backgroundColor = 'transparent';
            closeBtn.style.border = 'none';
            closeBtn.style.color = '#b9bbbe';
            closeBtn.style.fontSize = '24px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.transition = 'color 0.2s';
            
            closeBtn.addEventListener('mouseover', () => {
                closeBtn.style.color = 'white';
            });
            
            closeBtn.addEventListener('mouseout', () => {
                closeBtn.style.color = '#b9bbbe';
            });
            
            closeBtn.addEventListener('click', () => closeModal('invite-people-modal'));
            closeBtn.setAttribute('data-listener', 'true');
        }
        
        if (friendSearchInput && !friendSearchInput.hasAttribute('data-listener')) {
            friendSearchInput.style.backgroundColor = '#36393f';
            friendSearchInput.style.color = 'white';
            friendSearchInput.style.border = '1px solid #202225';
            friendSearchInput.style.borderRadius = '4px';
            friendSearchInput.style.padding = '8px 10px';
            friendSearchInput.style.width = '100%';
            friendSearchInput.style.marginBottom = '8px';
            
            initFriendSearch(friendSearchInput);
            friendSearchInput.setAttribute('data-listener', 'true');
        }
        
        if (sendInvitesBtn && !sendInvitesBtn.hasAttribute('data-listener')) {
            sendInvitesBtn.style.backgroundColor = '#5865f2';
            sendInvitesBtn.style.color = 'white';
            sendInvitesBtn.style.border = 'none';
            sendInvitesBtn.style.borderRadius = '4px';
            sendInvitesBtn.style.padding = '8px 16px';
            sendInvitesBtn.style.cursor = 'pointer';
            sendInvitesBtn.style.marginTop = '12px';
            sendInvitesBtn.style.fontWeight = 'bold';
            sendInvitesBtn.style.transition = 'background-color 0.2s';
            
            sendInvitesBtn.addEventListener('mouseover', () => {
                sendInvitesBtn.style.backgroundColor = '#4752c4';
            });
            
            sendInvitesBtn.addEventListener('mouseout', () => {
                sendInvitesBtn.style.backgroundColor = '#5865f2';
            });
            
            sendInvitesBtn.addEventListener('click', () => sendServerInvitesToFriends(serverId));
            sendInvitesBtn.setAttribute('data-listener', 'true');
        }
        
        
        const selectedFriendsContainer = document.getElementById('selected-friends');
        if (selectedFriendsContainer) {
            selectedFriendsContainer.style.display = 'flex';
            selectedFriendsContainer.style.flexWrap = 'wrap';
            selectedFriendsContainer.style.gap = '8px';
            selectedFriendsContainer.style.marginTop = '12px';
            selectedFriendsContainer.style.marginBottom = '12px';
            selectedFriendsContainer.innerHTML = '';
        }
        
        const friendsActionsContainer = document.getElementById('invite-friends-actions');
        if (friendsActionsContainer) {
            friendsActionsContainer.classList.add('hidden');
}

        
        const modalHeading = modal.querySelector('h2, h3');
        if (modalHeading) {
            modalHeading.style.fontSize = '24px';
            modalHeading.style.fontWeight = 'bold';
            modalHeading.style.marginBottom = '12px';
            modalHeading.style.color = 'white';
        }
        
        const modalSubHeading = modal.querySelector('p:not(.selected-friend)');
        if (modalSubHeading) {
            modalSubHeading.style.fontSize = '14px';
            modalSubHeading.style.color = '#b9bbbe';
            modalSubHeading.style.marginBottom = '16px';
        }
        
        
        const sectionHeadings = modal.querySelectorAll('h4');
        sectionHeadings.forEach(heading => {
            heading.style.fontSize = '16px';
            heading.style.fontWeight = 'bold';
            heading.style.marginBottom = '8px';
            heading.style.color = 'white';
        });
    }
}

function initFriendSearch(searchInput) {
    const resultsContainer = document.getElementById('friend-search-results');
    const searchPrompt = document.getElementById('search-friend-prompt');
    const noFriendsFoundMsg = document.getElementById('no-friends-found');
    const friendsSection = document.getElementById('invite-friends-section');
    
    if (searchPrompt) {
    searchPrompt.classList.remove('hidden');
        searchPrompt.style.padding = '12px';
        searchPrompt.style.color = '#b9bbbe';
        searchPrompt.style.textAlign = 'center';
    }
    
    if (noFriendsFoundMsg) {
        noFriendsFoundMsg.style.padding = '12px';
        noFriendsFoundMsg.style.color = '#b9bbbe';
        noFriendsFoundMsg.style.textAlign = 'center';
    }
    
    
    let dropdownContainer = document.getElementById('global-friend-search-results-container');
    
    if (!dropdownContainer) {
        dropdownContainer = document.createElement('div');
        dropdownContainer.id = 'global-friend-search-results-container';
        dropdownContainer.style.position = 'fixed';
        dropdownContainer.style.zIndex = '99999'; 
        dropdownContainer.style.top = '0';
        dropdownContainer.style.left = '0';
        dropdownContainer.style.width = '100%';
        dropdownContainer.style.height = '0';
        dropdownContainer.style.overflow = 'visible';
        dropdownContainer.style.pointerEvents = 'none'; 
        document.body.appendChild(dropdownContainer);
        
        
        if (resultsContainer) {
            dropdownContainer.appendChild(resultsContainer);
            
            resultsContainer.style.pointerEvents = 'auto';
        }
    }
    
    
    if (resultsContainer) {
        
        resultsContainer.style.position = 'fixed'; 
        resultsContainer.style.zIndex = '99999'; 
        resultsContainer.style.backgroundColor = '#36393f';
        resultsContainer.style.borderRadius = '4px';
        resultsContainer.style.border = '1px solid #202225';
        resultsContainer.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.24)';
        resultsContainer.style.maxHeight = '300px';
        resultsContainer.style.overflowY = 'auto';
        resultsContainer.classList.add('hidden');
    }
    
    searchInput.addEventListener('focus', () => {
        if (resultsContainer) {
        resultsContainer.classList.remove('hidden');
            
            
            const inputRect = searchInput.getBoundingClientRect();
            resultsContainer.style.width = inputRect.width + 'px';
            resultsContainer.style.left = inputRect.left + 'px';
            resultsContainer.style.top = (inputRect.bottom + 4) + 'px';
            
            
            const dropdownHeight = Math.min(300, resultsContainer.scrollHeight);
            if (inputRect.bottom + dropdownHeight + 4 > window.innerHeight) {
                
                resultsContainer.style.top = 'auto';
                resultsContainer.style.bottom = (window.innerHeight - inputRect.top + 4) + 'px';
            } else {
                
                resultsContainer.style.top = (inputRect.bottom + 4) + 'px';
                resultsContainer.style.bottom = 'auto';
            }
        }
    });
    
    
    const updatePosition = () => {
        if (resultsContainer && !resultsContainer.classList.contains('hidden')) {
            const inputRect = searchInput.getBoundingClientRect();
            resultsContainer.style.width = inputRect.width + 'px';
            resultsContainer.style.left = inputRect.left + 'px';
            
            
            const dropdownHeight = Math.min(300, resultsContainer.scrollHeight);
            if (inputRect.bottom + dropdownHeight + 4 > window.innerHeight) {
                
                resultsContainer.style.top = 'auto';
                resultsContainer.style.bottom = (window.innerHeight - inputRect.top + 4) + 'px';
            } else {
                
                resultsContainer.style.top = (inputRect.bottom + 4) + 'px';
                resultsContainer.style.bottom = 'auto';
            }
        }
    };
    
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    searchInput.addEventListener('blur', (e) => {
        setTimeout(() => {
            if (resultsContainer && !resultsContainer.contains(document.activeElement)) {
                resultsContainer.classList.add('hidden');
            }
        }, 200);
    });
    
    searchInput.addEventListener('input', debounce((e) => {
        const query = e.target.value.trim();
        
        if (!window.FriendAPI) {
            console.error('FriendAPI not available');
            return;
        }
        
        if (query.length === 0) {
            if (resultsContainer) resultsContainer.innerHTML = '';
            if (searchPrompt) searchPrompt.classList.remove('hidden');
            if (noFriendsFoundMsg) noFriendsFoundMsg.classList.add('hidden');
            return;
        }
        
        if (searchPrompt) searchPrompt.classList.add('hidden');
        
        
        const inputRect = searchInput.getBoundingClientRect();
        if (resultsContainer) {
            resultsContainer.style.width = inputRect.width + 'px';
            resultsContainer.style.left = inputRect.left + 'px';
            resultsContainer.style.top = (inputRect.bottom + 4) + 'px';
        }
        
        searchFriends(query);
    }, 300));
}

function searchFriends(query) {
    const resultsContainer = document.getElementById('friend-search-results');
    const noFriendsFoundMsg = document.getElementById('no-friends-found');
    
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div style="text-align: center; padding: 12px;"><i class="fas fa-spinner fa-spin mr-2"></i>Searching...</div>';
    
        
        resultsContainer.style.position = 'fixed'; 
        resultsContainer.style.zIndex = '99999'; 
        
        
        const searchInput = document.getElementById('friend-search');
        if (searchInput) {
            const inputRect = searchInput.getBoundingClientRect();
            resultsContainer.style.width = inputRect.width + 'px';
            resultsContainer.style.left = inputRect.left + 'px';
            resultsContainer.style.top = (inputRect.bottom + 4) + 'px';
        } else {
            resultsContainer.style.width = '100%';
            resultsContainer.style.left = '0';
        }
        
        resultsContainer.style.maxHeight = '300px';
        resultsContainer.style.overflowY = 'auto';
        resultsContainer.style.backgroundColor = '#36393f';
        resultsContainer.style.borderRadius = '4px';
        resultsContainer.style.border = '1px solid #202225';
        resultsContainer.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.24)';
    }
    
    if (!window.FriendAPI) {
        if (resultsContainer) {
            resultsContainer.innerHTML = '<div style="color: #ed4245; text-align: center; padding: 12px;">FriendAPI not available</div>';
        }
        return;
    }
    
    window.FriendAPI.getFriends()
        .then(friends => {
            const filteredFriends = friends.filter(friend => 
                friend.username.toLowerCase().includes(query.toLowerCase())
            );
            
            if (resultsContainer) resultsContainer.innerHTML = '';
            
            if (filteredFriends.length === 0) {
                if (noFriendsFoundMsg) noFriendsFoundMsg.classList.remove('hidden');
            } else {
                if (noFriendsFoundMsg) noFriendsFoundMsg.classList.add('hidden');
                
                filteredFriends.forEach(friend => {
                    const friendEl = createFriendElement(friend);
                    if (resultsContainer) resultsContainer.appendChild(friendEl);
                });
            }
        })
        .catch(err => {
            console.error('Error fetching friends:', err);
            if (resultsContainer) {
                resultsContainer.innerHTML = '<div style="color: #ed4245; text-align: center; padding: 12px;">Error fetching friends</div>';
            }
        });
}

function createFriendElement(friend) {
    const el = document.createElement('div');
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.padding = '12px';
    el.style.cursor = 'pointer';
    el.style.transition = 'background-color 0.2s';
    el.style.backgroundColor = '#36393f';
    el.style.borderBottom = '1px solid #202225';
    
    el.addEventListener('mouseover', () => {
        el.style.backgroundColor = '#4f545c';
    });
    
    el.addEventListener('mouseout', () => {
        el.style.backgroundColor = '#36393f';
    });
    
    el.dataset.userId = friend.id;
    el.dataset.username = friend.username;
    
    const avatarUrl = friend.avatar_url || '/public/assets/common/default-profile-picture.png';
    
    el.innerHTML = `
        <div style="flex-shrink: 0; margin-right: 12px;">
            <img src="${avatarUrl}" alt="${friend.username}" style="width: 32px; height: 32px; border-radius: 50%;">
        </div>
        <div style="flex-grow: 1;">
            <div style="color: white; font-weight: 500;">${friend.username}</div>
            <div style="font-size: 12px; color: #b9bbbe;">${friend.status || 'offline'}</div>
        </div>
    `;
    
    el.addEventListener('click', () => {
        selectFriend(friend);
        const searchResults = document.getElementById('friend-search-results');
        if (searchResults) searchResults.classList.add('hidden');
        const searchInput = document.getElementById('friend-search');
        if (searchInput) searchInput.value = '';
    });
    
    return el;
}

function selectFriend(friend) {
    const selectedFriendsContainer = document.getElementById('selected-friends');
    const friendsActionsContainer = document.getElementById('invite-friends-actions');
    
    if (document.querySelector(`.selected-friend[data-user-id="${friend.id}"]`)) {
        return;
    }
    
    const friendTag = document.createElement('div');
    friendTag.className = 'selected-friend';
    friendTag.style.display = 'inline-flex';
    friendTag.style.alignItems = 'center';
    friendTag.style.backgroundColor = '#36393f';
    friendTag.style.border = '1px solid #202225';
    friendTag.style.borderRadius = '16px';
    friendTag.style.padding = '4px 12px';
    friendTag.style.margin = '4px';
    friendTag.style.transition = 'all 0.2s';
    
    friendTag.dataset.userId = friend.id;
    friendTag.dataset.username = friend.username;
    
    friendTag.innerHTML = `
        <span style="color: white; margin-right: 8px;">${friend.username}</span>
        <button style="background: none; border: none; color: #b9bbbe; cursor: pointer; padding: 0; font-size: 14px; transition: color 0.2s;" title="Remove">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    const removeButton = friendTag.querySelector('button');
    if (removeButton) {
        removeButton.addEventListener('mouseover', () => {
            removeButton.style.color = 'white';
        });
        
        removeButton.addEventListener('mouseout', () => {
            removeButton.style.color = '#b9bbbe';
        });
        
        removeButton.addEventListener('click', () => {
            friendTag.style.transform = 'scale(0.95)';
            friendTag.style.opacity = '0';
            
            setTimeout(() => {
        friendTag.remove();
        
                if (selectedFriendsContainer && selectedFriendsContainer.children.length === 0) {
                    if (friendsActionsContainer) friendsActionsContainer.classList.add('hidden');
        }
            }, 200);
    });
    }
    
    if (selectedFriendsContainer) selectedFriendsContainer.appendChild(friendTag);
    
    if (friendsActionsContainer) friendsActionsContainer.classList.remove('hidden');
}

function sendServerInvitesToFriends(serverId) {
    const selectedFriends = document.querySelectorAll('.selected-friend');
    const inviteLink = document.getElementById('invite-link').value;
    
    if (selectedFriends.length === 0 || !inviteLink) {
        showToast('Please select friends and generate an invite link', 'error');
        return;
    }
    
    const sendBtn = document.getElementById('send-invites-btn');
    const originalText = sendBtn.textContent;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
    
    const serverName = getCurrentServerName();
    const messageContent = `Hello! You're invited to join my server "${serverName}". Click here to join: ${inviteLink}`;
    let sentCount = 0;
    let failedCount = 0;
    
    if (!window.ChatAPI) {
        showToast('Chat API not available. Cannot send invites.', 'error');
        sendBtn.disabled = false;
        sendBtn.textContent = originalText;
        return;
    }
    
    const sendPromises = Array.from(selectedFriends).map(friendEl => {
        const userId = friendEl.dataset.userId;
        const username = friendEl.dataset.username;
        
        return window.ChatAPI.sendMessage(
            userId, 
            messageContent, 
            'direct'
        )
        .then(() => {
            sentCount++;
            friendEl.classList.add('bg-green-800', 'border-green-700', 'transition-colors');
            
            const statusIcon = document.createElement('span');
            statusIcon.className = 'ml-2 text-green-400';
            statusIcon.innerHTML = '<i class="fas fa-check"></i>';
            friendEl.appendChild(statusIcon);
        })
        .catch(err => {
            console.error(`Failed to send invite to ${username}:`, err);
            failedCount++;
            friendEl.classList.add('bg-red-800', 'border-red-700', 'transition-colors');
            
            const statusIcon = document.createElement('span');
            statusIcon.className = 'ml-2 text-red-400';
            statusIcon.innerHTML = '<i class="fas fa-times"></i>';
            friendEl.appendChild(statusIcon);
        });
    });
    
    Promise.all(sendPromises)
        .finally(() => {
            sendBtn.disabled = false;
            sendBtn.textContent = originalText;
            
            if (failedCount === 0) {
                showToast(`Invites sent successfully to ${sentCount} friends`, 'success');
            } else {
                showToast(`Sent ${sentCount} invites, failed to send ${failedCount}`, 'warning');
            }
        });
}

function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

function showCreateChannelModal() {
    const serverId = getCurrentServerId();
    const modal = document.getElementById('create-channel-modal');

    if (modal) {

        if (typeof window.openCreateChannelModal === 'function') {
            window.openCreateChannelModal();
        } else {
            modal.classList.remove('hidden');

            const closeBtn = document.getElementById('close-create-channel-modal');
            const cancelBtn = document.getElementById('cancel-create-channel');
            const nameInput = document.getElementById('channel-name');

            if (closeBtn && !closeBtn.hasAttribute('data-listener')) {
                closeBtn.addEventListener('click', () => closeModal('create-channel-modal'));
                closeBtn.setAttribute('data-listener', 'true');
            }

            if (cancelBtn && !cancelBtn.hasAttribute('data-listener')) {
                cancelBtn.addEventListener('click', () => closeModal('create-channel-modal'));
                cancelBtn.setAttribute('data-listener', 'true');
            }

            if (nameInput && !nameInput.hasAttribute('data-listener')) {
                nameInput.addEventListener('input', function() {
                    this.value = this.value.toLowerCase().replace(/[^a-z0-9\-_]/g, '');
                });
                nameInput.setAttribute('data-listener', 'true');
            }
        }
    } else {
        console.error('Create channel modal not found');
    }
}

function showCreateCategoryModal() {
    const serverId = getCurrentServerId();
    const modal = document.getElementById('create-category-modal');

    if (modal) {

        if (typeof window.openCreateCategoryModal === 'function') {
            window.openCreateCategoryModal();
        } else {
            modal.classList.remove('hidden');

            const closeBtn = document.getElementById('close-create-category-modal');
            const cancelBtn = document.getElementById('cancel-create-category');

            if (closeBtn && !closeBtn.hasAttribute('data-listener')) {
                closeBtn.addEventListener('click', () => closeModal('create-category-modal'));
                closeBtn.setAttribute('data-listener', 'true');
            }

            if (cancelBtn && !cancelBtn.hasAttribute('data-listener')) {
                cancelBtn.addEventListener('click', () => closeModal('create-category-modal'));
                cancelBtn.setAttribute('data-listener', 'true');
            }
        }
    } else {
        console.error('Create category modal not found');
    }
}

function showNotificationSettingsModal() {
    const serverId = getCurrentServerId();
    const modal = document.getElementById('notification-settings-modal');

    if (modal) {
        modal.classList.remove('hidden');
        loadNotificationSettings(serverId);

        const form = document.getElementById('notification-settings-form');
        const closeBtn = document.getElementById('close-notification-settings-modal');
        const cancelBtn = document.getElementById('cancel-notification-settings');

        if (form && !form.hasAttribute('data-listener')) {
            form.addEventListener('submit', (e) => updateNotificationSettings(e, serverId));
            form.setAttribute('data-listener', 'true');
        }

        if (closeBtn && !closeBtn.hasAttribute('data-listener')) {
            closeBtn.addEventListener('click', () => closeModal('notification-settings-modal'));
            closeBtn.setAttribute('data-listener', 'true');
        }

        if (cancelBtn && !cancelBtn.hasAttribute('data-listener')) {
            cancelBtn.addEventListener('click', () => closeModal('notification-settings-modal'));
            cancelBtn.setAttribute('data-listener', 'true');
        }
    }
}

function showEditProfileModal() {
    const serverId = getCurrentServerId();
    const modal = document.getElementById('edit-profile-modal');
      if (modal) {
        modal.classList.remove('hidden');
        loadPerServerProfile(serverId);

        const form = document.getElementById('edit-profile-form');
        const closeBtn = document.getElementById('close-edit-profile-modal');
        const cancelBtn = document.getElementById('cancel-edit-profile');
          if (form && !form.hasAttribute('data-listener')) {
            form.addEventListener('submit', (e) => updatePerServerProfile(e, serverId));
            form.setAttribute('data-listener', 'true');
        }

        if (closeBtn && !closeBtn.hasAttribute('data-listener')) {
            closeBtn.addEventListener('click', () => closeModal('edit-profile-modal'));
            closeBtn.setAttribute('data-listener', 'true');
        }
          if (cancelBtn && !cancelBtn.hasAttribute('data-listener')) {
            cancelBtn.addEventListener('click', () => closeModal('edit-profile-modal'));
            cancelBtn.setAttribute('data-listener', 'true');
        }
    }
}

function showLeaveServerConfirmation() {
    const serverId = getCurrentServerId();
    const modal = document.getElementById('leave-server-modal');

    if (modal) {
        modal.classList.remove('hidden');

        const confirmBtn = document.getElementById('confirm-leave-server');
        const closeBtn = document.getElementById('close-leave-server-modal');
        const cancelBtn = document.getElementById('cancel-leave-server');

        if (confirmBtn && !confirmBtn.hasAttribute('data-listener')) {
            confirmBtn.addEventListener('click', () => leaveServer(serverId));
            confirmBtn.setAttribute('data-listener', 'true');
        }

        if (closeBtn && !closeBtn.hasAttribute('data-listener')) {
            closeBtn.addEventListener('click', () => closeModal('leave-server-modal'));
            closeBtn.setAttribute('data-listener', 'true');
        }

        if (cancelBtn && !cancelBtn.hasAttribute('data-listener')) {
            cancelBtn.addEventListener('click', () => closeModal('leave-server-modal'));
            cancelBtn.setAttribute('data-listener', 'true');
        }
    }
}

function loadInviteLink(serverId) {
    const inviteLinkInput = document.getElementById('invite-link');
    if (inviteLinkInput) {
        inviteLinkInput.value = "Loading...";
        inviteLinkInput.disabled = true;
    }

    
    
    
    

    
    

    
    
    
    
    
    
    
    
    
    
    
    

    
    
    
    
    

    
    
}

function copyInviteLink() {
    const input = document.getElementById('invite-link');
    input.select();
    document.execCommand('copy');
    showToast('Invite link copied to clipboard!', 'success');
}

function generateNewInvite(serverId, expirationValue = null) {
    console.log('generateNewInvite called with serverId:', serverId);

    const generateBtn = document.getElementById('generate-new-invite');
    const originalText = generateBtn.textContent;
    generateBtn.textContent = 'Generating...';
    generateBtn.disabled = true;

    const options = {};
    if (expirationValue) {
        if (expirationValue === 'never') {
            
        } else if (expirationValue === 'hour') {
            options.expires_in = 1;
        } else if (expirationValue === 'day') {
            options.expires_in = 24;
        } else if (expirationValue === 'week') {
            options.expires_in = 168; 
        } else if (expirationValue === 'month') {
            options.expires_in = 720; 
        }
    }

    window.serverAPI.generateInvite(serverId, options)
        .then(data => {
            console.log('Invite generation response:', data);
            
            
            if (data && (data.data || data.invite_code || (data.data && data.data.invite_code))) {
                let inviteCode = data.invite_code;
                let inviteUrl = data.invite_url;
                let expiresAt = data.expires_at;
                
                
                if (!inviteCode && data.data && data.data.invite_code) {
                    inviteCode = data.data.invite_code;
                }

                if (!inviteUrl && data.data && data.data.invite_url) {
                    inviteUrl = data.data.invite_url;
                }
                
                if (!expiresAt && data.data && data.data.expires_at) {
                    expiresAt = data.data.expires_at;
                }
                
                
                if (!inviteUrl && inviteCode) {
                    inviteUrl = `${window.location.origin}/join/${inviteCode}`;
                }

                if (inviteUrl) {
                    const inviteLinkInput = document.getElementById('invite-link');
                    if (inviteLinkInput) {
                        inviteLinkInput.value = inviteUrl;
                    inviteLinkInput.select(); 
                    }
                    
                    
                    const expirationInfo = document.getElementById('invite-expiration-info');
                    if (expirationInfo) {
                        if (expiresAt) {
                            const expiryDate = new Date(expiresAt);
                            expirationInfo.textContent = `Expires on: ${expiryDate.toLocaleString()}`;
                            expirationInfo.classList.remove('hidden');
                        } else {
                            expirationInfo.classList.add('hidden');
                        }
                    }

                    showToast('New invite link generated!', 'success');
                } else {
                    throw new Error('Invalid response: invite URL not found');
                }
            } else {
                throw new Error(data.message || 'Failed to generate invite link');
            }
        })
        .catch(error => {
            console.error('Error generating invite:', error);
            showToast(`Failed to generate new invite link: ${error.message}`, 'error');
        })
        .finally(() => {
            if (generateBtn) {
            generateBtn.textContent = originalText;
            generateBtn.disabled = false;
            }
        });
}

function loadCategories(serverId) {
    serverAPI.getServerChannels(serverId)
        .then(data => {
            const categorySelect = document.getElementById('channel-category');
            categorySelect.innerHTML = '<option value="">No Category</option>';

            if (data.categories) {
                data.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading categories:', error);
        });
}

function createChannel(e, serverId) {
    e.preventDefault();

    const formData = new FormData(e.target);
    formData.append('server_id', serverId);

    channelAPI.createChannel(formData)
        .then(data => {
            if (data.data) {
                showToast('Channel created successfully!', 'success');
                closeModal('create-channel-modal');
                resetForm('create-channel-form');

                refreshChannelList(serverId);
            } else {
                showToast('Error: ' + (data.message || 'Something went wrong!'), 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error creating channel. Please try again.', 'error');
        });
}

function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

function createCategory(e, serverId) {
    e.preventDefault();

    const formData = new FormData(e.target);
    formData.append('server_id', serverId);
    
    channelAPI.createCategory(formData)
        .then(data => {
            if (data.data) {
                showToast('Category created successfully!', 'success');
                closeModal('create-category-modal');

                setTimeout(() => window.location.reload(), 1000);
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            console.error('Error creating category:', error);
            showToast('Failed to create category', 'error');
        });
}

function loadNotificationSettings(serverId) {
    serverAPI.getNotificationSettings(serverId)
        .then(data => {
            if (data.data && data.data.settings) {
                const settings = data.data.settings;

                if (settings.all_messages) {
                    document.querySelector('input[value="all_messages"]').checked = true;
                } else if (settings.muted) {
                    document.querySelector('input[value="muted"]').checked = true;
                } else {
                    document.querySelector('input[value="mentions_only"]').checked = true;
                }

                document.getElementById('suppress-everyone').checked = settings.suppress_everyone || false;
                document.getElementById('mobile-notifications').checked = settings.mobile_notifications || false;
            }
        })
        .catch(error => {
            console.error('Error loading notification settings:', error);
        });
}

function updateNotificationSettings(e, serverId) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const notificationType = formData.get('notification_type');

    const data = {
        server_id: serverId,
        all_messages: notificationType === 'all_messages',
        mentions_only: notificationType === 'mentions_only',
        muted: notificationType === 'muted',
        suppress_everyone: formData.has('suppress_everyone'),
        mobile_notifications: formData.has('mobile_notifications')
    };
    
    serverAPI.updateNotificationSettings(serverId, data)
        .then(data => {
            if (data.data) {
                showToast('Notification settings updated!', 'success');
                closeModal('notification-settings-modal');
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            console.error('Error updating notification settings:', error);
            showToast('Failed to update notification settings', 'error');
        });
}

function loadPerServerProfile(serverId) {
    serverAPI.getPerServerProfile(serverId)
        .then(data => {
            if (data.data && data.data.profile) {
                document.getElementById('profile-nickname').value = data.data.profile.nickname || '';
            }
        })
        .catch(error => {
            console.error('Error loading server profile:', error);
        });
}

function updatePerServerProfile(e, serverId) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        server_id: serverId,
        nickname: formData.get('nickname')
    };

    serverAPI.updatePerServerProfile(serverId, data)
        .then(data => {
            if (data.data) {
                showToast('Server profile updated!', 'success');
                closeModal('edit-profile-modal');
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            console.error('Error updating server profile:', error);
            showToast('Failed to update server profile', 'error');
        });
}

function leaveServer(serverId) {
    serverAPI.leaveServer(serverId)
        .then(data => {
            if (data.data) {
                showToast('You have left the server', 'success');
                closeModal('leave-server-modal');

                setTimeout(() => window.location.href = '/home', 1000);
            } else {
                throw new Error(data.message);
            }
        })
        .catch(error => {
            console.error('Error leaving server:', error);
            showToast('Failed to leave server', 'error');
        });
}

function getCurrentServerId() {
    const path = window.location.pathname;
    const match = path.match(/\/server\/(\d+)/);
    const serverId = match ? match[1] : null;
    console.log('getCurrentServerId - path:', path, 'serverId:', serverId);
    return serverId;
}

function getCurrentServerName() {
    const serverNameElement = document.querySelector('h2.font-bold.text-white');
    return serverNameElement ? serverNameElement.textContent : 'Server';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('animate-fade-out');
            setTimeout(() => {
        modal.classList.add('hidden');
                modal.style.display = 'none';
                modalContent.classList.remove('animate-fade-out');
                
                
                const searchResults = document.getElementById('friend-search-results');
                if (searchResults) {
                    searchResults.classList.add('hidden');
                }
            }, 200);
        } else {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            
            
            const searchResults = document.getElementById('friend-search-results');
            if (searchResults) {
                searchResults.classList.add('hidden');
            }
        }
    }
}

function refreshChannelList(serverId) {
    if (typeof window.loadChannels === 'function') {
        window.loadChannels(serverId);
        return;
    }

    const channelContainer = document.getElementById('channel-container');
    if (!channelContainer) return;

    serverAPI.getServerChannels(serverId)
        .then(data => {
            if (data.data) {
                console.log('Channels loaded successfully');
                window.location.reload();
            } else {
                console.error('Error loading channels:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching channels:', error);
        });
}

function redirectToServerSettings() {
    const serverId = getCurrentServerId();
    if (serverId) {
        window.location.href = `/settings-server?server_id=${serverId}&section=profile`;
    } else {
        console.error('Cannot redirect to server settings: Server ID not found');
        showToast('Error: Could not determine server ID', 'error');
    }
}