// §9 订单覆盖倍数排行横条（宿主 #chart-coverage）
// 需求硬度证据：在手订单/收入 覆盖倍数排行（倍数组按值排序）；
// 口径不同者（年限/绝对额/增速）单列"异口径"虚纹组，不与倍数同序。点条下钻基数与出处。
// 数据：RPT.coverage。
(() => {
  const host = document.getElementById("chart-coverage");
  if (!host || !window.RPT || !window.U || !window.d3) return;
  const CV = RPT.coverage;
  if (!CV || !CV.length) return;
  const P = U.PAL;

  const body = U.frame(host, {
    title: "订单覆盖倍数排行：需求有多硬",
    sub: "在手订单 ÷ 收入（倍数组）· 口径不同者单列虚纹组、不参与排序 · 点击任意条下钻基数与出处",
    src: "官方披露 · 截至 2026-07-17",
  });

  const ratioRows = CV.filter(c => c.ratio != null).sort((a, b) => b.ratio - a.ratio);
  const otherRows = CV.filter(c => c.ratio == null);

  const ROW = 46, ML = 150, MR = 150, TOP = 26, GAP = 34, BOT = 30;
  const W = 1080, H = TOP + ratioRows.length * ROW + (otherRows.length ? GAP + otherRows.length * ROW : 0) + BOT;
  const rMax = Math.max(...ratioRows.map(r => r.ratio)) * 1.06;
  const x = d3.scaleLinear().domain([0, rMax]).range([ML, W - MR]);

  const scroll = document.createElement("div");
  scroll.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(scroll);

  const svg = d3.select(scroll).append("svg")
    .attr("viewBox", "0 0 " + W + " " + H)
    .style("width", "100%").style("min-width", "680px").style("display", "block")
    .attr("data-drill-keep", "1");

  // 异口径虚纹
  const defs = svg.append("defs");
  const pat = defs.append("pattern").attr("id", "cov-hatch").attr("width", 8).attr("height", 8)
    .attr("patternUnits", "userSpaceOnUse").attr("patternTransform", "rotate(45)");
  pat.append("rect").attr("width", 8).attr("height", 8).attr("fill", "rgba(10,31,51,.05)");
  pat.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 8)
    .attr("stroke", P.inkLo).attr("stroke-width", 1);

  // 倍数组刻度
  const tickStep = rMax > 20 ? 10 : 5;
  d3.range(0, rMax, tickStep).forEach(v => {
    svg.append("line").attr("x1", x(v)).attr("x2", x(v))
      .attr("y1", TOP - 8).attr("y2", TOP + ratioRows.length * ROW - 12)
      .attr("stroke", v === 0 ? P.ink : P.lineLo).attr("stroke-width", v === 0 ? 1.2 : 1);
    if (v > 0) svg.append("text").attr("x", x(v)).attr("y", TOP - 13)
      .attr("text-anchor", "middle")
      .attr("style", "font:9.5px " + U.FONTS.mono + ";fill:" + P.inkLo).text(v + "×");
  });

  const animated = [];
  const drawRow = (c, i, yOff, ghost) => {
    const gy = yOff + i * ROW;
    const bh = ROW - 18;
    // 名称
    svg.append("text").attr("x", ML - 12).attr("y", gy + bh / 2 + 4)
      .attr("text-anchor", "end")
      .attr("style", "font:700 12px " + U.FONTS.serif + ";fill:" + P.ink).text(c.name);
    const bw = ghost ? 150 : Math.max(3, x(c.ratio) - ML);
    const r = svg.append("rect")
      .attr("x", ML).attr("y", gy).attr("width", 0).attr("height", bh)
      .attr("fill", ghost ? "url(#cov-hatch)" : P.blue)
      .attr("stroke", ghost ? P.inkLo : "none").attr("stroke-dasharray", ghost ? "4 3" : null)
      .attr("opacity", ghost ? 0.9 : 0.9).style("cursor", "pointer");
    animated.push({ start: 0.1 + i * 0.1, dur: 0.55, set: p => r.attr("width", bw * p) });
    const lb = svg.append("text").attr("x", ML + bw + 10).attr("y", gy + bh / 2 + 4)
      .attr("style", "font:700 12.5px " + U.FONTS.mono + ";fill:" + (ghost ? P.inkMd : P.blue))
      .attr("opacity", 0).text(c.display);
    animated.push({ start: 0.55 + i * 0.1, dur: 0.25, set: p => lb.attr("opacity", p) });
    // 基数行（原只藏下钻"基数："）：条下一行小字
    const bs = svg.append("text").attr("x", ML).attr("y", gy + bh + 12)
      .attr("style", "font:8.5px " + U.FONTS.mono + ";fill:" + P.inkLo)
      .attr("opacity", 0).text("基数：" + c.base);
    animated.push({ start: 0.65 + i * 0.1, dur: 0.25, set: p => bs.attr("opacity", p) });
    const hit = svg.append("rect")
      .attr("x", 0).attr("y", gy - 4).attr("width", W).attr("height", ROW)
      .attr("fill", "transparent").style("cursor", "pointer");
    hit.on("mouseenter", e => U.showTip("<b>" + U.esc(c.name) + "</b>：" + U.esc(c.display) + "<br/>点击看基数与出处", e.clientX, e.clientY));
    hit.on("mousemove", e => U.showTip("<b>" + U.esc(c.name) + "</b>：" + U.esc(c.display) + "<br/>点击看基数与出处", e.clientX, e.clientY));
    hit.on("mouseleave", U.hideTip);
    hit.on("click", e => U.showDrill({
      title: "订单覆盖 · " + c.name, value: c.display + (c.ratio != null ? "（在手订单 ÷ 收入）" : "（异口径读数，不与倍数同序）"),
      sub: "基数：" + U.esc(c.base), source: c.source, x: e.clientX, y: e.clientY }));
  };

  drawRow && ratioRows.forEach((c, i) => drawRow(c, i, TOP, false));

  if (otherRows.length) {
    const gy = TOP + ratioRows.length * ROW + 12;
    svg.append("line").attr("x1", 0).attr("x2", W).attr("y1", gy).attr("y2", gy).attr("stroke", P.lineLo);
    svg.append("text").attr("x", 0).attr("y", gy + 18)
      .attr("style", "font:10px " + U.FONTS.mono + ";fill:" + P.inkLo)
      .text("异口径组（年限 / 绝对额 / 增速，条长无意义、不参与排序）");
    otherRows.forEach((c, i) => drawRow(c, i, gy + GAP, true));
  }

  U.play(animated, svg.node(), { threshold: 0.22 });
})();
