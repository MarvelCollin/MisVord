/**
 * AJAX Handler for MiscVord
 * Provides utility functions for making AJAX requests and handling responses
 */

export const MiscVordAjax = {
    /**
     * Make a GET request
     * @param {string} url - URL to fetch
     * @param {Object} options - Additional options
     * @returns {Promise} - Promise resolving to JSON response
     */
    get: function(url, options = {}) {
        return this.request(url, 'GET', null, options);
    },

    /**
     * Make a POST request
     * @param {string} url - URL to post to
     * @param {Object|FormData} data - Data to send
     * @param {Object} options - Additional options
     * @returns {Promise} - Promise resolving to JSON response
     */
    post: function(url, data, options = {}) {
        return this.request(url, 'POST', data, options);
    },

    /**
     * Make a PUT request
     * @param {string} url - URL to put to
     * @param {Object|FormData} data - Data to send
     * @param {Object} options - Additional options
     * @returns {Promise} - Promise resolving to JSON response
     */
    put: function(url, data, options = {}) {
        return this.request(url, 'PUT', data, options);
    },

    /**
     * Make a DELETE request
     * @param {string} url - URL to delete from
     * @param {Object} options - Additional options
     * @returns {Promise} - Promise resolving to JSON response
     */
    delete: function(url, options = {}) {
        return this.request(url, 'DELETE', null, options);
    },

    /**
     * Make an AJAX request
     * @param {string} url - URL to request
     * @param {string} method - HTTP method
     * @param {Object|FormData} data - Data to send
     * @param {Object} options - Additional options
     * @returns {Promise} - Promise resolving to JSON response
     */
    request: function(url, method, data, options = {}) {
        const requestOptions = {
            method: method,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                ...options.headers
            },
            credentials: 'same-origin'
        };

        // Handle FormData separately (don't set Content-Type)
        if (data && !(data instanceof FormData)) {
            requestOptions.headers['Content-Type'] = 'application/json';
            requestOptions.body = JSON.stringify(data);
        } else if (data) {
            requestOptions.body = data;
        }

        return fetch(url, requestOptions)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw {
                            status: response.status,
                            data: errorData
                        };
                    }).catch(error => {
                        // If JSON parsing fails, throw a simpler error
                        if (error instanceof SyntaxError) {
                            throw {
                                status: response.status,
                                data: {
                                    success: false,
                                    message: `HTTP error ${response.status}: ${response.statusText}`
                                }
                            };
                        }
                        throw error;
                    });
                }
                return response.json();
            })
            .then(data => {
                this.handleSuccessResponse(data, options);
                return data;
            })
            .catch(error => {
                this.handleErrorResponse(error, options);
                throw error;
            });
    },

    /**
     * Handle successful API response
     * @param {Object} response - API response
     * @param {Object} options - Request options
     */
    handleSuccessResponse: function(response, options = {}) {
        // Handle redirect if specified in response
        if (response.redirect && !options.preventRedirect) {
            window.location.href = response.redirect;
            return;
        }

        // Call success callback if provided
        if (options.onSuccess) {
            options.onSuccess(response);
        }
    },

    /**
     * Handle error API response
     * @param {Object} error - Error object
     * @param {Object} options - Request options
     */
    handleErrorResponse: function(error, options = {}) {
        console.error('API Error:', error);
        
        // Call error callback if provided
        if (options.onError) {
            options.onError(error);
            return;
        }

        // Default error handling
        const errorData = error.data || { message: 'An unexpected error occurred' };
        const errorMessage = errorData.message || 'An unexpected error occurred';

        if (error.status === 401) {
            // Unauthorized - redirect to login
            window.location.href = '/login';
        } else if (options.showToast !== false) {
            // Show error toast by default unless explicitly disabled
            this.showErrorToast(errorMessage, errorData.errors);
        }
    },

    /**
     * Show error toast notification
     * @param {string} message - Error message
     * @param {Object} validationErrors - Validation errors object
     */
    showErrorToast: function(message, validationErrors = null) {
        console.error('Error:', message, validationErrors);
        
        // Use existing toast logic if available
        if (typeof showToast === 'function') {
            showToast(message, 'error');
            return;
        }
        
        // Simple fallback
        alert(`Error: ${message}`);
    },

    /**
     * Show success toast notification
     * @param {string} message - Success message
     */
    showSuccessToast: function(message) {
        // Use existing toast logic if available
        if (typeof showToast === 'function') {
            showToast(message, 'success');
            return;
        }
        
        // Simple fallback
        console.log(`Success: ${message}`);
    },

    /**
     * Serialize form data to JSON
     * @param {HTMLFormElement} form - Form element to serialize
     * @returns {Object} - JSON object with form data
     */
    serializeForm: function(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    },

    /**
     * Submit a form via AJAX
     * @param {HTMLFormElement} form - Form to submit
     * @param {Object} options - Additional options
     * @returns {Promise} - Promise resolving to JSON response
     */
    submitForm: function(form, options = {}) {
        const url = form.getAttribute('action') || window.location.href;
        const method = form.getAttribute('method')?.toUpperCase() || 'POST';
        const formData = new FormData(form);
        
        return this.request(url, method, formData, options);
    }
}; 