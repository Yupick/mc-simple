function luckpermsManager(){
    return {
        activeTab: 'general',
        config: {
            storageMethod: 'sqlite',
            syncInterval: 60,
            verbose: false
        },
        storage: {host:'', port:3306, user:'', password:'', database:''},
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
                const res = await fetch('/api/mmorpg/luckperms/config');
                if(!res.ok) throw new Error('No se pudo cargar configuración');
                const data = await res.json();
                // merge help map if provided
                if(data.config && data.config.help){ this.help = Object.assign({}, this.help || {}, data.config.help); }
                const cfg = data.config || data;
                this.config = {
                    storageMethod: cfg['storageMethod'] ?? cfg['storage-method'] ?? this.config.storageMethod,
                    syncInterval: cfg['syncInterval'] ?? cfg['sync-interval'] ?? this.config.syncInterval,
                    verbose: cfg['verbose'] ?? this.config.verbose
                };
                // Intentar poblar storage opcional a partir de cfg.storage
                if(cfg.storage){
                    this.storage = Object.assign(this.storage, cfg.storage);
                }
            }catch(e){
                console.error(e);
            }
        },

        help: {},
        pluginPrefix: 'luckperms',

        getHelp(key){
            const pref = `${this.pluginPrefix}.${key}`;
            if(this.help[pref]) return this.help[pref];
            if(this.help[key]) return this.help[key];
            return '';
        },

        async saveConfig(){
            try{
                const payload = {
                    storageMethod: this.config.storageMethod,
                    syncInterval: this.config.syncInterval,
                    verbose: this.config.verbose,
                    storage: this.storage
                };
                const res = await fetch('/api/mmorpg/luckperms/config', {
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
                const res = await fetch('/api/mmorpg/luckperms/files');
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
                const res = await fetch(`/api/mmorpg/luckperms/file?path=${encodeURIComponent(path)}`);
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
                    // Mapear algunas claves comunes de LuckPerms
                    for(const key of ['storage-method','sync-interval','verbose','storage']){
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
                const res = await fetch(`/api/mmorpg/luckperms/file?path=${encodeURIComponent(this.activeFile)}`, {
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
