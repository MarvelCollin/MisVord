function testChannelDragSystem() {

    
    const channels = document.querySelectorAll('.channel-item[data-channel-id]');
    const categories = document.querySelectorAll('.category-header[data-category-id]');
    const dropZones = document.querySelectorAll('.category-channels, .channels-section, .voice-channels-section');
    



    

    
    channels.forEach((channel, index) => {
        const channelId = channel.getAttribute('data-channel-id');
        const channelName = channel.getAttribute('data-channel-name');
        const channelType = channel.getAttribute('data-channel-type');
        const position = channel.getAttribute('data-channel-position');
        const categoryId = channel.getAttribute('data-category-id');
        const isDraggable = channel.draggable;
        const hasSetup = channel.hasAttribute('data-drag-setup');
        




    });
    
    categories.forEach((category, index) => {
        const categoryId = category.getAttribute('data-category-id');
        const categoryName = category.getAttribute('data-category-name');
        const position = category.getAttribute('data-category-position');
        const isDraggable = category.draggable;
        const hasSetup = category.hasAttribute('data-drag-setup');
        



    });
    
    const channelDragManager = window.getChannelDragManager && window.getChannelDragManager();

    
    if (channelDragManager) {


    }
    






    
    const hasDragStyles = document.getElementById('channel-drag-styles');

    

}

function simulateChannelDrag(sourceChannelId, targetChannelId) {

    
    const sourceElement = document.querySelector(`[data-channel-id="${sourceChannelId}"]`);
    const targetElement = document.querySelector(`[data-channel-id="${targetChannelId}"]`);
    
    if (!sourceElement || !targetElement) {
        console.error('❌ Source or target channel not found');
        return;
    }
    


    
    const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
    });
    
    const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dragStartEvent.dataTransfer
    });
    
    sourceElement.dispatchEvent(dragStartEvent);
    targetElement.dispatchEvent(dropEvent);
    

}

function inspectChannelPositions() {

    
    const uncategorizedText = document.querySelectorAll('.channels-section .channel-item');
    const uncategorizedVoice = document.querySelectorAll('.voice-channels-section .channel-item');
    

    uncategorizedText.forEach((channel, index) => {

    });
    

    uncategorizedVoice.forEach((channel, index) => {

    });
    
    const categories = document.querySelectorAll('.category-section');
    categories.forEach((categorySection, catIndex) => {
        const categoryHeader = categorySection.querySelector('.category-header');
        const categoryName = categoryHeader.getAttribute('data-category-name');
        const categoryChannels = categorySection.querySelectorAll('.channel-item');
        

        categoryChannels.forEach((channel, index) => {

        });
    });
}

function debugChannelDragSystem() {


    
    const manager = window.getChannelDragManager && window.getChannelDragManager();
    


    if (manager) {



    }
    

    const channels = document.querySelectorAll('.channel-item[data-channel-id]');
    const categories = document.querySelectorAll('.category-header[data-category-id]');


    

    let setupChannels = 0;
    let draggableChannels = 0;
    
    channels.forEach((channel, index) => {
        const hasSetup = channel.hasAttribute('data-drag-setup');
        const isDraggable = channel.draggable;
        
        if (hasSetup) setupChannels++;
        if (isDraggable) draggableChannels++;
        
        if (index < 3) {

                setup: hasSetup,
                draggable: isDraggable,
                events: channel.getAttribute('data-drag-setup') === 'true'
            });
        }
    });
    


    

    const styles = document.getElementById('channel-drag-styles');

    

    testAPIEndpoints();
    

    testEventListeners();
    





    

}

function testAPIEndpoints() {
    const endpoints = [
        '/api/channels/reorder',
        '/api/categories/reorder', 
        '/api/channels/move'
    ];
    
    endpoints.forEach(endpoint => {
        fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
            .then(response => {

            })
            .catch(error => {

            });
    });
}

function testEventListeners() {
    const channels = document.querySelectorAll('.channel-item[data-channel-id]');
    let hasEvents = 0;
    
    channels.forEach(channel => {
        const events = getEventListeners ? getEventListeners(channel) : {};
        if (events.dragstart || events.dragend || events.dragover || events.drop) {
            hasEvents++;
        }
    });
    

}

function forceInitChannelDrag() {

    
    if (window.initChannelDragSystem) {
        const manager = window.initChannelDragSystem();

        return manager;
    } else {
        console.error('❌ [DEBUG] initChannelDragSystem function not available');
        return null;
    }
}

function testChannelDragEvents() {

    
    const channels = document.querySelectorAll('.channel-item[data-channel-id]');
    if (channels.length === 0) {
        console.error('❌ [DEBUG] No channels found to test');
        return;
    }
    
    const testChannel = channels[0];

    

    const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
    });
    testChannel.dispatchEvent(dragStartEvent);
    
    setTimeout(() => {

        const dragEndEvent = new DragEvent('dragend', {
            bubbles: true,
            cancelable: true
        });
        testChannel.dispatchEvent(dragEndEvent);
        

    }, 1000);
}

function inspectChannelElement(channelId) {
    const channel = document.querySelector(`[data-channel-id="${channelId}"]`);
    
    if (!channel) {
        console.error(`❌ [DEBUG] Channel with ID ${channelId} not found`);
        return;
    }
    









    
    const events = getEventListeners ? getEventListeners(channel) : 'getEventListeners not available';

}

function fixChannelDragIssues() {

    
    let fixed = 0;
    
    const channels = document.querySelectorAll('.channel-item[data-channel-id]');
    channels.forEach(channel => {
        if (!channel.draggable) {
            channel.draggable = true;
            fixed++;
        }
    });
    
    const categories = document.querySelectorAll('.category-header[data-category-id]');
    categories.forEach(category => {
        if (!category.draggable) {
            category.draggable = true;
            fixed++;
        }
    });
    

    
    if (window.initChannelDragSystem) {
        window.initChannelDragSystem();

    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            testChannelDragSystem();
        }, 2000);
    });
} else {
    setTimeout(() => {
        testChannelDragSystem();
    }, 1000);
}

window.testChannelDragSystem = testChannelDragSystem;
window.simulateChannelDrag = simulateChannelDrag;
window.inspectChannelPositions = inspectChannelPositions;
window.debugChannelDragSystem = debugChannelDragSystem;
window.forceInitChannelDrag = forceInitChannelDrag;
window.testChannelDragEvents = testChannelDragEvents;
window.inspectChannelElement = inspectChannelElement;
window.fixChannelDragIssues = fixChannelDragIssues; 