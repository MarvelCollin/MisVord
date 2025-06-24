import { showToast } from "../../core/ui/toast.js";
import NitroManager from "./admin-nitro.js";
import ServerManager from "./admin-server.js";
import UserManager from "./admin-user.js";
import OverviewManager from "./admin-overview.js";

class AdminManager {
  constructor() {
    this.currentSection = "overview";
    
    this.initAdminLogger();
    this.init();
  }

  initAdminLogger() {
    if (!window.logger) {
      window.logger = {
        info: (module, ...args) => {},
        debug: (module, ...args) => {},
        warn: (module, ...args) => {},
        error: (module, ...args) => {},
        group: () => {},
        groupEnd: () => {},
        table: () => {},
        time: () => {},
        timeEnd: () => {},
        trace: () => {}
      };
    }
  }

  init() {
    this.initSectionSwitching();
    this.initLogoutButton();
    this.initSystemLogs();
    this.initKeyboardShortcuts();
    this.initChartConfigModal();
    this.initUserBanActions();
    
    window.nitroManager = new NitroManager();
    window.serverManager = new ServerManager();
    window.userManager = new UserManager();
    window.overviewManager = new OverviewManager();
    
    if (window.location.hash) {
      const section = window.location.hash.substring(1);
      this.switchSection(section);
    } else {
      this.loadSystemStats();
    }
  }

