import { showToast } from "../../core/ui/toast.js";

export class ServerManager {
  constructor() {
    this.currentServerPage = 1;
    this.serversPerPage = 10;
    this.initialized = false;
    this.isLoading = false;
    this.init();
  }

  init() {
    this.initServerManagement();
    this.showSkeletons();
    
    if (window.serverAPI) {
      this.loadServerStats().then(() => {
        this.loadServers();
        this.initialized = true;
      });
    } else {
      setTimeout(() => {
        this.loadServerStats().then(() => {
          this.loadServers();
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
      case "active-server-count":
      case "total-server-count":
        return '<div class="skeleton" style="height: 1.5rem; width: 3rem;"></div>';
      case "servers-table-body":
        return this.getServerTableSkeleton();
      default:
        return '';
    }
  }
  
  getServerTableSkeleton() {
    return `
      <div class="server-table-container">
        <table class="server-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Server</th>
              <th>Owner</th>
              <th>Members</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${Array(this.serversPerPage).fill().map(() => `
              <tr>
                <td><div class="skeleton" style="width: 40px; height: 20px;"></div></td>
                <td>
                  <div class="flex items-center">
                    <div class="skeleton rounded-full mr-3" style="width: 32px; height: 32px;"></div>
                    <div class="skeleton" style="width: 120px; height: 20px;"></div>
                  </div>
                </td>
                <td><div class="skeleton" style="width: 60px; height: 20px;"></div></td>
                <td><div class="skeleton" style="width: 40px; height: 20px;"></div></td>
                <td><div class="skeleton" style="width: 100px; height: 20px;"></div></td>
                <td>
                  <div class="flex space-x-2">
                    <div class="skeleton" style="width: 60px; height: 30px;"></div>
                    <div class="skeleton" style="width: 60px; height: 30px;"></div>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  initServerManagement() {
    const serverPrevBtn = document.getElementById('server-prev-page');
    const serverNextBtn = document.getElementById('server-next-page');
    
    if (serverPrevBtn) {
      serverPrevBtn.addEventListener('click', () => {
        if (this.currentServerPage > 1) {
          this.currentServerPage--;
          if (!this.isLoading) {
            this.showSkeleton("servers-table-body");
            this.loadServers();
          }
        }
      });
    }
    
    if (serverNextBtn) {
      serverNextBtn.addEventListener('click', () => {
        this.currentServerPage++;
        if (!this.isLoading) {
          this.showSkeleton("servers-table-body");
          this.loadServers();
        }
      });
    }
    
    const searchInput = document.getElementById('server-search');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(() => {
        this.currentServerPage = 1;
        if (!this.isLoading) {
          this.showSkeleton("servers-table-body");
          this.loadServers();
        }
      }, 300));
    }

    document.addEventListener('click', (e) => {
      const viewButton = e.target.closest('.view-server');
      const deleteButton = e.target.closest('.delete-server');
      
      if (viewButton) {
        e.preventDefault();
        const serverId = viewButton.getAttribute('data-id');
        this.viewServer(serverId);
      }
      
      if (deleteButton) {
        e.preventDefault();
        const serverId = deleteButton.getAttribute('data-id');
        const serverName = deleteButton.getAttribute('data-name') || 'this server';
        this.deleteServer(serverId, serverName);
      }
    });
  }
  
  showSkeletons() {
    if (this.isLoading || (this.initialized && document.getElementById('servers-table-body')?.children.length > 0)) {
      return;
    }

    this.showSkeleton("servers-table-body");
    this.showSkeleton("active-server-count");
    this.showSkeleton("total-server-count");
  }
  
  loadServers() {
    if (this.isLoading) return;
    
    if (!window.serverAPI) {
      console.warn('serverAPI not available yet, retrying in 500ms');
      setTimeout(() => this.loadServers(), 500);
      return;
    }
    
    this.isLoading = true;
    const searchQuery = document.getElementById('server-search')?.value || "";
    
    window.serverAPI.listServers(this.currentServerPage, this.serversPerPage, searchQuery)
      .then(response => {
        if (response.success) {
          const servers = response.data?.servers || response.servers || [];
          const total = response.data?.total || response.total || 0;
          const showing = servers.length;
          
          this.renderServers(servers, total, showing);
        } else {
          showToast(response.message || "Failed to load servers", "error");
        }
      })
      .catch(error => {
        console.error("Error loading servers:", error);
        showToast("An error occurred while loading servers", "error");
      })
      .finally(() => {
        this.isLoading = false;
      });
  }
  
  loadServerStats() {
    if (!window.serverAPI) {
      console.warn('serverAPI not available yet, retrying in 500ms');
      return new Promise(resolve => {
        setTimeout(() => {
          this.loadServerStats().then(resolve);
        }, 500);
      });
    }
    
    if (typeof window.serverAPI.getStats !== 'function') {
      console.warn('serverAPI.getStats is not available, using fallback stats');
      this.updateStatsUI({
        active: 0,
        total: 0
      });
      return Promise.resolve({});
    }
    
    return window.serverAPI.getStats()
      .then(response => {
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
        
        this.updateStatsUI(stats);
        return stats;
      })
      .catch(error => {
        console.error('Error loading server stats:', error);
        this.updateStatsUI({
          active: 0,
          total: 0
        });
        return {};
      });
  }
  
  updateStatsUI(stats) {
    const active = stats.active || 0;
    const totalServers = stats.total_servers || stats.total || 0;
    
    const activeServerCount = document.getElementById('active-server-count');
    const totalServerCount = document.getElementById('total-server-count');
    
    if (activeServerCount) activeServerCount.textContent = active;
    if (totalServerCount) totalServerCount.textContent = totalServers;
  }
  
  renderServers(servers, total, showing) {
    const tableBodyContainer = document.getElementById('servers-table-body');
    if (!tableBodyContainer) return;
    
    tableBodyContainer.innerHTML = '';
    
    if (!servers || servers.length === 0) {
      tableBodyContainer.innerHTML = `
        <div class="p-6 text-center text-discord-lighter">
          <i class="fas fa-server fa-3x mb-4"></i>
          <p>No servers found</p>
        </div>
      `;
      return;
    }
    
    const tableContainer = document.createElement('div');
    tableContainer.className = 'server-table-container';
    
    const table = document.createElement('table');
    table.className = 'server-table';
    
    const tableHeader = document.createElement('thead');
    tableHeader.innerHTML = `
      <tr>
        <th>ID</th>
        <th>Server</th>
        <th>Owner</th>
        <th>Members</th>
        <th>Created</th>
        <th>Actions</th>
      </tr>
    `;
    table.appendChild(tableHeader);
    
    const tableBody = document.createElement('tbody');
    
    servers.forEach(server => {
      const serverId = server.id || 'N/A';
      const serverName = server.name || 'Unknown Server';
      const ownerId = server.owner_id || 'N/A';
      const memberCount = server.member_count !== undefined && server.member_count !== null ? server.member_count : 0;
      const createdAt = server.created_at ? this.formatDate(server.created_at) : 'Unknown';
      
      let iconContent = server.icon 
        ? `<img src="${server.icon}" alt="${serverName}" class="server-icon">`
        : `<div class="server-icon-placeholder">${serverName.charAt(0).toUpperCase()}</div>`;
      
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${serverId}</td>
        <td>
          <div class="flex items-center space-x-3">
            <div class="server-avatar-sm">${iconContent}</div>
            <span class="font-medium">${serverName}</span>
          </div>
        </td>
        <td>${ownerId}</td>
        <td>
          <span class="text-discord-lighter">${memberCount}</span>
        </td>
        <td>${createdAt}</td>
        <td>
          <div class="flex space-x-2">
            <button class="discord-button primary view-server" data-id="${serverId}">
              <i class="fas fa-eye mr-2"></i>
              View
            </button>
            <button class="discord-button danger delete-server" data-id="${serverId}" data-name="${serverName}">
              <i class="fas fa-trash mr-2"></i>
              Delete
            </button>
          </div>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    table.appendChild(tableBody);
    tableContainer.appendChild(table);
    tableBodyContainer.appendChild(tableContainer);
    
    const showingCount = document.getElementById('server-showing-count');
    if (showingCount) showingCount.textContent = showing;
    
    const totalCount = document.getElementById('server-total-count');
    if (totalCount) totalCount.textContent = total;
    
    const prevBtn = document.getElementById('server-prev-page');
    if (prevBtn) {
      prevBtn.disabled = this.currentServerPage <= 1;
      prevBtn.classList.toggle('opacity-50', this.currentServerPage <= 1);
    }
    
    const nextBtn = document.getElementById('server-next-page');
    if (nextBtn) {
      const noMorePages = showing >= total;
      nextBtn.disabled = noMorePages;
      nextBtn.classList.toggle('opacity-50', noMorePages);
    }
  }
  
  viewServer(serverId) {
    window.location.href = `/server/${serverId}`;
  }
  
  deleteServer(serverId, serverName) {
    const title = 'Delete Server';
    const message = `Are you sure you want to delete <span class="text-white font-semibold">${serverName}</span>? This action cannot be undone and will delete all associated channels, messages, and data.`;
    
    this.showDiscordConfirmation(title, message, () => {
      if (!window.serverAPI) {
        showToast("Server API is not available", "error");
        return;
      }
      
      showToast("Deleting server...", "info");
      
      window.serverAPI.deleteServer(serverId)
        .then(response => {
          if (response.success) {
            showToast("Server deleted successfully", "success");
            this.loadServers();
            this.loadServerStats();
          } else {
            showToast(response.message || "Failed to delete server", "error");
          }
        })
        .catch(error => {
          console.error("Error deleting server:", error);
          showToast("An error occurred while deleting the server", "error");
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
        if (closeBtn) closeBtn.removeEventListener('click', handleCancel);
        confirmCallback();
      };
      
      const handleCancel = () => {
        confirmModal.classList.add('hidden');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        if (closeBtn) closeBtn.removeEventListener('click', handleCancel);
      };
      
      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      if (closeBtn) closeBtn.addEventListener('click', handleCancel);
      
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

export default ServerManager;
