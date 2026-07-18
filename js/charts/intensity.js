// §1 员工级强度大数字卡（宿主 #chart-intensity）
// 大数字墙（3 卡）+ B 面浪费率面板（红发丝线顶边，与 A 面同框）。
// 滚动渐次入场；点击任意卡下钻。数据全部来自 RPT.intensity。
(() => {
  const host = document.getElementById("chart-intensity");
  if (!host || !window.RPT || !RPT.intensity) return;
  const IT = RPT.intensity;
  const body = U.frame(host, {
    title: "强度落到员工账上",
    sub: "大数字 = A 面（用量）· 红边面板 = B 面（浪费率）· 点击任意卡下钻",
    src: "媒体报道与访谈 · 券商研究",
  });

  const P = U.PAL;
  const css = `
  #chart-intensity .it-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
  @media (max-width:820px){ #chart-intensity .it-grid { grid-template-columns:1fr; } }
  #chart-intensity .it-card { border-top:2px solid var(--ink); border-bottom:1px solid var(--line-lo);
    padding:14px 4px 12px; cursor:pointer; background:none; }
  #chart-intensity .it-card:hover { background:var(--paper-hi); }
  #chart-intensity .it-val { font-family:var(--mono); font-weight:700; font-size:27px; color:var(--ink);
    line-height:1.15; letter-spacing:-.01em; }
  #chart-intensity .it-lab { font-family:var(--serif); font-size:13px; color:var(--ink-md); margin-top:7px; }
  #chart-intensity .it-sub { font-family:var(--mono); font-size:9.5px; color:var(--ink-lo); margin-top:6px;
    line-height:1.6; border-top:1px dashed var(--line-lo); padding-top:6px; }
  #chart-intensity .it-waste { margin-top:22px; border-top:2px solid var(--neg);
    border-bottom:1px solid var(--line-lo); padding:14px 4px 12px; cursor:pointer; }
  #chart-intensity .it-waste:hover { background:var(--paper-hi); }
  #chart-intensity .it-wtag { font-family:var(--mono); font-size:9.5px; color:var(--neg); letter-spacing:.14em; }
  #chart-intensity .it-wrow { display:flex; gap:26px; align-items:baseline; flex-wrap:wrap; margin-top:6px; }
  #chart-intensity .it-wval { font-family:var(--mono); font-weight:700; font-size:24px; color:var(--neg); }
  #chart-intensity .it-wtxt { font-family:var(--serif); font-size:13px; color:var(--ink-md); line-height:1.75; flex:1; min-width:240px; }
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const grid = document.createElement("div");
  grid.className = "it-grid";
  body.appendChild(grid);

  const bind = (el, drill) => {
    el.setAttribute("data-drill-keep", "1");
    el.setAttribute("role", "button");
    el.tabIndex = 0;
    const open = e => U.showDrill({ title: drill.title, value: drill.value, sub: drill.sub,
      source: drill.source, x: e.clientX, y: e.clientY });
    el.addEventListener("click", open);
    el.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); }
    });
  };

  IT.cards.forEach(c => {
    const el = document.createElement("div");
    el.className = "it-card";
    // 第三行：支撑注记（下钻 sub 的第一分句提到卡面）
    const subLine = String((c.drill && c.drill.sub) || "").split(/；|。/)[0];
    el.innerHTML = `<div class="it-val">${U.esc(c.value)}</div><div class="it-lab">${U.esc(c.label)}</div>` +
      (subLine ? `<div class="it-sub">${U.esc(subLine)}</div>` : "");
    bind(el, c.drill);
    grid.appendChild(el);
  });

  if (IT.waste) {
    const w = document.createElement("div");
    w.className = "it-waste";
    w.innerHTML =
      `<div class="it-wtag">B 面 · 可压缩的浪费</div>` +
      `<div class="it-wrow"><span class="it-wval">${U.esc(IT.waste.rate)}</span>` +
      `<span class="it-wtxt">生产环境 token 浪费率区间。${U.esc(IT.waste.entelligence)}。${U.esc(IT.waste.note)}</span></div>`;
    bind(w, IT.waste.drill);
    body.appendChild(w);
  }

  // 滚动渐次入场
  U.reveal(body, ".it-card, .it-waste", 130);
})();
