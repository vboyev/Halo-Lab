/* Place Webflow Rich Text components at their original Main Content markers.
 * Finsweet Rich Text performs this in Webflow CMS; static project data needs
 * the same placement after the server-rendered HTML is available. */

document.addEventListener('DOMContentLoaded', () => {
  const richText = document.querySelector('[fs-richtext-element="rich-text"][data-block="rich-main-new"]');
  if (!richText) return;

  richText.querySelectorAll('p').forEach((placeholder) => {
    const marker = placeholder.textContent.trim();
    if (!/^\{\{(?:dropdowns-[1-3]|numbers|review(?:-2)?|approach|slider-[1-3])\}\}$/.test(marker)) return;

    const component = richText.querySelector(`[data-project-component="${marker}"]`);
    if (component) placeholder.replaceWith(component);
  });
});
