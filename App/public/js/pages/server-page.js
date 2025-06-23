import serverAPI from '../api/server-api.js';
import { pageUtils } from '../utils/index.js';

document.addEventListener("DOMContentLoaded", function () {
  initServerPage();
  
  const mainContent = document.querySelector('.flex-1');
  if (mainContent && mainContent.textContent.trim() === '[object Object]') {
    fixObjectDisplay();
  }
  
  window.addEventListener('popstate', function(event) {
    if (window.location.pathname.includes('/server/')) {
      const serverId = getServerIdFromUrl();
      if (serverId) {
        handleSkeletonLoading(true);
        serverAPI.getServerPageHTML(serverId)
          .then(html => {
            if (typeof html === 'string') {
              const mainContent = document.querySelector('.flex-1');
              if (mainContent) {
                pageUtils.updatePageContent(mainContent, html);
              }
            }
            handleSkeletonLoading(false);
          })
          .catch(err => {
            console.error('Failed to load server page:', err);
            handleSkeletonLoading(false);
          });
      }
    }
  });
});

function initServerPage() {
  console.log("Server page initialized");

  const path = window.location.pathname;
  const matches = path.match(/\/server\/(\d+)/);

  if (
    !document.body.hasAttribute("data-initial-load") &&
    matches &&
    matches[1]
  ) {
    const serverId = matches[1];
    console.log(`Loading server page for server ID: ${serverId}`);

    const objectDisplay = document.querySelector('.server-content');
    if (objectDisplay && objectDisplay.textContent.includes('[object Object]')) {
      console.log('Fixing [object Object] display issue');
      fixObjectDisplay();
      return;
    }

    document.dispatchEvent(
      new CustomEvent("RefreshChannels", {
        detail: {
          serverId: serverId,
        },
      })
    );
  } else if (document.body.hasAttribute("data-initial-load")) {
    console.log("Using server-rendered channels, skipping refresh event");
  }

  initializeChannelClickHandlers();
}

function fixObjectDisplay() {
  const serverId = getServerIdFromUrl();
  if (serverId) {
    console.log('Reloading server page to fix [object Object] issue');
    serverAPI.getServerPageHTML(serverId)
      .then(html => {
        const mainContent = document.querySelector('.flex-1');
        if (mainContent && html) {
          pageUtils.updatePageContent(mainContent, html);
        } else {
          window.location.reload();
        }
      })
      .catch(err => {
        console.error('Failed to fix display issue:', err);
        window.location.reload();
      });
  } else {
    window.location.reload();
  }
}

function getServerIdFromUrl() {
  const path = window.location.pathname;
  const matches = path.match(/\/server\/(\d+)/);
  return matches && matches[1] ? matches[1] : null;
}

function initializeChannelClickHandlers() {
  const channelItems = document.querySelectorAll(".channel-item");
  const currentServerId = document
    .querySelector('meta[name="server-id"]')
    ?.getAttribute("content");

  channelItems.forEach((item) => {
    item.addEventListener("click", function () {
      const channelId = this.getAttribute("data-channel-id");
      const channelType = this.getAttribute("data-channel-type") || "text";

      if (!channelId || !currentServerId) return;

      let newUrl = `/server/${currentServerId}?channel=${channelId}`;
      if (channelType === 'voice') {
        newUrl += '&type=voice';
      }
      window.location.href = newUrl;
    });
  });
}

function initializeServerModals() {
  const createServerBtn = document.querySelector(
    '[data-action="create-server"]'
  );
  const modal = document.getElementById("create-server-modal");
  const closeBtn = document.getElementById("close-server-modal");

  if (createServerBtn && modal) {
    createServerBtn.addEventListener("click", function (e) {
      e.preventDefault();
      modal.classList.remove("hidden");
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", function () {
      modal.classList.add("hidden");
    });
  }

  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  }
}

function renderMemberItem(member) {
    const statusClass = getStatusClass(member.status || 'offline');
    
    return `
        <div class="member-item flex items-center p-2 rounded hover:bg-discord-light cursor-pointer">
            <div class="relative mr-3">
                <div class="w-8 h-8 rounded-full bg-discord-light overflow-hidden user-profile-trigger" data-user-id="${member.id}" data-server-id="${getCurrentServerId()}">
                    <img src="${member.avatar_url || '/assets/default-avatar.svg'}" alt="${member.username}" class="w-full h-full object-cover">
                </div>
                <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark ${statusClass}"></span>
            </div>
            <div>
                <div class="text-sm font-medium ${member.role === 'owner' ? 'text-yellow-300' : member.role === 'admin' ? 'text-red-400' : 'text-white'}">${member.username}</div>
                <div class="text-xs text-discord-lighter">${member.status || 'offline'}</div>
            </div>
        </div>
    `;
}

