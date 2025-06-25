/**
 * Voice Section UI Manager
 * Handles Discord-style fullscreen voice UI
 */

class VoiceSectionUI {
    constructor() {
        this.initialized = false;
        this.init();
    }
    
    init() {
        if (this.initialized) return;
        
        this.initialized = true;
        console.log('Voice Section UI initialized');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.voiceSectionUI = new VoiceSectionUI();
});
