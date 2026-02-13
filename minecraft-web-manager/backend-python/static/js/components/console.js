/**
 * Componente Alpine.js para consola interactiva del servidor
 */
function consoleComponent() {
    return {
        // Estado
        available: false,
        loading: false,
        currentCommand: '',
        consoleLines: [],
        commandHistory: [],
        historyIndex: -1,
        predefinedCommands: {},
        
        /**
         * Inicialización
         */
        async init() {
            await this.checkStatus();
            await this.loadPredefinedCommands();
            
            // Agregar mensaje de bienvenida
            this.addSystemLine('='.repeat(60));
            this.addSystemLine('Sistema de Consola RCON v1.0');
            this.addSystemLine('='.repeat(60));
            
            // Enfocr input
            this.$nextTick(() => {
                this.$refs.commandInput?.focus();
            });
        },
        
        /**
         * Verificar si la consola está disponible
         */
        async checkStatus() {
            try {
                const response = await fetch('/api/console/status');
                const data = await response.json();
                this.available = data.available;
                
                if (!this.available) {
                    this.addErrorLine('⚠️ ' + data.message);
                }
            } catch (error) {
                console.error('Error verificando estado:', error);
                this.available = false;
            }
        },
        
        /**
         * Cargar comandos predefinidos
         */
        async loadPredefinedCommands() {
            try {
                const response = await fetch('/api/console/commands');
                const data = await response.json();
                this.predefinedCommands = data.categories;
            } catch (error) {
                console.error('Error cargando comandos:', error);
            }
        },
        
        /**
         * Ejecutar comando actual
         */
        async executeCommand() {
            const command = this.currentCommand.trim();
            if (!command || !this.available || this.loading) return;
            
            // Mostrar comando en consola
            this.addCommandLine('$ ' + command);
            
            // Agregar a historial
            this.commandHistory.push(command);
            this.historyIndex = this.commandHistory.length;
            
            // Limpiar input
            this.currentCommand = '';
            
            // Ejecutar
            await this.executeRconCommand(command);
        },
        
        /**
         * Ejecutar comando preset
         */
        async executePreset(command) {
            if (!this.available || this.loading) return;
            
            // Mostrar en consola
            this.addCommandLine('$ ' + command);
            
            // Ejecutar
            await this.executeRconCommand(command);
        },
        
        /**
         * Ejecutar comando via API
         */
        async executeRconCommand(command) {
            this.loading = true;
            
            try {
                const response = await fetch('/api/console/execute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ command })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Mostrar respuesta
                    if (data.output && data.output.trim()) {
                        this.addResponseLine(data.output);
                    } else {
                        this.addResponseLine('✓ Comando ejecutado correctamente');
                    }
                } else {
                    // Mostrar error
                    const errorMsg = data.error || 'Error desconocido';
                    this.addErrorLine('✗ Error: ' + errorMsg);
                }
                
            } catch (error) {
                console.error('Error ejecutando comando:', error);
                this.addErrorLine('✗ Error de red: ' + error.message);
            } finally {
                this.loading = false;
                
                // Auto-scroll al final
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
            }
        },
        
        /**
         * Agregar línea de comando a la consola
         */
        addCommandLine(text) {
            this.consoleLines.push({
                type: 'command',
                text: text,
                timestamp: new Date()
            });
        },
        
        /**
         * Agregar línea de respuesta a la consola
         */
        addResponseLine(text) {
            // Si la respuesta tiene múltiples líneas, agregarlas por separado
            const lines = text.split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    this.consoleLines.push({
                        type: 'response',
                        text: line,
                        timestamp: new Date()
                    });
                }
            });
        },
        
        /**
         * Agregar línea de error a la consola
         */
        addErrorLine(text) {
            this.consoleLines.push({
                type: 'error',
                text: text,
                timestamp: new Date()
            });
        },
        
        /**
         * Agregar línea de sistema a la consola
         */
        addSystemLine(text) {
            this.consoleLines.push({
                type: 'system',
                text: text,
                timestamp: new Date()
            });
        },
        
        /**
         * Limpiar consola
         */
        clearConsole() {
            this.consoleLines = [];
            this.addSystemLine('~ Consola limpiada');
        },
        
        /**
         * Navegar historial hacia arriba
         */
        historyUp() {
            if (this.commandHistory.length === 0) return;
            
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.currentCommand = this.commandHistory[this.historyIndex];
            }
        },
        
        /**
         * Navegar historial hacia abajo
         */
        historyDown() {
            if (this.commandHistory.length === 0) return;
            
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
                this.currentCommand = this.commandHistory[this.historyIndex];
            } else {
                this.historyIndex = this.commandHistory.length;
                this.currentCommand = '';
            }
        },
        
        /**
         * Scroll al final de la consola
         */
        scrollToBottom() {
            const output = this.$refs.consoleOutput;
            if (output) {
                output.scrollTop = output.scrollHeight;
            }
        }
    };
}
