// §4 任务成本对数轴全景（宿主 #chart-taskcost）
// 对数轴横轴 $0.0001 → $100，三档任务成本落点（$0.0004 / 约 $2.5 / 可到 $25）；
// 底部括号标注"横跨 5 个数量级"。悬停轻提示，点击任务档下钻。数据：RPT.taskCost。
(() => {
  const host = document.getElementById("chart-taskcost");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "任务成本全景：同一个“任务”，价格横跨五个数量级",
    sub: "对数刻度 · $0.0004 → $25 · 按官方牌价计算 · 点击任务档下钻",
    src: "本报告测算 · 2026-07-17",
  });

  const P = U.PAL;
  const TC = RPT.taskCost;

  const sc = document.createElement("div");
  sc.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(sc);

  const W = 1080, H = 330, ML = 70, MR = 60, AXY = 200, TOP = 30;
  const x = d3.scaleLog().domain([0.0001, 100]).range([ML, W - MR]).clamp(true);
  const svg = d3.select(sc).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%").style("min-width", "680px").style("display", "block")
    .attr("data-drill-keep", "1");

  // 刻度：每十进一级
  const ticks = [0.0001, 0.001, 0.01, 0.1, 1, 10, 100];
  const fmtTick = v => {
    if (v >= 1) return "$" + v;
    const s = v.toFixed(4); // 0.0001 / 0.0010 / 0.0100 / 0.1000
    return "$" + s.replace(/0+$/, "").replace(/\.$/, "");
  };
  ticks.forEach(v => {
    svg.append("line")
      .attr("x1", x(v)).attr("x2", x(v))
      .attr("y1", TOP + 10).attr("y2", AXY + 40)
      .attr("stroke", P.lineLo);
    svg.append("text")
      .attr("x", x(v)).attr("y", AXY + 58)
      .attr("text-anchor", "middle")
      .attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkLo}`)
      .text(fmtTick(v));
  });
  // 主轴线
  svg.append("line")
    .attr("x1", ML).attr("x2", W - MR).attr("y1", AXY).attr("y2", AXY)
    .attr("stroke", P.ink).attr("stroke-width", 1.4);
  svg.append("text")
    .attr("x", ML).attr("y", AXY + 78)
    .attr("style", `font:9px ${U.FONTS.mono};fill:${P.inkLo}`)
    .text("每任务成本（对数刻度，$/任务）");

  const animated = [];
  const pts = TC.points.map((p, i) => ({ p, i, px: x(p.cost) }));

  pts.forEach(({ p, i, px }) => {
    const isBase = i === 1; // 基准档
    const col = isBase ? P.blue : P.ink;
    // 引线
    const stem = svg.append("line")
      .attr("x1", px).attr("x2", px)
      .attr("y1", AXY).attr("y2", AXY)
      .attr("stroke", col).attr("stroke-width", 1);
    // 落点
    const dot = svg.append("circle")
      .attr("cx", px).attr("cy", AXY).attr("r", 0)
      .attr("fill", col).attr("stroke", P.paperHi).attr("stroke-width", 1.5)
      .style("cursor", "pointer");
    const S = 0.15 + i * 0.25;
    animated.push({ start: S, dur: 0.35, set: t => dot.attr("r", 6.5 * t) });
    animated.push({ start: S, dur: 0.45, set: t => stem.attr("y2", AXY - (78 + (i === 1 ? 22 : 0)) * t) });

    // 标签（上方；基准档更高，避免重叠）
    const ly = AXY - 88 - (isBase ? 22 : 0);
    const anchor = i === 0 ? "start" : i === 2 ? "end" : "middle";
    const lx = i === 0 ? Math.max(px, ML) : i === 2 ? Math.min(px, W - MR) : px;
    const t1 = svg.append("text")
      .attr("x", lx).attr("y", ly).attr("text-anchor", anchor)
      .attr("style", `font:700 12.5px ${U.FONTS.serif};fill:${P.ink}`).attr("opacity", 0)
      .text(p.label);
    const t2 = svg.append("text")
      .attr("x", lx).attr("y", ly + 16).attr("text-anchor", anchor)
      .attr("style", `font:700 11.5px ${U.FONTS.mono};fill:${col}`).attr("opacity", 0)
      .text(p.note);
    animated.push({ start: S + 0.35, dur: 0.25, set: t => { t1.attr("opacity", t); t2.attr("opacity", t); } });

    const drill = e => U.showDrill({
      title: p.label,
      value: p.note,
      sub: `${TC.drill.sub}（${TC.span}。）`,
      source: TC.drill.source, x: e.clientX, y: e.clientY });
    dot.on("click", drill);
    t1.on("click", drill); t2.on("click", drill);
    t1.style("cursor", "pointer"); t2.style("cursor", "pointer");
    dot.on("mouseenter", e => U.showTip(`<b>${U.esc(p.label)}</b><br>${U.esc(p.note)}`, e.clientX, e.clientY));
    dot.on("mouseleave", () => U.hideTip());
  });

  // 跨度括号：最低档 → 最高档
  const x1 = pts[0].px, x2 = pts[pts.length - 1].px;
  const by = AXY + 96;
  const brk = svg.append("path")
    .attr("d", `M ${x1} ${by - 6} L ${x1} ${by} L ${x2} ${by} L ${x2} ${by - 6}`)
    .attr("fill", "none").attr("stroke", P.inkMd).attr("stroke-width", 1);
  const bl = svg.append("text")
    .attr("x", (x1 + x2) / 2).attr("y", by + 18).attr("text-anchor", "middle")
    .attr("style", `font:700 11px ${U.FONTS.mono};fill:${P.inkMd}`).attr("opacity", 0)
    .text(TC.span + "（最低档 → 高开销组合）");
  animated.push({ start: 1.0, dur: 0.4, set: t => bl.attr("opacity", t) });
  brk.style("cursor", "pointer");
  brk.on("click", e => U.showDrill({
    title: TC.drill.title, value: TC.drill.value, sub: TC.drill.sub,
    source: TC.drill.source, x: e.clientX, y: e.clientY }));

  U.play(animated, svg.node(), { threshold: 0.25 });
})();
