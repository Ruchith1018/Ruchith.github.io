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

  // newsletter images live in Blog/assets/ (Fluent Emoji, MIT licence); resolved from this script's own URL
  const NL_ASSETS = new URL('assets/', document.querySelector('script[src$="post.js"]').src).href;

  // Drawn illustration for the popup: a laptop sending a letter, in the site's yellow
  const NL_ART = `
    <svg viewBox="0 0 320 240" role="img" aria-hidden="true" focusable="false">
      <circle cx="160" cy="126" r="100" fill="#fef3c7"/>
      <g fill="#facc15" opacity=".9"><circle cx="58" cy="62" r="5"/><circle cx="270" cy="70" r="4"/><circle cx="282" cy="176" r="6"/><circle cx="44" cy="180" r="4"/></g>
      <rect x="70" y="92" width="150" height="98" rx="8" fill="#fff" stroke="#16181d" stroke-width="5"/>
      <rect x="84" y="106" width="122" height="70" rx="4" fill="#f4f4f5"/>
      <rect x="92" y="114" width="54" height="8" rx="4" fill="#d4d4d8"/>
      <rect x="92" y="130" width="96" height="6" rx="3" fill="#e4e4e7"/>
      <rect x="92" y="142" width="80" height="6" rx="3" fill="#e4e4e7"/>
      <rect x="92" y="154" width="88" height="6" rx="3" fill="#e4e4e7"/>
      <path d="M52 190h186l-14 16H66z" fill="#16181d"/>
      <g transform="rotate(-12 222 88)">
        <rect x="176" y="58" width="96" height="62" rx="8" fill="#facc15" stroke="#16181d" stroke-width="5"/>
        <path d="M180 64l44 34 44-34" fill="none" stroke="#16181d" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>
      </g>
      <g fill="none" stroke="#16181d" stroke-width="4" stroke-linecap="round"><path d="M248 30l10-14M268 42l16-6M232 26l-2-16"/></g>
      <g transform="translate(96 196)"><rect width="34" height="26" rx="6" fill="#fff" stroke="#16181d" stroke-width="4"/><path d="M8 13l6 6 12-12" fill="none" stroke="#16a34a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>
    </svg>`;

  function buildForm(idPrefix, withArt) {
    const wrap = document.createElement('div');
    wrap.className = 'nl-box' + (withArt ? ' nl-has-art' : ' nl-compact');
    const formHtml = `
        <form class="nl-form" action="https://buttondown.com/api/emails/embed-subscribe/${BUTTONDOWN_USER}"
              method="post" target="nl-sink">
          <label class="nl-label" for="${idPrefix}-email">Email address</label>
          <div class="nl-field">
            <i class="far fa-envelope" aria-hidden="true"></i>
            <input id="${idPrefix}-email" class="nl-input" type="email" name="email" placeholder="Your email" autocomplete="email" required>
          </div>
          <input type="hidden" name="tag" value="blog">
          <button class="nl-button" type="submit">Subscribe</button>
        </form>
        <p class="nl-fine">No spam. Unsubscribe any time.</p>
        <p class="nl-thanks" hidden><i class="fas fa-check-circle"></i> Thanks! Check your inbox and click the confirmation link to finish subscribing.</p>`;
    wrap.innerHTML = withArt ? `
      <div class="nl-art">${NL_ART}</div>
      <div class="nl-content">
        <h3 class="nl-title">Subscribe to my newsletter</h3>
        <p class="nl-text">Get each new post on LLMs, AI evaluation and ML engineering in your inbox. One email per post.</p>
        ${formHtml}
      </div>` : `
      <div class="nl-head">
        <span class="nl-ico" aria-hidden="true"><img src="${NL_ASSETS}newsletter.svg" alt="" width="30" height="30"></span>
        <div>
          <span class="nl-kicker">Newsletter</span>
          <h3 class="nl-title">Join my newsletter</h3>
        </div>
      </div>
      <div class="nl-content">
        <p class="nl-text">New posts on LLMs, AI evaluation and ML engineering, straight to your inbox.</p>
        ${formHtml}
      </div>`;
    const form = wrap.querySelector('form');
    form.addEventListener('submit', () => {
      // sent to Buttondown in the background (hidden frame): no new window, no redirect
      const button = form.querySelector('.nl-button');
      button.disabled = true;
      button.textContent = 'Subscribing…';
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        store.set(SUBSCRIBED, '1');
        document.querySelectorAll('.nl-form, .nl-fine').forEach(x => { x.hidden = true; });
        document.querySelectorAll('.nl-thanks').forEach(x => { x.hidden = false; });
        if (overlay) setTimeout(closePopup, 3000);
      };
      sink.addEventListener('load', finish, { once: true });
      setTimeout(finish, 4000);
    });
    return wrap;
  }

  // hidden frame the forms post into, so the page never navigates
  const sink = document.createElement('iframe');
  sink.name = 'nl-sink';
  sink.title = 'Newsletter sign-up';
  sink.hidden = true;
  sink.setAttribute('aria-hidden', 'true');
  document.body.appendChild(sink);

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
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    lastFocus = null;
  }
  function onKey(e) { if (e.key === 'Escape') closePopup(); }

  function closeButton() {
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'nl-close';
    close.setAttribute('aria-label', 'Close');
    close.innerHTML = '<i class="fas fa-times"></i>';
    close.addEventListener('click', closePopup);
    return close;
  }

  function showOverlay(card, labelId, focusEl) {
    if (overlay) {
      // swap one popup for another without jumping focus back to the page
      overlay.remove();
      overlay = null;
      document.removeEventListener('keydown', onKey);
    } else {
      lastFocus = document.activeElement;
    }
    overlay = document.createElement('div');
    overlay.className = 'nl-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', labelId);
    card.prepend(closeButton());
    overlay.appendChild(card);
    overlay.addEventListener('click', e => { if (e.target === overlay) closePopup(); });
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey);
    if (focusEl) focusEl.focus({ preventScroll: true });
  }

  function openPopup() {
    if (overlay) return;
    store.set(seenKey, '1');
    const card = buildForm('nl-popup', true);
    card.classList.add('nl-popup');
    card.querySelector('.nl-title').id = 'nl-popup-title';
    const later = document.createElement('button');
    later.type = 'button';
    later.className = 'nl-later';
    later.textContent = 'Maybe later';
    later.addEventListener('click', closePopup);
    card.querySelector('.nl-content').appendChild(later);
    showOverlay(card, 'nl-popup-title', card.querySelector('.nl-input'));
  }

  if (!store.get(SUBSCRIBED) && !store.get(seenKey)) {
    // give the reader a moment with the article before asking
    setTimeout(openPopup, 4000);
  }
});
