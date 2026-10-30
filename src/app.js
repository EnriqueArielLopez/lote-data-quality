import { icon } from './icons.js';
import { readBatch, validateBatch, exportRecords, exportIssues } from './validator.js';
import { errorSample, validSample } from './sample.js';
import { initTutorial } from './tutorial.js?v=20261030-icons-1';
import { initWorkspace } from './workspace.js';
initWorkspace();
initTutorial();
const $ = (selector) => document.querySelector(selector);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
  );
let schema,
  rows = [],
  report,
  filter = 'all',
  page = 1,
  history = [],
  editIndex,
  origin;
const PAGE_SIZE = 8;
// El perfil llega por HTTP. Ninguna acción de datos debe adelantarse a esa carga.
const controls = [...document.querySelectorAll('button,input')].filter(
  (control) => !control.closest('#tutorial-dialog') && control.id !== 'open-tutorial',
);
controls.forEach((control) => (control.disabled = true));
$('#file-label').textContent = 'Cargando perfil de validación…';
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $('#toast').classList.remove('visible'), 4500);
}
function updateReport() {
  report = validateBatch(rows, schema, $('#normalize').checked);
  render();
}
function loadText(text, name) {
  const next = readBatch(text, schema);
  rows = next;
  history = [];
  page = 1;
  filter = 'all';
  $('#search').value = '';
  $('#file-label').textContent = `${name} · ${rows.length} filas`;
  updateReport();
}
function filteredIssues() {
  const needle = $('#search').value.trim().toLocaleLowerCase('es');
  return report.issues.filter(
    (issue) =>
      (filter === 'all' || issue.severity === filter) &&
      (!needle ||
        `${issue.field} ${issue.value} ${issue.code} ${issue.message} ${issue.row}`
          .toLocaleLowerCase('es')
          .includes(needle)),
  );
}
function render() {
  const { summary } = report;
  const score = summary.rows ? Math.round((summary.accepted / summary.rows) * 100) : 0;
  $('#score').textContent = score + '%';
  $('#score-bar').style.width = score + '%';
  $('#score-description').textContent =
    `${summary.accepted} de ${summary.rows} filas no tienen errores bloqueantes.`;
  $('#accepted').textContent = summary.accepted;
  $('#rejected').textContent = summary.rejected;
  $('#warnings').textContent = summary.warnings;
  $('#all-count').textContent = report.issues.length;
  $('#undo').disabled = !history.length;
  $('#export-accepted').disabled = !summary.accepted;
  $('#export-issues').disabled = !report.issues.length;
  document
    .querySelectorAll('[data-filter]')
    .forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.filter === filter)),
    );
  const list = filteredIssues();
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  page = Math.min(page, pages);
  $('#issues').innerHTML = list
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    .map(
      (issue) =>
        `<tr><td>${issue.row}</td><td>${escape(issue.field)}<small>${escape(issue.code)}</small></td><td><span class="bad-value" title="${escape(issue.value)}">${issue.value ? escape(issue.value) : '— vacío —'}</span></td><td class="issue-description">${escape(issue.message)}</td><td><span class="badge ${issue.severity}">${issue.severity === 'error' ? 'Error' : 'Advertencia'}</span></td><td><button class="edit-row" data-row="${issue.row}" aria-label="Revisar fila ${issue.row}, ${escape(issue.field)}">${icon('arrow-up-right')}</button></td></tr>`,
    )
    .join('');
  $('#empty').hidden = !!list.length;
  $('#empty-title').textContent = report.issues.length
    ? 'Sin coincidencias'
    : 'El lote está listo para continuar.';
  $('#empty-text').textContent = report.issues.length
    ? 'Cambiá el filtro o la búsqueda.'
    : 'No se encontraron incidencias con el perfil actual. El sistema destino puede aplicar otras reglas.';
  $('#page-label').textContent = list.length
    ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, list.length)} de ${list.length} incidencias`
    : '0 incidencias';
  $('#previous').disabled = page === 1;
  $('#next').disabled = page === pages;
  renderOverview();
}
function priorityIssue() {
  return (
    report?.issues.find((issue) => issue.code === 'DUPLICATE') ||
    report?.issues.find((issue) => issue.code === 'REQUIRED') ||
    report?.issues.find((issue) => issue.code === 'PRICE') ||
    report?.issues.find((issue) => issue.severity === 'error') ||
    report?.issues[0]
  );
}
function renderOverview() {
  const errors = new Set(
    report.issues.filter((issue) => issue.severity === 'error').map((issue) => issue.row),
  );
  const warnings = new Set(
    report.issues
      .filter((issue) => issue.severity === 'warning' && !errors.has(issue.row))
      .map((issue) => issue.row),
  );
  const ready = rows.length - errors.size - warnings.size;
  $('#batch-caption').textContent =
    `${rows.length} filas · ${report.summary.accepted} sin errores bloqueantes`;
  $('#batch-visual').setAttribute(
    'aria-label',
    `${rows.length} filas: ${ready} sin incidencias, ${warnings.size} con advertencias y ${errors.size} por corregir.`,
  );
  const groupSize = Math.max(1, Math.ceil(rows.length / 40));
  const segments = [];
  for (let start = 0; start < rows.length; start += groupSize) {
    const end = Math.min(rows.length, start + groupSize);
    let blocked = 0,
      caution = 0;
    for (let index = start; index < end; index++) {
      if (errors.has(index + 2)) blocked++;
      else if (warnings.has(index + 2)) caution++;
    }
    const state = blocked ? 'blocked' : caution ? 'caution' : 'ready';
    const label = start + 1 === end ? `Fila ${start + 2}` : `Filas ${start + 2}–${end + 1}`;
    segments.push(
      `<span class="batch-${state}" title="${label}: ${blocked} con errores, ${caution} con advertencias, ${end - start - blocked - caution} sin incidencias" aria-hidden="true"></span>`,
    );
  }
  $('#batch-visual').innerHTML = segments.join('');
  const duplicateRows = new Set(
    report.issues.filter((issue) => issue.code === 'DUPLICATE').map((issue) => issue.row),
  ).size;
  const missing = report.issues.filter((issue) => issue.code === 'REQUIRED').length;
  const values = report.issues.filter(
    (issue) => issue.severity === 'error' && !['DUPLICATE', 'REQUIRED'].includes(issue.code),
  ).length;
  $('#finding-duplicates').textContent =
    `${duplicateRows} ${duplicateRows === 1 ? 'fila' : 'filas'}`;
  $('#finding-missing').textContent = `${missing} ${missing === 1 ? 'campo' : 'campos'}`;
  $('#finding-values').textContent = `${values} ${values === 1 ? 'incidencia' : 'incidencias'}`;
  const priority = priorityIssue();
  $('#priority-message').textContent = duplicateRows
    ? `Hay ${duplicateRows} filas con una clave repetida. Comparalas con tu planilla: Lote marca todas sus apariciones.`
    : missing
      ? 'Completá los campos obligatorios vacíos con los datos de tu fuente.'
      : report.summary.errors
        ? 'Empezá por los valores fuera de regla. La ayuda de cada campo te dice qué revisar.'
        : report.summary.warnings
          ? 'Las filas pueden exportarse. Revisá las advertencias antes de usar el resultado.'
          : 'No hay incidencias con este perfil. Ya podés descargar las filas revisadas.';
  $('#review-priority').disabled = !priority;
  $('#review-priority').innerHTML = priority
    ? `${priority.severity === 'warning' ? 'Ver advertencias' : 'Revisar primero'} ${icon('arrow-down-right')}`
    : `Revisión sin incidencias ${icon('check')}`;
}
$('#review-priority').addEventListener('click', () => {
  const issue = priorityIssue();
  if (!issue) return;
  filter = issue.severity;
  page = 1;
  $('#search').value = issue.code;
  render();
  $('.issue-toolbar').scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    block: 'start',
  });
  $('#search').focus({ preventScroll: true });
});
function openDialog(dialog) {
  origin = document.activeElement;
  dialog.showModal();
  document.documentElement.style.overflow = 'hidden';
}
function closeDialog(dialog) {
  dialog.close();
}
for (const dialog of document.querySelectorAll('dialog:not(#tutorial-dialog)')) {
  dialog.addEventListener('close', () => {
    document.documentElement.style.overflow = '';
    if (origin?.isConnected) {
      origin.focus({ preventScroll: true });
      return;
    }
    const sameRow =
      dialog.id === 'editor'
        ? document.querySelector(`#issues button[data-row="${editIndex + 2}"]`)
        : null;
    if (sameRow) sameRow.focus({ preventScroll: true });
    else $('#results-title').focus();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    }
  });
}
$('#issues').addEventListener('click', (event) => {
  const button = event.target.closest('[data-row]');
  if (!button) return;
  editIndex = Number(button.dataset.row) - 2;
  $('#editor-title').textContent = `Revisar fila ${editIndex + 2}`;
  $('#editor-fields').innerHTML =
    '<div class="field-group">' +
    schema.fields
      .map(
        (field) =>
          `<label>${escape(field.label)}<input aria-label="${escape(field.label)}" aria-describedby="hint-${field.key}" name="${field.key}" value="${escape(rows[editIndex][field.key])}" autocomplete="off" maxlength="2000"><small id="hint-${field.key}">${escape(field.hint)}</small></label>`,
      )
      .join('') +
    '</div>';
  openDialog($('#editor'));
});
$('#editor-form').addEventListener('submit', (event) => {
  event.preventDefault();
  history.push(structuredClone(rows));
  if (history.length > 20) history.shift();
  rows[editIndex] = Object.fromEntries(
    schema.fields.map((field) => [field.key, event.target.elements[field.key].value]),
  );
  updateReport();
  closeDialog($('#editor'));
  toast('Fila actualizada. Se revisó el lote completo, incluidas sus claves duplicadas.');
});
$('#undo').addEventListener('click', () => {
  if (history.length) {
    rows = history.pop();
    updateReport();
    if (!history.length) $('#results-title').focus();
    toast('Se deshizo la última corrección.');
  }
});
$('#close-editor').addEventListener('click', () => closeDialog($('#editor')));
$('#cancel-edit').addEventListener('click', () => closeDialog($('#editor')));
$('#show-rules').addEventListener('click', () => openDialog($('#rules-dialog')));
$('#close-rules').addEventListener('click', () => closeDialog($('#rules-dialog')));
$('#normalize').addEventListener('change', () => {
  page = 1;
  updateReport();
  toast(
    $('#normalize').checked
      ? 'Normalización activada. Los cambios se identifican como advertencias.'
      : 'Normalización desactivada. Se revisan los valores de origen.',
  );
});
document.querySelectorAll('[data-filter]').forEach((button) =>
  button.addEventListener('click', () => {
    filter = button.dataset.filter;
    page = 1;
    render();
  }),
);
$('#search').addEventListener('input', () => {
  page = 1;
  render();
});
$('#previous').addEventListener('click', () => {
  page--;
  render();
});
$('#next').addEventListener('click', () => {
  page++;
  render();
});
$('#sample-errors').addEventListener('click', () => {
  loadText(errorSample, 'Ejemplo con errores');
  toast('Ejemplo con errores cargado.');
});
$('#sample-valid').addEventListener('click', () => {
  loadText(validSample, 'Ejemplo válido');
  toast('Ejemplo válido cargado.');
});
async function importFile(file) {
  if (!file) return;
  if (!schema) {
    toast('Esperá a que termine de cargar el perfil de revisión.');
    return;
  }
  try {
    if (/\.(xlsx?|ods)$/i.test(file.name))
      throw new Error('Exportá tu planilla como CSV. Lote no abre archivos XLSX, XLS ni ODS.');
    if (file.size > 2_000_000) throw new Error('El archivo supera 2 MB.');
    loadText(await file.text(), file.name);
    toast('Archivo revisado en este navegador.');
  } catch (error) {
    toast(error.message);
  }
}
$('#file').addEventListener('change', async (event) => {
  await importFile(event.target.files[0]);
  event.target.value = '';
});
$('#drop-zone').addEventListener('dragover', (event) => {
  event.preventDefault();
  $('#drop-zone').classList.add('dragging');
});
$('#drop-zone').addEventListener('dragleave', () => $('#drop-zone').classList.remove('dragging'));
$('#drop-zone').addEventListener('drop', async (event) => {
  event.preventDefault();
  $('#drop-zone').classList.remove('dragging');
  await importFile(event.dataTransfer.files[0]);
});
function download(contents, name, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('#export-accepted').addEventListener('click', () => {
  download(exportRecords(report.accepted, schema), 'lote-materiales-validos.csv');
  toast(`${report.accepted.length} filas exportadas. Revisá las advertencias antes de la carga.`);
});
$('#export-issues').addEventListener('click', () =>
  download(exportIssues(report.issues), 'lote-incidencias.csv'),
);
$('#export-json').addEventListener('click', () =>
  download(
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        profile: schema.name,
        normalized: $('#normalize').checked,
        ...report,
      },
      null,
      2,
    ),
    'lote-reporte.json',
    'application/json',
  ),
);
try {
  const response = await fetch('rules.json');
  if (!response.ok) throw new Error('No se pudo cargar el perfil.');
  schema = await response.json();
  $('#rules-list').innerHTML = schema.fields
    .map(
      (field) =>
        `<article class="rule"><strong>${escape(field.label)}</strong><small>${field.key}</small><p>${escape(field.hint)}</p></article>`,
    )
    .join('');
  controls.forEach((control) => (control.disabled = false));
  loadText(errorSample, 'Ejemplo con errores');
} catch (error) {
  toast(error.message);
  $('#results-title').textContent = 'No se pudo iniciar la revisión';
  controls.forEach((control) => (control.disabled = true));
}
