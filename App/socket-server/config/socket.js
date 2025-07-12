const options = {
    cors: {
        origin: process.env.CORS_ALLOWED_ORIGINS?.split(','),
        methods: ["GET", "POST"],
        credentials: true
    },
    path: process.env.SOCKET_BASE_PATH,
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e8
};

module.exports = {
    options
};
