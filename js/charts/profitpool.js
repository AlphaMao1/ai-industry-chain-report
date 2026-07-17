// §2 利润池（宿主 #chart-profitpool）
// 六层动态份额图：low / base / high 情景切换，条形平滑过渡；
// 模型层负值用红并向零轴左侧延伸；每层点击下钻。数据：RPT.profitPool。
(() => {
  const host = document.getElementById("chart-profitpool");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "利润池 Reconstruction v0.5 · 六层份额",
    sub: "单季经营利润 $B · low / base / high 情景可切换 · 红 = 净亏损层 · 点击任意层下钻",
    src: "公司披露 · 券商研究 · 自研模型",
  });

  const P = U.PAL;
  const layers = RPT.profitPool.layers;
  const scenarios = RPT.profitPool.scenarios;
  let cur = "base";

  // ── 情景开关 ──
  const bar = document.createElement("div");
  bar.style.cssText = "display:flex;gap:8px;margin-bottom:14px;align-items:center;flex-wrap:wrap";
  const lab = document.createElement("span");
  lab.style.cssText = `font:10px ${U.FONTS.mono};color:${P.inkLo};letter-spacing:.18em;margin-right:4px`;
  lab.textContent = "情景";
  bar.appendChild(lab);
  const btns = {};
  scenarios.forEach(s => {
    const b = document.createElement("button");
    b.textContent = s.toUpperCase();
    b.style.cssText = `font:11px ${U.FONTS.mono};letter-spacing:.08em;padding:5px 14px;cursor:pointer;
      border:1px solid ${P.line};background:transparent;color:${P.inkMd};border-radius:3px;
      transition:all .18s ease`;
    b.onclick = () => { cur = s; update(); paint(); };
    bar.appendChild(b);
    btns[s] = b;
  });
  const totalEl = document.createElement("span");
  totalEl.style.cssText = `font:11px ${U.FONTS.mono};color:${P.inkMd};margin-left:auto`;
  bar.appendChild(totalEl);
  body.appendChild(bar);
  function paint() {
    scenarios.forEach(s => {
      const on = s === cur;
      btns[s].style.background = on ? P.ink : "transparent";
      btns[s].style.color = on ? P.paperHi : P.inkMd;
      btns[s].style.borderColor = on ? P.ink : P.line;
    });
  }
  paint();

  // ── SVG 画布 ──
  const wrap = document.createElement("div");
  body.appendChild(wrap);

  const ML = 168, MR = 108, ROW_H = 52, TOP = 26, BOT = 34;
  const XMIN = -14, XMAX = 76;
  const W = 1080, H = TOP + layers.length * ROW_H + BOT;
  const x = d3.scaleLinear().domain([XMIN, XMAX]).range([ML, W - MR]);
  const colorOf = d => d.id === "modellab" ? P.red : d.id === "semiconductor" ? P.blue : P.ink;

  const svg = d3.select(wrap).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%").style("display", "block")
    .attr("data-drill-keep", "1");

  // 网格与刻度
  const ticks = [-10, 0, 20, 40, 60];
  svg.append("g").selectAll("line").data(ticks).join("line")
    .attr("x1", d => x(d)).attr("x2", d => x(d))
    .attr("y1", TOP - 8).attr("y2", H - BOT + 6)
    .attr("stroke", d => d === 0 ? P.ink : P.lineLo)
    .attr("stroke-width", d => d === 0 ? 1.4 : 1);
  svg.append("g").selectAll("text.tick").data(ticks).join("text")
    .attr("x", d => x(d)).attr("y", H - BOT + 22)
    .attr("text-anchor", "middle")
    .attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkLo}`)
    .text(d => d === 0 ? "0" : "$" + d + "B");
  // 零轴标注
  svg.append("text").attr("x", x(0) - 6).attr("y", TOP - 12)
    .attr("text-anchor", "end")
    .attr("style", `font:9px ${U.FONTS.mono};fill:${P.red}`)
    .text("← 净亏损");

  const rowG = svg.append("g").selectAll("g.row").data(layers, d => d.id)
    .join(enter => {
      const g = enter.append("g").attr("style", "cursor:pointer");
      g.append("rect").attr("class", "hit")
        .attr("x", 0).attr("y", 0).attr("width", W).attr("height", ROW_H - 10)
        .attr("fill", "transparent");
      g.append("text").attr("class", "nm");
      g.append("text").attr("class", "sh");
      g.append("rect").attr("class", "bar").attr("rx", 1.5);
      g.append("text").attr("class", "val");
      g.on("click", (e, d) => U.showDrill({
        title: d.drill.title, value: d.drill.value, sub: d.drill.sub,
        source: d.drill.source, x: e.clientX, y: e.clientY }));
      g.on("mouseenter", function (e, d) {
        d3.select(this).select("rect.hit").attr("fill", "rgba(34,81,255,.045)");
      });
      g.on("mouseleave", function () {
        d3.select(this).select("rect.hit").attr("fill", "transparent");
      });
      return g;
    });

  rowG.attr("transform", (d, i) => `translate(0, ${TOP + i * ROW_H})`);

  // 层名 / 分隔线
  rowG.select("text.nm")
    .attr("x", ML - 14).attr("y", (ROW_H - 10) / 2 + 1)
    .attr("text-anchor", "end")
    .attr("style", `font:700 12.5px ${U.FONTS.serif};fill:${P.ink}`)
    .text(d => d.name);
  rowG.select("text.sh")
    .attr("x", ML - 14).attr("y", (ROW_H - 10) / 2 + 16)
    .attr("text-anchor", "end");
  svg.append("g").selectAll("line.sep").data(layers.slice(1)).join("line")
    .attr("x1", 0).attr("x2", W)
    .attr("y1", (d, i) => TOP + (i + 1) * ROW_H - 5)
    .attr("y2", (d, i) => TOP + (i + 1) * ROW_H - 5)
    .attr("stroke", P.lineLo);

  const t = () => svg.transition().duration(650).ease(d3.easeCubicInOut);

  function update(first) {
    totalEl.textContent = `正利润池 base $91.7B/季 · 当前 ${cur.toUpperCase()} 情景`;
    const barSel = rowG.select("rect.bar").data(layers);
    const valSel = rowG.select("text.val").data(layers);
    const barA = first ? barSel : barSel.transition(t());
    const valA = first ? valSel : valSel.transition(t());
    barA
      .attr("x", d => x(Math.min(0, d[cur])))
      .attr("y", 6)
      .attr("width", d => Math.abs(x(d[cur]) - x(0)))
      .attr("height", ROW_H - 22)
      .attr("fill", d => d[cur] < 0 ? P.red : colorOf(d))
      .attr("opacity", d => d.id === "semiconductor" ? 0.92 : d[cur] < 0 ? 0.85 : 0.78);
    valA
      .attr("x", d => d[cur] < 0 ? x(d[cur]) - 8 : x(d[cur]) + 8)
      .attr("y", (ROW_H - 10) / 2 + 1)
      .attr("text-anchor", d => d[cur] < 0 ? "end" : "start")
      .attr("style", d => `font:700 13px ${U.FONTS.mono};fill:${d[cur] < 0 ? P.red : P.ink}`)
      .text(d => (d[cur] < 0 ? "−$" + Math.abs(d[cur]).toFixed(1) : "$" + d[cur].toFixed(1)) + "B");
    rowG.select("text.sh").data(layers)
      .attr("style", d => `font:10px ${U.FONTS.mono};fill:${String(d.share[cur]).startsWith("-") ? P.red : P.blue}`)
      .text(d => "份额 " + d.share[cur].replace("-", "−"));
  }

  // 入场生长动画：先静默落 base 完成态，再藏起、滚动触发渐次显现
  update(true);
  svg.selectAll("rect.bar").attr("opacity", 0);
  svg.selectAll("text.val").attr("opacity", 0);
  svg.selectAll("text.nm").attr("opacity", 0);
  svg.selectAll("text.sh").attr("opacity", 0);
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    rowG.each(function (d, i) {
      const g = d3.select(this);
      g.select("rect.bar").transition().delay(120 + i * 90).duration(600)
        .attr("opacity", d.id === "semiconductor" ? 0.92 : d.base < 0 ? 0.85 : 0.78);
      g.select("text.val").transition().delay(360 + i * 90).duration(300).attr("opacity", 1);
      g.select("text.nm").transition().delay(120 + i * 90).duration(300).attr("opacity", 1);
      g.select("text.sh").transition().delay(300 + i * 90).duration(300).attr("opacity", 1);
    });
  }, { threshold: 0.2 });
  io.observe(svg.node());
})();
