class FormHandler {
  constructor(messaging) {
    this.messaging = messaging;
    this.messageForm = null;
    this.messageInput = null;
    this.submitButton = null;
  }

  initMessageForm() {
    this.messageForm = document.getElementById("message-form");
    this.messageInput = document.getElementById("message-input");
    this.submitButton = document.querySelector(
      '#message-form button[type="submit"]'
    );

    if (!this.messageForm || !this.messageInput) {
      this.messaging.debugUtils.log(
        "⚠️ Message form elements not found - this is normal for pages without active chats"
      );
      return;
    }

    this.messaging.debugUtils.log("📝 Setting up message form...");

    this.setupFormSubmission();
    this.setupInputEvents();
    this.setupFileUpload();

    this.messaging.debugUtils.log("✅ Message form initialized");
  }

  setupFormSubmission() {
    if (!this.messageForm) return;

    this.messageForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleFormSubmit();
    });

    if (this.submitButton) {
      this.submitButton.addEventListener("click", async (e) => {
        e.preventDefault();
        await this.handleFormSubmit();
      });
    }
  }
  setupInputEvents() {
    if (!this.messageInput) return;

    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleFormSubmit();
      }
    });

    this.messageInput.addEventListener("paste", (e) => {
      this.handlePaste(e);
    });

    this.messageInput.addEventListener("focus", () => {
      this.messaging.debugUtils.log("📝 Message input focused");
    });

    this.messageInput.addEventListener("blur", () => {
      this.messaging.debugUtils.log("📝 Message input blurred");
      const chatType = this.messageInput.getAttribute("data-chat-type");
      const chatId = this.messageInput.getAttribute("data-chat-id");
      if (chatType && chatId) {
        this.messaging.stopTyping(chatType, chatId);
      }
    });

    this.messageInput.addEventListener("input", () => {
      const chatType = this.messageInput.getAttribute("data-chat-type");
      const chatId = this.messageInput.getAttribute("data-chat-id");
      if (chatType && chatId && this.messageInput.value.trim()) {
        this.messaging.startTyping(chatType, chatId);
      } else if (chatType && chatId && !this.messageInput.value.trim()) {
        this.messaging.stopTyping(chatType, chatId);
      }
    });

    this.messageInput.addEventListener("keyup", (e) => {
      if (e.key === "Escape") {
        const chatType = this.messageInput.getAttribute("data-chat-type");
        const chatId = this.messageInput.getAttribute("data-chat-id");
        if (chatType && chatId) {
          this.messaging.stopTyping(chatType, chatId);
        }
      }
    });
  }

  setupFileUpload() {
    const fileInput = document.getElementById("file-input");
    const fileButton = document.getElementById("file-upload-button");

    if (fileInput && fileButton) {
      fileButton.addEventListener("click", () => {
        fileInput.click();
      });

      fileInput.addEventListener("change", (e) => {
        this.handleFileSelection(e);
      });
    }
  }
  async handleFormSubmit() {
    if (!this.messageInput) {
      this.messaging.debugUtils.error(
        "❌ Cannot submit: message input not found"
      );
      return;
    }

    const content = this.messageInput.value.trim();
    if (!content) {
      this.messaging.debugUtils.log("⚠️ Empty message, not sending");
      return;
    }

    const chatId = this.getCurrentChatId();
    const chatType = this.messaging.chatType;

    if (!chatId || !chatType) {
      this.messaging.debugUtils.error("❌ Cannot send message: no active chat");
      return;
    }

    // Create temporary message for instant feedback
    let tempMessageElement = null;

    try {
      this.setFormState(true);

      // Show temporary message immediately
      tempMessageElement = this.messaging.messageHandler.createTemporaryMessage(
        content,
        chatType,
        chatId
      );

      // Clear input immediately for better UX
      const originalContent = content;
      this.messageInput.value = "";

      // Send the message
      await this.messaging.messageHandler.sendMessage(
        chatType,
        chatId,
        originalContent
      );

      // Remove temporary message on success
      if (tempMessageElement) {
        this.messaging.messageHandler.removeTemporaryMessage(
          tempMessageElement
        );
      }

      this.messageInput.focus();
      this.messaging.typingManager.stopTyping(chatType, chatId);
    } catch (error) {
      this.messaging.debugUtils.error("❌ Failed to send message:", error);

      // Remove temporary message and restore input on error
      if (tempMessageElement) {
        this.messaging.messageHandler.removeTemporaryMessage(
          tempMessageElement
        );
      }

      // Restore message content on error
      if (this.messageInput.value === "") {
        this.messageInput.value = content;
      }
    } finally {
      this.setFormState(false);
    }
  }

  async handlePaste(e) {
    const items = e.clipboardData.items;
    const files = [];

    for (let item of items) {
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      await this.handleFiles(files);
    }
  }

  async handleFileSelection(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      await this.handleFiles(files);
    }

    e.target.value = "";
  }

  async handleFiles(files) {
    if (!files || files.length === 0) return;

    const chatId = this.getCurrentChatId();
    const chatType = this.messaging.chatType;

    if (!chatId || !chatType) {
      this.messaging.debugUtils.error("❌ Cannot upload files: no active chat");
      return;
    }

    try {
      this.setFormState(true);

      const attachments = await this.uploadFiles(files);

      if (attachments.length > 0) {
        const messageData = {
          content: this.messageInput ? this.messageInput.value.trim() : "",
          messageType: "attachment",
          attachments: attachments,
        };

        await this.messaging.messageHandler.sendRichMessage(
          chatType,
          chatId,
          messageData
        );

        if (this.messageInput) {
          this.messageInput.value = "";
          this.messageInput.focus();
        }
      }
    } catch (error) {
      this.messaging.debugUtils.error("❌ Failed to upload files:", error);
    } finally {
      this.setFormState(false);
    }
  }

  async uploadFiles(files) {
    const attachments = [];

    for (let file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            attachments.push({
              name: file.name,
              url: result.data.url,
              type: file.type.startsWith("image/") ? "image" : "file",
              size: file.size,
            });
          }
        } else {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
      } catch (error) {
        this.messaging.debugUtils.error(
          "❌ Failed to upload file:",
          file.name,
          error
        );
      }
    }

    return attachments;
  }
  setFormState(disabled) {
    const formContainer = this.messageForm;

    if (this.messageInput) {
      this.messageInput.disabled = disabled;
      if (disabled) {
        this.messageInput.classList.add("opacity-70");
      } else {
        this.messageInput.classList.remove("opacity-70");
      }
    }

    if (this.submitButton) {
      this.submitButton.disabled = disabled;
      if (disabled) {
        this.submitButton.classList.add("sending");
        this.submitButton.innerHTML =
          '<span class="animate-spin">⟳</span> Sending...';
      } else {
        this.submitButton.classList.remove("sending");
        this.submitButton.innerHTML = "Send";
      }
    }

    // Add loading class to form container
    if (formContainer) {
      if (disabled) {
        formContainer.classList.add("form-loading");
      } else {
        formContainer.classList.remove("form-loading");
      }
    }
  }

  getCurrentChatId() {
    return this.messaging.chatType === "channel"
      ? this.messaging.activeChannel
      : this.messaging.activeChatRoom;
  }

  focusInput() {
    if (this.messageInput && !this.messageInput.disabled) {
      this.messageInput.focus();
    }
  }

  clearInput() {
    if (this.messageInput) {
      this.messageInput.value = "";
    }
  }

  setInputValue(value) {
    if (this.messageInput) {
      this.messageInput.value = value;
    }
  }

  getInputValue() {
    return this.messageInput ? this.messageInput.value : "";
  }
}

export default FormHandler;
