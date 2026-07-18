// §0 三线叙事主线图（宿主 #chart-mainlines）——全报告导览图
// 主线（任务经济 §1–§4）→ 供需缺口测算（§5）→ 副线 A 瓶颈接力（§6–§7）/ 副线 B 资产负债表（§8）
// → 三线汇合：利润池瀑布（§9）→ 映照（§10–§11）→ 裁决与总结（§12–§13）→ 方法边界。
// 纯 SVG；点击任意节点或连线 scrollIntoView 跳章。文字全部来自 RPT.mainlines。
(() => {
  const host = document.getElementById("chart-mainlines");
  if (!host || !window.RPT || !RPT.mainlines) return;
  const M = RPT.mainlines;
  const body = U.frame(host, {
    title: "全报告主线图：三线交织，汇入利润池",
    sub: "点击任意节点或连线跳章 · 主线蓝 = 任务经济 · 墨 = 两条副线 · 利润池为三线汇合点",
  });

  const P = U.PAL, MONO = U.FONTS.mono, SERIF = U.FONTS.serif;
  const svgEl = U.svgEl;

  // 章节 → 页面锚点
  const JUMP = {
    "§1": "#sec-task", "§2": "#sec-meter", "§3": "#sec-price", "§4": "#sec-monetize",
    "§5": "#sec-gap", "§6": "#sec-relay", "§7": "#sec-power", "§8": "#sec-balance",
    "§9": "#sec-pool", "§10": "#sec-china", "§11": "#sec-export",
    "§12": "#sec-verdict", "§13": "#sec-conclusion", "方法": "#sec-method",
  };
  const jumpTo = key => {
    const sel = JUMP[key];
    const t = sel && document.querySelector(sel);
    if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const W = 1120, H = 906, CX = W / 2;
  const MIN_W = 760;

  const scroller = document.createElement("div");
  scroller.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(scroller);
  const svg = svgEl("svg", {
    width: "100%", height: "auto", viewBox: `0 0 ${W} ${H}`,
    style: `display:block;min-width:${MIN_W}px`, "data-drill-keep": "1",
  });
  scroller.appendChild(svg);

  // 文本折行（canvas 量宽）
  const mc = document.createElement("canvas").getContext("2d");
  const wrapText = (s, font, maxW, maxLines) => {
    mc.font = font;
    const lines = []; let cur = "";
    for (const ch of String(s)) {
      if (cur && mc.measureText(cur + ch).width > maxW) {
        lines.push(cur); cur = ch;
        if (maxLines && lines.length === maxLines) {
          while (cur && mc.measureText(lines[maxLines - 1] + "…").width > maxW)
            lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1);
          lines[maxLines - 1] += "…"; return lines;
        }
      } else cur += ch;
    }
    if (cur) lines.push(cur);
    return lines;
  };

  const animated = [];
  const lineLayer = svgEl("g", {});
  const nodeLayer = svgEl("g", {});
  svg.appendChild(lineLayer); svg.appendChild(nodeLayer);

  // ── 连线（含透明胖底触区；可点击跳章）──
  function wire(x1, y1, x2, y2, jump, S, opts = {}) {
    const g = svgEl("g", { style: jump ? "cursor:pointer" : "" });
    lineLayer.appendChild(g);
    const hit = svgEl("line", { x1, y1, x2, y2, stroke: "rgba(0,0,0,0)", "stroke-width": 12 });
    g.appendChild(hit);
    const ln = svgEl("line", { x1, y1, x2, y2,
      stroke: opts.color || "rgba(10,31,51,.35)", "stroke-width": opts.w || 1.2 });
    g.appendChild(ln);
    const len = Math.hypot(x2 - x1, y2 - y1);
    ln.setAttribute("stroke-dasharray", len);
    animated.push({ start: S, dur: 0.3, set: p => { ln.setAttribute("stroke-dashoffset", len * (1 - p)); } });
    if (opts.arrow !== false) {
      const ang = Math.atan2(y2 - y1, x2 - x1), a = 5.5;
      const tri = svgEl("path", {
        d: `M ${x2} ${y2} L ${x2 - a * Math.cos(ang - 0.45)} ${y2 - a * Math.sin(ang - 0.45)} ` +
           `L ${x2 - a * Math.cos(ang + 0.45)} ${y2 - a * Math.sin(ang + 0.45)} Z`,
        fill: opts.color || "rgba(10,31,51,.35)",
      });
      g.appendChild(tri);
      animated.push({ start: S + 0.26, dur: 0.12, set: p => { tri.setAttribute("opacity", p); } });
    }
    if (jump) {
      const go = () => jumpTo(jump);
      g.addEventListener("click", go);
      g.addEventListener("mouseenter", () => ln.setAttribute("stroke-width", (opts.w || 1.2) + 0.8));
      g.addEventListener("mouseleave", () => ln.setAttribute("stroke-width", opts.w || 1.2));
    }
    return g;
  }

  // ── 节点盒（badge = 章节号；点击跳章；悬停 tip 显示 desc 全文）──
  function node({ x, y, w, h, badge, title, desc, color, jump, S, doubleBox, titleSize }) {
    const c = color || P.ink;
    const g = svgEl("g", { style: "cursor:pointer", role: "button", tabindex: "0" });
    nodeLayer.appendChild(g);
    const rect = svgEl("rect", { x, y, width: w, height: h, fill: P.paperHi, stroke: c, "stroke-width": doubleBox ? 2 : 1 });
    g.appendChild(rect);
    const per = 2 * (w + h);
    rect.setAttribute("stroke-dasharray", per);
    animated.push({ start: S, dur: 0.4, set: p => { rect.setAttribute("stroke-dashoffset", per * (1 - p)); } });
    if (doubleBox) {
      const inner = svgEl("rect", { x: x + 4, y: y + 4, width: w - 8, height: h - 8,
        fill: "none", stroke: c, "stroke-width": 0.8, opacity: 0.55 });
      g.appendChild(inner);
      animated.push({ start: S + 0.1, dur: 0.35, set: p => { inner.setAttribute("opacity", 0.55 * p); } });
    }
    const texts = [];
    let ty = y + 17;
    if (badge) {
      const b = svgEl("text", { x: x + 13, y: ty, style: `font:10px ${MONO};fill:${c};letter-spacing:.12em` });
      b.textContent = badge; texts.push(b); ty += 19;
    }
    if (title) {
      const t = svgEl("text", { x: x + 13, y: ty, style: `font:700 ${titleSize || 14}px ${SERIF};fill:${P.ink}` });
      t.textContent = title; texts.push(t); ty += 17;
    }
    if (desc) {
      wrapText(desc, `9.5px ${MONO}`, w - 26, 3).forEach(ln => {
        const d = svgEl("text", { x: x + 13, y: ty, style: `font:9.5px ${MONO};fill:${P.inkMd}` });
        d.textContent = ln; texts.push(d); ty += 14;
      });
    }
    texts.forEach((t, i) => {
      g.appendChild(t); t.setAttribute("opacity", 0);
      animated.push({ start: S + 0.2 + i * 0.05, dur: 0.25, set: p => { t.setAttribute("opacity", p); } });
    });
    const go = () => jump && jumpTo(jump);
    g.addEventListener("click", go);
    g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    g.addEventListener("mouseenter", e => {
      rect.setAttribute("stroke-width", (doubleBox ? 2 : 1) + 1);
      if (desc) U.showTip(U.esc(desc), e.clientX, e.clientY);
    });
    g.addEventListener("mousemove", e => { if (desc) U.showTip(U.esc(desc), e.clientX, e.clientY); });
    g.addEventListener("mouseleave", () => {
      rect.setAttribute("stroke-width", doubleBox ? 2 : 1); U.hideTip();
    });
    return g;
  }

  // ═══ 布局（对齐大纲 2.1 ASCII 结构）═══
  // ① 尺子横条
  {
    const g = svgEl("g", {});
    nodeLayer.appendChild(g);
    const r = svgEl("rect", { x: 60, y: 8, width: W - 120, height: 42, fill: "none",
      stroke: P.ink, "stroke-width": 1, "stroke-dasharray": "1 0" });
    g.appendChild(r);
    const t = svgEl("text", { x: CX, y: 35, "text-anchor": "middle",
      style: `font:700 15px ${SERIF};fill:${P.ink}` });
    t.textContent = M.ruler;
    g.appendChild(t);
    [r, t].forEach(el => { el.setAttribute("opacity", 0);
      animated.push({ start: 0, dur: 0.4, set: p => el.setAttribute("opacity", p) }); });
  }

  // ② 主线 · 任务经济（§1–§4）：四节点横排
  const main = M.main;
  {
    const lb = svgEl("text", { x: 51, y: 84, style: `font:10.5px ${MONO};fill:${P.blue};letter-spacing:.1em` });
    lb.textContent = main.name; svg.appendChild(lb);
    animated.push({ start: 0.1, dur: 0.3, set: p => lb.setAttribute("opacity", p) });
  }
  const BW = 232, BH = 66, BGAP = 30, BY = 96;
  const bx0 = (W - (4 * BW + 3 * BGAP)) / 2;
  main.nodes.forEach((n, i) => {
    const x = bx0 + i * (BW + BGAP);
    node({ x, y: BY, w: BW, h: BH, badge: n.chapter, title: n.title, desc: n.desc,
      color: P.blue, jump: n.chapter, S: 0.15 + i * 0.1 });
    if (i < 3) wire(x + BW + 2, BY + BH / 2, x + BW + BGAP - 2, BY + BH / 2,
      main.nodes[i + 1].chapter, 0.2 + i * 0.1, { color: "rgba(34,81,255,.5)" });
  });

  // ③ 四节点汇入 §5 供需缺口测算（hub）
  const HUB = { x: CX - 235, y: 216, w: 470, h: 80 };
  main.nodes.forEach((n, i) => {
    const nx = bx0 + i * (BW + BGAP) + BW / 2;
    wire(nx, BY + BH + 2, HUB.x + 55 + i * 120, HUB.y - 2, "§5", 0.55 + i * 0.05,
      { color: "rgba(34,81,255,.45)", arrow: i === 1 || i === 2 });
  });
  node({ ...HUB, badge: M.hub.chapter, title: M.hub.title, desc: M.hub.desc,
    color: P.blueHi, jump: "§5", S: 0.7, titleSize: 15 });

  // ④ 分岔：副线 A（瓶颈接力）/ 副线 B（资产负债表）
  const BR = { y: 352, h: 96, w: 470 };
  const bAx = 70, bBx = W - 70 - BR.w;
  wire(CX - 120, HUB.y + HUB.h + 2, bAx + BR.w / 2 + 60, BR.y - 2, "§6", 0.9, { color: "rgba(10,31,51,.4)" });
  wire(CX + 120, HUB.y + HUB.h + 2, bBx + BR.w / 2 - 60, BR.y - 2, "§8", 0.9, { color: "rgba(10,31,51,.4)" });
  node({ x: bAx, y: BR.y, w: BR.w, h: BR.h, badge: M.branchA.chapters, title: M.branchA.name,
    desc: M.branchA.desc, color: P.ink, jump: "§6", S: 1.0 });
  node({ x: bBx, y: BR.y, w: BR.w, h: BR.h, badge: M.branchB.chapters, title: M.branchB.name,
    desc: M.branchB.desc, color: P.ink, jump: "§8", S: 1.0 });

  // ⑤ 三线汇合：利润池瀑布（§9，双线盒）
  const MG = { x: CX - 260, y: 506, w: 520, h: 108 };
  wire(bAx + BR.w / 2, BR.y + BR.h + 2, CX - 130, MG.y - 2, "§9", 1.2, { color: "rgba(10,31,51,.4)", w: 1.5 });
  wire(bBx + BR.w / 2, BR.y + BR.h + 2, CX + 130, MG.y - 2, "§9", 1.2, { color: "rgba(10,31,51,.4)", w: 1.5 });
  node({ ...MG, badge: M.merge.chapter, title: M.merge.title, desc: M.merge.desc,
    color: P.ink, jump: "§9", S: 1.3, doubleBox: true, titleSize: 15 });

  // ⑥ 映照与边界（§10 / §11）
  const SM = { y: 668, h: 66, w: 250 };
  const m1x = CX - 20 - SM.w, m2x = CX + 20;
  wire(CX, MG.y + MG.h + 2, CX, SM.y - 2, null, 1.5, { arrow: false });
  wire(CX, SM.y - 26, m1x + SM.w / 2, SM.y - 2, "§10", 1.5, { color: "rgba(10,31,51,.35)" });
  wire(CX, SM.y - 26, m2x + SM.w / 2, SM.y - 2, "§11", 1.5, { color: "rgba(10,31,51,.35)" });
  M.mirrors.forEach((m, i) => {
    node({ x: i === 0 ? m1x : m2x, y: SM.y, w: SM.w, h: SM.h, badge: m.chapter,
      title: m.title, desc: m.desc, color: P.inkMd, jump: m.chapter, S: 1.55 });
  });

  // ⑦ 裁决与总结（§12 / §13）
  const VD = { y: 790, h: 66, w: 250 };
  wire(CX, SM.y + SM.h + 2, CX, VD.y - 26, null, 1.7, { arrow: false });
  wire(CX, VD.y - 26, m1x + SM.w / 2, VD.y - 2, "§12", 1.72, { color: "rgba(10,31,51,.35)" });
  wire(CX, VD.y - 26, m2x + SM.w / 2, VD.y - 2, "§13", 1.72, { color: "rgba(10,31,51,.35)" });
  M.verdict.forEach((v, i) => {
    node({ x: i === 0 ? m1x : m2x, y: VD.y, w: SM.w, h: VD.h, badge: v.chapter,
      title: v.title, desc: v.desc, color: P.blue, jump: v.chapter, S: 1.75, titleSize: 13.5 });
  });

  // ⑧ 方法边界章（收尾注记）
  {
    wire(CX, VD.y + VD.h + 2, CX, 886, "方法", 1.9, { arrow: false, color: "rgba(10,31,51,.25)" });
    const g = svgEl("g", { style: "cursor:pointer", role: "button", tabindex: "0" });
    nodeLayer.appendChild(g);
    const t = svgEl("text", { x: CX, y: 900, "text-anchor": "middle",
      style: `font:10px ${MONO};fill:${P.inkLo};letter-spacing:.08em` });
    t.textContent = "口径、来源与已知局限（方法边界章）↓";
    g.appendChild(t);
    animated.push({ start: 1.95, dur: 0.3, set: p => t.setAttribute("opacity", p) });
    const go = () => jumpTo("方法");
    g.addEventListener("click", go);
    g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  }

  U.play(animated, svg, { threshold: 0.12 });
})();
