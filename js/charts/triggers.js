// §12 反证触发条件面板（宿主 #chart-triggers）
// 8 张静态条件句卡片：人话标签 + 当前读数 + 阈值 + "越线即重估"后果句；
// 无交互开关、无时间标记、无编号；点卡下钻出处与口径。数据：RPT.triggers。
(() => {
  const host = document.getElementById("chart-triggers");
  if (!host || !window.RPT || !window.U) return;
  const TR = RPT.triggers;
  if (!TR || !TR.length) return;
  const body = U.frame(host, {
    title: "八条红线：越线即重估",
    sub: "静态条件句 · 每卡 = 当前读数 + 阈值 + 越线后的重估后果 · 点击卡片查看出处与口径",
    src: "官方披露 · 媒体报道与访谈 · 券商研究 · 本报告测算 · 截至 2026-07-17",
  });

  const P = U.PAL;
  const css = `
  #chart-triggers .tg-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
  @media (max-width:1080px){#chart-triggers .tg-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media (max-width:560px){#chart-triggers .tg-grid{grid-template-columns:1fr}}
  #chart-triggers .tg-card{border:1px solid var(--line);border-top:3px solid var(--neg);
    background:var(--paper);padding:14px 16px 12px;cursor:pointer;display:flex;flex-direction:column;
    transition:box-shadow .16s ease,transform .16s ease}
  #chart-triggers .tg-card:hover{box-shadow:0 10px 26px rgba(10,31,51,.12);transform:translateY(-2px)}
  #chart-triggers .tg-label{font-family:var(--serif);font-weight:700;font-size:14px;color:var(--ink);
    line-height:1.35;min-height:38px}
  #chart-triggers .tg-cur{margin-top:9px}
  #chart-triggers .tg-eye{font-family:var(--mono);font-size:8.5px;font-weight:700;letter-spacing:.16em;
    color:var(--blue);display:block;margin-bottom:3px}
  #chart-triggers .tg-cur p{font-family:var(--mono);font-size:10.5px;color:var(--ink-md);line-height:1.6}
  #chart-triggers .tg-thr{margin-top:9px;border-top:1px dashed var(--line);padding-top:8px}
  #chart-triggers .tg-thr .tg-eye{color:var(--neg)}
  #chart-triggers .tg-thr p{font-size:11px;color:var(--ink-md);line-height:1.6}
  #chart-triggers .tg-cons{margin-top:auto;padding-top:9px;font-size:11.5px;line-height:1.55;color:var(--ink)}
  #chart-triggers .tg-cons b{color:var(--neg);font-family:var(--mono);font-size:9.5px;letter-spacing:.08em}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const grid = document.createElement("div");
  grid.className = "tg-grid";
  body.appendChild(grid);

  const cards = [];
  TR.forEach(t => {
    const el = document.createElement("div");
    el.className = "tg-card";
    el.setAttribute("data-drill-keep", "1");
    el.innerHTML =
      `<div class="tg-label">${U.esc(t.label)}</div>` +
      `<div class="tg-cur"><span class="tg-eye">当前读数</span><p>${U.esc(t.current)}</p></div>` +
      `<div class="tg-thr"><span class="tg-eye">阈值 · 越线</span><p>${U.esc(t.threshold)}</p></div>` +
      `<div class="tg-cons"><b>越线即重估 →</b> ${U.esc(t.consequence)}</div>`;
    el.addEventListener("click", e => U.showDrill({
      title: t.drill.title,
      value: t.drill.value,
      sub: U.esc(t.drill.sub) +
        `<br/><b>当前读数：</b>${U.esc(t.current)}` +
        `<br/><b>阈值：</b>${U.esc(t.threshold)}` +
        `<br/><b>后果：</b>${U.esc(t.consequence)}`,
      source: t.drill.source, x: e.clientX, y: e.clientY }));
    grid.appendChild(el);
    cards.push(el);
  });

  cards.forEach(c => c.classList.add("rv"));
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    cards.forEach((c, i) => setTimeout(() => c.classList.add("in"), i * 80));
  }, { threshold: 0.12 });
  io.observe(grid);
})();
