function essentialsManager(){
    return {
        activeTab: 'general',
        config: { fields: [], kits: [] },
        files: [],
        activeFile: null,
        fileContent: '',
        saving: false,
        viewMode: 'raw',

        async init(){
            await this.loadConfig();
            await this.loadFiles();
        },

        async loadConfig(){
            try{
                const res = await fetch('/api/mmorpg/essentials/config');
                if(!res.ok) throw new Error('No se pudo cargar configuración');
                const data = await res.json();
                const cfg = data.config || {};
                // assign fields and kits
                this.config.fields = cfg.tabs && cfg.tabs.find(t=>t.id==='config') ? cfg.tabs.find(t=>t.id==='config').fields : [];
                this.config.kits = cfg.tabs && cfg.tabs.find(t=>t.id==='kits') ? cfg.tabs.find(t=>t.id==='kits').kits : [];
                // prepare formFields for visual mode
                this.buildFormFromFields();
            }catch(e){
                console.error(e);
            }
        },

        async saveConfig(){
            try{
                const payload = { tab: 'config', fields: this.config.fields };
                const res = await fetch('/api/mmorpg/essentials/config', {
                    method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
                });
                if(!res.ok) throw new Error('Error al guardar');
                alert('Configuración guardada');
            }catch(e){ console.error(e); alert('Error al guardar configuración'); }
        },

        async loadFiles(){
            try{
                const res = await fetch('/api/mmorpg/essentials/files');
                if(!res.ok) throw new Error('No se pudo listar archivos');
                const data = await res.json();
                this.files = data.files || [];
                if(this.files.length) this.openFile(this.files[0].path);
            }catch(e){ console.error(e); }
        },

        async openFile(path){
            try{
                this.activeFile = path;
                const res = await fetch(`/api/mmorpg/essentials/file?path=${encodeURIComponent(path)}`);
                if(!res.ok) throw new Error('No se pudo abrir archivo');
                const data = await res.json();
                this.fileContent = data.content ?? '';
            }catch(e){ console.error(e); this.fileContent = ''; }
        },

        updateField(field, value){
            if(field.type === 'number') field.value = Number(value);
            else if(field.type === 'boolean') field.value = !!value;
            else field.value = value;
        },

        buildFormFromFields(){
            // ensure fields have help and proper types
            if(!Array.isArray(this.config.fields)) return;
            for(const f of this.config.fields){
                f.type = f.type || (typeof f.value === 'boolean' ? 'boolean' : (typeof f.value === 'number' ? 'number' : (typeof f.value === 'object' ? 'json' : 'string')));
                f.help = f.help || '';
            }
        },

        async saveFile(){
            if(!this.activeFile) return;
            this.saving = true;
            try{
                const res = await fetch(`/api/mmorpg/essentials/file?path=${encodeURIComponent(this.activeFile)}`, {
                    method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({content: this.fileContent})
                });
                if(!res.ok) throw new Error('Error al guardar archivo');
                alert('Archivo guardado');
            }catch(e){ console.error(e); alert('Error al guardar archivo'); }finally{ this.saving = false; }
        }
    }
}
