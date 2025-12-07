/**
 * Frontend SPA (vanilla JS) for "entities" table on Supabase.
 *
 * IMPORTANT: Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project's values.
 * Do NOT commit real anon keys to a public repo — for the lab it's acceptable to keep them here
 * if the repo is private or the instructor requested it.
 *
 * Entity fields (final, A + B):
 * - id (integer, PK)
 * - title (text)         <-- required (A)
 * - amount (numeric)     <-- required (A)
 * - description (text)   <-- optional (A)
 * - created_at (timestamp with time zone, default now) <-- auto (A)
 * - status (text)        <-- added in B (e.g. 'open'/'done')
 * - due_date (date)      <-- added in B
 *
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// === CONFIG: set your Supabase values here ===
const SUPABASE_URL = 'https://REPLACE_WITH_YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'REPLACE_WITH_YOUR_ANON_KEY';
// =============================================
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const table = 'entities';

const els = {
  form: document.getElementById('entity-form'),
  id: document.getElementById('entity-id'),
  title: document.getElementById('title'),
  amount: document.getElementById('amount'),
  description: document.getElementById('description'),
  due_date: document.getElementById('due_date'),
  status: document.getElementById('status'),
  saveBtn: document.getElementById('save-btn'),
  cancelBtn: document.getElementById('cancel-btn'),
  refreshBtn: document.getElementById('refresh-btn'),
  filterInput: document.getElementById('filter-input'),
  tableBody: document.querySelector('#entities-table tbody'),
  formTitle: document.getElementById('form-title'),
};

async function fetchEntities() {
  const filter = els.filterInput.value.trim();
  let query = supabase.from(table).select('*').order('id', { ascending: true });
  if (filter) query = query.ilike('title', `%${filter}%`);
  const { data, error } = await query;
  if (error) return alert('Błąd fetch: ' + error.message);
  renderTable(data || []);
}

function renderTable(items) {
  els.tableBody.innerHTML = '';
  for (const it of items) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${it.id}</td>
      <td>${escapeHtml(it.title || '')}</td>
      <td>${it.amount ?? ''}</td>
      <td>${it.due_date ?? ''}</td>
      <td>${escapeHtml(it.status || '')}</td>
      <td>${it.created_at ? new Date(it.created_at).toLocaleString() : ''}</td>
      <td class="actions">
        <button data-id="${it.id}" class="edit">Edytuj</button>
        <button data-id="${it.id}" class="delete">Usuń</button>
        <button data-id="${it.id}" class="details">Szczegóły</button>
      </td>
    `;
    els.tableBody.appendChild(tr);
  }
  // attach handlers
  document.querySelectorAll('.edit').forEach(b => b.onclick = e => loadForEdit(+e.target.dataset.id));
  document.querySelectorAll('.delete').forEach(b => b.onclick = e => confirmDelete(+e.target.dataset.id));
  document.querySelectorAll('.details').forEach(b => b.onclick = e => showDetails(+e.target.dataset.id));
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

async function loadForEdit(id) {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
  if (error) return alert('Błąd pobierania: ' + error.message);
  const it = data;
  els.id.value = it.id;
  els.title.value = it.title ?? '';
  els.amount.value = it.amount ?? '';
  els.description.value = it.description ?? '';
  els.due_date.value = it.due_date ?? '';
  els.status.value = it.status ?? '';
  els.formTitle.textContent = 'Edytuj encję #' + it.id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearForm() {
  els.id.value = '';
  els.title.value = '';
  els.amount.value = '';
  els.description.value = '';
  els.due_date.value = '';
  els.status.value = '';
  els.formTitle.textContent = 'Dodaj nową encję';
}

async function confirmDelete(id) {
  if (!confirm('Na pewno usunąć encję id=' + id + '?')) return;
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return alert('Błąd usuwania: ' + error.message);
  await fetchEntities();
}

async function showDetails(id) {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
  if (error) return alert('Błąd: ' + error.message);
  const it = data;
  alert(
    'Szczegóły (id=' + it.id + ')\n' +
    'Title: ' + it.title + '\n' +
    'Amount: ' + it.amount + '\n' +
    'Description: ' + (it.description || '') + '\n' +
    'Due date: ' + (it.due_date || '') + '\n' +
    'Status: ' + (it.status || '') + '\n' +
    'Created at: ' + (it.created_at || '')
  );
}

els.form.onsubmit = async (ev) => {
  ev.preventDefault();
  // validation (simple)
  const title = els.title.value.trim();
  const amount = Number(els.amount.value);
  if (!title) return alert('Title wymagane');
  if (!Number.isFinite(amount)) return alert('Amount musi być liczbą');

  const payload = {
    title,
    amount,
    description: els.description.value.trim() || null,
    due_date: els.due_date.value || null,
    status: els.status.value.trim() || null,
  };

  if (els.id.value) {
    // UPDATE
    const id = Number(els.id.value);
    const { error } = await supabase.from(table).update(payload).eq('id', id);
    if (error) return alert('Błąd aktualizacji: ' + error.message);
    clearForm();
    await fetchEntities();
  } else {
    // CREATE
    const { error } = await supabase.from(table).insert([payload]);
    if (error) return alert('Błąd tworzenia: ' + error.message);
    clearForm();
    await fetchEntities();
  }
};

els.cancelBtn.onclick = (e) => {
  clearForm();
};

els.refreshBtn.onclick = (e) => fetchEntities();
els.filterInput.oninput = debounce(() => fetchEntities(), 300);

// small util
function debounce(fn, wait=200){
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(()=>fn(...a), wait); }
}

// initial load
fetchEntities();
