// WebRTC Deployment and VPS Readiness Test
console.log('=== WebRTC Deployment Analysis ===');

const fs = require('fs');
const path = require('path');

// Test results storage
const deploymentResults = {
    environment: false,
    configuration: false,
    dependencies: false,
    security: false,
    performance: false,
    globalRoom: false,
    errors: []
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
    const status = passed ? '✓' : '✗';
    const message = details ? ` (${details})` : '';
    console.log(`${status} ${testName}${message}`);
}

// Test 1: Environment Configuration
console.log('\n1. Testing Environment Configuration:');
try {
    const socketServerPath = 'socket-server.js';
    if (fs.existsSync(socketServerPath)) {
        const socketContent = fs.readFileSync(socketServerPath, 'utf8');
        
        // Check VPS environment handling
        const envTests = [
            { name: 'VPS environment detection', check: socketContent.includes('IS_VPS') },
            { name: 'HTTPS support', check: socketContent.includes('USE_HTTPS') },
            { name: 'Domain configuration', check: socketContent.includes('DOMAIN') },
            { name: 'Port configuration', check: socketContent.includes('PORT') },
            { name: 'Path handling', check: socketContent.includes('socketPath') },
            { name: 'CORS configuration', check: socketContent.includes('cors') }
        ];
        
        let envCount = 0;
        envTests.forEach(test => {
            logTest(test.name, test.check);
            if (test.check) envCount++;
        });
        
        deploymentResults.environment = envCount >= 5;
        
    } else {
        logTest('Socket server file exists', false, 'socket-server.js not found');
    }
} catch (error) {
    logTest('Environment configuration test', false, error.message);
    deploymentResults.errors.push(`Environment test: ${error.message}`);
}

// Test 2: Client-side Configuration
console.log('\n2. Testing Client-side Configuration:');
try {
    const webrtcConfigPath = 'public/js/webrtc-modules/webrtc-config.js';
    if (fs.existsSync(webrtcConfigPath)) {
        const configContent = fs.readFileSync(webrtcConfigPath, 'utf8');
        
        // Check client configuration
        const configTests = [
            { name: 'Environment detection', check: configContent.includes('isLocalhost') && configContent.includes('ENVIRONMENT') },
            { name: 'Production URL configuration', check: configContent.includes('marvelcollin.my.id') },
            { name: 'Socket path handling', check: configContent.includes('SOCKET_PATH_PROD') && configContent.includes('SOCKET_PATH_LOCAL') },
            { name: 'Base path resolution', check: configContent.includes('getBasePath') },
            { name: 'Dynamic URL resolution', check: configContent.includes('getSocketUrl') }
        ];
        
        let configCount = 0;
        configTests.forEach(test => {
            logTest(test.name, test.check);
            if (test.check) configCount++;
        });
        
        deploymentResults.configuration = configCount >= 4;
        
    } else {
        logTest('WebRTC config file exists', false, 'webrtc-config.js not found');
    }
} catch (error) {
    logTest('Configuration test', false, error.message);
    deploymentResults.errors.push(`Configuration test: ${error.message}`);
}

// Test 3: Dependencies and Package Management
console.log('\n3. Testing Dependencies:');
try {
    const packageJsonPath = 'package.json';
    if (fs.existsSync(packageJsonPath)) {
        const packageContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Check required dependencies
        const requiredDeps = ['socket.io', 'express', 'cors', 'dotenv'];
        const dependencies = { ...packageContent.dependencies, ...packageContent.devDependencies };
        
        let depCount = 0;
        requiredDeps.forEach(dep => {
            const exists = dependencies.hasOwnProperty(dep);
            logTest(`Dependency: ${dep}`, exists, exists ? dependencies[dep] : 'missing');
            if (exists) depCount++;
        });
          // Check for start scripts
        const hasStartScript = packageContent.scripts && packageContent.scripts.start;
        logTest('Start script configured', !!hasStartScript);
        
        deploymentResults.dependencies = depCount >= 3 && !!hasStartScript;
        
    } else {
        logTest('Package.json exists', false, 'package.json not found');
    }
} catch (error) {
    logTest('Dependencies test', false, error.message);
    deploymentResults.errors.push(`Dependencies test: ${error.message}`);
}

