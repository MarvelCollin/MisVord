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

document.addEventListener('DOMContentLoaded', function() {
    console.log('[Server Page] DOM Content Loaded');
    
    if (window.location.pathname.includes('/server/')) {
        initServerPage();
    }
});

function initServerPage() {
    console.log('[Server Page] Initializing server page');
  
  // Add global error handler for VideoSDK
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message && (
      event.error.message.includes('VideoSDK') ||
      event.error.message.includes('Cannot read properties of undefined') ||
      event.error.message.includes('kind') ||
      event.error.message.includes('stream')
    )) {
      console.warn('Server page caught VideoSDK error:', event.error.message);
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);
    
    initializeChannelManager();
    setupPopStateListener();
    
    if (window.globalSocketManager) {
        console.log('[Server Page] Global socket manager available');
    } else {
        console.log('[Server Page] Waiting for global socket manager...');
        setTimeout(() => {
            if (window.globalSocketManager) {
                console.log('[Server Page] Global socket manager loaded');
            }
        }, 1000);
    }
}

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

function initializeChannelClickHandlers() {
  console.log("Initializing channel click handlers from server-page.js");
  
  window.channelHandlersInitialized = false;
  
  const channelItems = document.querySelectorAll('.channel-item');
  console.log(`Found ${channelItems.length} channel items`);

  if (window.refreshChannelHandlers) {
    console.log("Channel handlers managed by channel-section.php");
    return;
  }

  channelItems.forEach(item => {
    const newItem = item.cloneNode(true);
    item.parentNode.replaceChild(newItem, item);
    
    newItem.addEventListener('click', function(e) {
      e.preventDefault();
      console.log("Channel item clicked");
      
      if (newItem.classList.contains('active-channel')) {
        console.log("Channel already active, skipping");
        return;
      }
      
      const channelId = newItem.getAttribute('data-channel-id');
      const channelType = newItem.getAttribute('data-channel-type');
      const serverId = getServerIdFromUrl();
      
      console.log(`Channel clicked: ID=${channelId}, Type=${channelType}, Server=${serverId}`);
      
      const currentActiveChannel = document.querySelector('.channel-item.active-channel');
      const currentChannelType = currentActiveChannel ? currentActiveChannel.getAttribute('data-channel-type') : null;
      
      console.log(`Switching from channel type: ${currentChannelType} to: ${channelType}`);
      
      if (currentChannelType !== channelType) {
        console.log("Channel type is changing, cleaning up previous channel type");
        
        if (currentChannelType === 'voice') {
          console.log("Switching from voice to text channel, cleaning up voice components");
          if (window.voiceManager) {
            console.log("Cleaning up voice manager");
            window.voiceManager = null;
          }
        }
        
        if (currentChannelType === 'text') {
          console.log("Switching from text to voice channel, cleaning up chat components");
          if (window.chatSection) {
            console.log("Destroying chat section");
            window.chatSection = null;
          }
        }
      }
      
      handleSkeletonLoading(true);
      
      if (channelType === 'text') {
        updateChatMetaTags(channelId);
      }
      
      document.querySelectorAll('.channel-item').forEach(ch => {
        ch.classList.remove('active-channel');
      });
      
      newItem.classList.add('active-channel');
      
      const newUrl = `/server/${serverId}?channel=${channelId}&type=${channelType}`;
      history.pushState({ channelId, channelType, serverId }, '', newUrl);
      
      if (channelType === 'text') {
        fetchChatSection(channelId);
      } else if (channelType === 'voice') {
        fetchVoiceSection(channelId);
      }
    });
  });
  
  window.channelHandlersInitialized = true;
}

