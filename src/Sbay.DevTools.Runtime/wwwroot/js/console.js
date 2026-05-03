// Console panel client — wires UI events to /console/api/* and to the CDP bridge.
const stream = document.querySelector('[data-stream]');
const promptForm = document.querySelector('[data-prompt]');
const promptInput = promptForm?.querySelector('input');
const filterInput = document.querySelector('.sb-filter-input');
const levelSelect = document.querySelector('.sb-level-filter');
const clearBtn = document.querySelector('[data-action="clear"]');

const history = [];
let historyIndex = -1;

function row(entry) {
  const li = document.createElement('li');
  li.dataset.level = entry.level || 'log';
  const icon = document.createElement('span');
  icon.textContent = iconFor(entry.level);
  const msg = document.createElement('span');
  msg.textContent = entry.text;
  const src = document.createElement('span');
  src.className = 'sb-source';
  src.textContent = entry.url ? `${shortUrl(entry.url)}:${entry.line ?? ''}` : '';
  li.append(icon, msg, src);
  return li;
}

function iconFor(level) {
  switch (level) {
    case 'error':   return '⛔';
    case 'warning': return '⚠';
    case 'info':    return 'ℹ';
    case 'debug':   return '⋯';
    default:        return '›';
  }
}

function shortUrl(u) {
  try { return new URL(u).pathname.split('/').pop() || u; } catch { return u; }
}

export function append(entry) {
  if (!stream) return;
  const li = row(entry);
  applyFilter(li);
  stream.appendChild(li);
  stream.scrollTop = stream.scrollHeight;
}

function applyFilter(li) {
  const lvl = levelSelect?.value ?? 'all';
  const text = (filterInput?.value ?? '').toLowerCase();
  const matchLvl = lvl === 'all' || li.dataset.level === lvl;
  const matchTxt = !text || li.textContent.toLowerCase().includes(text);
  li.style.display = (matchLvl && matchTxt) ? '' : 'none';
}

levelSelect?.addEventListener('change', () => stream.querySelectorAll('li').forEach(applyFilter));
filterInput?.addEventListener('input', () => stream.querySelectorAll('li').forEach(applyFilter));

clearBtn?.addEventListener('click', async () => {
  stream.replaceChildren();
  await fetch('/console/api/clear', { method: 'POST' });
});

promptForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const expr = promptInput.value.trim();
  if (!expr) return;
  history.push(expr); historyIndex = history.length;
  append({ level: 'log', text: `› ${expr}` });
  promptInput.value = '';

  const res = await fetch('/console/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expression: expr })
  });
  const dispatch = await res.json();
  window.parent?.postMessage({ kind: 'cdp.dispatch', payload: dispatch }, '*');
});

promptInput?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' && historyIndex > 0) {
    historyIndex--; promptInput.value = history[historyIndex] ?? '';
  } else if (e.key === 'ArrowDown' && historyIndex < history.length) {
    historyIndex++; promptInput.value = history[historyIndex] ?? '';
  }
});

window.addEventListener('message', (e) => {
  const m = e.data;
  if (!m || typeof m !== 'object') return;
  if (m.kind === 'console.append') append(m.entry);
  if (m.kind === 'cdp.result' && m.result) {
    append({
      level: m.result.exceptionDetails ? 'error' : 'log',
      text: formatResult(m.result)
    });
  }
});

function formatResult(r) {
  if (r.exceptionDetails) {
    return r.exceptionDetails.text + (r.exceptionDetails.exception?.description
      ? '\n' + r.exceptionDetails.exception.description : '');
  }
  const obj = r.result;
  if (!obj) return '';
  if ('value' in obj) return JSON.stringify(obj.value);
  return obj.description ?? obj.type;
}

fetch('/console/api/snapshot').then(r => r.json()).then(arr => arr.forEach(append));
