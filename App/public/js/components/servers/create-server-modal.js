document.addEventListener('DOMContentLoaded', function() {
    initServerIconUpload();
    initServerFormSubmission();
});

function initServerIconUpload() {
    const iconInput = document.getElementById('server-icon-input');
    const iconPreview = document.getElementById('server-icon-preview');
    const iconPlaceholder = document.getElementById('server-icon-placeholder');

    if (iconInput) {
        iconInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();

                reader.onload = function(e) {
                    iconPreview.src = e.target.result;
                    iconPreview.classList.remove('hidden');
                    iconPlaceholder.classList.add('hidden');
                }

                reader.readAsDataURL(this.files[0]);
            }
        });
    }
}

function initServerFormSubmission() {
    const serverForm = document.getElementById('create-server-form');
    if (serverForm) {
        serverForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(this);
            
            const modal = document.getElementById('create-server-modal');
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'flex items-center justify-center absolute inset-0 bg-discord-dark bg-opacity-80 z-10';
            loadingIndicator.innerHTML = '<div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-discord-blue"></div>';
            
            if (modal) {
                modal.appendChild(loadingIndicator);
            }

            fetch('/api/servers/create', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log('Server creation response:', JSON.stringify(data, null, 2));
                
                if (data.success) {
                    let serverId = null;
                    
                    try {
                        if (data.data && data.data.server && data.data.server.id) {
                            serverId = data.data.server.id;
                        } else if (data.data && data.data.redirect) {
                            const match = data.data.redirect.match(/\/servers\/(\d+)/);
                            if (match && match[1]) {
                                serverId = match[1];
                            }
                        }
                    } catch (err) {
                        console.error('Error processing server response:', err);
                    }
                    
                    if (serverId) {
                        if (typeof window.navigateToServer === 'function') {
                            if (modal) {
                                modal.classList.add('hidden');
                                if (loadingIndicator) {
                                    loadingIndicator.remove();
                                }
                            }
                            window.navigateToServer(serverId);
                        } else {
                            window.location.href = '/servers/' + serverId;
                        }
                    } else {
                        window.location.href = '/app';
                    }
                } else {
                    if (loadingIndicator) {
                        loadingIndicator.remove();
                    }
                    
                    let errorMsg = 'Unknown error';
                    if (data.error && data.error.message) {
                        errorMsg = data.error.message;
                    } else if (data.message) {
                        errorMsg = data.message;
                    }
                    alert('Failed to create server: ' + errorMsg);
                }
            })
            .catch(error => {
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
                window.logger.error('server', 'Error creating server:', error);
                alert('An error occurred while creating the server');
            });
        });
    }
}

if (typeof window !== 'undefined') {
    window.navigateToServer = function(serverId) {
        fetch('/api/servers/' + serverId)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data) {
                    const serverList = document.querySelector('.server-list');
                    if (serverList) {
                        const newServerItem = createServerListItem(data.data.server);
                        serverList.appendChild(newServerItem);
                        
                        setTimeout(() => {
                            const serverItems = document.querySelectorAll('.server-item');
                            serverItems.forEach(item => item.classList.remove('active'));
                            newServerItem.classList.add('active');
                            
                            const serverContent = document.querySelector('.server-content');
                            if (serverContent) {
                                loadServerContent(serverId, serverContent);
                            }
                        }, 100);
                    } else {
                        window.location.href = '/servers/' + serverId;
                    }
                } else {
                    window.location.href = '/servers/' + serverId;
                }
            })
            .catch(error => {
                window.logger.error('server', 'Error navigating to server:', error);
                window.location.href = '/servers/' + serverId;
            });
    };
    
    function createServerListItem(server) {
        const serverItem = document.createElement('div');
        serverItem.className = 'server-item flex items-center justify-center w-12 h-12 rounded-full bg-discord-dark hover:bg-discord-blue mb-2 cursor-pointer relative group transition-all duration-200';
        serverItem.setAttribute('data-server-id', server.id);
        serverItem.setAttribute('data-tooltip', server.name);
        
        if (server.image_url) {
            serverItem.innerHTML = `<img src="${server.image_url}" alt="${server.name}" class="w-full h-full object-cover rounded-full">`;
        } else {
            const initials = server.name.substring(0, 2).toUpperCase();
            serverItem.innerHTML = `<span class="text-white font-medium">${initials}</span>`;
        }
        
        serverItem.onclick = function() {
            window.navigateToServer(server.id);
        };
        
        return serverItem;
    }
    
    function loadServerContent(serverId, container) {
        container.innerHTML = '<div class="flex items-center justify-center h-full"><div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-discord-blue"></div></div>';
        
        fetch('/servers/' + serverId)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const serverContent = doc.querySelector('.server-content');
                
                if (serverContent) {
                    container.innerHTML = serverContent.innerHTML;
                    
                    const scripts = Array.from(doc.querySelectorAll('script')).filter(script => !script.src);
                    scripts.forEach(script => {
                        if (script.textContent) {
                            try {
                                eval(script.textContent);
                            } catch (err) {
                                console.error('Error executing script:', err);
                            }
                        }
                    });
                    
                    history.pushState({serverId: serverId}, 'Server - ' + serverId, '/servers/' + serverId);
                } else {
                    window.location.href = '/servers/' + serverId;
                }
            })
            .catch(error => {
                window.logger.error('server', 'Error loading server content:', error);
                window.location.href = '/servers/' + serverId;
            });
    }
} 