function fetchChatSection(channelId) {
  console.log(`💬 fetchChatSection called with channelId: ${channelId}`);
  const apiUrl = `/api/chat/render/channel/${channelId}`;
  console.log(`Fetching from URL: ${apiUrl}`);
  
  fetch(apiUrl)
    .then(response => {
      console.log(`Response received, status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`Failed to load chat section: ${response.status} ${response.statusText}`);
      }
      return response.text();
    })
    .then(html => {
      console.log(`Received HTML content (length: ${html.length})`);
      
      const centralContentArea = document.querySelector('#main-content > .flex.flex-col.flex-1, #main-content > .flex.flex-col.h-screen');
      
      if (centralContentArea) {
        console.log("Found central content area, replacing only this section");
        
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = html;
        
        const chatIdMeta = tempContainer.querySelector('meta[name="chat-id"]');
        const channelIdMeta = tempContainer.querySelector('meta[name="channel-id"]');
        
        if (chatIdMeta) {
          console.log(`Found chat-id meta tag with value: ${chatIdMeta.getAttribute('content')}`);
          let docChatIdMeta = document.querySelector('meta[name="chat-id"]');
          if (docChatIdMeta) {
            console.log(`Updating existing chat-id meta tag to: ${channelId}`);
            docChatIdMeta.setAttribute('content', channelId);
          } else {
            console.log(`Creating new chat-id meta tag with value: ${channelId}`);
            docChatIdMeta = document.createElement('meta');
            docChatIdMeta.setAttribute('name', 'chat-id');
            docChatIdMeta.setAttribute('content', channelId);
            document.head.appendChild(docChatIdMeta);
          }
        }
        
        if (channelIdMeta) {
          console.log(`Found channel-id meta tag with value: ${channelIdMeta.getAttribute('content')}`);
          let docChannelIdMeta = document.querySelector('meta[name="channel-id"]');
          if (docChannelIdMeta) {
            console.log(`Updating existing channel-id meta tag to: ${channelId}`);
            docChannelIdMeta.setAttribute('content', channelId);
          } else {
            console.log(`Creating new channel-id meta tag with value: ${channelId}`);
            docChannelIdMeta = document.createElement('meta');
            docChannelIdMeta.setAttribute('name', 'channel-id');
            docChannelIdMeta.setAttribute('content', channelId);
            document.head.appendChild(docChannelIdMeta);
          }
        }
        
        const chatContainer = tempContainer.querySelector('.flex.flex-col.flex-1.h-screen.chat-container, .flex.flex-col.flex-1');
        
        if (chatContainer) {
          console.log("Found chat container in response, updating center content only");
          centralContentArea.replaceWith(chatContainer);
        } else {
          console.log("No specific chat container found, using full HTML for center section only");
          centralContentArea.innerHTML = html;
        }
        
        handleSkeletonLoading(false);
        
        if (window.chatSection) {
          console.log("Destroying existing chat section before creating a new one");
          window.chatSection = null;
        }
        
        console.log("Creating new ChatSection instance for channel: " + channelId);
        
        if (typeof ChatSection !== 'undefined') {
          console.log("ChatSection class already exists, creating new instance");
          const chatSection = new ChatSection();
          chatSection.init();
          window.chatSection = chatSection;
        } else {
          console.log("ChatSection class not found, checking for script in response");
          
          const scriptTags = tempContainer.querySelectorAll('script');
          let chatSectionScriptFound = false;
          
          scriptTags.forEach(script => {
            if (script.src && script.src.includes('chat-section.js')) {
              console.log("Found chat-section.js script in response, using it");
              chatSectionScriptFound = true;
              
              const newScript = document.createElement('script');
              newScript.src = script.src;
              newScript.onload = () => {
                console.log("Chat section script loaded from response");
                if (typeof ChatSection !== 'undefined') {
                  const chatSection = new ChatSection();
                  chatSection.init();
                  window.chatSection = chatSection;
                }
              };
              document.head.appendChild(newScript);
            }
          });
          
          if (!chatSectionScriptFound) {
            console.log("No chat-section.js script found in response, creating ChatSection manually");
            
            window.ChatSection = window.ChatSection || class ChatSection {
              constructor() {
                this.chatType = null;
                this.targetId = null;
                this.chatMessages = null;
              }
              
              init() {
                console.log("Initializing basic ChatSection");
                this.loadElements();
                this.loadChatParams();
                
                if (this.chatMessages && this.targetId) {
                  this.loadMessages();
                }
              }
              
              loadElements() {
                this.chatMessages = document.getElementById('chat-messages');
                this.messageForm = document.getElementById('message-form');
                this.messageInput = document.getElementById('message-input');
              }
              
              loadChatParams() {
                this.chatType = document.querySelector('meta[name="chat-type"]')?.content || 'channel';
                this.targetId = document.querySelector('meta[name="chat-id"]')?.content;
                this.userId = document.querySelector('meta[name="user-id"]')?.content;
                this.username = document.querySelector('meta[name="username"]')?.content;
                
                console.log(`Chat parameters loaded: type=${this.chatType}, targetId=${this.targetId}, userId=${this.userId}`);
              }
              
              loadMessages() {
                console.log("Loading messages for", this.targetId);
                const chatMessagesEl = document.getElementById('chat-messages');
                if (chatMessagesEl) {
                  chatMessagesEl.innerHTML = '<div class="p-4 text-center text-gray-400">Loading messages...</div>';
                }
              }
            };
            
            const chatSection = new ChatSection();
            chatSection.init();
            window.chatSection = chatSection;
          }
        }
        
        console.log(`Chat section loaded successfully for channel ${channelId}`);
        document.dispatchEvent(new CustomEvent('contentLoaded', {
          detail: { type: 'chat', channelId: channelId, skipChannelReload: true }
        }));
      } else {
        console.error("Could not find central content area to update");
      }
    })
    .catch(error => {
      console.error('Error loading chat section:', error);
      handleSkeletonLoading(false);
    });
}

function fetchVoiceSection(channelId) {
  console.log(`🔊 fetchVoiceSection called with channelId: ${channelId}`);
  
  console.log('🔄 Setting auto-join flags for voice channel:', channelId);
  localStorage.setItem('autoJoinVoiceChannel', channelId);
  sessionStorage.setItem('forceAutoJoin', 'true');
  
  const apiUrl = `/server/${getServerIdFromUrl()}?channel=${channelId}&type=voice&ajax=true`;
  console.log(`🌐 Fetching voice section from URL: ${apiUrl}`);
  
  fetch(apiUrl)
    .then(response => {
      console.log(`📥 Response received, status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`Failed to load voice section: ${response.status} ${response.statusText}`);
      }
      return response.text();
    })
    .then(html => {
      console.log(`📄 Received HTML content (length: ${html.length})`);
      
      const centralContentArea = document.querySelector('#main-content > .flex.flex-col.flex-1, #main-content > .flex.flex-col.h-screen');
      
      if (centralContentArea) {
        console.log("🎯 Found central content area, replacing content");
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Log the join button in the HTML response
        const joinBtnInResponse = tempDiv.querySelector('#joinBtn');
        console.log('🔘 Join button in response HTML:', joinBtnInResponse ? joinBtnInResponse.outerHTML : 'Not found');
        
        // Update meta tags first
        const chatIdMeta = tempDiv.querySelector('meta[name="chat-id"]');
        const channelIdMeta = tempDiv.querySelector('meta[name="channel-id"]');
        
        if (chatIdMeta) {
          let docChatIdMeta = document.querySelector('meta[name="chat-id"]');
          if (docChatIdMeta) {
            docChatIdMeta.setAttribute('content', channelId);
          } else {
            docChatIdMeta = document.createElement('meta');
            docChatIdMeta.setAttribute('name', 'chat-id');
            docChatIdMeta.setAttribute('content', channelId);
            document.head.appendChild(docChatIdMeta);
          }
        }
        
        if (channelIdMeta) {
          let docChannelIdMeta = document.querySelector('meta[name="channel-id"]');
          if (docChannelIdMeta) {
            docChannelIdMeta.setAttribute('content', channelId);
          } else {
            docChannelIdMeta = document.createElement('meta');
            docChannelIdMeta.setAttribute('name', 'channel-id');
            docChannelIdMeta.setAttribute('content', channelId);
            document.head.appendChild(docChannelIdMeta);
          }
        }
        
        let voiceSection = tempDiv.querySelector('.flex.flex-col.h-screen.bg-\\[\\#313338\\].text-white') ||
                          tempDiv.querySelector('.flex.flex-col.h-screen.bg-\\[\\#313338\\]') ||
                          tempDiv.querySelector('.flex.flex-col.h-screen') ||
                          tempDiv.querySelector('div[class*="flex"][class*="flex-col"][class*="h-screen"]');
        
        if (voiceSection) {
          console.log("🎯 Found voice section in response");
          
          // Clean up existing voice components
          if (window.voiceSection) {
            console.log("🧹 Cleaning up existing voice section");
            window.voiceSection = null;
          }
          
          if (window.voiceManager) {
            console.log("🧹 Cleaning up existing voice manager");
            window.voiceManager = null;
          }
          
          // Replace content
          console.log("🔄 Replacing central content area with voice section");
          centralContentArea.replaceWith(voiceSection);
          
          // Check if join button exists after replacing content
          const joinBtnAfterReplace = document.getElementById('joinBtn');
          console.log('🔘 Join button after replacing content:', joinBtnAfterReplace ? joinBtnAfterReplace.outerHTML : 'Not found');
          
          if (joinBtnAfterReplace) {
            console.log('🔘 Join button properties:', {
              disabled: joinBtnAfterReplace.disabled,
              clickable: !joinBtnAfterReplace.disabled && 
                        window.getComputedStyle(joinBtnAfterReplace).pointerEvents !== 'none',
              display: window.getComputedStyle(joinBtnAfterReplace).display,
              visibility: window.getComputedStyle(joinBtnAfterReplace).visibility,
              pointerEvents: window.getComputedStyle(joinBtnAfterReplace).pointerEvents
            });
            
            // Add temporary direct click handler to test
            joinBtnAfterReplace.onclick = function() {
              console.log('🎯 Temporary direct click handler triggered');
            };
          }
          
          // Load dependencies in sequence
          console.log("📚 Loading voice scripts");
          loadVoiceScripts().then(() => {
            console.log("✅ Voice scripts loaded, initializing voice section");
            
            // Initialize voice section with a delay to ensure DOM is ready
            setTimeout(() => {
              console.log("⏱️ Delayed initialization of voice section");
              if (typeof VoiceSection !== 'undefined') {
                console.log("🏗️ Creating new VoiceSection instance");
                window.voiceSection = new VoiceSection();
              } else {
                console.log("⚠️ VoiceSection class not found, loading voice-section.js");
                const voiceSectionScript = document.createElement('script');
                voiceSectionScript.src = '/public/js/components/voice/voice-section.js?v=' + Date.now();
                voiceSectionScript.onload = () => {
                  console.log("✅ Voice section script loaded, creating instance");
                  window.voiceSection = new VoiceSection();
                };
                document.head.appendChild(voiceSectionScript);
              }
            }, 100);
          });
          
        } else {
          console.error("❌ Voice section not found in response");
        }
      } else {
        console.error("❌ Central content area not found");
      }
      
      handleSkeletonLoading(false);
    })
    .catch(error => {
      console.error("❌ Error fetching voice section:", error);
      handleSkeletonLoading(false);
    });
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
    
    if (!state) return;
    
    if (state.serverId) {
        if (window.loadServerPage) {
            window.loadServerPage(state.serverId);
        } else {
            import('/public/js/utils/load-server-page.js')
                .then(module => {
                    module.loadServerPage(state.serverId);
                })
                .catch(error => {
                    console.error('Error loading server page module:', error);
                    window.location.href = `/server/${state.serverId}`;
                });
        }
    } else if (state.channelId && state.channelType) {
        const channelItem = document.querySelector(`.channel-item[data-channel-id="${state.channelId}"]`);
        
        if (channelItem) {
            channelItem.click();
        } else {
            if (state.channelType === 'text') {
                fetchChatSection(state.channelId);
            } else if (state.channelType === 'voice') {
                fetchVoiceSection(state.channelId);
            }
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
      
      if (!window.channelHandlersInitialized) {
        console.log("Initializing channel click handlers due to channel list change");
        initializeChannelClickHandlers();
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

export { initServerPage };
