const corsOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || ['*'];

console.log('🔗 [SOCKET-CONFIG] CORS configuration:', {
    raw: process.env.CORS_ALLOWED_ORIGINS,
    parsed: corsOrigins,
    isVPS: process.env.IS_VPS,
    isDocker: process.env.IS_DOCKER
});

const options = {
    cors: {
        origin: corsOrigins,
        methods: ["GET", "POST"],
        credentials: true
    },
    path: process.env.SOCKET_BASE_PATH || '/socket.io',
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e8,
    allowEIO3: true
};

module.exports = {
    options
};
