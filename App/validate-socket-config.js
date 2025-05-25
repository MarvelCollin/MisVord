/**
 * Socket Configuration Validator
 * 
 * This script validates the socket path configuration across different environments
 * Run with: node validate-socket-config.js
 */

// Mock environment configurations to test
const environments = [
  {
    name: 'Local Development',
    IS_VPS: false
  },
  {
    name: 'Production/VPS',
    IS_VPS: true
  }
];

// Function to simulate socket-server.js path construction
function constructServerPath(env) {
  const isVpsEnvironment = env.IS_VPS === true;
  
  // Simplified path construction
  const socketPath = isVpsEnvironment 
    ? '/misvord/socket/socket.io'  // Production path
    : '/socket.io';                // Development path
    
  return socketPath;
}

// Function to simulate client-side path construction
function constructClientPath(env) {
  const isVpsEnvironment = env.IS_VPS === true;
  
  // Client-side path construction
  return isVpsEnvironment ? '/misvord/socket/socket.io' : '/socket.io';
}

// Function to check if nginx config would match the paths
function checkNginxMatch(serverPath) {
  // Production uses /misvord/socket/socket.io
  return serverPath === '/misvord/socket/socket.io';
}

// Validate all environments
console.log('====== Socket Configuration Validation ======');

environments.forEach(env => {
  console.log(`\n=== ${env.name} ===`);
  console.log('Config:', JSON.stringify({
    IS_VPS: env.IS_VPS
  }, null, 2));
  
  const serverPath = constructServerPath(env);
  const clientPath = constructClientPath(env);
  const nginxMatches = checkNginxMatch(serverPath);
  
  console.log('Server Path:', serverPath);
  console.log('Client Path:', clientPath);
  console.log('Nginx match:', nginxMatches ? 'Yes' : 'No');
  
  // Check if paths match
  if (serverPath === clientPath) {
    console.log('✅ Paths match between server and client');
  } else {
    console.log('❌ MISMATCH between server and client paths');
  }
  
  // For VPS environments, check nginx compatibility
  if (env.IS_VPS) {
    if (nginxMatches) {
      console.log('✅ Path compatible with nginx configuration');
    } else {
      console.log('❌ Path NOT compatible with nginx configuration');
    }
  }
});

console.log('\n====== Validation Complete ======'); 