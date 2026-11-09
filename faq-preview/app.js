const input = document.querySelector('#search');
const groups = [...document.querySelectorAll('.faq-group')];
const categories = [...document.querySelectorAll('.faq-category')];
const status = document.querySelector('.faq-results');
const defaultTopic = 'About Halo Lab';
let selected = defaultTopic;

function render() {
  const query = input.value.trim().toLowerCase();
  let count = 0;
  for (const group of groups) {
    let matches = 0;
    for (const row of group.querySelectorAll('details')) {
      const match = group.dataset.category === selected && (!query || row.textContent.toLowerCase().includes(query));
      row.hidden = !match;
      if (match) matches++;
    }
    group.hidden = matches === 0;
    count += matches;
  }
  categories.forEach(button => {
    const active = button.dataset.topic === selected;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  status.textContent = query ? `${count} ${count === 1 ? 'answer' : 'answers'} in ${selected} for “${input.value.trim()}”` : '';
  document.querySelector('.faq-empty').hidden = count !== 0;
}
function select(topic, keepHash = false) {
  selected = topic;
  const url = new URL(location.href);
  if (topic === defaultTopic) url.searchParams.delete('topic');
  else url.searchParams.set('topic', topic);
  if (!keepHash) url.hash = '';
  history.replaceState(null, '', url);
  render();
}
function revealAnchor() {
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const row = document.getElementById(id);
  if (!row?.matches('.faq-group details')) return;
  input.value = '';
  select(row.closest('.faq-group').dataset.category, true);
  row.open = true;
  requestAnimationFrame(() => row.scrollIntoView({block: 'start'}));
}
categories.forEach(button => button.addEventListener('click', () => select(button.dataset.topic)));
input.addEventListener('input', render);
document.querySelector('.faq-search').addEventListener('submit', event => {
  event.preventDefault();
  document.querySelector('#questions').scrollIntoView({block: 'start'});
});
document.querySelector('.reset').addEventListener('click', () => {
  input.value = '';
  select(defaultTopic);
  input.focus();
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) {
    event.preventDefault();
    input.focus();
  }
  if (event.key === 'Escape' && document.activeElement === input) {
    input.value = '';
    render();
  }
});
const initial = new URLSearchParams(location.search).get('topic');
if (categories.some(button => button.dataset.topic === initial)) selected = initial;
window.addEventListener('hashchange', revealAnchor);
render();
revealAnchor();
