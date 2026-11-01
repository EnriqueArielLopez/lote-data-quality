export function initReviewFlow() {
  const workspace = document.querySelector('.review-workspace');
  const upload = workspace.querySelector('.upload-panel'),
    review = workspace.querySelector('.results-panel');
  const exportPanel = document.createElement('section');
  exportPanel.className = 'export-stage';
  exportPanel.setAttribute('aria-labelledby','export-title');
  exportPanel.append(review.querySelector('.export-bar'));
  workspace.append(exportPanel);
  const summary = document.createElement('p');
  summary.className = 'flow-export-summary';
  summary.setAttribute('aria-live', 'polite');
  exportPanel.prepend(summary);
  const nav = document.createElement('nav');
  nav.className = 'flow-nav';
  nav.setAttribute('aria-label', 'Etapas de revisión');
  nav.innerHTML =
    '<button type="button" data-flow-step="upload" aria-current="step"><span>01</span> Archivo</button><button type="button" data-flow-step="review"><span>02</span> Revisar</button><button type="button" data-flow-step="export"><span>03</span> Descargar</button><p class="flow-file" aria-live="polite">Cargando ejemplo…</p>';
  workspace.before(nav);
  const stages = { upload, review, export: exportPanel };
  Object.entries(stages).forEach(([name, element]) => {
    element.id = `flow-${name}`;
    nav.querySelector(`[data-flow-step="${name}"]`).setAttribute('aria-controls', element.id);
  });
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'button primary flow-next';
  next.textContent = 'Continuar a la descarga →';
  review.append(next);
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'button flow-back';
  back.textContent = '← Volver a revisar';
  exportPanel.append(back);
  function show(name, focus = true) {
    if (!stages[name]) return;
    Object.entries(stages).forEach(([key, panel]) => (panel.hidden = key !== name));
    nav.querySelectorAll('[data-flow-step]').forEach((button) => {
      if (button.dataset.flowStep === name) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    document.body.dataset.reviewStep = name;
    if (focus) {
      const heading = stages[name].querySelector('h2');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      nav.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }
  nav.addEventListener('click', (event) => {
    const button = event.target.closest('[data-flow-step]');
    if (button) show(button.dataset.flowStep);
  });
  next.addEventListener('click', () => show('export'));
  back.addEventListener('click', () => show('review'));
  document
    .querySelectorAll('a[href="#results-title"],a[href="#upload-title"],a[href="#export-title"]')
    .forEach((link) =>
      link.addEventListener('click', (event) => {
        event.preventDefault();
        show(
          link.hash === '#upload-title'
            ? 'upload'
            : link.hash === '#export-title'
              ? 'export'
              : 'review',
        );
      }),
    );
  show('upload', false);
  return {
    show,
    update(report, label) {
      nav.querySelector('.flow-file').textContent = label;
      summary.textContent = `${report.summary.accepted} filas listas para exportar · ${report.summary.rejected} por corregir`;
    },
  };
}
