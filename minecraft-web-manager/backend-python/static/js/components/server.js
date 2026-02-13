// Component para control del servidor
function serverControl() {
    return {
        status: { running: false, memory: {}, cpu: 0, uptime: 0, players: {} },
        loading: false,
        logs: [],
        logsActive: false,
        
        init() {
            this.fetchStatus();
            
            // Escuchar actualizaciones de WebSocket
            if (window.socket) {
                window.socket.on('server-status-update', (data) => {
                    this.status = data;
                });
                
                window.socket.on('log', (data) => {
                    this.logs.push(data.line);
                    // Mantener solo las últimas 200 líneas
                    if (this.logs.length > 200) {
                        this.logs = this.logs.slice(-200);
                    }
                    // Auto-scroll
                    this.$nextTick(() => {
                        const container = document.querySelector('.logs-container');
                        if (container) {
                            container.scrollTop = container.scrollHeight;
                        }
                    });
                });
            }
        },
        
        async fetchStatus() {
            try {
                const res = await fetch('/api/server/status');
                this.status = await res.json();
            } catch (e) {
                console.error('Error fetching status:', e);
            }
        },
        
        async startServer() {
            this.loading = true;
            try {
                const res = await fetch('/api/server/start', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    alert('Servidor iniciado exitosamente');
                    await this.fetchStatus();
                } else {
                    alert(data.message);
                }
            } catch (e) {
                alert('Error al iniciar servidor');
            } finally {
                this.loading = false;
            }
        },
        
        async stopServer() {
            if (!confirm('¿Está seguro de detener el servidor?')) return;
            
            this.loading = true;
            try {
                const res = await fetch('/api/server/stop', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    alert('Servidor detenido exitosamente');
                    await this.fetchStatus();
                } else {
                    alert(data.message);
                }
            } catch (e) {
                alert('Error al detener servidor');
            } finally {
                this.loading = false;
            }
        },
        
        async restartServer() {
            if (!confirm('¿Está seguro de reiniciar el servidor?')) return;
            
            this.loading = true;
            try {
                const res = await fetch('/api/server/restart', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    alert('Servidor reiniciado exitosamente');
                    await this.fetchStatus();
                } else {
                    alert(data.message);
                }
            } catch (e) {
                alert('Error al reiniciar servidor');
            } finally {
                this.loading = false;
            }
        },
        
        toggleLogs() {
            if (this.logsActive) {
                window.socket.emit('stop-logs');
                this.logsActive = false;
            } else {
                window.socket.emit('start-logs');
                this.logsActive = true;
            }
        },
        
        clearLogs() {
            this.logs = [];
        },
        
        formatMemory(bytes) {
            if (!bytes) return '0 MB';
            const mb = bytes / (1024 * 1024);
            return `${mb.toFixed(0)} MB`;
        },
        
        formatUptime(seconds) {
            if (!seconds) return '0m';
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            }
            return `${minutes}m`;
        }
    }
}
