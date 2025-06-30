import { showToast } from "../../core/ui/toast.js";
import nitroAPI from "../../api/nitro-api.js";
import { jaroWinkler } from "../../utils/jaro-winkler.js";

export class NitroManager {
  constructor() {
    this.currentNitroPage = 1;
    this.nitroPerPage = 10;
    this.userSearchTimeout = null;
    this.searchController = null;
    this.searchCache = new Map();
    this.maxCacheSize = 50;
    this.allUsersCache = null;
    this.allUsersLoaded = false;
    
    this.init();
  }

  init() {
    this.initNitroManagement();
    this.initUserSearch();
    
    this.showInitialSkeletons();
    
    setTimeout(() => {
      this.loadNitroCodes();
      this.loadNitroStats();
      this.preloadAllUsers();
    }, 10);
  }

  preloadAllUsers() {
    if (this.allUsersLoaded) return;
    
    this.loadAllUsersInBackground();
  }

  loadAllUsersInBackground() {
    const ajaxConfig = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin'
    };
    
    fetch(`/api/admin/users?limit=100`, ajaxConfig)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Background user load response:', data);
        
        if (data.success && data.data && data.data.data && data.data.data.users && Array.isArray(data.data.data.users)) {
          this.allUsersCache = data.data.data.users;
          this.allUsersLoaded = true;
          console.log(`Loaded ${data.data.data.users.length} users for fuzzy search`);
        } else if (data.success && data.data && data.data.users && Array.isArray(data.data.users)) {
          this.allUsersCache = data.data.users;
          this.allUsersLoaded = true;
          console.log(`Loaded ${data.data.users.length} users for fuzzy search`);
        } else if (data.success && data.users && Array.isArray(data.users)) {
          this.allUsersCache = data.users;
          this.allUsersLoaded = true;
          console.log(`Loaded ${data.users.length} users for fuzzy search (alternative format)`);
        } else {
          console.warn('Unexpected response format for user preload:', data);
        }
      })
      .catch(error => {
        console.warn('Failed to preload users for fuzzy search:', error);
      });
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
      userSearchInput.addEventListener('click', () => {
        const currentValue = userSearchInput.value.trim();
        if (currentValue.length === 0) {
          this.loadAllUsers();
        } else if (currentValue.length >= 2) {
          this.showDropdownWithAnimation(userSearchResults);
        }
      });
      
      userSearchInput.addEventListener('input', this.debounce(() => {
        const query = userSearchInput.value.trim();
        
        if (query.length === 0) {
          userIdInput.value = '';
          this.loadAllUsers();
          return;
        }
        
        if (query.length >= 2) {
          this.searchUsers(query);
        } else {
          userSearchResults.innerHTML = '<div class="p-2 text-sm text-gray-400 animate-fade-in">Type at least 2 characters...</div>';
          this.showDropdownWithAnimation(userSearchResults);
        }
      }, 200));
      
      document.addEventListener('click', (e) => {
        if (!userSearchInput.contains(e.target) && !userSearchResults.contains(e.target)) {
          this.hideDropdownWithAnimation(userSearchResults);
        }
      });
      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.hideDropdownWithAnimation(userSearchResults);
        }
      });
    }
  }
  
  showDropdownWithAnimation(dropdown) {
    dropdown.classList.remove('hidden');
    dropdown.style.opacity = '0';
    dropdown.style.transform = 'translateY(-10px)';
    dropdown.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    requestAnimationFrame(() => {
      dropdown.style.opacity = '1';
      dropdown.style.transform = 'translateY(0)';
    });
  }
  
  hideDropdownWithAnimation(dropdown) {
    dropdown.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
    dropdown.style.opacity = '0';
    dropdown.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
      dropdown.classList.add('hidden');
    }, 200);
  }
  
  searchUsers(query) {
    const userSearchResults = document.getElementById('user-search-results');
    
    if (!userSearchResults) return;
    
    if (this.searchController) {
      this.searchController.abort();
    }
    
    if (this.searchCache.has(query)) {
      this.renderSearchResults(this.searchCache.get(query), userSearchResults, query);
      this.showDropdownWithAnimation(userSearchResults);
      return;
    }
    
    if (this.allUsersLoaded && this.allUsersCache) {
      this.showUserSearchSkeleton(userSearchResults);
      this.showDropdownWithAnimation(userSearchResults);
      
      const searchStartTime = Date.now();
      
      setTimeout(() => {
        const fuzzyResults = jaroWinkler.searchUsers(this.allUsersCache, query, {
          threshold: 0.3,
          maxResults: 8,
          fields: ['username', 'display_name', 'email'],
          weights: { username: 1.0, display_name: 0.8, email: 0.6 }
        });
        
        const searchDuration = Date.now() - searchStartTime;
        const minLoadingTime = 1200;
        const remainingTime = Math.max(0, minLoadingTime - searchDuration);
        
        setTimeout(() => {
          this.cacheSearchResult(query, fuzzyResults);
          this.renderSearchResults(fuzzyResults, userSearchResults, query);
        }, remainingTime);
      }, 50);
      return;
    }
    
    this.showUserSearchSkeleton(userSearchResults);
    this.showDropdownWithAnimation(userSearchResults);
    
    this.searchController = new AbortController();
    const searchStartTime = Date.now();
    
    const ajaxConfig = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin',
      signal: this.searchController.signal
    };
    
    fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}&limit=8`, ajaxConfig)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Search response:', data);
        
        const searchDuration = Date.now() - searchStartTime;
        const minLoadingTime = 1500;
        const remainingTime = Math.max(0, minLoadingTime - searchDuration);
        
        setTimeout(() => {
          if (data.success && data.data && data.data.data && data.data.data.users && Array.isArray(data.data.data.users)) {
            this.cacheSearchResult(query, data.data.data.users);
            this.renderSearchResults(data.data.data.users, userSearchResults, query);
          } else if (data.success && data.data && data.data.users && Array.isArray(data.data.users)) {
            this.cacheSearchResult(query, data.data.users);
            this.renderSearchResults(data.data.users, userSearchResults, query);
          } else if (data.success && data.users && Array.isArray(data.users)) {
            this.cacheSearchResult(query, data.users);
            this.renderSearchResults(data.users, userSearchResults, query);
          } else {
            console.error('Invalid response format:', data);
            userSearchResults.innerHTML = '<div class="p-2 text-sm text-discord-lighter animate-shake">Invalid response format</div>';
          }
        }, remainingTime);
      })
      .catch(error => {
        if (error.name === 'AbortError') {
          return;
        }
        console.error('Error searching users:', error);
        userSearchResults.innerHTML = `<div class="p-2 text-sm text-discord-lighter animate-shake">Search failed</div>`;
      })
      .finally(() => {
        this.searchController = null;
      });
  }
  
  cacheSearchResult(query, users) {
    if (this.searchCache.size >= this.maxCacheSize) {
      const firstKey = this.searchCache.keys().next().value;
      this.searchCache.delete(firstKey);
    }
    this.searchCache.set(query, users);
  }
  
  renderSearchResults(users, userSearchResults, query = '') {
    if (users.length === 0) {
      userSearchResults.innerHTML = '<div class="p-2 text-sm text-discord-lighter animate-fade-in">No users found</div>';
      return;
    }
    
    const fragment = document.createDocumentFragment();
    
    users.forEach((user, index) => {
      const hasNitro = user.has_nitro || user.nitro_status === 'active' || user.nitro_active;
      
      let itemClasses = 'p-2 flex items-center transition-all duration-200 opacity-0';
      
      if (hasNitro) {
        itemClasses += ' opacity-50 cursor-not-allowed';
      } else {
        itemClasses += ' hover:bg-discord-dark cursor-pointer hover:scale-[1.02] transform';
      }
      
      const resultItem = document.createElement('div');
      resultItem.className = itemClasses;
      resultItem.dataset.userId = user.id;
      resultItem.dataset.hasNitro = hasNitro;
      
      const username = user.username || 'Unknown';
      const discriminator = user.discriminator || '0000';
      let displayName = `${username}#${discriminator}`;
      let email = user.email || 'No email';
      
      if (query) {
        displayName = jaroWinkler.highlightMatches(displayName, query);
        email = jaroWinkler.highlightMatches(email, query);
      }
      
      const nitroIndicator = hasNitro ? 
        '<div class="ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30"><i class="fas fa-crown mr-1"></i>Has Nitro</div>' : 
        '';
      
      const avatarOpacity = hasNitro ? 'opacity-60' : '';
      const textOpacity = hasNitro ? 'opacity-60' : '';
      
      resultItem.innerHTML = `
        <div class="w-8 h-8 rounded-full overflow-hidden bg-discord-dark mr-2 flex-shrink-0 ${avatarOpacity}">
          <img src="${user.avatar_url || '/public/assets/common/default-profile-picture.png'}" alt="" class="w-full h-full object-cover" loading="lazy" onerror="this.src='/public/assets/common/default-profile-picture.png'">
        </div>
        <div class="flex-1 min-w-0 ${textOpacity}">
          <div class="text-sm font-medium text-white truncate">${displayName}</div>
          <div class="text-xs text-discord-lighter truncate">${email}</div>
        </div>
        ${nitroIndicator}
        ${hasNitro ? '<div class="ml-2 text-discord-lighter"><i class="fas fa-ban"></i></div>' : ''}
      `;
      
      if (!hasNitro) {
        resultItem.addEventListener('click', () => this.selectUserWithAnimation(user, resultItem));
      } else {
        resultItem.addEventListener('click', (e) => {
          e.preventDefault();
          resultItem.style.animation = 'shake 0.3s ease-in-out';
          showToast("This user already has an active Nitro subscription", "warning");
          setTimeout(() => {
            resultItem.style.animation = '';
          }, 300);
        });
        
        resultItem.title = "This user already has Nitro and cannot be assigned another code";
      }
      
      fragment.appendChild(resultItem);
    });
    
    userSearchResults.innerHTML = '';
    userSearchResults.appendChild(fragment);
    
    const items = userSearchResults.querySelectorAll('.opacity-0');
    items.forEach((item, index) => {
      setTimeout(() => {
        item.classList.remove('opacity-0');
        item.classList.add('opacity-100');
      }, index * 30);
    });
  }
  
  selectUserWithAnimation(user, element) {
    element.style.transform = 'scale(0.95)';
    element.style.backgroundColor = '#5865f2';
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
      element.style.backgroundColor = '';
    }, 150);
    
    const userIdInput = document.getElementById('user_id');
    const userSearchInput = document.getElementById('user_search');
    const userSearchResults = document.getElementById('user-search-results');
    
    if (userIdInput && userSearchInput && userSearchResults) {
      userIdInput.value = user.id;
      userSearchInput.value = `${user.username}#${user.discriminator}`;
      
      userSearchInput.style.transition = 'all 0.3s ease';
      userSearchInput.style.borderColor = '#5865f2';
      userSearchInput.style.boxShadow = '0 0 0 2px rgba(88, 101, 242, 0.2)';
      
      setTimeout(() => {
        userSearchInput.style.borderColor = '';
        userSearchInput.style.boxShadow = '';
      }, 1000);
      
      this.hideDropdownWithAnimation(userSearchResults);
    }
  }
  
  selectUser(user) {
    this.selectUserWithAnimation(user, null);
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
    date.setTime(date.getTime() + (7 * 60 * 60 * 1000));
    return date.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' ' + date.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' });
  }
  
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  showUserSearchSkeleton(userSearchResults) {
    const skeletonHtml = `
      <style>
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .user-search-skeleton .skeleton-shimmer {
          background: linear-gradient(90deg, #2f3136 25%, #36393f 50%, #2f3136 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      </style>
      <div class="user-search-skeleton">
        ${Array.from({length: 5}, (_, i) => `
          <div class="p-2 flex items-center animate-pulse" style="animation-delay: ${i * 100}ms;">
            <div class="w-8 h-8 rounded-full bg-discord-dark mr-2 flex-shrink-0 skeleton-shimmer"></div>
            <div class="flex-1 min-w-0">
              <div class="h-4 bg-discord-dark rounded skeleton-shimmer mb-1" style="width: ${60 + Math.random() * 40}%;"></div>
              <div class="h-3 bg-discord-darker rounded skeleton-shimmer" style="width: ${40 + Math.random() * 30}%;"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    userSearchResults.innerHTML = skeletonHtml;
  }

  loadAllUsers() {
    const userSearchResults = document.getElementById('user-search-results');
    
    if (!userSearchResults) return;
    
    if (this.searchController) {
      this.searchController.abort();
    }
    
    const cacheKey = '__all_users__';
    if (this.searchCache.has(cacheKey)) {
      this.renderSearchResults(this.searchCache.get(cacheKey), userSearchResults);
      this.showDropdownWithAnimation(userSearchResults);
      return;
    }
    
    this.showUserSearchSkeleton(userSearchResults);
    this.showDropdownWithAnimation(userSearchResults);
    
    this.searchController = new AbortController();
    const loadStartTime = Date.now();
    
    const ajaxConfig = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin',
      signal: this.searchController.signal
    };
    
    fetch(`/api/admin/users?limit=20`, ajaxConfig)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Load all users response:', data);
        
        const loadDuration = Date.now() - loadStartTime;
        const minLoadingTime = 1200;
        const remainingTime = Math.max(0, minLoadingTime - loadDuration);
        
        setTimeout(() => {
          if (data.success && data.data && data.data.data && data.data.data.users && Array.isArray(data.data.data.users)) {
            this.cacheSearchResult(cacheKey, data.data.data.users);
            this.renderSearchResults(data.data.data.users, userSearchResults);
          } else if (data.success && data.data && data.data.users && Array.isArray(data.data.users)) {
            this.cacheSearchResult(cacheKey, data.data.users);
            this.renderSearchResults(data.data.users, userSearchResults);
          } else if (data.success && data.users && Array.isArray(data.users)) {
            this.cacheSearchResult(cacheKey, data.users);
            this.renderSearchResults(data.users, userSearchResults);
          } else {
            console.error('Invalid response format for load all users:', data);
            userSearchResults.innerHTML = '<div class="p-2 text-sm text-discord-lighter animate-shake">Failed to load users</div>';
          }
        }, remainingTime);
      })
      .catch(error => {
        if (error.name === 'AbortError') {
          return;
        }
        console.error('Error loading users:', error);
        userSearchResults.innerHTML = `<div class="p-2 text-sm text-discord-lighter animate-shake">Failed to load users</div>`;
      })
      .finally(() => {
        this.searchController = null;
      });
  }
}

export default NitroManager;
