// §10 AI 数据中心利润桥三公司瀑布（宿主 #chart-aidc）
// 润泽 / 奥飞 / 数据港三联瀑布：客户背书 MW × 上架率 × 单 MW 毛利 − 折旧 − 财务费用 → 扣非净利。
// 桥形为结构示意（不表比例），全部数字注记从 figures 字段解析，点公司下钻扣非口径。
// 数据：RPT.aidcBridge。
(() => {
  const host = document.getElementById("chart-aidc");
  if (!host || !window.RPT || !window.U || !window.d3) return;
  const D = RPT.aidcBridge;
  if (!D || !D.companies) return;
  const body = U.frame(host, {
    title: "AI 数据中心利润桥：三家公司，三种桥",
    sub: D.formula + " · 桥形为结构示意、不表比例，数字以注记与下钻口径为准 · 点击公司下钻扣非口径注记",
    src: "官方披露 · 2025 年报",
  });

  const P = U.PAL;
  const css = `
  #chart-aidc .ab-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
  #chart-aidc .ab-grid{display:flex;gap:16px;min-width:880px}
  #chart-aidc .ab-card{flex:1 1 0;border:1px solid var(--line);background:var(--paper);padding:14px 16px 12px;
    cursor:pointer;transition:box-shadow .16s ease,transform .16s ease}
  #chart-aidc .ab-card:hover{box-shadow:0 10px 26px rgba(10,31,51,.12);transform:translateY(-2px)}
  #chart-aidc .ab-name{font-family:var(--serif);font-weight:900;font-size:16px;color:var(--ink)}
  #chart-aidc .ab-figs{font-size:11.5px;color:var(--ink-md);line-height:1.65;margin-top:8px;
    border-top:1px dashed var(--line);padding-top:8px}
  #chart-aidc .ab-note{font-size:11px;color:var(--ink-lo);line-height:1.55;margin-top:6px}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const scroll = document.createElement("div"); scroll.className = "ab-scroll";
  const grid = document.createElement("div"); grid.className = "ab-grid";
  scroll.appendChild(grid); body.appendChild(scroll);

  // 桥形剖面：结构示意（几何布局，非数字声明）
  const PROF = {
    anchor:    { ups: [0.45, 0.30, 0.25], downs: [0.22, 0.18] },   // 润泽：全桥，扣非锚点
    leveraged: { ups: [0.45, 0.28, 0.22], downs: [0.20, 0.42] },   // 奥飞：财务费用大缺口
    option:    { ups: [0.40, 0.26, 0.19], downs: [0.25, 0.48] },   // 数据港：落点很薄（期权）
  };
  const STAGE = ["背书 MW", "× 上架率", "× 单 MW 毛利", "− 折旧", "− 财务费用", "扣非净利"];
  const keyOf = c => /奥飞/.test(c.name) ? "leveraged" : /数据港/.test(c.name) ? "option" : "anchor";

  const VW = 340, VH = 296, BASE = 196, H0 = 158, TOP = 30;
  const STEP = VW / 6, BARW = 34;

  const cards = [];
  D.companies.forEach((c, ci) => {
    const key = keyOf(c);
    const prof = PROF[key];
    const card = document.createElement("div");
    card.className = "ab-card";
    card.setAttribute("data-drill-keep", "1");

    const nm = document.createElement("p");
    nm.className = "ab-name"; nm.textContent = c.name;
    card.appendChild(nm);

    const svg = d3.select(document.createElementNS(U.NS, "svg"))
      .attr("viewBox", `0 0 ${VW} ${VH}`)
      .style("width", "100%").style("display", "block").style("margin-top", "6px");
    card.appendChild(svg.node());

    const y = v => BASE - v * H0;
    const x = i => i * STEP + (STEP - BARW) / 2;

    // 基线
    svg.append("line")
      .attr("x1", 4).attr("x2", VW - 4).attr("y1", BASE).attr("y2", BASE)
      .attr("stroke", P.ink).attr("stroke-width", 1.1);

    // 累积桥
    let cum = 0;
    const bars = [];
    prof.ups.forEach((u, i) => {
      bars.push({ i, from: cum, to: cum + u, kind: "up" }); cum += u;
    });
    prof.downs.forEach((d, i) => {
      bars.push({ i: prof.ups.length + i, from: cum, to: cum - d, kind: "down" }); cum -= d;
    });
    bars.push({ i: 5, from: 0, to: cum, kind: "final" });

    const fillOf = b =>
      b.kind === "up" ? "rgba(34,81,255,.16)" :
      b.kind === "down" ? "rgba(194,47,78,.13)" :
      key === "anchor" ? P.blue : key === "leveraged" ? "rgba(194,47,78,.2)" : "none";
    const strokeOf = b =>
      b.kind === "up" ? P.blue : b.kind === "down" ? P.red :
      key === "anchor" ? P.blue : key === "leveraged" ? P.red : P.inkLo;

    // 级间虚线连接
    bars.slice(0, -1).forEach((b, k) => {
      const nxt = bars[k + 1];
      const lvl = b.kind === "final" ? b.to : b.to;
      svg.append("line")
        .attr("x1", x(b.i) + BARW).attr("x2", x(nxt.i))
        .attr("y1", y(lvl)).attr("y2", y(lvl))
        .attr("stroke", P.inkLo).attr("stroke-width", 0.8).attr("stroke-dasharray", "3 3")
        .attr("opacity", 0).attr("class", "conn");
    });

    bars.forEach(b => {
      const r = svg.append("rect")
        .attr("x", x(b.i)).attr("width", BARW)
        .attr("y", BASE).attr("height", 0)
        .attr("fill", fillOf(b))
        .attr("stroke", strokeOf(b)).attr("stroke-width", 1)
        .attr("stroke-dasharray", b.kind === "final" && key === "option" ? "4 3" : null)
        .attr("class", "bar")
        .attr("data-y0", y(Math.max(b.from, b.to)))
        .attr("data-h", Math.abs(y(b.to) - y(b.from)));
    });

    // 阶段标签（斜排）
    STAGE.forEach((s, i) => {
      svg.append("text")
        .attr("x", x(i) + BARW / 2).attr("y", BASE + 12)
        .attr("text-anchor", "end")
        .attr("transform", `rotate(-28 ${x(i) + BARW / 2} ${BASE + 12})`)
        .attr("style", `font:8.5px ${U.FONTS.mono};fill:${P.inkLo}`)
        .attr("class", "stage").attr("opacity", 0)
        .text(s);
    });

    // 终值注记：全部从 figures / note 字段解析，不硬编码
    const fin = bars[bars.length - 1];
    let finLabel = "";
    if (key === "anchor") {
      const m = c.figures.match(/扣非\s*([0-9.]+)\s*亿/);
      finLabel = m ? `扣非 ${m[1]} 亿` : c.note;
    } else {
      finLabel = String(c.note || "").split(/[，。：:]/)[0];
    }
    svg.append("text")
      .attr("x", x(5) + BARW / 2).attr("y", y(fin.to) - 8)
      .attr("text-anchor", "middle")
      .attr("style", `font:700 10.5px ${U.FONTS.mono};fill:${key === "anchor" ? P.blue : key === "leveraged" ? P.red : P.inkMd}`)
      .attr("class", "finlab").attr("opacity", 0)
      .text(finLabel);

    // 财务费用缺口注记（奥飞型）：从 figures 解析
    const fm = c.figures.match(/财务费用\/收入\s*([0-9.]+%)/);
    if (fm) {
      const b = bars[4];
      svg.append("text")
        .attr("x", x(4) + BARW / 2).attr("y", y(b.from) - 8)
        .attr("text-anchor", "middle")
        .attr("style", `font:700 9.5px ${U.FONTS.mono};fill:${P.red}`)
        .attr("class", "finlab").attr("opacity", 0)
        .text(fm[1]);
    }

    const figs = document.createElement("p");
    figs.className = "ab-figs"; figs.textContent = c.figures;
    card.appendChild(figs);
    const nt = document.createElement("p");
    nt.className = "ab-note"; nt.textContent = c.note;
    card.appendChild(nt);

    card.addEventListener("click", e => U.showDrill({
      title: c.drill.title, value: c.drill.value, sub: c.drill.sub,
      source: c.drill.source, x: e.clientX, y: e.clientY }));

    grid.appendChild(card);
    cards.push({ card, svg, ci });
  });

  // 入场： bars 生长 + 注记淡入
  cards.forEach(c => c.card.classList.add("rv"));
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    cards.forEach(({ card, svg, ci }) => {
      setTimeout(() => card.classList.add("in"), ci * 130);
      svg.selectAll("rect.bar").each(function (_, k) {
        const r = d3.select(this);
        r.transition().delay(200 + ci * 160 + k * 110).duration(520).ease(d3.easeCubicOut)
          .attr("y", +r.attr("data-y0")).attr("height", +r.attr("data-h"));
      });
      svg.selectAll("line.conn").transition().delay(320 + ci * 160).duration(500).attr("opacity", 1);
      svg.selectAll("text.stage").transition().delay(500 + ci * 160).duration(400).attr("opacity", 1);
      svg.selectAll("text.finlab").transition().delay(1000 + ci * 160).duration(420).attr("opacity", 1);
    });
  }, { threshold: 0.15 });
  io.observe(scroll);
})();
