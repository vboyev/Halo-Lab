/* Desktop services follow page scroll; touch/reduced-motion retain the carousel. */
document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('#branding-services');
  const viewport = root?.querySelector('.branding-offerings__viewport');
  if (!viewport) return;
  const track = viewport.querySelector('.branding-offerings__track');
  const scrollArea = root.querySelector('.branding-offerings__scroll');
  const cards = [...track.querySelectorAll('.branding-offerings__card')];
  const background = root.closest('.branding-top');
  const desktop = matchMedia('(min-width: 992px) and (prefers-reduced-motion: no-preference)');
  const gap = () => parseFloat(getComputedStyle(document.documentElement).fontSize) * (innerWidth <= 767 ? 1 : 2);
  const gutter = () => root.querySelector('.branding-section-heading').getBoundingClientRect().left;
  let slider = null, frame = 0, distance = 0, stickyTop = 0;

  const revealCards = () => cards.forEach(card => card.classList.remove('anim'));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { revealCards(); observer.disconnect(); }
    });
    observer.observe(viewport);
  } else revealCards();

  function render() {
    frame = 0;
    if (!root.classList.contains('has-offering-scroll')) return;
    const progress = Math.max(0, Math.min(distance, stickyTop - scrollArea.getBoundingClientRect().top));
    track.style.transform = `translate3d(${-progress}px, 0, 0)`;
  }
  function requestRender() {
    if (!frame && desktop.matches) frame = requestAnimationFrame(render);
  }
  function measure() {
    if (!root.classList.contains('has-offering-scroll')) return;
    root.style.setProperty('--offering-gutter', `${gutter()}px`);
    distance = Math.max(0, track.getBoundingClientRect().width - viewport.clientWidth);
    // Match the reference: center the cards in the viewport while the heading scrolls above.
    const height = viewport.getBoundingClientRect().height;
    stickyTop = Math.max(24, (innerHeight - height) / 2);
    scrollArea.style.height = `${height + distance}px`;
    viewport.style.top = `${stickyTop}px`;
    // Extra scroll runway must not stretch the hero's existing gradient.
    background?.style.setProperty('--branding-offering-scroll-distance', `${distance}px`);
    render();
  }
  function configure() {
    if (slider) { slider.destroy(true, true); slider = null; }
    root.classList.remove('has-offering-scroll', 'has-offering-slider');
    track.style.transform = '';
    scrollArea.style.height = '';
    viewport.style.top = '';
    background?.style.removeProperty('--branding-offering-scroll-distance');
    // A short landscape viewport cannot show a pinned card fully: keep swipe/keyboard there.
    if (desktop.matches && innerHeight >= viewport.offsetHeight + 48) {
      root.classList.add('has-offering-scroll');
      measure();
    } else if (typeof Swiper !== 'undefined') {
      root.classList.add('has-offering-slider');
      slider = new Swiper(viewport, {
        slidesPerView: 'auto', spaceBetween: gap(), slidesOffsetBefore: gutter, slidesOffsetAfter: gutter,
        grabCursor: true, speed: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500,
        watchOverflow: true, preventClicks: true, preventClicksPropagation: true,
        keyboard: { enabled: true, onlyInViewport: true },
        a11y: { slideRole: 'link', slideLabelMessage: '{{index}} of {{slidesLength}}' },
      });
    }
  }
  function scrollToProgress(value) {
    const top = scrollY + scrollArea.getBoundingClientRect().top - stickyTop + Math.max(0, Math.min(distance, value));
    if (window.lenis) window.lenis.scrollTo(top, { immediate: true });
    else window.scrollTo({ top, behavior: 'instant' });
  }
  viewport.addEventListener('keydown', event => {
    if (!root.classList.contains('has-offering-scroll') || event.target !== viewport) return;
    const progress = stickyTop - scrollArea.getBoundingClientRect().top;
    const step = cards[0].offsetWidth + gap();
    const targets = { ArrowRight: progress + step, ArrowLeft: progress - step, Home: 0, End: distance };
    if (!(event.key in targets)) return;
    event.preventDefault();
    scrollToProgress(targets[event.key]);
  });
  viewport.addEventListener('focusin', event => {
    const card = event.target.closest('.branding-offerings__card');
    if (!card) return;
    const rect = card.getBoundingClientRect(), bounds = viewport.getBoundingClientRect();
    if (rect.left >= bounds.left && rect.right <= bounds.right) return;
    if (slider) slider.slideTo(cards.indexOf(card));
    else if (root.classList.contains('has-offering-scroll')) scrollToProgress(cards.indexOf(card) * (cards[0].offsetWidth + gap()));
  });
  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', configure, { passive: true });
  desktop.addEventListener('change', configure);
  document.fonts.ready.then(configure);
  configure();
});

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('#branding-reviews');
  const slider = root?.querySelector('[data-swiper="lovelatters-new"]');
  if (!slider || typeof Swiper === 'undefined') return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const updateLayers = (instance) => {
    instance.slides.forEach(slide => slide.classList.remove('swiper-slide-prev-second', 'swiper-slide-next-second'));
    instance.slides[instance.activeIndex - 2]?.classList.add('swiper-slide-prev-second');
    instance.slides[instance.activeIndex + 2]?.classList.add('swiper-slide-next-second');
  };
  new Swiper(slider, {
    speed: reducedMotion ? 0 : 500,
    slidesPerView: 'auto',
    effect: 'cards',
    cardsEffect: { rotate: true, slideShadows: false, perSlideOffset: 6, perSlideRotate: 3 },
    navigation: {
      nextEl: root.querySelector('[data-swiper-next]'),
      prevEl: root.querySelector('[data-swiper-prev]'),
    },
    pagination: { el: root.querySelector('[data-swiper-pagination]'), clickable: true },
    a11y: { prevSlideMessage: 'Previous review', nextSlideMessage: 'Next review' },
    on: {
      init(instance) { root.classList.add('is-carousel-ready'); updateLayers(instance); },
      slideChange: updateLayers,
    },
  });
});

