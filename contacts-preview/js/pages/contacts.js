/* Contains page-specific interaction code extracted from contacts.html. */

///////////////////////////////////////////////
  // Next step in form
  //
  $('[data-next-step]').on('click', function (e) {
    e.preventDefault();
    const $btn = $(this);
    const $block = $btn.closest('[data-form-validate]');
    if (!$block.length) return;
    const isValid = window.validationForm($block);
    if (!isValid) return;
    const $tabs = $btn.closest('.w-tabs');
    const $tabsLinks = $tabs.find('.w-tab-menu').children();
    const $currentTab = $tabsLinks.filter('.w--current');
    const currentIndex = $tabsLinks.index($currentTab);
    const $nextTab = $tabsLinks.eq(currentIndex + 1);
    if (!$nextTab.length) return;
    $nextTab.trigger('click');
    setTimeout(function () {
      const $tabPanes = $tabs.find('.w-tab-content').children();
      const $nextPane = $tabPanes.eq(currentIndex + 1);
      if (!$nextPane.length) return;
      const $autoInput = $nextPane.find('.input[autofocus]').first();
      if ($autoInput.length) {
        $autoInput.focus();
      }
    }, 200);
  });
  ///////////////////////////////////////////////
  // Reviews
  //
  if ($('[data-swiper=contact-reviews]').length) {
    const swiper = new Swiper('[data-swiper=contact-reviews]', {
      slidesPerView: 'auto',
      speed: 12000,
      loop: true,
      spaceBetween: 0,
      autoplay: {
        delay: 0,
        disableOnInteraction: false,
        // Run the marquee toward the form on the right rather than away from it.
        reverseDirection: true,
      },
    });
  }
  ///////////////////////////////////////////////
  // FAQ modal
  //
  $(document).ready(function () {
    const $faqBlock = $('[data-anim-faq=block]');
    const $faqElements = $('[data-anim-faq=reviews], [data-anim-faq=elem]');
    const $faqOpen = $('[data-anim-faq=open]');
    const $faqClose = $('[data-anim-faq=close]');
    $faqOpen.on('click', function () {
      $faqBlock.toggleClass('anim');
      $faqElements.toggleClass('anim');
    });
    $faqClose.on('click', function () {
      $faqBlock.addClass('anim');
      $faqElements.removeClass('anim');
    });
  });
