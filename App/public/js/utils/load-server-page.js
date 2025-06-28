export function loadServerPage(serverId) {
    const mainContent = document.querySelector('.flex-1') ||
        document.querySelector('[class*="server-content"]') ||
        document.querySelector('main');

    if (mainContent) {
        if (typeof window.handleSkeletonLoading === 'function') {
            window.handleSkeletonLoading(true);
        } else {
            if (typeof window.toggleChannelLoading === 'function') {
                window.toggleChannelLoading(true);
            }

            if (typeof window.toggleParticipantLoading === 'function') {
                window.toggleParticipantLoading(true);
            }

            showPageLoading(mainContent);
        }

        window.serverAPI.getServerPageHTML(serverId)
            .then(response => {
                if (typeof response === 'string') {
                    if (window.pageUtils) {
                        window.pageUtils.updatePageContent(mainContent, response);
                    } else {
                        updatePageContent(mainContent, response);
                    }
                    
                    if (typeof window.handleSkeletonLoading === 'function') {
                        window.handleSkeletonLoading(false);
                    } else {
                        if (typeof window.toggleChannelLoading === 'function') {
                            window.toggleChannelLoading(false);
                        }

                        if (typeof window.toggleParticipantLoading === 'function') {
                            window.toggleParticipantLoading(false);
                        }
                    }
                    
                    if (typeof window.initServerPage === 'function') {
                        window.initServerPage();
                    }
                    
                    if (typeof window.initializeChannelClickHandlers === 'function') {
                        window.initializeChannelClickHandlers();
                    }
                    
                    const event = new CustomEvent('ServerChanged', { detail: { serverId } });
                    document.dispatchEvent(event);
                    
                    if (window.voiceManager) {
                        window.voiceManager = null;
                    }
                } else if (response && response.data && response.data.redirect) {
                    window.location.href = response.data.redirect;
                } else {
                    window.location.href = `/server/${serverId}`;
                }
            })
            .catch(error => {
                console.error('Error loading server page:', error);
                if (typeof window.handleSkeletonLoading === 'function') {
                    window.handleSkeletonLoading(false);
                } else {
                    if (typeof window.toggleChannelLoading === 'function') {
                        window.toggleChannelLoading(false);
                    }

                    if (typeof window.toggleParticipantLoading === 'function') {
                        window.toggleParticipantLoading(false);
                    }
                }
                window.location.href = `/server/${serverId}`;
            });
    } else {
        window.location.href = `/server/${serverId}`;
    }
}

function updatePageContent(container, html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newContent = doc.querySelector('.flex-1') || 
                      doc.querySelector('[class*="server-content"]') ||
                      doc.body;
    
    if (newContent) {
        container.innerHTML = newContent.innerHTML;
        executeInlineScripts(doc);
    }
}

function executeInlineScripts(doc) {
    const scripts = doc.querySelectorAll('script:not([src])');
    scripts.forEach(script => {
        if (script.textContent.trim()) {
            try {
                eval(script.textContent);
            } catch (error) {
                console.error('Script execution error:', error);
            }
        }
    });
}

function showPageLoading(container) {
    container.innerHTML = `
        <div class="flex h-full">
            <div class="w-60 bg-discord-dark border-r border-discord-600 flex-shrink-0 p-4">
                <div class="flex items-center justify-between mb-6">
                    <div class="h-6 bg-discord-light rounded w-32 animate-pulse"></div>
                    <div class="h-6 w-6 bg-discord-light rounded-full animate-pulse"></div>
                </div>
                
                <div class="mb-4">
                    <div class="h-5 bg-discord-light rounded w-24 mb-3 animate-pulse"></div>
                    ${Array(3).fill().map(() => `
                        <div class="flex items-center py-1 mb-2">
                            <div class="h-4 w-4 bg-discord-light rounded-sm mr-2 animate-pulse"></div>
                            <div class="h-4 bg-discord-light rounded w-32 animate-pulse"></div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="mb-6">
                    <div class="h-5 bg-discord-light rounded w-28 mb-3 animate-pulse"></div>
                    ${Array(5).fill().map(() => `
                        <div class="flex items-center py-1 mb-2">
                            <div class="h-4 w-4 bg-discord-light rounded-sm mr-2 animate-pulse"></div>
                            <div class="h-4 bg-discord-light rounded w-36 animate-pulse"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="flex-grow bg-discord-background flex flex-col">
                <div class="h-12 border-b border-discord-600 px-4 flex items-center">
                    <div class="h-5 bg-discord-light rounded w-32 animate-pulse"></div>
                    <div class="ml-auto flex space-x-4">
                        ${Array(3).fill().map(() => `
                            <div class="h-6 w-6 bg-discord-light rounded-full animate-pulse"></div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="flex-grow p-4 overflow-y-auto">
                    ${Array(8).fill().map(() => `
                        <div class="flex mb-6">
                            <div class="h-10 w-10 bg-discord-light rounded-full mr-3 flex-shrink-0 animate-pulse"></div>
                            <div class="flex-grow">
                                <div class="flex items-center mb-1">
                                    <div class="h-4 bg-discord-light rounded w-24 mr-2 animate-pulse"></div>
                                    <div class="h-3 bg-discord-light rounded w-16 animate-pulse opacity-75"></div>
                                </div>
                                <div class="h-4 bg-discord-light rounded w-full mb-1 animate-pulse"></div>
                                <div class="h-4 bg-discord-light rounded w-3/4 animate-pulse"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="p-4 border-t border-discord-600">
                    <div class="h-10 bg-discord-dark rounded-lg w-full animate-pulse"></div>
                </div>
            </div>
            
            <div class="w-60 bg-discord-dark border-l border-discord-600 flex-shrink-0 p-4">
                <div class="h-5 bg-discord-light rounded w-32 mb-4 animate-pulse"></div>
                
                <div class="mb-6">
                    <div class="h-4 bg-discord-light rounded w-20 mb-3 animate-pulse opacity-75"></div>
                    ${Array(5).fill().map(() => `
                        <div class="flex items-center py-1 mb-2">
                            <div class="h-8 w-8 bg-discord-light rounded-full mr-2 animate-pulse"></div>
                            <div class="h-4 bg-discord-light rounded w-24 animate-pulse"></div>
                        </div>
                    `).join('')}
                </div>
                
                <div>
                    <div class="h-4 bg-discord-light rounded w-20 mb-3 animate-pulse opacity-75"></div>
                    ${Array(3).fill().map(() => `
                        <div class="flex items-center py-1 mb-2">
                            <div class="h-8 w-8 bg-discord-light rounded-full mr-2 animate-pulse opacity-50"></div>
                            <div class="h-4 bg-discord-light rounded w-24 animate-pulse opacity-50"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

window.loadServerPage = loadServerPage; 