/* Tilt the rectangular process card, never its graph, heading or navigation. */
document.addEventListener('DOMContentLoaded', () => {
  const host = document.querySelector('[data-process-tilt]');
  // The stack itself is the transformed element, so the tilt survives the card cross-fade.
  const card = host;
  if (!card) return;
  const zone = host.closest('#branding-process');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const limit = 4;
  let frame = 0;
  let currentX = 0, currentY = 0, targetX = 0, targetY = 0;
  let previousTime = 0;

  function render(time) {
    const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16;
    previousTime = time;
    const blend = 1 - Math.exp(-elapsed / 90);
    currentX += (targetX - currentX) * blend;
    currentY += (targetY - currentY) * blend;
    const settled = Math.abs(targetX - currentX) + Math.abs(targetY - currentY) < .01;
    if (settled) { currentX = targetX; currentY = targetY; }
    card.style.transform = currentX || currentY
      ? `perspective(1200px) rotateX(${currentX.toFixed(3)}deg) rotateY(${currentY.toFixed(3)}deg)`
      : '';
    if (settled) {
      frame = 0;
      previousTime = 0;
      host.classList.remove('is-tilting');
    } else frame = requestAnimationFrame(render);
  }
  function update() {
    if (!frame) {
      host.classList.add('is-tilting');
      frame = requestAnimationFrame(render);
    }
  }
  function reset(immediate = false) {
    targetX = targetY = 0;
    if (immediate) {
      cancelAnimationFrame(frame);
      frame = previousTime = currentX = currentY = 0;
      card.style.transform = '';
      host.classList.remove('is-tilting');
    } else update();
  }
  zone.addEventListener('pointermove', event => {
    if (!pointer.matches || reducedMotion.matches || event.pointerType !== 'mouse') return;
    // The full-width section is the hit area; the card is the only transformed element.
    const bounds = zone.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const normalize = value => Math.max(-1, Math.min(1, value));
    targetX = -normalize((event.clientY - bounds.top) / bounds.height * 2 - 1) * limit;
    targetY = normalize((event.clientX - bounds.left) / bounds.width * 2 - 1) * limit;
    update();
  }, { passive: true });
  zone.addEventListener('pointerleave', () => reset());
  zone.addEventListener('pointercancel', () => reset());
  window.addEventListener('blur', () => reset(true));
  window.addEventListener('scroll', () => { if (currentX || currentY || frame) reset(); }, { passive: true });
  window.addEventListener('resize', () => reset(true));
  pointer.addEventListener('change', () => reset(true));
  reducedMotion.addEventListener('change', () => reset(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(true); });
});

/* Pinned process stages. The scroll runs as one continuous track rather than five discrete
   anchors: the bars fill fractionally, the marker interpolates along the curve, and the card
   stack drifts on Y while the stage index snaps at each fifth. Desktop and motion only. */
