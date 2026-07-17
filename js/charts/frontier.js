// §4a 前沿档价格 V 形反转（宿主 #chart-frontier）
// 旗舰/超档轨迹：log 价格轴；谷底 GPT-5 $1.25、峰值 o1-pro $150、当前峰值 GPT-5.5 Pro $30 标注；
// V 形谷底参考线；点可点下钻。数据：RPT.frontierPrice。
(() => {
  const host = document.getElementById("chart-frontier");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "前沿档价格 · V 形反转（$/MTok input）",
    sub: "对数价格轴 · 墨 = 旗舰 · 蓝 = 推理档 · 红 = 超档 · 点击任意点下钻",
    src: "公司披露 · 券商研究",
  });

  const P = U.PAL;
  const data = RPT.frontierPrice.map(d => ({ ...d, t: new Date(d.date + "-01T00:00:00") }));
  const TCOL = { frontier: P.ink, reasoning: P.blue, super: P.red };
  const TCNL = { frontier: "旗舰", reasoning: "推理档", super: "超档" };

  const W = 1080, H = 430, ML = 58, MR = 30, TOP = 34, BOT = 46;
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.t))
    .range([ML, W - MR]).nice();
  const y = d3.scaleLog().domain([1, 200]).range([H - BOT, TOP]).clamp(true);

  const svg = d3.select(body).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%").style("display", "block")
    .attr("data-drill-keep", "1");

  // 价格网格（log）
  [1, 5, 10, 30, 100, 200].forEach(v => {
    svg.append("line").attr("x1", ML).attr("x2", W - MR)
      .attr("y1", y(v)).attr("y2", y(v)).attr("stroke", P.lineLo);
    svg.append("text").attr("x", ML - 8).attr("y", y(v) + 3.5)
      .attr("text-anchor", "end")
      .attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkLo}`)
      .text("$" + v);
  });
  // 时间刻度
  x.ticks(6).forEach(t => {
    svg.append("text").attr("x", x(t)).attr("y", H - BOT + 20)
      .attr("text-anchor", "middle")
      .attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkLo}`)
      .text(d3.timeFormat("%Y-%m")(t));
  });

  // 谷底参考线（GPT-5 2025-08）
  const valley = data.find(d => d.label.includes("GPT-5（"));
  if (valley) {
    const vl = svg.append("line")
      .attr("x1", x(valley.t)).attr("x2", x(valley.t))
      .attr("y1", TOP - 6).attr("y2", H - BOT)
      .attr("stroke", P.red).attr("stroke-width", 1)
      .attr("stroke-dasharray", "3 4").attr("opacity", 0.55);
    svg.append("text")
      .attr("x", x(valley.t)).attr("y", TOP - 10)
      .attr("text-anchor", "middle")
      .attr("style", `font:9.5px ${U.FONTS.mono};fill:${P.red}`)
      .text("谷底 2025-08 · 此后 V 形反转");
  }

  // 连线（按时间序）
  const line = d3.line().x(d => x(d.t)).y(d => y(d.price)).curve(d3.curveMonotoneX);
  const path = svg.append("path")
    .attr("d", line(data))
    .attr("fill", "none").attr("stroke", P.ink).attr("stroke-width", 1.6)
    .attr("opacity", 0.75);
  const len = path.node().getTotalLength();
  path.attr("stroke-dasharray", len).attr("stroke-dashoffset", len);

  // 点
  const KEY = ["o1-pro（历史峰值）", "GPT-5（旗舰谷底）", "GPT-5.5 Pro（当前峰值）"];
  const dots = svg.append("g").selectAll("g.pt").data(data).join("g")
    .attr("style", "cursor:pointer");
  dots.append("circle")
    .attr("cx", d => x(d.t)).attr("cy", d => y(d.price)).attr("r", 0)
    .attr("fill", d => TCOL[d.tier] || P.ink)
    .attr("stroke", P.paperHi).attr("stroke-width", 1.5);
  // 大点击热区（透明）
  dots.append("circle")
    .attr("cx", d => x(d.t)).attr("cy", d => y(d.price)).attr("r", 14)
    .attr("fill", "transparent");
  // 标签
  dots.append("text")
    .attr("x", d => x(d.t)).attr("y", d => y(d.price) - 11)
    .attr("text-anchor", "middle")
    .attr("style", d => `font:${KEY.includes(d.label) ? "700" : "400"} 10px ${U.FONTS.mono};fill:${TCOL[d.tier] || P.ink}`)
    .attr("opacity", 0)
    .text(d => `${d.label.replace(/（.*）/, "")} $${d.price}`);
  dots.append("text")
    .attr("x", d => x(d.t)).attr("y", d => y(d.price) + 18)
    .attr("text-anchor", "middle")
    .attr("style", `font:8.5px ${U.FONTS.mono};fill:${P.inkLo}`)
    .attr("opacity", 0)
    .text(d => `${d.date} · ${TCNL[d.tier] || ""}`);
  dots.on("click", (e, d) => U.showDrill({
    title: d.drill.title, value: d.drill.value, sub: d.drill.sub,
    source: d.drill.source, x: e.clientX, y: e.clientY }));
  dots.on("mouseenter", function (e, d) {
    d3.select(this).select("circle").attr("r", 7);
  }).on("mouseleave", function (e, d) {
    d3.select(this).select("circle").attr("r", 4.5);
  });

  // 图例
  const lg = svg.append("g").attr("transform", `translate(${ML + 6}, ${TOP - 14})`);
  Object.entries(TCNL).forEach(([k, v], i) => {
    lg.append("circle").attr("cx", i * 86).attr("cy", -3).attr("r", 4).attr("fill", TCOL[k]);
    lg.append("text").attr("x", i * 86 + 9).attr("y", 0)
      .attr("style", `font:9.5px ${U.FONTS.mono};fill:${P.inkMd}`).text(v);
  });

  // 入场
  const animated = [
    { start: 0.05, dur: 1.1, set: p => path.attr("stroke-dashoffset", len * (1 - p)) },
  ];
  dots.each(function (d, i) {
    const g = d3.select(this);
    animated.push({ start: 0.12 + (i / data.length) * 0.9, dur: 0.25,
      set: p => g.select("circle").attr("r", 4.5 * p) });
    g.selectAll("text").each(function () {
      const tEl = d3.select(this);
      animated.push({ start: 0.2 + (i / data.length) * 0.9, dur: 0.25,
        set: p => tEl.attr("opacity", p) });
    });
  });
  U.play(animated, svg.node(), { threshold: 0.25 });
})();
