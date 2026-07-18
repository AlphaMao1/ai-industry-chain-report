// §9 利润池瀑布/100% 堆叠条（宿主 #chart-profitpool）
// 六层 × 三情景开关（悲观/基准/乐观 → low/base/high）：正利润池 100% 堆叠条；
// 模型/接口层为负时做"水下"红色倒挂（净利润池口径，分母另注）；点层下钻构成拆解。
// 底部硬件利润子池条（70.1/19.9/10.0）。数据：RPT.profitPool。
(() => {
  const host = document.getElementById("chart-profitpool");
  if (!host || !window.RPT || !window.U || !window.d3) return;
  const PP = RPT.profitPool;
  if (!PP || !PP.layers) return;
  const P = U.PAL;

  const body = U.frame(host, {
    title: "利润池 100% 堆叠条：六层份额 × 三情景",
    sub: "单季经营利润（本报告测算）· 红 = 模型层水下倒挂（净利润池口径）· 点击任意层下钻构成拆解",
    src: "本报告测算 · 官方披露 · 券商研究 · 截至 2026-07-17",
  });

  const KEY = {}; // 情景中文名 → 数据键
  PP.scenarios.forEach(s => { KEY[s] = s === "悲观" ? "low" : s === "乐观" ? "high" : "base"; });
  let cur = PP.scenarios[1] || PP.scenarios[0]; // 默认基准

  // ── 情景开关 ──
  const bar = document.createElement("div");
  bar.style.cssText = "display:flex;gap:8px;margin-bottom:14px;align-items:center;flex-wrap:wrap";
  const lab = document.createElement("span");
  lab.style.cssText = "font:10px " + U.FONTS.mono + ";color:" + P.inkLo + ";letter-spacing:.18em;margin-right:4px";
  lab.textContent = "情景";
  bar.appendChild(lab);
  const btns = {};
  PP.scenarios.forEach(s => {
    const b = document.createElement("button");
    b.textContent = s;
    b.style.cssText = "font:11.5px " + U.FONTS.mono + ";padding:5px 16px;cursor:pointer;border:1px solid " +
      P.line + ";background:transparent;color:" + P.inkMd + ";border-radius:3px;transition:all .18s ease";
    b.onclick = () => { cur = s; paint(); update(false); };
    bar.appendChild(b); btns[s] = b;
  });
  const poolEl = document.createElement("span");
  poolEl.style.cssText = "font:11.5px " + U.FONTS.mono + ";color:" + P.inkMd + ";margin-left:auto";
  bar.appendChild(poolEl);
  body.appendChild(bar);
  function paint() {
    PP.scenarios.forEach(s => {
      const on = s === cur;
      btns[s].style.background = on ? P.ink : "transparent";
      btns[s].style.color = on ? P.paperHi : P.inkMd;
      btns[s].style.borderColor = on ? P.ink : P.line;
    });
  }
  paint();

  // ── SVG ──
  const scroll = document.createElement("div");
  scroll.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(scroll);

  const W = 1080, H = 430, ML = 26, MR = 26, TOP = 64, BARH = 62, GAP = 44, UWMAX = 110;
  const COLMAP = { semiconductor: P.blue, cloud: P.blueHi, dcpower: P.inkMd, workflow: P.blueLo, services: P.inkLo, modellab: P.blue };
  const BW = W - ML - MR;

  const svg = d3.select(scroll).append("svg")
    .attr("viewBox", "0 0 " + W + " " + H)
    .style("width", "100%").style("min-width", "720px").style("display", "block")
    .attr("data-drill-keep", "1");

  // 水线（零轴）：正利润池在上，模型层负值倒挂在下
  const zeroY = TOP + BARH + GAP;
  svg.append("line").attr("x1", ML).attr("x2", W - MR).attr("y1", zeroY).attr("y2", zeroY)
    .attr("stroke", P.ink).attr("stroke-width", 1.3);
  svg.append("text").attr("x", ML).attr("y", zeroY - 8)
    .attr("style", "font:9.5px " + U.FONTS.mono + ";fill:" + P.inkLo)
    .text("水线 = 0 · 正利润池按 100% 堆叠，模型层负值倒挂在水下（分母为净利润池，口径见下注）");

  const gStack = svg.append("g");   // 正利润池堆叠段
  const gLab = svg.append("g");     // 层名/份额标注（引线防碰撞）
  const gUW = svg.append("g");      // 水下模型层

  const model = PP.layers.find(l => l.id === "modellab");

  function update(first) {
    const k = KEY[cur];
    const pool = PP.pools.positive[k];
    poolEl.textContent = "正利润池 $" + pool.toFixed(2) + "B/季（" + cur + "情景）· 点击层段下钻";

    const pos = PP.layers.filter(l => l[k] > 0);
    const dur = first ? 0 : 650;
    let acc = 0;

    const segs = gStack.selectAll("rect.seg").data(pos, d => d.id);
    segs.exit().transition().duration(dur / 2).attr("width", 0).attr("opacity", 0).remove();
    const segsIn = segs.enter().append("rect").attr("class", "seg")
      .attr("y", TOP).attr("height", BARH).attr("opacity", 0.92).style("cursor", "pointer")
      .on("click", (e, d) => U.showDrill({ title: d.drill.title, value: d.drill.value, sub: d.drill.sub,
        source: d.drill.source, x: e.clientX, y: e.clientY }))
      .on("mouseenter", (e, d) => U.showTip("<b>" + U.esc(d.name) + "</b><br/>份额 " + d.share[k].replace("-", "−") +
        " · 点击下钻构成", e.clientX, e.clientY))
      .on("mousemove", (e, d) => U.showTip("<b>" + U.esc(d.name) + "</b><br/>份额 " + d.share[k].replace("-", "−") +
        " · 点击下钻构成", e.clientX, e.clientY))
      .on("mouseleave", U.hideTip);
    const allSeg = segsIn.merge(segs);
    allSeg.each(function (d) { d._x0 = acc; acc += d[k]; });
    allSeg.transition().duration(dur).ease(d3.easeCubicInOut)
      .attr("x", d => ML + (d._x0 / pool) * BW)
      .attr("width", d => Math.max(0, (d[k] / pool) * BW - 1.5))
      .attr("fill", d => COLMAP[d.id] || P.ink);

    // 层名标注：宽段内嵌白字，窄段引线落到下方交错行
    const labs = gLab.selectAll("g.lb").data(pos, d => d.id);
    labs.exit().transition().duration(dur / 2).attr("opacity", 0).remove();
    const labsIn = labs.enter().append("g").attr("class", "lb").attr("opacity", 0);
    labsIn.append("text").attr("class", "in");
    labsIn.append("text").attr("class", "out");
    labsIn.append("line").attr("class", "ld");
    const allLb = labsIn.merge(labs);
    allLb.each(function (d, i) {
      const g = d3.select(this);
      const w = (d[k] / pool) * BW;
      const cx = ML + (d._x0 / pool) * BW + w / 2;
      const inWide = w > 150;
      const move = sel => dur ? sel.transition().duration(dur).ease(d3.easeCubicInOut) : sel;
      g.select("text.in")
        .attr("y", TOP + BARH / 2 - 2)
        .attr("text-anchor", "middle")
        .attr("style", "font:700 11px " + U.FONTS.serif + ";fill:" + P.paperHi)
        .text(inWide ? d.name.split("（")[0] : "");
      move(g.select("text.in")).attr("x", cx);
      g.select("text.out")
        .attr("y", TOP + BARH + 18 + (i % 2) * 15)
        .attr("text-anchor", "middle")
        .attr("style", "font:" + (inWide ? 700 : 400) + " 10px " + U.FONTS.mono + ";fill:" + (d.id === "semiconductor" ? P.blue : P.inkMd))
        .text(inWide ? "份额 " + d.share[k].replace("-", "−") : d.name.split("（")[0] + " " + d.share[k].replace("-", "−"));
      move(g.select("text.out")).attr("x", cx);
      g.select("line.ld")
        .attr("y1", TOP + BARH + 2).attr("y2", TOP + BARH + (inWide ? 0 : 9) + (i % 2) * 15)
        .attr("stroke", P.inkLo).attr("stroke-width", 0.7)
        .attr("opacity", inWide ? 0 : 0.8);
      move(g.select("line.ld")).attr("x1", cx).attr("x2", cx);
    });
    allLb.transition().duration(dur).attr("opacity", 1);

    // 水下模型层（负值倒挂；乐观情景转正则并入正池、水下留一句说明）
    gUW.selectAll("*").remove();
    if (model && model[k] < 0) {
      const uwH = Math.min(UWMAX, (Math.abs(model[k]) / 12) * UWMAX);
      const uwW = 190, uwX = W - MR - uwW;
      const rr = gUW.append("rect")
        .attr("x", uwX).attr("y", zeroY).attr("width", uwW).attr("height", 0)
        .attr("fill", P.red).attr("opacity", 0.85).style("cursor", "pointer");
      rr.transition().duration(first ? 600 : dur).attr("height", uwH);
      const tx = gUW.append("text").attr("x", uwX + uwW / 2).attr("y", zeroY + uwH + 16)
        .attr("text-anchor", "middle")
        .attr("style", "font:700 10.5px " + U.FONTS.mono + ";fill:" + P.red)
        .text("模型/接口层 净利润池口径 " + model.share[k].replace("-", "−"));
      const tx2 = gUW.append("text").attr("x", uwX + uwW / 2).attr("y", zeroY + uwH + 31)
        .attr("text-anchor", "middle")
        .attr("style", "font:9px " + U.FONTS.mono + ";fill:" + P.inkMd)
        .text("−$" + Math.abs(model[k]).toFixed(2) + "B ÷ 净利润池 $" + PP.pools.net[k].toFixed(2) + "B");
      const clickDrill = e => U.showDrill({ title: model.drill.title, value: model.drill.value,
        sub: model.drill.sub, source: model.drill.source, x: e.clientX, y: e.clientY });
      rr.on("click", clickDrill);
      tx.on("click", clickDrill).style("cursor", "pointer");
      tx2.on("click", clickDrill).style("cursor", "pointer");
    } else if (model) {
      gUW.append("text").attr("x", W - MR).attr("y", zeroY + 26).attr("text-anchor", "end")
        .attr("style", "font:10px " + U.FONTS.mono + ";fill:" + P.inkMd)
        .text("乐观情景下模型/接口层转正（+$" + model[k].toFixed(2) + "B），已并入上方正利润池堆叠段（份额 " + model.share[k] + "）");
    }
  }

  // 入场：先落基准完成态，再滚动触发淡入
  update(true);
  svg.attr("opacity", 0);
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    svg.transition().duration(700).attr("opacity", 1);
  }, { threshold: 0.2 });
  io.observe(svg.node());

  // ── 分母口径图注（必写）──
  const dn = document.createElement("p");
  dn.style.cssText = "margin:12px 0 0;font:10.5px " + U.FONTS.mono + ";color:" + P.inkLo + ";line-height:1.75";
  dn.textContent = "分母口径：" + PP.denominatorNote;
  body.appendChild(dn);

  // ── 硬件利润子池条（两级下钻入口）──
  if (PP.hardwareSubpool) {
    const hw = document.createElement("div");
    hw.setAttribute("data-drill-keep", "1");
    hw.style.cssText = "margin-top:14px;padding:11px 15px;border-left:3px solid " + P.blue + ";" +
      "background:" + P.blueSoft + ";cursor:pointer;font:11.5px " + U.FONTS.mono + ";color:" + P.inkMd + ";line-height:1.75";
    hw.innerHTML = "<b style='color:" + P.ink + "'>硬件利润子池（两级拆解）</b>　" +
      PP.hardwareSubpool.map(h => U.esc(h.name) + " <b style='color:" + P.blue + "'>" + U.esc(h.share) + "</b>").join(" · ") +
      "　<span style='color:" + P.inkLo + "'>" + U.esc(PP.hardwareNote || "") + " 点击看官方锚点 →</span>";
    hw.addEventListener("click", e => U.showDrill({
      title: "硬件利润子池与官方锚点",
      value: PP.hardwareSubpool.map(h => h.name + " " + h.share).join(" · "),
      sub: U.esc(PP.hardwareNote || "") + "<br/><br/>" + U.esc(PP.officialAnchors || "") + "<br/><br/>" + U.esc(PP.readout || ""),
      source: "官方披露 · 本报告测算 · 截至 2026-07-17", x: e.clientX, y: e.clientY }));
    body.appendChild(hw);
  }
})();
