// Figure 3 (published numbers, re-plotted) and two simulations on synthetic vectors:
// the shared-direction demo and the hubness demo. Everything is drawn at the container's
// real width (1 SVG unit = 1 CSS px), so text never shrinks on phones.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const C = {
    blue: '#2a78d6', red: '#e34948', amber: '#d18e00', grey: '#9a9890',
    ink: '#0b0b0b', ink2: '#52514e', muted: '#898781', grid: '#e1e0d9', axis: '#c3c2b7',
  };
  const tip = document.getElementById('chart-tip');

  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function text(parent, x, y, str, opts = {}) {
    const t = el('text', { x, y, fill: opts.fill || C.ink2, 'font-size': opts.size || 13,
      'text-anchor': opts.anchor || 'start', 'font-weight': opts.weight || 400,
      'dominant-baseline': 'middle' }, parent);
    t.textContent = str;
    return t;
  }
  function h(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function showTip(evt, html) {
    if (!tip) return;
    tip.innerHTML = html;
    tip.hidden = false;
    const pad = 14, w = tip.offsetWidth, hh = tip.offsetHeight;
    let x = evt.clientX + pad, y = evt.clientY + pad;
    if (x + w > window.innerWidth - 8) x = evt.clientX - w - pad;
    if (y + hh > window.innerHeight - 8) y = evt.clientY - hh - pad;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }
  function hideTip() { if (tip) tip.hidden = true; }
  function hover(target, html) {
    target.addEventListener('mousemove', e => showTip(e, html));
    target.addEventListener('mouseleave', hideTip);
    target.addEventListener('focus', e => {
      const r = target.getBoundingClientRect();
      showTip({ clientX: r.right, clientY: r.top }, html);
    });
    target.addEventListener('blur', hideTip);
    target.setAttribute('tabindex', '0');
  }
  function innerWidth(host) {
    const cs = getComputedStyle(host);
    return Math.max(260, host.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
  }
  function onResize(host, draw) {
    let lastW = host.clientWidth, t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => { if (host.clientWidth !== lastW) { lastW = host.clientWidth; draw(); } }, 150);
    });
  }
  function barPath(x0, x1, y, hgt) {
    const r = Math.min(4, Math.abs(x1 - x0) / 2, hgt / 2);
    return `M${x0},${y} H${x1 - r} Q${x1},${y} ${x1},${y + r} V${y + hgt - r} Q${x1},${y + hgt} ${x1 - r},${y + hgt} H${x0} Z`;
  }

  // ---------------------------------------------------------------- seeded random numbers
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    let u = 0;
    while (!u) u = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
  }
  const dot = (a, b) => { let s = 0; for (let j = 0; j < a.length; j++) s += a[j] * b[j]; return s; };
  const norm = a => Math.sqrt(dot(a, a));
  const scale = (a, k) => a.map(x => x * k);
  const unitVec = a => scale(a, 1 / norm(a));
  const cosine = (a, b) => dot(a, b) / (norm(a) * norm(b));

  // ---------------------------------------------------------------- Figure 3: STS benchmark bars
  function chartSts(host) {
    const KIND = {
      base: { color: C.grey, name: 'Baseline' },
      post: { color: C.amber, name: 'Geometry fixed after training' },
      con: { color: C.blue, name: 'Contrastive training' },
    };
    const rows = [
      ['GloVe (averaged)', '2014 static word vectors', 61.32, 'base'],
      ['BERT-base, raw', 'first-last layer average', 56.70, 'base'],
      ['BERT-base + flow', 'mapped to an isotropic Gaussian', 66.55, 'post'],
      ['BERT-base + whitening', 'centred, decorrelated, rescaled', 66.28, 'post'],
      ['SimCSE, unsupervised', 'contrastive, no labels', 76.25, 'con'],
      ['SimCSE, supervised', 'contrastive, labelled pairs', 81.57, 'con'],
    ];
    const legend = h('div', 'chart-legend');
    Object.values(KIND).forEach(k => legend.appendChild(h('span', null, `<i style="background:${k.color}"></i>${k.name}`)));
    host.appendChild(legend);
    const box = h('div');
    host.appendChild(box);
    function draw() {
      box.innerHTML = '';
      const W = innerWidth(host);
      const narrow = W < 540;
      const left = narrow ? 0 : 230, right = 58;
      const barH = narrow ? 16 : 22, rowH = narrow ? 34 + 16 + 14 : 46, top = 6;
      const H = top + rows.length * rowH + 28;
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, box);
      const sx = v => left + v / 90 * (W - left - right);
      [0, 20, 40, 60, 80].forEach(t => {
        el('line', { x1: sx(t), x2: sx(t), y1: top - 2, y2: H - 24, stroke: t === 0 ? C.axis : C.grid, 'stroke-width': t === 0 ? 1.5 : 1 }, svg);
        text(svg, sx(t), H - 10, String(t), { anchor: 'middle', fill: C.muted, size: 11 });
      });
      rows.forEach(([name, sub, v, kind], i) => {
        const y0 = top + i * rowH;
        let by;
        if (narrow) {
          text(svg, 0, y0 + 8, name, { fill: C.ink, weight: 600, size: 13 });
          text(svg, 0, y0 + 24, sub, { fill: C.muted, size: 11.5 });
          by = y0 + 36;
        } else {
          by = y0 + (rowH - barH) / 2;
          text(svg, 0, by + barH / 2 - 7, name, { fill: C.ink, weight: 600, size: 14 });
          text(svg, 0, by + barH / 2 + 10, sub, { fill: C.muted, size: 12 });
        }
        const g = el('g', { class: 'hit' }, svg);
        el('rect', { x: 0, y: y0, width: W, height: rowH, fill: 'transparent' }, g);
        el('path', { d: barPath(sx(0), sx(v), by, barH), fill: KIND[kind].color }, g);
        text(g, sx(v) + 6, by + barH / 2, v.toFixed(2), { fill: C.ink, weight: 600, size: 12 });
        hover(g, `<strong>${name}</strong><br>${sub}<br>Average Spearman × 100: ${v.toFixed(2)}`);
      });
    }
    draw();
    onResize(host, draw);
  }

  // ---------------------------------------------------------------- shared-direction simulation
  // 400 unrelated and 400 related pairs of 128-d vectors. Each vector = meaning part (unit, orthogonal
  // to c) + a * c, where a varies about 30% from text to text. Related pairs share 70% of their meaning.
  function coneSim(alpha, fix) {
    const D = 128, P = 400, RHO = 0.7, VAR = 0.3;
    const r = rng(3);
    const rand = () => { const v = new Float64Array(D); for (let j = 0; j < D; j++) v[j] = gauss(r); return v; };
    const c = unitVec(rand());
    const perp = v => { const d = dot(v, c); return unitVec(v.map((x, j) => x - d * c[j])); };
    const make = s => { const a = alpha * (1 + VAR * gauss(r)); return s.map((x, j) => x + a * c[j]); };
    const pairs = [];
    for (let i = 0; i < P; i++) pairs.push([make(perp(rand())), make(perp(rand())), 0]);
    for (let i = 0; i < P; i++) {
      const sa = perp(rand()), nz = perp(rand());
      const sb = unitVec(sa.map((x, j) => RHO * x + Math.sqrt(1 - RHO * RHO) * nz[j]));
      pairs.push([make(sa), make(sb), 1]);
    }
    if (fix !== 'none') {
      const m = new Float64Array(D);
      pairs.forEach(([a, b]) => { for (let j = 0; j < D; j++) m[j] += (a[j] + b[j]) / (2 * pairs.length); });
      pairs.forEach(p => { p[0] = p[0].map((x, j) => x - m[j]); p[1] = p[1].map((x, j) => x - m[j]); });
      if (fix === 'top') {
        // top principal direction by power iteration, then project it out
        let u = unitVec(rand());
        for (let it = 0; it < 30; it++) {
          const nu = new Float64Array(D);
          pairs.forEach(p => { for (const k of [0, 1]) { const d = dot(p[k], u); for (let j = 0; j < D; j++) nu[j] += d * p[k][j]; } });
          u = unitVec(nu);
        }
        pairs.forEach(p => { for (const k of [0, 1]) { const d = dot(p[k], u); p[k] = p[k].map((x, j) => x - d * u[j]); } });
      }
    }
    const un = [], rel = [];
    pairs.forEach(([a, b, l]) => (l ? rel : un).push(cosine(a, b)));
    let wins = 0;
    rel.forEach(x => un.forEach(y => { wins += x > y ? 1 : x === y ? 0.5 : 0; }));
    return { un, rel, auc: wins / (rel.length * un.length) };
  }

  function coneDemo(host) {
    const state = { alpha: 2, fix: 'none' };
    host.appendChild(h('div', 'demo-title', 'Simulation: a shared direction in every vector'));
    const controls = h('div', 'demo-controls');
    const sliderWrap = h('label', 'demo-slider',
      `<span>Shared direction strength, ‖c‖ / ‖s‖: <b id="cone-alpha">2.0</b></span>` +
      `<input type="range" min="0" max="3" step="0.1" value="2" aria-label="Shared direction strength">`);
    controls.appendChild(sliderWrap);
    const fixGroup = h('div', 'demo-seg', '<span class="demo-seg-label">Post-processing</span>');
    const fixOpts = h('div', 'demo-seg-opts');
    [['none', 'None'], ['mean', 'Subtract the mean'], ['top', 'Remove the top direction']].forEach(([v, label]) => {
      const b = h('button', null, label);
      b.type = 'button';
      b.dataset.v = v;
      b.setAttribute('aria-pressed', String(v === state.fix));
      b.addEventListener('click', () => {
        state.fix = v;
        fixOpts.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        update();
      });
      fixOpts.appendChild(b);
    });
    fixGroup.appendChild(fixOpts);
    controls.appendChild(fixGroup);
    host.appendChild(controls);
    const plot = h('div', 'demo-plot');
    host.appendChild(plot);
    const stats = h('div', 'demo-stats');
    stats.setAttribute('aria-live', 'polite');
    host.appendChild(stats);

    const input = sliderWrap.querySelector('input');
    const alphaOut = sliderWrap.querySelector('#cone-alpha');
    let result, timer;
    input.addEventListener('input', () => {
      state.alpha = parseFloat(input.value);
      alphaOut.textContent = state.alpha.toFixed(1);
      clearTimeout(timer);
      timer = setTimeout(update, 60);
    });

    function update() {
      result = coneSim(state.alpha, state.fix);
      draw();
      const pct = (arr, t) => Math.round(arr.filter(v => v > t).length / arr.length * 100);
      const mean = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
      stats.innerHTML =
        stat('Unrelated pairs, mean score', mean(result.un).toFixed(2), C.grey) +
        stat('Related pairs, mean score', mean(result.rel).toFixed(2), C.blue) +
        stat('Unrelated pairs above 0.8', pct(result.un, 0.8) + '%', pct(result.un, 0.8) > 5 ? C.red : C.ink) +
        stat('Ranking accuracy', (result.auc * 100).toFixed(1) + '%', result.auc < 0.99 ? C.red : C.ink);
    }
    function stat(label, value, color) {
      return `<div><span>${label}</span><strong style="color:${color}">${value}</strong></div>`;
    }
    function draw() {
      plot.innerHTML = '';
      const W = innerWidth(plot), H = 210, L = 8, R = 8, T = 18, B = 34;
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, plot);
      const lo = -0.4, hi = 1.0, bins = 56, bw = (hi - lo) / bins;
      const sx = v => L + (v - lo) / (hi - lo) * (W - L - R);
      const count = arr => { const c = new Array(bins).fill(0); arr.forEach(v => { const i = Math.min(bins - 1, Math.max(0, Math.floor((v - lo) / bw))); c[i]++; }); return c; };
      const cu = count(result.un), cr = count(result.rel);
      const maxC = Math.max(...cu, ...cr, 1);
      const sy = n => H - B - n / maxC * (H - B - T);
      [-0.4, 0, 0.4, 0.8, 1.0].forEach(t => {
        el('line', { x1: sx(t), x2: sx(t), y1: T - 6, y2: H - B, stroke: t === 0 ? C.axis : C.grid, 'stroke-width': 1 }, svg);
        text(svg, sx(t), H - B + 14, t.toFixed(1), { anchor: 'middle', fill: C.muted, size: 11 });
      });
      text(svg, (W - L - R) / 2 + L, H - 8, 'cosine similarity', { anchor: 'middle', fill: C.muted, size: 11 });
      [[cu, C.grey, 0.75], [cr, C.blue, 0.6]].forEach(([cnt, col, op]) => {
        cnt.forEach((n, i) => {
          if (!n) return;
          const x0 = sx(lo + i * bw) + 0.5, x1 = sx(lo + (i + 1) * bw) - 0.5;
          el('rect', { x: x0, y: sy(n), width: Math.max(1, x1 - x0), height: H - B - sy(n), fill: col, opacity: op }, svg);
        });
      });
      el('line', { x1: sx(0.8), x2: sx(0.8), y1: T - 10, y2: H - B, stroke: C.red, 'stroke-width': 2, 'stroke-dasharray': '5 4' }, svg);
      text(svg, sx(0.8) - 5, T - 6, 'threshold 0.8', { anchor: 'end', fill: C.red, size: 11.5, weight: 600 });
      const lg = el('g', {}, svg);
      el('rect', { x: L + 4, y: T - 2, width: 10, height: 10, rx: 2, fill: C.grey, opacity: 0.75 }, lg);
      text(lg, L + 19, T + 3, 'unrelated pairs', { size: 11.5, fill: C.ink2 });
      el('rect', { x: L + 4, y: T + 14, width: 10, height: 10, rx: 2, fill: C.blue, opacity: 0.6 }, lg);
      text(lg, L + 19, T + 19, 'related pairs', { size: 11.5, fill: C.ink2 });
    }
    update();
    onResize(plot, draw);
  }

  // ---------------------------------------------------------------- hubness simulation
  // 300 points. "sphere": isotropic Gaussian. "cone": a mean offset plus a decaying spectrum,
  // so a few directions dominate. N_k = how many other points list a point in their top 10.
  function hubSim(d, shape, score) {
    const N = 300, K = 10, r = rng(7);
    let X = [];
    for (let i = 0; i < N; i++) {
      const x = new Float64Array(d);
      for (let j = 0; j < d; j++) x[j] = shape === 'cone' ? gauss(r) * Math.pow(j + 1, -0.5) + 0.3 : gauss(r);
      X.push(x);
    }
    if (score === 'centre') {
      const m = new Float64Array(d);
      X.forEach(x => { for (let j = 0; j < d; j++) m[j] += x[j] / N; });
      X = X.map(x => x.map((v, j) => v - m[j]));
    }
    X = X.map(unitVec);
    const S = X.map(a => X.map(b => dot(a, b)));
    const rk = new Float64Array(N);
    if (score === 'csls') {
      for (let i = 0; i < N; i++) {
        const row = S[i].filter((_, j) => j !== i).sort((a, b) => b - a);
        rk[i] = row.slice(0, K).reduce((a, b) => a + b, 0) / K;
      }
    }
    const Nk = new Array(N).fill(0);
    for (let i = 0; i < N; i++) {
      const cand = [];
      for (let j = 0; j < N; j++) if (j !== i) cand.push([score === 'csls' ? 2 * S[i][j] - rk[i] - rk[j] : S[i][j], j]);
      cand.sort((a, b) => b[0] - a[0]);
      for (let t = 0; t < K; t++) Nk[cand[t][1]]++;
    }
    return { Nk, K, N };
  }

  function hubDemo(host) {
    const state = { d: 100, shape: 'cone', score: 'cos' };
    host.appendChild(h('div', 'demo-title', 'Simulation: who is everyone’s nearest neighbour?'));
    const controls = h('div', 'demo-controls');
    function seg(label, key, opts) {
      const g = h('div', 'demo-seg', `<span class="demo-seg-label">${label}</span>`);
      const o = h('div', 'demo-seg-opts');
      opts.forEach(([v, t]) => {
        const b = h('button', null, t);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(v === state[key]));
        b.addEventListener('click', () => {
          state[key] = v;
          o.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          update();
        });
        o.appendChild(b);
      });
      g.appendChild(o);
      controls.appendChild(g);
    }
    seg('Dimensions', 'd', [[3, '3'], [10, '10'], [30, '30'], [100, '100'], [300, '300']]);
    seg('Shape of the cloud', 'shape', [['sphere', 'Even sphere'], ['cone', 'Lopsided cone']]);
    seg('Scoring', 'score', [['cos', 'Cosine'], ['centre', 'Cosine after centring'], ['csls', 'CSLS']]);
    host.appendChild(controls);
    const plot = h('div', 'demo-plot');
    host.appendChild(plot);
    const stats = h('div', 'demo-stats');
    stats.setAttribute('aria-live', 'polite');
    host.appendChild(stats);
    let res;

    function update() {
      res = hubSim(state.d, state.shape, state.score);
      draw();
      const max = Math.max(...res.Nk);
      const zero = res.Nk.filter(v => v === 0).length;
      const sorted = res.Nk.slice().sort((a, b) => b - a);
      const top5 = sorted.slice(0, Math.round(res.N * 0.05)).reduce((a, b) => a + b, 0) / (res.N * res.K) * 100;
      stats.innerHTML =
        `<div><span>Biggest hub: top-10 lists it appears in</span><strong style="color:${max >= 30 ? C.red : C.ink}">${max}</strong><small>${(max / res.K).toFixed(1)}× the average of 10</small></div>` +
        `<div><span>Never anyone's neighbour</span><strong>${Math.round(zero / res.N * 100)}%</strong></div>` +
        `<div><span>Neighbour slots taken by the top 5% of points</span><strong>${top5.toFixed(0)}%</strong></div>`;
    }
    function draw() {
      plot.innerHTML = '';
      const W = innerWidth(plot), H = 200, L = 34, R = 8, T = 14, B = 34;
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H }, plot);
      const maxN = 70, binW = 2, bins = maxN / binW;
      const counts = new Array(bins).fill(0);
      res.Nk.forEach(v => { counts[Math.min(bins - 1, Math.floor(v / binW))]++; });
      const maxC = Math.max(...counts, 1);
      const yMax = Math.ceil(maxC / 20) * 20;
      const sx = v => L + v / maxN * (W - L - R);
      const sy = n => H - B - n / yMax * (H - B - T);
      [0, 10, 20, 30, 40, 50, 60, 70].forEach(t => {
        if (W < 420 && t % 20) return;
        el('line', { x1: sx(t), x2: sx(t), y1: T, y2: H - B, stroke: C.grid, 'stroke-width': 1 }, svg);
        text(svg, sx(t), H - B + 14, t === 70 ? '70+' : String(t), { anchor: 'middle', fill: C.muted, size: 11 });
      });
      [0, yMax / 2, yMax].forEach(t => text(svg, L - 6, sy(t), String(t), { anchor: 'end', fill: C.muted, size: 11 }));
      text(svg, (W + L) / 2, H - 8, 'number of top-10 lists a point appears in', { anchor: 'middle', fill: C.muted, size: 11 });
      counts.forEach((n, i) => {
        if (!n) return;
        const lo = i * binW;
        const col = lo >= 30 ? C.red : lo === 0 ? C.grey : C.blue;
        const top = Math.min(sy(n), H - B - 5);   // keep single hubs visible
        el('rect', { x: sx(lo) + 1, y: top, width: Math.max(1, sx(binW) - sx(0) - 2), height: H - B - top, fill: col, rx: 1.5 }, svg);
      });
      el('line', { x1: sx(10), x2: sx(10), y1: T - 4, y2: H - B, stroke: C.ink2, 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }, svg);
      text(svg, sx(10) + 5, T + 2, 'average = 10', { fill: C.ink2, size: 11.5, weight: 600 });
      if (W >= 420) text(svg, sx(30) + 4, T + 18, 'red: hubs (30+ lists)', { fill: C.red, size: 11.5, weight: 600 });
    }
    update();
    onResize(plot, draw);
  }

  function init() {
    const s = document.getElementById('chart-sts'); if (s) chartSts(s);
    const c = document.getElementById('cone-demo'); if (c) coneDemo(c);
    const hb = document.getElementById('hub-demo'); if (hb) hubDemo(hb);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
