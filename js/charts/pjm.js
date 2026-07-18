// §7 PJM 拍卖价格轨迹（宿主 #chart-pjm）
// $28.92 → $269.92 → $333.44 轨迹 + 触顶区间带 + 无帽模拟虚线 + 2028/29 触顶示意点；
// 分段标注 +833% 与累计 +1,053%（两标签端点不同，不可混标，均取自数据 segments）；
// 触顶区间 / 无帽价 / 新上限均从数据文本解析，不硬编码；点拍卖轮下钻缺口双口径。
// 数据：RPT.pjm（points / segments / unit / drill）。
(() => {
  const host = document.getElementById("chart-pjm");
  if (!host || !window.RPT || !RPT.pjm) return;

  const P = U.PAL, MONO = U.FONTS.mono, SERIF = U.FONTS.serif;
  const pts = RPT.pjm.points;
  const priced = pts.filter(p => p.price != null);
  const maxP = Math.max(...priced.map(p => p.price));

  const segShort = (RPT.pjm.segments || []).map(s2 => String(s2.label).replace(/（.*?）/g, "")).join(" 与 ");
  const body = U.frame(host, {
    title: "PJM 容量拍卖价格轨迹 · 从 $" + priced[0].price + " 到连续触顶（" + RPT.pjm.unit + "）",
    sub: "分段标注 " + segShort + " · 红带 = 触顶区间 · 虚线 = 无帽模拟/触顶示意 · 点击拍卖轮下钻缺口",
    src: RPT.pjm.drill.source,
  });

  const st = document.createElement("style");
  st.textContent = "#chart-pjm .cf-body{overflow-x:auto}#chart-pjm svg{min-width:700px;display:block}";
  document.head.appendChild(st);

  // 从数据文本解析：触顶区间带 / 无帽模拟价 / 2028/29 新上限
  const sub = String(RPT.pjm.drill.sub || "");
  const bandM = sub.match(/触顶区间\s*\$([\d.]+)\s*[–—-]\s*\$?([\d.]+)/);
  const band = bandM ? [+bandM[1], +bandM[2]] : [maxP * 0.975, maxP];
  const uncM = sub.match(/无帽模拟\s*\$([\d.]+)/) || String(pts.map(p => p.note).join(" ")).match(/无价格帽模拟价\s*\$([\d.]+)/);
  const uncapped = uncM ? +uncM[1] : null;
  const capM = String((pts[pts.length - 1] || {}).note || "").match(/上限下调[^$]*\$\s*([\d.]+)/);
  const newCap = capM ? +capM[1] : null;

  const W = 1080, ML = 70, MR = 220, TOP = 52, BOT = 52, H = 440;
  const x = d3.scalePoint().domain(pts.map(p => p.auction)).range([ML, W - MR]).padding(0.4);
  // 纵轴 0–400：触顶区间带（$325–333）在全帽轴上仅数像素厚，故无帽模拟价移出主轴、断轴标示
  const YMAX = Math.max(400, band[1] * 1.15);
  const y = d3.scaleLinear().domain([0, YMAX]).range([H - BOT, TOP]);

  const svg = d3.select(body).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%")
    .attr("data-drill-keep", "1");
  const animated = [];

  // ── 网格与纵轴 ──
  const step = 100;
  for (let v = 0; v <= YMAX; v += step) {
    svg.append("line")
      .attr("x1", ML).attr("x2", W - MR).attr("y1", y(v)).attr("y2", y(v))
      .attr("stroke", v === 0 ? P.line : P.lineLo);
    svg.append("text")
      .attr("x", ML - 10).attr("y", y(v) + 3.5).attr("text-anchor", "end")
      .attr("style", `font:10px ${MONO};fill:${P.inkLo}`)
      .text("$" + v);
  }
  svg.append("text")
    .attr("x", ML - 10).attr("y", TOP - 26).attr("text-anchor", "end")
    .attr("style", `font:9.5px ${MONO};fill:${P.inkLo}`)
    .text(RPT.pjm.unit);

  // ── 触顶区间带（薄带 + 红色虚线上下缘，保证任意缩放可读）──
  const bandRect = svg.append("rect")
    .attr("x", ML).attr("width", W - MR - ML)
    .attr("y", y(band[1])).attr("height", Math.max(2, y(band[0]) - y(band[1])))
    .attr("fill", "rgba(194,47,78,.10)").attr("opacity", 0);
  const bandEdges = [band[0], band[1]].map(v =>
    svg.append("line")
      .attr("x1", ML).attr("x2", W - MR).attr("y1", y(v)).attr("y2", y(v))
      .attr("stroke", P.red).attr("stroke-width", 1).attr("stroke-dasharray", "4 3").attr("opacity", 0));
  const bandLab = svg.append("text")
    .attr("x", W - MR - 6).attr("y", y(band[1]) - 6).attr("text-anchor", "end")
    .attr("style", `font:9.5px ${MONO};fill:${P.red}`).attr("opacity", 0)
    .text("触顶区间 $" + band[0] + "–" + band[1]);
  animated.push({ start: 0.7, dur: 0.5, set: p => {
    bandRect.attr("opacity", p); bandLab.attr("opacity", p);
    bandEdges.forEach(e2 => e2.attr("opacity", p));
  } });

  // ── 无帽模拟价：超出主轴（0–400），断轴标示——顶部虚线横档 + 断口斜杠 + 垂直虚线 ──
  const pUnc = pts.find(p => /无价格帽/.test(p.note || ""));
  if (uncapped && pUnc) {
    const ux = x(pUnc.auction), laneY = 30;
    const dl = svg.append("line")
      .attr("x1", ML).attr("x2", ux).attr("y1", laneY).attr("y2", laneY)
      .attr("stroke", P.inkMd).attr("stroke-width", 1).attr("stroke-dasharray", "5 4").attr("opacity", 0);
    const dc = svg.append("line")
      .attr("x1", ux).attr("x2", ux).attr("y1", y(pUnc.price)).attr("y2", laneY)
      .attr("stroke", P.inkMd).attr("stroke-width", 1).attr("stroke-dasharray", "2 3").attr("opacity", 0);
    // 断口：两条平行斜杠 crossing 垂直虚线于轴顶
    const brk = [
      svg.append("line").attr("x1", ux - 7).attr("y1", TOP - 2).attr("x2", ux + 7).attr("y2", TOP - 8),
      svg.append("line").attr("x1", ux - 7).attr("y1", TOP + 6).attr("x2", ux + 7).attr("y2", TOP),
    ].map(el => el.attr("stroke", P.inkMd).attr("stroke-width", 1.2).attr("opacity", 0));
    const ut = svg.append("text")
      .attr("x", ML).attr("y", laneY - 7)
      .attr("style", `font:9.5px ${MONO};fill:${P.inkMd}`).attr("opacity", 0)
      .text("无价格帽模拟价 $" + uncapped + "（超出本轴，断轴标示）");
    animated.push({ start: 1.0, dur: 0.5, set: p => {
      dl.attr("opacity", p); dc.attr("opacity", p); ut.attr("opacity", p);
      brk.forEach(b2 => b2.attr("opacity", p));
    } });
  }

  // ── 主轨迹（实线过实价点；末轮触顶示意接红虚线）──
  const solid = pts.filter(p => p.price != null);
  const line = d3.line().x(d => x(d.auction)).y(d => y(d.price));
  const path = svg.append("path")
    .attr("d", line(solid))
    .attr("fill", "none").attr("stroke", P.ink).attr("stroke-width", 2.2);
  const len = path.node().getTotalLength();
  path.attr("stroke-dasharray", len).attr("stroke-dashoffset", len);
  animated.push({ start: 0.15, dur: 0.9, set: p => path.attr("stroke-dashoffset", len * (1 - p)) });

  // 末轮（price=null）触顶示意：红虚线 + 空心点
  const lastP = pts[pts.length - 1];
  if (lastP.price == null && newCap != null) {
    const prev = solid[solid.length - 1];
    const dash = svg.append("line")
      .attr("x1", x(prev.auction)).attr("y1", y(prev.price))
      .attr("x2", x(lastP.auction)).attr("y2", y(newCap))
      .attr("stroke", P.red).attr("stroke-width", 1.6).attr("stroke-dasharray", "5 4").attr("opacity", 0);
    animated.push({ start: 0.95, dur: 0.4, set: p => dash.attr("opacity", p) });
  }

  // ── 拍卖轮点 + 读数 ──
  pts.forEach((d, i) => {
    const cx = x(d.auction);
    const isNull = d.price == null;
    const cyv = isNull ? newCap : d.price;
    if (cyv == null) return;
    const isCap = !isNull && d.price >= band[0] - 1;
    const col = (isCap || isNull) ? P.red : P.ink;

    const dot = svg.append("circle")
      .attr("cx", cx).attr("cy", y(cyv)).attr("r", 0)
      .attr("fill", isNull ? P.paperHi : col)
      .attr("stroke", col).attr("stroke-width", isNull ? 1.6 : 0)
      .attr("stroke-dasharray", isNull ? "3 2" : null)
      .style("cursor", "pointer");
    animated.push({ start: 0.3 + i * 0.25, dur: 0.25, set: p => dot.attr("r", 5 * p) });

    const vl = svg.append("text")
      .attr("x", cx + 11).attr("y", y(cyv) - 8)
      .attr("style", `font:700 13px ${MONO};fill:${col}`).attr("opacity", 0)
      .text(isNull ? "上限 $" + newCap + "（触顶示意）" : "$" + d.price);
    animated.push({ start: 0.4 + i * 0.25, dur: 0.3, set: p => vl.attr("opacity", p) });

    // 轮次下钻（缺口双口径在 note 内）
    const drill = e => U.showDrill({
      title: "PJM 容量拍卖 · " + d.auction + " 年度",
      value: isNull ? "连续第四次触顶（清算价未单列，见注记）" : "$" + d.price + "/MW-day",
      sub: d.note || undefined,
      source: RPT.pjm.drill.source,
      x: e.clientX, y: e.clientY });
    dot.on("click", drill);
    const hit = svg.append("circle")
      .attr("cx", cx).attr("cy", y(cyv)).attr("r", 18)
      .attr("fill", "rgba(0,0,0,0)").style("cursor", "pointer");
    hit.on("click", drill);

    // 横轴轮次标签（可点）
    const xl = svg.append("text")
      .attr("x", cx).attr("y", H - BOT + 24).attr("text-anchor", "middle")
      .attr("style", `font:10.5px ${MONO};fill:${P.inkMd}`).style("cursor", "pointer")
      .text(d.auction);
    xl.on("click", drill);
  });

  // ── 分段标注（取自数据 segments，两标签端点不同不混标）──
  const segs = RPT.pjm.segments || [];
  if (segs[0] && solid.length >= 2) {
    const a = solid[0], b = solid[1];
    const mx = (x(a.auction) + x(b.auction)) / 2, my = (y(a.price) + y(b.price)) / 2;
    const t = svg.append("text")
      .attr("x", mx).attr("y", my - 16).attr("text-anchor", "middle")
      .attr("style", `font:700 12px ${MONO};fill:${P.ink}`).attr("opacity", 0)
      .text(segs[0].label);
    animated.push({ start: 0.8, dur: 0.4, set: p => t.attr("opacity", p) });
  }
  if (segs[1] && solid.length >= 3) {
    const a = solid[0], b = solid[solid.length - 1];
    const yb = y(b.price) - 34;
    const br = svg.append("path")
      .attr("d", `M ${x(a.auction)} ${yb + 6} L ${x(a.auction)} ${yb} L ${x(b.auction)} ${yb} L ${x(b.auction)} ${yb + 6}`)
      .attr("fill", "none").attr("stroke", P.inkMd).attr("stroke-width", 1).attr("opacity", 0);
    const t = svg.append("text")
      .attr("x", (x(a.auction) + x(b.auction)) / 2).attr("y", yb - 8).attr("text-anchor", "middle")
      .attr("style", `font:700 12px ${MONO};fill:${P.inkMd}`).attr("opacity", 0)
      .text(segs[1].label);
    animated.push({ start: 1.1, dur: 0.4, set: p => { br.attr("opacity", p); t.attr("opacity", p); } });
  }

  U.play(animated, svg.node(), { threshold: 0.2 });
})();
