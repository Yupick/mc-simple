// Component para configuración
function configManager() {
    return {
        properties: {},
        whitelist: [],
        loading: false,
        
        async init() {
            await this.fetchProperties();
            await this.fetchWhitelist();
        },
        
        async fetchProperties() {
            try {
                const res = await fetch('/api/config/server-properties');
                this.properties = await res.json();
            } catch (e) {
                console.error('Error fetching properties:', e);
            }
        },
        
        async fetchWhitelist() {
            try {
                const res = await fetch('/api/config/whitelist');
                this.whitelist = await res.json();
            } catch (e) {
                console.error('Error fetching whitelist:', e);
            }
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
                
                if (data.success) {
                    alert('Propiedades guardadas exitosamente');
                } else {
                    alert(data.message);
                }
            } catch (e) {
                alert('Error al guardar propiedades');
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
                
                if (data.success) {
                    alert('Jugador eliminado de la whitelist');
                } else {
                    alert(data.message);
                }
            } catch (e) {
                alert('Error al actualizar whitelist');
            }
        }
    }
}
