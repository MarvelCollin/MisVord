import { ServerAPI } from '../api/server-api.js';
import { pageUtils } from '../utils/index.js';

document.addEventListener("DOMContentLoaded", function () {
  initServerPage();
  
  // Check for broken display and fix it
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

    // Fix for [object Object] display issue
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

// Function to fix [object Object] display issue
function fixObjectDisplay() {
  const serverId = getServerIdFromUrl();
  if (serverId) {
    console.log('Reloading server page to fix [object Object] issue');
    new ServerAPI().getServerPageHTML(serverId)
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

// Helper function to get server ID from URL
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
