// §3 前沿档自校验警示柱（宿主 #chart-fcheck）
// 同一外推模型，两种命运：走量档 12 个月 $99.6B→$105.8B（对照，Jevons 持平）
// vs 前沿档 $226B→$1.366 万亿（红色警示爆炸柱）+"本报告判断此处必有一错"标签。
// 点击下钻两个方向证据（用量增速下台阶 / 价格扛不住）+ 对账纪律。数据全部来自 RPT.revenuePool。
(() => {
  const host = document.getElementById("chart-fcheck");
  if (!host || !window.RPT || !RPT.revenuePool || !RPT.revenuePool.selfCheck) return;
  const RP = RPT.revenuePool, SC = RP.selfCheck;
  const body = U.frame(host, {
    title: "前沿档自校验：这个外推不可能成立",
    sub: "左 = 走量档对照（量升价跌对冲）· 右 = 前沿档警示（红）· 点击任意柱下钻两个方向的证据",
    src: RP.drill.source || "本报告测算",
  });

  const P = U.PAL, MONO = U.FONTS.mono;
  const svgEl = U.svgEl;

  const W = 1080, H = 470, TOP = 96, BOT = 66, ML = 62, MR = 26;
  const MIN_W = 720;
  const yMax = Math.ceil(SC.frontier.to * 1.06 / 100) * 100;
  const yOf = v => (H - BOT) - v / yMax * (H - BOT - TOP);

  const scroller = document.createElement("div");
  scroller.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(scroller);
  const svg = svgEl("svg", {
    width: "100%", height: H, viewBox: `0 0 ${W} ${H}`,
    style: `display:block;min-width:${MIN_W}px`, "data-drill-keep": "1",
  });
  scroller.appendChild(svg);
  const animated = [];

  // ── 网格 ──
  for (let v = 0; v <= yMax; v += 250) {
    svg.appendChild(svgEl("line", { x1: ML, x2: W - MR, y1: yOf(v), y2: yOf(v), stroke: P.lineLo }));
    const t = svgEl("text", { x: ML - 8, y: yOf(v) + 3.5, "text-anchor": "end",
      style: `font:9.5px ${MONO};fill:${P.inkLo}` });
    t.textContent = v >= 1000 ? "$" + (v / 1000).toFixed(1) + "T" : "$" + v + "B";
    svg.appendChild(t);
  }

  // ── 顶部警示标签（红色发丝框 + 判词，文本来自数据 verdict）──
  const mc = document.createElement("canvas").getContext("2d");
  mc.font = `700 12.5px ${U.FONTS.serif}`;
  const verdict = SC.verdict;
  const vLines = [];
  { let cur = ""; const maxW = W - ML - MR - 40;
    for (const ch of verdict) {
      if (cur && mc.measureText(cur + ch).width > maxW) { vLines.push(cur); cur = ch; }
      else cur += ch;
    }
    if (cur) vLines.push(cur); }
  const banner = svgEl("g", { style: "cursor:pointer", role: "button", tabindex: "0" });
  svg.appendChild(banner);
  const bRect = svgEl("rect", { x: ML, y: 14, width: W - ML - MR, height: 26 + vLines.length * 17,
    fill: "rgba(194,47,78,.06)", stroke: P.red, "stroke-width": 1.2 });
  banner.appendChild(bRect);
  const bTag = svgEl("text", { x: ML + 14, y: 33, style: `font:10px ${MONO};fill:${P.red};letter-spacing:.14em` });
  bTag.textContent = "自校验警示";
  banner.appendChild(bTag);
  vLines.forEach((ln, i) => {
    const t = svgEl("text", { x: ML + 14, y: 51 + i * 17, style: `font:700 12.5px ${U.FONTS.serif};fill:${P.red}` });
    t.textContent = ln;
    banner.appendChild(t);
  });
  animated.push({ start: 1.1, dur: 0.4, set: p => banner.setAttribute("opacity", p) });
  banner.setAttribute("opacity", 0);

  // ── 两组对比柱 ──
  const fmtB = v => v >= 1000 ? "$" + (v / 1000).toFixed(3).replace(/0+$/, "").replace(/\.$/, "") + " 万亿"
    : v < 100 ? "$" + v.toFixed(1) + "B" : "$" + Math.round(v) + "B";
  const drillFor = pairName => ({
    title: "自校验 · " + pairName + "（本报告测算）",
    value: verdict,
    sub: SC.volume.note + " " + SC.frontier.note + (RP.reconcile ? " 对账纪律：" + RP.reconcile : ""),
    source: RP.drill.source || "本报告测算",
  });
  const panels = [
    { x0: ML + 30, name: "走量档 · 对照", a: SC.volume.from, b: SC.volume.to, col: P.ink, warn: false,
      note: SC.volume.note },
    { x0: ML + 420, name: "前沿档 · 警示", a: SC.frontier.from, b: SC.frontier.to, col: P.red, warn: true,
      note: SC.frontier.note },
  ];
  const BW = 74;
  panels.forEach((pn, pi) => {
    const gl = svgEl("text", { x: pn.x0, y: TOP - 8, style: `font:700 11px ${MONO};fill:${pn.warn ? P.red : P.inkMd}` });
    gl.textContent = pn.name;
    svg.appendChild(gl);
    animated.push({ start: 0.15 + pi * 0.2, dur: 0.3, set: p => gl.setAttribute("opacity", p) });

    [[pn.a, "当前", 0.55], [pn.b, "+12 个月外推", pn.warn ? 0.95 : 0.8]].forEach(([v, tag, op], j) => {
      const cx = pn.x0 + j * (BW + 26) + BW / 2;
      const S = 0.25 + pi * 0.3 + j * 0.15;
      const r = svgEl("rect", { x: cx - BW / 2, width: BW, fill: pn.col, opacity: op,
        style: "cursor:pointer", role: "button", tabindex: "0" });
      svg.appendChild(r);
      animated.push({ start: S, dur: 0.6, set: p => {
        r.setAttribute("y", (H - BOT) - ((H - BOT) - yOf(v)) * p);
        r.setAttribute("height", ((H - BOT) - yOf(v)) * p);
      } });
      const lb = svgEl("text", { x: cx, "text-anchor": "middle",
        style: `font:700 13px ${MONO};fill:${pn.col}`, opacity: 0 });
      lb.textContent = fmtB(v);
      svg.appendChild(lb);
      animated.push({ start: S + 0.45, dur: 0.25, set: p => {
        lb.setAttribute("opacity", p); lb.setAttribute("y", yOf(v) - 10 + 5 * (1 - p));
      } });
      const tg = svgEl("text", { x: cx, y: H - BOT + 20, "text-anchor": "middle",
        style: `font:9.5px ${MONO};fill:${P.inkLo}` });
      tg.textContent = tag;
      svg.appendChild(tg);
      animated.push({ start: S + 0.3, dur: 0.25, set: p => tg.setAttribute("opacity", p) });
      const open = e => { const d = drillFor(pn.name); U.showDrill({ ...d, x: e.clientX, y: e.clientY }); };
      r.addEventListener("click", open);
      r.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); }
      });
    });

    // 组注（数据原文注记）
    const nl = svgEl("text", { x: pn.x0, y: H - BOT + 40,
      style: `font:9.5px ${MONO};fill:${pn.warn ? P.red : P.inkMd}`, opacity: 0 });
    nl.textContent = pn.note;
    svg.appendChild(nl);
    animated.push({ start: 1.0 + pi * 0.2, dur: 0.3, set: p => nl.setAttribute("opacity", p) });

    // 警示组的爆炸箭头
    if (pn.warn) {
      const ar = svgEl("path", {
        d: `M ${pn.x0 + BW + 4} ${yOf(pn.a) - 6} L ${pn.x0 + BW + 22} ${yOf(pn.b) + 46}`,
        stroke: P.red, "stroke-width": 1.2, "stroke-dasharray": "3 3", fill: "none", opacity: 0 });
      svg.appendChild(ar);
      animated.push({ start: 1.15, dur: 0.3, set: p => ar.setAttribute("opacity", 0.75 * p) });
    }
  });

  // 警示标签点击下钻
  const openBanner = e => { const d = drillFor("前沿档"); U.showDrill({ ...d, x: e.clientX, y: e.clientY }); };
  banner.addEventListener("click", openBanner);
  banner.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openBanner(e); }
  });

  U.play(animated, svg, { threshold: 0.25 });
})();
