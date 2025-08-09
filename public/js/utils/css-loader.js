export function loadCSS(cssFiles) {
    if (!cssFiles || !Array.isArray(cssFiles)) return Promise.resolve();
    

    
    const promises = cssFiles.map(cssFile => {
        return new Promise((resolve, reject) => {
            const href = `/public/css/${cssFile}.css`;
            
            if (document.querySelector(`link[href="${href}"]`)) {

                resolve();
                return;
            }
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = href;
            
            link.onload = () => {

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
    

    
    cssFiles.forEach(cssFile => {
        const href = `/public/css/${cssFile}.css`;
        const link = document.querySelector(`link[href="${href}"]`);
        if (link) {
            link.remove();

        }
    });
}

window.loadCSS = loadCSS;
window.unloadCSS = unloadCSS; 