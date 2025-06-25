import { showToast } from "../../core/ui/toast.js";

export class ChannelLoader {
  constructor() {
    this.channelData = null;
    this.init();
  }

  init() {
    this.hasInitialized = false;

    document.addEventListener("DOMContentLoaded", () => {
      console.log("Channel loader initialized for dynamic updates");
      this.setupDynamicChannelLoading();

      if (window.location.pathname.includes("/server/")) {
        if (document.body.hasAttribute("data-initial-load")) {
          console.log(
            "Using server-rendered channels, skipping initial channel fetch"
          );

          const container = document.querySelector(".channel-list-container");
          if (container) {
            this.setupChannelEvents(container);
          }

          this.hasInitialized = true;
        } else {
          const serverId = window.location.pathname
            .split("/server/")[1]
            .split("/")[0];

          if (serverId && !this.hasInitialized) {
            this.refreshChannelsForServer(serverId);
            this.hasInitialized = true;
          }
        }
      }
    });

    window.addEventListener("beforeunload", () => {
      if (this.channelData) {
        sessionStorage.setItem("channelData", JSON.stringify(this.channelData));
      }
    });

    const cachedChannels = sessionStorage.getItem("channelData");
    if (cachedChannels && !document.body.hasAttribute("data-initial-load")) {
      try {
        this.channelData = JSON.parse(cachedChannels);

        if (window.location.pathname.includes("/server/")) {
          setTimeout(() => {
            const container = document.querySelector(".channel-list-container");
            if (container) {
              this.renderChannels(container, this.channelData);
            }
          }, 100);
        }
      } catch (e) {
        console.error("Error parsing cached channels", e);
        sessionStorage.removeItem("channelData");
      }
    }
  }

  setupDynamicChannelLoading() {
    document.addEventListener("RefreshChannels", (event) => {
      const { serverId } = event.detail;
      this.refreshChannelsForServer(serverId);
    });

    document.addEventListener("ChannelUpdated", (event) => {
      const { channel } = event.detail;
      this.updateChannelInList(channel);
    });
  }
  