  initSectionSwitching() {
    const sectionLinks = document.querySelectorAll("[data-section]");
    
    sectionLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const section = link.getAttribute("data-section");
        this.switchSection(section);
      });
    });
  }

  initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        if (this.currentSection === "overview") {
          this.toggleChartConfigModal();
        }
      }
    });
  }

  initChartConfigModal() {
    const modal = document.getElementById('chart-config-modal');
    const closeButton = document.getElementById('close-chart-config-modal');
    const cancelButton = document.getElementById('cancel-chart-config');
    const applyButton = document.getElementById('apply-chart-config');
    const mockDataToggle = document.getElementById('use-mock-data');
    const mockDataSettings = document.getElementById('mock-data-settings');
    
    if (mockDataToggle) {
      // Store a reference to chartConfig for this instance
      this.chartConfig = window.overviewManager?.chartConfig || {
        useMockData: false,
        mockDataRange: 'medium',
        mockDataTrend: 'random'
      };
      
      // Initial state
      const toggleSwitch = mockDataToggle.closest('.toggle-switch');
      if (toggleSwitch) {
        const dot = toggleSwitch.querySelector('.dot');
        if (dot && mockDataToggle.checked) {
          dot.classList.add('translate-x-5');
          toggleSwitch.classList.add('bg-discord-blue');
        }
      }
      
      // Handle changes
      mockDataToggle.addEventListener('change', () => {
        if (mockDataSettings) {
          if (mockDataToggle.checked) {
            mockDataSettings.classList.remove('hidden');
            
            // Update toggle visually
            const toggleSwitch = mockDataToggle.closest('.toggle-switch');
            if (toggleSwitch) {
              const dot = toggleSwitch.querySelector('.dot');
              if (dot) {
                dot.classList.add('translate-x-5');
                toggleSwitch.classList.add('bg-discord-blue');
              }
            }
          } else {
            mockDataSettings.classList.add('hidden');
            
            // Update toggle visually
            const toggleSwitch = mockDataToggle.closest('.toggle-switch');
            if (toggleSwitch) {
              const dot = toggleSwitch.querySelector('.dot');
              if (dot) {
                dot.classList.remove('translate-x-5');
                toggleSwitch.classList.remove('bg-discord-blue');
              }
            }
          }
        }
      });
    }
    
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.toggleChartConfigModal(false);
      });
    }
    
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        this.toggleChartConfigModal(false);
      });
    }
    
    if (applyButton) {
      applyButton.addEventListener('click', () => {
        this.applyChartConfig();
      });
    }
  }
  
  applyChartConfig() {
    const useMockData = document.getElementById('use-mock-data').checked;
    const mockDataRange = document.getElementById('mock-data-range').value;
    const mockDataTrend = document.getElementById('mock-data-trend').value;
    
    // Save the previous config to detect changes
    const previousConfig = { ...this.chartConfig };
    
    const config = {
      useMockData,
      mockDataRange,
      mockDataTrend
    };
    
    console.log("Applying chart config:", config);
    
    if (window.overviewManager) {
      window.overviewManager.updateChartConfig(config);
      
      // Only show toast if there was an actual change
      if (previousConfig.useMockData !== config.useMockData) {
        showToast(`Chart data source changed to ${useMockData ? 'mock data' : 'real data'}`, "success");
      } else if (config.useMockData && 
                (previousConfig.mockDataRange !== config.mockDataRange || 
                 previousConfig.mockDataTrend !== config.mockDataTrend)) {
        showToast("Mock data configuration updated", "success");
      }
    }
    
    this.toggleChartConfigModal(false);
  }
  
  toggleChartConfigModal(show = true) {
    const modal = document.getElementById('chart-config-modal');
    if (!modal) return;
    
    if (show) {
      modal.classList.remove('hidden');
      
      // Get current chart config from the overview manager
      if (window.overviewManager && window.overviewManager.chartConfig) {
        console.log("Initializing chart config modal with:", window.overviewManager.chartConfig);
        
        const { useMockData, mockDataRange, mockDataTrend } = window.overviewManager.chartConfig;
        
        // Set the checkbox state
        const mockDataCheckbox = document.getElementById('use-mock-data');
        if (mockDataCheckbox) {
          mockDataCheckbox.checked = useMockData;
        }
        
        // Set the dropdown values
        const rangeSelect = document.getElementById('mock-data-range');
        if (rangeSelect) {
          rangeSelect.value = mockDataRange || 'medium';
        }
        
        const trendSelect = document.getElementById('mock-data-trend');
        if (trendSelect) {
          trendSelect.value = mockDataTrend || 'random';
        }
        
        // Show/hide the mock data settings based on the checkbox
        const mockDataSettings = document.getElementById('mock-data-settings');
        if (mockDataSettings) {
          if (useMockData) {
            mockDataSettings.classList.remove('hidden');
          } else {
            mockDataSettings.classList.add('hidden');
          }
        }
      } else {
        console.warn("Overview manager or chart config not available");
      }
    } else {
      modal.classList.add('hidden');
    }
  }

  switchSection(section) {
    const sections = document.querySelectorAll(".admin-section");
    const sectionLinks = document.querySelectorAll("[data-section]");
    
    sections.forEach(s => {
      s.classList.add("hidden");
      s.classList.remove("active");
    });
    
    sectionLinks.forEach(link => {
      link.classList.remove("active");
    });
    
    const sectionElement = document.getElementById(`${section}-section`);
    if (!sectionElement) {
      return;
    }
    
    sectionElement.classList.remove("hidden");
    sectionElement.classList.add("active");
    
    const activeLink = document.querySelector(`[data-section="${section}"]`);
    if (activeLink) {
      activeLink.classList.add("active");
    }
    
    this.currentSection = section;
    
    // Show skeletons for the active section first
    if (section === "overview") {
      if (window.overviewManager) {
        window.overviewManager.showInitialSkeletons();
        setTimeout(() => {
          window.overviewManager.loadSystemStats();
          window.overviewManager.loadChartData();
        }, 10);
      }
    } else if (section === "users") {
      if (window.userManager) {
        window.userManager.showSkeletons();
        setTimeout(() => {
          if (window.userManager.initialized) {
            window.userManager.loadUsers();
          }
        }, 10);
      }
    } else if (section === "servers") {
      if (window.serverManager) {
        window.serverManager.showInitialSkeletons();
        setTimeout(() => {
          window.serverManager.loadServers();
          window.serverManager.loadServerStats();
        }, 10);
      }
    } else if (section === "logs") {
      this.showSkeleton("log-content");
      setTimeout(() => {
        this.loadLogs();
      }, 10);
    } else if (section === "nitro") {
      if (window.nitroManager) {
        // Check if nitroManager has a showSkeletons or showInitialSkeletons method
        if (typeof window.nitroManager.showInitialSkeletons === 'function') {
          window.nitroManager.showInitialSkeletons();
        }
        setTimeout(() => {
          window.nitroManager.loadNitroCodes();
          window.nitroManager.loadNitroStats();
        }, 10);
      }
    }
    
    history.pushState({}, "", `#${section}`);
  }

  initLogoutButton() {
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        window.location.href = "/logout";
      });
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
      case "log-content":
        return this.getLogsSkeleton();
      default:
        return '<div class="skeleton" style="height: 1.5rem; width: 3rem;"></div>';
    }
  }
  
  getLogsSkeleton() {
    let skeleton = '';
    for (let i = 0; i < 10; i++) {
      skeleton += `
        <div class="mb-2">
          <div class="skeleton" style="height: 1rem; width: ${80 + Math.random() * 20}%;"></div>
        </div>
      `;
    }
    return skeleton;
  }
  
  loadSystemStats() {
    if (window.overviewManager) {
      window.overviewManager.loadSystemStats();
    }
  }
  
  initSystemLogs() {
    const refreshLogsBtn = document.getElementById('refresh-logs');
    if (refreshLogsBtn) {
      refreshLogsBtn.addEventListener('click', () => {
        this.loadLogs();
      });
    }
  }
  
  loadLogs() {
    this.showSkeleton("log-content");
    
    fetch("/api/admin/logs")
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.renderLogs(data.data.logs);
        } else {
          showToast(data.message || "Failed to load logs", "error");
        }
      })
      .catch(error => {
        showToast("An error occurred while loading logs", "error");
      });
  }
  
  renderLogs(logs) {
    const logContent = document.getElementById('log-content');
    if (!logContent) return;
    
    if (!logs || logs.length === 0) {
      logContent.innerHTML = '<div class="text-discord-lighter">No logs found</div>';
      return;
    }
    
    let logHtml = '';
    
    logs.forEach(log => {
      const levelClass = this.getLogLevelClass(log.level);
      
      logHtml += `
        <div class="mb-2">
          <span class="${levelClass} font-semibold">[${log.level}]</span>
          <span class="text-gray-400">[${log.timestamp}]</span>
          <span>${log.message}</span>
        </div>
      `;
    });
    
    logContent.innerHTML = logHtml;
  }
  
  getLogLevelClass(level) {
    switch (level.toLowerCase()) {
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      case 'debug':
        return 'text-green-400';
      default:
        return 'text-gray-300';
    }
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

  initUserBanActions() {
    // Add event listeners for the ban and unban buttons
    document.addEventListener('click', (e) => {
      const banButton = e.target.closest('.ban-user');
      const unbanButton = e.target.closest('.unban-user');
      
      if (banButton) {
        const userId = banButton.getAttribute('data-id');
        const username = banButton.getAttribute('data-username');
        
        this.showBanConfirmation(userId, username, false);
      } else if (unbanButton) {
        const userId = unbanButton.getAttribute('data-id');
        const username = unbanButton.getAttribute('data-username');
        
        this.showBanConfirmation(userId, username, true);
      }
    });
  }
  
  showBanConfirmation(userId, username, isUnban) {
    const action = isUnban ? 'unban' : 'ban';
    const title = isUnban ? 'Unban User' : 'Ban User';
    const message = isUnban ? 
      `Are you sure you want to unban <span class="text-white font-semibold">${username}</span>? They will be able to use the app again.` : 
      `Are you sure you want to ban <span class="text-white font-semibold">${username}</span>? This will prevent them from using the app.`;
    
    this.showDiscordConfirmation(title, message, async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}/toggle-ban`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          showToast(`User ${isUnban ? 'unbanned' : 'banned'} successfully`, "success");
          // Reload the users table
          window.userManager.loadUsers();
        } else {
          showToast(data.message || `Failed to ${action} user`, "error");
        }
      } catch (error) {
        console.error(`Error ${action}ing user:`, error);
        showToast(`An error occurred while trying to ${action} the user`, "error");
      }
    });
  }
  
  showDiscordConfirmation(title, message, confirmCallback) {
    // Use existing confirm-modal if it exists
    const confirmModal = document.getElementById('confirm-modal');
    if (confirmModal) {
      const confirmTitle = document.getElementById('confirm-title');
      const confirmMessage = document.getElementById('confirm-message');
      const confirmBtn = document.getElementById('confirm-action');
      const cancelBtn = document.getElementById('cancel-confirm');
      
      confirmTitle.textContent = title;
      confirmMessage.innerHTML = message;
      
      const handleConfirm = () => {
        confirmModal.classList.add('hidden');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        confirmCallback();
      };
      
      const handleCancel = () => {
        confirmModal.classList.add('hidden');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
      };
      
      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      
      confirmModal.classList.remove('hidden');
      return;
    }
    
    // Create a new Discord-styled confirmation modal if needed
    const modal = document.createElement('div');
    modal.id = 'discord-confirm-modal';
    modal.className = 'fixed inset-0 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-70"></div>
      <div class="bg-discord-dark rounded-md w-full max-w-md p-6 relative z-10 transform transition-all">
        <div class="flex justify-between items-center mb-4">
          <h3 id="discord-confirm-title" class="text-xl font-bold text-white">${title}</h3>
          <button id="discord-confirm-close" class="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="mb-6">
          <p id="discord-confirm-message" class="text-discord-lighter">${message}</p>
        </div>
        <div class="flex justify-end space-x-3">
          <button id="discord-cancel-button" class="px-4 py-2 bg-discord-dark-secondary hover:bg-discord-dark-hover text-white rounded-md transition-colors">
            Cancel
          </button>
          <button id="discord-confirm-button" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors">
            ${isUnban ? 'Unban' : 'Ban'}
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeBtn = document.getElementById('discord-confirm-close');
    const cancelBtn = document.getElementById('discord-cancel-button');
    const confirmBtn = document.getElementById('discord-confirm-button');
    
    const cleanup = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', cleanup);
    cancelBtn.addEventListener('click', cleanup);
    confirmBtn.addEventListener('click', () => {
      cleanup();
      confirmCallback();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const isAdminPage = document.body.getAttribute("data-page") === "admin";
  
  if (isAdminPage) {
    window.adminManager = new AdminManager();
    const indicator = document.createElement("div");
    indicator.style.position = "fixed";
    indicator.style.bottom = "10px";
    indicator.style.right = "10px";
    indicator.style.padding = "5px 10px";
    indicator.style.background = "rgba(0, 0, 0, 0.5)";
    indicator.style.color = "#fff";
    indicator.style.borderRadius = "3px";
    indicator.style.fontSize = "10px";
    indicator.style.zIndex = "9999";
    indicator.textContent = "Admin Manager Active";
    document.body.appendChild(indicator);
    
    setTimeout(() => {
      indicator.style.opacity = "0";
      indicator.style.transition = "opacity 1s";
    }, 3000);
  }
});

export default AdminManager;
