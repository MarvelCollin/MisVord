const AjaxHandler = {

    get: function(url, options = {}) {
        return this.request(url, 'GET', null, options);
    },

    post: function(url, data, options = {}) {
        return this.request(url, 'POST', data, options);
    },

    put: function(url, data, options = {}) {
        return this.request(url, 'PUT', data, options);
    },

    delete: function(url, options = {}) {
        return this.request(url, 'DELETE', null, options);
    },

    request: function(url, method, data, options = {}) {
        const requestOptions = {
            method: method,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                ...options.headers
            },
            credentials: 'same-origin'
        };

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
                
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    return response.json();
                } else {
                    return response.text();
                }
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

    handleSuccessResponse: function(response, options = {}) {

        if (response.redirect && !options.preventRedirect) {
            window.location.href = response.redirect;
            return;
        }

        if (options.onSuccess) {
            options.onSuccess(response);
        }
    },    handleErrorResponse: function(error, options = {}) {
        window.logger.error('ajax', 'API Error:', error);

        if (options.onError) {
            options.onError(error);
            return;
        }

        const errorData = error.data || { message: 'An unexpected error occurred' };
        const errorMessage = errorData.message || 'An unexpected error occurred';

        if (error.status === 401) {

            window.location.href = '/login';
        } else if (options.showToast !== false) {

            this.showErrorToast(errorMessage, errorData.errors);
        }
    },

    showErrorToast: function(message, validationErrors = null) {
        console.error('Error:', message, validationErrors);

        if (typeof showToast === 'function') {
            showToast(message, 'error');
            return;
        }

        alert(`Error: ${message}`);
    },

    showSuccessToast: function(message) {

        if (typeof showToast === 'function') {
            showToast(message, 'success');
            return;
        }

        console.log(`Success: ${message}`);
    },

    serializeForm: function(form) {
        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        return data;
    },

    submitForm: function(form, options = {}) {
        const url = form.getAttribute('action') || window.location.href;
        const method = form.getAttribute('method')?.toUpperCase() || 'POST';
        const formData = new FormData(form);

        return this.request(url, method, formData, options);
    }
};

export const MisVordAjax = AjaxHandler; 