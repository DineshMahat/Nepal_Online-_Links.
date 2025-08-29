// ===== Seed links =====
const STARTER_LINKS = [
    { title: 'नेपाल सरकार आधिकारिक पोर्टल', url: 'https://www.nepal.gov.np/', desc: 'नेपाल सरकारको केन्द्रीय सूचनाहरु र सेवाहरू।', cat: 'government' },
    { title: 'IRD (कर) eFiling', url: 'https://tax.ird.gov.np/', desc: 'आयकर/भ्याट सम्बन्धी अनलाइन फाइलिङ।', cat: 'government' },
    { title: 'eSewa', url: 'https://esewa.com.np/', desc: 'डिजिटल वालेट, बिल भुक्तानी।', cat: 'finance' }
];

let STATE = {
    q: '',
    cat: 'all',
    showSaved: false,
    data: JSON.parse(localStorage.getItem('links-data') || 'null') || STARTER_LINKS,
    editIndex: null,
    isAdmin: JSON.parse(localStorage.getItem('isAdmin') || 'false')
};

const ADMIN_USERNAME = 'Dinesh';
const ADMIN_PASSWORD = '9842';

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

const grid = $('#grid');
const empty = $('#empty');
const toast = $('#toast');
const dlg = $('#dlg');
const modeBtn = $('#modeBtn');
const adminLoginBtn = $('#adminLoginBtn');
const adminLogoutBtn = $('#adminLogoutBtn');

function favicon(url) {
    try {
        const u = new URL(url);
        return `https://www.google.com/s2/favicons?sz=64&domain_url=${u.origin}`;
    } catch { return ''; }
}

function escapeHtml(s) {
    return s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[m]));
}

function isSaved(url) {
    return JSON.parse(localStorage.getItem('saved') || '[]').includes(url);
}

function toggleSave(url) {
    const arr = JSON.parse(localStorage.getItem('saved') || '[]');
    const i = arr.indexOf(url);
    i > -1 ? arr.splice(i, 1) : arr.push(url);
    localStorage.setItem('saved', JSON.stringify(arr));
    toastMsg(i > -1 ? 'बुकमार्क हटाइयो' : 'बुकमार्क गरियो');
    render();
}

function toastMsg(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1600);
}

function cardTpl(item, idx) {
    const saved = isSaved(item.url);
    return `<article class="card" data-cat="${item.cat}" data-title="${item.title.toLowerCase()} ${item.desc.toLowerCase()}">
        <div class="badge">${item.cat}</div>
        <div class="card-head">
            <div class="favicon"><img src="${favicon(item.url)}" alt="" width="24" height="24"/></div>
            <div>
                <div class="title-sm">${escapeHtml(item.title)}</div>
                <div class="desc">${escapeHtml(item.desc)}</div>
            </div>
        </div>
        <div class="card-actions">
            <a class="btn mini open-link" href="${item.url}" target="_blank" rel="noopener">खोल्नुहोस् ↗</a>
            <button class="btn mini" data-save="${item.url}">${saved ? 'बुकमार्क हटाउनुहोस्' : 'बुकमार्क'}</button>
            ${STATE.isAdmin ? `<button class="btn mini" data-edit="${idx}">Edit</button>
            <button class="btn mini" data-delete="${idx}">Delete</button>` : ''}
        </div>
    </article>`;
}

function render() {
    localStorage.setItem('links-data', JSON.stringify(STATE.data));
    const q = STATE.q.trim().toLowerCase();
    const cat = STATE.cat;
    const savedOnly = STATE.showSaved;
    const savedSet = new Set(JSON.parse(localStorage.getItem('saved') || '[]'));

    const items = STATE.data.filter(it => {
        const matchQ = (it.title + " " + it.desc).toLowerCase().includes(q);
        const matchCat = cat === 'all' || it.cat === cat;
        const matchSaved = !savedOnly || savedSet.has(it.url);
        return matchQ && matchCat && matchSaved;
    });

    grid.innerHTML = items.map((item, idx) => cardTpl(item, STATE.data.indexOf(item))).join('');
    empty.hidden = items.length > 0;
}

// ===== Events =====
$('#q').addEventListener('input', e => { STATE.q = e.target.value; render(); });
$('#clearBtn').addEventListener('click', () => { $('#q').value = ''; STATE.q = ''; render(); });

