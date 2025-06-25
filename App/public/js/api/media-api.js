class MediaAPI {
    constructor() {
        this.baseUrl = '/api';
    }
    
    async uploadFile(formData) {
        try {
            const response = await fetch(`${this.baseUrl}/media/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Failed to upload file: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }
    
    async uploadMultipleFiles(formData) {
        try {
            const response = await fetch(`${this.baseUrl}/media/upload-multiple`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Failed to upload files: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error uploading multiple files:', error);
            throw error;
        }
    }
    
    async getGifs(query, limit = 20) {
        try {
            const response = await fetch(`${this.baseUrl}/media/gifs?q=${encodeURIComponent(query)}&limit=${limit}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch GIFs: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching GIFs:', error);
            throw error;
        }
    }
}

window.MediaAPI = new MediaAPI();
