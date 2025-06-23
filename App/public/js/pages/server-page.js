import serverAPI from '../api/server-api.js';
import { pageUtils } from '../utils/index.js';

document.addEventListener("DOMContentLoaded", function () {
  initServerPage();
  
  const mainContent = document.querySelector('.flex-1');
  if (mainContent && mainContent.textContent.trim() === '[object Object]') {
    fixObjectDisplay();
  }
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
