// §1 任务强度谱系对数阶梯（宿主 #chart-spectrum）
// 对数轴 10⁰→10¹⁰ 六档阶梯：档 = 平台上移一级；"有效强度 / 含浪费总强度"双列切换——
// 含浪费模式在每档右端加斜纹延展区（浪费率区间由 RPT.taskSpectrum.toggle.wasteNote 解析）。
// 点档下钻锚点与日期。数据全部来自 RPT.taskSpectrum。
(() => {
  const host = document.getElementById("chart-spectrum");
  if (!host || !window.RPT || !RPT.taskSpectrum) return;
  const TS = RPT.taskSpectrum;
  const body = U.frame(host, {
    title: "任务强度谱系：一次任务烧多少 token（对数刻度）",
    sub: "阶梯左→右跨 7 个数量级 · 对数刻度 = 把 1、10、100、1,000 画成等间距 · 点击任意档下钻",
    src: "媒体报道与访谈 · 官方披露 · 券商研究",
  });

  const P = U.PAL, MONO = U.FONTS.mono, SERIF = U.FONTS.serif;
  const svgEl = U.svgEl;
  const SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  const dexLab = n => "10" + String(n).split("").map(c => SUP[c] || "").join("");

  // 从 wasteNote 解析浪费率区间（"浪费率 30–72%"）→ 含浪费乘数 dex 位移
  let wasteLo = null, wasteHi = null;
  const m = String(TS.toggle.wasteNote || "").match(/(\d+)\s*[–—-]\s*(\d+)\s*%/);
  if (m) { wasteLo = +m[1] / 100; wasteHi = +m[2] / 100; }
  const dexOf = r => Math.log10(1 / (1 - r));

  // ── 双列切换开关（DOM，挂在图体顶部）──
  const bar = document.createElement("div");
  bar.style.cssText = "display:flex;gap:18px;align-items:baseline;margin-bottom:10px;flex-wrap:wrap";
  body.appendChild(bar);
  let mode = "effective";
  const btns = {};
  [["effective", TS.toggle.effective], ["gross", TS.toggle.gross]].forEach(([k, lab]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = lab;
    b.setAttribute("aria-pressed", k === mode ? "true" : "false");
    b.style.cssText = "background:none;border:none;border-bottom:2px solid " +
      (k === mode ? P.blue : "transparent") + ";padding:2px 1px;cursor:pointer;" +
      `font:700 12px ${MONO};color:${k === mode ? P.blue : P.inkLo};letter-spacing:.06em`;
    b.addEventListener("click", () => { if (mode !== k) { mode = k; refresh(); } });
    bar.appendChild(b);
    btns[k] = b;
  });
  const hint = document.createElement("span");
  hint.style.cssText = `font:9.5px ${MONO};color:${P.inkLo}`;
  hint.textContent = "切换查看 B 面口径";
  bar.appendChild(hint);

  const svgWrap = document.createElement("div");
  svgWrap.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(svgWrap);
  const foot = document.createElement("p");
  foot.style.cssText = `font:10px ${MONO};color:${P.inkMd};margin-top:8px;line-height:1.7`;
  body.appendChild(foot);

  const W = 1080, H = 470, ML = 58, MR = 26, TOP = 30, AXIS_Y = 418;
  const MIN_W = 720;
  const X0 = 0, X1 = 10;
  const xOf = v => ML + (v - X0) / (X1 - X0) * (W - ML - MR);

  let drew = false;   // 首次动画入场，切换后落完成帧
  function refresh() {
    Object.entries(btns).forEach(([k, b]) => {
      const on = k === mode;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.style.borderBottomColor = on ? P.blue : "transparent";
      b.style.color = on ? P.blue : P.inkLo;
    });
    foot.textContent = TS.toggle.wasteNote + (mode === "gross" && TS.wasteMath ? " " + TS.wasteMath : "");
    draw(drew);
    drew = true;
  }

  function draw(final) {
    svgWrap.innerHTML = "";
    const svg = svgEl("svg", {
      width: "100%", height: H, viewBox: `0 0 ${W} ${H}`,
      style: `display:block;min-width:${MIN_W}px`, "data-drill-keep": "1",
    });
    svgWrap.appendChild(svg);
    const animated = [];
    const gross = mode === "gross" && wasteLo != null;

    // ── 对数轴 + 网格 ──
    for (let v = 0; v <= 10; v++) {
      const x = xOf(v);
      svg.appendChild(svgEl("line", { x1: x, y1: TOP - 6, x2: x, y2: AXIS_Y, stroke: P.lineLo }));
      const t = svgEl("text", { x, y: AXIS_Y + 20, "text-anchor": "middle",
        style: `font:10px ${MONO};fill:${v % 3 === 0 ? P.inkMd : P.inkLo}` });
      t.textContent = dexLab(v);
      svg.appendChild(t);
    }
    const ax = svgEl("line", { x1: xOf(X0), y1: AXIS_Y, x2: xOf(X0), y2: AXIS_Y, stroke: P.ink, "stroke-width": 1.2 });
    svg.appendChild(ax);
    animated.push({ start: 0, dur: 0.6, set: p => { ax.setAttribute("x2", xOf(X0) + (xOf(X1) - xOf(X0)) * p); } });
    const axLab = svgEl("text", { x: W - MR, y: AXIS_Y + 36, "text-anchor": "end",
      style: `font:9.5px ${MONO};fill:${P.inkLo}` });
    axLab.textContent = "单次任务 token 消耗（对数刻度）";
    svg.appendChild(axLab);
    animated.push({ start: 0.5, dur: 0.3, set: p => axLab.setAttribute("opacity", p) });

    // 斜纹 pattern（含浪费延展区用；45° 发丝线，非渐变）
    const defs = svgEl("defs", {});
    const pat = svgEl("pattern", { id: "sp-hatch", width: 6, height: 6, patternUnits: "userSpaceOnUse",
      patternTransform: "rotate(45)" });
    pat.appendChild(svgEl("line", { x1: 0, y1: 0, x2: 0, y2: 6, stroke: "rgba(34,81,255,.4)", "stroke-width": 1 }));
    defs.appendChild(pat);
    svg.appendChild(defs);

    // ── 阶梯：档 i 平台高度逐级上移 ──
    const STEP = 56, BAR_H = 42;
    const baseY = AXIS_Y - 14;
    const tiers = TS.tiers;
    tiers.forEach((t, i) => {
      const yTop = baseY - (i + 1) * STEP + (STEP - BAR_H);
      const x0 = xOf(t.logMin), x1 = xOf(t.logMax);
      const S = 0.12 + i * 0.12;
      const g = svgEl("g", { style: "cursor:pointer", role: "button", tabindex: "0" });
      svg.appendChild(g);

      // 立柱（平台左缘自轴升起）
      const col = svgEl("rect", { x: x0, y: yTop, width: 1.2, height: AXIS_Y - yTop, fill: "rgba(10,31,51,.18)" });
      g.appendChild(col);
      animated.push({ start: S, dur: 0.3, set: p => {
        col.setAttribute("y", AXIS_Y - (AXIS_Y - yTop) * p); col.setAttribute("height", (AXIS_Y - yTop) * p);
      } });

      // 平台（有效强度）
      const bar = svgEl("rect", { x: x0, y: yTop, width: 0, height: BAR_H,
        fill: i >= tiers.length - 2 ? "rgba(34,81,255,.12)" : "rgba(10,31,51,.06)",
        stroke: i >= tiers.length - 2 ? P.blue : P.ink, "stroke-width": 1 });
      g.appendChild(bar);
      animated.push({ start: S + 0.08, dur: 0.35, set: p => { bar.setAttribute("width", Math.max(0, (x1 - x0) * p)); } });

      // 含浪费延展区（斜纹，自 logMax 起 +dex(72%)，刻度线标 +dex(30%)）
      let ext = null, tickLo = null;
      if (gross) {
        const xe0 = x1, xe1 = xOf(Math.min(X1, t.logMax + dexOf(wasteHi)));
        ext = svgEl("rect", { x: xe0, y: yTop, width: 0, height: BAR_H,
          fill: "url(#sp-hatch)", stroke: "rgba(34,81,255,.5)", "stroke-width": 0.8, "stroke-dasharray": "3 2" });
        g.appendChild(ext);
        animated.push({ start: S + 0.2, dur: 0.3, set: p => { ext.setAttribute("width", Math.max(0, (xe1 - xe0) * p)); } });
        tickLo = svgEl("line", { x1: xOf(Math.min(X1, t.logMax + dexOf(wasteLo))), x2: xOf(Math.min(X1, t.logMax + dexOf(wasteLo))),
          y1: yTop - 4, y2: yTop + BAR_H + 4, stroke: P.blue, "stroke-width": 1, opacity: 0 });
        g.appendChild(tickLo);
        animated.push({ start: S + 0.42, dur: 0.2, set: p => tickLo.setAttribute("opacity", 0.8 * p) });
      }

      // 标签（档名 + 量级）
      const lx = x0 + 10;
      const nm = svgEl("text", { x: lx, y: yTop + 17, style: `font:700 12.5px ${SERIF};fill:${i >= tiers.length - 2 ? P.blueHi : P.ink}` });
      nm.textContent = t.label;
      const tk = svgEl("text", { x: lx, y: yTop + 33, style: `font:10px ${MONO};fill:${P.inkMd}` });
      tk.textContent = t.tokens + " token" + (gross ? "（右延为含浪费）" : "");
      [nm, tk].forEach((el, k) => {
        g.appendChild(el); el.setAttribute("opacity", 0);
        animated.push({ start: S + 0.25 + k * 0.06, dur: 0.25, set: p => el.setAttribute("opacity", p) });
      });

      // 悬停（触屏以点击替代）
      bar.addEventListener("mouseenter", () => { bar.setAttribute("stroke-width", 2); });
      bar.addEventListener("mouseleave", () => { bar.setAttribute("stroke-width", 1); });
      const open = e => U.showDrill({ title: t.drill.title, value: t.drill.value, sub: t.drill.sub,
        source: t.drill.source, x: e.clientX, y: e.clientY });
      g.addEventListener("click", open);
      g.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); }
      });
    });

    // 含浪费图例
    if (gross) {
      const lg = svgEl("g", {});
      svg.appendChild(lg);
      const sw = svgEl("rect", { x: ML + 2, y: TOP - 14, width: 22, height: 10, fill: "url(#sp-hatch)",
        stroke: "rgba(34,81,255,.5)", "stroke-width": 0.8 });
      lg.appendChild(sw);
      const lt = svgEl("text", { x: ML + 30, y: TOP - 5, style: `font:9.5px ${MONO};fill:${P.inkMd}` });
      lt.textContent = "含浪费延展区 = 有效强度 ÷（1 − 浪费率），竖线 = 浪费率下限口径";
      lg.appendChild(lt);
      [sw, lt].forEach(el => { el.setAttribute("opacity", 0);
        animated.push({ start: 0.9, dur: 0.3, set: p => el.setAttribute("opacity", p) }); });
    }

    U.play(animated, svg, { final, threshold: 0.2 });
  }

  refresh();
})();
