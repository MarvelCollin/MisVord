class GlobalVoiceIndicator {
  constructor() {
    this.isConnected = false;
    this.channelName = "";
    this.meetingId = "";
    this.connectionTime = 0;
    this.initialized = false;
    this.indicator = null;
    this.currentChannelId = null;
    this.onVoiceChannelPage = false;

    this.init();
  }

  init() {
    if (this.initialized) return;

    this.loadConnectionState();
    this.setupEventListeners();
    this.initialized = true;

    this.checkIfOnVoiceChannelPage();
    this.setupNavigationObserver();

    if (this.isConnected && window.videosdkMeeting && !this.onVoiceChannelPage) {
      this.loadIndicatorComponent(true);
    }

    this.startConnectionVerification();
  }

  checkIfOnVoiceChannelPage() {
    this.onVoiceChannelPage = false;
    
    // Check different indicators that we're on a voice channel page
    
    // 1. Check for video container element
    const videoContainer = document.getElementById('videoContainer');
    if (videoContainer) {
      this.onVoiceChannelPage = true;
      return true;
    }
    
    // 2. Check URL path
    const currentPath = window.location.pathname;
    if (currentPath.includes('/voice/') || 
        (currentPath.includes('/channels/') && currentPath.includes('/voice'))) {
      this.onVoiceChannelPage = true;
      return true;
    }
    
    // 3. Check for voice UI elements
    const voiceControls = document.querySelector('.voice-controls');
    const joinVoiceBtn = document.getElementById('joinBtn');
    if ((voiceControls || joinVoiceBtn) && document.querySelector('[data-channel-id="' + this.currentChannelId + '"]')) {
      this.onVoiceChannelPage = true;
      return true;
    }
    
    // 4. Check meta tag
    const meetingIdMeta = document.querySelector('meta[name="meeting-id"]');
    const currentMeetingId = meetingIdMeta ? meetingIdMeta.getAttribute('content') : null;
    if (currentMeetingId && this.meetingId && currentMeetingId === this.meetingId) {
      this.onVoiceChannelPage = true;
      return true;
    }
    
    return false;
  }

  loadConnectionState() {
    const savedState = localStorage.getItem("voiceConnectionState");
    
    if (!savedState) {
      this.resetState();
      return;
    }
    
    try {
      const state = JSON.parse(savedState);
      
      if (state.isConnected && state.meetingId && window.videosdkMeeting) {
        this.isConnected = state.isConnected;
        this.channelName = state.channelName || "Voice Channel";
        this.meetingId = state.meetingId;
        this.currentChannelId = state.currentChannelId || null;
        this.connectionTime = state.connectionTime || Date.now();
        
        this.checkIfOnVoiceChannelPage();
      } else {
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
      currentChannelId: this.currentChannelId,
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
    if (!this.isConnected && !window.videosdkMeeting) return;
    
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
      
      if (!this.isConnected && !window.videosdkMeeting) return;
      
      const container = document.createElement('div');
      container.innerHTML = html.trim();
      this.indicator = container.firstChild;
      
      if (!this.indicator) {
        console.error("Voice indicator component not found in response");
        return;
      }
      
      document.body.appendChild(this.indicator);
      
      this.setupIndicatorElements();
      this.startTimer();
      
      if (shouldShow) {
        this.forceShowIndicator();
      }
    } catch (error) {
      console.error("Error loading voice indicator component:", error);
    }
  }
  
  forceShowIndicator() {
    if (!this.indicator) return;
    if (this.onVoiceChannelPage) return;
    
    this.indicator.style.display = "flex";
    this.indicator.classList.remove("scale-0", "opacity-0");
    
    // Force the element to be displayed
    this.indicator.style.opacity = "1";
    this.indicator.style.transform = "scale(1)";
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
      this.handleConnect(
        e.detail.channelName, 
        e.detail.meetingId, 
        e.detail.channelId || null
      );
    });

    window.addEventListener("voiceDisconnect", () => {
      this.handleDisconnect();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && this.isConnected) {
        this.updatePageVisibility();
      }
    });
    
    window.addEventListener("popstate", () => {
      setTimeout(() => {
        this.updatePageVisibility();
      }, 100);
    });
    
    document.addEventListener("click", (e) => {
      if (e.target.closest('a[href^="/"]')) {
        setTimeout(() => {
          this.updatePageVisibility();
        }, 500);
      }
    });
    
    window.addEventListener("beforeunload", () => {
      this.cleanup();
    });
    
    window.addEventListener("unload", () => {
      this.cleanup();
    });
  }

  handleConnect(channelName, meetingId, channelId = null) {
    this.isConnected = true;
    this.channelName = channelName;
    this.meetingId = meetingId;
    this.currentChannelId = channelId;
    this.connectionTime = Date.now();
    this.saveConnectionState();
    
    this.checkIfOnVoiceChannelPage();

    if (!this.onVoiceChannelPage) {
      this.loadIndicatorComponent(true);
      
      setTimeout(() => {
        if (this.indicator && this.isConnected && !this.onVoiceChannelPage) {
          this.forceShowIndicator();
        }
      }, 200);
    }
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
    if (this.onVoiceChannelPage) return;
    
    this.indicator.style.display = "flex";
    
    setTimeout(() => {
      this.indicator.classList.add("scale-100", "opacity-100");
      this.indicator.classList.remove("scale-0", "opacity-0");
    }, 10);
  }

  hideIndicator() {
    if (!this.indicator) return;

    this.indicator.classList.remove("scale-100", "opacity-100");
    this.indicator.classList.add("scale-0", "opacity-0");

    setTimeout(() => {
      if (this.indicator) {
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
    if (channelNameEl && this.channelName) {
      // Shorten channel name if too long
      const displayName = this.channelName.length > 10 
        ? this.channelName.substring(0, 8) + '...' 
        : this.channelName;
      
      channelNameEl.textContent = displayName;
    }
  }

  updateConnectionTime() {
    if (!this.indicator || !this.isConnected || !this.connectionTime) return;
    
    const durationEl = this.indicator.querySelector('.connection-duration');
    if (!durationEl) return;
    
    const elapsedMs = Date.now() - this.connectionTime;
    const elapsedSec = Math.floor(elapsedMs / 1000);
    
    // Format time as shown in the image (minutes-seconds)
    const minutes = Math.floor(elapsedSec / 60);
    const seconds = elapsedSec % 60;
    
    // Format to match the design: "24-2"
    durationEl.textContent = `${minutes.toString().padStart(2, '0')}-${seconds.toString().padStart(2, '0')}`;
  }

  setupIndicatorElements() {
    if (!this.indicator) return;
    
    const disconnectBtn = this.indicator.querySelector(".disconnect-btn");
    if (disconnectBtn) {
      disconnectBtn.addEventListener("click", () => this.handleDisconnect());
    }
    
    // Setup signal strength indicators
    this.updateSignalStrength();
    
    // Update signal strength periodically
    this.signalInterval = setInterval(() => {
      this.updateSignalStrength();
    }, 5000);
    
    this.makeDraggable();
    this.loadPosition();
    this.updateChannelInfo();
    this.updateConnectionTime();
  }
  
  updateSignalStrength() {
    if (!this.indicator || !this.isConnected) return;
    
    const signalBars = this.indicator.querySelectorAll('.voice-ind-signal div');
    if (!signalBars.length) return;
    
    const quality = Math.random();
    
    if (quality > 0.7) {
      signalBars.forEach(bar => {
        bar.classList.remove('opacity-25');
        bar.classList.add('bg-white');
      });
    } else if (quality > 0.4) {
      signalBars[0].classList.remove('opacity-25');
      signalBars[1].classList.remove('opacity-25');
      signalBars[0].classList.add('bg-white');
      signalBars[1].classList.add('bg-white');
      signalBars[2].classList.add('opacity-25');
      signalBars[2].classList.remove('bg-white');
    } else {
      signalBars[0].classList.remove('opacity-25');
      signalBars[0].classList.add('bg-white');
      signalBars[1].classList.add('opacity-25');
      signalBars[2].classList.add('opacity-25');
      signalBars[1].classList.remove('bg-white');
      signalBars[2].classList.remove('bg-white');
    }
  }
  
  setupNavigationObserver() {
    // Set up a MutationObserver to detect DOM changes that might indicate navigation
    this.observer = new MutationObserver(() => {
      if (this.isConnected) {
        setTimeout(() => {
          this.updatePageVisibility();
        }, 300);
      }
    });
    
    // Start observing the document with the configured parameters
    this.observer.observe(document.body, {
      childList: true, 
      subtree: true
    });
  }

  cleanup() {
    if (!this.isConnected) {  
      if (this.indicator) {
        this.indicator.remove();
        this.indicator = null;
      }
      
      // Clear intervals
      if (this.signalInterval) {
        clearInterval(this.signalInterval);
        this.signalInterval = null;
      }
      
      // Stop the observer
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      
      // Clear any existing voice indicators
      const existingIndicators = document.querySelectorAll('#voice-indicator');
      existingIndicators.forEach(indicator => {
        indicator.remove();
      });
    }
  }

  updatePageVisibility() {
    const wasOnVoiceChannelPage = this.onVoiceChannelPage;
    const nowOnVoiceChannelPage = this.checkIfOnVoiceChannelPage();
    
    if (!this.isConnected) {
      // Not connected, no need to show/hide indicator
      return;
    }
    
    // Handle transitions between pages
    if (wasOnVoiceChannelPage && !nowOnVoiceChannelPage) {
      // Moved away from voice channel page, show indicator
      console.log('Left voice channel page, showing indicator');
      if (this.indicator) {
        this.showIndicator();
      } else {
        this.loadIndicatorComponent(true);
      }
    } else if (!wasOnVoiceChannelPage && nowOnVoiceChannelPage) {
      // Entered voice channel page, hide indicator
      console.log('Entered voice channel page, hiding indicator');
      this.hideIndicator();
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
