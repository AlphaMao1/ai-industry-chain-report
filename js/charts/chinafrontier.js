// §4b 中国旗舰价格阶梯（宿主 #chart-chinafrontier）
// Kimi 上涨台阶（K2 $0.6 → K2.6 $0.95 → K3 $3）与 Qwen 阶梯，
// 对照 DeepSeek 的平缓实付线（牌价 $1.74 → 实付 $0.435 的 75 折落差）。
// step-after 阶梯线；点可点下钻。数据：RPT.chinaFrontier。
(() => {
  const host = document.getElementById("chart-chinafrontier");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "中国旗舰 · 涨价台阶 vs 走量平缓线（$/MTok input）",
    sub: "阶梯线 = 官方提价事件 · 空心点 = 牌价 / 实心点 = 实付 · 点击任意点下钻",
    src: "公司披露 · 券商研究",
  });

  const P = U.PAL;
  const T = s => new Date(s + "-01T00:00:00");
  const rows = RPT.chinaFrontier.map(d => ({ ...d, t: T(d.date) }));

  const kimi = rows.filter(d => d.label.startsWith("Kimi")).sort((a, b) => a.t - b.t);
  const qwen = rows.filter(d => d.label.startsWith("Qwen")).sort((a, b) => a.t - b.t);
  const ds = rows.filter(d => d.label.startsWith("DeepSeek"));

  const SERIES = [
    { name: "Kimi", col: P.blue, pts: kimi },
    { name: "Qwen", col: P.ink, pts: qwen },
  ];

  const W = 1080, H = 400, ML = 58, MR = 120, TOP = 34, BOT = 46;
  const allT = rows.map(d => d.t);
  const x = d3.scaleTime().domain(d3.extent(allT)).range([ML, W - MR]).nice();
  const y = d3.scaleLinear().domain([0, 3.3]).range([H - BOT, TOP]);

  const svg = d3.select(body).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%").style("display", "block")
    .attr("data-drill-keep", "1");

  [0, 1, 2, 3].forEach(v => {
    svg.append("line").attr("x1", ML).attr("x2", W - MR)
      .attr("y1", y(v)).attr("y2", y(v)).attr("stroke", P.lineLo);
    svg.append("text").attr("x", ML - 8).attr("y", y(v) + 3.5)
      .attr("text-anchor", "end")
      .attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkLo}`).text("$" + v);
  });
  x.ticks(5).forEach(t => {
    svg.append("text").attr("x", x(t)).attr("y", H - BOT + 20)
      .attr("text-anchor", "middle")
      .attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkLo}`)
      .text(d3.timeFormat("%Y-%m")(t));
  });

  const animated = [];
  const stepLine = d3.line().x(d => x(d.t)).y(d => y(d.price)).curve(d3.curveStepAfter);

  SERIES.forEach((s, si) => {
    const path = svg.append("path")
      .attr("d", stepLine(s.pts))
      .attr("fill", "none").attr("stroke", s.col).attr("stroke-width", 2);
    const len = path.node().getTotalLength();
    path.attr("stroke-dasharray", len).attr("stroke-dashoffset", len);
    animated.push({ start: 0.1 + si * 0.25, dur: 0.9, set: p => path.attr("stroke-dashoffset", len * (1 - p)) });

    s.pts.forEach((d, i) => {
      const g = svg.append("g").attr("style", "cursor:pointer");
      g.append("circle").attr("cx", x(d.t)).attr("cy", y(d.price)).attr("r", 14).attr("fill", "transparent");
      const c = g.append("circle").attr("cx", x(d.t)).attr("cy", y(d.price)).attr("r", 0)
        .attr("fill", s.col).attr("stroke", P.paperHi).attr("stroke-width", 1.5);
      const lb = g.append("text").attr("x", x(d.t)).attr("y", y(d.price) - 11)
        .attr("text-anchor", "middle")
        .attr("style", `font:700 10px ${U.FONTS.mono};fill:${s.col}`).attr("opacity", 0)
        .text(`${d.label.replace(/（.*）/, "")} $${d.price}`);
      const S = 0.15 + si * 0.25 + (i / Math.max(1, s.pts.length - 1)) * 0.6;
      animated.push({ start: S, dur: 0.2, set: p => c.attr("r", 5 * p) });
      animated.push({ start: S + 0.08, dur: 0.22, set: p => lb.attr("opacity", p) });
      g.on("click", e => U.showDrill({ title: d.drill.title, value: d.drill.value, sub: d.drill.sub,
        source: d.drill.source, x: e.clientX, y: e.clientY }));
    });

    // 系列名
    const last = s.pts[s.pts.length - 1];
    const nm = svg.append("text").attr("x", x(last.t) + 12).attr("y", y(last.price) + 4)
      .attr("style", `font:700 11px ${U.FONTS.mono};fill:${s.col}`).attr("opacity", 0)
      .text(s.name);
    animated.push({ start: 0.9 + si * 0.1, dur: 0.25, set: p => nm.attr("opacity", p) });
  });

  // DeepSeek：牌价空心点 + 实付实心点 + 落差虚线
  ds.forEach(d => {
    const listP = 1.74; // 牌价（drill 原文："牌价 $1.74 → 实付 $0.435/$0.87"）
    const g = svg.append("g").attr("style", "cursor:pointer");
    g.append("circle").attr("cx", x(d.t)).attr("cy", y(d.price)).attr("r", 16).attr("fill", "transparent");
    // 牌价（空心）
    const cList = g.append("circle").attr("cx", x(d.t)).attr("cy", y(listP)).attr("r", 0)
      .attr("fill", "none").attr("stroke", P.red).attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "2 2");
    // 实付（实心）
    const cEff = g.append("circle").attr("cx", x(d.t)).attr("cy", y(d.price)).attr("r", 0)
      .attr("fill", P.red).attr("stroke", P.paperHi).attr("stroke-width", 1.5);
    // 落差线
    const drop = g.append("line")
      .attr("x1", x(d.t)).attr("x2", x(d.t))
      .attr("y1", y(listP)).attr("y2", y(listP))
      .attr("stroke", P.red).attr("stroke-width", 1).attr("stroke-dasharray", "3 3");
    const lb1 = g.append("text").attr("x", x(d.t) + 12).attr("y", y(listP) + 4)
      .attr("style", `font:10px ${U.FONTS.mono};fill:${P.red}`).attr("opacity", 0)
      .text("牌价 $1.74");
    const lb2 = g.append("text").attr("x", x(d.t) + 12).attr("y", y(d.price) + 4)
      .attr("style", `font:700 10px ${U.FONTS.mono};fill:${P.red}`).attr("opacity", 0)
      .text("实付 $0.435（永久 75 折）");
    animated.push({ start: 0.5, dur: 0.25, set: p => cList.attr("r", 5 * p) });
    animated.push({ start: 0.58, dur: 0.3, set: p => drop.attr("y2", y(listP) + (y(d.price) - y(listP)) * p) });
    animated.push({ start: 0.85, dur: 0.25, set: p => cEff.attr("r", 5 * p) });
    [lb1, lb2].forEach((l, k) => animated.push({ start: 0.9 + k * 0.08, dur: 0.22, set: p => l.attr("opacity", p) }));
    g.on("click", e => U.showDrill({ title: d.drill.title, value: d.drill.value, sub: d.drill.sub,
      source: d.drill.source, x: e.clientX, y: e.clientY }));
  });

  U.play(animated, svg.node(), { threshold: 0.25 });
})();
