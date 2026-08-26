/* Normalizes ordinary-project media exports and the LinkByCar Rich Text test. */

(() => {
  document.querySelectorAll('.project__rich-media [data-rt-embed-type]').forEach((embed) => {
    embed.classList.add('w-embed', 'w-iframe');
    embed.removeAttribute('data-rt-embed-type');
  });

  if (!document.querySelector('[data-project-slug="linkbycar"]')) return;

  const alignmentClass = {
    center: 'w-richtext-align-center',
    floatleft: 'w-richtext-align-floatleft',
    fullwidth: 'w-richtext-align-fullwidth',
    normal: 'w-richtext-align-normal',
  };

  document.querySelectorAll('[data-project-slug="linkbycar"] .w-richtext, [data-project-ordinary-modals] .w-richtext').forEach((richText) => {
    richText.querySelectorAll('figure[data-rt-type], figure[data-rt-align]').forEach((figure) => {
      if (figure.dataset.rtType === 'image') figure.classList.add('w-richtext-figure-type-image');
      const className = alignmentClass[figure.dataset.rtAlign];
      if (className) figure.classList.add(className);
      if (figure.dataset.rtMaxWidth && !figure.style.maxWidth) figure.style.maxWidth = figure.dataset.rtMaxWidth;
      figure.removeAttribute('data-rt-type');
      figure.removeAttribute('data-rt-align');
      figure.removeAttribute('data-rt-max-width');
    });
  });
})();
