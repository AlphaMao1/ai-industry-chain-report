// §5 供需缺口比三情景路径图（宿主 #chart-gap）
// 0.70 起点三条 12 个月路径分叉：收紧 2.27 红 / 基准 0.97 蓝 / 放松 0.34 墨；
// 1.0 供需打平红色参考线；端点才是模型读数、中段为展示插值（图注明写）。
// 读数旁固定印：区间 0.34–2.27 + 结论翻转开关 + "紧平衡 ≠ 短缺"。数据：RPT.gap。
(() => {
  const host = document.getElementById("chart-gap");
  if (!host || !window.RPT) return;
  const baseCase = RPT.gap.cases.find(c => c.key === "base");
  const body = U.frame(host, {
    title: `供需缺口比：0.70 起点的三条 12 个月路径（base 情景 ${baseCase.ratio12m.toFixed(2)}）`,
    sub: "红色虚线 = 1.0 供需打平 · 端点才是模型读数，中段为展示插值 · 点击任意路径或端点下钻情景假设",
    src: "本报告测算 · 2026-07-17",
  });

  const P = U.PAL;
  const gap = RPT.gap;
  const COLORS = { red: P.red, blue: P.blue, ink: P.inkMd };

  const sc = document.createElement("div");
  sc.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(sc);

  const W = 1080, H = 420, ML = 64, MR = 240, TOP = 34, BOT = 46;
  const x = d3.scaleLinear().domain([0, 12]).range([ML, W - MR]);
  const y = d3.scaleLinear().domain([0, 2.5]).range([H - BOT, TOP]);

  const svg = d3.select(sc).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%").style("min-width", "760px").style("display", "block")
    .attr("data-drill-keep", "1");

  // 网格与刻度
  [0, 0.5, 1.0, 1.5, 2.0, 2.5].forEach(v => {
    svg.append("line")
      .attr("x1", ML).attr("x2", W - MR)
      .attr("y1", y(v)).attr("y2", y(v))
      .attr("stroke", v === 1 ? P.red : P.lineLo)
      .attr("stroke-width", v === 1 ? 1.4 : 1)
      .attr("stroke-dasharray", v === 1 ? "6 4" : null);
    svg.append("text")
      .attr("x", ML - 10).attr("y", y(v) + 3.5)
      .attr("text-anchor", "end")
      .attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkLo}`)
      .text(v.toFixed(1));
  });
  svg.append("text")
    .attr("x", W - MR).attr("y", y(1) - 8)
    .attr("text-anchor", "end")
    .attr("style", `font:9.5px ${U.FONTS.mono};fill:${P.red}`)
    .text("1.0 = 供需打平 · 之上 = 越买越缺，之下 = 紧平衡（不等于短缺）");
  [0, 6, 12].forEach(m => {
    svg.append("text")
      .attr("x", x(m)).attr("y", H - BOT + 22)
      .attr("text-anchor", "middle")
      .attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkLo}`)
      .text(m === 0 ? "当前" : `+${m} 个月`);
  });

  // 路径形状：中段弯向终值（纯展示插值，端点才是模型读数）
  const mkPts = end => [[0, gap.current], [4, gap.current + (end - gap.current) * 0.42],
    [8, gap.current + (end - gap.current) * 0.8], [12, end]];
  const line = d3.line().x(d => x(d[0])).y(d => y(d[1])).curve(d3.curveCatmullRom.alpha(0.6));

  // 起点
  const startDot = svg.append("circle")
    .attr("cx", x(0)).attr("cy", y(gap.current)).attr("r", 4.5)
    .attr("fill", P.paperHi).attr("stroke", P.ink).attr("stroke-width", 1.5);
  svg.append("text")
    .attr("x", x(0) + 10).attr("y", y(gap.current) - 10)
    .attr("style", `font:700 12px ${U.FONTS.mono};fill:${P.ink}`)
    .text(`当前 ${gap.current.toFixed(2)}`);

  // 端点纵向错开（2.27 / 0.97 / 0.34 天然分离，无需避让）
  const paths = [];
  gap.cases.forEach((c, i) => {
    const col = COLORS[c.color] || P.ink;
    const pts = mkPts(c.ratio12m);
    const dAttr = line(pts);
    const path = svg.append("path")
      .attr("d", dAttr).attr("fill", "none")
      .attr("stroke", col).attr("stroke-width", c.key === "base" ? 2.8 : 1.8)
      .style("cursor", "pointer");
    const hit = svg.append("path")
      .attr("d", dAttr).attr("fill", "none")
      .attr("stroke", "rgba(0,0,0,0)").attr("stroke-width", 18)
      .style("cursor", "pointer");
    const len = path.node().getTotalLength();
    path.attr("stroke-dasharray", len).attr("stroke-dashoffset", len);

    const dot = svg.append("circle")
      .attr("cx", x(12)).attr("cy", y(c.ratio12m)).attr("r", 0)
      .attr("fill", col).style("cursor", "pointer");
    const lab1 = svg.append("text")
      .attr("x", x(12) + 12).attr("y", y(c.ratio12m) - 2)
      .attr("style", `font:700 15px ${U.FONTS.mono};fill:${col}`).attr("opacity", 0)
      .text(c.ratio12m.toFixed(2));
    const lab2 = svg.append("text")
      .attr("x", x(12) + 12).attr("y", y(c.ratio12m) + 14)
      .attr("style", `font:700 10.5px ${U.FONTS.mono};fill:${col}`).attr("opacity", 0)
      .text(c.name + (c.key === "base" ? "（base 情景）" : ""));
    const lab3 = svg.append("text")
      .attr("x", x(12) + 12).attr("y", y(c.ratio12m) + 28)
      .attr("style", `font:9px ${U.FONTS.mono};fill:${P.inkLo}`).attr("opacity", 0)
      .text(`需求 ${c.demand}x / 供给 ${c.supply}x`);

    const drill = e => {
      if (c.key === "base") {
        U.showDrill({ title: gap.drill.title, value: gap.drill.value, sub: gap.drill.sub,
          source: gap.drill.source, x: e.clientX, y: e.clientY });
      } else {
        U.showDrill({
          title: `缺口路径 · ${c.name}情景`,
          value: `12 个月后缺口比 ${c.ratio12m.toFixed(2)}（需求 ${c.demand}x vs 供给 ${c.supply}x）`,
          sub: `${c.read}。base 情景走廊：放松 0.34 / 基准 0.97 / 收紧 2.27。`,
          source: "本报告测算 · 2026-07-17", x: e.clientX, y: e.clientY });
      }
    };
    path.on("click", drill); dot.on("click", drill); hit.on("click", drill);
    [lab1, lab2, lab3].forEach(l => l.style("cursor", "pointer").on("click", drill));

    paths.push({ path, len, dot, labs: [lab1, lab2, lab3], i });
  });

  // 入场
  const animated = [];
  animated.push({ start: 0, dur: 0.4, set: p => startDot.attr("r", 4.5 * p) });
  paths.forEach(({ path, len, dot, labs, i }) => {
    const S = 0.25 + i * 0.3;
    animated.push({ start: S, dur: 0.85, set: p => path.attr("stroke-dashoffset", len * (1 - p)) });
    animated.push({ start: S + 0.8, dur: 0.2, set: p => dot.attr("r", 5 * p) });
    labs.forEach((l, k) => animated.push({ start: S + 0.85 + k * 0.06, dur: 0.25, set: p => l.attr("opacity", p) }));
  });
  U.play(animated, svg.node(), { threshold: 0.25 });

  // ── 读数旁固定印：区间 + 紧平衡 ≠ 短缺 + 结论翻转开关（可点 chips）──
  const chips = document.createElement("div");
  chips.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin-top:12px";
  chips.setAttribute("data-drill-keep", "1");
  const mkChip = (txt, col, drill) => {
    const c = document.createElement("span");
    c.style.cssText = `font:11px ${U.FONTS.mono};color:${col};border:1px solid ${col};
      padding:5px 12px;border-radius:3px;cursor:pointer;line-height:1.5`;
    c.textContent = txt;
    c.addEventListener("click", e => drill(e));
    chips.appendChild(c);
  };
  mkChip("区间 0.34 – 2.27（放松 – 收紧）", P.ink, e => U.showDrill({
    title: gap.drill.title, value: gap.drill.value, sub: gap.drill.sub,
    source: gap.drill.source, x: e.clientX, y: e.clientY }));
  mkChip("紧平衡 ≠ 短缺", P.ink, e => U.showDrill({
    title: "缺口比怎么读",
    value: "缺口比小于 1 = 紧平衡，不等于短缺",
    sub: gap.explainer, source: "本报告测算 · 2026-07-17", x: e.clientX, y: e.clientY }));
  mkChip("结论翻转开关：中国模型服务增速砍半 → 翻转", P.red, e => U.showDrill({
    title: "结论翻转开关（承重假设）",
    value: "中国模型租用服务增速 4.0x → 2.0x：需求 3.94x → 2.83x < 供给 2.85x，结论翻转为缺口缓解",
    sub: gap.flipSwitch + " " + gap.supplyNote, source: "本报告测算 · 2026-07-17",
    x: e.clientX, y: e.clientY }));
  body.appendChild(chips);

  // ── 图注：端点才是模型读数，中段为展示插值 ──
  const note = document.createElement("div");
  note.style.cssText = `margin-top:12px;padding:9px 12px;border:1px dashed ${P.line};
    font:10.5px ${U.FONTS.mono};color:${P.inkMd};line-height:1.7`;
  note.textContent = "端点才是模型读数，中段曲线为展示插值，不代表逐月预测。" + gap.explainer;
  body.appendChild(note);
})();
