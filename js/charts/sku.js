// §4 AI 收入口径三层分层图（宿主 #chart-sku）
// 约 20 行同口径证据，按"单独定价并核算 / 受 AI 带动但未单独计费 / 无披露"三层分带；
// 实心墨 = 官方披露/管理层口径，空心蓝 = 媒体报道与测算；第一层带量级柱（对数刻度，仅示量级）。
// 点击任意行下钻口径明细。数据：RPT.skuEvidence。
(() => {
  const host = document.getElementById("chart-sku");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "AI 收入口径三层分层：单独定价 / 受带动 / 无披露",
    sub: "三层口径即证据 · ■ 官方披露与管理层口径 □ 媒体报道与测算 · 点击任意行下钻口径与日期",
    src: "官方披露 · 管理层口径 · 券商研究 · 媒体报道与访谈 · 截至 2026-07-17",
  });

  const P = U.PAL;
  const D = RPT.skuEvidence;
  const TIER0 = D.tiers[0]; // 单独定价并核算

  // 从 value 文本解析可绘柱的数值（仅第一层绘制；$B 与 亿元 按披露原值入对数刻度，仅示量级）
  const parseAmount = v => {
    let m = String(v).match(/\$\s*([\d,.]+)\s*([BTM])/i);
    if (m) {
      const n = parseFloat(m[1].replace(/,/g, ""));
      const mult = { B: 1, T: 1000, M: 0.001 }[m[2].toUpperCase()];
      return n * mult;
    }
    m = String(v).match(/([\d,.]+)\s*亿元/);
    if (m) return parseFloat(m[1].replace(/,/g, ""));
    return null;
  };
  const amounts = D.rows.map(r => (r.tier === TIER0 ? parseAmount(r.value) : null));
  const valid = amounts.filter(a => a != null && a > 0);
  const logMin = Math.log10(Math.min(...valid));
  const logMax = Math.log10(Math.max(...valid));
  const barLen = a => U.clamp((Math.log10(a) - logMin) / (logMax - logMin), 0, 1);

  // 分组
  const groups = D.tiers.map(t => ({ name: t, rows: D.rows.map((r, i) => ({ r, i })).filter(o => o.r.tier === t) }));

  // ── SVG ──
  const ROW_H = 36, HEAD_H = 34, TOP = 8, BOT = 10;
  const H = TOP + groups.reduce((s, g) => s + HEAD_H + g.rows.length * ROW_H, 0) + BOT;
  const W = 1080, ML = 232, BARX = 250, BARW = 330, VALX = 610;

  const sc = document.createElement("div");
  sc.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(sc);
  const svg = d3.select(sc).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%").style("min-width", "760px").style("display", "block")
    .attr("data-drill-keep", "1");

  const animated = [];
  let y = TOP;
  groups.forEach((g, gi) => {
    // 层标题带
    const hy = y;
    svg.append("rect")
      .attr("x", 0).attr("y", hy).attr("width", W).attr("height", HEAD_H - 8)
      .attr("fill", gi === 0 ? "rgba(34,81,255,.05)" : "rgba(10,31,51,.03)");
    svg.append("rect")
      .attr("x", 0).attr("y", hy).attr("width", 3).attr("height", HEAD_H - 8)
      .attr("fill", gi === 0 ? P.blue : gi === 1 ? P.inkMd : P.inkLo);
    svg.append("text")
      .attr("x", 14).attr("y", hy + 17)
      .attr("style", `font:700 12.5px ${U.FONTS.serif};fill:${P.ink}`)
      .text(g.name);
    svg.append("text")
      .attr("x", W - 12).attr("y", hy + 17)
      .attr("text-anchor", "end")
      .attr("style", `font:9.5px ${U.FONTS.mono};fill:${P.inkLo}`)
      .text(`${g.rows.length} 行`);
    y += HEAD_H;

    g.rows.forEach((o, ri) => {
      const { r, i } = o;
      const ry = y + ri * ROW_H;
      const gRow = svg.append("g").style("cursor", "pointer");
      // 行热区 + 悬停
      gRow.append("rect")
        .attr("x", 0).attr("y", ry).attr("width", W).attr("height", ROW_H - 4)
        .attr("fill", "transparent");
      gRow.on("mouseenter", function () {
        d3.select(this).select("rect").attr("fill", "rgba(34,81,255,.045)");
        U.showTip(`<b>${U.esc(r.company)} · ${U.esc(r.product)}</b><br>${U.esc(r.value)}`, ...tipXY(this));
      });
      gRow.on("mouseleave", function () {
        d3.select(this).select("rect").attr("fill", "transparent");
        U.hideTip();
      });
      gRow.on("click", e => U.showDrill({
        title: `${r.company} · ${r.product}`,
        value: r.value,
        sub: `${r.tier}${r.detail ? "——" + r.detail : ""}`,
        source: r.source, x: e.clientX, y: e.clientY }));

      // 来源分色方块：实心墨 = 官方/管理层，空心蓝 = 媒体测算
      if (r.official) {
        gRow.append("rect")
          .attr("x", 14).attr("y", ry + (ROW_H - 4) / 2 - 5).attr("width", 10).attr("height", 10)
          .attr("fill", P.ink);
      } else {
        gRow.append("rect")
          .attr("x", 14).attr("y", ry + (ROW_H - 4) / 2 - 5).attr("width", 10).attr("height", 10)
          .attr("fill", "none").attr("stroke", P.blue).attr("stroke-width", 1.4);
      }
      // 公司 + 产品
      gRow.append("text")
        .attr("x", 32).attr("y", ry + (ROW_H - 4) / 2 - 1)
        .attr("style", `font:700 12px ${U.FONTS.serif};fill:${P.ink}`)
        .text(r.company);
      gRow.append("text")
        .attr("x", 32).attr("y", ry + (ROW_H - 4) / 2 + 13)
        .attr("style", `font:9.5px ${U.FONTS.mono};fill:${P.inkLo}`)
        .text(r.product);
      // 量级柱（仅第一层、数值可解析者；媒体测算用空心蓝柱）
      const a = amounts[i];
      if (a != null) {
        const len = 8 + barLen(a) * (BARW - 20);
        const bar = gRow.append("rect")
          .attr("x", BARX).attr("y", ry + (ROW_H - 4) / 2 - 6).attr("height", 12)
          .attr("width", 0).attr("rx", 1.5);
        if (r.official) bar.attr("fill", P.ink).attr("opacity", 0.82);
        else bar.attr("fill", P.blueSoft).attr("stroke", P.blue).attr("stroke-width", 1.2).attr("stroke-dasharray", "3 2");
        const S = 0.15 + (ri + gi * 4) * 0.05;
        animated.push({ start: S, dur: 0.7, set: p => bar.attr("width", len * p) });
      }
      // 证据值
      gRow.append("text")
        .attr("x", VALX).attr("y", ry + (ROW_H - 4) / 2 + 4)
        .attr("style", `font:10.5px ${U.FONTS.mono};fill:${r.official ? P.inkMd : P.blue}`)
        .text(r.value.length > 44 ? r.value.slice(0, 43) + "…" : r.value);
    });
    y += g.rows.length * ROW_H;
  });

  function tipXY(el) {
    const r = el.getBoundingClientRect();
    return [r.left + r.width * 0.4, r.top + 10];
  }

  // ── 口径注 + 增速对照（DOM）──
  const note = document.createElement("div");
  note.style.cssText = `margin-top:12px;padding:9px 12px;border:1px dashed ${P.line};
    font:11px ${U.FONTS.mono};color:${P.inkMd};line-height:1.7`;
  note.textContent = D.tierNote + " 第一层柱长按披露数值（对数刻度）绘制，含季度口径与美元/人民币两种币别，仅示量级，不作横向比较。";
  body.appendChild(note);

  if (D.growthStrip && D.growthStrip.length) {
    const strip = document.createElement("div");
    strip.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;align-items:center;cursor:pointer";
    strip.setAttribute("data-drill-keep", "1");
    const cap = document.createElement("span");
    cap.style.cssText = `font:9.5px ${U.FONTS.mono};color:${P.inkLo};letter-spacing:.14em`;
    cap.textContent = "增速对照（同比）";
    strip.appendChild(cap);
    D.growthStrip.forEach(s => {
      const chip = document.createElement("span");
      chip.style.cssText = `font:11px ${U.FONTS.mono};color:${P.ink};border:1px solid ${P.line};
        padding:4px 10px;border-radius:3px`;
      chip.innerHTML = `${U.esc(s.name)} <b style="color:${P.blue}">${U.esc(s.growth)}</b>`;
      strip.appendChild(chip);
    });
    strip.addEventListener("click", e => U.showDrill({
      title: "单独定价 AI 产品增速对照（同比）",
      value: D.growthStrip.map(s => `${s.name} ${s.growth}`).join(" · "),
      sub: "增速口径各异（收入/年化收入），仅作对照；逐行口径与日期见上方各行下钻。",
      source: "官方披露 · 媒体报道与访谈 · 截至 2026-07-17", x: e.clientX, y: e.clientY }));
    body.appendChild(strip);
  }

  U.play(animated, svg.node(), { threshold: 0.12 });
})();
