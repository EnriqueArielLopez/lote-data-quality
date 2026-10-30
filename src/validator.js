import { parseCSV, toCSV } from './csv.js';
export function readBatch(text, schema) {
  const result = parseCSV(text);
  const expected = schema.fields.map((field) => field.key);
  const missing = expected.filter((key) => !result.headers.includes(key));
  const extra = result.headers.filter((key) => !expected.includes(key));
  if (missing.length || extra.length)
    throw new Error(
      `Cabecera incompatible.${missing.length ? ' Faltan: ' + missing.join(',') + '.' : ''}${extra.length ? ' Sobran: ' + extra.join(',') + '.' : ''}`,
    );
  return result.rows;
}
export function validateBatch(rows, schema, normalize = false) {
  const issues = [];
  const records = rows.map((source, index) => {
    const record = {};
    const row = index + 2;
    for (const field of schema.fields) {
      const raw = String(source[field.key] ?? '');
      let value = raw;
      const add = (severity, code, message) =>
        issues.push({ row, field: field.key, severity, code, value: raw, message });
      if (normalize) {
        value = value.trim();
        if (field.uppercase) value = value.toUpperCase();
        if (value !== raw) add('warning', 'NORMALIZED', 'Se normalizaron espacios o mayúsculas.');
      }
      record[field.key] = value;
      if (field.required && !value.trim()) {
        add('error', 'REQUIRED', 'Campo obligatorio.');
        continue;
      }
      if (!normalize && value !== value.trim())
        add('warning', 'WHITESPACE', 'Hay espacios al inicio o al final.');
      if (field.pattern && new RegExp(field.pattern).exec(value)?.[0] !== value)
        add('error', 'PATTERN', field.hint);
      if (field.maxLength && [...value].length > field.maxLength)
        add('error', 'MAX_LENGTH', field.hint);
      if (field.enum && !field.enum.includes(value)) add('error', 'ENUM', field.hint);
      if (field.kind === 'price') {
        if (!/^\d{1,9}(\.\d{1,2})?$/.test(value) || /[\r\n]/.test(value))
          add('error', 'PRICE', field.hint);
        else if (Number(value) === 0)
          add('warning', 'ZERO_PRICE', 'Precio cero: revisar antes de la carga.');
      }
    }
    return record;
  });
  const keys = new Map();
  records.forEach((record, index) => {
    if (schema.unique.some((key) => !record[key]?.trim())) return;
    const key = JSON.stringify(schema.unique.map((field) => record[field]));
    if (!keys.has(key)) keys.set(key, []);
    keys.get(key).push(index);
  });
  for (const indexes of keys.values())
    if (indexes.length > 1)
      for (const index of indexes)
        issues.push({
          row: index + 2,
          field: schema.unique.join('+'),
          severity: 'error',
          code: 'DUPLICATE',
          value: schema.unique.map((field) => records[index][field]).join(' / '),
          message: 'La combinación material + centro se repite en el lote.',
        });
  issues.sort(
    (a, b) => a.row - b.row || a.field.localeCompare(b.field) || a.code.localeCompare(b.code),
  );
  const rejectedRows = new Set(
    issues.filter((issue) => issue.severity === 'error').map((issue) => issue.row),
  );
  const accepted = records.filter((_, index) => !rejectedRows.has(index + 2));
  return {
    schemaVersion: schema.version,
    records,
    issues,
    accepted,
    rejected: records.filter((_, index) => rejectedRows.has(index + 2)),
    summary: {
      rows: records.length,
      accepted: accepted.length,
      rejected: rejectedRows.size,
      errors: issues.filter((issue) => issue.severity === 'error').length,
      warnings: issues.filter((issue) => issue.severity === 'warning').length,
    },
  };
}
export function exportRecords(rows, schema) {
  return toCSV(
    schema.fields.map((field) => field.key),
    rows,
  );
}
export function exportIssues(issues) {
  return toCSV(['row', 'field', 'severity', 'code', 'value', 'message'], issues);
}
