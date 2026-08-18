/* Contains page-specific interaction code extracted from ai-products.html. */

function initTextAnimations() {
    // LINE REVEAL (SplitType)
    document.querySelectorAll('[data-gsap-line]').forEach((element) => {
      const split = new SplitType(element, {
        types: 'lines',
      });
      element.style.opacity = '1';
      split.lines.forEach((line) => {
        const wrapper = document.createElement('div');
        line.parentNode.insertBefore(wrapper, line);
        wrapper.appendChild(line);
      });
      gsap.set(split.lines, {
        opacity: 0,
        y: '2.5rem',
        filter: 'blur(10px)',
      });
      // animation
      gsap.to(split.lines, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: element,
          start: 'top 93%',
          once: true,
        },
      });
    });
    // BLUR REVEAL
    document.querySelectorAll('[data-gsap-blur]').forEach((element) => {
      gsap.set(element, {
        opacity: 0,
        y: '2.5rem',
        filter: 'blur(10px)',
      });
      gsap.to(element, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 93%',
          once: true,
        },
      });
    });
  }
  document.addEventListener('DOMContentLoaded', async () => {
    await document.fonts.ready;
    initTextAnimations();
  });
