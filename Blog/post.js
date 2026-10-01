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
