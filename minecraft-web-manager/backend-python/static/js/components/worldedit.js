function worldeditManager(){
    return {
        activeTab: 'general',
        config: {
            maxSelectionBlocks: 100000,
            maxUndo: 100,
            saveHistory: true,
            autoSave: false,
            // Limits
            maxBlocksChanged: -1,
            maxRadius: -1,
            maxBrushRadius: 5,
            maxPolygonalPoints: -1,
            // Logging
            logCommands: false,
            logFile: 'worldedit.log',
            // Wand / tools
            wandItem: 'minecraft:wooden_axe',
            navigationWandItem: 'minecraft:compass',
            navigationWandMaxDistance: 100,
            // Misc
            debug: false,
            serverSideCui: true,
            commandBlockSupport: false,
            historySize: 15,
            historyExpiration: 10,
            calculationTimeout: 100,
            allowSymbolicLinks: false,
            snapshotsDir: '',
            savingDir: ''
        },
        help: {},
        pluginPrefix: 'worldedit',
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
                const res = await fetch('/api/mmorpg/worldedit/config');
                if(!res.ok) throw new Error('No se pudo cargar configuración');
                const data = await res.json();
                // merge help map if provided by server
                if(data.config && data.config.help){ this.help = Object.assign({}, this.help, data.config.help); }
                const cfg = data.config || data;
                this.config = {
                    maxSelectionBlocks: cfg['maxSelectionBlocks'] ?? cfg['max-selection-blocks'] ?? this.config.maxSelectionBlocks,
                    maxUndo: cfg['maxUndo'] ?? cfg['max-undo'] ?? this.config.maxUndo,
                    saveHistory: cfg['saveHistory'] ?? cfg['save-history'] ?? this.config.saveHistory,
                    autoSave: cfg['autoSave'] ?? cfg['auto-save'] ?? this.config.autoSave,
                    maxBlocksChanged: cfg['maxBlocksChanged'] ?? (cfg['limits'] && cfg['limits']['max-blocks-changed'] ? cfg['limits']['max-blocks-changed']['default'] : this.config.maxBlocksChanged),
                    maxRadius: cfg['maxRadius'] ?? (cfg['limits'] && cfg['limits']['max-radius'] ? cfg['limits']['max-radius'] : this.config.maxRadius),
                    maxBrushRadius: cfg['maxBrushRadius'] ?? (cfg['limits'] && cfg['limits']['max-brush-radius'] ? cfg['limits']['max-brush-radius'] : this.config.maxBrushRadius),
                    maxPolygonalPoints: cfg['maxPolygonalPoints'] ?? (cfg['limits'] && cfg['limits']['max-polygonal-points'] ? (typeof cfg['limits']['max-polygonal-points'] === 'object' ? cfg['limits']['max-polygonal-points']['default'] : cfg['limits']['max-polygonal-points']) : this.config.maxPolygonalPoints),
                    logCommands: cfg['logCommands'] ?? (cfg['logging'] && cfg['logging']['log-commands'] ? cfg['logging']['log-commands'] : this.config.logCommands),
                    logFile: cfg['logFile'] ?? (cfg['logging'] && cfg['logging']['file'] ? cfg['logging']['file'] : this.config.logFile),
                    wandItem: cfg['wandItem'] ?? cfg['wand-item'] ?? this.config.wandItem,
                    navigationWandItem: cfg['navigationWandItem'] ?? (cfg['navigation-wand'] && cfg['navigation-wand']['item'] ? cfg['navigation-wand']['item'] : this.config.navigationWandItem),
                    navigationWandMaxDistance: cfg['navigationWandMaxDistance'] ?? (cfg['navigation-wand'] && cfg['navigation-wand']['max-distance'] ? cfg['navigation-wand']['max-distance'] : this.config.navigationWandMaxDistance),
                    debug: cfg['debug'] ?? this.config.debug,
                    serverSideCui: cfg['serverSideCui'] ?? (cfg['server-side-cui'] !== undefined ? cfg['server-side-cui'] : this.config.serverSideCui),
                    commandBlockSupport: cfg['commandBlockSupport'] ?? (cfg['command-block-support'] !== undefined ? cfg['command-block-support'] : this.config.commandBlockSupport),
                    historySize: cfg['historySize'] ?? (cfg['history'] && cfg['history']['size'] ? cfg['history']['size'] : this.config.historySize),
                    historyExpiration: cfg['historyExpiration'] ?? (cfg['history'] && cfg['history']['expiration'] ? cfg['history']['expiration'] : this.config.historyExpiration),
                    calculationTimeout: cfg['calculationTimeout'] ?? (cfg['calculation'] && cfg['calculation']['timeout'] ? cfg['calculation']['timeout'] : this.config.calculationTimeout),
                    allowSymbolicLinks: cfg['allowSymbolicLinks'] ?? (cfg['files'] && cfg['files']['allow-symbolic-links'] ? cfg['files']['allow-symbolic-links'] : this.config.allowSymbolicLinks),
                    snapshotsDir: cfg['snapshotsDir'] ?? (cfg['snapshots'] && cfg['snapshots']['directory'] ? cfg['snapshots']['directory'] : this.config.snapshotsDir),
                    savingDir: cfg['savingDir'] ?? (cfg['saving'] && cfg['saving']['dir'] ? cfg['saving']['dir'] : this.config.savingDir)
                };
            }catch(e){
                console.error(e);
            }
        },

        getHelp(key){
            // try plugin-prefixed key first
            const pref = `${this.pluginPrefix}.${key}`;
            if(this.help[pref]) return this.help[pref];
            if(this.help[key]) return this.help[key];
            // try without dots (fallback)
            const alt = `${this.pluginPrefix}.${key.replace(/\./g,'/')}`;
            if(this.help[alt]) return this.help[alt];
            return '';
        },

        async saveConfig(){
            try{
                const payload = Object.assign({}, this.config);
                const res = await fetch('/api/mmorpg/worldedit/config', {
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
                const res = await fetch('/api/mmorpg/worldedit/files');
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
                const res = await fetch(`/api/mmorpg/worldedit/file?path=${encodeURIComponent(path)}`);
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
                    const add = (k, v) => {
                        let type = 'string';
                        if(typeof v === 'boolean') type = 'boolean';
                        else if(typeof v === 'number') type = 'number';
                        else if(typeof v === 'object') type = 'json';
                        fields.push({key: k, value: v, type});
                    };

                    // Top-level simple keys
                    for(const key of ['max-selection-blocks','max-undo','save-history','auto-save','wand-item','debug','server-side-cui','command-block-support']){
                        if(key in obj) add(key, obj[key]);
                    }

                    // Limits
                    if(obj.limits){
                        if('max-blocks-changed' in obj.limits) add('limits.max-blocks-changed', obj.limits['max-blocks-changed']);
                        if('max-radius' in obj.limits) add('limits.max-radius', obj.limits['max-radius']);
                        if('max-brush-radius' in obj.limits) add('limits.max-brush-radius', obj.limits['max-brush-radius']);
                        if('max-polygonal-points' in obj.limits) add('limits.max-polygonal-points', obj.limits['max-polygonal-points']);
                    }

                    // Logging
                    if(obj.logging) add('logging', obj.logging);

                    // Navigation wand
                    if(obj['navigation-wand']) add('navigation-wand', obj['navigation-wand']);

                    // History / calculation / files / snapshots / saving
                    if(obj.history) add('history', obj.history);
                    if(obj.calculation) add('calculation', obj.calculation);
                    if(obj.files) add('files', obj.files);
                    if(obj.snapshots) add('snapshots', obj.snapshots);
                    if(obj.saving) add('saving', obj.saving);
                }
                this.formFields = fields;
            }catch(e){
                this.formFields = [];
            }
        },

        updateField(field, value){
            // coerce types
            if(field.type === 'number') field.value = Number(value);
            else if(field.type === 'boolean') field.value = !!value;
            else field.value = value;

            // update fileContent YAML
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
                const res = await fetch(`/api/mmorpg/worldedit/file?path=${encodeURIComponent(this.activeFile)}`, {
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
