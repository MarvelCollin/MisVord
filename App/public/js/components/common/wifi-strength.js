class WiFiStrength {
  constructor() {
    this.strength = navigator.onLine ? 3 : 1;
    this.latency = 0;
    this.downlink = 0;
    this.effectiveType = 'unknown';
    this.isOnline = navigator.onLine;
    this.networkName = 'Unknown';
    this.clientInfo = {};
    
    this.getUserNetworkInfo();
    this.initTooltip();
    this.setupNetworkMonitoring();
  }

  async getUserNetworkInfo() {
    try {
      // Try to get Connection API info
      const connection = navigator.connection || 
                        navigator.mozConnection || 
                        navigator.webkitConnection;
                        
      if (connection) {
        this.effectiveType = connection.effectiveType || 'unknown';
        this.downlink = connection.downlink || 0;
        
        // On some devices, this might include the network type (wifi, cellular, etc)
        if (connection.type) {
          this.networkName = connection.type.toUpperCase();
        }
      }
      
      if (navigator.onLine && 'networkInformation' in navigator) {
        try {
          const network = await navigator.networkInformation.getNetworkInfo();
          if (network && network.type === 'wifi' && network.ssid) {
            this.networkName = network.ssid;
          }
        } catch (e) {
          console.log('WiFi name access not available');
        }
      }
      
      if (navigator.onLine) {
        try {
          // Get public IP and network info
          const response = await fetch('https://api.ipify.org?format=json', {
            method: 'GET',
            cache: 'no-cache'
          });
          
          if (response.ok) {
            const data = await response.json();
            this.clientInfo.ip = data.ip;
            
            // Try to get more details about this IP
            this.getIPDetails(data.ip);
          }
        } catch (error) {
          console.log('Could not fetch public IP info');
        }
      }
    } catch (error) {
      console.error('Error getting user network info:', error);
    }
  }
  
  async getIPDetails(ip) {
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.clientInfo = {
          ...this.clientInfo,
          city: data.city,
          region: data.region,
          country: data.country_name,
          org: data.org,
          isp: data.org
        };
        
        // Set network name to ISP if available
        if (data.org && this.networkName === 'Unknown') {
          // Extract just the ISP name without AS number
          const ispMatch = data.org.match(/^AS\d+\s+(.+)$/);
          this.networkName = ispMatch ? ispMatch[1] : data.org;
        }
      }
    } catch (error) {
      console.log('Could not fetch IP details');
    }
  }

  initTooltip() {
    document.addEventListener('DOMContentLoaded', () => {
      this.addTooltipToWifiIcons();
      this.updateAllIcons();
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          this.addTooltipToWifiIcons();
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  addTooltipToWifiIcons() {
    const wifiIcons = document.querySelectorAll('.fas.fa-wifi, .fa-wifi');
    
    wifiIcons.forEach(icon => {
      if (icon.dataset.hasTooltip) return;
      
      icon.dataset.hasTooltip = 'true';
      
      this.updateIconBasedOnStrength(icon);
      
      const wrapperElement = icon.closest('.wifi-tooltip-wrapper');
      if (wrapperElement) {
        wrapperElement.addEventListener('mouseenter', () => {
          this.removeExistingTooltips();
          this.showCustomTooltip(icon);
        });
        
        wrapperElement.addEventListener('mouseleave', () => {
          this.hideCustomTooltip(icon);
        });
      }
    });
  }

  updateAllIcons() {
    const wifiIcons = document.querySelectorAll('.fas.fa-wifi, .fa-wifi');
    wifiIcons.forEach(icon => {
      this.updateIconBasedOnStrength(icon);
    });
  }

  updateStrength(newStrength, latency = this.latency) {
    this.strength = Math.max(1, Math.min(4, newStrength));
    this.latency = latency;
    
    this.updateAllIcons();
  }
  
  updateIconBasedOnStrength(icon) {
    const strengthClasses = {
      1: 'text-red-500',
      2: 'text-yellow-500',
      3: 'text-green-400',
      4: 'text-[#43b581]'
    };
    
    // Special case for offline state
    if (!this.isOnline) {
      Object.values(strengthClasses).forEach(cls => {
        icon.classList.remove(cls);
      });
      icon.classList.add('text-red-500');
      return;
    }
    
    Object.values(strengthClasses).forEach(cls => {
      icon.classList.remove(cls);
    });
    
    icon.classList.add(strengthClasses[this.strength]);
  }
  
  getTooltipContent() {
    if (!this.isOnline) {
      return `
        <div class="flex flex-col">
          <div class="flex items-center mb-1">
            <div class="mr-2">
              <div class="flex space-x-1">
                <div class="h-4 w-1 bg-red-500"></div>
                <div class="h-4 w-1 bg-gray-600"></div>
                <div class="h-4 w-1 bg-gray-600"></div>
                <div class="h-4 w-1 bg-gray-600"></div>
              </div>
            </div>
            <div>Offline</div>
          </div>
          <div class="text-xs text-red-400">
            <span>Not connected to the internet</span>
          </div>
        </div>
      `;
    }
    
    const labels = {
      1: 'Poor Connection',
      2: 'Fair Connection',
      3: 'Good Connection',
      4: 'Excellent Connection'
    };
    
    const latencyText = this.latency ? `${this.latency}ms` : 'Measuring...';
    const speedText = this.downlink ? `${this.downlink.toFixed(1)} Mbps` : '';
    const networkText = this.networkName !== 'Unknown' ? this.networkName : 
                       (this.clientInfo.isp ? this.clientInfo.isp : '');
    
    let locationText = '';
    if (this.clientInfo.city && this.clientInfo.country) {
      locationText = `${this.clientInfo.city}, ${this.clientInfo.country}`;
    }
    
    return `
      <div class="flex flex-col">
        <div class="flex items-center mb-1">
          <div class="mr-2">
            <div class="flex space-x-1">
              <div class="h-4 w-1 ${this.strength >= 1 ? 'bg-current' : 'bg-gray-600'}"></div>
              <div class="h-4 w-1 ${this.strength >= 2 ? 'bg-current' : 'bg-gray-600'}"></div>
              <div class="h-4 w-1 ${this.strength >= 3 ? 'bg-current' : 'bg-gray-600'}"></div>
              <div class="h-4 w-1 ${this.strength >= 4 ? 'bg-current' : 'bg-gray-600'}"></div>
            </div>
          </div>
          <div>${labels[this.strength]}</div>
        </div>
        <div class="text-xs flex justify-between ${this.latency > 500 ? 'text-red-400' : this.latency > 200 ? 'text-yellow-400' : 'text-green-400'} font-semibold">
          <span>Your Latency: ${latencyText}</span>
          ${speedText ? `<span class="ml-2">Speed: ${speedText}</span>` : ''}
        </div>
        ${networkText ? `<div class="text-xs text-gray-300 font-medium">Network: ${networkText}</div>` : ''}
        ${locationText ? `<div class="text-xs text-gray-400">${locationText}</div>` : ''}
        ${this.effectiveType !== 'unknown' ? `<div class="text-xs text-gray-400">Connection: ${this.effectiveType.toUpperCase()}</div>` : ''}
      </div>
    `;
  }
  
  removeExistingTooltips() {
    const existingTooltips = document.querySelectorAll('.custom-wifi-tooltip');
    existingTooltips.forEach(tooltip => tooltip.remove());
  }
  
  showCustomTooltip(icon) {
    this.removeExistingTooltips();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-wifi-tooltip absolute z-50 bg-gray-800 text-white text-sm px-3 py-2 rounded-md whitespace-nowrap shadow-lg transition-opacity duration-200';
    tooltip.style.top = '-85px';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.style.pointerEvents = 'none';
    tooltip.innerHTML = this.getTooltipContent();
    
    const wrapper = icon.closest('.wifi-tooltip-wrapper');
    if (wrapper) {
      wrapper.style.position = 'relative';
      wrapper.appendChild(tooltip);
    }
  }
  
  hideCustomTooltip(icon) {
    const wrapper = icon.closest('.wifi-tooltip-wrapper');
    if (wrapper) {
      const tooltip = wrapper.querySelector('.custom-wifi-tooltip');
      if (tooltip) {
        tooltip.remove();
      }
    }
  }
  
  updateCustomTooltip(icon) {
    const wrapper = icon.closest('.wifi-tooltip-wrapper');
    if (wrapper) {
      const tooltip = wrapper.querySelector('.custom-wifi-tooltip');
      if (tooltip) {
        tooltip.innerHTML = this.getTooltipContent();
      }
    }
  }
  
  setupNetworkMonitoring() {
    // Check initial online status
    this.isOnline = navigator.onLine;
    this.updateAllIcons();
    
    // Setup offline/online event listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateStrength(2, 0);
      this.getUserNetworkInfo();
      this.measureNetworkQuality();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateStrength(1, 999);
      this.updateAllIcons();
    });
    
    // Monitor connection info changes
    const connectionInfo = navigator.connection || 
                           navigator.mozConnection || 
                           navigator.webkitConnection;
    
    if (connectionInfo) {
      connectionInfo.addEventListener('change', () => {
        if (this.isOnline) {
          this.getUserNetworkInfo();
          this.measureNetworkQuality();
        }
      });
    }
    
    // Start regular quality checks if online
    if (this.isOnline) {
      this.measureNetworkQuality();
      
      setInterval(() => {
        if (this.isOnline) {
          this.measureNetworkQuality();
        }
      }, 5000);
    }
    
    // Verify connection status regularly
    setInterval(() => {
      const currentOnline = navigator.onLine;
      if (this.isOnline !== currentOnline) {
        this.isOnline = currentOnline;
        this.updateAllIcons();
        
        if (this.isOnline) {
          this.getUserNetworkInfo();
          this.measureNetworkQuality();
        }
      }
    }, 2000);
  }

  async measureNetworkQuality() {
    if (!this.isOnline) return;
    
    try {
      // Start timing for ping
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Use a random URL parameter to avoid caching
      const response = await fetch('/api/health/ping?' + Date.now(), {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        this.updateStrength(2, 500);
        return;
      }
      
      // Calculate client-side round-trip latency
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      // Update strength based on actual measured latency
      this.updateStrengthFromLatency(latency);
      
      // Get additional connection info from browser API if available
      const connectionInfo = navigator.connection || 
                             navigator.mozConnection || 
                             navigator.webkitConnection;
                             
      if (connectionInfo) {
        this.effectiveType = connectionInfo.effectiveType || 'unknown';
        this.downlink = connectionInfo.downlink || 0;
        
        // Adjust strength based on connection type
        if (connectionInfo.downlink < 1) {
          this.updateStrength(Math.min(this.strength, 2), latency);
        }
        
        if (connectionInfo.effectiveType === '2g') {
          this.updateStrength(1, latency);
        } else if (connectionInfo.effectiveType === '3g') {
          this.updateStrength(Math.min(this.strength, 3), latency);
        }
      }
    } catch (error) {
      console.error('Error measuring network quality:', error);
      
      if (error.name === 'AbortError') {
        this.updateStrength(1, 999);
      } else {
        this.updateStrength(2, 500);
      }
    }
  }
  
  updateStrengthFromLatency(latency) {
    if (latency < 100) {
      this.updateStrength(4, latency);
    } else if (latency < 300) {
      this.updateStrength(3, latency);
    } else if (latency < 600) {
      this.updateStrength(2, latency);
    } else {
      this.updateStrength(1, latency);
    }
  }
}

const wifiStrength = new WiFiStrength();
window.wifiStrength = wifiStrength;

export default wifiStrength;
