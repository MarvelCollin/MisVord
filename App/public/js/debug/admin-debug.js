// Admin Dashboard Debug Tool
(function() {
    console.log('Admin Dashboard Debug Tool loaded');
    
    // Create a simple debug overlay
    const debugDiv = document.createElement('div');
    debugDiv.style.position = 'fixed';
    debugDiv.style.bottom = '20px';
    debugDiv.style.left = '20px';
    debugDiv.style.zIndex = '9999';
    debugDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    debugDiv.style.color = '#fff';
    debugDiv.style.padding = '10px';
    debugDiv.style.borderRadius = '5px';
    debugDiv.style.fontFamily = 'monospace';
    debugDiv.style.fontSize = '12px';
    debugDiv.style.maxWidth = '300px';
    debugDiv.style.maxHeight = '200px';
    debugDiv.style.overflow = 'auto';
    debugDiv.style.display = 'none';
    debugDiv.id = 'admin-debug-overlay';
    
    // Create debug button
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Debug';
    debugButton.style.position = 'fixed';
    debugButton.style.bottom = '20px';
    debugButton.style.left = '20px';
    debugButton.style.zIndex = '9999';
    debugButton.style.padding = '5px 10px';
    debugButton.style.backgroundColor = '#5865F2';
    debugButton.style.color = 'white';
    debugButton.style.border = 'none';
    debugButton.style.borderRadius = '4px';
    debugButton.style.cursor = 'pointer';
    
    // Only add to the DOM when loaded
    document.addEventListener('DOMContentLoaded', function() {
        document.body.appendChild(debugDiv);
        document.body.appendChild(debugButton);
        
        // Add toggle functionality
        debugButton.addEventListener('click', function() {
            if (debugDiv.style.display === 'none') {
                debugDiv.style.display = 'block';
                updateDebugInfo();
            } else {
                debugDiv.style.display = 'none';
            }
        });
    });
    
    // Function to update debug info
    function updateDebugInfo() {
        let info = '';
        
        // Check if managers exist
        info += '<strong>Managers:</strong><br>';
        info += `AdminManager: ${window.adminManager ? '✓' : '✗'}<br>`;
        info += `OverviewManager: ${window.overviewManager ? '✓' : '✗'}<br>`;
        info += `ServerManager: ${window.serverManager ? '✓' : '✗'}<br>`;
        info += `UserManager: ${window.userManager ? '✓' : '✗'}<br>`;
        
        // Check if APIs exist
        info += '<br><strong>APIs:</strong><br>';
        info += `serverAPI: ${window.serverAPI ? '✓' : '✗'}<br>`;
        info += `userAdminAPI: ${window.userAdminAPI ? '✓' : '✗'}<br>`;
        
        // Check mock data configuration
        if (window.overviewManager && window.overviewManager.chartConfig) {
            const config = window.overviewManager.chartConfig;
            info += '<br><strong>Chart Config:</strong><br>';
            info += `Mock Data: ${config.useMockData ? 'Enabled' : 'Disabled'}<br>`;
            if (config.useMockData) {
                info += `Range: ${config.mockDataRange}<br>`;
                info += `Trend: ${config.mockDataTrend}<br>`;
            }
        }
        
        // Add debug actions
        info += '<br><div style="margin-top:10px">';
        info += '<button id="toggle-mock-data" style="margin-right:5px;padding:3px 6px;background:#4f545c;color:white;border:none;border-radius:3px;cursor:pointer;">Toggle Mock</button>';
        info += '<button id="reload-data" style="padding:3px 6px;background:#4f545c;color:white;border:none;border-radius:3px;cursor:pointer;">Reload Data</button>';
        info += '</div>';
        
        debugDiv.innerHTML = info;
        
        // Add event listeners for the buttons
        setTimeout(() => {
            const toggleMockBtn = document.getElementById('toggle-mock-data');
            const reloadDataBtn = document.getElementById('reload-data');
            
            if (toggleMockBtn) {
                toggleMockBtn.addEventListener('click', () => {
                    if (window.overviewManager) {
                        const currentConfig = window.overviewManager.chartConfig;
                        window.overviewManager.updateChartConfig({
                            ...currentConfig,
                            useMockData: !currentConfig.useMockData
                        });
                        updateDebugInfo();
                    }
                });
            }
            
            if (reloadDataBtn) {
                reloadDataBtn.addEventListener('click', () => {
                    if (window.overviewManager) {
                        window.overviewManager.loadSystemStats();
                        window.overviewManager.loadChartData();
                        updateDebugInfo();
                    }
                });
            }
        }, 0);
    }
})();
