// §4 单位任务毛利桥 · 双桥对照（宿主 #chart-grossbridge）
// Agentforce（按任务计费，$/任务瀑布：收入 − 成本 = 单位毛利）
// 对照 ServiceNow（席位 + 增量，$B/年瀑布：收入 − 成本 = 利润）。
// 乐观/基准/悲观三情景开关；成本假设随图注全列，可复算。数据：RPT.grossBridge。
(() => {
  const host = document.getElementById("chart-grossbridge");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "单位任务毛利桥：按任务计费 对照 席位+增量（本报告测算）",
    sub: "三情景可切换 · 蓝 = 收入 · 墨 = 成本 · 毛利为正为蓝、为负为红 · 点击任意桥段下钻",
    src: "本报告测算 · 2026-07-17",
  });

  const P = U.PAL;
  const GB = RPT.grossBridge;
  const KEYS = ["乐观", "基准", "悲观"];
  const pick = (bridge, key) => bridge.scenarios.find(s => s.name.indexOf(key) === 0) || bridge.scenarios[1];
  const parseB = s => parseFloat(String(s).replace("−", "-").match(/-?[\d.]+/)[0]);
  let cur = "基准";

  // ── 情景开关 ──
  const bar = document.createElement("div");
  bar.style.cssText = "display:flex;gap:8px;margin-bottom:14px;align-items:center;flex-wrap:wrap";
  const lab = document.createElement("span");
  lab.style.cssText = `font:10px ${U.FONTS.mono};color:${P.inkLo};letter-spacing:.18em;margin-right:4px`;
  lab.textContent = "情景";
  bar.appendChild(lab);
  const btns = {};
  KEYS.forEach(k => {
    const b = document.createElement("button");
    b.textContent = k;
    b.style.cssText = `font:11px ${U.FONTS.mono};letter-spacing:.08em;padding:5px 16px;cursor:pointer;
      border:1px solid ${P.line};background:transparent;color:${P.inkMd};border-radius:3px;transition:all .18s ease`;
    b.onclick = () => { cur = k; update(); paint(); };
    bar.appendChild(b);
    btns[k] = b;
  });
  body.appendChild(bar);
  function paint() {
    KEYS.forEach(k => {
      const on = k === cur;
      btns[k].style.background = on ? P.ink : "transparent";
      btns[k].style.color = on ? P.paperHi : P.inkMd;
      btns[k].style.borderColor = on ? P.ink : P.line;
    });
  }
  paint();

  // ── SVG：左右两桥 ──
  const sc = document.createElement("div");
  sc.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(sc);

  const W = 1080, H = 400, TOP = 44, BOT = 64;
  const PW2 = 470, GAPW = 120; // 单桥面板宽 / 桥间隔
  const svg = d3.select(sc).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%").style("min-width", "760px").style("display", "block")
    .attr("data-drill-keep", "1");

  function drawBridge(x0, cfg) {
    // cfg: {name, unit, rev, cost, profit, gm, drillMake, fmt}
    const g = svg.append("g");
    const yMax = Math.max(cfg.rev, cfg.cost) * 1.22;
    const yMin = Math.min(0, cfg.rev - cfg.cost) * 1.35;
    const y = d3.scaleLinear().domain([yMin, yMax]).range([H - BOT, TOP]);
    // 零线
    g.append("line").attr("x1", x0).attr("x2", x0 + PW2).attr("y1", y(0)).attr("y2", y(0))
      .attr("stroke", P.ink).attr("stroke-width", 1);
    // 面板标题
    g.append("text").attr("x", x0 + PW2 / 2).attr("y", 20).attr("text-anchor", "middle")
      .attr("style", `font:700 13px ${U.FONTS.serif};fill:${P.ink}`).text(cfg.name);
    g.append("text").attr("x", x0 + PW2 / 2).attr("y", 36).attr("text-anchor", "middle")
      .attr("style", `font:9px ${U.FONTS.mono};fill:${P.inkLo}`).text(cfg.unit);

    const bw = 92, step = PW2 / 3;
    const cx = i => x0 + step * i + step / 2;
    const gross = cfg.rev - cfg.cost;
    const bars = [
      { lab: "收入", v0: 0, v1: cfg.rev, col: P.blue, op: 0.88, txt: cfg.fmt(cfg.rev) },
      { lab: "成本", v0: cfg.rev, v1: gross, col: P.ink, op: 0.8, txt: "−" + cfg.fmt(cfg.cost) },
      { lab: cfg.grossLab, v0: 0, v1: gross, col: gross >= 0 ? P.blue : P.red, op: gross >= 0 ? 0.92 : 0.9,
        txt: (gross >= 0 ? "+" : "−") + cfg.fmt(Math.abs(gross)) },
    ];
    bars.forEach((b, i) => {
      const r = g.append("rect")
        .attr("x", cx(i) - bw / 2).attr("width", bw)
        .attr("y", y(Math.max(b.v0, b.v1))).attr("height", Math.max(1.5, Math.abs(y(b.v0) - y(b.v1))))
        .attr("fill", b.col).attr("opacity", b.op).attr("rx", 1.5)
        .style("cursor", "pointer");
      r.on("click", e => U.showDrill(Object.assign(cfg.drillMake(i), { x: e.clientX, y: e.clientY })));
      r.on("mouseenter", function () { d3.select(this).attr("opacity", 1); });
      r.on("mouseleave", function () { d3.select(this).attr("opacity", b.op); });
      // 数值标签：负毛利条放条内上方，其余放条顶
      const neg = b.v1 < 0;
      g.append("text")
        .attr("x", cx(i)).attr("y", neg ? y(b.v1) - 8 : y(Math.max(b.v0, b.v1)) - 8)
        .attr("text-anchor", "middle")
        .attr("style", `font:700 13px ${U.FONTS.mono};fill:${b.col}`)
        .text(b.txt);
      g.append("text")
        .attr("x", cx(i)).attr("y", H - BOT + 20).attr("text-anchor", "middle")
        .attr("style", `font:10.5px ${U.FONTS.mono};fill:${P.inkMd}`)
        .text(b.lab);
      // 瀑布虚线连接
      if (i < 2) {
        const lvl = i === 0 ? cfg.rev : gross;
        g.append("line")
          .attr("x1", cx(i) + bw / 2).attr("x2", cx(i + 1) - bw / 2)
          .attr("y1", y(lvl)).attr("y2", y(lvl))
          .attr("stroke", P.inkLo).attr("stroke-width", 1).attr("stroke-dasharray", "3 3");
      }
    });
    // 毛利率 / 利润读数
    g.append("text")
      .attr("x", x0 + PW2 / 2).attr("y", H - BOT + 44).attr("text-anchor", "middle")
      .attr("style", `font:700 12px ${U.FONTS.mono};fill:${gross >= 0 ? P.blue : P.red}`)
      .text(cfg.readout);
  }

  const afFmt = v => "$" + (+v.toFixed(4)).toString();
  const snFmt = v => "$" + (+v.toFixed(3)).toString() + "B";

  function update() {
    svg.selectAll("g").remove();
    const af = pick(GB.agentforce, cur);
    const sn = pick(GB.servicenow, cur);
    const snProfit = parseB(sn.profit);
    const snCost = +(sn.revenue - snProfit).toFixed(4);

    drawBridge(30, {
      name: GB.agentforce.name, unit: GB.agentforce.unit + " · " + cur + "情景",
      rev: af.revenue, cost: af.cost, fmt: afFmt, grossLab: "单位毛利",
      readout: `毛利率 ${af.gm} · 年利润近似值 ${af.profit}`,
      drillMake: i => ({
        title: `毛利桥 · ${GB.agentforce.name}（${af.name}情景）`,
        value: `每任务收入 ${afFmt(af.revenue)} − 成本 ${afFmt(af.cost)} = ${af.revenue - af.cost >= 0 ? "+" : "−"}${afFmt(Math.abs(af.revenue - af.cost))}，毛利率 ${af.gm}`,
        sub: `${GB.agentforce.assumptions} 年利润近似值 ${af.profit}。`,
        source: GB.agentforce.source }),
    });
    drawBridge(30 + PW2 + GAPW, {
      name: GB.servicenow.name, unit: GB.servicenow.unit + " · " + cur + "情景",
      rev: sn.revenue, cost: snCost, fmt: snFmt, grossLab: "利润",
      readout: `毛利率 ${sn.gm} · 年利润近似值 ${sn.profit}`,
      drillMake: i => ({
        title: `毛利桥 · ${GB.servicenow.name}（${sn.name}情景）`,
        value: `收入近似值 ${snFmt(sn.revenue)} × 毛利率 ${sn.gm} ≈ 年利润 ${sn.profit}`,
        sub: GB.servicenow.assumptions,
        source: GB.servicenow.source }),
    });
  }
  update();

  // ── 图注：成本假设全列（可复算）──
  const note = document.createElement("div");
  note.style.cssText = `margin-top:12px;padding:10px 12px;border:1px dashed ${P.line};
    font:10.5px ${U.FONTS.mono};color:${P.inkMd};line-height:1.8;cursor:pointer`;
  note.setAttribute("data-drill-keep", "1");
  note.innerHTML =
    `<b style="color:${P.ink}">成本假设（可复算）</b><br>` +
    `Agentforce：${U.esc(GB.agentforce.assumptions)}<br>` +
    `ServiceNow：${U.esc(GB.servicenow.assumptions)}<br>` +
    `<span style="color:${P.red}">${U.esc(GB.note)}</span>`;
  note.addEventListener("click", e => U.showDrill({
    title: "单位任务毛利桥 · 全部成本假设",
    value: "'收到钱'≠'赚到钱'：基准情景下单位任务毛利 −87.5%",
    sub: `${GB.agentforce.assumptions} ${GB.servicenow.assumptions}`,
    source: GB.agentforce.source, x: e.clientX, y: e.clientY }));
  body.appendChild(note);

  // 滚动入场：整图淡入
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    svg.selectAll("rect").each(function () {
      const r = d3.select(this);
      const o = +r.attr("opacity") || 0.85;
      r.attr("opacity", 0).transition().duration(650).attr("opacity", o);
    });
  }, { threshold: 0.2 });
  io.observe(svg.node());
})();