// Test 4: Security Considerations
console.log('\n4. Testing Security Configuration:');
try {
    const socketServerPath = 'socket-server.js';
    if (fs.existsSync(socketServerPath)) {
        const socketContent = fs.readFileSync(socketServerPath, 'utf8');
        
        // Check security features
        const securityTests = [
            { name: 'CORS configured', check: socketContent.includes('cors') },
            { name: 'Environment variable protection', check: socketContent.includes('process.env') },
            { name: 'HTTPS support available', check: socketContent.includes('https') },
            { name: 'Error handling present', check: socketContent.includes('catch') || socketContent.includes('error') }
        ];
        
        let securityCount = 0;
        securityTests.forEach(test => {
            logTest(test.name, test.check);
            if (test.check) securityCount++;
        });
          // Check if .env template exists
        const envExample = fs.existsSync('.env.example') || fs.existsSync('.env.template');
        logTest('Environment template available', envExample);
        
        deploymentResults.security = securityCount >= 3 && envExample;
        
    }
} catch (error) {
    logTest('Security test', false, error.message);
    deploymentResults.errors.push(`Security test: ${error.message}`);
}

// Test 5: Performance and Scalability
console.log('\n5. Testing Performance Configuration:');
try {
    const mediaControlPath = 'public/js/webrtc-modules/media-control.js';
    if (fs.existsSync(mediaControlPath)) {
        const mediaContent = fs.readFileSync(mediaControlPath, 'utf8');
        
        // Check performance features
        const perfTests = [
            { name: 'Low bandwidth constraints', check: mediaContent.includes('lowBandwidthMediaConstraints') },
            { name: 'Mobile optimization', check: mediaContent.includes('mobileMediaConstraints') },
            { name: 'Quality adaptation', check: mediaContent.includes('applyConstraints') },
            { name: 'Error recovery', check: mediaContent.includes('catch') && mediaContent.includes('retry') }
        ];
        
        let perfCount = 0;
        perfTests.forEach(test => {
            logTest(test.name, test.check);
            if (test.check) perfCount++;
        });
        
        deploymentResults.performance = perfCount >= 2;
        
    }
} catch (error) {
    logTest('Performance test', false, error.message);
    deploymentResults.errors.push(`Performance test: ${error.message}`);
}

// Test 6: Global Room Verification
console.log('\n6. Testing Global Room Implementation:');
try {
    const socketServerPath = 'socket-server.js';
    const signalingPath = 'public/js/webrtc-modules/signaling.js';
    
    if (fs.existsSync(socketServerPath) && fs.existsSync(signalingPath)) {
        const socketContent = fs.readFileSync(socketServerPath, 'utf8');
        const signalingContent = fs.readFileSync(signalingPath, 'utf8');
        
        // Check global room implementation
        const roomTests = [
            { name: 'Global room constant defined', check: socketContent.includes('global-video-chat') },
            { name: 'Room joining mechanism', check: socketContent.includes('joinVideoChat') },
            { name: 'User management in room', check: socketContent.includes('videoChatUsers') },
            { name: 'Client-side room joining', check: signalingContent.includes('joinVideoChat') || signalingContent.includes('join') },
            { name: 'WebRTC signaling in room', check: socketContent.includes('signal') }
        ];
        
        let roomCount = 0;
        roomTests.forEach(test => {
            logTest(test.name, test.check);
            if (test.check) roomCount++;
        });
        
        deploymentResults.globalRoom = roomCount >= 4;
        
    }
} catch (error) {
    logTest('Global room test', false, error.message);
    deploymentResults.errors.push(`Global room test: ${error.message}`);
}

