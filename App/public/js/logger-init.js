if (typeof window !== 'undefined' && !window.logger) {
    window.logger = {
        info: (module, ...args) => console.log(`[${module.toUpperCase()}]`, ...args),
        debug: (module, ...args) => console.log(`[${module.toUpperCase()}]`, ...args),
        warn: (module, ...args) => console.warn(`[${module.toUpperCase()}]`, ...args),
        error: (module, ...args) => console.error(`[${module.toUpperCase()}]`, ...args),
        group: (module, title, collapsed = false) => {
            if (collapsed) {
                console.groupCollapsed(`[${module.toUpperCase()}] ${title}`);
            } else {
                console.group(`[${module.toUpperCase()}] ${title}`);
            }
        },
        groupEnd: () => console.groupEnd(),
        table: (module, data, columns) => console.table(data, columns),
        time: (module, label) => console.time(`[${module.toUpperCase()}] ${label}`),
        timeEnd: (module, label) => console.timeEnd(`[${module.toUpperCase()}] ${label}`),
        trace: (module, message) => console.trace(`[${module.toUpperCase()}] ${message}`)
    };
    

}

document.addEventListener('DOMContentLoaded', function() {

});
