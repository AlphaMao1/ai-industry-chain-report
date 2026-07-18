// §8 融资结构瀑布（宿主 #chart-finance）
// 四级资金结构：经营现金流（折算基本盘）→ 发债 → 表外租赁/合资 → 供应商资金循环。
// 同一 $B 尺度独立柱 + 流向箭头；四级口径与期间各异，柱高可比、不可相加（图内明示）。
// 点击任意一级/任一构成块下钻到带日期的出处。数据：RPT.financeFall（+ RPT.capex.totals 折算基本盘）。
(() => {
  const host = document.getElementById("chart-finance");
  if (!host || !window.RPT || !window.U || !window.d3) return;
  const F = RPT.financeFall;
  const T = RPT.capex && RPT.capex.totals;
  if (!F || !F.stages) return;
  const P = U.PAL;

  const body = U.frame(host, {
    title: "融资结构四级：从花自己赚的钱，到发债、表外与供应商循环",
    sub: "同一 $B 尺度 · 各级口径与期间不同，柱高可比、不可相加 · 点击任意一级下钻构成与出处",
    src: "官方披露 · 行业机构 · 券商研究 · 截至 2026-07-17",
  });

  // ── 组装四级渲染模型（全部取自 data.js，不硬编码数字）──
  const stg = id => F.stages.find(s => s.id === id) || {};
  // 经营现金流基本盘：FY2025 四家资本开支 ÷ 资本开支/经营现金流（组 A 口径）折算
  const ocfImplied = T && T.capexOcfFy2025 ? T.fy2025 / T.capexOcfFy2025 : null;
  const SRC = "官方披露 · 行业机构 · 券商研究 · 截至 2026-07-17";
  const stages = [
    { id: "ocf", name: "经营现金流", tag: "基本盘", note: stg("ocf").note,
      segs: ocfImplied != null
        ? [{ nm: "四家 FY2025 合计（折算）", v: ocfImplied, col: P.ink,
             drill: { title: "经营现金流（基本盘）",
               value: "约 $" + ocfImplied.toFixed(0) + "B（FY2025 四家，按资本开支 $" + T.fy2025 + "B ÷ " + Math.round(T.capexOcfFy2025 * 100) + "% 折算）",
               sub: stg("ocf").note, source: "本报告测算，基于官方季报 · 截至 2026-07-17" } }]
        : [] },
    { id: "bond", name: "发债", tag: "2026 年迄今", note: stg("bond").note,
      segs: [{ nm: "五大云厂商发债（Dealogic）", v: stg("bond").amount, col: P.blue,
        drill: { title: "发债：2026 年迄今五大云厂商",
          value: "$" + stg("bond").amount + "B（同比 +47%；2025 全年 $108B、2024 仅 $17B）",
          sub: stg("bond").note, source: "行业机构（Dealogic）· 券商研究 · 截至 2026-06 初" } }] },
    { id: "offbs", name: "表外租赁/合资", tag: "三大块", note: stg("offbs").note,
      segs: (stg("offbs").parts || []).map((p, i) => ({ nm: p.name, v: p.amount,
        col: [P.blueHi, P.blue, P.blueLo][i % 3],
        drill: { title: p.name, value: p.amount != null ? "$" + p.amount + "B（表外）" : "未计价",
          sub: p.note, source: SRC } })) },
    { id: "vendor", name: "供应商资金循环", tag: "先于需求解体", note: stg("vendor").note,
      segs: (stg("vendor").parts || []).map((p, i) => ({ nm: p.name, v: p.amount,
        col: [P.inkMd, P.ink][i % 2],
        drill: { title: p.name, value: p.amount != null ? "$" + p.amount + "B" : "未计价（6GW + 1.6 亿股认股权证）",
          sub: p.note, source: SRC } })) },
  ];
  const sumOf = s => s.segs.reduce((a, g) => a + (g.v || 0), 0);
  const yMax = Math.max(...stages.map(sumOf)) * 1.1;

  // ── SVG（移动端横滚容器 + 最小渲染宽）──
  const scroll = document.createElement("div");
  scroll.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(scroll);

  const W = 1080, H = 480, ML = 64, MR = 26, TOP = 88, BOT = 86;
  const x = d3.scaleBand().domain(stages.map(s => s.id)).range([ML, W - MR]).paddingInner(0.42).paddingOuter(0.04);
  const y = d3.scaleLinear().domain([0, yMax]).range([H - BOT, TOP]);

  const svg = d3.select(scroll).append("svg")
    .attr("viewBox", "0 0 " + W + " " + H)
    .style("width", "100%").style("min-width", "700px").style("display", "block")
    .attr("data-drill-keep", "1");

  // 网格与刻度
  const step = yMax > 400 ? 100 : 50;
  const ticks = d3.range(0, yMax, step);
  svg.append("g").selectAll("line").data(ticks).join("line")
    .attr("x1", ML).attr("x2", W - MR).attr("y1", d => y(d)).attr("y2", d => y(d))
    .attr("stroke", d => d === 0 ? P.ink : P.lineLo).attr("stroke-width", d => d === 0 ? 1.2 : 1);
  svg.append("g").selectAll("text").data(ticks.filter(d => d > 0)).join("text")
    .attr("x", ML - 8).attr("y", d => y(d) + 3.5).attr("text-anchor", "end")
    .attr("style", "font:10px " + U.FONTS.mono + ";fill:" + P.inkLo)
    .text(d => "$" + d + "B");

  // 顶部流向箭头（口径警示在箭头上方）
  svg.append("text").attr("x", (ML + W - MR) / 2).attr("y", 26).attr("text-anchor", "middle")
    .attr("style", "font:10.5px " + U.FONTS.mono + ";fill:" + P.inkMd)
    .text("资金流向：自己赚的钱 → 借来的钱 → 表外的钱 → 供应商掏的钱（四级口径各异，不可相加为总盘）");
  stages.slice(0, -1).forEach((s, i) => {
    const x0 = x(s.id) + x.bandwidth() + 4, x1 = x(stages[i + 1].id) - 4;
    const g = svg.append("g").attr("opacity", 0.75);
    g.append("line").attr("x1", x0).attr("x2", x1 - 7).attr("y1", 44).attr("y2", 44)
      .attr("stroke", P.inkMd).attr("stroke-width", 1.1);
    g.append("path").attr("d", "M " + (x1 - 7) + " 40.5 L " + x1 + " 44 L " + (x1 - 7) + " 47.5 Z")
      .attr("fill", P.inkMd);
  });

  const animated = [];
  stages.forEach((s, si) => {
    const gx = x(s.id), gw = x.bandwidth();
    let acc = 0;
    s.segs.forEach((g, gi) => {
      if (g.v == null) return; // 未计价构成走虚线帽
      const hPx = y(0) - y(g.v);
      const r = svg.append("rect")
        .attr("x", gx).attr("width", gw)
        .attr("y", y(0)).attr("height", 0)
        .attr("fill", g.col).attr("opacity", 0.9)
        .style("cursor", "pointer");
      animated.push({ start: 0.1 + si * 0.14 + gi * 0.08, dur: 0.55,
        set: p => r.attr("y", y(acc + g.v) + hPx * (1 - p)).attr("height", hPx * p) });
      r.on("mouseenter", e => U.showTip("<b>" + U.esc(g.nm) + "</b>：$" + g.v + "B<br/>点击查看构成与出处", e.clientX, e.clientY));
      r.on("mousemove", e => U.showTip("<b>" + U.esc(g.nm) + "</b>：$" + g.v + "B<br/>点击查看构成与出处", e.clientX, e.clientY));
      r.on("mouseleave", U.hideTip);
      r.on("click", e => U.showDrill({ title: g.drill.title, value: g.drill.value, sub: g.drill.sub,
        source: g.drill.source, x: e.clientX, y: e.clientY }));
      // 构成块内嵌金额（块够高才放，放不下落到块顶上方；金额不再只靠悬停）
      {
        const inside = hPx >= 17;
        const vlb = svg.append("text")
          .attr("x", gx + gw / 2)
          .attr("y", inside ? y(acc + g.v) + hPx / 2 + 3.5 : y(acc + g.v) - 5)
          .attr("text-anchor", "middle")
          .attr("style", "font:700 " + (inside ? 10 : 9) + "px " + U.FONTS.mono +
            ";fill:" + (inside ? P.paperHi : P.inkMd) + ";pointer-events:none")
          .attr("opacity", 0)
          .text("$" + g.v + "B");
        animated.push({ start: 0.55 + si * 0.14 + gi * 0.08, dur: 0.25, set: p => vlb.attr("opacity", p) });
      }
      // 构成块名（仅在块够高且宽时嵌一行小字，否则留给悬停与下钻）
      if (hPx >= 30) {
        const nlb = svg.append("text")
          .attr("x", gx + gw / 2)
          .attr("y", y(acc + g.v) + hPx / 2 + 15)
          .attr("text-anchor", "middle")
          .attr("style", "font:8.5px " + U.FONTS.mono + ";fill:" + P.paperHi + ";pointer-events:none")
          .attr("opacity", 0)
          .text(g.nm.length > 14 ? g.nm.slice(0, 13) + "…" : g.nm);
        animated.push({ start: 0.62 + si * 0.14 + gi * 0.08, dur: 0.25, set: p => nlb.attr("opacity", p) });
      }
      // 构成块分界发丝线
      if (gi > 0) svg.append("line").attr("x1", gx).attr("x2", gx + gw)
        .attr("y1", y(acc)).attr("y2", y(acc)).attr("stroke", P.paper).attr("stroke-width", 1.2);
      acc += g.v;
    });
    // 未计价构成（如 AMD 认股权证）：柱顶虚线帽，等宽固定高，不计入数值轴
    const unpriced = s.segs.filter(g => g.v == null);
    unpriced.forEach((g, ui) => {
      const capH = 22, capY = y(acc) - 6 - capH - ui * (capH + 4);
      const cap = svg.append("rect")
        .attr("x", gx).attr("width", gw).attr("y", capY).attr("height", capH)
        .attr("fill", "none").attr("stroke", P.inkMd).attr("stroke-width", 1.1)
        .attr("stroke-dasharray", "4 3").attr("opacity", 0).style("cursor", "pointer");
      animated.push({ start: 0.7 + si * 0.14, dur: 0.3, set: p => cap.attr("opacity", p * 0.85) });
      const capLb = svg.append("text").attr("x", gx + gw / 2).attr("y", capY + 14.5)
        .attr("text-anchor", "middle")
        .attr("style", "font:9px " + U.FONTS.mono + ";fill:" + P.inkMd).attr("opacity", 0)
        .text(g.nm.length > 16 ? g.nm.slice(0, 15) + "…" : g.nm);
      animated.push({ start: 0.78 + si * 0.14, dur: 0.25, set: p => capLb.attr("opacity", p) });
      cap.on("click", e => U.showDrill({ title: g.drill.title, value: g.drill.value, sub: g.drill.sub,
        source: g.drill.source, x: e.clientX, y: e.clientY }));
    });
    // 柱顶合计标注
    const tot = sumOf(s);
    const topY = y(acc) - (unpriced.length ? unpriced.length * 26 + 10 : 8);
    const lb = svg.append("text").attr("x", gx + gw / 2).attr("y", topY)
      .attr("text-anchor", "middle")
      .attr("style", "font:700 13px " + U.FONTS.mono + ";fill:" + (s.id === "bond" ? P.blue : P.ink))
      .attr("opacity", 0)
      .text(s.id === "ocf" ? "≈$" + tot.toFixed(0) + "B"
        : s.id === "bond" ? "+$" + tot.toFixed(0) + "B"
        : "$" + tot.toFixed(1) + "B" + (unpriced.length ? " +" : ""));
    animated.push({ start: 0.6 + si * 0.14, dur: 0.3, set: p => lb.attr("opacity", p) });
    // 级名与标签（轴下）
    svg.append("text").attr("x", gx + gw / 2).attr("y", H - BOT + 24).attr("text-anchor", "middle")
      .attr("style", "font:700 13px " + U.FONTS.serif + ";fill:" + P.ink).text(s.name);
    svg.append("text").attr("x", gx + gw / 2).attr("y", H - BOT + 41).attr("text-anchor", "middle")
      .attr("style", "font:9.5px " + U.FONTS.mono + ";fill:" + P.inkLo).text(s.tag);
  });

  U.play(animated, svg.node(), { threshold: 0.22 });

  // ── 杠杆读数条（financeFall.drill，可点下钻）──
  if (F.drill) {
    const strip = document.createElement("div");
    strip.setAttribute("data-drill-keep", "1");
    strip.style.cssText = "margin-top:14px;padding:10px 14px;border:1px solid " + P.blue + ";" +
      "background:" + P.blueSoft + ";cursor:pointer;font:12px " + U.FONTS.mono + ";color:" + P.inkMd + ";line-height:1.65";
    strip.innerHTML = "<b style='color:" + P.ink + "'>" + U.esc(F.drill.title) + "：</b>" + U.esc(F.drill.value) +
      "　<span style='color:" + P.inkLo + "'>点击看杠杆读数与口径 →</span>";
    strip.addEventListener("click", e => U.showDrill({ title: F.drill.title, value: F.drill.value,
      sub: F.drill.sub, source: F.drill.source, x: e.clientX, y: e.clientY }));
    body.appendChild(strip);
  }
})();
