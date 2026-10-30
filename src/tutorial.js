// Guía ilustrada independiente: no recibe ni modifica el archivo o el estado de la revisión.
const chapters = [
  {
    label: 'Tu CSV',
    title: 'Empezá con el CSV de tu planilla.',
    copy: 'Si tus productos están en Excel u otra planilla, primero guardalos como CSV. Lote espera ocho columnas; podés descargar la plantilla. No abre archivos XLSX.',
    scene: `<div class="demo-file"><span class="demo-file-icon">CSV</span><div><strong>materiales.csv</strong><span>Archivo de ejemplo · 8 columnas</span></div><span class="demo-file-check">✓</span></div><div class="demo-table"><div class="demo-table-head"><span>Material</span><span>Descripción</span><span>Precio</span></div><div><span>MAT-100</span><span>Kit de fijación</span><span>1850</span></div><div><span>mat-220 </span><span>Perfil de aluminio</span><span>4320.50</span></div><div><span>MAT-315</span><span>Placa técnica</span><span class="demo-danger">−7950</span></div><div><span>MAT-410</span><span class="demo-danger">Vacío</span><span>2890</span></div></div><p class="demo-footnote">Una fila por material. Los datos de esta guía son ficticios.</p>`,
  },
  {
    label: 'Detectar',
    title: 'Lote te dice qué hay que revisar.',
    copy: 'Un error bloquea esa fila: puede faltar un dato, repetirse material + centro o haber un precio inválido. Una advertencia pide atención, pero permite exportar la fila.',
    scene: `<p class="demo-scene-heading">La revisión encuentra problemas concretos</p><div class="demo-finding"><span class="demo-issue-icon">!</span><div><strong>Precio inválido</strong><span>Fila 4 · precio <b>−7950</b></span></div><span class="demo-pill">Error</span></div><div class="demo-finding"><span class="demo-issue-icon">!</span><div><strong>Falta una descripción</strong><span>Fila 5 · campo obligatorio vacío</span></div><span class="demo-pill">Error</span></div><div class="demo-finding caution"><span class="demo-issue-icon">i</span><div><strong>Un precio en cero</strong><span>Revisalo con tu fuente antes de usarlo</span></div><span class="demo-pill">Advertencia</span></div>`,
  },
  {
    label: 'Normalizar',
    title: 'Sacá espacios y ordená las mayúsculas.',
    copy: 'Activá “Normalizar espacios y mayúsculas” para los códigos que lo requieren. Cada cambio queda identificado como advertencia. Es opcional y podés volver a desactivarlo.',
    scene: `<div class="demo-setting"><span aria-hidden="true">✓</span> Normalizar espacios y mayúsculas</div><div class="demo-before-after"><div><small>VALOR DE ORIGEN</small><strong class="demo-raw">mat-220<span class="visible-space">␠</span></strong><span>Un espacio al final y letras minúsculas</span></div><span class="demo-transform" aria-hidden="true">→</span><div><small>VALOR NORMALIZADO</small><strong class="demo-good">MAT-220</strong><span>La advertencia deja registro del cambio</span></div></div><div class="demo-inline-values"><span>roh → <b>ROH</b></span><span>m → <b>M</b></span><span>ars → <b>ARS</b></span></div>`,
  },
  {
    label: 'Corregir',
    title: 'Corregí una fila, con ayuda en cada campo.',
    copy: 'Abrí la incidencia con ↗. En este ejemplo, el precio correcto es 7950: reemplazá −7950 y guardá. Lote revisa todo el archivo otra vez. Si te equivocás, usá “Deshacer corrección”.',
    scene: `<div class="demo-editor-head"><span>REVISAR FILA 4</span><strong>MAT-315 · Placa técnica</strong></div><div class="demo-price-edit"><div><small>ANTES</small><strong class="demo-danger">−7950</strong></div><span class="demo-transform" aria-hidden="true">→</span><div><small>PRECIO CORREGIDO</small><strong class="demo-good">7950<span class="demo-caret" aria-hidden="true"></span></strong></div></div><p class="demo-field-help">Precio no negativo, punto decimal y hasta dos decimales.</p><div class="demo-editor-bottom"><span>↶ Deshacer corrección</span><span class="demo-button">Guardar y volver a validar ✓</span></div><p class="demo-footnote">Confirmá el precio correcto con tu fuente. La guía muestra un caso ficticio.</p>`,
  },
  {
    label: 'Duplicados',
    title: 'Una clave repetida necesita una decisión tuya.',
    copy: 'Lote marca todas las filas con el mismo material y centro. Comparalas con tu fuente. Si una corresponde a otro centro, corregí ese campo; no cambies datos solamente para quitar el error.',
    scene: `<p class="demo-scene-heading">El mismo material puede existir en centros distintos</p><div class="demo-duplicate"><span>Fila 2</span><strong>MAT-100</strong><span>Centro <b>1000</b></span></div><div class="demo-duplicate"><span>Fila 6</span><strong>MAT-100</strong><span>Centro <b>1000</b></span></div><div class="demo-duplicate corrected"><span>Si corresponde<br>a otro centro</span><strong>MAT-100</strong><span>Centro <b>2000 ✓</b></span></div><p class="demo-footnote">No se eliminan filas automáticamente. Si son duplicados reales, corregí tu planilla y volvé a importar el CSV.</p>`,
  },
  {
    label: 'Exportar',
    title: 'Llevate los datos revisados y el informe.',
    copy: '“Filas válidas” descarga solo las filas sin errores bloqueantes. Pueden tener advertencias: revisalas. También podés descargar las incidencias CSV o el reporte JSON. Lote no carga estos datos en SAP.',
    scene: `<div class="demo-output-heading"><span>✓</span><div><strong>El resultado sale en archivos.</strong><p>Vos decidís cómo continuar con los datos.</p></div></div><div class="demo-output"><span class="demo-file-icon">CSV</span><div><strong>Filas válidas</strong><span>Materiales sin errores bloqueantes</span></div><span aria-hidden="true">↓</span></div><div class="demo-output"><span class="demo-file-icon muted">CSV</span><div><strong>Incidencias</strong><span>Fila, campo y qué hay que revisar</span></div><span aria-hidden="true">↓</span></div><div class="demo-output"><span class="demo-file-icon muted">JSON</span><div><strong>Reporte completo</strong><span>Detalle estructurado de la revisión</span></div><span aria-hidden="true">↓</span></div>`,
  },
];

