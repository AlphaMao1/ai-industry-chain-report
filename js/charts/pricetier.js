// §3 走量档/前沿档参数卡 + 收入池走廊（宿主 #chart-pricetier）
// 两张参数对比卡（牌价锚 / 折扣档 / 12 个月变化 / 弹性 / 机制注记；不使用任何字母代号）
// + 收入池走廊区间图（悲观/基准/乐观三情景切换高亮，点击下钻本报告测算口径）。
// 数据全部来自 RPT.priceTier / RPT.revenuePool。
(() => {
  const host = document.getElementById("chart-pricetier");
  if (!host || !window.RPT || !RPT.priceTier || !RPT.revenuePool) return;
  const PT = RPT.priceTier, RP = RPT.revenuePool;
  const body = U.frame(host, {
    title: "走量档 vs 前沿档：同一枚 token，两种价格纪律",
    sub: "参数卡 + 推理收入池走廊（本报告测算 · base 情景）· 点击卡片或走廊下钻",
    src: "本报告测算 · 官方披露",
  });

  const P = U.PAL, MONO = U.FONTS.mono;
  const css = `
  #chart-pricetier .pt-grid { display:grid; grid-template-columns:1fr 1fr; gap:22px; }
  @media (max-width:720px){ #chart-pricetier .pt-grid { grid-template-columns:1fr; } }
  #chart-pricetier .pt-card { border-top:2px solid var(--ink); border-bottom:1px solid var(--line-lo);
    padding:12px 4px 12px; cursor:pointer; background:none; }
  #chart-pricetier .pt-card:hover { background:var(--paper-hi); }
  #chart-pricetier .pt-card.f { border-top-color:var(--blue); }
  #chart-pricetier .pt-name { font-family:var(--serif); font-weight:700; font-size:15px; color:var(--ink); }
  #chart-pricetier .pt-card.f .pt-name { color:var(--blue-hi); }
  #chart-pricetier .pt-row { display:flex; justify-content:space-between; gap:12px;
    padding:8px 0; border-bottom:1px dashed var(--line-lo); }
  #chart-pricetier .pt-k { font-family:var(--mono); font-size:10px; color:var(--ink-lo); letter-spacing:.1em;
    padding-top:2px; white-space:nowrap; }
  #chart-pricetier .pt-v { font-family:var(--mono); font-size:12.5px; font-weight:700; color:var(--ink); text-align:right; }
  #chart-pricetier .pt-note { font-size:12px; color:var(--ink-md); line-height:1.7; margin-top:10px; }
  #chart-pricetier .pt-scn { display:flex; gap:16px; align-items:baseline; margin:22px 0 8px; flex-wrap:wrap; }
  #chart-pricetier .pt-scnlab { font-family:var(--mono); font-size:10px; color:var(--ink-lo); letter-spacing:.12em; }
  #chart-pricetier .pt-scnbtn { background:none; border:none; cursor:pointer; padding:2px 1px;
    border-bottom:2px solid transparent; font-family:var(--mono); font-weight:700; font-size:11.5px;
    color:var(--ink-lo); letter-spacing:.05em; }
  #chart-pricetier .pt-scnbtn.on { color:var(--blue); border-bottom-color:var(--blue); }
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const bind = (el, drill) => {
    el.setAttribute("data-drill-keep", "1");
    el.setAttribute("role", "button");
    el.tabIndex = 0;
    const open = e => U.showDrill({ title: drill.title, value: drill.value, sub: drill.sub,
      source: drill.source, x: e.clientX, y: e.clientY });
    el.addEventListener("click", open);
    el.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); }
    });
  };

  // ── 参数对比卡 ──
  const grid = document.createElement("div");
  grid.className = "pt-grid";
  body.appendChild(grid);
  [
    { key: "volume", cls: "", d: PT.volume, rows: [
      ["牌价锚", `$${PT.volume.list} / 百万 token`], ["折扣档", PT.volume.discount],
      ["12 个月变化", PT.volume.change12m], ["弹性", PT.volume.elasticity] ] },
    { key: "frontier", cls: "f", d: PT.frontier, rows: [
      ["牌价锚", `$${PT.frontier.list} / 百万 token`], ["折扣档", PT.frontier.discount],
      ["12 个月变化", PT.frontier.change12m], ["弹性", PT.frontier.elasticity] ] },
  ].forEach(c => {
    const el = document.createElement("div");
    el.className = "pt-card " + c.cls;
    el.innerHTML =
      `<div class="pt-name">${U.esc(c.d.name)}</div>` +
      c.rows.map(([k, v]) =>
        `<div class="pt-row"><span class="pt-k">${k}</span><span class="pt-v">${U.esc(v)}</span></div>`).join("") +
      `<div class="pt-note">${U.esc(c.d.note)}</div>`;
    bind(el, {
      title: c.d.name + "（本报告测算参数）",
      value: `牌价锚 $${c.d.list} · 折扣 ${c.d.discount} · 12 个月 ${c.d.change12m} · 弹性 ${c.d.elasticity}`,
      sub: c.d.note, source: "本报告测算 · 2026-07-17",
    });
    grid.appendChild(el);
  });

  // ── 收入池走廊（三情景切换）──
  const C = RP.corridor;
  const scn = document.createElement("div");
  scn.className = "pt-scn";
  body.appendChild(scn);
  const scnLab = document.createElement("span");
  scnLab.className = "pt-scnlab";
  scnLab.textContent = "推理收入池（年化）· 情景";
  scn.appendChild(scnLab);

  const svgEl = U.svgEl;
  const W = 920, H = 130, ML = 46, MR = 46, BAND_Y = 56, BAND_H = 22;
  const X0 = Math.floor(C.low * 0.9), X1 = Math.ceil(C.high * 1.1);
  const xOf = v => ML + (v - X0) / (X1 - X0) * (W - ML - MR);
  const scroller = document.createElement("div");
  scroller.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(scroller);
  const svg = svgEl("svg", {
    width: "100%", height: H, viewBox: `0 0 ${W} ${H}`,
    style: "display:block;min-width:560px", "data-drill-keep": "1",
  });
  scroller.appendChild(svg);
  const animated = [];

  const CASES = [
    { k: "low", name: "悲观", v: C.low, col: P.inkMd },
    { k: "base", name: "基准（base 情景）", v: C.base, col: P.blue },
    { k: "high", name: "乐观", v: C.high, col: P.ink },
  ];

  // 走廊带
  const band = svgEl("rect", { x: xOf(C.low), y: BAND_Y, width: 0, height: BAND_H,
    fill: "rgba(34,81,255,.12)", stroke: P.blue, "stroke-width": 1 });
  svg.appendChild(band);
  animated.push({ start: 0.1, dur: 0.6, set: p => { band.setAttribute("width", Math.max(0, (xOf(C.high) - xOf(C.low)) * p)); } });
  // 轴
  const ax = svgEl("line", { x1: xOf(X0), y1: BAND_Y + BAND_H + 14, x2: xOf(X0), y2: BAND_Y + BAND_H + 14,
    stroke: P.ink, "stroke-width": 1 });
  svg.appendChild(ax);
  animated.push({ start: 0, dur: 0.5, set: p => { ax.setAttribute("x2", xOf(X0) + (xOf(X1) - xOf(X0)) * p); } });

  const markers = [];
  CASES.forEach((cs, i) => {
    const g = svgEl("g", { style: "cursor:pointer", role: "button", tabindex: "0" });
    svg.appendChild(g);
    const stem = svgEl("line", { x1: xOf(cs.v), x2: xOf(cs.v), y1: BAND_Y - 12, y2: BAND_Y + BAND_H + 14,
      stroke: cs.col, "stroke-width": cs.k === "base" ? 2 : 1, opacity: 0 });
    g.appendChild(stem);
    const dot = svgEl("circle", { cx: xOf(cs.v), cy: BAND_Y + BAND_H / 2, r: 0,
      fill: cs.k === "base" ? P.blue : P.paperHi, stroke: cs.col, "stroke-width": 1.5 });
    g.appendChild(dot);
    const lb = svgEl("text", { x: xOf(cs.v), y: BAND_Y - 20, "text-anchor": "middle",
      style: `font:700 12px ${MONO};fill:${cs.col}`, opacity: 0 });
    lb.textContent = "$" + Math.round(cs.v) + "B";
    const nm = svgEl("text", { x: xOf(cs.v), y: BAND_Y + BAND_H + 32, "text-anchor": "middle",
      style: `font:9.5px ${MONO};fill:${P.inkMd}`, opacity: 0 });
    nm.textContent = cs.name;
    [stem, dot, lb, nm].forEach(el => g.appendChild(el));
    animated.push({ start: 0.5 + i * 0.12, dur: 0.25, set: p => {
      stem.setAttribute("opacity", p); dot.setAttribute("r", (cs.k === "base" ? 7 : 5) * p);
      lb.setAttribute("opacity", p); nm.setAttribute("opacity", p);
    } });
    const open = e => U.showDrill({ title: RP.drill.title + " · " + cs.name,
      value: cs.name === "基准（base 情景）" ? RP.drill.value : `$${Math.round(cs.v)}B（走廊 ${RP.corridor.display}）`,
      sub: RP.drill.sub, source: RP.drill.source, x: e.clientX, y: e.clientY });
    g.addEventListener("click", open);
    g.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); }
    });
    markers.push({ cs, stem, dot, lb });
  });

  // 情景切换按钮
  const setActive = k => {
    markers.forEach(m => {
      const on = m.cs.k === k;
      m.dot.setAttribute("r", on ? 7 : 5);
      m.dot.setAttribute("fill", on ? m.cs.col : (m.cs.k === "base" ? P.blue : P.paperHi));
      m.stem.setAttribute("stroke-width", on ? 2.5 : (m.cs.k === "base" ? 2 : 1));
    });
    [...scn.querySelectorAll(".pt-scnbtn")].forEach(b => {
      const on = b.dataset.k === k;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  };
  CASES.forEach(cs => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pt-scnbtn";
    b.dataset.k = cs.k;
    b.textContent = cs.name.split("（")[0] + " $" + Math.round(cs.v) + "B";
    b.addEventListener("click", () => setActive(cs.k));
    scn.appendChild(b);
  });
  setActive("base");

  U.play(animated, svg, { threshold: 0.3 });

  // 走廊脚注：已知局限与自校验指引（把下钻里的警示提到图面）
  const lim = document.createElement("p");
  lim.style.cssText = `font:10px ${U.FONTS.mono};color:${P.inkMd};margin-top:8px;line-height:1.7`;
  lim.textContent = "已知局限：" + String(RP.drill.sub || "").replace(/^已知局限：/, "") + " 自校验警示见前沿档红栏图。";
  body.appendChild(lim);

  U.reveal(body, ".pt-card", 130);
})();
