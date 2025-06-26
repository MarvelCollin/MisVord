import { showToast } from "../../core/ui/toast.js";
import nitroAPI from "../../api/nitro-api.js";

export class NitroManager {
  constructor() {
    this.currentNitroPage = 1;
    this.nitroPerPage = 10;
    this.userSearchTimeout = null;
    
    this.init();
  }

  init() {
    this.initNitroManagement();
    this.initUserSearch();
    
    this.showInitialSkeletons();
    
    setTimeout(() => {
      this.loadNitroCodes();
      this.loadNitroStats();
    }, 10);
  }

  showInitialSkeletons() {
    this.showSkeleton("active-nitro-count");
    this.showSkeleton("used-nitro-count");
    this.showSkeleton("total-nitro-count");
    this.showSkeleton("nitro-table-body");
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
      case "active-nitro-count":
      case "used-nitro-count":
      case "total-nitro-count":
        return '<div class="skeleton" style="height: 1.5rem; width: 3rem;"></div>';
      case "nitro-table-body":
        return this.getNitroTableSkeleton();
      default:
        return '';
    }
  }
  
  getNitroTableSkeleton() {
    let skeleton = '';
    for (let i = 0; i < this.nitroPerPage; i++) {
      skeleton += `
        <tr class="border-b border-discord-dark">
          <td class="py-4"><div class="skeleton" style="height: 1.5rem; width: 2rem;"></div></td>
          <td class="py-4"><div class="skeleton" style="height: 1.5rem; width: 8rem;"></div></td>
          <td class="py-4"><div class="skeleton" style="height: 1rem; width: 5rem;"></div></td>
          <td class="py-4"><div class="skeleton" style="height: 1rem; width: 3rem;"></div></td>
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

  initNitroManagement() {
    const generateForm = document.getElementById('generate-nitro-form');
    if (generateForm) {
      generateForm.addEventListener('submit', (e) => this.handleNitroGenerate(e));
    }
    
    const nitroPrevBtn = document.getElementById('nitro-prev-page');
    const nitroNextBtn = document.getElementById('nitro-next-page');
    
    if (nitroPrevBtn) {
      nitroPrevBtn.addEventListener('click', () => {
        if (this.currentNitroPage > 1) {
          this.currentNitroPage--;
          this.loadNitroCodes();
        }
      });
    }
    
    if (nitroNextBtn) {
      nitroNextBtn.addEventListener('click', () => {
        this.currentNitroPage++;
        this.loadNitroCodes();
      });
    }
    
    const searchInput = document.getElementById('nitro-search');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(() => {
        this.currentNitroPage = 1;
        this.loadNitroCodes();
      }, 300));
    }
  }
  
  initUserSearch() {
    const userSearchInput = document.getElementById('user_search');
    const userSearchResults = document.getElementById('user-search-results');
    const userIdInput = document.getElementById('user_id');
    
    if (userSearchInput && userSearchResults && userIdInput) {
      const clearButton = document.createElement('button');
      clearButton.type = 'button';
      clearButton.className = 'absolute right-2 top-1/2 transform -translate-y-1/2 text-discord-lighter hover:text-white';
      clearButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      `;
      clearButton.addEventListener('click', () => {
        userSearchInput.value = '';
        userIdInput.value = '';
        userSearchResults.classList.add('hidden');
      });
      
      const parent = userSearchInput.parentElement;
      if (parent) {
        parent.style.position = 'relative';
        parent.appendChild(clearButton);
      }
      
      userSearchInput.addEventListener('click', () => {
        if (userSearchInput.value.trim().length >= 2) {
          userSearchResults.classList.remove('hidden');
        }
      });
      
      userSearchInput.addEventListener('input', this.debounce(() => {
        const query = userSearchInput.value.trim();
        
        if (query.length === 0) {
          userIdInput.value = '';
          userSearchResults.innerHTML = '<div class="p-2 text-sm text-gray-400">Type to search users...</div>';
          userSearchResults.classList.add('hidden');
          return;
        }
        
        if (query.length >= 2) {
          this.searchUsers(query);
        }
      }, 300));
      
      document.addEventListener('click', (e) => {
        if (!userSearchInput.contains(e.target) && !userSearchResults.contains(e.target)) {
          userSearchResults.classList.add('hidden');
        }
      });
      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          userSearchResults.classList.add('hidden');
        }
      });
    }
  }
  
  searchUsers(query) {
    const userSearchResults = document.getElementById('user-search-results');
    
    if (!userSearchResults) return;
    
    userSearchResults.innerHTML = '<div class="p-2 text-sm text-discord-lighter">Searching...</div>';
    userSearchResults.classList.remove('hidden');
    
    const ajaxConfig = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin'
    };
    
    fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`, ajaxConfig)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success && data.data && data.data.users && Array.isArray(data.data.users)) {
          if (data.data.users.length === 0) {
            userSearchResults.innerHTML = '<div class="p-2 text-sm text-discord-lighter">No users found</div>';
            return;
          }
          
          userSearchResults.innerHTML = '';
          
          data.data.users.forEach(user => {
            const resultItem = document.createElement('div');
            resultItem.className = 'p-2 hover:bg-discord-dark cursor-pointer flex items-center';
            resultItem.dataset.userId = user.id;

            const username = user.username || 'Unknown';
            const discriminator = user.discriminator || '0000';
            const displayName = `${username}#${discriminator}`;
            
            resultItem.innerHTML = `
              <div class="w-8 h-8 rounded-full overflow-hidden bg-discord-dark mr-2">
                <img src="${user.avatar_url || '/public/assets/common/main-logo.png'}" alt="Avatar" class="w-full h-full object-cover" onerror="this.src='/public/assets/common/main-logo.png'">
              </div>
              <div>
                <div class="text-sm font-medium text-white">${displayName}</div>
                <div class="text-xs text-discord-lighter">${user.email || 'No email'}</div>
              </div>
            `;
            
            resultItem.addEventListener('click', () => this.selectUser(user));
            userSearchResults.appendChild(resultItem);
          });
        } else {
          userSearchResults.innerHTML = '<div class="p-2 text-sm text-discord-lighter">Error: Invalid response format</div>';
          console.error('Invalid response format:', data);
        }
      })
      .catch(error => {
        console.error('Error searching users:', error);
        userSearchResults.innerHTML = `<div class="p-2 text-sm text-discord-lighter">Error: ${error.message}</div>`;
      });
  }
  
  selectUser(user) {
    const userIdInput = document.getElementById('user_id');
    const userSearchInput = document.getElementById('user_search');
    const userSearchResults = document.getElementById('user-search-results');
    
    if (userIdInput && userSearchInput && userSearchResults) {
      userIdInput.value = user.id;
      userSearchInput.value = `${user.username}#${user.discriminator}`;
      userSearchResults.classList.add('hidden');
    }
  }
  
  handleNitroGenerate(e) {
    e.preventDefault();
    
    const form = e.target;
    const userId = form.user_id.value || null;
    
    nitroAPI.generateCode(userId)
      .then(response => {
        if (response.success) {
          const nitroCode = response.data.nitro.code;
          showToast(`Nitro code generated successfully: ${nitroCode}`, "success");
          navigator.clipboard.writeText(nitroCode)
            .then(() => {
              showToast("Code copied to clipboard", "info");
            });
          form.reset();
          document.getElementById('user_search').value = '';
          document.getElementById('user_id').value = '';
          this.loadNitroCodes();
          this.loadNitroStats();
        } else {
          showToast(response.message || "Failed to generate nitro code", "error");
        }
      })
      .catch(error => {
        showToast("An error occurred while generating the nitro code", "error");
      });
  }
  
  loadNitroCodes() {
    if (!nitroAPI) {
      console.warn('nitroAPI not available yet, retrying in 500ms');
      setTimeout(() => this.loadNitroCodes(), 500);
      return;
    }
    
    const searchQuery = document.getElementById('nitro-search')?.value || "";
    
    nitroAPI.listCodes(this.currentNitroPage, this.nitroPerPage, searchQuery)
      .then(response => {
        if (response.success) {
          const nitro_codes = response.data.nitro_codes;
          const total = response.data.total;
          const showing = nitro_codes.length;
          
          this.renderNitroCodes(nitro_codes, total, showing);
        } else {
          showToast(response.message || "Failed to load nitro codes", "error");
        }
      })
      .catch(error => {
        showToast("An error occurred while loading nitro codes", "error");
      });
  }
  
  loadNitroStats() {
    if (!nitroAPI) {
      console.warn('nitroAPI not available yet, retrying in 500ms');
      setTimeout(() => this.loadNitroStats(), 500);
      return;
    }
    
    nitroAPI.getStats()
      .then(response => {
        if (response.success) {
          const stats = response.data.stats;
          
          document.getElementById('active-nitro-count').textContent = stats.active || 0;
          document.getElementById('used-nitro-count').textContent = stats.used || 0;
          document.getElementById('total-nitro-count').textContent = stats.total || 0;
        }
      })
      .catch(error => {
        console.error('Error loading nitro stats:', error);
      });
  }
  
  renderNitroCodes(codes, total, showing) {
    const tableBody = document.getElementById('nitro-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!codes || codes.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="6" class="py-4 text-center text-discord-lighter">No nitro codes found</td>
      `;
      tableBody.appendChild(row);
      return;
    }
    
    codes.forEach(code => {
      const row = document.createElement('tr');
      row.className = 'border-b border-discord-dark';
      
      const status = code.user_id ? 
        '<span class="text-yellow-400">Used</span>' : 
        '<span class="text-green-400">Active</span>';
      
      let userDisplay;
      if (code.user_id) {
        if (code.username && code.discriminator) {
          userDisplay = `<span class="text-white">${code.username}#${code.discriminator}</span>`;
        } else {
          userDisplay = `<span class="text-discord-lighter">User ID: ${code.user_id}</span>`;
        }
      } else {
        userDisplay = '<span class="text-discord-lighter">Unassigned</span>';
      }
      
      row.innerHTML = `
        <td class="py-4">${code.id}</td>
        <td class="py-4">
          <span class="bg-discord-dark px-2 py-1 rounded text-yellow-400 font-mono">${code.code}</span>
        </td>
        <td class="py-4">${userDisplay}</td>
        <td class="py-4">${status}</td>
        <td class="py-4">${this.formatDate(code.created_at)}</td>
        <td class="py-4">
          <div class="flex space-x-2">
            <button class="text-blue-400 hover:text-blue-300" onclick="window.nitroManager.copyNitroCode('${code.code}')">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
            <button class="text-red-400 hover:text-red-300" onclick="window.nitroManager.deleteNitroCode(${code.id})">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    const showingCount = document.getElementById('nitro-showing-count');
    if (showingCount) showingCount.textContent = showing;
    
    const totalCount = document.getElementById('nitro-total-count');
    if (totalCount) totalCount.textContent = total;
    
    const prevBtn = document.getElementById('nitro-prev-page');
    if (prevBtn) {
      prevBtn.disabled = this.currentNitroPage <= 1;
      prevBtn.classList.toggle('opacity-50', this.currentNitroPage <= 1);
    }
    
    const nextBtn = document.getElementById('nitro-next-page');
    if (nextBtn) {
      const noMorePages = showing >= total;
      nextBtn.disabled = noMorePages;
      nextBtn.classList.toggle('opacity-50', noMorePages);
    }
  }
  
  copyNitroCode(code) {
    navigator.clipboard.writeText(code)
      .then(() => {
        showToast("Nitro code copied to clipboard", "success");
      })
      .catch(err => {
        showToast("Failed to copy code to clipboard", "error");
      });
  }
  
  deleteNitroCode(id) {
    this.showDeleteConfirmation('Delete Nitro Code', 'Are you sure you want to delete this nitro code? This action cannot be undone.', () => {
      nitroAPI.deleteCode(id)
        .then(data => {
          if (data.success) {
            showToast("Nitro code deleted successfully", "success");
            this.loadNitroCodes();
            this.loadNitroStats();
          } else {
            showToast(data.message || "Failed to delete nitro code", "error");
          }
        })
        .catch(error => {
          showToast("An error occurred while deleting the nitro code", "error");
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

export default NitroManager;
