class MisVordLogger {
    constructor() {
        this.config = {
            enabled: true,
            levels: {
                debug: true,
                info: true,
                warn: true,
                error: true
            },
            modules: {
                auth: true,
                messaging: true,
                socket: true,
                server: true,
                channel: true,
                voice: true,
                ui: true,
                api: true,
                general: true
            },
            showTimestamp: true,
            showModule: true,
            showLevel: true
        };

        this.logColors = {
            debug: '#6b7280',
            info: '#3b82f6',
            warn: '#f59e0b',
            error: '#ef4444'
        };

        this.init();
    }

    init() {
        if (typeof window !== 'undefined') {
            if (!window.logger) {
                window.logger = {
                    debug: () => {},
                    info: () => {},
                    warn: () => {},
                    error: (...args) => console.error(...args),
                    _isFallback: true
                };
            }
            
            window.MisVordLogger = this;
            window.Logger = this;
            
            window.setLoggingConfig = (config) => this.updateConfig(config);
            window.enableLogging = () => this.enable();
            window.disableLogging = () => this.disable();
            window.toggleModuleLogging = (module, enabled) => this.toggleModule(module, enabled);
        }
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    enable() {
        this.config.enabled = true;
    }

    disable() {
        this.config.enabled = false;
    }

    toggleModule(module, enabled) {
        if (this.config.modules.hasOwnProperty(module)) {
            this.config.modules[module] = enabled;
        }
    }

    shouldLog(level, module = 'general') {
        if (!this.config.enabled) return false;
        if (!this.config.levels[level]) return false;
        if (!this.config.modules[module]) return false;
        return true;
    }

    formatMessage(level, module, message, data) {
        let formatted = '';

        if (this.config.showTimestamp) {
            const timestamp = new Date().toLocaleTimeString();
            formatted += `[${timestamp}] `;
        }

        if (this.config.showLevel) {
            formatted += `[${level.toUpperCase()}] `;
        }

        if (this.config.showModule && module !== 'general') {
            formatted += `[${module.toUpperCase()}] `;
        }

        formatted += message;

        return formatted;
    }

    log(level, module, message, ...data) {
        if (!this.shouldLog(level, module)) return;

        const formattedMessage = this.formatMessage(level, module, message);
        const color = this.logColors[level];

        switch (level) {
            case 'debug':
                if (data.length > 0) {
                    
                } else {
                    
                }
                break;
            case 'info':
                if (data.length > 0) {
                    
                } else {
                    
                }
                break;
            case 'warn':
                if (data.length > 0) {
                    console.warn(`%c${formattedMessage}`, `color: ${color}`, ...data);
                } else {
                    console.warn(`%c${formattedMessage}`, `color: ${color}`);
                }
                break;
            case 'error':
                if (data.length > 0) {
                    console.error(`%c${formattedMessage}`, `color: ${color}`, ...data);
                } else {
                    console.error(`%c${formattedMessage}`, `color: ${color}`);
                }
                break;
        }
    }

    debug(module = 'general', message, ...data) {
        if (arguments.length === 1 && typeof module === 'string') {
            this.log('debug', 'general', module);
        } else {
            this.log('debug', module, message, ...data);
        }
    }

    info(module = 'general', message, ...data) {
        if (arguments.length === 1 && typeof module === 'string') {
            this.log('info', 'general', module);
        } else {
            this.log('info', module, message, ...data);
        }
    }

    warn(module = 'general', message, ...data) {
        if (arguments.length === 1 && typeof module === 'string') {
            this.log('warn', 'general', module);
        } else {
            this.log('warn', module, message, ...data);
        }
    }

    error(module = 'general', message, ...data) {
        if (arguments.length === 1 && typeof module === 'string') {
            this.log('error', 'general', module);
        } else {
            this.log('error', module, message, ...data);
        }
    }

    group(module, title, collapsed = false) {
        if (!this.shouldLog('info', module)) return;
        
        const formattedTitle = this.formatMessage('info', module, title);
        if (collapsed) {
            console.groupCollapsed(formattedTitle);
        } else {
            console.group(formattedTitle);
        }
    }

    groupEnd() {
        console.groupEnd();
    }

    table(module, data, columns) {
        if (!this.shouldLog('info', module)) return;
        console.table(data, columns);
    }

    time(module, label) {
        if (!this.shouldLog('debug', module)) return;
        console.time(`[${module.toUpperCase()}] ${label}`);
    }

    timeEnd(module, label) {
        if (!this.shouldLog('debug', module)) return;
        console.timeEnd(`[${module.toUpperCase()}] ${label}`);
    }

    trace(module, message) {
        if (!this.shouldLog('debug', module)) return;
        console.trace(this.formatMessage('debug', module, message));
    }

    getConfig() {
        return { ...this.config };
    }

    printHelp() {
        
        
        
        
        
        
        
    }
}

const logger = new MisVordLogger();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = logger;
}

if (typeof window !== 'undefined') {
    if (window.logger && window.logger._isFallback) {
        
    }
    window.logger = logger;
}

export { logger, MisVordLogger };