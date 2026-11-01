const zone = document.querySelector('.file-zone');
const toggle = document.querySelector('[data-interface-motion]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = false, visible = false;
function update() {
  zone.dataset.animate = String(!paused && !reduced.matches && visible && !document.hidden);
  toggle.disabled = reduced.matches;
  toggle.setAttribute('aria-pressed', String(paused || reduced.matches));
  toggle.textContent = reduced.matches ? 'Movimiento reducido' : paused ? 'Animar dibujo' : 'Pausar dibujo';
}
toggle.addEventListener('click', () => { paused = !paused; update(); });
reduced.addEventListener('change', update);
document.addEventListener('visibilitychange', update);
if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {visible = entry.isIntersecting; update();}).observe(zone);
update();
