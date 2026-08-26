/* Contains page-specific interaction code extracted from detail_project.html. */

///////////////////////////////////////////////////////
  // buttons to open remodal
  $(document).ready(() => {
    const links = $('[fs-richtext-element=rich-text] a[href^="#modal-"]');
    const CLONE_BTN_MORE = $('[data-component=more]').first().clone(true);
    const CLONE_BTN_PLUS = $('[data-component=plus]').first().clone(true);
    if ($(window).width() > 479) {
      links.append(CLONE_BTN_PLUS);
    } else {
      $('[fs-richtext-element=rich-text] blockquote').append(CLONE_BTN_MORE);
    }
    links.each(function (index, el) {
      const $this = $(this);
      const href = $this.attr('href');
      const number = href.replace('#modal-', '');
      const nextElement = $this.parent().next();
      $this.parent().attr('data-remodal-target', `modal-${number}`);
      if (nextElement.is('blockquote')) {
        nextElement.addClass('is--btn-more');
        nextElement.addClass('is--btn-more').find('[data-remodal-target]').attr('data-remodal-target', `modal-${number}`);
      }
    });
  });
