function questsManager(){
    return {
        activeTab: 'general',
        config: {
            categoriesEnabled: true,
            titlesEnabled: true,
            allowQuestCancel: true,
            allowQuestTrack: true,
            questLimitDefault: 2,
            verboseLoggingLevel: 2,
            storageProvider: 'yaml',
            storageDatabase: '',
            storageUsername: '',
            storageAddress: '',
            questAutosaveInterval: 12000
        },
        files: [],
        activeFile: null,
        fileContent: '',
        formFields: [],
        viewMode: 'raw',
        saving: false,
        advancedFields: [],
        // categories editor
        categories: {},
        categoriesList: [],
        selectedCategoryId: null,
        selectedCategory: null,
        // quests visual editor
        questsList: [],
        selectedQuestPath: null,
        selectedQuestContent: '',
        showQuestModal: false,
        // modal visual state
        modalMode: 'visual',
        selectedQuestObject: {},

        async init(){
            await this.loadConfig();
            await this.loadFiles();
            await this.loadCategories();
            await this.loadQuests();
        },

        async loadConfig(){
            try{
                const res = await fetch('/api/mmorpg/quests/config');
                if(!res.ok) throw new Error('No se pudo cargar configuración');
                const data = await res.json();
                const cfg = data.config || data;
                this.config = Object.assign({}, this.config, {
                    categoriesEnabled: cfg.categoriesEnabled ?? this.config.categoriesEnabled,
                    titlesEnabled: cfg.titlesEnabled ?? this.config.titlesEnabled,
                    allowQuestCancel: cfg.allowQuestCancel ?? this.config.allowQuestCancel,
                    allowQuestTrack: cfg.allowQuestTrack ?? this.config.allowQuestTrack,
                    questLimitDefault: cfg.questLimitDefault ?? this.config.questLimitDefault,
                    verboseLoggingLevel: cfg.verboseLoggingLevel ?? this.config.verboseLoggingLevel,
                    storageProvider: cfg.storageProvider ?? this.config.storageProvider,
                    storageDatabase: cfg.storageDatabase ?? this.config.storageDatabase,
                    storageUsername: cfg.storageUsername ?? this.config.storageUsername,
                    storageAddress: cfg.storageAddress ?? this.config.storageAddress,
                    questAutosaveInterval: cfg.questAutosaveInterval ?? this.config.questAutosaveInterval
                });
            }catch(e){
                console.error(e);
            }
        },

        async saveConfig(){
            try{
                const payload = Object.assign({}, this.config);
                const res = await fetch('/api/mmorpg/quests/config', {
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
                const res = await fetch('/api/mmorpg/quests/files');
                if(!res.ok) throw new Error('No se pudo listar archivos');
                const data = await res.json();
                this.files = data.files || [];
                if(this.files.length) this.openFile(this.files[0].path);
            }catch(e){
                console.error(e);
            }
        },

        async loadCategories(){
            try{
                const path = 'categories.yml';
                const res = await fetch(`/api/mmorpg/quests/file?path=${encodeURIComponent(path)}`);
                console.log('[quests] loadCategories: fetch', path, 'status', res.status);
                if(!res.ok) throw new Error('No se pudo cargar categories.yml');
                const data = await res.json();
                this.categoriesYaml = data.content || '';
                console.log('[quests] loadCategories: content len', (this.categoriesYaml || '').length);
                const obj = jsyaml.load(this.categoriesYaml) || {};
                console.log('[quests] loadCategories: parsed', obj);
                if(obj.categories && typeof obj.categories === 'object' && !Array.isArray(obj.categories)){
                    this.categories = obj.categories;
                    this.categoriesList = Object.keys(this.categories);
                }else if(Array.isArray(obj.categories)){
                    const map = {};
                    for(const c of obj.categories){ if(c && c.name) map[c.name] = c; }
                    this.categories = map;
                    this.categoriesList = Object.keys(map);
                }else{
                    this.categories = {};
                    this.categoriesList = [];
                }
                console.log('[quests] loadCategories: categoriesList', this.categoriesList);
                if(this.categoriesList.length) this.openCategory(this.categoriesList[0]);
            }catch(e){
                console.error(e);
                this.categories = {};
                this.categoriesList = [];
                this.selectedCategoryId = null;
                this.selectedCategory = null;
            }
        },

        openCategory(id){
            if(!this.categories[id]) return;
            this.selectedCategoryId = id;
            // deep copy
            const c = JSON.parse(JSON.stringify(this.categories[id]));
            // ensure display exists
            c.display = c.display || {name:'', lore:[], type:''};
            // create loreText for editing
            c.display.loreText = Array.isArray(c.display.lore) ? c.display.lore.join('\n') : '';
            this.selectedCategory = c;
        },

        addCategory(){
            // generate unique id
            let i = 1;
            let id = `new_category_${i}`;
            while(this.categoriesList.includes(id)){
                i++; id = `new_category_${i}`;
            }
            this.categories[id] = {display:{name:'New Category', lore:[], type:'WATER_BUCKET'}};
            this.categoriesList.push(id);
            this.openCategory(id);
        },

        removeCategory(id){
            if(!confirm(`Eliminar la categoría "${id}"?`)) return;
            delete this.categories[id];
            this.categoriesList = Object.keys(this.categories);
            if(this.selectedCategoryId === id){
                this.selectedCategoryId = this.categoriesList[0] || null;
                this.selectedCategory = this.selectedCategoryId ? JSON.parse(JSON.stringify(this.categories[this.selectedCategoryId])) : null;
            }
        },

        applyCategoryEdit(){
            if(!this.selectedCategoryId || !this.selectedCategory) return;
            const c = JSON.parse(JSON.stringify(this.selectedCategory));
            // split loreText into array
            c.display.lore = (c.display.loreText || '').split('\n').map(l=>l.trim()).filter(l=>l.length>0);
            delete c.display.loreText;
            this.categories[this.selectedCategoryId] = c;
            // update list (no-op)
            this.categoriesList = Object.keys(this.categories);
            alert('Cambios aplicados en memoria. Guarda para persistir en disk.');
        },

        async saveCategories(){
            try{
                // build yaml object
                const out = {categories: this.categories};
                const content = jsyaml.dump(out, {indent:2});
                const res = await fetch(`/api/mmorpg/quests/file?path=${encodeURIComponent('categories.yml')}`, {
                    method: 'PUT',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({content})
                });
                if(!res.ok) throw new Error('Error al guardar categories.yml');
                alert('categories.yml guardado');
                await this.loadCategories();
                await this.loadFiles();
                await this.loadQuests();
            }catch(e){
                console.error(e);
                alert('Error al guardar categories.yml');
            }
        },

        // Quests visual editor helpers
        async loadQuests(){
            try{
                // files already populated by loadFiles(); filter those under 'quests/' directory (robust match)
                this.questsList = (this.files || []).filter(f => {
                    const p = (f.path||'').toLowerCase();
                    return (p.includes('/quests/') || p.startsWith('quests/') || p.indexOf('quests/')>=0 || p.indexOf('/quests')>=0) && (p.endsWith('.yml') || p.endsWith('.yaml'))
                }).map(f => f.path);
                console.log('[quests] loadQuests: found', this.questsList);
            }catch(e){
                console.error(e);
                this.questsList = [];
            }
        },

        async openQuestModal(path){
            this.modalMode = 'visual';
            if(path){
                this.selectedQuestPath = path;
                // load content (await)
                await this.openFile(path);
                this.selectedQuestContent = this.fileContent || '';
                // try parse YAML into object
                try{
                    const obj = jsyaml.load(this.selectedQuestContent) || {};
                    // heuristic: find top-level keys for name/description/tasks
                    let q = obj;
                    // if wrapped under a key (e.g., quest_id: {...}) pick the inner object
                    if(Object.keys(q).length === 1){
                        const k = Object.keys(q)[0];
                        if(typeof q[k] === 'object') q = q[k];
                    }
                    this.selectedQuestObject = {
                        name: q.name || q.title || '',
                        description: q.description || q.desc || '',
                        tasks: q.tasks || q.objectives || [],
                        rewards: q.rewards || q.rewards || q.rewards || []
                    };
                }catch(e){
                    console.error('parse quest yaml', e);
                    this.selectedQuestObject = {name:'', description:'', tasks:[], rewards:[]};
                    this.modalMode = 'raw';
                }
            }else{
                // new quest
                const id = `new_quest_${Date.now()}`;
                this.selectedQuestPath = `quests/${id}.yml`;
                this.selectedQuestObject = {name:'New Quest', description:'', tasks:[], rewards:[]};
                this.selectedQuestContent = jsyaml.dump(this.selectedQuestObject, {indent:2});
            }
            this.showQuestModal = true;
        },

        async saveQuestFromModal(){
            try{
                const path = this.selectedQuestPath;
                let content = this.selectedQuestContent;
                if(this.modalMode === 'visual'){
                    // build object from selectedQuestObject
                    const obj = {
                        name: this.selectedQuestObject.name || undefined,
                        description: this.selectedQuestObject.description || undefined,
                        tasks: this.selectedQuestObject.tasks || [],
                        rewards: this.selectedQuestObject.rewards || []
                    };
                    // remove undefined
                    Object.keys(obj).forEach(k=> obj[k]===undefined && delete obj[k]);
                    content = jsyaml.dump(obj, {indent:2});
                }

                const res = await fetch(`/api/mmorpg/quests/file?path=${encodeURIComponent(path)}`, {
                    method: 'PUT',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({content})
                });
                if(!res.ok) throw new Error('Error al guardar quest');
                alert('Quest guardada');
                this.showQuestModal = false;
                await this.loadFiles();
                await this.loadQuests();
            }catch(e){
                console.error(e);
                alert('Error al guardar quest');
            }
        },

        async openFile(path){
            try{
                this.activeFile = path;
                const res = await fetch(`/api/mmorpg/quests/file?path=${encodeURIComponent(path)}`);
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

                    // Map some common keys
                    if(obj.options){
                        const o = obj.options;
                        if('categories-enabled' in o) add('options.categories-enabled', o['categories-enabled']);
                        if('titles-enabled' in o) add('options.titles-enabled', o['titles-enabled']);
                        if('allow-quest-cancel' in o) add('options.allow-quest-cancel', o['allow-quest-cancel']);
                        if('allow-quest-track' in o) add('options.allow-quest-track', o['allow-quest-track']);
                        if('quest-limit' in o) add('options.quest-limit', o['quest-limit']);
                        if('verbose-logging-level' in o) add('options.verbose-logging-level', o['verbose-logging-level']);
                        if('storage' in o) add('options.storage', o['storage']);
                        if('performance-tweaking' in o) add('options.performance-tweaking', o['performance-tweaking']);
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

            // update fileContent YAML (best-effort)
            try{
                let obj = jsyaml.load(this.fileContent) || {};
                const parts = field.key.split('.');
                let cur = obj;
                for(let i=0;i<parts.length-1;i++){
                    const p = parts[i];
                    if(!(p in cur) || typeof cur[p] !== 'object') cur[p] = {};
                    cur = cur[p];
                }
                cur[parts[parts.length-1]] = field.value;
                this.fileContent = jsyaml.dump(obj, {indent:2});
            }catch(e){
                console.error(e);
            }
        },

        removeReward(idx){
            if(!Array.isArray(this.config.defaultRewards)) this.config.defaultRewards = [];
            this.config.defaultRewards.splice(idx,1);
        },
        addReward(){
            if(!Array.isArray(this.config.defaultRewards)) this.config.defaultRewards = [];
            this.config.defaultRewards.push({type:'money', value:0});
        },

        async saveFile(){
            if(!this.activeFile) return;
            this.saving = true;
            try{
                const res = await fetch(`/api/mmorpg/quests/file?path=${encodeURIComponent(this.activeFile)}`, {
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