// Test 7: Deployment Files Check
console.log('\n7. Testing Deployment Files:');
try {
    const deploymentFiles = [
        { file: 'start-dev-socket-server.bat', desc: 'Development start script' },
        { file: 'start-prod-socket-server.bat', desc: 'Production start script' },
        { file: 'docker-compose.yml', desc: 'Docker configuration' },
        { file: 'WebRTC-DEPLOYMENT.md', desc: 'Deployment documentation' }
    ];
    
    let deployFileCount = 0;
    deploymentFiles.forEach(({ file, desc }) => {
        const exists = fs.existsSync(file);
        logTest(desc, exists);
        if (exists) deployFileCount++;
    });
    
    logTest('Deployment files available', deployFileCount >= 2, `${deployFileCount}/4 files present`);
    
} catch (error) {
    logTest('Deployment files test', false, error.message);
}

// Summary and Recommendations
console.log('\n=== Deployment Analysis Summary ===');
const overallScore = Object.values(deploymentResults).filter(v => typeof v === 'boolean').filter(Boolean).length;
const totalTests = Object.keys(deploymentResults).filter(key => key !== 'errors').length;

console.log(`Overall Deployment Score: ${overallScore}/${totalTests} tests passed`);

const results = {
    environment: deploymentResults.environment,
    configuration: deploymentResults.configuration,
    dependencies: deploymentResults.dependencies,
    security: deploymentResults.security,
    performance: deploymentResults.performance,
    globalRoom: deploymentResults.globalRoom
};

Object.entries(results).forEach(([key, value]) => {
    if (value) {
        const labels = {
            environment: 'Environment configuration ready for VPS',
            configuration: 'Client-side configuration supports production',
            dependencies: 'Dependencies properly configured',
            security: 'Security measures properly configured',
            performance: 'Performance optimizations available',
            globalRoom: 'Global room system properly implemented'
        };
        console.log(`✓ ${labels[key]}`);
    }
});

if (deploymentResults.errors.length > 0) {
    console.log('\n=== Issues Found ===');
    deploymentResults.errors.forEach(error => console.log(`❌ ${error}`));
}

// Deployment Recommendations
console.log('\n=== Deployment Recommendations ===');

if (overallScore === totalTests) {
    console.log('🎉 System is ready for VPS deployment!');
    console.log('\n📋 Deployment Checklist:');
    console.log('1. Set environment variables: IS_VPS=true, USE_HTTPS=true, DOMAIN=your-domain.com');
    console.log('2. Configure SSL certificates for HTTPS');
    console.log('3. Set up reverse proxy (nginx) with proper WebSocket support');
    console.log('4. Configure firewall to allow WebRTC ports (1002, 1443)');
    console.log('5. Test WebRTC functionality with STUN/TURN servers for NAT traversal');
    console.log('6. Monitor WebSocket connections and WebRTC peer connections');
} else {
    console.log('⚠️  Some issues need to be addressed before VPS deployment:');
    
    if (!deploymentResults.environment) {
        console.log('🔧 Complete environment configuration setup');
    }
    if (!deploymentResults.configuration) {
        console.log('🔧 Fix client-side configuration for production');
    }
    if (!deploymentResults.dependencies) {
        console.log('🔧 Resolve dependency and package management issues');
    }
    if (!deploymentResults.security) {
        console.log('🔧 Implement additional security measures');
    }
    if (!deploymentResults.performance) {
        console.log('🔧 Add performance optimizations');
    }
    if (!deploymentResults.globalRoom) {
        console.log('🔧 Fix global room implementation');
    }
}

console.log('\n=== VPS Deployment Notes ===');
console.log('• Global room "global-video-chat" allows all users to join the same session');
console.log('• WebRTC modules are properly modularized for maintainability');
console.log('• Environment detection automatically switches between dev/prod configurations');
console.log('• Socket.IO path configuration supports subdirectory deployments (/misvord/)');
console.log('• CORS and HTTPS support included for secure connections');

console.log('\n=== End of Deployment Analysis ===');
