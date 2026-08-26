/* Stay-only experiment. Keep the CMS content and shared dropdown controller intact. */
$(function () {
  const main = document.querySelector('[data-project-slug="stay"]');
  const rich = main?.querySelector('.project-new__rich-main');
  if (!rich) return;
  const sections = [];

  rich.querySelectorAll('[fs-richtext-component^="dropdowns-"]').forEach((group, index) => {
    let heading = group.previousElementSibling;
    const introduction = [];
    while (heading?.tagName === 'P') {
      introduction.unshift(heading);
      heading = heading.previousElementSibling;
    }
    if (!heading?.matches('h2, h3')) return;
    const section = document.createElement('section');
    section.className = 'stay-process';
    section.id = `stay-process-${index + 1}`;
    const rail = document.createElement('div');
    rail.className = 'stay-process__rail';
    const sidebar = document.createElement('div');
    sidebar.className = 'stay-process__sidebar';
    const content = document.createElement('div');
    content.className = 'stay-process__content';
    heading.before(section);
    heading.classList.add('stay-process__title');
    sidebar.append(heading);
    rail.append(sidebar);
    content.append(...introduction, group);
    section.append(rail, content);
    group.querySelectorAll('.w-dropdown').forEach((dropdown) => {
      const source = dropdown.querySelector('.project-new__rich-dropdown');
      const label = [...(source?.querySelectorAll('h4') || [])]
        .find((node) => node.textContent.trim().toLowerCase() === 'deliverables');
      const list = label?.nextElementSibling;
      if (!list?.matches('ul, ol')) return;
      const media = [...source.children].find((node) =>
        node.matches('figure, .w-embed, [data-rt-embed-type]'));
      label.classList.add('stay-process__deliverables-label');
      label.textContent = 'Deliverables:';
      list.classList.add('stay-process__tags');
      const deliverables = document.createElement('div');
      deliverables.className = 'stay-process__deliverables-row';
      label.before(deliverables);
      deliverables.append(label, list);
      if (media) media.before(deliverables);
    });
    window.initCustomDropdowns?.($(group));
    sections.push(section);
  });
  if (!sections.length) return;
  main.classList.add('stay-process-experiment');
  rich.closest('.section').classList.add('stay-process-host');

});
