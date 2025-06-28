export function ajax(options = {}) {
    if (!options || typeof options !== 'object') {
        throw new Error('ajax: options must be an object');
    }

    let {
        url = '',
        method = options.type || 'GET',
        data = null,
        headers = {},
        dataType = 'json',
        beforeSend,
        success,
        error
    } = options;

    method = method.toUpperCase();

    
    if ((method === 'GET' || method === 'HEAD') && data && typeof data === 'object') {
        const queryString = new URLSearchParams(data).toString();
        url += (url.includes('?') ? '&' : '?') + queryString;
        data = null; 
    }

    const fetchHeaders = { ...headers };

    
    if (data && !fetchHeaders['Content-Type'] && method !== 'GET' && method !== 'HEAD') {
        fetchHeaders['Content-Type'] = 'application/json';
    }

    let body = null;
    if (data && method !== 'GET' && method !== 'HEAD') {
        if (fetchHeaders['Content-Type'] === 'application/json' && typeof data === 'string') {
            body = data; 
        } else if (fetchHeaders['Content-Type'] === 'application/json') {
            body = JSON.stringify(data);
        } else {
            body = data; 
        }
    }

    
    if (typeof beforeSend === 'function') {
        try { beforeSend(); } catch (_) {}
    }

    return fetch(url, { method, headers: fetchHeaders, body })
        .then(async (response) => {
            
            const responseClone = response.clone();
            
            let parsed;
            try {
                if (dataType === 'text') {
                    parsed = await response.text();
                } else if (dataType === 'blob') {
                    parsed = await response.blob();
                } else {
                    
                    try {
                        parsed = await response.json();
                    } catch (jsonError) {
                        
                        parsed = await responseClone.text();
                    }
                }
            } catch (error) {
                
                try {
                    parsed = await responseClone.text();
                } catch (finalError) {
                    throw new Error('Failed to parse response: ' + finalError.message);
                }
            }

            if (!response.ok) {
                const err = new Error(`HTTP ${response.status}`);
                if (typeof error === 'function') error(err, response);
                throw err;
            }

            if (typeof success === 'function') success(parsed, response);
            return parsed;
        })
        .catch((err) => {
            if (typeof error === 'function') error(err);
            throw err;
        });
}


if (typeof window !== 'undefined' && !window.ajax) {
    window.ajax = ajax;
} 