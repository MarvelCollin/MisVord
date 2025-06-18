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

            fetch('/api/servers/create', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '/servers/' + data.server.id;
                } else {
                    alert('Failed to create server: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error creating server:', error);
                alert('An error occurred while creating the server');
            });
        });
    }
} 