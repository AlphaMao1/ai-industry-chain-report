// §9 反证登记册（宿主 #chart-signals）
// 8 张触发卡网格：id、名称、当前读数大字、阈值、触发动作；点击下钻观察窗。
// 数据：RPT.signals。
(() => {
  const host = document.getElementById("chart-signals");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "反证登记册 · 八条触发器",
    sub: "任何一条触发 → 回到对应模型重估 · 点击任意卡片查看观察窗",
    src: "公司披露 · 券商研究 · 行业官方 · 自研模型",
  });

  const P = U.PAL;
  const css = `
  #chart-signals .sg-grid { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:14px; }
  @media (max-width:1000px){ #chart-signals .sg-grid { grid-template-columns:repeat(2, minmax(0,1fr)); } }
  @media (max-width:560px){ #chart-signals .sg-grid { grid-template-columns:1fr; } }
  #chart-signals .sg-card { border:1px solid var(--line); border-top:3px solid var(--red);
    background:var(--paper); padding:14px 16px 12px; cursor:pointer;
    transition:box-shadow .16s ease, transform .16s ease; display:flex; flex-direction:column; }
  #chart-signals .sg-card:hover { box-shadow:0 10px 26px rgba(10,31,51,.12); transform:translateY(-2px); }
  #chart-signals .sg-id { font-family:var(--mono); font-size:9.5px; font-weight:700; letter-spacing:.18em; color:var(--red); }
  #chart-signals .sg-name { font-family:var(--serif); font-weight:700; font-size:14.5px; color:var(--ink);
    line-height:1.3; margin-top:4px; min-height:38px; }
  #chart-signals .sg-cur { font-family:var(--mono); font-weight:700; font-size:13px; color:var(--blue);
    line-height:1.45; margin-top:8px; }
  #chart-signals .sg-cur small { display:block; font-weight:400; font-size:9px; color:var(--ink-lo); letter-spacing:.1em; }
  #chart-signals .sg-thr { font-size:11px; color:var(--ink-md); line-height:1.55; margin-top:8px;
    border-top:1px dashed var(--line); padding-top:7px; }
  #chart-signals .sg-thr b { color:var(--red); font-family:var(--mono); font-size:9px; letter-spacing:.1em; }
  #chart-signals .sg-act { font-size:11px; color:var(--ink-md); line-height:1.55; margin-top:6px; }
  #chart-signals .sg-act b { color:var(--blue); font-family:var(--mono); font-size:9px; letter-spacing:.1em; }
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const grid = document.createElement("div");
  grid.className = "sg-grid";
  body.appendChild(grid);

  const cards = [];
  RPT.signals.forEach(s => {
    const el = document.createElement("div");
    el.className = "sg-card";
    el.setAttribute("data-drill-keep", "1");
    el.innerHTML =
      `<div class="sg-id">${s.id}</div>` +
      `<div class="sg-name">${U.esc(s.name)}</div>` +
      `<div class="sg-cur"><small>当前读数</small>${U.esc(s.cur)}</div>` +
      `<div class="sg-thr"><b>阈值</b> ${U.esc(s.threshold)}</div>` +
      `<div class="sg-act"><b>触发→</b> ${U.esc(s.action)}</div>`;
    el.addEventListener("click", e => U.showDrill({
      title: s.drill.title, value: s.drill.value,
      sub: s.drill.sub + `<br/><b>阈值：</b>${U.esc(s.threshold)}<br/><b>触发动作：</b>${U.esc(s.action)}`,
      source: s.drill.source, x: e.clientX, y: e.clientY }));
    grid.appendChild(el);
    cards.push(el);
  });

  cards.forEach(c => c.classList.add("rv"));
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    cards.forEach((c, i) => setTimeout(() => c.classList.add("in"), i * 90));
  }, { threshold: 0.15 });
  io.observe(grid);
})();
