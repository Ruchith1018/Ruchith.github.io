// script.js

// ===== MOBILE SWITCH =====
// true  = the full site works on phones (Menu button, phone layouts on every page)
// false = the previous version: phones see a DESKTOP ONLY screen on every page except the blog
const MOBILE_SITE = false;

if (!MOBILE_SITE) {
  document.documentElement.classList.add('mobile-off');
  if (!document.body.classList.contains('allow-mobile') && !document.getElementById('mobile-overlay')) {
    const avatar = document.querySelector('.brand-avatar');
    const blogLink = document.querySelector('.nav-blog a');
    const overlay = document.createElement('div');
    overlay.id = 'mobile-overlay';
    overlay.innerHTML =
      '<div class="mobile-profile-pic"><img alt="Ruchith Balam"></div>' +
      '<div class="mobile-overlay-box"><div class="mobile-overlay-content">' +
      '<i class="fas fa-desktop"></i><h1>DESKTOP ONLY</h1>' +
      '<p>This experience is optimized for larger screens. Please switch to a desktop or laptop to explore the portfolio.</p>' +
      '<div class="warning-stripes"></div>' +
      '<a class="mobile-blog-btn"><i class="fas fa-pen-nib"></i> Read My Blog</a>' +
      '</div></div>';
    overlay.querySelector('img').src = avatar ? avatar.getAttribute('src') : 'Profile_Pic.jpeg';
    overlay.querySelector('a').href = blogLink ? blogLink.getAttribute('href') : 'Blog/index.html';
    document.body.prepend(overlay);
  }
}

// ===== PRELOADER DISMISSAL =====
window.addEventListener('load', function () {
  const minLoadingTime = 800; // at least 0.8s for smooth transition
  const startTime = window.performance.timing.navigationStart;
  const currentTime = new Date().getTime();
  const elapsedTime = currentTime - startTime;

  const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

  if (document.documentElement.classList.contains('skip-loader')) {
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
    return;
  }

  setTimeout(() => {
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
  }, remainingTime);
});


document.addEventListener('DOMContentLoaded', function () {
  console.log("Script loaded - initializing features...");

  // ===== MOBILE NAVIGATION TOGGLE =====
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // Close the menu when any link is clicked
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  // ===== RANDOM DATA SCIENCE QUOTES =====
  const quotes = [
    {
      text: "It's easy to lie with statistics. It's hard to tell the truth without statistics.",
      author: "Andrejs Dunkels"
    },
    {
      text: "The goal is to turn data into information, and information into insight.",
      author: "Carly Fiorina"
    },
    {
      text: "Data is the new oil. It's valuable, but if unrefined it cannot really be used.",
      author: "Clive Humby"
    },
    {
      text: "Without big data, you are blind and deaf and in the middle of a freeway.",
      author: "Geoffrey Moore"
    },
    {
      text: "Torture the data, and it will confess to anything.",
      author: "Ronald Coase"
    },
    {
      text: "In God we trust, all others must bring data.",
      author: "W. Edwards Deming"
    },
    {
      text: "Data scientist is the sexiest job of the 21st century.",
      author: "Harvard Business Review"
    }
  ];

  const quoteText = document.querySelector(".quote-text");
  const quoteAuthor = document.querySelector(".quote-author");

  if (quoteText && quoteAuthor) {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];

    // Inject the content immediately to avoid "flash" of old content
    quoteText.textContent = randomQuote.text;
    quoteAuthor.textContent = `— ${randomQuote.author}`;

    console.log("New quote injected:", randomQuote.author);
  }

  // GitHub contributions chart is drawn by home.js
});

// ===== PARALLAX EFFECT FOR FLOATING CODE SNIPPETS =====
document.addEventListener('mousemove', (e) => {
  const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
  const moveY = (e.clientY - window.innerHeight / 2) * 0.01;

  document.querySelectorAll('.floating-code').forEach(el => {
    el.style.transform = `translate(${moveX}px, ${moveY}px)`;
  });
});

// ===== DOCUMENTATION MODAL LOGIC =====
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('doc-modal');
  const btn = document.getElementById('view-doc-btn');
  const closeBtn = document.querySelector('.close-modal');
  const content = document.getElementById('markdown-content');

  if (modal && btn && closeBtn && content) {
    btn.onclick = function() {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden'; // Prevent scrolling
      
      // Fetch README from GitHub
      const readmeUrl = 'https://raw.githubusercontent.com/Ruchith1018/SWOT_ANALYSIS/master/README.md';
      
      fetch(readmeUrl)
        .then(response => {
          if (!response.ok) throw new Error('Failed to load documentation');
          return response.text();
        })
        .then(text => {
          // Pre-process markdown to fix relative image paths
          const rawBaseUrl = 'https://raw.githubusercontent.com/Ruchith1018/SWOT_ANALYSIS/master/';
          // Replace relative image paths (e.g., assets/image.png) with absolute URLs
          let processedText = text.replace(/!\[(.*?)\]\((?!http)(.*?)\)/g, (match, alt, path) => {
            return `![${alt}](${rawBaseUrl}${path})`;
          });
          
          // Also handle HTML <img> tags with relative sources
          processedText = processedText.replace(/<img(.*?)src=["'](?!http)(.*?)["'](.*?)>/g, (match, before, path, after) => {
            return `<img${before}src="${rawBaseUrl}${path}"${after}>`;
          });

          // Use marked to render the markdown
          content.innerHTML = marked.parse(processedText);
          content.classList.add('markdown-body'); // Ensure GitHub style is applied
        })
        .catch(err => {
          content.innerHTML = `<div class="error-msg" style="text-align:center; padding: 50px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 20px;"></i>
            <p>Error loading documentation: ${err.message}</p>
            <p>Please check the repository directly on <a href="https://github.com/Ruchith1018/SWOT_ANALYSIS" target="_blank">GitHub</a>.</p>
          </div>`;
        });
    }

    closeBtn.onclick = function() {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto'; // Restore scrolling
    }

    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    }
  }
});





// ===== TOP BAR: the bar itself is plain HTML on every page; this only switches on the pinned look =====
document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('header');
  if (!header) return;
  function update() {
    const y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle('is-scrolled', y > 24);
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
});

// ===== PHONE MENU: a Menu button that opens the nav links as a dropdown (CSS shows it below 768px) =====
document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('header');
  const nav = header && header.querySelector('nav');
  const links = nav && nav.querySelector('.nav-links');
  if (!links || nav.querySelector('.nav-toggle')) return;

  links.id = links.id || 'site-nav-links';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-toggle';
  btn.setAttribute('aria-controls', links.id);
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i><span>Menu</span>';
  nav.insertBefore(btn, links);

  function setOpen(open) {
    header.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('i').className = 'fas ' + (open ? 'fa-xmark' : 'fa-bars');
    btn.querySelector('span').textContent = open ? 'Close' : 'Menu';
  }
  btn.addEventListener('click', function () {
    setOpen(!header.classList.contains('menu-open'));
  });
  document.addEventListener('click', function (e) {
    if (header.classList.contains('menu-open') && !header.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('menu-open')) { setOpen(false); btn.focus(); }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) setOpen(false);
  });
});

// ===== ANALYTICS: count CV downloads as an event (works for links added later too) =====
document.addEventListener('click', function (e) {
  const link = e.target.closest && e.target.closest('a[href$="resume__.pdf"]');
  if (!link || !window.goatcounter || !window.goatcounter.count) return;
  window.goatcounter.count({ path: 'cv-download', title: 'CV download', event: true });
});
