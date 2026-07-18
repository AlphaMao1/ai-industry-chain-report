// §3 中国价格阶梯双线（宿主 #chart-chinafrontier）
// Kimi 三点阶梯（K2→K2.6→K3 连涨三代）+ Qwen 两点阶梯，对照 DeepSeek 牌价（空心/虚线）
// 与实付（实心/实线）两条水平带及其落差。step-after 阶梯线；点代下钻。
// 数据全部来自 RPT.chinaFrontier。
(() => {
  const host = document.getElementById("chart-chinafrontier");
  if (!host || !window.RPT || !RPT.chinaFrontier) return;
  const CF = RPT.chinaFrontier;
  const body = U.frame(host, {
    title: "中国旗舰价格阶梯：集体提价与唯一例外（美元/百万 token · 输入价）",
    sub: "电蓝 = Kimi · 墨 = Qwen · 红 = DeepSeek（空心牌价 / 实心实付）· 阶梯 = 官方提价事件 · 点击任意点下钻",
    src: "官方披露",
  });

  const P = U.PAL, MONO = U.FONTS.mono;
  const svgEl = U.svgEl;
  // 防御性日期解析：接受 "YYYY-MM" / "YYYY-MM-DD" / "YYYY-MM-DD/DD" 等，取首个合法日期；
  // 非法记录隔离（console.warn）并剔除，绝不进入比例尺
  const parseDate = raw => {
    const m = String(raw == null ? "" : raw).match(/(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/);
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = m[3] ? +m[3] : 1;
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const t = new Date(y, mo - 1, d);
    return isNaN(t) ? null : t;
  };
  const bad = [];
  const keep = d => { if (!d.t) { bad.push(d); return false; } return true; };
  const kimi = CF.kimi.map(d => ({ ...d, t: parseDate(d.date) })).filter(keep).sort((a, b) => a.t - b.t);
  const qwen = CF.qwen.map(d => ({ ...d, t: parseDate(d.date) })).filter(keep).sort((a, b) => a.t - b.t);
  if (bad.length) console.warn("[chinafrontier] 非法日期记录已隔离:", bad.map(d => d.date + " / " + d.label));
  const ds = CF.deepseek;
  if (!kimi.length && !qwen.length) return;
  // 点位 delta 读数（从 drill.value 解析涨幅/倍数，提到图面）
  const deltaOf = d => {
    const v = String(d.drill && d.drill.value || "");
    let m = v.match(/（\s*([^）]*(?:%|倍)[^）]*)）/);
    if (m) return m[1];
    m = v.match(/=\s*K2 输入价的\s*([\d.]+\s*倍)/);
    if (m) return "输入价 " + m[1].replace(/\s+/g, "") + " K2";
    return "";
  };

  const W = 1080, H = 410, ML = 58, MR = 120, TOP = 36, BOT = 48;
  const MIN_W = 760;
  // 比例尺域一律用毫秒数（Date + number 会字符串拼接，是此前 x 全 NaN 的根因）
  const allT = [...kimi, ...qwen].map(d => +d.t);
  const t0 = Math.min(...allT), t1 = Math.max(...allT);
  const pad = Math.max((t1 - t0) * 0.08, 864e5 * 20); // 至少 ±20 天，防除零
  const xOf = t => ML + ((+t) - (t0 - pad)) / ((t1 + pad) - (t0 - pad)) * (W - ML - MR);
  const yMax = Math.max(3.3, ds.list * 1.1);
  const yOf = p => (H - BOT) - p / yMax * (H - BOT - TOP);

  const scroller = document.createElement("div");
  scroller.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(scroller);
  const svg = svgEl("svg", {
    width: "100%", height: H, viewBox: `0 0 ${W} ${H}`,
    style: `display:block;min-width:${MIN_W}px`, "data-drill-keep": "1",
  });
  scroller.appendChild(svg);
  const animated = [];

  // ── 网格与时间刻度（t0/t1 为毫秒数；循环上限兜底）──
  for (let v = 0; v <= yMax; v += 1) {
    svg.appendChild(svgEl("line", { x1: ML, x2: W - MR, y1: yOf(v), y2: yOf(v), stroke: P.lineLo }));
    const t = svgEl("text", { x: ML - 8, y: yOf(v) + 3.5, "text-anchor": "end",
      style: `font:10px ${MONO};fill:${P.inkLo}` });
    t.textContent = "$" + v;
    svg.appendChild(t);
  }
  const t0d = new Date(t0);
  for (let d = new Date(t0d.getFullYear(), t0d.getMonth(), 1), guard = 0;
       +d <= t1 && guard < 40; d = new Date(d.getFullYear(), d.getMonth() + 3, 1), guard++) {
    const t = svgEl("text", { x: xOf(d), y: H - BOT + 20, "text-anchor": "middle",
      style: `font:9.5px ${MONO};fill:${P.inkLo}` });
    t.textContent = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    svg.appendChild(t);
  }

  // ── 标签碰撞管理：估算宽度 + 已占矩形；近 x 标签垂直错峰 ──
  const estW = (s, fs) => { let n = 0; for (const ch of String(s)) n += ch.charCodeAt(0) > 255 ? 1.7 : 1; return n * fs * 0.62 + 6; };
  const placed = [];
  const hit = r => placed.some(q => !(r.x1 <= q.x0 || r.x0 >= q.x1 || r.y1 <= q.y0 || r.y0 >= q.y1));
  const clampX = (cx, half) => Math.min(Math.max(cx, ML + half), W - MR - half);
  // 预置障碍：DeepSeek 牌价/实付注记区（左侧两条文字带），点标签自动避让
  if (ds) {
    placed.push({ x0: ML, x1: ML + estW(`${ds.label} 牌价 $${ds.list}`, 9.5), y0: yOf(ds.list) - 16, y1: yOf(ds.list) - 2 });
    placed.push({ x0: ML, x1: ML + estW(`实付 $${ds.effective}（长期 75 折，落差 = 牌价涨、实付稳）`, 9.5), y0: yOf(ds.effective) + 7, y1: yOf(ds.effective) + 19 });
  }

  // ── 阶梯线（step-after）──
  const stepPath = pts => {
    let d = `M ${xOf(pts[0].t)} ${yOf(pts[0].price)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${xOf(pts[i].t)} ${yOf(pts[i - 1].price)} L ${xOf(pts[i].t)} ${yOf(pts[i].price)}`;
    }
    d += ` L ${xOf(t1) + 40} ${yOf(pts[pts.length - 1].price)}`;
    return d;
  };
  const SERIES = [
    { name: "Kimi（连涨三代）", col: P.blue, pts: kimi },
    { name: "Qwen", col: P.ink, pts: qwen },
  ];
  SERIES.forEach((s, si) => {
    const path = svgEl("path", { d: stepPath(s.pts), fill: "none", stroke: s.col, "stroke-width": 1.8 });
    svg.appendChild(path);
    const len = path.getTotalLength();
    path.setAttribute("stroke-dasharray", len);
    animated.push({ start: 0.1 + si * 0.25, dur: 0.9, set: p => path.setAttribute("stroke-dashoffset", len * (1 - p)) });

    s.pts.forEach((d, i) => {
      const S = 0.15 + si * 0.25 + (i / Math.max(1, s.pts.length - 1)) * 0.55;
      const g = svgEl("g", { style: "cursor:pointer", role: "button", tabindex: "0" });
      svg.appendChild(g);
      const cx = xOf(d.t), cy = yOf(d.price);
      g.appendChild(svgEl("circle", { cx, cy, r: 14, fill: "transparent" }));
      const c = svgEl("circle", { cx, cy, r: 0,
        fill: s.col, stroke: P.paperHi, "stroke-width": 1.5 });
      g.appendChild(c);
      // 主标签：上两道/下两道垂直错峰，近 x 标签不重叠
      const name = `${d.label.replace(/（.*）/, "")} $${d.price}`;
      const hw = estW(name, 10) / 2;
      let lb = null;
      for (const dy of [-11, -24, 20, 33]) {
        const lx = clampX(cx, hw);
        const r = { x0: lx - hw, x1: lx + hw, y0: cy + dy - 10, y1: cy + dy + 3 };
        if (r.y0 < 4 || r.y1 > H - BOT - 2) continue;
        if (!hit(r)) {
          lb = svgEl("text", { x: lx, y: cy + dy, "text-anchor": "middle",
            style: `font:700 10px ${MONO};fill:${s.col}` });
          lb.textContent = name;
          placed.push(r);
          break;
        }
      }
      // 日期副标签：仅在不碰撞时落（全名与日期下钻可见）
      const shw = estW(d.date, 8.5) / 2;
      const sr = { x0: clampX(cx, shw) - shw, x1: clampX(cx, shw) + shw, y0: cy + 17 - 9, y1: cy + 17 + 2 };
      let dt = null;
      if (!hit(sr) && sr.y1 < H - 2) {
        dt = svgEl("text", { x: clampX(cx, shw), y: cy + 17, "text-anchor": "middle",
          style: `font:8.5px ${MONO};fill:${P.inkLo}` });
        dt.textContent = d.date;
      }
      // delta 读数（提价幅度/倍数提到图面；主标签在点上则叠其上，否则落点上空位）
      const dlt = deltaOf(d);
      let dl = null;
      if (dlt) {
        const dhw = estW(dlt, 8.5) / 2;
        const lbY = lb ? +lb.getAttribute("y") : null;
        const dy0 = lbY != null && lbY < cy ? lbY - 13 : cy - 11;
        const dr = { x0: clampX(cx, dhw) - dhw, x1: clampX(cx, dhw) + dhw, y0: dy0 - 9, y1: dy0 + 2 };
        if (!hit(dr) && dr.y0 > 4) {
          dl = svgEl("text", { x: clampX(cx, dhw), y: dy0, "text-anchor": "middle",
            style: `font:700 8.5px ${MONO};fill:${si === 0 ? P.blueHi : P.inkMd}` });
          dl.textContent = dlt;
          placed.push(dr);
        }
      }
      [c, lb, dt, dl].filter(Boolean).forEach((el, k) => {
        g.appendChild(el); if (k) el.setAttribute("opacity", 0);
      });
      animated.push({ start: S, dur: 0.2, set: p => c.setAttribute("r", 5 * p) });
      animated.push({ start: S + 0.08, dur: 0.22, set: p => { if (lb) lb.setAttribute("opacity", p); if (dt) dt.setAttribute("opacity", p); } });
      g.addEventListener("mouseenter", () => c.setAttribute("r", 7));
      g.addEventListener("mouseleave", () => c.setAttribute("r", 5));
      const open = e => U.showDrill({ title: d.drill.title, value: d.drill.value,
        // sub 补全：空 sub 时用数据集注记（集体提价背景），不新造数字
        sub: d.drill.sub || CF.note,
        source: d.drill.source, x: e.clientX, y: e.clientY });
      g.addEventListener("click", open);
      g.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); }
      });
    });

    // 系列名（末点右侧）
    const last = s.pts[s.pts.length - 1];
    const nm = svgEl("text", { x: xOf(t1) + 46, y: yOf(last.price) + 4,
      style: `font:700 10.5px ${MONO};fill:${s.col}` });
    nm.textContent = s.name;
    svg.appendChild(nm);
    animated.push({ start: 0.95 + si * 0.1, dur: 0.25, set: p => nm.setAttribute("opacity", p) });
  });

  // ── DeepSeek：牌价虚线带 + 实付实线带 + 落差 ──
  if (ds) {
    const g = svgEl("g", { style: "cursor:pointer", role: "button", tabindex: "0" });
    svg.appendChild(g);
    const xR = xOf(t1) + 40;
    // 落差区带
    const gap = svgEl("rect", { x: ML, y: yOf(ds.list), width: 0, height: yOf(ds.effective) - yOf(ds.list),
      fill: "rgba(194,47,78,.07)" });
    g.appendChild(gap);
    animated.push({ start: 0.55, dur: 0.45, set: p => { gap.setAttribute("width", (xR - ML) * p); } });
    // 牌价（虚线）
    const l1 = svgEl("line", { x1: ML, x2: ML, y1: yOf(ds.list), y2: yOf(ds.list),
      stroke: P.red, "stroke-width": 1.2, "stroke-dasharray": "4 3" });
    g.appendChild(l1);
    animated.push({ start: 0.5, dur: 0.5, set: p => { l1.setAttribute("x2", ML + (xR - ML) * p); } });
    // 实付（实线，粗）
    const l2 = svgEl("line", { x1: ML, x2: ML, y1: yOf(ds.effective), y2: yOf(ds.effective),
      stroke: P.red, "stroke-width": 2.2 });
    g.appendChild(l2);
    animated.push({ start: 0.6, dur: 0.5, set: p => { l2.setAttribute("x2", ML + (xR - ML) * p); } });
    // 端点：空心牌价 / 实心实付
    const cList = svgEl("circle", { cx: xR, cy: yOf(ds.list), r: 0,
      fill: "none", stroke: P.red, "stroke-width": 1.5, "stroke-dasharray": "2 2" });
    const cEff = svgEl("circle", { cx: xR, cy: yOf(ds.effective), r: 0,
      fill: P.red, stroke: P.paperHi, "stroke-width": 1.5 });
    g.appendChild(cList); g.appendChild(cEff);
    animated.push({ start: 0.85, dur: 0.2, set: p => cList.setAttribute("r", 5 * p) });
    animated.push({ start: 0.92, dur: 0.2, set: p => cEff.setAttribute("r", 5 * p) });
    // 标注
    const t1l = svgEl("text", { x: ML + 8, y: yOf(ds.list) - 7, style: `font:9.5px ${MONO};fill:${P.red}` });
    t1l.textContent = `${ds.label} 牌价 $${ds.list}`;
    const t2l = svgEl("text", { x: ML + 8, y: yOf(ds.effective) + 15, style: `font:700 9.5px ${MONO};fill:${P.red}` });
    t2l.textContent = `实付 $${ds.effective}（长期 75 折，落差 = 牌价涨、实付稳）`;
    const t3l = svgEl("text", { x: xOf(t1) + 46, y: yOf(ds.effective) + 4,
      style: `font:700 10.5px ${MONO};fill:${P.red}` });
    t3l.textContent = "DeepSeek";
    [t1l, t2l, t3l].forEach((el, k) => {
      g.appendChild(el); el.setAttribute("opacity", 0);
      animated.push({ start: 0.95 + k * 0.08, dur: 0.22, set: p => el.setAttribute("opacity", p) });
    });
    const open = e => U.showDrill({ title: ds.drill.title, value: ds.drill.value, sub: ds.drill.sub,
      source: ds.drill.source, x: e.clientX, y: e.clientY });
    g.addEventListener("click", open);
    g.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); }
    });
  }

  U.play(animated, svg, { threshold: 0.25 });

  // 脚注（GLM 与集体提价注记，数据驱动）
  if (CF.note) {
    const f = document.createElement("p");
    f.style.cssText = `font:10px ${MONO};color:${P.inkMd};margin-top:8px;line-height:1.7`;
    f.textContent = CF.note;
    body.appendChild(f);
  }
})();
