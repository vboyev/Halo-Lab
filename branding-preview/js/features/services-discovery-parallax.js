// Adds subtle pointer parallax to the Product Discovery image without moving the banner itself.
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const init = () => {
    document.querySelectorAll('.services-mega__discovery').forEach((banner) => {
      const image = banner.querySelector('.services-mega__discovery-clouds img');
      if (!image || banner.dataset.parallaxReady === 'true') return;

      banner.dataset.parallaxReady = 'true';
      let frame = 0;
      let x = 0;
      let y = 0;

      const render = () => {
        image.style.setProperty('--services-parallax-x', `${x}px`);
        image.style.setProperty('--services-parallax-y', `${y}px`);
        frame = 0;
      };

      const queueRender = () => {
        if (!frame) frame = window.requestAnimationFrame(render);
      };

      banner.addEventListener('pointermove', (event) => {
        if (reducedMotion.matches || event.pointerType === 'touch') return;

        const bounds = banner.getBoundingClientRect();
        x = ((event.clientX - bounds.left) / bounds.width - 0.5) * -12;
        y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -8;
        queueRender();
      });

      banner.addEventListener('pointerleave', () => {
        x = 0;
        y = 0;
        queueRender();
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
