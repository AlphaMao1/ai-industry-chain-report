// §12 假说裁决对照矩阵（宿主 #chart-verdictmatrix）
// 8 假说 ×（当前强度 / 走 B 面的分支条件 / 对应章）；
// 强度三色：蓝 = 已验证 / 琥珀 = 有证据有争议 / 灰 = 假说待裁决（与章内行文同一套强度语言）；
// 点行 scrollIntoView 跳对应章并闪烁定位。数据：RPT.verdictMatrix。
(() => {
  const host = document.getElementById("chart-verdictmatrix");
  if (!host || !window.RPT || !window.U) return;
  const D = RPT.verdictMatrix;
  if (!D || !D.rows) return;
  const body = U.frame(host, {
    title: "八架天平：每个假说的证据权重",
    sub: "蓝 = 已验证 · 琥珀 = 有证据有争议 · 灰 = 假说待裁决 · 右列为走 B 面的分支条件 · 点击行跳到对应章",
    src: "官方披露 · 本报告测算 · 截至 2026-07-17",
  });

  const P = U.PAL;
  const SEC = {
    "1": "sec-task", "2": "sec-meter", "3": "sec-price", "4": "sec-monetize",
    "5": "sec-gap", "6": "sec-relay", "7": "sec-power", "8": "sec-balance",
    "9": "sec-pool", "10": "sec-china", "11": "sec-export", "12": "sec-verdict", "13": "sec-conclusion",
  };
  const secOf = ch => {
    const m = String(ch || "").match(/§\s*(\d+)/);
    return m ? SEC[m[1]] : null;
  };
  const sCol = s => /^已验证/.test(s) ? P.blue : /假说待裁决/.test(s) ? P.inkLo : P.amber;
  const sBg = s => /^已验证/.test(s) ? "rgba(34,81,255,.08)" : /假说待裁决/.test(s) ? "rgba(133,149,166,.1)" : "rgba(185,122,30,.09)";

  const css = `
  #chart-verdictmatrix .vm-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
  #chart-verdictmatrix .vm-inner{min-width:820px}
  #chart-verdictmatrix .vm-lead{font-size:11.5px;color:var(--ink-lo);line-height:1.7;margin-bottom:12px;max-width:880px}
  #chart-verdictmatrix .vm-t{display:grid;grid-template-columns:minmax(240px,1.25fr) minmax(150px,.62fr) minmax(280px,1.5fr) 72px}
  #chart-verdictmatrix .vm-th{font-family:var(--mono);font-size:9.5px;font-weight:700;letter-spacing:.12em;
    color:var(--ink-lo);padding:8px 10px;border-bottom:1.5px solid var(--ink)}
  #chart-verdictmatrix .vm-row{display:contents;cursor:pointer}
  #chart-verdictmatrix .vm-c{padding:11px 10px;border-bottom:1px solid var(--line-lo);
    font-size:11.5px;color:var(--ink-md);line-height:1.6;transition:background .13s ease}
  #chart-verdictmatrix .vm-row:hover .vm-c{background:rgba(34,81,255,.045)}
  #chart-verdictmatrix .vm-hyp{font-family:var(--serif);font-weight:700;font-size:13px;color:var(--ink);line-height:1.45}
  #chart-verdictmatrix .vm-id{font-family:var(--mono);font-size:9px;font-weight:700;letter-spacing:.12em;
    color:var(--ink-lo);display:block;margin-bottom:3px}
  #chart-verdictmatrix .vm-chip{display:inline-block;font-family:var(--mono);font-size:10px;font-weight:700;
    padding:3px 9px;border:1px solid;line-height:1.5}
  #chart-verdictmatrix .vm-ch{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--blue)}
  @keyframes vmFlash{0%{box-shadow:0 0 0 3px rgba(34,81,255,.55)}100%{box-shadow:0 0 0 3px rgba(34,81,255,0)}}
  .sec-jump-flash{animation:vmFlash 1.7s ease-out 1}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const scroll = document.createElement("div"); scroll.className = "vm-scroll";
  const inner = document.createElement("div"); inner.className = "vm-inner";
  scroll.appendChild(inner); body.appendChild(scroll);

  if (D.lead) {
    const lead = document.createElement("p");
    lead.className = "vm-lead";
    lead.textContent = D.lead;
    inner.appendChild(lead);
  }

  const t = document.createElement("div"); t.className = "vm-t";
  inner.appendChild(t);
  ["假说", "当前强度", "走 B 面的条件（越线即重估）", "对应章"].forEach(h => {
    const el = document.createElement("div");
    el.className = "vm-th"; el.textContent = h;
    t.appendChild(el);
  });

  const jump = ch => {
    const id = secOf(ch);
    const tgt = id && document.getElementById(id);
    if (!tgt) return;
    tgt.scrollIntoView({ behavior: U.reduced() ? "auto" : "smooth", block: "start" });
    setTimeout(() => {
      tgt.classList.add("sec-jump-flash");
      setTimeout(() => tgt.classList.remove("sec-jump-flash"), 1800);
    }, U.reduced() ? 60 : 650);
  };

  const rows = [];
  D.rows.forEach(r => {
    const row = document.createElement("div");
    row.className = "vm-row";
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    const col = sCol(r.strength);

    const c1 = document.createElement("div");
    c1.className = "vm-c";
    c1.innerHTML = `<span class="vm-id">${U.esc(r.id)}</span><span class="vm-hyp">${U.esc(r.hypothesis)}</span>`;
    const c2 = document.createElement("div");
    c2.className = "vm-c";
    c2.innerHTML = `<span class="vm-chip" style="color:${col};border-color:${col};background:${sBg(r.strength)}">${U.esc(r.strength)}</span>`;
    const c3 = document.createElement("div");
    c3.className = "vm-c";
    c3.textContent = r.bside;
    const c4 = document.createElement("div");
    c4.className = "vm-c";
    c4.innerHTML = `<span class="vm-ch">${U.esc(r.chapter)} →</span>`;

    [c1, c2, c3, c4].forEach(c => row.appendChild(c));
    t.appendChild(row);
    // 行级交互：display:contents 下把监听挂在行与每个单元格
    row.addEventListener("click", () => jump(r.chapter));
    row.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jump(r.chapter); }
    });
    rows.push(c1, c2, c3, c4);
  });

  rows.forEach(c => c.classList.add("rv"));
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    rows.forEach((c, i) => setTimeout(() => c.classList.add("in"), Math.floor(i / 4) * 90 + (i % 4) * 35));
  }, { threshold: 0.1 });
  io.observe(t);
})();
