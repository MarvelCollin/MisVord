document.addEventListener("DOMContentLoaded", () => {    
    if (document.getElementById('videoContainer')) {
        waitForVideoSDK(() => {
            window.logger.info('voice', "VideoSDK ready. Auto-joining voice channel...");
            // Auto-join the channel when page loads
            setTimeout(() => {
                const joinBtn = document.getElementById("joinBtn");
                if (joinBtn) joinBtn.click();
            }, 500);
        });
    }
});

window.addEventListener("load", () => {
    if (document.getElementById('videoContainer') && !meeting) {
        waitForVideoSDK(initializeMeeting);
    }
});

const getMeta = (name) => {
    const meta = document.querySelector(`meta[name="${name}"]`);
    return meta ? meta.getAttribute('content') : null;
};

let meeting;
let meetingCreated = false;
let participantCount = 0;
const authToken = getMeta('videosdk-token');
let meetingId = getMeta('meeting-id');
const participantName = getMeta('username');
const channelId = getMeta('channel-id');

function waitForVideoSDK(callback, maxAttempts = 50) {
    let attempts = 0;
    const checkSDK = () => {
        attempts++;
        if (typeof VideoSDK !== 'undefined' && VideoSDK.config && VideoSDK.initMeeting) {
            window.logger.debug('voice', "VideoSDK loaded successfully");
            callback();
        } else if (attempts < maxAttempts) {
            setTimeout(checkSDK, 100);
        } else {
            window.logger.error('voice', "VideoSDK failed to load after", maxAttempts * 100, "ms");
            alert("Failed to load VideoSDK. Please refresh the page.");
        }
    };
    checkSDK();
}

