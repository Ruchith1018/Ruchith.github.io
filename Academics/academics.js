// academics.js — builds the coursework bookshelf: one shelf per B.Tech year,
// one book spine per course project (from ../Projects/projects-data.js).

document.addEventListener('DOMContentLoaded', function () {
  const shelvesWrap = document.getElementById('shelves');
  if (!shelvesWrap || typeof PROJECTS === 'undefined') return;

  // Academic years run August to July
  const YEARS = [
    { label: 'Year 1', span: '2021–22', start: '2021-08-01', end: '2022-07-31' },
    { label: 'Year 2', span: '2022–23', start: '2022-08-01', end: '2023-07-31' },
    { label: 'Year 3', span: '2023–24', start: '2023-08-01', end: '2024-07-31' },
    { label: 'Year 4', span: '2024–25', start: '2024-08-01', end: '2025-07-31' },
  ];

  const toTime = label => new Date('1 ' + label).getTime() || 0;
  const coursework = PROJECTS
    .filter(p => p.kind && p.kind.startsWith('Course Project'))
    .sort((a, b) => toTime(a.date) - toTime(b.date));

  const count = document.getElementById('project-count');
  if (count) count.textContent = coursework.length;

  // Spine style from the project's domains
  function spineClass(domains) {
    if (domains.includes('Robotics & IoT')) return 'book-robo';
    if (domains.includes('Bioinformatics') || domains.includes('Signal Processing')) return 'book-bio';
    if (domains.includes('Systems & Programming')) return 'book-sys';
    return 'book-ai';
  }

  // Stable "random" height per book so the shelf looks natural but never reshuffles
  function spineHeight(id) {
    let h = 0;
    for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return 205 + (h % 5) * 11;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function makeBook({ title, sub, href, cls, height }) {
    const book = el('a', `book ${cls}`);
    book.href = href;
    book.style.height = height + 'px';
    book.setAttribute('aria-label', sub ? `${title} (${sub})` : title);
    book.title = sub ? `${title} · ${sub}` : title;
    book.appendChild(el('span', 'book-band'));
    book.appendChild(el('span', 'book-title', title));
    book.appendChild(el('span', 'book-band book-band-bottom'));
    return book;
  }

  YEARS.forEach(year => {
    const from = new Date(year.start).getTime();
    const to = new Date(year.end).getTime();
    const items = coursework.filter(p => toTime(p.date) >= from && toTime(p.date) <= to);

    const shelf = el('div', 'shelf');
    const label = el('div', 'shelf-label');
    label.appendChild(el('strong', null, year.label));
    label.appendChild(el('span', null, year.span));

    const books = el('div', 'shelf-books');
    items.forEach(p => books.appendChild(makeBook({
      title: p.title,
      sub: p.course || p.date,
      href: `../Projects/projects.html#${p.id}`,
      cls: spineClass(p.domains),
      height: spineHeight(p.id),
    })));

    // Final year: the internship took the place of course projects
    if (year.label === 'Year 4') {
      books.appendChild(makeBook({
        title: 'Data Science Internship · SG Analytics',
        sub: 'Final semester',
        href: '../Experience/experience.html#exp-sg-intern',
        cls: 'book-work',
        height: 240,
      }));
    }

    label.appendChild(el('em', null,
      items.length ? `${items.length} project${items.length > 1 ? 's' : ''}` : 'Internship'));

    shelf.append(label, books);
    shelvesWrap.appendChild(shelf);
  });
});
