// post.js — fills the "Related Posts" sidebar on every post.
// Reads the tiles from Blog/index.html, so that page stays the only list of posts.
// Ranking: most shared tags first, then newest. Falls back to latest posts.

// On desktop the article box fills the screen below the header (see post.css)
function setPostOffset() {
  const layout = document.querySelector('.post-layout');
  if (!layout) return;
  const bottomGap = 20;
  const top = layout.getBoundingClientRect().top + window.scrollY;
  document.documentElement.style.setProperty('--post-offset', `${top + bottomGap}px`);
}
window.addEventListener('load', setPostOffset);
window.addEventListener('resize', setPostOffset);

document.addEventListener('DOMContentLoaded', function () {
  setPostOffset();
  const list = document.getElementById('related-list');
  const heading = document.getElementById('related-heading');
  if (!list) return;

  const MAX_RELATED = 4;
  const indexUrl = new URL('../index.html', window.location.href);
  const normalize = path => path.replace(/index\.html$/, '');
  const currentPath = normalize(window.location.pathname);

  const tagsOf = el => (el.dataset.tags || '')
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(Boolean);

  function showEmpty(message) {
    list.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'related-empty';
    p.textContent = message;
    list.appendChild(p);
  }

  fetch(indexUrl)
    .then(response => {
      if (!response.ok) throw new Error(response.status);
      return response.text();
    })
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const currentTags = Array.from(document.querySelectorAll('.post-tags a'))
        .map(a => a.textContent.trim().toLowerCase());

      const posts = Array.from(doc.querySelectorAll('.blog-tile'))
        .map(tile => {
          const url = new URL(tile.getAttribute('href'), indexUrl);
          const img = tile.querySelector('img');
          const time = tile.querySelector('time[datetime]');
          return {
            url: url.href,
            path: normalize(url.pathname),
            title: tile.querySelector('h3')?.textContent.trim() || 'Untitled',
            image: img ? new URL(img.getAttribute('src'), indexUrl).href : '',
            dateLabel: time ? time.textContent.trim() : '',
            date: time ? new Date(time.getAttribute('datetime')).getTime() || 0 : 0,
            shared: tagsOf(tile).filter(tag => currentTags.includes(tag)).length,
          };
        })
        .filter(post => post.path !== currentPath);

      if (posts.length === 0) {
        showEmpty('More posts coming soon.');
        return;
      }

      const anyRelated = posts.some(post => post.shared > 0);
      if (!anyRelated && heading) heading.textContent = 'Latest Posts';

      posts
        .sort((a, b) => (b.shared - a.shared) || (b.date - a.date))
        .slice(0, MAX_RELATED)
        .forEach(post => {
          const card = document.createElement('a');
          card.className = 'related-card';
          card.href = post.url;

          const img = document.createElement('img');
          img.src = post.image;
          img.alt = '';
          img.loading = 'lazy';

          const text = document.createElement('div');
          const title = document.createElement('h3');
          title.textContent = post.title;
          const time = document.createElement('time');
          time.textContent = post.dateLabel;
          text.append(title, time);

          card.append(img, text);
          list.appendChild(card);
        });
    })
    .catch(() => {
      // fetch() is blocked when the page is opened as a local file
      showEmpty('Browse all posts on the blog page.');
    });
});

// ===== READ COUNT: this post's views, read from GoatCounter's public counter =====
// Needs "Allow adding visitor counts on your website" turned on in GoatCounter settings.
document.addEventListener('DOMContentLoaded', function () {
  const slot = document.getElementById('read-count');
  if (!slot) return;
  const path = window.location.pathname;
  fetch('https://ruchith.goatcounter.com/counter/' + encodeURIComponent(path) + '.json')
    .then(r => (r.ok ? r.json() : null))
    .then(d => {
      if (!d || !d.count) return;
      slot.textContent = d.count + (d.count === '1' ? ' read' : ' reads');
      slot.hidden = false;
    })
    .catch(() => {});
});

// ===== TABLES: wrap for sideways scrolling, keep short cells on one line =====
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.post-body table').forEach(table => {
    if (!table.parentElement.classList.contains('table-wrap')) {
      const wrap = document.createElement('div');
      wrap.className = 'table-wrap';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    }
    table.querySelectorAll('td').forEach(td => {
      const len = td.textContent.trim().length;
      if (len <= 28) td.classList.add('nw');
      else if (len > 70) td.classList.add('wide');
    });
  });
});

