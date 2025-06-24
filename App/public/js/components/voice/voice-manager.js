document.addEventListener("DOMContentLoaded", () => {    
    if (document.getElementById('videoContainer')) {
        window.waitForVideoSDK(() => {
            window.logger.info('voice', "VideoSDK ready. Checking if we should auto-join voice channel...");
            
            // Check if we should auto-join this channel
            const autoJoinChannelId = localStorage.getItem('autoJoinVoiceChannel');
            const currentChannelId = document.querySelector('meta[name="channel-id"]')?.getAttribute('content');
            
            if (autoJoinChannelId && autoJoinChannelId === currentChannelId) {
                window.logger.info('voice', `Auto-joining voice channel: ${autoJoinChannelId}`);
                
                // Add a small delay to ensure VideoSDK is fully initialized
                setTimeout(() => {
                    try {
                        const joinBtn = document.getElementById("joinBtn");
                        if (joinBtn) {
                            joinBtn.click();
                            localStorage.removeItem('autoJoinVoiceChannel'); // Clear the flag after joining
                        }
                    } catch (error) {
                        console.error("Error auto-joining voice channel:", error);
                    }
                }, 1000);
            }
        });
    }
});

window.addEventListener("load", () => {
    if (document.getElementById('videoContainer') && !window.videoSDKManager?.meeting) {
        try {
            window.waitForVideoSDK(initVoiceInterface);
        } catch (error) {
            console.error("Error initializing voice interface:", error);
            showToast("Error initializing voice interface. Please refresh the page.", "error");
        }
    }

    const joinBtn = document.getElementById("joinBtn");
    if (joinBtn) {
        joinBtn.addEventListener("click", async () => {
            try {
                joinBtn.disabled = true;
                joinBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-sm"></i>';
                
                const config = window.videoSDKManager.getMetaConfig();
                const channelId = config.channelId;
                
                console.log(`[VOICE] Join button clicked for channel ${channelId}`);
                
                // Check if a meeting already exists for this channel
                const existingMeetingId = await checkExistingMeeting(channelId);
                
                if (existingMeetingId) {
                    console.log(`[VOICE] Found existing meeting ${existingMeetingId} for channel ${channelId}`);
                    
                    // Update meta tag with the existing meeting ID
                    const metaTag = document.querySelector('meta[name="meeting-id"]');
                    if (metaTag) {
                        metaTag.setAttribute('content', existingMeetingId);
                    }
                    
                    // Use the existing meeting ID
                    if (window.videoSDKManager) {
                        console.log(`[VOICE] Joining existing meeting with ID: ${existingMeetingId}`);
                        window.logger.info('voice', `Joining existing meeting with ID: ${existingMeetingId}`);
                        
                        // Initialize meeting with the existing meeting ID
                        window.videoSDKManager.initMeeting({
                            meetingId: existingMeetingId,
                            name: window.videoSDKManager.getMetaConfig().participantName,
                            micEnabled: true,
                            webcamEnabled: false
                        });
                        
                        // Join the meeting
                        await window.videoSDKManager.joinMeeting();
                        
                        // Dispatch voice connect event
                        dispatchVoiceEvent('voiceConnect', { channelId, meetingId: existingMeetingId });
                    } else {
                        // Fall back to original join flow
                        meetingId = existingMeetingId;
                        await initializeMeeting();
                        
                        if (meeting) {
                            try {
                                console.log(`[VOICE] Fallback: Joining existing meeting with ID: ${meetingId}`);
                                window.logger.info('voice', `Fallback: Joining existing meeting with ID: ${meetingId}`);
                                await meeting.join();
                            } catch (error) {
                                console.error("Failed to join meeting:", error);
                                showToast("Failed to join: " + error.message, "error");
                                joinBtn.disabled = false;
                                joinBtn.innerHTML = '<i class="fas fa-phone text-sm"></i>';
                            }
                        } else {
                            console.error("Meeting not initialized");
                            joinBtn.disabled = false;
                            joinBtn.innerHTML = '<i class="fas fa-phone text-sm"></i>';
                        }
                    }
                } else {
                    // No existing meeting, create a new one - Use consistent ID based on channel ID
                    const channelBasedMeetingId = `voice_channel_${channelId}`;
                    
                    if (window.videoSDKManager) {
                        // Create a new meeting room with consistent ID based on channel
                        const newMeetingId = await window.videoSDKManager.createMeetingRoom(channelBasedMeetingId);
                        
                        if (!newMeetingId) {
                            showToast("Failed to create meeting room", "error");
                            joinBtn.disabled = false;
                            joinBtn.innerHTML = '<i class="fas fa-phone text-sm"></i>';
                            return;
                        }
                        
                        console.log(`[VOICE] Creating new meeting with ID: ${newMeetingId}`);
                        window.logger.info('voice', `Creating new meeting with ID: ${newMeetingId}`);
                        
                        // Update meta tag with the new meeting ID
                        const metaTag = document.querySelector('meta[name="meeting-id"]');
                        if (metaTag) {
                            metaTag.setAttribute('content', newMeetingId);
                        }
                        
                        // Initialize meeting with the new meeting ID
                        window.videoSDKManager.initMeeting({
                            meetingId: newMeetingId,
                            name: window.videoSDKManager.getMetaConfig().participantName,
                            micEnabled: true,
                            webcamEnabled: false
                        });
                        
                        // Join the meeting
                        console.log(`[VOICE] Joining meeting with ID: ${newMeetingId}`);
                        window.logger.info('voice', `Joining meeting with ID: ${newMeetingId}`);
                        await window.videoSDKManager.joinMeeting();
                        
                        // Register the new meeting with the socket server
                        registerMeeting(channelId, newMeetingId);
                        
                        // Dispatch voice connect event
                        dispatchVoiceEvent('voiceConnect', { channelId, meetingId: newMeetingId });
                    } else {
                        // Fall back to original join flow if manager not available
                        const newMeetingId = await createMeetingRoom(channelBasedMeetingId);
                        
                        if (!newMeetingId) {
                            showToast("Failed to create meeting room", "error");
                            joinBtn.disabled = false;
                            joinBtn.innerHTML = '<i class="fas fa-phone text-sm"></i>';
                            return;
                        }
                        
                        console.log(`[VOICE] Fallback: Creating new meeting with ID: ${newMeetingId}`);
                        window.logger.info('voice', `Fallback: Creating new meeting with ID: ${newMeetingId}`);
                        
                        meetingId = newMeetingId;
                        
                        await initializeMeeting();
                        
                        if (meeting) {
                            try {
                                console.log(`[VOICE] Fallback: Joining meeting with ID: ${meetingId}`);
                                window.logger.info('voice', `Fallback: Joining meeting with ID: ${meetingId}`);
                                await meeting.join();
                                
                                // Register the new meeting with the socket server
                                registerMeeting(channelId, meetingId);
                                
                                // Dispatch voice connect event
                                dispatchVoiceEvent('voiceConnect', { channelId, meetingId });
                            } catch (error) {
                                console.error("Failed to join meeting:", error);
                                showToast("Failed to join: " + error.message, "error");
                                joinBtn.disabled = false;
                                joinBtn.innerHTML = '<i class="fas fa-phone text-sm"></i>';
                            }
                        } else {
                            console.error("Meeting not initialized");
                            joinBtn.disabled = false;
                            joinBtn.innerHTML = '<i class="fas fa-phone text-sm"></i>';
                        }
                    }
                }
                
            } catch (error) {
                console.error("Error in join process:", error);
                showToast("Error: " + error.message, "error");
                joinBtn.disabled = false;
                joinBtn.innerHTML = '<i class="fas fa-phone text-sm"></i>';
            }
        });
    }

    const leaveBtn = document.getElementById("leaveBtn");
    if (leaveBtn) {
        leaveBtn.addEventListener("click", () => {
            const config = window.videoSDKManager.getMetaConfig();
            const channelId = config.channelId;
            
            if (window.videoSDKManager?.meeting) {
                const meetingId = window.videoSDKManager.meeting.id;
                console.log(`[VOICE] Leaving meeting ${meetingId} for channel ${channelId}`);
                window.videoSDKManager.leaveMeeting();
                
                // Unregister the meeting if we're the last participant
                unregisterMeeting(channelId, meetingId);
                
                // Dispatch voice disconnect event
                dispatchVoiceEvent('voiceDisconnect', { channelId, meetingId });
            } else if (meeting) {
                console.log(`[VOICE] Leaving meeting ${activeMeetingId} for channel ${activeChannelId}`);
                meeting.leave();
                
                // Unregister the meeting if we're the last participant
                unregisterMeeting(activeChannelId, activeMeetingId);
                
                // Dispatch voice disconnect event
                dispatchVoiceEvent('voiceDisconnect', { channelId: activeChannelId, meetingId: activeMeetingId });
            }
        });
    }

    const micBtn = document.getElementById("micBtn");
    if (micBtn) {
        micBtn.addEventListener("click", () => {
            if (window.videoSDKManager?.meeting?.localParticipant) {
                const isMicOn = window.videoSDKManager.toggleMic();
                
                if (isMicOn) {
                    micBtn.innerHTML = '<i class="fas fa-microphone text-sm"></i>';
                    micBtn.classList.remove('bg-[#ED4245]');
                    micBtn.classList.add('bg-[#272729]');
                } else {
                    micBtn.innerHTML = '<i class="fas fa-microphone-slash text-sm"></i>';
                    micBtn.classList.add('bg-[#ED4245]');
                    micBtn.classList.remove('bg-[#272729]');
                }
            } else if (meeting && meeting.localParticipant) {
                if (meeting.localParticipant.streams.has("audio")) {
                    meeting.muteMic();
                    micBtn.innerHTML = '<i class="fas fa-microphone-slash text-sm"></i>';
                    micBtn.classList.add('bg-[#ED4245]');
                    micBtn.classList.remove('bg-[#272729]');
                } else {
                    meeting.unmuteMic();
                    micBtn.innerHTML = '<i class="fas fa-microphone text-sm"></i>';
                    micBtn.classList.remove('bg-[#ED4245]');
                    micBtn.classList.add('bg-[#272729]');
                }
            }
        });
    }

    const joinVideoBtn = document.getElementById("joinVideoBtn");
    if (joinVideoBtn) {
        joinVideoBtn.addEventListener("click", () => {
            if (window.videoSDKManager?.meeting?.localParticipant) {
                const isVideoOn = window.videoSDKManager.toggleWebcam();
                
                if (isVideoOn) {
                    joinVideoBtn.innerHTML = '<i class="fas fa-video text-sm"></i>';
                    joinVideoBtn.classList.remove('bg-[#ED4245]');
                    joinVideoBtn.classList.add('bg-[#272729]');
                } else {
                    joinVideoBtn.innerHTML = '<i class="fas fa-video-slash text-sm"></i>';
                    joinVideoBtn.classList.add('bg-[#ED4245]');
                    joinVideoBtn.classList.remove('bg-[#272729]');
                }
            } else if (meeting && meeting.localParticipant) {
                if (meeting.localParticipant.streams.has("video")) {
                    meeting.disableWebcam();
                    joinVideoBtn.innerHTML = '<i class="fas fa-video-slash text-sm"></i>';
                    joinVideoBtn.classList.add('bg-[#ED4245]');
                    joinVideoBtn.classList.remove('bg-[#272729]');
                } else {
                    meeting.enableWebcam();
                    joinVideoBtn.innerHTML = '<i class="fas fa-video text-sm"></i>';
                    joinVideoBtn.classList.remove('bg-[#ED4245]');
                    joinVideoBtn.classList.add('bg-[#272729]');
                }
            }
        });
    }

    const screenBtn = document.getElementById("screenBtn");
    if (screenBtn) {
        screenBtn.addEventListener("click", () => {
            if (window.videoSDKManager?.meeting?.localParticipant) {
                const isScreenShareOn = window.videoSDKManager.toggleScreenShare();
                
                if (isScreenShareOn) {
                    screenBtn.innerHTML = '<i class="fas fa-desktop text-sm"></i>';
                    screenBtn.classList.add('bg-[#5865F2]');
                    screenBtn.classList.remove('bg-[#272729]');
                } else {
                    screenBtn.innerHTML = '<i class="fas fa-desktop text-sm"></i>';
                    screenBtn.classList.remove('bg-[#5865F2]');
                    screenBtn.classList.add('bg-[#272729]');
                }
            } else if (meeting && meeting.localParticipant) {
                if (meeting.localParticipant.streams.has("share")) {
                    meeting.disableScreenShare();
                    screenBtn.innerHTML = '<i class="fas fa-desktop text-sm"></i>';
                    screenBtn.classList.remove('bg-[#5865F2]');
                    screenBtn.classList.add('bg-[#272729]');
                } else {
                    meeting.enableScreenShare();
                    screenBtn.innerHTML = '<i class="fas fa-desktop text-sm"></i>';
                    screenBtn.classList.add('bg-[#5865F2]');
                    screenBtn.classList.remove('bg-[#272729]');
                }
            }
        });
    }
});

