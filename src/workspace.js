/** Navigation and shortcuts stay separate from CSV validation and editing state. */
export function initWorkspace() {
  const search = document.querySelector('#search');
  const returnLink = document.querySelector('.portfolio-return');
  if (location.pathname.includes('/demos/lote/')) returnLink.href = '../../#proyecto-lote';
  document.addEventListener('keydown', (event) => {
    const editing = event.target.closest('input, select, textarea, [contenteditable="true"]');
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      document.querySelector('dialog[open]')
    )
      return;
    if (event.key === '/' && !editing && !search.disabled) {
      event.preventDefault();
      search.focus();
    }
  });
}
