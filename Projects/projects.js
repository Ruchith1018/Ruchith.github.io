// projects.js — renders the Projects page from PROJECTS (projects-data.js):
// domain filter, featured card, tile grid and the detail popup.
// Detail popups are deep-linkable: projects.html#<project-id>

document.addEventListener('DOMContentLoaded', function () {
  const filterBar = document.getElementById('project-filters');
  const featuredEl = document.getElementById('featured-project');
  const grid = document.getElementById('project-grid');
  const modal = document.getElementById('project-modal');
  if (!grid || typeof PROJECTS === 'undefined') return;

  const DOMAIN_ORDER = ['GenAI & LLMs', 'NLP', 'Computer Vision', 'Deep Learning', 'Machine Learning',
    'Reinforcement Learning', 'Bioinformatics', 'Robotics & IoT', 'Full Stack', 'Signal Processing',
    'Systems & Programming'];

  const toTime = label => new Date('1 ' + label).getTime() || 0;
  const projects = PROJECTS.slice().sort((a, b) =>
    (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || toTime(b.date) - toTime(a.date));
  const byId = new Map(projects.map(p => [p.id, p]));

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function chips(list, className) {
    const wrap = el('div', className);
    list.forEach(item => wrap.appendChild(el('span', null, item)));
    return wrap;
  }

  function linkButtons(project, className) {
    const wrap = el('div', className);
    const defs = [
      ['github', 'fab fa-github', 'GitHub'],
      ['live', 'fas fa-external-link-alt', 'Live Site'],
      ['blog', 'fas fa-pen-nib', 'Read the Write-up'],
    ];
    defs.forEach(([key, icon, label]) => {
      const href = project.links && project.links[key];
      if (!href) return;
      const a = el('a', 'project-link');
      a.href = href;
      if (key !== 'blog') { a.target = '_blank'; a.rel = 'noopener'; }
      a.innerHTML = `<i class="${icon}"></i> `;
      a.appendChild(document.createTextNode(label));
      a.addEventListener('click', e => e.stopPropagation());
      wrap.appendChild(a);
    });
    return wrap;
  }

  // ----- Tiles -----
  function buildTile(project) {
    const tile = el('a', project.featured ? 'project-tile project-tile-featured' : 'project-tile');
    tile.href = '#' + project.id;
    tile.dataset.domains = project.domains.join('|');

    const imgWrap = el('div', 'project-tile-image');
    const img = el('img');
    img.src = project.cover;
    img.alt = '';
    img.loading = 'lazy';
    imgWrap.appendChild(img);

    const body = el('div', 'project-tile-content');
    if (project.featured) body.appendChild(el('span', 'featured-badge', 'Featured'));
    body.appendChild(el('div', 'project-tile-meta', `${project.date} · ${project.kind}`));
    body.appendChild(el('h3', null, project.title));
    body.appendChild(el('p', null, project.summary));
    body.appendChild(chips(project.domains, 'project-tags'));
    if (project.featured) body.appendChild(linkButtons(project, 'project-links'));
    body.appendChild(el('span', 'project-tile-more', 'View details →'));

    tile.append(imgWrap, body);
    return tile;
  }

  const tiles = projects.map(project => {
    const tile = buildTile(project);
    (project.featured ? featuredEl : grid).appendChild(tile);
    return tile;
  });

  // ----- Domain filter -----
  const counts = new Map();
  projects.forEach(p => p.domains.forEach(d => counts.set(d, (counts.get(d) || 0) + 1)));
  const domains = DOMAIN_ORDER.filter(d => counts.has(d))
    .concat([...counts.keys()].filter(d => !DOMAIN_ORDER.includes(d)));

  function makeFilter(value, label) {
    const btn = el('button', 'project-filter-btn', label);
    btn.type = 'button';
    btn.dataset.domain = value;
    btn.addEventListener('click', () => applyFilter(value));
    filterBar.appendChild(btn);
  }

  function applyFilter(domain) {
    filterBar.querySelectorAll('.project-filter-btn').forEach(btn => {
      const active = btn.dataset.domain === domain;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active);
    });
    tiles.forEach(tile => {
      const match = domain === 'all' || tile.dataset.domains.split('|').includes(domain);
      tile.classList.toggle('is-hidden', !match);
    });
    featuredEl.classList.toggle('is-hidden', !featuredEl.querySelector('.project-tile:not(.is-hidden)'));
  }

  makeFilter('all', `All (${projects.length})`);
  domains.forEach(d => makeFilter(d, `${d} (${counts.get(d)})`));
  applyFilter('all');

  // ----- Detail popup -----
  const cover = modal.querySelector('.pm-cover');
  const meta = modal.querySelector('.pm-meta');
  const title = modal.querySelector('.pm-title');
  const domainWrap = modal.querySelector('.pm-domains');
  const linksWrap = modal.querySelector('.pm-links');
  const skillsWrap = modal.querySelector('.pm-skills');
  const details = modal.querySelector('.pm-details');
  const scroller = modal.querySelector('.pm-scroll');
  let lastFocus = null;

  const credits = modal.querySelector('.pm-credits');

  // README extras: mermaid diagrams are drawn (the library loads only when a README has one),
  // and "#section" links scroll inside the popup instead of changing the page address
  let mermaidLoading = null;
  function loadMermaid() {
    if (window.mermaid) return Promise.resolve(window.mermaid);
    if (!mermaidLoading) {
      mermaidLoading = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
        s.onload = () => {
          window.mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict',
            fontFamily: 'Inter, sans-serif' });
          resolve(window.mermaid);
        };
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return mermaidLoading;
  }

  function headingSlug(text) {
    return text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
  }

  function prepareReadme(body) {
    const blocks = body.querySelectorAll('code.language-mermaid');
    if (blocks.length) {
      loadMermaid().then(mermaid => {
        blocks.forEach(code => {
          const holder = el('div', 'pm-mermaid');
          holder.textContent = code.textContent;
          code.closest('pre').replaceWith(holder);
        });
        return mermaid.run({ nodes: body.querySelectorAll('.pm-mermaid') });
      }).catch(() => { /* the diagram stays as readable text */ });
    }
    body.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      e.preventDefault();
      const id = a.getAttribute('href').slice(1);
      const target = [...body.querySelectorAll('h1,h2,h3,h4')].find(h => headingSlug(h.textContent) === id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Fetches the project's README from GitHub into `body`. With `dropTitle` the README's own
  // top-level heading is left out (the popup already shows the project name).
  function loadReadme(project, body, dropTitle) {
    body.innerHTML = '<p class="pm-loading">Loading README…</p>';
    fetch(project.readme.url)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(md => {
        const base = project.readme.base;
        md = md
          .replace(/^.*img\.shields\.io.*$/gm, '')                       // badge rows
          .replace(/!\[(.*?)\]\((?!https?:)(.*?)\)/g, `![$1](${base}$2)`)  // relative images
          .replace(/<img(.*?)src=["'](?!https?:)(.*?)["']/g, `<img$1src="${base}$2"`);
        if (dropTitle) md = md.replace(/^# .*\r?\n/, '');
        body.innerHTML = window.marked ? marked.parse(md) : `<pre>${md.replace(/</g, '&lt;')}</pre>`;
        prepareReadme(body);
      })
      .catch(() => {
        body.innerHTML = '';
        const msg = el('p', null, 'The README couldn\'t be loaded. ');
        const a = el('a', null, 'Read it on GitHub');
        a.href = project.links.github; a.target = '_blank'; a.rel = 'noopener';
        msg.appendChild(a);
        body.appendChild(msg);
      });
  }

  // README as an optional extra below the write-up, fetched the first time it's opened
  function buildReadmeSection(project) {
    const box = el('details', 'pm-readme');
    box.appendChild(el('summary', null, 'Full README from GitHub'));
    const body = el('div', 'pm-readme-body');
    box.appendChild(body);
    box.addEventListener('toggle', () => {
      if (!box.open || body.dataset.loaded) return;
      body.dataset.loaded = 'true';
      loadReadme(project, body, false);
    });
    return box;
  }

  function renderCredits(project) {
    credits.replaceChildren();
    const rows = [
      ['Team', project.team && project.team.join(', ')],
      ['Guide', project.guide],
      ['Course', project.course],
    ].filter(([, value]) => value);
    rows.forEach(([label, value]) => {
      const row = el('div');
      row.appendChild(el('dt', null, label));
      row.appendChild(el('dd', null, value));
      credits.appendChild(row);
    });
    credits.hidden = rows.length === 0;
  }

  function openProject(id) {
    const project = byId.get(id);
    if (!project) return;
    modal.dataset.current = id;
    cover.src = project.cover;
    cover.alt = '';
    meta.textContent = `${project.date} · ${project.kind}`;
    title.textContent = project.title;
    renderCredits(project);
    domainWrap.replaceChildren(...chips(project.domains).children);
    linksWrap.replaceChildren(...linkButtons(project).children);
    skillsWrap.replaceChildren(...chips(project.skills).children);

    if (project.readme && project.readme.inline) {
      // the README is the write-up
      details.innerHTML = '';
      const body = el('div', 'pm-readme-inline');
      details.appendChild(body);
      loadReadme(project, body, true);
    } else {
      details.innerHTML = project.details || `<p>${project.summary}</p>`;
      if (project.readme) details.appendChild(buildReadmeSection(project));
    }

    if (modal.hidden) lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('pm-open');
    scroller.scrollTop = 0;
    modal.querySelector('.pm-close').focus();
  }

  function closeProject() {
    if (modal.hidden) return;
    modal.hidden = true;
    delete modal.dataset.current;
    document.body.classList.remove('pm-open');
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus) lastFocus.focus();
  }

  function syncWithHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (byId.has(id)) openProject(id);
    else closeProject();
  }

  // In-README anchors (e.g. a table of contents) scroll within the popup
  // instead of changing the page hash, which would close it
  const slug = text => text.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  details.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    const target = decodeURIComponent(a.getAttribute('href').slice(1));
    const heading = Array.from(details.querySelectorAll('h1, h2, h3, h4'))
      .find(h => h.id === target || slug(h.textContent) === target);
    if (heading) heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  window.addEventListener('hashchange', syncWithHash);
  modal.querySelector('.pm-close').addEventListener('click', closeProject);
  modal.addEventListener('click', e => { if (e.target === modal) closeProject(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeProject(); });

  syncWithHash();
});