document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-branding-process]');
  if (!root) return;
  const pin = root.querySelector('[data-branding-process-pin]');
  const runway = root.querySelector('[data-branding-process-runway]');
  const float = root.querySelector('[data-branding-process-float]');
  const marker = root.querySelector('[data-branding-process-marker]');
  const bars = [...root.querySelectorAll('.branding-process__bar')];
  const cards = [...root.querySelectorAll('[data-branding-process-card]')];
  const buttons = [...root.querySelectorAll('[data-branding-process-btn]')];
  if (!pin || !runway || !cards.length) return;

  const desktop = matchMedia('(min-width: 992px) and (prefers-reduced-motion: no-preference)');
  const count = buttons.length;
  // How much scroll each stage costs. Lower is a faster run through the five.
  const STAGE_SCROLL = 0.21;
  let stickyTop = 0;
  let step = -1;
  let frame = 0;
  let geometry = [];

  function setStep(next) {
    if (next === step) return;
    step = next;
    cards.forEach((card, i) => {
      const on = i === next;
      card.classList.toggle('is-active', on);
      card.toggleAttribute('aria-hidden', !on);
    });
    buttons.forEach((button, i) => {
      const on = i === next;
      button.classList.toggle('is-active', on);
      if (on) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    root.classList.toggle('is-step-0', next === 0);
  }

  function applyProgress(p) {
    // Bars fill one after another, the last one partially, so the edge sweeps rather than jumps.
    const total = bars.length;
    for (let i = 0; i < total; i += 1) {
      const fill = Math.min(1, Math.max(0, p * total - i));
      // The lit bar is a gradient the full height of the bar, so it fades in rather than growing:
      // growing it from the bottom would only ever reveal the transparent end of that gradient.
      bars[i].firstElementChild.style.opacity = fill ? fill.toFixed(3) : '0';
    }
    // Marker rides the curve between the two bars it currently sits over.
    if (marker && geometry.length) {
      const t = p * (geometry.length - 1);
      const i0 = Math.min(geometry.length - 1, Math.floor(t));
      const i1 = Math.min(geometry.length - 1, i0 + 1);
      const f = t - i0;
      marker.style.left = `${(geometry[i0].x + (geometry[i1].x - geometry[i0].x) * f).toFixed(2)}px`;
      marker.style.bottom = `${(geometry[i0].y + (geometry[i1].y - geometry[i0].y) * f).toFixed(2)}px`;
    }
    setStep(Math.min(count - 1, Math.max(0, Math.floor(p * count))));
  }

  function progress() {
    // 0 when the runway sits directly under the pinned block, 1 as its end reaches that same line.
    const height = runway.offsetHeight;
    if (!height) return 0;
    const travelled = stickyTop + pin.offsetHeight - runway.getBoundingClientRect().top;
    return Math.min(1, Math.max(0, travelled / height));
  }

  function render() {
    frame = 0;
    if (!root.classList.contains('has-process-scroll')) return;
    applyProgress(progress());
  }
  function requestRender() {
    if (!frame && desktop.matches) frame = requestAnimationFrame(render);
  }

  function measure() {
    if (!root.classList.contains('has-process-scroll')) return;
    stickyTop = Math.max(0, (innerHeight - pin.offsetHeight) / 2);
    pin.style.top = `${stickyTop}px`;
    runway.style.height = `${Math.round(innerHeight * STAGE_SCROLL) * count}px`;
    geometry = bars.map(bar => ({ x: bar.offsetLeft + bar.offsetWidth / 2, y: bar.offsetHeight }));
    render();
  }

  function configure() {
    root.classList.remove('has-process-scroll');
    pin.style.top = '';
    runway.style.height = '';
    if (float) float.style.transform = '';
    // A viewport that cannot show the pinned block whole would trap the reader mid-card.
    if (desktop.matches && innerHeight >= pin.offsetHeight) {
      root.classList.add('has-process-scroll');
      measure();
    } else {
      step = -1;
      setStep(0);
      applyProgress(0);
    }
  }

  function scrollToStep(index) {
    if (!root.classList.contains('has-process-scroll')) {
      cards[index]?.scrollIntoView({ block: 'nearest', inline: 'start', behavior: 'smooth' });
      return;
    }
    // Land in the middle of the stage's slice so it is unambiguously that stage.
    const target = (index + 0.5) / count;
    const wanted = stickyTop + pin.offsetHeight - target * runway.offsetHeight;
    const top = scrollY + (runway.getBoundingClientRect().top - wanted);
    if (window.lenis) window.lenis.scrollTo(top, { immediate: true });
    else scrollTo({ top, behavior: 'instant' });
    render();
  }

  buttons.forEach((button, index) => button.addEventListener('click', () => scrollToStep(index)));

  addEventListener('scroll', requestRender, { passive: true });
  // Lenis drives the page and swallows native scroll events, so bind to it as well once it exists.
  const bindLenis = () => Boolean(window.lenis?.on) && (window.lenis.on('scroll', requestRender), true);
  if (!bindLenis()) {
    let tries = 0;
    const waitForLenis = setInterval(() => {
      if (bindLenis() || (tries += 1) > 40) clearInterval(waitForLenis);
    }, 100);
  }
  addEventListener('resize', configure, { passive: true });
  desktop.addEventListener('change', configure);
  document.fonts.ready.then(configure);
  setStep(0);
  configure();
});
