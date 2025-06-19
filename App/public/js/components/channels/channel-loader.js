import { showToast } from "../../core/ui/toast.js";
import { MisVordAjax } from "../../core/ajax/ajax-handler.js";

export class ChannelLoader {
  constructor() {
    this.init();
  }

  init() {
    document.addEventListener("DOMContentLoaded", () => {
      console.log("Channel loader initialized for dynamic updates");
      this.setupDynamicChannelLoading();
    });
  }

  setupDynamicChannelLoading() {
    // Listen for manual channel refresh events
    document.addEventListener("RefreshChannels", (event) => {
      const { serverId } = event.detail;
      this.refreshChannelsForServer(serverId);
    });

    // Listen for channel updates from websocket
    document.addEventListener("ChannelUpdated", (event) => {
      const { channel } = event.detail;
      this.updateChannelInList(channel);
    });
  }  
  async refreshChannelsForServer(serverId) {
    try {
      console.log(`Refreshing channels for server ${serverId}`);

      const response = await MisVordAjax.get(
        `/api/servers/${serverId}/channels`
      );

      if (response && response.success) {
        const container = document.querySelector('.channel-list-container');
        if (container) {
          this.renderChannels(container, response.data);
          console.log(`Channels refreshed for server ${serverId}`);
        }
      } else {
        console.error(
          "Failed to refresh channels:",
          response?.message || "Unknown error"
        );
        showToast("Failed to refresh channels", "error");
      }
    } catch (error) {
      console.error("Error refreshing channels:", error);
      showToast("Error refreshing channels", "error");
    }
  }

  updateChannelInList(channel) {
    const channelElement = document.querySelector(`[data-channel-id="${channel.id}"]`);
    if (channelElement) {
      const nameElement = channelElement.querySelector('.channel-name');
      if (nameElement) {
        nameElement.textContent = channel.name;
      }
    }
  }

  renderChannels(container, data) {
    if (!data || !data.categories || data.categories.length === 0) {
      container.innerHTML =
        '<div class="text-gray-400 text-center p-4">No channels found</div>';
      return;
    }

    let html = "";

    data.categories.forEach((category) => {
      html += this.renderCategory(category);
    });

    container.innerHTML = html;

    this.setupChannelEvents(container);
  }
  renderCategory(category) {
    let channels = "";

    if (category.channels && category.channels.length > 0) {
      category.channels.forEach((channel) => {
        channels += this.renderChannel(channel);
      });
    }

    return `
      <div class="category-item my-4" data-category-id="${category.id}">
        <div class="category-header flex items-center justify-between text-gray-400 hover:text-gray-300 mb-1 px-1 py-1 rounded cursor-pointer">
          <div class="flex items-center">
            <span class="drag-handle mr-1 opacity-40 hover:opacity-100"><i class="fas fa-grip-lines fa-xs"></i></span>
            <i class="fas fa-chevron-down text-xs mr-1"></i>
            <span class="font-semibold uppercase text-xs">${category.name}</span>
          </div>
          <div class="flex items-center space-x-1 text-gray-500">
            <button class="hover:text-gray-300 text-xs" onclick="showAddChannelToCategory(${category.id})">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
        <div class="category-channels pl-2">
          ${channels}
        </div>
      </div>
    `;
  }  renderChannel(channel) {
    const isActive = window.location.search.includes(`channel=${channel.id}`);
    
    return `
      <div class="channel-item flex items-center justify-between py-1 px-2 rounded text-gray-400 hover:text-gray-300 hover:bg-discord-lighten ${isActive ? 'bg-discord-lighten text-white' : ''}" 
           data-channel-id="${channel.id}" 
           data-channel-type="${channel.type}">
        <div class="flex items-center w-full">
          <span class="drag-handle mr-1 opacity-0 hover:opacity-50"><i class="fas fa-grip-lines fa-xs"></i></span>
          <span class="channel-name text-sm truncate">${channel.name}</span>
          <div class="ml-auto flex items-center">
            ${channel.is_private ? '<i class="fas fa-lock text-xs mr-2" title="Private channel"></i>' : ''}
            ${channel.type === 'voice' ? '<span class="text-xs text-gray-500">0/99</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }
  setupChannelEvents(container) {
    // Category toggle functionality
    const categories = container.querySelectorAll(".category-header");
    categories.forEach((header) => {
      header.addEventListener("click", (e) => {
        if (!e.target.matches("[data-action], button, i.fa-plus")) {
          const category = header.parentElement;
          const channels = category.querySelector(".category-channels");
          const icon = header.querySelector(
            "i.fa-chevron-down, i.fa-chevron-right"
          );

          if (channels && icon) {
            channels.classList.toggle("hidden");

            if (channels.classList.contains("hidden")) {
              icon.classList.remove("fa-chevron-down");
              icon.classList.add("fa-chevron-right");
            } else {
              icon.classList.remove("fa-chevron-right");
              icon.classList.add("fa-chevron-down");
            }
          }
        }
      });
    });

    // Channel navigation functionality
    const channelItems = container.querySelectorAll(".channel-item");
    channelItems.forEach((item) => {
      item.addEventListener("click", () => {
        const channelId = item.getAttribute("data-channel-id");
        const channelType = item.getAttribute("data-channel-type");

        console.log(`Channel clicked: ${channelId} (${channelType})`);

        if (channelType === 'text') {
          const serverId = document.querySelector('#current-server-id')?.value;
          if (serverId) {
            window.location.href = `/server/${serverId}?channel=${channelId}`;
          }
        }

        document.dispatchEvent(
          new CustomEvent("ChannelSelected", {
            detail: {
              channelId,
              channelType,
            },
          })
        );
      });
    });
  }
}

export const channelLoader = new ChannelLoader();

if (typeof window !== "undefined") {
  window.ChannelLoader = ChannelLoader;
  window.channelLoader = channelLoader;
}
