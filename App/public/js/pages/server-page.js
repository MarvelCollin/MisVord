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

    
    const mainLayoutContainer = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
    if (mainLayoutContainer && mainLayoutContainer.getAttribute('data-skeleton') === 'server') {

        return;
    }
    
    try {

        
    } catch (error) {
        console.error('[Server Page] Error loading server content:', error);
    }
}

function getServerIdFromURL() {
    const match = window.location.pathname.match(/\/server\/(\d+)/);
    return match ? match[1] : null;
}

async function initializeServerComponents() {

    
    const mainLayoutContainer = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
    if (mainLayoutContainer && mainLayoutContainer.getAttribute('data-skeleton') === 'server') {

        return;
    }
    
    try {
        if (!window.initializeServerPage) {
            const module = await import('../utils/server-initializer.js');
            window.initializeServerPage = module.initializeServerPage;
        }
        
        await window.initializeServerPage();

    } catch (error) {
        console.error('[Server Page] ❌ Server initialization failed:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {

    
    initializeServerComponents();
    
    loadServerContent();
    

});

function initializeServerModals() {
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

};

function setupPopStateListener() {
    window.removeEventListener('popstate', handlePopState);
    window.addEventListener('popstate', handlePopState);
}

function handlePopState(event) {
  const state = event.state;

  if (state && state.channelId) {

    
    if (window.simpleChannelSwitcher) {
      const channelType = state.channelType || 'text';
      window.simpleChannelSwitcher.switchToChannel(state.channelId, channelType);
    } else {
      console.error('SimpleChannelSwitcher not available for popstate handling');
    }
  }
}

function setupChannelListObserver() {

  
  let channelListContainer = document.querySelector('.channel-list-container');
  
  if (!channelListContainer) {

    channelListContainer = document.querySelector('.channel-wrapper');
  }
  
  if (!channelListContainer) {

    
    const possibleContainers = [
      document.querySelector('.channel-list'),
      document.querySelector('[data-server-id]'),
      document.querySelector('div:has(.channel-item)'),
      document.querySelector('div:has([data-channel-id])')
    ];
    
    channelListContainer = possibleContainers.find(container => container !== null);
  }
  
  if (!channelListContainer) {

    
    setTimeout(() => {

      setupChannelListObserver();
    }, 2000);
    
    return;
  }
  

  
  if (window.channelListObserver) {

    window.channelListObserver.disconnect();
  }
  
  window.channelListObserverProcessing = false;
  
  const observer = new MutationObserver(function(mutations) {
    if (window.channelListObserverProcessing) {

      return;
    }
    
    window.channelListObserverProcessing = true;
    
    try {

      
      if (window.channelHandlersInitialized) {

      } else {

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


window.getServerIdFromURL = getServerIdFromURL;

window.isServerPageReady = function() {
  return typeof window.SimpleChannelSwitcher === 'function';
};

window.ensureServerPageLoaded = function() {
  return new Promise((resolve) => {
    if (window.isServerPageReady()) {
      resolve();
    } else {

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

  
  const mainLayoutContainer = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
  if (mainLayoutContainer && mainLayoutContainer.getAttribute('data-skeleton') === 'server') {

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

    
    try {

        initializeServerComponents();
        

        loadServerContent();
        

        setupPopStateListener();
        setupChannelListObserver();
        

        coordinateSystemInitialization();
        

        initializeServerModals();
        

        
    } catch (error) {
        console.error('[Server Page] Error during server initialization:', error);
    }
}

function coordinateSystemInitialization() {

    
    document.addEventListener('ServerChanged', function(event) {

        
        setTimeout(() => {
            if (window.voiceManager && !window.voiceManager.initialized) {

                window.voiceManager.init().catch(error => {
                    console.warn('[Server Page] Voice manager initialization failed:', error);
                });
            }
            
            if (!window.chatSection && typeof window.initializeChatSection === 'function') {

                window.initializeChatSection();
            }
        }, 100);
    }, { once: true });
    
    setTimeout(() => {
        if (window.globalVoiceIndicator && window.globalVoiceIndicator.forceUpdateIndicator) {
            window.globalVoiceIndicator.forceUpdateIndicator();
        }
        
        if (window.chatSection && window.chatSection.targetId && window.chatSection.mentionHandler) {
            window.chatSection.mentionHandler.init();
        }
    }, 1000);
}

function initializeBotSystems() {

    
    if (window.chatSection && window.chatSection.chatBot) {

        return;
    }
    
    if (typeof window.BotComponent === 'function' && !window.botComponent) {

        try {
            window.botComponent = new window.BotComponent();

        } catch (error) {
            console.error('[Server Page] Error initializing bot component:', error);
        }
    }
    
    const serverIdMeta = document.querySelector('meta[name="server-id"]');
    if (serverIdMeta && window.globalSocketManager?.isReady()) {
        const serverId = serverIdMeta.content;

        
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
