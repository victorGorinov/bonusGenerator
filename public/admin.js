// Admin panel — user & feature-access management. Vanilla ES module.
// Talks to /api/admin/* (all requireAdmin) + /api/features (gate the page itself).

const T = {
  en: {
    title:'Admin', sub:'Users & feature access', back:'Back', loading:'Loading…',
    denied:'Admin access required.', signin:'Sign in',
    th_user:'User', th_role:'Role', th_status:'Status', th_plan:'Plan', th_features:'Features', th_actions:'',
    save:'Save', del:'Delete', saved:'Saved', deleted:'User deleted',
    confirmDel:'Delete this user and their workspace? This cannot be undone.',
    empty:'No users found.', you:'you',
    role_user:'user', role_admin:'admin', st_active:'active', st_disabled:'disabled',
  },
  ru: {
    title:'Админка', sub:'Пользователи и доступ к функциям', back:'Назад', loading:'Загрузка…',
    denied:'Требуется доступ администратора.', signin:'Войти',
    th_user:'Пользователь', th_role:'Роль', th_status:'Статус', th_plan:'Тариф', th_features:'Функции', th_actions:'',
    save:'Сохранить', del:'Удалить', saved:'Сохранено', deleted:'Пользователь удалён',
    confirmDel:'Удалить пользователя и его workspace? Действие необратимо.',
    empty:'Пользователи не найдены.', you:'вы',
    role_user:'user', role_admin:'admin', st_active:'активен', st_disabled:'заблокирован',
  },
};
let lang = localStorage.getItem('bonusLang') === 'ru' ? 'ru' : 'en';
const t = (k) => (T[lang][k] ?? k);

let META = { features: [], plans: ['free'], presets: {} };
let ME = null;               // { role, ... } from /api/features
const $ = (id) => document.getElementById(id);

function msg(text, kind) {
  const el = $('adm-msg');
  el.className = 'adm-msg ' + (kind || '');
  el.textContent = text || '';
}

async function api(path, opts) {
  const res = await fetch(path, { credentials:'same-origin', headers:{ 'Content-Type':'application/json' }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || ('HTTP ' + res.status));
  return data;
}

// Client mirror of resolveFeatureAccess — effective feature map for a row draft.
function effective(draft) {
  const out = {};
  const base = META.presets[draft.plan] || META.presets.free || {};
  for (const f of META.features) {
    // Precedence must mirror backend resolveFeatureAccess: disabled → admin → override → plan.
    if (draft.status === 'disabled') out[f] = false;
    else if (draft.role === 'admin') out[f] = true;
    else if (typeof draft.overrides[f] === 'boolean') out[f] = draft.overrides[f];
    else out[f] = !!base[f];
  }
  return out;
}

// Overrides worth persisting = those differing from the plan preset.
function pruneOverrides(draft) {
  const base = META.presets[draft.plan] || META.presets.free || {};
  const out = {};
  for (const f of META.features) {
    if (typeof draft.overrides[f] === 'boolean' && draft.overrides[f] !== !!base[f]) {
      out[f] = draft.overrides[f];
    }
  }
  return out;
}

function newDraft(u) {
  const overrides = {};
  for (const f of META.features) {
    if (u.features && typeof u.features[f] === 'boolean') overrides[f] = u.features[f];
  }
  return { role: u.role, status: u.status, plan: u.plan, overrides };
}

function applyStaticText() {
  document.documentElement.lang = lang;
  $('t-title').textContent = t('title');
  $('t-sub').textContent = t('sub');
  $('t-back').textContent = t('back');
  document.querySelectorAll('.adm-lang').forEach((el) => {
    el.classList.toggle('active', el.dataset.lang === lang);
  });
  $('adm-search').placeholder = lang === 'ru' ? 'Поиск email / имя…' : 'Search email / name…';
}

function renderRows(users) {
  const content = $('adm-content');
  if (!users.length) { content.innerHTML = `<div class="adm-empty">${t('empty')}</div>`; return; }

  const table = document.createElement('table');
  table.className = 'adm-table';
  table.innerHTML = `<thead><tr>
    <th>${t('th_user')}</th><th>${t('th_role')}</th><th>${t('th_status')}</th>
    <th>${t('th_plan')}</th><th>${t('th_features')}</th><th></th>
  </tr></thead><tbody></tbody>`;
  const tbody = table.querySelector('tbody');

  for (const u of users) tbody.appendChild(renderRow(u));
  content.innerHTML = '';
  content.appendChild(table);
}

function renderRow(u) {
  const draft = newDraft(u);
  // Baseline for dirty-detection: prune the initial overrides the SAME way a save
  // would, so a stored override that merely equals the plan preset doesn't read as
  // an unsaved change on load (compare pruned-vs-pruned, not pruned-vs-raw).
  const initialPruned = JSON.stringify(pruneOverrides(draft));
  const isSelf = ME && ME.userId === u.id;
  const tr = document.createElement('tr');

  const created = (u.created_at || '').slice(0, 10);
  const roleBadge = u.role === 'admin' ? `<span class="adm-badge admin">admin</span>` : '';
  const disBadge = u.status === 'disabled' ? `<span class="adm-badge disabled">${t('st_disabled')}</span>` : '';

  tr.innerHTML = `
    <td class="adm-user"><b>${esc(u.name)}${isSelf ? ` · <span>${t('you')}</span>` : ''}</b>
      <span>${esc(u.email)}</span><span>${created}</span>${roleBadge}${disBadge}</td>
    <td></td><td></td><td></td>
    <td><div class="adm-feats"></div></td>
    <td><div class="adm-actions">
      <button class="adm-btn gold js-save" disabled>${t('save')}</button>
      <button class="adm-btn danger js-del">${t('del')}</button>
    </div></td>`;

  const [ , roleTd, statusTd, planTd ] = tr.children;
  const roleSel   = mkSelect([['user', t('role_user')], ['admin', t('role_admin')]], draft.role, isSelf);
  const statusSel = mkSelect([['active', t('st_active')], ['disabled', t('st_disabled')]], draft.status, isSelf);
  const planSel   = mkSelect(META.plans.map((p) => [p, p]), draft.plan, false);
  roleTd.appendChild(roleSel); statusTd.appendChild(statusSel); planTd.appendChild(planSel);

  const featsWrap = tr.querySelector('.adm-feats');
  const saveBtn   = tr.querySelector('.js-save');
  const delBtn    = tr.querySelector('.js-del');

  function paintFeatures() {
    const eff = effective(draft);
    const locked = draft.role === 'admin' || draft.status === 'disabled';
    featsWrap.innerHTML = '';
    for (const f of META.features) {
      const id = `f_${u.id}_${f}`;
      const label = document.createElement('label');
      label.innerHTML = `<input type="checkbox" id="${id}" ${eff[f] ? 'checked' : ''} ${locked ? 'disabled' : ''}> ${f}`;
      label.querySelector('input').addEventListener('change', (e) => {
        draft.overrides[f] = e.target.checked;
        markDirty();
      });
      featsWrap.appendChild(label);
    }
  }

  function markDirty() {
    const dirty =
      draft.role !== u.role || draft.status !== u.status || draft.plan !== u.plan ||
      JSON.stringify(pruneOverrides(draft)) !== initialPruned;
    saveBtn.disabled = !dirty;
    tr.classList.toggle('adm-dirty', dirty);
  }

  roleSel.addEventListener('change', () => { draft.role = roleSel.value; paintFeatures(); markDirty(); });
  statusSel.addEventListener('change', () => { draft.status = statusSel.value; paintFeatures(); markDirty(); });
  planSel.addEventListener('change', () => { draft.plan = planSel.value; paintFeatures(); markDirty(); });

  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    try {
      const body = { role: draft.role, status: draft.status, plan: draft.plan, features: pruneOverrides(draft) };
      const { user } = await api(`/api/admin/users/${u.id}`, { method:'PATCH', body: JSON.stringify(body) });
      Object.assign(u, user);
      tr.replaceWith(renderRow(u));
      msg(t('saved'), 'ok');
    } catch (e) { msg(e.message, 'err'); saveBtn.disabled = false; }
  });

  delBtn.addEventListener('click', async () => {
    if (!confirm(t('confirmDel'))) return;
    try {
      await api(`/api/admin/users/${u.id}`, { method:'DELETE' });
      tr.remove();
      msg(t('deleted'), 'ok');
    } catch (e) { msg(e.message, 'err'); }
  });

  paintFeatures();
  return tr;
}

