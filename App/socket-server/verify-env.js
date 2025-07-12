require('dotenv').config({ path: '../.env' });

console.log('🔍 Environment Variables Verification:');
console.log('=====================================');

const requiredVars = [
    'SOCKET_HOST',
    'SOCKET_PORT', 
    'SOCKET_BIND_HOST',
    'SOCKET_BASE_PATH',
    'SOCKET_SECURE',
    'CORS_ALLOWED_ORIGINS',
    'SOCKET_SERVER_LOCAL'
];

let allValid = true;

requiredVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    
    if (!value) {
        allValid = false;
    }
    
    console.log(`${status} ${varName}: ${value || 'MISSING'}`);
});

console.log('=====================================');

if (allValid) {
    console.log('✅ All required environment variables are loaded!');
    
    const socketUrl = `${process.env.SOCKET_SECURE === 'true' ? 'https' : 'http'}://${process.env.SOCKET_HOST}:${process.env.SOCKET_PORT}`;
    console.log(`🔗 Socket URL: ${socketUrl}`);
    console.log(`📁 Base Path: ${process.env.SOCKET_BASE_PATH}`);
    console.log(`🌐 CORS Origins: ${process.env.CORS_ALLOWED_ORIGINS}`);
    console.log(`🏠 PHP App URL: ${process.env.SOCKET_SERVER_LOCAL}`);
} else {
    console.log('❌ Some environment variables are missing!');
    console.log('Please check your .env file in the parent directory.');
    process.exit(1);
}
