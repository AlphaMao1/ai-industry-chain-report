// §4d 收入池（宿主 #chart-revenuepool）
// 左：当前 MaaS 收入池 low/base/high 三柱；右：12 个月自校验——C 层 99.6→105.8（Jevons 持平）
// vs F 层 226→1,366（红色爆炸柱）。柱图生长动画，点击下钻。数据：RPT.revenuePool。
(() => {
  const host = document.getElementById("chart-revenuepool");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "MaaS 收入池 · 当前读数与 12 个月自校验",
    sub: "左 = 当前年化池（三情景）· 右 = 12 个月投影：C 持平 / F 爆炸 · 点击任意柱下钻",
    src: "自研模型 · 公司披露",
  });

  const P = U.PAL;
  const rp = RPT.revenuePool;

  const W = 1080, H = 380, TOP = 40, BOT = 40;
  const GAPW = 70;
  const LW = 400;                 // 左面板宽
  const ML = 56, MR = 20;
  const y = d3.scaleLinear().domain([0, 1400]).range([H - BOT, TOP]);
  const svg = d3.select(body).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%").style("display", "block")
    .attr("data-drill-keep", "1");

  // 网格
  [0, 250, 500, 750, 1000, 1250].forEach(v => {
    svg.append("line").attr("x1", ML).attr("x2", W - MR)
      .attr("y1", y(v)).attr("y2", y(v)).attr("stroke", P.lineLo);
    svg.append("text").attr("x", ML - 8).attr("y", y(v) + 3.5)
      .attr("text-anchor", "end").attr("style", `font:9.5px ${U.FONTS.mono};fill:${P.inkLo}`)
      .text("$" + v + "B");
  });

  const animated = [];
  const grow = (rect, yTop, h, S) => {
    rect.attr("y", H - BOT).attr("height", 0);
    animated.push({ start: S, dur: 0.6, set: p => { rect.attr("y", yTop(H - BOT, h, p)).attr("height", h(p)); } });
  };

  // ── 左面板：low/base/high ──
  const cur = [["low", rp.current.low], ["base", rp.current.base], ["high", rp.current.high]];
  const bw = 74, step = (LW - ML - 20) / 3;
  svg.append("text").attr("x", ML + 4).attr("y", TOP - 16)
    .attr("style", `font:700 11px ${U.FONTS.mono};fill:${P.inkMd}`).text("当前收入池（年化）");
  cur.forEach(([k, v], i) => {
    const cx = ML + step * i + step / 2;
    const col = k === "base" ? P.blue : P.ink;
    const r = svg.append("rect").attr("x", cx - bw / 2).attr("width", bw)
      .attr("fill", col).attr("opacity", k === "base" ? 0.92 : 0.55)
      .style("cursor", "pointer");
    grow(r, (yb, h, p) => H - BOT - (H - BOT - y(v)) * p, p => (H - BOT - y(v)) * p, 0.1 + i * 0.15);
    const lb = svg.append("text").attr("x", cx).attr("text-anchor", "middle")
      .attr("style", `font:700 13px ${U.FONTS.mono};fill:${k === "base" ? P.blue : P.ink}`).attr("opacity", 0)
      .text("$" + v.toFixed(1) + "B");
    animated.push({ start: 0.55 + i * 0.15, dur: 0.25, set: p => lb.attr("opacity", p).attr("y", y(v) - 8 + 4 * (1 - p)) });
    svg.append("text").attr("x", cx).attr("y", H - BOT + 18).attr("text-anchor", "middle")
      .attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkMd}`).text(k.toUpperCase());
    r.on("click", e => U.showDrill({
      title: `收入池 · ${k.toUpperCase()} 情景`,
      value: `$${v.toFixed(1)}B（年化 run-rate）`,
      sub: rp.reconcile, source: "自研模型 · 公司披露", x: e.clientX, y: e.clientY }));
  });

  // 面板分隔线
  svg.append("line").attr("x1", LW + GAPW / 2).attr("x2", LW + GAPW / 2)
    .attr("y1", TOP - 10).attr("y2", H - BOT + 4).attr("stroke", P.line).attr("stroke-dasharray", "2 4");

  // ── 右面板：C / F 自校验（当前 → +12m）──
  const RX = LW + GAPW;
  svg.append("text").attr("x", RX + 4).attr("y", TOP - 16)
    .attr("style", `font:700 11px ${U.FONTS.mono};fill:${P.inkMd}`).text("12 个月自校验：同一模型，两种命运");
  const pairs = [
    { name: "C 层（走量）", a: 99.6, b: rp.c12m, col: P.ink, note: "量升价跌对冲 · Jevons 成立", ok: true },
    { name: "F 层（前沿）", a: 226, b: rp.f12m, col: P.red, note: "×6 爆炸 · 不可持续", ok: false },
  ];
  const bw2 = 58, gstep = (W - MR - RX - 30) / 2;
  pairs.forEach((pr, i) => {
    const gx = RX + gstep * i + 26;
    const vals = [[pr.a, "当前"], [pr.b, "+12 个月"]];
    vals.forEach(([v, tag], j) => {
      const cx = gx + j * (bw2 + 14) + bw2 / 2;
      const r = svg.append("rect").attr("x", cx - bw2 / 2).attr("width", bw2)
        .attr("fill", pr.col).attr("opacity", j === 0 ? 0.5 : pr.ok ? 0.8 : 0.92)
        .style("cursor", "pointer");
      grow(r, (yb, h, p) => H - BOT - (H - BOT - y(v)) * p, p => (H - BOT - y(v)) * p, 0.35 + i * 0.25 + j * 0.12);
      const vlab = v >= 1000 ? "$" + (v / 1000).toFixed(2).replace(/\.?0+$/, "") + "T" : "$" + Math.round(v) + "B";
      const lb = svg.append("text").attr("x", cx).attr("text-anchor", "middle")
        .attr("style", `font:700 12.5px ${U.FONTS.mono};fill:${pr.col}`).attr("opacity", 0)
        .text(v >= 1000 ? "$1,366B" : "$" + Math.round(v) + "B");
      animated.push({ start: 0.8 + i * 0.25 + j * 0.12, dur: 0.25, set: p => lb.attr("opacity", p).attr("y", y(v) - 8 + 4 * (1 - p)) });
      svg.append("text").attr("x", cx).attr("y", H - BOT + 18).attr("text-anchor", "middle")
        .attr("style", `font:9px ${U.FONTS.mono};fill:${P.inkLo}`).text(tag);
      r.on("click", e => U.showDrill({
        title: `自校验 · ${pr.name}（${tag}）`,
        value: tag === "当前" ? `$${pr.a}B → +12 个月 $${pr.b >= 1000 ? "1,366" : pr.b}B` : rp.finding,
        sub: tag === "当前" ? pr.note : rp.finding,
        source: "自研模型", x: e.clientX, y: e.clientY }));
    });
    // 组名 + 判词
    const gl = svg.append("text").attr("x", gx + bw2 + 7).attr("y", H - BOT + 34).attr("text-anchor", "middle")
      .attr("style", `font:700 10.5px ${U.FONTS.mono};fill:${pr.col}`).text(pr.name);
    const nl = svg.append("text").attr("x", gx + bw2 + 7).attr("y", y(Math.max(pr.a, pr.b)) - 26).attr("text-anchor", "middle")
      .attr("style", `font:9px ${U.FONTS.mono};fill:${pr.ok ? P.inkMd : P.red}`).attr("opacity", 0)
      .text(pr.note);
    animated.push({ start: 1.0 + i * 0.25, dur: 0.25, set: p => nl.attr("opacity", p) });
    // 连接箭头
    if (!pr.ok) {
      const ar = svg.append("path")
        .attr("d", `M ${gx + bw2 + 10} ${y(pr.a) - 4} L ${gx + bw2 + 18} ${y(pr.b) + 40}`)
        .attr("stroke", P.red).attr("stroke-width", 1.2).attr("stroke-dasharray", "3 3").attr("fill", "none")
        .attr("opacity", 0);
      animated.push({ start: 1.05, dur: 0.3, set: p => ar.attr("opacity", 0.7 * p) });
    }
  });

  U.play(animated, svg.node(), { threshold: 0.25 });
})();
