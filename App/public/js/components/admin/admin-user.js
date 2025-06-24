import { showToast } from "../../core/ui/toast.js";

export class UserManager {
  constructor() {
    this.currentUserPage = 1;
    this.usersPerPage = 10;
    this.currentView = 'list';
    this.statusFilter = 'all';
    this.roleFilter = 'all';
    this.initialized = false;
    this.isLoading = false;
    this.init();
  }

  init() {
    this.initUserManagement();
    this.initViewModes();
    this.initFilters();
    
    this.showSkeletons();
    
    // Check if userAdminAPI is already available
    if (window.userAdminAPI) {
      this.loadUserStats().then(() => {
        this.loadUsers();
        this.initialized = true;
      });
    } else {
      // Add a small delay to wait for userAdminAPI to be loaded
      setTimeout(() => {
        this.loadUserStats().then(() => {
          this.loadUsers();
          this.initialized = true;
        });
      }, 500);
    }
  }
  
  showSkeleton(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      const skeletonHtml = this.getSkeletonForElement(elementId);
      element.innerHTML = skeletonHtml;
    }
  }
  
  getSkeletonForElement(elementId) {
    switch (elementId) {
      case "active-user-count":
      case "total-user-count":
        return '<div class="skeleton" style="height: 1.5rem; width: 3rem;"></div>';
      case "users-container":
        return this.getUserCardsSkeleton();
      case "user-grid-view":
        return this.getUserGridSkeleton();
      default:
        return '';
    }
  }
  
  getUserCardsSkeleton() {
    let skeleton = '';
    for (let i = 0; i < this.usersPerPage; i++) {
      skeleton += `
        <div class="user-card">
          <div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%;"></div>
          <div style="flex: 1; margin-left: 12px;">
            <div class="skeleton" style="height: 1.25rem; width: 40%; margin-bottom: 8px;"></div>
            <div class="skeleton" style="height: 0.875rem; width: 80%;"></div>
          </div>
          <div>
            <div class="skeleton" style="height: 2rem; width: 5rem; border-radius: 4px;"></div>
          </div>
        </div>
      `;
    }
    return skeleton;
  }
  
  getUserGridSkeleton() {
    let skeleton = '';
    for (let i = 0; i < this.usersPerPage; i++) {
      skeleton += `
        <div class="user-card-grid">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%;"></div>
            <div style="margin-left: 12px;">
              <div class="skeleton" style="height: 1.25rem; width: 80px; margin-bottom: 4px;"></div>
              <div class="skeleton" style="height: 0.75rem; width: 40px;"></div>
            </div>
          </div>
          <div style="padding: 8px 0; border-top: 1px solid #2f3136; border-bottom: 1px solid #2f3136;">
            <div class="skeleton" style="height: 0.875rem; width: 90%; margin-bottom: 8px;"></div>
            <div class="skeleton" style="height: 0.875rem; width: 80%; margin-bottom: 8px;"></div>
            <div class="skeleton" style="height: 0.875rem; width: 70%;"></div>
          </div>
          <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
            <div class="skeleton" style="height: 2rem; width: 5rem; border-radius: 4px;"></div>
          </div>
        </div>
      `;
    }
    return `<div class="user-grid">${skeleton}</div>`;
  }

  initUserManagement() {
    const userPrevBtn = document.getElementById('user-prev-page');
    const userNextBtn = document.getElementById('user-next-page');
    
    if (userPrevBtn) {
      userPrevBtn.addEventListener('click', () => {
        if (this.currentUserPage > 1) {
          this.currentUserPage--;
          if (!this.isLoading) {
            this.showSkeletons();
            this.loadUsers();
          }
        }
      });
    }
    
    if (userNextBtn) {
      userNextBtn.addEventListener('click', () => {
        this.currentUserPage++;
        if (!this.isLoading) {
          this.showSkeletons();
          this.loadUsers();
        }
      });
    }
    
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(() => {
        this.currentUserPage = 1;
        if (!this.isLoading) {
          this.showSkeletons();
          this.loadUsers();
        }
      }, 300));
    }

    document.addEventListener('click', (e) => {
      const banButton = e.target.closest('.ban-user');
      const unbanButton = e.target.closest('.unban-user');
      
      if (banButton) {
        const userId = banButton.getAttribute('data-id');
        const username = banButton.getAttribute('data-username');
        this.toggleUserBan(userId, 'offline', username);
      }
      
      if (unbanButton) {
        const userId = unbanButton.getAttribute('data-id');
        const username = unbanButton.getAttribute('data-username');
        this.toggleUserBan(userId, 'banned', username);
      }
    });
  }
  
  initViewModes() {
    const listViewBtn = document.getElementById('view-mode-list');
    const gridViewBtn = document.getElementById('view-mode-grid');
    
    if (listViewBtn && gridViewBtn) {
      listViewBtn.addEventListener('click', () => {
        this.switchView('list');
      });
      
      gridViewBtn.addEventListener('click', () => {
        this.switchView('grid');
      });
    }
  }
  
  switchView(viewMode) {
    const listView = document.getElementById('user-list-view');
    const gridView = document.getElementById('user-grid-view');
    const listViewBtn = document.getElementById('view-mode-list');
    const gridViewBtn = document.getElementById('view-mode-grid');
    
    if (viewMode === 'list') {
      if (!this.originalUsers || this.originalUsers.length === 0) {
        this.showSkeleton("users-container");
      }
      listView.classList.remove('hidden');
      gridView.classList.add('hidden');
      listViewBtn.classList.add('active');
      gridViewBtn.classList.remove('active');
      this.currentView = 'list';
    } else {
      if (!this.originalUsers || this.originalUsers.length === 0) {
        this.showSkeleton("user-grid-view");
      }
      listView.classList.add('hidden');
      gridView.classList.remove('hidden');
      listViewBtn.classList.remove('active');
      gridViewBtn.classList.add('active');
      this.currentView = 'grid';
    }
  }
  
  initFilters() {
    const statusFilter = document.getElementById('user-status-filter');
    const roleFilter = document.getElementById('user-role-filter');
    
    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        this.statusFilter = statusFilter.value;
        this.currentUserPage = 1;
        if (!this.isLoading) {
          this.showSkeletons();
          this.loadUsers();
        }
      });
    }
    
    if (roleFilter) {
      roleFilter.addEventListener('change', () => {
        this.roleFilter = roleFilter.value;
        this.currentUserPage = 1;
        if (!this.isLoading) {
          this.showSkeletons();
          this.loadUsers();
        }
      });
    }
  }
  
  showSkeletons() {
    if (this.isLoading || (this.initialized && document.getElementById('users-container')?.children.length > 0)) {
      return;
    }

    this.showSkeleton("users-container");
    this.showSkeleton("user-grid-view");
    this.showSkeleton("active-user-count");
    this.showSkeleton("total-user-count");
  }
  
  loadUserStats() {
    // Check if userAdminAPI exists
    if (!window.userAdminAPI) {
      console.warn('userAdminAPI not available yet, retrying in 500ms');
      return new Promise(resolve => {
        setTimeout(() => {
          this.loadUserStats().then(resolve);
        }, 500);
      });
    }
    
    return window.userAdminAPI.getStats()
      .then(response => {
        console.log('User stats response:', response);
        
        // Handle different response formats
        let stats;
        if (response.success && response.data && response.data.stats) {
          stats = response.data.stats;
        } else if (response.success && response.stats) {
          stats = response.stats;
        } else if (response.stats) {
          stats = response.stats;
        } else {
          stats = response;
        }
        
        // Set defaults if values don't exist
        const active = stats.active || stats.online || 0;
        const total = stats.total || 0;
        
        const activeUserCount = document.getElementById('active-user-count');
        const totalUserCount = document.getElementById('total-user-count');
        
        if (activeUserCount) activeUserCount.textContent = active;
        if (totalUserCount) totalUserCount.textContent = total;
        
        const userTotalCount = document.getElementById('user-total-count');
        if (userTotalCount && !userTotalCount.textContent) {
          userTotalCount.textContent = total;
        }
        
        return stats;
      })
      .catch(error => {
        console.error('Error loading user stats:', error);
        return {};
      });
  }
  
  loadUsers() {
    if (this.isLoading) return;
    
    // Check if userAdminAPI exists
    if (!window.userAdminAPI) {
      console.warn('userAdminAPI not available yet, retrying in 500ms');
      setTimeout(() => this.loadUsers(), 500);
      return;
    }
    
    this.isLoading = true;
    const searchQuery = document.getElementById('user-search')?.value || "";
    
    window.userAdminAPI.listUsers(this.currentUserPage, this.usersPerPage, searchQuery)
      .then(response => {
        if (response.success) {
          const users = response.data.users;
          const total = response.data.pagination?.total || 0;
          const showing = users.length;
          
          this.renderUsers(users, total, showing);
        } else {
          showToast(response.message || "Failed to load users", "error");
        }
      })
      .catch(error => {
        showToast("An error occurred while loading users", "error");
        console.error("Error loading users:", error);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
  
  renderUsers(users, total, showing) {
    this.originalUsers = [...users];
    this.originalTotal = total;
    this.originalShowing = showing;
    
    let filteredUsers = [...users];
    
    if (this.statusFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === this.statusFilter);
    }
    
    if (this.roleFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => {
        if (this.roleFilter === 'admin') {
          return user.email === 'admin@admin.com';
        } else {
          return user.email !== 'admin@admin.com';
        }
      });
    }
    
    const filteredShowing = filteredUsers.length;
    
    const listContainer = document.getElementById('users-container');
    const gridContainer = document.getElementById('user-grid-view');
    
    if (listContainer) listContainer.innerHTML = '';
    if (gridContainer) gridContainer.innerHTML = '';
    
    this.renderListView(filteredUsers);
    this.renderGridView(filteredUsers);
    
    const showingCount = document.getElementById('user-showing-count');
    if (showingCount) showingCount.textContent = filteredShowing;
    
    const totalCount = document.getElementById('user-total-count');
    if (totalCount) totalCount.textContent = this.originalTotal;
    
    const prevBtn = document.getElementById('user-prev-page');
    if (prevBtn) {
      prevBtn.disabled = this.currentUserPage <= 1;
      prevBtn.classList.toggle('opacity-50', this.currentUserPage <= 1);
    }
    
    const nextBtn = document.getElementById('user-next-page');
    if (nextBtn) {
      const noMorePages = showing >= total && this.statusFilter === 'all' && this.roleFilter === 'all';
      nextBtn.disabled = noMorePages;
      nextBtn.classList.toggle('opacity-50', noMorePages);
    }
  }
  
  renderListView(users) {
    const container = document.getElementById('users-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!users || users.length === 0) {
      container.innerHTML = `
        <div class="p-6 text-center text-discord-lighter">
          <i class="fas fa-search fa-3x mb-4"></i>
          <p>No users found matching your filters</p>
        </div>
      `;
      return;
    }
    
    users.forEach(user => {
      const userCard = document.createElement('div');
      userCard.className = 'user-card';
      
      const isBanned = user.status === 'banned';
      const isAdmin = user.email === 'admin@admin.com';
      const username = user.username || 'Unknown User';
      const discriminator = user.discriminator || '0000';
      
      let avatarContent = user.avatar_url 
        ? `<img src="${user.avatar_url}" alt="${username}">`
        : username.charAt(0).toUpperCase();
      
      let statusClass = 'offline';
      if (user.status === 'online' || user.status === 'appear') statusClass = 'online';
      if (user.status === 'idle') statusClass = 'idle';
      if (user.status === 'do_not_disturb') statusClass = 'dnd';
      if (user.status === 'banned') statusClass = 'banned';
      
      let statusStyle = '';
      switch (user.status) {
        case 'online':
        case 'appear':
          statusStyle = 'background-color: rgba(59, 165, 93, 0.1); color: #3ba55d;';
          break;
        case 'idle':
          statusStyle = 'background-color: rgba(250, 168, 26, 0.1); color: #faa81a;';
          break;
        case 'do_not_disturb':
          statusStyle = 'background-color: rgba(237, 66, 69, 0.1); color: #ed4245;';
          break;
        case 'banned':
          statusStyle = 'background-color: rgba(0, 0, 0, 0.1); color: #ffffff;';
          break;
        default:
          statusStyle = 'background-color: rgba(116, 127, 141, 0.1); color: #747f8d;';
      }
      
      userCard.innerHTML = `
        <div class="user-avatar">
          ${avatarContent}
        </div>
        <div class="user-info">
          <div class="user-name">
            ${username}#${discriminator}
            ${isAdmin ? '<span class="user-badge badge-admin">Admin</span>' : ''}
            <span class="user-badge" style="${statusStyle}">
              <span class="badge-status ${statusClass}"></span>
              ${user.status || 'offline'}
            </span>
          </div>
          <div class="user-meta">
            <span>ID: ${user.id || 'N/A'}</span> • 
            <span>${user.email || 'No Email'}</span> • 
            <span>Joined: ${this.formatDate(user.created_at)}</span>
          </div>
        </div>
        <div class="user-actions">
          ${isBanned 
            ? `<button class="discord-button success unban-user" data-id="${user.id}" data-username="${username}">
                <i class="fas fa-user-check mr-2"></i>
                Unban
              </button>` 
            : `<button class="discord-button danger ban-user" data-id="${user.id}" data-username="${username}">
                <i class="fas fa-ban mr-2"></i>
                Ban
              </button>`
          }
        </div>
      `;
      
      container.appendChild(userCard);
    });
  }
  
  renderGridView(users) {
    const container = document.getElementById('user-grid-view');
    if (!container) return;
    
    if (!users || users.length === 0) {
      container.innerHTML = `
        <div class="p-6 text-center text-discord-lighter">
          <i class="fas fa-search fa-3x mb-4"></i>
          <p>No users found matching your filters</p>
        </div>
      `;
      return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'user-grid';
    
    users.forEach(user => {
      const userCard = document.createElement('div');
      userCard.className = 'user-card-grid';
      
      const isBanned = user.status === 'banned';
      const username = user.username || 'Unknown User';
      const discriminator = user.discriminator || '0000';
      
      let avatarContent = user.avatar_url 
        ? `<img src="${user.avatar_url}" alt="${username}">`
        : username.charAt(0).toUpperCase();
      
      let statusClass = 'offline';
      if (user.status === 'online' || user.status === 'appear') statusClass = 'online';
      if (user.status === 'idle') statusClass = 'idle';
      if (user.status === 'do_not_disturb') statusClass = 'dnd';
      if (user.status === 'banned') statusClass = 'banned';
      
      userCard.innerHTML = `
        <div class="user-card-header">
          <div class="user-avatar">
            ${avatarContent}
          </div>
          <div class="ml-3">
            <div class="user-name">
              ${username}
              <span class="badge-status ${statusClass}"></span>
            </div>
            <div class="text-discord-lighter text-xs">#${discriminator}</div>
          </div>
        </div>
        
        <div class="user-meta px-2 py-3 border-t border-b border-discord-dark">
          <div class="flex items-center mb-1">
            <i class="fas fa-envelope mr-2 text-discord-lighter" style="width: 14px;"></i>
            <span class="text-sm">${user.email || 'No Email'}</span>
          </div>
          <div class="flex items-center mb-1">
            <i class="fas fa-id-card mr-2 text-discord-lighter" style="width: 14px;"></i>
            <span class="text-sm">ID: ${user.id || 'N/A'}</span>
          </div>
          <div class="flex items-center">
            <i class="fas fa-calendar-alt mr-2 text-discord-lighter" style="width: 14px;"></i>
            <span class="text-sm">Joined: ${this.formatDate(user.created_at)}</span>
          </div>
        </div>
        
        <div class="user-card-footer">
          ${isBanned 
            ? `<button class="discord-button success unban-user" data-id="${user.id}" data-username="${username}">
                <i class="fas fa-user-check mr-2"></i>
                Unban
              </button>` 
            : `<button class="discord-button danger ban-user" data-id="${user.id}" data-username="${username}">
                <i class="fas fa-ban mr-2"></i>
                Ban
              </button>`
          }
        </div>
      `;
      
      grid.appendChild(userCard);
    });
    
    container.innerHTML = '';
    container.appendChild(grid);
  }
  
  toggleUserBan(userId, currentStatus, username) {
    // Check if userAdminAPI exists
    if (!window.userAdminAPI) {
      console.warn('userAdminAPI not available yet, retrying in 500ms');
      setTimeout(() => this.toggleUserBan(userId, currentStatus, username), 500);
      return;
    }
    
    const isBanned = currentStatus === 'banned';
    const action = isBanned ? 'unban' : 'ban';
    const title = isBanned ? 'Unban User' : 'Ban User';
    const message = isBanned ? 
      `Are you sure you want to unban <span class="text-white font-semibold">${username}</span>? They will be able to use the app again.` : 
      `Are you sure you want to ban <span class="text-white font-semibold">${username}</span>? This will prevent them from using the app.`;
    
    this.showDiscordConfirmation(title, message, () => {
      window.userAdminAPI.toggleUserBan(userId)
        .then(data => {
          if (data.success) {
            showToast(`User ${isBanned ? 'unbanned' : 'banned'} successfully`, "success");
            this.loadUsers();
            this.loadUserStats();
          } else {
            showToast(data.message || `Failed to ${action} user`, "error");
          }
        })
        .catch(error => {
          showToast(`An error occurred while trying to ${action} the user`, "error");
          console.error(`Error ${action}ing user:`, error);
        });
    });
  }

  showDiscordConfirmation(title, message, confirmCallback) {
    const confirmModal = document.getElementById('confirm-modal');
    if (confirmModal) {
      const confirmTitle = document.getElementById('confirm-title');
      const confirmMessage = document.getElementById('confirm-message');
      const confirmBtn = document.getElementById('confirm-action');
      const cancelBtn = document.getElementById('cancel-confirm');
      const closeBtn = document.getElementById('close-confirm-modal');
      
      confirmTitle.textContent = title;
      confirmMessage.innerHTML = message;
      
      const handleConfirm = () => {
        confirmModal.classList.add('hidden');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        closeBtn.removeEventListener('click', handleCancel);
        confirmCallback();
      };
      
      const handleCancel = () => {
        confirmModal.classList.add('hidden');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        closeBtn.removeEventListener('click', handleCancel);
      };
      
      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      closeBtn.addEventListener('click', handleCancel);
      
      confirmModal.classList.remove('hidden');
    }
  }
  
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
}

export default UserManager;
