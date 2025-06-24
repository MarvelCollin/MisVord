/**
 * Local Storage Manager for Server Groups
 */
export class LocalStorageManager {
    static KEYS = {
        SERVER_GROUPS: 'misvord_server_groups'
    };
    
    /**
     * Save server groups to local storage
     * @param {Array} groups - Array of group objects
     */
    static saveServerGroups(groups) {
        localStorage.setItem(this.KEYS.SERVER_GROUPS, JSON.stringify(groups));
    }
    
    /**
     * Get server groups from local storage
     * @returns {Array} Array of group objects
     */
    static getServerGroups() {
        const groups = localStorage.getItem(this.KEYS.SERVER_GROUPS);
        return groups ? JSON.parse(groups) : [];
    }
    
    /**
     * Add a new server group
     * @param {string} name - Group name
     * @returns {string} New group ID
     */
    static addServerGroup(name) {
        const groups = this.getServerGroups();
        const newGroup = {
            id: 'group_' + Date.now(),
            name: name,
            servers: [],
            collapsed: false
        };
        
        groups.push(newGroup);
        this.saveServerGroups(groups);
        return newGroup.id;
    }
    
    /**
     * Rename a server group
     * @param {string} groupId - Group ID to rename
     * @param {string} newName - New name for the group
     */
    static renameServerGroup(groupId, newName) {
        const groups = this.getServerGroups();
        const group = groups.find(g => g.id === groupId);
        
        if (group && newName && newName.trim()) {
            group.name = newName.trim();
            this.saveServerGroups(groups);
        }
    }
    
    /**
     * Remove a server group
     * @param {string} groupId - Group ID to remove
     */
    static removeServerGroup(groupId) {
        let groups = this.getServerGroups();
        groups = groups.filter(group => group.id !== groupId);
        this.saveServerGroups(groups);
    }
    
    /**
     * Add server to a group
     * @param {string} groupId - Group ID
     * @param {string} serverId - Server ID to add
     */
    static addServerToGroup(groupId, serverId) {
        const groups = this.getServerGroups();
        const group = groups.find(g => g.id === groupId);
        
        if (group && !group.servers.includes(serverId)) {
            // Remove server from any existing group first
            this.removeServerFromAllGroups(serverId);
            
            // Add to new group
            group.servers.push(serverId);
            this.saveServerGroups(groups);
        }
    }
    
    /**
     * Remove server from all groups
     * @param {string} serverId - Server ID to remove
     */
    static removeServerFromAllGroups(serverId) {
        const groups = this.getServerGroups();
        groups.forEach(group => {
            group.servers = group.servers.filter(id => id !== serverId);
        });
        this.saveServerGroups(groups);
    }
    
    /**
     * Get the group containing a specific server
     * @param {string} serverId - Server ID to find
     * @returns {Object|null} - The group object or null if not found
     */
    static getServerGroup(serverId) {
        const groups = this.getServerGroups();
        return groups.find(group => group.servers.includes(serverId)) || null;
    }
    
    /**
     * Set group collapsed state
     * @param {string} groupId - Group ID to set
     * @param {boolean} isCollapsed - Whether the group should be collapsed
     */
    static setGroupCollapsed(groupId, isCollapsed) {
        const groups = this.getServerGroups();
        const group = groups.find(g => g.id === groupId);
        
        if (group) {
            group.collapsed = isCollapsed;
            this.saveServerGroups(groups);
        }
    }
    
    /**
     * Toggle group collapsed state
     * @param {string} groupId - Group ID to toggle
     * @returns {boolean} New collapsed state
     */
    static toggleGroupCollapsed(groupId) {
        const groups = this.getServerGroups();
        const group = groups.find(g => g.id === groupId);
        
        if (group) {
            group.collapsed = !group.collapsed;
            this.saveServerGroups(groups);
            return group.collapsed;
        }
        return false;
    }
}
