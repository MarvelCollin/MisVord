class GlobalVoiceIndicator {
  constructor() {
    this.isConnected = false;
    this.channelName = "";
    this.meetingId = "";
    this.connectionTime = 0;
    this.initialized = false;
    this.currentChannelId = null;
    this.onVoiceChannelPage = false;

    this.init();
  }

  init() {
    if (this.initialized) return;

    this.setupEventListeners();
    this.initialized = true;

    this.checkIfOnVoiceChannelPage();
    this.setupNavigationObserver();

    this.startConnectionVerification();
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
    
    this.stopTimer();
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
    
    console.log('🎤 Voice connected', {
      channelName,
      meetingId,
      channelId
    });
    
    this.checkIfOnVoiceChannelPage();
  }

  handleDisconnect() {
    if (window.videoSDKJoiningInProgress) {
      console.log("Ignoring disconnect request - joining in progress");
      return;
    }
    
    this.isConnected = false;
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
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    }
  }

  updatePageVisibility() {
    const wasOnVoiceChannelPage = this.onVoiceChannelPage;
    const nowOnVoiceChannelPage = this.checkIfOnVoiceChannelPage();
    
    if (!this.isConnected) {
      return;
    }
    
    if (wasOnVoiceChannelPage && !nowOnVoiceChannelPage) {
      console.log('Left voice channel page');
    } else if (!wasOnVoiceChannelPage && nowOnVoiceChannelPage) {
      console.log('Entered voice channel page');
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
