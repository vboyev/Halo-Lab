/* Homepage line/blur entrance, scoped to the Stay hero with no scroll reveals. */
(() => {
  const hero = document.querySelector('.stay-case-hero');
  const gsap = window.gsap;
  if (!hero || !gsap || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const heading = hero.querySelector('h1');
  const logo = hero.querySelector('.project-new-hero__logo-wrap');
  const lead = hero.querySelector('.branding-hero__lead');
  const blocks = [logo, heading, lead].filter(Boolean);
  gsap.set(blocks, { visibility: 'hidden' });

  // Don't leave content hidden if fonts take unusually long to load.
  Promise.race([
    document.fonts.ready,
    new Promise(resolve => setTimeout(resolve, 1500)),
  ]).then(() => {
    let split;
    try {
      if (window.SplitText && heading) {
        split = new window.SplitText(heading, { type: 'lines' });
      }
      const lines = split?.lines || [heading].filter(Boolean);
      const targets = [logo, ...lines, lead].filter(Boolean);
      const finalOpacity = targets.map(element => getComputedStyle(element).opacity);
      gsap.set(blocks, { clearProps: 'visibility' });
      gsap.fromTo(targets,
        { opacity: 0, y: '2.5rem', filter: 'blur(10px)' },
        {
          opacity: index => finalOpacity[index], y: 0, filter: 'blur(0px)',
          duration: .8, ease: 'power3.out', stagger: .08,
          onComplete() {
            gsap.set(targets, { clearProps: 'opacity,transform,filter' });
            split?.revert();
          },
        });
    } catch (error) {
      split?.revert();
      gsap.set(blocks, { clearProps: 'visibility,opacity,transform,filter' });
      console.warn('Stay hero entrance skipped:', error);
    }
  });
})();
