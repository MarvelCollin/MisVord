document.addEventListener('DOMContentLoaded', function() {

    
    const channelWrapper = document.querySelector('.channel-wrapper');
    const channelList = document.querySelector('.channel-list');
    const channelItems = document.querySelectorAll('.channel-item');
    



    
    const serverIdInput = document.querySelector('#current-server-id');

    
    channelItems.forEach((item, index) => {
        const id = item.getAttribute('data-channel-id');
        const type = item.getAttribute('data-channel-type');
        const name = item.querySelector('span')?.textContent;

    });
    
    if (channelItems.length > 0) {

    } else {
        console.warn('No channels found - check authentication or data loading');
    }
    

});