let participantCount = 0;
let meeting;
let activeChannelId;
let activeMeetingId;

// Create meeting room with custom ID - fallback method without VideoSDKManager
async function createMeetingRoom(customId = null) {
    console.log("[VOICE] Fallback: Creating meeting room with ID:", customId);
    // Use default predefined ID if we can't connect to VideoSDK
    return customId || `voice_meeting_${Date.now()}`;
}

// Connect to socket if available
function connectToSocket() {
    if (window.socket) {
        console.log("[VOICE] Using existing socket connection");
        return window.socket;
    }
    
    // First, try to use the global socket manager if available
    if (window.globalSocketManager && window.globalSocketManager.isReady()) {
        console.log("[VOICE] Using global socket manager connection");
        window.socket = window.globalSocketManager.io;
        return window.socket;
    }
    
    if (typeof io !== 'undefined') {
        console.log("[VOICE] Creating new socket connection");
        
        // Get socket connection details from meta tags (standard approach in the app)
        const socketHost = document.querySelector('meta[name="socket-host"]')?.content || 'localhost';
        const socketPort = document.querySelector('meta[name="socket-port"]')?.content || '1002';
        const socketUrl = `http://${socketHost}:${socketPort}`;
        
        console.log(`[VOICE] Connecting to socket server at ${socketUrl}`);
        window.socket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true
        });
        return window.socket;
    }
    
    console.warn("[VOICE] Socket.io not available");
    return null;
}

