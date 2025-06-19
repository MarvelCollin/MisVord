document.addEventListener("DOMContentLoaded", () => {    if (document.getElementById('videoContainer')) {
        waitForVideoSDK(() => {
            logger.info('voice', "VideoSDK ready. Click 'Join Call' to create and join a meeting.");
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
const authToken = getMeta('videosdk-token');
let meetingId = getMeta('meeting-id');
const participantName = getMeta('username');
const channelId = getMeta('channel-id');

function waitForVideoSDK(callback, maxAttempts = 50) {
    let attempts = 0;
    const checkSDK = () => {
        attempts++;        if (typeof VideoSDK !== 'undefined' && VideoSDK.config && VideoSDK.initMeeting) {
            logger.debug('voice', "VideoSDK loaded successfully");
            callback();
        } else if (attempts < maxAttempts) {
            setTimeout(checkSDK, 100);
        } else {
            logger.error('voice', "VideoSDK failed to load after", maxAttempts * 100, "ms");
            alert("Failed to load VideoSDK. Please refresh the page.");
        }
    };
    checkSDK();
}

async function createMeetingRoom() {
    try {
        logger.info('voice', "Creating new meeting room...");
        
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
            logger.debug('voice', "Meeting room created:", data);
            meetingCreated = true;
            return data.roomId;
        } else {
            const errorText = await response.text();
            logger.error('voice', "Failed to create meeting room:", response.status, errorText);
            return null;
        }
    } catch (error) {
        logger.error('voice', "Error creating meeting room:", error);
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
        });        logger.debug('voice', "Meeting initialized:", meeting);

        meeting.on("meeting-joined", () => {
            logger.info('voice', "Meeting Joined");
            document.getElementById("joinBtn").disabled = true;
            document.getElementById("leaveBtn").disabled = false;
            document.getElementById("micBtn").disabled = false;
            document.getElementById("camBtn").disabled = false;
            document.getElementById("screenBtn").disabled = false;
            
            addParticipant(meeting.localParticipant);
        });

        meeting.on("meeting-left", () => {
            logger.info('voice', "Meeting Left");
            document.getElementById("joinBtn").disabled = false;
            document.getElementById("leaveBtn").disabled = true;
            document.getElementById("micBtn").disabled = true;
            document.getElementById("camBtn").disabled = true;
            document.getElementById("screenBtn").disabled = true;
            
            document.getElementById("videosContainer").innerHTML = "";
            document.getElementById("participants").innerHTML = "";
        });

        meeting.on("participant-joined", (participant) => {
            logger.debug('voice', "Participant Joined: ", participant);
            addParticipant(participant);
        });

        meeting.on("participant-left", (participant) => {
            logger.debug('voice', "Participant Left: ", participant);
            removeParticipant(participant);
        });

        meeting.on("presenter-changed", (presenterId) => {
            logger.debug('voice', "Presenter changed: ", presenterId);
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
            
            alert("Meeting error: " + error.message);
        });

    } catch (error) {
        console.error("Failed to initialize meeting:", error);
        alert("Failed to initialize VideoSDK meeting: " + error.message);
    }
}

function addParticipant(participant) {
  const videosContainer = document.getElementById("videosContainer");
  const participantsList = document.getElementById("participants");

  const videoElement = document.createElement("div");
  videoElement.id = `participant-${participant.id}`;
  videoElement.className = "bg-gray-700 rounded-lg flex items-center justify-center relative";
  videoElement.innerHTML = `
    <div class="text-white text-center">
      <div class="text-sm mb-2">${participant.displayName}</div>
      <video id="video-${participant.id}" autoplay playsinline class="w-full h-full rounded-lg" style="display: none;"></video>
      <audio id="audio-${participant.id}" autoplay playsinline></audio>
      <div id="avatar-${participant.id}" class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-2xl">
        ${participant.displayName.charAt(0).toUpperCase()}
      </div>
    </div>
  `;
  videosContainer.appendChild(videoElement);

  const participantDiv = document.createElement("div");
  participantDiv.id = `participant-list-${participant.id}`;
  participantDiv.className = "text-sm py-1";
  participantDiv.textContent = participant.displayName;
  participantsList.appendChild(participantDiv);

  participant.on("stream-enabled", (stream) => {
    if (stream.kind === "video") {
      const videoElement = document.getElementById(`video-${participant.id}`);
      const avatarElement = document.getElementById(`avatar-${participant.id}`);
      const videoObj = new MediaStream();
      videoObj.addTrack(stream.track);
      videoElement.srcObject = videoObj;
      videoElement.style.display = "block";
      avatarElement.style.display = "none";
    }
    if (stream.kind === "audio") {
      const audioElement = document.getElementById(`audio-${participant.id}`);
      const audioObj = new MediaStream();
      audioObj.addTrack(stream.track);
      audioElement.srcObject = audioObj;
    }
    if (stream.kind === "share") {
      const videoElement = document.getElementById(`video-${participant.id}`);
      const videoObj = new MediaStream();
      videoObj.addTrack(stream.track);
      videoElement.srcObject = videoObj;
      videoElement.style.display = "block";
    }
  });

  participant.on("stream-disabled", (stream) => {
    if (stream.kind === "video") {
      const videoElement = document.getElementById(`video-${participant.id}`);
      const avatarElement = document.getElementById(`avatar-${participant.id}`);
      videoElement.style.display = "none";
      avatarElement.style.display = "flex";
    }
  });
}

function removeParticipant(participant) {
  const videoElement = document.getElementById(`participant-${participant.id}`);
  const participantListElement = document.getElementById(`participant-list-${participant.id}`);
  
  if (videoElement) videoElement.remove();
  if (participantListElement) participantListElement.remove();
}

document.addEventListener("DOMContentLoaded", () => {
    const joinBtn = document.getElementById("joinBtn");
    if (joinBtn) {
        joinBtn.addEventListener("click", async () => {
            try {
                joinBtn.disabled = true;
                joinBtn.innerHTML = "Creating Meeting...";
                
                const newMeetingId = await createMeetingRoom();
                
                if (!newMeetingId) {
                    alert("Failed to create meeting room. Please try again.");
                    joinBtn.disabled = false;
                    joinBtn.innerHTML = "Join Call";
                    return;
                }
                
                meetingId = newMeetingId;
                console.log("Using meeting ID:", meetingId);
                
                joinBtn.innerHTML = "Joining...";
                
                await initializeMeeting();
                
                if (meeting) {
                    try {
                        await meeting.join();
                    } catch (error) {
                        console.error("Failed to join meeting:", error);
                        alert("Failed to join meeting: " + error.message);
                        joinBtn.disabled = false;
                        joinBtn.innerHTML = "Join Call";
                    }
                } else {
                    console.error("Meeting not initialized");
                    joinBtn.disabled = false;
                    joinBtn.innerHTML = "Join Call";
                }
                
            } catch (error) {
                console.error("Error in join process:", error);
                alert("Error joining call: " + error.message);
                joinBtn.disabled = false;
                joinBtn.innerHTML = "Join Call";
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
                    micBtn.innerHTML = "🔇 Unmute";
                } else {
                    meeting.unmuteMic();
                    micBtn.innerHTML = "🎤 Mute";
                }
            }
        });
    }

    // Camera button
    const camBtn = document.getElementById("camBtn");
    if (camBtn) {
        camBtn.addEventListener("click", () => {
            if (meeting && meeting.localParticipant) {
                if (meeting.localParticipant.streams.has("video")) {
                    meeting.disableWebcam();
                    camBtn.innerHTML = "📹 Enable Cam";
                } else {
                    meeting.enableWebcam();
                    camBtn.innerHTML = "📹 Disable Cam";
                }
            }
        });
    }

    // Screen share button
    const screenBtn = document.getElementById("screenBtn");
    if (screenBtn) {
        screenBtn.addEventListener("click", () => {
            if (meeting && meeting.localParticipant) {
                if (meeting.localParticipant.streams.has("share")) {
                    meeting.disableScreenShare();
                    screenBtn.innerHTML = "🖥️ Share Screen";
                } else {
                    meeting.enableScreenShare();
                    screenBtn.innerHTML = "🖥️ Stop Sharing";
                }
            }
        });
    }
}); 