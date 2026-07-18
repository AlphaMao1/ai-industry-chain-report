// §8 ≥100% 先例矩阵（宿主 #chart-precedent）
// 资本开支超经营现金流且无保底回报的历史样本 × 结局（崩/受挫/没崩/误引）对照矩阵。
// 三色编码：语义红=崩、墨=受挫、电蓝=没崩（监管保底）、浅墨斜纹=误引。点击任意行下钻。
// 数据：RPT.precedentMatrix。
(() => {
  const host = document.getElementById("chart-precedent");
  if (!host || !window.RPT || !window.U) return;
  const M = RPT.precedentMatrix;
  if (!M || !M.cases) return;
  const P = U.PAL;

  const body = U.frame(host, {
    title: "先例矩阵：资本开支超过经营现金流之后，都发生了什么",
    sub: "历史样本 × 结局对照 · 点击任意一行看细节与出处",
    src: (M.source || "行业机构 · 史料") + " · 截至 2026-07-17",
  });

  // 判定句（数据 verdict 字段原句呈现）
  if (M.verdict) {
    const vd = document.createElement("p");
    vd.style.cssText = "margin:0 0 16px;padding:12px 16px;border:1px solid " + P.red + ";" +
      "background:" + P.redSoft + ";font:700 13.5px " + U.FONTS.serif + ";color:" + P.ink + ";line-height:1.7";
    vd.textContent = M.verdict;
    body.appendChild(vd);
  }

  const OUTCOMES = ["崩", "受挫", "没崩", "误引"];
  const OCOL = { "崩": P.red, "受挫": P.inkMd, "没崩": P.blue, "误引": P.inkLo };
  const ONOTE = { "崩": "全行业出清", "受挫": "重资产错配", "没崩": "监管保底回报", "误引": "被错引为反例" };

  const css =
    "#chart-precedent .pc-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}" +
    "#chart-precedent .pc-grid{min-width:660px}" +
    "#chart-precedent .pc-row{display:grid;grid-template-columns:150px repeat(4,minmax(0,1fr));" +
    "border-bottom:1px solid var(--line);cursor:pointer;transition:background .14s ease}" +
    "#chart-precedent .pc-row:hover{background:rgba(34,81,255,.045)}" +
    "#chart-precedent .pc-row.head{border-bottom:1.5px solid var(--ink);cursor:default}" +
    "#chart-precedent .pc-row.head:hover{background:transparent}" +
    "#chart-precedent .pc-cell{padding:12px 10px;display:flex;align-items:center;justify-content:center}" +
    "#chart-precedent .pc-name{font-family:var(--serif);font-weight:700;font-size:12.5px;color:var(--ink);" +
    "justify-content:flex-start;padding-left:4px;line-height:1.4}" +
    "#chart-precedent .pc-h{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-align:center;width:100%}" +
    "#chart-precedent .pc-chip{display:inline-block;padding:5px 13px;font-family:var(--mono);font-size:11px;" +
    "font-weight:700;color:#fffdf8;border-radius:2px}" +
    "#chart-precedent .pc-chip.mis{background:repeating-linear-gradient(45deg,rgba(10,31,51,.14) 0 5px,transparent 5px 10px);" +
    "color:var(--ink-md);border:1px dashed var(--ink-lo)}" +
    "#chart-precedent .pc-leg{display:flex;gap:18px;flex-wrap:wrap;margin-top:12px;font-family:var(--mono);" +
    "font-size:10px;color:var(--ink-md)}";
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const scroll = document.createElement("div"); scroll.className = "pc-scroll"; body.appendChild(scroll);
  const grid = document.createElement("div"); grid.className = "pc-grid"; scroll.appendChild(grid);

  // 表头
  const head = document.createElement("div"); head.className = "pc-row head";
  head.innerHTML = "<div class='pc-cell pc-name'><span class='pc-h' style='text-align:left'>历史样本</span></div>" +
    OUTCOMES.map(o => "<div class='pc-cell'><span class='pc-h' style='color:" + OCOL[o] + "'>" + o +
      "<br/><span style='font-weight:400;letter-spacing:0;color:var(--ink-lo)'>" + ONOTE[o] + "</span></span></div>").join("");
  grid.appendChild(head);

  const rows = [];
  M.cases.forEach(c => {
    const row = document.createElement("div");
    row.className = "pc-row";
    row.setAttribute("data-drill-keep", "1");
    let html = "<div class='pc-cell pc-name'>" + U.esc(c.name) + "</div>";
    OUTCOMES.forEach(o => {
      if (o === c.outcome) {
        html += "<div class='pc-cell'><span class='pc-chip" + (o === "误引" ? " mis" : "") + "'" +
          (o === "误引" ? "" : " style='background:" + OCOL[o] + "'") + ">" + o + "</span></div>";
      } else {
        html += "<div class='pc-cell'><span style='font-family:var(--mono);font-size:10px;color:var(--line)'>—</span></div>";
      }
    });
    row.innerHTML = html;
    row.addEventListener("click", e => U.showDrill({
      title: c.name + " · 结局：" + c.outcome,
      value: c.outcome === "没崩" ? "唯一例外——监管保底回报" : c.outcome === "误引" ? "常被引为反例，实为误引" : c.outcome,
      sub: U.esc(c.note),
      source: (M.source || "行业机构 · 史料") + " · 截至 2026-07-17", x: e.clientX, y: e.clientY }));
    grid.appendChild(row); rows.push(row);
  });

  // 图例
  const leg = document.createElement("div"); leg.className = "pc-leg";
  leg.innerHTML = OUTCOMES.map(o =>
    "<span><span style='display:inline-block;width:9px;height:9px;border-radius:2px;background:" + OCOL[o] +
    ";margin-right:5px;vertical-align:-1px'></span>" + o + " = " + ONOTE[o] + "</span>").join("");
  body.appendChild(leg);

  rows.forEach(r => r.classList.add("rv"));
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    rows.forEach((r, i) => setTimeout(() => r.classList.add("in"), i * 90));
  }, { threshold: 0.15 });
  io.observe(grid);
})();
