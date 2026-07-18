// §2 历史先例对照时间轴（宿主 #chart-precedents）
// 1897 → 2026 六锚：两部制电价 / 施乐 / 分时服务局 / AOL / MoviePass / 电信包月悔意。
// 线性年轴，锚点上下交替防碰撞；"2017→2026" 画成区间括线；点锚下钻（含教训全文）。
// 数据全部来自 RPT.metering.precedents。
(() => {
  const host = document.getElementById("chart-precedents");
  if (!host || !window.RPT || !RPT.metering || !RPT.metering.precedents) return;
  const PRE = RPT.metering.precedents;
  const body = U.frame(host, {
    title: "计量切换的六个先例（1897–2026）",
    sub: "每一次计量切换，都是定价权的一次易手 · 蓝 = 与今天同构 · 点击任意锚点下钻",
    src: "媒体报道与访谈 · 史料",
  });

  const P = U.PAL, MONO = U.FONTS.mono, SERIF = U.FONTS.serif;
  const svgEl = U.svgEl;

  // 年份解析："2017→2026" → {a:2017, b:2026}；其余单点
  const parseY = s => {
    const m = String(s).split("→").map(t => parseFloat(t));
    return m.length > 1 ? { a: m[0], b: m[1] } : { a: m[0], b: m[0] };
  };
  const items = PRE.map((p, i) => ({ ...p, i, ...parseY(p.year) }));

  const W = 1080, H = 330, ML = 46, MR = 30, AXIS_Y = 168;
  const MIN_W = 680;
  const X0 = 1890, X1 = 2033;
  const xOf = y => ML + (y - X0) / (X1 - X0) * (W - ML - MR);

  const scroller = document.createElement("div");
  scroller.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(scroller);
  const svg = svgEl("svg", {
    width: "100%", height: H, viewBox: `0 0 ${W} ${H}`,
    style: `display:block;min-width:${MIN_W}px`, "data-drill-keep": "1",
  });
  scroller.appendChild(svg);
  const animated = [];

  // ── 年轴 + 刻度 ──
  const ax = svgEl("line", { x1: xOf(X0), y1: AXIS_Y, x2: xOf(X0), y2: AXIS_Y, stroke: P.ink, "stroke-width": 1.2 });
  svg.appendChild(ax);
  animated.push({ start: 0, dur: 0.7, set: p => { ax.setAttribute("x2", xOf(X0) + (xOf(X1) - xOf(X0)) * p); } });
  for (let y = 1900; y <= 2020; y += 20) {
    const x = xOf(y);
    svg.appendChild(svgEl("line", { x1: x, y1: AXIS_Y - 4, x2: x, y2: AXIS_Y + 4, stroke: P.inkMd, "stroke-width": 1 }));
    const t = svgEl("text", { x, y: AXIS_Y + 22, "text-anchor": "middle",
      style: `font:9.5px ${MONO};fill:${P.inkLo};letter-spacing:.08em` });
    t.textContent = y;
    svg.appendChild(t);
  }

  // 文本量宽（防标签溢出）
  const mc = document.createElement("canvas").getContext("2d");
  const tw = (s, f) => { mc.font = f; return mc.measureText(s).width; };

  // ── 锚点：上下交替 ──
  items.forEach((it, k) => {
    const up = k % 2 === 0;
    const isRange = it.b > it.a;
    const isCur = String(it.year).includes("2026");
    const c = isCur ? P.blue : P.ink;
    const xc = xOf((it.a + it.b) / 2);
    const S = 0.18 + k * 0.12;
    const cardW = Math.min(212, Math.max(120, Math.ceil(Math.max(
      tw(it.name, `700 12.5px ${SERIF}`), tw(it.event, `9.5px ${MONO}`), tw(it.lesson, `8.5px ${MONO}`))) + 18));
    // 事件行超出卡宽则截断（全文在下钻卡）
    let evTxt = it.event;
    while (evTxt.length > 2 && tw(evTxt + "…", `9.5px ${MONO}`) > cardW - 18) evTxt = evTxt.slice(0, -1);
    if (evTxt !== it.event) evTxt += "…";
    // 教训行（"为何重要"注记上卡面；超长截断，全文在下钻）
    let lsTxt = it.lesson;
    while (lsTxt.length > 2 && tw(lsTxt + "…", `8.5px ${MONO}`) > cardW - 18) lsTxt = lsTxt.slice(0, -1);
    if (lsTxt !== it.lesson) lsTxt += "…";
    const cx0 = U.clamp(xc - cardW / 2, 8, W - 8 - cardW);
    const cy = up ? 26 : AXIS_Y + 56;
    const stemTop = up ? cy + 64 : AXIS_Y + (isRange ? 6 : 5);
    const stemBot = up ? AXIS_Y - (isRange ? 6 : 5) : cy;
    const g = svgEl("g", { style: "cursor:pointer", role: "button", tabindex: "0" });
    svg.appendChild(g);

    // 区间括线（2017→2026）
    if (isRange) {
      const rg = svgEl("rect", { x: xOf(it.a), y: AXIS_Y - 2.5, width: 0, height: 5,
        fill: "rgba(34,81,255,.2)", stroke: P.blue, "stroke-width": 0.8 });
      g.appendChild(rg);
      animated.push({ start: S, dur: 0.4, set: p => { rg.setAttribute("width", Math.max(0, (xOf(it.b) - xOf(it.a)) * p)); } });
    }
    // 端点
    [it.a, ...(isRange ? [it.b] : [])].forEach((yy, j) => {
      const dot = svgEl("circle", { cx: xOf(yy), cy: AXIS_Y, r: 0,
        fill: isCur ? P.blue : P.paper, stroke: c, "stroke-width": 1.3 });
      g.appendChild(dot);
      animated.push({ start: S + 0.3 + j * 0.06, dur: 0.18, set: p => { dot.setAttribute("r", 3.6 * p); } });
    });
    // 茎线
    const sx = U.clamp(xc, cx0 + 12, cx0 + cardW - 12);
    const stem = svgEl("line", { x1: sx, x2: sx, y1: stemTop, y2: stemTop,
      stroke: isCur ? "rgba(34,81,255,.5)" : "rgba(10,31,51,.3)", "stroke-width": 1 });
    g.appendChild(stem);
    animated.push({ start: S + 0.12, dur: 0.3, set: p => {
      stem.setAttribute("y2", stemTop + (stemBot - stemTop) * p);
    } });

    // 卡片（年份 / 名称 / 事件 / 教训）
    const rect = svgEl("rect", { x: cx0, y: cy, width: cardW, height: 64,
      fill: P.paperHi, stroke: c, "stroke-width": 1 });
    g.appendChild(rect);
    const per = 2 * (cardW + 64);
    rect.setAttribute("stroke-dasharray", per);
    animated.push({ start: S, dur: 0.4, set: p => { rect.setAttribute("stroke-dashoffset", per * (1 - p)); } });
    const ey = svgEl("text", { x: cx0 + 9, y: cy + 14, style: `font:9px ${MONO};fill:${c}` });
    ey.textContent = it.year;
    const nm = svgEl("text", { x: cx0 + 9, y: cy + 30, style: `font:700 12.5px ${SERIF};fill:${c}` });
    nm.textContent = it.name;
    const ev = svgEl("text", { x: cx0 + 9, y: cy + 45, style: `font:9.5px ${MONO};fill:${P.inkMd}` });
    ev.textContent = evTxt;
    const ls = svgEl("text", { x: cx0 + 9, y: cy + 58, style: `font:8.5px ${MONO};fill:${P.inkLo}` });
    ls.textContent = "教训 " + lsTxt;
    [ey, nm, ev, ls].forEach((el, j) => {
      g.appendChild(el); el.setAttribute("opacity", 0);
      animated.push({ start: S + 0.2 + j * 0.05, dur: 0.25, set: p => { el.setAttribute("opacity", p); } });
    });

    // 悬停：教训轻提示；点击：完整下钻（触屏替代）
    g.addEventListener("mouseenter", e => {
      rect.setAttribute("stroke-width", 2);
      U.showTip(U.esc(it.lesson), e.clientX, e.clientY);
    });
    g.addEventListener("mousemove", e => U.showTip(U.esc(it.lesson), e.clientX, e.clientY));
    g.addEventListener("mouseleave", () => { rect.setAttribute("stroke-width", 1); U.hideTip(); });
    const open = e => U.showDrill({ title: it.drill.title, value: it.drill.value,
      sub: it.drill.sub + " 教训：" + it.lesson, source: it.drill.source, x: e.clientX, y: e.clientY });
    g.addEventListener("click", open);
    g.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); }
    });
  });

  U.play(animated, svg, { threshold: 0.25 });
})();
