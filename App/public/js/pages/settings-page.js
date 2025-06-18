document.addEventListener('DOMContentLoaded', function() {
    initDeleteChannelModal();
});

function initDeleteChannelModal() {
    const deleteBtn = document.getElementById('delete-channel-btn');
    const deleteModal = document.getElementById('delete-channel-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-channel');
    const confirmDeleteBtn = document.getElementById('confirm-delete-channel');

    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            deleteModal.classList.remove('hidden');
        });
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            deleteModal.classList.add('hidden');
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            const channelId = document.querySelector('meta[name="channel-id"]')?.content;
            const serverId = document.querySelector('meta[name="server-id"]')?.content;

            if (channelId) {
                fetch(`/api/channels/${channelId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = `/server/${serverId}`;
                    } else {
                        alert('Failed to delete channel: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while trying to delete the channel.');
                });
            }
        });
    }
} 