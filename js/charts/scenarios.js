// §8 出口管制三情景矩阵（宿主 #chart-scenarios）
// 3 列 × 6 行彩色矩阵：S1 红调 / S2 蓝调 / S3 灰调；单元格 hover 高亮、点击下钻；
// 底部触发条件行。数据：RPT.scenarios。
(() => {
  const host = document.getElementById("chart-scenarios");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: "出口管制三情景矩阵",
    sub: "S1 红 = 收紧 · S2 蓝 = 维持冻结（基线）· S3 灰 = 放松 · 悬停高亮 · 点击任意单元格下钻",
    src: "自研模型 · 行业官方",
  });

  const P = U.PAL;
  const sc = RPT.scenarios;
  const COLSTYLE = [
    { head: P.red,   bg: "rgba(194,47,78,.06)",  bgh: "rgba(194,47,78,.15)",  edge: "rgba(194,47,78,.4)" },
    { head: P.blue,  bg: "rgba(34,81,255,.05)",  bgh: "rgba(34,81,255,.13)",  edge: "rgba(34,81,255,.45)" },
    { head: P.inkLo, bg: "rgba(133,149,166,.07)", bgh: "rgba(133,149,166,.16)", edge: "rgba(133,149,166,.5)" },
  ];

  const css = `
  #chart-scenarios .sc-mx { display:grid; grid-template-columns:128px repeat(3, 1fr); gap:5px; }
  #chart-scenarios .sc-h { font-family:var(--mono); font-weight:700; font-size:11px; text-align:center;
    padding:9px 6px; letter-spacing:.05em; border-bottom:2px solid; }
  #chart-scenarios .sc-lab { font-family:var(--serif); font-weight:700; font-size:12.5px; color:var(--ink);
    display:flex; align-items:center; padding:8px 4px; line-height:1.35; }
  #chart-scenarios .sc-cell { font-size:11.5px; color:var(--ink-md); line-height:1.55; padding:10px 11px;
    border:1px solid transparent; cursor:pointer; transition:background .14s ease, border-color .14s ease, transform .14s ease; }
  #chart-scenarios .sc-cell:hover { border-color:currentColor; transform:translateY(-1px); }
  #chart-scenarios .sc-trig { margin-top:16px; padding:12px 15px; border:1px dashed var(--line);
    font-family:var(--mono); font-size:11px; color:var(--ink-md); line-height:1.8; }
  #chart-scenarios .sc-trig b { color:var(--red); }
  @media (max-width:720px){
    #chart-scenarios .sc-mx { grid-template-columns:84px repeat(3, 1fr); gap:3px; }
    #chart-scenarios .sc-cell { font-size:10.5px; padding:7px 8px; }
  }
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const mx = document.createElement("div");
  mx.className = "sc-mx";
  body.appendChild(mx);

  // 表头
  mx.appendChild(document.createElement("div"));
  sc.cols.forEach((c, j) => {
    const h = document.createElement("div");
    h.className = "sc-h";
    h.textContent = c;
    h.style.color = COLSTYLE[j].head;
    h.style.borderBottomColor = COLSTYLE[j].head;
    mx.appendChild(h);
  });

  // 行
  const cells = [];
  sc.rows.forEach(r => {
    const lab = document.createElement("div");
    lab.className = "sc-lab";
    lab.textContent = r.layer;
    mx.appendChild(lab);
    r.cells.forEach((txt, j) => {
      const cell = document.createElement("div");
      cell.className = "sc-cell";
      cell.textContent = txt;
      cell.style.background = COLSTYLE[j].bg;
      cell.style.color = P.inkMd;
      cell.setAttribute("data-drill-keep", "1");
      cell.addEventListener("mouseenter", () => { cell.style.background = COLSTYLE[j].bgh; cell.style.borderColor = COLSTYLE[j].head; });
      cell.addEventListener("mouseleave", () => { cell.style.background = COLSTYLE[j].bg; cell.style.borderColor = "transparent"; });
      cell.addEventListener("click", e => U.showDrill({
        title: `${sc.cols[j]} × ${r.layer}`,
        value: txt,
        sub: "情景矩阵单元格——传导路径判断；触发条件见矩阵下方。",
        source: "自研模型 · 行业官方", x: e.clientX, y: e.clientY }));
      mx.appendChild(cell);
      cells.push(cell);
    });
  });

  // 触发条件行
  const trig = document.createElement("div");
  trig.className = "sc-trig";
  trig.innerHTML = `<b>触发条件：</b>${U.esc(sc.triggers)}<br/><b>先例：</b>Claude Fable 5 / Mythos 5 全球停售 19 天（06-12 → 07-01）——前沿模型首次被行政令直接中断供给。`;
  body.appendChild(trig);

  // 入场：逐行错峰
  cells.forEach(c => c.classList.add("rv"));
  trig.classList.add("rv");
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    cells.forEach((c, i) => setTimeout(() => c.classList.add("in"), Math.floor(i / 3) * 110 + (i % 3) * 45));
    setTimeout(() => trig.classList.add("in"), sc.rows.length * 110 + 200);
  }, { threshold: 0.12 });
  io.observe(mx);
})();
