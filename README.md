<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>ECR Tracker — Editable</title>
  <style>
    :root{--bg:#0f1724;--card:#0b1220;--muted:#94a3b8;--accent:#06b6d4;--accent-2:#06d6a0}
    *{box-sizing:border-box;font-family:Inter,ui-sans-serif,system-ui,Segoe UI,Roboto,'Helvetica Neue',Arial}
    body{margin:0;background:linear-gradient(180deg,#071029 0%, #071a2a 100%);color:#e6eef6;padding:28px}
    .container{max-width:1000px;margin:0 auto}
    header{display:flex;align-items:center;gap:16px;margin-bottom:18px}
    h1{font-size:20px;margin:0}
    p.lead{margin:0;color:var(--muted)}
    .card{background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));padding:16px;border-radius:12px;box-shadow:0 6px 18px rgba(2,6,23,0.6)}
    .toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
    button, .btn{background:transparent;border:1px solid rgba(255,255,255,0.06);padding:8px 12px;border-radius:8px;color:inherit;cursor:pointer}
    .btn.primary{background:linear-gradient(90deg,var(--accent),var(--accent-2));border:none;color:#042022}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th,td{padding:8px 10px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.03);font-size:13px}
    th{color:var(--muted);font-weight:600}
    td small{color:var(--muted)}
    .actions button{margin-right:6px}
    .status-open{background:#eab308;color:#051018;padding:4px 8px;border-radius:999px;font-weight:600;font-size:12px}
    .status-closed{background:#10b981;color:#02221a;padding:4px 8px;border-radius:999px;font-weight:600;font-size:12px}
    .status-pending{background:#60a5fa;color:#041430;padding:4px 8px;border-radius:999px;font-weight:600;font-size:12px}
    form.row{display:flex;gap:10px;flex-wrap:wrap}
    .field{display:flex;flex-direction:column;flex:1;min-width:160px}
    label{font-size:12px;color:var(--muted);margin-bottom:6px}
    input,select,textarea{background:transparent;border:1px solid rgba(255,255,255,0.04);padding:8px;border-radius:8px;color:inherit}
    footer{margin-top:14px;color:var(--muted);font-size:13px}
    .muted{color:var(--muted)}
    .small{font-size:12px}
    .search{margin-left:auto;display:flex;gap:6px;align-items:center}
    .file-input{display:none}
    @media (max-width:720px){.row-cols-mobile{flex-direction:column}}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>ECR Tracker — Editable</h1>
        <p class="lead">Single-file HTML app — add, edit, delete, import/export, and save locally.</p>
      </div>
    </header>

    <div class="card">
      <div class="toolbar">
        <button id="addBtn" class="btn primary">+ Add Entry</button>
        <button id="exportCsv" class="btn">Export CSV</button>
        <button id="exportJson" class="btn">Export JSON</button>
        <button id="clearBtn" class="btn">Clear All</button>
        <label class="btn" for="importFile">Import CSV / JSON</label>
        <input id="importFile" class="file-input" type="file" accept=".csv,application/json" />
        <div class="search" style="margin-left:auto">
          <input id="search" placeholder="Search by ECR, name or remarks" style="padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:inherit" />
        </div>
      </div>

      <div id="tableWrap">
        <table id="ecrTable">
          <thead>
            <tr>
              <th>#</th>
              <th>Employee</th>
              <th>ECR No.</th>
              <th>Date</th>
              <th>Status</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- rows injected by JS -->
          </tbody>
        </table>
      </div>

      <footer>
        <div class="muted small">Saved in your browser (localStorage). You can export JSON/CSV and push the single HTML file to GitHub. Use GitHub Pages to publish it as a site.</div>
      </footer>
    </div>
  </div>

  <!-- Modal / Form -->
  <div id="modal" style="position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(2,6,23,0.6);padding:20px">
    <div class="card" style="width:100%;max-width:820px;">
      <form id="entryForm" class="row" style="gap:12px">
        <input type="hidden" id="entryId" />
        <div class="field"><label>Employee name</label><input id="employee" required /></div>
        <div class="field"><label>ECR number</label><input id="ecrno" required /></div>
        <div class="field"><label>Date</label><input id="date" type="date" /></div>
        <div class="field"><label>Status</label>
          <select id="status">
            <option value="Open">Open</option>
            <option value="Pending">Pending</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div class="field" style="flex-basis:100%"><label>Remarks</label><textarea id="remarks" rows="3"></textarea></div>

        <div style="display:flex;gap:8px;margin-left:auto">
          <button type="button" id="cancel" class="btn">Cancel</button>
          <button type="submit" class="btn primary">Save</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    // Simple ECR tracker app
    const STORAGE_KEY = 'ecr-tracker-v1';
    let entries = [];

    // DOM
    const tbody = document.querySelector('#ecrTable tbody');
    const addBtn = document.getElementById('addBtn');
    const modal = document.getElementById('modal');
    const entryForm = document.getElementById('entryForm');
    const entryId = document.getElementById('entryId');
    const employee = document.getElementById('employee');
    const ecrno = document.getElementById('ecrno');
    const dateEl = document.getElementById('date');
    const statusEl = document.getElementById('status');
    const remarks = document.getElementById('remarks');
    const cancel = document.getElementById('cancel');
    const exportCsv = document.getElementById('exportCsv');
    const exportJson = document.getElementById('exportJson');
    const clearBtn = document.getElementById('clearBtn');
    const importFile = document.getElementById('importFile');
    const search = document.getElementById('search');

    // helpers
    function uid(){return Date.now().toString(36) + Math.random().toString(36).slice(2,8)}

    function load(){
      try{
        const raw = localStorage.getItem(STORAGE_KEY);
        entries = raw ? JSON.parse(raw) : [];
      }catch(e){entries=[]}
    }
    function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }

    function formatDate(d){ if(!d) return '-'; const dt = new Date(d); if(isNaN(dt)) return d; return dt.toLocaleDateString(); }

    function statusLabel(s){
      if(s==='Closed') return `<span class="status-closed">Closed</span>`;
      if(s==='Pending') return `<span class="status-pending">Pending</span>`;
      return `<span class="status-open">Open</span>`;
    }

    function render(filter=''){
      tbody.innerHTML = '';
      const list = entries.filter(ent => {
        if(!filter) return true;
        const q = filter.toLowerCase();
        return (ent.employee||'').toLowerCase().includes(q) || (ent.ecrno||'').toLowerCase().includes(q) || (ent.remarks||'').toLowerCase().includes(q);
      });
      if(list.length===0){
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px">No entries. Click "Add Entry" to create one.</td></tr>`;
        return;
      }
      list.forEach((ent, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${i+1}</td>
          <td><strong>${escapeHtml(ent.employee||'')}</strong><br><small>${ent.id}</small></td>
          <td>${escapeHtml(ent.ecrno||'')}</td>
          <td>${formatDate(ent.date)}</td>
          <td>${statusLabel(ent.status||'Open')}</td>
          <td>${escapeHtml(ent.remarks||'')}</td>
          <td class="actions">
            <button class="btn" data-action="edit" data-id="${ent.id}">Edit</button>
            <button class="btn" data-action="del" data-id="${ent.id}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

    // events
    addBtn.addEventListener('click', ()=>{
      entryForm.reset(); entryId.value=''; modal.style.display='flex';
      // default date to today
      dateEl.valueAsDate = new Date();
    });

    cancel.addEventListener('click', ()=>{ modal.style.display='none'; });

    entryForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const id = entryId.value || uid();
      const payload = { id, employee: employee.value.trim(), ecrno: ecrno.value.trim(), date: dateEl.value, status: statusEl.value, remarks: remarks.value.trim() };
      const idx = entries.findIndex(x=>x.id===id);
      if(idx>=0) entries[idx]=payload; else entries.unshift(payload);
      save(); render(search.value);
      modal.style.display='none';
    });

    tbody.addEventListener('click', (e)=>{
      const btn = e.target.closest('button'); if(!btn) return;
      const action = btn.dataset.action; const id = btn.dataset.id;
      if(action==='edit'){
        const ent = entries.find(x=>x.id===id); if(!ent) return;
        entryId.value = ent.id; employee.value = ent.employee; ecrno.value = ent.ecrno; dateEl.value = ent.date; statusEl.value = ent.status; remarks.value = ent.remarks;
        modal.style.display='flex';
      }
      if(action==='del'){
        if(!confirm('Delete this entry?')) return;
        entries = entries.filter(x=>x.id!==id); save(); render(search.value);
      }
    });

    exportJson.addEventListener('click', ()=>{
      const blob = new Blob([JSON.stringify(entries, null, 2)], {type:'application/json'});
      downloadBlob(blob, 'ecr-entries.json');
    });

    exportCsv.addEventListener('click', ()=>{
      const rows = [ ['id','employee','ecrno','date','status','remarks'] ];
      entries.forEach(r => rows.push([r.id, r.employee, r.ecrno, r.date, r.status, (r.remarks||'').replace(/\n/g, ' ')]));
      const csv = rows.map(r => r.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], {type:'text/csv'});
      downloadBlob(blob, 'ecr-entries.csv');
    });

    clearBtn.addEventListener('click', ()=>{
      if(!confirm('Clear all entries? This cannot be undone.')) return;
      entries = []; save(); render();
    });

    importFile.addEventListener('change', async (e)=>{
      const f = e.target.files[0]; if(!f) return; const text = await f.text();
      try{
        if(f.name.toLowerCase().endsWith('.json')){
          const data = JSON.parse(text); if(Array.isArray(data)) entries = data.concat(entries); else throw new Error('Invalid JSON');
        } else {
          // simple csv parse (header expected) - not exhaustive but good for basic csv's
          const rows = text.split(/\r?\n/).filter(r=>r.trim());
          const header = rows.shift().split(',').map(h=>h.replace(/"/g,'').trim().toLowerCase());
          rows.forEach(r=>{
            const cols = r.split(',').map(c=>c.replace(/"/g,'').trim());
            const obj = {};
            header.forEach((h,i)=>obj[h]=cols[i]||'');
            const entry = { id: obj.id || uid(), employee: obj.employee||'', ecrno: obj.ecrno||'', date: obj.date||'', status: obj.status||'Open', remarks: obj.remarks||'' };
            entries.unshift(entry);
          });
        }
        save(); render(); alert('Import complete');
      }catch(err){ alert('Import failed: '+err.message); }
      e.target.value='';
    });

    function downloadBlob(blob, filename){
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }

    search.addEventListener('input', ()=> render(search.value));

    // initialize demo sample if empty
    load();
    if(entries.length===0){
      entries = [
        {id:uid(), employee:'Amit Kumar', ecrno:'ECR-2025-001', date:new Date().toISOString().slice(0,10), status:'Open', remarks:'First entry'},
        {id:uid(), employee:'Neha Patil', ecrno:'ECR-2025-002', date:'2025-11-30', status:'Pending', remarks:'Follow up required'},
      ];
      save();
    }
    render();

    // keyboard: Esc to close modal
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ modal.style.display='none' } });

    // expose a simple API for debugging
    window.ECRTracker = {entries, save, load, render};
  </script>
</body>
</html>
