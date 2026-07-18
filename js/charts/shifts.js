// §13 情景 → 方向切换表（宿主 #chart-shifts）
// 五情景 × 受益方向 / 受损方向 × 概率读数 × 易误判点；蓝点 = 受益、红点 = 受损；点行下钻。
// 数据：RPT.shiftTable。
(() => {
  const host = document.getElementById("chart-shifts");
  if (!host || !window.RPT || !window.U) return;
  const TB = RPT.shiftTable;
  if (!TB || !TB.length) return;
  const body = U.frame(host, {
    title: "情景 → 方向切换表：改主意的路径画在明处",
    sub: "五种情景 × 受益 / 受损方向 × 概率读数 × 易误判点 · 点击行下钻",
    src: "本报告测算 · 截至 2026-07-17",
  });

  const P = U.PAL;
  const probCol = p => /^较高/.test(p) ? P.blue : /^中低|^低/.test(p) ? P.inkLo : P.inkMd;

  const css = `
  #chart-shifts .sh-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
  #chart-shifts .sh-t{min-width:860px;display:grid;grid-template-columns:minmax(150px,1fr) minmax(220px,1.5fr) minmax(220px,1.5fr) 84px minmax(200px,1.3fr)}
  #chart-shifts .sh-th{font-family:var(--mono);font-size:9.5px;font-weight:700;letter-spacing:.12em;
    color:var(--ink-lo);padding:8px 10px;border-bottom:1.5px solid var(--ink)}
  #chart-shifts .sh-row{display:contents;cursor:pointer}
  #chart-shifts .sh-c{padding:12px 10px;border-bottom:1px solid var(--line-lo);font-size:11.5px;
    color:var(--ink-md);line-height:1.65;transition:background .13s ease}
  #chart-shifts .sh-row:hover .sh-c{background:rgba(34,81,255,.045)}
  #chart-shifts .sh-sc{font-family:var(--serif);font-weight:700;font-size:13px;color:var(--ink);line-height:1.45}
  #chart-shifts .sh-benefit,.sh-harm{position:relative;padding-left:16px}
  #chart-shifts .sh-benefit::before,.sh-harm::before{content:"";position:absolute;left:2px;top:8px;
    width:7px;height:7px;border-radius:50%}
  #chart-shifts .sh-benefit::before{background:var(--blue)}
  #chart-shifts .sh-harm::before{background:var(--neg)}
  #chart-shifts .sh-prob{display:inline-block;font-family:var(--mono);font-size:10.5px;font-weight:700;
    padding:3px 9px;border:1px solid;line-height:1.5}
  #chart-shifts .sh-pit .sh-eye{font-family:var(--mono);font-size:8.5px;font-weight:700;letter-spacing:.14em;
    color:var(--neg);display:block;margin-bottom:3px}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const scroll = document.createElement("div"); scroll.className = "sh-scroll";
  const t = document.createElement("div"); t.className = "sh-t";
  scroll.appendChild(t); body.appendChild(scroll);

  ["情景", "受益方向", "受损方向", "概率读数", "易误判点"].forEach(h => {
    const el = document.createElement("div");
    el.className = "sh-th"; el.textContent = h;
    t.appendChild(el);
  });

  const cells = [];
  TB.forEach(r => {
    const row = document.createElement("div");
    row.className = "sh-row";
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");

    const c1 = document.createElement("div");
    c1.className = "sh-c";
    c1.innerHTML = `<span class="sh-sc">${U.esc(r.scenario)}</span>`;
    const c2 = document.createElement("div");
    c2.className = "sh-c sh-benefit";
    c2.textContent = r.benefit;
    const c3 = document.createElement("div");
    c3.className = "sh-c sh-harm";
    c3.textContent = r.harm;
    const c4 = document.createElement("div");
    c4.className = "sh-c";
    const pc = probCol(r.prob);
    c4.innerHTML = `<span class="sh-prob" style="color:${pc};border-color:${pc}">${U.esc(r.prob)}</span>`;
    const c5 = document.createElement("div");
    c5.className = "sh-c sh-pit";
    c5.innerHTML = `<span class="sh-eye">易误判</span>${U.esc(r.pitfall)}`;

    [c1, c2, c3, c4, c5].forEach(c => row.appendChild(c));
    t.appendChild(row);

    const open = e => U.showDrill({
      title: `情景 · ${r.scenario}`,
      value: `受益：${r.benefit}`,
      sub: `<b>受损：</b>${U.esc(r.harm)}<br/><b>概率读数：</b>${U.esc(r.prob)}<br/><b>易误判点：</b>${U.esc(r.pitfall)}`,
      source: "本报告测算 · 截至 2026-07-17",
      x: e.clientX, y: e.clientY });
    row.addEventListener("click", open);
    row.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); }
    });
    cells.push(c1, c2, c3, c4, c5);
  });

  cells.forEach(c => c.classList.add("rv"));
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    cells.forEach((c, i) => setTimeout(() => c.classList.add("in"), Math.floor(i / 5) * 95 + (i % 5) * 35));
  }, { threshold: 0.12 });
  io.observe(t);
})();
