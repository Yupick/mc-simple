// Component para gestión de plugins
function pluginsManager() {
    return {
        plugins: [],
        loading: false,
        
        async init() {
            await this.fetchPlugins();
        },
        
        async fetchPlugins() {
            try {
                const res = await fetch('/api/plugins/');
                this.plugins = await res.json();
            } catch (e) {
                console.error('Error fetching plugins:', e);
            }
        },
        
        async togglePlugin(pluginName) {
            this.loading = true;
            try {
                const res = await fetch(`/api/plugins/${pluginName}/toggle`, { 
                    method: 'PUT' 
                });
                const data = await res.json();
                
                if (data.success) {
                    alert(data.message);
                    await this.fetchPlugins();
                } else {
                    alert(data.message);
                }
            } catch (e) {
                alert('Error al cambiar estado del plugin');
            } finally {
                this.loading = false;
            }
        },
        
        async deletePlugin(pluginName) {
            if (!confirm('¿Está seguro de eliminar este plugin?')) return;
            
            this.loading = true;
            try {
                const res = await fetch(`/api/plugins/${pluginName}`, { 
                    method: 'DELETE' 
                });
                const data = await res.json();
                
                if (data.success) {
                    alert('Plugin eliminado exitosamente');
                    await this.fetchPlugins();
                } else {
                    alert(data.message);
                }
            } catch (e) {
                alert('Error al eliminar plugin');
            } finally {
                this.loading = false;
            }
        }
    }
}
