// experience.js — builds the career-track chart from the roles on the page,
// fills in each role's duration, and highlights a role opened via #exp-... links.

document.addEventListener("DOMContentLoaded", function () {
  const items = Array.from(document.querySelectorAll(".exp-item"));
  const track = document.getElementById("track");

  const now = new Date();
  const nowIndex = now.getFullYear() * 12 + now.getMonth();
  const toIndex = (ym) => {
    if (ym === "present") return nowIndex;
    const [y, m] = ym.split("-").map(Number);
    return y * 12 + (m - 1);
  };
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthLabel = (i) => `${MONTHS[i % 12]} ${Math.floor(i / 12)}`;

  function durationText(months) {
    const y = Math.floor(months / 12);
    const m = months % 12;
    const parts = [];
    if (y) parts.push(`${y} yr${y > 1 ? "s" : ""}`);
    if (m) parts.push(`${m} mo${m > 1 ? "s" : ""}`);
    return parts.join(" ") || "1 mo";
  }

  const roles = items.map((item) => {
    const start = toIndex(item.dataset.start);
    const end = toIndex(item.dataset.end);
    const months = end - start + 1; // inclusive of both months
    const duration = item.querySelector("[data-duration]");
    if (duration) duration.textContent = durationText(months);
    return { item, start, end, current: item.dataset.end === "present" };
  });

  // ----- Career track -----
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  if (track && roles.length) {
    const ordered = roles.slice().sort((a, b) => a.start - b.start);
    const first = ordered[0].start - 1;   // a month of breathing room either side
    const last = nowIndex + 3;
    const span = last - first;
    const pct = (i) => ((i - first) / span) * 100;

    // one colour per company, in order of first appearance
    const companies = [...new Set(ordered.map((r) => r.item.dataset.label))];

    const labels = el("div", "track-labels");
    labels.appendChild(el("div", "track-corner"));
    const chart = el("div", "track-chart");

    // Year bands with labels across the top
    const years = el("div", "track-years");
    const bands = el("div", "track-bands");
    for (let y = Math.floor(first / 12); y * 12 <= last; y++) {
      const from = Math.max(y * 12, first);
      const to = Math.min((y + 1) * 12, last);
      if (to <= from) continue;
      const left = pct(from) + "%";
      const width = pct(to) - pct(from) + "%";
      const band = el("div", "track-band" + (y % 2 ? " is-odd" : ""));
      band.style.left = left;
      band.style.width = width;
      bands.appendChild(band);
      const yearLabel = el("span", "track-year", String(y));
      yearLabel.style.left = left;
      yearLabel.style.width = width;
      if ((to - from) < 4) yearLabel.classList.add("is-narrow");
      years.appendChild(yearLabel);
    }
    chart.append(bands, years);

    // Today marker
    const today = el("div", "track-today");
    today.style.left = pct(nowIndex + 1) + "%";
    today.appendChild(el("span", null, "Today"));
    chart.appendChild(today);

    ordered.forEach((role) => {
      const card = role.item;
      const months = role.end - role.start + 1;

      // Row label: logo + role + company
      const label = el("a", "track-label");
      label.href = "#" + card.id;
      const logo = card.querySelector(".pass-logo");
      if (logo) {
        const img = el("img");
        img.src = logo.getAttribute("src");
        img.alt = "";
        label.appendChild(img);
      }
      const text = el("div");
      text.appendChild(el("strong", null, card.dataset.role));
      text.appendChild(el("span", null, card.dataset.label));
      label.appendChild(text);
      labels.appendChild(label);

      // Bar
      const lane = el("div", "track-lane");
      const bar = el("a", `track-bar company-${companies.indexOf(card.dataset.label)}` +
        (role.current ? " is-current" : ""));
      bar.href = "#" + card.id;
      bar.style.left = pct(role.start) + "%";
      bar.style.width = pct(role.end + 1) - pct(role.start) + "%";
      bar.title = `${card.dataset.role}, ${card.dataset.label}`;
      // same-year roles get the compact form: "Jan – Jul 2025"
      const sameYear = !role.current && Math.floor(role.start / 12) === Math.floor(role.end / 12);
      const range = role.current
        ? `${monthLabel(role.start)} – Now`
        : sameYear
          ? `${MONTHS[role.start % 12]} – ${monthLabel(role.end)}`
          : `${monthLabel(role.start)} – ${monthLabel(role.end)}`;
      bar.appendChild(el("strong", null, range));
      bar.appendChild(el("span", null, durationText(months)));
      lane.appendChild(bar);
      chart.appendChild(lane);
    });

    track.append(labels, chart);
  }

  // ----- Highlight a role opened via #exp-... -----
  function highlightFromHash() {
    items.forEach((el) => el.classList.remove("is-target"));
    const target = window.location.hash && document.querySelector(window.location.hash);
    if (!target || !target.classList.contains("exp-item")) return;
    target.classList.add("is-target");
    setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  }

  highlightFromHash();
  window.addEventListener("hashchange", highlightFromHash);

  // ----- Pipeline widget: stepper run + prompt-caching latency toggle -----
  const pipe = document.getElementById("pipe-widget");
  if (pipe) {
    const steps = Array.from(pipe.querySelectorAll(".pipe-steps li"));
    const runBtn = pipe.querySelector(".pipe-run");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer = null;

    function runPipeline() {
      clearTimeout(timer);
      runBtn.disabled = true;
      steps.forEach((s) => s.classList.remove("is-active", "is-done"));
      let i = 0;
      const next = () => {
        if (i > 0) {
          steps[i - 1].classList.remove("is-active");
          steps[i - 1].classList.add("is-done");
        }
        if (i === steps.length) {
          runBtn.disabled = false;
          runBtn.innerHTML = "&#8635; Replay";
          return;
        }
        steps[i].classList.add("is-active");
        i++;
        timer = setTimeout(next, reduce ? 0 : 750);
      };
      next();
    }

    runBtn.addEventListener("click", runPipeline);

    // play once when the widget first scrolls into view
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          runPipeline();
          io.disconnect();
        }
      }, { threshold: 0.5 });
      io.observe(pipe);
    } else {
      steps.forEach((s) => s.classList.add("is-done"));
    }

    // latency: 2,000 ms without caching, 50 ms with it
    const toggle = pipe.querySelector(".lat-switch input");
    const fill = pipe.querySelector(".lat-fill");
    const value = pipe.querySelector(".lat-value");
    const note = pipe.querySelector(".lat-note");
    let raf = null;
    let shown = 50;
    let settle = null;

    function animateTo(target) {
      cancelAnimationFrame(raf);
      const from = shown;
      const dur = reduce ? 0 : 900;
      const fmt = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${v} ms`);
      let start = null;
      const tick = (t) => {
        if (start === null) start = t;
        const k = dur ? Math.min(Math.max((t - start) / dur, 0), 1) : 1;
        const eased = 1 - Math.pow(1 - k, 3);
        shown = k === 1 ? target : Math.round(from + (target - from) * eased);
        value.textContent = fmt(shown);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      clearTimeout(settle);
      if (dur) {
        raf = requestAnimationFrame(tick);
        // guarantee the final value even if frames are throttled (background tab)
        settle = setTimeout(() => { cancelAnimationFrame(raf); shown = target; value.textContent = fmt(target); }, dur + 100);
      } else { shown = target; value.textContent = fmt(target); }
    }

    toggle.addEventListener("change", () => {
      const on = toggle.checked;
      fill.style.width = on ? "2.5%" : "100%";
      note.textContent = on ? "97% faster with caching" : "without caching";
      animateTo(on ? 50 : 2000);
    });
  }
});
