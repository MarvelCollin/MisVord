import { pageUtils } from '../utils/index.js';

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
    
    console.log("Skipping VideoSDK manager (ES6 module compatibility issues)");
    
    console.log("Loading voice manager");
    await loadScript('/public/js/components/voice/voice-manager.js?v=' + Date.now());
    console.log("Voice manager loaded successfully");
    
    return true;
  } catch (error) {
    console.error("Error loading voice scripts:", error);
    return false;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM content loaded event triggered in server-page.js");
  
  const isVoicePage = window.location.href.includes('type=voice');
  if (isVoicePage) {
    console.log("Detected voice channel page, initializing voice page");
    initVoicePage();
  } else {
    initServerPage();
  }
  
  const mainContent = document.querySelector('.flex-1');
  if (mainContent && mainContent.textContent.trim() === '[object Object]') {
    window.location.reload();
  }
});

window.reinitializeServerPageEvents = function() {
  console.log("Reinitialize server page events called - disabled to prevent channel section reloading");
};

document.addEventListener('contentLoaded', function(event) {
  console.log('Content loaded event received:', event.detail);
});

function initServerPage() {
  console.log("Server page initialized");

  const path = window.location.pathname;
  const matches = path.match(/\/server\/(\d+)/);

  if (
    !document.body.hasAttribute("data-initial-load") &&
    matches &&
    matches[1]
  ) {
    const serverId = matches[1];
    console.log(`Loading server page for server ID: ${serverId}`);

    const objectDisplay = document.querySelector('.server-content');
    if (objectDisplay && objectDisplay.textContent.includes('[object Object]')) {
      console.log('Fixing [object Object] display issue');
      window.location.reload();
      return;
    }

    if (!window.initialChannelLoadComplete) {
    document.dispatchEvent(
      new CustomEvent("RefreshChannels", {
        detail: {
          serverId: serverId,
        },
      })
    );
      window.initialChannelLoadComplete = true;
    }
  } else if (document.body.hasAttribute("data-initial-load")) {
    console.log("Using server-rendered channels, skipping refresh event");
    window.initialChannelLoadComplete = true;
  }

  initializeChannelClickHandlers();
          
  setupChannelListObserver();
}

function getServerIdFromUrl() {
  const path = window.location.pathname;
  const matches = path.match(/\/server\/(\d+)/);
  return matches && matches[1] ? matches[1] : null;
}

