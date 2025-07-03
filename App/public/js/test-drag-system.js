function testDragSystem() {
    console.log('🧪 Testing Server Drag System...');
    
    const serverIcons = document.querySelectorAll('.server-sidebar-icon[data-server-id]');
    const serverList = document.getElementById('server-list');
    const serverGroups = document.querySelectorAll('.server-sidebar-group');
    
    console.log(`✅ Found ${serverIcons.length} draggable server icons`);
    console.log(`✅ Found ${serverGroups.length} server groups in DOM`);
    console.log(`✅ Server list container: ${serverList ? 'Found' : 'Missing'}`);
    
    serverIcons.forEach((icon, index) => {
        const serverId = icon.getAttribute('data-server-id');
        const isDraggable = icon.draggable;
        const hasSetupAttr = icon.hasAttribute('data-setup');
        
        console.log(`Server ${index + 1}: ID=${serverId}, Draggable=${isDraggable}, Setup=${hasSetupAttr}`);
    });
    
    serverGroups.forEach((group, index) => {
        const groupId = group.getAttribute('data-group-id');
        const isOpen = group.classList.contains('open');
        const folderIcon = group.querySelector('.folder-icon');
        const serversContainer = group.querySelector('.group-servers');
        
        console.log(`📁 Group ${index + 1}: ID=${groupId}, Open=${isOpen}, FolderIcon=${folderIcon ? 'Found' : 'Missing'}, ServersContainer=${serversContainer ? 'Found' : 'Missing'}`);
        
        if (serversContainer) {
            const serversInGroup = serversContainer.querySelectorAll('.server-sidebar-icon');
            console.log(`  - Contains ${serversInGroup.length} servers`);
        }
    });
    
    const groups = window.LocalStorageManager?.getServerGroups() || [];
    const serverOrder = window.LocalStorageManager?.getServerOrder() || [];
    console.log(`💾 Current server groups in storage: ${groups.length}`);
    console.log(`📋 Server order tracking: ${serverOrder.length} servers`);
    
    if (groups.length > 0) {
        groups.forEach((group, index) => {
            console.log(`  Storage Group ${index + 1}: "${group.name}" with ${group.servers.length} servers, collapsed=${group.collapsed}`);
        });
    }
    
    console.log('🎯 Test Actions:');
    console.log('  1. Drag a server onto another server to create a folder');
    console.log('  2. Click folder to expand/collapse');
    console.log('  3. Right-click folder for context menu');
    console.log('  4. Drag server to empty space to remove from folder');
    console.log('  5. Server positions should be preserved during operations');
    
    return {
        serverCount: serverIcons.length,
        groupCount: groups.length,
        domGroupCount: serverGroups.length,
        orderLength: serverOrder.length,
        isReady: serverIcons.length > 0 && serverList !== null
    };
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(testDragSystem, 1000);
    });
} else {
    setTimeout(testDragSystem, 1000);
}

function testCollapseExpand() {
    console.log('🔄 Testing Collapse/Expand...');
    const groups = document.querySelectorAll('.server-sidebar-group');
    
    groups.forEach((group, index) => {
        const isOpen = group.classList.contains('open');
        const header = group.querySelector('.group-header');
        
        console.log(`Group ${index + 1}: ${isOpen ? 'EXPANDED' : 'COLLAPSED'}`);
        
        if (header) {
            console.log(`  - Click this group to ${isOpen ? 'collapse' : 'expand'} it`);
            header.style.border = '2px solid #5865f2';
            setTimeout(() => {
                header.style.border = '';
            }, 2000);
        }
    });
}

function createTestGroup() {
    console.log('🧪 Creating test server group...');
    
    const serverIcons = document.querySelectorAll('.server-sidebar-icon[data-server-id]');
    if (serverIcons.length < 2) {
        console.log('❌ Need at least 2 servers to create a test group');
        return;
    }
    
    const server1Id = serverIcons[0].getAttribute('data-server-id');
    const server2Id = serverIcons[1].getAttribute('data-server-id');
    
    // Create a test group
    const groupId = window.LocalStorageManager.addServerGroup('Test Folder');
    window.LocalStorageManager.addServerToGroup(groupId, server1Id);
    window.LocalStorageManager.addServerToGroup(groupId, server2Id);
    window.LocalStorageManager.setGroupCollapsed(groupId, true); // Start collapsed
    
    // Refresh the sidebar
    if (window.refreshServerGroups) {
        window.refreshServerGroups();
    }
    
    console.log(`✅ Created test group "${groupId}" with servers ${server1Id} and ${server2Id}`);
    console.log('📁 The group should appear collapsed (showing folder icon)');
    console.log('👆 Click the folder to expand/collapse it');
    
    setTimeout(() => {
        const newGroup = document.querySelector(`[data-group-id="${groupId}"]`);
        if (newGroup) {
            newGroup.style.border = '2px solid #00ff00';
            setTimeout(() => {
                newGroup.style.border = '';
            }, 3000);
        }
    }, 500);
}

