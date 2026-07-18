// §7 电力硬度三柱（宿主 #chart-powerhard）
// 三柱：并网排队 5 年 / 大型变压器 36–48 个月 / 大型燃机 2028 年交付；
// 柱高 ∝ 交期量级（换算月，无数值轴——三柱单位不同，不共轴以免误读）；
// 第一柱旁叠"2000–2007 不足 2 年"空心历史对照（从注记文本解析，不硬编码）；
// 点击柱下钻全文与出处。数据：RPT.powerHard。
(() => {
  const host = document.getElementById("chart-powerhard");
  if (!host || !window.RPT || !RPT.powerHard) return;

  const P = U.PAL, MONO = U.FONTS.mono, SERIF = U.FONTS.serif, S = U.svgEl;
  const cols = RPT.powerHard;

  const body = U.frame(host, {
    title: "电力硬度三柱 · " + cols.map(c => c.value).join(" / "),
    sub: "柱高 ∝ 交期量级（换算月，无数值轴）· 空心虚线 = 历史对照 · 点击柱下钻全文与出处",
    src: "官方披露 · 行业机构",
  });

  const st = document.createElement("style");
  st.textContent = "#chart-powerhard .cf-body{overflow-x:auto}#chart-powerhard svg{min-width:640px;display:block}";
  document.head.appendChild(st);

  // 交期字符串 → 月数（"5 年"→60；"36–48 个月"→48；"2028 年"为交付日历年（>100），
  // 回查注记"交期约 5 年"→60；均从数据解析，不硬编码）
  const months = c => {
    let m = String(c.value).match(/([\d.]+)\s*[–—-]\s*([\d.]+)\s*个月/);
    if (m) return +m[2];
    m = String(c.value).match(/([\d.]+)\s*个月/);
    if (m) return +m[1];
    m = String(c.value).match(/([\d.]+)\s*年/);
    if (m && +m[1] < 100) return +m[1] * 12;
    m = String(c.note || "").match(/交期约\s*([\d.]+)\s*年/);
    if (m) return +m[1] * 12;
    return 12;
  };
  // 历史对照（"2000–2007 年不足 2 年"→24 个月 + 标签）
  const ghostOf = c => {
    const m = String(c.note || "").match(/(\d{4}\s*[–—-]\s*\d{4})\s*年?(不足\s*[\d.]+\s*年)/);
    if (!m) return null;
    const y = m[2].match(/([\d.]+)/);
    return y ? { months: +y[1] * 12, label: m[1], value: m[2] } : null;
  };

  const W = 1080, ML = 90, MR = 90, TOP = 56, BASE = 320, MAXH = 220;
  const H = BASE + 118;
  const n = cols.length, colW = (W - ML - MR) / n;
  const maxM = Math.max(...cols.map(months), 1);

  const svg = S("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", "data-drill-keep": "1" });
  body.appendChild(svg);
  const animated = [];

  // 基线
  const bl = S("line", { x1: ML - 20, y1: BASE, x2: W - MR + 20, y2: BASE, stroke: P.ink, "stroke-width": 1.2 });
  svg.appendChild(bl);
  const axNote = S("text", { x: ML - 20, y: TOP - 24, style: `font:9.5px ${MONO};fill:${P.inkLo}` });
  axNote.textContent = "交期量级（月）";
  svg.appendChild(axNote);

  // CJK 按字折行
  const wrap = (s, nch) => {
    const out = [];
    let cur = "";
    for (const ch of String(s || "")) {
      cur += ch;
      if (cur.length >= nch) { out.push(cur); cur = ""; }
    }
    if (cur) out.push(cur);
    return out;
  };

  cols.forEach((c, i) => {
    const cx = ML + i * colW + colW / 2;
    const mo = months(c);
    const h = Math.max(18, mo / maxM * MAXH);
    const bw = 112;
    const hasGhost = ghostOf(c);
    const x0 = cx - bw / 2 + (hasGhost ? 24 : 0);

    // 历史对照空心柱
    if (hasGhost) {
      const gh = Math.max(10, hasGhost.months / maxM * MAXH);
      const gx = cx - bw / 2 - 46;
      const gr = S("rect", { x: gx, y: BASE, width: 40, height: 0,
        fill: "none", stroke: P.inkLo, "stroke-width": 1.2, "stroke-dasharray": "4 3", rx: 2 });
      svg.appendChild(gr);
      animated.push({ start: 0.1, dur: 0.5, set: p => { gr.setAttribute("y", BASE - gh * p); gr.setAttribute("height", gh * p); } });
      const gl1 = S("text", { x: gx + 20, y: BASE - gh - 22, "text-anchor": "middle",
        style: `font:8.5px ${MONO};fill:${P.inkLo}`, opacity: 0 });
      gl1.textContent = hasGhost.label;
      const gl2 = S("text", { x: gx + 20, y: BASE - gh - 10, "text-anchor": "middle",
        style: `font:8.5px ${MONO};fill:${P.inkLo}`, opacity: 0 });
      gl2.textContent = hasGhost.value;
      svg.appendChild(gl1); svg.appendChild(gl2);
      animated.push({ start: 0.55, dur: 0.3, set: p => { gl1.setAttribute("opacity", p); gl2.setAttribute("opacity", p); } });
    }

    // 主柱
    const bar = S("rect", { x: x0, y: BASE, width: bw, height: 0, fill: P.ink, rx: 2 });
    bar.style.cursor = "pointer";
    svg.appendChild(bar);
    animated.push({ start: 0.15 + i * 0.2, dur: 0.65, set: p => { bar.setAttribute("y", BASE - h * p); bar.setAttribute("height", h * p); } });

    // 柱顶大读数
    const vl = S("text", { x: x0 + bw / 2, y: BASE - h - 12, "text-anchor": "middle",
      style: `font:700 21px ${MONO};fill:${P.ink}`, opacity: 0 });
    vl.textContent = c.value;
    svg.appendChild(vl);
    animated.push({ start: 0.55 + i * 0.2, dur: 0.3, set: p => vl.setAttribute("opacity", p) });

    // 柱下：名称 + 注（三行截断，全文在下钻）
    const lb = S("text", { x: cx, y: BASE + 24, "text-anchor": "middle",
      style: `font:700 13px ${SERIF};fill:${P.ink}` });
    lb.textContent = c.label;
    svg.appendChild(lb);
    const lines = wrap(c.note, 30);
    const shown = lines.slice(0, 3);
    if (lines.length > 3) shown[2] = shown[2] + "…";
    shown.forEach((ln, k) => {
      const nt = S("text", { x: cx, y: BASE + 42 + k * 14, "text-anchor": "middle",
        style: `font:9px ${MONO};fill:${P.inkLo}` });
      nt.textContent = ln;
      svg.appendChild(nt);
    });

    const drill = e => U.showDrill({
      title: c.label,
      // value 补全：读数 + 注记首分句（"5 年"类短读数不再裸奔）
      value: c.value + "（" + String(c.note || "").split(/；|。/)[0] + "）",
      sub: c.note, source: c.source,
      x: e.clientX, y: e.clientY });
    bar.addEventListener("click", drill);
    vl.addEventListener("click", drill);
    vl.style.cursor = "pointer";
    lb.addEventListener("click", drill);
    lb.style.cursor = "pointer";
  });

  U.play(animated, svg, { threshold: 0.2 });
})();
