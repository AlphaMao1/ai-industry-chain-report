// §3 旗舰价格 V 形反转（宿主 #chart-frontier）
// 对数价格轴散点+连线：谷底 GPT-5 $1.25（红色虚线参考线）→ 连续多代上移 → 当前在售旗舰为谷底 4 倍。
// 档位三色（墨=旗舰 / 浅蓝=推理档 / 电蓝=超档）；关键点加粗标签；同日两点标签错位防叠；
// 点拐点下钻（定价页日期与档位）。数据全部来自 RPT.frontierPrice / RPT.frontierExtras。
(() => {
  const host = document.getElementById("chart-frontier");
  if (!host || !window.RPT || !RPT.frontierPrice) return;
  const body = U.frame(host, {
    title: "旗舰价格 V 形反转（美元/百万 token · 输入价 · 对数轴）",
    sub: "墨 = 常规旗舰 · 浅蓝 = 推理档 · 电蓝 = 超档 · 红虚线 = 谷底参考线 · 点击任意点下钻",
    src: "官方披露 · 券商研究",
  });

  const P = U.PAL, MONO = U.FONTS.mono, SERIF = U.FONTS.serif;
  const svgEl = U.svgEl;
  const data = RPT.frontierPrice.map(d => ({ ...d, t: new Date(d.date + "-01T00:00:00") }))
    .sort((a, b) => a.t - b.t);
  const TCOL = { frontier: P.ink, reasoning: P.blueLo, super: P.blue };
  const TCNL = { frontier: "常规旗舰", reasoning: "推理档", super: "超档" };

  const W = 1080, H = 440, ML = 58, MR = 30, TOP = 40, BOT = 48;
  const MIN_W = 760;
  const t0 = data[0].t, t1 = data[data.length - 1].t;
  const pad = (t1 - t0) * 0.04;
  const xOf = t => ML + (t - (t0 - pad)) / ((t1 + pad) - (t0 - pad)) * (W - ML - MR);
  const yOf = p => {  // log10 轴，域 [1, 200]
    const v = Math.min(200, Math.max(1, p));
    return (H - BOT) - Math.log10(v) / Math.log10(200) * (H - BOT - TOP);
  };

  const scroller = document.createElement("div");
  scroller.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(scroller);
  const svg = svgEl("svg", {
    width: "100%", height: H, viewBox: `0 0 ${W} ${H}`,
    style: `display:block;min-width:${MIN_W}px`, "data-drill-keep": "1",
  });
  scroller.appendChild(svg);
  const animated = [];

  // ── 价格网格（log）──
  [1, 5, 10, 30, 100, 200].forEach(v => {
    svg.appendChild(svgEl("line", { x1: ML, x2: W - MR, y1: yOf(v), y2: yOf(v), stroke: P.lineLo }));
    const t = svgEl("text", { x: ML - 8, y: yOf(v) + 3.5, "text-anchor": "end",
      style: `font:10px ${MONO};fill:${P.inkLo}` });
    t.textContent = "$" + v;
    svg.appendChild(t);
  });
  // ── 时间刻度（每 6 个月）──
  for (let d = new Date(2024, 4, 1); d <= t1; d = new Date(d.getFullYear(), d.getMonth() + 6, 1)) {
    const t = svgEl("text", { x: xOf(d), y: H - BOT + 20, "text-anchor": "middle",
      style: `font:9.5px ${MONO};fill:${P.inkLo}` });
    t.textContent = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    svg.appendChild(t);
  }

  // ── 谷底参考线（GPT-5 2025-08）──
  const valley = data.find(d => d.label.includes("GPT-5（"));
  if (valley) {
    const vl = svgEl("line", { x1: xOf(valley.t), x2: xOf(valley.t), y1: TOP - 8, y2: TOP - 8,
      stroke: P.red, "stroke-width": 1, "stroke-dasharray": "3 4" });
    svg.appendChild(vl);
    animated.push({ start: 0.9, dur: 0.4, set: p => {
      vl.setAttribute("y2", TOP - 8 + (H - BOT - TOP + 8) * p); vl.setAttribute("opacity", 0.6 * p);
    } });
    const vt = svgEl("text", { x: xOf(valley.t), y: TOP - 13, "text-anchor": "middle",
      style: `font:9.5px ${MONO};fill:${P.red}` });
    vt.textContent = "谷底 2025-08 · 此后 V 形反转";
    svg.appendChild(vt);
    animated.push({ start: 1.15, dur: 0.25, set: p => vt.setAttribute("opacity", p) });
  }

  // ── 连线（时间序，平滑单调）──
  const pathPts = data.map(d => [xOf(d.t), yOf(d.price)]);
  // 单调三次插值（简化：Catmull-Rom 转 Bezier）
  let dPath = `M ${pathPts[0][0]} ${pathPts[0][1]}`;
  for (let i = 0; i < pathPts.length - 1; i++) {
    const p0 = pathPts[Math.max(0, i - 1)], p1 = pathPts[i], p2 = pathPts[i + 1],
      p3 = pathPts[Math.min(pathPts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    dPath += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
  }
  const path = svgEl("path", { d: dPath, fill: "none", stroke: P.inkMd, "stroke-width": 1.5, opacity: 0.7 });
  svg.appendChild(path);
  const len = path.getTotalLength();
  path.setAttribute("stroke-dasharray", len);
  animated.push({ start: 0.05, dur: 1.1, set: p => path.setAttribute("stroke-dashoffset", len * (1 - p)) });

  // ── 点 + 标签（同日分组错位）──
  const KEY = ["o1-pro（历史峰值）", "GPT-5（旗舰谷底）", "GPT-5.5 Pro（当前峰值）"];
  const dateGroups = {};
  data.forEach(d => { (dateGroups[d.date] = dateGroups[d.date] || []).push(d); });
  const gidx = {};
  data.forEach((d, i) => {
    const gi = (gidx[d.date] = (gidx[d.date] || 0) + 1) - 1;
    const col = TCOL[d.tier] || P.ink;
    const S = 0.12 + (i / data.length) * 0.9;
    const g = svgEl("g", { style: "cursor:pointer", role: "button", tabindex: "0" });
    svg.appendChild(g);
    g.appendChild(svgEl("circle", { cx: xOf(d.t), cy: yOf(d.price), r: 14, fill: "transparent" }));
    const dot = svgEl("circle", { cx: xOf(d.t), cy: yOf(d.price), r: 0,
      fill: col, stroke: P.paperHi, "stroke-width": 1.5 });
    g.appendChild(dot);
    animated.push({ start: S, dur: 0.22, set: p => dot.setAttribute("r", (KEY.includes(d.label) ? 5.5 : 4.5) * p) });
    const isKey = KEY.includes(d.label);
    const lb = svgEl("text", { x: xOf(d.t), y: yOf(d.price) - 11 - gi * 12, "text-anchor": "middle",
      style: `font:${isKey ? "700" : "400"} 10px ${MONO};fill:${col}` });
    lb.textContent = `${d.label.replace(/（.*）/, "")} $${d.price}`;
    const dt = svgEl("text", { x: xOf(d.t), y: yOf(d.price) + 18 + gi * 10, "text-anchor": "middle",
      style: `font:8.5px ${MONO};fill:${P.inkLo}` });
    dt.textContent = `${d.date} · ${TCNL[d.tier] || ""}`;
    [lb, dt].forEach((el, k) => {
      g.appendChild(el); el.setAttribute("opacity", 0);
      animated.push({ start: S + 0.08 + k * 0.04, dur: 0.22, set: p => el.setAttribute("opacity", p) });
    });
    g.addEventListener("mouseenter", () => dot.setAttribute("r", 7));
    g.addEventListener("mouseleave", () => dot.setAttribute("r", isKey ? 5.5 : 4.5));
    const open = e => U.showDrill({ title: d.drill.title, value: d.drill.value, sub: d.drill.sub,
      source: d.drill.source, x: e.clientX, y: e.clientY });
    g.addEventListener("click", open);
    g.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); }
    });
  });

  // ── 图例 ──
  const lg = svgEl("g", {});
  svg.appendChild(lg);
  Object.entries(TCNL).forEach(([k, v], i) => {
    lg.appendChild(svgEl("circle", { cx: ML + 6 + i * 96, cy: TOP - 22, r: 4, fill: TCOL[k] }));
    const t = svgEl("text", { x: ML + 15 + i * 96, y: TOP - 18, style: `font:9.5px ${MONO};fill:${P.inkMd}` });
    t.textContent = v;
    lg.appendChild(t);
  });
  animated.push({ start: 0.3, dur: 0.3, set: p => lg.setAttribute("opacity", p) });

  U.play(animated, svg, { threshold: 0.25 });

  // ── 脚注：价格梯子 + 走量档最大涨幅（数据驱动）──
  const FX = RPT.frontierExtras;
  if (FX) {
    const f = document.createElement("p");
    f.style.cssText = `font:10px ${MONO};color:${P.inkMd};margin-top:8px;line-height:1.7`;
    f.textContent = FX.ladder + (FX.volumeHike ? " " + FX.volumeHike.label + "：" + FX.volumeHike.note : "");
    body.appendChild(f);
  }
})();
