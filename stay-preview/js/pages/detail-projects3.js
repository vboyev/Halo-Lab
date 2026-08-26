/* Contains page-specific interaction code extracted from detail_projects.html. */

// fix bug with comma
  $(() => {
    let $elementToMove = $('[data-slug-industry="other-industries"]');
    $elementToMove.prependTo($elementToMove.parent());
  });
  // add class to .w-embed for style video
  $(() => {
    $('iframe[src*=vimeo], iframe[src*=youtube], iframe[src*=figma]').each(function() {
      if ($(this).closest('.project__rich-media').length) return;

      let src = $(this).attr('src');
      $(this).closest('.w-embed').addClass('is-iframe');
      if ($(this).parent('div:not(.w-embed)').length) {
        $(this).closest('.w-embed').addClass('is-iframe-fullscreen')
      }
      if (src.includes('youtube')) {
        $(this).closest('.w-embed').addClass('is-video-youtube')
      }
      if (src.includes('figma')) {
        $(this).closest('.w-embed').addClass('is-figma')
      }
    });
  });
  // move images to blockquote in main rich-text
  $(() => {
    $('[fs-richtext-element="rich-text"] blockquote + figure.w-richtext-align-floatleft').each(function() {
      let $blockquote = $(this).prev('blockquote');
      let $figure = $(this).detach();
      $figure.appendTo($blockquote);
    });
  });
  // move images in component of testing
  $(() => {
    $('[fs-richtext-component="testing"] ul + figure').each(function() {
      var $ul = $(this).prev('ul');
      var $img = $(this).detach();
      $img.appendTo($ul);
    });
  });
  // add btn if found component
  $(() => {
    $('[fs-richtext-element="rich-text"] p > a').each(function() {
      let linkText = $(this).text(); 
      let linkHref = $(this).attr('href');
      let linkTarget = $(this).attr('target');
      if (linkText.startsWith('{{')) {
        $(this).closest('p').addClass('is-button');
        let buttonText = linkText.slice(2, -2);
        let buttonClone = $('[data-component="btn"]').clone();
        buttonClone.attr('href', linkHref);
        if (linkTarget === '_blank') {
          buttonClone.attr('target', '_blank'); 
        }
        buttonClone.find('.button__text').text(buttonText);
        buttonClone.removeAttr('data-component');
        $(this).replaceWith(buttonClone);
      }
    });
  });
  // swipers
  $(() => {
    if (document.querySelector('[data-project-slug="linkbycar"]')) return;

    setTimeout(function() {
      let componentsSliders = $('[fs-richtext-element="rich-text"] [fs-richtext-component*="slider"]');
      if ($(componentsSliders).length > 0) {
        const swiperArr = [];
        $(componentsSliders).each(function(index, element) {
          let slider = $(this).find('.swiper');
          $(this).find('[data-swiper-prev]').attr('data-swiper-prev', `case-${index}`);
          $(this).find('[data-swiper-next]').attr('data-swiper-next', `case-${index}`);
          $(slider).each(function(i, el) {
            let swiper = new Swiper(el, {
              speed: 500,
              slidesPerView: "auto",
              spaceBetween: 0,
              loop: true,
              navigation: {
                nextEl: `[data-swiper-next=case-${index}]`,
                prevEl: `[data-swiper-prev=case-${index}]`,
              },
              autoplay: {
                delay: 3000,
                disableOnInteraction: false,
              },
            });
            swiperArr[index] = swiper;
          });
        });
      }
    }, 500);
  });
  // hide step wich is empty
  $(() => {
    if ($('[fs-richtext-component*="steps"]').length) {
      $('[fs-richtext-component*="steps"]').each(function() {
        let figureCount = $(this).find('.w-richtext').first().children('figure').length - 1;
        $(this).find('.columns.mod--case-steps').each(function(index) {
          if (index > figureCount) {
            $(this).hide();
          }
        });
      });
    }
  });
  // save serviceName in sessionStorage and go to /portfolio
  $(() => {
    $('[fs-cmsnest-collection="services"] [data-hover]').click(function(event) {
      event.preventDefault();
      let service = $(this).find('.button__text').first().text();
      sessionStorage.setItem('servicesFromCase', service);
      window.location.href = '/projects';
    });
  });
