/* Client logo marquee, mirroring the homepage configuration.
   The homepage mounts this block from its own page script, so pages that reuse
   the component need this standalone initialiser. */

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-marquee="logo-left-new"]');

  if (!root || root.dataset.marqueeMounted === 'true') return;
  if (!window.Splide || !window.splide || !window.splide.Extensions) return;

  const userAgent = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let speed = 0.5;

  if (isSafari) speed *= 3;
  if (isMobile) speed *= 0.5;

  root.dataset.marqueeMounted = 'true';

  new Splide(root, {
    perPage: 8,
    arrows: false,
    pagination: false,
    focus: 'center',
    gap: '4rem',
    type: 'loop',
    breakpoints: {
      991: {
        perPage: 5,
        gap: '4rem',
      },
      479: {
        perPage: 3,
        gap: '2.25rem',
      },
    },
    autoScroll: {
      autoStart: !prefersReducedMotion,
      speed,
      pauseOnHover: false,
    },
  }).mount(window.splide.Extensions);
});
