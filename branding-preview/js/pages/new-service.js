// Page-specific interactions for brand and rebranding service pages.
///<script src="https://assets.slater.app/slater/826/59150.js"></script>
///<script src="https://slater.app/826/59150.js"></script>


$(document).ready(() => {

  ///////////////////////////////////////////////////////////////////
  

  //////////////////////////////////////////////////////////////////////
  // 
  //  CHANGE COLOR OF SECOND SECTION
  //
  $(function () {

    const $wrapper = $("[data-change-color='wrapper']");

    if (!$wrapper.length) { return; }

    const $elements = $wrapper.find("[data-change-color='elem']");
    const updateClasses = () => {
      const scrollTop = $(window).scrollTop();
      const threshold = window.innerHeight * 0.6;

      if (scrollTop > threshold) {
        $wrapper.addClass("is--anim-color");
        $elements.addClass("is--anim-color");
      } else {
        $wrapper.removeClass("is--anim-color");
        $elements.removeClass("is--anim-color");
      }
    };

    updateClasses();

    $(window).on("scroll resize", function () {
      updateClasses();
    });
  });


  //////////////////////////////////////////////////////////////////////
  // 
  //  COLORED SLIDERS
  //
  $(function () {
    const mqMobile = window.matchMedia('(max-width: 767px)');
    const BASE_SPEED = 0.8;

    function initMarqueeSlider($slider) {
      if (!$slider.length) return;

      const hasAutoScrollExt = !!(window.splide && window.splide.Extensions);

      const splide = new Splide($slider[0], {
        autoWidth: true,
        arrows: false,
        pagination: false,
        gap: '2.5rem',
        type: 'loop',
        drag: 'free',
        flickPower: 200,
        flickMaxPages: 1,
        autoScroll: !mqMobile.matches && hasAutoScrollExt ?
        {
          autoStart: true,
          speed: BASE_SPEED,
          pauseOnHover: false,
          pauseOnFocus: false,
        } : false,
        breakpoints: {
          991: { gap: '1rem' },
          767: {
            drag: true,
            perMove: 1,
            pagination: true,
          },
        },
      });

      splide.mount(hasAutoScrollExt ? window.splide.Extensions : undefined);

      if (!hasAutoScrollExt || mqMobile.matches) return splide;

      let isDragging = false;

      splide.on('drag', () => {
        isDragging = true;
      });

      splide.on('dragged', () => {
        setTimeout(() => {
          isDragging = false;
        }, 150);
      });

      function setSpeed(speed) {
        if (!splide.options.autoScroll) return;

        splide.options = {
          ...splide.options,
          autoScroll: {
            ...splide.options.autoScroll,
            speed,
          },
        };
      }

      $slider
        .on('mouseenter', () => {
          if (isDragging) return;
          setSpeed(BASE_SPEED * 0.3);
        })
        .on('mouseleave', () => {
          setSpeed(BASE_SPEED);
        });

      return splide;
    }

    $('[data-marquee=colored]').each(function () {
      let currentSlide = $(this).find('.splide__slide.w--current');
      currentSlide.remove();

      initMarqueeSlider($(this));

    });

  });

  //////////////////////////////////////////////////////////////////////
  // 
  //  FULLSCREN CASES SCROLL
  //
  $(function () {

    document.querySelectorAll('.featured__img').forEach(wrapper => {
      const videoId = wrapper.getAttribute('video-src');
      const iframe = wrapper.querySelector('iframe');

      if (!videoId || !iframe) return;

      iframe.src =
        `https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&byline=0&background=1&quality=1080p`;
    });

    const wrapper = document.querySelector('[data-swiper="featured"] .swiper-wrapper');

    if (wrapper) {
      const slides = [...wrapper.querySelectorAll(
        '.swiper-slide:not(.swiper-slide-duplicate)')];
      const total = slides.length;

      slides.forEach((slide, i) => {
        const counter = slide.querySelector('[data-counter]');
        if (!counter) return;

        const order = counter.querySelector('[data-order]');
        const length = counter.querySelector('[data-length]');

        if (order) order.textContent = String(i + 1).padStart(2, '0');
        if (length) length.textContent = String(total).padStart(2, '0');
      });
    }

    const mm = gsap.matchMedia();

    mm.add("(min-width: 992px)", () => {

      const sections = gsap.utils.toArray('.swiper-slide.mod--featured');

      sections.forEach(section => {
        const imgs = section.querySelectorAll('.featured__img');
        const container = section.querySelector('.featured__container');

        ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          onUpdate: self => {
            const p = self.progress;
            const imgY = -20 + p * 40;
            gsap.set(imgs, { y: imgY + "vh" });
          }
        });

        // featured__container з'являється при top <= 5% та зникає при top <= -50%
        if (container) {
          gsap.set(container, { opacity: 0 });

          ScrollTrigger.create({
            trigger: container,
            start: "top 5%",
            end: "top -50%",
            onEnter: () => gsap.to(container, {
              opacity: 1,
              duration: 0.6,
              ease: "power2.out"
            }),
            onLeave: () => gsap.to(container, {
              opacity: 0,
              duration: 0.6,
              ease: "power2.out"
            }),
            onEnterBack: () => gsap.to(container, {
              opacity: 1,
              duration: 0.6,
              ease: "power2.out"
            }),
            onLeaveBack: () => gsap.to(container, {
              opacity: 0,
              duration: 0.6,
              ease: "power2.out"
            })
          });
        }

      });

    });

  });

  //////////////////////////////////////////////////////////////////////
  // 
  //  FULLSCREN CASES SLIDER
  //
  $(function () {
    const swiperAttr = '[data-swiper="featured"]';
    const $swiperEl = $(swiperAttr);
    if (!$swiperEl.length) return;

    const $current = $('[data-swiper-numb="featured-current"]');
    const $all = $('[data-swiper-numb="featured-all"]');

    let swiper = null;

    const mq = window.matchMedia("(max-width: 991px)");

    function updateCounter(s) {
      const i = s.realIndex + 1;
      $current.text(i < 10 ? `0${i}` : i);
    }

    function init() {
      if (swiper) return;

      const count = $swiperEl.find('.swiper-slide').length;
      $all.text(count < 10 ? `0${count}` : count);

      swiper = new Swiper($swiperEl[0], {
        loop: true,
        speed: 1000,
        slidesPerView: 1,
        autoplay: {
          delay: 5000,
          disableOnInteraction: false,
          waitForTransition: false,
        },
        on: {
          init: updateCounter,
          slideChange: updateCounter,
        },
      });
    }

    function destroy() {
      if (!swiper) return;
      swiper.destroy(true, true);
      swiper = null;
    }

    function check() {
      mq.matches ? init() : destroy();
    }

    mq.addEventListener("change", check);
    check();
  });

  //////////////////////////////////////////////////////////////////////
  // 
  //  PROCESS
  //
  $(function () {

    const swiperAttr = '[data-swiper="process"]';
    const $swiperEl = $(swiperAttr);
    if (!$swiperEl.length) return;

    const $container = $swiperEl.closest('.container');
    const paginationEl = $container.find('[data-swiper-pagination]')[0];

    const swiper = new Swiper($swiperEl[0], {
      slidesPerView: 'auto',
      speed: 300,
      allowTouchMove: true,
      effect: 'fade',
      fadeEffect: {
        crossFade: true
      },
      pagination: {
        el: paginationEl,
        type: 'bullets',
        clickable: true,
      },
    });

    if (window.innerWidth < 768) return;

    const $sticky = $('[data-process-elem=sticky]');
    const viewportHeight = window.innerHeight;
    const stickyHeight = $sticky.outerHeight();
    const stickyTopOffset = viewportHeight > stickyHeight ?
      Math.floor((viewportHeight - stickyHeight) / 2) :
      0;
    $sticky.css('top', stickyTopOffset + 'px');

    let $graphLines = $('[data-process-elem=lines] > div');
    let $graphHere = $('[data-process-elem=here]');
    let $btns = $('[data-process-btn]');
    let $anchors = $('[data-process-elem=anchors] > div');

    let totalLines = $graphLines.length;
    let minPercent = 1.5;
    let maxPercent = 100;
    let exponent = 2.3;

    $graphLines.each(function (index, elem) {
      let progress = totalLines > 1 ? index / (totalLines - 1) : 0;
      let scale = Math.pow(progress, exponent);
      let percent = minPercent + (maxPercent - minPercent) * scale;
      $(elem).css('height', percent + '%');
      $(elem).find('div').first().css('height', '0%');
    });

    let lastBtnIndex = 0;
    let animationToken = 0;
    let activeIndex = 0;
    let isProgrammaticScroll = false;

    function setActiveBtn(index) {
      $btns.removeClass('active');
      $btns.eq(index).addClass('active');
      activeIndex = index;
    }

    function setBarsAnimated(targetBtnIndex) {
      if (targetBtnIndex < 0) targetBtnIndex = 0;
      if (targetBtnIndex > $btns.length - 1) targetBtnIndex = $btns.length - 1;

      animationToken += 1;
      const currentToken = animationToken;

      setActiveBtn(targetBtnIndex);

      if (targetBtnIndex === 0) {
        $graphHere.css('opacity', '1');
      } else {
        $graphHere.css('opacity', '0');
      }

      let totalBtns = $btns.length;
      let newPercentFill = (targetBtnIndex === 0) ? 0 : targetBtnIndex / (totalBtns - 1);
      let barsToFillNew = Math.floor(totalLines * newPercentFill);

      let lastPercentFill = (lastBtnIndex === 0) ? 0 : lastBtnIndex / (totalBtns - 1);
      let barsToFillPrev = Math.floor(totalLines * lastPercentFill);

      let indices = [];

      if (barsToFillNew > barsToFillPrev) {
        for (let i = barsToFillPrev; i < barsToFillNew; i++) indices.push(i);
      } else if (barsToFillNew < barsToFillPrev) {
        for (let i = barsToFillPrev - 1; i >= barsToFillNew; i--) indices.push(i);
      }

      if (barsToFillNew > barsToFillPrev) {
        for (let i = 0; i < barsToFillPrev; i++) {
          $graphLines.eq(i).find('div').first().css('height', '100%');
        }
        for (let i = barsToFillNew; i < totalLines; i++) {
          $graphLines.eq(i).find('div').first().css('height', '0%');
        }
      } else {
        for (let i = 0; i < barsToFillNew; i++) {
          $graphLines.eq(i).find('div').first().css('height', '100%');
        }
        for (let i = barsToFillPrev; i < totalLines; i++) {
          $graphLines.eq(i).find('div').first().css('height', '0%');
        }
      }

      indices.forEach(function (currentIndex, step) {
        setTimeout(function () {
          if (currentToken !== animationToken) return;
          let $bar = $graphLines.eq(currentIndex).find('div').first();
          if (barsToFillNew > barsToFillPrev) {
            $bar.css('height', '100%');
          } else {
            $bar.css('height', '0%');
          }
        }, 20 * step);
      });

      lastBtnIndex = targetBtnIndex;
    }

    function getAnchorIndexByScroll(scrollY) {
      let scrollTop = scrollY !== undefined ? scrollY : window.pageYOffset;
      let currentIndex = 0;

      $anchors.each(function (index, elem) {
        let elemTop = elem.getBoundingClientRect().top + window.pageYOffset;
        if (scrollTop >= elemTop) {
          currentIndex = index + 1; // линия 0 → слайд 1
        }
      });

      if (currentIndex > $btns.length - 1) {
        currentIndex = $btns.length - 1;
      }

      return currentIndex;
    }

    function scrollToAnchor(index) {
      const lenis = window.lenis;
      if (!lenis) return;

      isProgrammaticScroll = true;

      let target;
      let offset = 0;

      if (index <= 0) {
        const firstEl = $anchors.first()[0];
        target = firstEl || 0;
        offset = firstEl ? -1 : 0;
      } else {
        target = $anchors.eq(index - 1)[0];
        if (!target) {
          isProgrammaticScroll = false;
          return;
        }
      }

      lenis.scrollTo(target, {
        immediate: true,
        offset: offset,
      });

      // immediate: true → скролл мгновенный,
      // сбрасываем флаг через 2 кадра — этого достаточно,
      // чтобы Lenis успел выпустить свои scroll-события от scrollTo
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          isProgrammaticScroll = false;
        });
      });
    }

    setBarsAnimated(0);

    $btns.on('click', function () {
      let btnIndex = $btns.index(this);

      setBarsAnimated(btnIndex);
      swiper.slideTo(btnIndex);
      scrollToAnchor(btnIndex);
    });

    const lenis = window.lenis;

    if (lenis) {
      lenis.on('scroll', function (e) {
        if (isProgrammaticScroll) return;

        let idx = getAnchorIndexByScroll(e.scroll);

        if (idx !== activeIndex) {
          setBarsAnimated(idx);
          swiper.slideTo(idx);
        }
      });
    } else {
      $(window).on('scroll', function () {
        if (isProgrammaticScroll) return;

        let idx = getAnchorIndexByScroll();

        if (idx !== activeIndex) {
          setBarsAnimated(idx);
          swiper.slideTo(idx);
        }
      });
    }
  });

  //////////////////////////////////////////////////////////////////////
  // 
  //  REVIEWS SLIDER
  //
  $(function () {

    function updatePaginationDone(swiper) {
      const $bullets = $(swiper.pagination.el).find('.swiper-pagination-bullet');
      const activeIndex = $bullets.index($bullets.filter(
        '.swiper-pagination-bullet-active'));

      $bullets.each(function (index) {
        if (index < activeIndex) {
          $(this).addClass('done');
        } else {
          $(this).removeClass('done');
        }
      });
    }

    const swiperAttr = '[data-swiper="reviews2"]';
    const $swiperEl = $(swiperAttr);

    if ($swiperEl.length === 0) return;

    const $container = $swiperEl.closest('.container');

    const nextEl = $container.find('[data-swiper-next]')[0];
    const prevEl = $container.find('[data-swiper-prev]')[0];
    const paginationEl = $container.find('[data-swiper-pagination]')[0];

    const swiper = new Swiper($swiperEl[0], {
      speed: 500,
      slidesPerView: 'auto',
      initialSlide: 1,
      navigation: {
        nextEl,
        prevEl,
      },
      pagination: {
        el: paginationEl,
        type: 'bullets',
        clickable: true,
      },
      pagination: {
        el: paginationEl,
        type: 'bullets',
        clickable: true,
      },
      effect: 'fade',
      fadeEffect: {
        crossFade: true
      },
      autoplay: {
        delay: 7000,
        disableOnInteraction: false,
        waitForTransition: false,
      },
      on: {
        slideChange(swiper) {
          updatePaginationDone(swiper);
        }
      }
    });

    setTimeout(function () { swiper.slidePrev(0); }, 0);
  });

  //////////////////////////////////////////////////////////////////////
  // 
  //  LATTERS SLIDER
  //
  $(function () {
    const swiperAttr = '[data-swiper="letters"]';
    const $swipers = $(swiperAttr);

    if ($swipers.length === 0) return;

    $swipers.each(function () {
      const swiperEl = this;
      const $swiperEl = $(swiperEl);

      const $container = $swiperEl.closest('.container');

      const paginationEl = $container.find('[data-swiper-pagination]')[0];

      const nextEl = $container.find('[data-swiper-next]')[0];
      const prevEl = $container.find('[data-swiper-prev]')[0];

      if (!nextEl || !prevEl) return;

      const swiper = new Swiper(swiperEl, {
        speed: 500,
        slidesPerView: 1,
        navigation: {
          nextEl,
          prevEl,
        },
        pagination: {
          el: paginationEl,
          type: 'bullets',
          clickable: true,
        },
        grabCursor: false,
        on: {
          init(sw) {
            updateNavState(sw, prevEl, nextEl);
          },
          slideChange(sw) {
            updateNavState(sw, prevEl, nextEl);
          }
        }
      });
    });

    function updateNavState(swiper, prevEl, nextEl) {
      const isFirst = swiper.activeIndex === 0;
      const isLast = swiper.activeIndex === swiper.slides.length - 1;

      // prev button
      if (isFirst) {
        prevEl.style.opacity = '0';
        prevEl.style.pointerEvents = 'none';
      } else {
        prevEl.style.opacity = '';
        prevEl.style.pointerEvents = '';
      }

      // next button
      if (isLast) {
        nextEl.style.opacity = '0';
        nextEl.style.pointerEvents = 'none';
      } else {
        nextEl.style.opacity = '';
        nextEl.style.pointerEvents = '';
      }
    }
  });

});
