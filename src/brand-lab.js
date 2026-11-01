const lab = document.querySelector('.row-play');
if (lab) {
  const button = lab.querySelector('[data-clean-sample]');
  const code = lab.querySelector('[data-code-sample]');
  const feedback = lab.querySelector('.row-feedback');
  button.addEventListener('click', () => {
    const clean = lab.dataset.clean !== 'true';
    lab.dataset.clean = String(clean);
    button.setAttribute('aria-pressed', String(clean));
    code.textContent = clean ? 'MAT-220' : ' mat-220 ';
    feedback.textContent = clean
      ? 'Sin espacios de más. Código en mayúsculas.'
      : 'Espacios de más y minúsculas.';
    button.firstChild.textContent = clean ? 'Volver al original ' : 'Corregir este ejemplo ';
  });
}
