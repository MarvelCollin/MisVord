

document.addEventListener('DOMContentLoaded', () => {

    const demoButtons = `
        <div class="fixed bottom-4 left-4 z-50 p-4 bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700 shadow-lg">
            <h3 class="text-white text-sm font-medium mb-3">Notification Toast Demo</h3>
            <div class="flex flex-col gap-2">
                <button id="demo-info" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors">
                    Info Toast
                </button>
                <button id="demo-success" class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors">
                    Success Toast
                </button>
                <button id="demo-warning" class="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors">
                    Warning Toast
                </button>
                <button id="demo-error" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors">
                    Error Toast
                </button>
                <button id="demo-mention" class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors">
                    Mention Toast
                </button>
                <button id="demo-discord" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded transition-colors">
                    Discord Toast
                </button>
                <button id="demo-custom" class="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors">
                    Custom Toast with Actions
                </button>
            </div>
        </div>
    `;
    

    const demoPanel = document.createElement('div');
    demoPanel.innerHTML = demoButtons;
    document.body.appendChild(demoPanel);
    

    document.getElementById('demo-info').addEventListener('click', () => {
        window.notificationToast.info('This is an informational notification', {
            title: 'Information'
        });
    });
    
    document.getElementById('demo-success').addEventListener('click', () => {
        window.notificationToast.success('Your changes have been saved successfully!', {
            title: 'Success'
        });
    });
    
    document.getElementById('demo-warning').addEventListener('click', () => {
        window.notificationToast.warning('Your session will expire in 5 minutes', {
            title: 'Warning'
        });
    });
    
    document.getElementById('demo-error').addEventListener('click', () => {
        window.notificationToast.error('Failed to connect to the server', {
            title: 'Error'
        });
    });
    
    document.getElementById('demo-mention').addEventListener('click', () => {
        window.notificationToast.mention('@username mentioned you in #general', {
            title: 'New Mention'
        });
    });
    
    document.getElementById('demo-discord').addEventListener('click', () => {
        window.notificationToast.discord('New message in Discord Server', {
            title: 'Discord Notification'
        });
    });
    
    document.getElementById('demo-custom').addEventListener('click', () => {
        window.notificationToast.show({
            title: 'Friend Request',
            message: 'User123 sent you a friend request',
            type: 'discord',
            duration: 0, // Won't auto-dismiss
            actions: [
                {
                    label: 'Accept',
                    primary: true,
                    onClick: () => {

                        window.notificationToast.success('Friend request accepted!');
                    }
                },
                {
                    label: 'Decline',
                    onClick: () => {

                        window.notificationToast.info('Friend request declined');
                    }
                }
            ],
            onClick: () => {

            }
        });
    });
});



/*
NotificationToast API:

1. Basic Usage:
   window.notificationToast.info('Your message here');
   window.notificationToast.success('Your message here');
   window.notificationToast.warning('Your message here');
   window.notificationToast.error('Your message here');
   window.notificationToast.mention('Your message here');
   window.notificationToast.discord('Your message here');

2. Advanced Usage:
   window.notificationToast.show({
     title: 'Notification Title',
     message: 'Notification message content',
     type: 'info', // 'info', 'success', 'warning', 'error', 'mention', 'discord'
     icon: null, // Custom icon HTML (overrides default)
     duration: 5000, // Time in ms before auto-dismiss (0 for no auto-dismiss)
     closable: true, // Whether to show close button
     progress: true, // Whether to show progress bar
     onClick: function(e) {}, // Click handler for the toast
     actions: [ // Optional action buttons
       {
         label: 'Action Label',
         primary: true, // Whether this is a primary action
         onClick: function() {} // Click handler for this action
       }
     ]
   });

3. Other Methods:
   window.notificationToast.hide(toastElement); // Hide a specific toast
   window.notificationToast.hideAll(); // Hide all toasts
*/ 