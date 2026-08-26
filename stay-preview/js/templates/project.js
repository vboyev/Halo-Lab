// Interactions used by project detail templates. Requires Finsweet Richtext and Vimeo Player.
///<script src="https://assets.slater.app/slater/826/8916.js"></script>
///<script src="https://slater.app/826/8916.js"></script>



$(document).ready(() => {
  //
  // Change collection-relative if lack of posts
  //
  {
    const $similarBlock = $('[data-collection-relative="similar"]');
    const itemsCount = $similarBlock.find('.w-dyn-item').length;
    if (itemsCount < 2) {
      $similarBlock.addClass('hide');
      $('[data-collection-relative="any"]').removeClass('hide');
    }
  };

  //
  // ANIMATE PLUS BUTTON
  //
  if ($(window).width() > 991) {
    $(document).on('mouseenter', '[data-block="rich-main"] [data-remodal-target]',
      function () {
        let plus = $(this).find('[data-component=plus]');
        let plusElements = plus.find('[data-hover-elem]');
        plusElements.addClass('active');
      });

    $(document).on('mouseleave', '[data-block="rich-main"] [data-remodal-target]',
      function () {
        let plus = $(this).find('[data-component=plus]');
        let plusElements = plus.find('[data-hover-elem]');
        plusElements.removeClass('active');
      });
  }

  //
  // SWIPERS OF STORY
  //
  setTimeout(function () {

    const swiperArr = [];

    function progress(swiper, pause = false) {
      const SELECTOR_SLIDER_WRAP = $(swiper.el).closest('[fs-richtext-component]');
      const SELECTOR_CONTROL = SELECTOR_SLIDER_WRAP.find('[project-story-control]');
      const ARR_LINES = SELECTOR_SLIDER_WRAP.find('[project-story-lines]').children();

      for (let i = 0; i < ARR_LINES.length; i++) {
        if (i == swiper.realIndex) {
          if (!pause) {
            $(ARR_LINES[i]).find('[project-story-line]').stop().animate({ width: '0%' },
              0,
              'linear',
              function () {
                $(ARR_LINES[i]).find('[project-story-line]').stop()
                  .animate({ width: '100%' },
                    10000, 'linear');
              });
          } else {
            $(ARR_LINES[i]).find('[project-story-line]').stop().animate({ width: '100%' },
              0,
              'linear');
          }
        } else if (i < swiper.realIndex) {
          $(ARR_LINES[i]).find('[project-story-line]').stop().animate({ width: '100%' },
            0,
            'linear');
        } else {
          $(ARR_LINES[i]).find('[project-story-line]').stop().animate({ width: '0%' }, 0,
            'linear');
        }
      }

      if (pause) {
        swiper.autoplay.stop();
        SELECTOR_CONTROL.children().eq(0).hide();
        SELECTOR_CONTROL.children().eq(1).show();
      } else {
        swiper.autoplay.start();
        SELECTOR_CONTROL.children().eq(1).hide();
        SELECTOR_CONTROL.children().eq(0).show();
      }

    }

    $('[data-swiper^=project-story]').each(function (index, el) {
      const SELECTOR_SLIDER_WRAP = $(this).closest('[fs-richtext-component]');
      const SELECTOR_SLIDER = $(this);
      const SELECTOR_LINES = SELECTOR_SLIDER_WRAP.find('[project-story-lines]');
      const SELECTOR_LABEL = SELECTOR_SLIDER_WRAP.find('[project-story-label]');
      const SELECTOR_CONTROL = SELECTOR_SLIDER_WRAP.find('[project-story-control]');
      const line = SELECTOR_SLIDER_WRAP.find('[project-story-lines]').children().eq(0)
        .prop(
          'outerHTML');
      const slidesTotal = SELECTOR_SLIDER.find('.swiper-slide').length;

      SELECTOR_SLIDER.attr('data-swiper', `project-story-${index}`);
      SELECTOR_SLIDER_WRAP.find('[data-swiper-next]').attr('data-swiper-next',
        `project-story-${index}`);
      SELECTOR_SLIDER_WRAP.find('[data-swiper-prev]').attr('data-swiper-prev',
        `project-story-${index}`);
      SELECTOR_LABEL.text(SELECTOR_SLIDER.find('img').first().attr('alt'));
      SELECTOR_CONTROL.attr('project-story-control', `${index}`);

      SELECTOR_LINES.html('');
      for (var i = 0; i < slidesTotal; i++) {
        SELECTOR_LINES.append(line);
      }

      var swiper = new Swiper(`[data-swiper=project-story-${index}]`, {
        speed: 10,
        slidesPerView: 1,
        spaceBetween: 0,
        loop: true,
        autoplay: {
          delay: 10000,
          disableOnInteraction: false,
          waitForTransition: false,
        },
        navigation: {
          nextEl: `[data-swiper-next=project-story-${index}]`,
          prevEl: `[data-swiper-prev=project-story-${index}]`,
        },
        on: {
          init: function () {

          },
          slideChange: function () {
            progress(this);

            const isLabel = SELECTOR_SLIDER.find('img').eq(this.activeIndex)
              .attr(
                'alt')
              .length;
            if (isLabel) {
              SELECTOR_LABEL.show().text(SELECTOR_SLIDER.find('img').eq(this
                .activeIndex).attr('alt'));
            } else {
              SELECTOR_LABEL.hide();
            }
          },
        },
      });
      swiperArr[index] = swiper;
    });

    $('[project-story-control]').on('click', function () {
      const index = $(this).attr('project-story-control');
      const swiper = swiperArr[index];

      if (swiper.autoplay.running) {
        progress(swiper, true);
      } else {
        progress(swiper);
      }
    });

    $('[project-story-lines] > div').on('click', function () {
      const SELECTOR_SLIDER_WRAP = $(this).closest('[fs-richtext-component]');
      const index = SELECTOR_SLIDER_WRAP.find('[project-story-control]').attr(
        'project-story-control');
      const swiper = swiperArr[index];
      const lineIndex = $(this).index();

      swiper.slideToLoop(lineIndex, 0);
    });

  }, 1000);

  //
  // find variable like {{author-name}} in blockquotes and load block of author
  //
  {
    let blockquotes = $(
      '[data-block="rich-main"] blockquote, [data-remodal-id^=modal-] blockquote');

    if (blockquotes.length !== 0) {
      blockquotes.each(function () {
        let text = $(this).html();
        let startIndex = text.indexOf('{{');

        if (startIndex !== -1) {
          $(this).addClass('is-author');
        }

        while (startIndex !== -1) {
          let endIndex = text.indexOf('}}', startIndex);

          if (endIndex !== -1) {
            let variable = text.substring(startIndex, endIndex +
              2); // Включая фигурные скобки
            let author = text.substring(startIndex + 2, endIndex);
            let url = `/author/${author}`;
            let $this = $(this);

            $.get(url, function (data) {
              let $loadedContent = $(data).find('[data-component=author]');
              text = text.replace(variable, $loadedContent.prop('outerHTML'));
              $this.html(text);
            }).fail(function () {
              text = text.replace(variable,
                ""); // Удаляем переменную при ошибке загрузки
              $this.html(text);
            });
          }

          startIndex = text.indexOf('{{', endIndex);
        }
      });
    }
  };

  //
  // if blockquote after image or slider
  //
  {
    if ($(window).width() > 991) {
      setTimeout(function () {
        $('[data-block="rich-main"] [fs-richtext-component^=slider-], [data-block="rich-main"] figure.w-richtext-align-center')
          .each(function (index, el) {
            const nextElement = $(el).next();

            if (nextElement.is('blockquote')) {
              nextElement.wrap(
                '<aside class="project-sidebar__block"></aside>');
              $(el).append(nextElement.parent());
            }
          });
      }, 1000);

      setTimeout(function () {
        $('[data-block="rich-main"] [fs-richtext-component^=slider-], [data-block="rich-main"] figure.w-richtext-align-center')
          .each(function (index, el) {
            const nextElement = $(el).next();

            if (nextElement.is('[fs-richtext-component=cta]')) {
              $(el).append(nextElement);
              // lottieCheck();
              // setTimeout(lottieCheck, 2000);
            }
          });
      }, 2000);
    }

  }

  //
  // SIDEBAR NAV
  //
  {
    const SELECTOR_FRACTION_CURRENT = $('[data-project-nav=fraction]').children('span').eq(0);
    const SELECTOR_FRACTION_TOTAL = $('[data-project-nav=fraction]').children('span').eq(1);
    const SELECTOR_TITLE_CURRENT = $('[data-project-nav=current]');
    const ARR_LINKS = $('[data-project-nav=rich] a');
    const ARR_H2_LINK = $('.w-richtext:not(.hide, .w-condition-invisible) > h2 > a[href^="#"]');
    const windowHeight = $(window).height();

    SELECTOR_FRACTION_TOTAL.text(ARR_LINKS.length);

    // update fraction of nav
    function updateFraction(text, index) {
      SELECTOR_TITLE_CURRENT.text(text);
      SELECTOR_FRACTION_CURRENT.text(index + 1);
    }
    // update title and current link of nav
    function updateNav(linkHref) {
      ARR_LINKS.each(function () {
        if ($(this).attr('href') === linkHref) {
          $(this).closest('li').addClass('current');
          const text = $(this).text();
          const index = ARR_LINKS.index($(this));
          updateFraction(text, index);
        } else {
          $(this).closest('li').removeClass('current');
        }
      });
    }

    // when scroll
    if ($(window).width() > 991) {
      updateNav(ARR_H2_LINK.first().attr('href'));

      $(window).on('scroll', function () {
        const scrollTop = $(window).scrollTop();
        const visibleTop = scrollTop + (windowHeight * 0.4);
        let prevLinkHref = '';

        ARR_H2_LINK.each(function () {
          const linkHref = $(this).attr('href');
          const h2 = $(this).closest('h2');
          const h2Top = h2.offset().top;
          const h2Bottom = h2Top + h2.outerHeight();

          if ((h2Top <= visibleTop && h2Bottom >= visibleTop) || (h2Top <=
              visibleTop &&
              h2Bottom >= scrollTop)) {
            updateNav(linkHref);
            return false;
          } else if (h2Top < scrollTop && prevLinkHref !== linkHref) {
            prevLinkHref = linkHref;
            updateNav(linkHref);
          }
        });
      });
    }

    // when click on nav link
    ARR_LINKS.on('click', function (event) {
      event.preventDefault();
      const linkIndex = ARR_LINKS.index($(this)) + 1;
      const linkText = $(this).attr('href').substring(1);
      const linkHref = $(this).attr('href');

      ARR_H2_LINK.each(function () {
        if ($(this).attr('href') === linkHref) {
          const h2 = $(this).closest('h2');
          const scrollTo = h2.offset().top - (windowHeight * 0.15);
          $('html, body').animate({
            scrollTop: scrollTo
          }, 500);
          return false;
        }
      });
      $('.w-dropdown').trigger('w-close');
    });
  };

  //
  // Fix stucture in remodal
  //
  {
    $('[data-remodal-id^=modal-]').each((index, el) => {
      const rich = $(el).find('.w-richtext').first();
      const h2 = rich.children('h2').text();

      $(el).find('.remodal__close h2').text(h2);

      rich.children().each((index, child) => {
        if ($(child).is('figure.w-richtext-align-center, .w-embed')) {
          const divRow = $('<div class="project-modal__row-items"></div>');
          $(child).nextUntil('figure.w-richtext-align-center, .w-embed').appendTo(
            divRow);
          $(child).after(divRow);
        }
      });

      let divRowItems = null;
      rich.children().each((index, child) => {
        if ($(child).is('figure.w-richtext-align-center, .w-embed')) {
          if (divRowItems !== null) {
            divRowItems.appendTo(rich);
          }
          divRowItems = $('<div class="project-modal__row"></div>');
        }
        if (divRowItems !== null) {
          divRowItems.append($(child));
        }
      });
      if (divRowItems !== null) {
        divRowItems.appendTo(rich);
      }

      const blockquote = rich.find('blockquote');
      if (blockquote !== null) {
        rich.append($(blockquote));
      }

    });

  };

  //
  // add class to .w-embed for style video
  //
  {
    $('[data-block="rich-main"] iframe[src*=vimeo], [data-block="rich-main"] iframe[src*=youtube], [data-block="rich-main"] iframe[src*=figma]')
      .each(function () {
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
  };

  //
  // aspect retio of vimeo
  //

  // not fullscreen
  $(function () {
    $('.w-embed.is--not-fullscreen-media iframe[src^="https://player.vimeo.com"]').each(
      function () {
        const iframe = this;
        const $wrapper = $(iframe).closest('.w-embed.is--not-fullscreen-media');
        const player = new Vimeo.Player(iframe);

        player.ready().then(function () {
          return player.getVideoHeight().then(function (height) {
            return player.getVideoWidth().then(function (width) {
              if (width && height) {
                const aspectRatio = (height / width) * 100;
                $wrapper.css('padding-bottom', aspectRatio + '%');
              }
            });
          });
        }).catch(function (error) {
          console.warn('Vimeo error:', error);
        });
      });
  });

  // media
  {
    let iframes = document.querySelectorAll('.w-embed > div iframe[src*="vimeo"]');

    iframes.forEach(function (iframe) {
      let videoUrl = iframe.getAttribute('src');

      let thisMedia = $(iframe).closest('[data-component=media]');
      if (thisMedia.length) {
        thisMedia.addClass('is--component-media');
      }
    });
  };

  //
  // add decor line befor align-floatleft image
  //
  {
    const RICH_ICONS = $('[data-block="rich-main"] figure.w-richtext-align-floatleft');

    RICH_ICONS.each((index, child) => {
      const nextElem = $(child).next();
      const prevElem = $(child).prev();

      const rules = nextElem.is('p') || nextElem.is(
          'figure.w-richtext-align-floatleft') ||
        (prevElem
          .prev().is('p') && prevElem.prev().is('p'));

      if (rules) {
        const CLONE_LINE = $('[fs-richtext-component=line]').first().clone();
        $(child).before(CLONE_LINE);
      }
    });

    if ($(window).width() > 991) {
      setTimeout(function () {
        RICH_ICONS.each((index, child) => {
          const nextElem = $(child).next();
          const prevElem = $(child).prev();

          const rules = nextElem.next().is('p') && !prevElem.is(
            'figure.w-richtext-align-floatleft') && (nextElem.next().is('p') ||
            prevElem.prev().is('p'));

          if (rules) {
            const CLONE_FIGURE = $(child).clone(true);
            $(child).after(CLONE_FIGURE.css('opacity', '0'));
          }
        });
      }, 1000);
    }
  }

  //
  // add class to media to fix margin in css
  //
  {
    const media = $(
      '[data-block="rich-main"] > figure.w-richtext-align-center, [data-block="rich-main"] .w-embed.is-iframe:not(.is-iframe-fullscreen), [fs-richtext-component^="slider-"]'
    );
    const mediaFullscreen = $(
      '[data-block="rich-main"] > figure.w-richtext-align-fullwidth, .w-embed.is-iframe-fullscreen'
    );
    if (media) {
      media.addClass('is--not-fullscreen-media');
    }
    if (mediaFullscreen) {
      mediaFullscreen.addClass('is--fullscreen-media');
    }

    if ($(window).width() < 992) {
      setTimeout(function () {
        $('[fs-richtext-component^=slider-], [data-block="rich-main"] figure.w-richtext-align-center')
          .each(function (index, el) {
            const nextElement = $(el).next();

            if (nextElement.is('blockquote')) {
              nextElement.wrap('<aside class="project-sidebar__block"></aside>');
            }
          });
      }, 1000);

    }

  };

});
