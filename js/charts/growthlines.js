// §3a 需求增长线（宿主 #chart-growth）
// 每线一条横向复合条：条长 = 权重（体量份额），右侧挂增速标记（色阶区分 g 值）；
// hover 显示该线对 base 需求增长的贡献 %（运行时由数据层权重×增速计算）；点击下钻。
(() => {
  const host = document.getElementById("chart-growth");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "需求侧六条增长线 · 权重 × 增速",
    sub: "条长 = 权重（base 体量份额）· 右侧色阶标记 = base 增速 · 悬停看贡献 · 点击下钻锚点",
    src: "公司披露 · 券商研究 · 自研模型",
  });

  const P = U.PAL;
  const lines = RPT.growthLines;

  // 贡献份额 = w*(g-1) / Σw*(g-1)（由数据层实时计算）
  const denom = lines.reduce((s, l) => s + l.weight * (l.base - 1), 0);
  const contrib = l => l.weight * (l.base - 1) / denom;
  // base 合成增速 = 1 + Σw*(g-1)（≈ gap.cases.base.demand）
  const synth = 1 + denom;

  // 增速色阶：ink-lo → 电蓝（最快一极语义红描边强调）
  const gColor = d3.scaleLinear().domain([2, 8]).range(["#8595a6", P.blue]).clamp(true);

  const css = `
  #chart-growth .gl-row { display:grid; grid-template-columns: 168px 1fr 118px; gap:14px;
    align-items:center; padding:13px 8px; border-bottom:1px solid var(--line-lo); cursor:pointer; }
  #chart-growth .gl-row:first-of-type { border-top:1px solid var(--line-lo); }
  #chart-growth .gl-row:hover { background: rgba(34,81,255,.04); }
  #chart-growth .gl-name { font-family:var(--serif); font-weight:700; font-size:13.5px; color:var(--ink); line-height:1.3; }
  #chart-growth .gl-id { font-family:var(--mono); font-size:9px; color:var(--ink-lo); letter-spacing:.1em; }
  #chart-growth .gl-track { position:relative; height:26px; }
  #chart-growth .gl-bar { position:absolute; left:0; top:0; height:100%; border-radius:2px;
    transform-origin:left center; transform:scaleX(0); transition:transform .8s cubic-bezier(.2,.8,.3,1); }
  #chart-growth .gl-wlab { position:absolute; left:6px; top:50%; transform:translateY(-50%);
    font-family:var(--mono); font-size:10px; color:var(--paper-hi); white-space:nowrap; }
  #chart-growth .gl-wlab.out { color:var(--ink-md); }
  #chart-growth .gl-chip { justify-self:start; display:flex; align-items:center; gap:7px; }
  #chart-growth .gl-dot { width:12px; height:12px; border-radius:2px; flex:none; }
  #chart-growth .gl-g { font-family:var(--mono); font-weight:700; font-size:14px; color:var(--ink); }
  #chart-growth .gl-range { font-family:var(--mono); font-size:9px; color:var(--ink-lo); }
  #chart-growth .gl-info { margin-top:12px; padding:9px 12px; border:1px dashed var(--line);
    font-family:var(--mono); font-size:11px; color:var(--ink-md); min-height:34px; line-height:1.5; }
  #chart-growth .gl-info b { color:var(--blue); }
  @media (max-width:720px){ #chart-growth .gl-row{ grid-template-columns:110px 1fr 96px; gap:8px; } }
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const list = document.createElement("div");
  body.appendChild(list);
  const info = document.createElement("div");
  info.className = "gl-info";
  info.innerHTML = `base 合成需求增速 <b>${synth.toFixed(2)}x/年</b>（权重 × 增速加权，对照缺口模型 base 3.94x）· 悬停任意行查看该线贡献`;
  body.appendChild(info);

  const maxW = Math.max(...lines.map(l => l.weight));
  const rows = [];
  lines.forEach((l, i) => {
    const row = document.createElement("div");
    row.className = "gl-row";
    row.setAttribute("data-drill-keep", "1");
    const wpct = Math.round(l.weight * 100);
    row.innerHTML =
      `<div><div class="gl-id">${l.id}</div><div class="gl-name">${l.name}</div></div>` +
      `<div class="gl-track"><div class="gl-bar" style="width:${(l.weight / maxW * 100).toFixed(1)}%;` +
      `background:${l.id === "L-02" ? P.blue : P.ink};opacity:${l.id === "L-02" ? .9 : .72}">` +
      `<span class="gl-wlab ${l.weight < 0.09 ? "out" : ""}" ${l.weight < 0.09 ? 'style="left:auto;right:-6px;transform:translate(100%,-50%)"' : ""}>权重 ${wpct}%</span></div></div>` +
      `<div class="gl-chip"><span class="gl-dot" style="background:${gColor(l.base)}"></span>` +
      `<span><span class="gl-g">g ${l.base.toFixed(1)}x</span><br/><span class="gl-range">${l.low}–${l.high}x</span></span></div>`;
    row.addEventListener("mouseenter", () => {
      info.innerHTML = `<b>${l.name}</b> · 权重 ${wpct}% × 增速 ${l.base.toFixed(1)}x → 对 base 需求增长贡献 <b>${(contrib(l) * 100).toFixed(1)}%</b>`;
    });
    row.addEventListener("mouseleave", () => {
      info.innerHTML = `base 合成需求增速 <b>${synth.toFixed(2)}x/年</b>（权重 × 增速加权，对照缺口模型 base 3.94x）· 悬停任意行查看该线贡献`;
    });
    row.addEventListener("click", e => U.showDrill({
      title: l.drill.title, value: l.drill.value, sub: l.drill.sub,
      source: l.drill.source, x: e.clientX, y: e.clientY }));
    list.appendChild(row);
    rows.push(row);
  });

  // 入场：行渐入 + 条生长
  rows.forEach(r => r.classList.add("rv"));
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    rows.forEach((r, i) => setTimeout(() => {
      r.classList.add("in");
      r.querySelector(".gl-bar").style.transform = "scaleX(1)";
    }, i * 110));
  }, { threshold: 0.18 });
  io.observe(list);
})();
