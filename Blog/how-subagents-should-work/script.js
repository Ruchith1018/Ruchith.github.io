// Charts (published figures, re-plotted) and the "Should this task get subagents?" checklist.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const C = {
    pos: '#2a78d6', neg: '#e34948',
    cat: { 'System design': '#2a78d6', 'Inter-agent misalignment': '#eb6834', 'Task verification': '#1baf7a' },
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
  function showTip(evt, html) {
    if (!tip) return;
    tip.innerHTML = html;
    tip.hidden = false;
    const pad = 14, w = tip.offsetWidth, h = tip.offsetHeight;
    let x = evt.clientX + pad, y = evt.clientY + pad;
    if (x + w > window.innerWidth - 8) x = evt.clientX - w - pad;
    if (y + h > window.innerHeight - 8) y = evt.clientY - h - pad;
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
  // Horizontal bar with a 4px rounded data-end and a square end at the baseline.
  function barPath(x0, x1, y, h) {
    const r = Math.min(4, Math.abs(x1 - x0) / 2, h / 2);
    if (x1 >= x0) {
      return `M${x0},${y} H${x1 - r} Q${x1},${y} ${x1},${y + r} V${y + h - r} Q${x1},${y + h} ${x1 - r},${y + h} H${x0} Z`;
    }
    return `M${x0},${y} H${x1 + r} Q${x1},${y} ${x1},${y + r} V${y + h - r} Q${x1},${y + h} ${x1 + r},${y + h} H${x0} Z`;
  }

  // ---------------------------------------------------------------- Figure 2: diverging bars
  function chartBenchmarks(host) {
    const rows = [
      { name: 'Finance-Agent', kind: 'parallel analysis', v: 80.8, base: 0.349 },
      { name: 'BrowseComp-Plus', kind: 'web research', v: 0.2, base: 0.318 },
      { name: 'WorkBench', kind: 'business tool use', v: -1.2, base: 0.629 },
      { name: 'PlanCraft', kind: 'sequential planning', v: -50.3, base: 0.568 },
    ];
    const W = 720, rowH = 46, top = 34, left = 170, right = 70;
    const H = top + rows.length * rowH + 30;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%' }, host);
    const min = -60, max = 90;
    const sx = v => left + (v - min) / (max - min) * (W - left - right);
    [-50, -25, 0, 25, 50, 75].forEach(t => {
      el('line', { x1: sx(t), x2: sx(t), y1: top - 8, y2: H - 26, stroke: t === 0 ? C.axis : C.grid, 'stroke-width': t === 0 ? 1.5 : 1 }, svg);
      text(svg, sx(t), H - 12, (t > 0 ? '+' : '') + t + '%', { anchor: 'middle', fill: C.muted, size: 12 });
    });
    text(svg, sx(0) - 8, 14, '◀ worse than one agent', { anchor: 'end', fill: C.muted, size: 12 });
    text(svg, sx(0) + 8, 14, 'better than one agent ▶', { fill: C.muted, size: 12 });
    rows.forEach((r, i) => {
      const y = top + i * rowH, h = 24;
      text(svg, 0, y + h / 2 - 7, r.name, { fill: C.ink, weight: 600, size: 14 });
      text(svg, 0, y + h / 2 + 10, r.kind, { fill: C.muted, size: 12 });
      const g = el('g', { class: 'hit' }, svg);
      el('rect', { x: left, y: y - 6, width: W - left - right + 60, height: h + 12, fill: 'transparent' }, g);
      el('path', { d: barPath(sx(0), sx(r.v), y, h), fill: r.v >= 0 ? C.pos : C.neg }, g);
      const label = (r.v > 0 ? '+' : r.v < 0 ? '−' : '') + Math.abs(r.v).toFixed(1) + '%';
      const lx = r.v >= 0 ? sx(r.v) + 8 : sx(r.v) - 8;
      text(g, lx, y + h / 2, label, { anchor: r.v >= 0 ? 'start' : 'end', fill: C.ink, weight: 600 });
      hover(g, `<strong>${r.name}</strong> (${r.kind})<br>Single agent: ${r.base.toFixed(3)}<br>Orchestrator: ${label} vs single agent`);
    });
  }

  // ---------------------------------------------------------------- Figure 3: error amplification
  function chartErrors(host) {
    const rows = [
      { name: 'Single agent', how: 'one loop, one context', v: 1.0, eff: 67.7 },
      { name: 'Centralized', how: 'orchestrator validates', v: 4.4, eff: 21.5 },
      { name: 'Hybrid', how: 'orchestrator + peer messages', v: 5.1, eff: 13.6 },
      { name: 'Decentralized', how: 'peers debate', v: 7.8, eff: 23.9 },
      { name: 'Independent', how: 'no checks, outputs joined', v: 17.2, eff: 42.4 },
    ];
    const W = 720, rowH = 44, top = 18, left = 200, right = 60;
    const H = top + rows.length * rowH + 30;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%' }, host);
    const max = 18;
    const sx = v => left + v / max * (W - left - right);
    [0, 5, 10, 15].forEach(t => {
      el('line', { x1: sx(t), x2: sx(t), y1: top - 6, y2: H - 26, stroke: t === 0 ? C.axis : C.grid, 'stroke-width': t === 0 ? 1.5 : 1 }, svg);
      text(svg, sx(t), H - 12, t + '×', { anchor: 'middle', fill: C.muted, size: 12 });
    });
    rows.forEach((r, i) => {
      const y = top + i * rowH, h = 22;
      text(svg, 0, y + h / 2 - 7, r.name, { fill: C.ink, weight: 600, size: 14 });
      text(svg, 0, y + h / 2 + 10, r.how, { fill: C.muted, size: 12 });
      const g = el('g', { class: 'hit' }, svg);
      el('rect', { x: left, y: y - 6, width: W - left, height: h + 12, fill: 'transparent' }, g);
      el('path', { d: barPath(sx(0), sx(r.v), y, h), fill: C.pos, opacity: r.name === 'Single agent' ? 0.45 : 1 }, g);
      text(g, sx(r.v) + 8, y + h / 2, r.v.toFixed(1) + '×', { fill: C.ink, weight: 600 });
      hover(g, `<strong>${r.name}</strong>: ${r.how}<br>Error amplification: ${r.v.toFixed(1)}× a single agent<br>Successes per 1,000 tokens: ${r.eff}`);
    });
  }

  // ---------------------------------------------------------------- Figure 4: MAST failure modes
  function chartMast(host) {
    const rows = [
      ['FM-1.3', 'Repeats completed steps', 'System design', 15.7],
      ['FM-2.6', "Reasoning and actions don't match", 'Inter-agent misalignment', 13.2],
      ['FM-1.5', "Doesn't recognise when to stop", 'System design', 12.4],
      ['FM-1.1', 'Ignores task constraints', 'System design', 11.8],
      ['FM-3.3', 'Verification done incorrectly', 'Task verification', 9.1],
      ['FM-3.2', 'Verification missing or incomplete', 'Task verification', 8.2],
      ['FM-2.3', 'Drifts from the task goal', 'Inter-agent misalignment', 7.4],
      ['FM-2.2', 'Proceeds on assumptions', 'Inter-agent misalignment', 6.8],
      ['FM-3.1', 'Terminates too early', 'Task verification', 6.2],
      ['FM-1.4', 'Loses conversation context', 'System design', 2.8],
      ['FM-2.1', 'Unwarranted conversation reset', 'Inter-agent misalignment', 2.2],
      ['FM-2.5', "Disregards other agents' input", 'Inter-agent misalignment', 1.9],
      ['FM-1.2', 'Breaks its assigned role', 'System design', 1.5],
      ['FM-2.4', 'Withholds needed information', 'Inter-agent misalignment', 0.85],
    ];
    // legend (HTML, above the plot), with category totals
    const totals = {};
    rows.forEach(r => { totals[r[2]] = (totals[r[2]] || 0) + r[3]; });
    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    Object.keys(C.cat).forEach(k => {
      const s = document.createElement('span');
      s.innerHTML = `<i style="background:${C.cat[k]}"></i>${k} <em>${totals[k].toFixed(1)}%</em>`;
      legend.appendChild(s);
    });
    host.appendChild(legend);

    const W = 720, rowH = 28, top = 8, left = 270, right = 60;
    const H = top + rows.length * rowH + 28;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%' }, host);
    const max = 16;
    const sx = v => left + v / max * (W - left - right);
    [0, 5, 10, 15].forEach(t => {
      el('line', { x1: sx(t), x2: sx(t), y1: top - 4, y2: H - 24, stroke: t === 0 ? C.axis : C.grid, 'stroke-width': t === 0 ? 1.5 : 1 }, svg);
      text(svg, sx(t), H - 10, t + '%', { anchor: 'middle', fill: C.muted, size: 12 });
    });
    rows.forEach((r, i) => {
      const y = top + i * rowH, h = 18;
      text(svg, left - 12, y + h / 2, r[1], { anchor: 'end', fill: C.ink, size: 13 });
      const g = el('g', { class: 'hit' }, svg);
      el('rect', { x: 0, y: y - 4, width: W, height: h + 8, fill: 'transparent' }, g);
      el('path', { d: barPath(sx(0), sx(r[3]), y, h), fill: C.cat[r[2]] }, g);
      text(g, sx(r[3]) + 8, y + h / 2, r[3] + '%', { fill: C.ink2, size: 12, weight: 600 });
      hover(g, `<strong>${r[0]}: ${r[1]}</strong><br>${r[2]}<br>${r[3]}% of annotated failures`);
    });
  }

  // ---------------------------------------------------------------- the checklist
  function decider(host) {
    const Q = [
      { id: 'split', q: "Can the work be split into parts that don't depend on each other's decisions?",
        a: [['yes', 'Yes, cleanly'], ['partly', 'Partly'], ['no', 'No']] },
      { id: 'kind', q: 'Is the work mainly reading, searching or checking, or producing one integrated artifact?',
        a: [['read', 'Reading / checking'], ['mixed', 'A mix'], ['write', 'One artifact']] },
      { id: 'seq', q: 'Is it a sequence where each step depends on the previous one?',
        a: [['no', 'No'], ['some', 'Somewhat'], ['yes', 'Yes']] },
      { id: 'base', q: 'How well does a single agent already handle it?',
        a: [['weak', 'It struggles'], ['ok', 'Reasonably'], ['strong', 'Well (above ~45%)']] },
      { id: 'value', q: 'Is a better result worth several times the tokens?',
        a: [['yes', 'Yes'], ['no', 'No']] },
      { id: 'flood', q: "Would the side material (search results, logs, files) flood the main agent's context?",
        a: [['yes', 'Yes'], ['no', 'No']] },
    ];
    const state = {};
    const form = document.createElement('div');
    form.className = 'decider-qs';
    Q.forEach((item, idx) => {
      const box = document.createElement('fieldset');
      box.innerHTML = `<legend><span>${idx + 1}</span>${item.q}</legend>`;
      const opts = document.createElement('div');
      opts.className = 'decider-opts';
      item.a.forEach(([val, label]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => {
          state[item.id] = val;
          opts.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
          render();
        });
        opts.appendChild(b);
      });
      box.appendChild(opts);
      form.appendChild(box);
    });
    const out = document.createElement('div');
    out.className = 'decider-out';
    out.setAttribute('aria-live', 'polite');
    host.appendChild(form);
    host.appendChild(out);

    function render() {
      const n = Object.keys(state).length;
      if (n < Q.length) {
        out.innerHTML = `<p class="decider-wait">Answer all ${Q.length} questions to see a recommendation (${n}/${Q.length} done).</p>`;
        return;
      }
      const why = [];
      let verdict, cls;
      if (state.seq === 'yes') {
        why.push('Sequential work resists delegation: every multi-agent variant lost 39 to 70% on step-by-step planning.');
      }
      if (state.split === 'no' || state.kind === 'write') {
        why.push('Parts of one artifact carry hidden decisions that parallel subagents cannot see, the Flappy Bird failure.');
      }
      if (state.base === 'strong') {
        why.push('A single agent above about 45% gains little or nothing from coordination (the baseline paradox).');
      }
      if (state.value === 'no') {
        why.push('Multi-agent runs used about 15 times the tokens of a chat; the task does not justify that.');
      }
      const blockers = why.length;
      if (blockers === 0 && state.split === 'yes' && state.kind === 'read') {
        verdict = 'Main agent + subagents';
        cls = 'go';
        why.push('The work decomposes into independent, read-heavy questions, where the orchestrator design gained up to 80.8%.');
        why.push(state.base === 'weak' ? 'A struggling single agent is where coordination helps most.' : 'Start with 2 to 4 subagents and measure successes per 1,000 tokens.');
        why.push('Use the full contract: scope, signature, return type, authority, budget, and verify every result.');
      } else if (blockers === 0) {
        verdict = 'Main agent + a few subagents, carefully';
        cls = 'maybe';
        why.push('Some parts decompose. Delegate only the independent reading and checking; keep shared decisions and writing in the main agent.');
        why.push('Fix shared choices before fanning out, and cap fan-out at 2 to 4 subagents.');
      } else if (state.flood === 'yes') {
        verdict = 'One agent, with subagents only for side lookups';
        cls = 'maybe';
        why.push('Keep the main work in one agent, but hand noisy look-ups (searches, logs, long files) to a subagent that returns a short summary, as Claude Code does.');
      } else {
        verdict = 'One agent';
        cls = 'stop';
        why.push('Keep the task in a single agent with continuous context; consider compaction or note-taking if the context grows.');
      }
      out.innerHTML = `<div class="decider-verdict ${cls}"><span>Recommendation</span><strong>${verdict}</strong></div>` +
        '<ul>' + why.map(w => `<li>${w}</li>`).join('') + '</ul>' +
        '<button type="button" class="decider-reset">Start again</button>';
      out.querySelector('.decider-reset').addEventListener('click', () => {
        Object.keys(state).forEach(k => delete state[k]);
        form.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false'));
        render();
      });
    }
    render();
  }

  function init() {
    const b = document.getElementById('chart-benchmarks'); if (b) chartBenchmarks(b);
    const e = document.getElementById('chart-errors'); if (e) chartErrors(e);
    const m = document.getElementById('chart-mast'); if (m) chartMast(m);
    const d = document.getElementById('decider'); if (d) decider(d);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
