<?php
// Load VideoSDK configuration
require_once dirname(__DIR__, 3) . '/config/videosdk.php';

if (!isset($currentServer) || empty($currentServer)) {
    echo '<div class="flex-1 bg-discord-background flex items-center justify-center text-white text-lg">Select a server to view channels</div>';
    return;
}

$activeChannelId = $GLOBALS['activeChannelId'] ?? null;
$activeChannel = $GLOBALS['activeChannel'] ?? null;

if (!$activeChannel) {
    echo '<div class="flex-1 bg-discord-background flex items-center justify-center text-white text-lg">Select a voice channel</div>';
    return;
}

$meetingId = 'voice_channel_' . $activeChannelId;
$userName = $_SESSION['username'] ?? 'Anonymous';
$authToken = VideoSDKConfig::getAuthToken();
?>

<div class="min-h-screen bg-discord-background flex flex-col">
    <header class="h-16 flex items-center px-6 bg-discord-dark shadow">
        <h1 class="text-white text-2xl font-bold"><?php echo htmlspecialchars($activeChannel['name'] ?? 'Voice Channel'); ?></h1>
    </header>
    
    <main class="flex-1 p-6">
        <!-- Video Container -->
        <div id="videoContainer" class="w-full h-96 bg-gray-900 rounded-lg mb-4 p-4">
            <div id="videosContainer" class="grid grid-cols-2 gap-4 h-full"></div>
        </div>
        
        <!-- Controls -->
        <div class="flex justify-center space-x-4 mb-4">
            <button id="joinBtn" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md">
                Join Call
            </button>
            <button id="leaveBtn" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md" disabled>
                Leave Call
            </button>
            <button id="micBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md" disabled>
                🎤 Mic
            </button>
            <button id="camBtn" class="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-md" disabled>
                📹 Camera
            </button>
            <button id="screenBtn" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md" disabled>
                🖥️ Screen
            </button>
        </div>
        
        <!-- Participants List -->
        <div id="participantsList" class="bg-gray-800 rounded-lg p-4">
            <h3 class="text-white text-lg mb-2">Participants</h3>
            <div id="participants" class="text-gray-300"></div>
        </div>
    </main>
</div>

<script src="https://sdk.videosdk.live/js-sdk/0.0.82/videosdk.js"></script>
<script>
// VideoSDK Configuration - Using actual credentials
const authToken = "<?php echo $authToken; ?>";
let meetingId = "<?php echo $meetingId; ?>";
const participantName = "<?php echo addslashes($userName); ?>";
const channelId = "<?php echo $activeChannelId; ?>";

// Meeting instance
let meeting;
let meetingCreated = false;

// Wait for VideoSDK to load properly
function waitForVideoSDK(callback, maxAttempts = 50) {
    let attempts = 0;
    const checkSDK = () => {
        attempts++;
        if (typeof VideoSDK !== 'undefined' && VideoSDK.config && VideoSDK.initMeeting) {
            console.log("VideoSDK loaded successfully");
            callback();
        } else if (attempts < maxAttempts) {
            setTimeout(checkSDK, 100);
        } else {
            console.error("VideoSDK failed to load after", maxAttempts * 100, "ms");
            alert("Failed to load VideoSDK. Please refresh the page.");
        }
    };
    checkSDK();
}

// Create a new meeting via VideoSDK API
async function createMeetingRoom() {
    try {
        console.log("Creating new meeting room...");
        
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
            console.log("Meeting room created:", data);
            meetingCreated = true;
            return data.roomId;
        } else {
            const errorText = await response.text();
            console.error("Failed to create meeting room:", response.status, errorText);
            return null;
        }
    } catch (error) {
        console.error("Error creating meeting room:", error);
        return null;
    }
}

