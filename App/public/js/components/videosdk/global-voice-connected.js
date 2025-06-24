class GlobalVoiceIndicator {
  constructor() {
    this.isConnected = false;
    this.channelName = "";
    this.meetingId = "";
    this.connectionTime = 0;
    this.initialized = false;
    this.indicator = null;

    this.init();
  }

  init() {
    if (this.initialized) return;

    this.loadConnectionState();
    this.setupEventListeners();
    this.initialized = true;

    // Only load indicator if already connected
    if (this.isConnected && window.videosdkMeeting) {
      this.loadIndicatorComponent(true);
    }

    this.startConnectionVerification();
  }

  loadConnectionState() {
    const savedState = localStorage.getItem("voiceConnectionState");
    
    if (!savedState) {
      this.resetState();
      return;
    }
    
    try {
      const state = JSON.parse(savedState);
      
      // Only restore if we have a valid meeting ID and window.videosdkMeeting exists
      if (state.isConnected && state.meetingId && window.videosdkMeeting) {
        this.isConnected = state.isConnected;
        this.channelName = state.channelName || "Voice Channel";
        this.meetingId = state.meetingId;
        this.connectionTime = state.connectionTime || Date.now();
      } else {
        // If videosdk meeting doesn't exist but we have saved state, clean it up
        this.resetState();
      }
    } catch (e) {
      console.error("Error loading voice connection state:", e);
      this.resetState();
    }
  }

  saveConnectionState() {
    if (!this.isConnected || !window.videosdkMeeting) {
      localStorage.removeItem("voiceConnectionState");
      return;
    }
    
    const state = {
      isConnected: this.isConnected,
      channelName: this.channelName,
      meetingId: this.meetingId,
      connectionTime: this.connectionTime
    };
    
    localStorage.setItem("voiceConnectionState", JSON.stringify(state));
  }

  resetState() {
    this.isConnected = false;
    this.channelName = "";
    this.meetingId = "";
    this.connectionTime = 0;
    localStorage.removeItem("voiceConnectionState");
    
    if (this.indicator) {
      this.hideIndicator();
    }
    
    this.stopTimer();
  }

  async loadIndicatorComponent(shouldShow = false) {
    // Don't create indicator if not connected
    if (!this.isConnected && !window.videosdkMeeting) return;
    
    // Check if indicator already exists
    if (this.indicator) {
      if (shouldShow) {
        this.showIndicator();
      }
      return;
    }

    try {
      const response = await fetch('/views/components/common/voice-indicator.php');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Don't proceed if disconnected during fetch
      if (!this.isConnected && !window.videosdkMeeting) return;
      
      // Create container for the indicator
      const container = document.createElement('div');
      container.innerHTML = html.trim();
      this.indicator = container.firstChild;
      
      if (!this.indicator) {
        console.error("Voice indicator component not found in response");
        return;
      }
      
      // Set display to none initially
      this.indicator.style.display = shouldShow ? 'flex' : 'none';
      this.indicator.classList.add("scale-0", "opacity-0");
      
      document.body.appendChild(this.indicator);
      
      this.setupIndicatorElements();
      this.startTimer();
      
      if (shouldShow) {
        setTimeout(() => {
          if (this.isConnected) {
            this.showIndicator();
          } else {
            this.cleanup();
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error loading voice indicator component:", error);
    }
  }

  makeDraggable() {
    if (!this.indicator) return;

    let isDragging = false;
    let offsetX, offsetY;

    const onMouseDown = (e) => {
      if (e.target.closest(".disconnect-btn")) return;

      isDragging = true;
      this.indicator.style.transition = "none";

      const rect = this.indicator.getBoundingClientRect();

      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      this.indicator.classList.add("active");
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;

      let left = e.clientX - offsetX;
      let top = e.clientY - offsetY;

      const rect = this.indicator.getBoundingClientRect();
      left = Math.max(0, Math.min(left, window.innerWidth - rect.width));
      top = Math.max(0, Math.min(top, window.innerHeight - rect.height));

      this.indicator.style.left = left + "px";
      this.indicator.style.top = top + "px";
    };

    const onMouseUp = () => {
      if (!isDragging) return;

      isDragging = false;
      this.indicator.style.transition = "transform 0.3s, opacity 0.3s";

      this.savePosition();

      this.indicator.classList.remove("active");
    };

    this.indicator.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    this.indicator.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      onMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: touch.target,
      });
    });

    document.addEventListener(
      "touchmove",
      (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
      },
      { passive: false }
    );

    document.addEventListener("touchend", onMouseUp);
  }

  savePosition() {
    if (!this.indicator) return;

    const rect = this.indicator.getBoundingClientRect();
    const position = {
      left: rect.left,
      top: rect.top,
    };

    localStorage.setItem("voiceIndicatorPosition", JSON.stringify(position));
  }

  loadPosition() {
    if (!this.indicator) return;

    const savedPosition = localStorage.getItem("voiceIndicatorPosition");
    if (savedPosition) {
      try {
        const position = JSON.parse(savedPosition);
        this.indicator.style.left = position.left + "px";
        this.indicator.style.top = position.top + "px";
      } catch (e) {
        console.error("Failed to parse saved position", e);
      }
    }
  }

  setupEventListeners() {
    window.addEventListener("voiceConnect", (e) => {
      this.handleConnect(e.detail.channelName, e.detail.meetingId);
    });

    window.addEventListener("voiceDisconnect", () => {
      this.handleDisconnect();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && this.isConnected) {
        this.showIndicator();
      }
    });
    
    // Handle page unload/navigation
    window.addEventListener("beforeunload", () => {
      this.cleanup();
    });
    
    window.addEventListener("unload", () => {
      this.cleanup();
    });
    
    // Handle popstate (browser back/forward)
    window.addEventListener("popstate", () => {
      if (!this.isConnected) {
        this.cleanup();
      }
    });
  }

  handleConnect(channelName, meetingId) {
    this.isConnected = true;
    this.channelName = channelName;
    this.meetingId = meetingId;
    this.connectionTime = Date.now();
    this.saveConnectionState();

    // Only load and show indicator when actually connected
    this.loadIndicatorComponent(true);
  }

  handleDisconnect() {
    this.isConnected = false;
    this.hideIndicator();
    this.stopTimer();
    
    // Clear connection state in localStorage
    localStorage.removeItem("voiceConnectionState");
    
    // Dispatch event for other components
    const event = new CustomEvent("globalVoiceDisconnect");
    window.dispatchEvent(event);

    // Leave the VideoSDK meeting if it exists
    if (window.videosdkMeeting) {
      try {
        window.videosdkMeeting.leave();
        window.videosdkMeeting = null;
      } catch (e) {
        console.error("Error when trying to leave meeting", e);
      }
    }
    
    // Complete reset of state
    this.resetState();
    
    // Remove indicator completely from DOM
    setTimeout(() => {
      this.cleanup();
    }, 350);
  }

  showIndicator() {
    if (!this.indicator) return;
    if (!this.isConnected) return;
    
    this.indicator.style.display = "flex";
    
    // Force a reflow to ensure transition works
    void this.indicator.offsetWidth;
    
    this.indicator.classList.remove("scale-0", "opacity-0");
    this.indicator.classList.add("scale-100", "opacity-100");
  }

  hideIndicator() {
    if (!this.indicator) return;

    this.indicator.classList.remove("scale-100", "opacity-100");
    this.indicator.classList.add("scale-0", "opacity-0");

    setTimeout(() => {
      if (!this.isConnected && this.indicator) {
        this.indicator.style.display = "none";
      }
    }, 300);
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.updateConnectionTime();
    
    this.timerInterval = setInterval(() => {
      this.updateConnectionTime();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  startConnectionVerification() {
    // Clear any existing interval
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
    }
    
    this.verificationInterval = setInterval(() => {
      // Check if connected but no VideoSDK meeting exists
      if (this.isConnected && !window.videosdkMeeting) {
        console.log("Voice connection state mismatch - no VideoSDK meeting exists. Disconnecting.");
        this.handleDisconnect();
      } 
      // Double check if we're showing the indicator but not connected
      else if (!this.isConnected && this.indicator) {
        console.log("Voice indicator showing but not connected. Cleaning up.");
        this.cleanup();
      }
    }, 3000);
  }

  stopConnectionVerification() {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
      this.verificationInterval = null;
    }
  }

  updateChannelInfo() {
    if (!this.indicator || !this.isConnected) return;
    
    const channelNameEl = this.indicator.querySelector('.channel-name');
    if (channelNameEl) {
      // Set the username instead of channel name
      const username = localStorage.getItem('username') || sessionStorage.getItem('username') || 'User';
      channelNameEl.textContent = username;
    }
  }

  updateConnectionTime() {
    if (!this.indicator || !this.isConnected || !this.connectionTime) return;
    
    const durationEl = this.indicator.querySelector('.connection-duration');
    if (!durationEl) return;
    
    const elapsedMs = Date.now() - this.connectionTime;
    const elapsedSec = Math.floor(elapsedMs / 1000);
    
    const hours = Math.floor(elapsedSec / 3600);
    const minutes = Math.floor((elapsedSec % 3600) / 60);
    const seconds = elapsedSec % 60;
    
    let timeStr = '';
    if (hours > 0) {
      timeStr = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    durationEl.textContent = timeStr;
  }

  setupIndicatorElements() {
    if (!this.indicator) return;
    
    const disconnectBtn = this.indicator.querySelector(".disconnect-btn");
    if (disconnectBtn) {
      disconnectBtn.addEventListener("click", () => this.handleDisconnect());
    }
    
    this.makeDraggable();
    this.loadPosition();
    this.updateChannelInfo();
    this.updateConnectionTime();
  }

  cleanup() {
    if (!this.isConnected) {
      // Remove any indicators from DOM
      if (this.indicator) {
        this.indicator.remove();
        this.indicator = null;
      }
      
      // Clear any existing voice indicators
      const existingIndicators = document.querySelectorAll('#voice-indicator');
      existingIndicators.forEach(indicator => {
        indicator.remove();
      });
    }
  }
}

const globalVoiceIndicator = new GlobalVoiceIndicator();

window.globalVoiceIndicator = globalVoiceIndicator;

document.addEventListener("DOMContentLoaded", function () {
  const meta = document.querySelector('meta[name="meeting-id"]');

  if (meta && localStorage.getItem("voiceConnectionState")) {
    try {
      const state = JSON.parse(localStorage.getItem("voiceConnectionState"));
      if (state.isConnected) {
        if (document.getElementById("videoContainer")) {
          return;
        }

        setTimeout(() => {
          if (window.videosdkMeeting) {
            const event = new CustomEvent("voiceConnect", {
              detail: {
                channelName: state.channelName,
                meetingId: state.meetingId,
              },
            });
            window.dispatchEvent(event);
          } else {
            localStorage.removeItem("voiceConnectionState");
          }
        }, 1000);
      }
    } catch (e) {
      console.error("Failed to parse voice connection state", e);
      localStorage.removeItem("voiceConnectionState");
    }
  }
});
