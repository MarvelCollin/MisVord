import { pageUtils } from '../utils/page-utils.js';
import ChannelSwitchManager from '../utils/channel-switch-manager.js';

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
      console.log("Loading VideoSDK from CDN");
      await loadScript('https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js');
      console.log("VideoSDK loaded successfully");
    }
    
    if (!window.videoSDKManager) {
      console.log("Loading VideoSDK manager");
      await loadScript('/public/js/components/videosdk/videosdk.js?v=' + Date.now());
      console.log("VideoSDK manager loaded successfully");
    }
    
    console.log("Loading voice manager");
    await loadScript('/public/js/components/voice/voice-manager.js?v=' + Date.now());
    console.log("Voice manager loaded successfully");
    
    return true;
  } catch (error) {
    console.error("Error loading voice scripts:", error);
    return false;
  }
}

async function loadServerContent() {
    console.log('[Server Page] Loading server content');
    
    try {
        // Initialize channel switching
        if (!window.channelSwitchManager) {
            window.channelSwitchManager = new ChannelSwitchManager();
            console.log('[Server Page] Channel switch manager created');
        } else {
            console.log('[Server Page] Using existing channel switch manager');
            // Reinitialize current channel if manager already exists
            window.channelSwitchManager.initializeCurrentChannel();
        }
        
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
    
    if (typeof window.initializeServerDropdown === 'function') {
        window.initializeServerDropdown();
    }
    
    if (typeof window.initializeChannelManager === 'function') {
        window.initializeChannelManager();
    }
    
    if (typeof window.initializeChatSection === 'function') {
        window.initializeChatSection();
    }
    
    if (typeof window.initializeParticipantSection === 'function') {
        window.initializeParticipantSection();
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

function initializeChannelManager() {
    if (!window.channelSwitchManager) {
        window.channelSwitchManager = new ChannelSwitchManager();
        console.log('[Server Page] Channel switch manager initialized');
    }
}

function getServerIdFromUrl() {
    const path = window.location.pathname;
    const matches = path.match(/\/server\/(\d+)/);
    return matches && matches[1] ? matches[1] : null;
}

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
                    <img src="${member.avatar_url || '/public/assets/common/default-profile-picture.png'}" alt="${member.username}" class="w-full h-full object-cover">
                </div>
                <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-discord-dark ${statusClass}"></span>
            </div>
            <div>
                <div class="text-sm font-medium ${member.role === 'owner' ? 'text-yellow-300' : member.role === 'admin' ? 'text-red-400' : 'text-white'}">${member.username}</div>
                <div class="text-xs text-discord-lighter">${member.status || 'offline'}</div>
            </div>
        </div>
    `;
}

function handleSkeletonLoading(show) {
  const mainContent = document.querySelector('.flex-1');
  
  if (!mainContent) return;
  
  if (typeof window.toggleChannelLoading === 'function') {
    console.log("Skipping channel loading toggle to prevent reload");
  }
  
  if (typeof window.toggleParticipantLoading === 'function') {
    window.toggleParticipantLoading(show);
  }
  
  if (show) {
    const contentPart = mainContent.querySelector('.flex-grow, .flex-1');
    if (contentPart) {
      console.log("Adding skeleton loader to content part only");
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
    
    // Use ChannelSwitchManager instead of fetch functions
    if (window.channelSwitchManager) {
      const serverId = getServerIdFromUrl();
      const channelType = state.channelType || 'text';
      window.channelSwitchManager.switchToChannel(serverId, state.channelId, channelType, null, false);
    } else {
      console.error('ChannelSwitchManager not available for popstate handling');
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
        console.log("Channel switching is handled by ChannelSwitchManager");
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

function updateChatMetaTags(channelId) {
  console.log(`Updating chat meta tags for channel ID: ${channelId}`);
  
  let chatIdMeta = document.querySelector('meta[name="chat-id"]');
  if (chatIdMeta) {
    console.log(`Updating existing chat-id meta tag to: ${channelId}`);
    chatIdMeta.setAttribute('content', channelId);
  } else {
    console.log(`Creating new chat-id meta tag with value: ${channelId}`);
    chatIdMeta = document.createElement('meta');
    chatIdMeta.setAttribute('name', 'chat-id');
    chatIdMeta.setAttribute('content', channelId);
    document.head.appendChild(chatIdMeta);
  }
  
  let channelIdMeta = document.querySelector('meta[name="channel-id"]');
  if (channelIdMeta) {
    console.log(`Updating existing channel-id meta tag to: ${channelId}`);
    channelIdMeta.setAttribute('content', channelId);
  } else {
    console.log(`Creating new channel-id meta tag with value: ${channelId}`);
    channelIdMeta = document.createElement('meta');
    channelIdMeta.setAttribute('name', 'channel-id');
    channelIdMeta.setAttribute('content', channelId);
    document.head.appendChild(channelIdMeta);
  }
  
  if (window.chatSection) {
    console.log("Force-updating existing chat section with new channel ID");
    window.chatSection.targetId = channelId;
    
    if (window.chatSection.chatMessages) {
      console.log("Clearing existing chat messages");
      window.chatSection.chatMessages.innerHTML = '';
      window.chatSection.messagesLoaded = false;
      window.chatSection.loadMessages();
    } else {
      console.log("Chat messages element not found, cannot clear messages");
    }
  } else {
    console.log("No chat section instance found, meta tags updated for next initialization");
  }
}

function initVoicePage() {
  console.log("Initializing voice page");
  
  const channelItems = document.querySelectorAll('.channel-item');
  if (channelItems.length > 0) {
    console.log(`Found ${channelItems.length} channel items in voice page`);
    initializeChannelClickHandlers();
  } else {
    console.log("No channel items found in voice page");
  }
  
  if (!window.VideoSDK && !document.querySelector('script[src*="videosdk.js"]')) {
    console.log("Loading VideoSDK script for voice page");
    const script = document.createElement('script');
    script.src = 'https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js';
    script.onload = () => {
      console.log("VideoSDK loaded, now loading VideoSDK manager");
      if (!window.videoSDKManager && !document.querySelector('script[src*="/videosdk/videosdk.js"]')) {
        const managerScript = document.createElement('script');
        managerScript.src = '/public/js/components/videosdk/videosdk.js?v=' + Date.now();
        managerScript.onload = () => {
          console.log("VideoSDK manager loaded for voice page");
          if (!window.voiceManager && !document.querySelector('script[src*="voice-manager.js"]')) {
            console.log("Loading voice manager script for voice page");
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
    console.log("Loading VideoSDK manager script for voice page");
    const managerScript = document.createElement('script');
    managerScript.src = '/public/js/components/videosdk/videosdk.js?v=' + Date.now();
    managerScript.onload = () => {
      console.log("VideoSDK manager loaded for voice page");
      if (!window.voiceManager && !document.querySelector('script[src*="voice-manager.js"]')) {
        console.log("Loading voice manager script for voice page");
        const voiceScript = document.createElement('script');
        voiceScript.src = '/public/js/components/voice/voice-manager.js?v=' + Date.now();
        document.head.appendChild(voiceScript);
      }
    };
    document.head.appendChild(managerScript);
  } else if (!window.voiceManager && !document.querySelector('script[src*="voice-manager.js"]')) {
    console.log("Loading voice manager script for voice page");
    const voiceScript = document.createElement('script');
    voiceScript.src = '/public/js/components/voice/voice-manager.js?v=' + Date.now();
    document.head.appendChild(voiceScript);
  }
}

window.fetchVoiceSection = fetchVoiceSection;
window.fetchChatSection = fetchChatSection;
window.initializeChannelClickHandlers = initializeChannelClickHandlers;
window.getServerIdFromUrl = getServerIdFromUrl;

window.isServerPageReady = function() {
  return typeof window.fetchVoiceSection === 'function' && 
         typeof window.fetchChatSection === 'function';
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
  
  try {
    initializeServerComponents();
    loadServerContent();
    setupPopStateListener();
    setupChannelListObserver();
    initializeServerModals();
    
    console.log('[Server Page] Server page initialization completed');
  } catch (error) {
    console.error('[Server Page] Error during server page initialization:', error);
  }
}

window.initServerPage = initServerPage;