// Initialize meeting
async function initializeMeeting() {
    try {
        // Configure VideoSDK with auth token
        VideoSDK.config(authToken);
        
        // Initialize meeting
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

        console.log("Meeting initialized:", meeting);

        // Meeting events
        meeting.on("meeting-joined", () => {
            console.log("Meeting Joined");
            document.getElementById("joinBtn").disabled = true;
            document.getElementById("leaveBtn").disabled = false;
            document.getElementById("micBtn").disabled = false;
            document.getElementById("camBtn").disabled = false;
            document.getElementById("screenBtn").disabled = false;
            
            // Show local participant
            addParticipant(meeting.localParticipant);
        });

        meeting.on("meeting-left", () => {
            console.log("Meeting Left");
            document.getElementById("joinBtn").disabled = false;
            document.getElementById("leaveBtn").disabled = true;
            document.getElementById("micBtn").disabled = true;
            document.getElementById("camBtn").disabled = true;
            document.getElementById("screenBtn").disabled = true;
            
            // Clear participants
            document.getElementById("videosContainer").innerHTML = "";
            document.getElementById("participants").innerHTML = "";
        });

        meeting.on("participant-joined", (participant) => {
            console.log("Participant Joined: ", participant);
            addParticipant(participant);
        });

        meeting.on("participant-left", (participant) => {
            console.log("Participant Left: ", participant);
            removeParticipant(participant);
        });

        meeting.on("presenter-changed", (presenterId) => {
            console.log("Presenter changed: ", presenterId);
        });

        meeting.on("error", async (error) => {
            console.error("Meeting error:", error);
            
            // Check if it's a meeting not found error (404)
            if (error.message && (error.message.includes('404') || error.message.includes('not found') || error.code === 4001)) {
                console.log("Meeting not found, creating new meeting...");
                
                if (!meetingCreated) {
                    const newMeetingId = await createNewMeeting();
                    if (newMeetingId) {
                        meetingId = newMeetingId;
                        meetingCreated = true;
                        console.log("New meeting created with ID:", meetingId);
                        
                        // Reinitialize with new meeting ID
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

// Add participant to UI
function addParticipant(participant) {
  const videosContainer = document.getElementById("videosContainer");
  const participantsList = document.getElementById("participants");

  // Create video element
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

  // Add to participants list
  const participantDiv = document.createElement("div");
  participantDiv.id = `participant-list-${participant.id}`;
  participantDiv.className = "text-sm py-1";
  participantDiv.textContent = participant.displayName;
  participantsList.appendChild(participantDiv);

  // Handle streams
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

// Remove participant from UI
function removeParticipant(participant) {
  const videoElement = document.getElementById(`participant-${participant.id}`);
  const participantListElement = document.getElementById(`participant-list-${participant.id}`);
  
  if (videoElement) videoElement.remove();
  if (participantListElement) participantListElement.remove();
}

// Event Listeners
document.getElementById("joinBtn").addEventListener("click", async () => {
    try {
        // Disable button to prevent multiple clicks
        document.getElementById("joinBtn").disabled = true;
        document.getElementById("joinBtn").innerHTML = "Creating Meeting...";
        
        // First, create a new meeting room
        const newMeetingId = await createMeetingRoom();
        
        if (!newMeetingId) {
            alert("Failed to create meeting room. Please try again.");
            document.getElementById("joinBtn").disabled = false;
            document.getElementById("joinBtn").innerHTML = "Join Call";
            return;
        }
        
        // Update meeting ID with the newly created one
        meetingId = newMeetingId;
        console.log("Using meeting ID:", meetingId);
        
        document.getElementById("joinBtn").innerHTML = "Joining...";
        
        // Initialize meeting with new ID
        await initializeMeeting();
        
        if (meeting) {
            try {
                await meeting.join();
            } catch (error) {
                console.error("Failed to join meeting:", error);
                alert("Failed to join meeting: " + error.message);
                document.getElementById("joinBtn").disabled = false;
                document.getElementById("joinBtn").innerHTML = "Join Call";
            }
        } else {
            console.error("Meeting not initialized");
            document.getElementById("joinBtn").disabled = false;
            document.getElementById("joinBtn").innerHTML = "Join Call";
        }
        
    } catch (error) {
        console.error("Error in join process:", error);
        alert("Error joining call: " + error.message);
        document.getElementById("joinBtn").disabled = false;
        document.getElementById("joinBtn").innerHTML = "Join Call";
    }
});

document.getElementById("leaveBtn").addEventListener("click", () => {
    if (meeting) {
        meeting.leave();
    }
});

document.getElementById("micBtn").addEventListener("click", () => {
    if (meeting && meeting.localParticipant) {
        if (meeting.localParticipant.streams.has("audio")) {
            meeting.muteMic();
            document.getElementById("micBtn").innerHTML = "🔇 Unmute";
        } else {
            meeting.unmuteMic();
            document.getElementById("micBtn").innerHTML = "🎤 Mute";
        }
    }
});

document.getElementById("camBtn").addEventListener("click", () => {
    if (meeting && meeting.localParticipant) {
        if (meeting.localParticipant.streams.has("video")) {
            meeting.disableWebcam();
            document.getElementById("camBtn").innerHTML = "📹 Enable Cam";
        } else {
            meeting.enableWebcam();
            document.getElementById("camBtn").innerHTML = "📹 Disable Cam";
        }
    }
});

document.getElementById("screenBtn").addEventListener("click", () => {
    if (meeting && meeting.localParticipant) {
        if (meeting.localParticipant.streams.has("share")) {
            meeting.disableScreenShare();
            document.getElementById("screenBtn").innerHTML = "🖥️ Share Screen";
        } else {
            meeting.enableScreenShare();
            document.getElementById("screenBtn").innerHTML = "🖥️ Stop Sharing";
        }
    }
});

// Initialize when DOM is ready and VideoSDK is loaded
document.addEventListener("DOMContentLoaded", () => {
    waitForVideoSDK(() => {
        console.log("VideoSDK ready. Click 'Join Call' to create and join a meeting.");
    });
});

// Fallback for window load event
window.addEventListener("load", () => {
    if (!meeting) {
        waitForVideoSDK(initializeMeeting);
    }
});
</script>