  async refreshChannelsForServer(serverId) {
    try {
      console.log(`Refreshing channels for server ${serverId}`);

      const container = document.querySelector(".channel-list-container");
      const originalHtml = container ? container.innerHTML : "";

      const skipApiCall = document.body.hasAttribute("data-initial-load");
      if (skipApiCall) {
        console.log("Using pre-rendered channel content for initial load");
        document.body.removeAttribute("data-initial-load");

        if (container) {
          this.setupChannelEvents(container);
        }
        return;
      }

      try {
        const response = await fetch(`/api/servers/${serverId}/channels`, {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data && data.success) {
          if (container) {
            this.renderChannels(container, data.data);
            console.log(`Channels refreshed for server ${serverId}`);
          }
        } else {
          console.error("Failed to refresh channels:", data?.message || "Unknown error");

          if (originalHtml && originalHtml.indexOf("No channels found") === -1) {
            console.log("Keeping existing channel content due to API error");
            return;
          }

          if (response.status !== 401) {
            showToast("Failed to refresh channels", "error");
          }
        }
      } catch (error) {
        console.error("Error refreshing channels:", error);
        
        if (error.name !== "AbortError") {
          showToast("Error refreshing channels", "error");
        }
      }
    } catch (error) {
      console.error("Error in refreshChannelsForServer:", error);
    }
  }

  updateChannelInList(channel) {
    const channelElement = document.querySelector(
      `[data-channel-id="${channel.id}"]`
    );
    if (channelElement) {
      const nameElement = channelElement.querySelector(".channel-name");
      if (nameElement) {
        nameElement.textContent = channel.name;
      }
    }
  }

  renderChannels(container, data) {
    if (!data) {
      container.innerHTML =
        '<div class="text-gray-400 text-center p-4">No channels found</div>';
      return;
    }

    this.channelData = data;
    let html = "";

    if (data.categoryStructure && data.categoryStructure.length > 0) {
      data.categoryStructure.forEach((category) => {
        html += this.renderCategory(category);
      });

      if (data.uncategorized && data.uncategorized.length > 0) {
        html += this.renderUncategorizedChannels(data.uncategorized);
      }
    } else if (data.categories && data.categories.length > 0) {
      data.categories.forEach((category) => {
        const categoryChannels = data.channels.filter(
          (ch) => ch.category_id === category.id
        );

        html += this.renderCategory({
          id: category.id,
          name: category.name,
          channels: categoryChannels,
        });
      });

      const uncategorized = data.channels.filter(
        (ch) => !ch.category_id || ch.category_id === null
      );

      if (uncategorized.length > 0) {
        html += this.renderUncategorizedChannels(uncategorized);
      }
    } else if (data.channels && data.channels.length > 0) {
      html = this.renderUncategorizedChannels(data.channels);
    } else {
      html =
        '<div class="text-gray-400 text-center p-4">No channels found</div>';
    }

    container.innerHTML = html;
    console.log("Channel rendering complete, setting up events");
    this.setupChannelEvents(container);
  }

  renderUncategorizedChannels(channels) {
    if (!channels || channels.length === 0) return "";

    const textChannels = channels.filter(
      (ch) => ch.type === "text" || ch.type === 1 || ch.type_name === "text"
    );

    const voiceChannels = channels.filter(
      (ch) => ch.type === "voice" || ch.type === 2 || ch.type_name === "voice"
    );

    let html = "";

    if (textChannels.length > 0) {
      html += `
        <div class="my-4">
          <div class="text-gray-400 flex items-center justify-between mb-1 px-1">
            <div class="font-semibold uppercase text-xs">Text Channels</div>
            <button class="text-xs hover:text-gray-300" onclick="openCreateChannelModal('text')">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <div class="uncategorized-channels pl-2">
            ${textChannels
              .map((channel) => this.renderChannel(channel))
              .join("")}
          </div>
        </div>
      `;
    }

    if (voiceChannels.length > 0) {
      html += `
        <div class="my-4">
          <div class="text-gray-400 flex items-center justify-between mb-1 px-1">
            <div class="font-semibold uppercase text-xs">Voice Channels</div>
            <button class="text-xs hover:text-gray-300" onclick="openCreateChannelModal('voice')">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <div class="voice-channels pl-2">
            ${voiceChannels
              .map((channel) => this.renderChannel(channel))
              .join("")}
          </div>
        </div>
      `;
    }

    return html;
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
  }
  
  renderChannel(channel) {
    const isActive = window.location.search.includes(`channel=${channel.id}`);

    return `
      <div class="channel-item flex items-center justify-between py-1 px-2 rounded text-gray-400 hover:text-gray-300 hover:bg-discord-lighten ${
        isActive ? "bg-discord-lighten text-white" : ""
      }" 
           data-channel-id="${channel.id}" 
           data-channel-type="${channel.type}">
        <div class="flex items-center w-full">
          <span class="drag-handle mr-1 opacity-0 hover:opacity-50"><i class="fas fa-grip-lines fa-xs"></i></span>
          <span class="channel-name text-sm truncate">${channel.name}</span>
          <div class="ml-auto flex items-center">
            ${
              channel.is_private
                ? '<i class="fas fa-lock text-xs mr-2" title="Private channel"></i>'
                : ""
            }
            ${
              channel.type === "voice"
                ? '<span class="text-xs text-gray-500">0/99</span>'
                : ""
            }
          </div>
        </div>
      </div>
    `;
  }
  
  setupChannelEvents(container) {
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

    const channelItems = container.querySelectorAll(".channel-item");
    channelItems.forEach((item) => {
      item.addEventListener("click", () => {
        const channelId = item.getAttribute("data-channel-id");
        const channelType = item.getAttribute("data-channel-type");

        console.log(`Channel clicked: ${channelId} (${channelType})`);

        if (channelType === "text") {
          const serverId = document.querySelector("#current-server-id")?.value;
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
