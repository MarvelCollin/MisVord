function initIframeHandler() {
    if (window.self !== window.top) {
        document.body.classList.add('in-iframe');
        
        if (document.cookie.indexOf('PHPSESSID') === -1) {
            document.cookie = "iframe_session=true; path=/; SameSite=None; Secure";
        }

        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            if (!form.hasAttribute('target')) {
                form.setAttribute('target', '_top');
            }
        });

        window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'LOGIN_SUCCESS') {
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                        type: 'LOGIN_SUCCESS', 
                        user: event.data.user
                    }, '*');
                }
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIframeHandler);
} else {
    initIframeHandler();
}
