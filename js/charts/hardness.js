// §6 瓶颈硬度交期对数横条（宿主 #chart-hardness）
// 对数轴横条：GPU 6–12 周 → PJM 端到端超 8 年，六环节一屏排开；
// 蓝族 = 芯片链（可资本化、交期在收敛），墨 = 电力交付链（不可速成）；
// GPU 旁叠"峰值 52 周"历史刻度（从其注记文本解析，不硬编码）；底部晶圆损耗注。
// 数据：RPT.hardness（bars / waferNote）。
(() => {
  const host = document.getElementById("chart-hardness");
  if (!host || !window.RPT || !RPT.hardness) return;
  const body = U.frame(host, {
    title: "瓶颈硬度 · 交期对数横条（6 周 → 超 8 年）",
    sub: "对数轴 · 蓝 = 芯片链（交期在收敛）· 墨 = 电力交付链 · 红标 = 最硬一环 · 点击横条下钻",
    src: "行业机构 · 官方披露 · 券商研究",
  });

  const P = U.PAL, MONO = U.FONTS.mono, SERIF = U.FONTS.serif;

  const st = document.createElement("style");
  st.textContent = "#chart-hardness .cf-body{overflow-x:auto}#chart-hardness svg{min-width:700px;display:block}";
  document.head.appendChild(st);

  const bars = RPT.hardness.bars;
  const CHIP = 2; // 前两条为芯片链（蓝族），其余为电力交付链（墨）
  const W = 1080, ML = 196, MR = 128, TOP = 46, ROW = 56;
  const H = TOP + bars.length * ROW + 96;
  const x = d3.scaleLog().domain([4, 520]).range([ML, W - MR]);
  const trunc = (s, n) => { s = String(s || ""); return s.length > n ? s.slice(0, n) + "…" : s; };

  const svg = d3.select(body).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%")
    .attr("data-drill-keep", "1");
  const animated = [];

  // ── 对数刻度与网格（周 → 年双读法）──
  const ticks = [4, 13, 52, 104, 208, 416];
  const tickLab = v => (v < 52 ? v + " 周" : (v / 52) + " 年");
  ticks.forEach(v => {
    svg.append("line")
      .attr("x1", x(v)).attr("x2", x(v))
      .attr("y1", TOP - 10).attr("y2", TOP + bars.length * ROW - 8)
      .attr("stroke", v === 52 ? P.line : P.lineLo)
      .attr("stroke-width", 1);
    svg.append("text")
      .attr("x", x(v)).attr("y", TOP - 16)
      .attr("text-anchor", "middle")
      .attr("style", `font:10px ${MONO};fill:${P.inkLo}`)
      .text(tickLab(v));
  });
  svg.append("text")
    .attr("x", W - MR).attr("y", TOP - 32)
    .attr("text-anchor", "end")
    .attr("style", `font:9.5px ${MONO};fill:${P.inkLo}`)
    .text("交期（对数轴，周）");

  // ── 横条 ──
  const rows = svg.selectAll("g.hrow").data(bars).enter().append("g")
    .attr("transform", (d, i) => `translate(0,${TOP + i * ROW})`)
    .style("cursor", "pointer");

  rows.each(function (d, i) {
    const g = d3.select(this);
    const isChip = i < CHIP;
    const col = isChip ? (i === 0 ? P.blueLo : P.blue) : (i === bars.length - 1 ? P.ink : P.inkMd);
    const yC = ROW / 2 - 4, bh = 22;
    const x0 = x(Math.max(4, d.weeksMin));
    const x1raw = x(Math.max(4, d.weeksMax));
    const isPoint = d.weeksMin === d.weeksMax;
    const x1 = isPoint ? x0 + 14 : x1raw;
    const xStart = isPoint ? x0 - 7 : x0;

    // 行分隔发丝线
    if (i > 0) g.append("line").attr("x1", ML - 150).attr("x2", W - MR)
      .attr("y1", -6).attr("y2", -6).attr("stroke", P.lineLo);

    // 左槽：环节名 + 注（截断）
    g.append("text").attr("x", ML - 14).attr("y", yC - 1)
      .attr("text-anchor", "end")
      .attr("style", `font:700 12.5px ${SERIF};fill:${P.ink}`)
      .text(d.item);
    g.append("text").attr("x", ML - 14).attr("y", yC + 15)
      .attr("text-anchor", "end")
      .attr("style", `font:8.5px ${MONO};fill:${P.inkLo}`)
      .text(trunc(d.note, 16));

    // 条体（生长动画）
    const bar = g.append("rect")
      .attr("x", xStart).attr("y", yC - bh / 2)
      .attr("width", 0).attr("height", bh).attr("rx", 2)
      .attr("fill", col);
    const fullW = x1 - xStart;
    animated.push({ start: 0.15 + i * 0.16, dur: 0.65, set: p => bar.attr("width", Math.max(0.5, fullW * p)) });

    // 最硬一环红标
    if (i === bars.length - 1) {
      const dm = g.append("path")
        .attr("d", `M ${x1 + 8} ${yC - 5} L ${x1 + 13} ${yC} L ${x1 + 8} ${yC + 5} L ${x1 + 3} ${yC} Z`)
        .attr("fill", P.red).attr("opacity", 0);
      animated.push({ start: 0.15 + i * 0.16 + 0.6, dur: 0.3, set: p => dm.attr("opacity", p) });
    }

    // 读数标签（条右）
    const vl = g.append("text")
      .attr("x", x1 + (i === bars.length - 1 ? 20 : 10)).attr("y", yC + 4)
      .attr("style", `font:700 12px ${MONO};fill:${P.ink}`).attr("opacity", 0)
      .text(d.display);
    animated.push({ start: 0.15 + i * 0.16 + 0.45, dur: 0.3, set: p => vl.attr("opacity", p) });

    // GPU：峰值 52 周历史刻度（从注记"…从 52 周收敛…"解析）
    const gm = String(d.note || "").match(/从\s*([\d.]+)\s*周/);
    if (gm) {
      const gv = +gm[1];
      const gl = g.append("line")
        .attr("x1", x(gv)).attr("x2", x(gv))
        .attr("y1", yC - bh / 2 - 7).attr("y2", yC + bh / 2 + 7)
        .attr("stroke", P.inkLo).attr("stroke-width", 1.2).attr("stroke-dasharray", "3 3")
        .attr("opacity", 0);
      const gt = g.append("text")
        .attr("x", x(gv)).attr("y", yC - bh / 2 - 12)
        .attr("text-anchor", "middle")
        .attr("style", `font:8.5px ${MONO};fill:${P.inkLo}`).attr("opacity", 0)
        .text("峰值 " + gv + " 周");
      animated.push({ start: 0.9, dur: 0.4, set: p => { gl.attr("opacity", p); gt.attr("opacity", p); } });
    }

    g.on("click", e => U.showDrill({
      title: "瓶颈硬度 · " + d.item,
      value: "交期 " + d.display,
      sub: d.note,
      source: "行业机构 · 官方披露 · 券商研究",
      x: e.clientX, y: e.clientY }));
  });

  // ── 晶圆损耗注（两个口径并列，按句折行、保留句读）──
  const wn = String(RPT.hardness.waferNote || "");
  if (wn) {
    const ny = TOP + bars.length * ROW + 22;
    svg.append("line").attr("x1", ML - 150).attr("x2", W - MR)
      .attr("y1", ny).attr("y2", ny).attr("stroke", P.lineLo);
    const parts = wn.match(/[^；。]+[；。]?/g) || [];
    const first = svg.append("text")
      .attr("x", ML - 150).attr("y", ny + 20)
      .attr("style", `font:9.5px ${MONO};fill:${P.inkMd}`);
    first.append("tspan").attr("style", `font-weight:700;fill:${P.ink}`).text("晶圆损耗（两个口径并列）  ");
    first.append("tspan").text((parts[0] || "").replace(/^晶圆损耗（两个口径并列）：/, ""));
    parts.slice(1).forEach((pt, k) => {
      svg.append("text")
        .attr("x", ML - 150).attr("y", ny + 36 + k * 15)
        .attr("style", `font:9.5px ${MONO};fill:${P.inkMd}`)
        .text(pt);
    });
  }

  U.play(animated, svg.node(), { threshold: 0.2 });
})();
