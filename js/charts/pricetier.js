// §4c 价格两层参数卡（宿主 #chart-pricetier）
// C / F 两栏对比卡片（不做表格做卡片）：牌价锚、折扣档、12 个月变化、弹性、机制注记；
// 点击卡片下钻。数据：RPT.priceTier。
(() => {
  const host = document.getElementById("chart-pricetier");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "两层价格机制 · C 走量档 vs F 前沿档",
    sub: "同一枚 token，两种价格纪律 · 点击任意卡片下钻",
    src: "自研模型 · 公司披露",
  });

  const P = U.PAL;
  const css = `
  #chart-pricetier .pt-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
  @media (max-width:720px){ #chart-pricetier .pt-grid { grid-template-columns:1fr; } }
  #chart-pricetier .pt-card { border:1px solid var(--line); background:var(--paper);
    padding:18px 20px 14px; cursor:pointer; transition:box-shadow .18s ease, transform .18s ease; position:relative; }
  #chart-pricetier .pt-card:hover { box-shadow:0 10px 28px rgba(10,31,51,.12); transform:translateY(-2px); }
  #chart-pricetier .pt-card.c { border-top:3px solid var(--ink); }
  #chart-pricetier .pt-card.f { border-top:3px solid var(--blue); }
  #chart-pricetier .pt-tier { display:flex; align-items:baseline; gap:10px; }
  #chart-pricetier .pt-badge { font-family:var(--mono); font-weight:700; font-size:22px; }
  #chart-pricetier .pt-card.c .pt-badge { color:var(--ink); }
  #chart-pricetier .pt-card.f .pt-badge { color:var(--blue); }
  #chart-pricetier .pt-name { font-family:var(--serif); font-weight:700; font-size:15px; color:var(--ink); }
  #chart-pricetier .pt-row { display:flex; justify-content:space-between; gap:12px;
    padding:8px 0; border-bottom:1px dashed var(--line-lo); }
  #chart-pricetier .pt-row:last-of-type { border-bottom:none; }
  #chart-pricetier .pt-k { font-family:var(--mono); font-size:10px; color:var(--ink-lo); letter-spacing:.1em; padding-top:2px; white-space:nowrap; }
  #chart-pricetier .pt-v { font-family:var(--mono); font-size:12.5px; font-weight:700; color:var(--ink); text-align:right; }
  #chart-pricetier .pt-v small { display:block; font-weight:400; font-size:9.5px; color:var(--ink-lo); margin-top:2px; }
  #chart-pricetier .pt-note { font-size:12px; color:var(--ink-md); line-height:1.7; margin-top:10px;
    border-top:1px solid var(--line-lo); padding-top:9px; }
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const grid = document.createElement("div");
  grid.className = "pt-grid";
  body.appendChild(grid);

  const CARDS = [
    { key: "C", cls: "c", name: "走量档", d: RPT.priceTier.C,
      rows: [
        ["牌价锚", `$${RPT.priceTier.C.list} / MTok`],
        ["折扣档", RPT.priceTier.C.discount],
        ["12 个月变化", RPT.priceTier.C.change12m],
        ["弹性", RPT.priceTier.C.elasticity],
      ],
      drill: { title: "C 层 · 走量档（Jevons 成立）",
        value: `牌价锚 $${RPT.priceTier.C.list} · 折扣 ${RPT.priceTier.C.discount} · 弹性 ${RPT.priceTier.C.elasticity}`,
        sub: RPT.priceTier.C.note, source: "自研模型 · 公司披露" } },
    { key: "F", cls: "f", name: "前沿档", d: RPT.priceTier.F,
      rows: [
        ["牌价锚", `$${RPT.priceTier.F.list} / MTok`],
        ["折扣档", RPT.priceTier.F.discount],
        ["12 个月变化", RPT.priceTier.F.change12m],
        ["弹性", RPT.priceTier.F.elasticity],
      ],
      drill: { title: "F 层 · 前沿档（V 形反转后量价齐升）",
        value: `牌价锚 $${RPT.priceTier.F.list} · 折扣 ${RPT.priceTier.F.discount} · 弹性 ${RPT.priceTier.F.elasticity}`,
        sub: RPT.priceTier.F.note, source: "自研模型 · 公司披露" } },
  ];

  const cards = [];
  CARDS.forEach(c => {
    const el = document.createElement("div");
    el.className = `pt-card ${c.cls}`;
    el.setAttribute("data-drill-keep", "1");
    el.innerHTML =
      `<div class="pt-tier"><span class="pt-badge">${c.key}</span><span class="pt-name">${c.name}</span></div>` +
      c.rows.map(([k, v]) => {
        const m = String(v).match(/^([^(（]+)[(（](.*)$/);
        return `<div class="pt-row"><span class="pt-k">${k}</span><span class="pt-v">${m ? U.esc(m[1]).trim() + (m[2] ? `<small>（${U.esc(m[2])}</small>` : "") : U.esc(v)}</span></div>`;
      }).join("") +
      `<div class="pt-note">${U.esc(c.d.note)}</div>`;
    el.addEventListener("click", e => U.showDrill({
      title: c.drill.title, value: c.drill.value, sub: c.drill.sub,
      source: c.drill.source, x: e.clientX, y: e.clientY }));
    grid.appendChild(el);
    cards.push(el);
  });

  cards.forEach(c => c.classList.add("rv"));
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    cards.forEach((c, i) => setTimeout(() => c.classList.add("in"), i * 140));
  }, { threshold: 0.2 });
  io.observe(grid);
})();
