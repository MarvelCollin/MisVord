const PageLoader = {
    init: function() {
        // DISABLED: SPA functionality conflicts with pure AJAX channel switching
        console.log('⚠️ PageLoader SPA functionality disabled - using pure AJAX system');
        return;
        
        document.body.addEventListener('click', this.handleLinkClick.bind(this));
        window.addEventListener('popstate', this.handlePopState.bind(this));
    },

    handleLinkClick: function(event) {
        // DISABLED
        return;
        
        const link = event.target.closest('a');

        if (link && this.isNavigationalLink(link)) {
            event.preventDefault();
            const url = link.href;
            this.loadPage(url);
        }
    },

    isNavigationalLink: function(link) {
        // DISABLED
        return false;
        
        if (link.hasAttribute('data-no-navigation') || link.closest('[data-no-navigation]')) {
            return false;
        }

        if (link.getAttribute('target') === '_blank') {
            return false;
        }
        
        if (link.href.includes('javascript:void(0)')) {
            return false;
        }

        if (link.hostname !== window.location.hostname) {
            return false;
        }

        const currentPath = window.location.pathname;
        const targetPath = new URL(link.href).pathname;
        
        const isServerPage = currentPath.includes('/server/');
        const isTargetServerPage = targetPath.includes('/server/');
        
        return isServerPage && isTargetServerPage;
    },

    async loadPage(url, isPopState = false) {
        // DISABLED: Force full page navigation instead of SPA
        window.location.href = url;
        return;
        
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('Main content container #main-content not found.');
            window.location.href = url;
            return;
        }

        mainContent.classList.add('loading-content');

        try {
            const response = await fetch(url, {
                headers: {
                    'Accept': 'text/html',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-Page-Request': 'true'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const content = await response.text();

            if (!isPopState) {
                history.pushState({ path: url }, '', url);
            }
            
            if (content.trim().startsWith('<') || content.includes('</div>') || content.includes('</html>')) {
                mainContent.innerHTML = content;
                this.reinitializeScripts();
            } else {
                console.error('Received unexpected response format');
                window.location.href = url;
            }

        } catch (error) {
            console.error('Error loading page:', error);
            window.location.href = url;
        } finally {
            mainContent.classList.remove('loading-content');
        }
    },

    handlePopState: function(event) {
        // DISABLED
        return;
        
        if (event.state && event.state.path) {
            this.loadPage(event.state.path, true);
        }
    },

    reinitializeScripts: function() {
        // DISABLED
        return;
        
        const mainContent = document.getElementById('main-content');
        mainContent.querySelectorAll('script').forEach(oldScript => {
            const newScript = document.createElement('script');
            newScript.textContent = oldScript.textContent;
            Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }
};

export default PageLoader; 