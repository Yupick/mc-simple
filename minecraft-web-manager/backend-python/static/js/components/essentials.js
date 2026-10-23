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
            await this.loadTranslations();
            await this.loadConfig();
            await this.loadFiles();
        },

        async loadTranslations(){
            try{
                // Cargar español por defecto si existe
                let res = await fetch('/static/i18n/es/essentials.json');
                if(res && res.ok){
                    const data = await res.json();
                    if(data.labels) this.translations = Object.assign({}, this.translations, data.labels);
                    this.helpMap = Object.assign({}, this.helpMap || {}, data.helps || {});
                }

                // Si el navegador está en inglés, intentar cargar y aplicar las traducciones en inglés (sobrescribe labels/helps)
                const lang = (navigator.language || navigator.userLanguage || '').toLowerCase();
                if(lang.startsWith('en')){
                    try{
                        const res2 = await fetch('/static/i18n/en/essentials.json');
                        if(res2 && res2.ok){
                            const data2 = await res2.json();
                            if(data2.labels) this.translations = Object.assign({}, this.translations, data2.labels);
                            this.helpMap = Object.assign({}, this.helpMap || {}, data2.helps || {});
                        }
                    }catch(e){ /* ignore */ }
                }
            }catch(e){
                console.error('No se pudo cargar i18n essentials', e);
            }
        },

        // Mapa de traducciones para claves comunes de Essentials (fallback si no existe)
        translations: {
            'teleport': 'Teletransporte',
            'spawn': 'Spawn',
            'kit': 'Kit',
            'economy': 'Economía',
            'worth': 'Valor',
            'currency-symbol': 'Símbolo de moneda'
        },

        translateKey(key){
            if(this.translations && this.translations[key]) return this.translations[key];
            // fallback: reemplazar guiones/underscores por espacios y capitalizar primera letra
            const s = String(key).replace(/[-_.]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
            return s.charAt(0).toUpperCase() + s.slice(1);
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
                // help: preferir help existente, sino buscar en helpMap (i18n), sino vacío
                f.help = f.help || (this.helpMap && (this.helpMap[f.key] || this.helpMap[f.key.replace(/\./g,'/')])) || '';
                // etiqueta traducida para mostrar en la UI: preferir i18n, sino fallback
                f.displayLabel = f.displayLabel || (this.translations && (this.translations[f.key] || this.translations[f.key.replace(/\./g,'/')])) || this.translateKey(f.key);
            }
        },

        getHelp(field){
            // Si se pasa todo el campo, usar su help; o si se pasa una clave, buscar help en fields
            if(!field) return '';
            if(typeof field === 'string'){
                const f = (this.config.fields || []).find(x=>x.key===field);
                return f ? f.help || '' : '';
            }
            return field.help || '';
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
