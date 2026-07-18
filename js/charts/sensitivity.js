// §5 敏感性滑块（宿主 #chart-sensitivity）——全报告原创交互
// 拖动"中国模型租用服务增速"滑块（基准 4.0x → 砍半 2.0x），实时重算需求合成增速与缺口比；
// 需求合成增速越过 2.85x 供给线时，结论标签翻转为"缺口缓解"。初始位 4.0x / base。
// 数据：RPT.growthLines（权重×增速）+ RPT.gap（供给基准 / 缺口比起点）。DOM 滑块 + SVG 读数。
(() => {
  const host = document.getElementById("chart-sensitivity");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "敏感性滑块：拖动中国模型服务增速，看结论如何变化（本报告测算）",
    sub: "仅改变承重假设一线，其余五线与供给侧锁定基准值 · 实时重算，不改写任何基准读数",
    src: "本报告测算 · 2026-07-17",
  });

  const P = U.PAL;
  const GL = RPT.growthLines;
  const gap = RPT.gap;
  const baseCase = gap.cases.find(c => c.key === "base");
  const SUPPLY = baseCase.supply;          // 2.85x（基准情景供给线）
  const RATIO0 = gap.current;              // 0.70（缺口比起点）
  const china = GL.lines.find(l => l.id === "chinaModel");
  const others = GL.lines.filter(l => l.id !== "chinaModel");
  const othersSum = others.reduce((s, l) => s + l.weight * l.base, 0);
  const demandAt = g => othersSum + china.weight * g;      // 需求合成增速
  const ratioAt = g => RATIO0 * demandAt(g) / SUPPLY;      // 12 个月缺口比
  const G_BASE = china.base;                               // 4.0x
  const G_MIN = china.low;                                 // 2.0x
  const G_FLIP = (SUPPLY - othersSum) / china.weight;      // 翻转点（需求 = 供给）

  // ── DOM：滑块区 ──
  const ctl = document.createElement("div");
  ctl.style.cssText = `border:1px solid ${P.line};border-radius:3px;padding:14px 16px 10px;margin-bottom:6px`;
  const labRow = document.createElement("div");
  labRow.style.cssText = "display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px";
  labRow.innerHTML =
    `<span style="font:700 13px ${U.FONTS.serif};color:${P.ink}">中国模型租用服务增速（承重假设）</span>` +
    `<span id="sens-g" style="font:700 22px ${U.FONTS.mono};color:${P.blue}">${G_BASE.toFixed(2)}x</span>`;
  ctl.appendChild(labRow);
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = G_MIN; slider.max = G_BASE; slider.step = 0.05; slider.value = G_BASE;
  slider.setAttribute("aria-label", "中国模型租用服务增速");
  slider.style.cssText = `width:100%;margin:12px 0 4px;accent-color:${P.blue};cursor:pointer;height:22px`;
  ctl.appendChild(slider);
  const scaleRow = document.createElement("div");
  scaleRow.style.cssText = `display:flex;justify-content:space-between;font:9.5px ${U.FONTS.mono};color:${P.inkLo}`;
  scaleRow.innerHTML =
    `<span>${G_MIN.toFixed(1)}x（砍半）</span>` +
    `<span style="color:${P.red}">翻转点 ≈ ${G_FLIP.toFixed(2)}x</span>` +
    `<span>${G_BASE.toFixed(1)}x（基准）</span>`;
  ctl.appendChild(scaleRow);
  body.appendChild(ctl);

  // ── SVG：需求合成线 vs 2.85x 供给线 ──
  const sc = document.createElement("div");
  sc.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(sc);
  const W = 1080, H = 290, ML = 64, MR = 250, TOP = 30, BOT = 30;
  const Y_LO = 1.8, Y_HI = 4.4;
  const y = d3.scaleLinear().domain([Y_LO, Y_HI]).range([H - BOT, TOP]);
  const svg = d3.select(sc).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%").style("min-width", "680px").style("display", "block")
    .attr("data-drill-keep", "1");

  // 纵轴
  [2, 2.5, 3, 3.5, 4].forEach(v => {
    svg.append("line").attr("x1", ML).attr("x2", W - MR).attr("y1", y(v)).attr("y2", y(v))
      .attr("stroke", P.lineLo);
    svg.append("text").attr("x", ML - 10).attr("y", y(v) + 3.5).attr("text-anchor", "end")
      .attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkLo}`).text(v.toFixed(1) + "x");
  });
  svg.append("text").attr("x", ML - 10).attr("y", TOP - 12).attr("text-anchor", "end")
    .attr("style", `font:9px ${U.FONTS.mono};fill:${P.inkLo}`).text("年化增速");

  // 供给线（固定，红色虚线）
  const supLine = svg.append("line")
    .attr("x1", ML).attr("x2", W - MR).attr("y1", y(SUPPLY)).attr("y2", y(SUPPLY))
    .attr("stroke", P.red).attr("stroke-width", 1.6).attr("stroke-dasharray", "7 4")
    .style("cursor", "pointer");
  const supLab = svg.append("text")
    .attr("x", W - MR + 10).attr("y", y(SUPPLY) + 4)
    .attr("style", `font:700 11px ${U.FONTS.mono};fill:${P.red}`)
    .text(`供给 ${SUPPLY.toFixed(2)}x（基准情景）`)
    .style("cursor", "pointer");
  const supDrill = e => U.showDrill({
    title: `供给 ${SUPPLY.toFixed(2)}x（基准情景）`,
    value: "供给年化增速 = 产能增速 × 服务速率增速",
    sub: gap.supplyNote, source: gap.drill.source, x: e.clientX, y: e.clientY });
  supLine.on("click", supDrill); supLab.on("click", supDrill);

  // 需求线（随滑块移动）
  const demLine = svg.append("line")
    .attr("x1", ML).attr("x2", W - MR)
    .attr("stroke", P.blue).attr("stroke-width", 3)
    .style("cursor", "pointer");
  const demDot = svg.append("circle").attr("r", 6).attr("fill", P.blue)
    .attr("cx", W - MR).style("cursor", "pointer");
  const demLab = svg.append("text")
    .attr("x", W - MR + 10)
    .attr("style", `font:700 12.5px ${U.FONTS.mono};fill:${P.blue}`)
    .style("cursor", "pointer");
  const demDrill = e => U.showDrill({
    title: gap.drill.title, value: gap.drill.value, sub: gap.drill.sub,
    source: gap.drill.source, x: e.clientX, y: e.clientY });
  demLine.on("click", demDrill); demDot.on("click", demDrill); demLab.on("click", demDrill);

  // ── DOM：读数 chips + 结论标签 ──
  const readRow = document.createElement("div");
  readRow.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;align-items:stretch";
  readRow.setAttribute("data-drill-keep", "1");
  const mkRead = () => {
    const d = document.createElement("div");
    d.style.cssText = `font:12px ${U.FONTS.mono};color:${P.ink};border:1px solid ${P.line};
      padding:8px 14px;border-radius:3px;line-height:1.6;flex:1;min-width:200px`;
    readRow.appendChild(d);
    return d;
  };
  const readDemand = mkRead();
  const readRatio = mkRead();
  const verdict = document.createElement("div");
  verdict.style.cssText = `font:700 13px ${U.FONTS.mono};padding:8px 14px;border-radius:3px;
    line-height:1.6;flex:1.4;min-width:240px;cursor:pointer;border:1.6px solid ${P.blue};color:${P.blue}`;
  verdict.setAttribute("data-drill-keep", "1");
  verdict.addEventListener("click", e => U.showDrill({
    title: "结论翻转开关（承重假设）",
    value: `中国模型租用服务增速 ${G_BASE.toFixed(1)}x → ${G_MIN.toFixed(1)}x：需求 ${GL.synth.demand.toFixed(2)}x → ${demandAt(G_MIN).toFixed(2)}x < 供给 ${SUPPLY.toFixed(2)}x，结论翻转为缺口缓解`,
    sub: gap.flipSwitch, source: gap.drill.source, x: e.clientX, y: e.clientY }));
  readRow.appendChild(verdict);
  body.appendChild(readRow);

  const fmt = v => v.toFixed(2);
  const BASE_RATIO = ratioAt(G_BASE);
  const CORRIDOR = gap.cases.map(c => c.ratio12m);
  const COR_TXT = `${Math.min(...CORRIDOR).toFixed(2)}–${Math.max(...CORRIDOR).toFixed(2)}`;
  function render(g) {
    const d = demandAt(g), r = ratioAt(g);
    const flipped = d <= SUPPLY;
    labRow.querySelector("#sens-g").textContent = g.toFixed(2) + "x";
    demLine.attr("y1", y(d)).attr("y2", y(d));
    demDot.attr("cy", y(d));
    demLab.attr("y", y(d) + 4).text(`需求合成 ${fmt(d)}x`);
    readDemand.innerHTML = `需求合成增速 <b style="color:${P.blue}">${fmt(d)}x/年</b>（基准 ${GL.synth.demand.toFixed(2)}x）<br>供给 ${SUPPLY.toFixed(2)}x/年（锁定基准）`;
    readRatio.innerHTML = `12 个月缺口比 <b style="color:${flipped ? P.red : P.blue}">${RATIO0.toFixed(2)} → ${fmt(r)}</b>（基准 ${fmt(BASE_RATIO)}）<br>${flipped ? "低于基准读数" : "区间走廊 " + COR_TXT + " 内变动"}`;
    verdict.style.borderColor = flipped ? P.red : P.blue;
    verdict.style.color = flipped ? P.red : P.blue;
    verdict.innerHTML = flipped
      ? `结论翻转：需求 ${fmt(d)}x ≤ 供给 ${SUPPLY.toFixed(2)}x —— <b>缺口缓解</b>`
      : `结论：需求 ${fmt(d)}x > 供给 ${SUPPLY.toFixed(2)}x —— <b>缺口温和收紧</b>`;
  }
  slider.addEventListener("input", () => render(parseFloat(slider.value)));
  render(G_BASE);

  // 图注
  const note = document.createElement("div");
  note.style.cssText = `margin-top:12px;padding:9px 12px;border:1px dashed ${P.line};
    font:10.5px ${U.FONTS.mono};color:${P.inkMd};line-height:1.7`;
  note.textContent = "承重假设 = 对结论贡献最大的那个假设——它一动，结论就动。本滑块只演示敏感度：拖动仅改变中国模型租用服务一线增速，其余五条增长线与供给侧锁定基准值；缺口比按基准口径（起点 "
    + RATIO0.toFixed(2) + "）等比重算。";
  body.appendChild(note);
})();