// Check if a meeting exists for the current channel
async function checkExistingMeeting(channelId) {
    return new Promise((resolve) => {
        const socket = connectToSocket();
        if (!socket) {
            console.log("[VOICE] No socket connection, creating new meeting");
            resolve(null);
            return;
        }
        
        console.log(`[VOICE] Checking if meeting exists for channel ${channelId}`);
        socket.emit('check-voice-meeting', { channelId });
        
        // Set a timeout in case we don't get a response
        const timeout = setTimeout(() => {
            console.log("[VOICE] No response from server, creating new meeting");
            resolve(null);
        }, 2000);
        
        // Listen for response
        socket.once('voice-meeting-info', (data) => {
            clearTimeout(timeout);
            console.log(`[VOICE] Received meeting info:`, data);
            if (data && data.meetingId) {
                resolve(data.meetingId);
            } else {
                resolve(null);
            }
        });
    });
}

// Register a meeting with the socket server
function registerMeeting(channelId, meetingId) {
    const socket = connectToSocket();
    if (!socket) return;
    
    console.log(`[VOICE] Registering meeting ${meetingId} for channel ${channelId}`);
    socket.emit('register-voice-meeting', { 
        channelId, 
        meetingId,
        username: window.videoSDKManager.getMetaConfig().participantName
    });
}

