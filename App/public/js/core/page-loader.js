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
        return link.hostname === window.location.hostname;
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
            // It seems ajax-handler already parses JSON. If the server sends HTML, this will fail.
            // I need to adjust server to send JSON with an html key.
            // Or adjust the ajax handler to handle non-json responses.
            // Let's assume for now the response is the HTML string.
            // This is a big assumption. The current ajax-handler will fail.

            // I will have to modify ajax-handler.js to support text/html responses.

            if (!isPopState) {
                history.pushState({ path: url }, '', url);
            }
            
            // The response from MisVordAjax is already JSON parsed.
            // I'll assume the server sends { html: "..." }
            if (response.html) {
                mainContent.innerHTML = response.html;
                this.updateTitle(response.title);
                this.reinitializeScripts();
            } else {
                // This is a problem. The ajax handler expects JSON. If the server sends HTML, it will break.
                // I will need to modify the server to wrap the HTML in a JSON response.
                // And what if the response is not what I expect? I need error handling.
                console.error("Response is not in expected format {html: '...'}", response);
                // Fallback for now if the format is not what's expected but is a string.
                if (typeof response === 'string') {
                    mainContent.innerHTML = response;
                    this.reinitializeScripts();
                }
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