#!/usr/bin/env node

/**
 * Socket.IO VPS Connection Test Script
 * 
 * This script helps verify that your WebSocket server configuration is working properly
 * in your VPS environment. It tests both HTTP and WebSocket connections.
 * 
 * Usage:
 *   node test-vps-connection.js https://yourdomain.com/misvord
 */

const { io } = require('socket.io-client');
const axios = require('axios');

// Set timeout for operations
const TIMEOUT = 10000; // 10 seconds
let timeoutId;

// Get URL from command line argument or use default
const baseUrl = process.argv[2] || 'http://localhost:1002';
const socketPath = baseUrl.includes('/misvord') ? '/misvord/socket' : '';

// Parse URL and determine protocols
const isSecure = baseUrl.startsWith('https');
const httpProtocol = isSecure ? 'https://' : 'http://';
const wsProtocol = isSecure ? 'wss://' : 'ws://';

// Extract domain from URL
let domain = baseUrl.replace(/^https?:\/\//, '');
if (domain.includes('/')) {
  domain = domain.split('/')[0];
}

console.log(`
==========================================
🧪 WebRTC Socket.IO VPS Connection Test 🧪
==========================================

Testing connection to: ${baseUrl}
Socket path: ${socketPath}
HTTP Protocol: ${httpProtocol}
WebSocket Protocol: ${wsProtocol}
`);

// Set global timeout
timeoutId = setTimeout(() => {
  console.error('❌ Test timed out after ' + (TIMEOUT/1000) + ' seconds');
  process.exit(1);
}, TIMEOUT);

// Function to perform an HTTP request to the health endpoint
async function testHttpConnection() {
  console.log('1️⃣ Testing HTTP connection...');
  
  try {
    const healthEndpoint = `${baseUrl}${socketPath}/health`;
    console.log(`   Requesting: ${healthEndpoint}`);
    
    const response = await axios.get(healthEndpoint, { timeout: 5000 });
    console.log('✅ HTTP connection successful!');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...\n`);
    return true;
  } catch (error) {
    console.error('❌ HTTP connection failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('   No response received');
      console.error(`   Error: ${error.message}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    console.log('\nTrying alternative endpoint...');
    
    try {
      const altEndpoint = `${baseUrl}${socketPath}/socket-test`;
      console.log(`   Requesting: ${altEndpoint}`);
      const altResponse = await axios.get(altEndpoint, { timeout: 5000 });
      console.log('✅ Alternative HTTP endpoint successful!');
      console.log(`   Status: ${altResponse.status}`);
      return true;
    } catch (altError) {
      console.error('❌ Alternative endpoint also failed\n');
      return false;
    }
  }
}

// Function to test WebSocket connection using Socket.IO
async function testWebSocketConnection() {
  return new Promise((resolve) => {
    console.log('2️⃣ Testing WebSocket connection...');
    
    const socketUrl = `${baseUrl}${socketPath}`;
    console.log(`   Connecting to: ${socketUrl}`);
    
    const socket = io(socketUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 2,
      timeout: 5000,
      path: '/socket.io'
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connection successful!');
      console.log(`   Socket ID: ${socket.id}`);
      
      // Test ping
      socket.emit('ping-server', { timestamp: Date.now() }, (response) => {
        console.log('✅ Ping successful!');
        console.log(`   Latency: ${response.latency}ms`);
        console.log(`   Server users: ${response.serverUsers}`);
        socket.disconnect();
        resolve(true);
      });
      
      // If no response after 3 seconds, continue anyway
      setTimeout(() => {
        if (socket.connected) {
          console.log('⚠️ Connected but no ping response');
          socket.disconnect();
          resolve(true);
        }
      }, 3000);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:');
      console.error(`   Error: ${error.message}`);
      socket.disconnect();
      resolve(false);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:');
      console.error(`   Error: ${error}`);
      socket.disconnect();
      resolve(false);
    });
    
    socket.on('disconnect', (reason) => {
      console.log(`   Disconnected: ${reason}\n`);
    });
  });
}

// Function to check for potential issues based on test results
function checkForIssues(httpSuccess, wsSuccess) {
  console.log('3️⃣ Analyzing results...');
  
  if (httpSuccess && wsSuccess) {
    console.log('✅ All tests passed! Your VPS setup appears to be working correctly.');
    return;
  }
  
  // Identify potential issues
  if (!httpSuccess) {
    console.log('\n⚠️ Potential HTTP connection issues:');
    console.log(' • Check if your Nginx/Apache configuration is correct');
    console.log(' • Verify that the socket server is running (pm2 status)');
    console.log(' • Ensure port 1002 is not blocked by firewall');
    console.log(' • Check the path configuration in Nginx/Apache');
  }
  
  if (!wsSuccess) {
    console.log('\n⚠️ Potential WebSocket connection issues:');
    console.log(' • Ensure Nginx/Apache is configured to proxy WebSocket connections');
    console.log(' • Check WebSocket path and proxy settings');
    console.log(' • Verify that necessary headers are set (Upgrade, Connection)');
    console.log(' • Check if SSL certificate is valid for secure WebSockets');
  }
  
  console.log(`
🔍 Nginx configuration check:
   Make sure your Nginx config includes these settings for path ${socketPath}/socket.io/:

   location ${socketPath}/socket.io/ {
       proxy_pass http://localhost:1002/socket.io/;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
`);
}

// Main function to run tests
async function runTests() {
  try {
    const httpSuccess = await testHttpConnection();
    const wsSuccess = await testWebSocketConnection();
    checkForIssues(httpSuccess, wsSuccess);
  } catch (error) {
    console.error('❌ Unexpected error:');
    console.error(error);
  } finally {
    clearTimeout(timeoutId);
    process.exit(0);
  }
}

// Start tests
runTests(); 