// Fallback logger for early script loading
(function() {
    'use strict';
    
    if (typeof window !== 'undefined' && !window.logger) {
        window.logger = {
            debug: function(module = 'general', message, ...data) {
                // If only one argument, treat as message with default module
                if (arguments.length === 1 && typeof module === 'string') {
                    console.log(`[DEBUG] [GENERAL] ${module}`);
                } else {
                    console.log(`[DEBUG] [${module.toUpperCase()}] ${message}`, ...data);
                }
            },
            
            info: function(module = 'general', message, ...data) {
                // If only one argument, treat as message with default module
                if (arguments.length === 1 && typeof module === 'string') {
                    console.log(`[INFO] [GENERAL] ${module}`);
                } else {
                    console.log(`[INFO] [${module.toUpperCase()}] ${message}`, ...data);
                }
            },
            
            warn: function(module = 'general', message, ...data) {
                // If only one argument, treat as message with default module
                if (arguments.length === 1 && typeof module === 'string') {
                    console.warn(`[WARN] [GENERAL] ${module}`);
                } else {
                    console.warn(`[WARN] [${module.toUpperCase()}] ${message}`, ...data);
                }
            },
            
            error: function(module = 'general', message, ...data) {
                // If only one argument, treat as message with default module
                if (arguments.length === 1 && typeof module === 'string') {
                    console.error(`[ERROR] [GENERAL] ${module}`);
                } else {
                    console.error(`[ERROR] [${module.toUpperCase()}] ${message}`, ...data);
                }
            },
            
            group: function(module, title, collapsed = false) {
                if (collapsed) {
                    console.groupCollapsed(`[${module.toUpperCase()}] ${title}`);
                } else {
                    console.group(`[${module.toUpperCase()}] ${title}`);
                }
            },
            
            groupEnd: function() {
                console.groupEnd();
            },
            
            table: function(module, data, columns) {
                console.table(data, columns);
            },
            
            time: function(module, label) {
                console.time(`[${module.toUpperCase()}] ${label}`);
            },
            
            timeEnd: function(module, label) {
                console.timeEnd(`[${module.toUpperCase()}] ${label}`);
            },
            
            trace: function(module, message) {
                console.trace(`[${module.toUpperCase()}] ${message}`);
            },
            
            _isFallback: true
        };
        
        console.log('[FALLBACK LOGGER] Basic logger loaded, will be replaced by full logger');
    }
})();
