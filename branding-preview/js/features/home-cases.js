/* Shared homepage follower, case scroll states and preview sizing. */
(() => {
// ===== ОБЩАЯ ЧАСТЬ (один раз для всей страницы) =====
  const isDesktop = window.matchMedia('(min-width: 768px)').matches;
  if (isDesktop) {
    // глобально трекаем курсор
    const mouse = {
      x: 0,
      y: 0,
    };
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    const followers = [];
    // один scroll-обработчик на всё, а не по одному на каждый элемент
    window.addEventListener('scroll', () => {
      followers.forEach((f) => {
        if (f.isHovering()) f.update();
      });
    });
    // создаёт "следящий" за курсором элемент
    function createFollower({ item, preview, duration, ease, getTarget }) {
      ease = ease || 'power2.out';
      gsap.set(preview, {
        xPercent: -50,
        yPercent: -50,
      });
      const xTo = gsap.quickTo(preview, 'x', {
        duration,
        ease,
      });
      const yTo = gsap.quickTo(preview, 'y', {
        duration,
        ease,
      });
      const update = () => {
        const target = getTarget();
        xTo(target.x);
        yTo(target.y);
      };
      const isHovering = () => {
        const rect = item.getBoundingClientRect();
        return mouse.x >= rect.left && mouse.x <= rect.right && mouse.y >= rect.top && mouse.y <= rect.bottom;
      };
      const follower = {
        update,
        isHovering,
        xTo,
        yTo,
      };
      followers.push(follower);
      return follower;
    }
    // ===== service link hover =====
    document.querySelectorAll('.services__link').forEach((item) => {
      const preview = item.querySelector('.service__link-preview-wrap');
      const follower = createFollower({
        item,
        preview,
        duration: 0.01,
        getTarget: () => {
          const rect = item.getBoundingClientRect();
          return {
            x: mouse.x - rect.left,
            y: mouse.y - rect.top,
          };
        },
      });
      item.addEventListener('mousemove', follower.update);
    });
    // ===== cases cards anim =====
    document.querySelectorAll('.section.mod--case-study').forEach((item) => {
      const preview = item.querySelector('.case-study__wrap');
      const title = item.querySelector('.case-study__title');
      const textEls = [...item.querySelectorAll('.cases-study__text')];
      const offset = 32;
      let isTextHover = false;
      const clampTarget = (x, y) => {
        const rect = preview.getBoundingClientRect();
        const halfW = rect.width / 2;
        const halfH = rect.height / 2;
        return {
          x: Math.max(halfW + offset, Math.min(item.clientWidth - halfW - offset, x)),
          y: Math.max(halfH + offset, Math.min(item.clientHeight - halfH - offset, y)),
        };
      };
      const follower = createFollower({
        item,
        preview,
        duration: 0.3,
        getTarget: () => {
          if (isTextHover) {
            return {
              x: item.clientWidth / 2,
              y: item.clientHeight / 2,
            };
          }
          const rect = item.getBoundingClientRect();
          const x = mouse.x - rect.left;
          const y = mouse.y - rect.top;
          return clampTarget(x, y);
        },
      });
      item.addEventListener('mousemove', () => {
        if (isTextHover) return;
        follower.update();
      });
      textEls.forEach((textEl) => {
        textEl.addEventListener('mouseenter', () => {
          isTextHover = true;
          follower.update();
          gsap.to(title, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out',
          });
          gsap.to(preview, {
            scale: 0.8,
            duration: 0.3,
            ease: 'power2.out',
          });
        });
        textEl.addEventListener('mouseleave', () => {
          isTextHover = false;
          gsap.to(title, {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out',
          });
          gsap.to(preview, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
          });
          follower.update();
        });
      });
    });
  }

///////////////// CASE SECTION ENTRY ALIGNMENT
  
  ///////////////// CASE SCROLL ANIMATION
  
  ///////////////// CASE SCROLL ANIMATION
  (() => {
    const wrap = document.querySelector('[data-cases-section-wrap]');
    const backgrounds = [...document.querySelectorAll('.case-study__bg-anim')];
    const texts = [...document.querySelectorAll('.cases-study__text')];
    const videos = [...document.querySelectorAll('.case-study__video-wrap')];
    const countAnim = document.querySelector('.case-count__anim');
    if (!wrap || !backgrounds.length) return;
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const maxIndex = backgrounds.length - 1; // 4 шага -> индексы 0..3
    let activeIndex = -1; // -1, чтобы первый вызов setVisualState(0) точно сработал
    let ticking = false;
    const setVisualState = (index) => {
      backgrounds.forEach((bg, i) => bg.classList.toggle('is-active', i <= index));
      videos.forEach((video, i) => video.classList.toggle('is-active', i <= index));
      texts.forEach((text, i) => {
        text.classList.toggle('is-active', i === index);
        text.classList.toggle('is-prev', i < index);
      });
      if (countAnim) {
        countAnim.style.top = `${-100 * index}%`;
      }
    };
    const getIndexFromScroll = () => {
      const offset = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      // блок ещё не "вошёл" в режим прокрутки (верх ещё не ушёл за экран) — самый первый шаг
      if (offset.top >= 0) return 0;
      // блок уже полностью прокручен (низ поднялся выше нижней границы экрана) — последний шаг
      if (offset.bottom - vh <= 0) return maxIndex;
      // честный процент прокрутки самого блока
      const perc = (100 * Math.abs(offset.top)) / (offset.height - vh);
      // 4 шага, равномерно: 0-25 / 25-50 / 50-75 / 75-100
      if (perc < 25) return 0;
      if (perc < 50) return 1;
      if (perc < 75) return 2;
      return 3;
    };
    const update = () => {
      ticking = false;
      const index = clamp(getIndexFromScroll(), 0, maxIndex);
      if (index !== activeIndex) {
        activeIndex = index;
        setVisualState(activeIndex);
      }
    };
    const requestUpdate = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    update();
  })();
  // ==========================================
  // Huto size iframe video based on parent size
  // ==========================================
  $(document).ready(() => {
    function coverIframe(iframe) {
      const raw = iframe.dataset.aspect || '16/9';
      const [w, h] = raw.split('/').map(Number);
      const ratio = w / h;
      const parent = iframe.parentElement;
      const pw = parent.clientWidth;
      const ph = parent.clientHeight;
      if (pw / ph > ratio) {
        iframe.style.width = pw + 'px';
        iframe.style.height = pw / ratio + 'px';
      } else {
        iframe.style.height = ph + 'px';
        iframe.style.width = ph * ratio + 'px';
      }
    }
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const iframe = entry.target.querySelector('[data-iframe-autosize]');
        if (iframe) coverIframe(iframe);
      }
    });
    document.querySelectorAll('[data-iframe-autosize]').forEach((iframe) => {
      const parent = iframe.parentElement;
      parent.style.position = parent.style.position || 'relative';
      parent.style.overflow = 'hidden';
      coverIframe(iframe);
      ro.observe(parent);
    });
  });

})();
