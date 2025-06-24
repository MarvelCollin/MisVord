import { showToast } from "../../core/ui/toast.js";
import userAdminAPI from "../../api/user-admin-api.js";

export class UserManager {
  constructor() {
    this.currentUserPage = 1;
    this.usersPerPage = 10;
    this.currentView = 'list';
    this.statusFilter = 'all';
    this.roleFilter = 'all';
    this.init();
  }

  init() {
    this.initUserManagement();
    this.initViewModes();
    this.initFilters();
    this.loadUserStats();
    this.loadUsers();
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
          this.loadUsers();
        }
      });
    }
    
    if (userNextBtn) {
      userNextBtn.addEventListener('click', () => {
        this.currentUserPage++;
        this.loadUsers();
      });
    }
    
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(() => {
        this.currentUserPage = 1;
        this.loadUsers();
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
      listView.classList.remove('hidden');
      gridView.classList.add('hidden');
      listViewBtn.classList.add('active');
      gridViewBtn.classList.remove('active');
      this.currentView = 'list';
    } else {
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
        this.loadUsers();
      });
    }
    
    if (roleFilter) {
      roleFilter.addEventListener('change', () => {
        this.roleFilter = roleFilter.value;
        this.currentUserPage = 1;
        this.loadUsers();
      });
    }
  }
  
  loadUsers() {
    const searchQuery = document.getElementById('user-search')?.value || "";
    
    if (this.currentView === 'list') {
      this.showSkeleton("users-container");
    } else {
      this.showSkeleton("user-grid-view");
    }
    
    userAdminAPI.listUsers(this.currentUserPage, this.usersPerPage, searchQuery)
      .then(response => {
        if (response.success) {
          const users = response.data.users;
          const total = response.data.total;
          const showing = users.length;
          
          this.renderUsers(users, total, showing);
        } else {
          showToast(response.message || "Failed to load users", "error");
        }
      })
      .catch(error => {
        showToast("An error occurred while loading users", "error");
        console.error("Error loading users:", error);
      });
  }
  
  loadUserStats() {
    this.showSkeleton("active-user-count");
    this.showSkeleton("total-user-count");
    
    userAdminAPI.getStats()
      .then(response => {
        if (response.success) {
          const stats = response.data.stats;
          
          const activeUserCount = document.getElementById('active-user-count');
          const totalUserCount = document.getElementById('total-user-count');
          
          if (activeUserCount) activeUserCount.textContent = stats.active || 0;
          if (totalUserCount) totalUserCount.textContent = stats.total || 0;
        }
      })
      .catch(error => {
        console.error('Error loading user stats:', error);
      });
  }
  
  renderUsers(users, total, showing) {
    // Filter users based on current filters
    if (this.statusFilter !== 'all') {
      users = users.filter(user => user.status === this.statusFilter);
    }
    
    if (this.roleFilter !== 'all') {
      users = users.filter(user => {
        if (this.roleFilter === 'admin') {
          return user.email === 'admin@admin.com';
        } else {
          return user.email !== 'admin@admin.com';
        }
      });
    }
    
    this.renderListView(users);
    this.renderGridView(users);
    
    const showingCount = document.getElementById('user-showing-count');
    if (showingCount) showingCount.textContent = showing;
    
    const totalCount = document.getElementById('user-total-count');
    if (totalCount) totalCount.textContent = total;
    
    const prevBtn = document.getElementById('user-prev-page');
    if (prevBtn) prevBtn.disabled = this.currentUserPage <= 1;
    
    const nextBtn = document.getElementById('user-next-page');
    if (nextBtn) nextBtn.disabled = showing >= total;
  }
  
  renderListView(users) {
    const container = document.getElementById('users-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!users || users.length === 0) {
      container.innerHTML = `
        <div class="p-6 text-center text-discord-lighter">
          <img src="/assets/common/no-results.png" alt="No results" class="mx-auto mb-4" width="64" height="64">
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
      
      let avatarContent = user.avatar_url 
        ? `<img src="${user.avatar_url}" alt="${user.username}">`
        : user.username.charAt(0).toUpperCase();
      
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
            ${user.username}#${user.discriminator}
            ${isAdmin ? '<span class="user-badge badge-admin">Admin</span>' : ''}
            <span class="user-badge" style="${statusStyle}">
              <span class="badge-status ${statusClass}"></span>
              ${user.status}
            </span>
          </div>
          <div class="user-meta">
            <span>ID: ${user.id}</span> • 
            <span>${user.email}</span> • 
            <span>Joined: ${this.formatDate(user.created_at)}</span>
          </div>
        </div>
        <div class="user-actions">
          ${isBanned 
            ? `<button class="discord-button success unban-user" data-id="${user.id}" data-username="${user.username}">
                <img src="/assets/common/unban-icon.png" alt="Unban" width="16" height="16" class="mr-2">
                Unban
              </button>` 
            : `<button class="discord-button danger ban-user" data-id="${user.id}" data-username="${user.username}">
                <img src="/assets/common/ban-icon.png" alt="Ban" width="16" height="16" class="mr-2">
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
          <img src="/assets/common/no-results.png" alt="No results" class="mx-auto mb-4" width="64" height="64">
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
      
      let avatarContent = user.avatar_url 
        ? `<img src="${user.avatar_url}" alt="${user.username}">`
        : user.username.charAt(0).toUpperCase();
      
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
              ${user.username}
              <span class="badge-status ${statusClass}"></span>
            </div>
            <div class="text-discord-lighter text-xs">#${user.discriminator}</div>
          </div>
        </div>
        
        <div class="user-meta px-2 py-3 border-t border-b border-discord-dark">
          <div class="flex items-center mb-1">
            <img src="/assets/common/email-icon.png" alt="Email" width="14" height="14" class="mr-2">
            <span class="text-sm">${user.email}</span>
          </div>
          <div class="flex items-center mb-1">
            <img src="/assets/common/id-icon.png" alt="ID" width="14" height="14" class="mr-2">
            <span class="text-sm">ID: ${user.id}</span>
          </div>
          <div class="flex items-center">
            <img src="/assets/common/calendar-icon.png" alt="Joined" width="14" height="14" class="mr-2">
            <span class="text-sm">Joined: ${this.formatDate(user.created_at)}</span>
          </div>
        </div>
        
        <div class="user-card-footer">
          ${isBanned 
            ? `<button class="discord-button success unban-user" data-id="${user.id}" data-username="${user.username}">
                <img src="/assets/common/unban-icon.png" alt="Unban" width="16" height="16" class="mr-2">
                Unban
              </button>` 
            : `<button class="discord-button danger ban-user" data-id="${user.id}" data-username="${user.username}">
                <img src="/assets/common/ban-icon.png" alt="Ban" width="16" height="16" class="mr-2">
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
    const isBanned = currentStatus === 'banned';
    const action = isBanned ? 'unban' : 'ban';
    const title = isBanned ? 'Unban User' : 'Ban User';
    const message = isBanned ? 
      `Are you sure you want to unban <span class="text-white font-semibold">${username}</span>? They will be able to use the app again.` : 
      `Are you sure you want to ban <span class="text-white font-semibold">${username}</span>? This will prevent them from using the app.`;
    
    this.showDiscordConfirmation(title, message, () => {
      userAdminAPI.toggleUserBan(userId)
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
