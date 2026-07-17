// §5 CapEx 回收（宿主 #chart-capex + #chart-capexlamp）
// 四公司 FY2023–2026E 分组柱图：2026E 用斜纹空心表示指引；hover 显示公司 note；点击下钻。
// 顶部标注合计 $412.9B → $695-725B。下方黄橙灯判断卡。数据：RPT.capex。
(() => {
  const host = document.getElementById("chart-capex");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "四大云商 CapEx · FY2023 → 2026E",
    sub: "实心 = 已报告 · 斜纹空心 = 公司指引/共识 · 悬停看注记 · 点击任意柱下钻",
    src: "公司披露 · 券商研究",
  });

  const P = U.PAL;
  const capex = RPT.capex;
  const YEARS = ["fy2023", "fy2024", "fy2025", "fy2026e"];
  const YLAB = { fy2023: "FY2023", fy2024: "FY2024", fy2025: "FY2025", fy2026e: "2026E" };
  const COLS = ["#8595a6", "#46586a", "#0a1f33", P.blue];

  const W = 1080, H = 430, ML = 56, MR = 24, TOP = 56, BOT = 64;
  const y = d3.scaleLinear().domain([0, 220]).range([H - BOT, TOP]);
  const x0 = d3.scaleBand().domain(capex.companies.map(c => c.name)).range([ML, W - MR]).paddingInner(0.28).paddingOuter(0.06);
  const x1 = d3.scaleBand().domain(YEARS).range([0, x0.bandwidth()]).padding(0.14);

  const svg = d3.select(body).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%").style("display", "block")
    .attr("data-drill-keep", "1");

  // 斜纹 pattern（2026E 指引）
  const defs = svg.append("defs");
  const pat = defs.append("pattern").attr("id", "hatch").attr("width", 7).attr("height", 7)
    .attr("patternUnits", "userSpaceOnUse").attr("patternTransform", "rotate(45)");
  pat.append("rect").attr("width", 7).attr("height", 7).attr("fill", "rgba(34,81,255,.10)");
  pat.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 7)
    .attr("stroke", P.blue).attr("stroke-width", 1.4);

  // 网格
  [0, 50, 100, 150, 200].forEach(v => {
    svg.append("line").attr("x1", ML).attr("x2", W - MR)
      .attr("y1", y(v)).attr("y2", y(v)).attr("stroke", P.lineLo);
    svg.append("text").attr("x", ML - 8).attr("y", y(v) + 3.5)
      .attr("text-anchor", "end").attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkLo}`)
      .text("$" + v + "B");
  });

  // 顶部合计标注
  const tot = svg.append("g");
  tot.append("path")
    .attr("d", `M ${ML} ${TOP - 22} H ${W - MR}`)
    .attr("stroke", P.inkMd).attr("stroke-width", 1).attr("fill", "none").attr("opacity", 0.5);
  tot.append("text").attr("x", (ML + W - MR) / 2).attr("y", TOP - 30)
    .attr("text-anchor", "middle")
    .attr("style", `font:700 12px ${U.FONTS.mono};fill:${P.ink}`)
    .text(`四大合计：FY2025 $${capex.total2025}B → 2026E $${capex.total2026e}B（+~70%）`);

  const tip = document.createElement("div");
  tip.style.cssText = `position:fixed;pointer-events:none;z-index:150;background:${P.ink};color:${P.paperHi};
    font:11px ${U.FONTS.mono};padding:8px 12px;border-radius:3px;max-width:300px;line-height:1.55;
    opacity:0;transition:opacity .12s ease`;
  document.body.appendChild(tip);

  const animated = [];
  const groups = svg.append("g").selectAll("g.co").data(capex.companies).join("g")
    .attr("transform", d => `translate(${x0(d.name)}, 0)`);

  groups.each(function (co, ci) {
    const g = d3.select(this);
    YEARS.forEach((yr, yi) => {
      const v = co[yr];
      const isE = yr === "fy2026e";
      const bx = x1(yr), bw2 = x1.bandwidth();
      const r = g.append("rect")
        .attr("x", bx).attr("width", bw2)
        .attr("y", H - BOT).attr("height", 0)
        .attr("fill", isE ? "url(#hatch)" : COLS[yi])
        .attr("stroke", isE ? P.blue : "none")
        .attr("stroke-width", isE ? 1.2 : 0)
        .style("cursor", "pointer");
      const full = H - BOT - y(v);
      animated.push({ start: 0.12 + ci * 0.12 + yi * 0.07, dur: 0.55,
        set: p => r.attr("y", H - BOT - full * p).attr("height", full * p) });
      const lb = g.append("text")
        .attr("x", bx + bw2 / 2).attr("text-anchor", "middle")
        .attr("style", `font:${isE ? 700 : 400} 9.5px ${U.FONTS.mono};fill:${isE ? P.blue : P.inkMd}`)
        .attr("opacity", 0).text(isE ? v : v.toFixed(1));
      animated.push({ start: 0.55 + ci * 0.12 + yi * 0.07, dur: 0.25,
        set: p => lb.attr("opacity", p).attr("y", y(v) - 6 + 3 * (1 - p)) });
      r.on("mouseenter", e => {
        tip.innerHTML = `<b>${co.name} · ${YLAB[yr]}</b>：$${v}B${isE ? "（指引/共识）" : ""}<br/>${co.note}`;
        tip.style.opacity = 1;
      });
      r.on("mousemove", e => {
        tip.style.left = Math.min(e.clientX + 14, window.innerWidth - 320) + "px";
        tip.style.top = (e.clientY + 14) + "px";
      });
      r.on("mouseleave", () => { tip.style.opacity = 0; });
      r.on("click", e => U.showDrill({
        title: `${co.name} · ${YLAB[yr]} CapEx`,
        value: `$${v}B${isE ? "（指引/共识口径）" : ""}`,
        sub: co.note + (isE ? "<br/><br/>" + capex.drill.sub : ""),
        source: capex.drill.source, x: e.clientX, y: e.clientY }));
    });
    // 公司名
    svg.append("text")
      .attr("x", x0(co.name) + x0.bandwidth() / 2).attr("y", H - BOT + 20)
      .attr("text-anchor", "middle")
      .attr("style", `font:700 12px ${U.FONTS.serif};fill:${P.ink}`)
      .text(co.name);
  });

  // 图例
  const lg = svg.append("g").attr("transform", `translate(${ML}, ${H - 20})`);
  [["已报告", P.ink, false], ["2026E 指引/共识", P.blue, true]].forEach(([t, c, h], i) => {
    lg.append("rect").attr("x", i * 150).attr("y", -9).attr("width", 14).attr("height", 10)
      .attr("fill", h ? "url(#hatch)" : c).attr("stroke", h ? P.blue : "none").attr("stroke-width", 1);
    lg.append("text").attr("x", i * 150 + 20).attr("y", 0)
      .attr("style", `font:10px ${U.FONTS.mono};fill:${P.inkMd}`).text(t);
  });

  U.play(animated, svg.node(), { threshold: 0.25 });

  // ── 黄橙灯判断卡（宿主 #chart-capexlamp）──
  const lampHost = document.getElementById("chart-capexlamp");
  if (lampHost) {
    const lb = U.frame(lampHost, {
      title: "CapEx 回收判断 · 黄橙灯",
      sub: "逐公司灯号 = 需求锚点干净程度 · 点击卡片下钻",
      src: "公司披露 · 券商研究",
    });
    const css = `
    #chart-capexlamp .lamp-grid { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:14px; }
    @media (max-width:860px){ #chart-capexlamp .lamp-grid { grid-template-columns:repeat(2, minmax(0,1fr)); } }
    #chart-capexlamp .lamp-card { border:1px solid var(--line); border-top:3px solid var(--ink);
      background:var(--paper); padding:14px 16px 12px; cursor:pointer;
      transition:box-shadow .16s ease, transform .16s ease; }
    #chart-capexlamp .lamp-card:hover { box-shadow:0 8px 22px rgba(10,31,51,.12); transform:translateY(-2px); }
    #chart-capexlamp .lamp-card.orange { border-top-color:#c25918; }
    #chart-capexlamp .lamp-card.amber { border-top-color:var(--amber); }
    #chart-capexlamp .lamp-dot { display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:7px; vertical-align:-1px; }
    #chart-capexlamp .lamp-co { font-family:var(--serif); font-weight:700; font-size:14.5px; color:var(--ink); }
    #chart-capexlamp .lamp-tag { font-family:var(--mono); font-size:9px; letter-spacing:.12em; margin-left:6px; }
    #chart-capexlamp .lamp-note { font-size:12px; color:var(--ink-md); line-height:1.65; margin-top:8px; }
    #chart-capexlamp .lamp-verdict { margin-top:14px; padding:10px 14px; border:1px dashed var(--line);
      font-family:var(--mono); font-size:11px; color:var(--ink-md); line-height:1.6; }
    #chart-capexlamp .lamp-verdict b { color:#c25918; }
    `;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    const grid = document.createElement("div"); grid.className = "lamp-grid"; lb.appendChild(grid);

    const LAMPS = [
      { name: "Microsoft", cls: "", dot: P.ink, tag: "较干净", col: P.ink },
      { name: "Alphabet", cls: "", dot: P.ink, tag: "较干净", col: P.ink },
      { name: "Amazon", cls: "orange", dot: "#c25918", tag: "橙灯 · 现金压力最高", col: "#c25918" },
      { name: "Meta", cls: "amber", dot: P.amber, tag: "黄灯 · 后置爬坡", col: P.amber },
    ];
    const cards = [];
    LAMPS.forEach(L => {
      const co = capex.companies.find(c => c.name === L.name);
      const el = document.createElement("div");
      el.className = "lamp-card " + L.cls;
      el.setAttribute("data-drill-keep", "1");
      el.innerHTML =
        `<div><span class="lamp-dot" style="background:${L.dot}"></span>` +
        `<span class="lamp-co">${L.name}</span><span class="lamp-tag" style="color:${L.col}">${L.tag}</span></div>` +
        `<div class="lamp-note">${U.esc(co ? co.note : "")}</div>`;
      el.addEventListener("click", e => U.showDrill({
        title: `灯号 · ${L.name}（${L.tag}）`,
        value: co ? `2026E ~$${co.fy2026e}B · FY2025 $${co.fy2025}B` : "",
        sub: co ? co.note : "", source: "公司披露 · 券商研究", x: e.clientX, y: e.clientY }));
      grid.appendChild(el);
      cards.push(el);
    });
    const vd = document.createElement("div");
    vd.className = "lamp-verdict";
    vd.innerHTML = `<b>裁决：</b>${U.esc(capex.drill.sub)}`;
    lb.appendChild(vd);
    cards.forEach(c => c.classList.add("rv")); vd.classList.add("rv");
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      [...cards, vd].forEach((c, i) => setTimeout(() => c.classList.add("in"), i * 110));
    }, { threshold: 0.2 });
    io.observe(grid);
  }
})();