// ===== NEWSLETTER (Buttondown) =====
// A subscribe box at the end of the article (phones/tablets) and under Related Posts (desktop),
// plus a one-time popup the first time a browser opens each post.
// Set BUTTONDOWN_USER to the Buttondown username. Until it is set, nothing is shown.
const BUTTONDOWN_USER = 'ruchith';

document.addEventListener('DOMContentLoaded', function () {
  if (!BUTTONDOWN_USER) return;
  const main = document.querySelector('.post-container');
  if (!main) return;

  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
  };
  const SUBSCRIBED = 'nl-subscribed';

  function buildForm(idPrefix) {
    const wrap = document.createElement('div');
    wrap.className = 'nl-box';
    wrap.innerHTML = `
      <div class="nl-icon"><i class="fas fa-envelope-open-text"></i></div>
      <h3 class="nl-title">Get new posts by email</h3>
      <p class="nl-text">One short email when a new post is published. No spam, unsubscribe any time.</p>
      <form class="nl-form" action="https://buttondown.com/api/emails/embed-subscribe/${BUTTONDOWN_USER}"
            method="post" target="_blank">
        <label class="nl-label" for="${idPrefix}-email">Email address</label>
        <input id="${idPrefix}-email" class="nl-input" type="email" name="email" placeholder="you@example.com" required>
        <input type="hidden" name="tag" value="blog">
        <button class="nl-button" type="submit">Subscribe</button>
      </form>
      <p class="nl-thanks" hidden><i class="fas fa-check-circle"></i> Thanks! Check your inbox and confirm your email to finish subscribing.</p>`;
    const form = wrap.querySelector('form');
    form.addEventListener('submit', () => {
      store.set(SUBSCRIBED, '1');
      // let the browser send the form first, then swap in the thank-you message
      setTimeout(() => {
        document.querySelectorAll('.nl-form').forEach(f => { f.hidden = true; });
        document.querySelectorAll('.nl-thanks').forEach(t => { t.hidden = false; });
      }, 50);
      setTimeout(closePopup, 2500);
    });
    return wrap;
  }

  // 1) inline boxes: end of article (shown below 993px) and sidebar (shown from 993px)
  const end = main.querySelector('.post-end');
  const inline = buildForm('nl-inline');
  inline.classList.add('nl-inline');
  if (end) end.parentNode.insertBefore(inline, end); else main.appendChild(inline);

  const side = document.querySelector('.post-sidebar');
  if (side) {
    const box = buildForm('nl-side');
    box.classList.add('nl-side');
    side.appendChild(box);
  }

  // 2) one-time popup per post
  const seenKey = 'nl-seen:' + window.location.pathname.replace(/index\.html$/, '');
  let overlay = null, lastFocus = null;

  function closePopup() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.removeEventListener('keydown', onKey);
    if (lastFocus) lastFocus.focus();
  }
  function onKey(e) { if (e.key === 'Escape') closePopup(); }

  function openPopup() {
    if (overlay) return;
    store.set(seenKey, '1');
    lastFocus = document.activeElement;
    overlay = document.createElement('div');
    overlay.className = 'nl-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'nl-popup-title');
    const card = buildForm('nl-popup');
    card.classList.add('nl-popup');
    card.querySelector('.nl-title').id = 'nl-popup-title';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'nl-close';
    close.setAttribute('aria-label', 'Close');
    close.innerHTML = '<i class="fas fa-times"></i>';
    close.addEventListener('click', closePopup);
    const later = document.createElement('button');
    later.type = 'button';
    later.className = 'nl-later';
    later.textContent = 'No thanks';
    later.addEventListener('click', closePopup);
    card.prepend(close);
    card.appendChild(later);
    overlay.appendChild(card);
    overlay.addEventListener('click', e => { if (e.target === overlay) closePopup(); });
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey);
    card.querySelector('.nl-input').focus({ preventScroll: true });
  }

  if (!store.get(SUBSCRIBED) && !store.get(seenKey)) {
    // give the reader a moment with the article before asking
    setTimeout(openPopup, 4000);
  }
});