function initializeChannelClickHandlers() {
  console.log("🔧 Initializing channel click handlers from server-page.js");
  
  // Reset the flag to allow re-initialization
  window.channelHandlersInitialized = false;
  
  const channelItems = document.querySelectorAll('.channel-item');
  console.log(`🎯 Found ${channelItems.length} channel items`);

  // If channel-section.php has already set up handlers, don't interfere
  if (window.refreshChannelHandlers) {
    console.log("✅ Channel handlers managed by channel-section.php");
    return;
  }

  channelItems.forEach(item => {
    // Remove any existing listeners to prevent duplicates
    const newItem = item.cloneNode(true);
    item.parentNode.replaceChild(newItem, item);
    
    newItem.addEventListener('click', function(e) {
      e.preventDefault();
      console.log("Channel item clicked");
      
      // Don't do anything if it's already active
      if (newItem.classList.contains('active-channel')) {
        console.log("Channel already active, skipping");
        return;
      }
      
      const channelId = newItem.getAttribute('data-channel-id');
      const channelType = newItem.getAttribute('data-channel-type');
      const serverId = getServerIdFromUrl();
      
      console.log(`Channel clicked: ID=${channelId}, Type=${channelType}, Server=${serverId}`);
      
      // Check current channel type versus new channel type
      const currentActiveChannel = document.querySelector('.channel-item.active-channel');
      const currentChannelType = currentActiveChannel ? currentActiveChannel.getAttribute('data-channel-type') : null;
      
      console.log(`Switching from channel type: ${currentChannelType} to: ${channelType}`);
      
      // Handle switching between different channel types
      if (currentChannelType !== channelType) {
        console.log("Channel type is changing, cleaning up previous channel type");
        
        // If switching from voice to text, cleanup voice stuff
        if (currentChannelType === 'voice') {
          console.log("Switching from voice to text channel, cleaning up voice components");
          // Cleanup any voice components or references here
          if (window.voiceManager) {
            console.log("Cleaning up voice manager");
            // Perform any needed cleanup
            window.voiceManager = null;
          }
        }
        
        // If switching from text to voice, cleanup chat stuff
        if (currentChannelType === 'text') {
          console.log("Switching from text to voice channel, cleaning up chat components");
          if (window.chatSection) {
            console.log("Destroying chat section");
            window.chatSection = null;
          }
        }
      }
      
      // Show skeleton loading
      handleSkeletonLoading(true);
      
      // Update meta tags immediately to ensure chat data loads correctly
      // Only update meta tags for text channels
      if (channelType === 'text') {
        updateChatMetaTags(channelId);
      }
      
      // Remove active class from all channels
      document.querySelectorAll('.channel-item').forEach(ch => {
        ch.classList.remove('active-channel');
      });
      
      // Add active class to clicked channel
      newItem.classList.add('active-channel');
      
      // Update URL without page reload
      const newUrl = `/server/${serverId}?channel=${channelId}&type=${channelType}`;
      history.pushState({ channelId, channelType, serverId }, '', newUrl);
      
      // Fetch appropriate section based on channel type
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
        
        // Extract and update meta tags before replacing content
        const chatIdMeta = tempContainer.querySelector('meta[name="chat-id"]');
        const channelIdMeta = tempContainer.querySelector('meta[name="channel-id"]');
        
        if (chatIdMeta) {
          console.log(`Found chat-id meta tag with value: ${chatIdMeta.getAttribute('content')}`);
          // Update or create the chat-id meta tag in the document
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
          // Update or create the channel-id meta tag in the document
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
        
        // Clear any existing chat section
        if (window.chatSection) {
          console.log("Destroying existing chat section before creating a new one");
          window.chatSection = null;
        }
        
        // Create new chat section for the new channel
        console.log("Creating new ChatSection instance for channel: " + channelId);
        
        // Check if ChatSection class already exists in the page
        if (typeof ChatSection !== 'undefined') {
          console.log("ChatSection class already exists, creating new instance");
          const chatSection = new ChatSection();
          chatSection.init();
          window.chatSection = chatSection;
        } else {
          console.log("ChatSection class not found, checking for script in response");
          
          // Look for script tags in the response that might contain the ChatSection class
          const scriptTags = tempContainer.querySelectorAll('script');
          let chatSectionScriptFound = false;
          
          scriptTags.forEach(script => {
            if (script.src && script.src.includes('chat-section.js')) {
              console.log("Found chat-section.js script in response, using it");
              chatSectionScriptFound = true;
              
              // Create a new script element
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
          
          // If no script found in response, try to create ChatSection manually
          if (!chatSectionScriptFound) {
            console.log("No chat-section.js script found in response, creating ChatSection manually");
            
            // Define a basic ChatSection class if it doesn't exist
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
                
                // Try to load messages if possible
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
        
        // Dispatch completion event
        console.log(`✅ Chat section loaded successfully for channel ${channelId}`);
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
  
  // Always set auto-join flag when fetching a voice channel
  console.log('🔊 Setting auto-join flags for voice channel:', channelId);
  localStorage.setItem('autoJoinVoiceChannel', channelId);
  sessionStorage.setItem('forceAutoJoin', 'true');
  console.log('🔊 Auto-join flags set:', {
    autoJoinChannelId: localStorage.getItem('autoJoinVoiceChannel'),
    forceAutoJoin: sessionStorage.getItem('forceAutoJoin')
  });
  
  const apiUrl = `/server/${getServerIdFromUrl()}?channel=${channelId}&type=voice&ajax=true`;
  console.log(`Fetching from URL: ${apiUrl}`);
  
  fetch(apiUrl)
    .then(response => {
      console.log(`Response received, status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`Failed to load voice section: ${response.status} ${response.statusText}`);
      }
      return response.text();
    })
    .then(html => {
      console.log(`Received HTML content (length: ${html.length})`);
      
      const centralContentArea = document.querySelector('#main-content > .flex.flex-col.flex-1, #main-content > .flex.flex-col.h-screen');
      
      if (centralContentArea) {
        console.log("Found central content area, replacing only this section");
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Extract and update meta tags before replacing content
        const chatIdMeta = tempDiv.querySelector('meta[name="chat-id"]');
        const channelIdMeta = tempDiv.querySelector('meta[name="channel-id"]');
        
        if (chatIdMeta) {
          console.log(`Found chat-id meta tag with value: ${chatIdMeta.getAttribute('content')}`);
          // Update or create the chat-id meta tag in the document
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
          // Update or create the channel-id meta tag in the document
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
        
        // Try multiple selectors to find the voice section
        let voiceSection = tempDiv.querySelector('.flex.flex-col.h-screen.bg-\\[\\#313338\\].text-white');
        
        // If not found with the first selector, try alternative selectors
        if (!voiceSection) {
          console.log("Voice section not found with primary selector, trying alternatives");
          voiceSection = tempDiv.querySelector('.flex.flex-col.h-screen.bg-\\[\\#313338\\]');
        }
        
        if (!voiceSection) {
          console.log("Voice section still not found, trying more general selector");
          voiceSection = tempDiv.querySelector('.flex.flex-col.h-screen');
        }
        
        if (!voiceSection) {
          // Last resort: look for the main voice container
          console.log("Voice section not found with class selectors, trying to find main voice container");
          voiceSection = tempDiv.querySelector('div[class*="flex"][class*="flex-col"][class*="h-screen"]');
        }
        
        if (voiceSection) {
          console.log("Found voice section in response, updating center content only");
          
          // Extract and execute scripts from the voice section before replacing content
          const scripts = voiceSection.querySelectorAll('script');
          let scriptContent = '';
          scripts.forEach(script => {
            if (script.innerHTML) {
              scriptContent += script.innerHTML + '\n';
            }
          });
          
          centralContentArea.replaceWith(voiceSection);
          
          // Clear any existing chat or voice section
          if (window.chatSection) {
            console.log("Destroying existing chat section before creating voice section");
            window.chatSection = null;
          }
          
          // Reset voice UI flags to allow re-initialization
          window.voiceUIInitialized = false;
          window.voiceAutoJoinInProgress = false;
          
          // Load all required voice scripts in the correct order
          loadVoiceScripts().then(() => {
            console.log("All voice scripts loaded successfully");
            
            // Execute the extracted scripts after voice scripts are loaded
            if (scriptContent) {
              console.log("🔊 Executing voice section scripts");
              try {
                // Create a safe execution environment to prevent conflicts
                const scriptElement = document.createElement('script');
                scriptElement.textContent = `
                  // Prevent duplicate execution if already running
                  if (!window.voiceScriptExecuting) {
                    window.voiceScriptExecuting = true;
                    ${scriptContent}
                    setTimeout(() => { window.voiceScriptExecuting = false; }, 1000);
                  } else {
                    console.log('🔊 Voice script already executing, skipping duplicate');
                  }
                `;
                document.head.appendChild(scriptElement);
                
                // Wait a moment for scripts to initialize, then trigger manual auto-join check
                setTimeout(() => {
                  console.log("🔊 Manually checking auto-join after AJAX voice section load");
                  
                  // Check if auto-join conditions are met
                  const autoJoinChannelId = localStorage.getItem('autoJoinVoiceChannel');
                  const currentChannelId = channelId;
                  const forceAutoJoin = sessionStorage.getItem('forceAutoJoin') === 'true';
                  
                  if (autoJoinChannelId && autoJoinChannelId === currentChannelId && forceAutoJoin) {
                    console.log('🔊 ✅ Auto-join conditions met after AJAX load');
                    
                    // Set the trigger flag for initVoiceUI
                    sessionStorage.setItem('triggerAutoJoin', 'true');
                    
                    // If handleAutoJoin exists, call it
                    if (typeof window.handleAutoJoin === 'function') {
                      console.log("🔊 Calling window.handleAutoJoin");
                      window.handleAutoJoin();
                    }
                    
                    // If voice UI is ready, trigger auto-join directly
                    if (window.voiceUIInitialized && typeof window.triggerVoiceAutoJoin === 'function') {
                      console.log("🔊 Voice UI ready, triggering auto-join directly");
                      setTimeout(() => {
                        window.triggerVoiceAutoJoin();
                      }, 300);
                    }
                  } else {
                    console.log('🔊 Auto-join conditions not met:', {autoJoinChannelId, currentChannelId, forceAutoJoin});
                  }
                }, 400);
                
              } catch (error) {
                console.error("🔊 Error executing voice section scripts:", error);
              }
            } else {
              console.log("🔊 No script content found in voice section");
            }
          }).catch(err => {
            console.error("Error in voice script loading chain:", err);
          });
          
          // Load voice section CSS
          if (!document.querySelector('link[href*="voice-section.css"]')) {
            console.log("Loading voice section CSS");
            const voiceCSS = document.createElement('link');
            voiceCSS.rel = 'stylesheet';
            voiceCSS.href = '/public/css/voice-section.css?v=' + Date.now();
            document.head.appendChild(voiceCSS);
          }
        } else {
          console.warn("Could not find voice section in response HTML, using full HTML");
          console.log("HTML content:", html.substring(0, 500) + "...");
          centralContentArea.innerHTML = html;
          
          // Reset voice UI flags to allow re-initialization
          window.voiceUIInitialized = false;
          window.voiceAutoJoinInProgress = false;
          
          // Even if we couldn't find the specific section, still load the voice scripts
          loadVoiceScripts().then(() => {
            console.log("All voice scripts loaded successfully (fallback)");
            
            // Trigger auto-join even in fallback mode
            setTimeout(() => {
              console.log("🔊 Checking auto-join in fallback mode");
              const autoJoinChannelId = localStorage.getItem('autoJoinVoiceChannel');
              const currentChannelId = channelId;
              const forceAutoJoin = sessionStorage.getItem('forceAutoJoin') === 'true';
              
              if (autoJoinChannelId && autoJoinChannelId === currentChannelId && forceAutoJoin) {
                console.log('🔊 ✅ Auto-join conditions met in fallback mode');
                
                // Set the trigger flag for initVoiceUI
                sessionStorage.setItem('triggerAutoJoin', 'true');
                
                // If handleAutoJoin exists, call it
                if (typeof window.handleAutoJoin === 'function') {
                  console.log("🔊 Calling window.handleAutoJoin (fallback)");
                  window.handleAutoJoin();
                }
                
                // Wait for voice UI to initialize and trigger auto-join
                const waitForVoiceUI = (attempts = 0) => {
                  if (window.voiceUIInitialized && typeof window.triggerVoiceAutoJoin === 'function') {
                    console.log("🔊 Voice UI ready, triggering auto-join (fallback)");
                    window.triggerVoiceAutoJoin();
                  } else if (attempts < 25) {
                    setTimeout(() => waitForVoiceUI(attempts + 1), 200);
                  } else {
                    console.log('🔊 ⚠️ Voice UI not ready after 5 seconds, trying join button fallback');
                    setTimeout(() => {
                      const joinBtn = document.getElementById('joinBtn');
                      if (joinBtn && !joinBtn.disabled) {
                        console.log('🔊 Clicking join button as last resort');
                        joinBtn.click();
                      }
                    }, 500);
                  }
                };
                waitForVoiceUI();
              } else {
                console.log('🔊 Auto-join conditions not met in fallback mode:', {autoJoinChannelId, currentChannelId, forceAutoJoin});
              }
            }, 500);
          }).catch(err => {
            console.error("Error in voice script loading chain (fallback):", err);
          });
        }
        
        handleSkeletonLoading(false);
        
        // Dispatch completion event
        console.log(`✅ Voice section loaded successfully for channel ${channelId}`);
        document.dispatchEvent(new CustomEvent('contentLoaded', {
          detail: { type: 'voice', channelId: channelId, skipChannelReload: true }
        }));
      } else {
        console.error("Could not find central content area to update");
      }
    })
    .catch(error => {
      console.error('Error loading voice section:', error);
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
                    <img src="${member.avatar_url || '/public/assets/common/main-logo.png'}" alt="${member.username}" class="w-full h-full object-cover">
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
  window.addEventListener('popstate', function(event) {
    console.log("popstate event triggered", event.state);
    if (event.state) {
      const { channelId, channelType } = event.state;
      
      // Check current channel type versus new channel type
      const currentActiveChannel = document.querySelector('.channel-item.active-channel');
      const currentChannelType = currentActiveChannel ? currentActiveChannel.getAttribute('data-channel-type') : null;
      
      console.log(`Switching from channel type: ${currentChannelType} to: ${channelType}`);
      
      // Handle switching between different channel types
      if (currentChannelType !== channelType) {
        console.log("Channel type is changing, cleaning up previous channel type");
        
        // If switching from voice to text, cleanup voice stuff
        if (currentChannelType === 'voice') {
          console.log("Switching from voice to text channel, cleaning up voice components");
          // Cleanup any voice components or references here
          if (window.voiceManager) {
            console.log("Cleaning up voice manager");
            // Perform any needed cleanup
            window.voiceManager = null;
          }
        }
        
        // If switching from text to voice, cleanup chat stuff
        if (currentChannelType === 'text') {
          console.log("Switching from text to voice channel, cleaning up chat components");
          if (window.chatSection) {
            console.log("Destroying chat section");
            window.chatSection = null;
          }
        }
      }
      
      // Update meta tags immediately to ensure chat data loads correctly
      // Only update for text channels
      if (channelType === 'text') {
        updateChatMetaTags(channelId);
      }
      
      // Update active channel indicator
      document.querySelectorAll('.channel-item').forEach(ch => {
        ch.classList.remove('active-channel');
        if (ch.getAttribute('data-channel-id') === channelId) {
          ch.classList.add('active-channel');
        }
      });
      
      // Show skeleton loading
      handleSkeletonLoading(true);
      
      // Fetch appropriate section based on channel type
      if (channelType === 'text') {
        fetchChatSection(channelId);
      } else if (channelType === 'voice') {
        fetchVoiceSection(channelId);
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  setupPopStateListener();
  
  const currentChannelItem = document.querySelector('.channel-item.active-channel');
  if (currentChannelItem) {
    const channelId = currentChannelItem.getAttribute('data-channel-id');
    const channelType = currentChannelItem.getAttribute('data-channel-type');
    const serverId = getServerIdFromUrl();
    
    history.replaceState({ channelId, channelType, serverId }, '', window.location.href);
  }
});

function setupChannelListObserver() {
  console.log("Setting up channel list observer");
  
  // Try to find the channel list container with different selectors
  let channelListContainer = document.querySelector('.channel-list-container');
  
  if (!channelListContainer) {
    console.log("Could not find .channel-list-container, trying alternative selectors");
    channelListContainer = document.querySelector('.channel-wrapper');
  }
  
  if (!channelListContainer) {
    console.log("Could not find channel list container with standard selectors");
    
    // Try to find any element that might contain channels
    const possibleContainers = [
      document.querySelector('.channel-list'),
      document.querySelector('[data-server-id]'),
      document.querySelector('div:has(.channel-item)'),
      document.querySelector('div:has([data-channel-id])')
    ];
    
    // Use the first container we find
    channelListContainer = possibleContainers.find(container => container !== null);
  }
  
  if (!channelListContainer) {
    console.log("Could not find any suitable channel list container, will retry later");
    
    // Set up a retry mechanism
    setTimeout(() => {
      console.log("Retrying channel list observer setup");
      setupChannelListObserver();
    }, 2000);
    
    return;
  }
  
  console.log("Found channel list container:", channelListContainer);
  
  // Check if observer is already set up
  if (window.channelListObserver) {
    console.log("Channel list observer already exists, disconnecting");
    window.channelListObserver.disconnect();
  }
  
  // Create a flag to prevent recursive initialization
  window.channelListObserverProcessing = false;
  
  // Create a new observer
  const observer = new MutationObserver(function(mutations) {
    if (window.channelListObserverProcessing) {
      console.log("Observer processing in progress, skipping");
      return;
    }
    
    window.channelListObserverProcessing = true;
    
    try {
      console.log("Channel list mutation detected");
      
      // Initialize channel click handlers when the channel list changes
      if (!window.channelHandlersInitialized) {
        console.log("Initializing channel click handlers due to channel list change");
        initializeChannelClickHandlers();
      }
    } finally {
      window.channelListObserverProcessing = false;
    }
  });
  
  // Configure and start the observer
  observer.observe(channelListContainer, {
    childList: true,
    subtree: true
  });
  
  window.channelListObserver = observer;
  console.log("Channel list observer set up");
}

function updateChatMetaTags(channelId) {
  console.log(`Updating chat meta tags for channel ID: ${channelId}`);
  
  // Update chat-id meta tag
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
  
  // Update channel-id meta tag
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
  
  // Force chat section to reload with new channel ID if it exists
  if (window.chatSection) {
    console.log("Force-updating existing chat section with new channel ID");
    window.chatSection.targetId = channelId;
    
    // Check if chatMessages exists before trying to clear it
    if (window.chatSection.chatMessages) {
      console.log("Clearing existing chat messages");
      window.chatSection.chatMessages.innerHTML = ''; // Clear existing messages
      window.chatSection.messagesLoaded = false; // Reset loaded state
      window.chatSection.loadMessages(); // Reload messages with new channel ID
    } else {
      console.log("Chat messages element not found, cannot clear messages");
      // The element will be initialized when the chat section is fully loaded
    }
  } else {
    console.log("No chat section instance found, meta tags updated for next initialization");
  }
}

function initVoicePage() {
  console.log("Initializing voice page");
  
  // Don't try to set up channel list observer for voice pages
  // as the structure might be different
  
  // Still initialize channel click handlers if channels exist
  const channelItems = document.querySelectorAll('.channel-item');
  if (channelItems.length > 0) {
    console.log(`Found ${channelItems.length} channel items in voice page`);
    initializeChannelClickHandlers();
  } else {
    console.log("No channel items found in voice page");
  }
  
  // Load voice manager script if not already loaded
  if (!window.voiceManager && !document.querySelector('script[src*="voice-manager.js"]')) {
    console.log("Loading voice manager script for voice page");
    const voiceScript = document.createElement('script');
    voiceScript.src = '/public/js/components/voice/voice-manager.js?v=' + Date.now();
    document.head.appendChild(voiceScript);
  }
  
  // Load VideoSDK if not already loaded
  if (!window.VideoSDK && !document.querySelector('script[src*="videosdk.js"]')) {
    console.log("Loading VideoSDK script for voice page");
    const script = document.createElement('script');
    script.src = 'https://sdk.videosdk.live/js-sdk/0.2.7/videosdk.js';
    document.head.appendChild(script);
  }
}

// Export functions globally for use by other components
window.fetchVoiceSection = fetchVoiceSection;
window.fetchChatSection = fetchChatSection;
window.initializeChannelClickHandlers = initializeChannelClickHandlers;
window.getServerIdFromUrl = getServerIdFromUrl;

// Coordination helpers for channel switching
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
