// §3 中国价格阶梯双线（宿主 #chart-chinafrontier）
// Kimi 三点阶梯（K2→K2.6→K3 连涨三代）+ Qwen 两点阶梯，对照 DeepSeek 牌价（空心/虚线）
// 与实付（实心/实线）两条水平带及其落差。step-after 阶梯线；点代下钻。
// 数据全部来自 RPT.chinaFrontier。
(() => {
  const host = document.getElementById("chart-chinafrontier");
  if (!host || !window.RPT || !RPT.chinaFrontier) return;
  const CF = RPT.chinaFrontier;
  const body = U.frame(host, {
    title: "中国旗舰价格阶梯：集体提价与唯一例外（美元/百万 token · 输入价）",
    sub: "电蓝 = Kimi · 墨 = Qwen · 红 = DeepSeek（空心牌价 / 实心实付）· 阶梯 = 官方提价事件 · 点击任意点下钻",
    src: "官方披露",
  });

  const P = U.PAL, MONO = U.FONTS.mono;
  const svgEl = U.svgEl;
  const T = s => new Date(s.length > 7 ? s.slice(0, 7) + "-01T00:00:00" : s + "-01T00:00:00");
  const kimi = CF.kimi.map(d => ({ ...d, t: T(d.date) })).sort((a, b) => a.t - b.t);
  const qwen = CF.qwen.map(d => ({ ...d, t: T(d.date) })).sort((a, b) => a.t - b.t);
  const ds = CF.deepseek;

  const W = 1080, H = 410, ML = 58, MR = 120, TOP = 36, BOT = 48;
  const MIN_W = 760;
  const allT = [...kimi, ...qwen].map(d => d.t);
  const t0 = new Date(Math.min(...allT)), t1 = new Date(Math.max(...allT));
  const pad = (t1 - t0) * 0.08;
  const xOf = t => ML + (t - (t0 - pad)) / ((t1 + pad) - (t0 - pad)) * (W - ML - MR);
  const yMax = Math.max(3.3, ds.list * 1.1);
  const yOf = p => (H - BOT) - p / yMax * (H - BOT - TOP);

  const scroller = document.createElement("div");
  scroller.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(scroller);
  const svg = svgEl("svg", {
    width: "100%", height: H, viewBox: `0 0 ${W} ${H}`,
    style: `display:block;min-width:${MIN_W}px`, "data-drill-keep": "1",
  });
  scroller.appendChild(svg);
  const animated = [];

  // ── 网格与时间刻度 ──
  for (let v = 0; v <= yMax; v += 1) {
    svg.appendChild(svgEl("line", { x1: ML, x2: W - MR, y1: yOf(v), y2: yOf(v), stroke: P.lineLo }));
    const t = svgEl("text", { x: ML - 8, y: yOf(v) + 3.5, "text-anchor": "end",
      style: `font:10px ${MONO};fill:${P.inkLo}` });
    t.textContent = "$" + v;
    svg.appendChild(t);
  }
  for (let d = new Date(t0.getFullYear(), t0.getMonth(), 1); d <= t1; d = new Date(d.getFullYear(), d.getMonth() + 3, 1)) {
    const t = svgEl("text", { x: xOf(d), y: H - BOT + 20, "text-anchor": "middle",
      style: `font:9.5px ${MONO};fill:${P.inkLo}` });
    t.textContent = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    svg.appendChild(t);
  }

  // ── 阶梯线（step-after）──
  const stepPath = pts => {
    let d = `M ${xOf(pts[0].t)} ${yOf(pts[0].price)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${xOf(pts[i].t)} ${yOf(pts[i - 1].price)} L ${xOf(pts[i].t)} ${yOf(pts[i].price)}`;
    }
    d += ` L ${xOf(t1) + 40} ${yOf(pts[pts.length - 1].price)}`;
    return d;
  };
  const SERIES = [
    { name: "Kimi（连涨三代）", col: P.blue, pts: kimi },
    { name: "Qwen", col: P.ink, pts: qwen },
  ];
  SERIES.forEach((s, si) => {
    const path = svgEl("path", { d: stepPath(s.pts), fill: "none", stroke: s.col, "stroke-width": 1.8 });
    svg.appendChild(path);
    const len = path.getTotalLength();
    path.setAttribute("stroke-dasharray", len);
    animated.push({ start: 0.1 + si * 0.25, dur: 0.9, set: p => path.setAttribute("stroke-dashoffset", len * (1 - p)) });

    s.pts.forEach((d, i) => {
      const S = 0.15 + si * 0.25 + (i / Math.max(1, s.pts.length - 1)) * 0.55;
      const g = svgEl("g", { style: "cursor:pointer", role: "button", tabindex: "0" });
      svg.appendChild(g);
      g.appendChild(svgEl("circle", { cx: xOf(d.t), cy: yOf(d.price), r: 14, fill: "transparent" }));
      const c = svgEl("circle", { cx: xOf(d.t), cy: yOf(d.price), r: 0,
        fill: s.col, stroke: P.paperHi, "stroke-width": 1.5 });
      g.appendChild(c);
      const lb = svgEl("text", { x: xOf(d.t), y: yOf(d.price) - 11, "text-anchor": "middle",
        style: `font:700 10px ${MONO};fill:${s.col}` });
      lb.textContent = `${d.label.replace(/（.*）/, "")} $${d.price}`;
      const dt = svgEl("text", { x: xOf(d.t), y: yOf(d.price) + 17, "text-anchor": "middle",
        style: `font:8.5px ${MONO};fill:${P.inkLo}` });
      dt.textContent = d.date;
      [c, lb, dt].forEach((el, k) => {
        g.appendChild(el); if (k) el.setAttribute("opacity", 0);
      });
      animated.push({ start: S, dur: 0.2, set: p => c.setAttribute("r", 5 * p) });
      animated.push({ start: S + 0.08, dur: 0.22, set: p => { lb.setAttribute("opacity", p); dt.setAttribute("opacity", p); } });
      g.addEventListener("mouseenter", () => c.setAttribute("r", 7));
      g.addEventListener("mouseleave", () => c.setAttribute("r", 5));
      const open = e => U.showDrill({ title: d.drill.title, value: d.drill.value, sub: d.drill.sub,
        source: d.drill.source, x: e.clientX, y: e.clientY });
      g.addEventListener("click", open);
      g.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); }
      });
    });

    // 系列名（末点右侧）
    const last = s.pts[s.pts.length - 1];
    const nm = svgEl("text", { x: xOf(t1) + 46, y: yOf(last.price) + 4,
      style: `font:700 10.5px ${MONO};fill:${s.col}` });
    nm.textContent = s.name;
    svg.appendChild(nm);
    animated.push({ start: 0.95 + si * 0.1, dur: 0.25, set: p => nm.setAttribute("opacity", p) });
  });

  // ── DeepSeek：牌价虚线带 + 实付实线带 + 落差 ──
  if (ds) {
    const g = svgEl("g", { style: "cursor:pointer", role: "button", tabindex: "0" });
    svg.appendChild(g);
    const xR = xOf(t1) + 40;
    // 落差区带
    const gap = svgEl("rect", { x: ML, y: yOf(ds.list), width: 0, height: yOf(ds.effective) - yOf(ds.list),
      fill: "rgba(194,47,78,.07)" });
    g.appendChild(gap);
    animated.push({ start: 0.55, dur: 0.45, set: p => { gap.setAttribute("width", (xR - ML) * p); } });
    // 牌价（虚线）
    const l1 = svgEl("line", { x1: ML, x2: ML, y1: yOf(ds.list), y2: yOf(ds.list),
      stroke: P.red, "stroke-width": 1.2, "stroke-dasharray": "4 3" });
    g.appendChild(l1);
    animated.push({ start: 0.5, dur: 0.5, set: p => { l1.setAttribute("x2", ML + (xR - ML) * p); } });
    // 实付（实线，粗）
    const l2 = svgEl("line", { x1: ML, x2: ML, y1: yOf(ds.effective), y2: yOf(ds.effective),
      stroke: P.red, "stroke-width": 2.2 });
    g.appendChild(l2);
    animated.push({ start: 0.6, dur: 0.5, set: p => { l2.setAttribute("x2", ML + (xR - ML) * p); } });
    // 端点：空心牌价 / 实心实付
    const cList = svgEl("circle", { cx: xR, cy: yOf(ds.list), r: 0,
      fill: "none", stroke: P.red, "stroke-width": 1.5, "stroke-dasharray": "2 2" });
    const cEff = svgEl("circle", { cx: xR, cy: yOf(ds.effective), r: 0,
      fill: P.red, stroke: P.paperHi, "stroke-width": 1.5 });
    g.appendChild(cList); g.appendChild(cEff);
    animated.push({ start: 0.85, dur: 0.2, set: p => cList.setAttribute("r", 5 * p) });
    animated.push({ start: 0.92, dur: 0.2, set: p => cEff.setAttribute("r", 5 * p) });
    // 标注
    const t1l = svgEl("text", { x: ML + 8, y: yOf(ds.list) - 7, style: `font:9.5px ${MONO};fill:${P.red}` });
    t1l.textContent = `${ds.label} 牌价 $${ds.list}`;
    const t2l = svgEl("text", { x: ML + 8, y: yOf(ds.effective) + 15, style: `font:700 9.5px ${MONO};fill:${P.red}` });
    t2l.textContent = `实付 $${ds.effective}（长期 75 折，落差 = 牌价涨、实付稳）`;
    const t3l = svgEl("text", { x: xOf(t1) + 46, y: yOf(ds.effective) + 4,
      style: `font:700 10.5px ${MONO};fill:${P.red}` });
    t3l.textContent = "DeepSeek";
    [t1l, t2l, t3l].forEach((el, k) => {
      g.appendChild(el); el.setAttribute("opacity", 0);
      animated.push({ start: 0.95 + k * 0.08, dur: 0.22, set: p => el.setAttribute("opacity", p) });
    });
    const open = e => U.showDrill({ title: ds.drill.title, value: ds.drill.value, sub: ds.drill.sub,
      source: ds.drill.source, x: e.clientX, y: e.clientY });
    g.addEventListener("click", open);
    g.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); }
    });
  }

  U.play(animated, svg, { threshold: 0.25 });

  // 脚注（GLM 与集体提价注记，数据驱动）
  if (CF.note) {
    const f = document.createElement("p");
    f.style.cssText = `font:10px ${MONO};color:${P.inkMd};margin-top:8px;line-height:1.7`;
    f.textContent = CF.note;
    body.appendChild(f);
  }
})();
