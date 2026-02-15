function mmorpgPluginManager(pluginId) {
    return {
        pluginId,
        files: [],
        activeFile: null,
        fileContent: '',
        viewMode: 'raw',
        formFields: [],
        loading: false,
        saving: false,
        error: '',
        notice: '',

        async init() {
            await this.loadFiles();
            if (this.files.length > 0) {
                await this.openFile(this.files[0].path);
            }
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        },

        async loadFiles() {
            this.loading = true;
            this.error = '';
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/mmorpg/${this.pluginId}/files`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.detail || 'Error al cargar archivos');
                }
                this.files = data.files || [];
            } catch (e) {
                this.error = e.message || 'Error al cargar archivos';
            } finally {
                this.loading = false;
            }
        },

        async openFile(path) {
            if (!path) return;
            this.loading = true;
            this.error = '';
            this.notice = '';
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/mmorpg/${this.pluginId}/file?path=${encodeURIComponent(path)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.detail || 'Error al leer archivo');
                }
                this.activeFile = data.path;
                this.fileContent = data.content || '';
                this.buildForm();
            } catch (e) {
                this.error = e.message || 'Error al leer archivo';
            } finally {
                this.loading = false;
            }
        },

        buildForm() {
            this.formFields = [];
            const ext = this.getActiveExtension();
            if (!['yml', 'yaml', 'json'].includes(ext)) {
                return;
            }

            try {
                let obj = {};
                if (ext === 'json') {
                    obj = JSON.parse(this.fileContent || '{}');
                } else if (window.jsyaml) {
                    obj = window.jsyaml.load(this.fileContent || '') || {};
                }

                if (typeof obj !== 'object' || obj === null) {
                    return;
                }

                for (const key of Object.keys(obj)) {
                    const value = obj[key];
                    const type = this.getValueType(value);
                    this.formFields.push({
                        key,
                        type,
                        value: this.normalizeValue(value)
                    });
                }
            } catch (e) {
                this.notice = 'No se pudo generar el formulario visual. Usa vista RAW.';
            }
        },

        getValueType(value) {
            if (typeof value === 'boolean') return 'boolean';
            if (typeof value === 'number') return 'number';
            if (typeof value === 'string') return 'string';
            return 'json';
        },

        normalizeValue(value) {
            if (Array.isArray(value) || typeof value === 'object') {
                return JSON.stringify(value, null, 2);
            }
            return value;
        },

        updateField(field, newValue) {
            field.value = newValue;
        },

        applyFormToContent() {
            const ext = this.getActiveExtension();
            if (!['yml', 'yaml', 'json'].includes(ext)) {
                return;
            }

            const obj = {};
            for (const field of this.formFields) {
                if (field.type === 'boolean') {
                    obj[field.key] = Boolean(field.value);
                } else if (field.type === 'number') {
                    obj[field.key] = Number(field.value);
                } else if (field.type === 'string') {
                    obj[field.key] = String(field.value);
                } else {
                    try {
                        obj[field.key] = JSON.parse(field.value || 'null');
                    } catch (e) {
                        obj[field.key] = field.value;
                    }
                }
            }

            if (ext === 'json') {
                this.fileContent = JSON.stringify(obj, null, 2);
            } else if (window.jsyaml) {
                this.fileContent = window.jsyaml.dump(obj, { lineWidth: 120 });
            }
        },

        async saveFile() {
            if (!this.activeFile) return;
            this.saving = true;
            this.error = '';
            this.notice = '';

            try {
                if (this.viewMode === 'visual') {
                    this.applyFormToContent();
                }

                const token = localStorage.getItem('token');
                const res = await fetch(`/api/mmorpg/${this.pluginId}/file?path=${encodeURIComponent(this.activeFile)}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ content: this.fileContent })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.detail || 'Error al guardar');
                }

                this.notice = 'Archivo guardado correctamente.';
            } catch (e) {
                this.error = e.message || 'Error al guardar';
            } finally {
                this.saving = false;
            }
        },

        getActiveExtension() {
            if (!this.activeFile) return '';
            const parts = this.activeFile.split('.');
            return parts.length > 1 ? parts.pop().toLowerCase() : '';
        }
    };
}

window.mmorpgPluginManager = mmorpgPluginManager;
