export function renderFilePreview(container, rows, schema, label, { issues = [], onReview } = {}) {
  if (!container || !schema) return;
  const heading = document.createElement('div');
  heading.className = 'preview-file-heading';
  const name = document.createElement('strong');
  name.textContent = label?.replace(/ · \d+ filas$/, '') || 'Archivo de ejemplo';
  const note = document.createElement('p');
  note.textContent = `${rows.length} filas · vista de las primeras ${Math.min(rows.length, 6)}`;
  heading.append(name, note);
  const fields = schema.fields.filter((field) =>
    ['material', 'descripcion', 'centro', 'precio'].includes(field.key),
  );
  const scroll = document.createElement('div');
  scroll.className = 'preview-data-scroll';
  scroll.tabIndex = 0;
  scroll.setAttribute('role', 'region');
  scroll.setAttribute('aria-label', 'Datos de muestra; tabla desplazable');
  const table = document.createElement('table');
  const head = table.createTHead().insertRow();
  fields.forEach((field) => {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = field.label;
    head.append(cell);
  });
  if (onReview) {
    const actionHeading = document.createElement('th');
    actionHeading.scope = 'col';
    actionHeading.textContent = 'Fila';
    head.append(actionHeading);
  }
  const body = table.createTBody();
  rows.slice(0, 6).forEach((row, index) => {
    const line = body.insertRow();
    const rowNumber = index + 2;
    const hasErrors = issues.some((issue) => issue.row === rowNumber && issue.severity === 'error');
    line.className = hasErrors ? 'preview-row-error' : 'preview-row-ready';
    fields.forEach((field) => {
      const cell = line.insertCell();
      cell.textContent = row[field.key] ?? '';
    });
    if (onReview) {
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'preview-row-action';
      action.dataset.previewRow = String(rowNumber);
      action.textContent = hasErrors ? 'Revisar' : 'Ver fila';
      action.setAttribute('aria-label', `Revisar fila ${rowNumber} desde vista previa`);
      action.addEventListener('click', () => onReview(rowNumber));
      line.insertCell().append(action);
    }
  });
  scroll.append(table);
  const caption = document.createElement('p');
  caption.className = 'preview-data-note';
  caption.textContent =
    'Abrí una fila para consultar sus datos o corregirla. El archivo original no cambia.';
  container.replaceChildren(heading, scroll, caption);
}
