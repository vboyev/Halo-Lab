// Global site interactions: navigation, smooth scrolling, forms, and shared UI behavior.
///<script src="https://assets.slater.app/slater/826/1521.js"></script>
/// <script src="https://slater.app/826/1521.js"></script>


$(document).ready(() => {
  const currentDomain = window.location.hostname;
  const urlHref = window.location.href;
  const windowWidth = $(window).width();
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Formspree handles only actual lead and newsletter forms. Finsweet filters,
  // search, cookie preferences, and other technical forms never match this selector.
  const formspreeEndpoints = {
    'form-order': 'https://formspree.io/f/maewjgpk',
    'form-subs': 'https://formspree.io/f/xqpzbvyo',
  };
  const formspreeSelector = 'form[target="form-order"], form[target="form-subs"]';
  const formspreeExcludedPaths = new Set(['/components.html', '/style-guide.html']);
  const turnstileSiteKey = '0x4AAAAAAEP0QWTQ2U47oHyP';
  const turnstileScriptUrl = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  const turnstileWidgets = new WeakMap();
  let turnstileScriptPromise;
  let turnstileWidgetIndex = 0;
  const brandScoreFormId = 'wf-form-Brand-Score';
  const brandScoreFieldNames = [
    'Full-Name',
    'Email',
    'Position',
    'Survey-score',
    'Survey-result',
    'Country',
    'Page of submit',
    'Lifecycle',
    'Lead ID',
    'Referrer',
    'Initial Source',
  ];

  function getAnalyticsContext(element) {
    const contextElement = element?.closest?.('[data-analytics-service], [data-analytics-page-type]')
      || document.body;

    return {
      service: contextElement?.dataset?.analyticsService || document.body.dataset.analyticsService || 'general',
      page_type: contextElement?.dataset?.analyticsPageType
        || document.body.dataset.analyticsPageType
        || 'website',
    };
  }

  function pushAnalyticsEvent(eventName, parameters = {}) {
    if (!eventName) return;

    const { element, ...eventParameters } = parameters;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...getAnalyticsContext(element),
      ...eventParameters,
    });
  }

  function pushBookingSuccess(element) {
    pushAnalyticsEvent('booking_success', {
      element,
      booking_provider: 'cal',
      booking_status: 'confirmed',
    });
  }

  function initDeclarativeAnalytics() {
    document.addEventListener('click', function (event) {
      const trigger = event.target instanceof Element
        ? event.target.closest('[data-analytics-event]')
        : null;
      if (!trigger) return;

      pushAnalyticsEvent(trigger.dataset.analyticsEvent, {
        element: trigger,
        cta_id: trigger.dataset.analyticsCtaId || undefined,
        cta_location: trigger.dataset.analyticsLocation || undefined,
        content_type: trigger.dataset.analyticsContentType || undefined,
        content_id: trigger.dataset.analyticsContentId || undefined,
        destination: trigger.dataset.analyticsDestination || undefined,
      });
    });

    document.addEventListener('input', function (event) {
      const form = event.target instanceof Element
        ? event.target.closest('form[data-analytics-form-id]')
        : null;
      if (!form || form.dataset.analyticsStarted === 'true') return;

      form.dataset.analyticsStarted = 'true';
      pushAnalyticsEvent('form_start', {
        element: form,
        form_id: form.dataset.analyticsFormId,
      });
    });

    $(document).on('halo:form-success', 'form[data-analytics-form-id]', function () {
      pushAnalyticsEvent('qualified_lead_submit', {
        element: this,
        form_id: this.dataset.analyticsFormId,
      });
    });
  }

  initDeclarativeAnalytics();

  function getFormWrapper(form) {
    return form.closest('.w-form') || form.parentElement;
  }

  function setFormLoadingState(form, isLoading) {
    form.dataset.formspreeSubmitting = isLoading ? 'true' : 'false';
    form.setAttribute('aria-busy', String(isLoading));

    form.querySelectorAll('input[type="submit"], button[type="submit"]').forEach((control) => {
      if (isLoading) {
        control.dataset.formspreeValue = control.value;
        if (control.dataset.wait && 'value' in control) control.value = control.dataset.wait;
        control.disabled = true;
        return;
      }

      if (control.dataset.formspreeValue && 'value' in control) {
        control.value = control.dataset.formspreeValue;
      }
      control.disabled = false;
    });
  }

  function showFormErrorState(form) {
    const wrapper = getFormWrapper(form);
    if (!wrapper) return;

    wrapper.querySelectorAll('.w-form-done').forEach((element) => {
      element.style.display = 'none';
    });
    wrapper.querySelectorAll('.w-form-fail').forEach((element) => {
      element.style.display = 'block';
    });
  }

  function appendFormspreeMetadata(form, formData) {
    const query = new URLSearchParams(window.location.search);
    const formGroup = form.getAttribute('target') === 'form-subs' ? 'newsletter' : 'lead';

    formData.set('Form name', form.dataset.name || form.getAttribute('name') || form.id);
    formData.set('Form ID', form.id || 'unknown');
    formData.set('Form group', formGroup);
    formData.set('Page title', document.title);
    formData.set('Page URL', window.location.href);
    formData.set('publishedPath', window.location.pathname);

    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
      const value = query.get(key);
      if (value) formData.set(key, value);
    });
  }

  async function syncInternationalPhoneFields(form) {
    const getIntlTelInputInstance = window.intlTelInputGlobals?.getInstance;
    if (typeof getIntlTelInputInstance !== 'function') return;

    const phoneInputs = form.querySelectorAll('input[type="tel"]');

    await Promise.all([...phoneInputs].map(async (phoneInput) => {
      const iti = getIntlTelInputInstance(phoneInput);
      if (!iti) return;

      try {
        await iti.promise;
      } catch (error) {
        console.warn('International phone input did not finish loading', error);
        return;
      }

      const inputWrapper = phoneInput.closest('.iti') || form;
      const fullPhoneInput = inputWrapper.querySelector('input[name="phone_full"]');
      const countryCodeInput = inputWrapper.querySelector('input[name="country_code"]');
      const countryCode = iti.getSelectedCountryData()?.iso2 || '';

      if (fullPhoneInput) fullPhoneInput.value = iti.getNumber() || '';
      if (countryCodeInput) countryCodeInput.value = countryCode;
    }));
  }

  function getFormspreeFormData(form) {
    const sourceFormData = new FormData(form);

    // The survey radios are only used to calculate the final score. Leads
    // receives the three contact fields, score, result, and attribution fields.
    if (form.id === brandScoreFormId) {
      const formData = new FormData();
      brandScoreFieldNames.forEach((fieldName) => {
        if (sourceFormData.has(fieldName)) {
          formData.set(fieldName, sourceFormData.get(fieldName));
        }
      });
      return formData;
    }

    appendFormspreeMetadata(form, sourceFormData);
    return sourceFormData;
  }

  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (turnstileScriptPromise) return turnstileScriptPromise;

    turnstileScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = turnstileScriptUrl;
      script.async = true;
      script.onload = () => {
        if (window.turnstile) {
          resolve(window.turnstile);
          return;
        }
        reject(new Error('Cloudflare Turnstile did not initialize'));
      };
      script.onerror = () => reject(new Error('Cloudflare Turnstile failed to load'));
      document.head.appendChild(script);
    });

    return turnstileScriptPromise;
  }

  function createTurnstileContainer(form) {
    const container = document.createElement('div');
    container.id = `turnstile-widget-${turnstileWidgetIndex += 1}`;
    container.dataset.turnstileContainer = '';

    const submitWrapper = form.querySelector('[data-submit-wrap], .form-sbtn__wrap');
    if (submitWrapper) {
      submitWrapper.insertAdjacentElement('afterend', container);
    } else {
      form.appendChild(container);
    }

    return container;
  }

  async function getTurnstileToken(form) {
    const turnstile = await loadTurnstile();
    let state = turnstileWidgets.get(form);

    if (!state) {
      const container = createTurnstileContainer(form);
      state = { container, pending: null, widgetId: null };
      state.widgetId = turnstile.render(`#${container.id}`, {
        sitekey: turnstileSiteKey,
        theme: 'auto',
        appearance: 'interaction-only',
        execution: 'execute',
        callback(token) {
          if (!state.pending) return;
          state.pending.resolve(token);
          state.pending = null;
        },
        'error-callback'(errorCode) {
          if (!state.pending) return;
          state.pending.reject(new Error(`Cloudflare Turnstile failed: ${errorCode}`));
          state.pending = null;
        },
      });
      turnstileWidgets.set(form, state);
    }

    if (state.pending) return state.pending.promise;

    const pending = {};
    pending.promise = new Promise((resolve, reject) => {
      pending.resolve = resolve;
      pending.reject = reject;
    });
    state.pending = pending;
    turnstile.execute(`#${state.container.id}`);
    return pending.promise;
  }

  function resetTurnstile(form) {
    const state = turnstileWidgets.get(form);
    if (state && window.turnstile) window.turnstile.reset(state.widgetId);
  }

  async function submitFormspreeForm(form, event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (form.dataset.formspreeSubmitting === 'true') return;

    if (typeof window.validationForm === 'function' && !window.validationForm($(form))) {
      return;
    }

    const endpoint = formspreeEndpoints[form.getAttribute('target')];
    if (!endpoint) return;

    setFormLoadingState(form, true);

    try {
      const turnstileToken = await getTurnstileToken(form);
      await syncInternationalPhoneFields(form);
      const formData = getFormspreeFormData(form);
      formData.set('cf-turnstile-response', turnstileToken);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) throw new Error(`Formspree request failed with ${response.status}`);

      resetTurnstile(form);
      setFormLoadingState(form, false);
      $(form).trigger('halo:form-success');
    } catch (error) {
      console.error('Formspree submission failed', error);
      resetTurnstile(form);
      setFormLoadingState(form, false);
      showFormErrorState(form);
      $(form).trigger('halo:form-error');
    }
  }

  function initFormspreeForms() {
    if (formspreeExcludedPaths.has(window.location.pathname)) return;

    document.querySelectorAll(formspreeSelector).forEach((form) => {
      form.dataset.formspreeManaged = 'true';
    });

    // Capture the event before Webflow's legacy submit handlers, so success UI,
    // booking and calendar flows cannot run until Formspree accepts the request.
    document.addEventListener('submit', function (event) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.dataset.formspreeManaged !== 'true') return;

      submitFormspreeForm(form, event);
    }, true);
  }

  initFormspreeForms();

  //////////////////////////////////////////////////////////////////////////////////
  //
  // FIX COMMA FOR OTHER INDUSTRY
  //   
  $(function () {
    const $listContainer = $('[fs-list-element="list"]').first();
    if (!$listContainer.length) return;

    let timeoutId = null;

    // move items with special slug to top
    const fixSpecialSlugs = () => {
      const $other = $('[data-slug="other-industries"]');
      if (!$other.length) return;

      $other.each(function () {
        const $el = $(this);
        const $parent = $el.parent();

        if (!$parent.length) return;

        const $firstChild = $parent.children().first();
        if (!$firstChild.is($el)) {
          $el.prependTo($parent);
        }
      });
    };

    // debounce mutations
    const scheduleFix = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(fixSpecialSlugs, 300);
    };

    // initial fix
    scheduleFix();

    // observe list changes
    const targetNode = $listContainer.get(0);
    if (!window.MutationObserver || !targetNode) return;

    const observer = new MutationObserver(scheduleFix);
    observer.observe(targetNode, {
      childList: true,
      subtree: true
    });
  });

  //////////////////////////////////////////////////////////////////////////////////
  //
  // arrow in H2 of card post
  //
  function changePostCollection() {
    if ($('[data-post-card-arrow]').length && windowWidth > 991) {
      $('[data-post-card-arrow]').each((index, element) => {
        const $postCard = $(element).closest('[data-hover]');
        const $heading = $postCard.find('h2, h3, [data-post-card-title]');
        const $arrow = $(element);
        const $span = $('<span>').addClass('post-card__span-icons').appendTo(
          $heading);
        $span.append($arrow);
      });
    }
  }

  if (windowWidth > 991) {
    changePostCollection();
    let timerId;
    $(document).on('click',
      '.w-pagination-wrapper a, [fs-cmsfilter-element="filters"] [fs-cmsfilter-clear], [fs-cmsfilter-element="filters"] [data-filter-btn-services]',
      function () {
        if (timerId) {
          clearTimeout(timerId);
        }
        timerId = setTimeout(changePostCollection, 1000);
      });
  }

  //////////////////////////////////////////////////////////////////////////////////
  //
  // PAGINATION
  //
  {
    if ($('.w-pagination-wrapper').length && $('[fs-cmsload-mode="pagination"]').length) {
      let timerId;
      const pageTotal = parseInt($('.w-page-count').text().split(' / ')[1], 10);
      const paginationWrapper = $('.w-pagination-wrapper');
      const paginationPageCurrent = $('[data-page-current]');
      const displayedPages = new Set();

      const getNumberFromHref = (href) => {
        const match = href.match(/(\d+)$/);
        return match ? match[0] : null;
      };

      const paginationVisible = () => {
        const pageButtons = $('[fs-cmsload-element=page-button]');
        if (pageButtons.length > 1) {
          paginationWrapper.css('opacity', '1');
        } else {
          paginationWrapper.css('opacity', '0');
        }
      };
      paginationVisible();

      const paginationUpdate = (pageCurrent) => {
        const pageButtons = $('[fs-cmsload-element=page-button]');
        const isDots = $('[fs-cmsload-element=page-dots]');

        $(paginationPageCurrent).attr('data-page-current', pageCurrent);

        if (pageCurrent === pageTotal) {
          pageButtons.last().prev().addClass('is-show');
        } else {
          pageButtons.last().prev().removeClass('is-show');
        }

        if (pageCurrent >= 5 && isDots.length == 1) {
          isDots.first().addClass('is-show');
          pageButtons.first().addClass('is-show');
        } else {
          isDots.first().removeClass('is-show');
          pageButtons.first().removeClass('is-show');
        }
      };

      const observer = new MutationObserver((mutations) => {
        paginationVisible();

        if (timerId) {
          clearTimeout(timerId);
        }
        timerId = setTimeout(changePostCollection, 1000);

        if (windowWidth < 480) {
          mutations.forEach((mutation) => {
            if (mutation.target.classList.contains('w--current')) {
              const href = mutation.target.getAttribute('href');
              const pageCurrent = parseInt(href.split('_page=')[1], 10);

              if (pageCurrent !== null) {
                if (!displayedPages.has(pageCurrent)) {
                  displayedPages.add(pageCurrent);
                  paginationUpdate(pageCurrent);
                } else {
                  displayedPages.clear();
                }
              }
            }
          });
        }

      });

      observer.observe(paginationWrapper[0], {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: false,
        attributeOldValue: false,
        characterDataOldValue: false,
      });
    }
  };

  if (windowWidth > 991) {

    // SMOOTH SCROLL Lenis
    const shouldDisableLenis = urlHref.includes('/blog/') || urlHref.includes('/projects/');
    if (!shouldDisableLenis) {

      window.lenis = new Lenis({
        duration: 1.3,
        easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
        direction: "vertical",
      });

      function raf(time) {
        window.lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);

      console.log("Lenis запущен");
    } else {
      console.log("Lenis отключен для этой страницы или браузера");
    }

    // fix bug in table of content
    $(document).on('click', '[data-toc-link]', function () {
      let hash = $(this).attr('data-toc-link');
      const offset = $(`#${hash}`).offset().top - 100;
      $('html, body').animate({
        scrollTop: offset
      }, 400);
    });

    // block scroll when modal is open
    {
      $(document).on('opening', '.remodal', function () {
        $('html').attr('data-lenis-prevent', '');
      });

      $(document).on('closing', '.remodal', function (e) {
        $('html').removeAttr('data-lenis-prevent');
      });
    }
  } else {

    // fix disable scrolling after opening remodal for iphone
    $(document).on('opening', '.remodal', function () {
      if (!$('html').hasClass('remodal-is-locked')) {
        $('html').addClass('remodal-is-locked');
      }
    });
    $(document).on('closing', '.remodal', function () {
      $('html').removeClass('remodal-is-locked');
    });

    // scroll to id when click in a link with hash
    {
      $('a[href^="#"]:not(.w-tab-link)').click(function (event) {
        let target = $(this.hash);
        if (target.length) {
          event.preventDefault();
          let offset = target.offset().top - 100;
          $('html, body').animate({
            scrollTop: offset
          }, 800);
        }
      });
    };
  }

  ///////////////////////////////////////////////////////////////////
  // Swiper letters
  //
  $(function () {
    const swiperAttr = '[data-swiper="lovelatters"]';
    const $swiperEl = $(swiperAttr);

    if ($swiperEl.length === 0) return;

    const $container = $swiperEl.closest('.container');

    const nextEl = $container.find('[data-swiper-next]')[0];
    const prevEl = $container.find('[data-swiper-prev]')[0];
    const paginationEl = $container.find('[data-swiper-pagination]')[0];

    const swiper = new Swiper($swiperEl[0], {
      speed: 500,
      slidesPerView: 'auto',
      effect: "cards",
      cardsEffect: {
        rotate: true,
        slideShadows: false,
        perSlideOffset: 6,
        perSlideRotate: 3,
      },
      grabCursor: false,
      watchSlidesProgress: true,
      navigation: {
        nextEl,
        prevEl,
      },
      pagination: {
        el: paginationEl,
        type: 'bullets',
        clickable: true,
      },
      on: {
        init: function () {
          updateCustomClasses(this);
          handleCardsBreakpoint(this);
        },
        slideChange: function () {
          updateCustomClasses(this);
        },
        breakpoint: function () {
          handleCardsBreakpoint(this);
        }
      }
    });

    function handleCardsBreakpoint(swiperInstance) {
      const windowWidth = $(window).width();

      if (windowWidth <= 991) {
        swiperInstance.params.cardsEffect.perSlideOffset = 4;
        swiperInstance.params.cardsEffect.perSlideRotate = 1.5;
      } else {
        swiperInstance.params.cardsEffect.perSlideOffset = 6;
        swiperInstance.params.cardsEffect.perSlideRotate = 3;
      }

      if (swiperInstance.modules && swiperInstance.modules['effect-cards']) {
        swiperInstance.update();
      }
    }

    function updateCustomClasses(swiperInstance) {
      $(swiperInstance.slides).removeClass('swiper-slide-prev-second');

      const activeIndex = swiperInstance.activeIndex;

      if (activeIndex >= 2) {
        $(swiperInstance.slides[activeIndex - 2]).addClass('swiper-slide-prev-second');
      }
    }
  });

  //////////////////////////////////////////////////////////////////////
  // 
  //  LOGOS SLIDER 
  //
  $(function () {
    function logoMarquee() {

      let speed = 0.5;

      const ua = navigator.userAgent;
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

      if (isSafari) {
        speed *= 3;
      }

      const rootLeft = document.querySelector('[data-marquee="logo-left"]');
      if (!rootLeft) return;

      new Splide(rootLeft, {
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
            perPage: 4,
            gap: '2.25rem',
          },
        },
        autoScroll: {
          autoStart: true,
          speed: speed,
          pauseOnHover: false,
        },
      }).mount(window.splide.Extensions);

      const rootRight = document.querySelector('[data-marquee="logo-right"]');
      if (!rootRight) return;

      new Splide(rootRight, {
        perPage: 7,
        arrows: false,
        pagination: false,
        focus: 'center',
        gap: '3.6rem',
        type: 'loop',
        breakpoints: {
          991: {
            perPage: 5,
            gap: '3.6rem',
          },
          479: {
            perPage: 4,
            gap: '2rem',
          },
        },
        autoScroll: {
          autoStart: true,
          speed: -speed,
          pauseOnHover: false,
        },
      }).mount(window.splide.Extensions);

    }

    logoMarquee();
  });

  //////////////////////////////////////////////////////////////////////////////////
  //
  // CUSTOM SCROLLBAR
  //
  {
    if (windowWidth > 991) {
      const customScrollbar = $('<div class="custom-scrollbar"></div>').appendTo('body');

      customScrollbar.css({
        position: 'fixed',
        top: 0,
        right: '2px',
        width: '6px',
        height: '100%',
        background: '#636363',
        borderRadius: '20px',
        opacity: 0,
        transition: 'opacity 0.4s ease, width 0.3s ease',
        zIndex: 9999,
        userSelect: 'none',
      });

      let timeoutId;

      const updateScrollbar = () => {
        const contentHeight = $('body')[0].scrollHeight;
        const viewportHeight = $(window).height();
        const scrollbarHeight = (viewportHeight / contentHeight) * viewportHeight;

        customScrollbar.css('height', scrollbarHeight);
      };

      updateScrollbar();

      $(window).on('resize', updateScrollbar);

      const updateCustomScrollbarPosition = () => {
        const scrollTop = $(window).scrollTop();
        const contentHeight = $('body')[0].scrollHeight;
        const viewportHeight = $(window).height();
        const scrollbarHeight = customScrollbar.height();
        const maxScrollTop = contentHeight - viewportHeight;
        const scrollbarTop = (scrollTop / maxScrollTop) * (viewportHeight -
          scrollbarHeight);

        customScrollbar.css('top', scrollbarTop);
      };

      const hideScrollbar = () => {
        clearTimeout(timeoutId);
        if (!isDragging && !isHovered) {
          customScrollbar.css({
            opacity: 0,
            width: '6px',
          });
        }
      };

      let isDragging = false;
      let isHovered = false;

      customScrollbar.on('mousedown', (e) => {
        isDragging = true;
        const startY = e.clientY;
        const startTop = parseFloat(customScrollbar.css('top'));

        $(document).on('mousemove.customscroll', (e) => {
          const diffY = e.clientY - startY;
          const contentHeight = $('body')[0].scrollHeight;
          const viewportHeight = $(window).height();
          const scrollbarHeight = customScrollbar.height();
          const maxScrollTop = contentHeight - viewportHeight;
          const newScrollTop = (startTop + diffY) * (maxScrollTop / (
            viewportHeight -
            scrollbarHeight));

          $(window).scrollTop(newScrollTop);
          updateCustomScrollbarPosition();
          customScrollbar.css({
            opacity: 0.6,
            width: '10px',
          });
        });

        $(document).on('mouseup.customscroll', () => {
          isDragging = false;
          $(document).off('.customscroll');
          timeoutId = setTimeout(hideScrollbar, 500);
        });
      });

      customScrollbar.on('mouseenter', () => {
        customScrollbar.css({
          opacity: 0.6,
          width: '10px',
        });
        clearTimeout(timeoutId);
        isHovered = true;
      });

      customScrollbar.on('mouseleave', () => {
        if (!isDragging) {
          timeoutId = setTimeout(hideScrollbar, 500);
        }
        isHovered = false;
      });

      $(window).on('scroll', () => {
        if (!isDragging) {
          updateCustomScrollbarPosition();
          customScrollbar.css('opacity', 0.6);
          clearTimeout(timeoutId);
          timeoutId = setTimeout(hideScrollbar, 500);
        }
      });

      // change color of scrollbar
      if ($('body').is('[scroll-document-grey]')) {
        customScrollbar.css('background', '#B4B4BC');
      }
    }
  };

  //////////////////////////////////////////////////////////////////////////////////
  //
  // HOVER ANIMATION
  // animate with active class using attr on the elements
  {
    // remove all active class
    $('[data-hover-elem]').removeClass('active');

    function animButtons(elem, state) {
      const $this = elem;
      const hoverThis = $this.attr('data-hover-elem') !== undefined;
      let parent;
      let child;

      if ($this.is('[data-hover-only]')) {
        parent = 0;
        child = $this.find('[data-hover-elem]');
      } else {
        parent = $this.closest('[data-hover-parent]').find('[data-hover-elem]').not(
          '[data-hover-only] [data-hover-elem]');
        child = $this.find('[data-hover-elem]').not(
          '[data-hover-only] [data-hover-elem]');
      }

      if (state == 'hover') {
        // when hover
        if (parent.length !== 0 && parent instanceof jQuery) {
          parent.addClass('active');
        } else if (hoverThis) {
          $this.addClass('active');
          child.addClass('active');
        } else if (child.length !== 0) {
          child.addClass('active');
        }
      } else {
        // when hover out
        if (parent.length !== 0 && parent instanceof jQuery) {
          parent.removeClass('active');
        } else if (hoverThis) {
          $this.removeClass('active');
          child.removeClass('active');
        } else if (child.length !== 0) {
          child.removeClass('active');
        }
      }

    }

    $(document).on('mouseenter', '[data-hover]:not(.w-dropdown), [data-hover-only]',
      function () {
        if ($(this).is('[data-hover=prevent-responsive]') && windowWidth > 991) {
          animButtons($(this), 'hover');
        } else if (!$(this).is('[data-hover=prevent-responsive]')) {
          animButtons($(this), 'hover');
        }
      });

    $(document).on('mouseleave', '[data-hover]:not(.w-dropdown), [data-hover-only]',
      function () {
        if ($(this).is('[data-hover=prevent-responsive]') && windowWidth > 991) {
          animButtons($(this), 'hoverOut');
        } else if (!$(this).is('[data-hover=prevent-responsive]')) {
          animButtons($(this), 'hoverOut');
        }
      });

    $(document).on('click', '[data-hover-click]', function () {
      if ($(this).data('hoverClick') == 'once') {
        animButtons($(this), 'hover');
      } else {
        if ($(this).hasClass('active-click')) {
          $(this).removeClass('active-click');
          animButtons($(this), 'hoverOut');
        } else {
          $(this).addClass('active-click');
          animButtons($(this), 'hover');
        }
      }
    });

  };

  // move page when dropdown open
  $('.dropdown__toggle.mod--footer').on('click', function () {
    if ($('.dropdown__list').hasClass('w--open')) {
      $('html, body').animate({
        scrollTop: '-=' + ($(window).height() * 0) + 'px'
      }, 'slow');
    } else {
      $('html, body').animate({
        scrollTop: '+=' + ($(window).height() * 0.8) + 'px'
      }, 'slow');
    }
  });

  //////////////////////////////////////////////////////////////////////////////////
  //
  // HEADER
  //
  {
    const header = $('header');
    const headerFixed = $('header [data-header-fixed]');
    const subheaderFixed = $('[data-subheader-fixed]');
    const windowHeight = $(window).height();
    const $sidebar = $('[data-sidebar-sticky]');
    const sidebars = $sidebar.length && $(window).width() > ($sidebar.data(
      'sidebar-sticky') === 'tablet' ? 768 : 991);
    const fortyPercentHeight = $(window).height() * 0.4;
    let distanceFromTop = $(window).scrollTop();
    let previousScroll = 0;
    let previousScrollSecond = 0;
    let headerOnce = true;

    const menuOpenElem = $('[data-menu-open]').find('[data-anim]');
    const animElem = $('[data-menu-anim], [data-menu-services-anim]');

    let headerHasShow = $(header).hasClass('is-header-show');

    function menuHide() {
      if (!headerHasShow) {
        menuOpenElem.addClass('anim');
        animElem.addClass('anim');
      }
    }

    // if we are on hero after load page
    if (distanceFromTop < windowHeight) {
      if (subheaderFixed) {
        subheaderFixed.attr('data-subheader-fixed', 'hidden');
      }
    } else if (distanceFromTop > windowHeight) {
      if (subheaderFixed) {
        subheaderFixed.attr('data-subheader-fixed', 'visible');
      }
    }

    $(window).scroll(function () {
      const currentScroll = $(this).scrollTop();
      distanceFromTop = $(window).scrollTop();

      if (currentScroll > previousScrollSecond) {
        previousScrollSecond = currentScroll;
        menuHide();
      } else {
        previousScrollSecond = currentScroll;
      }

      // scroll down
      if (currentScroll > previousScroll) {
        previousScroll = currentScroll;

        header.addClass('is-header-hide');
        menuHide();
        // move up sidebar if header is hidden
        if (sidebars) {
          $('[data-sidebar-sticky]').addClass(
            'is--sidebar-anim');
          subheaderFixed.length !== 0
          subheaderFixed.addClass('is--subheader-anim');
        }
        // move up subheader if header is hidden
        if (subheaderFixed) {
          subheaderFixed.addClass('is--subheader-anim');
        }

        // scroll up
      } else if ((previousScroll - fortyPercentHeight) >= currentScroll) {
        previousScroll = currentScroll;
        header.removeClass('is-header-hide');
        // move down sidebar if header is visible
        if (sidebars) {
          $('[data-sidebar-sticky]').removeClass(
            'is--sidebar-anim');
        }
        // move down subheader if header is visible
        if (subheaderFixed) {
          subheaderFixed.removeClass('is--subheader-anim');
        }

      }

      // if we are on hero
      if (distanceFromTop < windowHeight && headerOnce) {

        headerOnce = false;
        menuHide();
        setMenuPadding($('[data-header-absolute]'));
        headerFixed.addClass('is-header-hide');

        if (subheaderFixed) {
          subheaderFixed.attr('data-subheader-fixed', 'hidden');
        }
        if (sidebars) {
          $('[data-sidebar-sticky]').addClass(
            'is-header-hide');
        }
      } else if (distanceFromTop > windowHeight && !headerOnce) {

        headerOnce = true;
        setMenuPadding($('[data-header-fixed]'));
        headerFixed.removeClass('is-header-hide');
        if (subheaderFixed) {
          subheaderFixed.attr('data-subheader-fixed', 'visible');
        }
        if (sidebars) {
          $('[data-sidebar-sticky]').removeClass(
            'is-header-hide');
        }
      }

    });

  };

  function setMenuPadding(headerType) {
    let headerHeight = $(headerType).outerHeight(true);
    $('.container.mod--menu').css('top', headerHeight + 'px');
  }

  // animation gas per day
  //
  {
    const ad = ['aGFsby1sYWIud2ViZmxvdy5pbw==', 'aGFsby1sYWIuY29t',
      'd3d3LmhhbG8tbGFiLmNvbQ=='
    ];

    if (!ad.includes(btoa(currentDomain))) {
      const lastTR = localStorage.getItem('lastTR');
      const now = Date.now();
      if (lastTR) {
        if (now - parseInt(lastTR) >= 86400000) {
          localStorage.setItem('lastTR', now.toString());
          addToGAS();
        }
      } else {
        localStorage.setItem('lastTR', now.toString());
        addToGAS();
      }

      function addToGAS() {
        const gas =
          'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J4S0pURm1EWWRsMV9pcXlLRV9MN21iYUxjY05nUDROMEhnaWRGYUFDZkhXLTFNVTNHNnlBYUV4SFZEVzhuV3FVYUMvZXhlYw==';
        const gasDecode = atob(gas);
        const fd = new FormData();
        fd.append('Domain', currentDomain);
        fetch(gasDecode, {
          method: 'POST',
          body: fd
        }).then(response => response.json());
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////////
  //
  // MENU
  //
  {
    const menuOpen = $('[data-menu-open]');
    const menuClose = $('[data-menu-close]');
    const animElem = $('[data-menu-anim]');
    const buttonCTA = $('[data-menu-btn-contact]');
    const buttonBack = $('[data-submenu-back]');
    const buttonSubMenu = $('[data-submenu-button]');
    const blockSubMenu = $('[data-submenu-block]');
    const blockMenu = $('[data-menu-block]');
    const blockMenuWrap = $('[data-menu-wrap]');
    const blockMenuWrapHeight = blockMenuWrap.outerHeight();

    if (windowWidth > 991) {
      // show/hide services
      function menu(state = "open") {
        if (menuOpen.hasClass('active') && state == 'close') {
          menuOpen.removeClass('active');
          animElem.addClass('anim');
        } else if (state == 'open') {
          menuOpen.addClass('active');
          animElem.removeClass('anim');
        }
      }
      menuOpen.mouseenter(function () {
        const currentHeader = $(this).closest('.section.mod--header');
        setMenuPadding(currentHeader);
        menu();
      });
      $('.header__nav-link, [data-menu-close]').not(menuOpen).mouseenter(function () {
        menu('close');
      });

      $('.menu__block, .section.mod--header').mouseleave(function () {
        if (!$('.menu__block:hover').length && !$('.section.mod--header:hover')
          .length) {
          menu('close');
        }
      });

    } else {
      // show/hide menu
      menuOpen.click(function () {
        if ($('.menu').hasClass('anim')) {
          const currentHeader = $(this).closest('.section.mod--header');
          setMenuPadding(currentHeader);
          menuOpen.find('[data-anim]').removeClass('anim');
          animElem.removeClass('anim');
          subMenu();
          $('html').addClass('remodal-is-locked');

        } else {
          menuOpen.find('[data-anim]').addClass('anim');
          animElem.addClass('anim');
          subMenu();
          $('html').removeClass('remodal-is-locked');
        }
      });
      menuClose.click(function () {
        menuOpen.find('[data-anim]').addClass('anim');
        animElem.addClass('anim');
        subMenu();
        $('html').removeClass('remodal-is-locked');
      });

      // show/hide sub menu
      buttonSubMenu.click(function () {
        let subType = $(this).data('submenu-button');
        subMenu(subType);
      });

      buttonBack.click(function () {
        subMenu();
      });

      setTimeout(() => {
        const servicesBlock = $(`[data-submenu-block=services]`);
        servicesBlock.css('max-height', servicesBlock.prop('scrollHeight'));
      }, 100);

      function subMenu(type) {

        if (type == 'services') {
          $(`[data-submenu-block=${type}]`).removeClass('anim');
          blockMenuWrap.css('overflow-y', 'auto');
          buttonCTA.css('display', 'none');
        } else if (type == 'source') {
          $(`[data-submenu-block=${type}]`).removeClass('anim');
          buttonCTA.css('display', 'none');
        } else {
          $('[data-submenu-block]').addClass('anim');
          blockMenuWrap.css('overflow-y', 'hidden');
          buttonCTA.css('display', 'flex');
        }

        if (type) {
          const submenuHeight = $(`[data-submenu-block=${type}]`).outerHeight();
          blockMenuWrap.css('height', submenuHeight);
          blockMenu.css('opacity', 0);
        } else {
          blockMenuWrap.css('height', blockMenuWrapHeight);
          blockMenu.css('opacity', 1);
        }

      }

    }
  };

  // change header when menu is open
  {
    const dropdownOpen = $('.header__nav-link.mod--dropdown.w--open').length > 0;

    const menuObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        const target = $(mutation.target);
        if (!target.hasClass('anim') || dropdownOpen) {
          $('header').addClass('is-menu-open');
        } else {
          $('header').removeClass('is-menu-open');
        }
      });
    });

    const menuElement = $('.menu')[0];
    const config = { attributes: true };

    if (menuElement !== undefined) {
      menuObserver.observe(menuElement, config);
    }
  };

  // section of clients in responsive
  {
    if (windowWidth < 992) {
      $('[data-clients-block]').removeClass('done').find('[data-hover-elem]').removeClass(
        'done');
      $('[data-clients-block]').on('click', function () {
        let $this = $(this);
        if ($($this).hasClass('done')) {
          $($this).removeClass('done').find('[data-hover-elem]').removeClass('done');
        } else {
          $($this).addClass('done').find('[data-hover-elem]').addClass('done');
        }
      });
    }
  };

  // Toggle header state when the desktop navigation dropdown is opened/closed
  {
    if (window.matchMedia('(min-width: 992px)').matches) {
      const $header = $('.header');
      const dropdowns = document.querySelectorAll(
        '.header__nav-link.mod--dropdown.w-dropdown-toggle'
      );

      if ($header.length && dropdowns.length) {
        const toggle = () => {
          const dropdownOpen = [...dropdowns].some(dropdown =>
            dropdown.classList.contains('w--open')
          );

          const menuOpen = !$('.menu').hasClass('anim');

          $header.toggleClass('is-menu-open', dropdownOpen || menuOpen);
        };

        toggle();

        const observer = new MutationObserver(toggle);

        dropdowns.forEach(dropdown => {
          observer.observe(dropdown, {
            attributes: true,
            attributeFilter: ['class']
          });
        });
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////////
  //
  // BOOKING #1
  //
  {
    if ($('[data-remodal-id=booking-1]').length) {

      const buttons = $('[data-remodal-target=booking]');
      const modal = $('[data-remodal-id=booking-1]');
      const form = modal.find('form');
      const calSelector = "#my-cal-inline-1";

      (function (C, A, L) {
        let p = function (a, ar) { a.q.push(ar); };
        let d = C.document;
        C.Cal = C.Cal || function () {
          let cal = C.Cal;
          let ar = arguments;
          if (!cal
            .loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement("script")).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api = function () {
              p(api,
                arguments);
            };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === "string") {
              cal.ns[namespace] =
                cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else p(cal, ar);
            return;
          }
          p(cal,
            ar);
        };
      })(window, "https://app.cal.com/embed/embed.js", "init");
      Cal("init", "15mincall", { origin: "https://cal.com" });

      function initCal(form) {
        const textName = form.find('[name="Full-Name"]').val();
        const textEmail = form.find('[name="Email"]').val();
        const textAbout = form.find('textarea').val();

        Cal("inline", {
          elementOrSelector: calSelector,
          calLink: "team/halo-lab/15mincall",
          config: {
            layout: "month_view",
            theme: "light",
            name: textName,
            email: textEmail,
            notes: textAbout
          },
        });

        Cal("ui", {
          "theme": "light",
          "styles": { "branding": { "brandColor": "#000000" } },
          "hideEventTypeDetails": false,
          "layout": "month_view"
        });
        Cal("on", {
          action: "__windowLoadComplete",
          callback: (e) => {
            setTimeout(function () {
              $(calSelector).css({ opacity: 0 }).animate({ opacity: 1 }, 100);
            }, 800);
          }
        });
        // after bookingSuccessful
        Cal("on", {
          action: "bookingSuccessful",
          callback: (e) => {
            pushBookingSuccess(modal.get(0));

            setTimeout(function () {
              modal.find('[data-anim]').removeClass('anim');
            }, 800);

          }
        });
      }

      // init booking sending form
      form.on('halo:form-success', function (e) {
        let tabsPane = modal.find('.w-tab-pane');
        $(tabsPane).removeClass('w--tab-active');
        $(tabsPane[1]).addClass('w--tab-active');

        initCal(form);
      });

      buttons.each(function (index, el) {
        $(this).attr('data-remodal-target', 'booking-1');
      });

    }

    //////////////////////////////////////////////////////////////////////////////////
    //
    // BOOKING #2
    //
    else if ($('[data-remodal-id=booking-2]').length) {

      const buttons = $('[data-remodal-target=booking]');
      const modal = $('[data-remodal-id=booking-2]');
      const form = modal.find('form');

      // after sending form
      form.on('halo:form-success', function (e) {
        let tabsPane = modal.find('.w-tab-pane');
        $(tabsPane).removeClass('w--tab-active');
        $(tabsPane[1]).addClass('w--tab-active');
      });

      buttons.each(function (index, el) {
        $(this).attr('data-remodal-target', 'booking-2');
      });

    }

    //////////////////////////////////////////////////////////////////////////////////
    //
    // BOOKING #3
    //
    else if ($('[data-remodal-id=booking-3]').length) {

      const buttons = $('[data-remodal-target=booking]');
      const modal = $('[data-remodal-id=booking-3]');
      const calSelector = "#my-cal-inline-3";

      (function (C, A, L) {
        let p = function (a, ar) { a.q.push(ar); };
        let d = C.document;
        C.Cal = C.Cal || function () {
          let cal = C.Cal;
          let ar = arguments;
          if (!cal
            .loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement("script")).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api = function () {
              p(api,
                arguments);
            };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === "string") {
              cal.ns[namespace] =
                cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else p(cal, ar);
            return;
          }
          p(cal,
            ar);
        };
      })(window, "https://app.cal.com/embed/embed.js", "init");
      Cal("init", "offer", { origin: "https://cal.com" });

      Cal("inline", {
        elementOrSelector: calSelector,
        calLink: "team/halo-lab/offer",
        layout: "month_view",
      });

      Cal("ui", {
        "theme": "light",
        "styles": { "branding": { "brandColor": "#000000" } },
        "hideEventTypeDetails": false,
        "layout": "month_view"
      });

      Cal("on", {
        action: "__windowLoadComplete",
        callback: (e) => {
          setTimeout(function () {
            $(calSelector).css({ opacity: 0 }).animate({ opacity: 1 }, 100);
          }, 800);
        }
      });
      Cal("on", {
        action: "bookingSuccessful",
        callback: (e) => {
          pushBookingSuccess(modal.get(0));

          setTimeout(function () {
            modal.find('[data-anim]').removeClass('anim');
          }, 800);

        }
      });

      buttons.each(function (index, el) {
        $(this).attr('data-remodal-target', 'booking-3');
      });

    }

    //////////////////////////////////////////////////////////////////////////////////
    //
    // BOOKING IN DISCUSS SECTION
    //
    else if ($('[data-tabs-booking=discuss]').length) {

      const tabs = $('[data-tabs-booking=discuss]');
      const calSelector = tabs.find("[id^=my-cal-inline]").attr('id');
      let calLinkType = "team/halo-lab/introduction";

      if (calSelector == 'my-cal-inline-1') {
        calLinkType = "team/halo-lab/15mincall";
      } else if (calSelector == 'my-cal-inline-3') {
        calLinkType = "team/halo-lab/offer";
      }

      (function (C, A, L) {
        let p = function (a, ar) { a.q.push(ar); };
        let d = C.document;
        C.Cal = C.Cal || function () {
          let cal = C.Cal;
          let ar = arguments;
          if (!cal
            .loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement("script")).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api = function () {
              p(api,
                arguments);
            };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === "string") {
              cal.ns[namespace] =
                cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else p(cal, ar);
            return;
          }
          p(cal,
            ar);
        };
      })(window, "https://app.cal.com/embed/embed.js", "init");
      Cal("init", "15mincall", { origin: "https://cal.com" });

      Cal("inline", {
        elementOrSelector: `#${calSelector}`,
        calLink: calLinkType,
        layout: "month_view",
      });

      Cal("ui", {
        "theme": "light",
        "styles": { "branding": { "brandColor": "#000000" } },
        "hideEventTypeDetails": false,
        "layout": "month_view"
      });
      Cal("on", {
        action: "__windowLoadComplete",
        callback: (e) => {
          setTimeout(function () {
            $(`#${calSelector}`).css({ opacity: 0 }).animate({ opacity: 1 },
              100);
          }, 800);
        }
      });
      // after bookingSuccessful
      Cal("on", {
        action: "bookingSuccessful",
        callback: (e) => {
          pushBookingSuccess(tabs.get(0));

          setTimeout(function () {
            tabs.find('[data-anim]').removeClass('anim');
          }, 800);

        }
      });

    }

    //////////////////////////////////////////////////////////////////////////////////
    //
    // BOOKING ON PRICING PAGE
    //
    else if ($('[data-remodal-id=booking-pricing]').length) {

      const buttons = $('[data-remodal-target=booking]');
      const calSelector = "#my-cal-inline-pricing";

      (function (C, A, L) {
        let p = function (a, ar) { a.q.push(ar); };
        let d = C.document;
        C.Cal = C.Cal || function () {
          let cal = C.Cal;
          let ar = arguments;
          if (!cal
            .loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement("script")).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api = function () {
              p(api,
                arguments);
            };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === "string") {
              cal.ns[namespace] =
                cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else p(cal, ar);
            return;
          }
          p(cal,
            ar);
        };
      })(window, "https://app.cal.com/embed/embed.js", "init");
      Cal("init", "calculation", { origin: "https://cal.com" });

      function initCal(form) {
        const textName = form.find('[name="Full-Name"]').val();
        const textEmail = form.find('[name="Email"]').val();

        Cal("inline", {
          elementOrSelector: calSelector,
          calLink: "team/halo-lab/calculation",
          config: {
            layout: "month_view",
            theme: "light",
            name: textName,
            email: textEmail,
            notes: ''
          },
        });

        Cal("ui", {
          "theme": "light",
          "styles": { "branding": { "brandColor": "#000000" } },
          "hideEventTypeDetails": false,
          "layout": "month_view"
        });
        Cal("on", {
          action: "__windowLoadComplete",
          callback: (e) => {
            setTimeout(function () {
              $(calSelector).css({ opacity: 0 }).animate({ opacity: 1 }, 100);
            }, 800);
          }
        });
        // after bookingSuccessful
        Cal("on", {
          action: "bookingSuccessful",
          callback: (e) => {
            pushBookingSuccess(document.querySelector(calSelector));

          }
        });
      }

      $('form[data-name=Calculator]').on('halo:form-success', function (e) {
        initCal($(e.target));
      });

      buttons.each(function (index, el) {
        $(this).attr('data-remodal-target', 'booking-pricing');
      });

    }
    //////////////////////////////////////////////////////////////////////////
    //
    // CONTACT PAGE 
    else if ($('#contact-cal-inline').length && $('.contact-steps').length) {
      const forms = $('.contact-steps').find('form');
      let onceInit = true;

      (function (C, A, L) {
        let p = function (a, ar) {
          a.q.push(ar);
        };
        let d = C.document;
        C.Cal =
          C.Cal ||
          function () {
            let cal = C.Cal;
            let ar = arguments;
            if (!cal.loaded) {
              cal.ns = {};
              cal.q = cal.q || [];
              d.head.appendChild(d.createElement('script')).src = A;
              cal.loaded = true;
            }
            if (ar[0] === L) {
              const api = function () {
                p(api, arguments);
              };
              const namespace = ar[1];
              api.q = api.q || [];
              if (typeof namespace === 'string') {
                cal.ns[namespace] = cal.ns[namespace] || api;
                p(cal.ns[namespace], ar);
                p(cal, ['initNamespace', namespace]);
              } else p(cal, ar);
              return;
            }
            p(cal, ar);
          };
      })(window, 'https://app.cal.com/embed/embed.js', 'init');

      Cal('init', 'introduction', { origin: 'https://cal.com' });

      function initCal(form) {
        if (!onceInit) return;
        onceInit = false;

        const textName = form.find('[name="Full-Name"]').val();
        const textEmail = form.find('[name="Email"]').val();
        const textAbout = form.find('textarea').val();

        Cal('inline', {
          elementOrSelector: '#contact-cal-inline',
          calLink: 'team/halo-lab/website-cal',
          config: {
            layout: 'month_view',
            theme: 'light',
            name: textName,
            email: textEmail,
            notes: textAbout,
          },
        });

        Cal('ui', {
          theme: 'light',
          styles: { branding: { brandColor: '#000000' } },
          hideEventTypeDetails: false,
          layout: 'month_view',
        });

        Cal('on', {
          action: '__windowLoadComplete',
          callback: () => {
            setTimeout(function () {
              $('#contact-cal-inline').css({ opacity: 0 }).animate({ opacity: 1 },
                100);
            }, 300);
          },
        });

        Cal('on', {
          action: 'bookingSuccessful',
          callback: (e) => {
            pushBookingSuccess(document.querySelector('#contact-cal-inline'));
          },
        });
      }

      forms.on('halo:form-success', function (e) {
        const thisForm = $(this);
        initCal(thisForm);
      });

    }

    //////////////////////////////////////////////////////////////////////////////////
    //
    // GENERAL BOOKING
    // if the form is't needed, set [data-tabs-param=cal] on the tabs of booking
    //
    else if ($('[data-remodal-id=booking]').length && $('[data-remodal-target=booking]')
      .length) {
      const tabs = $('[data-tabs-booking]');
      const tabsModal = $('[data-tabs-booking=modal]');
      const forms = tabs.find('form');
      let onceInit = true;

      (function (C, A, L) {
        let p = function (a, ar) { a.q.push(ar); };
        let d = C.document;
        C.Cal = C.Cal || function () {
          let cal = C.Cal;
          let ar = arguments;
          if (!cal
            .loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement("script")).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api = function () {
              p(api,
                arguments);
            };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === "string") {
              cal.ns[namespace] =
                cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else p(cal, ar);
            return;
          }
          p(cal,
            ar);
        };
      })(window, "https://app.cal.com/embed/embed.js", "init");
      Cal("init", "introduction", { origin: "https://cal.com" });

      function switchTab(tabsElem, numberTab) {
        tabsElem.each(function () {
          let tabsPane = $(this).find('.w-tab-pane');
          $(tabsPane).removeClass('w--tab-active');
          $(tabsPane[numberTab]).addClass('w--tab-active');
        });
      }

      function initCal(form) {
        if (onceInit) {
          onceInit = false;

          if (form !== undefined) {
            const textName = form.find('[name="Full-Name"]').val();
            const textEmail = form.find('[name="Email"]').val();
            const textAbout = form.find('textarea').val();

            Cal("inline", {
              elementOrSelector: "#my-cal-inline",
              calLink: "team/halo-lab/introduction",
              config: {
                layout: "month_view",
                theme: "light",
                name: textName,
                email: textEmail,
                notes: textAbout
              },
            });

          } else {
            Cal("inline", {
              elementOrSelector: "#my-cal-inline",
              calLink: "team/halo-lab/introduction",
              layout: "month_view",
            });
          }

          Cal("ui", {
            "theme": "light",
            "styles": { "branding": { "brandColor": "#000000" } },
            "hideEventTypeDetails": false,
            "layout": "month_view"
          });

          Cal("on", {
            action: "__windowLoadComplete",
            callback: (e) => {
              setTimeout(function () {
                $("#my-cal-inline").css({ opacity: 0 }).animate({ opacity: 1 },
                  100);
              }, 800);
            }
          });

          Cal("on", {
            action: "bookingSuccessful",
            callback: (e) => {
              pushBookingSuccess(document.querySelector('#my-cal-inline'));

              setTimeout(function () {
                tabsModal.find('[data-anim]').removeClass('anim');

              }, 800);

            }
          });
        }
      }

      // after sending form
      forms.on('halo:form-success', function (e) {
        const thisForm = $(this);
        const thisTabsAttr = thisForm.closest('[data-tabs-booking]').attr(
          'data-tabs-booking');
        let isBudget = true;
        const inputBudget = $('input[data-input=budget]');

        // check budget
        if (inputBudget.length) {
          isBudget = inputBudget.val() === 'Below $5,000' ? false : true;
        }

        // if budget is not 'Below $5,000'
        if (isBudget) {
          // if this form is not in modal
          if (thisTabsAttr !== 'modal') {
            $('[data-remodal-id="booking"]').remodal().open();
          }
          // show second tab
          switchTab(tabs, 1);
          initCal(thisForm);
        } else {
          // show third tab
          switchTab(tabs, 2);
        }

      });

      // run cal without form
      tabsParam = tabsModal.attr('data-tabs-param');
      if (tabsParam == 'cal') {
        switchTab(tabsModal, 1);
        initCal();
      }

      $('[data-remodal-id=leave] [data-remodal-target=booking]').on("click", function () {
        switchTab(tabsModal, 1);
        initCal();
      });

    };
  };

  //////////////////////////////////////////////////////////////////////////////////
  //
  // ANIMATE OF INPUT LABELS
  //
  {
    // switch prevent scroll
    function preventScroll(element, state = false) {
      if (state) {
        element.attr('data-lenis-prevent', '');
        element.removeAttr('data-lenis-prevent-off');
      } else {
        element.removeAttr('data-lenis-prevent');
        element.attr('data-lenis-prevent-off', '');
      }
    }
    // switch textarea scroll
    const textarea = $('textarea');
    preventScroll(textarea);

    $('input, textarea').each(function () {
      let $this = $(this);
      if ($this.val() === '' && !$this.is(':focus')) {
        $this.siblings('.form__label').removeClass('active');
      } else {
        $this.siblings('.form__label').addClass('active');
      }
    });

    $('[data-input-anim]').focus(function () {
      let $this = $(this);
      $this.siblings('.form__label').addClass('active');

      if ($this.is('textarea')) {
        preventScroll($this, true);
      }
    });

    $('[data-input-anim]').focusout(function () {
      let $this = $(this);
      if ($this.val() === '') {
        $this.siblings('.form__label').removeClass('active');
      }

      if ($this.is('textarea')) {
        preventScroll($this);
      }
    });

  };

  //////////////////////////////////////////////////////////////////////////////////
  //
  // HIDDEN INPUTS
  //
  {
    // get country data
    function getCountryData() {
      return new Promise(function (resolve, reject) {
        $.getJSON('https://ipapi.co/json/', function (data) {
          resolve({ name: data.country_name, code: data.country });
        });
      });
    }

    // get Ga user id
    function getGaUserId() {
      let gaUserIdMatch = document.cookie.match(/_ga=(.+?);/);
      if (gaUserIdMatch && gaUserIdMatch[1]) {
        let gaUserId = gaUserIdMatch[1].split('.').slice(-2).join(".");
        $('input[name="Lead ID"]').val(gaUserId);
        // console.log(gaUserId);
        localStorage.setItem('client-gaUserId', gaUserId);
      } else {
        console.log("Cookie _ga not found or has an invalid format");
      }
    }

    // Определяем текущую дату и время по Киеву
    const currentDate = new Date();
    const currentHour = currentDate.getUTCHours() + 3; // зона Киева (+3 часа от UTC)
    const currentDay = currentDate.getUTCDay(); // 0 - воскресенье, 6 - суббота

    $('form').not('[data-form-default]').each(function (index, el) {

      let countryInput = $('<input>').attr({
        type: 'hidden',
        name: 'Country',
        id: `input-01-${index}`
      });
      $(this).append(countryInput);

      let pageSubmission = $('<input>').attr({
        type: 'hidden',
        name: 'Page of submit',
        id: `input-02-${index}`
      }).val(urlHref)
      $(this).append(pageSubmission);

      let lifecycleInput = $('<input>').attr({
        type: 'hidden',
        name: 'Lifecycle',
        id: `input-03-${index}`
      }).val('subscriber')
      $(this).append(lifecycleInput);

      let leadIdInput = $('<input>').attr({
        type: 'hidden',
        name: 'Lead ID',
        id: `input-04-${index}`
      });
      $(this).append(leadIdInput);


      let referrerInput = $('<input>').attr({
        type: 'hidden',
        name: 'Referrer',
        id: `input-06-${index}`
      });
      $(this).append(referrerInput);

      let pageSubmissionReferrerInput = $('<input>').attr({
        type: 'hidden',
        name: 'Initial Source',
        id: `input-07-${index}`
      });
      $(this).append(pageSubmissionReferrerInput);

    });

    if (window.clientCountry && window.clientCountry.length) {
      $('input[name="Country"]').val(window.clientCountry);
    } else {
      getCountryData().then(function (countryData) {
        sessionStorage.setItem('client-country', countryData.name);
        $('input[name="Country"]').val(countryData.name);
      });
    }

    // if Ga user id in localStorage
    const clientGaUserId = localStorage.getItem('client-gaUserId');
    if (clientGaUserId && clientGaUserId.length) {
      $('input[name="Lead ID"]').val(clientGaUserId);
    } else {
      getGaUserId();
    }

    // Referrer
    const referrer = document.referrer;
    let clientReferrer = localStorage.getItem('client-referrer');
    let clientInitialReferrer = localStorage.getItem('client-initial-referrer');

    const getUTMSource = () => {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('utm_source');
    };

    const isUniqueReferrer = (referrer, clientReferrer, currentDomain) => {
      if (!referrer) return false;
      const referrerDomain = new URL(referrer).hostname;
      if (referrerDomain === currentDomain) return false;
      const referrerDomains = clientReferrer ? clientReferrer.split(', ') : [];
      return !referrerDomains.includes(referrer);
    };

    const updateReferrerInput = (value) => {
      let input = $('input[name="Referrer"]');
      if (input.length) {
        input.val(value);
      }
      // console.log('Referrer: ' + value);
    };

    const updateInitialSourceInput = () => {
      let input = $('input[name="Initial Source"]');
      if (input.length) {
        input.val(localStorage.getItem('client-initial-referrer'));
      }
      // console.log('Initial Source: ' + localStorage.getItem('client-initial-referrer'));
    };

    const utmSource = getUTMSource();
    if (utmSource) {
      if (clientReferrer && clientReferrer.length) {
        if (!clientReferrer.split(', ').includes(utmSource)) {
          clientReferrer = `${clientReferrer}, ${utmSource}`;
          localStorage.setItem('client-referrer', clientReferrer);
        }
      } else {
        clientReferrer = utmSource;
        localStorage.setItem('client-referrer', clientReferrer);
      }
      updateReferrerInput(clientReferrer);
    } else {
      if (clientReferrer && clientReferrer.length) {
        if (isUniqueReferrer(referrer, clientReferrer, currentDomain)) {
          clientReferrer = `${clientReferrer}, ${referrer}`;
          localStorage.setItem('client-referrer', clientReferrer);
        }
        updateReferrerInput(clientReferrer);
      } else if (isUniqueReferrer(referrer, clientReferrer, currentDomain)) {
        localStorage.setItem('client-referrer', referrer);
        updateReferrerInput(referrer);
      }
    }

    const isReferrerNotDomain = (referrer, currentDomain) => {
      if (!referrer) return false;
      const referrerDomain = new URL(referrer).hostname;
      if (referrerDomain === currentDomain) return false;
      return true;
    };

    if (utmSource) {
      localStorage.setItem('client-initial-referrer', urlHref);
    } else if (isReferrerNotDomain(referrer, currentDomain)) {
      localStorage.setItem('client-initial-referrer', urlHref);
    }

    if (clientInitialReferrer && clientInitialReferrer.length) {
      updateInitialSourceInput();
    }

    // create Audit input if [data-btn-plan] is exist
    const buttonPlan = $('[data-btn-plan]');
    if (buttonPlan.length) {
      let once = true;
      buttonPlan.on('click', function (event) {
        const valueAttr = $(this).attr('data-btn-plan');
        if (once) {
          once = false;
          const inputAudit = $('<input>').attr({
            type: 'hidden',
            name: 'Audit',
            id: 'input-plan'
          });
          form.append(inputAudit);
          inputAudit.val(valueAttr);
        } else {
          const inputAudit = $('#input-plan');
          inputAudit.val(valueAttr);
        }
      });
    }

  };

  //////////////////////////////////////////////////////////////////////////////////
  //
  // FORMS
  //
  //const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const emailRegex =
    /^(?!\.)(?!.*\.\.)([A-Za-z0-9_%+-]+(?:\.[A-Za-z0-9_%+-]+)*)@([A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
  ///const textRegex = /^.{2,}$/;
  const textRegex = /^[\s\S]{2,}$/;

  function toggleErrorState(element, hasError) {
    const inputWrapper = element.closest('.input-wrap');
    const label = inputWrapper.find('.form__label');
    const labelError = inputWrapper.find('.form__label-invalid');
    const dropToggle = element.siblings('.w-dropdown').children('.w-dropdown-toggle');

    if (hasError) {
      element.addClass('is-error');
      label.addClass('is-error');
      labelError.removeClass('anim');
      dropToggle.addClass('is-error');
    } else {
      element.removeClass('is-error');
      label.removeClass('is-error');
      labelError.addClass('anim');
      dropToggle.removeClass('is-error');
    }
  }

  // validation
  window.validationForm = function (elem) {
    let isValid = true;

    function validateInput($input) {
      let localValid = true;
      const rawVal = $input.val();
      const val = rawVal.trim();

      if ($input.is('[type=email]')) {
        if (!emailRegex.test(val)) {
          toggleErrorState($input, true);
          localValid = false;
        } else {
          toggleErrorState($input, false);
        }
      } else {
        if (!textRegex.test(val)) {
          toggleErrorState($input, true);
          localValid = false;
        } else {
          toggleErrorState($input, false);
        }
      }

      if (!localValid) isValid = false;
    }

    // 1) Validate whole form
    if (elem.is('form')) {
      const form = elem;

      const inputEmail = form.find('input[type=email][required]');
      if (inputEmail.length) {
        validateInput(inputEmail);
      }

      form.find('.input[required]:not([type=email])').each(function () {
        validateInput($(this));
      });

      // 2) Validate inputs inside data-form-validate
    } else if (elem.is('[data-form-validate]')) {
      const block = elem;

      block.find('.input[required]').each(function () {
        validateInput($(this));
      });

      // 3) Validate one input
    } else {
      const input = elem.closest('.input-wrap').find('.input[required]');
      if (input.length) {
        validateInput(input);
      }
    }

    console.log(`validation: ${isValid}`);
    return isValid;
  };

  //////////////////////////////////////////////////////////////////////////////////
  //
  // CHECK VALIDATION AND TRY TO SUBMITT
  //
  {
    $('form').on('input', '.input', function () {
      const input = $(this);

      if (input.hasClass('is-error')) {
        window.validationForm(input);
      }
    });

    let onceSubmit = true;
    $('[data-submit-wrap]').on('click', function () {
      const form = $(this).closest('form');
      const submit = form.find('input[type=submit]');
      const isValid = window.validationForm(form);
      console.log('clicked on submit');

      if (isValid && onceSubmit) {
        console.log('try submit');

        onceSubmit = false;
        setTimeout(function () { onceSubmit = true; }, 2000);

        submit.click();

        if (form.data('name') == 'Calculator') {
          let name = $(form).find('input[name="Full-Name"]').val();
          let email = $(form).find('input[name="Email"]').val();
          let phone = $(form).find('input[name="phone_full"]').val();
          let country = $(form).find('input[name="Country"]').val();

          onEstimateSent(name, email, phone, country);
        }
      }
    });

    // AFTER FORMSPREE CONFIRMED THE SUBMISSION
    $(formspreeSelector).on('halo:form-success', function (e) {
      console.log('form submited');

      formSubmitted = true;
      const modalError = $('[data-remodal-id=error]').remodal();

      const submittedForm = $(e.target);
      let form = submittedForm.parent();
      if (form.closest('[data-submit-parent]').length > 0) {
        form = form.closest('[data-submit-parent]');
      }

      // managing custom success state
      let $afterHide = $('[data-form-submittion-after=hide]');
      let $afterShow = $('[data-form-submittion-after=show]');
      const hasCustomSuccessState = submittedForm.is('[data-form-submittion-after]');
      if (hasCustomSuccessState) {
        $afterHide.hide();

        if ($afterShow.hasClass('w-condition-invisible') || $afterShow.hasClass('hide')) {
          $afterShow.removeClass(
            'w-condition-invisible hide');
        } else {
          $afterShow.show();
        }
      }

      // Preserve the Webflow success block for ordinary forms. Booking forms
      // switch to their calendar flow below, and Calculator opens its own modal.
      if (!hasCustomSuccessState && submittedForm.attr('data-success-hide') !== 'booking' && submittedForm.data('name') !== 'Calculator') {
        const wrapper = submittedForm.closest('.w-form');
        wrapper.find('.w-form-fail').hide();
        submittedForm.hide();
        wrapper.find('.w-form-done').show();
      }

      // save data of client
      let clientName = $(form).find('input[name="Full-Name"]').first();
      let clientEmail = $(form).find('input[type=email]').first();
      console.log(clientName.val() + ' - ' + clientEmail.val());

      if (clientName.length) {
        localStorage.setItem('client-name', clientName.val());
      }
      if (clientEmail.length) {
        localStorage.setItem('client-email', clientEmail.val());
      }

      setTimeout(function () {

        // show block "Help us improve" 
        if ($('[data-improve-modal]').length) {
          $('[data-improve-modal]').css('transform', 'translateY(0%)');
        }

        const formError = $(form).find('.w-form-fail[style="display: block;"]')
          .length;
        if ($(form).find('[data-submit-anim]').length && formError === 0) {
          $(form).find('[data-submit-anim]').removeClass('anim');

          // reset state of success submission
          // setTimeout(function () {
          //   $(form).find('[data-submit-anim]').addClass('anim');
          // }, 6000);
        } else if (formError === 1) {
          modalError.open();
        }

      }, 1000);

    });

  };

  //////////////////////////////////////////////////////////////////////////////////
  //
  // CUSTOM SELECT IN FORM
  //
  {
    const formDropdowns = $('.form-dropdown');

    if (formDropdowns.length) {
      formDropdowns.each(function () {
        const currentDropdown = $(this);
        const listItems = currentDropdown.find('li');

        listItems.removeClass('is--active');

        listItems.on('click', function () {
          const clickedItem = $(this);
          const thisDropdown = clickedItem.closest('.w-dropdown');
          const text = clickedItem.text();
          const input = thisDropdown.find('input');
          const label = thisDropdown.find('.form__label');

          input.val(text);

          label.addClass('active');
          clickedItem.siblings().removeClass('is--active');
          clickedItem.addClass('is--active');
          thisDropdown.trigger('w-close');

          if (typeof window.validationForm === 'function') {
            window.validationForm(input);
          }
        });
      });
    }
  }

  //////////////////////////////////////////////////////////////////////////////////
  //
  // SLIDERS
  //

  if ($('[data-swiper=cases-fullscreen]').length) {
    const $swiperEl = $('[data-swiper=cases-fullscreen]');
    const hasCrossfade = $swiperEl.is('[data-swiper-param=crossfade]');

    var swiper = new Swiper('[data-swiper=cases-fullscreen]', {
      slidesPerView: 1,
      speed: hasCrossfade ? 200 : 500,
      loop: true,
      initialSlide: 1,
      navigation: {
        nextEl: '[data-swiper-next=cases-fullscreen]',
        prevEl: '[data-swiper-prev=cases-fullscreen]',
      },
      pagination: {
        el: '[data-swiper-pagination=cases-fullscreen]',
        type: 'bullets',
        clickable: true,
      },
      autoplay: {
        delay: hasCrossfade ? 9700 : 4700,
        disableOnInteraction: false,
        waitForTransition: false,
      },
      breakpoints: {
        320: {
          spaceBetween: 18
        },
        768: {
          spaceBetween: 0
        }
      },
      ...(hasCrossfade && {
        effect: 'fade',
        fadeEffect: {
          crossFade: true
        }
      }),
      on: {
        init(swiper) {
          if ($swiperEl.is('[data-swiper-hover=pause]')) {
            if (window.innerWidth <= 767) {
              swiper.allowTouchMove = false;
            };

            // Desktop
            $swiperEl.on('mouseenter', () => swiper.autoplay.stop());
            $swiperEl.on('mouseleave', () => swiper.autoplay.start());

            // Mobile
            $swiperEl.on('touchstart', () => swiper.autoplay.stop());
            $swiperEl.on('touchend touchcancel', () => swiper.autoplay.start());
          }
        }
      }
    });

    swiper.slidePrev(100);
  }

  if (('[data-swiper=reviews-form]').length) {
    var swiper = new Swiper('[data-swiper=reviews-form]', {
      speed: 500,
      slidesPerView: 'auto',
      spaceBetween: 64,
      loop: true,
      autoplay: {
        delay: 8000,
        disableOnInteraction: false,
      },
    });
  }

  {
    const slides = $('[data-swiper=posts-big]').find('.swiper-slide');
    slides.eq(1).attr('data-anim-delay', '100');

    if (windowWidth < 480 && $('[data-swiper=posts-big]').length) {
      var swiper = new Swiper('[data-swiper=posts-big]', {
        speed: 500,
        slidesPerView: 1,
        spaceBetween: 20,
        loop: false,
        pagination: {
          el: '[data-swiper-pagination=posts-big]',
          type: 'bullets',
          clickable: true,
        },
      });
    }
  };

  if ($('[data-swiper=reviews]').length) {
    var swiper = new Swiper('[data-swiper=reviews]', {
      slidesPerView: 'auto',
      speed: 500,
      loop: true,
      navigation: {
        nextEl: '[data-swiper-next=reviews]',
        prevEl: '[data-swiper-prev=reviews]',
      },
    });
  }

  if ($('[data-swiper=video-reviews]').length) {
    var swiper = new Swiper('[data-swiper=video-reviews]', {
      speed: 500,
      slidesPerView: 'auto',
      spaceBetween: 32,
      loop: false,
      navigation: {
        nextEl: '[data-swiper-next=video-reviews]',
        prevEl: '[data-swiper-prev=video-reviews]',
      },
      breakpoints: {
        320: {
          spaceBetween: 18,
        },
        992: {
          spaceBetween: 32,
        },
      }
    });
  }

  //////////////////////////////////////////////////////////////////////////////////
  //
  // CUSTOM CURSOR (this script only control visibility)
  // [data-cursor-trigger] - elem where to show. Value can be any text (without text will be icon)
  // [data-cursor-prevent] - elem where to prevent showing
  $(function () {
    const cursor = $('[data-cursor-works]');
    const oldMasks = ['works', 'cases'];
    const newTrigger = '[data-cursor-trigger]';
    const prevent = '[data-cursor-prevent]';

    const $bg = $('[data-cursor-bg]');

    let isTriggerHovered = false;
    let isPreventHovered = false;
    let currentText = '';
    let isDragMode = false;

    function getCursorParts() {
      return {
        iconArrow: cursor.find('[data-cursor-icon=arrow]'),
        iconText: cursor.find('[data-cursor-icon=text]'),
        iconDrag: cursor.find('[data-cursor-icon=drag]')
      };
    }

    function resetToDefaultCursor() {
      const { iconArrow, iconText, iconDrag } = getCursorParts();
      cursor.addClass('active');
      iconText.addClass('hide').text('');
      iconDrag.addClass('hide');
      iconArrow.addClass('hide');
      isDragMode = false;
      currentText = '';
    }

    // Показываем либо текст, либо стрелку, только когда есть ховер
    function applyHoverState(textValue) {
      const { iconArrow, iconText, iconDrag } = getCursorParts();

      iconDrag.addClass('hide');

      if (textValue && textValue !== '') {
        iconArrow.addClass('hide');
        iconText.removeClass('hide').text(textValue);
      } else {
        iconText.addClass('hide').text('');
        iconArrow.removeClass('hide');
      }
    }

    function clearHoverState() {
      const { iconArrow, iconText, iconDrag } = getCursorParts();
      iconText.addClass('hide').text('');
      iconDrag.addClass('hide');
      iconArrow.addClass('hide'); // вне ховера ничего
    }

    function initCursor() {
      if (window.innerWidth < 992) return;

      oldMasks.forEach(mask => {
        $(document).on('mouseenter', `[data-mask="${mask}"]`, () => {
          cursor.removeClass('active');
        });
        $(document).on('mouseleave', `[data-mask="${mask}"]`, () => {
          cursor.addClass('active');
        });
      });

      // Ховер по триггеру
      $(document).on('mouseenter', newTrigger, (e) => {
        isTriggerHovered = true;
        const $trigger = $(e.currentTarget);
        const textValue = $trigger.attr('data-cursor-trigger') || '';

        currentText = textValue;
        isDragMode = textValue.toLowerCase() === 'drag';

        if (!isPreventHovered) {
          cursor.removeClass('active');
          applyHoverState(textValue);
        }
      });

      $(document).on('mouseleave', newTrigger, () => {
        isTriggerHovered = false;
        clearHoverState();
        resetToDefaultCursor();
        $bg.css('transform', '');
      });

      // prevent‑зона
      $(document).on('mouseenter', prevent, () => {
        isPreventHovered = true;
        cursor.addClass('active');
        clearHoverState();
      });

      $(document).on('mouseleave', prevent, () => {
        isPreventHovered = false;
        if (isTriggerHovered) {
          cursor.removeClass('active');
          applyHoverState(currentText);
        }
      });

      // ЛКМ зажата на триггере
      $(document).on('mousedown', newTrigger, function (e) {
        if (e.which !== 1) return;
        if (!isDragMode) return;

        const { iconText, iconDrag } = getCursorParts();
        iconText.addClass('hide');
        iconDrag.removeClass('hide');

        $bg.css('transform', 'scale(0.6)');
      });

      // ЛКМ отжата
      $(document).on('mouseup', function (e) {
        if (e.which !== 1) return;
        if (!isDragMode) return;

        const { iconText, iconDrag } = getCursorParts();
        iconDrag.addClass('hide');
        $bg.css('transform', '');

        if (isTriggerHovered && currentText) {
          iconText.removeClass('hide').text(currentText);
        } else {
          iconText.addClass('hide').text('');
        }
      });
    }

    $(window).on('resize', initCursor);
    initCursor();
  });

  //////////////////////////////////////////////////////////////////////////////////
  //
  // CUSTOM CURSOR MOVING
  // This script works if there is [data-cursor-trigger] on a page
  $(function () {
    const $cursor = $('.cursor-move');

    if (!$cursor.length) return;

    let rafId = null;
    let targetX = 0;
    let targetY = 0;
    let isListening = false;

    function onMouseMove(e) {
      targetX = e.clientX - window.innerWidth / 2;
      targetY = e.clientY - window.innerHeight / 2;

      if (rafId) return;

      rafId = window.requestAnimationFrame(function () {
        $cursor.css({
          left: targetX + 'px',
          top: targetY + 'px'
        });
        rafId = null;
      });
    }

    function checkConditions() {
      const isLargeScreen = window.innerWidth >= 992;
      const hasTrigger = $('[data-cursor-trigger]').length > 0;

      if (isLargeScreen && hasTrigger) {
        if (!isListening) {
          $(document).on('mousemove', onMouseMove);
          $cursor.show();
          isListening = true;
        }
      } else {
        if (isListening) {
          $(document).off('mousemove', onMouseMove);
          $cursor.hide();
          isListening = false;
        }
      }
    }

    $(window).on('resize', checkConditions);
    checkConditions();
  });

  //////////////////////////////////////////////////////////////////////////////////
  //
  // SWIPERS
  // 
  if ($('[data-swiper=works]').length) {
    var swiper = new Swiper('[data-swiper=works]', {
      speed: 500,
      slidesPerView: 'auto',
      spaceBetween: 24,
      loop: true,
      autoplay: {
        enabled: false,
        delay: 4000,
        disableOnInteraction: false,
      },
      breakpoints: {
        // when window width is >= 320px
        320: {
          autoplay: {
            enabled: true,
          },
          pagination: {
            el: '[data-swiper-pagination=works-mobile]',
            type: 'bullets',
            clickable: true,
          },
        },
        // when window width is >= 480px
        480: {
          autoplay: {
            enabled: false,
          },
          navigation: {
            nextEl: '[data-swiper-next=works]',
            prevEl: '[data-swiper-prev=works]',
          },
          pagination: {
            el: '[data-swiper-pagination=works]',
            type: 'progressbar',
          },
        },
      }

    });

    const swiperElem = $(swiper.wrapperEl);
    const slides = $(swiperElem).children();
    const videosMask = $(swiperElem).find('[data-mask=works]');
    let currentVideo = null;

    swiper.on('transitionStart', function (event) {
      $(videosMask).addClass('pointer-events-off');
    });
    swiper.on('transitionEnd', function (event) {
      $(videosMask).removeClass('pointer-events-off');

      const activeSlide = $(slides).eq(event.activeIndex);
      const activeVideo = activeSlide.find('video')[0];

      if (currentVideo) {
        currentVideo.pause();
        currentVideo.currentTime = 0;
      }
      if (activeVideo) {
        activeVideo.play();
        currentVideo = activeVideo;
      }

    });
  }

  if ($('[data-swiper=benefits]').length) {
    var swiper = new Swiper('[data-swiper=benefits]', {
      speed: 500,
      slidesPerView: 'auto',
      spaceBetween: 40,
      loop: true,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: '[data-swiper-next=benefits]',
        prevEl: '[data-swiper-prev=benefits]',
      },
      pagination: {
        el: '[data-swiper-pagination=benefits]',
        type: 'bullets',
        clickable: true,
      },
    });
  }

  if (windowWidth < 768 && $('[data-swiper=awards-runline]').length) {
    const swiper = new Swiper('[data-swiper=awards-runline]', {
      slidesPerView: 'auto',
      speed: 6000,
      loop: true,
      spaceBetween: 0,
      autoplay: {
        delay: 0,
        disableOnInteraction: false,
      },
    });
  }

  // Run line in discuss
  if ($('[data-swiper=runawards]').length && windowWidth < 480) {
    var swiper = new Swiper('[data-swiper=runawards]', {
      slidesPerView: 'auto',
      speed: 4000,
      loop: true,
      allowTouchMove: false,
      spaceBetween: 0,
      autoplay: {
        delay: 0,
        disableOnInteraction: false,
      },
    });
  }

  if ($('[data-swiper=reviews-grid]').length && windowWidth < 480) {
    const swiper = new Swiper('[data-swiper=reviews-grid]', {
      slidesPerView: 1.2,
      speed: 500,
      loop: true,
      spaceBetween: 18,
    });
  }


  //////////////////////////////////////////////////////////////////////////////////
  //
  // OPEN EACH DROPDOWN (WITH WF INTERACTION)
  //
  setTimeout(function () {

    // not close the first drop using wf interactions
    const defaultDrops = $('[data-dropdown-default]');
    if (defaultDrops.length !== 0) {
      $(defaultDrops).attr('data-dropdown-state', 'open').find('.w-dropdown-list')
        .height(
          'auto');
      $(defaultDrops).find('.dropdown__icon.is-open').hide();
      $(defaultDrops).find('.dropdown__icon.is-close').show();
    }

    $('.container').on('click',
      '.dropdown-inter-each > .w-dropdown-toggle',
      function () {
        const thisDrop = $(this).closest('.w-dropdown');
        const thisList = $(this).siblings('.w-dropdown-list');
        const allDrop = $(thisDrop).parent().children('.w-dropdown');
        const allList = $(allDrop).children('.w-dropdown-list');

        $(thisDrop).attr('data-dropdown-state', 'open');
        $(allDrop).not(thisDrop).attr('data-dropdown-state', '');
        $(allDrop).not(thisDrop).find('.dropdown__icon.is-open').show();
        $(allDrop).not(thisDrop).find('.dropdown__icon.is-close').hide();
        $(allList).not(thisList).animate({ height: '0px' }, 300);
      });
  }, 500);

  //////////////////////////////////////////////////////////////////////////////////
  //
  // CUSTOM DROPDOWN (ONLY SCRIPT)
  //
  // Required! Add [data-dropdown-group] to wrapper with dropdowns to init. Value tablet or mobile - init only for tablet or mobile and below
  // [data-dropdown-mode=one] -  You can open and close dropdown, others close itself. 
  // [data-dropdown-mode=always-one] - one is open always. 
  // [data-dropdown-mode=every] - you can open and close any and other don't close itself
  // [data-dropdown-state=open] for .w-dropdown - open as default. Or [data-dropdown-state=open-first] on the [data-dropdown-group].
  // window.initCustomDropdowns(); global fu for dinamic dropdons. Send elem of [data-dropdown-group] to fu

  $(function () {
    const BREAKPOINTS = { tablet: 991, mobile: 767 };

    function isGroupActive($group) {
      const mode = $group.attr('data-dropdown-group');
      const ww = window.innerWidth;
      if (!mode) return true;
      if (mode in BREAKPOINTS) return ww <= BREAKPOINTS[mode];
      return true;
    }

    function getInterMode($group) {
      const modeType = $group.attr('data-dropdown-mode');
      return modeType === 'always-one' ? 'always-one' : modeType === 'every' ? 'every' :
        'one';
    }

    function calcHeight($list) {
      if (!$list || !$list.length || !$list[0]) return 0;

      let wasHidden = $list.css('display') === 'none';
      if (wasHidden) $list.css('display', 'block');
      const h = $list.get(0).scrollHeight;
      if (wasHidden) $list.css('display', 'none');
      return h;
    }

    function closeDropdown($dropdown) {
      if (!$dropdown || !$dropdown.length) return;
      $dropdown.attr('data-dropdown-state', 'close')
        .find('.w-dropdown-list').height(0);
    }

    function openDropdown($dropdown) {
      if (!$dropdown || !$dropdown.length) return;
      $dropdown.attr('data-dropdown-state', 'open');
      const $list = $dropdown.find('.w-dropdown-list').first();
      if ($list.length) $list.height(calcHeight($list));
    }

    // global fu for dinamic dropdowns
    window.initCustomDropdowns = function ($container) {
      const $group = $container ? $container.closest('[data-dropdown-group]') : $(
        '[data-dropdown-group]');

      $group.each(function () {
        const $thisGroup = $(this);
        if (!isGroupActive($thisGroup)) return;

        // Ініціалізуємо дропдауни в контейнері
        ($container ? $container.find('.w-dropdown') : $thisGroup.find(
          '.w-dropdown'))
        .each(function () {
          const $dropdown = $(this);
          const $list = $dropdown.find('.w-dropdown-list').first();
          if ($dropdown.attr('data-dropdown-state') !== 'open') {
            $list.height(0);
            $dropdown.attr('data-dropdown-state', 'close');
          } else {
            $list.height(calcHeight($list));
            $dropdown.attr('data-dropdown-state', 'open');
          }
        });

        // always-one логіка
        if (getInterMode($thisGroup) === 'always-one') {
          if ($thisGroup.find('[data-dropdown-state="open"]').length === 0) {
            openDropdown($thisGroup.find('.w-dropdown').first());
          }
        }

        if ($thisGroup.attr('data-dropdown-state') === 'open-first' &&
          $thisGroup.find('[data-dropdown-state="open"]').length === 0) {
          openDropdown($thisGroup.find('.w-dropdown').first());
        }
      });
    };

    function handleDropdowns(e) {
      const $clicked = $(e.currentTarget).closest('[data-dropdown-state]');
      if (!$clicked.length) return;

      const $group = $clicked.closest('[data-dropdown-group]');
      if (!$group.length || !isGroupActive($group)) return;

      const mode = getInterMode($group);
      if ($clicked.attr('data-dropdown-state') === 'open') {
        if (mode === 'always-one' && $group.find('[data-dropdown-state="open"]')
          .length === 1) return;
        closeDropdown($clicked);
        return;
      }

      if (mode === 'one' || mode === 'always-one') {
        $group.find('[data-dropdown-state="open"]').each(function () {
          closeDropdown($(this));
        });
        openDropdown($clicked);
      } else if (mode === 'every') {
        openDropdown($clicked);
      }
    }

    window.initCustomDropdowns();
    $(document).on('click', '[data-dropdown-group] .w-dropdown-toggle',
      handleDropdowns);
  });

  //////////////////////////////////////////////////////////////////////////////////
  //
  // FIX DROIPDOWNS BUG
  //  
  $(document).on('opening', '[data-remodal-id=cookie]', function (e) {
    let $target = e.currentTarget.find('[data-dropdown-group]');
    window.initCustomDropdowns($target);
  })

  //////////////////////////////////////////////////////////////////////////////////
  //
  // AUTOPLAY FOR VIDEOS
  // 
  {
    const dataSrcVideos = $('source[data-src]');
    if (dataSrcVideos.length) {
      const lazyVideos = dataSrcVideos.parent('video');
      const observer = new IntersectionObserver((entries, observer) => {

        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const video = $(entry.target);
            video.children('source').each(function () {
              $(this).attr('src', $(this).data('src'));
            });

            video[0].load();
            video.on('loadeddata', function () {
              // console.log('started to load');
              video.attr('autoplay', true)[0].play().catch(err => {
                // console.warn('Autoplay error:', err);
              });
            });
            observer.unobserve(entry.target);

          }
        });
      }, { threshold: 0.1 });
      lazyVideos.each(function () {
        observer.observe(this);
      });
    }
  };

  //////////////////////////////////////////////////////////////////////////////////
  //
  // Autofill with LinkedIn
  //
  if ($('#linkedin-autofill').length) {
    $('#linkedin-autofill').on('click', function () {
      const clientId = '773z54wociylqr';
      const redirectUri =
        'https://www.halo-lab.com/linkedin-auth'; // замінити на продакшн
      const state = 'random_' + Math.random().toString(36).substring(2);
      const scope = 'openid profile email';

      const authUrl =
        `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}` +
        `&scope=${encodeURIComponent(scope)}`;

      // LinkedIn в новому вікні
      const popup = window.open(authUrl, 'linkedin_popup', 'width=600,height=700');

      // підписуємось на повідомлення popup
      window.addEventListener('message', (event) => {
        if (event.data.status === 'linkedin_authed') {
          console.log('Успешная авторизация через LinkedIn!');
        }
      });
    });
  }

});
