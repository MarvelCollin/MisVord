function testChannelDragSystem() {
    console.log('🧪 Testing Channel Drag System...');
    
    const channels = document.querySelectorAll('.channel-item[data-channel-id]');
    const categories = document.querySelectorAll('.category-header[data-category-id]');
    const dropZones = document.querySelectorAll('.category-channels, .channels-section, .voice-channels-section');
    
    console.log(`✅ Found ${channels.length} draggable channels`);
    console.log(`✅ Found ${categories.length} draggable categories`);
    console.log(`✅ Found ${dropZones.length} drop zones`);
    
    console.log('📋 Channel Drag System Status:');
    
    channels.forEach((channel, index) => {
        const channelId = channel.getAttribute('data-channel-id');
        const channelName = channel.getAttribute('data-channel-name');
        const channelType = channel.getAttribute('data-channel-type');
        const position = channel.getAttribute('data-channel-position');
        const categoryId = channel.getAttribute('data-category-id');
        const isDraggable = channel.draggable;
        const hasSetup = channel.hasAttribute('data-drag-setup');
        
        console.log(`  Channel ${index + 1}: "${channelName}" (${channelType})`);
        console.log(`    - ID: ${channelId}, Position: ${position}`);
        console.log(`    - Category: ${categoryId || 'uncategorized'}`);
        console.log(`    - Draggable: ${isDraggable}, Setup: ${hasSetup}`);
    });
    
    categories.forEach((category, index) => {
        const categoryId = category.getAttribute('data-category-id');
        const categoryName = category.getAttribute('data-category-name');
        const position = category.getAttribute('data-category-position');
        const isDraggable = category.draggable;
        const hasSetup = category.hasAttribute('data-drag-setup');
        
        console.log(`  Category ${index + 1}: "${categoryName}"`);
        console.log(`    - ID: ${categoryId}, Position: ${position}`);
        console.log(`    - Draggable: ${isDraggable}, Setup: ${hasSetup}`);
    });
    
    const channelDragManager = window.getChannelDragManager && window.getChannelDragManager();
    console.log(`💼 Channel Drag Manager: ${channelDragManager ? 'Available' : 'Not loaded'}`);
    
    if (channelDragManager) {
        console.log(`    - Initialized: ${channelDragManager.isInitialized}`);
        console.log(`    - Server ID: ${channelDragManager.currentServerId}`);
    }
    
    console.log('🎯 Test Actions:');
    console.log('  1. Drag a channel onto another channel to reorder');
    console.log('  2. Drag a channel into a category to move it');
    console.log('  3. Drag a channel to uncategorized section to remove from category');
    console.log('  4. Drag categories to reorder them');
    console.log('  5. Check console for drag events and API calls');
    
    const hasDragStyles = document.getElementById('channel-drag-styles');
    console.log(`🎨 Drag Styles: ${hasDragStyles ? 'Loaded' : 'Missing'}`);
    
    console.log('✨ Channel drag system test complete!');
}

function simulateChannelDrag(sourceChannelId, targetChannelId) {
    console.log(`🔄 Simulating drag from channel ${sourceChannelId} to ${targetChannelId}`);
    
    const sourceElement = document.querySelector(`[data-channel-id="${sourceChannelId}"]`);
    const targetElement = document.querySelector(`[data-channel-id="${targetChannelId}"]`);
    
    if (!sourceElement || !targetElement) {
        console.error('❌ Source or target channel not found');
        return;
    }
    
    console.log('📍 Source:', sourceElement.getAttribute('data-channel-name'));
    console.log('📍 Target:', targetElement.getAttribute('data-channel-name'));
    
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
    
    console.log('✅ Simulated drag complete');
}

function inspectChannelPositions() {
    console.log('🔍 Current Channel Positions:');
    
    const uncategorizedText = document.querySelectorAll('.channels-section .channel-item');
    const uncategorizedVoice = document.querySelectorAll('.voice-channels-section .channel-item');
    
    console.log('📄 Uncategorized Text Channels:');
    uncategorizedText.forEach((channel, index) => {
        console.log(`  ${index + 1}. ${channel.getAttribute('data-channel-name')} (pos: ${channel.getAttribute('data-channel-position')})`);
    });
    
    console.log('🔊 Uncategorized Voice Channels:');
    uncategorizedVoice.forEach((channel, index) => {
        console.log(`  ${index + 1}. ${channel.getAttribute('data-channel-name')} (pos: ${channel.getAttribute('data-channel-position')})`);
    });
    
    const categories = document.querySelectorAll('.category-section');
    categories.forEach((categorySection, catIndex) => {
        const categoryHeader = categorySection.querySelector('.category-header');
        const categoryName = categoryHeader.getAttribute('data-category-name');
        const categoryChannels = categorySection.querySelectorAll('.channel-item');
        
        console.log(`📁 Category "${categoryName}":`)
        categoryChannels.forEach((channel, index) => {
            console.log(`  ${index + 1}. ${channel.getAttribute('data-channel-name')} (pos: ${channel.getAttribute('data-channel-position')})`);
        });
    });
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