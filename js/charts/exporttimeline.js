// §11 管制时间轴（宿主 #chart-exporttimeline）
// 2026-04-30 → 07-17 六事件：kind=brk 红（管制/断裂）/ cur 蓝（当前基线）；
// 06-12→07-01 模型下架 19 天在轴上画红带（天数由日期差推算）；贪心分层牌匾，点事件下钻。
// 数据：RPT.exportTimeline。
(() => {
  const host = document.getElementById("chart-exporttimeline");
  if (!host || !window.RPT || !window.U || !window.d3) return;
  const EV0 = RPT.exportTimeline;
  if (!EV0 || !EV0.length) return;
  const body = U.frame(host, {
    title: "管制时间轴：双向冻结的形成",
    sub: "红 = 管制/断裂事件 · 蓝 = 当前基线 · 轴上红带 = 前沿模型全球下架 · 点击事件下钻",
    src: "官方披露 · 行业机构 · 截至 2026-07-17",
  });

  const P = U.PAL, MONO = U.FONTS.mono, SERIF = U.FONTS.serif;
  const COL = { brk: P.red, cur: P.blue, ink: P.ink };
  const KINDTAG = { brk: "断裂", cur: "基线", ink: "事件" };

  // 解析 "2026-06-12→07-01" 区间写法
  const EV = EV0.map((t, i) => {
    const m = String(t.date).match(/(\d{4})-(\d{2})-(\d{2})(?:\s*→\s*(?:(\d{4})-)?(\d{2})-(\d{2}))?/);
    const start = new Date(+m[1], +m[2] - 1, +m[3]);
    const end = m[5] ? new Date(m[4] ? +m[4] : +m[1], +m[5] - 1, +m[6]) : null;
    return { ...t, i, start, end };
  });
  const t0 = d3.timeDay.offset(d3.min(EV, d => d.start), -7);
  const t1 = d3.timeDay.offset(d3.max(EV, d => d.end || d.start), 7);

  const css = `
  #chart-exporttimeline .et-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
  #chart-exporttimeline .et-inner{min-width:760px}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const scroll = document.createElement("div"); scroll.className = "et-scroll";
  const inner = document.createElement("div"); inner.className = "et-inner";
  scroll.appendChild(inner); body.appendChild(scroll);

  const PH = 50, TIER_GAP = 12, TIER_H = PH + TIER_GAP, TOP = 20, AXIS_GAP = 16;
  const W = 1080, ML = 26, MR = 26, GAP = 10;
  const x = d3.scaleTime().domain([t0, t1]).range([ML, W - MR]);

  const mc = document.createElement("canvas").getContext("2d");
  const nameW = s => { mc.font = "700 12px " + SERIF; return mc.measureText(s).width; };

  // 贪心分层
  const ps = EV.map(p => ({ ...p, w: Math.max(128, Math.ceil(nameW(p.label)) + 24) }))
    .sort((a, b) => a.start - b.start || a.i - b.i);
  const tiers = [];
  ps.forEach(p => {
    p.mid = p.end ? new Date((+p.start + +p.end) / 2) : p.start;
    p.x = U.clamp(x(p.mid) - p.w / 2, ML, W - MR - p.w);
    let t = 0;
    while (t < tiers.length && p.x < tiers[t] + GAP) t++;
    p.tier = t; tiers[t] = p.x + p.w;
    p.leadX = U.clamp(x(p.mid), p.x + 14, p.x + p.w - 14);
  });
  const nTiers = tiers.length;
  const axisY = TOP + nTiers * TIER_H + AXIS_GAP;
  const H = axisY + 66;

  const svg = d3.select(inner).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%").style("display", "block")
    .attr("data-drill-keep", "1");
  const yOf = t => TOP + (nTiers - 1 - t) * TIER_H;

  // 月份刻度
  const months = d3.timeMonth.range(t0, d3.timeMonth.offset(t1, 1));
  svg.append("g").selectAll("line.tick").data(months).join("line")
    .attr("x1", d => x(d)).attr("x2", d => x(d))
    .attr("y1", axisY).attr("y2", axisY + 7)
    .attr("stroke", P.inkMd).attr("stroke-width", 1);
  svg.append("g").selectAll("text.mlab").data(months).join("text")
    .attr("x", d => x(d) + 4).attr("y", axisY + 24)
    .attr("style", `font:10px ${MONO};fill:${P.inkLo};letter-spacing:.08em`)
    .text(d => (d.getMonth() + 1) + "月");

  // 主轴
  svg.append("line")
    .attr("x1", x(t0)).attr("x2", x(t1)).attr("y1", axisY).attr("y2", axisY)
    .attr("stroke", P.ink).attr("stroke-width", 1.2);

  // 下架区间红带（天数由日期推算）
  EV.filter(p => p.end).forEach(p => {
    const days = Math.round((p.end - p.start) / 86400000);
    const bx0 = x(p.start), bx1 = x(p.end);
    svg.append("rect")
      .attr("x", bx0).attr("y", axisY - 4).attr("width", Math.max(2, bx1 - bx0)).attr("height", 8)
      .attr("fill", "rgba(194,47,78,.28)").attr("rx", 2)
      .attr("class", "spanband").attr("opacity", 0);
    svg.append("text")
      .attr("x", (bx0 + bx1) / 2).attr("y", axisY + 40)
      .attr("text-anchor", "middle")
      .attr("style", `font:700 10px ${MONO};fill:${P.red}`)
      .attr("class", "spanlab").attr("opacity", 0)
      .text(`下架 ${days} 天`);
  });

  // 事件牌匾
  const plaques = svg.append("g").selectAll("g.ev").data(ps).join("g")
    .attr("class", "ev").attr("style", "cursor:pointer");
  plaques.each(function (p) {
    const g = d3.select(this);
    const c = COL[p.kind] || P.ink;
    const py = yOf(p.tier);

    g.append("line")
      .attr("x1", p.leadX).attr("x2", p.leadX)
      .attr("y1", py + PH).attr("y2", axisY)
      .attr("stroke", p.kind === "brk" ? "rgba(194,47,78,.45)" : p.kind === "cur" ? "rgba(34,81,255,.45)" : "rgba(10,31,51,.3)")
      .attr("stroke-width", 1).attr("class", "lead").attr("opacity", 0);
    g.append("circle")
      .attr("cx", p.leadX).attr("cy", axisY).attr("r", 0)
      .attr("fill", p.kind === "cur" ? P.blue : P.paper)
      .attr("stroke", c).attr("stroke-width", 1.4)
      .attr("class", "dot");

    const rect = g.append("rect")
      .attr("x", p.x).attr("y", py).attr("width", p.w).attr("height", PH)
      .attr("fill", P.paperHi).attr("stroke", c).attr("stroke-width", 1)
      .attr("class", "plaque");
    const per = 2 * (p.w + PH);
    rect.attr("stroke-dasharray", per).attr("stroke-dashoffset", 0);

    g.append("text")
      .attr("x", p.x + 10).attr("y", py + 15)
      .attr("style", `font:8.5px ${MONO};fill:${c};opacity:.85`)
      .attr("class", "txt").attr("opacity", 0)
      .text(p.date);
    g.append("text")
      .attr("x", p.x + p.w - 10).attr("y", py + 15).attr("text-anchor", "end")
      .attr("style", `font:8px ${MONO};fill:${P.inkLo}`)
      .attr("class", "txt").attr("opacity", 0)
      .text(KINDTAG[p.kind] || "");
    const nm = g.append("text")
      .attr("x", p.x + 10).attr("y", py + 31)
      .attr("style", `font:700 12px ${SERIF};fill:${c}`)
      .attr("class", "txt").attr("opacity", 0);
    const label = p.label.length > 11 ? p.label.slice(0, 11) : p.label;
    const label2 = p.label.length > 11 ? p.label.slice(11, 22) : "";
    nm.text(label);
    if (label2) {
      g.append("text")
        .attr("x", p.x + 10).attr("y", py + 44)
        .attr("style", `font:700 12px ${SERIF};fill:${c}`)
        .attr("class", "txt").attr("opacity", 0)
        .text(label2);
    }

    rect.on("mouseenter", () => rect.attr("stroke-width", 2));
    rect.on("mouseleave", () => rect.attr("stroke-width", 1));
    g.on("click", e => U.showDrill({
      title: p.drill.title, value: p.drill.value, sub: p.drill.sub,
      source: p.drill.source, x: e.clientX, y: e.clientY }));
  });

  // 入场
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    plaques.each(function (_, k) {
      const g = d3.select(this);
      const rect = g.select("rect.plaque");
      const per = 2 * (rect.attr("width") * 1 + PH);
      rect.attr("stroke-dashoffset", per)
        .transition().delay(150 + k * 130).duration(520).attr("stroke-dashoffset", 0);
      g.selectAll("text.txt").transition().delay(320 + k * 130).duration(320).attr("opacity", 1);
      g.select("line.lead").transition().delay(420 + k * 130).duration(320).attr("opacity", 1);
      g.select("circle.dot").transition().delay(560 + k * 130).duration(220).attr("r", 3.5);
    });
    svg.selectAll("rect.spanband").transition().delay(500).duration(600).attr("opacity", 1);
    svg.selectAll("text.spanlab").transition().delay(900).duration(400).attr("opacity", 1);
  }, { threshold: 0.2 });
  io.observe(svg.node());
})();
