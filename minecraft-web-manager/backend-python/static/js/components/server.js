// Component para control del servidor
function serverControl() {
    return {
        status: { running: false, memory: {}, cpu: 0, uptime: 0, players: {} },
        loading: false,
        logs: [],
        logsActive: false,
        javaMemory: { min_ram: '1G', max_ram: '4G', running: false },
        updateCheck: null,
        updateVersion: '',
        updatePaper: true,
        updatePlugins: false,
        maintenanceLoading: false,
        maintenanceMessage: '',
        memoryMessage: '',
        
        init() {
            this.fetchStatus();
            if (document.querySelector('[data-maintenance-panel]')) {
                this.fetchJavaMemory();
            }
            
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
                
                window.socket.on('log-error', (data) => {
                    console.error('Error en logs:', data.error);
                    this.logs.push(`[ERROR] ${data.error}`);
                });
                
                window.socket.on('log-connected', (data) => {
                    console.log('Logs conectados:', data.message);
                    this.logs.push(`[INFO] ${data.message}`);
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

        async fetchJavaMemory() {
            try {
                const res = await fetch('/api/server/java-memory');
                const data = await res.json();
                if (res.ok) this.javaMemory = data;
            } catch (e) {
                console.error('Error fetching Java memory:', e);
            }
        },

        async saveJavaMemory() {
            this.memoryMessage = '';
            if (!/^[1-9][0-9]{0,3}[MG]$/.test(this.javaMemory.min_ram) ||
                !/^[1-9][0-9]{0,3}[MG]$/.test(this.javaMemory.max_ram)) {
                this.memoryMessage = 'Usa valores como 1G o 1024M.';
                return;
            }

            this.maintenanceLoading = true;
            try {
                const res = await fetch('/api/server/java-memory', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        min_ram: this.javaMemory.min_ram,
                        max_ram: this.javaMemory.max_ram
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'No se pudo guardar la memoria');
                this.javaMemory = { ...this.javaMemory, ...data };
                this.memoryMessage = 'Configuración de memoria guardada.';
            } catch (e) {
                this.memoryMessage = e.message;
            } finally {
                this.maintenanceLoading = false;
            }
        },

        async checkUpdates() {
            this.maintenanceLoading = true;
            this.maintenanceMessage = '';
            try {
                const res = await fetch('/api/server/maintenance/check');
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'No se pudieron consultar las versiones');
                this.updateCheck = data;
                this.updateVersion = data.current.version;
                this.maintenanceMessage = data.paper_update_available
                    ? `Hay un build nuevo de Paper: ${data.latest.build}.`
                    : 'Paper está actualizado para la serie instalada.';
            } catch (e) {
                this.maintenanceMessage = e.message;
            } finally {
                this.maintenanceLoading = false;
            }
        },

        async startMaintenanceUpdate() {
            if (!this.updatePaper && !this.updatePlugins) return;
            const selected = [
                this.updatePaper ? `Paper ${this.updateVersion || ''}` : '',
                this.updatePlugins ? 'plugins soportados instalados' : ''
            ].filter(Boolean).join(' y ');
            if (!confirm(`Se creará un backup y se actualizará ${selected}. El servidor puede detenerse. ¿Continuar?`)) return;

            this.maintenanceLoading = true;
            this.maintenanceMessage = 'Preparando actualización...';
            try {
                const payload = { paper: this.updatePaper, plugins: this.updatePlugins };
                if (this.updatePaper && this.updateVersion) payload.version = this.updateVersion;
                const res = await fetch('/api/server/maintenance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'No se pudo iniciar la actualización');
                this.pollMaintenanceJob(data.id);
            } catch (e) {
                this.maintenanceLoading = false;
                this.maintenanceMessage = e.message;
            }
        },

        async pollMaintenanceJob(jobId) {
            try {
                const res = await fetch(`/api/server/maintenance/${encodeURIComponent(jobId)}`);
                const job = await res.json();
                if (!res.ok) throw new Error(job.detail || 'No se pudo consultar la tarea');
                if (job.status === 'queued' || job.status === 'running') {
                    this.maintenanceMessage = job.status === 'running' ? 'Actualización en curso...' : 'Actualización en cola...';
                    window.setTimeout(() => this.pollMaintenanceJob(jobId), 1500);
                    return;
                }

                this.maintenanceLoading = false;
                if (job.status === 'completed') {
                    const result = job.result;
                    this.maintenanceMessage = `Actualización completada. Backup: ${result.backup || 'no necesario'}.`;
                    await this.fetchStatus();
                    await this.fetchJavaMemory();
                    await this.checkUpdates();
                } else {
                    this.maintenanceMessage = job.error || 'La actualización terminó con errores.';
                }
            } catch (e) {
                this.maintenanceLoading = false;
                this.maintenanceMessage = e.message;
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
                window.socket.emit('stop_logs');
                this.logsActive = false;
            } else {
                window.socket.emit('start_logs');
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
