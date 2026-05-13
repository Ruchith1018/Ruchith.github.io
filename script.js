// script.js

// ===== INTERACTIVE NEURAL NETWORK BACKGROUND =====
(function () {
  const canvas = document.getElementById('neural-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // --- Configuration ---
  const NODE_COUNT = 55;
  const CONNECTION_DISTANCE = 180;
  const NODE_MIN_RADIUS = 3;
  const NODE_MAX_RADIUS = 9;
  const GRAB_RADIUS = 28; // how close the cursor must be to grab a node
  const SPRING_STIFFNESS = 0.04; // lower = softer elastic
  const DAMPING = 0.82; // velocity damping (0-1, higher = less bounce)
  const IDLE_DRIFT_SPEED = 0.15; // subtle idle movement amplitude
  const LINE_MAX_ALPHA = 0.25;

  function getThemeColors() {
    return {
      node: 'rgba(0, 0, 0, 0.55)',
      nodeHighlight: 'rgba(0, 0, 0, 0.85)',
      line: [0, 0, 0],
      glow: 'rgba(0, 0, 0, 0.15)'
    };
  }

  let connections = []; // pre-computed pairs [i, j] that are always connected

  let nodes = [];
  let animId = null;
  let dragging = null; // index of node being dragged
  let mouseX = -9999;
  let mouseY = -9999;
  let mouseDown = false;
  let canvasW, canvasH;

  // --- Resize handler ---
  function resize() {
    canvasW = window.innerWidth;
    canvasH = window.innerHeight;
    canvas.width = canvasW;
    canvas.height = canvasH;
    if (nodes.length === 0) initNodes();
  }

  // --- Generate non-uniform node positions (Poisson-ish scatter) ---
  function initNodes() {
    nodes = [];
    const padding = 40;

    for (let i = 0; i < NODE_COUNT; i++) {
      // Use rejection sampling to avoid perfectly even grids
      let x, y, tooClose;
      let attempts = 0;
      const minDist = 60 + Math.random() * 40; // variable minimum spacing

      do {
        x = padding + Math.random() * (canvasW - padding * 2);
        y = padding + Math.random() * (canvasH - padding * 2);
        tooClose = false;
        for (let j = 0; j < nodes.length; j++) {
          const dx = nodes[j].homeX - x;
          const dy = nodes[j].homeY - y;
          if (Math.sqrt(dx * dx + dy * dy) < minDist) {
            tooClose = true;
            break;
          }
        }
        attempts++;
      } while (tooClose && attempts < 30);

      const radius = NODE_MIN_RADIUS + Math.random() * (NODE_MAX_RADIUS - NODE_MIN_RADIUS);
      // Add slight irregularity to radius via a "weight" factor
      const weight = 0.5 + Math.random() * 1.0; // affects connection thickness

      nodes.push({
        homeX: x,
        homeY: y,
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        radius: radius,
        weight: weight,
        phase: Math.random() * Math.PI * 2, // for idle animation
        driftSpeedX: (Math.random() - 0.5) * 0.3,
        driftSpeedY: (Math.random() - 0.5) * 0.3,
      });
    }

    // Pre-compute connections based on home positions
    connections = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].homeX - nodes[j].homeX;
        const dy = nodes[i].homeY - nodes[j].homeY;
        if (Math.sqrt(dx * dx + dy * dy) < CONNECTION_DISTANCE) {
          connections.push([i, j]);
        }
      }
    }
  }

  // --- Physics update ---
  function updatePhysics() {
    const time = performance.now() * 0.001;

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];

      if (dragging === i) {
        // Dragged node follows cursor exactly
        n.x = mouseX;
        n.y = mouseY;
        n.vx = 0;
        n.vy = 0;
        continue;
      }

      // Idle drift (subtle breathing motion)
      const driftX = Math.sin(time * 0.5 + n.phase) * IDLE_DRIFT_SPEED * n.weight;
      const driftY = Math.cos(time * 0.7 + n.phase * 1.3) * IDLE_DRIFT_SPEED * n.weight;

      // Spring force back to home position (with drift offset)
      const targetX = n.homeX + driftX * 15;
      const targetY = n.homeY + driftY * 15;
      const dx = targetX - n.x;
      const dy = targetY - n.y;

      n.vx += dx * SPRING_STIFFNESS;
      n.vy += dy * SPRING_STIFFNESS;

      // Apply damping
      n.vx *= DAMPING;
      n.vy *= DAMPING;

      n.x += n.vx;
      n.y += n.vy;
    }
  }

  // --- Draw ---
  function draw() {
    ctx.clearRect(0, 0, canvasW, canvasH);
    const themeColors = getThemeColors();

    // Draw connections (pre-computed, never break)
    for (let c = 0; c < connections.length; c++) {
      const a = nodes[connections[c][0]];
      const b = nodes[connections[c][1]];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Fade slightly when stretched far, but never disappear
      const stretch = Math.max(0, dist / CONNECTION_DISTANCE);
      const alpha = Math.max(0.06, LINE_MAX_ALPHA * (1 - stretch * 0.4));
      const lineWidth = Math.max(0.4, (1 - stretch * 0.3) * 1.8 * Math.min(a.weight, b.weight));

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(${themeColors.line[0]}, ${themeColors.line[1]}, ${themeColors.line[2]}, ${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const isHovered = isNodeHovered(i);
      const isDragged = dragging === i;

      // Glow effect for hovered / dragged
      if (isDragged || isHovered) {
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(n.x, n.y, n.radius * 0.5, n.x, n.y, n.radius * 3.5);
        gradient.addColorStop(0, themeColors.glow);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.arc(n.x, n.y, n.radius * 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fillStyle = (isDragged || isHovered) ? themeColors.nodeHighlight : themeColors.node;
      ctx.fill();

      // Inner highlight for 3D-ish feel
      if (n.radius > 5) {
        ctx.beginPath();
        ctx.arc(n.x - n.radius * 0.25, n.y - n.radius * 0.25, n.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
      }
    }
  }

  // --- Helpers ---
  function isNodeHovered(index) {
    if (dragging !== null) return false;
    const n = nodes[index];
    const dx = mouseX - n.x;
    const dy = mouseY - n.y;
    return Math.sqrt(dx * dx + dy * dy) < GRAB_RADIUS;
  }

  function getNodeAtMouse() {
    let closest = -1;
    let closestDist = GRAB_RADIUS;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const dx = mouseX - n.x;
      const dy = mouseY - n.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }
    return closest;
  }

  // --- Event handlers ---
  function onPointerDown(e) {
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    mouseX = cx;
    mouseY = cy;
    mouseDown = true;
    const hit = getNodeAtMouse();
    if (hit >= 0) {
      dragging = hit;
      canvas.style.pointerEvents = 'auto'; // block content while dragging
      document.body.style.cursor = 'grabbing';
      e.preventDefault();
    }
  }

  function onPointerMove(e) {
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    mouseX = cx;
    mouseY = cy;

    if (dragging !== null) {
      e.preventDefault();
    } else {
      // Update cursor based on hover
      const hit = getNodeAtMouse();
      document.body.style.cursor = hit >= 0 ? 'grab' : '';
    }
  }

  function onPointerUp() {
    if (dragging !== null) {
      // Give the node a little velocity kick for a bouncy release
      const n = nodes[dragging];
      n.vx = (n.homeX - n.x) * 0.08;
      n.vy = (n.homeY - n.y) * 0.08;
    }
    dragging = null;
    mouseDown = false;
    canvas.style.pointerEvents = 'none';
    document.body.style.cursor = '';
  }

  // Mouse events (on window so they work even with canvas pointer-events:none)
  window.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  // Touch events
  window.addEventListener('touchstart', onPointerDown, { passive: false });
  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('touchend', onPointerUp);

  // Resize
  window.addEventListener('resize', () => {
    resize();
    // Re-scatter nodes on resize
    initNodes();
  });

  // --- Animation loop ---
  function loop() {
    updatePhysics();
    draw();
    animId = requestAnimationFrame(loop);
  }

  // --- Boot ---
  resize();
  loop();
})();


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

  // ===== GITHUB INTERACTIVE SVG FETCH =====
  const githubContainer = document.getElementById('github-svg-container');
  const tooltip = document.getElementById('github-tooltip');

  if (githubContainer && tooltip) {
    fetch('https://github-contributions-api.deno.dev/ruchith1018.svg')
      .then(response => response.text())
      .then(svgText => {
        githubContainer.innerHTML = svgText;
        githubContainer.appendChild(tooltip); // Ensure tooltip stays in container

        const rects = githubContainer.querySelectorAll('rect[data-date]');
        
        rects.forEach(rect => {
          rect.addEventListener('mouseenter', (e) => {
            const dateStr = rect.getAttribute('data-date');
            const count = rect.getAttribute('data-count');
            
            if (dateStr) {
              const date = new Date(dateStr);
              const day = date.getDate();
              const month = date.toLocaleString('default', { month: 'long' });
              
              let suffix = 'th';
              if (day === 1 || day === 21 || day === 31) suffix = 'st';
              else if (day === 2 || day === 22) suffix = 'nd';
              else if (day === 3 || day === 23) suffix = 'rd';
              
              const formattedDate = `${day}${suffix} ${month}`;
              tooltip.textContent = `${count} contributions on ${formattedDate}`;
              tooltip.style.opacity = '1';
            }
          });

          rect.addEventListener('mousemove', (e) => {
            const containerRect = githubContainer.getBoundingClientRect();
            const x = e.clientX - containerRect.left;
            const y = e.clientY - containerRect.top;
            
            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y - 45}px`;
            tooltip.style.transform = 'translateX(-50%)';
          });

          rect.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
          });
        });
      })
      .catch(err => {
        console.error('Error loading GitHub SVG:', err);
        githubContainer.innerHTML = '<p>Error loading contributions.</p>';
      });
  }
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



