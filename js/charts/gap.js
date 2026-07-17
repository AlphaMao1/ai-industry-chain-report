// §3b 供需缺口轨迹（宿主 #chart-gap）
// 从 0.70 起点出发的三条 12 个月路径：tightening 2.27 红 / base 0.97 蓝 / loosening 0.34 灰；
// 1.0 参考线；路径渐次 draw-in，端点可点下钻。数据：RPT.gap。
(() => {
  const host = document.getElementById("chart-gap");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "供需缺口比 · 12 个月三路径",
    sub: "起点 0.70 · 1.0 虚线 = 供需打平参考线 · 点击任意路径或端点下钻",
    src: "公司披露 · 券商研究 · 自研模型",
  });

  const P = U.PAL;
  const gap = RPT.gap;
  const COLORS = { red: P.red, blue: P.blue, ink: P.inkLo };
  const CN = { tightening: "tightening 收紧", base: "base 基准", loosening: "loosening 放松" };

  const W = 1080, H = 400, ML = 64, MR = 210, TOP = 30, BOT = 44;
  const x = d3.scaleLinear().domain([0, 12]).range([ML, W - MR]);
  const y = d3.scaleLinear().domain([0, 2.5]).range([H - BOT, TOP]);

  const svg = d3.select(body).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%").style("display", "block")
    .attr("data-drill-keep", "1");

  // 网格与刻度
  [0, 0.5, 1.0, 1.5, 2.0, 2.5].forEach(v => {
    svg.append("line")
      .attr("x1", ML).attr("x2", W - MR)
      .attr("y1", y(v)).attr("y2", y(v))
      .attr("stroke", v === 1 ? P.inkMd : P.lineLo)
      .attr("stroke-width", v === 1 ? 1 : 1)
      .attr("stroke-dasharray", v === 1 ? "5 4" : null);
    svg.append("text")
      .attr("x", ML - 10).attr("y", y(v) + 3.5)
      .attr("text-anchor", "end")
      .attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkLo}`)
      .text(v.toFixed(1));
  });
  svg.append("text")
    .attr("x", W - MR).attr("y", y(1) - 6)
    .attr("text-anchor", "end")
    .attr("style", `font:9.5px ${U.FONTS.mono};fill:${P.inkMd}`)
    .text("1.0 = 供需打平 · 之上 = 越买越缺");
  [0, 6, 12].forEach(m => {
    svg.append("text")
      .attr("x", x(m)).attr("y", H - BOT + 20)
      .attr("text-anchor", "middle")
      .attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkLo}`)
      .text(m === 0 ? "当前" : `+${m} 个月`);
  });

  // 路径形状：三次平滑（中段略弯向终值，纯展示插值，端点才是模型读数）
  const mkPts = end => [[0, gap.current], [4, gap.current + (end - gap.current) * 0.42],
    [8, gap.current + (end - gap.current) * 0.8], [12, end]];
  const line = d3.line().x(d => x(d[0])).y(d => y(d[1])).curve(d3.curveCatmullRom.alpha(0.6));

  // 起点
  const startDot = svg.append("circle")
    .attr("cx", x(0)).attr("cy", y(gap.current)).attr("r", 4.5)
    .attr("fill", P.paperHi).attr("stroke", P.ink).attr("stroke-width", 1.5);
  svg.append("text")
    .attr("x", x(0) + 10).attr("y", y(gap.current) - 10)
    .attr("style", `font:700 12px ${U.FONTS.mono};fill:${P.ink}`)
    .text(`当前 ${gap.current.toFixed(2)}`);

  const paths = [];
  gap.cases.forEach((c, i) => {
    const col = COLORS[c.color] || P.ink;
    const pts = mkPts(c.ratio12m);
    const path = svg.append("path")
      .attr("d", line(pts))
      .attr("fill", "none")
      .attr("stroke", col)
      .attr("stroke-width", c.name === "base" ? 2.6 : 1.8)
      .style("cursor", "pointer");
    // 粗透明热区，方便点击
    const hit = svg.append("path")
      .attr("d", line(pts))
      .attr("fill", "none")
      .attr("stroke", "rgba(0,0,0,0)")
      .attr("stroke-width", 16)
      .style("cursor", "pointer");
    const len = path.node().getTotalLength();
    path.attr("stroke-dasharray", len).attr("stroke-dashoffset", len);

    // 端点圆点
    const dot = svg.append("circle")
      .attr("cx", x(12)).attr("cy", y(c.ratio12m)).attr("r", 0)
      .attr("fill", col).style("cursor", "pointer");
    // 端点标签
    const lab1 = svg.append("text")
      .attr("x", x(12) + 12).attr("y", y(c.ratio12m) - 2)
      .attr("style", `font:700 14px ${U.FONTS.mono};fill:${col}`).attr("opacity", 0)
      .text(c.ratio12m.toFixed(2));
    const lab2 = svg.append("text")
      .attr("x", x(12) + 12).attr("y", y(c.ratio12m) + 13)
      .attr("style", `font:9.5px ${U.FONTS.mono};fill:${P.inkMd}`).attr("opacity", 0)
      .text(CN[c.name] || c.name);
    const lab3 = svg.append("text")
      .attr("x", x(12) + 12).attr("y", y(c.ratio12m) + 26)
      .attr("style", `font:8.5px ${U.FONTS.mono};fill:${P.inkLo}`).attr("opacity", 0)
      .text(`需求 ${c.demand}x / 供给 ${c.supply}x`);

    const drill = e => U.showDrill({
      title: `缺口路径 · ${CN[c.name] || c.name}`,
      value: `12 个月后缺口比 ${c.ratio12m.toFixed(2)}（需求 ${c.demand}x vs 供给 ${c.supply}x）`,
      sub: c.read, source: "自研模型", x: e.clientX, y: e.clientY });
    path.on("click", drill); dot.on("click", drill); hit.on("click", drill);

    paths.push({ path, len, dot, labs: [lab1, lab2, lab3], i });
  });

  // 入场
  const animated = [];
  animated.push({ start: 0, dur: 0.4, set: p => startDot.attr("r", 4.5 * p) });
  paths.forEach(({ path, len, dot, labs, i }) => {
    const S = 0.25 + i * 0.3;
    animated.push({ start: S, dur: 0.85, set: p => path.attr("stroke-dashoffset", len * (1 - p)) });
    animated.push({ start: S + 0.8, dur: 0.2, set: p => dot.attr("r", 5 * p) });
    labs.forEach((l, k) => animated.push({ start: S + 0.85 + k * 0.06, dur: 0.25, set: p => l.attr("opacity", p) }));
  });
  const ctl = U.play(animated, svg.node(), { threshold: 0.25 });
  U.onRebuild(() => { /* 固定 viewBox，无需重排 */ });
})();