$$('.chip').forEach(chip => chip.addEventListener('click', () => {
    $$('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    STATE.cat = chip.dataset.cat;
    render();
}));

document.addEventListener('click', e => {
    const save = e.target.closest('[data-save]');
    if (save) toggleSave(save.dataset.save);

    const editBtn = e.target.closest('[data-edit]');
    if (editBtn && STATE.isAdmin) {
        const idx = parseInt(editBtn.dataset.edit);
        const item = STATE.data[idx];
        $('#f_title').value = item.title;
        $('#f_url').value = item.url;
        $('#f_desc').value = item.desc;
        $('#f_cat').value = item.cat;
        $('#dlgTitle').textContent = 'लिङ्क सम्पादन गर्नुहोस्';
        STATE.editIndex = idx;
        dlg.showModal();
    }

    const deleteBtn = e.target.closest('[data-delete]');
    if (deleteBtn && STATE.isAdmin) {
        const idx = parseInt(deleteBtn.dataset.delete);
        if (confirm('के तपाईं साँच्चै यो लिङ्क हटाउन चाहनुहुन्छ?')) {
            STATE.data.splice(idx, 1);
            toastMsg('लिङ्क हटाइयो');
            render();
        }
    }
});

// Add/Edit
$('#openAdd').addEventListener('click', () => {
    if (!STATE.isAdmin) { toastMsg('केवल Admin ले मात्र थप्न सक्छ'); return; }
    $('#f_title').value = ''; $('#f_url').value = ''; $('#f_desc').value = '';
    $('#dlgTitle').textContent = 'लिङ्क थप्नुहोस्';
    STATE.editIndex = null;
    dlg.showModal();
});

$('#saveNew').addEventListener('click', () => {
    const title = $('#f_title').value.trim();
    const url = $('#f_url').value.trim();
    const desc = $('#f_desc').value.trim();
    const cat = $('#f_cat').value;
    if (!title || !url) { toastMsg('शीर्षक र URL आवश्यक'); return; }
    try { new URL(url); } catch { toastMsg('मान्य URL दिनुहोस्'); return; }
    if (STATE.editIndex !== null) {
        STATE.data[STATE.editIndex] = { title, url, desc, cat };
        toastMsg('लिङ्क सम्पादन भयो');
    } else {
        STATE.data.unshift({ title, url, desc, cat });
        toastMsg('नयाँ लिङ्क थपियो');
    }
    dlg.close(); render();
});

// Export JSON
$('#exportJson').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(STATE.data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nepal-online-links.json';
    a.click();
    URL.revokeObjectURL(a.href);
});

// Toggle saved
$('#toggleSaved').addEventListener('click', e => {
    STATE.showSaved = !STATE.showSaved;
    e.target.textContent = STATE.showSaved ? 'सबै देखाउने' : 'बुकमार्क';
    render();
});

// Scroll top
$('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ===== Theme =====
(function initTheme() {
    const saved = localStorage.getItem('theme');
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const theme = saved || (prefersLight ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    modeBtn.textContent = theme === 'dark' ? '🌗' : '☀️';
})();
modeBtn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    modeBtn.textContent = next === 'dark' ? '🌗' : '☀️';
    toastMsg(next === 'dark' ? 'Dark mode' : 'Light mode');
});

// Footer Year
const yyEl = document.getElementById('yy');
if (yyEl) yyEl.textContent = new Date().getFullYear();

// ===== Admin Login/Logout =====
function updateAdminButtons() {
    if (STATE.isAdmin) {
        adminLoginBtn.style.display = 'none';
        adminLogoutBtn.style.display = 'inline-flex';
    } else {
        adminLoginBtn.style.display = 'inline-flex';
        adminLogoutBtn.style.display = 'none';
    }
}

adminLoginBtn.addEventListener('click', () => {
    const user = prompt('Admin Username:');
    const pass = prompt('Admin Password:');
    if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
        STATE.isAdmin = true;
        localStorage.setItem('isAdmin', 'true');
        toastMsg('Admin logged in');
        render();
    } else {
        toastMsg('गलत Username वा Password');
    }
    updateAdminButtons();
});

adminLogoutBtn.addEventListener('click', () => {
    STATE.isAdmin = false;
    localStorage.setItem('isAdmin', 'false');
    toastMsg('Admin logged out');
    render();
    updateAdminButtons();
});

updateAdminButtons();
render();
