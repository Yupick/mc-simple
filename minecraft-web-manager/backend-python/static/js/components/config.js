// Definición de propiedades del servidor con tipos y ayudas
const SERVER_PROPERTIES_CONFIG = {
    // Configuración Básica
    'motd': {
        type: 'text',
        label: 'MOTD (Mensaje del día)',
        help: 'Mensaje que aparece en el listado de servidores',
        category: 'Básico'
    },
    'level-name': {
        type: 'text',
        label: 'Nombre del mundo',
        help: 'Nombre del directorio del mundo (generalmente "world")',
        category: 'Básico'
    },
    'server-port': {
        type: 'number',
        label: 'Puerto del servidor',
        help: 'Puerto TCP donde el servidor escuchará conexiones (por defecto 25565)',
        category: 'Básico',
        min: 1,
        max: 65535
    },
    'max-players': {
        type: 'number',
        label: 'Jugadores máximos',
        help: 'Número máximo de jugadores que pueden conectarse simultáneamente',
        category: 'Básico',
        min: 1,
        max: 2147483647
    },
    'online-mode': {
        type: 'boolean',
        label: 'Modo online',
        help: 'Si está activado, verifica las cuentas de Minecraft con los servidores de Mojang. Desactivar permite cuentas no premium (no recomendado)',
        category: 'Básico'
    },
    
    // Gameplay
    'gamemode': {
        type: 'select',
        label: 'Modo de juego',
        help: 'Modo de juego predeterminado para nuevos jugadores',
        category: 'Gameplay',
        options: [
            { value: 'survival', label: 'Survival (Supervivencia)' },
            { value: 'creative', label: 'Creative (Creativo)' },
            { value: 'adventure', label: 'Adventure (Aventura)' },
            { value: 'spectator', label: 'Spectator (Espectador)' }
        ]
    },
    'difficulty': {
        type: 'select',
        label: 'Dificultad',
        help: 'Nivel de dificultad del mundo',
        category: 'Gameplay',
        options: [
            { value: 'peaceful', label: 'Peaceful (Pacífico)' },
            { value: 'easy', label: 'Easy (Fácil)' },
            { value: 'normal', label: 'Normal' },
            { value: 'hard', label: 'Hard (Difícil)' }
        ]
    },
    'hardcore': {
        type: 'boolean',
        label: 'Modo hardcore',
        help: 'Si está activado, la dificultad se establece en Hard y los jugadores se banean al morir',
        category: 'Gameplay'
    },
    'pvp': {
        type: 'boolean',
        label: 'PvP',
        help: 'Permite que los jugadores se dañen entre sí',
        category: 'Gameplay'
    },
    'force-gamemode': {
        type: 'boolean',
        label: 'Forzar modo de juego',
        help: 'Obliga a los jugadores a usar el modo de juego predeterminado al conectarse',
        category: 'Gameplay'
    },
    
    // Mundo
    'level-seed': {
        type: 'text',
        label: 'Semilla del mundo',
        help: 'Semilla para generar el mundo (dejar vacío para aleatorio)',
        category: 'Mundo'
    },
    'level-type': {
        type: 'select',
        label: 'Tipo de mundo',
        help: 'Tipo de generación del mundo',
        category: 'Mundo',
        options: [
            { value: 'minecraft:normal', label: 'Normal' },
            { value: 'minecraft:flat', label: 'Flat (Plano)' },
            { value: 'minecraft:large_biomes', label: 'Large Biomes (Biomas grandes)' },
            { value: 'minecraft:amplified', label: 'Amplified (Amplificado)' }
        ]
    },
    'generate-structures': {
        type: 'boolean',
        label: 'Generar estructuras',
        help: 'Genera estructuras como pueblos, templos, fortalezas, etc.',
        category: 'Mundo'
    },
    'spawn-animals': {
        type: 'boolean',
        label: 'Generar animales',
        help: 'Permite que aparezcan animales pasivos',
        category: 'Mundo'
    },
    'spawn-monsters': {
        type: 'boolean',
        label: 'Generar monstruos',
        help: 'Permite que aparezcan monstruos hostiles',
        category: 'Mundo'
    },
    'spawn-npcs': {
        type: 'boolean',
        label: 'Generar NPCs',
        help: 'Permite que aparezcan aldeanos',
        category: 'Mundo'
    },
    
    // Protección y Seguridad
    'spawn-protection': {
        type: 'number',
        label: 'Protección de spawn',
        help: 'Radio en bloques alrededor del spawn donde solo los OPs pueden modificar (0 para desactivar)',
        category: 'Protección',
        min: 0,
        max: 29999984
    },
    'allow-flight': {
        type: 'boolean',
        label: 'Permitir volar',
        help: 'Permite a los jugadores volar en modo survival (útil para mods)',
        category: 'Protección'
    },
    'enable-command-block': {
        type: 'boolean',
        label: 'Habilitar bloques de comandos',
        help: 'Permite el uso de bloques de comandos',
        category: 'Protección'
    },
    'enforce-whitelist': {
        type: 'boolean',
        label: 'Forzar whitelist',
        help: 'Expulsa a jugadores que no estén en la whitelist cuando se activa',
        category: 'Protección'
    },
    'white-list': {
        type: 'boolean',
        label: 'Whitelist activa',
        help: 'Solo permite la conexión de jugadores en la whitelist',
        category: 'Protección'
    },
    
    // Red y Rendimiento
    'view-distance': {
        type: 'number',
        label: 'Distancia de visión',
        help: 'Cantidad de chunks que se envían al cliente (2-32). Valores altos requieren más CPU y ancho de banda',
        category: 'Rendimiento',
        min: 2,
        max: 32
    },
    'simulation-distance': {
        type: 'number',
        label: 'Distancia de simulación',
        help: 'Distancia máxima donde se procesan entidades y redstone',
        category: 'Rendimiento',
        min: 3,
        max: 32
    },
    'max-tick-time': {
        type: 'number',
        label: 'Tiempo máximo de tick',
        help: 'Tiempo máximo en milisegundos antes de que el watchdog detenga el servidor',
        category: 'Rendimiento',
        min: -1,
        max: 9223372036854775807
    },
    'network-compression-threshold': {
        type: 'number',
        label: 'Umbral de compresión',
        help: 'Tamaño mínimo de paquete para comprimir. -1 para desactivar',
        category: 'Rendimiento',
        min: -1,
        max: 2147483647
    },
    
    // Dimensiones
    'allow-nether': {
        type: 'boolean',
        label: 'Permitir Nether',
        help: 'Permite que los jugadores viajen al Nether',
        category: 'Dimensiones'
    },
    
    // RCON
    'enable-rcon': {
        type: 'boolean',
        label: 'Habilitar RCON',
        help: 'Habilita la administración remota mediante RCON',
        category: 'RCON'
    },
    'rcon.port': {
        type: 'number',
        label: 'Puerto RCON',
        help: 'Puerto para conexiones RCON',
        category: 'RCON',
        min: 1,
        max: 65535
    },
    'rcon.password': {
        type: 'password',
        label: 'Contraseña RCON',
        help: 'Contraseña para autenticación RCON',
        category: 'RCON'
    },
    
    // Query
    'enable-query': {
        type: 'boolean',
        label: 'Habilitar Query',
        help: 'Permite el protocolo de consulta del servidor',
        category: 'Query'
    },
    'query.port': {
        type: 'number',
        label: 'Puerto Query',
        help: 'Puerto para el protocolo de consulta',
        category: 'Query',
        min: 1,
        max: 65535
    },
    
    // Avanzado
    'op-permission-level': {
        type: 'select',
        label: 'Nivel de permisos OP',
        help: 'Nivel de permisos predeterminado para operadores',
        category: 'Avanzado',
        options: [
            { value: '1', label: '1 - Ignorar spawn protection' },
            { value: '2', label: '2 - /clear, /difficulty, /give, /tp' },
            { value: '3', label: '3 - /ban, /kick, /op' },
            { value: '4', label: '4 - /stop (todos los comandos)' }
        ]
    },
    'function-permission-level': {
        type: 'select',
        label: 'Nivel de permisos de funciones',
        help: 'Nivel de permisos para ejecutar funciones',
        category: 'Avanzado',
        options: [
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' }
        ]
    },
    'enable-status': {
        type: 'boolean',
        label: 'Habilitar estado',
        help: 'Permite que el servidor aparezca en el listado de servidores',
        category: 'Avanzado'
    },
    'hide-online-players': {
        type: 'boolean',
        label: 'Ocultar jugadores online',
        help: 'Oculta la lista de jugadores conectados',
        category: 'Avanzado'
    },
    'sync-chunk-writes': {
        type: 'boolean',
        label: 'Escritura síncrona de chunks',
        help: 'Habilita escritura síncrona de chunks (reduce rendimiento pero es más seguro)',
        category: 'Avanzado'
    }
};

