# Lote

**Lote revisa el CSV de una planilla de productos o materiales. Te muestra los errores, te ayuda a corregirlos y descarga el resultado.**

Si tenés tus datos en Excel, Google Sheets u otra planilla, primero exportalos como **CSV**. Lote busca campos vacíos, precios inválidos, códigos fuera del perfil y materiales repetidos dentro de un centro. Abrís cada problema, corregís el dato y descargás las filas sin errores o el informe. **No abre XLSX ni carga datos en SAP.**

### [Abrir Lote en el navegador →](https://enriqueariellopez.github.io/lote-data-quality/)

No necesitás instalar nada ni crear una cuenta. Podés empezar con los ejemplos incluidos, sin tener un archivo propio. Es un proyecto de demostración de [Ariel López](https://github.com/EnriqueArielLopez), con datos ficticios y un perfil inspirado en tareas de preparación de materiales para SAP.

## Mirá cómo funciona

Abrí **Ver cómo funciona** en la pantalla de inicio o [entrar directamente a la guía visual](https://enriqueariellopez.github.io/lote-data-quality/?tutorial=1). La guía usa un ejemplo ficticio aparte: **no cambia tu archivo cargado, tus correcciones, la normalización ni tus filtros**.

Tiene seis pasos: preparar el CSV, entender los problemas, normalizar, corregir un precio, decidir qué hacer con duplicados y exportar. Podés usar **Reproducir / Pausar**, **Anterior**, **Siguiente** o los seis capítulos. La reproducción avanza cada trece segundos; al abrir está pausada. Se detiene al cerrar la guía o al ocultar la pestaña. Con movimiento reducido, los pasos cambian sin animación. En celulares y tablets, los controles de reproducción y avance quedan visibles mientras desplazás la explicación y la escena. Cerrala con **×** o **Escape** para volver a tu revisión.

Por ejemplo, la guía muestra un precio `−7950` que se corrige a `7950` porque ése es el valor confirmado para el caso ficticio. No se deben cambiar precios ni centros solamente para quitar un error: usá tu fuente de datos para decidir qué corresponde.

## Qué vas a encontrar en la revisión

La barra de colores resume el estado de las filas: sin incidencias, con advertencias o por corregir. Las verdes y amarillas se pueden exportar; las rojas requieren una corrección. El bloque **Por dónde empezar** agrupa los errores en duplicados, campos vacíos y formatos/valores; una fila puede tener más de un error. **Revisar primero** filtra la lista por el problema prioritario, comenzando por las claves repetidas. Podés volver a ver todo borrando la búsqueda y eligiendo **Todas**.

La lista de incidencias muestra los problemas detectados; no es una vista de todas las filas de la planilla. Los contadores y las prioridades siempre corresponden al archivo completo, aunque filtres esa lista.

## Probalo en tres pasos

### 1. Elegí un archivo

Al abrir la aplicación ya vas a ver un **ejemplo con errores**. Podés volver a cargarlo con **Probar con un ejemplo**, o elegir **Cargar ejemplo válido** para ver cómo queda una revisión sin incidencias.

Para revisar tus datos, usá **Elegir archivo CSV** o arrastrá el archivo al recuadro. Si tenés un XLSX, XLS u ODS, exportalo primero como CSV desde la planilla. Si no sabés cómo armarlo, **Descargar plantilla CSV** te da un ejemplo con las ocho columnas esperadas. Abrilo en tu editor de planillas y conservá el formato CSV al guardar.

### 2. Revisá y corregí

El bloque **Qué encontró Lote** muestra cuántas filas pueden exportarse, cuántas tienen errores y cuántas advertencias se detectaron.

- **Error:** bloquea la exportación de esa fila hasta que se corrija.
- **Advertencia:** no bloquea la fila, pero conviene revisarla antes de usar los datos.

Usá las pestañas **Todas**, **Errores** y **Advertencias** o buscá un campo, valor, número de fila o regla. Si hay muchas incidencias, las flechas al pie de la tabla permiten cambiar de página. En una pantalla chica podés desplazar la tabla hacia los costados.

Para corregir un dato:

1. Tocá **↗** en la incidencia que quieras revisar.
2. Cambiá el campo indicado; debajo de cada campo hay una ayuda sobre el formato esperado.
3. Elegí **Guardar y volver a validar**. Se revisa el lote completo, incluidas las claves duplicadas.

¿Te equivocaste? **Deshacer corrección** recupera el estado anterior. Se conservan las últimas 20 correcciones de esta sesión. Cargar otro archivo o ejemplo reinicia ese historial.

La opción **Normalizar espacios y mayúsculas** es voluntaria. Quita espacios al principio y al final; además convierte a mayúsculas los códigos que lo requieren. Por ejemplo, ` mat-100 ` pasa a `MAT-100`. Cada cambio aparece como advertencia. Si desactivás la opción, la revisión vuelve a usar los valores de origen, incluidas las correcciones que hayas guardado.

### 3. Descargá el resultado

| Botón | Qué te llevás |
| --- | --- |
| **Filas válidas · CSV** | Las filas sin errores bloqueantes. Pueden incluir advertencias; revisalas antes de la carga. |
| **Incidencias · CSV** | Una lista de problemas con fila, campo, valor, severidad y explicación. |
| **Reporte completo JSON** | El detalle estructurado de la revisión, el perfil y el estado de normalización. Útil para otra herramienta o para conservar evidencia. |

Las descargas no modifican el archivo original. Los botones de CSV se habilitan cuando hay filas válidas o incidencias para exportar, respectivamente.

## Cómo preparar tu CSV

El archivo tiene que ser **CSV en UTF-8**, de hasta **2 MB y 5.000 filas**. Acepta coma o punto y coma como separador. Las columnas pueden venir en otro orden, pero sus nombres deben ser estos:

```csv
material,descripcion,tipo,unidad,grupo,centro,precio,moneda
MAT-100,Kit de fijación,FERT,UN,010,1000,1850.00,ARS
```

| Columna | Qué espera el perfil de ejemplo |
| --- | --- |
| `material` | Entre 1 y 18 letras mayúsculas, números o guiones. Por ejemplo, `MAT-100`. |
| `descripcion` | Un texto de hasta 40 caracteres. |
| `tipo` | `FERT`, `HALB`, `ROH` o `HAWA`. |
| `unidad` | `UN`, `KG`, `LT` o `M`. |
| `grupo` | Tres dígitos. Conservá los ceros iniciales: `010`. |
| `centro` | `1000` o `2000`. |
| `precio` | No negativo, con punto decimal, hasta dos decimales y sin separador de miles. `1850.50` es válido. El cero genera una advertencia. |
| `moneda` | `ARS` o `USD`. |

Todos los campos son obligatorios. La combinación **material + centro** debe ser única. Si se repite, **todas sus apariciones** tienen error; Lote no decide cuál conservar. Usá **Ver reglas** en la aplicación para consultar el perfil mientras trabajás.

Podés descargar estos archivos desde el repositorio: [plantilla válida](examples/materiales-validos.csv) y [ejemplo con errores](examples/materiales-errores.csv).

### Si el archivo no se puede leer

Comprobá que esté guardado como CSV en UTF-8, que tenga las ocho cabeceras sin duplicados ni columnas extra y que cada fila tenga la misma cantidad de columnas. Las comillas dentro de un campo deben escaparse según el formato CSV. También se admiten campos entre comillas que ocupen varias líneas. Cada celda puede tener hasta 2.000 caracteres.

Los números de fila se cuentan desde la cabecera: la primera fila de datos es la **2**. Si un campo ocupa varias líneas físicas, sigue siendo una sola fila de datos.

## Dónde quedan tus datos

Los archivos se procesan **en la memoria de tu navegador**. No se envían a un servidor ni se guardan al cerrar o recargar la pestaña. Descargá lo que quieras conservar antes de salir. El archivo original de tu computadora nunca se sobrescribe.

Lote no se conecta a SAP ni consulta materiales reales. El perfil incluido **no es una especificación universal SAP** y el sistema donde cargues los datos puede aplicar otras reglas. Adaptá el perfil y verificá los controles del destino antes de trabajar con un lote real.

## Ejecutar en tu computadora

Solo necesitás Python y un navegador actual. Descargá el repositorio con **Code → Download ZIP**, descomprimilo y abrí una terminal dentro de esa carpeta. Ejecutá:

```sh
python -m http.server 4182 --bind 127.0.0.1
```

Después abrí **http://127.0.0.1:4182** en el navegador. Mantené esa terminal abierta mientras lo usás. Para detenerlo, presioná **Ctrl + C**. En Windows, si el comando `python` no existe pero tenés el lanzador instalado, podés usar `py` en su lugar.

No hace falta `npm install`, un servidor de aplicación ni una base de datos. Abrir `index.html` con doble clic no alcanza: el navegador necesita servir por HTTP el archivo de reglas.

## Uso por consola

Esta alternativa permite repetir una validación desde una terminal, sin abrir la interfaz. Requiere **Python 3.10 o superior** y usa exclusivamente su biblioteca estándar.

Desde la carpeta del proyecto:

```sh
# Revisar el ejemplo válido y mostrar un resumen
python python/lote.py examples/materiales-validos.csv

# Normalizar y mostrar el resultado como JSON
python python/lote.py examples/materiales-errores.csv --normalize --format json

# Guardar el informe y las filas sin errores en archivos separados
python python/lote.py examples/materiales-errores.csv --report revision.json --valid validos.csv

# Consultar todas las opciones
python python/lote.py --help
```

Los archivos de salida se crean en la ubicación que indiques; los nombres de este ejemplo quedan en la carpeta actual. El ejemplo con errores puede producir archivos de salida y devolver código `1`: eso significa que terminó la revisión y encontró errores de datos.

| Código de salida | Resultado |
| --- | --- |
| `0` | Lote sin errores bloqueantes; puede tener advertencias. |
| `1` | Lote revisado con errores de datos. |
| `2` | No se pudo procesar el archivo, el perfil o los argumentos. |

## Para desarrollar o adaptar las reglas

`rules.json` define los ocho campos, los catálogos, formatos, longitudes y la clave compuesta. Tanto JavaScript como Python leen ese archivo. `src/validator.js` contiene el validador, `src/app.js` maneja la interfaz y `python/lote.py` ofrece el mismo proceso por consola. `src/tutorial.js` controla una guía ilustrada aislada del estado del lote, sin dependencias ni servicios remotos. No se incluyen datos ni código de clientes.

La interfaz usa vidrio satinado, tonos perla y vino, una ilustración SVG propia del recorrido CSV → corrección, una guía visual de seis pasos y un resumen de incidencias por prioridad. `style.css` define los componentes y la adaptación a pantallas; `identity.css` contiene las superficies y el ambiente visual. Los títulos y la marca usan **Plus Jakarta Sans**, el texto y las tablas **Inter**, y los códigos y valores **JetBrains Mono**. Las fuentes se sirven desde `assets/`, sin depender de servicios externos, con sus licencias SIL Open Font License incluidas ([Inter](assets/inter-OFL.txt), [Plus Jakarta Sans](assets/plus-jakarta-sans-OFL.txt), [JetBrains Mono](assets/jetbrains-mono-OFL.txt)).

### Pruebas

Con **Node 22 o 24 LTS+** y **Python en PATH**:

```sh
npm test
```

No se necesita instalar dependencias. Si Python está en otra ubicación, indicá su ruta con la variable de entorno `LOTE_PYTHON` antes de ejecutar las pruebas. Hay **15 pruebas**, incluidas comparaciones de resultados entre JavaScript y Python, duplicados, normalización, exportación y protección de prefijos de fórmulas en CSV.

Los datos de los CSV se muestran como texto, nunca como HTML ejecutable. Los CSV de salida anteponen una comilla simple a celdas con prefijos de fórmula (`=`, `+`, `-`, `@` y sus variantes de ancho completo) o controles iniciales de tabulación y salto de línea. También se consideran espacios y BOM antes del prefijo. Las comillas y los separadores se escapan para conservar los límites de cada celda. Los códigos se mantienen como texto para conservar sus ceros iniciales.

La protección se aplica al exportar desde el navegador y desde Python. Una planilla puede modificar esos escapes al guardar y volver a abrir un CSV; no existe una protección universal para todos los programas y consumidores. Las regresiones comprueban el contenido exportado y la paridad entre JavaScript y Python; no ejecutan Excel. Este alcance sigue la guía de [OWASP sobre CSV Injection](https://community.owasp.org/attacks/CSV_Injection).

### Seguridad del navegador y del CI

La página envía una política de referencia `no-referrer` e incluye una CSP parcial para bloquear bases HTML, objetos, envíos de formulario a la red y manejadores JavaScript en atributos. No reemplaza una CSP completa del servidor. La revisión local usa Node 22 LTS. La migración del CI a Node 24 LTS y a acciones fijadas por commit quedó preparada, pendiente del permiso `workflow` que no incluye la credencial actual; el workflow vigente todavía usa Node 20 y etiquetas de versión.

### Publicación

El repositorio personal es [EnriqueArielLopez/lote-data-quality](https://github.com/EnriqueArielLopez/lote-data-quality). GitHub Pages sirve la aplicación desde `main`. El workflow de GitHub Actions ejecuta las pruebas en cada push y pull request. Este proyecto es independiente de los ambientes y servicios corporativos de la carpeta que lo contiene.
