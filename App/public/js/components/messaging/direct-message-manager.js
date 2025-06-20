class DirectMessageManager {
  constructor() {
    this.modal = document.getElementById("new-direct-modal");
    this.searchInput = document.getElementById("dm-search-input");
    this.friendsList = document.getElementById("dm-friends-list");
    this.noFriendsMessage = document.getElementById("no-dm-friends");
    this.createButton = document.getElementById("create-new-direct");
    this.cancelButton = document.getElementById("cancel-new-direct");
    this.closeButton = document.getElementById("close-new-direct-modal");    this.selectedFriend = null;
    this.friends = [];

    this.chatAPI = null;
    this.friendAPI = null;

    this.waitForAPIs();

    this.init();
  }

  init() {
    this.closeButton?.addEventListener("click", () => this.hideModal());
    this.cancelButton?.addEventListener("click", () => this.hideModal());
    this.createButton?.addEventListener("click", () =>
      this.createDirectMessage()
    );
    this.searchInput?.addEventListener("input", (e) =>
      this.filterFriends(e.target.value)
    );

    document.addEventListener("click", (e) => {
      if (e.target.closest(".add-direct-message")) {
        e.preventDefault();
        this.showModal();
      }
    });

    this.modal?.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.hideModal();
      }
    });
  }

  async showModal() {
    try {
      await this.loadFriends();
      this.modal?.classList.remove("hidden");
      this.searchInput?.focus();
    } catch (error) {
      console.error("Failed to load friends:", error);
      this.showError("Failed to load friends list");
    }
  }

  hideModal() {
    this.modal?.classList.add("hidden");
    this.resetModal();
  }

  resetModal() {
    this.selectedFriend = null;
    this.searchInput.value = "";
    this.updateCreateButton();
    this.renderFriends();
  }
  async loadFriends() {
    try {
      if (!this.friendAPI && window.FriendAPI) {
        this.friendAPI = window.FriendAPI;
      }
      
      if (!this.friendAPI) {
        console.error("FriendAPI not available");
        this.friends = [];
        this.renderFriends();
        return;
      }
      
      const response = await this.friendAPI.getUserFriends();
      this.friends = response.friends || [];
      this.renderFriends();
    } catch (error) {
      console.error("Error loading friends:", error);
      this.friends = [];
      this.renderFriends();
    }
  }

  filterFriends(searchTerm) {
    const filtered = this.friends.filter((friend) =>
      friend.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.renderFriends(filtered);
  }

  renderFriends(friendsToRender = null) {
    const friends = friendsToRender || this.friends;

    if (friends.length === 0) {
      this.friendsList.innerHTML = "";
      this.noFriendsMessage?.classList.remove("hidden");
      return;
    }

    this.noFriendsMessage?.classList.add("hidden");

    this.friendsList.innerHTML = friends
      .map(
        (friend) => `
            <div class="friend-item flex items-center p-2 rounded hover:bg-discord-dark cursor-pointer transition-colors" 
                 data-friend-id="${friend.id}" data-friend-username="${
          friend.username
        }">
                <div class="w-8 h-8 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center overflow-hidden mr-3">
                    <img src="${
                      friend.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        friend.username
                      )}&background=random`
                    }" 
                         alt="Avatar" class="w-full h-full object-cover">
                </div>
                <div class="flex-1">
                    <div class="text-white font-medium">${this.escapeHtml(
                      friend.username
                    )}</div>
                    ${
                      friend.discriminator
                        ? `<div class="text-gray-400 text-xs">#${friend.discriminator}</div>`
                        : ""
                    }
                </div>
                <div class="friend-select-indicator w-4 h-4 rounded-full border-2 border-gray-400 flex-shrink-0"></div>
            </div>
        `
      )
      .join("");

    this.friendsList.querySelectorAll(".friend-item").forEach((item) => {
      item.addEventListener("click", () => this.selectFriend(item));
    });
  }

  selectFriend(friendElement) {
    this.friendsList.querySelectorAll(".friend-item").forEach((item) => {
      item.classList.remove("bg-discord-primary");
      const indicator = item.querySelector(".friend-select-indicator");
      indicator.classList.remove(
        "bg-discord-primary",
        "border-discord-primary"
      );
      indicator.classList.add("border-gray-400");
    });

    friendElement.classList.add("bg-discord-primary");
    const indicator = friendElement.querySelector(".friend-select-indicator");
    indicator.classList.remove("border-gray-400");
    indicator.classList.add("bg-discord-primary", "border-discord-primary");

    this.selectedFriend = {
      id: friendElement.dataset.friendId,
      username: friendElement.dataset.friendUsername,
    };

    this.updateCreateButton();
  }

  updateCreateButton() {
    if (this.selectedFriend) {
      this.createButton.disabled = false;
      this.createButton.classList.remove("opacity-50", "cursor-not-allowed");
    } else {
      this.createButton.disabled = true;
      this.createButton.classList.add("opacity-50", "cursor-not-allowed");
    }
  }
  async createDirectMessage() {
    if (!this.selectedFriend) return;

    try {
      this.createButton.disabled = true;
      this.createButton.textContent = "Creating...";
      // Use unified chat manager if available
      if (window.unifiedChatManager) {
        const chatRoom = await window.unifiedChatManager.createDirectMessage(
          this.selectedFriend.id
        );
        if (chatRoom) {
          this.hideModal();
          return;
        }
      }

      // Fallback to direct API call
      if (!this.chatAPI && window.ChatAPI) {
        this.chatAPI = window.ChatAPI;
      }

      if (!this.chatAPI) {
        throw new Error("ChatAPI not available");
      }

      const response = await this.chatAPI.createDirectMessage(
        this.selectedFriend.id
      );

      if (response.success) {
        const chatRoom = response.chatRoom || response.chat_room;

        this.hideModal();

        // Switch to the new direct message using unified chat manager or messaging system
        if (window.unifiedChatManager) {
          await window.unifiedChatManager.switchToChat(chatRoom.id, "direct");
        } else if (
          window.MisVordMessaging &&
          window.MisVordMessaging.switchToChat
        ) {
          await window.MisVordMessaging.switchToChat(chatRoom.id, "direct");
        } else {
          // Fallback to page redirect
          window.location.href = `/app?dm=${chatRoom.id}`;
        }
      } else {
        throw new Error(
          response.message ||
            response.error ||
            "Failed to create direct message"
        );
      }
    } catch (error) {
      console.error("Error creating direct message:", error);
      this.showError(error.message || "Failed to create direct message");
    } finally {
      this.createButton.disabled = false;
      this.createButton.textContent = "Create Message";
    }
  }

  showError(message) {
    const toast = document.createElement("div");
    toast.className =
      "fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  waitForAPIs() {
    if (window.ChatAPI && window.FriendAPI) {
      this.chatAPI = window.ChatAPI;
      this.friendAPI = window.FriendAPI;
    } else {
      setTimeout(() => this.waitForAPIs(), 100);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.directMessageManager = new DirectMessageManager();
});
