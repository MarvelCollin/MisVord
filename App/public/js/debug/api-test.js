// Debug script to test the admin API endpoints

document.addEventListener('DOMContentLoaded', function() {
    console.log('API Debug Tool started');
    
    // Add a button to the page to run the tests
    const debugDiv = document.createElement('div');
    debugDiv.style.position = 'fixed';
    debugDiv.style.bottom = '20px';
    debugDiv.style.right = '20px';
    debugDiv.style.zIndex = '9999';
    debugDiv.style.padding = '10px';
    debugDiv.style.backgroundColor = '#333';
    debugDiv.style.color = '#fff';
    debugDiv.style.borderRadius = '5px';
    
    const button = document.createElement('button');
    button.textContent = 'Test Admin APIs';
    button.style.padding = '8px 12px';
    button.style.backgroundColor = '#5865F2';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    
    debugDiv.appendChild(button);
    document.body.appendChild(debugDiv);
    
    button.addEventListener('click', runAllTests);
    
    // Test all endpoints
    async function runAllTests() {
        console.log('===== TESTING ADMIN API ENDPOINTS =====');
        
        try {
            await testSystemStats();
            await testServerStats();
            await testUserStats();
            await testListUsers();
            await testListServers();
            console.log('===== ALL TESTS COMPLETED =====');
        } catch (error) {
            console.error('Test suite error:', error);
        }
    }
    
    // Test specific endpoints
    async function testSystemStats() {
        console.log('Testing: GET /api/admin/stats');
        try {
            const response = await fetch('/api/admin/stats', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const data = await response.json();
            console.log('Response from /api/admin/stats:', data);
            return data;
        } catch (error) {
            console.error('Error testing system stats:', error);
            throw error;
        }
    }
    
    async function testServerStats() {
        console.log('Testing: GET /api/admin/servers/stats');
        try {
            const response = await fetch('/api/admin/servers/stats', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const data = await response.json();
            console.log('Response from /api/admin/servers/stats:', data);
            return data;
        } catch (error) {
            console.error('Error testing server stats:', error);
            throw error;
        }
    }
    
    async function testUserStats() {
        console.log('Testing: GET /api/admin/users/stats');
        try {
            const response = await fetch('/api/admin/users/stats', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const data = await response.json();
            console.log('Response from /api/admin/users/stats:', data);
            return data;
        } catch (error) {
            console.error('Error testing user stats:', error);
            throw error;
        }
    }
    
    async function testListUsers() {
        console.log('Testing: GET /api/admin/users');
        try {
            const response = await fetch('/api/admin/users', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const data = await response.json();
            console.log('Response from /api/admin/users:', data);
            return data;
        } catch (error) {
            console.error('Error testing list users:', error);
            throw error;
        }
    }
    
    async function testListServers() {
        console.log('Testing: GET /api/admin/servers/list');
        try {
            const response = await fetch('/api/admin/servers/list', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const data = await response.json();
            console.log('Response from /api/admin/servers/list:', data);
            return data;
        } catch (error) {
            console.error('Error testing list servers:', error);
            throw error;
        }
    }
}); 