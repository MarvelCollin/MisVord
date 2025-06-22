import { ServerAPI } from '../api/server-api.js';

/**
 * Utilities for page content manipulation
 */

export const pageUtils = {
    /**
     * Updates the content of a container with HTML
     * @param {HTMLElement} container - The container to update
     * @param {string} html - The HTML content
     */
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
    
    /**
     * Executes inline scripts from a document
     * @param {Document} doc - The document containing scripts
     */
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
    
    /**
     * Refreshes the server sidebar
     */
    refreshSidebar() {
        const sidebar = document.querySelector('.w-\\[72px\\]') || 
                       document.querySelector('.server-sidebar');
        
        if (sidebar) {
            const api = new ServerAPI();
            api.getSidebar()
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