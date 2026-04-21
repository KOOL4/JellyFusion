/**
 * JellyFusion — Client-side configuration UI
 * Handles: tab navigation, config load/save, live badge preview,
 * theme switching, studios management, color pickers.
 */
(function () {
    'use strict';

    const API = '/jellyfusion';

    // ── Themes definition (mirrors ThemeService.cs) ─────────────
    const THEMES = [
        { id: 'Default',       label: 'Predeterminado', bg: '#101010', primary: '#00a4dc', font: 'inherit' },
        { id: 'Netflix',       label: 'Netflix',        bg: '#141414', primary: '#e50914', font: 'Georgia, serif' },
        { id: 'PrimeVideo',    label: 'Prime Video',    bg: '#0f171e', primary: '#00a8e1', font: 'Arial, sans-serif' },
        { id: 'DisneyPlus',    label: 'Disney+',        bg: '#040714', primary: '#0063e5', font: 'Avenir, Arial, sans-serif' },
        { id: 'AppleTvPlus',   label: 'Apple TV+',      bg: '#000000', primary: '#ffffff', font: '-apple-system, Helvetica Neue, sans-serif' },
        { id: 'Crunchyroll',   label: 'Crunchyroll',    bg: '#1a1a1a', primary: '#f47521', font: 'Arial Black, sans-serif' },
        { id: 'ParamountPlus', label: 'Paramount+',     bg: '#0d2040', primary: '#0056b8', font: 'Helvetica Neue, Arial, sans-serif' },
    ];

    // ── Badge keys for custom badge grid ───────────────────────
    const BADGE_KEYS = [
        { key: '4K',          label: '4K' },
        { key: '1080p',       label: '1080p' },
        { key: '720p',        label: '720p' },
        { key: 'SD',          label: 'SD' },
        { key: 'HDR10',       label: 'HDR10' },
        { key: 'HDR10Plus',   label: 'HDR10+' },
        { key: 'DolbyVision', label: 'DV' },
        { key: 'HLG',         label: 'HLG' },
        { key: 'DolbyAtmos',  label: 'ATMOS' },
        { key: 'DTSX',        label: 'DTS:X' },
        { key: 'TrueHD',      label: 'TrueHD' },
        { key: 'DTSHD',       label: 'DTS-HD' },
        { key: '7.1',         label: '7.1' },
        { key: '5.1',         label: '5.1' },
        { key: 'Stereo',      label: 'STEREO' },
        { key: 'HEVC',        label: 'HEVC' },
        { key: 'AV1',         label: 'AV1' },
        { key: 'VP9',         label: 'VP9' },
        { key: 'NEW',         label: 'NUEVO', color: '#6fcf6f' },
        { key: 'KID',         label: 'KID',   color: '#f0a050' },
        { key: 'SUB',         label: 'SUB',   color: '#aaa' },
        { key: 'LAT',         label: 'LAT',   color: '#ddd' },
    ];

    let _config = null;
    let _studios = [];
    let _editingStudioIndex = -1;

    // ── Init ─────────────────────────────────────────────────────
    document.addEventListener('viewshow', async function (e) {
        if (!document.getElementById('JellyFusionConfigPage')) return;
        await init();
    });

    // Also fire on plain DOMContentLoaded (direct page load in dashboard)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.getElementById('JellyFusionConfigPage')) init();
        });
    } else {
        if (document.getElementById('JellyFusionConfigPage')) init();
    }

    async function init() {
        buildThemeGrid();
        buildCustomBadgeGrid();
        bindTabSwitching();
        bindColorPickers();
        bindButtons();
        await loadConfig();
        await loadCacheStats();
        bindPreviewSearch();
    }

    // ── Tab switching ───────────────────────────────────────────
    function bindTabSwitching() {
        document.querySelectorAll('.jf-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.jf-tab').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.jf-panel').forEach(p => p.style.display = 'none');
                btn.classList.add('active');
                const panel = document.getElementById('jf-tab-' + btn.dataset.tab);
                if (panel) panel.style.display = 'block';
            });
        });
    }

    // ── Config load ─────────────────────────────────────────────
    async function loadConfig() {
        try {
            const res = await ApiClient.ajax({ url: API + '/config', type: 'GET' });
            _config   = res;
            populateForm(_config);
        } catch (err) {
            showToast('Error cargando configuración', 'error');
            console.error('JellyFusion config load error:', err);
        }
    }

    function populateForm(cfg) {
        // Language
        setVal('jf-language', cfg.Language);

        // ── Slider ──
        const sl = cfg.Slider;
        setChecked('slider-enabled', sl.Enabled);
        setRadio('slider-mode', sl.Mode);
        setChecked('trailer-enabled', sl.TrailerEnabled);
        setVal('trailer-source', sl.TrailerSource);
        setVal('tmdb-api-key', sl.TmdbApiKey || '');
        setVal('trailer-lang', sl.TrailerLanguage);
        setChecked('trailer-sub-fallback', sl.TrailerSubtitleFallback);
        setChecked('autoplay-enabled', sl.AutoplayEnabled);
        setVal('autoplay-interval', sl.AutoplayInterval);
        setVal('slider-max-items', sl.MaxItems);
        setVal('slider-min-community', sl.MinCommunityRating);
        setVal('slider-min-critic', sl.MinCriticRating);
        setVal('slider-parental', sl.MaxParentalRating);
        setChecked('slider-show-played', sl.ShowPlayedItems);
        setVal('slider-heading', sl.BannerHeading || '');
        setChecked('slider-show-playbtn', sl.ShowPlayButton);
        setVal('slider-play-text', sl.CustomPlayButtonText || '');
        setChecked('slider-show-rating', sl.ShowCommunityRating);
        setChecked('slider-show-desc', sl.ShowDescription);
        setChecked('slider-hide-tv', sl.HideOnTv);
        setChecked('slider-hero', sl.UseHeroDisplayStyle);
        setVal('slider-img-pos', sl.ImagePosition);
        setVal('slider-transition', sl.TransitionEffect);
        setVal('slider-height', sl.BannerHeight);
        setChecked('slider-injection', sl.ClientScriptInjection);
        setChecked('slider-filetrans', sl.UseFileTransformation);
        setChecked('slider-reduce', sl.ReduceImageSizes);

        // ── Badges ──
        const bd = cfg.Badges;
        setChecked('badges-enabled', bd.Enabled);
        setChecked('badges-posters', bd.EnableOnPosters);
        setChecked('thumb-same', bd.ThumbSameAsPoster);
        setVal('thumb-reduction', bd.ThumbSizeReduction);
        setVal('badge-position', bd.Language.Position);
        setVal('badge-size', bd.Language.BadgeSize);
        setVal('badge-gap', bd.Language.Gap);
        setVal('badge-margin', bd.Language.Margin);
        setVal('badge-layout', bd.Language.Layout);
        setVal('badge-style', bd.Language.BadgeStyle);
        setVal('lat-flag', bd.Language.LatinFlagStyle);
        setVal('lat-text', bd.Language.LatinText);
        setChecked('lat-country', bd.Language.ShowProductionCountryFlag);
        setChecked('sub-simple', bd.Language.SimplifiedSubMode);
        setVal('sub-threshold', bd.Language.SubThreshold);
        setVal('sub-text', bd.Language.SubText);
        setChecked('new-enabled', bd.Status.NewEnabled);
        setVal('new-days', bd.Status.NewDaysThreshold);
        setVal('new-text', bd.Status.NewText);
        setColorPair('new-bg', bd.Status.NewBgColor);
        setColorPair('new-fg', bd.Status.NewTextColor);
        setChecked('kid-enabled', bd.Status.KidEnabled);
        setVal('kid-text', bd.Status.KidText);
        setVal('kid-detect', bd.Status.KidDetectionMode);
        setColorPair('kid-bg', bd.Status.KidBgColor);
        setColorPair('kid-fg', bd.Status.KidTextColor);
        setVal('cache-duration', bd.CacheDurationHours);
        setVal('output-format', bd.OutputFormat);
        setVal('jpeg-quality', bd.JpegQuality);

        // Custom badge text
        document.querySelectorAll('.jf-badge-text').forEach(input => {
            const key = input.dataset.key;
            input.value = bd.CustomText[key] || '';
        });

        // ── Studios ──
        const st = cfg.Studios;
        setChecked('studios-enabled', st.Enabled);
        setVal('studios-section-title', st.SectionTitle);
        setVal('studios-img-style', st.ImageStyle);
        setVal('studios-card-w', st.CardWidth);
        setVal('studios-card-h', st.CardHeight);
        setVal('studios-radius', st.BorderRadius);
        setChecked('studios-show-name', st.ShowName);
        setChecked('studios-hover', st.HoverEffect);
        _studios = st.Items || [];
        renderStudiosList();

        // ── Themes ──
        const th = cfg.Theme;
        selectTheme(th.ActiveTheme);
        setColorPair('theme-primary', th.PrimaryColor || '#00a4dc');
        setColorPair('theme-bg', th.BackgroundColor || '#101010');
        setVal('theme-font', th.FontFamily || '');

        // ── Notifications ──
        const nt = cfg.Notifications;
        setChecked('notif-new', nt.NotifyNewContent);
        setChecked('notif-kid', nt.NotifyKidContent);
        setChecked('discord-enabled', nt.Discord.Enabled);
        setVal('discord-webhook', nt.Discord.WebhookUrl || '');
        setChecked('telegram-enabled', nt.Telegram.Enabled);
        setVal('telegram-token', nt.Telegram.BotToken || '');
        setVal('telegram-chatid', nt.Telegram.ChatId || '');
    }

    // ── Config save ─────────────────────────────────────────────
    function buildConfig() {
        const customText = {};
        document.querySelectorAll('.jf-badge-text').forEach(input => {
            if (input.value.trim()) customText[input.dataset.key] = input.value.trim();
        });

        return {
            Language: getVal('jf-language'),
            Slider: {
                Enabled:                getChecked('slider-enabled'),
                Mode:                   getRadio('slider-mode'),
                TrailerEnabled:         getChecked('trailer-enabled'),
                TrailerSource:          getVal('trailer-source'),
                TmdbApiKey:             getVal('tmdb-api-key') || null,
                TrailerLanguage:        getVal('trailer-lang'),
                TrailerSubtitleFallback:getChecked('trailer-sub-fallback'),
                AutoplayEnabled:        getChecked('autoplay-enabled'),
                AutoplayInterval:       parseInt(getVal('autoplay-interval')),
                MaxItems:               parseInt(getVal('slider-max-items')),
                MinCommunityRating:     parseFloat(getVal('slider-min-community')),
                MinCriticRating:        parseInt(getVal('slider-min-critic')),
                MaxParentalRating:      getVal('slider-parental'),
                ShowPlayedItems:        getChecked('slider-show-played'),
                BannerHeading:          getVal('slider-heading') || null,
                ShowPlayButton:         getChecked('slider-show-playbtn'),
                CustomPlayButtonText:   getVal('slider-play-text') || null,
                ShowCommunityRating:    getChecked('slider-show-rating'),
                ShowDescription:        getChecked('slider-show-desc'),
                HideOnTv:               getChecked('slider-hide-tv'),
                UseHeroDisplayStyle:    getChecked('slider-hero'),
                ImagePosition:          getVal('slider-img-pos'),
                TransitionEffect:       getVal('slider-transition'),
                BannerHeight:           getVal('slider-height'),
                ClientScriptInjection:  getChecked('slider-injection'),
                UseFileTransformation:  getChecked('slider-filetrans'),
                ReduceImageSizes:       getChecked('slider-reduce'),
            },
            Badges: {
                Enabled:            getChecked('badges-enabled'),
                EnableOnPosters:    getChecked('badges-posters'),
                EnableOnThumbs:     true,
                ThumbSameAsPoster:  getChecked('thumb-same'),
                ThumbSizeReduction: parseInt(getVal('thumb-reduction')),
                BadgeOrder:         getBadgeOrder(),
                Language: {
                    Enabled:                  true,
                    Position:                 getVal('badge-position'),
                    BadgeSize:                parseInt(getVal('badge-size')),
                    Gap:                      parseInt(getVal('badge-gap')),
                    Margin:                   parseInt(getVal('badge-margin')),
                    Layout:                   getVal('badge-layout'),
                    BadgeStyle:               getVal('badge-style'),
                    LatinFlagStyle:           getVal('lat-flag'),
                    LatinText:                getVal('lat-text'),
                    ShowProductionCountryFlag:getChecked('lat-country'),
                    SimplifiedSubMode:        getChecked('sub-simple'),
                    SubThreshold:             parseInt(getVal('sub-threshold')),
                    SubText:                  getVal('sub-text'),
                },
                Status: {
                    NewEnabled:       getChecked('new-enabled'),
                    NewDaysThreshold: parseInt(getVal('new-days')),
                    NewText:          getVal('new-text'),
                    NewBgColor:       getVal('new-bg-hex'),
                    NewTextColor:     getVal('new-fg-hex'),
                    KidEnabled:       getChecked('kid-enabled'),
                    KidText:          getVal('kid-text'),
                    KidDetectionMode: getVal('kid-detect'),
                    KidBgColor:       getVal('kid-bg-hex'),
                    KidTextColor:     getVal('kid-fg-hex'),
                },
                CustomText:       customText,
                CacheDurationHours: parseInt(getVal('cache-duration')),
                OutputFormat:       getVal('output-format'),
                JpegQuality:        parseInt(getVal('jpeg-quality')),
            },
            Studios: {
                Enabled:      getChecked('studios-enabled'),
                SectionTitle: getVal('studios-section-title'),
                ImageStyle:   getVal('studios-img-style'),
                CardWidth:    parseInt(getVal('studios-card-w')),
                CardHeight:   parseInt(getVal('studios-card-h')),
                BorderRadius: parseInt(getVal('studios-radius')),
                ShowName:     getChecked('studios-show-name'),
                HoverEffect:  getChecked('studios-hover'),
                Items:        _studios,
            },
            Theme: {
                ActiveTheme:    document.querySelector('.jf-theme-card.selected')?.dataset.theme || 'Default',
                PrimaryColor:   getVal('theme-primary-hex') || null,
                BackgroundColor:getVal('theme-bg-hex') || null,
                FontFamily:     getVal('theme-font') || null,
            },
            Notifications: {
                NotifyNewContent: getChecked('notif-new'),
                NotifyKidContent: getChecked('notif-kid'),
                Discord: {
                    Enabled:    getChecked('discord-enabled'),
                    WebhookUrl: getVal('discord-webhook') || null,
                },
                Telegram: {
                    Enabled:  getChecked('telegram-enabled'),
                    BotToken: getVal('telegram-token') || null,
                    ChatId:   getVal('telegram-chatid') || null,
                },
            },
        };
    }

    async function saveConfig(module) {
        try {
            const cfg = buildConfig();
            await ApiClient.ajax({
                url:         API + '/config',
                type:        'POST',
                contentType: 'application/json',
                data:        JSON.stringify(cfg)
            });
            showToast('✅ Configuración guardada');
        } catch (err) {
            showToast('❌ Error al guardar', 'error');
            console.error('JellyFusion save error:', err);
        }
    }

    // ── Buttons ─────────────────────────────────────────────────
    function bindButtons() {
        // Save buttons
        document.querySelectorAll('.jf-btn-save').forEach(btn => {
            btn.addEventListener('click', () => saveConfig(btn.dataset.module));
        });

        // Cache
        document.getElementById('btn-clear-cache')?.addEventListener('click', async () => {
            await ApiClient.ajax({ url: API + '/badges/cache/clear', type: 'POST' });
            showToast('🗑 Caché limpiada');
            await loadCacheStats();
        });

        // Export / Import
        document.getElementById('btn-export-config')?.addEventListener('click', exportConfig);
        document.getElementById('btn-import-config')?.addEventListener('click', () =>
            document.getElementById('import-file-input')?.click());
        document.getElementById('import-file-input')?.addEventListener('change', importConfig);

        // Reset all
        document.getElementById('btn-reset-all')?.addEventListener('click', async () => {
            if (!confirm('¿Restablecer toda la configuración a los valores por defecto?')) return;
            _config = null;
            await ApiClient.ajax({ url: API + '/config', type: 'POST',
                contentType: 'application/json', data: JSON.stringify({}) });
            await loadConfig();
            showToast('↺ Configuración restablecida');
        });

        // Reset theme
        document.getElementById('btn-reset-theme')?.addEventListener('click', () => {
            selectTheme('Default');
            showToast('↺ Tema restablecido');
        });

        // Studios
        document.getElementById('btn-add-studio')?.addEventListener('click', () => {
            _editingStudioIndex = -1;
            clearStudioForm();
            document.getElementById('add-studio-form').style.display = 'block';
        });
        document.getElementById('btn-studio-cancel')?.addEventListener('click', () =>
            document.getElementById('add-studio-form').style.display = 'none');
        document.getElementById('btn-studio-save')?.addEventListener('click', saveStudio);
        document.getElementById('studio-link-mode')?.addEventListener('change', e =>
            document.getElementById('studio-custom-url-group').style.display =
                e.target.value === 'CustomUrl' ? 'block' : 'none');

        // Notifications test
        document.getElementById('btn-test-discord')?.addEventListener('click', async () => {
            await ApiClient.ajax({ url: API + '/notifications/test/discord', type: 'POST' });
            showToast('🧪 Notificación de prueba enviada a Discord');
        });
        document.getElementById('btn-test-telegram')?.addEventListener('click', async () => {
            await ApiClient.ajax({ url: API + '/notifications/test/telegram', type: 'POST' });
            showToast('🧪 Notificación de prueba enviada a Telegram');
        });

        // Language change
        document.getElementById('jf-language')?.addEventListener('change', e => {
            document.documentElement.lang = e.target.value;
        });

        // Preview refresh
        document.getElementById('btn-refresh-preview')?.addEventListener('click', triggerPreview);
    }

    // ── Theme grid ───────────────────────────────────────────────
    function buildThemeGrid() {
        const grid = document.getElementById('theme-grid');
        if (!grid) return;
        grid.innerHTML = THEMES.map(t => `
            <div class="jf-theme-card" data-theme="${t.id}" onclick="window._jfSelectTheme('${t.id}')"
                 style="border:2px solid transparent">
                <div class="jf-theme-preview" style="background:${t.bg};color:${t.primary};font-family:${t.font}">
                    ${t.label}
                </div>
                <div class="jf-theme-name">${t.label}</div>
            </div>`).join('');
        window._jfSelectTheme = selectTheme;
    }

    function selectTheme(id) {
        document.querySelectorAll('.jf-theme-card').forEach(c => {
            c.style.borderColor = c.dataset.theme === id ? 'var(--jf-primary, #00a4dc)' : 'transparent';
            c.classList.toggle('selected', c.dataset.theme === id);
        });
        const theme = THEMES.find(t => t.id === id);
        if (theme) {
            setColorPair('theme-primary', theme.primary);
            setColorPair('theme-bg', theme.bg);
            setVal('theme-font', theme.font === 'inherit' ? '' : theme.font);
        }
    }

    // ── Custom badge grid ────────────────────────────────────────
    function buildCustomBadgeGrid() {
        const grid = document.getElementById('custom-badge-grid');
        if (!grid) return;
        grid.innerHTML = BADGE_KEYS.map(b => `
            <div class="jf-badge-item" id="badge-item-${b.key}">
                <div class="jf-badge-img" style="color:${b.color || '#ccc'}"
                     onclick="document.getElementById('badge-upload-${b.key}').click()">
                    ${b.label}
                </div>
                <span class="jf-badge-label">${b.label}</span>
                <button class="jf-badge-reset" title="Revertir"
                        onclick="window._jfResetBadge('${b.key}')">✕</button>
                <input type="file" id="badge-upload-${b.key}" accept=".svg,.png,.jpg,.jpeg"
                       style="display:none" onchange="window._jfUploadBadge('${b.key}', this)">
            </div>`).join('');

        window._jfUploadBadge = uploadCustomBadge;
        window._jfResetBadge  = resetCustomBadge;
    }

    async function uploadCustomBadge(key, input) {
        const file = input.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        await fetch(`${API}/badges/custom/${key}`, { method: 'POST', body: fd });
        showToast(`✅ Badge "${key}" actualizado`);
        input.value = '';
    }

    async function resetCustomBadge(key) {
        await ApiClient.ajax({ url: `${API}/badges/custom/${key}`, type: 'DELETE' });
        showToast(`↺ Badge "${key}" restablecido`);
    }

    // ── Studios ──────────────────────────────────────────────────
    function renderStudiosList() {
        const list = document.getElementById('studios-list');
        if (!list) return;
        if (_studios.length === 0) {
            list.innerHTML = '<p class="jf-hint">No hay estudios configurados. Agrega uno con el botón +</p>';
            return;
        }
        list.innerHTML = _studios.map((s, i) => `
            <div class="jf-studio-row">
                ${s.LogoUrl ? `<img src="${s.LogoUrl}" class="jf-studio-thumb" alt="${s.Name}">` :
                    `<div class="jf-studio-thumb-placeholder">${s.Name.charAt(0)}</div>`}
                <span class="jf-studio-name">${s.Name}</span>
                <div class="jf-studio-actions">
                    <button class="emby-button" onclick="window._jfEditStudio(${i})">✏️</button>
                    <button class="emby-button" onclick="window._jfDeleteStudio(${i})">🗑</button>
                </div>
            </div>`).join('');

        window._jfEditStudio   = editStudio;
        window._jfDeleteStudio = deleteStudio;
    }

    function saveStudio() {
        const name = getVal('studio-name-input').trim();
        if (!name) { showToast('El nombre del estudio es obligatorio', 'error'); return; }
        const studio = {
            Name:      name,
            LogoUrl:   getVal('studio-logo-input') || null,
            LinkMode:  getVal('studio-link-mode'),
            CustomUrl: getVal('studio-custom-url') || null,
            SortOrder: _editingStudioIndex >= 0 ? _studios[_editingStudioIndex].SortOrder : _studios.length
        };
        if (_editingStudioIndex >= 0) _studios[_editingStudioIndex] = studio;
        else _studios.push(studio);
        renderStudiosList();
        document.getElementById('add-studio-form').style.display = 'none';
        clearStudioForm();
    }

    function editStudio(i) {
        _editingStudioIndex = i;
        const s = _studios[i];
        setVal('studio-name-input', s.Name);
        setVal('studio-logo-input', s.LogoUrl || '');
        setVal('studio-link-mode', s.LinkMode);
        setVal('studio-custom-url', s.CustomUrl || '');
        document.getElementById('studio-custom-url-group').style.display =
            s.LinkMode === 'CustomUrl' ? 'block' : 'none';
        document.getElementById('add-studio-form').style.display = 'block';
    }

    function deleteStudio(i) {
        if (!confirm(`¿Eliminar el estudio "${_studios[i].Name}"?`)) return;
        _studios.splice(i, 1);
        renderStudiosList();
    }

    function clearStudioForm() {
        setVal('studio-name-input', '');
        setVal('studio-logo-input', '');
        setVal('studio-link-mode', 'Auto');
        setVal('studio-custom-url', '');
        document.getElementById('studio-custom-url-group').style.display = 'none';
    }

    // ── Badge order drag (simple click-to-reorder) ───────────────
    function getBadgeOrder() {
        return Array.from(document.querySelectorAll('.jf-sortable-item'))
            .map(el => el.dataset.key);
    }

    // ── Color pickers ───────────────────────────────────────────
    function bindColorPickers() {
        const pairs = [
            ['new-bg', 'new-bg-hex'],
            ['new-fg', 'new-fg-hex'],
            ['kid-bg', 'kid-bg-hex'],
            ['kid-fg', 'kid-fg-hex'],
            ['theme-primary', 'theme-primary-hex'],
            ['theme-bg',      'theme-bg-hex'],
        ];
        pairs.forEach(([pickerId, hexId]) => {
            const picker = document.getElementById(pickerId + '-color');
            const hex    = document.getElementById(hexId);
            if (picker && hex) {
                picker.addEventListener('input', () => { hex.value = picker.value; });
                hex.addEventListener('input', () => {
                    if (/^#[0-9a-f]{6}$/i.test(hex.value)) picker.value = hex.value;
                });
            }
        });
    }

    function setColorPair(prefix, value) {
        const picker = document.getElementById(prefix + '-color');
        const hex    = document.getElementById(prefix + '-hex');
        if (picker) picker.value = value;
        if (hex)    hex.value    = value;
    }

    // ── Cache stats ─────────────────────────────────────────────
    async function loadCacheStats() {
        try {
            const s   = await ApiClient.ajax({ url: API + '/badges/cache/stats', type: 'GET' });
            const el  = document.getElementById('cache-stats');
            if (el) el.textContent =
                `${s.files} archivos | ${s.sizeMb} MB | más antiguo: ${s.oldest || 'N/A'}`;
        } catch { /* not critical */ }
    }

    // ── Export / Import config ───────────────────────────────────
    function exportConfig() {
        const cfg  = buildConfig();
        const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'jellyfusion-config.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    function importConfig(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async ev => {
            try {
                const cfg = JSON.parse(ev.target.result);
                await ApiClient.ajax({ url: API + '/config', type: 'POST',
                    contentType: 'application/json', data: JSON.stringify(cfg) });
                await loadConfig();
                showToast('✅ Configuración importada');
            } catch {
                showToast('❌ Error al importar el archivo', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    // ── Live preview ─────────────────────────────────────────────
    function bindPreviewSearch() {
        let timer;
        document.getElementById('preview-search')?.addEventListener('input', e => {
            clearTimeout(timer);
            timer = setTimeout(() => searchPreview(e.target.value), 600);
        });
    }

    function triggerPreview() {
        searchPreview(getVal('preview-search'));
    }

    async function searchPreview(query) {
        if (!query || query.length < 2) return;
        const area = document.getElementById('preview-area');
        area.innerHTML = '<p class="jf-hint" style="text-align:center;padding:16px">Buscando...</p>';

        try {
            const results = await ApiClient.ajax({
                url: `/Items?searchTerm=${encodeURIComponent(query)}&IncludeItemTypes=Movie,Series&Limit=3&Recursive=true`,
                type: 'GET'
            });

            if (!results.Items || results.Items.length === 0) {
                area.innerHTML = '<p class="jf-hint" style="text-align:center;padding:16px">Sin resultados</p>';
                return;
            }

            area.innerHTML = results.Items.map(item => `
                <div class="jf-preview-card">
                    <div class="jf-preview-poster-wrap">
                        <img class="jf-preview-poster"
                             src="/Items/${item.Id}/Images/Primary?quality=60&maxWidth=120&tag=${item.ImageTags?.Primary || ''}"
                             alt="${item.Name}" loading="lazy">
                        <div class="jf-preview-badge-overlay">
                            ${buildPreviewBadges(item)}
                        </div>
                    </div>
                    <div class="jf-preview-info">
                        <div class="jf-preview-title">${item.Name}</div>
                        <div class="jf-preview-meta">${item.ProductionYear || ''}</div>
                    </div>
                </div>`).join('');
        } catch (err) {
            area.innerHTML = '<p class="jf-hint" style="text-align:center">Error al cargar preview</p>';
        }
    }

    function buildPreviewBadges(item) {
        const newDays = parseInt(getVal('new-days')) || 30;
        const newText = getVal('new-text') || 'NUEVO';
        const kidText = getVal('kid-text') || 'KID';
        const latText = getVal('lat-text') || 'LAT';
        const subText = getVal('sub-text') || 'SUB';

        let badges = '';

        // Resolution from OfficialRating or VideoInfo placeholder
        if (item.Width >= 3840) badges += badge('4K',   '#1e3a5f', '#6ec6ff');
        else if (item.Width >= 1920) badges += badge('1080p','#1e3a5f','#6ec6ff');

        // NUEVO
        if (item.DateCreated) {
            const days = (Date.now() - new Date(item.DateCreated).getTime()) / 86400000;
            if (days <= newDays) badges += badge(newText, getVal('new-bg-hex') || '#1a3a1a', getVal('new-fg-hex') || '#6fcf6f');
        }

        // KID
        const kidRatings = ['G', 'TV-Y', 'TV-Y7', 'TV-G', 'PG'];
        if (item.OfficialRating && kidRatings.includes(item.OfficialRating))
            badges += badge(kidText, getVal('kid-bg-hex') || '#3a2a1a', getVal('kid-fg-hex') || '#f0a050');

        return badges || badge('…', '#1e1e1e', '#555');
    }

    function badge(text, bg, fg) {
        return `<span class="jf-preview-badge" style="background:${bg};color:${fg}">${text}</span>`;
    }

    // ── Helpers ──────────────────────────────────────────────────
    function setVal(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value ?? '';
    }
    function getVal(id) {
        return document.getElementById(id)?.value ?? '';
    }
    function setChecked(id, value) {
        const el = document.getElementById(id);
        if (el) el.checked = !!value;
    }
    function getChecked(id) {
        return document.getElementById(id)?.checked ?? false;
    }
    function setRadio(name, value) {
        const el = document.querySelector(`input[name="${name}"][value="${value}"]`);
        if (el) el.checked = true;
    }
    function getRadio(name) {
        return document.querySelector(`input[name="${name}"]:checked`)?.value ?? '';
    }

    function showToast(msg, type = 'success') {
        const el = document.getElementById('jf-toast');
        if (!el) return;
        el.textContent  = msg;
        el.className    = 'jf-toast jf-toast-' + type;
        el.style.display = 'block';
        setTimeout(() => { el.style.display = 'none'; }, 3000);
    }

})();
