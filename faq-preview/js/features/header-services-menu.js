(() => {
  const HORIZONTAL_RANGE_REM = 0.375;
  const VERTICAL_RANGE_REM = 0.25;

  const getDiscoveryParallaxOffset = (clientX, clientY, bounds) => {
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
      return { x: 0, y: 0 };
    }

    const normalizedX = (clientX - bounds.left) / bounds.width - 0.5;
    const normalizedY = (clientY - bounds.top) / bounds.height - 0.5;

    const x = normalizedX * HORIZONTAL_RANGE_REM * -2;
    const y = normalizedY * VERTICAL_RANGE_REM * -2;

    return {
      x: Object.is(x, -0) ? 0 : x,
      y: Object.is(y, -0) ? 0 : y,
    };
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getDiscoveryParallaxOffset };
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const init = () => {
    document.querySelectorAll('[data-services-discovery-parallax]').forEach((banner) => {
      const image = banner.querySelector('[data-services-discovery-image]');
      if (!image || banner.dataset.servicesDiscoveryReady === 'true') return;

      banner.dataset.servicesDiscoveryReady = 'true';
      let frame = 0;
      let x = 0;
      let y = 0;

      const render = () => {
        image.style.setProperty('--services-parallax-x', `${x}rem`);
        image.style.setProperty('--services-parallax-y', `${y}rem`);
        frame = 0;
      };

      const queueRender = () => {
        if (!frame) frame = window.requestAnimationFrame(render);
      };

      banner.addEventListener('pointermove', (event) => {
        if (reducedMotion.matches || event.pointerType === 'touch') return;

        ({ x, y } = getDiscoveryParallaxOffset(
          event.clientX,
          event.clientY,
          banner.getBoundingClientRect(),
        ));
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
