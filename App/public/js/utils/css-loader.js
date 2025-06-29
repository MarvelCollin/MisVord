export function loadCSS(cssFiles) {
    if (!cssFiles || !Array.isArray(cssFiles)) return Promise.resolve();
    
    console.log('[CSS Loader] Loading CSS files:', cssFiles);
    
    const promises = cssFiles.map(cssFile => {
        return new Promise((resolve, reject) => {
            const href = `/public/css/${cssFile}.css`;
            
            if (document.querySelector(`link[href="${href}"]`)) {
                console.log('[CSS Loader] CSS already loaded:', href);
                resolve();
                return;
            }
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = href;
            
            link.onload = () => {
                console.log('[CSS Loader] CSS loaded successfully:', href);
                resolve();
            };
            
            link.onerror = () => {
                console.error('[CSS Loader] Failed to load CSS:', href);
                reject(new Error(`Failed to load CSS: ${href}`));
            };
            
            document.head.appendChild(link);
        });
    });
    
    return Promise.all(promises);
}

export function unloadCSS(cssFiles) {
    if (!cssFiles || !Array.isArray(cssFiles)) return;
    
    console.log('[CSS Loader] Unloading CSS files:', cssFiles);
    
    cssFiles.forEach(cssFile => {
        const href = `/public/css/${cssFile}.css`;
        const link = document.querySelector(`link[href="${href}"]`);
        if (link) {
            link.remove();
            console.log('[CSS Loader] CSS unloaded:', href);
        }
    });
}

window.loadCSS = loadCSS;
window.unloadCSS = unloadCSS; 