// Unregister a meeting with the socket server when leaving
function unregisterMeeting(channelId, meetingId) {
    const socket = connectToSocket();
    if (!socket) return;
    
    console.log(`[VOICE] Unregistering from meeting ${meetingId} for channel ${channelId}`);
    socket.emit('unregister-voice-meeting', { 
        channelId, 
        meetingId,
        username: window.videoSDKManager.getMetaConfig().participantName
    });
}

async function initializeMeeting() {
    try {
        // Get configuration from meta tags
        const config = window.videoSDKManager.getMetaConfig();
        activeChannelId = config.channelId;
        
        // Initialize VideoSDK
        window.videoSDKManager.init(config.authToken);
        
        // Create meeting instance
        meeting = window.videoSDKManager.initMeeting({
            meetingId: config.meetingId,
            name: config.participantName,
            micEnabled: true,
            webcamEnabled: false,
            participantCanToggleSelfWebcam: true,
            participantCanToggleSelfMic: true,
            participantCanMute: true,
            participantCanUnmute: true,
            chatEnabled: false,
            screenShareEnabled: true,
            pollEnabled: false,
            whiteBoardEnabled: false,
            raiseHandEnabled: false
        });
        
        activeMeetingId = config.meetingId;
        window.logger.debug('voice', "Meeting initialized:", meeting);

        meeting.on("meeting-joined", () => {
            window.logger.info('voice', "Meeting Joined");
            
            
            const joinBtn = document.getElementById("joinBtn");
            const leaveBtn = document.getElementById("leaveBtn");
            const micBtn = document.getElementById("micBtn");
            const screenBtn = document.getElementById("screenBtn");
            const joinVideoBtn = document.getElementById("joinVideoBtn");
            
            
            if (joinBtn) joinBtn.classList.add("hidden");
            if (leaveBtn) {
                leaveBtn.classList.remove("hidden");
                leaveBtn.disabled = false;
            }
            
            
            if (micBtn) micBtn.disabled = false;
            if (screenBtn) screenBtn.disabled = false;
            
            
            if (joinVideoBtn) {
                joinVideoBtn.classList.remove("hidden");
                joinVideoBtn.disabled = false;
            }
            
            
            showToast("Connected to voice", "success");
            addParticipant(meeting.localParticipant);

            // Add all other participants already in the meeting
            Object.values(meeting.participants || {}).forEach((p) => {
                if (p.id !== meeting.localParticipant.id) addParticipant(p);
            });

            setTimeout(() => {
                updateParticipantsPanel();
            }, 500);

            
            const channelNameElement = document.querySelector('.text-white.font-medium');
            const channelName = channelNameElement ? channelNameElement.textContent : 'Voice Channel';
            const config = window.videoSDKManager.getMetaConfig();
            const voiceConnectEvent = new CustomEvent('voiceConnect', { 
                detail: { 
                    channelName: channelName,
                    meetingId: config.meetingId,
                    channelId: config.channelId
                } 
            });
            window.dispatchEvent(voiceConnectEvent);
            window.videosdkMeeting = meeting;
            
            // Register the meeting with the socket server
            registerMeeting(config.channelId, config.meetingId);
        });

        meeting.on("meeting-left", () => {
            window.logger.info('voice', "Meeting Left");
            
            
            const joinBtn = document.getElementById("joinBtn");
            const leaveBtn = document.getElementById("leaveBtn");
            const micBtn = document.getElementById("micBtn");
            const screenBtn = document.getElementById("screenBtn");
            const joinVideoBtn = document.getElementById("joinVideoBtn");
            const participants = document.getElementById("participants");
            const videosContainer = document.getElementById("videosContainer");
            const participantsPanel = document.getElementById("participantsPanel");
            const videoContainer = document.getElementById("videoContainer");
            
            if (joinBtn) joinBtn.classList.remove("hidden");
            if (leaveBtn) leaveBtn.classList.add("hidden");
            
            
            if (micBtn) micBtn.disabled = true;
            if (screenBtn) screenBtn.disabled = true;
            if (joinVideoBtn) joinVideoBtn.classList.add("hidden");
            
            
            if (micBtn) {
                micBtn.innerHTML = '<i class="fas fa-microphone text-sm"></i>';
                micBtn.classList.remove("bg-[#ED4245]");
            }
            
            if (screenBtn) {
                screenBtn.innerHTML = '<i class="fas fa-desktop text-sm"></i>';
                screenBtn.classList.remove("bg-[#5865F2]");
            }
            
            
            if (participants) participants.innerHTML = "";
            if (videosContainer) videosContainer.innerHTML = "";
            participantCount = 0;
            
            
            if (participantsPanel) participantsPanel.classList.add("hidden");
            if (videoContainer) videoContainer.classList.add("hidden");
            
            
            showToast("Disconnected from voice", "error");

            
            const voiceDisconnectEvent = new CustomEvent('voiceDisconnect');
            window.dispatchEvent(voiceDisconnectEvent);
            window.videosdkMeeting = null;
        });

        meeting.on("participant-joined", (participant) => {
            window.logger.debug('voice', "Participant Joined: ", participant);
            addParticipant(participant);
            updateParticipantsPanel();
        });

        meeting.on("participant-left", (participant) => {
            window.logger.debug('voice', "Participant Left: ", participant);
            removeParticipant(participant);
            updateParticipantsPanel();
        });

        meeting.on("error", async (error) => {
            console.error("Meeting error:", error);
            
            // Handle different error formats between versions
            const errorMessage = error.message || error.msg || "";
            const errorCode = error.code || 0;
            
            if (errorMessage.includes('404') || errorMessage.includes('not found') || errorCode === 4001) {
                window.logger.warn('voice', "Meeting not found, attempting to create a new meeting...");
                
                try {
                    // Create a new meeting using VideoSDKManager
                    const config = window.videoSDKManager.getMetaConfig();
                    const newMeetingId = await window.videoSDKManager.createMeetingRoom();
                    
                    if (newMeetingId) {
                        window.logger.info('voice', "New meeting created with ID:", newMeetingId);
                        // Update meta tag with the new meeting ID
                        const metaTag = document.querySelector('meta[name="meeting-id"]');
                        if (metaTag) {
                            metaTag.setAttribute('content', newMeetingId);
                        }
                        // Re-initialize the meeting with the new ID
                        await initializeMeeting();
                        return;
                    } else {
                        window.logger.error('voice', "Failed to create new meeting after error");
                        showToast("Error: Could not recreate the voice meeting", "error");
                        resetUIState();
                    }
                } catch (recreateError) {
                    window.logger.error('voice', "Error recreating meeting:", recreateError);
                    showToast("Error: Could not recreate the voice meeting", "error");
                    resetUIState();
                }
                return;
            }
            
            showToast("Error: " + (error.message || "Unknown error occurred"), "error");
        });

    } catch (error) {
        console.error("Failed to initialize meeting:", error);
        showToast("Failed to initialize meeting: " + error.message, "error");
        resetUIState();
    }
}

