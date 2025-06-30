import { pageUtils } from '../utils/page-utils.js';

function loadScript(src, type = '', async = false) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    if (type) script.type = type;
    if (async) script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function loadVoiceScripts() {
  try {
    if (!window.VideoSDK) {
      await loadScript('https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js');
    }
    
    if (!window.videoSDKManager) {
      await loadScript('/public/js/components/videosdk/videosdk.js?v=' + Date.now());
    }
    
    await loadScript('/public/js/components/voice/voice-manager.js?v=' + Date.now());
    
    return true;
  } catch (error) {
    return false;
  }
}

async function loadServerContent() {
    console.log('[Server Page] Loading server content');
    
    const mainLayoutContainer = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
    if (mainLayoutContainer && mainLayoutContainer.getAttribute('data-skeleton') === 'server') {
        console.log('[Server Page] Skeleton loading active, deferring server content loading');
        return;
    }
    
    try {
        console.log('[Server Page] Server content initialization completed');
        
    } catch (error) {
        console.error('[Server Page] Error loading server content:', error);
    }
}

function getServerIdFromURL() {
    const match = window.location.pathname.match(/\/server\/(\d+)/);
    return match ? match[1] : null;
}

function initializeServerComponents() {
    console.log('[Server Page] Initializing server components');
    
    const mainLayoutContainer = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
    if (mainLayoutContainer && mainLayoutContainer.getAttribute('data-skeleton') === 'server') {
        console.log('[Server Page] Skeleton loading active, deferring server components initialization');
        return;
    }
    
    console.log('[Server Page] Initializing server dropdown');
    if (typeof window.initializeServerDropdown === 'function') {
        try {
            window.initializeServerDropdown();
            console.log('[Server Page] ✅ Server dropdown initialized');
        } catch (error) {
            console.error('[Server Page] Error initializing server dropdown:', error);
        }
    } else if (typeof window.initServerDropdown === 'function') {
        try {
            window.initServerDropdown();
            console.log('[Server Page] ✅ Server dropdown initialized (fallback)');
        } catch (error) {
            console.error('[Server Page] Error initializing server dropdown (fallback):', error);
        }
    } else {
        console.warn('[Server Page] No server dropdown function available');
    }
    
    console.log('[Server Page] Initializing chat section');
    if (typeof window.initializeChatSection === 'function') {
        try {
            window.initializeChatSection();
            console.log('[Server Page] ✅ Chat section initialized');
        } catch (error) {
            console.error('[Server Page] Error initializing chat section:', error);
        }
    } else {
        console.warn('[Server Page] initializeChatSection function not available');
    }
    
    console.log('[Server Page] Initializing participant section');
    if (typeof window.initializeParticipantSection === 'function') {
        try {
            window.initializeParticipantSection();
            console.log('[Server Page] ✅ Participant section initialized');
        } catch (error) {
            console.error('[Server Page] Error initializing participant section:', error);
        }
    } else {
        console.warn('[Server Page] initializeParticipantSection function not available');
    }
    
    console.log('[Server Page] Server components initialized');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Server Page] DOM loaded, initializing server page');
    
    // Initialize server components
    initializeServerComponents();
    
    // Load server content (without AJAX)
    loadServerContent();
    
    console.log('[Server Page] Server page initialization complete');
});

function initializeServerModals() {
  const createServerBtn = document.querySelector(
    '[data-action="create-server"]'
  );
  const modal = document.getElementById("create-server-modal");
  const closeBtn = document.getElementById("close-server-modal");

  if (createServerBtn && modal) {
    createServerBtn.addEventListener("click", function (e) {
      e.preventDefault();
      modal.classList.remove("hidden");
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", function () {
      modal.classList.add("hidden");
    });
  }

  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  }
}

