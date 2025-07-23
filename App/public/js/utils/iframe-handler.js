function initIframeHandler() {
    if (window.self !== window.top) {
        document.body.classList.add('in-iframe');
        
        document.cookie = "iframe_session=true; path=/; SameSite=None; Secure";

        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            if (!form.hasAttribute('target')) {
                form.setAttribute('target', '_self');
            }
            
            const iframeInput = document.createElement('input');
            iframeInput.type = 'hidden';
            iframeInput.name = 'iframe';
            iframeInput.value = '1';
            form.appendChild(iframeInput);
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
