// §5 需求锚点对数轴多序列（宿主 #chart-anchors）
// Google / 豆包 / Anthropic / Codex 四条已落地事实线；各单位不同，统一按各自起点归一
// （起点 = ×1），纵轴为相对倍数的对数刻度。直线连接 = 锚点间恒定增速插值。
// 悬停轻提示，点击锚点下钻日期与口径。数据：RPT.anchors。
(() => {
  const host = document.getElementById("chart-anchors");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "需求锚点：四条已落地事实线，起点归一的对数轨迹",
    sub: "纵轴 = 相对各自起点的倍数（对数刻度）· 点击任意锚点下钻原始读数与口径日期",
    src: "官方披露 · 媒体报道与访谈 · 截至 2026-07-17",
  });

  const P = U.PAL;
  const A = RPT.anchors;
  const SHORT = { google: "Google token 量", doubao: "豆包调用量", anthropic: "Anthropic 年化收入", codex: "Codex 周活" };
  const COLORS = U.SERIES; // 一图一族：蓝族 + 墨
  // 端点标签纵向避让（log 空间下豆包与 Codex 终点接近）
  const LAB_DY = { google: -6, anthropic: 2, doubao: 20, codex: -12 };

  const parseDate = s => {
    const m = String(s).match(/^(\d{4})(?:-(\d{2}))?/);
    return new Date(+m[1], m[2] ? +m[2] - 1 : 0, 1);
  };
  const series = A.map(a => ({
    a,
    pts: a.points.map(p => ({ d: parseDate(p.date), v: p.value, rel: p.value / a.points[0].value, date: p.date })),
  }));

  const sc = document.createElement("div");
  sc.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(sc);

  const W = 1080, H = 460, ML = 70, MR = 250, TOP = 46, BOT = 44;
  const allDates = series.flatMap(s => s.pts.map(p => p.d));
  const x = d3.scaleTime()
    .domain([d3.min(allDates), new Date(2026, 8, 15)])
    .range([ML, W - MR]);
  const yMaxRel = Math.max(...series.flatMap(s => s.pts.map(p => p.rel)));
  const y = d3.scaleLog().domain([0.8, Math.pow(10, Math.ceil(Math.log10(yMaxRel)))])
    .range([H - BOT, TOP]).clamp(true);

  const svg = d3.select(sc).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%").style("min-width", "780px").style("display", "block")
    .attr("data-drill-keep", "1");

  // 对数网格与刻度 ×1 / ×10 / ×100 / ×1000
  const yTicks = [1, 10, 100, 1000].filter(v => v <= y.domain()[1]);
  yTicks.forEach(v => {
    svg.append("line").attr("x1", ML).attr("x2", W - MR).attr("y1", y(v)).attr("y2", y(v))
      .attr("stroke", v === 1 ? P.inkMd : P.lineLo).attr("stroke-width", v === 1 ? 1.2 : 1);
    svg.append("text").attr("x", ML - 10).attr("y", y(v) + 3.5).attr("text-anchor", "end")
      .attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkLo}`).text("×" + v);
  });
  // 时间轴
  [2024, 2025, 2026].forEach(yr => {
    const d = new Date(yr, 0, 1);
    svg.append("line").attr("x1", x(d)).attr("x2", x(d)).attr("y1", TOP - 6).attr("y2", H - BOT)
      .attr("stroke", P.lineLo);
    svg.append("text").attr("x", x(d)).attr("y", H - BOT + 22).attr("text-anchor", "middle")
      .attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkLo}`).text(String(yr));
  });

  const animated = [];
  const fmtNum = v => (v >= 1000 ? d3.format(",")(v) : String(v));

  series.forEach((s, si) => {
    const col = COLORS[si % COLORS.length];
    const line = d3.line().x(p => x(p.d)).y(p => y(p.rel));
    const dAttr = line(s.pts);
    const path = svg.append("path")
      .attr("d", dAttr).attr("fill", "none")
      .attr("stroke", col).attr("stroke-width", si === 0 ? 2.4 : 1.8)
      .style("cursor", "pointer");
    const len = path.node().getTotalLength();
    path.attr("stroke-dasharray", len).attr("stroke-dashoffset", len);
    const S = 0.15 + si * 0.28;
    animated.push({ start: S, dur: 0.9, set: t => path.attr("stroke-dashoffset", len * (1 - t)) });

    const drill = (p, e) => U.showDrill({
      title: s.a.drill.title, value: s.a.drill.value, sub: s.a.drill.sub,
      source: s.a.drill.source, x: e.clientX, y: e.clientY });
    path.on("click", e => drill(null, e));

    // 锚点
    s.pts.forEach((p, pi) => {
      const dot = svg.append("circle")
        .attr("cx", x(p.d)).attr("cy", y(p.rel)).attr("r", 0)
        .attr("fill", col).attr("stroke", P.paperHi).attr("stroke-width", 1.5)
        .style("cursor", "pointer");
      animated.push({ start: S + 0.2 + pi * 0.16, dur: 0.25, set: t => dot.attr("r", 5 * t) });
      dot.on("click", e => drill(p, e));
      dot.on("mouseenter", e => U.showTip(
        `<b>${U.esc(s.a.name)}</b><br>${U.esc(p.date)}：${U.esc(fmtNum(p.v))} ${U.esc(s.a.unit)}（×${p.rel >= 10 ? p.rel.toFixed(0) : p.rel.toFixed(1)}）`,
        e.clientX, e.clientY));
      dot.on("mouseleave", () => U.hideTip());
    });

    // 端点标签：短名 + 原始读数 + 倍数
    const last = s.pts[s.pts.length - 1];
    const dy = (LAB_DY[s.a.id] || 0);
    const l1 = svg.append("text")
      .attr("x", x(last.d) + 12).attr("y", y(last.rel) - 2 + dy)
      .attr("style", `font:700 11.5px ${U.FONTS.mono};fill:${col}`).attr("opacity", 0)
      .text(`${SHORT[s.a.id] || s.a.name} ×${last.rel >= 10 ? last.rel.toFixed(0) : last.rel.toFixed(1)}`);
    const l2 = svg.append("text")
      .attr("x", x(last.d) + 12).attr("y", y(last.rel) + 13 + dy)
      .attr("style", `font:9px ${U.FONTS.mono};fill:${P.inkLo}`).attr("opacity", 0)
      .text(`${fmtNum(last.v)} ${s.a.unit} · ${last.date}`);
    animated.push({ start: S + 0.85, dur: 0.3, set: t => { l1.attr("opacity", t); l2.attr("opacity", t); } });
    [l1, l2].forEach(l => l.style("cursor", "pointer").on("click", e => drill(last, e)));
  });

  // 图例（左上）
  const lg = svg.append("g").attr("transform", `translate(${ML + 6}, ${TOP - 26})`);
  series.forEach((s, si) => {
    const col = COLORS[si % COLORS.length];
    const item = lg.append("g").style("cursor", "pointer");
    item.append("line").attr("x1", 0).attr("x2", 22).attr("y1", 0).attr("y2", 0)
      .attr("stroke", col).attr("stroke-width", 2.4);
    item.append("text").attr("x", 28).attr("y", 4)
      .attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkMd}`)
      .text(SHORT[s.a.id] || s.a.name);
    item.on("click", e => U.showDrill({
      title: s.a.drill.title, value: s.a.drill.value, sub: s.a.drill.sub,
      source: s.a.drill.source, x: e.clientX, y: e.clientY }));
  });
  // 图例横排布局
  let lx = 0;
  lg.selectAll("g").each(function () {
    const g = d3.select(this);
    g.attr("transform", `translate(${lx}, 0)`);
    lx += g.node().getBBox().width + 26;
  });

  U.play(animated, svg.node(), { threshold: 0.22 });

  // 图注
  const note = document.createElement("div");
  note.style.cssText = `margin-top:12px;padding:9px 12px;border:1px dashed ${P.line};
    font:10.5px ${U.FONTS.mono};color:${P.inkMd};line-height:1.7`;
  note.textContent = "四条线单位不同（token 量 / 年化收入 / 周活跃用户），统一按各自起点归一（起点 = ×1），纵轴为相对倍数的对数刻度，仅比较各自的增长速度、不比较绝对量。锚点均为已落地公开事实；锚点间直线为恒定增速插值，不代表逐月读数。口径与日期见各锚点下钻。";
  body.appendChild(note);
})();
