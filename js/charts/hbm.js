// §6 单卡内存容量阶梯链（宿主 #chart-hbm）
// 阶梯链：H100 80GB → Rubin Ultra 1TB，柱高 ∝ 单卡内存容量（线性， honest 比例）；
// 墨 = 已发布代际，电蓝 = 当前一代，空心虚线 = 路线图（未发布）；
// 级间虚线箭头标倍数（由容量字符串解析计算，不硬编码）。数据：RPT.hbmLadder。
(() => {
  const host = document.getElementById("chart-hbm");
  if (!host || !window.RPT || !RPT.hbmLadder) return;

  const P = U.PAL, MONO = U.FONTS.mono, SERIF = U.FONTS.serif, S = U.svgEl;
  const steps = RPT.hbmLadder;

  const body = U.frame(host, {
    title: "单卡内存容量阶梯链 · " + steps[0].capacity + " → " + steps[steps.length - 1].capacity + "，上限只升不降",
    sub: "柱高 ∝ 单卡内存容量（GB，线性）· 空心虚线 = 路线图（未发布）· 点击任意一代下钻带宽与标准注记",
    src: "官方披露 · 官方路线图",
  });

  const st = document.createElement("style");
  st.textContent = "#chart-hbm .cf-body{overflow-x:auto}#chart-hbm svg{min-width:680px;display:block}";
  document.head.appendChild(st);

  // 容量字符串 → GB 数值（"288GB HBM4" → 288；"1TB HBM4e" → 1024）
  const capGB = s => {
    const m = String(s || "").match(/([\d.]+)\s*(TB|GB)/i);
    if (!m) return 0;
    return +m[1] * (/tb/i.test(m[2]) ? 1024 : 1);
  };

  const W = 1080, ML = 56, MR = 56, TOP = 64, BOT = 64;
  const H = 470, BASE = H - BOT, MAXH = H - TOP - BOT - 44;
  const n = steps.length, colW = (W - ML - MR) / n;
  const data = steps.map((d, i) => ({ ...d, i, gb: capGB(d.capacity) }));
  const maxGB = Math.max(...data.map(d => d.gb), 1);
  const hOf = gb => Math.max(14, gb / maxGB * MAXH);

  // 代际状态：末代 = 路线图（空心虚线）；次末 = 当前一代（电蓝）；其余 = 墨
  const styleOf = i => (i === n - 1 ? "roadmap" : i === n - 2 ? "current" : "past");

  const svg = S("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", "data-drill-keep": "1" });
  body.appendChild(svg);
  const animated = [];

  // 基线
  const bl = S("line", { x1: ML - 10, y1: BASE, x2: W - MR + 10, y2: BASE, stroke: P.ink, "stroke-width": 1.2 });
  svg.appendChild(bl);
  // 纵轴语义小注
  const cap0 = S("text", { x: ML - 10, y: TOP - 30, style: `font:9.5px ${MONO};fill:${P.inkLo}` });
  cap0.textContent = "单卡内存容量上限（GB）";
  svg.appendChild(cap0);

  const tops = [];
  data.forEach(d => {
    const cx = ML + d.i * colW + colW / 2;
    const bw = Math.min(150, colW - 44);
    const h = hOf(d.gb), y = BASE - h, x0 = cx - bw / 2;
    const mode = styleOf(d.i);
    tops.push({ x: cx + bw / 2, y, x0, bw });

    // 台阶
    const rect = S("rect", mode === "roadmap"
      ? { x: x0, y: BASE, width: bw, height: 0, fill: P.paper, stroke: P.blue, "stroke-width": 1.6, "stroke-dasharray": "6 4", rx: 2 }
      : { x: x0, y: BASE, width: bw, height: 0, fill: mode === "current" ? P.blue : P.ink, rx: 2 });
    rect.style.cursor = "pointer";
    svg.appendChild(rect);
    animated.push({ start: 0.12 + d.i * 0.18, dur: 0.55,
      set: p => { rect.setAttribute("y", BASE - h * p); rect.setAttribute("height", h * p); } });

    // 台阶上方：代际 / 容量 / 带宽
    const col = mode === "past" ? P.ink : P.blue;
    const g1 = S("text", { x: cx, y: y - 46, "text-anchor": "middle",
      style: `font:700 13px ${SERIF};fill:${P.ink}` });
    g1.textContent = d.gen;
    const g2 = S("text", { x: cx, y: y - 24, "text-anchor": "middle",
      style: `font:700 16px ${MONO};fill:${col}` });
    g2.textContent = d.capacity;
    svg.appendChild(g1); svg.appendChild(g2);
    const labs = [g1, g2];
    if (d.bandwidth) {
      const g3 = S("text", { x: cx, y: y - 9, "text-anchor": "middle",
        style: `font:9.5px ${MONO};fill:${P.inkMd}` });
      g3.textContent = d.bandwidth;
      svg.appendChild(g3); labs.push(g3);
    }
    // 路线图标记
    if (mode === "roadmap") {
      const rm = S("text", { x: cx, y: y + 16, "text-anchor": "middle",
        style: `font:8.5px ${MONO};fill:${P.blue}` });
      rm.textContent = "路线图（未发布）";
      rm.style.pointerEvents = "none"; // 不挡台阶点击
      svg.appendChild(rm); labs.push(rm);
    }
    labs.forEach((t, k) => animated.push({ start: 0.45 + d.i * 0.18 + k * 0.05, dur: 0.3, set: p => t.setAttribute("opacity", p) }));

    // 年份（基线下）
    const yl = S("text", { x: cx, y: BASE + 22, "text-anchor": "middle",
      style: `font:10.5px ${MONO};fill:${P.inkLo}` });
    yl.textContent = d.year;
    svg.appendChild(yl);
    animated.push({ start: 0.5 + d.i * 0.18, dur: 0.3, set: p => yl.setAttribute("opacity", p) });

    rect.addEventListener("click", e => U.showDrill({
      title: "单卡内存 · " + d.gen + "（" + d.year + "）",
      // value 补全：容量 + 带宽 + 级间倍数（全部由数据推算/引用）
      value: "单卡内存上限 " + d.capacity + (d.bandwidth ? " · 带宽 " + d.bandwidth : "") +
        (d.i > 0 ? "（较上一代 " + steps[d.i - 1].gen + " " + steps[d.i - 1].capacity + " 提升 ×" +
          (capGB(d.capacity) / Math.max(1e-9, capGB(steps[d.i - 1].capacity))).toFixed(1) + "）" : ""),
      // sub 补全：无注记代际给阶梯链定位句
      sub: d.note || "单卡内存容量上限持续抬升，驱动瓶颈沿 GPU → 内存 → 封装 → 电力单向迁移（见四棒接力图）。",
      source: "官方披露 · 官方路线图 · 截至 2026-07-17",
      x: e.clientX, y: e.clientY }));
  });

  // ── 代际注记（原只藏下钻：HBM4 标准要点 / 单柜功耗，提到图面脚注）──
  {
    const noted = data.filter(d => d.note);
    if (noted.length) {
      const ny = BASE + 40;
      const seen = [];
      noted.forEach(d => d.note.split(/；|。/).map(s2 => s2.trim()).filter(Boolean)
        .forEach(t => { if (!seen.includes(t)) seen.push(t); }));
      seen.slice(0, 2).forEach((t, k) => {
        const nt = S("text", { x: ML - 10, y: ny + k * 15,
          style: `font:8.5px ${MONO};fill:${P.inkLo}`, opacity: 0 });
        nt.textContent = "注 " + t + (k === seen.slice(0, 2).length - 1 && !/。$/.test(t) ? "。" : "");
        svg.appendChild(nt);
        animated.push({ start: 1.2 + k * 0.1, dur: 0.3, set: p => nt.setAttribute("opacity", p) });
      });
    }
  }

  // 级间倍数箭头（由解析容量计算）
  for (let i = 0; i < n - 1; i++) {
    const a = tops[i], b = tops[i + 1];
    const ratio = data[i + 1].gb / Math.max(1e-9, data[i].gb);
    const x1 = a.x0 + a.bw + 4, x2 = b.x0 - 4;
    const y1 = a.y - 4, y2 = b.y - 4;
    const ln = S("line", { x1, y1, x2: x1, y2: y1,
      stroke: P.inkMd, "stroke-width": 1, "stroke-dasharray": "4 3" });
    svg.appendChild(ln);
    const ah = S("path", { d: `M ${x2} ${y2} l -6 -3.5 l 0 7 Z`, fill: P.inkMd, opacity: 0 });
    svg.appendChild(ah);
    const ml = S("text", { x: (x1 + x2) / 2, y: Math.min(y1, y2) - 8, "text-anchor": "middle",
      style: `font:700 10px ${MONO};fill:${P.inkMd}`, opacity: 0 });
    ml.textContent = "×" + ratio.toFixed(1);
    svg.appendChild(ml);
    const S0 = 0.5 + i * 0.18;
    animated.push({ start: S0, dur: 0.4, set: p => { ln.setAttribute("x2", x1 + (x2 - x1) * p); ln.setAttribute("y2", y1 + (y2 - y1) * p); } });
    animated.push({ start: S0 + 0.35, dur: 0.2, set: p => { ah.setAttribute("opacity", p); ml.setAttribute("opacity", p); } });
  }

  U.play(animated, svg, { threshold: 0.2 });
})();
