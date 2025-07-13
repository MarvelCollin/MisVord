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
      const serverRow = e.target.closest('.server-row');
      const deleteButton = e.target.closest('.delete-server');
      
      if (deleteButton) {
        e.preventDefault();
        e.stopPropagation();
        const serverId = deleteButton.getAttribute('data-id');
        const serverName = deleteButton.getAttribute('data-name') || 'this server';
        this.deleteServer(serverId, serverName);
        return;
      }
      
      if (serverRow) {
        e.preventDefault();
        const serverId = serverRow.getAttribute('data-server-id');
        if (serverId) {
          this.showServerDetailsModal(serverId);
        }
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
      const ownerDisplay = server.owner_display || 'Unknown User';
      const memberCount = server.member_count !== undefined && server.member_count !== null ? server.member_count : 0;
      const createdAt = server.created_at ? this.formatDate(server.created_at) : 'Unknown';
      
      let iconContent = server.icon 
        ? `<img src="${server.icon}" alt="${serverName}" class="server-icon">`
        : `<div class="server-icon-placeholder">${serverName.charAt(0).toUpperCase()}</div>`;
      
      const row = document.createElement('tr');
      
      row.className = 'server-row cursor-pointer hover:bg-discord-dark transition-colors duration-200';
      row.setAttribute('data-server-id', serverId);
      
      row.innerHTML = `
        <td>${serverId}</td>
        <td>
          <div class="flex items-center space-x-3">
            <div class="server-avatar-sm">${iconContent}</div>
            <span class="font-medium">${serverName}</span>
          </div>
        </td>
        <td>${ownerDisplay}</td>
        <td>
          <span class="text-discord-lighter">${memberCount}</span>
        </td>
        <td>${createdAt}</td>
        <td>
          <div class="flex space-x-2">
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
  
  showServerDetailsModal(serverId) {
    if (!window.serverAPI) {
      showToast("Server API is not available", "error");
      return;
    }

    this.renderServerDetailsLoadingSkeleton();

    window.serverAPI.getServerDetails(serverId)
      .then(response => {
        this.closeServerModal();
        if (response.success) {
          this.renderServerDetailsModal(response.data);
        } else {
          showToast(response.message || "Failed to load server details", "error");
        }
      })
      .catch(error => {
        console.error("Error loading server details:", error);
        this.closeServerModal();
        showToast("An error occurred while loading server details", "error");
      });
  }

  renderServerDetailsLoadingSkeleton() {
    const skeletonHTML = `
      <div id="server-details-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
        <div class="bg-discord-darker rounded-lg shadow-2xl max-w-6xl max-h-[90vh] w-full mx-4 animate-slide-up overflow-hidden">
          
          <div class="bg-discord-dark p-6 border-b border-discord-light">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="w-16 h-16 bg-discord-light rounded-lg animate-pulse"></div>
                <div>
                  <div class="h-6 bg-discord-light rounded w-48 animate-pulse mb-2"></div>
                  <div class="h-4 bg-discord-light rounded w-64 animate-pulse"></div>
                </div>
              </div>
              <button id="close-server-modal" class="text-discord-lighter hover:text-white transition-colors duration-200">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>

          
          <div class="p-6 overflow-y-auto max-h-[70vh]">
            
            <div class="mb-8">
              <div class="flex items-center mb-4">
                <div class="w-6 h-6 bg-discord-light rounded animate-pulse mr-2"></div>
                <div class="h-6 bg-discord-light rounded w-40 animate-pulse"></div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-discord-dark p-4 rounded-lg">
                ${Array(6).fill().map(() => `
                  <div>
                    <div class="h-3 bg-discord-light rounded w-20 animate-pulse mb-1"></div>
                    <div class="h-4 bg-discord-light rounded w-32 animate-pulse"></div>
                  </div>
                `).join('')}
              </div>
            </div>

            
            <div>
              <div class="flex items-center mb-4">
                <div class="w-6 h-6 bg-discord-light rounded animate-pulse mr-2"></div>
                <div class="h-6 bg-discord-light rounded w-32 animate-pulse"></div>
              </div>
              <div class="space-y-3 max-h-96 overflow-y-auto">
                ${Array(5).fill().map(() => `
                  <div class="bg-discord-dark p-4 rounded-lg animate-pulse">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-discord-light rounded-full"></div>
                        <div>
                          <div class="flex items-center space-x-2 mb-2">
                            <div class="h-4 bg-discord-light rounded w-24"></div>
                            <div class="h-3 bg-discord-light rounded w-12"></div>
                          </div>
                          <div class="flex items-center space-x-2">
                            <div class="h-3 bg-discord-light rounded w-16"></div>
                            <div class="h-3 bg-discord-light rounded w-20"></div>
                          </div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="h-3 bg-discord-light rounded w-16 mb-1"></div>
                        <div class="h-3 bg-discord-light rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', skeletonHTML);

    const modal = document.getElementById('server-details-modal');
    const closeBtn = document.getElementById('close-server-modal');

    closeBtn.addEventListener('click', () => this.closeServerModal());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeServerModal();
      }
    });

    this.escHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeServerModal();
      }
    };
    document.addEventListener('keydown', this.escHandler);
  }

  closeServerModal() {
    const modal = document.getElementById('server-details-modal');
    if (modal) {
      modal.classList.add('animate-fade-out');
      setTimeout(() => {
        if (modal && modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 300);
    }
    
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
      this.escHandler = null;
    }
  }

  renderServerDetailsModal(data) {
    this.closeServerModal();
    
    setTimeout(() => {
      const server = data.server;
      const members = data.members;

      const modalHTML = `
        <div id="server-details-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div class="bg-discord-darker rounded-lg shadow-2xl max-w-6xl max-h-[90vh] w-full mx-4 animate-slide-up overflow-hidden">
            
            <div class="bg-discord-dark p-6 border-b border-discord-light">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                  ${server.icon ? 
                    `<img src="${server.icon}" alt="${server.name}" class="w-16 h-16 rounded-lg object-cover">` : 
                    `<div class="w-16 h-16 bg-discord-primary rounded-lg flex items-center justify-center text-2xl font-bold text-white">${server.name.charAt(0).toUpperCase()}</div>`
                  }
                  <div>
                    <h2 class="text-2xl font-bold text-white">${server.name}</h2>
                    <p class="text-discord-lighter">${server.description || 'No description available'}</p>
                  </div>
                </div>
                <button id="close-server-modal" class="text-discord-lighter hover:text-white transition-colors duration-200">
                  <i class="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            
            <div class="p-6 overflow-y-auto max-h-[70vh]">
              
              <div class="mb-8">
                <h3 class="text-xl font-bold text-white mb-4">
                  <i class="fas fa-server mr-2 text-discord-primary"></i>
                  Server Information
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-discord-dark p-4 rounded-lg">
                  <div>
                    <span class="text-discord-lighter text-sm">Server ID:</span>
                    <p class="text-white font-mono">${server.id}</p>
                  </div>
                  <div>
                    <span class="text-discord-lighter text-sm">Category:</span>
                    <p class="text-white capitalize">${server.category || 'None'}</p>
                  </div>
                  <div>
                    <span class="text-discord-lighter text-sm">Public:</span>
                    <p class="text-white">${server.is_public ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <span class="text-discord-lighter text-sm">Members:</span>
                    <p class="text-white">${server.member_count}</p>
                  </div>
                  <div>
                    <span class="text-discord-lighter text-sm">Created:</span>
                    <p class="text-white">${this.formatDate(server.created_at)}</p>
                  </div>
                  <div>
                    <span class="text-discord-lighter text-sm">Updated:</span>
                    <p class="text-white">${this.formatDate(server.updated_at)}</p>
                  </div>
                </div>
              </div>

              
              <div>
                <h3 class="text-xl font-bold text-white mb-4">
                  <i class="fas fa-users mr-2 text-discord-primary"></i>
                  Members (${members.length})
                </h3>
                <div class="space-y-3 max-h-96 overflow-y-auto">
                  ${members.map(member => `
                    <div class="bg-discord-dark p-4 rounded-lg hover:bg-discord-light transition-colors duration-200">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                          ${member.avatar_url ? 
                            `<img src="${member.avatar_url}" alt="${member.display_name || member.username}" class="w-10 h-10 rounded-full object-cover">` : 
                            `<div class="w-10 h-10 bg-discord-primary rounded-full flex items-center justify-center text-sm font-bold text-white">${(member.display_name || member.username).charAt(0).toUpperCase()}</div>`
                          }
                          <div>
                            <div class="flex items-center space-x-2">
                              <span class="text-white font-medium">${member.display_name || member.username}</span>
                              <span class="text-discord-lighter text-sm">#${member.discriminator}</span>
                              ${member.nickname ? `<span class="text-discord-lighter text-sm">(${member.nickname})</span>` : ''}
                            </div>
                            <div class="flex items-center space-x-2 text-sm">
                              <span class="px-2 py-1 rounded-full text-xs font-medium ${this.getRoleBadgeClass(member.role)}">${member.role}</span>
                              <span class="text-discord-lighter">Joined: ${this.formatDate(member.joined_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div class="text-right text-sm text-discord-lighter">
                          <div>ID: ${member.user_id}</div>
                          <div>Status: <span class="${this.getStatusClass(member.status)}">${member.status}</span></div>
                        </div>
                      </div>
                      ${member.bio ? `<div class="mt-2 text-discord-lighter text-sm">${member.bio}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);

      const modal = document.getElementById('server-details-modal');
      const closeBtn = document.getElementById('close-server-modal');

      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeServerModal());
      }
      
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeServerModal();
          }
        });
      }

      this.escHandler = (e) => {
        if (e.key === 'Escape') {
          this.closeServerModal();
        }
      };
      document.addEventListener('keydown', this.escHandler);
    }, 100);
  }

  getRoleBadgeClass(role) {
    switch (role) {
      case 'owner':
        return 'bg-red-600 text-white';
      case 'admin':
        return 'bg-orange-600 text-white';
      case 'moderator':
        return 'bg-yellow-600 text-white';
      default:
        return 'bg-discord-light text-discord-lighter';
    }
  }

  getStatusClass(status) {
    switch (status) {
      case 'online':
        return 'text-green-400';
      case 'idle':
        return 'text-yellow-400';
      case 'dnd':
        return 'text-red-400';
      case 'banned':
        return 'text-red-600';
      default:
        return 'text-discord-lighter';
    }
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
    date.setTime(date.getTime() + (7 * 60 * 60 * 1000));
    return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Jakarta' });
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
