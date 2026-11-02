export function renderFilePreview(container, rows, schema, label) {
  if (!container || !schema) return;
  const heading = document.createElement('div');
  heading.className = 'preview-file-heading';
  const name = document.createElement('strong');
  name.textContent = label || 'Archivo de ejemplo';
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
  const body = table.createTBody();
  rows.slice(0, 6).forEach((row) => {
    const line = body.insertRow();
    fields.forEach((field) => {
      const cell = line.insertCell();
      cell.textContent = row[field.key] ?? '';
    });
  });
  scroll.append(table);
  const caption = document.createElement('p');
  caption.className = 'preview-data-note';
  caption.textContent = 'La revisión señala los problemas sin modificar el archivo original.';
  container.replaceChildren(heading, scroll, caption);
}
