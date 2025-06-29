export function loadExplorePage() {
    console.log('[Explore Loader] Starting loadExplorePage');
    
    const mainContent = document.querySelector('#app-container .flex.flex-1.overflow-hidden');

    console.log('[Explore Loader] Found main content:', !!mainContent);
    if (mainContent) {
        if (typeof window.handleSkeletonLoading === 'function') {
            window.handleSkeletonLoading(true);
        } else {
            showPageLoading(mainContent);
        }

        const currentChannelId = getCurrentChannelId();
        if (currentChannelId && window.globalSocketManager) {
            console.log('[Explore Loader] Cleaning up current channel socket: ' + currentChannelId);
            window.globalSocketManager.leaveChannel(currentChannelId);
        }

        if (window.voiceManager && typeof window.voiceManager.leaveVoice === 'function') {
            console.log('[Explore Loader] Cleaning up voice manager');
            window.voiceManager.leaveVoice();
            window.voiceManager = null;
        }

        const url = '/explore-servers/layout';

        console.log('[Explore AJAX] Starting request to:', url);

        $.ajax({
            url: url,
            method: 'GET',
            dataType: 'html',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                console.log('[Explore AJAX] SUCCESS - Response received');
                console.log('[Explore AJAX] Response type:', typeof response);
                console.log('[Explore AJAX] Response length:', response ? response.length : 'null');
                console.log('[Explore AJAX] Response preview:', response ? response.substring(0, 150) + '...' : 'empty');
                
                if (typeof response === 'string') {
                    console.log('[Explore AJAX] Processing string response');
                    updateExploreLayout(response);
                    
                    if (typeof window.handleSkeletonLoading === 'function') {
                        window.handleSkeletonLoading(false);
                        console.log('[Explore AJAX] Skeleton loading disabled');
                    }
                    
                    if (typeof window.initExplorePage === 'function') {
                        window.initExplorePage();
                        console.log('[Explore AJAX] Explore page initialized');
                    }
                    
                    const event = new CustomEvent('ExplorePageChanged', { 
                        detail: { 
                            pageType: 'explore'
                        } 
                    });
                    document.dispatchEvent(event);
                    console.log('[Explore AJAX] ExplorePageChanged event dispatched');
                    
                } else if (response && response.data && response.data.redirect) {
                    console.log('[Explore AJAX] Redirect response:', response.data.redirect);
                    window.location.href = response.data.redirect;
                } else {
                    console.error('[Explore AJAX] INVALID RESPONSE FORMAT');
                    console.error('[Explore AJAX] Expected string, got:', typeof response);
                    console.error('[Explore AJAX] Response content:', response);
                    window.location.href = '/explore-servers';
                }
            },
            error: function(xhr, status, error) {
                console.error('[Explore AJAX] ERROR:', error);
                console.error('[Explore AJAX] Status:', status);
                console.error('[Explore AJAX] XHR:', xhr);
                
                if (typeof window.handleSkeletonLoading === 'function') {
                    window.handleSkeletonLoading(false);
                }
                
                window.location.href = '/explore-servers';
            }
        });
    } else {
        console.error('[Explore Loader] Main content element not found');
        window.location.href = '/explore-servers';
    }
}

