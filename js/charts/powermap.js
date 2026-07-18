// §7 美国电力瓶颈地图（宿主 #chart-powermap，用户点名"地图"件）
// 无第三方地图库：手绘简化 SVG 美国本土轮廓 + 五大湖提示形 + 8 类节点
// （并网枢纽圆 / PJM 区域虚线椭圆 / 自备电源方块 / 核电长协双圈 / 暂停令红菱），
// 另有"≥10 州暂停令"角标（名单未逐一披露，不虚构州名）；d3.zoom 拖平移 + 按钮缩放
// （滚轮缩放关闭，避免长滚动页面劫持）；点节点下钻。数据：RPT.powerMap。
(() => {
  const host = document.getElementById("chart-powermap");
  if (!host || !window.RPT || !RPT.powerMap) return;
  const body = U.frame(host, {
    title: "美国电力瓶颈地图 · 通电速度成为第一约束",
    sub: "圆 = 并网枢纽 · 方块 = 自备电源 · 双圈 = 核电长期购电 · 虚线圈 = PJM 区域 · 红菱 = 暂停令/撤回 · 拖动/双指缩放 · 点击节点下钻",
    src: "官方披露 · 行业机构 · 媒体报道与访谈",
  });

  const P = U.PAL, MONO = U.FONTS.mono, SERIF = U.FONTS.serif;

  const st = document.createElement("style");
  st.textContent =
    "#chart-powermap .cf-body{overflow-x:auto;position:relative}" +
    "#chart-powermap .pm-wrap{min-width:760px;position:relative}" +
    "#chart-powermap .pm-zoom{position:absolute;top:6px;right:10px;display:flex;gap:6px;z-index:2}" +
    "#chart-powermap .pm-zoom button{font-family:" + MONO + ";font-size:11px;color:var(--ink-md);" +
    "background:var(--paper);border:1px solid var(--line);padding:3px 10px;cursor:pointer;border-radius:2px}" +
    "#chart-powermap .pm-zoom button:hover{color:var(--blue);border-color:var(--blue)}" +
    "#chart-powermap .pm-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px 28px;" +
    "border-top:1px solid var(--line-lo);margin-top:14px;padding-top:12px}" +
    "#chart-powermap .pm-stat b{display:block;font-family:" + MONO + ";font-size:9px;font-weight:700;" +
    "letter-spacing:.08em;color:var(--ink-lo);margin-bottom:3px;text-transform:uppercase}" +
    "#chart-powermap .pm-stat span{font-size:11px;color:var(--ink-md);line-height:1.55}" +
    "#chart-powermap .pm-bside{border-top:1px solid var(--line-lo);margin-top:12px;padding-top:10px;" +
    "font-family:" + MONO + ";font-size:10px;color:var(--ink-md);line-height:1.6}" +
    "#chart-powermap .pm-bside b{color:var(--neg)}" +
    "@media (max-width:860px){#chart-powermap .pm-stats{grid-template-columns:1fr}}";
  document.head.appendChild(st);

  const W = 1000, H = 640, ML = 34, MR = 34, TOP = 44, BOT = 30;
  // 等距圆柱近似投影（示意地图，非精确 GIS）
  const LON0 = -126, LON1 = -66, LAT0 = 49.8, LAT1 = 24.3;
  const px = lon => ML + (lon - LON0) / (LON1 - LON0) * (W - ML - MR);
  const py = lat => TOP + (LAT0 - lat) / (LAT0 - LAT1) * (H - TOP - BOT);
  const pt = ll => px(ll[0]) + "," + py(ll[1]);

  // ── 简化美国本土轮廓（顺时针，自西北角）──
  const CONUS = [
    [-124.7, 48.4], [-122.8, 49.0], [-117.0, 49.0], [-110.0, 49.0], [-104.0, 49.0], [-97.2, 49.0],
    [-95.2, 49.0], [-92.1, 46.8], [-89.6, 47.1], [-88.0, 46.1], [-85.6, 46.6], [-84.6, 46.4],
    [-83.6, 45.9], [-82.5, 45.4], [-82.5, 43.0], [-83.1, 42.2], [-82.5, 41.7], [-81.0, 41.4],
    [-79.8, 42.3], [-79.0, 43.3], [-76.8, 43.6], [-74.7, 45.0], [-71.5, 45.0], [-69.8, 45.3],
    [-67.8, 47.0], [-67.0, 45.2], [-68.7, 44.3], [-69.9, 43.7], [-70.7, 42.9], [-70.0, 41.7],
    [-71.9, 41.2], [-73.7, 40.9], [-74.0, 40.0], [-74.3, 39.0], [-75.2, 38.0], [-75.9, 36.6],
    [-76.3, 34.9], [-77.9, 33.9], [-79.0, 32.8], [-80.7, 31.4], [-81.2, 29.6], [-80.2, 26.9],
    [-80.1, 25.2], [-81.7, 26.2], [-82.7, 27.8], [-82.9, 29.2], [-84.3, 30.0], [-86.4, 30.4],
    [-88.9, 30.3], [-89.6, 29.3], [-91.4, 29.3], [-93.7, 29.7], [-96.0, 28.6], [-97.3, 26.0],
    [-99.1, 26.6], [-100.5, 28.2], [-102.8, 29.6], [-104.8, 29.3], [-106.4, 31.8], [-108.2, 31.8],
    [-111.1, 31.4], [-114.7, 32.5], [-117.1, 32.6], [-119.5, 34.0], [-120.6, 34.6], [-122.3, 37.2],
    [-123.7, 39.5], [-124.1, 41.5], [-124.2, 43.5], [-124.0, 46.2], [-124.7, 48.4],
  ];
  // 五大湖提示形（纸面色 = 视觉镂空）
  const LAKES = [
    [[-92.1, 46.7], [-90.3, 46.9], [-88.2, 46.9], [-86.6, 47.2], [-85.4, 46.9], [-84.7, 46.5], [-86.2, 46.3], [-88.6, 46.2], [-90.7, 46.3], [-92.0, 46.5]],
    [[-87.9, 44.2], [-87.4, 42.8], [-86.9, 41.7], [-86.2, 41.9], [-85.9, 43.2], [-86.4, 44.5], [-87.2, 45.1]],
    [[-83.6, 44.3], [-82.6, 43.9], [-82.1, 43.2], [-82.5, 44.7], [-83.3, 45.4], [-84.1, 45.0]],
    [[-82.4, 41.9], [-81.0, 41.6], [-79.6, 42.4], [-79.1, 42.9], [-80.6, 42.6], [-82.1, 42.3]],
  ];

  // 节点经纬与标签摆位（布局参数，非数据；缺省 id 跳过不画）
  const GEO = {
    nva: { ll: [-77.46, 39.03], anchor: "start", dx: 12, dy: 5 },
    phx: { ll: [-112.07, 33.45], anchor: "middle", dx: 0, dy: 24 },
    dal: { ll: [-96.80, 32.78], anchor: "start", dx: 12, dy: 5 },
    pjm: { ll: [-79.80, 39.90], region: true },
    abilene: { ll: [-99.73, 32.45], anchor: "middle", dx: -14, dy: 24 },
    memphis: { ll: [-90.05, 35.15], anchor: "start", dx: 12, dy: 5 },
    tmichrane: { ll: [-76.72, 40.15], anchor: "middle", dx: 0, dy: -16, above: true },
    michigan: { ll: [-84.40, 42.90], anchor: "middle", dx: 26, dy: -14, above: true },
  };

  const wrap = document.createElement("div");
  wrap.className = "pm-wrap";
  body.appendChild(wrap);

  const svg = d3.select(wrap).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .style("width", "100%").style("display", "block")
    .attr("data-drill-keep", "1");
  const animated = [];

  // 顶层说明（数据自带 explainer）
  svg.append("text")
    .attr("x", ML).attr("y", 22)
    .attr("style", `font:9.5px ${MONO};fill:${P.inkLo}`)
    .text(RPT.powerMap.explainer || "");

  const g = svg.append("g"); // 缩放层

  // ── 国土轮廓 + 湖 ──
  const outline = g.append("path")
    .attr("d", "M" + CONUS.map(pt).join(" L") + " Z")
    .attr("fill", "rgba(10,31,51,.035)")
    .attr("stroke", P.inkMd).attr("stroke-width", 1.2).attr("stroke-linejoin", "round");
  LAKES.forEach(lk => {
    g.append("path")
      .attr("d", "M" + lk.map(pt).join(" L") + " Z")
      .attr("fill", P.paper).attr("stroke", P.line).attr("stroke-width", 1);
  });

  const nodes = RPT.powerMap.nodes.filter(nd => GEO[nd.id]);
  const regionNode = nodes.find(nd => GEO[nd.id].region);
  const pointNodes = nodes.filter(nd => !GEO[nd.id].region);

  // ── PJM 区域虚线椭圆 ──
  if (regionNode) {
    const cx = px(GEO[regionNode.id].ll[0]), cy = py(GEO[regionNode.id].ll[1]);
    const rg = g.append("g").style("cursor", "pointer");
    rg.append("ellipse")
      .attr("cx", cx).attr("cy", cy).attr("rx", 96).attr("ry", 64)
      .attr("fill", "rgba(34,81,255,.06)")
      .attr("stroke", P.blue).attr("stroke-width", 1.2).attr("stroke-dasharray", "5 4");
    const rl1 = rg.append("text")
      .attr("x", cx).attr("y", cy + 82).attr("text-anchor", "middle")
      .attr("style", `font:700 10px ${MONO};fill:${P.blue}`)
      .text("PJM 区域");
    const rl2 = rg.append("text")
      .attr("x", cx).attr("y", cy + 95).attr("text-anchor", "middle")
      .attr("style", `font:8.5px ${MONO};fill:${P.inkMd}`)
      .text(regionNode.value);
    rg.on("click", e => U.showDrill({
      title: regionNode.drill.title, value: regionNode.drill.value, sub: regionNode.drill.sub,
      source: regionNode.drill.source, x: e.clientX, y: e.clientY }));
    animated.push({ start: 0.3, dur: 0.6, set: p => rg.attr("opacity", p) });
    rg.attr("opacity", 0);
  }

  // ── 点节点 ──
  const glyph = {
    hub: gg => {
      gg.append("circle").attr("r", 10).attr("fill", "none")
        .attr("stroke", "rgba(34,81,255,.35)").attr("stroke-width", 1);
      gg.append("circle").attr("r", 5.5).attr("fill", P.blue);
    },
    project: gg => {
      gg.append("rect").attr("x", -5.5).attr("y", -5.5).attr("width", 11).attr("height", 11).attr("fill", P.blue);
    },
    nuclear: gg => {
      gg.append("circle").attr("r", 7).attr("fill", P.paperHi).attr("stroke", P.blue).attr("stroke-width", 1.6);
      gg.append("circle").attr("r", 2.4).attr("fill", P.blue);
    },
    moratorium: gg => {
      gg.append("path").attr("d", "M 0 -7 L 7 0 L 0 7 L -7 0 Z")
        .attr("fill", P.paperHi).attr("stroke", P.red).attr("stroke-width", 1.6);
      gg.append("line").attr("x1", -4).attr("y1", 4).attr("x2", 4).attr("y2", -4)
        .attr("stroke", P.red).attr("stroke-width", 1.6);
    },
  };

  pointNodes.forEach((nd, i) => {
    const L = GEO[nd.id];
    const cx = px(L.ll[0]), cy = py(L.ll[1]);
    const gg = g.append("g")
      .attr("transform", `translate(${cx},${cy})`)
      .style("cursor", "pointer")
      .attr("opacity", 0);
    (glyph[nd.type] || glyph.hub)(gg);

    // 热区（触屏友好）
    gg.append("circle").attr("r", 16).attr("fill", "rgba(0,0,0,0)");

    // 标签：名 + 读数两行
    const nameCol = nd.type === "moratorium" ? P.red : P.ink;
    const t1 = gg.append("text")
      .attr("x", L.dx).attr("y", L.above ? L.dy - 10 : L.dy)
      .attr("text-anchor", L.anchor)
      .attr("style", `font:700 10.5px ${MONO};fill:${nameCol}`)
      .text(nd.name);
    const t2 = gg.append("text")
      .attr("x", L.dx).attr("y", L.above ? L.dy + 2 : L.dy + 12)
      .attr("text-anchor", L.anchor)
      .attr("style", `font:8.5px ${MONO};fill:${P.inkMd}`)
      .text(nd.value);
    gg.on("click", e => U.showDrill({
      title: nd.drill.title, value: nd.drill.value, sub: nd.drill.sub,
      source: nd.drill.source, x: e.clientX, y: e.clientY }));
    animated.push({ start: 0.45 + i * 0.12, dur: 0.4, set: p => gg.attr("opacity", p) });
  });

  // ── "≥10 州暂停令"角标（名单未逐一披露：不虚构州名，不落在具体州位）──
  const mor = nodes.find(nd => nd.type === "moratorium");
  if (mor) {
    const ig = svg.append("g").attr("transform", `translate(${W - MR - 236},${H - BOT - 40})`)
      .style("cursor", "pointer").attr("opacity", 0);
    for (let k = 0; k < 10; k++) {
      ig.append("path").attr("d", "M 0 -4.5 L 4.5 0 L 0 4.5 L -4.5 0 Z")
        .attr("transform", `translate(${k * 13 + 4.5},6)`)
        .attr("fill", "none").attr("stroke", P.red).attr("stroke-width", 1.2);
    }
    ig.append("text")
      .attr("x", 0).attr("y", 24)
      .attr("style", `font:8.5px ${MONO};fill:${P.inkMd}`)
      .text("至少 10 州出现暂停令标记（名单未逐一披露）");
    ig.on("click", e => U.showDrill({
      title: mor.drill.title, value: mor.drill.value, sub: mor.drill.sub,
      source: mor.drill.source, x: e.clientX, y: e.clientY }));
    animated.push({ start: 1.5, dur: 0.5, set: p => ig.attr("opacity", p) });
  }

  // ── 缩放：拖平移 + 按钮（滚轮关闭防长滚动劫持；触屏单指放行页面滚动，双指捏合缩放）──
  const zoom = d3.zoom()
    .scaleExtent([1, 5])
    .translateExtent([[-140, -100], [W + 140, H + 100]])
    .filter(e => e.type !== "wheel" && (!e.touches || e.touches.length >= 2))
    .on("zoom", e => g.attr("transform", e.transform));
  svg.call(zoom);
  const zb = document.createElement("div");
  zb.className = "pm-zoom";
  [["＋", () => svg.transition().duration(220).call(zoom.scaleBy, 1.45)],
   ["－", () => svg.transition().duration(220).call(zoom.scaleBy, 1 / 1.45)],
   ["复位", () => svg.transition().duration(280).call(zoom.transform, d3.zoomIdentity)]]
    .forEach(([t, fn]) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = t;
      b.addEventListener("click", fn);
      zb.appendChild(b);
    });
  wrap.appendChild(zb);

  // ── 关键读数带（数据自带 stats）──
  if (RPT.powerMap.stats && RPT.powerMap.stats.length) {
    const grid = document.createElement("div");
    grid.className = "pm-stats";
    RPT.powerMap.stats.forEach(s => {
      const c = document.createElement("div");
      c.className = "pm-stat";
      const b = document.createElement("b"); b.textContent = s.label;
      const v = document.createElement("span"); v.textContent = s.value;
      c.appendChild(b); c.appendChild(v);
      grid.appendChild(c);
    });
    body.appendChild(grid);
  }

  // ── B 面三条（并列不藏）──
  if (RPT.powerMap.bside) {
    const bs = document.createElement("div");
    bs.className = "pm-bside";
    const m = String(RPT.powerMap.bside).match(/^B 面三条：(.+)$/);
    const bEl = document.createElement("b"); bEl.textContent = "B 面  ";
    bs.appendChild(bEl);
    bs.appendChild(document.createTextNode(m ? m[1] : RPT.powerMap.bside));
    body.appendChild(bs);
  }

  U.play(animated, svg.node(), { threshold: 0.2 });
})();