// Component para configuración
function configManager() {
    return {
        properties: {},
        whitelist: [],
        loading: false,
        activeTab: 'Básico',
        categories: ['Básico', 'Gameplay', 'Mundo', 'Protección', 'Rendimiento', 'Dimensiones', 'RCON', 'Query', 'Avanzado', 'Resource Pack'],
        // Resource pack state
        rp: {
            enabled: false,
            hosted: false,
            url: '',
            sha1: '',
            size: 0,
            modified: 0,
            pluginDetected: false,
            prompt: ''
        },
        rpFile: null,
        
        async init() {
            await this.fetchProperties();
            await this.fetchWhitelist();
            // Cargar info de resource pack al iniciar
            await this.refreshRpInfo();
        },
        
        async fetchProperties() {
            try {
                const res = await fetch('/api/config/server-properties');
                const data = await res.json();
                this.properties = data.properties || data;
            } catch (e) {
                console.error('Error fetching properties:', e);
            }
        },
        
        async fetchWhitelist() {
            try {
                const res = await fetch('/api/config/whitelist');
                const data = await res.json();
                this.whitelist = data.whitelist || data;
            } catch (e) {
                console.error('Error fetching whitelist:', e);
            }
        },

        // Resource Pack methods
        async refreshRpInfo() {
            try {
                const res = await fetch('/api/resourcepacks/host/info');
                if (!res.ok) throw new Error('No info');
                const data = await res.json();
                this.rp.hosted = data.hosted || false;
                this.rp.pluginDetected = data.pluginDetected || false;
                if (data.hosted) {
                    this.rp.url = data.relative_path;
                    this.rp.sha1 = data.sha1 || '';
                    this.rp.size = data.size || 0;
                    this.rp.modified = data.modified || 0;
                }
            } catch (e) {
                console.error('Error fetching RP info', e);
            }
        },

        async toggleHosting() {
            try {
                // Si activando y plugin detectado, pedir que el backend hospede el output
                const payload = { enabled: this.rp.enabled };
                const res = await fetch('/api/resourcepacks/host', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (res.ok) {
                    await this.refreshRpInfo();
                    alert('Estado de hosting actualizado');
                } else {
                    alert(data.detail || 'Error al cambiar hosting');
                }
            } catch (e) {
                console.error(e);
                alert('Error al cambiar hosting');
            }
        },

        handleRpFile(ev) {
            const file = ev.target.files[0];
            if (!file) return;
            if (!file.name.endsWith('.zip')) { alert('Solo .zip'); return; }
            if (file.size > 100 * 1024 * 1024) { alert('Archivo demasiado grande'); return; }
            this.rpFile = file;
        },

        async uploadRp() {
            if (!this.rpFile) { alert('Selecciona un archivo'); return; }
            try {
                const form = new FormData();
                form.append('file', this.rpFile);
                const res = await fetch('/api/resourcepacks/host/upload', {
                    method: 'POST',
                    body: form
                });
                const data = await res.json();
                if (res.ok) {
                    alert('Archivo subido y alojado');
                    await this.refreshRpInfo();
                } else {
                    alert(data.detail || 'Error al subir');
                }
            } catch (e) {
                console.error(e);
                alert('Error al subir archivo');
            }
        },

        async applyRpToServer() {
            try {
                if (!this.rp.hosted) { alert('No hay pack alojado'); return; }
                // Construir URL completa basándose en origen actual
                const base = window.location.origin;
                const fullUrl = base + this.rp.url;
                const payload = { enabled: true, resourceUrl: fullUrl, prompt: this.rp.prompt || '', resourceId: '' };
                const res = await fetch('/api/resourcepacks/host', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (res.ok) {
                    alert('server.properties actualizado');
                } else {
                    alert(data.detail || 'Error al actualizar server.properties');
                }
            } catch (e) {
                console.error(e);
                alert('Error al aplicar en server.properties');
            }
        },

        async rollbackServerProperties() {
            try {
                const res = await fetch('/api/resourcepacks/host/rollback', { method: 'POST' });
                const data = await res.json();
                if (res.ok) {
                    alert('server.properties restaurado');
                } else {
                    alert(data.detail || 'No se pudo restaurar');
                }
            } catch (e) {
                console.error(e);
                alert('Error al restaurar backup');
            }
        },
        
        getPropertiesByCategory(category) {
            return Object.entries(SERVER_PROPERTIES_CONFIG)
                .filter(([_, config]) => config.category === category)
                .map(([key, config]) => ({ key, ...config }));
        },
        
        getPropertyValue(key) {
            return this.properties[key] || '';
        },
        
        setPropertyValue(key, value) {
            this.properties[key] = value;
        },
        
        async saveProperties() {
            this.loading = true;
            try {
                const res = await fetch('/api/config/server-properties', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ properties: this.properties })
                });
                const data = await res.json();
                
                if (res.ok) {
                    alert('Propiedades guardadas exitosamente');
                } else {
                    alert(data.message || 'Error al guardar propiedades');
                }
            } catch (e) {
                alert('Error al guardar propiedades: ' + e.message);
            } finally {
                this.loading = false;
            }
        },
        
        async removeFromWhitelist(index) {
            this.whitelist.splice(index, 1);
            
            try {
                const res = await fetch('/api/config/whitelist', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ whitelist: this.whitelist })
                });
                const data = await res.json();
                
                if (res.ok) {
                    alert('Jugador eliminado de la whitelist');
                } else {
                    alert(data.message || 'Error al actualizar whitelist');
                }
            } catch (e) {
                alert('Error al actualizar whitelist: ' + e.message);
            }
        }
    }
}
