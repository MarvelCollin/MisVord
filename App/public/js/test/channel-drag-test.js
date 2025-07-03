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

function debugChannelDragSystem() {
    console.log('🔧 [DEBUG] Channel Drag System Comprehensive Debug');
    console.log('===============================================');
    
    const manager = window.getChannelDragManager && window.getChannelDragManager();
    
    console.log('1. 📦 Manager Status:');
    console.log('   - Manager exists:', !!manager);
    if (manager) {
        console.log('   - Initialized:', manager.isInitialized);
        console.log('   - Currently dragging:', manager.isDragging);
        console.log('   - Server ID:', manager.currentServerId);
    }
    
    console.log('\n2. 🎯 DOM Elements:');
    const channels = document.querySelectorAll('.channel-item[data-channel-id]');
    const categories = document.querySelectorAll('.category-header[data-category-id]');
    console.log('   - Channels found:', channels.length);
    console.log('   - Categories found:', categories.length);
    
    console.log('\n3. 🔧 Drag Setup Status:');
    let setupChannels = 0;
    let draggableChannels = 0;
    
    channels.forEach((channel, index) => {
        const hasSetup = channel.hasAttribute('data-drag-setup');
        const isDraggable = channel.draggable;
        
        if (hasSetup) setupChannels++;
        if (isDraggable) draggableChannels++;
        
        if (index < 3) {
            console.log(`   - Channel ${index + 1} "${channel.getAttribute('data-channel-name')}":`, {
                setup: hasSetup,
                draggable: isDraggable,
                events: channel.getAttribute('data-drag-setup') === 'true'
            });
        }
    });
    
    console.log(`   - Setup channels: ${setupChannels}/${channels.length}`);
    console.log(`   - Draggable channels: ${draggableChannels}/${channels.length}`);
    
    console.log('\n4. 🎨 Styles:');
    const styles = document.getElementById('channel-drag-styles');
    console.log('   - Drag styles loaded:', !!styles);
    
    console.log('\n5. 🌐 API Endpoints Test:');
    testAPIEndpoints();
    
    console.log('\n6. 👆 Event Listeners:');
    testEventListeners();
    
    console.log('\n7. 📋 Quick Tests:');
    console.log('   Run these commands to test:');
    console.log('   - forceInitChannelDrag() - Reinitialize system');
    console.log('   - testChannelDragEvents() - Test drag events');
    console.log('   - inspectChannelElement(channelId) - Inspect specific channel');
    
    console.log('\n===============================================');
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
                console.log(`   - ${endpoint}: ${response.status === 422 ? 'Available' : 'Status ' + response.status}`);
            })
            .catch(error => {
                console.log(`   - ${endpoint}: Error (${error.message})`);
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
    
    console.log(`   - Channels with drag events: ${hasEvents}/${channels.length}`);
}

function forceInitChannelDrag() {
    console.log('🔄 [DEBUG] Force initializing channel drag system...');
    
    if (window.initChannelDragSystem) {
        const manager = window.initChannelDragSystem();
        console.log('✅ [DEBUG] Channel drag system reinitialized:', !!manager);
        return manager;
    } else {
        console.error('❌ [DEBUG] initChannelDragSystem function not available');
        return null;
    }
}

function testChannelDragEvents() {
    console.log('🧪 [DEBUG] Testing channel drag events...');
    
    const channels = document.querySelectorAll('.channel-item[data-channel-id]');
    if (channels.length === 0) {
        console.error('❌ [DEBUG] No channels found to test');
        return;
    }
    
    const testChannel = channels[0];
    console.log('🎯 [DEBUG] Testing with channel:', testChannel.getAttribute('data-channel-name'));
    
    console.log('1. Testing dragstart event...');
    const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
    });
    testChannel.dispatchEvent(dragStartEvent);
    
    setTimeout(() => {
        console.log('2. Testing dragend event...');
        const dragEndEvent = new DragEvent('dragend', {
            bubbles: true,
            cancelable: true
        });
        testChannel.dispatchEvent(dragEndEvent);
        
        console.log('✅ [DEBUG] Drag events test completed');
    }, 1000);
}

function inspectChannelElement(channelId) {
    const channel = document.querySelector(`[data-channel-id="${channelId}"]`);
    
    if (!channel) {
        console.error(`❌ [DEBUG] Channel with ID ${channelId} not found`);
        return;
    }
    
    console.log(`🔍 [DEBUG] Inspecting channel ${channelId}:`);
    console.log('   - Element:', channel);
    console.log('   - Name:', channel.getAttribute('data-channel-name'));
    console.log('   - Type:', channel.getAttribute('data-channel-type'));
    console.log('   - Position:', channel.getAttribute('data-channel-position'));
    console.log('   - Category ID:', channel.getAttribute('data-category-id'));
    console.log('   - Draggable:', channel.draggable);
    console.log('   - Has drag setup:', channel.hasAttribute('data-drag-setup'));
    console.log('   - Classes:', channel.className);
    
    const events = getEventListeners ? getEventListeners(channel) : 'getEventListeners not available';
    console.log('   - Event listeners:', events);
}

function fixChannelDragIssues() {
    console.log('🛠️ [DEBUG] Attempting to fix common channel drag issues...');
    
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
    
    console.log(`✅ [DEBUG] Fixed ${fixed} elements`);
    
    if (window.initChannelDragSystem) {
        window.initChannelDragSystem();
        console.log('✅ [DEBUG] Reinitialized drag system');
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