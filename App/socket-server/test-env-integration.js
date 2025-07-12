#!/usr/bin/env node
require('dotenv').config({ path: '../.env' });

console.log('🚀 COMPREHENSIVE ENVIRONMENT VERIFICATION');
console.log('=========================================');

const requiredVars = [
    'SOCKET_HOST', 'SOCKET_PORT', 'SOCKET_BIND_HOST', 
    'SOCKET_BASE_PATH', 'SOCKET_SECURE', 'CORS_ALLOWED_ORIGINS'
];

console.log('\n📋 1. Environment Variables Check:');
let allValid = true;
requiredVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    if (!value) allValid = false;
    console.log(`   ${status} ${varName}: ${value || 'MISSING'}`);
});

if (!allValid) {
    console.log('\n❌ FAILED: Missing environment variables');
    process.exit(1);
}

console.log('\n🔗 2. Socket Configuration:');
const socketUrl = `${process.env.SOCKET_SECURE === 'true' ? 'https' : 'http'}://${process.env.SOCKET_HOST}:${process.env.SOCKET_PORT}`;
console.log(`   Socket URL: ${socketUrl}`);
console.log(`   Base Path: ${process.env.SOCKET_BASE_PATH}`);
console.log(`   CORS Origins: ${process.env.CORS_ALLOWED_ORIGINS?.split(',').length} origins`);

console.log('\n🧪 3. Socket Connection Test:');
const io = require('socket.io-client');

const client = io(socketUrl, {
    path: process.env.SOCKET_BASE_PATH,
    transports: ['websocket', 'polling']
});

let connected = false;
const timeout = setTimeout(() => {
    if (!connected) {
        console.log('   ❌ Connection timeout - socket server may not be running');
        client.disconnect();
        process.exit(1);
    }
}, 5000);

client.on('connect', () => {
    connected = true;
    clearTimeout(timeout);
    console.log('   ✅ Socket connection successful!');
    console.log(`   Socket ID: ${client.id}`);
    
    client.emit('debug-test', { 
        test: 'environment-verification',
        timestamp: new Date().toISOString()
    });
    
    setTimeout(() => {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('Environment-driven socket configuration is working correctly.');
        client.disconnect();
        process.exit(0);
    }, 1000);
});

client.on('connect_error', (error) => {
    console.log(`   ❌ Socket connection error: ${error.message}`);
    clearTimeout(timeout);
    client.disconnect();
    process.exit(1);
});

client.on('debug-test-response', (data) => {
    console.log('   📡 Server response received:', data);
});
