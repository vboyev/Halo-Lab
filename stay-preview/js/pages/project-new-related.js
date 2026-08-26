/* Shows generic project cases only when there are no industry-related cases. */

document.addEventListener('DOMContentLoaded', () => {
  const similar = document.querySelector('[data-collection-relative="similar"]');
  const fallback = document.querySelector('[data-collection-relative="any"]');
  if (!similar || !fallback || similar.querySelectorAll('.w-dyn-item').length) return;

  similar.classList.add('hide');
  fallback.classList.remove('hide');
});
