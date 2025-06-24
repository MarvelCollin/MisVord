import { MisVordAjax } from './ajax/ajax-handler.js';

const PageLoader = {
    init: function() {
        document.body.addEventListener('click', this.handleLinkClick.bind(this));
        window.addEventListener('popstate', this.handlePopState.bind(this));
    },

    handleLinkClick: function(event) {
        const link = event.target.closest('a');

        if (link && this.isNavigationalLink(link)) {
            event.preventDefault();
            const url = link.href;
            this.loadPage(url);
        }
    },

    isNavigationalLink: function(link) {
        // Don't use AJAX for links with explicit attributes
        if (link.hasAttribute('data-no-ajax') || link.closest('[data-no-ajax]')) {
            return false;
        }

        if (link.getAttribute('target') === '_blank') {
            return false;
        }
        
        if (link.href.includes('javascript:void(0)')) {
            return false;
        }

        // Check if the link is internal to the current site
        if (link.hostname !== window.location.hostname) {
            return false;
        }

        // Check if we're on a server page and navigating within server pages
        const currentPath = window.location.pathname;
        const targetPath = new URL(link.href).pathname;
        
        // Only use AJAX for:
        // 1. Navigation within a server page
        // 2. Navigation between channels
        const isServerPage = currentPath.includes('/server/');
        const isTargetServerPage = targetPath.includes('/server/');
        
        // Only use AJAX when we're already on a server page
        // and navigating to another server page or channel
        return isServerPage && isTargetServerPage;
    },

    loadPage: function(url, isPopState = false) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('Main content container #main-content not found.');
            window.location.href = url; // Fallback to full reload
            return;
        }

        // Add a loading indicator class
        mainContent.classList.add('loading-content');

        MisVordAjax.get(url, {
            preventRedirect: true,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-Page-Request': 'true' // Custom header to specify a page content request
            }
        })
        .then(response => {
            if (!isPopState) {
                history.pushState({ path: url }, '', url);
            }
            
            // Handle different response formats
            if (typeof response === 'object' && response !== null) {
                // If the response is a JSON object with an html key
                if (response.html) {
                    mainContent.innerHTML = response.html;
                    this.updateTitle(response.title);
                    this.reinitializeScripts();
                } 
                // If the response is a JSON object with a success field but no html field
                // (likely an API response, not a page content response)
                else if (response.success !== undefined) {
                    console.error("Response is not in expected format {html: '...'}", response);
                    // Fall back to full page reload for API responses
                    window.location.href = url;
                }
                // Other JSON object responses
                else {
                    console.error("Unknown JSON response format", response);
                    window.location.href = url;
                }
            } 
            // If the response is a string (HTML)
            else if (typeof response === 'string') {
                // Check if it looks like HTML
                if (response.trim().startsWith('<') || response.includes('</div>') || response.includes('</html>')) {
                    mainContent.innerHTML = response;
                    this.reinitializeScripts();
                } else {
                    // Not HTML, might be a plain text response or error
                    console.error("Received unexpected plain text response", response);
                    window.location.href = url;
                }
            } 
            // Any other type of response
            else {
                console.error("Unknown response type", response);
                window.location.href = url;
            }
        })
        .catch(error => {
            console.error('Error loading page:', error);
            window.location.href = url; // Fallback on error
        })
        .finally(() => {
            mainContent.classList.remove('loading-content');
        });
    },

    handlePopState: function(event) {
        if (event.state && event.state.path) {
            this.loadPage(event.state.path, true);
        }
    },

    updateTitle: function(newTitle) {
        if (newTitle) {
            document.title = newTitle;
        }
    },

    reinitializeScripts: function() {
        // This is a placeholder. After loading new content,
        // some JS might need to be re-initialized (e.g., event listeners on new elements).
        // A more robust solution might use a pub/sub system or callbacks.
        const mainContent = document.getElementById('main-content');
        // Re-run scripts in the new content
        mainContent.querySelectorAll('script').forEach(oldScript => {
            const newScript = document.createElement('script');
            newScript.textContent = oldScript.textContent;
            // Copy attributes
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }
};

export default PageLoader; 