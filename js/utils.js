// 共享设施：色板 / 字体 / 图框 / 下钻卡 / 动画引擎 / 小工具
// 工程范式沿用标杆 asic42：U.frame 统一图框（标题+副题+来源行），
// U.showDrill 统一下钻卡 {title, value, sub, source}，U.play 统一滚动触发 draw-in。
(() => {
  const U = (window.U = {});

  // ── 色板：纸面 / 墨色 / 电蓝 / 语义红（+ 琥珀用于"观察"语义）──
  U.PAL = {
    paper: "#faf7f0",
    paperHi: "#fffdf8",
    ink: "#0a1f33",      // 近黑蓝
    inkMd: "#46586a",
    inkLo: "#8595a6",
    blue: "#2251ff",     // 电蓝：当前 / 强调
    blueSoft: "rgba(34,81,255,.14)",
    red: "#c22f4e",      // 语义红：断裂 / 风险 / 下行
    neg: "#c22f4e",
    redSoft: "rgba(194,47,78,.12)",
    amber: "#b97a1e",    // 观察 / 黄灯
    amberSoft: "rgba(185,122,30,.14)",
    line: "rgba(10,31,51,.16)",
    lineLo: "rgba(10,31,51,.08)",
  };

  U.FONTS = {
    mono: 'ui-monospace, "SF Mono", Menlo, Consolas, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", monospace',
    serif: '"Noto Serif SC", "Songti SC", STSong, "Source Han Serif SC", Georgia, "SimSun", serif',
  };

  U.NS = "http://www.w3.org/2000/svg";
  U.svgEl = (n, a) => {
    const e = document.createElementNS(U.NS, n);
    for (const k in a) e.setAttribute(k, a[k]);
    return e;
  };

  U.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  U.smooth = t => t * t * (3 - 2 * t);
  U.esc = s =>
    String(s == null ? "" : s).replace(/[&<>"]/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ── 统一图框：标题 + 副题（交互说明）+ 图体 + 底部来源行 ──
  // 来源只标四类：公司披露 / 券商研究 / 行业官方 / 自研模型（可组合）
  U.frame = (host, { title, sub, src }) => {
    host.classList.add("cf");
    const head = document.createElement("div");
    head.className = "cf-head";
    head.innerHTML =
      `<p class="chart-title">${U.esc(title)}</p>` +
      (sub ? `<p class="chart-sub">${U.esc(sub)}</p>` : "");
    const body = document.createElement("div");
    body.className = "cf-body";
    const foot = document.createElement("p");
    foot.className = "chart-src";
    foot.textContent = "来源：" + src;
    host.appendChild(head);
    host.appendChild(body);
    host.appendChild(foot);
    return body;
  };

  // ── 统一下钻卡：浮层、可关闭、点空白关闭、Esc 关闭 ──
  const dc = () => document.getElementById("drill-card");
  let dcOpen = false;
  U.closeDrill = () => {
    const el = dc();
    if (el) { el.hidden = true; el.innerHTML = ""; }
    dcOpen = false;
  };
  U.showDrill = ({ title, value, sub, source, x, y }) => {
    const el = dc();
    if (!el) return;
    el.innerHTML =
      `<div class="dc-back"></div>` +
      `<div class="dc-panel" role="dialog" aria-modal="true" data-drill-keep="1">` +
      `<button class="dc-x" aria-label="关闭">×</button>` +
      `<p class="dc-title">${title || ""}</p>` +
      (value ? `<p class="dc-value">${value}</p>` : "") +
      (sub ? `<p class="dc-sub">${sub}</p>` : "") +
      (source ? `<p class="dc-src">来源：${source}</p>` : "") +
      `</div>`;
    el.hidden = false;
    dcOpen = true;
    const panel = el.querySelector(".dc-panel");
    // 定位：优先点击点右下方， clamp 进视口
    const vw = window.innerWidth, vh = window.innerHeight;
    const pw = Math.min(400, vw - 32);
    panel.style.width = pw + "px";
    const ph = Math.min(panel.offsetHeight || 220, vh - 40);
    let lx = (x == null ? vw / 2 : x) + 14;
    let ly = (y == null ? vh / 2 : y) - 20;
    if (lx + pw + 16 > vw) lx = (x == null ? vw / 2 : x) - pw - 14;
    lx = U.clamp(lx, 16, vw - pw - 16);
    ly = U.clamp(ly, 16, Math.max(16, vh - ph - 16));
    panel.style.left = lx + "px";
    panel.style.top = ly + "px";
    requestAnimationFrame(() => panel.classList.add("in"));
    el.querySelector(".dc-back").addEventListener("click", U.closeDrill);
    el.querySelector(".dc-x").addEventListener("click", U.closeDrill);
  };
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && dcOpen) U.closeDrill();
  });

  // ── 统一动画引擎：animated = [{start, dur, set(p)}]，滚动触发一次 ──
  // final=true 直接落完成帧（resize / 字体回退重排用）；尊重 reduced-motion。
  U.play = (animated, watchEl, opts = {}) => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (opts.final || reduced) {
      animated.forEach(a => a.set(1));
      return { played: true };
    }
    animated.forEach(a => a.set(0));
    let running = false, played = false, t0 = null;
    const total = Math.max(0.2, ...animated.map(a => a.start + a.dur)) + 0.05;
    function tick(ts) {
      if (t0 == null) t0 = ts;
      const el = (ts - t0) / 1000;
      animated.forEach(a => a.set(U.smooth(U.clamp((el - a.start) / a.dur, 0, 1))));
      if (el < total && running) requestAnimationFrame(tick);
      else { running = false; played = true; animated.forEach(a => a.set(1)); }
    }
    function start() {
      if (running || played) return;
      running = true; t0 = null;
      requestAnimationFrame(tick);
    }
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      io.disconnect(); start();
    }, { threshold: opts.threshold || 0.18 });
    io.observe(watchEl);
    return { get played() { return played; } };
  };

  // ── DOM 渐次入场：元素加 .rv，入视口错峰加 .in ──
  U.reveal = (container, selector, step = 90) => {
    const els = [...container.querySelectorAll(selector)];
    els.forEach(el => el.classList.add("rv"));
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      els.forEach((el, i) => setTimeout(() => el.classList.add("in"), i * step));
    }, { threshold: 0.15 });
    io.observe(container);
    return els;
  };

  // ── 数字 count-up ──
  U.countUp = (el, { dur = 1100, fmt = t => t.toFixed(0) }) => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { el.innerHTML = fmt(1); return; }
    const t0 = performance.now();
    function tick(ts) {
      const p = U.clamp((ts - t0) / dur, 0, 1);
      el.innerHTML = fmt(U.smooth(p));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  };

  // ── resize 重排（debounce；charts 注册 rebuild）──
  const rebuilders = [];
  U.onRebuild = fn => rebuilders.push(fn);
  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => rebuilders.forEach(fn => fn()), 220);
  });
})();
