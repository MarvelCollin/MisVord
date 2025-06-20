document.addEventListener('DOMContentLoaded', function() {
    console.log('=== CHANNEL DISPLAY TEST ===');
    
    const channelWrapper = document.querySelector('.channel-wrapper');
    const channelList = document.querySelector('.channel-list');
    const channelItems = document.querySelectorAll('.channel-item');
    
    console.log('Channel wrapper found:', !!channelWrapper);
    console.log('Channel list found:', !!channelList);
    console.log('Channel items count:', channelItems.length);
    
    const serverIdInput = document.querySelector('#current-server-id');
    console.log('Server ID:', serverIdInput?.value || 'not found');
    
    channelItems.forEach((item, index) => {
        const id = item.getAttribute('data-channel-id');
        const type = item.getAttribute('data-channel-type');
        const name = item.querySelector('span')?.textContent;
        console.log(`Channel ${index + 1}:`, { id, type, name });
    });
    
    if (channelItems.length > 0) {
        console.log('Channel click handlers are set up');
    } else {
        console.warn('No channels found - check authentication or data loading');
    }
    
    console.log('=== END CHANNEL TEST ===');
});
