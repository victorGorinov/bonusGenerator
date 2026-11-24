/**
 * Profile & Brands page.
 *
 * Two blocks:
 *   • Account — name/company/position/timezone (PATCH /api/brands/profile) plus
 *     read-only plan + quota state.
 *   • Brands  — CRUD over the brand list. A brand holds the tool inputs that
 *     stay constant for an operator; every generator's brand picker seeds its
 *     form from the ACTIVE one (see brand-context.js).
 *
 * Guests get the same UI backed by localStorage (one brand), so the mechanic is
 * demoable before signup and migrates into the account on registration.
 */
(function () {
  var BC = window.BrandContext;

  // ── i18n ───────────────────────────────────────────────────────────────────
  var I18N = {
    en: {
      account: 'Account', accountSub: 'Shown in the app only — never sent to any tool.',
      name: 'Name', email: 'Email', company: 'Company', position: 'Role', timezone: 'Timezone',
      plan: 'Plan', save: 'Save', saved: 'Saved',
      brands: 'Brands', brandsSub: 'A brand stores the inputs every tool asks for. Pick it in any form and the fields are pre-filled — you can still change any of them.',
      quota: 'Using <b>{used}</b> of <b>{limit}</b> brands', quotaUnlimited: '<b>{used}</b> brands (no limit)',
      add: '+ Add brand', edit: 'Edit', del: 'Delete', makeDefault: 'Make default', cancel: 'Cancel',
      isDefault: 'Default', isLocal: 'This browser only',
      empty: 'No brands yet. Add one and every generator will start pre-filled.',
      newBrand: 'New brand', editBrand: 'Edit brand',
      brandName: 'Brand name', siteUrl: 'Website', notes: 'Notes',
      params: 'Default parameters', paramsSub: 'Everything here is a starting value — each tool lets you override it per campaign.',
      geo: 'Country / geo', curMode: 'Display currency', segment: 'Main segment', plat: 'Platform',
      players: 'Player base', avgdep: 'Avg deposit', arpu: 'ARPU (USD/mo)', rtp: 'Avg RTP, %',
      providers: 'Connected providers', providersSub: 'Filters game recommendations. Empty = all providers.',
      curLocal: 'Local', curUsd: 'USD',
      segNew: 'New', segMid: 'Regular', segVip: 'VIP',
      platBoth: 'Both', platMobile: 'Mobile', platDesk: 'Desktop',
      unset: '— not set —',
      limitReached: 'Your plan allows {limit} brand(s). Upgrade to add more.',
      guestNote: 'You are not signed in — this brand is stored in this browser only. It moves into your account when you register.',
      confirmDel: 'Delete this brand?',
      errName: 'A brand with this name already exists.',
      errLimit: 'Brand limit reached for your plan.',
      errNetwork: 'Could not reach the server.',
    },
    ru: {
      account: 'Аккаунт', accountSub: 'Отображается только в интерфейсе — в инструменты не передаётся.',
      name: 'Имя', email: 'Email', company: 'Компания', position: 'Должность', timezone: 'Часовой пояс',
      plan: 'Тариф', save: 'Сохранить', saved: 'Сохранено',
      brands: 'Бренды', brandsSub: 'Бренд хранит вводные, которые спрашивает каждый инструмент. Выберите его в любой форме — поля подставятся автоматически, и их можно менять.',
      quota: 'Использовано <b>{used}</b> из <b>{limit}</b> брендов', quotaUnlimited: '<b>{used}</b> брендов (без лимита)',
      add: '+ Добавить бренд', edit: 'Изменить', del: 'Удалить', makeDefault: 'Сделать основным', cancel: 'Отмена',
      isDefault: 'Основной', isLocal: 'Только в этом браузере',
      empty: 'Брендов пока нет. Добавьте один — и все генераторы будут открываться заполненными.',
      newBrand: 'Новый бренд', editBrand: 'Редактирование бренда',
      brandName: 'Название бренда', siteUrl: 'Сайт', notes: 'Заметки',
      params: 'Параметры по умолчанию', paramsSub: 'Всё здесь — стартовые значения; в каждом инструменте их можно изменить под конкретную кампанию.',
      geo: 'Страна / гео', curMode: 'Валюта отображения', segment: 'Основной сегмент', plat: 'Платформа',
      players: 'База игроков', avgdep: 'Средний депозит', arpu: 'ARPU (USD/мес)', rtp: 'Средний RTP, %',
      providers: 'Подключённые провайдеры', providersSub: 'Фильтрует рекомендации игр. Пусто = все провайдеры.',
      curLocal: 'Локальная', curUsd: 'USD',
      segNew: 'Новые', segMid: 'Регулярные', segVip: 'VIP',
      platBoth: 'Обе', platMobile: 'Мобайл', platDesk: 'Десктоп',
      unset: '— не задано —',
      limitReached: 'Ваш тариф допускает {limit} бренд(ов). Для большего числа нужен апгрейд.',
      guestNote: 'Вы не авторизованы — бренд хранится только в этом браузере. При регистрации он перенесётся в аккаунт.',
      confirmDel: 'Удалить этот бренд?',
      errName: 'Бренд с таким названием уже есть.',
      errLimit: 'Достигнут лимит брендов на вашем тарифе.',
      errNetwork: 'Сервер недоступен.',
    },
  };
  function lang() { try { return localStorage.getItem('bonusLang') === 'ru' ? 'ru' : 'en'; } catch (e) { return 'en'; } }
  function t(k) { return (I18N[lang()] || I18N.en)[k] || k; }
  function fmt(k, vals) {
    return t(k).replace(/\{(\w+)\}/g, function (_, n) { return vals[n] != null ? vals[n] : ''; });
  }

  window.setProfileLang = function (l) {
    try { localStorage.setItem('bonusLang', l); } catch (e) { /* ignore */ }
    document.documentElement.setAttribute('data-lang', l);
    if (window.applyNavLang) window.applyNavLang(l);
    syncLangButtons();
    render();
  };
  function syncLangButtons() {
    var l = lang();
    var ru = document.getElementById('lt-ru'), en = document.getElementById('lt-en');
    if (ru) ru.classList.toggle('active', l === 'ru');
    if (en) en.classList.toggle('active', l === 'en');
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  // ── state ──────────────────────────────────────────────────────────────────
  var account = null;          // { name, email, plan, profile:{…} } — null for guests
  var editing = null;          // brand being edited: { id?, name, data:{}, isDefault }

  var ALL_PROVIDERS = [
    'Pragmatic Play', "Play'n GO", 'NetEnt', 'Playtech', 'Evolution', 'Hacksaw Gaming',
    'Nolimit City', 'PG Soft', 'Big Time Gaming', 'Playson', 'Thunderkick', 'ReelPlay',
    'Reel Kingdom', 'IGT', 'Scientific Games', 'Spribe', 'SmartSoft Gaming', 'Stake Originals',
    'BGaming',
  ];

  // ── render ─────────────────────────────────────────────────────────────────
  function render() {
    var c = document.getElementById('content');
    if (!c) return;
    c.innerHTML = accountCard() + brandsBlock() + (editing ? editorCard() : '');
    var sub = document.getElementById('topbar-sub');
    if (sub) sub.textContent = account ? (account.email || '') : '';
  }

  function accountCard() {
    if (!account) {
      return '<div class="card"><div class="card-title">' + esc(t('account')) + '</div>' +
        '<div class="upsell">' + esc(t('guestNote')) +
        ' <a href="/register.html" style="color:#fbbf24;font-weight:700">→</a></div></div>';
    }
    var p = account.profile || {};
    return '' +
    '<div class="card">' +
      '<div class="card-title">' + esc(t('account')) + '</div>' +
      '<div class="card-sub">' + esc(t('accountSub')) + '</div>' +
      '<div class="form-grid">' +
        field('name', t('name'), account.name || '') +
        '<div class="form-row"><label class="form-label">' + esc(t('email')) + '</label>' +
          '<input class="form-input" value="' + esc(account.email || '') + '" disabled></div>' +
        field('company', t('company'), p.company || '') +
        field('position', t('position'), p.position || '') +
        field('timezone', t('timezone'), p.timezone || '') +
        '<div class="form-row"><label class="form-label">' + esc(t('plan')) + '</label>' +
          '<input class="form-input" value="' + esc(account.plan || 'free') + '" disabled></div>' +
      '</div>' +
      '<div style="margin-top:14px"><button class="btn btn-outline btn-sm" onclick="profileSaveAccount()">' + esc(t('save')) + '</button></div>' +
    '</div>';
  }
  function field(id, label, val) {
    return '<div class="form-row"><label class="form-label" for="pf-' + id + '">' + esc(label) + '</label>' +
      '<input id="pf-' + id + '" class="form-input" value="' + esc(val) + '"></div>';
  }

  function brandsBlock() {
    var brands = BC.list();
    var limit = BC.limit();
    var quota = limit < 0
      ? fmt('quotaUnlimited', { used: brands.length })
      : fmt('quota', { used: brands.length, limit: limit });

    var rows = brands.length
      ? brands.map(brandRow).join('')
      : '<div class="empty">' + esc(t('empty')) + '</div>';

    var addBtn = BC.canAdd()
      ? '<button class="btn btn-primary btn-sm" onclick="profileNewBrand()">' + esc(t('add')) + '</button>'
      : '';
    var capped = !BC.canAdd()
      ? '<div class="upsell" style="margin-top:12px">' + esc(fmt('limitReached', { limit: limit })) + '</div>'
      : '';

    return '' +
    '<div class="card">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">' +
        '<div class="card-title" style="margin:0">' + esc(t('brands')) + '</div>' +
        '<span class="quota" style="margin-left:auto">' + quota + '</span>' +
        addBtn +
      '</div>' +
      '<div class="card-sub">' + esc(t('brandsSub')) + '</div>' +
      rows + capped +
    '</div>';
  }

  function brandRow(b) {
    var activeId = BC.activeId();
    var d = b.data || {};
    var geo = d.geo ? geoLabel(d.geo) : t('unset');
    var meta = [geo];
    if (d.segment) meta.push(t('seg' + d.segment.charAt(0).toUpperCase() + d.segment.slice(1)));
    if (d.players) meta.push(Number(d.players).toLocaleString() + ' 👤');
    return '' +
    '<div class="brand-row' + (b.id === activeId ? ' active' : '') + '">' +
      '<div>' +
        '<div class="brand-name">' + esc(b.name) +
          (b.isDefault ? ' <span class="pill pill-default">' + esc(t('isDefault')) + '</span>' : '') +
          (b.local ? ' <span class="pill pill-local">' + esc(t('isLocal')) + '</span>' : '') +
        '</div>' +
        '<div class="brand-meta">' + esc(meta.join(' · ')) + '</div>' +
      '</div>' +
      '<div class="brand-actions">' +
        (b.isDefault ? '' : '<button class="btn btn-ghost btn-sm" onclick="profileMakeDefault(\'' + esc(b.id) + '\')">' + esc(t('makeDefault')) + '</button>') +
        '<button class="btn btn-outline btn-sm" onclick="profileEditBrand(\'' + esc(b.id) + '\')">' + esc(t('edit')) + '</button>' +
        '<button class="btn btn-danger btn-sm" onclick="profileDeleteBrand(\'' + esc(b.id) + '\')">' + esc(t('del')) + '</button>' +
      '</div>' +
    '</div>';
  }

  function geoLabel(val) {
    var g = window.GeoData && window.GeoData.of ? window.GeoData.of(val) : null;
    if (!g) return val;
    return (g.flag ? g.flag + ' ' : '') + (lang() === 'ru' ? g.ru : g.en);
  }

  function geoOptions(selected) {
    if (!window.GeoData || !window.GeoData.groups) return '';
    var out = ['<option value="">' + esc(t('unset')) + '</option>'];
    window.GeoData.groups(lang()).forEach(function (grp) {
      out.push('<optgroup label="' + esc(grp.label) + '">');
      grp.items.forEach(function (g) {
        out.push('<option value="' + esc(g.val) + '"' + (g.val === selected ? ' selected' : '') + '>' +
          esc((g.flag ? g.flag + ' ' : '') + (lang() === 'ru' ? g.ru : g.en)) + '</option>');
      });
      out.push('</optgroup>');
    });
    return out.join('');
  }

  function editorCard() {
    var d = editing.data || {};
    var chips = function (id, val, opts) {
      return '<div class="chips" id="' + id + '">' + opts.map(function (o) {
        return '<button type="button" class="chip' + (val === o.v ? ' on' : '') + '" data-v="' + esc(o.v) + '" ' +
          'onclick="profilePickChip(\'' + id + '\',\'' + esc(o.v) + '\')">' + esc(o.l) + '</button>';
      }).join('') + '</div>';
    };
    return '' +
    '<div class="card" id="brand-editor">' +
      '<div class="card-title">' + esc(editing.id ? t('editBrand') : t('newBrand')) + '</div>' +
      '<div class="form-grid" style="margin-bottom:14px">' +
        '<div class="form-row"><label class="form-label">' + esc(t('brandName')) + '</label>' +
          '<input id="bf-name" class="form-input" value="' + esc(editing.name || '') + '" placeholder="Casino X"></div>' +
        '<div class="form-row"><label class="form-label">' + esc(t('siteUrl')) + '</label>' +
          '<input id="bf-siteUrl" class="form-input" value="' + esc(d.siteUrl || '') + '" placeholder="https://"></div>' +
      '</div>' +

      '<div class="card-title" style="margin-top:6px">' + esc(t('params')) + '</div>' +
      '<div class="card-sub">' + esc(t('paramsSub')) + '</div>' +
      '<div class="form-grid">' +
        '<div class="form-row"><label class="form-label">' + esc(t('geo')) + '</label>' +
          '<select id="bf-geo" class="form-input">' + geoOptions(d.geo) + '</select></div>' +
        '<div class="form-row"><label class="form-label">' + esc(t('curMode')) + '</label>' +
          chips('bf-curMode', d.curMode || 'local', [{ v: 'local', l: t('curLocal') }, { v: 'usd', l: t('curUsd') }]) + '</div>' +
        '<div class="form-row"><label class="form-label">' + esc(t('segment')) + '</label>' +
          chips('bf-segment', d.segment || '', [{ v: 'new', l: t('segNew') }, { v: 'mid', l: t('segMid') }, { v: 'vip', l: t('segVip') }]) + '</div>' +
        '<div class="form-row"><label class="form-label">' + esc(t('plat')) + '</label>' +
          chips('bf-plat', d.plat || '', [{ v: 'both', l: t('platBoth') }, { v: 'mobile', l: t('platMobile') }, { v: 'desk', l: t('platDesk') }]) + '</div>' +
        numField('players', t('players'), d.players, 100, 200000) +
        numField('avgdep', t('avgdep'), d.avgdep, 1, 100000) +
        numField('arpu', t('arpu'), d.arpu, 1, 100000) +
        numField('rtp', t('rtp'), d.rtp, 50, 99.9) +
      '</div>' +

      '<div class="form-row" style="margin-top:14px"><label class="form-label">' + esc(t('providers')) + '</label>' +
        '<div class="form-hint" style="margin-bottom:6px">' + esc(t('providersSub')) + '</div>' +
        '<div class="chips" id="bf-providers">' + ALL_PROVIDERS.map(function (p) {
          var on = (d.providers || []).indexOf(p) >= 0;
          return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-v="' + esc(p) + '" ' +
            'onclick="profileToggleProvider(this)">' + esc(p) + '</button>';
        }).join('') + '</div></div>' +

      '<div class="form-row" style="margin-top:14px"><label class="form-label">' + esc(t('notes')) + '</label>' +
        '<input id="bf-notes" class="form-input" value="' + esc(d.notes || '') + '"></div>' +

      '<div style="margin-top:16px;display:flex;gap:8px">' +
        '<button class="btn btn-primary btn-sm" onclick="profileSaveBrand()">' + esc(t('save')) + '</button>' +
        '<button class="btn btn-ghost btn-sm" onclick="profileCancelEdit()">' + esc(t('cancel')) + '</button>' +
      '</div>' +
    '</div>';
  }

  function numField(id, label, val, min, max) {
    return '<div class="form-row"><label class="form-label">' + esc(label) + '</label>' +
      '<input id="bf-' + id + '" class="form-input" type="number" min="' + min + '" max="' + max + '" ' +
      'value="' + (val == null ? '' : esc(val)) + '"></div>';
  }

  // ── actions (inline-attribute entry points) ────────────────────────────────
  window.profilePickChip = function (groupId, val) {
    var g = document.getElementById(groupId);
    if (!g) return;
    Array.prototype.forEach.call(g.querySelectorAll('.chip'), function (btn) {
      // Re-clicking the selected chip clears it — every brand field is optional.
      var on = btn.getAttribute('data-v') === val && !btn.classList.contains('on');
      btn.classList.toggle('on', on);
    });
  };
  window.profileToggleProvider = function (btn) { btn.classList.toggle('on'); };

  window.profileNewBrand = function () {
    editing = { name: '', data: {}, isDefault: false };
    render();
    var el = document.getElementById('brand-editor');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  window.profileEditBrand = function (id) {
    var b = BC.list().filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    editing = { id: b.id, name: b.name, data: JSON.parse(JSON.stringify(b.data || {})), isDefault: b.isDefault };
    render();
  };
  window.profileCancelEdit = function () { editing = null; render(); };

  function chipValue(groupId) {
    var g = document.getElementById(groupId);
    var on = g && g.querySelector('.chip.on');
    return on ? on.getAttribute('data-v') : undefined;
  }
  function numValue(id) {
    var el = document.getElementById('bf-' + id);
    if (!el || el.value === '') return undefined;
    var n = Number(el.value);
    return Number.isFinite(n) ? n : undefined;
  }
  function textValue(id) {
    var el = document.getElementById('bf-' + id);
    var v = el ? el.value.trim() : '';
    return v || undefined;
  }

  window.profileSaveBrand = function () {
    var name = (document.getElementById('bf-name') || {}).value;
    name = (name || '').trim();
    if (!name) { toast(t('brandName')); return; }

    var geoEl = document.getElementById('bf-geo');
    var providers = [];
    Array.prototype.forEach.call(document.querySelectorAll('#bf-providers .chip.on'), function (b) {
      providers.push(b.getAttribute('data-v'));
    });

    // Only defined keys are sent — the schema is .strict() and every field
    // optional, so "not set" must be absent rather than null/''.
    var data = {};
    var put = function (k, v) { if (v !== undefined && v !== '') data[k] = v; };
    put('geo', geoEl && geoEl.value ? geoEl.value : undefined);
    put('curMode', chipValue('bf-curMode'));
    put('segment', chipValue('bf-segment'));
    put('plat', chipValue('bf-plat'));
    put('players', numValue('players'));
    put('avgdep', numValue('avgdep'));
    put('arpu', numValue('arpu'));
    put('rtp', numValue('rtp'));
    put('siteUrl', textValue('siteUrl'));
    put('notes', textValue('notes'));
    if (providers.length) data.providers = providers;

    BC.save({ id: editing.id, name: name, data: data, isDefault: editing.isDefault }).then(function (res) {
      if (!res.ok) { toast(errText(res.error)); return; }
      editing = null;
      toast(t('saved'));
      render();
    });
  };

  function errText(code) {
    if (code === 'BRAND_NAME_TAKEN') return t('errName');
    if (code === 'BRAND_LIMIT_REACHED') return t('errLimit');
    if (code === 'NETWORK') return t('errNetwork');
    return t('errNetwork');
  }

  window.profileMakeDefault = function (id) {
    var b = BC.list().filter(function (x) { return x.id === id; })[0];
    if (!b) return;
    BC.save({ id: b.id, name: b.name, data: b.data, isDefault: true }).then(function (res) {
      if (!res.ok) { toast(errText(res.error)); return; }
      BC.setActive(id);
      render();
    });
  };

  window.profileDeleteBrand = function (id) {
    // eslint-disable-next-line no-alert
    if (!window.confirm(t('confirmDel'))) return;
    BC.remove(id).then(function () { if (editing && editing.id === id) editing = null; render(); });
  };

  window.profileSaveAccount = function () {
    if (!account) return;
    var patch = {};
    ['name', 'company', 'position', 'timezone'].forEach(function (k) {
      var el = document.getElementById('pf-' + k);
      if (el) patch[k] = el.value.trim();
    });
    // The name column is NOT NULL — an empty box means "unchanged", not "clear".
    if (!patch.name) delete patch.name;
    fetch('/api/brands/profile', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j) { toast(t('errNetwork')); return; }
        account = j.profile;
        toast(t('saved'));
        render();
      })
      .catch(function () { toast(t('errNetwork')); });
  };

  // ── boot ───────────────────────────────────────────────────────────────────
  function loadAccount() {
    return fetch('/api/brands/profile', { credentials: 'include' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { account = j ? j.profile : null; })
      .catch(function () { account = null; });
  }

  function boot() {
    document.documentElement.setAttribute('data-lang', lang());
    syncLangButtons();
    if (window.applyNavLang) window.applyNavLang(lang());
    render();                                   // paint from cache immediately
    Promise.all([BC.load(), loadAccount()]).then(render);
    var m = document.querySelector('.main');
    if (m) m.classList.add('ready');
  }

  window.addEventListener('retomat:brands-changed', render);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
