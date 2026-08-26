// Shared viewport and page-load animations. Requires Lodash before this script.
///<script src="https://assets.slater.app/slater/826/2754.js"></script>
///<script src="https://slater.app/826/2754.js"></script>

$(document).ready(() => {
  const windowWidth = $(window).width();

  //////////////////////////////////////////////////////////////////////
  // 
  // ANIMATION OF BUTTONS
  //
  {
    $('[data-button-text]').each(function () {
      const $this = $(this);
      const text = $this.text();
      $this.empty();

      const $textBlock = $(`<div>${text}</div>`);

      $this.append($textBlock.clone());
      $this.append($textBlock);
    });
  };

  //////////////////////////////////////////////////////////////////////
  // 
  // GLOW CURSOR
  //
  {
    function glowCursor() {
      const cursorOffSet = function (e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.style.setProperty("--cursor-x", x + "px");
        this.style.setProperty("--cursor-y", y + "px");
      };

      document.querySelectorAll("[data-glow-container]").forEach((grid) => {
        grid.addEventListener("mousemove", function (e) {
          this.querySelectorAll("[data-glow]").forEach((card) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty("--cursor-x", x + "px");
            card.style.setProperty("--cursor-y", y + "px");
          });
        });
      });
    };
    if ($('[data-glow-container]').length && windowWidth > 991) {
      glowCursor();
    }
  };

  //////////////////////////////////////////////////////////////////////
  // 
  // SCROLL ANIMATION
  //
  {
    function animRun() {
      // Stay's entrance sequence is limited to its hero; keep hover/form states intact.
      if (document.body.hasAttribute('data-hero-only-reveal')) {
        $('[data-anim-trigger]:not([data-anim-trigger=load]) [data-anim-delay]')
          .css('transition', 'none').removeClass('anim');
        return;
      }
      const elements = $('[data-anim-trigger]').not('[data-anim-trigger=load]');

      function isInViewport(elem) {
        const viewportHeight = $(window).height();
        const elementTop = elem.offset().top;
        const elementBottom = elementTop + elem.outerHeight();
        const scrollTop = $(window).scrollTop();
        const scrollBottom = scrollTop + viewportHeight;
        const triggerPoint = elementTop + (viewportHeight * 0.1);
        return (scrollTop <= elementTop && scrollBottom >= triggerPoint) ||
          (scrollTop >= elementTop && scrollTop <= elementBottom - viewportHeight + (
            viewportHeight * 0.1));
      }

      function animateElement(elem) {
        // console.log('animated');
        const animChildren = $(elem).find('[data-anim-delay]');

        animChildren.each((index, childElem) => {
          const delay = $(childElem).attr('data-anim-delay');
          if (!delay) {
            $(childElem).removeClass('anim');
          } else {
            setTimeout(() => {
              $(childElem).removeClass('anim');
            }, parseInt(delay));
          }
        });
      }

      function checkElements() {
        elements.each((index, elem) => {
          const triggerValue = $(elem).attr('data-anim-trigger');

          if (!triggerValue && isInViewport($(elem)) && !$(elem).data(
              'anim-triggered')) {
            $(elem).data('anim-triggered', true);
            animateElement($(elem));
          }
        });
      }
      checkElements();
      $(window).on('scroll', _.throttle(checkElements, 100));

    }

    if ($('[data-anim-delay]').length && windowWidth > 991) {
      animRun();

      const loadElements = $('[data-anim-trigger=load]').find('[data-anim-delay]');
      if (loadElements.length) {
        loadElements.each((index, childElem) => {
          const delay = $(childElem).attr('data-anim-delay');
          if (!delay) {
            $(childElem).removeClass('anim');
          } else {
            setTimeout(() => {
              $(childElem).removeClass('anim');
            }, parseInt(delay));
          }
        });
      }
    } else {
      $('[data-anim-delay]').removeClass('anim');
    }
  };


  // ANIMATION OF FAVICON
  //
  if (windowWidth > 991) {
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

    if (!isFirefox) {
      const faviconImages = [
        'https://uploads-ssl.webflow.com/63f38a8c92397a024fcb9ae8/65ae3d57958606e266e8b18f_favicon-anim-01.webp',
        'https://uploads-ssl.webflow.com/63f38a8c92397a024fcb9ae8/65ae3d57e2dfb400ce9a1a51_favicon-anim-02.webp'
      ];

      let currentIndex = 1;

      // Dynamically add link element for favicon
      $('head').append('<link id="favicon" rel="shortcut icon" type="image/x-icon" href="">');

      const updateFavicon = () => {
        $('#favicon').attr('href', faviconImages[currentIndex]);
        currentIndex = (currentIndex + 1) % faviconImages.length;
      };

      let changeFaviconInterval = setInterval(() => {
        updateFavicon();
        setTimeout(updateFavicon, 500);
      }, 4000);
    }
  }

});
