// §6 供给闸门阶梯（宿主 #chart-gates）
// 四级闸门逐级降阶：HBM > CoWoS > 电力交付 > 光互联；
// 每级块上标"绕行方案有无"（实心 = 无绕行，空心 = 有绕行），行依次滑入，点击下钻。
// 数据：RPT.gates。
(() => {
  const host = document.getElementById("chart-gates");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "四级供给闸门 · 刚性即排序",
    sub: "降阶阶梯 · 实心标记 = 无绕行 · 空心标记 = 有绕行 · 点击任意闸门下钻",
    src: "公司披露 · 券商研究",
  });

  const P = U.PAL;
  const gates = RPT.gates;

  const css = `
  #chart-gates .gt-row { display:grid; grid-template-columns:52px 30px 220px 1fr 150px;
    gap:16px; align-items:center; padding:17px 10px 15px;
    border-bottom:1px solid var(--line-lo); cursor:pointer; position:relative; overflow:hidden;
    transition:background .15s ease; }
  #chart-gates .gt-row:first-of-type { border-top:1px solid var(--line-lo); }
  #chart-gates .gt-row:hover { background:rgba(34,81,255,.035); }
  #chart-gates .gt-step { position:absolute; left:0; top:0; bottom:0; z-index:0;
    transform:scaleX(0); transform-origin:left center;
    transition:transform .9s cubic-bezier(.2,.8,.3,1); }
  #chart-gates .gt-row > * { position:relative; z-index:1; }
  #chart-gates .gt-rank { font-family:var(--mono); font-weight:700; font-size:26px; color:var(--ink); text-align:center; }
  #chart-gates .gt-row.top .gt-rank { color:var(--red); }
  #chart-gates .gt-mark { width:16px; height:16px; margin:0 auto; }
  #chart-gates .gt-mark.solid { background:var(--red); }
  #chart-gates .gt-mark.open { border:1.5px solid var(--ink); background:transparent; }
  #chart-gates .gt-name { font-family:var(--serif); font-weight:700; font-size:16px; color:var(--ink); line-height:1.25; }
  #chart-gates .gt-tight { font-family:var(--mono); font-size:9.5px; letter-spacing:.12em; margin-top:3px; }
  #chart-gates .gt-sum { font-size:11.5px; color:var(--ink-md); line-height:1.55; }
  #chart-gates .gt-wa { justify-self:end; text-align:right; }
  #chart-gates .gt-noexit { display:inline-block; font-family:var(--mono); font-size:9px; font-weight:700;
    letter-spacing:.08em; color:var(--red); border:1.5px solid var(--red); padding:4px 9px; }
  #chart-gates .gt-exit { font-family:var(--mono); font-size:10px; color:var(--ink-md); line-height:1.5; }
  @media (max-width:760px){
    #chart-gates .gt-row { grid-template-columns:36px 24px 1fr; }
    #chart-gates .gt-sum, #chart-gates .gt-wa { display:none; }
  }
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const ladder = document.createElement("div");
  body.appendChild(ladder);

  // 阶梯降阶宽度（纯视觉层级，无数值标注）
  const widths = [100, 78, 56, 34];
  const stepFills = ["rgba(194,47,78,.10)", "rgba(194,47,78,.06)", "rgba(10,31,51,.05)", "rgba(10,31,51,.03)"];
  const tightCol = t => t.includes("极度") ? P.red : t.includes("竞争") ? P.inkMd : P.amber;
  const noExit = w => w.includes("无");

  const rows = [];
  gates.forEach((g, i) => {
    const row = document.createElement("div");
    row.className = "gt-row" + (i === 0 ? " top" : "");
    row.setAttribute("data-drill-keep", "1");
    const sum = g.drill.value.length > 64 ? g.drill.value.slice(0, 64) + "…" : g.drill.value;
    row.innerHTML =
      `<div class="gt-step" style="width:${widths[i]}%;background:${stepFills[i]}"></div>` +
      `<div class="gt-rank">${g.rank}</div>` +
      `<div class="gt-mark ${noExit(g.workaround) ? "solid" : "open"}"></div>` +
      `<div><div class="gt-name">${g.name}</div>` +
      `<div class="gt-tight" style="color:${tightCol(g.tight)}">${g.tight}</div></div>` +
      `<div class="gt-sum">${U.esc(sum)}</div>` +
      `<div class="gt-wa">${noExit(g.workaround)
        ? `<span class="gt-noexit">无绕行</span>`
        : `<span class="gt-exit">↳ ${U.esc(g.workaround)}</span>`}</div>`;
    row.addEventListener("click", e => U.showDrill({
      title: g.drill.title, value: g.drill.value, sub: g.drill.sub,
      source: g.drill.source, x: e.clientX, y: e.clientY }));
    ladder.appendChild(row);
    rows.push(row);
  });

  // 入场：行依次滑入 + 阶梯生长
  rows.forEach(r => { r.classList.add("rv"); });
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    rows.forEach((r, i) => setTimeout(() => {
      r.classList.add("in");
      r.querySelector(".gt-step").style.transform = "scaleX(1)";
    }, i * 150));
  }, { threshold: 0.18 });
  io.observe(ladder);
})();
