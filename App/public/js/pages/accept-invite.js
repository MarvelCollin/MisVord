/**
 * Accept Invite Page JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Accept Invite page loaded");
    
    // Get the invite code from the URL
    const inviteCode = window.location.pathname.split('/').pop();
    console.log("Invite code from URL:", inviteCode);
    
    // Get the join server button
    const joinServerBtn = document.getElementById('join-server-btn');
    
    if (joinServerBtn) {
        console.log("Join server button found");
        
        joinServerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Join server button clicked");
            
            // Show loading state
            joinServerBtn.textContent = 'Joining...';
            joinServerBtn.disabled = true;
            
            // Show a loading message
            showToast('Joining server...', 'info');
            
            console.log("Sending request to join server with code:", inviteCode);
            
            // Send request to join the server
            fetch(`/api/servers/join/${inviteCode}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                console.log("Response received:", response.status);
                
                // Check for non-JSON responses (like redirects)
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    if (!response.ok) {
                        console.error("Error response:", response.status);
                        throw new Error('Failed to join server');
                    }
                    return response.json();
                } else {
                    console.log("Non-JSON response, likely a redirect. Following it...");
                    window.location.href = response.url;
                    throw new Error('redirect_handled');
                }
            })
            .then(data => {
                console.log("Parsed response data:", data);
                
                if (data.success) {
                    // Show success message
                    showToast('Successfully joined server!', 'success');
                    
                    // Redirect to the server page
                    if (data.data && data.data.redirect) {
                        console.log("Redirecting to:", data.data.redirect);
                        window.location.href = data.data.redirect;
                    } else {
                        console.log("No redirect URL in response, going to app");
                        window.location.href = '/app';
                    }
                } else {
                    // Show error message
                    console.error("Error in response:", data.message);
                    throw new Error(data.message || 'Failed to join server');
                }
            })
            .catch(error => {
                if (error.message === 'redirect_handled') {
                    console.log("Redirect already handled, no further action needed");
                    return;
                }
                
                console.error('Error joining server:', error);
                
                // Reset button
                joinServerBtn.textContent = 'Accept Invitation';
                joinServerBtn.disabled = false;
                
                // Show error message
                showToast(error.message || 'Failed to join server. Please try again.', 'error');
            });
        });
    } else {
        console.log("Join server button not found - user might not be logged in");
    }
});

// Simple toast function if the global one isn't available
function showToast(message, type = 'info') {
    console.log(`Toast: ${type} - ${message}`);
    
    if (window.showToast) {
        window.showToast(message, type);
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 ${
        type === 'error' ? 'bg-red-500' : 
        type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    } text-white`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Add fade-in animation
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-in-out';
    setTimeout(() => { toast.style.opacity = '1'; }, 10);
    
    // Remove after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 4000);
} 