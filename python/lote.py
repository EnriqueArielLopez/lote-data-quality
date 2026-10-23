"""Validador de datos maestros. Python 3.10+, sin paquetes externos."""
import argparse
import csv
import io
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read_batch(text, schema):
    if len(text) > 2_000_000:
        raise ValueError("El archivo supera el límite de 2 MB.")
    text = text.lstrip("\ufeff")
    first_line = text.splitlines()[0] if text.splitlines() else ""
    delimiter = ";" if first_line.count(";") > first_line.count(",") else ","
    try:
        records = [row for row in csv.reader(io.StringIO(text, newline=""), delimiter=delimiter, strict=True) if any(row)]
    except csv.Error as error:
        raise ValueError(f"CSV inválido: {error}") from error
    if len(records) < 2:
        raise ValueError("Se necesita una cabecera y al menos una fila.")
    headers = [header.strip() for header in records.pop(0)]
    if len(headers) != len(set(headers)) or not all(headers):
        raise ValueError("Hay cabeceras vacías o repetidas.")
    expected = [field["key"] for field in schema["fields"]]
    if set(headers) != set(expected):
        raise ValueError("La cabecera no coincide con el perfil.")
    if len(records) > 5000:
        raise ValueError("Máximo 5.000 filas.")
    rows = []
    for number, row in enumerate(records, 2):
        if len(row) != len(headers):
            raise ValueError(f"Fila {number}: número de columnas incorrecto.")
        if any(len(value) > 2000 for value in row):
            raise ValueError(f"Fila {number}: celda de más de 2.000 caracteres.")
        rows.append(dict(zip(headers, row)))
    return rows


def validate_batch(rows, schema, normalize=False):
    records, issues = [], []
    for index, source in enumerate(rows):
        row, record = index + 2, {}
        for field in schema["fields"]:
            raw = str(source.get(field["key"], ""))
            value = raw

            def add(severity, code, message):
                issues.append(dict(row=row, field=field["key"], severity=severity, code=code, value=raw, message=message))

            if normalize:
                value = value.strip()
                if field.get("uppercase"):
                    value = value.upper()
                if value != raw:
                    add("warning", "NORMALIZED", "Se normalizaron espacios o mayúsculas.")
            record[field["key"]] = value
            if field.get("required") and not value.strip():
                add("error", "REQUIRED", "Campo obligatorio.")
                continue
            if not normalize and value != value.strip():
                add("warning", "WHITESPACE", "Hay espacios al inicio o al final.")
            if field.get("pattern") and not re.fullmatch(field["pattern"], value):
                add("error", "PATTERN", field["hint"])
            if field.get("maxLength") and len(value) > field["maxLength"]:
                add("error", "MAX_LENGTH", field["hint"])
            if field.get("enum") and value not in field["enum"]:
                add("error", "ENUM", field["hint"])
            if field.get("kind") == "price":
                if not re.fullmatch(r"\d{1,9}(\.\d{1,2})?", value, flags=re.ASCII):
                    add("error", "PRICE", field["hint"])
                elif float(value) == 0:
                    add("warning", "ZERO_PRICE", "Precio cero: revisar antes de la carga.")
        records.append(record)
    keys = {}
    for index, record in enumerate(records):
        if all(record[key].strip() for key in schema["unique"]):
            key = tuple(record[field] for field in schema["unique"])
            keys.setdefault(key, []).append(index)
    for indexes in keys.values():
        if len(indexes) > 1:
            for index in indexes:
                issues.append(dict(row=index + 2, field="+".join(schema["unique"]), severity="error", code="DUPLICATE", value=" / ".join(records[index][key] for key in schema["unique"]), message="La combinación material + centro se repite en el lote."))
    issues.sort(key=lambda issue: (issue["row"], issue["field"], issue["code"]))
    rejected = {issue["row"] for issue in issues if issue["severity"] == "error"}
    accepted_rows = [record for index, record in enumerate(records) if index + 2 not in rejected]
    return dict(schemaVersion=schema["version"], records=records, issues=issues, accepted=accepted_rows,
                rejected=[record for index, record in enumerate(records) if index + 2 in rejected],
                summary=dict(rows=len(rows), accepted=len(accepted_rows), rejected=len(rejected), errors=sum(issue["severity"] == "error" for issue in issues), warnings=sum(issue["severity"] == "warning" for issue in issues)))


def safe_cell(value):
    value = str(value)
    return "'" + value if re.match(r"^[\s\ufeff]*[=+@\-＝＋－＠\t\r\n]", value) else value


def main(argv=None):
    parser = argparse.ArgumentParser(description="Revisar un CSV de materiales antes de su carga.")
    parser.add_argument("input", type=Path, help="CSV UTF-8")
    parser.add_argument("--rules", type=Path, default=ROOT / "rules.json")
    parser.add_argument("--normalize", action="store_true")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    parser.add_argument("--report", type=Path, help="Guardar reporte JSON")
    parser.add_argument("--valid", type=Path, help="Exportar filas sin errores en CSV")
    args = parser.parse_args(argv)
    try:
        if args.input.stat().st_size > 2_000_000:
            raise ValueError("El archivo supera 2 MB.")
        schema = json.loads(args.rules.read_text(encoding="utf-8"))
        report = validate_batch(read_batch(args.input.read_text(encoding="utf-8-sig"), schema), schema, args.normalize)
        serialized = json.dumps(report, ensure_ascii=False, indent=2)
        if args.report:
            args.report.write_text(serialized, encoding="utf-8")
        if args.valid:
            with args.valid.open("w", encoding="utf-8-sig", newline="") as output:
                headers = [field["key"] for field in schema["fields"]]
                writer = csv.writer(output, quoting=csv.QUOTE_ALL)
                writer.writerow(headers)
                writer.writerows([[safe_cell(record[key]) for key in headers] for record in report["accepted"]])
        if args.format == "json":
            print(serialized)
        else:
            summary = report["summary"]
            print(f"Lote / {schema['name']}")
            print(f"{summary['rows']} filas | {summary['accepted']} válidas | {summary['rejected']} rechazadas | {summary['warnings']} advertencias")
            for issue in report["issues"]:
                print(f"Fila {issue['row']} [{issue['severity']}] {issue['field']}: {issue['message']}")
        return 1 if report["summary"]["errors"] else 0
    except (OSError, UnicodeError, ValueError, KeyError) as error:
        print(f"No se pudo revisar el archivo: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
