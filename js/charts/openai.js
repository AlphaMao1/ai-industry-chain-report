// §8 OpenAI 承诺构成条 + 2001 对照卡（宿主 #chart-openai）
// 上：8 年约 $1.4 万亿承诺构成条（已列明四大块 + 未列明余量），对照年化收入约 $25B 参考线；
// 下：2001 电信 vs 2026 AI 双栏对照卡（融资规模/需求叙事/供应商融资/结局四行）。
// 点击构成段或对照行下钻。数据：RPT.openaiCommit（对照卡取自 RPT.precedentMatrix / RPT.financeFall）。
(() => {
  const host = document.getElementById("chart-openai");
  if (!host || !window.RPT || !window.U || !window.d3) return;
  const O = RPT.openaiCommit;
  if (!O || !O.parts) return;
  const P = U.PAL;
  const SRC = "官方披露 · 媒体报道与访谈 · 券商研究 · 截至 2026-07-17";

  const body = U.frame(host, {
    title: "OpenAI 的 8 年承诺，与一张 2001 年的镜子",
    sub: "承诺构成条（对数感：年化收入参考线几乎看不见）+ 电信泡沫对照卡 · 点击任意段/行下钻",
    src: SRC,
  });

  // 总额解析："8 年约 $1.4 万亿" → 1400（解析失败则退回已列明合计，不硬编码）
  const totalB = (() => {
    const m = String(O.total || "").match(/([\d.]+)\s*万亿/);
    return m ? parseFloat(m[1]) * 1000 : null;
  })();
  const partsSum = O.parts.reduce((a, p) => a + (p.amount || 0), 0);
  const scaleMax = totalB || partsSum;
  const rest = totalB ? Math.max(0, totalB - partsSum) : 0;
  // 年化收入参考线数值（"年化收入约 $25B" → 25）
  const arrB = (() => {
    const m = String((O.compare && O.compare.arr) || "").match(/\$\s*([\d.]+)\s*B/);
    return m ? parseFloat(m[1]) : null;
  })();

  // ── 构成条 ──
  const scroll = document.createElement("div");
  scroll.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(scroll);

  const W = 1080, H = 240, ML = 20, MR = 20, TOP = 74, BARH = 58;
  const x = d3.scaleLinear().domain([0, scaleMax]).range([ML, W - MR]);
  const COLS = [P.blue, P.blueHi, P.blueLo, P.inkMd];

  const svg = d3.select(scroll).append("svg")
    .attr("viewBox", "0 0 " + W + " " + H)
    .style("width", "100%").style("min-width", "680px").style("display", "block")
    .attr("data-drill-keep", "1");

  // 总额眉标
  svg.append("text").attr("x", ML).attr("y", 24)
    .attr("style", "font:700 13px " + U.FONTS.mono + ";fill:" + P.ink)
    .text(O.total + "（" + O.durationYears + " 年产能承诺，主要构成如下）");
  svg.append("text").attr("x", W - MR).attr("y", 24).attr("text-anchor", "end")
    .attr("style", "font:10px " + U.FONTS.mono + ";fill:" + P.inkLo)
    .text("已列明 $" + partsSum.toFixed(1) + "B / 其余未列明");

  const animated = [];
  let acc = 0;
  O.parts.forEach((p, i) => {
    const w = x(p.amount) - x(0);
    const r = svg.append("rect")
      .attr("x", x(0)).attr("y", TOP).attr("width", 0).attr("height", BARH)
      .attr("fill", COLS[i % COLS.length]).attr("opacity", 0.92).style("cursor", "pointer");
    animated.push({ start: 0.1 + i * 0.12, dur: 0.5, set: pr => r.attr("x", x(acc)).attr("width", w * pr) });
    r.on("mouseenter", e => U.showTip("<b>" + U.esc(p.name) + "</b>：" + U.esc(p.note) + "<br/>点击看口径", e.clientX, e.clientY));
    r.on("mousemove", e => U.showTip("<b>" + U.esc(p.name) + "</b>：" + U.esc(p.note) + "<br/>点击看口径", e.clientX, e.clientY));
    r.on("mouseleave", U.hideTip);
    r.on("click", e => U.showDrill({
      title: "OpenAI 承诺构成 · " + p.name, value: p.note + "（" + O.durationYears + " 年）",
      sub: (O.partsNote || "") + "<br/><br/>" + O.drill.sub, source: SRC, x: e.clientX, y: e.clientY }));
    // 段内标注（宽度够才放，否则引线到条上方）
    const label = p.name + " " + p.note;
    if (w > 120) {
      const t = svg.append("text").attr("x", x(acc) + w / 2).attr("y", TOP + BARH / 2 + 4)
        .attr("text-anchor", "middle")
        .attr("style", "font:700 11.5px " + U.FONTS.mono + ";fill:" + P.paperHi).attr("opacity", 0)
        .text(label);
      animated.push({ start: 0.5 + i * 0.12, dur: 0.25, set: pr => t.attr("opacity", pr) });
    } else {
      // 窄段标注落到条上方，按段序交错两行防重叠
      const ly = TOP - 8 - (i % 2) * 14;
      const t = svg.append("text").attr("x", x(acc) + w / 2).attr("y", ly)
        .attr("text-anchor", "middle")
        .attr("style", "font:10px " + U.FONTS.mono + ";fill:" + P.inkMd).attr("opacity", 0)
        .text(label);
      animated.push({ start: 0.5 + i * 0.12, dur: 0.25, set: pr => t.attr("opacity", pr) });
      svg.append("line").attr("x1", x(acc) + w / 2).attr("x2", x(acc) + w / 2)
        .attr("y1", ly + 3).attr("y2", TOP).attr("stroke", P.inkLo).attr("stroke-width", 0.8);
    }
    acc += p.amount;
  });
  // 未列明余量
  if (rest > 0) {
    const rw = x(scaleMax) - x(acc);
    const rr = svg.append("rect")
      .attr("x", x(acc)).attr("y", TOP).attr("width", 0).attr("height", BARH)
      .attr("fill", "rgba(10,31,51,.08)").attr("stroke", P.line).attr("stroke-dasharray", "4 3")
      .style("cursor", "pointer");
    animated.push({ start: 0.6, dur: 0.4, set: pr => rr.attr("width", rw * pr) });
    const rt = svg.append("text").attr("x", x(acc) + rw / 2).attr("y", TOP + BARH / 2 + 4)
      .attr("text-anchor", "middle")
      .attr("style", "font:10.5px " + U.FONTS.mono + ";fill:" + P.inkMd).attr("opacity", 0)
      .text("未列明余量 ≈$" + rest.toFixed(0) + "B");
    animated.push({ start: 0.85, dur: 0.25, set: pr => rt.attr("opacity", rw > 150 ? pr : 0) });
    rr.on("click", e => U.showDrill({
      title: "未列明余量", value: "≈$" + rest.toFixed(0) + "B（" + O.total + " 减去已列明 $" + partsSum.toFixed(1) + "B）",
      sub: O.partsNote || "", source: SRC, x: e.clientX, y: e.clientY }));
  }

  // 年化收入参考线（同一 $B 尺度 → 细如发丝，正是这张图要说的事）
  if (arrB != null) {
    const ax = x(arrB);
    const ln = svg.append("line").attr("x1", ax).attr("x2", ax)
      .attr("y1", TOP + BARH + 10).attr("y2", TOP + BARH + 34)
      .attr("stroke", P.red).attr("stroke-width", 1.6);
    const lb = svg.append("text").attr("x", Math.max(ax, ML + 4)).attr("y", TOP + BARH + 50)
      .attr("style", "font:700 10.5px " + U.FONTS.mono + ";fill:" + P.red)
      .text("▲ " + O.compare.arr + "——承诺约为其 " + Math.round(scaleMax / arrB) + " 倍量级；" + O.compare.burn);
    animated.push({ start: 0.9, dur: 0.3, set: pr => { ln.attr("opacity", pr); lb.attr("opacity", pr); } });
    ln.attr("opacity", 0); lb.attr("opacity", 0);
  }
  U.play(animated, svg.node(), { threshold: 0.25 });

  // ── 2001 电信 vs 2026 AI 双栏对照卡 ──
  const tel = (RPT.precedentMatrix && RPT.precedentMatrix.cases || []).find(c => c.name.indexOf("电信") === 0);
  const bondSt = (RPT.financeFall && RPT.financeFall.stages || []).find(s => s.id === "bond");
  const vendorSt = (RPT.financeFall && RPT.financeFall.stages || []).find(s => s.id === "vendor");
  const clause = (note, kw) => (String(note || "").split(/；|。/).find(c => c.indexOf(kw) >= 0) || "").trim();

  const rows = [
    { k: "融资规模",
      a: clause(tel && tel.note, "融资超"),
      b: clause(bondSt && bondSt.note, "$335B") || clause(bondSt && bondSt.note, "335") },
    { k: "需求叙事",
      a: clause(tel && tel.note, "100 天翻番"),
      b: "本轮需求证据仍在：云在手订单创新高、GPU 租金反弹（见本章多头硬牌）" },
    { k: "供应商融资",
      a: clause(tel && tel.note, "供应商融资敞口"),
      b: (vendorSt && vendorSt.parts || []).map(p => p.name + (p.amount != null ? " $" + p.amount + "B" : "（未计价）")).join("；") },
    { k: "结局",
      a: clause(tel && tel.note, "同步破产"),
      b: "未裁决——需求证据与现金压力同框" },
  ].filter(r => r.a || r.b);

  const h2 = document.createElement("p");
  h2.style.cssText = "margin:24px 0 10px;font:700 13px " + U.FONTS.serif + ";color:" + P.ink;
  h2.textContent = "2001 电信 vs 2026 AI：同一套语法，不同的阶段";
  body.appendChild(h2);

  const css =
    "#chart-openai .oc-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}" +
    "#chart-openai .oc-tbl{min-width:640px;border-top:1.5px solid var(--ink)}" +
    "#chart-openai .oc-row{display:grid;grid-template-columns:110px 1fr 1fr;border-bottom:1px solid var(--line);" +
    "cursor:pointer;transition:background .14s ease}" +
    "#chart-openai .oc-row:hover{background:rgba(34,81,255,.045)}" +
    "#chart-openai .oc-row.hd{cursor:default;border-bottom:1px solid var(--ink)}" +
    "#chart-openai .oc-row.hd:hover{background:transparent}" +
    "#chart-openai .oc-c{padding:11px 12px;font-size:11.5px;line-height:1.65;color:var(--ink-md)}" +
    "#chart-openai .oc-k{font-family:var(--mono);font-size:10px;letter-spacing:.12em;color:var(--ink);font-weight:700}" +
    "#chart-openai .oc-a{border-right:1px dashed var(--line)}" +
    "#chart-openai .oc-h{font-family:var(--mono);font-size:10.5px;font-weight:700;letter-spacing:.1em}";
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const sc2 = document.createElement("div"); sc2.className = "oc-scroll"; body.appendChild(sc2);
  const tbl = document.createElement("div"); tbl.className = "oc-tbl"; sc2.appendChild(tbl);
  const hd = document.createElement("div"); hd.className = "oc-row hd";
  hd.innerHTML = "<div class='oc-c oc-k'></div>" +
    "<div class='oc-c oc-a'><span class='oc-h' style='color:var(--ink-md)'>2001 电信（1996–2001）</span></div>" +
    "<div class='oc-c'><span class='oc-h' style='color:" + P.blue + "'>2026 AI（截至 2026-07-17）</span></div>";
  tbl.appendChild(hd);

  const rEls = [];
  rows.forEach(r => {
    const el = document.createElement("div");
    el.className = "oc-row";
    el.setAttribute("data-drill-keep", "1");
    el.innerHTML = "<div class='oc-c oc-k'>" + U.esc(r.k) + "</div>" +
      "<div class='oc-c oc-a'>" + U.esc(r.a || "—") + "</div>" +
      "<div class='oc-c'>" + U.esc(r.b || "—") + "</div>";
    el.addEventListener("click", e => U.showDrill({
      title: "2001 对照 · " + r.k,
      value: "电信：" + (r.a || "—"),
      sub: "2026 AI：" + (r.b || "—") + (tel ? "<br/><br/>同构点 = 同步性风险：同一融资源头退潮时，所有弱节点同时失血。" : ""),
      source: "行业机构（史料）· " + SRC, x: e.clientX, y: e.clientY }));
    tbl.appendChild(el); rEls.push(el);
  });
  rEls.forEach(r => r.classList.add("rv"));
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    rEls.forEach((r, i) => setTimeout(() => r.classList.add("in"), i * 90));
  }, { threshold: 0.15 });
  io.observe(tbl);
})();
