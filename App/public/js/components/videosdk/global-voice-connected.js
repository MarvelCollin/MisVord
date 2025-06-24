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

    if (this.isConnected && window.videosdkMeeting) {
      this.loadIndicatorComponent(true);
    }

    this.startConnectionVerification();
  }

  loadConnectionState() {
    const savedState = localStorage.getItem("voiceConnectionState");
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        this.isConnected = state.isConnected || false;
        this.channelName = state.channelName || "";
        this.meetingId = state.meetingId || "";
        this.connectionTime = state.connectionTime || 0;

        if (this.isConnected && !window.videosdkMeeting) {
          this.resetState();
        }
      } catch (e) {
        console.error("Failed to parse voice connection state", e);
        this.resetState();
      }
    }
  }

  saveConnectionState() {
    const state = {
      isConnected: this.isConnected,
      channelName: this.channelName,
      meetingId: this.meetingId,
      connectionTime: this.connectionTime,
    };
    localStorage.setItem("voiceConnectionState", JSON.stringify(state));
  }

  resetState() {
    this.isConnected = false;
    this.channelName = "";
    this.meetingId = "";
    this.connectionTime = 0;
    localStorage.removeItem("voiceConnectionState");
    this.hideIndicator();
    this.stopTimer();
  }

  loadIndicatorComponent(shouldShowAfterLoad = false) {
    if (this.indicator) return this.indicator;
    
    if (!document.getElementById('voice-indicator')) {
      fetch('/components/common/voice-indicator')
        .then(response => response.text())
        .then(html => {
          if (!document.getElementById('voice-indicator')) {
            document.body.insertAdjacentHTML('beforeend', html);
            this.indicator = document.getElementById('voice-indicator');
            
            const disconnectBtn = this.indicator.querySelector(".disconnect-btn");
            disconnectBtn.addEventListener("click", () => this.handleDisconnect());
            
            this.makeDraggable();
            
            if (shouldShowAfterLoad && this.isConnected) {
              this.loadPosition();
              this.updateChannelInfo();
              this.showIndicator();
              this.startTimer();
            }
          } else {
            this.indicator = document.getElementById('voice-indicator');
            
            const disconnectBtn = this.indicator.querySelector(".disconnect-btn");
            disconnectBtn.addEventListener("click", () => this.handleDisconnect());
            
            this.makeDraggable();
            
            if (shouldShowAfterLoad && this.isConnected) {
              this.loadPosition();
              this.updateChannelInfo();
              this.showIndicator();
              this.startTimer();
            }
          }
        })
        .catch(error => {
          console.error('Error loading voice indicator component:', error);
        });
      
      return null;
    } else {
      this.indicator = document.getElementById('voice-indicator');
      
      const disconnectBtn = this.indicator.querySelector(".disconnect-btn");
      disconnectBtn.addEventListener("click", () => this.handleDisconnect());
      
      this.makeDraggable();
      
      if (shouldShowAfterLoad && this.isConnected) {
        this.loadPosition();
        this.updateChannelInfo();
        this.showIndicator();
        this.startTimer();
      }
      
      return this.indicator;
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
  }

  handleConnect(channelName, meetingId) {
    this.isConnected = true;
    this.channelName = channelName;
    this.meetingId = meetingId;
    this.connectionTime = Date.now();
    this.saveConnectionState();

    this.loadIndicatorComponent(true);
  }

  handleDisconnect() {
    this.isConnected = false;
    this.hideIndicator();
    this.stopTimer();
    this.resetState();

    const event = new CustomEvent("globalVoiceDisconnect");
    window.dispatchEvent(event);

    if (window.videosdkMeeting) {
      try {
        window.videosdkMeeting.leave();
      } catch (e) {
        console.error("Error when trying to leave meeting", e);
      }
    }
  }

  showIndicator() {
    if (!this.indicator) return;
    
    this.updateChannelInfo();
    
    if (this.indicator.style.display === "none") {
      this.indicator.style.display = "";
      
      requestAnimationFrame(() => {
        this.indicator.classList.remove("scale-0", "opacity-0");
        this.indicator.classList.add("scale-100", "opacity-100");
      });
    } else {
      this.indicator.classList.remove("scale-0", "opacity-0");
      this.indicator.classList.add("scale-100", "opacity-100");
    }
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

    const timerEl = this.indicator
      ? this.indicator.querySelector(".timer")
      : null;
    if (!timerEl) return;

    this.timerInterval = setInterval(() => {
      if (!this.isConnected) {
        clearInterval(this.timerInterval);
        return;
      }

      const elapsedSeconds = Math.floor(
        (Date.now() - this.connectionTime) / 1000
      );
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;

      timerEl.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  startConnectionVerification() {
    this.verificationInterval = setInterval(() => {
      if (this.isConnected) {
        if (!window.videosdkMeeting) {
          console.log("Voice connection lost, resetting state");
          this.resetState();
          this.hideIndicator();
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
    if (!this.indicator) return;
    
    const channelInfoEl = this.indicator.querySelector(".channel-info");
    if (channelInfoEl) {
      channelInfoEl.textContent = `${this.channelName} / ${this.meetingId.replace('voice_channel_', '')}`;
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