function handleSkeletonLoading(show) {
  const mainContent = document.querySelector('.flex-1');
  
  if (!mainContent) return;
  
  if (show) {
    const skeletonTemplate = `
      <div class="skeleton-loader server-page-skeleton flex h-full">
        <div class="channel-list-skeleton w-60 bg-discord-dark border-r border-discord-600 flex-shrink-0 p-4">
          <div class="flex items-center justify-between mb-6">
            <div class="h-6 bg-gray-700 rounded w-32 animate-pulse"></div>
            <div class="h-6 w-6 bg-gray-700 rounded-full animate-pulse"></div>
          </div>
          
          <div class="mb-4">
            <div class="h-5 bg-gray-700 rounded w-24 mb-3 animate-pulse"></div>
            ${Array(3).fill().map(() => `
              <div class="flex items-center py-1 mb-2">
                <div class="h-4 w-4 bg-gray-700 rounded-sm mr-2 animate-pulse"></div>
                <div class="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
              </div>
            `).join('')}
          </div>
          
          <div class="mb-6">
            <div class="h-5 bg-gray-700 rounded w-28 mb-3 animate-pulse"></div>
            ${Array(5).fill().map(() => `
              <div class="flex items-center py-1 mb-2">
                <div class="h-4 w-4 bg-gray-700 rounded-sm mr-2 animate-pulse"></div>
                <div class="h-4 bg-gray-700 rounded w-36 animate-pulse"></div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="chat-skeleton flex-grow bg-discord-background flex flex-col">
          <div class="h-12 border-b border-discord-600 px-4 flex items-center">
            <div class="h-5 bg-gray-700 rounded w-32 animate-pulse"></div>
            <div class="ml-auto flex space-x-4">
              ${Array(3).fill().map(() => `
                <div class="h-6 w-6 bg-gray-700 rounded-full animate-pulse"></div>
              `).join('')}
            </div>
          </div>
          
          <div class="flex-grow p-4 overflow-y-auto">
            ${Array(8).fill().map(() => `
              <div class="flex mb-6">
                <div class="h-10 w-10 bg-gray-700 rounded-full mr-3 flex-shrink-0 animate-pulse"></div>
                <div class="flex-grow">
                  <div class="flex items-center mb-1">
                    <div class="h-4 bg-gray-700 rounded w-24 mr-2 animate-pulse"></div>
                    <div class="h-3 bg-gray-700 rounded w-16 animate-pulse opacity-75"></div>
                  </div>
                  <div class="h-4 bg-gray-700 rounded w-full mb-1 animate-pulse"></div>
                  <div class="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="p-4 border-t border-discord-600">
            <div class="h-10 bg-gray-700 rounded-lg w-full animate-pulse"></div>
          </div>
        </div>
        
        <div class="participant-list-skeleton w-60 bg-discord-dark border-l border-discord-600 flex-shrink-0 p-4">
          <div class="h-5 bg-gray-700 rounded w-32 mb-4 animate-pulse"></div>
          
          <div class="mb-6">
            <div class="h-4 bg-gray-700 rounded w-20 mb-3 animate-pulse opacity-75"></div>
            ${Array(5).fill().map(() => `
              <div class="flex items-center py-1 mb-2">
                <div class="h-8 w-8 bg-gray-700 rounded-full mr-2 animate-pulse"></div>
                <div class="h-4 bg-gray-700 rounded w-24 animate-pulse"></div>
              </div>
            `).join('')}
          </div>
          
          <div>
            <div class="h-4 bg-gray-700 rounded w-20 mb-3 animate-pulse opacity-75"></div>
            ${Array(3).fill().map(() => `
              <div class="flex items-center py-1 mb-2">
                <div class="h-8 w-8 bg-gray-700 rounded-full mr-2 animate-pulse opacity-50"></div>
                <div class="h-4 bg-gray-700 rounded w-24 animate-pulse opacity-50"></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    mainContent.innerHTML = skeletonTemplate;
    mainContent.classList.add('loading');
  } else {
    mainContent.classList.remove('loading');
  }
}

window.handleSkeletonLoading = handleSkeletonLoading;
