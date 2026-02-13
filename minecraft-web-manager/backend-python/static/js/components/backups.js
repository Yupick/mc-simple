// Component para gestión de backups
function backupsManager() {
    return {
        backups: [],
        loading: false,
        
        async init() {
            await this.fetchBackups();
        },
        
        async fetchBackups() {
            try {
                const res = await fetch('/api/backups/');
                this.backups = await res.json();
            } catch (e) {
                console.error('Error fetching backups:', e);
            }
        },
        
        async createBackup(type) {
            if (!confirm(`¿Crear backup de tipo "${type}"?`)) return;
            
            this.loading = true;
            try {
                const res = await fetch('/api/backups/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, description: '' })
                });
                const data = await res.json();
                
                if (data.success) {
                    alert('Backup creado exitosamente');
                    await this.fetchBackups();
                } else {
                    alert(data.message);
                }
            } catch (e) {
                alert('Error al crear backup');
            } finally {
                this.loading = false;
            }
        },
        
        async deleteBackup(filename) {
            if (!confirm('¿Está seguro de eliminar este backup?')) return;
            
            this.loading = true;
            try {
                const res = await fetch(`/api/backups/${filename}`, { 
                    method: 'DELETE' 
                });
                const data = await res.json();
                
                if (data.success) {
                    alert('Backup eliminado exitosamente');
                    await this.fetchBackups();
                } else {
                    alert(data.message);
                }
            } catch (e) {
                alert('Error al eliminar backup');
            } finally {
                this.loading = false;
            }
        }
    }
}
