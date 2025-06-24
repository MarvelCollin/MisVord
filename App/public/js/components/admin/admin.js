import { showToast } from "../../core/ui/toast.js";
import NitroManager from "./admin-nitro.js";
import ServerManager from "./admin-server.js";
import UserManager from "./admin-user.js";
import OverviewManager from "./admin-overview.js";

class AdminManager {
  constructor() {
    this.currentSection = "overview";
    
    this.init();
  }

  init() {
    this.initSectionSwitching();
    this.initLogoutButton();
    this.initSystemLogs();
    this.initKeyboardShortcuts();
    this.initChartConfigModal();
    
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
      mockDataToggle.addEventListener('change', () => {
        if (mockDataToggle.checked) {
          mockDataSettings.classList.remove('hidden');
        } else {
          mockDataSettings.classList.add('hidden');
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
    
    const chartControls = document.querySelector('.chart-period-control');
    if (chartControls) {
      const configButton = document.createElement('button');
      configButton.className = 'charts-config-button';
      configButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Config <span class="keyboard-shortcut">Ctrl+0</span>
      `;
      configButton.addEventListener('click', () => {
        this.toggleChartConfigModal();
      });
      
      chartControls.appendChild(configButton);
    }
  }
  
  applyChartConfig() {
    const useMockData = document.getElementById('use-mock-data').checked;
    const mockDataRange = document.getElementById('mock-data-range').value;
    const mockDataTrend = document.getElementById('mock-data-trend').value;
    
    const config = {
      useMockData,
      mockDataRange,
      mockDataTrend
    };
    
    if (window.overviewManager) {
      window.overviewManager.updateChartConfig(config);
      showToast("Chart configuration updated", "success");
    }
    
    this.toggleChartConfigModal(false);
  }
  
  toggleChartConfigModal(show = true) {
    const modal = document.getElementById('chart-config-modal');
    if (!modal) return;
    
    if (show) {
      modal.classList.remove('hidden');
      
      if (window.overviewManager && window.overviewManager.chartConfig) {
        const { useMockData, mockDataRange, mockDataTrend } = window.overviewManager.chartConfig;
        
        document.getElementById('use-mock-data').checked = useMockData;
        document.getElementById('mock-data-range').value = mockDataRange || 'medium';
        document.getElementById('mock-data-trend').value = mockDataTrend || 'random';
        
        const mockDataSettings = document.getElementById('mock-data-settings');
        if (useMockData) {
          mockDataSettings.classList.remove('hidden');
        } else {
          mockDataSettings.classList.add('hidden');
        }
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
    
    if (section === "overview") {
      window.overviewManager.loadSystemStats();
    } else if (section === "users") {
      window.userManager.loadUsers();
      window.userManager.loadUserStats();
    } else if (section === "servers") {
      window.serverManager.loadServers();
      window.serverManager.loadServerStats();
    } else if (section === "logs") {
      this.showSkeleton("log-content");
      this.loadLogs();
    } else if (section === "nitro") {
      window.nitroManager.loadNitroCodes();
      window.nitroManager.loadNitroStats();
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
  
  // System Overview
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
