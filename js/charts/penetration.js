// §4 渗透率警示仪表（宿主 #chart-penetration）
// 半圆仪表 0–100%，0–10% 为红色警示带；读数停在约 6%（count-up）。
// 大数字 + 分子/分母 + 并存注记；点击任意处下钻测算口径。数据：RPT.penetration。
(() => {
  const host = document.getElementById("chart-penetration");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "付费渗透率警示仪表：年化收入高增，付费渗透仍停留在个位数",
    sub: "红带 = 个位数区间 · 点击仪表下钻测算口径",
    src: "券商研究 · 截至 2026-07-17",
  });

  const P = U.PAL;
  const PN = RPT.penetration;
  // 指针位置从数据文本解析（"约 6%" → 0.06），不另写死
  const pct = (parseFloat((String(PN.value).match(/([\d.]+)\s*%/) || [0, "6"])[1]) || 6) / 100;

  const sc = document.createElement("div");
  sc.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(sc);

  const W = 620, H = 360, CX = 310, CY = 268, R = 200;
  const svg = d3.select(sc).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%").style("max-width", "640px").style("min-width", "420px")
    .style("display", "block").style("margin", "0 auto")
    .attr("data-drill-keep", "1")
    .style("cursor", "pointer");

  // 仪表角度：canvas/d3-path 约定（0 = 正上方，顺时针为正）
  // f: 0→1 映射 左端→顶端→右端；a(f) = π·(f − 0.5)
  const a = f => Math.PI * (f - 0.5);
  const pt = (f, r) => [CX + Math.sin(a(f)) * r, CY - Math.cos(a(f)) * r];

  // 底弧（墨浅）+ 警示带 + 读数弧，统一用描边弧绘制（顺时针增大角度）
  const arcLine = (f0, f1, col, wdt, op) => {
    const p = d3.path();
    p.arc(CX, CY, R - 13, a(f0), a(f1), false);
    svg.append("path")
      .attr("d", p.toString())
      .attr("fill", "none").attr("stroke", col).attr("stroke-width", wdt)
      .attr("opacity", op == null ? 1 : op);
  };
  arcLine(0, 1, P.lineLo, 26);
  arcLine(0, 0.1, P.redSoft, 26); // 个位数警示带
  // 读数弧（0→6%），生长动画
  const valPath = svg.append("path")
    .attr("fill", "none").attr("stroke", P.red).attr("stroke-width", 26);
  const setValArc = f => {
    const p = d3.path();
    if (f > 0.0005) p.arc(CX, CY, R - 13, a(0), a(f), false);
    valPath.attr("d", p.toString());
  };

  // 刻度 0 / 10 / 50 / 100%
  [[0, "0"], [0.1, "10%"], [0.5, "50%"], [1, "100%"]].forEach(([f, lab]) => {
    const [x1, y1] = pt(f, R + 6);
    const [x2, y2] = pt(f, R + 14);
    svg.append("line").attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2)
      .attr("stroke", f === 0.1 ? P.red : P.inkLo).attr("stroke-width", f === 0.1 ? 1.6 : 1);
    const [tx, ty] = pt(f, R + 28);
    svg.append("text").attr("x", tx).attr("y", ty + 4).attr("text-anchor", "middle")
      .attr("style", `font:10px ${U.FONTS.mono};fill:${f === 0.1 ? P.red : P.inkLo}`)
      .text(lab + (f === 0.1 ? "（个位数上限）" : ""));
  });

  // 指针
  const needle = svg.append("line")
    .attr("x1", CX).attr("y1", CY).attr("x2", CX).attr("y2", CY)
    .attr("stroke", P.ink).attr("stroke-width", 2.4);
  svg.append("circle").attr("cx", CX).attr("cy", CY).attr("r", 5).attr("fill", P.ink);
  const setNeedle = f => {
    const [nx, ny] = pt(f, R - 40);
    needle.attr("x2", nx).attr("y2", ny);
  };

  // 大数字 + 分子/分母
  const big = svg.append("text")
    .attr("x", CX).attr("y", CY - 66).attr("text-anchor", "middle")
    .attr("style", `font:700 46px ${U.FONTS.mono};fill:${P.red}`)
    .text("");
  svg.append("text")
    .attr("x", CX).attr("y", CY - 34).attr("text-anchor", "middle")
    .attr("style", `font:11px ${U.FONTS.mono};fill:${P.inkMd}`)
    .text(`${PN.numerator} / ${PN.denominator}`);
  svg.append("text")
    .attr("x", CX).attr("y", CY + 34).attr("text-anchor", "middle")
    .attr("style", `font:10.5px ${U.FONTS.mono};fill:${P.inkLo}`)
    .text(PN.note);

  // 入场：指针 + 读数弧 + count-up 同步
  const dur = 1.15;
  const animated = [
    { start: 0.1, dur, set: t => { setNeedle(pct * t); setValArc(pct * t); } },
    { start: 0.1, dur, set: t => big.text(t <= 0.01 ? "" : "约 " + Math.round(pct * 100 * t) + "%") },
  ];
  U.play(animated, svg.node(), { threshold: 0.3 });

  svg.on("click", e => U.showDrill({
    title: PN.drill.title, value: PN.drill.value, sub: PN.drill.sub,
    source: PN.drill.source, x: e.clientX, y: e.clientY }));
})();
