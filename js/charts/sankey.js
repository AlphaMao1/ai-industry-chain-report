// §9 算力开支传导桑基图（宿主 #chart-sankey）
// 模型公司（OpenAI/Anthropic）的算力开支 → 云 → 半导体/数据中心各层。
// D3+SVG 手写贝塞尔缎带（无 d3-sankey 插件）；带越宽流量越大（结构示意，不按金额精确比例——图内注明）。
// 点缎带/点节点下钻。数据：RPT.sankey。
(() => {
  const host = document.getElementById("chart-sankey");
  if (!host || !window.RPT || !window.U || !window.d3) return;
  const SK = RPT.sankey;
  if (!SK || !SK.flows) return;
  const P = U.PAL;
  const SRC = "官方披露 · 媒体报道与访谈 · 截至 2026-07-17";

  const body = U.frame(host, {
    title: "算力开支传导：模型公司的成本，是上游各层的收入",
    sub: "缎带宽度为结构示意（不按金额精确比例）· 两条粗带标有承诺额 · 点缎带或节点下钻",
    src: SRC,
  });

  // ── 布局（三列：模型公司 / 云 / 半导体·数据中心）──
  const W = 1080, H = 540;
  const COLX = { left: [40, 190], mid: [465, 615], right: [890, 1040] };
  const NODE = {
    "Anthropic": { col: "left", cy: 90 },
    "OpenAI": { col: "left", cy: 420 },
    "Google Cloud": { col: "mid", cy: 150 },
    "AWS": { col: "mid", cy: 225 },
    "Microsoft Azure": { col: "mid", cy: 300 },
    "Oracle": { col: "mid", cy: 385 },
    "Broadcom": { col: "right", cy: 80 },
    "数据中心/电力": { col: "right", cy: 170 },
    "NVIDIA": { col: "right", cy: 470 },
  };
  const COLSTROKE = { left: P.ink, mid: P.blue, right: P.inkMd };
  const COLHEAD = { left: "模型公司", mid: "云", right: "半导体 · 数据中心/电力" };
  // 缎带宽度：两条有承诺额的流向加宽，其余标准宽（示意口径，图注声明）
  const widthOf = f => f.label.indexOf("300B") >= 0 ? 18 : f.from === "OpenAI" && f.to === "Microsoft Azure" ? 13 : 7;

  const flows = SK.flows.map(f => ({ ...f, t: widthOf(f) }));

  // 每节点出/入边按对端高度排序，分配缎带在节点边上的出/入口偏移（防交叉）
  const out = {}, inn = {};
  flows.forEach(f => {
    (out[f.from] = out[f.from] || []).push(f);
    (inn[f.to] = inn[f.to] || []).push(f);
  });
  const stack = (list, other) => {
    if (!list) return 0;
    list.sort((a, b) => NODE[other(a)].cy - NODE[other(b)].cy);
    const total = list.reduce((a, f) => a + f.t, 0) + (list.length - 1) * 2.5;
    return total;
  };
  Object.keys(NODE).forEach(n => {
    const oN = out[n], iN = inn[n];
    const oTot = stack(oN, f => f.to), iTot = stack(iN, f => f.from);
    NODE[n].h = Math.max(30, oTot + 10, iTot + 10);
    let c = NODE[n].cy - oTot / 2;
    (oN || []).forEach(f => { f.sy = c + f.t / 2; c += f.t + 2.5; });
    c = NODE[n].cy - iTot / 2;
    (iN || []).forEach(f => { f.ty = c + f.t / 2; c += f.t + 2.5; });
  });

  const scroll = document.createElement("div");
  scroll.style.cssText = "overflow-x:auto;-webkit-overflow-scrolling:touch";
  body.appendChild(scroll);

  const svg = d3.select(scroll).append("svg")
    .attr("viewBox", "0 0 " + W + " " + H)
    .style("width", "100%").style("min-width", "760px").style("display", "block")
    .attr("data-drill-keep", "1");

  // 列眉标
  Object.keys(COLX).forEach(k => {
    svg.append("text").attr("x", (COLX[k][0] + COLX[k][1]) / 2).attr("y", 26)
      .attr("text-anchor", "middle")
      .attr("style", "font:700 10.5px " + U.FONTS.mono + ";letter-spacing:.16em;fill:" + COLSTROKE[k])
      .text(COLHEAD[k]);
  });

  // ── 缎带（手写贝塞尔带）──
  const ribbon = f => {
    const sx = COLX[NODE[f.from].col][1], tx = COLX[NODE[f.to].col][0];
    const dx = (tx - sx) * 0.42, t = f.t, sy = f.sy, ty = f.ty;
    return "M " + sx + " " + (sy - t / 2) +
      " C " + (sx + dx) + " " + (sy - t / 2) + " " + (tx - dx) + " " + (ty - t / 2) + " " + tx + " " + (ty - t / 2) +
      " L " + tx + " " + (ty + t / 2) +
      " C " + (tx - dx) + " " + (ty + t / 2) + " " + (sx + dx) + " " + (sy + t / 2) + " " + sx + " " + (sy + t / 2) + " Z";
  };
  const gF = svg.append("g");
  const paths = gF.selectAll("path").data(flows).join("path")
    .attr("d", ribbon)
    .attr("fill", P.blue).attr("opacity", 0)
    .style("cursor", "pointer");
  paths.on("mouseenter", function (e, f) {
      d3.select(this).attr("opacity", 0.45);
      U.showTip("<b>" + U.esc(f.from) + " → " + U.esc(f.to) + "</b><br/>" + U.esc(f.label) + "<br/>点击看注记", e.clientX, e.clientY);
    })
    .on("mousemove", function (e, f) {
      U.showTip("<b>" + U.esc(f.from) + " → " + U.esc(f.to) + "</b><br/>" + U.esc(f.label) + "<br/>点击看注记", e.clientX, e.clientY);
    })
    .on("mouseleave", function () { d3.select(this).attr("opacity", 0.2); U.hideTip(); })
    .on("click", (e, f) => U.showDrill({
      title: f.from + " → " + f.to, value: f.label,
      sub: SK.note, source: SRC, x: e.clientX, y: e.clientY }));

  // 两条粗带的中点标签（有承诺额者）
  flows.filter(f => f.t >= 12).forEach(f => {
    const sx = COLX[NODE[f.from].col][1], tx = COLX[NODE[f.to].col][0];
    svg.append("text").attr("x", (sx + tx) / 2).attr("y", (f.sy + f.ty) / 2 - f.t / 2 - 6)
      .attr("text-anchor", "middle")
      .attr("style", "font:700 10.5px " + U.FONTS.mono + ";fill:" + P.blue)
      .text(f.label);
  });

  // ── 节点 ──
  const gN = svg.append("g");
  Object.keys(NODE).forEach(n => {
    const nd = NODE[n], x0 = COLX[nd.col][0], w = COLX[nd.col][1] - COLX[nd.col][0];
    const g = gN.append("g").style("cursor", "pointer");
    g.append("rect")
      .attr("x", x0).attr("y", nd.cy - nd.h / 2).attr("width", w).attr("height", nd.h)
      .attr("fill", P.paperHi).attr("stroke", COLSTROKE[nd.col]).attr("stroke-width", 1.5)
      .attr("opacity", 0);
    g.append("text").attr("x", x0 + w / 2).attr("y", nd.cy + 4)
      .attr("text-anchor", "middle")
      .attr("style", "font:700 11px " + U.FONTS.mono + ";fill:" + P.ink)
      .attr("opacity", 0).text(n);
    g.on("click", e => {
      const outs = (out[n] || []).map(f => "→ " + f.to + "（" + f.label + "）");
      const ins = (inn[n] || []).map(f => "← " + f.from + "（" + f.label + "）");
      U.showDrill({ title: n, value: outs.concat(ins).join("；") || "—",
        sub: SK.note, source: SRC, x: e.clientX, y: e.clientY });
    });
  });

  // 入场：节点淡入 → 缎带渐次显现
  const animated = [
    { start: 0, dur: 0.35, set: p => gN.selectAll("rect").attr("opacity", p) },
    { start: 0.1, dur: 0.35, set: p => gN.selectAll("text").attr("opacity", p) },
    { start: 0.35, dur: 0.6, set: p => paths.attr("opacity", 0.2 * p) },
  ];
  U.play(animated, svg.node(), { threshold: 0.2 });

  // 口径图注
  const note = document.createElement("p");
  note.style.cssText = "margin:10px 0 0;font:10.5px " + U.FONTS.mono + ";color:" + P.inkLo + ";line-height:1.7";
  note.textContent = "注：" + SK.note;
  body.appendChild(note);
})();
