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
            <div class="flex space-x-2">
              <div class="skeleton" style="height: 1.5rem; width: 1.5rem;"></div>
              <div class="skeleton" style="height: 1.5rem; width: 1.5rem;"></div>
            </div>
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
          showToast(data.message || "Failed to load users", "error");
        }
      })
      .catch(error => {
        showToast("An error occurred while loading users", "error");
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
      
      const userStatus = user.is_active ? 
        '<span class="text-green-400">Active</span>' : 
        '<span class="text-red-400">Inactive</span>';
      
      const roles = user.is_admin ? 
        '<span class="bg-red-500 text-white rounded-full px-2 py-1 text-xs">Admin</span>' : 
        '<span class="bg-gray-500 text-white rounded-full px-2 py-1 text-xs">User</span>';
      
      row.innerHTML = `
        <td class="py-4">${user.id}</td>
        <td class="py-4">
          <div class="flex items-center space-x-2">
            ${user.avatar ? 
              `<img src="${user.avatar}" alt="User avatar" class="h-6 w-6 rounded-full">` : 
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
            <button class="text-blue-400 hover:text-blue-300" onclick="window.userManager.viewUser(${user.id})">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button class="text-red-400 hover:text-red-300" onclick="window.userManager.toggleUserStatus(${user.id}, ${user.is_active})">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
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
  
  viewUser(userId) {
    window.location.href = `/app/user/${userId}`;
  }
  
  toggleUserStatus(userId, isActive) {
    const action = isActive ? 'deactivate' : 'activate';
    const confirmMessage = isActive ? 
      'Are you sure you want to deactivate this user? They will not be able to login until reactivated.' : 
      'Are you sure you want to activate this user?';
    
    this.showDeleteConfirmation(`${action.charAt(0).toUpperCase() + action.slice(1)} User`, confirmMessage, () => {
      userAdminAPI.toggleUserStatus(userId)
        .then(data => {
          if (data.success) {
            showToast(`User ${action}d successfully`, "success");
            this.loadUsers();
            this.loadUserStats();
          } else {
            showToast(data.message || `Failed to ${action} user`, "error");
          }
        })
        .catch(error => {
          showToast(`An error occurred while ${action}ing the user`, "error");
        });
    });
  }
  
  showDeleteConfirmation(title, message, confirmCallback) {
    const modal = document.getElementById('confirm-modal');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmBtn = document.getElementById('confirm-action');
    const cancelBtn = document.getElementById('cancel-confirm');
    
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    
    const handleConfirm = () => {
      modal.classList.add('hidden');
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      confirmCallback();
    };
    
    const handleCancel = () => {
      modal.classList.add('hidden');
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    
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
