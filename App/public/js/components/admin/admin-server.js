import { showToast } from "../../core/ui/toast.js";
import serverAPI from "../../api/server-api.js";

export class ServerManager {
  constructor() {
    this.currentServerPage = 1;
    this.serversPerPage = 10;
    this.init();
  }

  init() {
    this.initServerManagement();
    this.loadServerStats();
    this.loadServers();
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
      case "active-server-count":
      case "total-server-count":
        return '<div class="skeleton" style="height: 1.5rem; width: 3rem;"></div>';
      case "server-table-body":
        return this.getServerTableSkeleton();
      default:
        return '';
    }
  }
  
  getServerTableSkeleton() {
    let skeleton = '';
    for (let i = 0; i < this.serversPerPage; i++) {
      skeleton += `
        <tr class="border-b border-discord-dark">
          <td class="py-4"><div class="skeleton" style="height: 1.5rem; width: 2rem;"></div></td>
          <td class="py-4"><div class="skeleton" style="height: 1.5rem; width: 8rem;"></div></td>
          <td class="py-4"><div class="skeleton" style="height: 1rem; width: 5rem;"></div></td>
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

  initServerManagement() {
    const serverPrevBtn = document.getElementById('server-prev-page');
    const serverNextBtn = document.getElementById('server-next-page');
    
    if (serverPrevBtn) {
      serverPrevBtn.addEventListener('click', () => {
        if (this.currentServerPage > 1) {
          this.currentServerPage--;
          this.loadServers();
        }
      });
    }
    
    if (serverNextBtn) {
      serverNextBtn.addEventListener('click', () => {
        this.currentServerPage++;
        this.loadServers();
      });
    }
    
    const searchInput = document.getElementById('server-search');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(() => {
        this.currentServerPage = 1;
        this.loadServers();
      }, 300));
    }
  }
  
  loadServers() {
    const searchQuery = document.getElementById('server-search')?.value || "";
    
    this.showSkeleton("server-table-body");
    
    serverAPI.listServers(this.currentServerPage, this.serversPerPage, searchQuery)
      .then(response => {
        if (response.success) {
          const servers = response.data.servers;
          const total = response.data.total;
          const showing = servers.length;
          
          this.renderServers(servers, total, showing);
        } else {
          showToast(response.message || "Failed to load servers", "error");
        }
      })
      .catch(error => {
        showToast("An error occurred while loading servers", "error");
      });
  }
  
  loadServerStats() {
    this.showSkeleton("active-server-count");
    this.showSkeleton("total-server-count");
    
    serverAPI.getStats()
      .then(response => {
        if (response.success) {
          const stats = response.data.stats;
          
          document.getElementById('active-server-count').textContent = stats.active || 0;
          document.getElementById('total-server-count').textContent = stats.total || 0;
        }
      })
      .catch(error => {
        console.error('Error loading server stats:', error);
      });
  }
  
  renderServers(servers, total, showing) {
    const tableBody = document.getElementById('server-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!servers || servers.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="5" class="py-4 text-center text-discord-lighter">No servers found</td>
      `;
      tableBody.appendChild(row);
      return;
    }
    
    servers.forEach(server => {
      const row = document.createElement('tr');
      row.className = 'border-b border-discord-dark';
      
      row.innerHTML = `
        <td class="py-4">${server.id}</td>
        <td class="py-4">
          <div class="flex items-center space-x-2">
            ${server.icon ? 
              `<img src="${server.icon}" alt="Server icon" class="h-6 w-6 rounded-full">` : 
              '<div class="h-6 w-6 bg-discord-dark rounded-full"></div>'
            }
            <span>${server.name}</span>
          </div>
        </td>
        <td class="py-4">${server.owner_id}</td>
        <td class="py-4">${this.formatDate(server.created_at)}</td>
        <td class="py-4">
          <div class="flex space-x-2">
            <button class="text-blue-400 hover:text-blue-300" onclick="window.serverManager.viewServer(${server.id})">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button class="text-red-400 hover:text-red-300" onclick="window.serverManager.deleteServer(${server.id})">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    const showingCount = document.getElementById('server-showing-count');
    if (showingCount) showingCount.textContent = showing;
    
    const totalCount = document.getElementById('server-total-count');
    if (totalCount) totalCount.textContent = total;
    
    const prevBtn = document.getElementById('server-prev-page');
    if (prevBtn) prevBtn.disabled = this.currentServerPage <= 1;
    
    const nextBtn = document.getElementById('server-next-page');
    if (nextBtn) nextBtn.disabled = showing >= total;
  }
  
  viewServer(serverId) {
    window.location.href = `/app/server/${serverId}`;
  }
  
  deleteServer(id) {
    this.showDeleteConfirmation('Delete Server', 'Are you sure you want to delete this server? This action cannot be undone and will delete all associated channels, messages, and data.', () => {
      serverAPI.deleteServer(id)
        .then(data => {
          if (data.success) {
            showToast("Server deleted successfully", "success");
            this.loadServers();
            this.loadServerStats();
          } else {
            showToast(data.message || "Failed to delete server", "error");
          }
        })
        .catch(error => {
          showToast("An error occurred while deleting the server", "error");
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

export default ServerManager;
