// skills.js — renders the Skills page from SKILL_GROUPS (skills-data.js).
// Clicking a skill shows where it's been used, linking to Projects and Experience.
// Project titles come from ../Projects/projects-data.js so the two pages stay in sync.

document.addEventListener('DOMContentLoaded', function () {
  const coreWrap = document.getElementById('core-stack');
  const groupsWrap = document.getElementById('skill-groups');
  if (!groupsWrap || typeof SKILL_GROUPS === 'undefined') return;

  const projectTitles = new Map(
    (typeof PROJECTS !== 'undefined' ? PROJECTS : []).map(p => [p.id, p.title]));

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // 'p:<id>' / 'x:<id>' / {label, href} → {label, href, type}
  function resolveUse(use) {
    if (typeof use === 'object') return { label: use.label, href: use.href, type: 'link' };
    const [kind, id] = use.split(':');
    if (kind === 'x') {
      return { label: EXPERIENCE[id] || id, href: `../Experience/experience.html#${id}`, type: 'work' };
    }
    return { label: projectTitles.get(id) || id, href: `../Projects/projects.html#${id}`, type: 'project' };
  }

  function iconFor(skill) {
    if (skill.img) {
      const img = el('img');
      img.src = skill.img;
      img.alt = '';
      return img;
    }
    return el('i', skill.icon || 'fas fa-code');
  }

  const cards = [];

  SKILL_GROUPS.forEach((group, gi) => {
    const section = el('section', 'skill-group');
    section.appendChild(el('h2', null, group.title));

    const grid = el('div', 'skill-grid');
    const panel = el('div', 'skill-usage');
    panel.setAttribute('aria-live', 'polite');
    const hint = el('p', 'skill-usage-hint', 'Select a skill to see where I\'ve used it.');
    panel.appendChild(hint);

    group.skills.forEach((skill, si) => {
      const uses = (skill.uses || []).map(resolveUse);
      const card = el('button', 'skill-card');
      card.type = 'button';
      card.id = `skill-${gi}-${si}`;
      card.appendChild(iconFor(skill));
      card.appendChild(el('span', 'skill-name', skill.name));
      if (uses.length) {
        card.appendChild(el('span', 'skill-count', String(uses.length)));
        card.title = `Used in ${uses.length} place${uses.length > 1 ? 's' : ''}`;
      } else {
        card.classList.add('skill-card-plain');
        card.disabled = true;
      }

      card.addEventListener('click', () => {
        const wasActive = card.classList.contains('active');
        grid.querySelectorAll('.skill-card.active').forEach(c => c.classList.remove('active'));
        if (wasActive) {
          panel.replaceChildren(hint);
          return;
        }
        card.classList.add('active');
        showUsage(panel, skill, uses);
      });

      grid.appendChild(card);
      cards.push({ skill, card });
    });

    section.append(grid, panel);
    groupsWrap.appendChild(section);
  });

  function showUsage(panel, skill, uses) {
    panel.replaceChildren();
    panel.appendChild(el('h3', null, skill.name));
    if (skill.note) panel.appendChild(el('p', 'skill-note', skill.note));

    const list = el('div', 'skill-links');
    const icons = { work: 'fas fa-briefcase', project: 'fas fa-folder-open', link: 'fas fa-external-link-alt' };
    uses.forEach(use => {
      const a = el('a', `skill-link skill-link-${use.type}`);
      a.href = use.href;
      if (use.type === 'link' && /^https?:/.test(use.href)) { a.target = '_blank'; a.rel = 'noopener'; }
      a.appendChild(el('i', icons[use.type]));
      a.appendChild(document.createTextNode(' ' + use.label));
      list.appendChild(a);
    });
    panel.appendChild(list);
  }

  // Core stack strip: shortcuts that open the matching card
  cards.filter(({ skill }) => skill.core).forEach(({ skill, card }) => {
    const tile = el('button', 'core-tile');
    tile.type = 'button';
    tile.appendChild(iconFor(skill));
    tile.appendChild(el('span', null, skill.name));
    tile.addEventListener('click', () => {
      if (!card.classList.contains('active')) card.click();
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.focus({ preventScroll: true });
    });
    coreWrap.appendChild(tile);
  });
});
