// Using window global variables instead of imports
// import serverAPI from '../api/server-api.js';

export const pageUtils = {  
    updatePageContent(container, html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newContent = doc.querySelector('.flex-1') || 
                          doc.querySelector('[class*="server-content"]') ||
                          doc.body;
        
        if (newContent) {
            container.innerHTML = newContent.innerHTML;
            this.executeInlineScripts(doc);
        }
    },
    
    executeInlineScripts(doc) {
        const scripts = doc.querySelectorAll('script:not([src])');
        scripts.forEach(script => {
            if (script.textContent.trim()) {
                try {
                    eval(script.textContent);
                } catch (error) {
                    console.error('Script execution error:', error);
                }
            }
        });
    },
    
    refreshSidebar() {
        const sidebar = document.querySelector('.w-\\[72px\\]') || 
                       document.querySelector('.server-sidebar');
        
        if (sidebar) {
            window.serverAPI.getSidebar()
            .then(html => {
                sidebar.innerHTML = html;
            })
            .catch(error => {
                console.error('Failed to refresh sidebar:', error);
                window.location.reload();
            });
        }
    }
}; 