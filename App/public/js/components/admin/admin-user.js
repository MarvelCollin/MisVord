import { showToast } from "../../core/ui/toast.js";
import userAdminAPI from "../../api/user-admin-api.js";

export class UserManager {
  constructor() {
    this.currentUserPage = 1;
    this.usersPerPage = 10;
    this.init();
  }

  init() {
    this.initUserManagement();
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
      case "user-table-body":
        return this.getUserTableSkeleton();
      default:
        return '';
    }
  }
  
  getUserTableSkeleton() {
    let skeleton = '';
    for (let i = 0; i < this.usersPerPage; i++) {
      skeleton += `
        <tr class="border-b border-discord-dark">
          <td class="py-4"><div class="skeleton" style="height: 1.5rem; width: 2rem;"></div></td>
          <td class="py-4"><div class="skeleton" style="height: 1.5rem; width: 8rem;"></div></td>
          <td class="py-4"><div class="skeleton" style="height: 1rem; width: 6rem;"></div></td>
          <td class="py-4"><div class="skeleton" style="height: 1rem; width: 8rem;"></div></td>
          <td class="py-4"><div class="skeleton" style="height: 1rem; width: 6rem;"></div></td>
          <td class="py-4">
            <div class="skeleton" style="height: 2rem; width: 4rem; border-radius: 0.375rem;"></div>
          </td>
        </tr>
      `;
    }
    return skeleton;
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

    this.initDiscordConfirmModal();
  }
  
  loadUsers() {
    const searchQuery = document.getElementById('user-search')?.value || "";
    
    this.showSkeleton("user-table-body");
    
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
    const tableBody = document.getElementById('user-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!users || users.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="6" class="py-4 text-center text-discord-lighter">No users found</td>
      `;
      tableBody.appendChild(row);
      return;
    }
    
    users.forEach(user => {
      const row = document.createElement('tr');
      row.className = 'border-b border-discord-dark';
      
      const isBanned = user.status === 'banned';
      
      const userStatus = this.getUserStatusBadge(user.status);
      const roles = user.is_admin ? 
        '<span class="bg-red-500 text-white rounded-full px-2 py-1 text-xs">Admin</span>' : 
        '<span class="bg-gray-500 text-white rounded-full px-2 py-1 text-xs">User</span>';
      
      row.innerHTML = `
        <td class="py-4">${user.id}</td>
        <td class="py-4">
          <div class="flex items-center space-x-2">
            ${user.avatar_url ? 
              `<img src="${user.avatar_url}" alt="User avatar" class="h-6 w-6 rounded-full">` : 
              '<div class="h-6 w-6 bg-discord-dark rounded-full"></div>'
            }
            <span>${user.username}</span>
          </div>
        </td>
        <td class="py-4">${user.email}</td>
        <td class="py-4">${userStatus}</td>
        <td class="py-4">${roles}</td>
        <td class="py-4">
          <div class="flex space-x-2">
            ${isBanned ? 
              `<button class="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-md text-xs flex items-center space-x-1" 
                      onclick="window.userManager.toggleUserBan(${user.id}, '${user.status}', '${user.username}')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Unban</span>
              </button>` : 
              `<button class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md text-xs flex items-center space-x-1" 
                      onclick="window.userManager.toggleUserBan(${user.id}, '${user.status}', '${user.username}')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span>Ban</span>
              </button>`
            }
          </div>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    const showingCount = document.getElementById('user-showing-count');
    if (showingCount) showingCount.textContent = showing;
    
    const totalCount = document.getElementById('user-total-count');
    if (totalCount) totalCount.textContent = total;
    
    const prevBtn = document.getElementById('user-prev-page');
    if (prevBtn) prevBtn.disabled = this.currentUserPage <= 1;
    
    const nextBtn = document.getElementById('user-next-page');
    if (nextBtn) nextBtn.disabled = showing >= total;
  }
  
  getUserStatusBadge(status) {
    switch (status) {
      case 'banned':
        return '<span class="bg-red-500 text-white rounded-full px-2 py-1 text-xs">Banned</span>';
      case 'appear':
        return '<span class="bg-green-500 text-white rounded-full px-2 py-1 text-xs">Online</span>';
      case 'offline':
        return '<span class="bg-gray-500 text-white rounded-full px-2 py-1 text-xs">Offline</span>';
      case 'do_not_disturb':
        return '<span class="bg-red-400 text-white rounded-full px-2 py-1 text-xs">Do Not Disturb</span>';
      case 'invisible':
        return '<span class="bg-gray-400 text-white rounded-full px-2 py-1 text-xs">Invisible</span>';
      default:
        return '<span class="bg-gray-500 text-white rounded-full px-2 py-1 text-xs">Unknown</span>';
    }
  }
  
  viewUser(userId) {
    window.location.href = `/app/user/${userId}`;
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

  initDiscordConfirmModal() {
    if (document.getElementById('discord-confirm-modal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'discord-confirm-modal';
    modal.className = 'fixed inset-0 flex items-center justify-center z-50 hidden';
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-70"></div>
      <div class="bg-discord-dark rounded-md w-full max-w-md p-6 relative z-10 transform transition-all">
        <div class="flex justify-between items-center mb-4">
          <h3 id="discord-confirm-title" class="text-xl font-bold text-white">Confirm Action</h3>
          <button id="discord-confirm-close" class="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="mb-6">
          <p id="discord-confirm-message" class="text-discord-lighter">Are you sure you want to perform this action?</p>
        </div>
        <div class="flex justify-end space-x-3">
          <button id="discord-cancel-button" class="px-4 py-2 bg-discord-dark-secondary hover:bg-discord-dark-hover text-white rounded-md transition-colors">
            Cancel
          </button>
          <button id="discord-confirm-button" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors">
            Confirm
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('discord-confirm-close').addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    
    document.getElementById('discord-cancel-button').addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }
  
  showDiscordConfirmation(title, message, confirmCallback) {
    const modal = document.getElementById('discord-confirm-modal');
    if (!modal) {
      this.initDiscordConfirmModal();
      return this.showDiscordConfirmation(title, message, confirmCallback);
    }
    
    const confirmTitle = document.getElementById('discord-confirm-title');
    const confirmMessage = document.getElementById('discord-confirm-message');
    const confirmBtn = document.getElementById('discord-confirm-button');
    
    confirmTitle.textContent = title;
    confirmMessage.innerHTML = message;
    
    const handleConfirm = () => {
      modal.classList.add('hidden');
      confirmBtn.removeEventListener('click', handleConfirm);
      confirmCallback();
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    modal.classList.remove('hidden');
  }
  
  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
