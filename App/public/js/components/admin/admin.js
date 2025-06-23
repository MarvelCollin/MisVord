import { showToast } from "../../core/ui/toast.js";
import NitroManager from "./admin-nitro.js";
import ServerManager from "./admin-server.js";
import UserManager from "./admin-user.js";

class AdminManager {
  constructor() {
    this.currentSection = "overview";
    
    this.init();
  }

  init() {
    this.initSectionSwitching();
    this.initLogoutButton();
    this.initSystemLogs();
    
    // Initialize managers
    window.nitroManager = new NitroManager();
    window.serverManager = new ServerManager();
    window.userManager = new UserManager();
    
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
      this.showSkeleton("total-users");
      this.showSkeleton("online-users");
      this.showSkeleton("new-users");
      this.showSkeleton("total-servers");
      this.showSkeleton("total-messages");
      this.showSkeleton("todays-messages");
      this.loadSystemStats();
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
      case "total-users":
      case "online-users":
      case "new-users":
      case "total-servers":
      case "total-messages":
      case "todays-messages":
        return '<div class="skeleton" style="height: 1.5rem; width: 3rem;"></div>';
      case "log-content":
        return this.getLogsSkeleton();
      default:
        return '';
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
    this.showSkeleton("total-users");
    this.showSkeleton("online-users");
    this.showSkeleton("new-users");
    this.showSkeleton("total-servers");
    this.showSkeleton("total-messages");
    this.showSkeleton("todays-messages");
    
    fetch("/api/admin/stats", {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          this.updateSystemStats(data.data.stats);
        } else {
          showToast(data.message || "Failed to load system stats", "error");
        }
      })
      .catch(error => {
        showToast("An error occurred while loading system stats", "error");
      });
  }
  
  updateSystemStats(stats) {
    document.getElementById("total-users").textContent = stats.totalUsers || 0;
    document.getElementById("online-users").textContent = stats.onlineUsers || 0;
    document.getElementById("new-users").textContent = stats.newUsers || 0;
    document.getElementById("total-servers").textContent = stats.totalServers || 0;
    document.getElementById("total-messages").textContent = stats.totalMessages || 0;
    document.getElementById("todays-messages").textContent = stats.todaysMessages || 0;
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
