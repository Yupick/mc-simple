function worldguardManager(){
    return {
        activeTab: 'general',
        config: {
            defaultFlags: {},
            protectionRadius: 0,
            bypassPermission: 'worldguard.bypass',
            logging: true
        },
        flags: [],
        files: [],
        activeFile: null,
        fileContent: '',
        formFields: [],
        viewMode: 'raw',
        saving: false,

        async init(){
            await this.loadConfig();
            await this.loadFiles();
        },

        async loadConfig(){
            try{
                const res = await fetch('/api/mmorpg/worldguard/config');
                if(!res.ok) throw new Error('No se pudo cargar configuración');
                const data = await res.json();
                if(data.config && data.config.help){ this.help = Object.assign({}, this.help || {}, data.config.help); }
                const cfg = data.config || data;
                this.config = {
                    defaultFlags: cfg['defaultFlags'] ?? cfg['default-flags'] ?? this.config.defaultFlags,
                    protectionRadius: cfg['protectionRadius'] ?? cfg['protection-radius'] ?? this.config.protectionRadius,
                    bypassPermission: cfg['bypassPermission'] ?? cfg['bypass-permission'] ?? this.config.bypassPermission,
                    logging: cfg['logging'] ?? this.config.logging
                };
                // populate flags array from defaultFlags object
                this.flags = Object.entries(this.config.defaultFlags || {}).map(([k,v]) => ({key:k, value: String(v)}));
            }catch(e){
                console.error(e);
            }
        },

        help: {},
        pluginPrefix: 'worldguard',

        getHelp(key){
            const pref = `${this.pluginPrefix}.${key}`;
            if(this.help[pref]) return this.help[pref];
            if(this.help[key]) return this.help[key];
            return '';
        },

        addFlag(){
            this.flags.push({key:'new-flag', value:'allow'});
        },

        removeFlag(idx){
            this.flags.splice(idx,1);
        },

        async saveConfig(){
            try{
                const flagsObj = {};
                for(const f of this.flags){
                    // infer boolean if value is 'true'/'false'
                    if(f.value === 'true' || f.value === 'false') flagsObj[f.key] = (f.value === 'true');
                    else flagsObj[f.key] = f.value;
                }
                const payload = {
                    defaultFlags: flagsObj,
                    protectionRadius: this.config.protectionRadius,
                    bypassPermission: this.config.bypassPermission,
                    logging: this.config.logging
                };
                const res = await fetch('/api/mmorpg/worldguard/config', {
                    method: 'PUT',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify(payload)
                });
                if(!res.ok) throw new Error('Error al guardar');
                alert('Configuración guardada');
            }catch(e){
                console.error(e);
                alert('Error al guardar configuración');
            }
        },

        async loadFiles(){
            try{
                const res = await fetch('/api/mmorpg/worldguard/files');
                if(!res.ok) throw new Error('No se pudo listar archivos');
                const data = await res.json();
                this.files = data.files || [];
                if(this.files.length) this.openFile(this.files[0].path);
            }catch(e){
                console.error(e);
            }
        },

        async openFile(path){
            try{
                this.activeFile = path;
                const res = await fetch(`/api/mmorpg/worldguard/file?path=${encodeURIComponent(path)}`);
                if(!res.ok) throw new Error('No se pudo abrir archivo');
                const data = await res.json();
                this.fileContent = data.content ?? '';
                this.buildFormFromContent();
            }catch(e){
                console.error(e);
                this.fileContent = '';
                this.formFields = [];
            }
        },

        buildFormFromContent(){
            try{
                const obj = jsyaml.load(this.fileContent);
                const fields = [];
                if(obj && typeof obj === 'object'){
                    for(const key of ['default-flags','protection-radius','bypass-permission','logging']){
                        if(key in obj){
                            const value = obj[key];
                            let type = 'string';
                            if(typeof value === 'boolean') type = 'boolean';
                            else if(typeof value === 'number') type = 'number';
                            else if(typeof value === 'object') type = 'json';
                            fields.push({key, value, type});
                        }
                    }
                }
                this.formFields = fields;
            }catch(e){
                this.formFields = [];
            }
        },

        updateField(field, value){
            if(field.type === 'number') field.value = Number(value);
            else if(field.type === 'boolean') field.value = !!value;
            else field.value = value;

            try{
                let obj = jsyaml.load(this.fileContent) || {};
                obj[field.key] = field.value;
                this.fileContent = jsyaml.dump(obj, {indent:2});
            }catch(e){
                console.error(e);
            }
        },

        async saveFile(){
            if(!this.activeFile) return;
            this.saving = true;
            try{
                const res = await fetch(`/api/mmorpg/worldguard/file?path=${encodeURIComponent(this.activeFile)}`, {
                    method: 'PUT',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({content: this.fileContent})
                });
                if(!res.ok) throw new Error('Error al guardar archivo');
                alert('Archivo guardado');
            }catch(e){
                console.error(e);
                alert('Error al guardar archivo');
            }finally{
                this.saving = false;
            }
        }
    }
}
