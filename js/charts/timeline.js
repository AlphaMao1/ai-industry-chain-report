// §0 三年事件墙（宿主 #chart-timeline）
// 年份色带垫底（2023–2026），事件牌贪心分层错落，kind=ink/brk/cur 三色（历史/断裂/当前），
// 连杆落轴，错峰 draw-in，点牌下钻。数据全部来自 RPT.timeline，来源行由数据聚合。
(() => {
  const host = document.getElementById("chart-timeline");
  if (!host || !window.RPT || !RPT.timeline) return;

  // 来源分级聚合（只取数据里出现过的对外五级口径）
  const SRC_CATS = ["官方披露", "管理层口径", "券商研究", "媒体报道与访谈", "本报告测算"];
  const srcLine = items => {
    const s = [];
    items.forEach(it => String(it || "").split(" · ").forEach(t => {
      if (SRC_CATS.includes(t) && !s.includes(t)) s.push(t);
    }));
    return s.join(" · ");
  };

  const body = U.frame(host, {
    title: "三年事件墙：点火、断裂与当前周期（2023–2026）",
    sub: "墨 = 行业事件 · 红 = 断裂/管制 · 蓝 = 当前周期 · 底纹 = 年份 · 点击任意牌匾下钻",
    src: srcLine(RPT.timeline.map(t => t.drill && t.drill.source)),
  });

  const P = U.PAL, MONO = U.FONTS.mono, SERIF = U.FONTS.serif;
  const svgEl = U.svgEl;
  const COL = { ink: P.ink, brk: P.red, cur: P.blue };

  // y 解析："2025-08" → 2025 + 7/12；"2026-07-16/17" → 2026.5x
  const dec = y => {
    const [a, m] = String(y).split("-");
    return +a + (m ? (+m - 1) / 12 : 0);
  };
  const PLAQUES = RPT.timeline.map((t, i) => ({ ...t, i, yr: dec(t.y) }));

  const PH = 48, TIER_GAP = 12, TIER_H = PH + TIER_GAP, TOP = 18, AXIS_GAP = 14;
  const X0 = 2022.85, X1 = 2026.95, ML = 18, MR = 18, GAP = 10;
  const MIN_W = 680;

  const mc = document.createElement("canvas").getContext("2d");
  const nameW = s => { mc.font = "700 12px " + SERIF; return mc.measureText(s).width; };
  // 双行标签的折行点（优先在 "·" 或空格处折，否则 13 字硬折）
  const splitLabel = s => {
    if (nameW(s) <= 168) return [s, ""];
    let cut = -1;
    for (let i = 0; i < s.length; i++) {
      if (nameW(s.slice(0, i + 1)) > 168) break;
      if (s[i] === "·" || s[i] === " " || s[i] === "：") cut = i + 1;
    }
    if (cut <= 0) { cut = 0; while (cut < s.length - 1 && nameW(s.slice(0, cut + 1)) <= 168) cut++; }
    return [s.slice(0, cut).replace(/[·\s：]+$/, ""), s.slice(cut).trim()];
  };

  function build(final) {
    body.innerHTML = "";
    // 移动端：外包横滚容器 + 最小渲染宽
    const scroller = document.createElement("div");
    scroller.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
    body.appendChild(scroller);
    const W = Math.min(1150, Math.max(MIN_W, body.getBoundingClientRect().width - 4));
    const xOf = yr => ML + (yr - X0) / (X1 - X0) * (W - ML - MR);

    // 贪心分层：按时间升序，放进不叠压的最低层
    const ps = PLAQUES.map(p => {
      const [l1, l2] = splitLabel(p.label);
      return { ...p, l1, l2, w: Math.max(120, Math.ceil(Math.max(nameW(l1), nameW(l2))) + 22) };
    }).sort((a, b) => a.yr - b.yr || a.i - b.i);
    const tiers = [];
    ps.forEach(p => {
      p.x = U.clamp(xOf(p.yr) - p.w / 2, ML, W - MR - p.w);
      let t = 0;
      while (t < tiers.length && p.x < tiers[t] + GAP) t++;
      p.tier = t; tiers[t] = p.x + p.w;
      p.leadX = U.clamp(xOf(p.yr), p.x + 12, p.x + p.w - 12);
    });
    const nTiers = tiers.length;
    const axisY = TOP + nTiers * TIER_H + AXIS_GAP;
    const H = axisY + 64;

    const svg = svgEl("svg", {
      width: "100%", height: H, viewBox: `0 0 ${W} ${H}`,
      style: `display:block;min-width:${MIN_W}px`, "data-drill-keep": "1",
    });
    scroller.appendChild(svg);
    const yOf = t => TOP + (nTiers - 1 - t) * TIER_H;
    const animated = [];

    // ── 年份色带（轴下切段 + 轴上浅底纹）──
    [2023, 2024, 2025, 2026].forEach((yr, i) => {
      const x0 = xOf(yr) + 1, x1 = xOf(yr + 1) - 1;
      const bg = svgEl("rect", { x: x0, y: TOP - 8, height: axisY - TOP + 8,
        fill: i % 2 ? "rgba(133,149,166,.05)" : "rgba(133,149,166,.09)" });
      svg.appendChild(bg);
      animated.push({ start: 0.02 + i * 0.04, dur: 0.4, set: p => { bg.setAttribute("width", Math.max(0, (x1 - x0) * p)); } });
      const seg = svgEl("rect", { x: x0, y: axisY + 7, height: 5,
        fill: yr === 2026 ? "rgba(34,81,255,.28)" : "rgba(133,149,166,.2)" });
      svg.appendChild(seg);
      animated.push({ start: 0.05 + i * 0.05, dur: 0.45, set: p => { seg.setAttribute("width", Math.max(0, (x1 - x0) * p)); } });
      const lb = svgEl("text", { x: (x0 + x1) / 2, y: axisY + 30, "text-anchor": "middle",
        style: `font:10px ${MONO};fill:${yr === 2026 ? P.blue : P.inkMd};letter-spacing:.15em` });
      lb.textContent = yr;
      svg.appendChild(lb);
      animated.push({ start: 0.35 + i * 0.05, dur: 0.4, set: p => { lb.setAttribute("opacity", p); } });
    });

    // ── 主轴 L→R 画出 ──
    const ax = svgEl("line", { x1: xOf(X0), y1: axisY, y2: axisY, stroke: P.ink, "stroke-width": 1.2 });
    svg.appendChild(ax);
    animated.push({ start: 0, dur: 0.7, set: p => { ax.setAttribute("x2", xOf(X0) + (xOf(X1) - xOf(X0)) * p); } });

    const leadLayer = svgEl("g", {});
    const dotLayer = svgEl("g", {});
    svg.appendChild(leadLayer); svg.appendChild(dotLayer);

    // ── 牌匾 ──
    ps.forEach((p, k) => {
      const S = 0.4 + k * 0.1;
      const c = COL[p.kind] || P.ink, py = yOf(p.tier);
      const g = svgEl("g", { style: "cursor:pointer", role: "button", tabindex: "0" });
      svg.appendChild(g);

      const lead = svgEl("line", { x1: p.leadX, x2: p.leadX, y1: py + PH, y2: py + PH,
        stroke: p.kind === "brk" ? "rgba(194,47,78,.45)" : p.kind === "cur" ? "rgba(34,81,255,.45)" : "rgba(10,31,51,.3)",
        "stroke-width": 1 });
      leadLayer.appendChild(lead);
      animated.push({ start: S + 0.22, dur: 0.32, set: q => {
        lead.setAttribute("y2", py + PH + (axisY - py - PH) * q); lead.setAttribute("opacity", q);
      } });

      const dot = svgEl("circle", { cx: p.leadX, cy: axisY, r: 0,
        fill: p.kind === "cur" ? P.blue : P.paper,
        stroke: c, "stroke-width": 1.2 });
      dotLayer.appendChild(dot);
      animated.push({ start: S + 0.5, dur: 0.18, set: q => { dot.setAttribute("r", 3 * q); } });

      const rect = svgEl("rect", { x: p.x, y: py, width: p.w, height: PH, fill: P.paperHi, stroke: c, "stroke-width": 1 });
      g.appendChild(rect);
      const per = 2 * (p.w + PH);
      rect.setAttribute("stroke-dasharray", per);
      animated.push({ start: S, dur: 0.4, set: q => { rect.setAttribute("stroke-dashoffset", per * (1 - q)); } });

      const ey = svgEl("text", { x: p.x + 10, y: py + 15, style: `font:9px ${MONO};fill:${c};opacity:.85` });
      ey.textContent = p.y;
      const kindTag = { ink: "行业", brk: "断裂", cur: "当前" }[p.kind] || "";
      const kd = svgEl("text", { x: p.x + p.w - 10, y: py + 15, "text-anchor": "end",
        style: `font:8px ${MONO};fill:${P.inkLo}` });
      kd.textContent = kindTag;
      const nm = svgEl("text", { x: p.x + 10, y: py + (p.l2 ? 28 : 33), style: `font:700 12px ${SERIF};fill:${c}` });
      nm.textContent = p.l1;
      const nm2 = svgEl("text", { x: p.x + 10, y: py + 42, style: `font:700 12px ${SERIF};fill:${c}` });
      nm2.textContent = p.l2;
      [ey, kd, nm, nm2].forEach(t => {
        g.appendChild(t); t.setAttribute("opacity", 0);
        animated.push({ start: S + 0.25, dur: 0.28, set: q => { t.setAttribute("opacity", q); } });
      });
      // 悬停（触屏以点击下钻替代）
      rect.addEventListener("mouseenter", () => rect.setAttribute("stroke-width", 2));
      rect.addEventListener("mouseleave", () => rect.setAttribute("stroke-width", 1));
      const open = e => U.showDrill({ title: p.drill.title, value: p.drill.value, sub: p.drill.sub,
        source: p.drill.source, x: e.clientX, y: e.clientY });
      g.addEventListener("click", open);
      g.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); }
      });
    });

    U.play(animated, svg, { final });
  }

  build(false);
  U.onRebuild(() => build(true));
})();
