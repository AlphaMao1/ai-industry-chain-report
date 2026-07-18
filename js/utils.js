// 共享设施 v2（升级重写）：色板 / 字体 / HiDPI canvas / 统一图框 / 深墨下钻卡 /
// 悬浮 tip / 动画引擎（U.play）/ 渐次入场（U.reveal）/ count-up / resize 重排
// 设计定案见 outline《AI研究报告大纲》§4.3：发丝线编辑风；下钻卡深墨 #0a1f33 + 3px 电蓝顶线、
// 无全屏背板、主值 24px、超 40 字符自动切 14.5px 常规体、涨跌 #6fd0b2/#ef9aae、随点随关。
// 保留 v1 可用设施：U.play 滚动动画、U.reveal、Esc 关闭、U.frame 骨架；新增 U.bindCanvas（HiDPI）、U.showTip。
(() => {
  const U = (window.U = {});

  // ── 色板：与 css/style.css 变量同值双维护（canvas / SVG 侧用）──
  U.PAL = {
    paper: "#faf7f0",
    paperHi: "#fffdf8",
    ink: "#0a1f33",
    inkMd: "#46586a",
    inkLo: "#8595a6",
    blue: "#2251ff",      // 电蓝：当前 / 强调 / 图表主系列
    blueHi: "#1233b8",
    blueLo: "#7d9bff",
    blueSoft: "rgba(34,81,255,.14)",
    red: "#c22f4e",       // 语义红：断裂 / 越线 / 下行 / 负值
    neg: "#c22f4e",
    redSoft: "rgba(194,47,78,.12)",
    amber: "#b97a1e",     // 琥珀：仅限灯号组件
    orange: "#c25918",    // 野橙：仅限灯号组件
    dPos: "#6fd0b2",      // 深墨下钻卡涨
    dNeg: "#ef9aae",      // 深墨下钻卡跌
    line: "rgba(10,31,51,.16)",
    lineLo: "rgba(10,31,51,.08)",
  };
  // 一图一族：墨阶 + 蓝族 + 语义红；绿/铜/紫锁死在来源徽章，不进图表
  U.SERIES = ["#2251ff", "#1233b8", "#7d9bff", "#46586a"];

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
  U.ease = U.smooth;
  U.esc = s =>
    String(s == null ? "" : s).replace(/[&<>"]/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  U.reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  U.fmtSrc = s => "来源：" + String(s || "").split(" · ").join(", ");

  // ── HiDPI canvas：dpr ≤ 2；返回 {cv, ctx, W, H}（ctx 已变换到 CSS 像素坐标系）──
  U.bindCanvas = (host, h = 320) => {
    const cv = document.createElement("canvas");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.max(1, host.clientWidth || (host.parentElement && host.parentElement.clientWidth) || 320);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(h * dpr);
    cv.style.width = "100%";
    cv.style.height = h + "px";
    host.appendChild(cv);
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { cv, ctx, W, H: h, dpr };
  };

  // ── 统一图框：衬线标题 + 等宽大写副题（兼图例与交互指令）+ 图体 + 底部发丝线来源行 ──
  U.frame = (host, { title, sub, src }) => {
    host.classList.add("cf");
    const head = document.createElement("div");
    head.className = "cf-head";
    head.innerHTML =
      `<p class="chart-title">${U.esc(title)}</p>` +
      (sub ? `<p class="chart-sub">${U.esc(sub)}</p>` : "");
    const body = document.createElement("div");
    body.className = "cf-body";
    host.appendChild(head);
    host.appendChild(body);
    if (src) {
      const foot = document.createElement("p");
      foot.className = "chart-src";
      foot.textContent = U.fmtSrc(src);
      host.appendChild(foot);
    }
    return body;
  };

  // ── 全局唯一深墨下钻卡：{title, value, delta?, sub?, source?, x, y} ──
  // 深墨底 + 纸面字 + 3px 电蓝顶线；无全屏背板；随点随关（Esc / 点卡外）。
  // value 超 40 字符自动切 .prose 14.5px 常规体承载长事实；数字保持 24px 粗体。
  const dc = () => {
    let el = document.getElementById("drill-card");
    if (!el) {
      el = document.createElement("div");
      el.id = "drill-card";
      el.hidden = true;
      document.body.appendChild(el);
    }
    return el;
  };
  let dcOpen = false;
  U.closeDrill = () => {
    const el = dc();
    el.hidden = true;
    el.innerHTML = "";
    dcOpen = false;
  };
  U.showDrill = ({ title, value, delta, sub, source, x, y }) => {
    const el = dc();
    if (!el) return;
    const prose = String(value == null ? "" : value).length > 40;
    let deltaHtml = "";
    if (delta != null) {
      const isNeg = typeof delta === "number" ? delta < 0 : /^[−-]/.test(String(delta).trim());
      const txt = typeof delta === "number" ? (delta > 0 ? "+" : "") + delta + "%" : String(delta);
      deltaHtml = ` <span class="${isNeg ? "neg" : "pos"}">${txt}</span>`;
    }
    el.innerHTML =
      `<div class="dc-panel" role="dialog" aria-modal="true" data-drill-keep="1">` +
      `<button class="dc-x" aria-label="关闭">×</button>` +
      (title ? `<p class="dc-title">${title}</p>` : "") +
      (value != null && value !== "" ? `<p class="dc-value${prose ? " prose" : ""}">${value}${deltaHtml}</p>` : "") +
      (sub ? `<p class="dc-sub">${sub}</p>` : "") +
      (source ? `<p class="dc-src">${U.fmtSrc(source)}</p>` : "") +
      `</div>`;
    el.hidden = false;
    dcOpen = true;
    const panel = el.querySelector(".dc-panel");
    // 定位：点击点附近，clamp 进视口；上方放不下自动改放下方
    const vw = window.innerWidth, vh = window.innerHeight;
    const pw = Math.min(340, vw - 16);
    panel.style.width = pw + "px";
    const r = panel.getBoundingClientRect();
    const ph = Math.min(r.height || 220, vh - 24);
    let lx = (x == null ? vw / 2 : x) + 14;
    if (lx + pw + 8 > vw) lx = (x == null ? vw / 2 : x) - pw - 14;
    lx = U.clamp(lx, 8, Math.max(8, vw - pw - 8));
    let ly = (y == null ? vh / 2 : y) - ph - 14;
    if (ly < 8) ly = (y == null ? vh / 2 : y) + 18;
    ly = U.clamp(ly, 8, Math.max(8, vh - ph - 8));
    panel.style.left = lx + "px";
    panel.style.top = ly + "px";
    requestAnimationFrame(() => panel.classList.add("in"));
    el.querySelector(".dc-x").addEventListener("click", U.closeDrill);
  };
  // 点卡外关闭（捕获相位：先于各图表的 click 处理器执行，
  // 因此"打开下钻卡的那一次点击"不会立即把它关掉）；触发元素可标 data-drill-keep 豁免。
  document.addEventListener("click", e => {
    if (!dcOpen) return;
    const el = dc();
    if (el.contains(e.target)) return;
    if (e.target.closest && e.target.closest("[data-drill-keep]")) return;
    U.closeDrill();
  }, true);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && dcOpen) U.closeDrill();
  });

  // ── 全局悬浮 tip（220px 轻提示，仅辅助；下钻一律走 showDrill）──
  let tipEl = null;
  U.showTip = (html, x, y) => {
    if (!tipEl) {
      tipEl = document.createElement("div");
      tipEl.id = "u-tip";
      document.body.appendChild(tipEl);
    }
    tipEl.innerHTML = html;
    tipEl.style.display = "block";
    const vw = window.innerWidth;
    tipEl.style.left = U.clamp(x + 12, 8, Math.max(8, vw - 228)) + "px";
    tipEl.style.top = (y + 14) + "px";
  };
  U.hideTip = () => { if (tipEl) tipEl.style.display = "none"; };

  // ── 统一动画引擎：animated = [{start, dur, set(p)}]，滚动触发一次 ──
  // final=true 直接落完成帧（resize / 字体回退重排用）；尊重 reduced-motion。
  U.play = (animated, watchEl, opts = {}) => {
    if (opts.final || U.reduced()) {
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

  // ── 数字 count-up（fmt(t) 返回 HTML；reduced-motion 直接落终值）──
  U.countUp = (el, { dur = 1100, fmt = t => t.toFixed(0) }) => {
    if (U.reduced()) { el.innerHTML = fmt(1); return; }
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