async function createMeetingRoom() {
    if (!authToken) {
        console.error("Missing VideoSDK auth token");
        showToast("Error: Missing authentication token", "error");
        return null;
    }
    
    try {
        window.logger.info('voice', "Creating new meeting room...");
        
        const response = await fetch('https://api.videosdk.live/v2/rooms', {
            method: 'POST',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        if (response.ok) {
            const data = await response.json();
            window.logger.debug('voice', "Meeting room created:", data);
            meetingCreated = true;
            return data.roomId;
        } else {
            const errorText = await response.text();
            window.logger.error('voice', "Failed to create meeting room:", response.status, errorText);
            return null;
        }
    } catch (error) {
        window.logger.error('voice', "Error creating meeting room:", error);
        return null;
    }
}

async function initializeMeeting() {
    try {
        VideoSDK.config(authToken);
        
        meeting = VideoSDK.initMeeting({
            meetingId: meetingId,
            name: participantName,
            micEnabled: true,
            webcamEnabled: false,
            participantCanToggleSelfWebcam: true,
            participantCanMute: true,
            participantCanUnmute: true,
            chatEnabled: false,
            screenShareEnabled: true,
            pollEnabled: false,
            whiteBoardEnabled: false,
            raiseHandEnabled: false
        });
        
        window.logger.debug('voice', "Meeting initialized:", meeting);

        meeting.on("meeting-joined", () => {
            window.logger.info('voice', "Meeting Joined");
            
            // Get all UI elements
            const joinBtn = document.getElementById("joinBtn");
            const leaveBtn = document.getElementById("leaveBtn");
            const micBtn = document.getElementById("micBtn");
            const screenBtn = document.getElementById("screenBtn");
            const joinVideoBtn = document.getElementById("joinVideoBtn");
            
            // Hide join button, show leave button
            if (joinBtn) joinBtn.classList.add("hidden");
            if (leaveBtn) {
                leaveBtn.classList.remove("hidden");
                leaveBtn.disabled = false;
            }
            
            // Enable control buttons
            if (micBtn) micBtn.disabled = false;
            if (screenBtn) screenBtn.disabled = false;
            
            // Show video button if needed
            if (joinVideoBtn) {
                joinVideoBtn.classList.remove("hidden");
                joinVideoBtn.disabled = false;
            }
            
            // Add notification
            showToast("Connected to voice", "success");
            
            // Add local participant
            addParticipant(meeting.localParticipant);
            
            // Show participant panel if there are participants
            setTimeout(() => {
                updateParticipantsPanel();
            }, 500);

            // Trigger global voice indicator
            const channelNameElement = document.querySelector('.text-white.font-medium');
            const channelName = channelNameElement ? channelNameElement.textContent : 'Voice Channel';
            const voiceConnectEvent = new CustomEvent('voiceConnect', { 
                detail: { 
                    channelName: channelName,
                    meetingId: meetingId,
                    channelId: channelId
                } 
            });
            window.dispatchEvent(voiceConnectEvent);
            window.videosdkMeeting = meeting;
        });

        meeting.on("meeting-left", () => {
            window.logger.info('voice', "Meeting Left");
            
            // Show join button, hide leave button
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
            
            // Disable control buttons
            if (micBtn) micBtn.disabled = true;
            if (screenBtn) screenBtn.disabled = true;
            if (joinVideoBtn) joinVideoBtn.classList.add("hidden");
            
            // Reset button states
            if (micBtn) {
                micBtn.innerHTML = '<i class="fas fa-microphone text-sm"></i>';
                micBtn.classList.remove("bg-[#ED4245]");
            }
            
            if (screenBtn) {
                screenBtn.innerHTML = '<i class="fas fa-desktop text-sm"></i>';
                screenBtn.classList.remove("bg-[#5865F2]");
            }
            
            // Clear participants
            if (participants) participants.innerHTML = "";
            if (videosContainer) videosContainer.innerHTML = "";
            participantCount = 0;
            
            // Hide panels
            if (participantsPanel) participantsPanel.classList.add("hidden");
            if (videoContainer) videoContainer.classList.add("hidden");
            
            // Show disconnected notification
            showToast("Disconnected from voice", "error");

            // Trigger global voice indicator disconnect
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
            
            if (error.message && (error.message.includes('404') || error.message.includes('not found') || error.code === 4001)) {
                console.log("Meeting not found, creating new meeting...");
                
                if (!meetingCreated) {
                    const newMeetingId = await createNewMeeting();
                    if (newMeetingId) {
                        meetingId = newMeetingId;
                        meetingCreated = true;
                        console.log("New meeting created with ID:", meetingId);
                        
                        await initializeMeeting();
                        return;
                    }
                }
            }
            
            showToast("Error: " + error.message, "error");
        });

    } catch (error) {
        console.error("Failed to initialize meeting:", error);
        showToast("Failed to initialize meeting: " + error.message, "error");
    }
}

function addParticipant(participant) {
    if (!participant) {
        console.error("Invalid participant object");
        return;
    }
    
    participantCount++;
    
    // Get initials for avatar
    const initials = participant.displayName ? participant.displayName.charAt(0).toUpperCase() : 'U';
    
    // Generate a consistent color based on the display name
    const nameHash = [...(participant.displayName || 'User')].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = nameHash % 360;
    const avatarColor = `hsl(${hue}, 70%, 40%)`;
  
    // Add to participants list in the panel
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
    
    // Create audio element for the participant
    const audioContainer = document.createElement("div");
    audioContainer.id = `audio-container-${participant.id}`;
    audioContainer.style.display = "none";
    audioContainer.innerHTML = `<audio id="audio-${participant.id}" autoplay playsinline></audio>`;
    document.body.appendChild(audioContainer);
    
    // Show/create video element if needed (initially hidden)
    const videosContainer = document.getElementById("videosContainer");
    if (videosContainer) {
        const videoDiv = document.createElement("div");
        videoDiv.id = `video-${participant.id}`;
        videoDiv.className = "relative w-36 h-36 mx-auto"; // Make it centered like Discord
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
    
    // Update the video display
    const videoContainer = document.getElementById("videoContainer");
    if (videoContainer) {
        videoContainer.classList.remove("hidden");
    }
    
    // Setup stream event handlers
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
            
            // Setup audio visualization/detection
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
            // Create a special screen share container
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
            
            // Update screen share button for local participant
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
            
            // Remove speaking indicator
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
            
            // Update screen share button for local participant
            if (participant.id === meeting?.localParticipant?.id) {
                const screenBtn = document.getElementById("screenBtn");
                if (screenBtn) {
                    screenBtn.classList.remove("bg-[#5865F2]");
                    screenBtn.classList.add("bg-[#272729]");
                }
            }
        }
    });
    
    // Show participants panel if not already shown
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
            
            // Only continue if the participant element still exists
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
    
    // Remove from participants list with fade effect
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
    
    // Remove video element if exists
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
    
    // Remove audio container
    const audioContainer = document.getElementById(`audio-container-${participant.id}`);
    if (audioContainer) {
        audioContainer.remove();
    }
    
    // Remove screen share if exists
    const screenShareEl = document.getElementById(`screen-share-${participant.id}`);
    if (screenShareEl) {
        screenShareEl.remove();
    }
    
    // Update participants panel
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
    
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        toastContainer.className = "fixed bottom-4 right-4 z-50 flex flex-col gap-2";
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement("div");
    toast.className = `px-4 py-2 rounded-md shadow-lg text-white flex items-center ${
        type === "error" ? "bg-[#ED4245]" : 
        type === "success" ? "bg-[#3BA55D]" : 
        "bg-[#5865F2]"
    }`;
    
    // Set icon based on type
    const icon = type === "error" ? "times-circle" : 
                 type === "success" ? "check-circle" : 
                 "info-circle";
    
    toast.innerHTML = `
        <i class="fas fa-${icon} mr-2"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    
    setTimeout(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateX(0)";
    }, 10);
    
    // Remove after delay
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

document.addEventListener("DOMContentLoaded", () => {
    const joinBtn = document.getElementById("joinBtn");
    if (joinBtn) {
        joinBtn.addEventListener("click", async () => {
            try {
                joinBtn.disabled = true;
                joinBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-sm"></i>';
                
                const newMeetingId = await createMeetingRoom();
                
                if (!newMeetingId) {
                    showToast("Failed to create meeting room", "error");
                    joinBtn.disabled = false;
                    joinBtn.innerHTML = '<i class="fas fa-phone text-sm"></i>';
                    return;
                }
                
                meetingId = newMeetingId;
                
                await initializeMeeting();
                
                if (meeting) {
                    try {
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
            if (meeting) {
                meeting.leave();
            }
        });
    }

    const micBtn = document.getElementById("micBtn");
    if (micBtn) {
        micBtn.addEventListener("click", () => {
            if (meeting && meeting.localParticipant) {
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
            if (meeting && meeting.localParticipant) {
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
            if (meeting && meeting.localParticipant) {
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