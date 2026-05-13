const app = {
    currentModule: null,
    currentView: 'dashboard',
    currentERP: 'netsis', // 'netsis' or 'tiger'
    userQueries: [],
    overrides: { tables: {}, relations: [], mappings: [] },

    init() {
        this.injectGlobalRelationships();
        this.loadUserQueries();
        this.loadOverrides();
        this.updateStats();
        this.renderModules();
        this.showDashboard(document.querySelector('[data-view="dashboard"]'));
        this.bindKeyboard();
        lucide.createIcons();
    },

    injectGlobalRelationships() {
        // Eksik olan kritik veritabanı ilişkilerini sisteme enjekte eder
        const extraRels = [
            // NETSIS CORE RELATIONS
            { from: 'TBLSTSABIT', to: 'TBLSTHAR', col: 'STOK_KODU', desc: 'Stok Hareketleri' },
            { from: 'TBLSTSABIT', to: 'TBLSTOKDP', col: 'STOK_KODU', desc: 'Depo Bakiyeleri' },
            { from: 'TBLCASABIT', to: 'TBLCAHAR', col: 'CARI_KODU', desc: 'Cari Hareketler' },
            { from: 'TBLFATUIRS', to: 'TBLSTHAR', col: 'FATIRS_NO', desc: 'Fatura Satırları' },
            { from: 'TBLCASABIT', to: 'TBLFATUIRS', col: 'CARI_KODU', desc: 'Cari Faturaları' },
            { from: 'TBLSTSABIT', to: 'TBLSTBARKOD', col: 'STOK_KODU', desc: 'Barkod Tanımları' },
            
            // TIGER CORE RELATIONS
            { from: 'LG_001_ITEMS', to: 'LG_001_01_STLINE', col: 'LOGICALREF', targetCol: 'STOCKREF', desc: 'Malzeme Hareketleri' },
            { from: 'LG_001_CLCARD', to: 'LG_001_01_CLFLINE', col: 'LOGICALREF', targetCol: 'CLIENTREF', desc: 'Cari Hareketler' },
            { from: 'LG_001_01_INVOICE', to: 'LG_001_01_STLINE', col: 'LOGICALREF', targetCol: 'INVOICEREF', desc: 'Fatura Satırları' },
            { from: 'LG_001_ITEMS', to: 'LG_001_01_GNTOTWH', col: 'LOGICALREF', targetCol: 'STOCKREF', desc: 'Ambar Toplamları' }
        ];

        extraRels.forEach(rel => {
            const table = NETSIS_DATA.tables.find(t => t.id === rel.from);
            if (table) {
                if (!table.relations) table.relations = [];
                const exists = table.relations.some(r => r.table === rel.to);
                if (!exists) {
                    table.relations.push({
                        table: rel.to,
                        column: rel.col,
                        targetColumn: rel.targetCol || rel.col,
                        type: 'One-to-Many',
                        desc: rel.desc
                    });
                }
            }
        });
    },

    updateStats() {
        const netsisCount = NETSIS_DATA.tables.filter(t => t.name && !t.name.startsWith('LG_') && !t.name.startsWith('L_')).length;
        const tigerCount = NETSIS_DATA.tables.filter(t => t.name && (t.name.startsWith('LG_') || t.name.startsWith('L_'))).length;
        
        const badge = document.querySelector('.version-badge');
        if (badge) {
            badge.innerHTML = `v2.2 — Netsis ${netsisCount} | Tiger ${tigerCount}`;
        }
    },

    loadUserQueries() {
        const saved = localStorage.getItem('user_queries');
        if (saved) {
            this.userQueries = JSON.parse(saved);
        }
    },

    saveUserQuery() {
        const title = document.getElementById('q-title').value;
        const desc = document.getElementById('q-desc').value;
        const sql = document.getElementById('q-sql').value;

        if (!title || !sql) {
            alert('Lütfen başlık ve SQL alanlarını doldurun.');
            return;
        }

        const query = {
            id: Date.now(),
            title,
            desc,
            sql,
            date: new Date().toLocaleDateString('tr-TR')
        };

        this.userQueries.unshift(query);
        localStorage.setItem('user_queries', JSON.stringify(this.userQueries));
        this.showUserQueries();
    },

    highlight(text, query) {
        if (!query || !text) return text || '';
        const re = new RegExp(`(${query})`, 'gi');
        return String(text).replace(re, '<span class="highlight">$1</span>');
    },

    deleteUserQuery(id) {
        if (!confirm('Bu sorguyu silmek istediğinize emin misiniz?')) return;
        this.userQueries = this.userQueries.filter(q => q.id !== id);
        localStorage.setItem('user_queries', JSON.stringify(this.userQueries));
        this.showUserQueries();
    },

    setERPMode(mode) {
        this.currentERP = mode;
        document.getElementById('btn-netsis').classList.toggle('active', mode === 'netsis');
        document.getElementById('btn-tiger').classList.toggle('active', mode === 'tiger');
        
        // Refresh view
        this.renderModules();
        if (this.currentView === 'dashboard') this.showDashboard();
        else if (this.currentView === 'all') this.showAllTables();
        else if (this.currentView === 'module') this.showModule(this.currentModule);
        else if (this.currentView === 'queries') this.showAdvancedQueries();
        else if (this.currentView === 'relations') this.showRelationMap();
        
        this.updateStats();
        lucide.createIcons();
    },

    bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('global-search').focus();
            }
            if (e.key === 'Escape') {
                document.getElementById('global-search').value = '';
                this.goBack();
            }
        });
    },

    setActiveNav(el) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        if (el) el.classList.add('active');
    },

    loadOverrides() {
        const saved = localStorage.getItem('db_overrides');
        if (saved) {
            this.overrides = JSON.parse(saved);
        }
    },

    saveOverrides() {
        localStorage.setItem('db_overrides', JSON.stringify(this.overrides));
    },

    // Veriyi Versiyonlayarak Güncelleme/Ekleme Mantığı
    applyChange(type, id, newData, action = 'update') {
        const timestamp = new Date().toISOString();
        
        if (type === 'table') {
            if (!this.overrides.tables[id]) {
                // İlk kez override ediliyor, orijinali baz al
                const original = NETSIS_DATA.tables.find(t => t.id === id) || { id, columns: [], relations: [] };
                this.overrides.tables[id] = {
                    current: { ...original, version: 1, isActive: true, updatedAt: timestamp },
                    history: []
                };
            }

            const tableEntry = this.overrides.tables[id];
            
            // Mevcut hali geçmişe taşı (max 5)
            tableEntry.history.unshift({ ...tableEntry.current, isActive: false });
            if (tableEntry.history.length > 5) tableEntry.history.pop();

            // Yeni hali ata
            if (action === 'delete') {
                tableEntry.current.isActive = false;
            } else {
                tableEntry.current = { 
                    ...tableEntry.current, 
                    ...newData, 
                    version: tableEntry.current.version + 1, 
                    isActive: true,
                    updatedAt: timestamp 
                };
            }
        }
        
        this.saveOverrides();
        this.updateStats();
        if (this.currentView === 'dashboard') this.showDashboard();
        if (this.currentView === 'module') this.showModule(this.currentModule);
        this.closeModal();
    },

    openModal(title, bodyHTML) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHTML;
        document.getElementById('modal-overlay').style.display = 'flex';
        lucide.createIcons();
    },

    closeModal() {
        document.getElementById('modal-overlay').style.display = 'none';
    },

    // --- TABLO İŞLEMLERİ ---
    showAddTableForm() {
        const modules = NETSIS_DATA.modules.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        const html = `
            <div class="dynamic-form">
                <div class="form-group">
                    <label>Tablo ID (Örn: TBLTEST)</label>
                    <input type="text" id="edit-id" placeholder="Tablo ID">
                </div>
                <div class="form-group">
                    <label>Tablo Adı</label>
                    <input type="text" id="edit-name" placeholder="Tam Tablo Adı">
                </div>
                <div class="form-group">
                    <label>Açıklama</label>
                    <textarea id="edit-desc" placeholder="Tablo açıklaması..."></textarea>
                </div>
                <div class="form-group">
                    <label>Modül</label>
                    <select id="edit-mod">${modules}</select>
                </div>
                <div class="form-actions">
                    <button class="primary-btn" onclick="app.saveTable()">Kaydet</button>
                </div>
            </div>`;
        this.openModal('Yeni Tablo Ekle', html);
    },

    showEditTableForm(tableId) {
        const table = this.getFilteredTables().find(t => t.id === tableId);
        if (!table) return;
        const modules = NETSIS_DATA.modules.map(m => `<option value="${m.id}" ${m.id === table.module ? 'selected' : ''}>${m.name}</option>`).join('');
        const html = `
            <div class="dynamic-form">
                <input type="hidden" id="edit-id" value="${table.id}">
                <div class="form-group">
                    <label>Tablo Adı</label>
                    <input type="text" id="edit-name" value="${table.name}">
                </div>
                <div class="form-group">
                    <label>Açıklama</label>
                    <textarea id="edit-desc">${table.description}</textarea>
                </div>
                <div class="form-group">
                    <label>Modül</label>
                    <select id="edit-mod">${modules}</select>
                </div>
                <div class="form-actions">
                    <button class="danger-btn icon-btn" style="margin-right:auto" onclick="app.deleteTable('${table.id}')">
                        <i data-lucide="trash-2"></i> Tabloyu Sil
                    </button>
                    <button class="primary-btn" onclick="app.saveTable()">Güncelle</button>
                </div>
            </div>`;
        this.openModal('Tabloyu Düzenle', html);
    },

    saveTable() {
        const id = document.getElementById('edit-id').value.toUpperCase();
        const name = document.getElementById('edit-name').value;
        const description = document.getElementById('edit-desc').value;
        const module = document.getElementById('edit-mod').value;

        if (!id || !name) return alert('ID ve Ad zorunludur!');

        this.applyChange('table', id, { name, description, module });
        if (this.currentView === 'search') this.handleSearch(name);
        else this.showTableDetail(id);
    },

    deleteTable(id) {
        if (!confirm('Bu tabloyu pasife almak istediğinize emin misiniz?')) return;
        this.applyChange('table', id, {}, 'delete');
        this.showDashboard();
    },

    // --- KOLON İŞLEMLERİ ---
    showAddColumnForm(tableId) {
        const html = `
            <div class="dynamic-form">
                <div class="form-group">
                    <label>Kolon Adı</label>
                    <input type="text" id="col-name" placeholder="STOK_KODU">
                </div>
                <div class="form-group">
                    <label>Veri Tipi</label>
                    <input type="text" id="col-type" placeholder="VARCHAR(30)">
                </div>
                <div class="form-group">
                    <label>Açıklama</label>
                    <input type="text" id="col-desc" placeholder="Stok Kart Kodu">
                </div>
                <div style="display:flex; gap:1rem">
                    <label><input type="checkbox" id="col-pk"> PK</label>
                    <label><input type="checkbox" id="col-important"> Önemli</label>
                </div>
                <div class="form-actions">
                    <button class="primary-btn" onclick="app.saveColumn('${tableId}')">Ekle</button>
                </div>
            </div>`;
        this.openModal('Yeni Kolon Ekle', html);
    },

    saveColumn(tableId) {
        const table = this.getFilteredTables().find(t => t.id === tableId);
        const name = document.getElementById('col-name').value;
        const type = document.getElementById('col-type').value;
        const desc = document.getElementById('col-desc').value;
        const pk = document.getElementById('col-pk').checked;
        const important = document.getElementById('col-important').checked;

        const newColumns = [...table.columns, { name, type, desc, pk, important }];
        this.applyChange('table', tableId, { columns: newColumns });
        this.showTableDetail(tableId);
    },

    // --- İLİŞKİ YÖNETİMİ (Composite Key Desteği) ---
    showAddRelationForm(tableId) {
        const table = this.getFilteredTables().find(t => t.id === tableId);
        const otherTables = this.getFilteredTables().filter(t => t.id !== tableId);
        
        const tableOptions = otherTables.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        const colOptions = table.columns.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

        const html = `
            <div class="dynamic-form">
                <div class="form-group">
                    <label>Hedef Tablo</label>
                    <select id="rel-target" onchange="app.updateTargetCols(this.value)">
                        <option value="">Seçiniz...</option>
                        ${tableOptions}
                    </select>
                </div>
                <div id="multi-rel-container">
                    <div class="form-group">
                        <label>Eşleşen Kolonlar</label>
                        <div class="multi-rel-row">
                            <select class="rel-source-col">${colOptions}</select>
                            <select class="rel-target-col" id="rel-target-col-0"><option>Önce tablo seçin</option></select>
                        </div>
                    </div>
                </div>
                <button class="icon-btn" onclick="app.addRelRow('${tableId}')"><i data-lucide="plus"></i> Kolon Ekle</button>
                <div class="form-actions">
                    <button class="primary-btn" onclick="app.saveRelation('${tableId}')">İlişkiyi Kaydet</button>
                </div>
            </div>`;
        this.openModal('İlişki Tanımla', html);
    },

    updateTargetCols(targetId) {
        const targetTable = this.getFilteredTables().find(t => t.id === targetId);
        const selects = document.querySelectorAll('.rel-target-col');
        const options = targetTable ? targetTable.columns.map(c => `<option value="${c.name}">${c.name}</option>`).join('') : '<option>Tablo bulunamadı</option>';
        selects.forEach(s => s.innerHTML = options);
    },

    addRelRow(tableId) {
        const table = this.getFilteredTables().find(t => t.id === tableId);
        const colOptions = table.columns.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        const targetId = document.getElementById('rel-target').value;
        const targetTable = this.getFilteredTables().find(t => t.id === targetId);
        const targetOptions = targetTable ? targetTable.columns.map(c => `<option value="${c.name}">${c.name}</option>`).join('') : '';

        const div = document.createElement('div');
        div.className = 'multi-rel-row';
        div.innerHTML = `
            <select class="rel-source-col">${colOptions}</select>
            <select class="rel-target-col">${targetOptions}</select>
            <button class="icon-btn" onclick="this.parentElement.remove()"><i data-lucide="x"></i></button>
        `;
        document.getElementById('multi-rel-container').appendChild(div);
        lucide.createIcons();
    },

    saveRelation(tableId) {
        const target = document.getElementById('rel-target').value;
        if (!target) return alert('Hedef tablo seçin!');

        const sourceCols = Array.from(document.querySelectorAll('.rel-source-col')).map(s => s.value);
        const targetCols = Array.from(document.querySelectorAll('.rel-target-col')).map(s => s.value);

        const table = this.getFilteredTables().find(t => t.id === tableId);
        const newRel = { 
            table: target, 
            column: sourceCols[0], // Geriye dönük uyum için
            columns: sourceCols, 
            targetColumns: targetCols 
        };

        const newRelations = [...(table.relations || []), newRel];
        this.applyChange('table', tableId, { relations: newRelations });
        this.showTableDetail(tableId);
    },

    deleteRelation(tableId, index) {
        if (!confirm('Bu ilişkiyi silmek istediğinize emin misiniz?')) return;
        const table = this.getFilteredTables().find(t => t.id === tableId);
        const newRelations = [...table.relations];
        newRelations.splice(index, 1);
        this.applyChange('table', tableId, { relations: newRelations });
        this.showTableDetail(tableId);
    },

    // --- MAPPING YÖNETİMİ ---
    showAddMappingForm(tableId) {
        const isNetsis = !tableId.startsWith('LG_') && !tableId.startsWith('L_');
        const targetERP = isNetsis ? 'tiger' : 'netsis';
        const otherTables = NETSIS_DATA.tables.filter(t => {
            const isTiger = t.name.startsWith('LG_') || t.name.startsWith('L_');
            return targetERP === 'tiger' ? isTiger : !isTiger;
        });

        const html = `
            <div class="dynamic-form">
                <div class="form-group">
                    <label>${targetERP.toUpperCase()} Karşılığı Olan Tablo</label>
                    <select id="map-target">
                        <option value="">Seçiniz...</option>
                        ${otherTables.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-actions">
                    <button class="primary-btn" onclick="app.saveMapping('${tableId}')">Eşleşmeyi Kaydet</button>
                </div>
            </div>`;
        this.openModal('ERP Eşleşmesi Tanımla', html);
    },

    renderHistory(tableId) {
        const entry = this.overrides.tables[tableId];
        if (!entry || entry.history.length === 0) return '<p style="color:var(--text-muted)">Henüz bir değişiklik kaydı bulunmuyor.</p>';
        
        return entry.history.map(h => `
            <div class="history-item">
                <div class="h-meta">
                    <span class="h-version">v${h.version}</span>
                    <span class="h-date">${new Date(h.updatedAt).toLocaleString('tr-TR')}</span>
                </div>
                <div class="h-info">Versiyon ${h.version} pasife alındı.</div>
                <button class="icon-btn" onclick="app.rollback('${tableId}', ${h.version})" title="Bu versiyona dön">
                    <i data-lucide="rotate-ccw"></i>
                </button>
            </div>
        `).join('');
    },

    rollback(tableId, version) {
        if (!confirm(`v${version} sürümüne geri dönmek istediğinize emin misiniz?`)) return;
        const entry = this.overrides.tables[tableId];
        const historical = entry.history.find(h => h.version === version);
        if (historical) {
            this.applyChange('table', tableId, { ...historical });
            this.showTableDetail(tableId);
        }
    },

    saveMapping(tableId) {
        const target = document.getElementById('map-target').value;
        if (!target) return alert('Hedef tablo seçin!');

        const isNetsis = !tableId.startsWith('LG_') && !tableId.startsWith('L_');
        const newMapping = isNetsis ? { netsis: tableId, tiger: target } : { netsis: target, tiger: tableId };
        
        // Önce varsa eskiyi temizle
        this.overrides.mappings = this.overrides.mappings.filter(m => m.netsis !== tableId && m.tiger !== tableId);
        
        this.overrides.mappings.push(newMapping);
        this.saveOverrides();
        this.showTableDetail(tableId);
        this.closeModal();
    },

    deleteMapping(tableId) {
        if (!confirm('Bu eşleşmeyi kaldırmak istediğinize emin misiniz?')) return;
        this.overrides.mappings = this.overrides.mappings.filter(m => m.netsis !== tableId && m.tiger !== tableId);
        this.saveOverrides();
        this.showTableDetail(tableId);
    },

    // --- SİSTEM YÖNETİMİ ---
    showSettings(el) {
        this.currentView = 'settings';
        if (el) this.setActiveNav(el);
        const mainView = document.getElementById('main-view');
        document.getElementById('detail-view').style.display = 'none';
        mainView.style.display = 'block';

        mainView.innerHTML = `
        <div class="fade-in">
            <div class="page-header">
                <h2>Sistem Yönetimi</h2>
                <p class="page-desc">Yapılan tüm dinamik değişiklikleri (Ekleme, Düzenleme, İlişki) yönetin.</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${Object.keys(this.overrides.tables).length}</div>
                    <div class="stat-label">Düzenlenmiş Tablo</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${this.overrides.mappings.length}</div>
                    <div class="stat-label">Yeni Eşleşme</div>
                </div>
            </div>

            <div class="section-container" style="margin-top:2rem; background: rgba(255,255,255,0.02)">
                <h3 class="section-title">Veri Yedekleme ve Taşıma</h3>
                <p style="color:var(--text-secondary); margin-bottom:1.5rem; font-size:0.9rem">
                    Tarayıcı hafızasındaki (LocalStorage) değişikliklerinizi bir JSON dosyası olarak indirerek yedekleyebilir veya başka bir tarayıcıya aktarabilirsiniz.
                </p>
                <div style="display:flex; gap:1rem">
                    <button class="primary-btn icon-btn" onclick="app.exportOverrides()">
                        <i data-lucide="download"></i> Değişiklikleri İndir (JSON)
                    </button>
                    <button class="icon-btn danger-btn" onclick="app.resetOverrides()">
                        <i data-lucide="trash-2"></i> Tüm Değişiklikleri Sıfırla
                    </button>
                </div>
            </div>
        </div>`;
        lucide.createIcons();
    },

    exportOverrides() {
        const data = JSON.stringify(this.overrides, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logo_erp_overrides_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    },

    resetOverrides() {
        if (!confirm('TÜM değişiklikleriniz silinecek ve orijinal JS dosyalarına dönülecektir. Bu işlem geri alınamaz. Emin misiniz?')) return;
        localStorage.removeItem('db_overrides');
        location.reload();
    },


    getFilteredTables() {
        // Orijinal tablolar + Overridelardan gelen yeni/güncel haller
        const baseTables = NETSIS_DATA.tables.map(t => {
            const override = this.overrides.tables[t.id];
            if (override) return override.current;
            return { ...t, version: 1, isActive: true };
        });

        // Tamamen yeni eklenen tablolar (orijinalde olmayanlar)
        const newTables = Object.values(this.overrides.tables)
            .filter(o => !NETSIS_DATA.tables.find(t => t.id === o.current.id))
            .map(o => o.current);

        const allTables = [...baseTables, ...newTables].filter(t => t.isActive);

        return allTables.filter(t => {
            const name = t.name || '';
            const isTiger = name.startsWith('LG_') || name.startsWith('L_');
            return this.currentERP === 'tiger' ? isTiger : !isTiger;
        });
    },

    renderModules() {
        const list = document.getElementById('module-list');
        const filteredTables = this.getFilteredTables();
        
        list.innerHTML = NETSIS_DATA.modules.map(mod => {
            const count = filteredTables.filter(t => t.module === mod.id).length;
            if (count === 0 && this.currentERP === 'tiger') return ''; // Tiger'da boş modülleri gizle
            
            return `<div class="nav-item" data-module="${mod.id}" onclick="app.showModule('${mod.id}', this)">
                <i data-lucide="${mod.icon}"></i>
                <span>${mod.name}</span>
                <span class="nav-badge">${count}</span>
            </div>`;
        }).join('');
        lucide.createIcons();
    },

    showDashboard(el) {
        this.currentModule = null;
        this.currentView = 'dashboard';
        if (el) this.setActiveNav(el);
        
        const mainView = document.getElementById('main-view');
        document.getElementById('detail-view').style.display = 'none';
        mainView.style.display = 'block';
        const filteredTables = this.getFilteredTables();
        const totalTables = filteredTables.length;
        const totalColumns = filteredTables.reduce((a, t) => a + (t.columns?.length || 0), 0);
        const totalRelations = filteredTables.reduce((a, t) => a + (t.relations?.length || 0), 0);

        // Öne çıkan istatistikler
        const sortedByCols = [...filteredTables].sort((a, b) => (b.columns?.length || 0) - (a.columns?.length || 0));
        const sortedByRels = [...filteredTables].sort((a, b) => (b.relations?.length || 0) - (a.relations?.length || 0));
        
        const mostColsTable = sortedByCols[0];
        const mostRelsTable = sortedByRels[0];

        mainView.innerHTML = `
        <div class="fade-in">
            <div class="welcome-banner">
                <div class="welcome-content">
                    <h2>Hoş Geldiniz, <span class="highlight-text">${this.currentERP.toUpperCase()} DB Explorer</span></h2>
                    <p>Veritabanı yapısını, tablolar arası ilişkileri ve SQL örneklerini tek bir yerden yönetin.</p>
                </div>
                <div class="action-bar">
                    <button class="primary-btn icon-btn" onclick="app.showAddTableForm()">
                        <i data-lucide="plus-circle"></i> Yeni Tablo
                    </button>
                    <div class="welcome-badge">
                        <i data-lucide="shield-check"></i> v2.2 Kararlı Sürüm
                    </div>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card" style="--accent: var(--accent)">
                    <div class="stat-icon"><i data-lucide="database"></i></div>
                    <div class="stat-value">${totalTables}</div>
                    <div class="stat-label">Toplam Tablo</div>
                </div>
                <div class="stat-card" style="--accent: var(--purple)">
                    <div class="stat-icon"><i data-lucide="columns-3"></i></div>
                    <div class="stat-value">${totalColumns.toLocaleString('tr-TR')}</div>
                    <div class="stat-label">Toplam Kolon</div>
                </div>
                <div class="stat-card" style="--accent: var(--success)">
                    <div class="stat-icon"><i data-lucide="git-branch"></i></div>
                    <div class="stat-value">${totalRelations}</div>
                    <div class="stat-label">İlişki Tanımı</div>
                </div>
                <div class="stat-card" style="--accent: var(--warning)">
                    <div class="stat-icon"><i data-lucide="layers"></i></div>
                    <div class="stat-value">${NETSIS_DATA.modules.length}</div>
                    <div class="stat-label">Aktif Modül</div>
                </div>
            </div>

            <div class="highlights-row">
                <div class="highlight-card" onclick="app.showTableDetail('${mostColsTable.id}')">
                    <div class="h-icon" style="background: rgba(56, 189, 248, 0.1); color: var(--accent)"><i data-lucide="layout-list"></i></div>
                    <div class="h-body">
                        <h4>En Detaylı Tablo</h4>
                        <p>${mostColsTable.name} <small>(${mostColsTable.columns?.length || 0} Kolon)</small></p>
                    </div>
                </div>
                <div class="highlight-card" onclick="app.showTableDetail('${mostRelsTable.id}')">
                    <div class="h-icon" style="background: rgba(168, 85, 247, 0.1); color: var(--purple)"><i data-lucide="network"></i></div>
                    <div class="h-body">
                        <h4>En Çok İlişkili</h4>
                        <p>${mostRelsTable.name} <small>(${(mostRelsTable.relations?.length || 0)} Bağlantı)</small></p>
                    </div>
                </div>
            </div>

            <h3 class="section-title">Veri Yapısı Analizi</h3>
            <div class="analysis-grid">
                <div class="analysis-card">
                    <div class="analysis-header">
                        <span>ERP Eşleşme Oranı</span>
                        <span class="analysis-value">${Math.round((NETSIS_TIGER_MAP.length / (totalTables/2)) * 100)}%</span>
                    </div>
                    <div class="progress-bar"><div class="progress-fill" style="width: ${Math.round((NETSIS_TIGER_MAP.length / (totalTables/2)) * 100)}%"></div></div>
                </div>
                <div class="analysis-card">
                    <div class="analysis-header">
                        <span>İlişki Yoğunluğu</span>
                        <span class="analysis-value">${(totalRelations / totalTables).toFixed(1)} x</span>
                    </div>
                    <div class="progress-bar"><div class="progress-fill" style="width: ${Math.min(100, (totalRelations / totalTables) * 20)}%; background: var(--purple)"></div></div>
                </div>
                <div class="analysis-card">
                    <div class="analysis-header">
                        <span>Önemli Kolon Oranı</span>
                        <span class="analysis-value">${Math.round((filteredTables.reduce((a, t) => a + (t.columns?.filter(c => c.important).length || 0), 0) / totalColumns) * 100)}%</span>
                    </div>
                    <div class="progress-bar"><div class="progress-fill" style="width: ${Math.round((filteredTables.reduce((a, t) => a + (t.columns?.filter(c => c.important).length || 0), 0) / totalColumns) * 100)}%; background: var(--success)"></div></div>
                </div>
            </div>

            <h3 class="section-title">Modüller</h3>
            <div class="module-grid">
                ${NETSIS_DATA.modules.map(mod => {
                    const count = filteredTables.filter(t => t.module === mod.id).length;
                    if (count === 0 && this.currentERP === 'tiger') return '';
                    return `
                    <div class="module-card" style="--card-accent: ${mod.color}" onclick="app.showModule('${mod.id}')">
                        <div class="module-card-icon" style="background: ${mod.color}20; color: ${mod.color}">
                            <i data-lucide="${mod.icon}"></i>
                        </div>
                        <div class="module-card-body">
                            <h4>${mod.name}</h4>
                            <p>${mod.desc}</p>
                            <span class="module-card-count">${count} Tablo</span>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
        lucide.createIcons();
    },

    showModule(moduleId, el) {
        this.currentModule = moduleId;
        this.currentView = 'module';
        if (el) this.setActiveNav(el);
        else {
            const navEl = document.querySelector(`[data-module="${moduleId}"]`);
            if (navEl) this.setActiveNav(navEl);
        }

        const mainView = document.getElementById('main-view');
        document.getElementById('detail-view').style.display = 'none';
        mainView.style.display = 'block';

        const mod = NETSIS_DATA.modules.find(m => m.id === moduleId);
        const filteredTables = this.getFilteredTables();
        const tables = filteredTables.filter(t => t.module === moduleId);

        mainView.innerHTML = `
        <div class="fade-in">
            <div class="page-header">
                <div class="back-btn" onclick="app.showDashboard(document.querySelector('[data-view=dashboard]'))">
                    <i data-lucide="arrow-left"></i> Dashboard
                </div>
                <h2 style="color: ${mod.color}">${mod.name}</h2>
                <p class="page-desc">${mod.desc} — ${tables.length} tablo</p>
            </div>
            <div class="table-grid">
                ${tables.map(t => this.renderTableCard(t, mod.color)).join('')}
            </div>
        </div>`;
        lucide.createIcons();
    },

    showAllTables(el) {
        this.currentView = 'all';
        if (el) this.setActiveNav(el);
        const mainView = document.getElementById('main-view');
        document.getElementById('detail-view').style.display = 'none';
        mainView.style.display = 'block';

        const filteredTables = this.getFilteredTables();

        mainView.innerHTML = `
        <div class="fade-in">
            <div class="page-header">
                <h2>Tüm Tablolar</h2>
                <p class="page-desc">${filteredTables.length} tablo listeleniyor</p>
            </div>
            <div class="table-grid">
                ${filteredTables.map(t => {
                    const mod = NETSIS_DATA.modules.find(m => m.id === t.module);
                    return this.renderTableCard(t, mod ? mod.color : '#38bdf8');
                }).join('')}
            </div>
        </div>`;
        lucide.createIcons();
    },

    renderTableCard(table, color = '#38bdf8') {
        const colCount = (table.columns || []).length;
        const relCount = (table.relations || []).length;
        const mod = NETSIS_DATA.modules.find(m => m.id === table.module);
        return `
        <div class="table-card" style="--card-accent: ${color}" onclick="app.showTableDetail('${table.id}')">
            <div class="table-card-header">
                <span class="table-name">${table.name}</span>
                <span class="table-module-tag" style="background: ${color}20; color: ${color}">${mod ? mod.name : ''}</span>
            </div>
            <div class="table-desc">${table.description}</div>
            <div class="table-card-footer">
                <span><i data-lucide="columns-3" style="width:14px;height:14px"></i> ${colCount} kolon</span>
                <span><i data-lucide="git-branch" style="width:14px;height:14px"></i> ${relCount} ilişki</span>
            </div>
        </div>`;
    },

    renderColumnRow(col) {
        return `
        <tr>
            <td>
                <div class="col-name-wrapper">
                    ${col.pk ? '<i data-lucide="key" class="pk-icon" title="Primary Key"></i>' : ''}
                    <span class="col-name ${col.pk ? 'pk' : ''}">${col.name}</span>
                </div>
            </td>
            <td><span class="col-type">${col.type}</span></td>
            <td><span class="col-desc">${col.desc || ''}</span></td>
            <td>
                <div class="col-badges">
                    ${col.important ? '<span class="badge important">Önemli</span>' : ''}
                    ${col.fk ? '<span class="badge fk">FK</span>' : ''}
                </div>
            </td>
        </tr>`;
    },

    filterColumns(val) {
        const q = val.toLowerCase();
        const rows = document.querySelectorAll('#column-table-body tr');
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(q) ? '' : 'none';
        });
    },

    showTableDetail(tableId) {
        const table = this.getFilteredTables().find(t => t.id === tableId);
        if (!table) return;

        // Otomatik ERP modu geçişi
        const name = table.name || '';
        const isTigerTable = name.startsWith('LG_') || name.startsWith('L_');
        const targetERP = isTigerTable ? 'tiger' : 'netsis';
        
        if (this.currentERP !== targetERP) {
            this.currentERP = targetERP;
            document.getElementById('btn-netsis').classList.toggle('active', targetERP === 'netsis');
            document.getElementById('btn-tiger').classList.toggle('active', targetERP === 'tiger');
            this.renderModules();
        }

        const mod = NETSIS_DATA.modules.find(m => m.id === table.module);
        const color = mod ? mod.color : '#38bdf8';

        const mainView = document.getElementById('main-view');
        const detailView = document.getElementById('detail-view');
        const detailContent = document.getElementById('detail-content');

        mainView.style.display = 'none';
        detailView.style.display = 'block';
        detailView.scrollTop = 0;

        const pkCols = (table.columns || []).filter(c => c.pk);
        
        // Mapping Info (Orijinal + Overrides birleşimi)
        let mappingContent = '';
        const allMappings = [...NETSIS_TIGER_MAP, ...this.overrides.mappings];
        const mapEntry = allMappings.find(m => m.netsis === tableId || m.tiger === tableId);
        
        if (mapEntry) {
            const oppositeERP = this.currentERP === 'netsis' ? 'Tiger' : 'Netsis';
            const oppositeId = this.currentERP === 'netsis' ? mapEntry.tiger : mapEntry.netsis;
            mappingContent = `
                <div class="mapping-box active">
                    <div class="mapping-main" onclick="app.showTableDetail('${oppositeId}')">
                        <i data-lucide="repeat"></i>
                        <div>
                            <div class="mapping-label">${oppositeERP} Karşılığı</div>
                            <div class="mapping-value">${oppositeId}</div>
                        </div>
                    </div>
                    <div class="mapping-actions">
                        <button class="icon-btn small" onclick="app.showAddMappingForm('${tableId}')" title="Eşleşmeyi Değiştir">
                            <i data-lucide="edit-2"></i>
                        </button>
                        <button class="icon-btn small danger" onclick="app.deleteMapping('${tableId}')" title="Eşleşmeyi Kaldır">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                </div>`;
        } else {
            mappingContent = `
                <div class="mapping-box empty" onclick="app.showAddMappingForm('${tableId}')">
                    <i data-lucide="link-2"></i>
                    <div>
                        <div class="mapping-label">ERP Eşleşmesi Tanımlanmamış</div>
                        <div class="mapping-value">Eşleşen tabloyu bağlamak için tıklayın</div>
                    </div>
                </div>`;
        }

        detailContent.innerHTML = `
        <div class="fade-in">
            <div class="detail-header" style="--detail-color: ${color}">
                <div class="back-btn" onclick="app.goBack()">
                    <i data-lucide="arrow-left"></i> Geri Dön
                </div>
                <div class="detail-title-row">
                    <h2 id="detail-table-name">${table.name}</h2>
                    <span class="table-module-tag" style="background: ${color}20; color: ${color}">${mod ? mod.name : ''}</span>
                    <button class="icon-btn" style="margin-left:auto" onclick="app.showEditTableForm('${table.id}')">
                        <i data-lucide="edit-3"></i> Düzenle
                    </button>
                </div>
                <p class="detail-desc">${table.description}</p>
                <div class="detail-stats">
                    <div class="detail-stat"><strong>${(table.columns || []).length}</strong> Kolon</div>
                    <div class="detail-stat"><strong>${table.relations ? table.relations.length : 0}</strong> İlişki</div>
                    <div class="detail-stat"><strong>${pkCols.length}</strong> PK</div>
                    <div class="detail-stat" title="Versiyon Geçmişi"><strong>v${table.version || 1}</strong></div>
                </div>
            </div>

            ${mappingContent}

            <div class="section-container">
                <div class="section-header-row">
                    <h3 class="section-title"><i data-lucide="columns-3"></i> Kolon Tanımları</h3>
                    <div style="display:flex; gap:0.5rem">
                        <div class="column-search-box">
                            <i data-lucide="search"></i>
                            <input type="text" placeholder="Kolonlarda ara..." oninput="app.filterColumns(this.value)">
                        </div>
                        <button class="icon-btn" onclick="app.showAddColumnForm('${table.id}')">
                            <i data-lucide="plus"></i> Ekle
                        </button>
                    </div>
                </div>
                <div class="column-table-wrapper">
                    <table class="column-table">
                        <thead>
                            <tr>
                                <th>Adı</th>
                                <th>Tip</th>
                                <th>Açıklama</th>
                                <th>Özellikler</th>
                            </tr>
                        </thead>
                        <tbody id="column-table-body">
                            ${(table.columns || []).map(c => this.renderColumnRow(c)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="section-container">
                <div class="section-header-row">
                    <h3 class="section-title"><i data-lucide="git-branch"></i> İlişkiler</h3>
                    <button class="icon-btn" onclick="app.showAddRelationForm('${table.id}')">
                        <i data-lucide="plus"></i> İlişki Ekle
                    </button>
                </div>
                <div class="relations-grid">
                    ${(table.relations || []).map((rel, idx) => {
                        const targetTable = this.getFilteredTables().find(t => t.id === rel.table);
                        const targetMod = targetTable ? NETSIS_DATA.modules.find(m => m.id === targetTable.module) : null;
                        const relColor = targetMod ? targetMod.color : '#64748b';
                        return `
                        <div class="relation-card" style="--rel-color: ${relColor}" onclick="app.showTableDetail('${rel.table}')">
                            <div class="relation-header">
                                <span class="relation-table">${rel.table}</span>
                                <button class="icon-btn" style="padding:2px" onclick="event.stopPropagation(); app.deleteRelation('${table.id}', ${idx})">
                                    <i data-lucide="trash-2" style="width:14px"></i>
                                </button>
                            </div>
                            <div class="relation-detail">
                                <span class="relation-col"><i data-lucide="link"></i> ${rel.columns ? rel.columns.join(', ') : rel.column}</span>
                                <span class="relation-desc">${targetTable ? targetTable.description : 'Hedef tablo bulunamadı'}</span>
                            </div>
                        </div>`;
                    }).join('')}
                    ${(!table.relations || table.relations.length === 0) ? '<p style="color:var(--text-muted)">Henüz ilişki tanımlanmamış.</p>' : ''}
                </div>
            </div>

            <h3 class="section-title">İlişkisel Görünüm</h3>
            <div class="mini-relation-container" id="mini-network"></div>

            <!-- Tarihçe (Audit Log) Bölümü -->
            <div class="section-container" style="margin-top:2rem">
                <h3 class="section-title"><i data-lucide="history"></i> Değişiklik Tarihçesi</h3>
                <div class="history-list">
                    ${this.renderHistory(table.id)}
                </div>
            </div>

            ${table.tips && table.tips.length > 0 ? `
            <div class="tips-section">
                <h3 class="section-title"><i data-lucide="lightbulb" style="width:18px;height:18px;color:#f59e0b"></i> İpuçları & Notlar</h3>
                <div class="tips-list">
                    ${table.tips.map(tip => `<div class="tip-item">${tip}</div>`).join('')}
                </div>
            </div>` : ''}

            <h3 class="section-title" style="margin-top:2rem">Zengin SQL Sorguları (Dinamik)</h3>
            <div class="sql-section">
                ${this.generateDynamicSQL(table).map(sql => `
                <div class="sql-block">
                    <div class="sql-header">
                        <span class="sql-label">${sql.title}</span>
                        <span class="copy-badge">Tıkla Kopyala</span>
                    </div>
                    <pre class="sql-code" onclick="app.copySQL(this)">${sql.query}</pre>
                </div>`).join('')}
            </div>
        </div>`;
        
        lucide.createIcons();
        this.renderMiniNetwork(table);
    },

    renderMiniNetwork(table) {
        const container = document.getElementById('mini-network');
        const nodes = [{ id: table.id, label: table.name, title: table.description, color: { background: '#38bdf8', border: '#0ea5e9' }, font: { color: '#fff', size: 16, bold: true }, shape: 'box', margin: 10 }];
        const edges = [];

        if (table.relations) {
            table.relations.forEach((rel, index) => {
                const targetId = rel.table;
                const targetTable = NETSIS_DATA.tables.find(t => t.id === targetId);
                const targetMod = targetTable ? NETSIS_DATA.modules.find(m => m.id === targetTable.module) : null;
                const color = targetMod ? targetMod.color : '#64748b';

                nodes.push({ 
                    id: `rel-${index}`, 
                    label: targetId, 
                    title: targetTable ? targetTable.description : '',
                    color: { background: color + '20', border: color }, 
                    font: { color: color, size: 13, bold: true }, 
                    shape: 'box', 
                    margin: 8 
                });
                
                edges.push({ 
                    from: table.id, 
                    to: `rel-${index}`, 
                    label: rel.column, 
                    font: { 
                        size: 11, 
                        color: '#94a3b8', 
                        align: 'top', 
                        strokeWidth: 0, 
                        background: 'rgba(15, 23, 42, 0.8)'
                    }, 
                    arrows: 'to', 
                    color: { color: color, opacity: 0.6 },
                    width: 2
                });
            });
        }

        const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
        const options = { 
            physics: { 
                stabilization: { iterations: 150, fit: true }, 
                barnesHut: { gravitationalConstant: -2000, springLength: 120, centralGravity: 0.5 } 
            }, 
            interaction: { dragNodes: true, zoomView: true, dragView: true, hover: true, tooltipDelay: 200 } 
        };
        const network = new vis.Network(container, data, options);
        network.once("stabilized", () => network.setOptions({ physics: { enabled: false } }));
    },

    generateDynamicSQL(table) {
        const queries = [];
        const columns = table.columns || [];
        if (columns.length === 0) return queries;

        const pk = columns.find(c => c.pk) || columns[0];
        const dateCol = columns.find(c => c.type?.includes('DATE') || c.type?.includes('TIME') || c.type?.includes('DATETIME'));
        const decimalCol = columns.find(c => c.type?.includes('DECIMAL') || c.type?.includes('NUMERIC') || c.type?.includes('FLOAT') || c.type?.includes('DOUBLE'));
        const groupCol = columns.find(c => c.important && (c.type?.includes('CHAR') || c.type?.includes('INT') || c.type?.includes('VARCHAR')));
        const impCols = columns.filter(c => c.important).map(c => c.name);

        queries.push({ title: 'Hızlı Gözlem', query: `SELECT TOP 100 * \nFROM ${table.name}\nORDER BY ${pk.name} DESC` });

        if (impCols.length > 0) {
            queries.push({ title: 'Önemli Alanlar', query: `SELECT ${impCols.join(', ')} \nFROM ${table.name}` });
        }

        if (dateCol) {
            queries.push({ title: 'Son 30 Gün', query: `SELECT * \nFROM ${table.name} \nWHERE ${dateCol.name} >= GETDATE() - 30` });
        }

        if (decimalCol && groupCol) {
            queries.push({ title: 'Özet Rapor', query: `SELECT ${groupCol.name}, \n       SUM(${decimalCol.name}) as TOPLAM \nFROM ${table.name} \nGROUP BY ${groupCol.name}` });
        }

        if (table.relations && table.relations.length > 0) {
            const rel = table.relations[0];
            queries.push({ title: 'İlişkili Kayıtlar (JOIN)', query: `SELECT A.*, B.* \nFROM ${table.name} A \nINNER JOIN ${rel.table} B \n  ON A.${rel.column} = B.${rel.column}` });
        }

        return queries;
    },

    showRelationMap(el) {
        this.currentView = 'relations';
        if (el) this.setActiveNav(el);
        const mainView = document.getElementById('main-view');
        document.getElementById('detail-view').style.display = 'none';
        mainView.style.display = 'block';

        mainView.innerHTML = `
        <div class="fade-in" style="height: 100%; position: relative;">
            <div class="page-header">
                <h2>İlişki Haritası</h2>
                <p class="page-desc">Tüm modüller arası interaktif veritabanı diyagramı</p>
            </div>
            <div class="relation-map-container">
                <div class="map-controls">
                    <select id="map-module-filter" class="map-select" onchange="app.renderFullNetwork()">
                        <option value="all">Tüm Modüller</option>
                        ${NETSIS_DATA.modules.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                    </select>
                    <button class="map-btn active" id="btn-labels" onclick="app.toggleMapLabels(this)">
                        <i data-lucide="type"></i> İsimler
                    </button>
                    <button class="map-btn active" id="btn-only-rel" onclick="app.toggleOnlyRelated(this)">
                        <i data-lucide="link"></i> Sadece İlişkililer
                    </button>
                    <button class="map-btn" onclick="app.renderFullNetwork()">
                        <i data-lucide="refresh-cw"></i> Sıfırla
                    </button>
                </div>
                <div id="relation-network">
                    <div class="map-loading">
                        <div class="spinner"></div>
                        <p>Harita Hazırlanıyor...</p>
                    </div>
                </div>
                <!-- Dinamik Bilgi Paneli -->
                <div id="map-info-panel" class="map-info-panel">
                    <div class="map-info-content">
                        <p class="map-info-hint"><i data-lucide="mouse-pointer-2"></i> Bilgi almak için tablonun üzerine gelin</p>
                    </div>
                </div>
            </div>
        </div>`;
        lucide.createIcons();
        setTimeout(() => this.renderFullNetwork(), 100);
    },

    toggleMapLabels(btn) {
        btn.classList.toggle('active');
        this.renderFullNetwork();
    },

    toggleOnlyRelated(btn) {
        btn.classList.toggle('active');
        this.renderFullNetwork();
    },

    renderFullNetwork() {
        const showLabels = document.getElementById('btn-labels')?.classList.contains('active') ?? true;
        const onlyRelated = document.getElementById('btn-only-rel')?.classList.contains('active') ?? true;
        const selectedMod = document.getElementById('map-module-filter')?.value ?? 'all';
        const isTiger = this.currentERP === 'tiger';
        
        const container = document.getElementById('relation-network');
        if (!container) return;

        container.innerHTML = '<div class="map-loading"><div class="spinner"></div><p>Harita Hazırlanıyor...</p></div>';

        let filteredTables = this.getFilteredTables();
        if (selectedMod !== 'all') {
            filteredTables = filteredTables.filter(t => t.module === selectedMod);
        }
        
        const tableIdsSet = new Set(filteredTables.map(t => t.id));
        const nodes = [];
        const edges = [];
        const edgeSet = new Set();
        
        // Tabloları tara ve düğümleri oluştur
        filteredTables.forEach(t => {
            const mod = NETSIS_DATA.modules.find(m => m.id === t.module);
            const color = mod ? mod.color : '#64748b';
            
            // Eğer "Sadece İlişkililer" aktifse, ilişkisi olmayanları atla
            const hasRel = t.relations && t.relations.some(rel => tableIdsSet.has(rel.table));
            const isTarget = Array.from(filteredTables).some(other => 
                other.relations && other.relations.some(rel => rel.table === t.id)
            );
            
            if (onlyRelated && !hasRel && !isTarget) return;

            nodes.push({ 
                id: t.id, 
                label: showLabels ? t.name : '', 
                title: '', 
                group: t.module, 
                color: { 
                    background: color + '25', 
                    border: color,
                    highlight: { background: color, border: color }
                }, 
                font: { color: '#f1f5f9', size: showLabels ? 14 : 10, bold: true },
                shape: showLabels ? 'box' : 'dot',
                size: showLabels ? 25 : 10,
                margin: 10
            });

            if (t.relations) {
                t.relations.forEach(rel => {
                    if (tableIdsSet.has(rel.table)) {
                        const edgeKey = `${t.id}-${rel.table}-${rel.column}`;
                        if (edgeSet.has(edgeKey)) return;
                        edgeSet.add(edgeKey);
                        
                        edges.push({ 
                            from: t.id, 
                            to: rel.table, 
                            label: showLabels ? rel.column : '', 
                            font: { 
                                size: 10, 
                                color: '#94a3b8', 
                                align: 'top', 
                                strokeWidth: 0, 
                                background: 'rgba(15, 23, 42, 0.8)'
                            }, 
                            arrows: 'to', 
                            color: { color: color, opacity: 0.6 },
                            width: 1.5
                        });
                    }
                });
            }
        });

        if (nodes.length === 0) {
            container.innerHTML = `<div class="empty-state">Bu modülde tablo bulunamadı.</div>`;
            return;
        }

        container.innerHTML = '';
        const networkContainer = document.createElement('div');
        networkContainer.style.width = '100%';
        networkContainer.style.height = '100%';
        container.appendChild(networkContainer);

        const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
        const isLargeNetwork = nodes.length > 50;
        
        const physicsOptions = !isTiger ? {
            enabled: true,
            solver: 'forceAtlas2Based',
            forceAtlas2Based: { 
                gravitationalConstant: -150, 
                centralGravity: 0.01, 
                springLength: 200, 
                springConstant: 0.08 
            },
            maxVelocity: 50,
            stabilization: { enabled: true, iterations: 100 }
        } : {
            enabled: true,
            solver: 'barnesHut',
            barnesHut: { 
                gravitationalConstant: -5000, 
                springLength: 200,
                centralGravity: 0.3,
                avoidOverlap: 1
            },
            stabilization: { enabled: true, iterations: 50 }
        };

        const options = { 
            physics: physicsOptions,
            layout: { improvedLayout: !isLargeNetwork },
            interaction: { 
                dragNodes: true, 
                zoomView: true, 
                dragView: true, 
                hover: true,
                tooltipDelay: 200,
                hideEdgesOnDrag: isLargeNetwork
            } 
        };
        
        const network = new vis.Network(networkContainer, data, options);

        network.once("stabilized", () => {
            network.fit();
        });
        
        // Dinamik Bilgi Paneli Olayları
        const infoPanel = document.getElementById('map-info-panel');
        const infoContent = infoPanel?.querySelector('.map-info-content');

        network.on('hoverNode', (params) => {
            const tableId = params.node;
            const table = filteredTables.find(t => t.id === tableId);
            if (table && infoContent) {
                const mod = NETSIS_DATA.modules.find(m => m.id === table.module);
                infoPanel.classList.add('active');
                infoContent.innerHTML = `
                    <div class="map-info-header">
                        <span class="mod-badge" style="background: ${mod?.color || '#64748b'}">${mod?.name || 'Genel'}</span>
                        <h4>${table.id}</h4>
                    </div>
                    <p>${table.description}</p>
                    <div class="map-info-footer">Tıklayarak tablo detayına gidebilirsiniz</div>
                `;
            }
        });

        network.on('blurNode', () => {
            if (infoPanel) {
                infoPanel.classList.remove('active');
                setTimeout(() => {
                    if (!infoPanel.classList.contains('active')) {
                        infoContent.innerHTML = '<p class="map-info-hint"><i data-lucide="mouse-pointer-2"></i> Bilgi almak için tablonun üzerine gelin</p>';
                        lucide.createIcons();
                    }
                }, 300);
            }
        });

        network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const tableId = params.nodes[0];
                const table = filteredTables.find(t => t.id === tableId);
                if (table) app.showTableDetail(table.id);
            }
        });

        // Status Bar ekle
        const statusDiv = document.createElement('div');
        statusDiv.className = 'map-status';
        statusDiv.innerHTML = `${nodes.length} Düğüm · ${edges.length} İlişki`;
        container.appendChild(statusDiv);
        
        network.on("click", (params) => {
            if (params.nodes.length > 0) this.showTableDetail(params.nodes[0]);
        });
    },

    copySQL(el) {
        navigator.clipboard.writeText(el.textContent).then(() => {
            const badge = el.parentElement.querySelector('.copy-badge');
            const originalText = badge.textContent;
            badge.textContent = 'Kopyalandı!';
            badge.style.color = '#22c55e';
            setTimeout(() => { badge.textContent = originalText; badge.style.color = ''; }, 2000);
        });
    },

    showAdvancedQueries(el) {
        this.currentView = 'queries';
        if (el) this.setActiveNav(el);
        const mainView = document.getElementById('main-view');
        document.getElementById('detail-view').style.display = 'none';
        mainView.style.display = 'block';

        mainView.innerHTML = `
        <div class="fade-in">
            <div class="page-header">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%">
                    <div>
                        <h2>Önemli & İlişkisel Sorgular</h2>
                        <p class="page-desc">Netsis ve Tiger için en çok ihtiyaç duyulan gelişmiş SQL örnekleri.</p>
                    </div>
                    <div class="query-filters">
                        <div class="column-search-box">
                            <i data-lucide="search"></i>
                            <input type="text" id="q-search" placeholder="Sorgu başlığı veya tablo ara..." oninput="app.filterAdvancedQueries()">
                        </div>
                        <select id="q-erp-filter" onchange="app.filterAdvancedQueries()" class="map-select">
                            <option value="all">Tüm ERP'ler</option>
                            <option value="netsis">Sadece Netsis</option>
                            <option value="tiger">Sadece Tiger</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="query-grid" id="advanced-query-list">
                ${this.renderAdvancedQueryList(NETSIS_DATA.queries)}
            </div>
        </div>`;
        lucide.createIcons();
    },

    filterAdvancedQueries() {
        const query = document.getElementById('q-search').value.toLowerCase();
        const erp = document.getElementById('q-erp-filter').value;
        const list = document.getElementById('advanced-query-list');
        
        const filtered = NETSIS_DATA.queries.filter(q => {
            const matchText = q.title.toLowerCase().includes(query) || q.desc.toLowerCase().includes(query) || q.sql.toLowerCase().includes(query);
            const isTiger = q.sql.includes('LG_') || q.title.toLowerCase().includes('tiger');
            const matchERP = erp === 'all' ? true : (erp === 'tiger' ? isTiger : !isTiger);
            return matchText && matchERP;
        });

        list.innerHTML = this.renderAdvancedQueryList(filtered);
        lucide.createIcons();
    },

    renderAdvancedQueryList(queries) {
        if (queries.length === 0) return '<p style="color:var(--text-muted); padding:2rem">Eşleşen sorgu bulunamadı.</p>';
        return queries.map(q => `
            <div class="query-card">
                <div class="query-card-header">
                    <div class="query-card-icon"><i data-lucide="code-2"></i></div>
                    <div class="query-card-info">
                        <div style="display:flex; justify-content:space-between; align-items:center">
                            <h4>${q.title}</h4>
                            <span class="badge ${q.sql.includes('LG_') ? 'tiger' : 'netsis'}">${q.sql.includes('LG_') ? 'Tiger' : 'Netsis'}</span>
                        </div>
                        <p>${q.desc}</p>
                    </div>
                </div>
                <div class="sql-block">
                    <div class="sql-header">
                        <span class="sql-label">SQL Sorgusu</span>
                        <span class="copy-badge">Tıkla Kopyala</span>
                    </div>
                    <pre class="sql-code" onclick="app.copySQL(this)">${q.sql}</pre>
                </div>
            </div>`).join('');
    },

    showUserQueries(el) {
        this.currentView = 'user-queries';
        if (el) this.setActiveNav(el);
        const mainView = document.getElementById('main-view');
        document.getElementById('detail-view').style.display = 'none';
        mainView.style.display = 'block';

        mainView.innerHTML = `
        <div class="fade-in">
            <div class="page-header">
                <h2>Sorgularım</h2>
                <p class="page-desc">Kendi SQL scriptlerinizi kaydedin ve yönetin.</p>
            </div>

            <div class="query-form">
                <h3 class="section-title">Yeni Sorgu Ekle</h3>
                <input type="text" id="q-title" placeholder="Sorgu Başlığı (örn: Stok KDV Listesi)">
                <input type="text" id="q-desc" placeholder="Kısa açıklama...">
                <textarea id="q-sql" placeholder="SELECT ... FROM ..."></textarea>
                <button class="primary-btn" onclick="app.saveUserQuery()">Sorguyu Kaydet</button>
            </div>

            <h3 class="section-title">Kaydedilmiş Sorgular</h3>
            <div class="query-grid">
                ${this.userQueries.length === 0 ? '<p style="color: var(--text-muted)">Henüz kayıtlı sorgu yok.</p>' : 
                this.userQueries.map(q => `
                <div class="query-card">
                    <div class="query-card-header">
                        <div class="query-card-icon"><i data-lucide="save"></i></div>
                        <div class="query-card-info">
                            <div style="display:flex; justify-content:space-between; align-items:center">
                                <h4>${q.title}</h4>
                                <button class="icon-btn" onclick="app.deleteUserQuery(${q.id})" style="color:var(--danger); border-color:transparent">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                            <p>${q.desc}</p>
                            <small style="color:var(--text-muted)">${q.date}</small>
                        </div>
                    </div>
                    <div class="sql-block">
                        <div class="sql-header">
                            <span class="sql-label">SQL Sorgusu</span>
                            <span class="copy-badge">Tıkla Kopyala</span>
                        </div>
                        <pre class="sql-code" onclick="app.copySQL(this)">${q.sql}</pre>
                    </div>
                </div>`).join('')}
            </div>
        </div>`;
        lucide.createIcons();
    },

    goBack() {
        document.getElementById('detail-view').style.display = 'none';
        document.getElementById('main-view').style.display = 'block';
        if (this.currentView === 'module' && this.currentModule) {
            this.showModule(this.currentModule);
        } else if (this.currentView === 'all') {
            this.showAllTables();
        } else if (this.currentView === 'relations') {
            this.showRelationMap();
        } else if (this.currentView === 'queries') {
            this.showAdvancedQueries();
        } else if (this.currentView === 'user-queries') {
            this.showUserQueries();
        } else {
            this.showDashboard();
        }
    },

    handleSearch(query) {
        if (!query || query.trim().length < 2) {
            if (this.currentView === 'search') this.goBack();
            return;
        }
        
        this.currentView = 'search';
        const mainView = document.getElementById('main-view');
        document.getElementById('detail-view').style.display = 'none';
        mainView.style.display = 'block';

        const q = query.toLowerCase().trim();
        const filteredTables = this.getFilteredTables();
        
        const results = filteredTables.filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            (t.columns || []).some(c => c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q))
        );

        const columnMatches = [];
        filteredTables.forEach(t => {
            (t.columns || []).forEach(c => {
                if (c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)) {
                    columnMatches.push({ table: t, column: c });
                }
            });
        });

        mainView.innerHTML = `
        <div class="fade-in">
            <div class="page-header">
                <h2>Arama: "${query}"</h2>
                <p class="page-desc">${results.length} tablo, ${columnMatches.length} kolon eşleşmesi</p>
            </div>
            ${results.length > 0 ? `
            <h3 class="section-title">Eşleşen Tablolar</h3>
            <div class="table-grid">
                ${results.map(t => {
                    const mod = NETSIS_DATA.modules.find(m => m.id === t.module);
                    const color = mod ? mod.color : '#38bdf8';
                    const colCount = (t.columns || []).length;
                    const relCount = (t.relations || []).length;
                    
                    return `
                    <div class="table-card" style="--card-accent: ${color}" onclick="app.showTableDetail('${t.id}')">
                        <div class="table-card-header">
                            <span class="table-name">${this.highlight(t.name, query)}</span>
                            <span class="table-module-tag" style="background: ${color}20; color: ${color}">${mod ? mod.name : ''}</span>
                        </div>
                        <div class="table-desc">${this.highlight(t.description, query)}</div>
                        <div class="table-card-footer">
                            <span><i data-lucide="columns-3" style="width:14px;height:14px"></i> ${colCount} kolon</span>
                            <span><i data-lucide="git-branch" style="width:14px;height:14px"></i> ${relCount} ilişki</span>
                        </div>
                    </div>`;
                }).join('')}
            </div>` : ''}
            ${columnMatches.length > 0 ? `
            <h3 class="section-title" style="margin-top:2rem">Eşleşen Kolonlar</h3>
            <div class="column-match-list">
                ${columnMatches.slice(0, 50).map(m => `
                <div class="column-match-item" onclick="app.showTableDetail('${m.table.id}')">
                    <span class="cm-table">${m.table.name}</span>
                    <span class="cm-dot">.</span>
                    <span class="cm-col">${this.highlight(m.column.name, query)}</span>
                    <span class="cm-type">${m.column.type}</span>
                    <span class="cm-desc">${this.highlight(m.column.desc, query)}</span>
                </div>`).join('')}
            </div>` : ''}
            ${results.length === 0 && columnMatches.length === 0 ? '<p style="color: var(--text-secondary); padding: 2rem;">Sonuç bulunamadı.</p>' : ''}
        </div>`;
        lucide.createIcons();
    },

    exportAllData() {
        const blob = new Blob([JSON.stringify(NETSIS_DATA, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'netsis_db_dictionary.json';
        a.click();
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