export function initTutorial() {
  const dialog = document.querySelector('#tutorial-dialog');
  const trigger = document.querySelector('#open-tutorial');
  if (!dialog || !trigger) return;
  const select = (selector) => dialog.querySelector(selector);
  let step = 0,
    renderedStep,
    playing = false,
    timer,
    restoreFocus,
    previousOverflow = '';
  const stopTimer = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  function render() {
    const sceneChanged = renderedStep !== step;
    if (sceneChanged) {
      const chapter = chapters[step];
      select('#tutorial-scene').innerHTML =
        `<div class="tutorial-window"><div class="tutorial-window-bar"><span class="demo-window-dots" aria-hidden="true">● ● ●</span><span>LOTE / EJEMPLO APARTE</span></div><div class="tutorial-window-content">${chapter.scene}</div></div>`;
      select('#tutorial-step-number').textContent = `PASO ${step + 1} / ${chapters.length}`;
      select('#tutorial-step-title').textContent = chapter.title;
      select('#tutorial-step-copy').textContent = chapter.copy;
      renderedStep = step;
    }
    const previousHadFocus = document.activeElement === select('#tutorial-prev');
    select('#tutorial-prev').disabled = step === 0;
    if (step === 0 && previousHadFocus) select('#tutorial-next').focus({ preventScroll: true });
    select('#tutorial-next').textContent =
      step === chapters.length - 1 ? 'Volver a mi revisión' : 'Siguiente →';
    select('#tutorial-play').textContent = playing
      ? 'Ⅱ Pausar'
      : step === chapters.length - 1
        ? '↻ Volver a ver'
        : '▶ Reproducir';
    select('#tutorial-play').setAttribute('aria-pressed', String(playing));
    select('#tutorial-play').setAttribute(
      'aria-label',
      playing
        ? 'Pausar guía'
        : step === chapters.length - 1
          ? 'Reproducir guía desde el inicio'
          : 'Reproducir guía',
    );
    select('#tutorial-chapters')
      .querySelectorAll('button')
      .forEach((button, index) => {
        if (index === step) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
        button.classList.toggle('completed', index < step);
      });
    if (sceneChanged) select('.tutorial-scrollbody').scrollTop = 0;
  }
  function schedule() {
    stopTimer();
    if (!playing || !dialog.open || step === chapters.length - 1) return;
    timer = setTimeout(() => {
      step++;
      if (step === chapters.length - 1) playing = false;
      render();
      schedule();
    }, 13000);
  }
  function chooseStep(index) {
    stopTimer();
    playing = false;
    step = Math.max(0, Math.min(chapters.length - 1, index));
    render();
  }
  function open() {
    if (dialog.open) return;
    restoreFocus = document.activeElement === document.body ? trigger : document.activeElement;
    previousOverflow = document.documentElement.style.overflow;
    chooseStep(0);
    dialog.showModal();
    select('.tutorial-scrollbody').scrollTop = 0;
    document.documentElement.style.overflow = 'hidden';
  }
  select('#tutorial-chapters').innerHTML = chapters
    .map(
      (chapter, index) =>
        `<button type="button" data-tutorial-step="${index}" aria-label="Paso ${index + 1}: ${chapter.label}"><span>${index + 1}</span><small>${chapter.label}</small></button>`,
    )
    .join('');
  trigger.addEventListener('click', open);
  select('#tutorial-close').addEventListener('click', () => dialog.close());
  select('#tutorial-prev').addEventListener('click', () => chooseStep(step - 1));
  select('#tutorial-next').addEventListener('click', () =>
    step === chapters.length - 1 ? dialog.close() : chooseStep(step + 1),
  );
  select('#tutorial-chapters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-tutorial-step]');
    if (button) chooseStep(Number(button.dataset.tutorialStep));
  });
  select('#tutorial-play').addEventListener('click', () => {
    if (step === chapters.length - 1) step = 0;
    playing = !playing;
    render();
    schedule();
  });
  dialog.addEventListener('close', () => {
    stopTimer();
    playing = false;
    document.documentElement.style.overflow = previousOverflow;
    if (restoreFocus?.isConnected) restoreFocus.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      dialog.close();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && dialog.open) {
      playing = false;
      stopTimer();
      render();
    }
  });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    select('#tutorial-playback-hint').textContent =
      'Movimiento reducido: sin animaciones. Podés elegir cada paso o reproducir la guía, que avanza cada 13 segundos.';
  }
  if (new URLSearchParams(location.search).get('tutorial') === '1') open();
}
