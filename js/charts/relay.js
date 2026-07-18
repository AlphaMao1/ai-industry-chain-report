// §6 四棒接力图（宿主 #chart-relay，全报告主视觉之一）
// 2022→2030 时间轴上四条色带接力：GPU → 高带宽内存 → 先进封装 → 电力。
// 每棒：左槽标棒次与时段、色带内标在位者、带下两行标利润峰值与迁移触发事件
// （图面截断，全文在下钻卡）；电蓝 = 当前接棒环节；底部并列 B 面注记。
// 数据：RPT.relay + RPT.hardness.bside + RPT.meta.asof（"现在"刻度线）。
(() => {
  const host = document.getElementById("chart-relay");
  if (!host || !window.RPT || !RPT.relay) return;
  const body = U.frame(host, {
    title: "四棒接力 · 稀缺利润沿 GPU → 内存 → 先进封装 → 电力单向迁移",
    sub: "2022→2030 · 色带内 = 在位者 · 带下两行 = 利润峰值 / 迁移触发 · 点击色带下钻 · 电蓝 = 当前接棒",
    src: "官方披露 · 行业机构 · 券商研究",
  });

  const P = U.PAL, MONO = U.FONTS.mono, SERIF = U.FONTS.serif, S = U.svgEl;

  // 移动端横滚容器：最小渲染宽
  const st = document.createElement("style");
  st.textContent = "#chart-relay .cf-body{overflow-x:auto}#chart-relay svg{min-width:780px;display:block}";
  document.head.appendChild(st);

  // period 字符串 → [起, 止] 年份（"2022 末–2023" / "2024–" / "2025 下半年–"，开口端接到图右缘）
  const parsePeriod = (s, endDefault) => {
    const seg = String(s || "").split(/[–—-]/).map(t => t.trim()).filter(Boolean);
    const dec = t => {
      const m = t.match(/(\d{4})/);
      if (!m) return null;
      let v = +m[1];
      if (/末|年底/.test(t)) v += 0.9;
      else if (/下半年/.test(t)) v += 0.5;
      else if (/年中/.test(t)) v += 0.45;
      else if (/上半年|年初|初/.test(t)) v += 0.04;
      return v;
    };
    const a = dec(seg[0] || "");
    const b = seg[1] ? dec(seg[1]) : null;
    return [a == null ? 2022 : a, b == null ? endDefault : b + 0.99];
  };

  const X0 = 2022, X1 = 2030.6;
  // "现在"刻度：由数据截至日推出（不硬编码日期）
  const asofM = String((RPT.meta && RPT.meta.asof) || "").match(/(\d{4})-(\d{2})-(\d{2})/);
  const asof = asofM ? +asofM[1] + (+asofM[2] - 1) / 12 + (+asofM[3]) / 365 : null;
  const asofLabel = asofM ? asofM[1] + "-" + asofM[2] : "";

  const W = 1180, ML = 132, MR = 30, TOP = 30, LANE = 96, BAND_H = 34;
  const legs = RPT.relay.map((r, i) => {
    const [a, b] = parsePeriod(r.period, X1 - 0.15);
    return { ...r, i, a, b: Math.min(b, X1 - 0.15) };
  });
  const axisY = TOP + legs.length * LANE + 16;
  const H = axisY + 92;
  const x = yr => ML + (yr - X0) / (X1 - X0) * (W - ML - MR);

  // 一图一族：墨 → 浅蓝 → 深蓝 → 电蓝（当前接棒 = 电蓝），带上文字色随底
  const FILL = [P.inkMd, P.blueLo, P.blueHi, P.blue];
  const ON = [P.paperHi, P.ink, P.paperHi, P.paperHi];
  const trunc = (s, n) => { s = String(s || ""); return s.length > n ? s.slice(0, n) + "…" : s; };

  const svg = S("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", "data-drill-keep": "1" });
  body.appendChild(svg);
  const animated = [];

  // ── 年份刻度与主轴 ──
  for (let yr = 2022; yr <= 2030; yr++) {
    const tx = x(yr);
    const grid = S("line", { x1: tx, y1: TOP - 6, x2: tx, y2: axisY, stroke: P.lineLo, "stroke-width": 1 });
    svg.appendChild(grid);
    const lb = S("text", { x: tx, y: axisY + 22, "text-anchor": "middle",
      style: `font:10px ${MONO};fill:${P.inkLo};letter-spacing:.1em` });
    lb.textContent = yr;
    svg.appendChild(lb);
  }
  const ax = S("line", { x1: x(X0), y1: axisY, x2: x(X1), y2: axisY, stroke: P.ink, "stroke-width": 1.2 });
  svg.appendChild(ax);
  animated.push({ start: 0, dur: 0.7, set: p => ax.setAttribute("x2", x(X0) + (x(X1) - x(X0)) * p) });

  // "现在"刻度线（数据截至）
  if (asof) {
    const now = S("line", { x1: x(asof), y1: TOP - 6, x2: x(asof), y2: axisY,
      stroke: P.inkLo, "stroke-width": 1, "stroke-dasharray": "3 4" });
    svg.appendChild(now);
    const nl = S("text", { x: x(asof) + 6, y: TOP - 12,
      style: `font:9px ${MONO};fill:${P.inkLo}` });
    nl.textContent = "数据截至 " + asofLabel;
    svg.appendChild(nl);
    animated.push({ start: 1.4, dur: 0.4, set: p => { now.setAttribute("opacity", p); nl.setAttribute("opacity", p); } });
  }

  // ── 四条接力色带 ──
  legs.forEach(leg => {
    const y0 = TOP + leg.i * LANE;
    const bx0 = x(leg.a), bx1 = x(leg.b), bw = Math.max(8, bx1 - bx0);
    const cy = y0 + BAND_H / 2;
    const fill = FILL[leg.i % FILL.length];
    const on = ON[leg.i % ON.length];

    // 左槽：棒次 + 时段
    const rk = S("text", { x: ML - 14, y: y0 + 14, "text-anchor": "end",
      style: `font:700 11px ${MONO};fill:${fill};letter-spacing:.06em` });
    rk.textContent = "第" + leg.rank + "棒";
    svg.appendChild(rk);
    const pd = S("text", { x: ML - 14, y: y0 + 30, "text-anchor": "end",
      style: `font:9px ${MONO};fill:${P.inkLo}` });
    pd.textContent = leg.period;
    svg.appendChild(pd);

    // 色带
    const band = S("rect", { x: bx0, y: y0, width: 0, height: BAND_H, rx: 3, fill });
    band.style.cursor = "pointer";
    svg.appendChild(band);
    animated.push({ start: 0.25 + leg.i * 0.35, dur: 0.8, set: p => band.setAttribute("width", bw * p) });

    // 带内：名称（左）+ 在位者（右）
    const nm = S("text", { x: bx0 + 12, y: cy + 5,
      style: `font:700 14px ${SERIF};fill:${on}` });
    nm.textContent = leg.name;
    nm.style.cursor = "pointer"; nm.style.pointerEvents = "none";
    svg.appendChild(nm);
    const inc = S("text", { x: bx1 - 12, y: cy + 4, "text-anchor": "end",
      style: `font:10px ${MONO};fill:${on}` });
    inc.textContent = "在位者：" + leg.incumbent;
    inc.style.pointerEvents = "none";
    if (bw >= 200) svg.appendChild(inc); // 窄带（GPU）不塞在位者，全文在下钻
    [nm].forEach(t => animated.push({ start: 0.55 + leg.i * 0.35, dur: 0.4, set: p => t.setAttribute("opacity", p) }));
    if (bw >= 200) animated.push({ start: 0.55 + leg.i * 0.35, dur: 0.4, set: p => inc.setAttribute("opacity", p) });

    // 接棒菱形（第 2 棒起，落在带左缘）
    if (leg.i > 0) {
      const d = S("path", { d: `M ${bx0} ${cy - 6} L ${bx0 + 6} ${cy} L ${bx0} ${cy + 6} L ${bx0 - 6} ${cy} Z`,
        fill: P.paperHi, stroke: fill, "stroke-width": 1.6 });
      d.style.pointerEvents = "none";
      svg.appendChild(d);
      animated.push({ start: 0.5 + leg.i * 0.35, dur: 0.3, set: p => d.setAttribute("opacity", p) });
    }

    // 带下两行：利润峰值 / 迁移触发（图面截断，全文在下钻）
    const a1 = S("text", { x: bx0 + 2, y: y0 + BAND_H + 17,
      style: `font:9.5px ${MONO};fill:${P.inkMd}` });
    a1.textContent = "利润峰值  " + trunc(leg.profitPeak, 62);
    const a2 = S("text", { x: bx0 + 2, y: y0 + BAND_H + 33,
      style: `font:9.5px ${MONO};fill:${P.inkLo}` });
    a2.textContent = "迁移触发  " + trunc(leg.trigger, 62);
    [a1, a2].forEach((t, k) => {
      t.style.cursor = "pointer";
      svg.appendChild(t);
      animated.push({ start: 0.75 + leg.i * 0.35 + k * 0.08, dur: 0.35, set: p => t.setAttribute("opacity", p) });
    });

    // 点击下钻（色带 + 注记行共用）
    const drill = e => U.showDrill({
      title: leg.drill.title, value: leg.drill.value, sub: leg.drill.sub,
      source: leg.drill.source, x: e.clientX, y: e.clientY });
    [band, a1, a2].forEach(el => el.addEventListener("click", drill));
  });

  // ── B 面注记（并列，不藏）：HBM 晶圆收入被普通内存反超 ──
  const bs = String((RPT.hardness && RPT.hardness.bside) || "");
  if (bs) {
    const by = axisY + 46;
    const hl = S("line", { x1: ML, y1: by, x2: W - MR, y2: by, stroke: P.lineLo, "stroke-width": 1 });
    svg.appendChild(hl);
    const mk = S("rect", { x: ML, y: by + 10, width: 8, height: 8, fill: P.red });
    svg.appendChild(mk);
    // 在破折号处拆两行，"B 面"二字语义红加粗
    const m = bs.match(/^B 面：(.+?)——(.+)$/);
    const l1 = m ? m[1] : bs, l2 = m ? m[2] : "";
    const t1 = S("text", { x: ML + 16, y: by + 18, style: `font:10px ${MONO};fill:${P.inkMd}` });
    const sp1 = S("tspan", { style: `font-weight:700;fill:${P.red}` });
    sp1.textContent = "B 面  ";
    const sp2 = S("tspan", {});
    sp2.textContent = l1 + (l2 ? "——" : "");
    t1.appendChild(sp1); t1.appendChild(sp2);
    svg.appendChild(t1);
    if (l2) {
      const t2 = S("text", { x: ML + 16, y: by + 34, style: `font:10px ${MONO};fill:${P.inkMd}` });
      t2.textContent = l2;
      svg.appendChild(t2);
    }
    [hl, mk, t1].forEach((el, k) => animated.push({ start: 1.5 + k * 0.08, dur: 0.4, set: p => el.setAttribute("opacity", p) }));
  }

  U.play(animated, svg, { threshold: 0.2 });
})();