function mkSelect(opts, value, disabled) {
  const s = document.createElement('select');
  s.className = 'adm-sel';
  if (disabled) s.disabled = true;
  for (const [v, label] of opts) {
    const o = document.createElement('option');
    o.value = v; o.textContent = label; if (v === value) o.selected = true;
    s.appendChild(o);
  }
  return s;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

let searchTimer = null;
async function loadUsers() {
  const q = $('adm-search').value.trim();
  try {
    const { users } = await api('/api/admin/users?limit=100&q=' + encodeURIComponent(q));
    renderRows(users);
  } catch (e) { msg(e.message, 'err'); }
}

function showDenied() {
  $('adm-content').innerHTML =
    `<div class="adm-empty">${t('denied')} <a class="adm-back" href="/login.html">${t('signin')}</a></div>`;
}

async function init() {
  applyStaticText();
  document.querySelectorAll('.adm-lang').forEach((el) => {
    el.addEventListener('click', () => {
      lang = el.dataset.lang; localStorage.setItem('bonusLang', lang);
      applyStaticText(); loadUsers();
    });
  });
  $('adm-search').addEventListener('input', () => {
    clearTimeout(searchTimer); searchTimer = setTimeout(loadUsers, 250);
  });

  // Gate the page on admin identity FIRST. Only a genuine "not an admin" answer
  // shows the denied screen; a transient failure loading meta/users after that
  // must not masquerade as "access denied" (it shows a retryable error instead).
  let feat, me;
  try {
    [feat, me] = await Promise.all([
      api('/api/features'),
      api('/api/auth/me').catch(() => null),
    ]);
  } catch (e) {
    showDenied(); // /api/features itself failed → not authenticated / no session
    return;
  }
  if (!feat || feat.role !== 'admin') { showDenied(); return; }
  ME = { role: feat.role, userId: me?.user?.id };

  try {
    META = await api('/api/admin/meta');
    await loadUsers();
  } catch (e) {
    msg(e.message, 'err'); // confirmed admin, but a call failed — show error, not denial
  }
}

init();
