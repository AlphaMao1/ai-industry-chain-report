// §11 出口管制三情景矩阵（宿主 #chart-scenarios）
// 3 列 × 7 层彩色矩阵：收紧 = 红调 / 冻结（当前基线）= 蓝调高亮 / 放松 = 灰调；
// 单元格悬停高亮、点击下钻；底部触发条件行与注记。数据：RPT.scenarios。
(() => {
  const host = document.getElementById("chart-scenarios");
  if (!host || !window.RPT || !window.U) return;
  const sc = RPT.scenarios;
  if (!sc || !sc.rows) return;
  const body = U.frame(host, {
    title: "出口管制：三情景 × 七层传导矩阵",
    sub: "红列 = 收紧 · 蓝列 = 冻结（当前基线，高亮）· 灰列 = 放松 · 点击任意单元格在矩阵下方展开完整文案 · 底部为触发条件",
    src: "官方披露 · 行业机构 · 本报告测算 · 截至 2026-07-17",
  });

  const P = U.PAL;
  const base = sc.baseline == null ? 1 : sc.baseline;
  const COLSTYLE = [
    { head: P.red,   bg: "rgba(194,47,78,.055)", bgh: "rgba(194,47,78,.15)",  edge: "rgba(194,47,78,.45)" },
    { head: P.blue,  bg: "rgba(34,81,255,.06)",  bgh: "rgba(34,81,255,.14)",  edge: "rgba(34,81,255,.5)" },
    { head: P.inkLo, bg: "rgba(133,149,166,.07)", bgh: "rgba(133,149,166,.16)", edge: "rgba(133,149,166,.5)" },
  ];

  const css = `
  #chart-scenarios .sc-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
  #chart-scenarios .sc-inner{min-width:720px}
  #chart-scenarios .sc-mx{display:grid;grid-template-columns:128px repeat(3,1fr);gap:5px}
  #chart-scenarios .sc-h{font-family:var(--mono);font-weight:700;font-size:11px;text-align:center;
    padding:9px 6px;letter-spacing:.05em;border-bottom:2px solid}
  #chart-scenarios .sc-h.sc-base{background:var(--blue);color:var(--paper-hi);border-bottom-color:var(--blue)}
  #chart-scenarios .sc-lab{font-family:var(--serif);font-weight:700;font-size:12.5px;color:var(--ink);
    display:flex;align-items:center;padding:8px 4px;line-height:1.35}
  #chart-scenarios .sc-cell{font-size:11.5px;color:var(--ink-md);line-height:1.55;padding:10px 11px;
    border:1px solid transparent;cursor:pointer;transition:background .14s ease,border-color .14s ease,transform .14s ease}
  #chart-scenarios .sc-cell:hover{border-color:currentColor;transform:translateY(-1px)}
  #chart-scenarios .sc-cell.sc-base{box-shadow:inset 1px 0 0 rgba(34,81,255,.35),inset -1px 0 0 rgba(34,81,255,.35)}
  #chart-scenarios .sc-trig{margin-top:16px;padding:12px 15px;border:1px dashed var(--line);
    font-family:var(--mono);font-size:11px;color:var(--ink-md);line-height:1.8}
  #chart-scenarios .sc-trig b{color:var(--neg)}
  #chart-scenarios .sc-note{margin-top:10px;font-size:11px;color:var(--ink-lo);line-height:1.7}
  #chart-scenarios .sc-cell.sel{outline:2px solid currentColor;outline-offset:-2px}
  #chart-scenarios .sc-x{margin-top:12px;border-left:3px solid var(--blue);background:var(--paper-hi);
    border-top:1px solid var(--line-lo);border-bottom:1px solid var(--line-lo);padding:12px 16px 11px;display:none}
  #chart-scenarios .sc-x.on{display:block}
  #chart-scenarios .sc-x-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
  #chart-scenarios .sc-x-title{font-family:var(--serif);font-weight:900;font-size:14px}
  #chart-scenarios .sc-x-tag{font-family:var(--mono);font-size:9px;letter-spacing:.14em;color:var(--ink-lo)}
  #chart-scenarios .sc-x-close{margin-left:auto;font-family:var(--mono);font-size:14px;color:var(--ink-lo);
    cursor:pointer;border:1px solid var(--line);padding:0 8px;line-height:1.5}
  #chart-scenarios .sc-x-close:hover{color:var(--ink);border-color:var(--ink)}
  #chart-scenarios .sc-x-txt{margin-top:9px;font-family:var(--serif);font-size:14.5px;color:var(--ink);line-height:1.75}
  #chart-scenarios .sc-x-sub{margin-top:8px;font-size:11px;color:var(--ink-md);line-height:1.7}
  #chart-scenarios .sc-x-src{margin-top:8px;padding-top:7px;border-top:1px dashed var(--line-lo);
    font-family:var(--mono);font-size:9.5px;color:var(--ink-lo)}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const scroll = document.createElement("div"); scroll.className = "sc-scroll";
  const inner = document.createElement("div"); inner.className = "sc-inner";
  scroll.appendChild(inner); body.appendChild(scroll);
  const mx = document.createElement("div"); mx.className = "sc-mx";
  inner.appendChild(mx);

  // 表头
  mx.appendChild(document.createElement("div"));
  sc.cols.forEach((c, j) => {
    const h = document.createElement("div");
    h.className = "sc-h" + (j === base ? " sc-base" : "");
    h.textContent = c;
    if (j !== base) {
      h.style.color = COLSTYLE[j].head;
      h.style.borderBottomColor = COLSTYLE[j].head;
    }
    mx.appendChild(h);
  });

  // 行
  const cells = [];
  // 矩阵下方内联展开区（完整文案不再只靠弹卡）
  const xPanel = document.createElement("div");
  xPanel.className = "sc-x";
  let xSel = null;
  const closeX = () => {
    xPanel.classList.remove("on");
    if (xSel) { xSel.classList.remove("sel"); xSel = null; }
  };
  const openX = (cell, r, txt, j) => {
    if (xSel === cell) { closeX(); return; }
    if (xSel) xSel.classList.remove("sel");
    xSel = cell;
    cell.classList.add("sel");
    const col = COLSTYLE[j].head;
    xPanel.style.borderLeftColor = col;
    xPanel.innerHTML =
      `<div class="sc-x-head"><span class="sc-x-title" style="color:${col}">${U.esc(sc.cols[j])} × ${U.esc(r.layer)}</span>` +
      `<span class="sc-x-tag">${j === base ? "当前基线" : "情景推演"} · 不预测政策，只准备响应</span>` +
      `<span class="sc-x-close" role="button" aria-label="收起">×</span></div>` +
      `<div class="sc-x-txt">${U.esc(txt)}</div>` +
      `<div class="sc-x-sub">基线列判读：${U.esc(r.cells[base])}<br/>触发条件见矩阵下方；三情景为推演框架。</div>` +
      `<div class="sc-x-src">${U.esc(U.fmtSrc("官方披露 · 行业机构 · 本报告测算 · 截至 2026-07-17"))}</div>`;
    xPanel.classList.add("on");
    xPanel.querySelector(".sc-x-close").addEventListener("click", e => { e.stopPropagation(); closeX(); });
  };
  sc.rows.forEach(r => {
    const lab = document.createElement("div");
    lab.className = "sc-lab";
    lab.textContent = r.layer;
    mx.appendChild(lab);
    r.cells.forEach((txt, j) => {
      const cell = document.createElement("div");
      cell.className = "sc-cell" + (j === base ? " sc-base" : "");
      cell.textContent = txt;
      cell.style.background = COLSTYLE[j].bg;
      cell.style.color = P.inkMd;
      cell.setAttribute("data-drill-keep", "1");
      cell.addEventListener("mouseenter", () => {
        cell.style.background = COLSTYLE[j].bgh;
        cell.style.borderColor = COLSTYLE[j].head;
      });
      cell.addEventListener("mouseleave", () => {
        cell.style.background = COLSTYLE[j].bg;
        cell.style.borderColor = "transparent";
      });
      cell.addEventListener("click", () => openX(cell, r, txt, j));
      mx.appendChild(cell);
      cells.push(cell);
    });
  });
  inner.insertBefore(xPanel, mx.nextSibling);

  // 触发条件行
  const trig = document.createElement("div");
  trig.className = "sc-trig";
  trig.innerHTML = `<b>触发条件：</b>${U.esc(sc.triggers)}`;
  inner.appendChild(trig);
  if (sc.note) {
    const nt = document.createElement("p");
    nt.className = "sc-note";
    nt.textContent = sc.note;
    inner.appendChild(nt);
  }

  // 入场：逐行错峰
  cells.forEach(c => c.classList.add("rv"));
  trig.classList.add("rv");
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    cells.forEach((c, i) => setTimeout(() => c.classList.add("in"), Math.floor(i / 3) * 100 + (i % 3) * 45));
    setTimeout(() => trig.classList.add("in"), sc.rows.length * 100 + 200);
  }, { threshold: 0.1 });
  io.observe(mx);
})();
