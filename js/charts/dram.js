// §10 内存周期曲线（宿主 #chart-dram）
// DRAM 合约价同比：+93~98% → +50~55% → +13~18%（预期）；
// 竖须 = 区间高低，中值连线，虚线段 = 机构预期；标注"涨幅收敛先于价格见顶"；点季下钻。
// 数据：RPT.dramCycle（区间数值从 change 字符串解析，不硬编码）。
(() => {
  const host = document.getElementById("chart-dram");
  if (!host || !window.RPT || !window.U || !window.d3) return;
  const D = RPT.dramCycle;
  if (!D || !D.points) return;
  const body = U.frame(host, {
    title: "内存周期：合约价涨幅逐季收敛",
    sub: "DRAM 合约价同比涨幅 · 竖须 = 报价区间 · 圆点 = 区间中值 · 虚线段 = 机构预期 · 点击标注点下钻口径",
    src: "行业机构 · 2026-07-10",
  });

  const P = U.PAL;
  const pts = D.points.map((p, i) => {
    const m = String(p.change).match(/([+-]?\d+(?:\.\d+)?)\s*[~～–—-]\s*([+-]?\d+(?:\.\d+)?)\s*%/);
    const lo = m ? +m[1] : 0, hi = m ? +m[2] : 0;
    return { ...p, i, lo, hi, mid: (lo + hi) / 2, expected: /预期|预计/.test(p.quarter) };
  });
  const maxHi = d3.max(pts, d => d.hi) || 100;

  const css = `
  #chart-dram .dr-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
  #chart-dram .dr-inner{min-width:680px}
  #chart-dram .dr-note{font-size:11.5px;color:var(--ink-lo);line-height:1.7;margin-top:10px;max-width:760px}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const scroll = document.createElement("div"); scroll.className = "dr-scroll";
  const inner = document.createElement("div"); inner.className = "dr-inner";
  scroll.appendChild(inner); body.appendChild(scroll);

  const W = 900, H = 380, ML = 58, MR = 40, MT = 46, MB = 56;
  const x = d3.scalePoint().domain(pts.map(d => d.quarter)).range([ML, W - MR]).padding(0.55);
  const y = d3.scaleLinear().domain([0, maxHi * 1.18]).range([H - MB, MT]);

  const svg = d3.select(inner).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%").style("display", "block")
    .attr("data-drill-keep", "1");

  // 网格与刻度
  const ticks = d3.range(0, Math.ceil(maxHi / 20) * 20 + 1, 20);
  svg.append("g").selectAll("line").data(ticks).join("line")
    .attr("x1", ML).attr("x2", W - MR)
    .attr("y1", d => y(d)).attr("y2", d => y(d))
    .attr("stroke", d => d === 0 ? P.ink : P.lineLo)
    .attr("stroke-width", d => d === 0 ? 1.2 : 1);
  svg.append("g").selectAll("text").data(ticks).join("text")
    .attr("x", ML - 10).attr("y", d => y(d) + 3.5).attr("text-anchor", "end")
    .attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkLo}`)
    .text(d => "+" + d + "%");

  // 区间带（hi–lo area）
  const band = d3.area()
    .x(d => x(d.quarter)).y0(d => y(d.lo)).y1(d => y(d.hi));
  const bandPath = svg.append("path")
    .datum(pts).attr("d", band)
    .attr("fill", "rgba(34,81,255,.09)").attr("opacity", 0);

  // 中值连线：实际段实线、预期段虚线
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) segs.push([pts[i], pts[i + 1]]);
  const lineGen = d3.line().x(d => x(d.quarter)).y(d => y(d.mid));
  const segPaths = svg.append("g").selectAll("path").data(segs).join("path")
    .attr("fill", "none")
    .attr("stroke", P.blue).attr("stroke-width", 2.2)
    .attr("stroke-dasharray", d => d[1].expected ? "6 4" : null)
    .attr("opacity", 0.9);
  segPaths.each(function () {
    const len = this.getTotalLength();
    d3.select(this).attr("stroke-dashoffset", 0).attr("data-len", len);
  });

  // 季度竖须 + 中值点 + 值签 + 季签
  const g = svg.append("g").selectAll("g.pt").data(pts).join("g")
    .attr("class", "pt").attr("style", "cursor:pointer");
  g.append("line")
    .attr("x1", d => x(d.quarter)).attr("x2", d => x(d.quarter))
    .attr("y1", d => y(d.lo)).attr("y2", d => y(d.hi))
    .attr("stroke", P.blueLo).attr("stroke-width", 1.4)
    .attr("class", "whisk").attr("opacity", 0);
  g.append("line")
    .attr("x1", d => x(d.quarter) - 7).attr("x2", d => x(d.quarter) + 7)
    .attr("y1", d => y(d.hi)).attr("y2", d => y(d.hi))
    .attr("stroke", P.blueLo).attr("stroke-width", 1.4).attr("class", "whisk").attr("opacity", 0);
  g.append("line")
    .attr("x1", d => x(d.quarter) - 7).attr("x2", d => x(d.quarter) + 7)
    .attr("y1", d => y(d.lo)).attr("y2", d => y(d.lo))
    .attr("stroke", P.blueLo).attr("stroke-width", 1.4).attr("class", "whisk").attr("opacity", 0);
  g.append("circle")
    .attr("cx", d => x(d.quarter)).attr("cy", d => y(d.mid)).attr("r", 0)
    .attr("fill", P.paperHi).attr("stroke", P.blue).attr("stroke-width", 2)
    .attr("class", "dot");
  g.append("circle")
    .attr("cx", d => x(d.quarter)).attr("cy", d => y(d.mid)).attr("r", 18)
    .attr("fill", "transparent")
    .attr("class", "hit");
  g.append("text")
    .attr("x", d => x(d.quarter)).attr("y", d => y(d.hi) - 12)
    .attr("text-anchor", "middle")
    .attr("style", d => `font:700 13px ${U.FONTS.mono};fill:${d.expected ? P.red : P.blue}`)
    .attr("class", "vlab").attr("opacity", 0)
    .text(d => d.change);
  g.append("text")
    .attr("x", d => x(d.quarter)).attr("y", H - MB + 24)
    .attr("text-anchor", "middle")
    .attr("style", `font:10.5px ${U.FONTS.mono};fill:${P.inkMd}`)
    .attr("class", "qlab").attr("opacity", 0)
    .text(d => d.quarter);
  g.append("text")
    .attr("x", d => x(d.quarter)).attr("y", H - MB + 40)
    .attr("text-anchor", "middle")
    .attr("style", `font:9px ${U.FONTS.mono};fill:${P.inkLo}`)
    .attr("class", "qlab").attr("opacity", 0)
    .text(d => d.expected ? "预期" : "已发生");

  // 标注：涨幅收敛先于价格见顶（取数据注记首句）
  const anno = String(D.note || "").split("——")[0];
  const q0 = pts[0], qN = pts[pts.length - 1];
  const ann = svg.append("g").attr("class", "anno").attr("opacity", 0);
  ann.append("path")
    .attr("d", `M ${x(q0.quarter) + 30} ${y(q0.hi) - 34} L ${x(qN.quarter) - 16} ${y(qN.hi) - 34}`)
    .attr("stroke", P.red).attr("stroke-width", 1).attr("stroke-dasharray", "4 3")
    .attr("marker-end", "url(#dr-arrow)");
  ann.append("text")
    .attr("x", (x(q0.quarter) + x(qN.quarter)) / 2).attr("y", y(q0.hi) - 44)
    .attr("text-anchor", "middle")
    .attr("style", `font:700 11.5px ${U.FONTS.serif};fill:${P.red}`)
    .text(anno);
  svg.append("defs").append("marker")
    .attr("id", "dr-arrow").attr("viewBox", "0 0 8 8")
    .attr("refX", 7).attr("refY", 4)
    .attr("markerWidth", 7).attr("markerHeight", 7).attr("orient", "auto")
    .append("path").attr("d", "M0,0 L8,4 L0,8 Z").attr("fill", P.red);

  // 交互：悬停加粗、点击下钻（触屏同等）
  g.on("mouseenter", function (e, d) {
    d3.select(this).select("circle.dot").attr("r", 6.5).attr("stroke-width", 2.6);
    U.showTip(`<b>${U.esc(d.quarter)}</b>　${U.esc(d.change)}${d.note ? "<br/>" + U.esc(d.note) : ""}`, e.clientX, e.clientY);
  });
  g.on("mouseleave", function () {
    d3.select(this).select("circle.dot").attr("r", 4.5).attr("stroke-width", 2);
    U.hideTip();
  });
  g.on("click", (e, d) => U.showDrill({
    title: `${d.quarter} · DRAM 合约价`,
    value: d.change + (d.note ? `（${d.note}）` : ""),
    sub: D.drill.sub, source: D.drill.source, x: e.clientX, y: e.clientY }));

  // 底部注记
  const nt = document.createElement("p");
  nt.className = "dr-note";
  nt.textContent = D.note;
  inner.appendChild(nt);

  // 入场
  svg.selectAll("circle.dot").attr("r", 4.5).attr("opacity", 0);
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    bandPath.transition().duration(700).attr("opacity", 1);
    segPaths.each(function (_, k) {
      const p = d3.select(this), len = +p.attr("data-len");
      if (!p.attr("stroke-dasharray")) {
        p.attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", len)
          .transition().delay(250 + k * 300).duration(650).attr("stroke-dashoffset", 0);
      } else {
        p.attr("opacity", 0).transition().delay(250 + k * 300).duration(650).attr("opacity", 0.9);
      }
    });
    g.selectAll("line.whisk").transition().delay((_, i) => 350 + i * 180).duration(420).attr("opacity", 1);
    g.selectAll("circle.dot").transition().delay((_, i) => 420 + i * 180).duration(300).attr("opacity", 1);
    g.selectAll("text.vlab").transition().delay((_, i) => 520 + i * 180).duration(320).attr("opacity", 1);
    g.selectAll("text.qlab").transition().delay((_, i) => 300 + i * 120).duration(320).attr("opacity", 1);
    ann.transition().delay(1100).duration(500).attr("opacity", 1);
  }, { threshold: 0.25 });
  io.observe(svg.node());
})();
