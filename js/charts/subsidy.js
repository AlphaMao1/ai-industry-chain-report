// §2 订阅补贴对照卡（宿主 #chart-subsidy）
// 大数字卡 ×4（70×/40×/$14,000/零毛利利用率）+ 零毛利阈值标尺（5.7% 红线 vs 10%/11.4%）。
// 标尺刻度值由卡片读数解析，点击任意卡下钻口径声明（SemiAnalysis 测算口径）。
// 数据全部来自 RPT.subsidy。
(() => {
  const host = document.getElementById("chart-subsidy");
  if (!host || !window.RPT || !RPT.subsidy) return;
  const SB = RPT.subsidy;
  const body = U.frame(host, {
    title: "订阅补贴有多深：包月价 vs API 等效",
    sub: "标价不等于成本，真实补贴深度必小于 70 倍 · 标尺 = 零毛利利用率阈值 · 点击下钻口径声明",
    src: "媒体报道与访谈 · 2026-06",
  });

  const P = U.PAL, MONO = U.FONTS.mono, SERIF = U.FONTS.serif;
  const css = `
  #chart-subsidy .sb-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:22px; }
  @media (max-width:720px){ #chart-subsidy .sb-grid { grid-template-columns:1fr; } }
  #chart-subsidy .sb-card { border-top:2px solid var(--ink); border-bottom:1px solid var(--line-lo);
    padding:13px 4px 11px; cursor:pointer; }
  #chart-subsidy .sb-card:hover { background:var(--paper-hi); }
  #chart-subsidy .sb-card.hot { border-top-color:var(--neg); }
  #chart-subsidy .sb-val { font-family:var(--mono); font-weight:700; font-size:25px; color:var(--ink); line-height:1.15; }
  #chart-subsidy .sb-card.hot .sb-val { color:var(--neg); }
  #chart-subsidy .sb-lab { font-family:var(--serif); font-size:12.5px; color:var(--ink-md); margin-top:6px; line-height:1.6; }
  #chart-subsidy .sb-note { font-family:var(--mono); font-size:10px; color:var(--ink-md);
    margin-top:10px; line-height:1.7; }
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

  const grid = document.createElement("div");
  grid.className = "sb-grid";
  body.appendChild(grid);
  SB.cards.forEach((c, i) => {
    const el = document.createElement("div");
    el.className = "sb-card" + (i === 0 ? " hot" : "");
    el.innerHTML = `<div class="sb-val">${U.esc(c.value)}</div><div class="sb-lab">${U.esc(c.label)}</div>`;
    bind(el, SB.drill);
    grid.appendChild(el);
  });

  // ── 零毛利阈值标尺（刻度由卡片读数解析；0–15% 线性）──
  const pcts = [];
  SB.cards.forEach(c => {
    String(c.value).match(/[\d.]+%/g)?.forEach(s => pcts.push(parseFloat(s)));
  });
  if (pcts.length) {
    const svgEl = U.svgEl;
    const line5 = pcts[0];                 // 5.7% 零毛利线（首卡读数）
    const rest = pcts.slice(1);            // 10% / 11.4%
    const W = 920, H = 96, ML = 40, MR = 40, AXIS_Y = 58;
    const xOf = v => ML + v / 15 * (W - ML - MR);
    const scroller = document.createElement("div");
    scroller.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch;margin-top:20px";
    body.appendChild(scroller);
    const svg = svgEl("svg", {
      width: "100%", height: H, viewBox: `0 0 ${W} ${H}`,
      style: "display:block;min-width:520px", "data-drill-keep": "1",
    });
    scroller.appendChild(svg);
    const animated = [];

    const lab = svgEl("text", { x: ML, y: 16, style: `font:10px ${MONO};fill:${P.inkMd};letter-spacing:.08em` });
    lab.textContent = "最高档利用率到多少就零毛利（%）";
    svg.appendChild(lab);
    animated.push({ start: 0, dur: 0.3, set: p => lab.setAttribute("opacity", p) });

    const ax = svgEl("line", { x1: xOf(0), y1: AXIS_Y, x2: xOf(0), y2: AXIS_Y, stroke: P.ink, "stroke-width": 1.1 });
    svg.appendChild(ax);
    animated.push({ start: 0.05, dur: 0.5, set: p => { ax.setAttribute("x2", xOf(0) + (xOf(15) - xOf(0)) * p); } });
    [0, 5, 10, 15].forEach(v => {
      svg.appendChild(svgEl("line", { x1: xOf(v), y1: AXIS_Y - 3, x2: xOf(v), y2: AXIS_Y + 3, stroke: P.inkMd }));
      const t = svgEl("text", { x: xOf(v), y: AXIS_Y + 17, "text-anchor": "middle",
        style: `font:9px ${MONO};fill:${P.inkLo}` });
      t.textContent = v + "%";
      svg.appendChild(t);
    });

    // 5.7% 红色零毛利线
    const rl = svgEl("line", { x1: xOf(line5), x2: xOf(line5), y1: 26, y2: 26,
      stroke: P.red, "stroke-width": 1.4 });
    svg.appendChild(rl);
    animated.push({ start: 0.35, dur: 0.4, set: p => { rl.setAttribute("y2", 26 + (AXIS_Y + 6 - 26) * p); } });
    const rt = svgEl("text", { x: xOf(line5), y: 22, "text-anchor": "middle",
      style: `font:700 10px ${MONO};fill:${P.red}` });
    rt.textContent = "零毛利线 " + line5 + "%";
    svg.appendChild(rt);
    animated.push({ start: 0.65, dur: 0.25, set: p => rt.setAttribute("opacity", p) });

    // 其他阈值点（10% / 11.4%）
    rest.forEach((v, i) => {
      const g = svgEl("g", { style: "cursor:pointer" });
      svg.appendChild(g);
      const d = svgEl("circle", { cx: xOf(v), cy: AXIS_Y, r: 0, fill: P.paperHi, stroke: P.ink, "stroke-width": 1.3 });
      g.appendChild(d);
      animated.push({ start: 0.55 + i * 0.1, dur: 0.2, set: p => d.setAttribute("r", 4 * p) });
      const t = svgEl("text", { x: xOf(v), y: AXIS_Y - 10, "text-anchor": "middle",
        style: `font:9.5px ${MONO};fill:${P.inkMd}` });
      t.textContent = v + "%";
      g.appendChild(t);
      animated.push({ start: 0.7 + i * 0.1, dur: 0.2, set: p => t.setAttribute("opacity", p) });
      g.addEventListener("click", e => U.showDrill({ title: SB.drill.title, value: SB.drill.value,
        sub: SB.drill.sub, source: SB.drill.source, x: e.clientX, y: e.clientY }));
    });
    // 零毛利线也可点
    rl.addEventListener("click", e => U.showDrill({ title: SB.drill.title, value: SB.drill.value,
      sub: SB.drill.sub, source: SB.drill.source, x: e.clientX, y: e.clientY }));
    rl.style.cursor = "pointer";

    U.play(animated, svg, { threshold: 0.3 });
  }

  // 口径注记（SemiAnalysis 测算口径）
  if (SB.note) {
    const n = document.createElement("p");
    n.className = "sb-note";
    n.textContent = SB.note;
    body.appendChild(n);
  }

  U.reveal(body, ".sb-card", 110);
})();
