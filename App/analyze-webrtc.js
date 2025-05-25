// WebRTC Analysis Script
console.log('=== WebRTC Project Analysis ===');

const fs = require('fs');
const path = require('path');

// Check if key files exist
const filesToCheck = [
  'socket-server.js',
  'views/pages/webrtc.php',
  'public/js/webrtc-modules/media-control.js',
  'public/js/webrtc-modules/signaling.js',
  'public/js/webrtc-modules/webrtc-controller.js',
  'public/js/webrtc-modules/peer-connection.js',
  'public/js/webrtc-modules/ui-manager.js',
  'public/js/webrtc-modules/video-handling.js'
];

console.log('\nFile existence check:');
filesToCheck.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${file}: ${exists ? '✓' : '✗'}`);
});

// Check socket server configuration
console.log('\nSocket server environment check:');
console.log('  IS_VPS env var:', process.env.IS_VPS || 'Not set');
console.log('  USE_HTTPS env var:', process.env.USE_HTTPS || 'Not set');
console.log('  DOMAIN env var:', process.env.DOMAIN || 'Not set');
console.log('  PORT env var:', process.env.PORT || 'Not set');

// Read and analyze socket server configuration
if (fs.existsSync('socket-server.js')) {
  const socketServerContent = fs.readFileSync('socket-server.js', 'utf8');
  
  console.log('\nSocket server analysis:');
  if (socketServerContent.includes('isVpsEnvironment')) {
    console.log('  ✓ VPS environment detection present');
  }
  if (socketServerContent.includes('socketPath')) {
    console.log('  ✓ Socket path configuration present');
  }
  if (socketServerContent.includes('videoChatUsers')) {
    console.log('  ✓ Video chat user management present');
  }
  if (socketServerContent.includes('WebRTC signaling')) {
    console.log('  ✓ WebRTC signaling handlers present');
  }
}

// Check WebRTC modules directory
const webrtcModulesDir = 'public/js/webrtc-modules';
if (fs.existsSync(webrtcModulesDir)) {
  console.log('\nWebRTC modules directory contents:');
  const files = fs.readdirSync(webrtcModulesDir);
  files.forEach(file => {
    if (file.endsWith('.js')) {
      console.log(`  ✓ ${file}`);
    }
  });
} else {
  console.log('\n✗ WebRTC modules directory not found');
}

// Check for common WebRTC issues
console.log('\nPotential issue analysis:');

// Check media-control.js for screen sharing functions
if (fs.existsSync('public/js/webrtc-modules/media-control.js')) {
  const mediaControlContent = fs.readFileSync('public/js/webrtc-modules/media-control.js', 'utf8');
  
  console.log('  Media Control module:');
  if (mediaControlContent.includes('startScreenSharing')) {
    console.log('    ✓ startScreenSharing function found');
  } else {
    console.log('    ✗ startScreenSharing function missing');
  }
  
  if (mediaControlContent.includes('stopScreenSharing')) {
    console.log('    ✓ stopScreenSharing function found');
  } else {
    console.log('    ✗ stopScreenSharing function missing');
  }
  
  if (mediaControlContent.includes('toggleLocalVideo')) {
    console.log('    ✓ toggleLocalVideo function found');
  } else {
    console.log('    ✗ toggleLocalVideo function missing');
  }
  
  if (mediaControlContent.includes('toggleLocalAudio')) {
    console.log('    ✓ toggleLocalAudio function found');
  } else {
    console.log('    ✗ toggleLocalAudio function missing');
  }
}

// Check webrtc-controller.js for toggle functions
if (fs.existsSync('public/js/webrtc-modules/webrtc-controller.js')) {
  const controllerContent = fs.readFileSync('public/js/webrtc-modules/webrtc-controller.js', 'utf8');
  
  console.log('  WebRTC Controller module:');
  if (controllerContent.includes('toggleScreenSharing')) {
    console.log('    ✓ toggleScreenSharing function found');
  } else {
    console.log('    ✗ toggleScreenSharing function missing');
  }
}

// Check signaling.js for connection issues
if (fs.existsSync('public/js/webrtc-modules/signaling.js')) {
  const signalingContent = fs.readFileSync('public/js/webrtc-modules/signaling.js', 'utf8');
  
  console.log('  Signaling module:');
  if (signalingContent.includes('connectToSignalingServer')) {
    console.log('    ✓ connectToSignalingServer function found');
  } else {
    console.log('    ✗ connectToSignalingServer function missing');
  }
  
  if (signalingContent.includes('WebRTCConfig')) {
    console.log('    ✓ WebRTCConfig usage found');
  } else {
    console.log('    ✗ WebRTCConfig usage missing');
  }
}

console.log('\n=== Analysis Complete ===');