function clearAllGroups() {
    console.log('🗑️ Clearing all server groups...');
    const groups = window.LocalStorageManager.getServerGroups();
    groups.forEach(group => {
        window.LocalStorageManager.removeServerGroup(group.id);
    });
    
    if (window.refreshServerGroups) {
        window.refreshServerGroups();
    }
    
    console.log('✅ All server groups cleared');
}

function debugServerLocations() {
    console.log('=== SERVER LOCATION DEBUG ===');
    
    // Check servers in main list
    const mainServers = document.querySelectorAll('#server-list > .server-sidebar-icon[data-server-id]');
    console.log('Servers in main list:', mainServers.length);
    mainServers.forEach(server => {
        const id = server.getAttribute('data-server-id');
        const hasInGroup = server.classList.contains('in-group');
        console.log(`  - Server ${id} (in-group: ${hasInGroup})`);
    });
    
    // Check servers in groups
    const groupServers = document.querySelectorAll('.server-sidebar-group .group-servers .server-sidebar-icon[data-server-id]');
    console.log('Servers in groups:', groupServers.length);
    groupServers.forEach(server => {
        const id = server.getAttribute('data-server-id');
        const groupId = server.closest('.server-sidebar-group')?.getAttribute('data-group-id');
        const hasInGroup = server.classList.contains('in-group');
        console.log(`  - Server ${id} in group ${groupId} (in-group: ${hasInGroup})`);
    });
    
    // Check total servers
    const allServers = document.querySelectorAll('.server-sidebar-icon[data-server-id]');
    console.log('Total servers found:', allServers.length);
    
    // Check for duplicates
    const serverIds = Array.from(allServers).map(s => s.getAttribute('data-server-id'));
    const duplicates = serverIds.filter((id, index) => serverIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
        console.warn('DUPLICATE SERVERS FOUND:', [...new Set(duplicates)]);
    } else {
        console.log('No duplicate servers detected');
    }
    
    return {
        mainCount: mainServers.length,
        groupCount: groupServers.length,
        totalCount: allServers.length,
        duplicates: [...new Set(duplicates)]
    };
}

function testServerPositioning() {
    console.log('📍 Testing Server Positioning System...');
    
    if (!window.LocalStorageManager) {
        console.error('❌ LocalStorageManager not available');
        return false;
    }
    
    const serverOrder = window.LocalStorageManager.getServerOrder();
    const currentElements = document.querySelectorAll('.server-sidebar-icon[data-server-id]');
    const currentIds = Array.from(currentElements).map(el => el.getAttribute('data-server-id'));
    
    console.log('📋 Stored order:', serverOrder);
    console.log('🎭 DOM order:', currentIds);
    
    const missingInOrder = currentIds.filter(id => !serverOrder.includes(id));
    const missingInDom = serverOrder.filter(id => !currentIds.includes(id));
    
    if (missingInOrder.length > 0) {
        console.warn('⚠️ Servers in DOM but not in order:', missingInOrder);
    }
    
    if (missingInDom.length > 0) {
        console.warn('⚠️ Servers in order but not in DOM:', missingInDom);
    }
    
    const isConsistent = missingInOrder.length === 0 && missingInDom.length === 0;
    console.log(`✅ Position consistency: ${isConsistent ? 'PASS' : 'FAIL'}`);
    
    return {
        consistent: isConsistent,
        orderCount: serverOrder.length,
        domCount: currentIds.length,
        missingInOrder: missingInOrder.length,
        missingInDom: missingInDom.length
    };
}

// Export all functions to global scope
window.testDragSystem = testDragSystem;
window.testCollapseExpand = testCollapseExpand;
window.createTestGroup = createTestGroup;
window.clearAllGroups = clearAllGroups;
window.debugServerLocations = debugServerLocations;
window.testServerPositioning = testServerPositioning; 