// §3 旗舰价格 V 形反转（宿主 #chart-frontier）
// 对数价格轴散点+连线：谷底 GPT-5 $1.25（红色虚线参考线）→ 连续多代上移 → 当前在售旗舰为谷底 4 倍。
// 档位三色（墨=旗舰 / 浅蓝=推理档 / 电蓝=超档）；关键点加粗标签；同日两点标签错位防叠；
// 点拐点下钻（定价页日期与档位）。数据全部来自 RPT.frontierPrice / RPT.frontierExtras。
(() => {
  const host = document.getElementById("chart-frontier");
  if (!host || !window.RPT || !RPT.frontierPrice) return;
  const body = U.frame(host, {
    title: "旗舰价格 V 形反转（美元/百万 token · 输入价 · 对数轴）",
    sub: "墨 = 常规旗舰 · 浅蓝 = 推理档 · 电蓝 = 超档 · 红虚线 = 谷底参考线 · 点击任意点下钻",
    src: "官方披露 · 券商研究",
  });

  const P = U.PAL, MONO = U.FONTS.mono, SERIF = U.FONTS.serif;
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
  const data = RPT.frontierPrice
    .map(d => ({ ...d, t: parseDate(d.date) }))
    .filter(d => { if (!d.t) { bad.push(d); return false; } return true; })
    .sort((a, b) => a.t - b.t);
  if (bad.length) console.warn("[frontier] 非法日期记录已隔离:", bad.map(d => d.date + " / " + d.label));
  if (!data.length) return;
  const TCOL = { frontier: P.ink, reasoning: P.blueLo, super: P.blue };
  const TCNL = { frontier: "常规旗舰", reasoning: "推理档", super: "超档" };

  const W = 1080, H = 440, ML = 58, MR = 30, TOP = 40, BOT = 48;
  const MIN_W = 760;
  // 比例尺域一律用毫秒数（Date + number 会字符串拼接，是此前 x 全 NaN 的根因）
  const t0 = +data[0].t, t1 = +data[data.length - 1].t;
  const pad = Math.max((t1 - t0) * 0.04, 864e5 * 14); // 至少 ±14 天，防单点/密集数据除零
  const xOf = t => ML + ((+t) - (t0 - pad)) / ((t1 + pad) - (t0 - pad)) * (W - ML - MR);
  const yOf = p => {  // log10 轴，域 [1, 200]
    const v = Math.min(200, Math.max(1, p));
    return (H - BOT) - Math.log10(v) / Math.log10(200) * (H - BOT - TOP);
  };

  const scroller = document.createElement("div");
  scroller.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(scroller);
  const svg = svgEl("svg", {
    width: "100%", height: H, viewBox: `0 0 ${W} ${H}`,
    style: `display:block;min-width:${MIN_W}px`, "data-drill-keep": "1",
  });
  scroller.appendChild(svg);
  const animated = [];
  let readoutObstacle = null; // 图内读数框的碰撞障碍（下方标签管理注册）

  // ── 价格网格（log）──
  [1, 5, 10, 30, 100, 200].forEach(v => {
    svg.appendChild(svgEl("line", { x1: ML, x2: W - MR, y1: yOf(v), y2: yOf(v), stroke: P.lineLo }));
    const t = svgEl("text", { x: ML - 8, y: yOf(v) + 3.5, "text-anchor": "end",
      style: `font:10px ${MONO};fill:${P.inkLo}` });
    t.textContent = "$" + v;
    svg.appendChild(t);
  });
  // ── 时间刻度（每 6 个月；t1 为毫秒数，+d 显式转数，循环上限兜底）──
  const t0d = new Date(t0);
  for (let d = new Date(t0d.getFullYear(), t0d.getMonth(), 1), guard = 0;
       +d <= t1 && guard < 40; d = new Date(d.getFullYear(), d.getMonth() + 6, 1), guard++) {
    const t = svgEl("text", { x: xOf(d), y: H - BOT + 20, "text-anchor": "middle",
      style: `font:9.5px ${MONO};fill:${P.inkLo}` });
    t.textContent = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    svg.appendChild(t);
  }

  // ── 谷底参考线（GPT-5 2025-08）──
  const valley = data.find(d => d.label.includes("GPT-5（"));
  // 当前峰值点（label 含"当前峰值"）
  const peak = data.find(d => d.label.includes("当前峰值"));
  // 关键点双价（从 drill.value 解析 "$输入/$输出"，图面即见输出价，不必点开）
  const dualOf = d => {
    const m = String(d.drill && d.drill.value || "").match(/\$[\d.]+\s*\/\s*\$[\d.]+/);
    return m ? m[0].replace(/\s+/g, "") : "$" + d.price;
  };
  if (valley) {
    const vl = svgEl("line", { x1: xOf(valley.t), x2: xOf(valley.t), y1: TOP - 8, y2: TOP - 8,
      stroke: P.red, "stroke-width": 1, "stroke-dasharray": "3 4" });
    svg.appendChild(vl);
    animated.push({ start: 0.9, dur: 0.4, set: p => {
      vl.setAttribute("y2", TOP - 8 + (H - BOT - TOP + 8) * p); vl.setAttribute("opacity", 0.6 * p);
    } });
    const vt = svgEl("text", { x: xOf(valley.t), y: TOP - 13, "text-anchor": "middle",
      style: `font:9.5px ${MONO};fill:${P.red}` });
    vt.textContent = "谷底 2025-08 · 此后 V 形反转";
    svg.appendChild(vt);
    animated.push({ start: 1.15, dur: 0.25, set: p => vt.setAttribute("opacity", p) });
  }

  // ── 图内读数框：谷底 → 当前峰值（右上空区；全部取自数据文本）──
  if (valley && peak) {
    const rx = W - MR - 2;
    const box = svgEl("g", {});
    svg.appendChild(box);
    const lines = [
      { t: "谷底 " + dualOf(valley) + "（" + valley.date + "）→ 当前峰值 " + dualOf(peak) + "（" + peak.date + "）",
        st: `font:700 10.5px ${MONO};fill:${P.ink}` },
      { t: "V 形反转后量价齐升 · 价格梯子向两端拉长（脚注）", st: `font:9px ${MONO};fill:${P.inkMd}` },
      { t: "天花板自历史峰值回落约 87%（o3-pro 注记）", st: `font:9px ${MONO};fill:${P.inkLo}` },
    ];
    lines.forEach((ln, i) => {
      const t = svgEl("text", { x: rx, y: TOP + 8 + i * 14, "text-anchor": "end", style: ln.st });
      t.textContent = ln.t;
      box.appendChild(t);
    });
    const hrW = 300;
    const hr = svgEl("line", { x1: rx - hrW, x2: rx, y1: TOP + 8 + lines.length * 14 - 6, y2: TOP + 8 + lines.length * 14 - 6,
      stroke: P.lineLo, "stroke-width": 1 });
    box.appendChild(hr);
    box.setAttribute("opacity", 0);
    animated.push({ start: 1.25, dur: 0.35, set: p => box.setAttribute("opacity", p) });
    // 读数框占位（在 placed 初始化后注册为标签碰撞障碍）
    readoutObstacle = { x0: rx - 330, x1: rx, y0: TOP, y1: TOP + 8 + lines.length * 14 };
  }

  // ── 连线（时间序，平滑单调）──
  const pathPts = data.map(d => [xOf(d.t), yOf(d.price)]);
  // 单调三次插值（简化：Catmull-Rom 转 Bezier）
  let dPath = `M ${pathPts[0][0]} ${pathPts[0][1]}`;
  for (let i = 0; i < pathPts.length - 1; i++) {
    const p0 = pathPts[Math.max(0, i - 1)], p1 = pathPts[i], p2 = pathPts[i + 1],
      p3 = pathPts[Math.min(pathPts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    dPath += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
  }
  const path = svgEl("path", { d: dPath, fill: "none", stroke: P.inkMd, "stroke-width": 1.5, opacity: 0.7 });
  svg.appendChild(path);
  const len = path.getTotalLength();
  path.setAttribute("stroke-dasharray", len);
  animated.push({ start: 0.05, dur: 1.1, set: p => path.setAttribute("stroke-dashoffset", len * (1 - p)) });

  // ── 点 + 标签（碰撞感知：垂直车道错峰；同日两点强制错道；非关键点无空位则只留点，下钻看全名）──
  const KEY = ["o1-pro（历史峰值）", "GPT-5（旗舰谷底）", "GPT-5.5 Pro（当前峰值）"];
  const dateGroups = {};
  data.forEach(d => { (dateGroups[d.date] = dateGroups[d.date] || []).push(d); });
  const gidx = {};
  // 文本宽度估算（10px/8.5px 等宽 + CJK 宽字符修正）
  const estW = (s, fs) => { let n = 0; for (const ch of String(s)) n += ch.charCodeAt(0) > 255 ? 1.7 : 1; return n * fs * 0.62 + 6; };
  const placed = []; // 已占矩形 {x0,x1,y0,y1}
  if (readoutObstacle) placed.push(readoutObstacle);
  const hit = r => placed.some(q => !(r.x1 <= q.x0 || r.x0 >= q.x1 || r.y1 <= q.y0 || r.y0 >= q.y1));
  const clampX = (cx, half) => Math.min(Math.max(cx, ML + half), W - MR - half);
  // 预置障碍：谷底注记 + 图例行（避免关键点标签压上去）
  if (valley) {
    const hw = estW("谷底 2025-08 · 此后 V 形反转", 9.5) / 2;
    placed.push({ x0: xOf(valley.t) - hw, x1: xOf(valley.t) + hw, y0: TOP - 22, y1: TOP - 9 });
  }
  placed.push({ x0: ML, x1: ML + 3 * 96, y0: TOP - 28, y1: TOP - 13 });
  // 候选车道：点上方三道 / 下方三道（相对点 cy 的 y 偏移）
  const LANES = [-12, -25, -38, 22, 35, 48];
  data.forEach((d, i) => {
    const gi = (gidx[d.date] = (gidx[d.date] || 0) + 1) - 1;
    const col = TCOL[d.tier] || P.ink;
    const S = 0.12 + (i / data.length) * 0.9;
    const isKey = KEY.includes(d.label);
    const cx = xOf(d.t), cy = yOf(d.price);
    const g = svgEl("g", { style: "cursor:pointer", role: "button", tabindex: "0" });
    svg.appendChild(g);
    g.appendChild(svgEl("circle", { cx, cy, r: 14, fill: "transparent" }));
    const dot = svgEl("circle", { cx, cy, r: 0, fill: col, stroke: P.paperHi, "stroke-width": 1.5 });
    g.appendChild(dot);
    animated.push({ start: S, dur: 0.22, set: p => dot.setAttribute("r", (isKey ? 5.5 : 4.5) * p) });

    // 主标签：同日组水平散开（±120px 步进）+ 第 N 点从错开的车道序起步，依次试上/下车道；
    // 关键点用双价（$输入/$输出，从 drill.value 解析）——输出价不再只藏下钻
    const grpN = dateGroups[d.date].length;
    const xOff = grpN > 1 ? (gi - (grpN - 1) / 2) * 120 : 0;
    const name = `${d.label.replace(/（.*）/, "")} ${isKey ? dualOf(d) : "$" + d.price}`;
    const hw = estW(name, 10) / 2;
    const order = LANES.map((_, k) => LANES[(k + gi * 3) % LANES.length]);
    const labels = [];
    let chosenDy = null;
    for (const dy of order) {
      const lx = clampX(cx + xOff, hw);
      const r = { x0: lx - hw, x1: lx + hw, y0: cy + dy - 10, y1: cy + dy + 3 };
      if (r.y0 < 4 || r.y1 > H - BOT - 2) continue; // 不出绘图区
      if (!hit(r)) {
        const lb = svgEl("text", { x: lx, y: cy + dy, "text-anchor": "middle",
          style: `font:${isKey ? "700" : "400"} 10px ${MONO};fill:${col}` });
        lb.textContent = name;
        placed.push(r); labels.push(lb); chosenDy = dy;
        break;
      }
    }
    if (chosenDy === null && isKey) { // 关键点强制落最上车道（钳入绘图区）
      const lx = clampX(cx + xOff, hw);
      const fy = Math.max(cy - 38, 14);
      const lb = svgEl("text", { x: lx, y: fy, "text-anchor": "middle",
        style: `font:700 10px ${MONO};fill:${col}` });
      lb.textContent = name;
      placed.push({ x0: lx - hw, x1: lx + hw, y0: fy - 10, y1: fy + 3 });
      labels.push(lb); chosenDy = fy - cy;
    }
    // 日期副标签：主标签在点上 → 日落点下（+18）；主标签在点下 → 跟随主标签下一行。
    // 关键点必落，非关键点仅在不碰撞时落
    const sub = `${d.date} · ${TCNL[d.tier] || ""}`;
    const shw = estW(sub, 8.5) / 2;
    const sDy = chosenDy === null ? 18 : (chosenDy < 0 ? 18 : chosenDy + 13);
    const sr = { x0: clampX(cx + xOff, shw) - shw, x1: clampX(cx + xOff, shw) + shw, y0: cy + sDy - 9, y1: cy + sDy + 2 };
    if ((isKey || !hit(sr)) && sr.y0 > 4 && sr.y1 < H - 2) {
      const dt = svgEl("text", { x: clampX(cx + xOff, shw), y: cy + sDy, "text-anchor": "middle",
        style: `font:8.5px ${MONO};fill:${P.inkLo}` });
      dt.textContent = sub;
      if (isKey) placed.push(sr);
      labels.push(dt);
    }
    labels.forEach((el, k) => {
      g.appendChild(el); el.setAttribute("opacity", 0);
      animated.push({ start: S + 0.08 + k * 0.04, dur: 0.22, set: p => el.setAttribute("opacity", p) });
    });
    g.addEventListener("mouseenter", () => dot.setAttribute("r", 7));
    g.addEventListener("mouseleave", () => dot.setAttribute("r", isKey ? 5.5 : 4.5));
    const open = e => U.showDrill({ title: d.drill.title, value: d.drill.value, sub: d.drill.sub,
      source: d.drill.source, x: e.clientX, y: e.clientY });
    g.addEventListener("click", open);
    g.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); }
    });
  });

  // ── 图例 ──
  const lg = svgEl("g", {});
  svg.appendChild(lg);
  Object.entries(TCNL).forEach(([k, v], i) => {
    lg.appendChild(svgEl("circle", { cx: ML + 6 + i * 96, cy: TOP - 22, r: 4, fill: TCOL[k] }));
    const t = svgEl("text", { x: ML + 15 + i * 96, y: TOP - 18, style: `font:9.5px ${MONO};fill:${P.inkMd}` });
    t.textContent = v;
    lg.appendChild(t);
  });
  animated.push({ start: 0.3, dur: 0.3, set: p => lg.setAttribute("opacity", p) });

  U.play(animated, svg, { threshold: 0.25 });

  // ── 脚注：价格梯子 + 走量档最大涨幅（数据驱动）──
  const FX = RPT.frontierExtras;
  if (FX) {
    const f = document.createElement("p");
    f.style.cssText = `font:10px ${MONO};color:${P.inkMd};margin-top:8px;line-height:1.7`;
    f.textContent = FX.ladder + (FX.volumeHike ? " " + FX.volumeHike.label + "：" + FX.volumeHike.note : "");
    body.appendChild(f);
  }
})();
