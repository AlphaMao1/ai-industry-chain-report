// §8 资本开支分组柱 + 阈值图 + 灯号注记（宿主 #chart-capex）
// 上：四公司 FY2023–2026E 分组柱（公司披露现金口径，组 A；指引柱斜纹空心，仅指引柱可点）；
// 中：阈值图（2026 Q1 当季购设备现金/经营现金流，1.0 语义红线，Amazon 越线画红）+ 回收质量条；
// 下：四公司黄橙灯判断注记（橙/琥珀两色仅限此灯号组件，不进数据系列）。
// 数据：RPT.capex（companies / totals / threshold / recovery / altBasis）。
(() => {
  const host = document.getElementById("chart-capex");
  if (!host || !window.RPT || !window.U || !window.d3) return;
  const C = RPT.capex;
  if (!C || !C.companies) return;
  const P = U.PAL;
  const SRC = "官方披露 · 券商研究 · 截至 2026-07-17";

  const body = U.frame(host, {
    title: "四公司资本开支：FY2023 → 2026E 指引，与现金压力阈值",
    sub: "公司披露现金口径（组 A）· 实心 = 已报告，斜纹空心 = 公司指引（仅指引柱可点）· 下含阈值图与灯号注记",
    src: SRC,
  });

  // 指引字符串 → 作图中值（"约 190"→190，"180–190"→185；图面仍印原文，不硬编码）
  const guideMid = s => {
    const m = String(s == null ? "" : s).match(/[\d.]+/g);
    if (!m) return null;
    const n = m.map(Number);
    return n.length > 1 ? (n[0] + n[n.length - 1]) / 2 : n[0];
  };

  // ── 图侧展开面板（点击任意公司柱/公司名：承诺倍数与口径注内联展开，不用弹卡）──
  const xcss = document.createElement("style");
  xcss.textContent =
    "#chart-capex .cx-x{margin-top:12px;border:1px solid var(--line);border-left:3px solid " + P.blue + ";" +
    "background:var(--paper-hi);padding:12px 16px 11px}" +
    "#chart-capex .cx-x-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}" +
    "#chart-capex .cx-x-name{font-family:var(--serif);font-weight:900;font-size:14px;color:var(--ink)}" +
    "#chart-capex .cx-x-close{margin-left:auto;font-family:var(--mono);font-size:14px;color:var(--ink-lo);" +
    "cursor:pointer;border:1px solid var(--line);padding:0 8px;line-height:1.5}" +
    "#chart-capex .cx-x-close:hover{color:var(--ink);border-color:var(--ink)}" +
    "#chart-capex .cx-x-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:10px}" +
    "@media(max-width:760px){#chart-capex .cx-x-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}" +
    "#chart-capex .cx-x-cell{border-top:1.5px solid var(--ink);padding-top:6px}" +
    "#chart-capex .cx-x-k{font-family:var(--mono);font-size:8.5px;letter-spacing:.1em;color:var(--ink-lo)}" +
    "#chart-capex .cx-x-v{font-family:var(--mono);font-weight:700;font-size:14px;color:var(--ink);margin-top:3px}" +
    "#chart-capex .cx-x-v.hot{color:" + P.red + "}" +
    "#chart-capex .cx-x-note{margin-top:10px;font-size:11.5px;color:var(--ink-md);line-height:1.7}" +
    "#chart-capex .cx-x-src{margin-top:8px;padding-top:7px;border-top:1px dashed var(--line-lo);" +
    "font-family:var(--mono);font-size:9.5px;color:var(--ink-lo)}";
  document.head.appendChild(xcss);

  const xPanel = document.createElement("div");
  xPanel.style.display = "none";
  let xCo = null;
  const openX = co => {
    if (xCo === co && xPanel.style.display !== "none") { xPanel.style.display = "none"; xCo = null; return; }
    xCo = co;
    const hot = co.q1Ratio >= (C.threshold ? C.threshold.line : 1.0);
    xPanel.className = "cx-x";
    xPanel.innerHTML =
      `<div class="cx-x-head"><span class="cx-x-name">${U.esc(co.name)}</span>` +
      `<span style="font:10px ${U.FONTS.mono};color:${P.inkLo}">公司披露现金口径 · 点击 × 收起</span>` +
      `<span class="cx-x-close" role="button" aria-label="收起">×</span></div>` +
      `<div class="cx-x-grid">` +
      `<div class="cx-x-cell"><div class="cx-x-k">FY2025 资本开支</div><div class="cx-x-v">$${co.fy2025}B</div></div>` +
      `<div class="cx-x-cell"><div class="cx-x-k">2026E 指引</div><div class="cx-x-v">$${U.esc(co.guide2026)}B</div></div>` +
      `<div class="cx-x-cell"><div class="cx-x-k">2026 Q1 购设备现金 ÷ 经营现金流</div><div class="cx-x-v${hot ? " hot" : ""}">${co.q1Ratio.toFixed(2)}×${hot ? " 红灯" : ""}</div></div>` +
      `<div class="cx-x-cell"><div class="cx-x-k">已签约付款承诺 ÷ 年化经营现金流</div><div class="cx-x-v${co.commitRatio >= 1 ? " hot" : ""}">${co.commitRatio.toFixed(2)}×</div></div>` +
      `</div>` +
      `<div class="cx-x-note">资本开支/经营现金流（FY2025 口径）：${U.esc(co.capexOcf)} · TTM 资本开支 $${co.ttm}B<br/>${U.esc(co.note)}</div>` +
      `<div class="cx-x-src">${U.esc(U.fmtSrc(SRC))} · 承诺倍数为"本报告测算，基于官方季报"（见 RPT.capex.threshold）</div>`;
    xPanel.style.display = "";
    xPanel.querySelector(".cx-x-close").addEventListener("click", e => {
      e.stopPropagation(); xPanel.style.display = "none"; xCo = null;
    });
  };

  // ── 顶部合计标注条（全部取自 totals）──
  if (C.totals) {
    const t = C.totals;
    const tot = document.createElement("p");
    tot.style.cssText = "margin:0 0 12px;font:700 12.5px " + U.FONTS.mono + ";color:" + P.ink + ";line-height:1.7";
    tot.innerHTML =
      "四家合计：FY2023 $" + t.fy2023 + "B → FY2024 $" + t.fy2024 + "B（" + U.esc(t.fy2024yoy) +
      "）→ FY2025 <span style='color:" + P.blue + "'>$" + t.fy2025 + "B（" + U.esc(t.fy2025yoy) +
      "）</span> → 2026E 指引 <span style='color:" + P.blue + "'>$" + U.esc(t.guide2026) + "B</span>（" +
      U.esc(t.guide2026yoy) + "）";
    body.appendChild(tot);
  }

  // ═══ 组件一：分组柱 ═══
  const scroll1 = document.createElement("div");
  scroll1.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(scroll1);

  const YEARS = ["fy2023", "fy2024", "fy2025", "guide"];
  const YLAB = { fy2023: "FY2023", fy2024: "FY2024", fy2025: "FY2025", guide: "2026E 指引" };
  const COLS = [P.inkLo, P.inkMd, P.ink];
  const W1 = 1080, H1 = 430, ML = 56, MR = 24, TOP = 30, BOT = 64;
  const vMax = Math.max(...C.companies.map(c => Math.max(c.fy2023, c.fy2024, c.fy2025, guideMid(c.guide2026) || 0)));
  const yTop = Math.ceil((vMax * 1.12) / 50) * 50;
  const y1 = d3.scaleLinear().domain([0, yTop]).range([H1 - BOT, TOP]);
  const x0 = d3.scaleBand().domain(C.companies.map(c => c.name)).range([ML, W1 - MR]).paddingInner(0.28).paddingOuter(0.06);
  const x1 = d3.scaleBand().domain(YEARS).range([0, x0.bandwidth()]).padding(0.14);

  const svg1 = d3.select(scroll1).append("svg")
    .attr("viewBox", "0 0 " + W1 + " " + H1)
    .style("width", "100%").style("min-width", "700px").style("display", "block")
    .attr("data-drill-keep", "1");

  // 指引斜纹
  const defs = svg1.append("defs");
  const pat = defs.append("pattern").attr("id", "capex-hatch").attr("width", 7).attr("height", 7)
    .attr("patternUnits", "userSpaceOnUse").attr("patternTransform", "rotate(45)");
  pat.append("rect").attr("width", 7).attr("height", 7).attr("fill", "rgba(34,81,255,.10)");
  pat.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 7)
    .attr("stroke", P.blue).attr("stroke-width", 1.4);

  d3.range(0, yTop + 1, 50).forEach(v => {
    svg1.append("line").attr("x1", ML).attr("x2", W1 - MR).attr("y1", y1(v)).attr("y2", y1(v))
      .attr("stroke", v === 0 ? P.ink : P.lineLo).attr("stroke-width", v === 0 ? 1.2 : 1);
    if (v > 0) svg1.append("text").attr("x", ML - 8).attr("y", y1(v) + 3.5).attr("text-anchor", "end")
      .attr("style", "font:10px " + U.FONTS.mono + ";fill:" + P.inkLo).text("$" + v + "B");
  });

  const animated = [];
  const groups = svg1.append("g").selectAll("g.co").data(C.companies).join("g")
    .attr("transform", d => "translate(" + x0(d.name) + ", 0)");

  groups.each(function (co, ci) {
    const g = d3.select(this);
    YEARS.forEach((yr, yi) => {
      const isG = yr === "guide";
      const v = isG ? guideMid(co.guide2026) : co[yr];
      if (v == null) return;
      const bx = x1(yr), bw = x1.bandwidth();
      const full = H1 - BOT - y1(v);
      const r = g.append("rect")
        .attr("x", bx).attr("width", bw)
        .attr("y", H1 - BOT).attr("height", 0)
        .attr("fill", isG ? "url(#capex-hatch)" : COLS[yi])
        .attr("stroke", isG ? P.blue : "none").attr("stroke-width", isG ? 1.2 : 0)
        .style("cursor", isG ? "pointer" : "default");
      animated.push({ start: 0.1 + ci * 0.12 + yi * 0.07, dur: 0.55,
        set: p => r.attr("y", H1 - BOT - full * p).attr("height", full * p) });
      const lb = g.append("text")
        .attr("x", bx + bw / 2).attr("text-anchor", "middle")
        .attr("style", "font:" + (isG ? 700 : 400) + " 9.5px " + U.FONTS.mono + ";fill:" + (isG ? P.blue : P.inkMd))
        .attr("opacity", 0).text(isG ? co.guide2026 : v.toFixed(1));
      animated.push({ start: 0.55 + ci * 0.12 + yi * 0.07, dur: 0.25,
        set: p => lb.attr("opacity", p).attr("y", y1(v) - 6 + 3 * (1 - p)) });
      if (isG) {
        // 仅指引柱可点下钻（大纲交互约定）；悬停提示同样给点击 affordance（触屏直接点）
        r.on("mouseenter", e => U.showTip("<b>" + U.esc(co.name) + " 2026E 指引 $" + U.esc(co.guide2026) +
          "B</b><br/>点击看口径与注记", e.clientX, e.clientY));
        r.on("mousemove", e => U.showTip("<b>" + U.esc(co.name) + " 2026E 指引 $" + U.esc(co.guide2026) +
          "B</b><br/>点击看口径与注记", e.clientX, e.clientY));
        r.on("mouseleave", U.hideTip);
        r.on("click", e => U.showDrill({
          title: co.name + " · 2026 年资本开支指引",
          value: "$" + co.guide2026 + "B（指引区间，柱高按中值 $" + v.toFixed(0) + "B 绘制）",
          sub: co.note + (C.totals ? "<br/><br/>四家指引合计 $" + C.totals.guide2026 + "B（" + U.esc(C.totals.guide2026yoy) + "）。" : ""),
          source: SRC, x: e.clientX, y: e.clientY }));
      } else {
        r.on("mouseenter", e => U.showTip("<b>" + U.esc(co.name) + " · " + YLAB[yr] + "</b>：$" + v.toFixed(1) +
          "B<br/>点击在图侧展开该公司承诺倍数与口径", e.clientX, e.clientY));
        r.on("mousemove", e => U.showTip("<b>" + U.esc(co.name) + " · " + YLAB[yr] + "</b>：$" + v.toFixed(1) + "B", e.clientX, e.clientY));
        r.on("mouseleave", U.hideTip);
        // 历史柱点击 → 图侧展开该公司面板（承诺倍数 / 现金压力 / 口径注）
        r.style("cursor", "pointer").on("click", () => openX(co));
      }
    });
    const colab = svg1.append("text")
      .attr("x", x0(co.name) + x0.bandwidth() / 2).attr("y", H1 - BOT + 20)
      .attr("text-anchor", "middle")
      .attr("style", "font:700 12px " + U.FONTS.serif + ";fill:" + P.ink + ";cursor:pointer").text(co.name);
    colab.on("click", () => openX(co));
    // 公司名下第二行：承诺倍数读数直接上图面（不再只藏下钻）
    svg1.append("text")
      .attr("x", x0(co.name) + x0.bandwidth() / 2).attr("y", H1 - BOT + 36)
      .attr("text-anchor", "middle")
      .attr("style", "font:9px " + U.FONTS.mono + ";fill:" + (co.commitRatio >= 1 ? P.red : P.inkLo) + ";cursor:pointer")
      .text("承诺 " + co.commitRatio.toFixed(2) + "× · Q1 现金 " + co.q1Ratio.toFixed(2) + "×")
      .on("click", () => openX(co));
  });

  // 图例
  const lg = svg1.append("g").attr("transform", "translate(" + ML + ", " + (H1 - 16) + ")");
  [["已报告（现金口径）", P.ink, false], ["2026E 指引（斜纹空心，可点）", P.blue, true]].forEach(([t, c, h], i) => {
    lg.append("rect").attr("x", i * 220).attr("y", -9).attr("width", 14).attr("height", 10)
      .attr("fill", h ? "url(#capex-hatch)" : c).attr("stroke", h ? P.blue : "none").attr("stroke-width", 1);
    lg.append("text").attr("x", i * 220 + 20).attr("y", 0)
      .attr("style", "font:10px " + U.FONTS.mono + ";fill:" + P.inkMd).text(t);
  });

  U.play(animated, svg1.node(), { threshold: 0.22 });

  // 口径双注（组 A 主口径 + 券商汇总备选口径，禁止跨口径拼列）
  const basis = document.createElement("p");
  basis.style.cssText = "margin:10px 0 0;font:10.5px " + U.FONTS.mono + ";color:" + P.inkLo + ";line-height:1.7";
  basis.textContent = "口径：" + C.basis + (C.altBasis ? "　备选：" + C.altBasis.name + " FY2025 合计 $" + C.altBasis.total2025 + "B（" + C.altBasis.yoy + "）——" + C.altBasis.note : "");
  body.appendChild(basis);
  body.appendChild(xPanel); // 图侧展开位（点击公司柱/公司名后填充）

  // ═══ 组件二：阈值图（2026 Q1 当季购设备现金 ÷ 经营现金流）═══
  const h2 = document.createElement("p");
  h2.style.cssText = "margin:26px 0 6px;font:700 13px " + U.FONTS.serif + ";color:" + P.ink;
  h2.textContent = "阈值图：当季买设备花的现金 ÷ 生意赚回的现金（2026 Q1）";
  body.appendChild(h2);

  const scroll2 = document.createElement("div");
  scroll2.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(scroll2);

  const TH = C.threshold || { line: 1.0, label: "1.0 语义红线" };
  const W2 = 1080, H2 = 300, ML2 = 130, MR2 = 40, TOP2 = 34, BOT2 = 44;
  const qMax = Math.max(1.2, ...C.companies.map(c => c.q1Ratio)) * 1.15;
  const y2 = d3.scaleLinear().domain([0, qMax]).range([H2 - BOT2, TOP2]);
  const x2 = d3.scaleBand().domain(C.companies.map(c => c.name)).range([ML2, W2 - MR2]).padding(0.5);

  const svg2 = d3.select(scroll2).append("svg")
    .attr("viewBox", "0 0 " + W2 + " " + H2)
    .style("width", "100%").style("min-width", "640px").style("display", "block")
    .attr("data-drill-keep", "1");

  [0, 0.5, 1.0, 1.5].filter(v => v <= qMax).forEach(v => {
    svg2.append("line").attr("x1", ML2).attr("x2", W2 - MR2).attr("y1", y2(v)).attr("y2", y2(v))
      .attr("stroke", v === 0 ? P.ink : P.lineLo).attr("stroke-width", v === 0 ? 1.2 : 1);
    svg2.append("text").attr("x", ML2 - 8).attr("y", y2(v) + 3.5).attr("text-anchor", "end")
      .attr("style", "font:10px " + U.FONTS.mono + ";fill:" + P.inkLo).text(v.toFixed(1) + "×");
  });
  // 1.0 语义红线（越线 = 当季买设备的钱超过赚回的钱）
  svg2.append("line").attr("x1", ML2).attr("x2", W2 - MR2)
    .attr("y1", y2(TH.line)).attr("y2", y2(TH.line))
    .attr("stroke", P.red).attr("stroke-width", 1.6).attr("stroke-dasharray", "7 4");
  svg2.append("text").attr("x", W2 - MR2).attr("y", y2(TH.line) - 8).attr("text-anchor", "end")
    .attr("style", "font:700 10px " + U.FONTS.mono + ";fill:" + P.red)
    .text(TH.label);

  const lolli = [];
  C.companies.forEach((co, i) => {
    const over = co.q1Ratio >= TH.line;
    const col = over ? P.red : P.blue; // 越线者画红（语义红，非灯号橙）
    const cx = x2(co.name) + x2.bandwidth() / 2;
    const stem = svg2.append("line").attr("x1", cx).attr("x2", cx)
      .attr("y1", y2(0)).attr("y2", y2(0)).attr("stroke", col).attr("stroke-width", 2);
    const dot = svg2.append("circle").attr("cx", cx).attr("cy", y2(0)).attr("r", 7)
      .attr("fill", col).attr("stroke", P.paper).attr("stroke-width", 1.5)
      .style("cursor", "pointer");
    lolli.push({ start: 0.15 + i * 0.12, dur: 0.5,
      set: p => { stem.attr("y2", y2(co.q1Ratio * p)); dot.attr("cy", y2(co.q1Ratio * p)); } });
    const lb = svg2.append("text").attr("x", cx).attr("y", y2(co.q1Ratio) - 14)
      .attr("text-anchor", "middle")
      .attr("style", "font:700 12.5px " + U.FONTS.mono + ";fill:" + col).attr("opacity", 0)
      .text(co.q1Ratio.toFixed(2) + "×" + (over ? " 红灯" : ""));
    lolli.push({ start: 0.55 + i * 0.12, dur: 0.25, set: p => lb.attr("opacity", p) });
    svg2.append("text").attr("x", cx).attr("y", H2 - BOT2 + 20).attr("text-anchor", "middle")
      .attr("style", "font:700 12px " + U.FONTS.serif + ";fill:" + P.ink).text(co.name);
    // 承诺倍数直接上图面（原仅在下钻卡）
    svg2.append("text").attr("x", cx).attr("y", H2 - BOT2 + 35).attr("text-anchor", "middle")
      .attr("style", "font:9px " + U.FONTS.mono + ";fill:" + (co.commitRatio >= TH.line ? P.red : P.inkLo))
      .text("承诺 " + co.commitRatio.toFixed(2) + "×");
    const drill = e => U.showDrill({
      title: "现金压力 · " + co.name + "（2026 Q1）",
      value: "当季购设备现金/经营现金流 " + co.q1Ratio.toFixed(2) + "× · 已签约付款承诺/年化经营现金流 " + co.commitRatio.toFixed(2) + "×",
      sub: co.note + "<br/><br/>" + TH.note,
      source: "本报告测算，基于官方季报 · 截至 2026-07-17", x: e.clientX, y: e.clientY });
    dot.on("click", drill);
    stem.on("click", drill).style("cursor", "pointer");
    dot.on("mouseenter", e => U.showTip("<b>" + U.esc(co.name) + "</b>：" + co.q1Ratio.toFixed(2) + "×（承诺倍数 " + co.commitRatio.toFixed(2) + "×）<br/>点击看口径", e.clientX, e.clientY));
    dot.on("mousemove", e => U.showTip("<b>" + U.esc(co.name) + "</b>：" + co.q1Ratio.toFixed(2) + "×<br/>点击看口径", e.clientX, e.clientY));
    dot.on("mouseleave", U.hideTip);
  });
  U.play(lolli, svg2.node(), { threshold: 0.25 });

  // 回收质量条（本报告测算，可点）
  if (C.recovery) {
    const rc = document.createElement("div");
    rc.setAttribute("data-drill-keep", "1");
    rc.style.cssText = "margin-top:12px;padding:10px 14px;border:1px solid rgba(10,31,51,.22);" +
      "background:rgba(10,31,51,.05);cursor:pointer;font:11.5px " + U.FONTS.mono + ";color:" + P.inkMd + ";line-height:1.7";
    rc.innerHTML = "<b style='color:" + P.ink + "'>" + U.esc(C.recovery.title) + "</b>　" +
      U.esc(C.recovery.aiProxy) + "　<span style='color:" + P.inkLo + "'>点击查看 →</span>";
    rc.addEventListener("click", e => U.showDrill({
      title: C.recovery.title, value: "四家回收均未闭合",
      sub: U.esc(C.recovery.aiProxy) + "<br/><br/>" + U.esc(C.recovery.cover),
      source: "本报告测算 · 截至 2026-07-17", x: e.clientX, y: e.clientY }));
    body.appendChild(rc);
  }

  // ═══ 组件三：黄橙灯判断注记（橙/琥珀仅限本组件，不进上方数据系列）═══
  const h3 = document.createElement("p");
  h3.style.cssText = "margin:26px 0 4px;font:700 13px " + U.FONTS.serif + ";color:" + P.ink;
  h3.textContent = "灯号注记：逐公司现金压力与融资边际信号";
  body.appendChild(h3);
  const h3s = document.createElement("p");
  h3s.style.cssText = "margin:0 0 10px;font:10px " + U.FONTS.mono + ";color:" + P.inkLo + ";line-height:1.6";
  h3s.textContent = "判断注记（非数据系列）· 橙/琥珀仅用于本灯号组件 · 点击卡片看事实与出处";
  body.appendChild(h3s);

  const css =
    "#chart-capex .cx-lamp-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}" +
    "@media(max-width:860px){#chart-capex .cx-lamp-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}" +
    "@media(max-width:520px){#chart-capex .cx-lamp-grid{grid-template-columns:1fr}}" +
    "#chart-capex .cx-lamp{border:1px solid var(--ink);background:var(--paper);" +
    "padding:13px 15px 11px;cursor:pointer;transition:box-shadow .16s ease,transform .16s ease}" +
    "#chart-capex .cx-lamp:hover{box-shadow:0 8px 22px rgba(10,31,51,.12);transform:translateY(-2px)}" +
    "#chart-capex .cx-lamp.orange{border-color:" + P.orange + "}" +
    "#chart-capex .cx-lamp.amber{border-color:" + P.amber + "}" +
    "#chart-capex .cx-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:7px;vertical-align:-1px}" +
    "#chart-capex .cx-co{font-family:var(--serif);font-weight:700;font-size:14px;color:var(--ink)}" +
    "#chart-capex .cx-tag{font-family:var(--mono);font-size:9px;letter-spacing:.1em;margin-left:6px}" +
    "#chart-capex .cx-note{font-size:11.5px;color:var(--ink-md);line-height:1.65;margin-top:8px}";
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // 灯号分派（编辑判断注记；事实全部取自 companies[].note）
  const LAMPS = [
    { name: "Microsoft", cls: "", dot: P.ink, tag: "墨 · 唯一未发债（表外租赁半年 +67%）" },
    { name: "Alphabet", cls: "", dot: P.ink, tag: "墨 · 发债含 100 年期债" },
    { name: "Amazon", cls: "orange", dot: P.orange, tag: "橙灯 · 现金压力最高（阈值图越线）" },
    { name: "Meta", cls: "amber", dot: P.amber, tag: "黄灯 · 认购缩 23%（仍是 3.8 倍覆盖）" },
  ];
  const grid = document.createElement("div"); grid.className = "cx-lamp-grid"; body.appendChild(grid);
  const cards = [];
  LAMPS.forEach(L => {
    const co = C.companies.find(c => c.name === L.name);
    const el = document.createElement("div");
    el.className = "cx-lamp " + L.cls;
    el.setAttribute("data-drill-keep", "1");
    el.innerHTML =
      "<div><span class='cx-dot' style='background:" + L.dot + "'></span>" +
      "<span class='cx-co'>" + U.esc(L.name) + "</span><span class='cx-tag' style='color:" + L.dot + "'>" + U.esc(L.tag) + "</span></div>" +
      "<div class='cx-note'>" + U.esc(co ? co.note : "") + "</div>";
    el.addEventListener("click", e => U.showDrill({
      title: "灯号 · " + L.name, value: L.tag,
      sub: co ? co.note + "<br/><br/>FY2025 资本开支 $" + co.fy2025 + "B · 2026E 指引 $" + co.guide2026 + "B · 资本开支/经营现金流 " + U.esc(co.capexOcf) : "",
      source: SRC, x: e.clientX, y: e.clientY }));
    grid.appendChild(el); cards.push(el);
  });
  cards.forEach(c => c.classList.add("rv"));
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    cards.forEach((c, i) => setTimeout(() => c.classList.add("in"), i * 100));
  }, { threshold: 0.15 });
  io.observe(grid);
})();
