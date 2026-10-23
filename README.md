# Lote / Calidad de datos maestros

Una revisión previa de archivos de materiales: encontrar errores por fila, corregirlos y exportar un lote que cumpla un perfil explícito.

Proyecto de demostración de Ariel López. Los datos son ficticios. El perfil está inspirado en tareas de preparación de datos para procesos SAP; **no es un conector SAP ni una especificación universal de ese sistema**.

[Abrir demo](https://ariel-lopezPS.github.io/lote-data-quality/)

## Flujo

1. Subir/arrastrar un CSV o cargar una muestra válida o con errores.
2. Revisar campos obligatorios, formato, catálogos, precio y clave única `material + centro`.
3. Filtrar incidencias, abrir una fila y corregirla. Se valida nuevamente todo el lote, para detectar también duplicados derivados de la corrección.
4. Descargar filas sin errores, incidencias CSV o reporte JSON. Las advertencias no bloquean la exportación y se conservan en el reporte.

La normalización de espacios y mayúsculas es **optativa**. Cada campo modificado se identifica como advertencia. Hay historial de las últimas 20 correcciones de la sesión.

## Ejecutar la interfaz

```sh
python -m http.server 4182 --bind 127.0.0.1
# Abrir http://127.0.0.1:4182
```

No hay build ni dependencias de frontend. La tipografía se aloja localmente. Los archivos se procesan en memoria; no se envían a un servidor y no se guardan al cerrar la pestaña.

## Uso por consola

Requiere Python 3.10+, exclusivamente biblioteca estándar.

```sh
python python/lote.py examples/materiales-validos.csv
python python/lote.py examples/materiales-errores.csv --normalize --format json
python python/lote.py examples/materiales-errores.csv --report revision.json --valid validos.csv
```

| Código de salida | Resultado |
| --- | --- |
| `0` | Lote sin errores bloqueantes (puede contener advertencias) |
| `1` | Lote revisado con errores de datos |
| `2` | No se pudo procesar el archivo, perfil o argumentos |

## Un perfil, dos implementaciones

`rules.json` define los ocho campos, catálogos de ejemplo, formatos, longitudes y clave compuesta. Tanto JavaScript como Python leen ese archivo. Las pruebas de paridad comparan filas aceptadas, resumen y códigos de incidencias de las dos implementaciones.

```sh
npm test
```

Requiere Node 20+ y Python en `PATH`. Si el ejecutable tiene otro nombre, establecer `LOTE_PYTHON` con su ruta. No se necesita `npm install`.

## Contrato CSV

Columnas exactas (pueden venir en otro orden): `material,descripcion,tipo,unidad,grupo,centro,precio,moneda`.

- UTF-8 con o sin BOM; coma o punto y coma; campos entre comillas y multilínea.
- Se rechazan cabeceras duplicadas, columnas desconocidas y filas de longitud diferente.
- Hasta 2 MB, 5.000 filas y 2.000 caracteres por celda.
- Los códigos se mantienen como texto: `010` no se convierte a `10`.
- Precio con punto decimal, máximo dos decimales y sin miles. Cero genera advertencia.
- Los duplicados invalidan **todas** sus apariciones; no se elige silenciosamente una fila ganadora.
- Los CSV de salida neutralizan fórmulas de planillas. Si una descripción empieza con `=`, `+`, `-` o `@`, el CSV agrega una comilla simple de protección.

Los números de fila son posiciones lógicas del CSV, incluida la cabecera. Un campo entre comillas puede ocupar varias líneas físicas.

## Diseño y límites

`src/validator.js` no depende del DOM; `src/app.js` se ocupa de la interfaz y las descargas; `python/lote.py` expone el mismo flujo en consola. Los datos importados se insertan como texto escapado, nunca como HTML ejecutable.

La aplicación no consulta maestros reales ni verifica autorización, existencia de materiales o reglas dependientes de configuración SAP. Se debe adaptar el perfil y revisar los controles del destino antes de usar un lote real. No se incluyen datos, pantallas o código de clientes.

Tipografía Manrope, SIL Open Font License (`assets/OFL.txt`).

Validación del 22/10/2026: 11 pruebas aprobadas también en GitHub Actions. Demo publicada en GitHub Pages desde main; smoke externo de HTML, scripts y perfil. La interfaz bloquea acciones mientras carga el perfil para evitar una validación prematura. No se modificaron servicios corporativos.
