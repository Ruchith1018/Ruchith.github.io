// blog.js — sorts tiles newest-first and builds the tag filter

document.addEventListener('DOMContentLoaded', function () {
  const grid = document.getElementById('blog-grid');
  const filterBar = document.getElementById('blog-filters');
  const empty = document.getElementById('blog-empty');
  const tiles = Array.from(grid.querySelectorAll('.blog-tile'));

  if (tiles.length === 0) {
    grid.style.display = 'none';
    empty.hidden = false;
    return;
  }

  const getDate = tile => {
    const time = tile.querySelector('time[datetime]');
    return time ? new Date(time.getAttribute('datetime')).getTime() || 0 : 0;
  };
  const getTags = tile => (tile.dataset.tags || '')
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);

  // Newest first, regardless of the order tiles are written in
  tiles.sort((a, b) => getDate(b) - getDate(a)).forEach(tile => grid.appendChild(tile));

  // Unique tags, compared case-insensitively
  const tagMap = new Map();
  tiles.forEach(tile => getTags(tile).forEach(tag => {
    const key = tag.toLowerCase();
    if (!tagMap.has(key)) tagMap.set(key, tag);
  }));
  const tags = Array.from(tagMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));

  function makeButton(key, label) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'blog-filter-btn';
    btn.dataset.tag = key;
    btn.textContent = label;
    btn.addEventListener('click', () => applyFilter(key));
    filterBar.appendChild(btn);
  }

  function applyFilter(key) {
    if (key !== 'all' && !tagMap.has(key)) key = 'all';

    filterBar.querySelectorAll('.blog-filter-btn').forEach(btn => {
      const isActive = btn.dataset.tag === key;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive);
    });

    tiles.forEach(tile => {
      const match = key === 'all' || getTags(tile).some(tag => tag.toLowerCase() === key);
      tile.classList.toggle('is-hidden', !match);
    });

    // Keep the filter in the URL so tag links from posts land pre-filtered
    const url = new URL(window.location.href);
    if (key === 'all') url.searchParams.delete('tag');
    else url.searchParams.set('tag', key);
    history.replaceState(null, '', url);
  }

  if (tags.length > 0) {
    makeButton('all', 'All');
    tags.forEach(([key, label]) => makeButton(key, label));
  }

  const initial = new URLSearchParams(window.location.search).get('tag');
  applyFilter(initial ? initial.toLowerCase() : 'all');
});
