import { showToast } from "../../core/ui/toast.js";

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
      showToast("Cannot send message: no active chat", "error");
      return;
    }

    // Create temporary message for instant feedback
    let tempMessageElement = null;
    let messageSubmitted = false;
    let retryCount = 0;
    const maxRetries = 2;

    try {
      this.setFormState(true);
      
      // Show sending toast
      showToast(`Sending message to ${chatType}...`, "info", 1000);

      // Show temporary message immediately
      tempMessageElement = this.messaging.messageHandler.createTemporaryMessage(
        content,
        chatType,
        chatId
      );

      // Clear input immediately for better UX
      const originalContent = content;
      this.messageInput.value = "";

      const sendMessageWithRetry = async (attempt = 0) => {
        try {
          if (attempt > 0) {
            showToast(`Retrying message send (${attempt}/${maxRetries})...`, "warning", 1000);
          }
          
          // Send the message
          const result = await this.messaging.messageHandler.sendMessage(
            chatType,
            chatId,
            originalContent
          );
          messageSubmitted = true;
          
          // Show success toast with details
          const targetName = chatType === 'channel' ? `#${result?.channelName || chatId}` : `DM ${result?.username || chatId}`;
          showToast(`Message sent to ${targetName}`, "success");
          
          return result;
        } catch (error) {
          if (attempt < maxRetries) {
            this.messaging.debugUtils.log(
              `⚠️ Message send failed, retrying (${attempt + 1}/${maxRetries})...`,
              error
            );
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
            return sendMessageWithRetry(attempt + 1);
          } else {
            throw error;
          }
        }
      };

      await sendMessageWithRetry();

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
      
      // Show error toast
      showToast(`Failed to send message: ${error.message || "Connection error"}`, "error");

      // Keep temporary message visible but mark as error
      if (tempMessageElement && tempMessageElement.parentNode) {
        tempMessageElement.classList.add("message-error");
        const errorIndicator = document.createElement("div");
        errorIndicator.className = "text-red-400 text-xs mt-1";
        errorIndicator.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Failed to send. <span class="underline cursor-pointer retry-send">Try again</span>';
        tempMessageElement.appendChild(errorIndicator);
        
        // Add retry functionality
        const retryButton = errorIndicator.querySelector(".retry-send");
        if (retryButton) {
          retryButton.addEventListener("click", async (e) => {
            e.preventDefault();
            errorIndicator.textContent = "Retrying...";
            try {
              await this.messaging.messageHandler.sendMessage(
                chatType,
                chatId,
                originalContent
              );
              this.messaging.messageHandler.removeTemporaryMessage(tempMessageElement);
              showToast("Message sent successfully on retry", "success");
            } catch (retryError) {
              errorIndicator.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Failed to send. <span class="underline cursor-pointer retry-send">Try again</span>';
              const newRetryButton = errorIndicator.querySelector(".retry-send");
              if (newRetryButton) {
                newRetryButton.addEventListener("click", (e) => this.retryFailedMessage(e, chatType, chatId, originalContent, tempMessageElement));
              }
              showToast(`Retry failed: ${retryError.message || "Connection error"}`, "error");
            }
          });
        }
      }

      // Don't restore message content unless really needed
      if (!messageSubmitted && this.messageInput.value === "") {
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

  async retryFailedMessage(event, chatType, chatId, content, tempElement) {
    if (event) event.preventDefault();
    
    if (!tempElement || !tempElement.parentNode) return;
    
    const errorIndicator = tempElement.querySelector(".text-red-400");
    if (errorIndicator) {
      errorIndicator.textContent = "Retrying...";
    }
    
    showToast("Retrying message send...", "info");
    
    try {
      await this.messaging.messageHandler.sendMessage(
        chatType,
        chatId,
        content
      );
      
      if (tempElement && tempElement.parentNode) {
        this.messaging.messageHandler.removeTemporaryMessage(tempElement);
      }
      
      showToast("Message sent successfully on retry", "success");
      
    } catch (error) {
      if (errorIndicator) {
        errorIndicator.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Failed to send. <span class="underline cursor-pointer retry-send">Try again</span>';
        const retryButton = errorIndicator.querySelector(".retry-send");
        if (retryButton) {
          retryButton.addEventListener("click", (e) => this.retryFailedMessage(e, chatType, chatId, content, tempElement));
        }
      }
      showToast(`Retry failed: ${error.message || "Connection error"}`, "error");
    }
  }
}

export default FormHandler;
