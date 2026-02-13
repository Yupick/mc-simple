// WebSocket Connection
let socket = null;

// Conectar al WebSocket
function initWebSocket() {
    if (socket) return socket;
    
    socket = io({
        transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
        console.log('WebSocket conectado');
    });
    
    socket.on('disconnect', () => {
        console.log('WebSocket desconectado');
    });
    
    socket.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
    
    window.socket = socket;
    return socket;
}

// Inicializar al cargar la página
if (typeof io !== 'undefined') {
    initWebSocket();
}