function renderMemberItem(member) {
    const statusClass = getStatusClass(member.status || 'offline');
    
    return `
        <div class="member-item flex items-center p-2 rounded hover:bg-discord-light cursor-pointer">
            <div class="relative mr-3">
                <div class="w-8 h-8 rounded-full bg-discord-light overflow-hidden user-profile-trigger" data-user-id="${member.id}" data-server-id="${getCurrentServerId()}">
                                            <img src="${member.avatar_url || '/public/assets/common/default-profile-picture.png'}" alt="${member.display_name || member.username}" class="w-full h-full object-cover">
                </div>
                <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark ${statusClass}"></span>
            </div>
            <div>
                                    <div class="text-sm font-medium ${member.role === 'owner' ? 'text-yellow-300' : member.role === 'admin' ? 'text-red-400' : 'text-white'}">${member.display_name || member.username}</div>
                <div class="text-xs text-discord-lighter">${member.status || 'offline'}</div>
            </div>
        </div>
    `;
}

function handleSkeletonLoading(show) {
  console.log('[Server Page] Legacy skeleton loading called, delegating to new system');
  
  if (show && typeof window.handleServerSkeletonLoading === 'function') {
    window.handleServerSkeletonLoading(true);
  } else if (!show && typeof window.hideServerSkeletonLoading === 'function') {
    window.hideServerSkeletonLoading();
  } else {
    console.warn('[Server Page] New skeleton loading system not available, using fallback');
    const mainContent = document.querySelector('.flex-1');
    
    if (!mainContent) return;
    
    if (show) {
      const contentPart = mainContent.querySelector('.flex-grow, .flex-1');
      if (contentPart) {
        const skeletonTemplate = `
          <div class="chat-skeleton flex-grow bg-discord-background flex flex-col">
            <div class="h-12 border-b border-discord-600 px-4 flex items-center">
              <div class="h-5 bg-gray-700 rounded w-32 animate-pulse"></div>
              <div class="ml-auto flex space-x-4">
                ${Array(3).fill().map(() => `
                  <div class="h-6 w-6 bg-gray-700 rounded-full animate-pulse"></div>
                `).join('')}
              </div>
            </div>
            
            <div class="flex-grow p-4 overflow-y-auto">
              ${Array(8).fill().map(() => `
                <div class="flex mb-6">
                  <div class="h-10 w-10 bg-gray-700 rounded-full mr-3 flex-shrink-0 animate-pulse"></div>
                  <div class="flex-grow">
                    <div class="flex items-center mb-1">
                      <div class="h-4 bg-gray-700 rounded w-24 mr-2 animate-pulse"></div>
                      <div class="h-3 bg-gray-700 rounded w-16 animate-pulse opacity-75"></div>
                    </div>
                    <div class="h-4 bg-gray-700 rounded w-full mb-1 animate-pulse"></div>
                    <div class="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <div class="p-4 border-t border-discord-600">
              <div class="h-10 bg-gray-700 rounded-lg w-full animate-pulse"></div>
          </div>
        </div>
      `;
      
        contentPart.innerHTML = skeletonTemplate;
        contentPart.classList.add('loading');
      }
    } else {
      const contentPart = mainContent.querySelector('.flex-grow, .flex-1');
      if (contentPart) {
        contentPart.classList.remove('loading');
      }
    }
  }
}

window.handleSkeletonLoading = handleSkeletonLoading;

window.toggleChannelLoading = function(loading) {
  console.log("Channel loading toggle prevented to avoid channel section reload");
};

function setupPopStateListener() {
    window.removeEventListener('popstate', handlePopState);
    window.addEventListener('popstate', handlePopState);
}

function handlePopState(event) {
  const state = event.state;

  if (state && state.channelId) {
    console.log("Handling popstate event for channel:", state.channelId);
    
    if (window.simpleChannelSwitcher) {
      const channelType = state.channelType || 'text';
      window.simpleChannelSwitcher.switchToChannel(state.channelId, channelType);
    } else {
      console.error('SimpleChannelSwitcher not available for popstate handling');
    }
  }
}

function setupChannelListObserver() {
  console.log("Setting up channel list observer");
  
  let channelListContainer = document.querySelector('.channel-list-container');
  
  if (!channelListContainer) {
    console.log("Could not find .channel-list-container, trying alternative selectors");
    channelListContainer = document.querySelector('.channel-wrapper');
  }
  
  if (!channelListContainer) {
    console.log("Could not find channel list container with standard selectors");
    
    const possibleContainers = [
      document.querySelector('.channel-list'),
      document.querySelector('[data-server-id]'),
      document.querySelector('div:has(.channel-item)'),
      document.querySelector('div:has([data-channel-id])')
    ];
    
    channelListContainer = possibleContainers.find(container => container !== null);
  }
  
  if (!channelListContainer) {
    console.log("Could not find any suitable channel list container, will retry later");
    
    setTimeout(() => {
      console.log("Retrying channel list observer setup");
      setupChannelListObserver();
    }, 2000);
    
    return;
  }
  
  console.log("Found channel list container:", channelListContainer);
  
  if (window.channelListObserver) {
    console.log("Channel list observer already exists, disconnecting");
    window.channelListObserver.disconnect();
  }
  
  window.channelListObserverProcessing = false;
  
  const observer = new MutationObserver(function(mutations) {
    if (window.channelListObserverProcessing) {
      console.log("Observer processing in progress, skipping");
      return;
    }
    
    window.channelListObserverProcessing = true;
    
    try {
      console.log("Channel list mutation detected");
      
      if (window.channelHandlersInitialized) {
        console.log("Channel click handlers already initialized, skipping");
      } else {
        console.log("Channel switching is handled by SimpleChannelSwitcher");
        window.channelHandlersInitialized = true;
      }
    } finally {
      window.channelListObserverProcessing = false;
    }
  });
  
  observer.observe(channelListContainer, {
    childList: true,
    subtree: true
  });
  
  window.channelListObserver = observer;
  console.log("Channel list observer set up");
}

function initVoicePage() {
  const channelItems = document.querySelectorAll('.channel-item');
  if (channelItems.length > 0) {
  }
  
  if (!window.VideoSDK && !document.querySelector('script[src*="videosdk.js"]')) {
    const script = document.createElement('script');
    script.src = 'https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js';
    script.onload = () => {
      if (!window.videoSDKManager && !document.querySelector('script[src*="/videosdk/videosdk.js"]')) {
        const managerScript = document.createElement('script');
        managerScript.src = '/public/js/components/videosdk/videosdk.js?v=' + Date.now();
        managerScript.onload = () => {
          if (!window.voiceManager && !document.querySelector('script[src*="voice-manager.js"]')) {
            const voiceScript = document.createElement('script');
            voiceScript.src = '/public/js/components/voice/voice-manager.js?v=' + Date.now();
            document.head.appendChild(voiceScript);
          }
        };
        document.head.appendChild(managerScript);
      }
    };
    document.head.appendChild(script);
  } else if (!window.videoSDKManager && !document.querySelector('script[src*="/videosdk/videosdk.js"]')) {
    const managerScript = document.createElement('script');
    managerScript.src = '/public/js/components/videosdk/videosdk.js?v=' + Date.now();
    managerScript.onload = () => {
      if (!window.voiceManager && !document.querySelector('script[src*="voice-manager.js"]')) {
        const voiceScript = document.createElement('script');
        voiceScript.src = '/public/js/components/voice/voice-manager.js?v=' + Date.now();
        document.head.appendChild(voiceScript);
      }
    };
    document.head.appendChild(managerScript);
  } else if (!window.voiceManager && !document.querySelector('script[src*="voice-manager.js"]')) {
    const voiceScript = document.createElement('script');
    voiceScript.src = '/public/js/components/voice/voice-manager.js?v=' + Date.now();
    document.head.appendChild(voiceScript);
  }
}

// These functions are now handled by SimpleChannelSwitcher
window.getServerIdFromURL = getServerIdFromURL;

window.isServerPageReady = function() {
  return typeof window.SimpleChannelSwitcher === 'function';
};

window.ensureServerPageLoaded = function() {
  return new Promise((resolve) => {
    if (window.isServerPageReady()) {
      resolve();
    } else {
      console.log('⏳ Waiting for server-page.js to be ready...');
      const checkInterval = setInterval(() => {
        if (window.isServerPageReady()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    }
  });
};

function initServerPage() {
  console.log('[Server Page] Initializing server page');
  
  const mainLayoutContainer = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
  if (mainLayoutContainer && mainLayoutContainer.getAttribute('data-skeleton') === 'server') {
    console.log('[Server Page] Skeleton loading active, deferring server page initialization');
    document.addEventListener('ServerChanged', function() {
      setTimeout(() => {
        performDelayedServerInitialization();
      }, 100);
    }, { once: true });
    return;
  }
  
  performDelayedServerInitialization();
}

function performDelayedServerInitialization() {
    console.log('[Server Page] Performing delayed server initialization');
    
    try {
        console.log('[Server Page] Step 1: Initialize server components');
        initializeServerComponents();
        
        console.log('[Server Page] Step 2: Load server content');
        loadServerContent();
        
        console.log('[Server Page] Step 3: Setup navigation listeners');
        setupPopStateListener();
        setupChannelListObserver();
        
        console.log('[Server Page] Step 4: Coordinate with system initializers');
        coordinateSystemInitialization();
        
        console.log('[Server Page] Step 5: Initialize server modals');
        initializeServerModals();
        
        console.log('[Server Page] Server initialization completed successfully');
        
    } catch (error) {
        console.error('[Server Page] Error during server initialization:', error);
    }
}

function coordinateSystemInitialization() {
    console.log('[Server Page] Coordinating with voice and chat systems');
    
    document.addEventListener('ServerChanged', function(event) {
        console.log('[Server Page] ServerChanged event received:', event.detail);
        
        setTimeout(() => {
            if (window.voiceManager && !window.voiceManager.initialized) {
                console.log('[Server Page] Re-initializing voice manager after server change');
                window.voiceManager.init().catch(error => {
                    console.warn('[Server Page] Voice manager initialization failed:', error);
                });
            }
            
            if (!window.chatSection && typeof window.initializeChatSection === 'function') {
                console.log('[Server Page] Ensuring chat section is initialized after server change');
                window.initializeChatSection();
            }
        }, 100);
    }, { once: true });
    
    setTimeout(() => {
        if (window.globalVoiceIndicator && window.globalVoiceIndicator.forceUpdateIndicator) {
            window.globalVoiceIndicator.forceUpdateIndicator();
        }
        
        if (window.chatSection && window.chatSection.targetId && window.chatSection.mentionHandler) {
            window.chatSection.mentionHandler.loadAvailableUsers();
        }
    }, 1000);
}

function initializeBotSystems() {
    console.log('[Server Page] Initializing bot systems');
    
    if (window.chatSection && window.chatSection.chatBot) {
        console.log('[Server Page] Chat bot already available in chat section');
        return;
    }
    
    if (typeof window.BotComponent === 'function' && !window.botComponent) {
        console.log('[Server Page] Creating bot component');
        try {
            window.botComponent = new window.BotComponent();
            console.log('[Server Page] ✅ Bot component initialized');
        } catch (error) {
            console.error('[Server Page] Error initializing bot component:', error);
        }
    }
    
    const serverIdMeta = document.querySelector('meta[name="server-id"]');
    if (serverIdMeta && window.globalSocketManager?.isReady()) {
        const serverId = serverIdMeta.content;
        console.log('[Server Page] Ensuring bot initialization for server:', serverId);
        
        setTimeout(() => {
            if (window.globalSocketManager.isReady()) {
                window.globalSocketManager.io.emit('server-bot-status', {
                    server_id: serverId
                });
            }
        }, 1000);
    }
}

window.initServerPage = initServerPage;
