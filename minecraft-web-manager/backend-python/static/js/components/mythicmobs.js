function mythicMobsManager(){
    return {
        activeTab: 'general',
        config: {
            general: {Language: 'en-us', ThreadPoolSize: -1, UseVirtualThreads: false},
            mobs: {MobDrops: {DefaultDropMethod:'VANILLA', DoLootsplosionByDefault:false, DoHologramNameByDefault:false, DoItemVFXByDefault:false, DefaultItemVFX:{Material:'POTION', Model:1}}},
            spawning: {RandomSpawning:{DisableVanillaSpawns:false, GenerateSpawnPoints:false, SpawnRadiusPerPlayer:64, PlayerClusterDistance:24.0}},
            skills: {Targeters:{DefaultEntityFilters:{}}},
            stats: {},
        },
        itemsList: {},
        droptablesList: {},
        selectedItemId: null,
        selectedItem: null,
        selectedDropId: null,
        selectedDrop: null,
        // help texts for fields shown as tooltips next to inputs
        help: {
            'general.Language': 'Idioma usado por MythicMobs para mensajes internos (ej: en-us, es-es).',
            'general.ThreadPoolSize': 'Número de threads para tareas internas. -1 = auto/determine por el sistema.',
            'general.UseVirtualThreads': 'Si está activado, MythicMobs intentará usar Virtual Threads si la JVM los soporta.',
            'mobs.MobDrops.DefaultDropMethod': 'Método por defecto para soltar objetos cuando una entidad muere.',
            'mobs.MobDrops.DoLootsplosionByDefault': 'Habilita el efecto "lootsplosion" por defecto en mobs nuevos.',
            'mobs.MobDrops.DoHologramNameByDefault': 'Muestra un holograma con el nombre del drop por defecto.',
            'mobs.MobDrops.DefaultItemVFX.Material': 'Material base usado para el efecto visual del ítem por defecto.',
            'mobs.MobDrops.DefaultItemVFX.Model': 'ID de modelo (modelo de recurso) para el efecto visual del ítem.',
            'mobs.DefaultDeathChatMessage': 'Mensajes que se muestran en chat cuando una entidad muere. Una línea por mensaje.',
            'spawning.RandomSpawning.DisableVanillaSpawns': 'Si se desactiva, el spawn vanilla será ignorado y MythicMobs gestionará spawns aleatorios.',
            'spawning.RandomSpawning.GenerateSpawnPoints': 'Si está activo, MythicMobs generará puntos de spawn automáticamente.',
            'spawning.RandomSpawning.SpawnRadiusPerPlayer': 'Radio de búsqueda para spawn por cada jugador (bloques).',
            'spawning.RandomSpawning.PlayerClusterDistance': 'Distancia usada para agrupar jugadores y calcular spawns.',
            'skills.DefaultEntityFilters': 'Filtros por defecto aplicados a targeters. Activa/desactiva tipos de entidades aquí.',
            'stats.Enabled': 'Activa o desactiva esta estadística específica.',
            'stats.BaseValue': 'Valor base de la estadística; puede ser un número o expresión según MythicMobs.'
        },
        files: [],
        itemsFiles: [],
        items: [],
        activeFile: null,
        fileContent: '',
        saving: false,
        selectedMobKey: null,

        async init(){
            await this.loadFiles();
            await this.loadConfig();
        },

        getHelp(key){
            if(this.help[key]) return this.help[key];
            // support wildcard skills.*
            if(key.startsWith('skills.')) return this.help['skills.DefaultEntityFilters'] || '';
            if(key.startsWith('stats.')){
                if(key.endsWith('.Enabled')) return this.help['stats.Enabled'] || '';
                if(key.endsWith('.BaseValue')) return this.help['stats.BaseValue'] || '';
            }
            return '';
        },

        // --- mob/item modal state ---
        selectedMobPath: null,
        selectedMobContent: '',
        showMobModal: false,
        modalMode: 'visual',
        selectedMobObject: {},

        async loadFiles(){
            try{
                const res = await fetch('/api/mmorpg/mythicmobs/files');
                if(!res.ok) throw new Error('No se pudo listar archivos');
                const data = await res.json();
                this.files = data.files || [];
                // populate itemsFiles
                this.itemsFiles = this.files.filter(f => f.path.startsWith('items/') || f.path.startsWith('droptables/')).map(f=>f.path);
            }catch(e){ console.error(e); }
        },

        async loadConfig(section){
            try{
                const res = await fetch('/api/mmorpg/mythicmobs/config');
                if(!res.ok) throw new Error('No se pudo cargar configuración');
                const data = await res.json();
                const cfg = data.config || {};
                // merge
                this.config = Object.assign({}, this.config, cfg);
                // merge help map provided by server (overrides defaults)
                if(cfg.help && typeof cfg.help === 'object'){
                    this.help = Object.assign({}, this.help, cfg.help);
                }
                // items/droptables provided by server
                this.itemsList = cfg.items || {};
                this.droptablesList = cfg.droptables || {};
                // reset selection
                this.selectedItemId = null; this.selectedItem = null;
                this.selectedDropId = null; this.selectedDrop = null;
                // ensure defaults exist
                this.config.general = this.config.general || this.config.Configuration && this.config.Configuration.General || this.config.general || this.config.Configuration?.General || this.config.general;
                this.config.mobs = this.config.mobs || (this.config.Configuration && this.config.Configuration.MobDrops) ? {MobDrops:this.config.Configuration.MobDrops} : this.config.mobs;
                this.config.spawning = this.config.spawning || (this.config.Configuration && this.config.Configuration.RandomSpawning) ? {RandomSpawning:this.config.Configuration.RandomSpawning} : this.config.spawning;
                this.config.skills = this.config.skills || {Targeters:{DefaultEntityFilters:{}}};
                this.config.stats = this.config.stats || {};
            }catch(e){ console.error(e); }
        },

        async saveConfig(section){
            try{
                const payload = {};
                if(section === 'general') payload.general = this.config.general;
                else if(section === 'mobs') payload.mobs = this.config.mobs;
                else if(section === 'spawning') payload.spawning = this.config.spawning;
                else if(section === 'skills') payload.skills = this.config.skills;
                else if(section === 'stats') payload.stats = this.config.stats;
                else Object.assign(payload, this.config);

                // validation: ensure numeric fields are numbers
                if(payload.general && typeof payload.general.ThreadPoolSize !== 'number') payload.general.ThreadPoolSize = Number(payload.general.ThreadPoolSize) || -1;

                const res = await fetch('/api/mmorpg/mythicmobs/config', {
                    method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
                });
                if(!res.ok) throw new Error('Error al guardar');
                alert('Configuración guardada');
                await this.loadFiles();
                await this.loadConfig();
            }catch(e){ console.error(e); alert('Error al guardar configuración'); }
        },

        // Mob/item modal functions
        async openMobModal(path){
            this.showMobModal = false;
            this.modalMode = 'visual';
            this.selectedMobKey = null;
            // path can be string or object entry {path,name,obj,raw}
            if(typeof path === 'object' && path !== null){
                this.selectedMobPath = path.path;
                this.selectedMobKey = path.name;
                this.selectedMobContent = path.raw || '';
                try{ this.selectedMobObject = JSON.parse(JSON.stringify(path.obj || {})); }catch(e){ this.selectedMobObject = path.obj || {}; }
                if(this.selectedMobObject){
                    try{ this.selectedMobObject.dropsRaw = JSON.stringify(this.selectedMobObject.drops||[], null, 2) }catch(e){ this.selectedMobObject.dropsRaw = '[]' }
                }
                this.showMobModal = true;
                return;
            }
            this.selectedMobPath = path;
            if(path){
                await this.openFile(path);
                this.selectedMobContent = this.fileContent || '';
                try{
                    const obj = jsyaml.load(this.selectedMobContent) || {};
                    // try to extract a main object
                    let q = obj;
                    if(Object.keys(q).length === 1){ const k = Object.keys(q)[0]; if(typeof q[k] === 'object') q = q[k]; }
                    this.selectedMobObject = q;
                    // prepare some convenience bindings for the visual editor
                    if(this.selectedMobObject){
                        if(typeof this.selectedMobObject.health === 'undefined' && this.selectedMobObject.attributes && this.selectedMobObject.attributes.health){
                            this.selectedMobObject.health = this.selectedMobObject.attributes.health;
                        }
                        try{ this.selectedMobObject.dropsRaw = JSON.stringify(this.selectedMobObject.drops||[], null, 2) }catch(e){ this.selectedMobObject.dropsRaw = '[]' }
                    }
                }catch(e){ console.error('parse mob', e); this.selectedMobObject = {}; this.modalMode = 'raw'; }
            }else{
                this.selectedMobPath = `mobs/new_mob_${Date.now()}.yml`;
                this.selectedMobObject = {display:{name:'New Mob'}, health:20, drops:[]};
                try{ this.selectedMobObject.dropsRaw = JSON.stringify(this.selectedMobObject.drops||[], null, 2) }catch(e){ this.selectedMobObject.dropsRaw = '[]' }
                this.selectedMobContent = jsyaml.dump(this.selectedMobObject, {indent:2});
            }
            this.showMobModal = true;
        },

        // --- Items inline editor ---
        openItem(name){
            if(!this.itemsList[name]) return;
            this.selectedItemId = name;
            this.selectedItem = JSON.parse(JSON.stringify(this.itemsList[name].obj || {}));
            // prepare display and loreText
            this.selectedItem.display = this.selectedItem.display || {name: '', lore: []};
            this.selectedItem.display.loreText = Array.isArray(this.selectedItem.display.lore) ? this.selectedItem.display.lore.join('\n') : (this.selectedItem.display.lore || '');
            // prepare enchantments text
            if(Array.isArray(this.selectedItem.Enchantments)){
                this.selectedItem.enchantsText = this.selectedItem.Enchantments.join('\n');
            }else{
                this.selectedItem.enchantsText = (this.selectedItem.Enchantments && typeof this.selectedItem.Enchantments === 'string') ? this.selectedItem.Enchantments : '';
            }
            // clear drop selection
            this.selectedDropId = null; this.selectedDrop = null;
        },

        addItem(){
            // create new id and choose first items file
            const files = this.itemsFiles || [];
            const path = files.find(f=>f.startsWith('items/')) || files[0] || 'items/ExampleItems.yml';
            const id = `new_item_${Date.now()}`;
            // open editor with blank object
            this.selectedItemId = id;
            this.selectedItem = {Id: 'STONE', display:{name: 'New Item', lore: []}};
            this.selectedItem.display.loreText = '';
            // ask user to confirm file if multiple available
            let target = path;
            try{
                const opts = this.itemsFiles || [];
                if(opts.length > 1){
                    const choice = prompt('Seleccione índice de archivo destino para el nuevo item:\n' + opts.map((o,i)=>`${i}: ${o}`).join('\n'), '0');
                    const idx = Number(choice);
                    if(!isNaN(idx) && idx >=0 && idx < opts.length) target = opts[idx];
                }
            }catch(e){ }
            // store a temp entry in itemsList so saveItems can find path
            this.itemsList[id] = {name: id, path: target, obj: this.selectedItem, raw: ''};
        },

        removeItem(name){
            if(!confirm(`Eliminar item "${name}"?`)) return;
            const entry = this.itemsList[name];
            if(!entry) return alert('Entrada no encontrada');
            const path = entry.path;
            // read file, remove key and save
            fetch(`/api/mmorpg/mythicmobs/file?path=${encodeURIComponent(path)}`).then(r=>r.json()).then(data=>{
                try{
                    const obj = jsyaml.load(data.content || '') || {};
                    if(obj && obj.hasOwnProperty(name)) delete obj[name];
                    const content = jsyaml.dump(obj, {indent:2});
                    return fetch(`/api/mmorpg/mythicmobs/file?path=${encodeURIComponent(path)}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({content})});
                }catch(e){ console.error(e); alert('Error al eliminar'); }
            }).then(r=>{ if(r && r.ok){ alert('Eliminado'); this.loadFiles(); this.loadConfig(); } else if(r){ alert('Error al eliminar'); } }).catch(e=>{ console.error(e); alert('Error al eliminar'); });
        },

        applyItemEdit(){
            if(!this.selectedItemId || !this.selectedItem) return;
            // sync loreText
            if(this.selectedItem.display) this.selectedItem.display.lore = (this.selectedItem.display.loreText||'').split('\n').map(l=>l.trim()).filter(l=>l.length>0);
            // sync enchantments
            if(this.selectedItem.enchantsText){
                this.selectedItem.Enchantments = this.selectedItem.enchantsText.split('\n').map(l=>l.trim()).filter(l=>l.length>0);
            } else {
                delete this.selectedItem.Enchantments;
            }
            // update in-memory itemsList
            if(this.itemsList[this.selectedItemId]){
                this.itemsList[this.selectedItemId].obj = JSON.parse(JSON.stringify(this.selectedItem));
            } else {
                this.itemsList[this.selectedItemId] = {name: this.selectedItemId, path: 'items/ExampleItems.yml', obj: JSON.parse(JSON.stringify(this.selectedItem))};
            }
            alert('Cambios aplicados en memoria. Pulsa Guardar para persistir en disco.');
        },

        async saveItems(){
            // For each item in itemsList, group by path and write merged YAML
            const byPath = {};
            for(const [k,v] of Object.entries(this.itemsList||{})){
                const p = v.path || 'items/ExampleItems.yml';
                byPath[p] = byPath[p] || {};
                byPath[p][k] = v.obj || {};
            }
            try{
                for(const path of Object.keys(byPath)){
                    // read existing file
                    const res = await fetch(`/api/mmorpg/mythicmobs/file?path=${encodeURIComponent(path)}`);
                    const data = await res.json();
                    let full = jsyaml.load(data.content || '') || {};
                    full = typeof full === 'object' ? full : {};
                    // merge/overwrite keys
                    Object.assign(full, byPath[path]);
                    const content = jsyaml.dump(full, {indent:2});
                    const put = await fetch(`/api/mmorpg/mythicmobs/file?path=${encodeURIComponent(path)}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({content})});
                    if(!put.ok) throw new Error('Error al guardar ' + path);
                }
                alert('Items guardados');
                await this.loadFiles(); await this.loadConfig();
            }catch(e){ console.error(e); alert('Error al guardar items: '+e.message); }
        },

        // --- DropTables inline editor ---
        openDropTable(name){
            if(!this.droptablesList[name]) return;
            this.selectedDropId = name;
            this.selectedDrop = JSON.parse(JSON.stringify(this.droptablesList[name].obj || {}));
            const drops = this.selectedDrop.Drops || [];
            this.selectedDrop.dropsText = drops.join('\n');
            this.selectedItemId = null; this.selectedItem = null;
        },

        addDropTable(){
            const files = this.itemsFiles || [];
            const path = files.find(f=>f.startsWith('droptables/')) || files[0] || 'droptables/ExampleDropTables.yml';
            // ask user to confirm file if multiple available
            let target = path;
            try{
                const opts = (files || []).filter(f=>f.startsWith('droptables/'));
                if(opts.length > 1){
                    const choice = prompt('Seleccione índice de archivo destino para el nuevo droptable:\n' + opts.map((o,i)=>`${i}: ${o}`).join('\n'), '0');
                    const idx = Number(choice);
                    if(!isNaN(idx) && idx >=0 && idx < opts.length) target = opts[idx];
                }
            }catch(e){ }
            const id = `new_droptable_${Date.now()}`;
            this.selectedDropId = id;
            this.selectedDrop = {Drops: []};
            this.selectedDrop.dropsText = '';
            this.droptablesList[id] = {name:id, path:target, obj: this.selectedDrop, raw: ''};
        },

        removeDropTable(name){
            if(!confirm(`Eliminar droptable "${name}"?`)) return;
            const entry = this.droptablesList[name];
            if(!entry) return alert('Entrada no encontrada');
            const path = entry.path;
            fetch(`/api/mmorpg/mythicmobs/file?path=${encodeURIComponent(path)}`).then(r=>r.json()).then(data=>{
                try{
                    const obj = jsyaml.load(data.content || '') || {};
                    if(obj && obj.hasOwnProperty(name)) delete obj[name];
                    const content = jsyaml.dump(obj, {indent:2});
                    return fetch(`/api/mmorpg/mythicmobs/file?path=${encodeURIComponent(path)}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({content})});
                }catch(e){ console.error(e); alert('Error al eliminar'); }
            }).then(r=>{ if(r && r.ok){ alert('Eliminado'); this.loadFiles(); this.loadConfig(); } else if(r){ alert('Error al eliminar'); } }).catch(e=>{ console.error(e); alert('Error al eliminar'); });
        },

        applyDropEdit(){
            if(!this.selectedDropId || !this.selectedDrop) return;
            const lines = (this.selectedDrop.dropsText||'').split('\n').map(l=>l.trim()).filter(l=>l.length>0);
            this.selectedDrop.Drops = lines;
            if(this.droptablesList[this.selectedDropId]) this.droptablesList[this.selectedDropId].obj = JSON.parse(JSON.stringify(this.selectedDrop));
            alert('Cambios aplicados en memoria. Pulsa Guardar para persistir en disco.');
        },

        async saveDropTables(){
            const byPath = {};
            for(const [k,v] of Object.entries(this.droptablesList||{})){
                const p = v.path || 'droptables/ExampleDropTables.yml';
                byPath[p] = byPath[p] || {};
                byPath[p][k] = v.obj || {};
            }
            try{
                for(const path of Object.keys(byPath)){
                    const res = await fetch(`/api/mmorpg/mythicmobs/file?path=${encodeURIComponent(path)}`);
                    const data = await res.json();
                    let full = jsyaml.load(data.content || '') || {};
                    full = typeof full === 'object' ? full : {};
                    Object.assign(full, byPath[path]);
                    const content = jsyaml.dump(full, {indent:2});
                    const put = await fetch(`/api/mmorpg/mythicmobs/file?path=${encodeURIComponent(path)}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({content})});
                    if(!put.ok) throw new Error('Error al guardar ' + path);
                }
                alert('DropTables guardados');
                await this.loadFiles(); await this.loadConfig();
            }catch(e){ console.error(e); alert('Error al guardar droptables: '+e.message); }
        },

        async saveMobFromModal(){
            try{
                let content = this.selectedMobContent;
                if(this.modalMode === 'visual'){
                    // ensure drops field updated from dropsRaw if present
                    if(this.selectedMobObject && this.selectedMobObject.dropsRaw){
                        try{ this.selectedMobObject.drops = JSON.parse(this.selectedMobObject.dropsRaw) }catch(e){ /* ignore parse errors, keep original */ }
                    }
                    // If editing a specific key inside a file, load full file, replace the key and save whole file
                    if(this.selectedMobKey){
                        const path = this.selectedMobPath;
                        const resRead = await fetch(`/api/mmorpg/mythicmobs/file?path=${encodeURIComponent(path)}`);
                        if(!resRead.ok) throw new Error('No se pudo leer archivo original');
                        const data = await resRead.json();
                        let full = jsyaml.load(data.content || '') || {};
                        full = typeof full === 'object' ? full : {};
                        full[this.selectedMobKey] = this.selectedMobObject;
                        content = jsyaml.dump(full, {indent:2});
                        const res = await fetch(`/api/mmorpg/mythicmobs/file?path=${encodeURIComponent(path)}`, {
                            method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({content})
                        });
                        if(!res.ok) throw new Error('Error al guardar mob');
                    }else{
                        // serialize selectedMobObject as whole file
                        content = jsyaml.dump(this.selectedMobObject, {indent:2});
                        const path = this.selectedMobPath;
                        const res = await fetch(`/api/mmorpg/mythicmobs/file?path=${encodeURIComponent(path)}`, {
                            method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({content})
                        });
                        if(!res.ok) throw new Error('Error al guardar mob');
                    }
                }
                alert('Archivo guardado');
                this.showMobModal = false;
                await this.loadFiles();
            }catch(e){ console.error(e); alert('Error al guardar mob'); }
        },

        openParsedEntry(entry){
            // show entry in visual modal for editing (entry: {name,path,obj,raw})
            this.openMobModal(entry);
        },

        async openFile(path){
            try{
                this.activeFile = path;
                const res = await fetch(`/api/mmorpg/mythicmobs/file?path=${encodeURIComponent(path)}`);
                if(!res.ok) throw new Error('No se pudo abrir archivo');
                const data = await res.json();
                this.fileContent = data.content || '';
            }catch(e){ console.error(e); this.fileContent = ''; }
        },

        async saveFile(){
            if(!this.activeFile) return;
            this.saving = true;
            try{
                const res = await fetch(`/api/mmorpg/mythicmobs/file?path=${encodeURIComponent(this.activeFile)}`, {
                    method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({content: this.fileContent})
                });
                if(!res.ok) throw new Error('Error al guardar archivo');
                alert('Archivo guardado');
                await this.loadFiles();
            }catch(e){ console.error(e); alert('Error al guardar archivo'); }finally{ this.saving = false; }
        }
    }
}
