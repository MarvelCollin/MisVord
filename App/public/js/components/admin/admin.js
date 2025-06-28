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
    this.initUserBanActions();
    this.initHashChange();
    
    if (!window.nitroManager) {
      window.nitroManager = new NitroManager();
    }

    if (!window.serverManager) {
      window.serverManager = new ServerManager();
    }

    if (!window.userManager) {
      window.userManager = new UserManager();
    }

    if (!window.overviewManager) {
      window.overviewManager = new OverviewManager();
    }
    
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

  initHashChange() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.substring(1);
      if (hash && hash !== this.currentSection) {
        this.switchSection(hash);
      } else if (!hash && this.currentSection !== 'overview') {
        this.switchSection('overview');
      }
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
        window.serverManager.showSkeletons();
        setTimeout(() => {
          window.serverManager.loadServers();
          window.serverManager.loadServerStats();
        }, 10);
      }
    } else if (section === "nitro") {
      if (window.nitroManager) {
        if (typeof window.nitroManager.showInitialSkeletons === 'function') {
          window.nitroManager.showInitialSkeletons();
        }
        setTimeout(() => {
          window.nitroManager.loadNitroCodes();
          window.nitroManager.loadNitroStats();
        }, 10);
      }
    }
    
    if (section === "overview") {
      history.pushState({}, "", window.location.pathname);
    } else {
      history.pushState({}, "", `#${section}`);
    }
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
      default:
        return '<div class="skeleton" style="height: 1.5rem; width: 3rem;"></div>';
    }
  }
  
  loadSystemStats() {
    if (window.overviewManager) {
      window.overviewManager.loadSystemStats();
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
    
  }
  
  showDiscordConfirmation(title, message, confirmCallback) {
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
    
    const modal = document.createElement('div');
    modal.id = 'discord-confirm-modal';
    modal.className = 'fixed inset-0 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-70"></div>
      <div class="bg-discord-dark rounded-md w-full max-w-md p-6 relative z-10 transform transition-all">
        <div class="flex justify-between items-center mb-4">
          <h3 id="discord-confirm-title" class="text-xl font-bold text-white">${title}</h3>
          <button id="discord-confirm-close" class="text-gray-400 hover:text-white">
            <i class="fas fa-times h-6 w-6"></i>
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
