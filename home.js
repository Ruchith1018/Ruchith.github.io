// home.js — home page: rotating headline, copy-email buttons,
// compact career track, and the top-projects cards (from Projects/projects-data.js).

document.addEventListener('DOMContentLoaded', function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // ----- Count-up numbers: run from 0 to the shown value when first scrolled into view -----
  // Keeps any text around the number ("21 days", "1,234"). Skipped for reduced motion.
  function countUp(node, duration) {
    const text = node.dataset.final || node.textContent;
    const m = text.match(/^(\D*)([\d,]+)(.*)$/);
    if (!m) return;
    const target = parseInt(m[2].replace(/,/g, ''), 10);
    if (!target) return;
    const withCommas = m[2].includes(',');
    const fmt = n => (withCommas ? n.toLocaleString() : String(n));
    const start = performance.now();
    node.textContent = m[1] + fmt(0) + m[3];
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      node.textContent = m[1] + fmt(Math.round(target * eased)) + m[3];
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function countWhenVisible(nodes, duration) {
    if (reduce || !nodes.length) return;
    // start at 0 straight away so the final number never flashes before the count;
    // screen readers still get the real value
    nodes.forEach(n => {
      const m = n.textContent.match(/^(\D*)([\d,]+)(.*)$/);
      if (!m) return;
      n.setAttribute('aria-label', n.textContent);
      n.dataset.final = n.textContent;
      n.textContent = m[1] + '0' + m[3];
    });
    if (!('IntersectionObserver' in window)) { nodes.forEach(n => countUp(n, duration)); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        countUp(e.target, duration);
      });
    }, { threshold: 0.4 });
    nodes.forEach(n => io.observe(n));
  }

  countWhenVisible([...document.querySelectorAll('.impact-card strong')], 900);

  // ----- Rotating headline: types and deletes each phrase -----
  const word = document.getElementById('rotate-word');
  const PHRASES = ['production LLM pipelines', 'RAG systems', 'AI agents', 'ML models that ship'];
  if (word && !reduce) {
    let p = 0;
    let n = PHRASES[0].length;
    let deleting = true;
    const step = () => {
      const phrase = PHRASES[p];
      word.textContent = phrase.slice(0, n);
      let delay = deleting ? 35 : 70;
      if (deleting && n === 0) {
        deleting = false;
        p = (p + 1) % PHRASES.length;
        delay = 300;
      } else if (!deleting && n === PHRASES[p].length) {
        deleting = true;
        delay = 2200;
      }
      n += deleting ? -1 : 1;
      if (!deleting && n > PHRASES[p].length) n = PHRASES[p].length;
      setTimeout(step, delay);
    };
    setTimeout(step, 2500);
  }

  let relayout = () => {}; // set once the Ask me card can measure itself

  // ----- Ask me: pre-written answers, typed out on click -----
  // Edit the answers here. `links` point to the proof on the site.
  const ASK = [
    {
      q: 'What are you building now?',
      a: 'An AI agent for a client that turns SEC EDGAR filings for public and private companies into a complete financial model in the client\'s own template: income statement, balance sheet and cash-flow statement, forecasts, a revenue build and a DCF valuation.',
      links: [['See the role', 'Experience/experience.html#exp-sg-ds']],
    },
    {
      q: 'What\'s your strongest project?',
      a: 'A client-facing production pipeline I architected and still own. It tracks 200+ companies across 91 locations and classifies news into 55 risk categories (92% accuracy, 91% F1) for daily delivery. I cut latency 97% with prompt caching and inference cost 33%, and I fix client issues in under an hour.',
      links: [['See the role', 'Experience/experience.html#exp-sg-ds'], ['Public project: Meridian', 'Projects/projects.html#meridian-swot']],
    },
    {
      q: 'What\'s your stack?',
      a: 'AWS Bedrock (Claude), Python, LangChain and FastAPI day to day, with PostgreSQL and LanceDB for storage and retrieval. I work across LLM pipelines, RAG and AI agents, backed by classical ML and NLP.',
      links: [['Full skills list', 'Skills/skills.html']],
    },
    {
      q: 'How fast can you prototype?',
      a: "I have built three client-facing demos, each completed in a day. Two examples: an Ontology RAG demo for a regulatory banking client (48% fewer tokens and 40% faster retrieval than flat-vector retrieval) and a fraud-ring detection demo using ML anomaly detection across 40+ parameters.",
      links: [['See the demos', 'Experience/experience.html#exp-sg-ds']],
    },
    {
      q: 'Any research?',
      a: 'Yes. I\'m first author on a research manuscript comparing DQN and PPO for Space Invaders with an extended action space. Vertical movement lifted PPO\'s mean reward by 52%.',
      links: [['Read the write-up', 'Projects/projects.html#space-invaders-rl']],
    },
  ];

  const chips = document.getElementById('ask-chips');
  const askText = document.getElementById('ask-text');
  const askLinks = document.getElementById('ask-links');
  if (chips && askText && askLinks) {
    let typer = null;
    let current = 0;

    function renderAnswer(i) {
      const { a, links } = ASK[i];
      askText.textContent = a;
      askText.classList.remove('is-typing');
      askLinks.replaceChildren();
      links.forEach(([label, href]) => {
        const link = el('a', 'ask-link', label);
        link.href = href;
        link.appendChild(el('i', 'fas fa-arrow-right'));
        askLinks.appendChild(link);
      });
    }

    function showAnswer(i, animate) {
      clearTimeout(typer);
      chips.querySelectorAll('.ask-chip').forEach((c, idx) => {
        const on = idx === i;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', on);
      });
      current = i;
      if (!animate || reduce) { renderAnswer(i); return; }
      const { a } = ASK[i];
      askLinks.replaceChildren();
      askText.classList.add('is-typing');
      let n = 0;
      const tick = () => {
        n += 3;
        askText.textContent = a.slice(0, n);
        if (n >= a.length) renderAnswer(i);
        else typer = setTimeout(tick, 16);
      };
      tick();
    }

    // Keep the answer box one fixed height (the tallest answer) so switching
    // questions never moves anything. The Quick tour list is then capped to the
    // same card height and scrolls inside its box when it has more rows.
    function lockHeight() {
      const box = document.getElementById('ask-answer');
      const tour = document.getElementById('tour-steps');
      if (tour) tour.style.maxHeight = '0px';   // keep the tour list out of the measurement
      box.style.flexGrow = '0';                  // measure the natural height, not a stretched one
      box.style.minHeight = '';
      let tallest = 0;
      for (let i = 0; i < ASK.length; i++) {
        renderAnswer(i);
        tallest = Math.max(tallest, box.offsetHeight);
      }
      box.style.minHeight = tallest + 'px';
      renderAnswer(current);

      if (tour) {
        const gap = parseFloat(getComputedStyle(box.parentElement).rowGap) || 14;
        const askHeight = chips.offsetHeight + gap + tallest;
        const used = document.querySelector('.tour-lead').offsetHeight
          + document.getElementById('tour-chips').offsetHeight + 2 * gap;
        tour.style.maxHeight = Math.max(120, askHeight - used) + 'px';
      }
      box.style.flexGrow = '';
    }
    window.addEventListener('resize', () => { if (!typer) lockHeight(); });

    ASK.forEach((item, i) => {
      const chip = el('button', 'ask-chip', item.q);
      chip.type = 'button';
      chip.addEventListener('click', () => showAnswer(i, true));
      chips.appendChild(chip);
    });
    showAnswer(0, false); // start with an answer already showing
    lockHeight();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(lockHeight);
    relayout = lockHeight;
  }

  // ----- GitHub contributions (last 12 months) -----
  const GH_USER = 'Ruchith1018';
  const ghData = fetch(`https://github-contributions-api.jogruber.de/v4/${GH_USER}?y=last`)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(data => {
      const days = (data.contributions || []).filter(d => d && d.date);
      if (!days.length) throw new Error('no data');
      return { days, total: data.total && data.total.lastYear };
    });

  const ghBlock = document.getElementById('github-block');
  const ghChart = document.getElementById('gh-chart');
  if (ghBlock && ghChart) {
    ghData
      .then(({ days, total }) => { drawGithub(days, total); ghBlock.hidden = false; })
      .catch(() => { ghBlock.hidden = true; });
  }

  // ----- Tabs: Ask me / Quick tour -----
  const tabs = Array.from(document.querySelectorAll('.ask-tab'));
  const panels = Array.from(document.querySelectorAll('.ask-panel'));
  function selectTab(i, focus) {
    tabs.forEach((t, idx) => {
      const on = idx === i;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p, idx) => {
      const on = idx === i;
      p.classList.toggle('is-active', on);
      p.inert = !on;
    });
    if (focus) tabs[i].focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(i, false));
    t.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      selectTab((i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length, true);
    });
  });

  // ----- Quick tour: a curated path for 30 seconds / 2 minutes / 10 minutes -----
  const TOUR = [
    { label: '30 seconds', steps: [
      ['What I do today', 'Experience/experience.html#exp-sg-ds'],
      ['Download my CV', 'resume__.pdf'],
      ['Email me', 'mailto:bl.ruchith@gmail.com'],
    ] },
    { label: '2 minutes', steps: [
      ['My career timeline', 'Experience/experience.html'],
      ['Top project: Meridian SWOT Intelligence', 'Projects/projects.html#meridian-swot'],
      ['The skills behind it', 'Skills/skills.html'],
    ] },
    { label: '10 minutes', steps: [
      ['Full experience, role by role', 'Experience/experience.html'],
      ['Meridian write-up: architecture and design choices', 'Projects/projects.html#meridian-swot'],
      ['Research: DQN vs PPO for Space Invaders', 'Projects/projects.html#space-invaders-rl'],
      ['All 22 projects, filterable by domain', 'Projects/projects.html'],
      ['Degree, certificates and coursework', 'Academics/Academics.html'],
    ] },
  ];
  const tourChips = document.getElementById('tour-chips');
  const tourSteps = document.getElementById('tour-steps');
  if (tourChips && tourSteps) {
    function showTour(i) {
      tourChips.querySelectorAll('.ask-chip').forEach((c, idx) => {
        c.classList.toggle('is-active', idx === i);
        c.setAttribute('aria-pressed', idx === i);
      });
      tourSteps.replaceChildren();
      TOUR[i].steps.forEach(([label, href], n) => {
        const li = el('li');
        const a = el('a', 'tour-step');
        a.href = href;
        a.append(el('b', null, String(n + 1)), el('span', null, label), el('i', 'fas fa-arrow-right'));
        li.appendChild(a);
        tourSteps.appendChild(li);
      });
    }
    TOUR.forEach((t, i) => {
      const chip = el('button', 'ask-chip', t.label);
      chip.type = 'button';
      chip.addEventListener('click', () => showTour(i));
      tourChips.appendChild(chip);
    });
    showTour(1);
    relayout();
  }

  // ----- Skills tile: "+N more" = every skill on the Skills page minus the ones shown here -----
  const moreCount = document.getElementById('stack-more-count');
  if (moreCount && typeof SKILL_GROUPS !== 'undefined') {
    const total = SKILL_GROUPS.reduce((n, g) => n + g.skills.length, 0);
    const shown = document.querySelectorAll('.stack-tiles .stack-tile:not(.stack-more)').length;
    moreCount.textContent = '+' + (total - shown);
  }

  // ----- Copy email buttons -----
  document.querySelectorAll('.copy-email').forEach(btn => {
    btn.addEventListener('click', async () => {
      const label = btn.querySelector('span');
      const original = label.textContent;
      try {
        await navigator.clipboard.writeText(btn.dataset.email);
        label.textContent = 'Copied!';
      } catch (e) {
        window.location.href = `mailto:${btn.dataset.email}`;
        return;
      }
      btn.classList.add('is-copied');
      setTimeout(() => {
        label.textContent = original;
        btn.classList.remove('is-copied');
      }, 1800);
    });
  });

  // ----- Career track (same look as the Experience page) -----
  const ROLES = [
    { id: 'exp-chegg', role: 'Subject Matter Expert', company: 'Chegg', logo: 'Experience/chegg.jpg', start: '2023-11', end: '2025-09' },
    { id: 'exp-sg-intern', role: 'Data Science Intern', company: 'SG Analytics', logo: 'Experience/sganalytics.png', start: '2025-01', end: '2025-07' },
    { id: 'exp-sg-ds', role: 'Data Scientist', company: 'SG Analytics', logo: 'Experience/sganalytics.png', start: '2026-01', end: 'present' },
  ];
  const track = document.getElementById('track');
  if (track) {
    const now = new Date();
    const nowIndex = now.getFullYear() * 12 + now.getMonth();
    const toIndex = ym => {
      if (ym === 'present') return nowIndex;
      const [y, m] = ym.split('-').map(Number);
      return y * 12 + (m - 1);
    };
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthLabel = i => `${MONTHS[i % 12]} ${Math.floor(i / 12)}`;
    const durationText = months => {
      const y = Math.floor(months / 12), m = months % 12, parts = [];
      if (y) parts.push(`${y} yr${y > 1 ? 's' : ''}`);
      if (m) parts.push(`${m} mo${m > 1 ? 's' : ''}`);
      return parts.join(' ') || '1 mo';
    };

    const roles = ROLES.map(r => ({ ...r, s: toIndex(r.start), e: toIndex(r.end), current: r.end === 'present' }));
    const first = Math.min(...roles.map(r => r.s)) - 1;
    const last = nowIndex + 3;
    const pct = i => ((i - first) / (last - first)) * 100;
    const companies = [...new Set(roles.map(r => r.company))];

    const labels = el('div', 'track-labels');
    labels.appendChild(el('div', 'track-corner'));
    const chart = el('div', 'track-chart');
    const years = el('div', 'track-years');
    const bands = el('div', 'track-bands');
    for (let y = Math.floor(first / 12); y * 12 <= last; y++) {
      const from = Math.max(y * 12, first), to = Math.min((y + 1) * 12, last);
      if (to <= from) continue;
      const band = el('div', 'track-band' + (y % 2 ? ' is-odd' : ''));
      const yearLabel = el('span', 'track-year', String(y));
      [band, yearLabel].forEach(node => {
        node.style.left = pct(from) + '%';
        node.style.width = pct(to) - pct(from) + '%';
      });
      if (to - from < 4) yearLabel.classList.add('is-narrow');
      bands.appendChild(band);
      years.appendChild(yearLabel);
    }
    chart.append(bands, years);
    const today = el('div', 'track-today');
    today.style.left = pct(nowIndex + 1) + '%';
    today.appendChild(el('span', null, 'Today'));
    chart.appendChild(today);

    roles.forEach(r => {
      const href = `Experience/experience.html#${r.id}`;
      const label = el('a', 'track-label');
      label.href = href;
      const img = el('img');
      img.src = r.logo;
      img.alt = '';
      const text = el('div');
      text.append(el('strong', null, r.role), el('span', null, r.company));
      label.append(img, text);
      labels.appendChild(label);

      const lane = el('div', 'track-lane');
      const bar = el('a', `track-bar company-${companies.indexOf(r.company)}` + (r.current ? ' is-current' : ''));
      bar.href = href;
      bar.style.left = pct(r.s) + '%';
      bar.style.width = pct(r.e + 1) - pct(r.s) + '%';
      const sameYear = !r.current && Math.floor(r.s / 12) === Math.floor(r.e / 12);
      const range = r.current ? `${monthLabel(r.s)} – Now`
        : sameYear ? `${MONTHS[r.s % 12]} – ${monthLabel(r.e)}`
          : `${monthLabel(r.s)} – ${monthLabel(r.e)}`;
      bar.append(el('strong', null, range), el('span', null, durationText(r.e - r.s + 1)));
      lane.appendChild(bar);
      chart.appendChild(lane);
    });
    track.append(labels, chart);
  }

  function drawGithub(days, totalFromApi) {
    const SVGNS = 'http://www.w3.org/2000/svg';
    const svgEl = (tag, attrs) => {
      const n = document.createElementNS(SVGNS, tag);
      Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v));
      return n;
    };
    const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const ordinal = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');

    // ---- stats ----
    const total = totalFromApi || days.reduce((s, d) => s + d.count, 0);
    const active = days.filter(d => d.count > 0).length;
    let longest = 0, run = 0;
    days.forEach(d => { run = d.count > 0 ? run + 1 : 0; longest = Math.max(longest, run); });
    let current = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].count > 0) current++;
      else if (i === days.length - 1) continue; // today may not have activity yet
      else break;
    }
    const best = days.reduce((a, b) => (b.count > a.count ? b : a));
    const bestDate = parse(best.date);

    const stats = document.getElementById('gh-stats');
    [
      [total.toLocaleString(), 'contributions in the last year'],
      [active, 'active days'],
      [`${longest} days`, 'longest streak'],
      [best.count, `best day · ${ordinal(bestDate.getDate())} ${MONTHS[bestDate.getMonth()]}`],
    ].forEach(([n, l]) => {
      const card = el('div', 'gh-stat');
      card.append(el('strong', null, String(n)), el('span', null, l));
      stats.appendChild(card);
    });
    countWhenVisible([...stats.querySelectorAll('strong')], 1200);

    // ---- grid: one column per week, Sunday at the top ----
    const CELL = 13, GAP = 3, STEP = CELL + GAP, LEFT = 30, TOP = 20;
    const first = parse(days[0].date);
    const offset = first.getDay();
    const weeks = Math.ceil((days.length + offset) / 7);
    const width = LEFT + weeks * STEP;
    const height = TOP + 7 * STEP;
    const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, width: '100%', class: 'gh-svg' });

    [['Mon', 1], ['Wed', 3], ['Fri', 5]].forEach(([t, r]) => {
      const label = svgEl('text', { x: 0, y: TOP + r * STEP + CELL - 2, class: 'gh-label' });
      label.textContent = t;
      svg.appendChild(label);
    });

    let lastMonth = -1;
    let lastLabelCol = -10;
    const readout = document.getElementById('gh-readout');
    let selected = null;
    const describe = d => {
      const date = parse(d.date);
      const when = `${ordinal(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
      return d.count === 0 ? `No contributions on ${when}`
        : `${d.count} contribution${d.count > 1 ? 's' : ''} on ${when}`;
    };
    const select = (rect, d) => {
      if (selected) selected.classList.remove('is-selected');
      selected = rect;
      rect.classList.add('is-selected');
      readout.textContent = describe(d);
    };

    days.forEach((d, i) => {
      const slot = i + offset;
      const col = Math.floor(slot / 7);
      const row = slot % 7;
      const date = parse(d.date);

      // month label above the first week of each month, skipped if it would crowd the previous one
      if (row === 0 && date.getMonth() !== lastMonth) {
        lastMonth = date.getMonth();
        if (col - lastLabelCol >= 3 && col < weeks - 1) {
          lastLabelCol = col;
          const m = svgEl('text', { x: LEFT + col * STEP, y: 12, class: 'gh-label' });
          m.textContent = MONTHS[lastMonth];
          svg.appendChild(m);
        }
      }

      const rect = svgEl('rect', {
        x: LEFT + col * STEP, y: TOP + row * STEP, width: CELL, height: CELL, rx: 3,
        class: `gh-day l${Math.max(0, Math.min(4, d.level))}`, tabindex: d.count ? 0 : -1,
      });
      const title = svgEl('title');
      title.textContent = describe(d);
      rect.appendChild(title);
      ['mouseenter', 'focus', 'click'].forEach(ev => rect.addEventListener(ev, () => select(rect, d)));
      svg.appendChild(rect);
    });

    ghChart.appendChild(svg);
  }

  // ----- Top projects -----
  const top = document.getElementById('top-projects');
  if (top && typeof PROJECTS !== 'undefined') {
    const PICKS = [
      { id: 'job-automation-tracker', metric: '$0.005', label: 'per fact-checked, tailored resume' },
      { id: 'meridian-swot', metric: '206', label: 'analyst questions answered per report' },
      { id: 'space-invaders-rl', metric: '+52%', label: 'reward from vertical movement (PPO)' },
      { id: 'drone-detection', metric: '97.7%', label: 'test accuracy, InceptionV3 + attention' },
    ];
    const byId = new Map(PROJECTS.map(p => [p.id, p]));
    PICKS.forEach(pick => {
      const p = byId.get(pick.id);
      if (!p) return;
      const card = el('a', 'top-card');
      card.href = `Projects/projects.html#${p.id}`;

      const media = el('div', 'top-media');
      const img = el('img');
      img.src = 'Projects/' + p.cover;
      img.alt = '';
      img.loading = 'lazy';
      media.appendChild(img);
      const stat = el('div', 'top-stat');
      stat.append(el('strong', null, pick.metric), el('span', null, pick.label));
      media.appendChild(stat);

      const body = el('div', 'top-body');
      body.appendChild(el('span', 'top-meta', `${p.date} · ${p.kind}`));
      body.appendChild(el('h3', null, p.title));
      body.appendChild(el('p', null, p.summary));
      const tags = el('div', 'top-tags');
      p.domains.forEach(d => tags.appendChild(el('span', null, d)));
      body.appendChild(tags);
      body.appendChild(el('span', 'top-more', 'Read the write-up →'));

      card.append(media, body);
      top.appendChild(card);
    });
  }
});
