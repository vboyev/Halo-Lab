/* Contains page-specific interaction code extracted from detail_project.html. */

document.addEventListener('DOMContentLoaded', () => {
    const richTexts = document.querySelectorAll('[data-rich-icon-numbers]');
    richTexts.forEach((richText) => {
      const strongElements = richText.querySelectorAll('strong');
      strongElements.forEach((strong) => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('data-numbers__wrap');
        strong.parentNode.insertBefore(wrapper, strong);
        wrapper.appendChild(strong);
      });
      const wraps = richText.querySelectorAll('.data-numbers__wrap');
      const images = richText.querySelectorAll('img');
      images.forEach((img) => {
        const index = parseInt(img.alt.trim(), 10);
        const targetWrap = wraps[index - 1];
        if (!targetWrap) return;
        targetWrap.prepend(img);
      });
    });
  });
  document.addEventListener('DOMContentLoaded', () => {
    const richBlocks = document.querySelectorAll('[data-block="rich-main-new"]');
    richBlocks.forEach((block) => {
      const embeds = block.querySelectorAll('.w-embed');
      embeds.forEach((embed) => {
        const hasVideo = embed.querySelector('video');
        if (hasVideo) {
          embed.classList.add('w-video');
        }
      });
    });
  });
  ///////////////////////////////////////////////////////
  // Turn of lazy load for img in DROPDOWNS
  setTimeout(function () {
    const $groups = $('[data-dropdown-group]');
    if ($groups.length > 0 && typeof window.initCustomDropdowns === 'function') {
      window.initCustomDropdowns($groups);
    }
  }, 2000);
  ///////////////////////////////////////////////////////
  // DROPDOWNS "Our process"
  $(function () {
    $('[data-dropdowns-output]').each(function () {
      const outputValue = $(this).attr('data-dropdowns-output');
      const $output = $(this);
      const $template = $('[data-dropdowns-input="dropdown"]').first();
      const $target = $(`[fs-richtext-component="dropdowns-${outputValue}"]`);
      if ($output.length === 0 || $template.length === 0 || $target.length === 0) return;
      $output.hide();
      const $headings = $output.find('h3');
      const count = $headings.length;
      if (!count) return;
      $target.empty();
      for (let i = 0; i < count; i++) {
        const $h3 = $headings.eq(i);
        const $nextH3 = $headings.eq(i + 1);
        let $sectionContent;
        if ($nextH3.length) {
          $sectionContent = $h3.nextUntil($nextH3);
        } else {
          $sectionContent = $h3.nextAll();
        }
        const $clone = $template.clone(true, true);
        const titleText = $h3.text();
        $clone.find('[data-dropdowns-input="title"]').text(titleText);
        let html = '';
        $sectionContent.each(function () {
          html += this.outerHTML;
        });
        $clone.find('[data-dropdowns-input="rich"]').html(html);
        $clone.find('img[loading="lazy"]').attr('loading', 'eager');
        $target.append($clone);
      }
      if (typeof window.initCustomDropdowns === 'function') {
        window.initCustomDropdowns($target);
      }
    });
  });
  ///////////////////////////////////////////////////////
  // DROPDOWNS "Our approach"
  $(function () {
    const $output = $('[data-approach-output]');
    const $template = $('[data-dropdowns-input="dropdown"]').first();
    const $target = $('[fs-richtext-component="approach"]');
    const $techOutput = $('[data-tech-output]');
    if ($output.length === 0 || $template.length === 0 || $target.length === 0) return;
    $output.hide();
    const $headings = $output.find('h3');
    const count = $headings.length;
    if (!count) return;
    $target.empty();
    for (let i = 0; i < count; i++) {
      const $h3 = $headings.eq(i);
      const $nextH3 = $headings.eq(i + 1);
      let $sectionContent;
      if ($nextH3.length) {
        $sectionContent = $h3.nextUntil($nextH3);
      } else {
        $sectionContent = $h3.nextAll();
      }
      const $clone = $template.clone(true, true);
      const titleText = $h3.text();
      $clone.find('[data-dropdowns-input="title"]').text(titleText);
      let html = '';
      $sectionContent.each(function () {
        html += this.outerHTML;
      });
      const $richContent = $clone.find('[data-dropdowns-input="rich"]');
      $richContent.html(html);
      const outputClass = $output.attr('class') || '';
      $richContent.attr('class', outputClass);
      $clone.find('img[loading="lazy"]').attr('loading', 'eager');
      if (i === count - 1) {
        const hasFigure = $richContent.find('figure').length > 0;
        if (!hasFigure && $techOutput.length > 0) {
          const $techClone = $techOutput.clone(true, true);
          $richContent.append($techClone);
        }
      }
      $target.append($clone);
    }
    if (typeof window.initCustomDropdowns === 'function') {
      window.initCustomDropdowns($target);
    }
  });
  ///////////////////////////////////////////////////////
  // Swiper Gallery
  $(function () {
    function initGallery() {
      let anyInited = false;
      $('[fs-richtext-component^="slider-"]').each(function () {
        const $wrapper = $(this);
        const $original = $wrapper.find('[data-splide="projects-new-gallery"]');
        if (!$original.length || $original.data('splide-inited')) return;
        $original.find('script[type="text/x-wf-template"]').remove();
        const $splideEl = $original.clone(true);
        $splideEl.insertAfter($original).removeAttr('fs-richtext-component data-splide');
        $original.hide();
        const mqMobile = window.matchMedia('(max-width: 767px)');
        let splide = new Splide($splideEl[0], {
          type: 'loop',
          speed: 500,
          width: '100%',
          gap: '0',
          autoWidth: true,
          drag: 'free',
          arrows: false,
          pagination: false,
          autoScroll: {
            speed: mqMobile.matches ? 0.8 : 1,
            pauseOnHover: false,
            pauseOnFocus: false,
          },
        }).mount(window.splide.Extensions);
        mqMobile.addEventListener('change', () => {
          const newSpeed = mqMobile.matches ? 0.8 : 1;
          splide.options = {
            ...splide.options,
            autoScroll: {
              ...splide.options.autoScroll,
              speed: newSpeed,
            },
          };
        });
        $splideEl.data('splide-inited', true);
        anyInited = true;
      });
      return anyInited;
    }
    let tries = 0;
    const maxTries = 10;
    const intervalId = setInterval(() => {
      tries++;
      const hasSliders = $('[fs-richtext-element="rich-text"] [fs-richtext-component^="slider-"]').length > 0;
      if (hasSliders) {
        initGallery();
        clearInterval(intervalId);
      } else if (tries >= maxTries) {
        clearInterval(intervalId);
      }
    }, 1000);
  });
