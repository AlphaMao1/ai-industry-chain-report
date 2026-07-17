// §7 中国链分层证据卡（宿主 #chart-china）
// cls=strong 蓝 / watch 黄 / weak 灰；每层一张卡，卡内 items 为证据点；点击下钻。
// 数据：RPT.chinaEvidence。
(() => {
  const host = document.getElementById("chart-china");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "中国链 · 五层证据分层",
    sub: "蓝 = 利润持续兑现 · 黄 = 周期观察 · 灰 = 量增利未证 · 点击任意卡片下钻",
    src: "公司披露 · 券商研究 · 行业官方",
  });

  const P = U.PAL;
  const CLS = {
    strong: { col: P.blue, bg: "rgba(34,81,255,.06)", tag: "strong · 已验证" },
    watch:  { col: P.amber, bg: "rgba(185,122,30,.07)", tag: "watch · 观察" },
    weak:   { col: P.inkLo, bg: "rgba(133,149,166,.08)", tag: "weak · 未证" },
  };

  const css = `
  #chart-china .cn-grid { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:16px; }
  @media (max-width:760px){ #chart-china .cn-grid { grid-template-columns:1fr; } }
  #chart-china .cn-card { border:1px solid var(--line); border-top:3px solid; padding:16px 18px 13px;
    cursor:pointer; transition:box-shadow .16s ease, transform .16s ease; }
  #chart-china .cn-card:hover { box-shadow:0 10px 26px rgba(10,31,51,.12); transform:translateY(-2px); }
  #chart-china .cn-tag { font-family:var(--mono); font-size:9px; letter-spacing:.16em; }
  #chart-china .cn-layer { font-family:var(--serif); font-weight:900; font-size:17px; color:var(--ink); margin-top:4px; }
  #chart-china .cn-val { font-size:12.5px; font-weight:700; margin-top:6px; line-height:1.5; }
  #chart-china .cn-items { margin-top:8px; border-top:1px dashed var(--line); padding-top:8px; }
  #chart-china .cn-item { font-size:12px; color:var(--ink-md); line-height:1.6; padding-left:13px;
    position:relative; margin-top:5px; }
  #chart-china .cn-item::before { content:"·"; position:absolute; left:2px; color:var(--ink-lo); }
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const grid = document.createElement("div");
  grid.className = "cn-grid";
  body.appendChild(grid);

  const cards = [];
  RPT.chinaEvidence.forEach(L => {
    const c = CLS[L.cls] || CLS.weak;
    const el = document.createElement("div");
    el.className = "cn-card";
    el.style.borderTopColor = c.col;
    el.style.background = c.bg;
    el.setAttribute("data-drill-keep", "1");
    const items = L.items.split("、").map(s => s.trim()).filter(Boolean);
    el.innerHTML =
      `<div class="cn-tag" style="color:${c.col}">${c.tag}</div>` +
      `<div class="cn-layer">${L.layer}</div>` +
      `<div class="cn-val" style="color:${c.col}">${U.esc(L.drill.value)}</div>` +
      `<div class="cn-items">${items.map(it => `<div class="cn-item">${U.esc(it)}</div>`).join("")}</div>`;
    el.addEventListener("click", e => U.showDrill({
      title: `中国链 · ${L.layer}（${L.cls}）`,
      value: L.drill.value, sub: L.drill.sub, source: L.drill.source,
      x: e.clientX, y: e.clientY }));
    grid.appendChild(el);
    cards.push(el);
  });

  cards.forEach(c => c.classList.add("rv"));
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    cards.forEach((c, i) => setTimeout(() => c.classList.add("in"), i * 120));
  }, { threshold: 0.15 });
  io.observe(grid);
})();
