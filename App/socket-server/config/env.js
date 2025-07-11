const getPhpAppUrl = () => {
    return process.env.PHP_APP_URL || 'http://app:1001';
};

const buildApiUrl = (endpoint) => {
    const baseUrl = getPhpAppUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
};

module.exports = {
    getPhpAppUrl,
    buildApiUrl
};
