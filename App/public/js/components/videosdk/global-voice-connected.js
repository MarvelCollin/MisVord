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

    // Clean up any existing voice indicators on init
    this.cleanupExistingIndicators();

    this.setupEventListeners();
    this.initialized = true;

    this.checkIfOnVoiceChannelPage();
    this.setupNavigationObserver();

    this.startConnectionVerification();
  }

  cleanupExistingIndicators() {
    const existingIndicators = document.querySelectorAll('#voice-indicator');
    if (existingIndicators.length > 0) {
      console.log(`🧹 Cleaning up ${existingIndicators.length} existing voice indicators on init`);
      existingIndicators.forEach(indicator => indicator.remove());
    }
  }

  checkIfOnVoiceChannelPage() {
    this.onVoiceChannelPage = false;
    
    const voiceContainer = document.getElementById('voice-container');
    const joinView = document.getElementById('joinView');
    const connectingView = document.getElementById('connectingView');
    const connectedView = document.getElementById('connectedView');
    const joinBtn = document.getElementById('joinBtn');
    
    if (voiceContainer || joinView || connectingView || connectedView || joinBtn) {
      this.onVoiceChannelPage = true;
      return true;
    }
    
    const meetingIdMeta = document.querySelector('meta[name="meeting-id"]');
    if (meetingIdMeta) {
      this.onVoiceChannelPage = true;
      return true;
    }
    
    const currentPath = window.location.pathname;
    if (currentPath.includes('/voice/') || 
        (currentPath.includes('/channels/') && currentPath.includes('/voice'))) {
      this.onVoiceChannelPage = true;
      return true;
    }
    
    const voiceTools = document.querySelector('.voice-tools');
    if (voiceTools) {
      this.onVoiceChannelPage = true;
      return true;
    }
    
    return false;
  }

  resetState() {
    this.isConnected = false;
    this.channelName = "";
    this.meetingId = "";
    this.connectionTime = 0;
    
    if (this.indicator) {
      this.hideIndicator();
    }
    
    this.stopTimer();
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
    
    console.log('🎤 Voice connected, handling indicator display', {
      channelName,
      meetingId,
      channelId,
      onVoiceChannelPage: this.onVoiceChannelPage
    });
    
    this.checkIfOnVoiceChannelPage();
    
    console.log('📍 Page detection result:', {
      onVoiceChannelPage: this.onVoiceChannelPage,
      currentPath: window.location.pathname,
      voiceContainer: !!document.getElementById('voice-container'),
      joinView: !!document.getElementById('joinView'),
      meetingIdMeta: !!document.querySelector('meta[name="meeting-id"]')
    });

    // Clean up any existing indicators first
    const existingIndicators = document.querySelectorAll('#voice-indicator');
    if (existingIndicators.length > 0) {
      console.log(`🗑️ Found ${existingIndicators.length} existing indicators, removing them`);
      existingIndicators.forEach(indicator => indicator.remove());
      this.indicator = null;
    }

    // Always load the indicator component for debugging (temporary)
    console.log('🔄 Loading voice indicator component...');
    this.loadIndicatorComponent(true);
    
    setTimeout(() => {
      console.log('⏰ Timeout check:', {
        indicatorExists: !!this.indicator,
        isConnected: this.isConnected,
        onVoiceChannelPage: this.onVoiceChannelPage,
        indicatorInDOM: !!document.getElementById('voice-indicator')
      });
      
      if (this.indicator && this.isConnected) {
        console.log('🔍 Forcing indicator to show');
        this.forceShowIndicator();
      } else {
        console.warn('⚠️ Cannot show indicator - missing requirements');
      }
    }, 500);
  }

  handleDisconnect() {
    if (window.videoSDKJoiningInProgress) {
      console.log("Ignoring disconnect request - joining in progress");
      return;
    }
    
    this.isConnected = false;
    this.hideIndicator();
    this.stopTimer();
    
    if (window.videosdkMeeting) {
      try {
        window.videosdkMeeting.leave();
        window.videosdkMeeting = null;
      } catch (e) {
        console.error("Error when trying to leave meeting", e);
      }
    }
    
    if (window.videoSDKManager && typeof window.videoSDKManager.leaveMeeting === 'function') {
      try {
        window.videoSDKManager.leaveMeeting();
      } catch (e) {
        console.error("Error when trying to use videoSDKManager.leaveMeeting", e);
      }
    }
    
    this.resetState();
    
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
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
    }
    
    this.verificationInterval = setInterval(() => {
      if (window.videoSDKJoiningInProgress) {
        console.log("Voice connection verification skipped - joining in progress");
        return;
      }
      
      const connectionAge = this.connectionTime ? (Date.now() - this.connectionTime) : 0;
      if (connectionAge < 10000) {
        console.log("Voice connection verification skipped - connection too new");
        return;
      }

      if (this.isConnected && !window.videosdkMeeting) {
        console.log("Voice connection state mismatch - no VideoSDK meeting exists. Disconnecting.");
        this.handleDisconnect();
      } 
      
      else if (!this.isConnected && this.indicator) {
        console.log("Voice indicator showing but not connected. Cleaning up.");
        this.cleanup();
      }
      
      
      if (window.voiceState?.isConnected && !window.videosdkMeeting && connectionAge >= 10000) {
        console.log("Voice state says connected but no active meeting. Resetting state.");
        window.voiceState.isConnected = false;
        if (typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent('voiceDisconnect'));
        }
      }
      
      
      if (window.voiceStateManager && 
          window.voiceStateManager.getState && 
          window.voiceStateManager.getState().isConnected && 
          !window.videosdkMeeting && 
          connectionAge >= 10000) {
        console.log("VoiceStateManager reports connected but no meeting exists. Resetting.");
        if (typeof window.voiceStateManager.reset === 'function') {
          window.voiceStateManager.reset();
        }
      }
    }, 5000); 
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
    
    
    const minutes = Math.floor(elapsedSec / 60);
    const seconds = elapsedSec % 60;
    
    
    durationEl.textContent = `${minutes.toString().padStart(2, '0')}-${seconds.toString().padStart(2, '0')}`;
  }

  setupIndicatorElements() {
    if (!this.indicator) return;
    
    const disconnectBtn = this.indicator.querySelector(".disconnect-btn");
    if (disconnectBtn) {
      disconnectBtn.addEventListener("click", () => this.handleDisconnect());
    }
    
    
    this.updateSignalStrength();
    
    
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
    
    this.observer = new MutationObserver(() => {
      if (this.isConnected) {
        setTimeout(() => {
          this.updatePageVisibility();
        }, 300);
      }
    });
    
    
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
      
      
      if (this.signalInterval) {
        clearInterval(this.signalInterval);
        this.signalInterval = null;
      }
      
      
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      
      
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
      
      return;
    }
    
    
    if (wasOnVoiceChannelPage && !nowOnVoiceChannelPage) {
      
      console.log('Left voice channel page, showing indicator');
      if (this.indicator) {
        this.showIndicator();
      } else {
        this.loadIndicatorComponent(true);
      }
    } else if (!wasOnVoiceChannelPage && nowOnVoiceChannelPage) {
      
      console.log('Entered voice channel page, hiding indicator');
      this.hideIndicator();
    }
  }
}

// Prevent multiple instances
if (!window.globalVoiceIndicator) {
  const globalVoiceIndicator = new GlobalVoiceIndicator();
  window.globalVoiceIndicator = globalVoiceIndicator;
  console.log('✅ GlobalVoiceIndicator instance created');
} else {
  console.log('⚠️ GlobalVoiceIndicator already exists, skipping creation');
}

// No automatic connection on page load
