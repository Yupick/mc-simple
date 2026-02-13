/**
 * Componente Alpine.js para gestión de usuarios
 */
function usersManager() {
    return {
        // Estado general
        currentTab: 'players',
        loading: false,
        
        // Stats
        stats: {
            operators: 0,
            whitelist: 0,
            bans: 0
        },
        
        // Jugadores
        onlinePlayers: [],
        maxPlayers: 20,
        playerHistory: [],
        searchQuery: '',
        
        // Operadores
        operators: [],
        
        // Whitelist
        whitelist: [],
        whitelistEnabled: false,
        enforceWhitelist: false,
        
        // Baneos
        bannedPlayers: [],
        bannedIPs: [],
        banStats: {
            total_players: 0,
            total_ips: 0,
            recent_players: 0,
            recent_ips: 0
        },
        
        // Inicialización
        async init() {
            console.log('🎮 Inicializando gestor de usuarios...');
            await this.loadAll();
            
            // Actualizar jugadores online cada 10 segundos
            setInterval(() => {
                if (this.currentTab === 'players') {
                    this.loadOnlinePlayers();
                }
            }, 10000);
        },
        
        async loadAll() {
            this.loading = true;
            try {
                await Promise.all([
                    this.loadPlayers(),
                    this.loadOperators(),
                    this.loadWhitelist(),
                    this.loadBans()
                ]);
            } catch (error) {
                console.error('Error cargando datos:', error);
            } finally {
                this.loading = false;
            }
        },
        
        // ========== JUGADORES ==========
        
        async loadPlayers() {
            try {
                await this.loadOnlinePlayers();
                await this.loadPlayerHistory();
            } catch (error) {
                console.error('Error cargando jugadores:', error);
                this.showNotification('Error cargando jugadores', 'error');
            }
        },
        
        async loadOnlinePlayers() {
            try {
                const response = await fetch('/api/players/online');
                const data = await response.json();
                this.onlinePlayers = data.players || [];
                this.maxPlayers = data.max || 20;
            } catch (error) {
                console.error('Error cargando jugadores online:', error);
                this.onlinePlayers = [];
            }
        },
        
        async loadPlayerHistory() {
            try {
                const response = await fetch('/api/players/history');
                const data = await response.json();
                this.playerHistory = data.players || [];
            } catch (error) {
                console.error('Error cargando historial:', error);
                this.playerHistory = [];
            }
        },
        
        async searchPlayers() {
            if (!this.searchQuery.trim()) {
                await this.loadPlayerHistory();
                return;
            }
            
            try {
                const response = await fetch(`/api/players/search?q=${encodeURIComponent(this.searchQuery)}`);
                const data = await response.json();
                this.playerHistory = data.players || [];
            } catch (error) {
                console.error('Error buscando jugadores:', error);
            }
        },
        
        async kickPlayer(username) {
            if (!confirm(`¿Expulsar a ${username} del servidor?`)) return;
            
            const reason = prompt('Razón del kick (opcional):') || 'Expulsado del servidor';
            
            try {
                const response = await fetch('/api/players/kick', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, reason })
                });
                
                if (response.ok) {
                    this.showNotification(`${username} ha sido expulsado`, 'success');
                    await this.loadOnlinePlayers();
                } else {
                    throw new Error('Error al expulsar jugador');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error al expulsar jugador', 'error');
            }
        },
        
        // ========== OPERADORES ==========
        
        async loadOperators() {
            try {
                const response = await fetch('/api/operators');
                const data = await response.json();
                this.operators = data.operators || [];
                this.stats.operators = this.operators.length;
            } catch (error) {
                console.error('Error cargando operadores:', error);
                this.operators = [];
            }
        },
        
        async openAddOpModal(player = null) {
            let username, uuid;
            
            if (player) {
                username = player.name;
                uuid = player.uuid;
            } else {
                username = prompt('Nombre del jugador:');
                if (!username) return;
                
                // Buscar UUID
                try {
                    const response = await fetch('/api/players/uuid-lookup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username })
                    });
                    
                    if (!response.ok) {
                        this.showNotification('Jugador no encontrado', 'error');
                        return;
                    }
                    
                    const data = await response.json();
                    uuid = data.uuid;
                } catch (error) {
                    this.showNotification('Error buscando jugador', 'error');
                    return;
                }
            }
            
            const levelStr = prompt(`Nivel de OP para ${username}:\n1 = Bypass spawn protection\n2 = Comandos de cheats\n3 = Gestión de jugadores\n4 = Control total`, '2');
            if (!levelStr) return;
            
            const level = parseInt(levelStr);
            if (level < 1 || level > 4) {
                this.showNotification('Nivel inválido (debe ser 1-4)', 'error');
                return;
            }
            
            const bypassLimit = confirm('¿Permitir bypass del límite de jugadores?');
            
            try {
                const response = await fetch('/api/operators', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username,
                        uuid,
                        level,
                        bypass_limit: bypassLimit
                    })
                });
                
                if (response.ok) {
                    this.showNotification(`${username} agregado como OP nivel ${level}`, 'success');
                    await this.loadOperators();
                } else {
                    throw new Error('Error agregando operador');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error agregando operador', 'error');
            }
        },
        
        async removeOperator(uuid) {
            if (!confirm('¿Remover este operador?')) return;
            
            try {
                const response = await fetch(`/api/operators/${uuid}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    this.showNotification('Operador removido', 'success');
                    await this.loadOperators();
                } else {
                    throw new Error('Error removiendo operador');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error removiendo operador', 'error');
            }
        },
        
        async changeOpLevel(uuid, newLevel) {
            try {
                const response = await fetch(`/api/operators/${uuid}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ new_level: parseInt(newLevel) })
                });
                
                if (response.ok) {
                    this.showNotification(`Nivel actualizado a ${newLevel}`, 'success');
                    await this.loadOperators();
                } else {
                    throw new Error('Error cambiando nivel');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error cambiando nivel de OP', 'error');
            }
        },
        
        // ========== WHITELIST ==========
        
        async loadWhitelist() {
            try {
                const [listRes, statusRes] = await Promise.all([
                    fetch('/api/whitelist'),
                    fetch('/api/whitelist/status')
                ]);
                
                const listData = await listRes.json();
                const statusData = await statusRes.json();
                
                this.whitelist = listData.whitelist || [];
                this.whitelistEnabled = statusData.enabled || false;
                this.enforceWhitelist = statusData['enforce-whitelist'] || false;
                this.stats.whitelist = this.whitelist.length;
            } catch (error) {
                console.error('Error cargando whitelist:', error);
                this.whitelist = [];
            }
        },
        
        async toggleWhitelist(enabled) {
            try {
                const response = await fetch('/api/whitelist/status', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled })
                });
                
                if (response.ok) {
                    this.whitelistEnabled = enabled;
                    this.showNotification(`Whitelist ${enabled ? 'activada' : 'desactivada'}`, 'success');
                } else {
                    throw new Error('Error cambiando estado');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error cambiando estado de whitelist', 'error');
            }
        },
        
        async setEnforceWhitelist(enforce) {
            try {
                const response = await fetch('/api/whitelist/enforce', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enforce })
                });
                
                if (response.ok) {
                    this.enforceWhitelist = enforce;
                    this.showNotification('Configuración actualizada', 'success');
                } else {
                    throw new Error('Error actualizando configuración');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error actualizando configuración', 'error');
            }
        },
        
        async openAddWhitelistModal() {
            const username = prompt('Nombre del jugador a agregar:');
            if (!username) return;
            
            try {
                const response = await fetch('/api/players/uuid-lookup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                });
                
                if (!response.ok) {
                    this.showNotification('Jugador no encontrado', 'error');
                    return;
                }
                
                const data = await response.json();
                await this.addToWhitelist(data.name, data.uuid);
            } catch (error) {
                this.showNotification('Error buscando jugador', 'error');
            }
        },
        
        async addToWhitelistFromHistory(player) {
            await this.addToWhitelist(player.name, player.uuid);
        },
        
        async addToWhitelist(username, uuid) {
            try {
                const response = await fetch('/api/whitelist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, uuid })
                });
                
                if (response.ok) {
                    this.showNotification(`${username} agregado a la whitelist`, 'success');
                    await this.loadWhitelist();
                } else {
                    throw new Error('Error agregando a whitelist');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error agregando a whitelist', 'error');
            }
        },
        
        async removeFromWhitelist(uuid) {
            if (!confirm('¿Remover de la whitelist?')) return;
            
            try {
                const response = await fetch(`/api/whitelist/${uuid}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    this.showNotification('Jugador removido de la whitelist', 'success');
                    await this.loadWhitelist();
                } else {
                    throw new Error('Error removiendo de whitelist');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error removiendo de whitelist', 'error');
            }
        },
        
        async clearWhitelist() {
            if (!confirm('⚠️ ¿Estás seguro? Esto eliminará TODOS los jugadores de la whitelist.')) return;
            
            try {
                const response = await fetch('/api/whitelist', {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    this.showNotification('Whitelist limpiada', 'success');
                    await this.loadWhitelist();
                } else {
                    throw new Error('Error limpiando whitelist');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error limpiando whitelist', 'error');
            }
        },
        
        // ========== BANEOS ==========
        
        async loadBans() {
            try {
                const [playersRes, ipsRes, statsRes] = await Promise.all([
                    fetch('/api/bans/players'),
                    fetch('/api/bans/ips'),
                    fetch('/api/bans/stats')
                ]);
                
                const playersData = await playersRes.json();
                const ipsData = await ipsRes.json();
                const statsData = await statsRes.json();
                
                this.bannedPlayers = playersData.bans || [];
                this.bannedIPs = ipsData.bans || [];
                this.banStats = statsData;
                this.stats.bans = this.bannedPlayers.length + this.bannedIPs.length;
            } catch (error) {
                console.error('Error cargando baneos:', error);
            }
        },
        
        async openBanModal(player = null) {
            let username, uuid;
            
            if (player) {
                username = player.name;
                uuid = player.uuid;
            } else {
                username = prompt('Nombre del jugador a banear:');
                if (!username) return;
                
                try {
                    const response = await fetch('/api/players/uuid-lookup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username })
                    });
                    
                    if (!response.ok) {
                        this.showNotification('Jugador no encontrado', 'error');
                        return;
                    }
                    
                    const data = await response.json();
                    uuid = data.uuid;
                } catch (error) {
                    this.showNotification('Error buscando jugador', 'error');
                    return;
                }
            }
            
            const reason = prompt('Razón del ban:', 'Violación de las reglas del servidor') || 'Violación de las reglas';
            
            try {
                const response = await fetch('/api/bans/player', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username,
                        uuid,
                        reason,
                        moderator: 'Admin',
                        expires: null // Permanente
                    })
                });
                
                if (response.ok) {
                    this.showNotification(`${username} ha sido baneado`, 'success');
                    await this.loadBans();
                } else {
                    throw new Error('Error baneando jugador');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error baneando jugador', 'error');
            }
        },
        
        async openBanIPModal() {
            const ip = prompt('Dirección IP a banear:');
            if (!ip) return;
            
            const reason = prompt('Razón del ban:', 'Violación de las reglas del servidor') || 'Violación de las reglas';
            
            try {
                const response = await fetch('/api/bans/ip', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ip,
                        reason,
                        moderator: 'Admin',
                        expires: null
                    })
                });
                
                if (response.ok) {
                    this.showNotification(`IP ${ip} ha sido baneada`, 'success');
                    await this.loadBans();
                } else {
                    throw new Error('Error baneando IP');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error baneando IP', 'error');
            }
        },
        
        async pardonPlayer(uuid) {
            if (!confirm('¿Perdonar y desbanear este jugador?')) return;
            
            try {
                const response = await fetch(`/api/bans/player/${uuid}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    this.showNotification('Jugador desbaneado', 'success');
                    await this.loadBans();
                } else {
                    throw new Error('Error desbaneando jugador');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error desbaneando jugador', 'error');
            }
        },
        
        async pardonIP(ip) {
            if (!confirm(`¿Desbanear la IP ${ip}?`)) return;
            
            try {
                const response = await fetch(`/api/bans/ip/${encodeURIComponent(ip)}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    this.showNotification('IP desbaneada', 'success');
                    await this.loadBans();
                } else {
                    throw new Error('Error desbaneando IP');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Error desbaneando IP', 'error');
            }
        },
        
        // ========== UTILIDADES ==========
        
        formatDate(dateStr) {
            try {
                const date = new Date(dateStr.split('+')[0].trim());
                return date.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch {
                return dateStr;
            }
        },
        
        showNotification(message, type = 'info') {
            // Crear notificación toast
            const toast = document.createElement('div');
            toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white transition-all z-50 ${
                type === 'success' ? 'bg-green-600' :
                type === 'error' ? 'bg-red-600' :
                type === 'warning' ? 'bg-yellow-600' :
                'bg-blue-600'
            }`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    };
}