function updateExploreLayout(html) {
    console.log('[Explore Layout] Updating explore layout');
    console.log('[Explore Layout] Input HTML length:', html.length);
    console.log('[Explore Layout] HTML preview:', html.substring(0, 200) + '...');
    
    const currentLayout = document.querySelector('#app-container .flex.flex-1.overflow-hidden');
    console.log('[Explore Layout] Current layout container found:', !!currentLayout);

    if (currentLayout) {
        console.log('[Explore Layout] Before replacement - current layout children:', currentLayout.children.length);
        
        console.log('[Explore Layout] Replacing layout innerHTML with explore content');
        currentLayout.innerHTML = html;
        
        console.log('[Explore Layout] After replacement - new layout children:', currentLayout.children.length);
        
        // Execute any inline scripts
        const scriptTags = currentLayout.querySelectorAll('script');
        scriptTags.forEach(script => {
            if (script.type === 'module' || script.type === 'text/javascript' || !script.type) {
                try {
                    if (script.src) {
                        const newScript = document.createElement('script');
                        newScript.src = script.src;
                        newScript.type = script.type || 'text/javascript';
                        document.head.appendChild(newScript);
                    } else {
                        eval(script.textContent);
                    }
                    console.log('[Explore Layout] Executed script:', script.type || 'inline');
                } catch (error) {
                    console.error('[Explore Layout] Error executing script:', error);
                }
            }
        });
        
        console.log('[Explore Layout] Updating browser history');
        window.history.pushState(
            { page: 'explore' }, 
            'Explore Servers - misvord', 
            '/explore-servers'
        );
        
        if (typeof window.updateActiveServer === 'function') {
            window.updateActiveServer('explore');
            console.log('[Explore Layout] Active server state updated for explore');
        }
        
        console.log('[Explore Layout] SUCCESS - Explore layout replacement completed');
    } else {
        console.error('[Explore Layout] FAILED - Layout container not found');
        console.error('[Explore Layout] Available containers:', {
            'app-container': !!document.querySelector('#app-container'),
            'flex.flex-1': !!document.querySelector('.flex.flex-1'),
            'overflow-hidden': !!document.querySelector('.overflow-hidden'),
            'all-flex-elements': document.querySelectorAll('.flex').length
        });
    }
}



function showPageLoading(container) {
    container.innerHTML = `
        <div class="flex-1 bg-discord-background overflow-y-auto">
            <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                <div class="mb-8">
                    <div class="h-8 bg-gray-700 rounded w-64 mb-3 animate-pulse"></div>
                    <div class="h-4 bg-gray-700 rounded w-96 animate-pulse"></div>
                </div>
                
                <div class="mb-8 flex flex-col sm:flex-row gap-4">
                    <div class="flex-1 h-12 bg-gray-700 rounded animate-pulse"></div>
                    <div class="flex gap-3">
                        <div class="w-32 h-12 bg-gray-700 rounded animate-pulse"></div>
                        <div class="w-24 h-12 bg-gray-700 rounded animate-pulse"></div>
                    </div>
                </div>

                <div class="mb-10">
                    <div class="h-6 bg-gray-700 rounded w-48 mb-6 animate-pulse"></div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        ${Array(3).fill(0).map(() => `
                            <div class="bg-discord-dark rounded-xl overflow-hidden">
                                <div class="h-36 bg-gray-700 animate-pulse"></div>
                                <div class="p-6">
                                    <div class="h-4 bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
                                    <div class="h-3 bg-gray-700 rounded w-1/2 mb-4 animate-pulse"></div>
                                    <div class="h-10 bg-gray-700 rounded animate-pulse"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <div class="h-6 bg-gray-700 rounded w-48 mb-6 animate-pulse"></div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        ${Array(8).fill(0).map(() => `
                            <div class="bg-discord-dark rounded-xl p-5">
                                <div class="flex items-start mb-4">
                                    <div class="w-14 h-14 bg-gray-700 rounded-xl mr-4 animate-pulse"></div>
                                    <div class="flex-1">
                                        <div class="h-4 bg-gray-700 rounded w-3/4 mb-1 animate-pulse"></div>
                                        <div class="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                                    </div>
                                </div>
                                <div class="h-3 bg-gray-700 rounded mb-2 animate-pulse"></div>
                                <div class="h-3 bg-gray-700 rounded w-4/5 mb-4 animate-pulse"></div>
                                <div class="h-10 bg-gray-700 rounded animate-pulse"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getCurrentChannelId() {
    const activeChannelInput = document.getElementById('active-channel-id');
    return activeChannelInput ? activeChannelInput.value : null;
}

window.loadExplorePage = loadExplorePage; 