// Reset UI to initial state when errors occur
function resetUIState() {
    const joinBtn = document.getElementById("joinBtn");
    const leaveBtn = document.getElementById("leaveBtn");
    const micBtn = document.getElementById("micBtn");
    const screenBtn = document.getElementById("screenBtn");
    const joinVideoBtn = document.getElementById("joinVideoBtn");
    
    if (joinBtn) {
        joinBtn.disabled = false;
        joinBtn.classList.remove("hidden");
        joinBtn.innerHTML = '<i class="fas fa-phone text-sm"></i>';
    }
    
    if (leaveBtn) {
        leaveBtn.classList.add("hidden");
        leaveBtn.disabled = true;
    }
    
    if (micBtn) micBtn.disabled = true;
    if (screenBtn) screenBtn.disabled = true;
    if (joinVideoBtn) joinVideoBtn.classList.add("hidden");
}

function addParticipant(participant) {
    if (!participant) {
        console.error("Invalid participant object");
        return;
    }
    
    participantCount++;
    
    
    const initials = participant.displayName ? participant.displayName.charAt(0).toUpperCase() : 'U';
    
    
    const nameHash = [...(participant.displayName || 'User')].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = nameHash % 360;
    const avatarColor = `hsl(${hue}, 70%, 40%)`;
  
    
    const participantsList = document.getElementById("participants");
    if (participantsList) {
        const participantDiv = document.createElement("div");
        participantDiv.id = `participant-list-${participant.id}`;
        participantDiv.className = "flex items-center justify-between p-2 rounded hover:bg-[#36373d] mb-1 text-sm";
        participantDiv.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white" style="background-color: ${avatarColor}">
                    ${initials}
                </div>
                <span class="font-medium text-white">${participant.displayName || 'Unknown User'}</span>
            </div>
            <div class="flex items-center space-x-1">
                <i id="mic-status-${participant.id}" class="fas fa-microphone-slash text-gray-500 text-xs"></i>
            </div>
        `;
        participantsList.appendChild(participantDiv);
    }
    
    
    const audioContainer = document.createElement("div");
    audioContainer.id = `audio-container-${participant.id}`;
    audioContainer.style.display = "none";
    audioContainer.innerHTML = `<audio id="audio-${participant.id}" autoplay playsinline></audio>`;
    document.body.appendChild(audioContainer);
    
    
    const videosContainer = document.getElementById("videosContainer");
    if (videosContainer) {
        const videoDiv = document.createElement("div");
        videoDiv.id = `video-${participant.id}`;
        videoDiv.className = "relative w-36 h-36 mx-auto"; 
        videoDiv.style.display = "flex";
        videoDiv.innerHTML = `
            <div class="absolute top-0 left-0 w-full h-full rounded-full flex items-center justify-center" style="background-color: ${avatarColor}">
                <span class="text-white text-2xl font-semibold">${initials}</span>
            </div>
            <video class="w-full h-full object-cover rounded-full hidden" autoplay playsinline></video>
            <div class="absolute -bottom-6 w-full text-center">
                <div class="bg-[#212225] rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                    <span class="text-xs text-white">${participant.displayName || 'Unknown User'}</span>
                    <i id="user-mic-${participant.id}" class="fas fa-microphone-slash text-gray-400 text-xs"></i>
                </div>
            </div>
        `;
        videosContainer.appendChild(videoDiv);
    }
    
    
    const videoContainer = document.getElementById("videoContainer");
    if (videoContainer) {
        videoContainer.classList.remove("hidden");
    }
    
    
    participant.on("stream-enabled", (stream) => {
        if (stream.kind === "audio") {
            const audioEl = document.getElementById(`audio-${participant.id}`);
            const micStatusEl = document.getElementById(`mic-status-${participant.id}`);
            const userMicEl = document.getElementById(`user-mic-${participant.id}`);
            
            if (audioEl) {
                const audioObj = new MediaStream();
                audioObj.addTrack(stream.track);
                audioEl.srcObject = audioObj;
            }
            
            if (micStatusEl) {
                micStatusEl.classList.remove("fa-microphone-slash");
                micStatusEl.classList.add("fa-microphone");
                micStatusEl.classList.remove("text-gray-500");
                micStatusEl.classList.add("text-green-400");
            }
            
            if (userMicEl) {
                userMicEl.classList.remove("fa-microphone-slash");
                userMicEl.classList.add("fa-microphone");
                userMicEl.classList.remove("text-gray-400");
                userMicEl.classList.add("text-white");
            }
            
            
            if (audioEl && audioEl.srcObject) {
                setupAudioDetection(participant.id, audioEl.srcObject);
            }
        }
        
        if (stream.kind === "video") {
            const videoEl = document.getElementById(`video-${participant.id}`);
            if (videoEl) {
                const avatarEl = videoEl.querySelector(".absolute");
                const videoStreamEl = videoEl.querySelector("video");
                
                if (videoStreamEl) {
                    const videoStream = new MediaStream();
                    videoStream.addTrack(stream.track);
                    videoStreamEl.srcObject = videoStream;
                    
                    if (avatarEl) avatarEl.classList.add("hidden");
                    videoStreamEl.classList.remove("hidden");
                }
            }
        }
        
        if (stream.kind === "share") {
            
            let screenShareEl = document.getElementById(`screen-share-${participant.id}`);
            const videosContainer = document.getElementById("videosContainer");
            
            if (!screenShareEl && videosContainer) {
                screenShareEl = document.createElement("div");
                screenShareEl.id = `screen-share-${participant.id}`;
                screenShareEl.className = "w-full max-w-2xl h-64 bg-black rounded-md overflow-hidden mt-4";
                screenShareEl.innerHTML = `
                    <video class="w-full h-full object-contain" autoplay playsinline></video>
                    <div class="absolute bottom-2 right-2 bg-[#212225] rounded-full px-2 py-1 text-xs text-white">
                        ${participant.displayName || 'Unknown User'}'s screen
                    </div>
                `;
                videosContainer.prepend(screenShareEl);
            }
            
            if (screenShareEl) {
                const videoElement = screenShareEl.querySelector("video");
                if (videoElement) {
                    const videoStream = new MediaStream();
                    videoStream.addTrack(stream.track);
                    videoElement.srcObject = videoStream;
                }
            }
            
            
            if (participant.id === meeting?.localParticipant?.id) {
                const screenBtn = document.getElementById("screenBtn");
                if (screenBtn) {
                    screenBtn.classList.add("bg-[#5865F2]");
                    screenBtn.classList.remove("bg-[#272729]");
                }
            }
        }
    });
    
    participant.on("stream-disabled", (stream) => {
        if (stream.kind === "audio") {
            const micStatusEl = document.getElementById(`mic-status-${participant.id}`);
            const userMicEl = document.getElementById(`user-mic-${participant.id}`);
            
            if (micStatusEl) {
                micStatusEl.classList.remove("fa-microphone");
                micStatusEl.classList.add("fa-microphone-slash");
                micStatusEl.classList.remove("text-green-400");
                micStatusEl.classList.add("text-gray-500");
            }
            
            if (userMicEl) {
                userMicEl.classList.remove("fa-microphone");
                userMicEl.classList.add("fa-microphone-slash");
                userMicEl.classList.remove("text-white");
                userMicEl.classList.add("text-gray-400");
            }
            
            
            const participantEl = document.getElementById(`participant-list-${participant.id}`);
            if (participantEl) {
                participantEl.classList.remove("speaking");
            }
        }
        
        if (stream.kind === "video") {
            const videoEl = document.getElementById(`video-${participant.id}`);
            if (videoEl) {
                const avatarEl = videoEl.querySelector(".absolute");
                const videoStreamEl = videoEl.querySelector("video");
                
                if (avatarEl) avatarEl.classList.remove("hidden");
                if (videoStreamEl) videoStreamEl.classList.add("hidden");
            }
        }
        
        if (stream.kind === "share") {
            const screenShareEl = document.getElementById(`screen-share-${participant.id}`);
            if (screenShareEl) {
                screenShareEl.remove();
            }
            
            
            if (participant.id === meeting?.localParticipant?.id) {
                const screenBtn = document.getElementById("screenBtn");
                if (screenBtn) {
                    screenBtn.classList.remove("bg-[#5865F2]");
                    screenBtn.classList.add("bg-[#272729]");
                }
            }
        }
    });
    
    
    updateParticipantsPanel();
}

function setupAudioDetection(participantId, audioStream) {
    if (!participantId || !audioStream) {
        console.error("Missing required parameters for audio detection");
        return;
    }
    
    try {
        const audioContext = new AudioContext();
        const mediaStreamSource = audioContext.createMediaStreamSource(audioStream);
        const analyser = audioContext.createAnalyser();
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        mediaStreamSource.connect(analyser);
        
        const checkAudioLevel = () => {
            const participantEl = document.getElementById(`participant-list-${participantId}`);
            if (!participantEl) return;
            
            analyser.getByteFrequencyData(dataArray);
            const audioLevel = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
            
            if (audioLevel > 10) {
                participantEl.classList.add("speaking");
                const micIcon = participantEl.querySelector(".fa-microphone");
                if (micIcon) micIcon.classList.add("text-white");
            } else {
                participantEl.classList.remove("speaking");
                const micIcon = participantEl.querySelector(".fa-microphone");
                if (micIcon) micIcon.classList.remove("text-white");
            }
            
            
            if (document.getElementById(`participant-list-${participantId}`)) {
                requestAnimationFrame(checkAudioLevel);
            }
        };
        
        checkAudioLevel();
    } catch (error) {
        console.error("Error setting up audio detection:", error);
    }
}

function removeParticipant(participant) {
    if (!participant || !participant.id) {
        console.error("Invalid participant object in removeParticipant");
        return;
    }
    
    participantCount--;
    
    
    const participantListEl = document.getElementById(`participant-list-${participant.id}`);
    if (participantListEl) {
        participantListEl.style.transition = "opacity 0.3s ease";
        participantListEl.style.opacity = "0";
        
        setTimeout(() => {
            if (participantListEl.parentNode) {
                participantListEl.remove();
            }
        }, 300);
    }
    
    
    const videoEl = document.getElementById(`video-${participant.id}`);
    if (videoEl) {
        videoEl.style.transition = "opacity 0.3s ease";
        videoEl.style.opacity = "0";
        
        setTimeout(() => {
            if (videoEl.parentNode) {
                videoEl.remove();
            }
        }, 300);
    }
    
    
    const audioContainer = document.getElementById(`audio-container-${participant.id}`);
    if (audioContainer) {
        audioContainer.remove();
    }
    
    
    const screenShareEl = document.getElementById(`screen-share-${participant.id}`);
    if (screenShareEl) {
        screenShareEl.remove();
    }
    
    
    updateParticipantsPanel();
}

function updateParticipantsPanel() {
    const panel = document.getElementById("participantsPanel");
    if (!panel) return;
    
    if (participantCount > 0) {
        panel.classList.remove("hidden");
    } else {
        panel.classList.add("hidden");
    }
}

function showToast(message, type = "info") {
    if (!message) return;
    
    
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        toastContainer.className = "fixed bottom-4 right-4 z-50 flex flex-col gap-2";
        document.body.appendChild(toastContainer);
    }
    
    
    const toast = document.createElement("div");
    toast.className = `px-4 py-2 rounded-md shadow-lg text-white flex items-center ${
        type === "error" ? "bg-[#ED4245]" : 
        type === "success" ? "bg-[#3BA55D]" : 
        "bg-[#5865F2]"
    }`;
    
    
    const icon = type === "error" ? "times-circle" : 
                 type === "success" ? "check-circle" : 
                 "info-circle";
    
    toast.innerHTML = `
        <i class="fas fa-${icon} mr-2"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    
    setTimeout(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateX(0)";
    }, 10);
    
    
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(20px)";
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

async function initVoiceInterface() {
    try {
        if (window.videoSDKManager) {
            const config = window.videoSDKManager.getMetaConfig();
            
            window.videoSDKManager.init(config.authToken);
            
            setupEventHandlers();
            
            window.logger.debug('voice', "Voice interface initialized successfully");
                } else {
            initializeMeeting();
                }
            } catch (error) {
        console.error("Failed to initialize voice interface:", error);
        showToast("Failed to initialize voice interface: " + error.message, "error");
    }
}

function setupEventHandlers() {
    // Register custom event handlers with the SDK manager
    window.videoSDKManager.on("meeting-joined", () => {
        window.logger.info('voice', "Meeting Joined");
        
        const joinBtn = document.getElementById("joinBtn");
    const leaveBtn = document.getElementById("leaveBtn");
        const micBtn = document.getElementById("micBtn");
        const screenBtn = document.getElementById("screenBtn");
        const joinVideoBtn = document.getElementById("joinVideoBtn");
        
        if (joinBtn) joinBtn.classList.add("hidden");
    if (leaveBtn) {
            leaveBtn.classList.remove("hidden");
            leaveBtn.disabled = false;
        }
        
        if (micBtn) micBtn.disabled = false;
        if (screenBtn) screenBtn.disabled = false;
        
        if (joinVideoBtn) {
            joinVideoBtn.classList.remove("hidden");
            joinVideoBtn.disabled = false;
        }
        
        showToast("Connected to voice", "success");
        addParticipant(window.videoSDKManager.meeting.localParticipant);

        // Add all other participants already in the meeting
        Object.values(window.videoSDKManager.meeting.participants || {}).forEach((p) => {
            if (p.id !== window.videoSDKManager.meeting.localParticipant.id) addParticipant(p);
        });

        setTimeout(() => {
            updateParticipantsPanel();
        }, 500);

        const channelNameElement = document.querySelector('.text-white.font-medium');
        const channelName = channelNameElement ? channelNameElement.textContent : 'Voice Channel';
        const voiceConnectEvent = new CustomEvent('voiceConnect', { 
            detail: { 
                channelName: channelName,
                meetingId: window.videoSDKManager.getMetaConfig().meetingId,
                channelId: window.videoSDKManager.getMetaConfig().channelId
            } 
        });
        window.dispatchEvent(voiceConnectEvent);
        window.videosdkMeeting = window.videoSDKManager.meeting;
    });
    
    window.videoSDKManager.on("meeting-left", () => {
        window.logger.info('voice', "Meeting Left");
        
        const joinBtn = document.getElementById("joinBtn");
        const leaveBtn = document.getElementById("leaveBtn");
    const micBtn = document.getElementById("micBtn");
        const screenBtn = document.getElementById("screenBtn");
        const joinVideoBtn = document.getElementById("joinVideoBtn");
        const participants = document.getElementById("participants");
        const videosContainer = document.getElementById("videosContainer");
        const participantsPanel = document.getElementById("participantsPanel");
        const videoContainer = document.getElementById("videoContainer");
        
        if (joinBtn) joinBtn.classList.remove("hidden");
        if (leaveBtn) leaveBtn.classList.add("hidden");
        
        if (micBtn) micBtn.disabled = true;
        if (screenBtn) screenBtn.disabled = true;
        if (joinVideoBtn) joinVideoBtn.classList.add("hidden");
        
    if (micBtn) {
                    micBtn.innerHTML = '<i class="fas fa-microphone text-sm"></i>';
            micBtn.classList.remove("bg-[#ED4245]");
        }
        
        if (screenBtn) {
            screenBtn.innerHTML = '<i class="fas fa-desktop text-sm"></i>';
            screenBtn.classList.remove("bg-[#5865F2]");
        }
        
        if (participants) participants.innerHTML = "";
        if (videosContainer) videosContainer.innerHTML = "";
        participantCount = 0;
        
        if (participantsPanel) participantsPanel.classList.add("hidden");
        if (videoContainer) videoContainer.classList.add("hidden");
        
        showToast("Disconnected from voice", "error");
        
        const voiceDisconnectEvent = new CustomEvent('voiceDisconnect');
        window.dispatchEvent(voiceDisconnectEvent);
        window.videosdkMeeting = null;
    });
    
    window.videoSDKManager.on("participant-joined", (participant) => {
        window.logger.debug('voice', "Participant Joined: ", participant);
        addParticipant(participant);
        updateParticipantsPanel();
    });
    
    window.videoSDKManager.on("participant-left", (participant) => {
        window.logger.debug('voice', "Participant Left: ", participant);
        removeParticipant(participant);
        updateParticipantsPanel();
    });
    
    window.videoSDKManager.on("error", async (error) => {
        console.error("Meeting error:", error);
        
        if (error.message && (error.message.includes('404') || error.message.includes('not found') || error.code === 4001)) {
            window.logger.warn('voice', "Meeting not found, attempting to create a new meeting...");
            
            if (!window.videoSDKManager.meetingCreated) {
                try {
                    const config = window.videoSDKManager.getMetaConfig();
                    const newMeetingId = await window.videoSDKManager.createMeetingRoom();
                    
                    if (newMeetingId) {
                        window.logger.info('voice', "New meeting created with ID:", newMeetingId);
                        
                        // Initialize a new meeting with the new ID
                        const config = window.videoSDKManager.getMetaConfig();
                        const meeting = window.videoSDKManager.initMeeting({
                            meetingId: newMeetingId,
                            name: config.participantName,
                            micEnabled: true,
                            webcamEnabled: false
                        });
                        
                        // Try joining the meeting
                        await window.videoSDKManager.joinMeeting();
                        return;
                } else {
                        window.logger.error('voice', "Failed to create new meeting after error");
                        showToast("Error: Could not recreate the voice meeting", "error");
                        resetUIState();
                        return;
                    }
                } catch (createError) {
                    window.logger.error('voice', "Error creating new meeting:", createError);
                    showToast("Error: " + (createError.message || "Failed to create a new meeting"), "error");
                    resetUIState();
                    return;
                }
            }
        }
        
        showToast("Error: " + (error.message || "Unknown error occurred"), "error");
    });
}

// Add this function near the top of the file
function dispatchVoiceEvent(eventName, detail = {}) {
    console.log(`[VOICE] Dispatching ${eventName} event`);
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
}