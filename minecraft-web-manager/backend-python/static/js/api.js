/**
 * Cliente API para comunicación con el backend FastAPI
 */

class ApiClient {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include', // Incluir cookies (JWT)
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                // Redirigir a login si no autenticado
                window.location.href = '/login';
                return;
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'Error en la petición');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Métodos HTTP
    get(endpoint, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${endpoint}?${query}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // === AUTH ===
    async login(username, password) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        return this.request('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
    }

    logout() {
        return this.post('/auth/logout');
    }

    getCurrentUser() {
        return this.get('/auth/me');
    }

    // === SERVER ===
    getServerStatus() {
        return this.get('/server/status');
    }

    getServerInfo() {
        return this.get('/server/info');
    }

    startServer() {
        return this.post('/server/start');
    }

    stopServer() {
        return this.post('/server/stop');
    }

    restartServer() {
        return this.post('/server/restart');
    }

    getServerLogs(lines = 100) {
        return this.get('/server/logs', { lines });
    }

    sendCommand(command) {
        return this.post('/server/command', { command });
    }

    // === WORLDS ===
    getWorlds() {
        return this.get('/worlds');
    }

    getActiveWorld() {
        return this.get('/worlds/active');
    }

    getWorld(id) {
        return this.get(`/worlds/${id}`);
    }

    createWorld(data) {
        return this.post('/worlds', data);
    }

    updateWorld(id, data) {
        return this.put(`/worlds/${id}`, data);
    }

    deleteWorld(id) {
        return this.delete(`/worlds/${id}`);
    }

    activateWorld(id) {
        return this.post(`/worlds/${id}/activate`);
    }

    getWorldProperties(id) {
        return this.get(`/worlds/${id}/properties`);
    }

    updateWorldProperties(id, properties) {
        return this.put(`/worlds/${id}/properties`, properties);
    }

    // === PLUGINS ===
    getPlugins() {
        return this.get('/plugins');
    }

    togglePlugin(name) {
        return this.put(`/plugins/${name}/toggle`);
    }

    deletePlugin(name) {
        return this.delete(`/plugins/${name}`);
    }

    getPluginConfig(name) {
        return this.get(`/plugins/${name}/config`);
    }

    // === BACKUPS ===
    getBackups() {
        return this.get('/backups');
    }

    createBackup(type, description = '') {
        return this.post('/backups', { type, description });
    }

    deleteBackup(id) {
        return this.delete(`/backups/${id}`);
    }

    // === CONFIG ===
    getServerProperties() {
        return this.get('/config/server-properties');
    }

    updateServerProperties(properties) {
        return this.put('/config/server-properties', properties);
    }

    getWhitelist() {
        return this.get('/config/whitelist');
    }

    updateWhitelist(whitelist) {
        return this.put('/config/whitelist', { whitelist });
    }

    getOps() {
        return this.get('/config/ops');
    }

    updateOps(ops) {
        return this.put('/config/ops', { ops });
    }

    // === SYSTEM ===
    getSystemInfo() {
        return this.get('/system/info');
    }

    healthCheck() {
        return this.get('/system/health');
    }
}

// Instancia global
window.api = new ApiClient();
