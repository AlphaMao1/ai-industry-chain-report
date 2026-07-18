// §10 中国产业链 11 层分层图（宿主 #chart-chinalayers）
// 11 层 × 公司落位：证据强 = 电蓝 / 观察 = 琥珀（语义色，仅限本组件）/ 证据弱 = 浅墨灰；
// 空层渲染层级注记；底部反例卡 + 华为观察名单卡；点公司/层/反例下钻数字与口径。
// 数据：RPT.chinaLayers。
(() => {
  const host = document.getElementById("chart-chinalayers");
  if (!host || !window.RPT || !window.U) return;
  const D = RPT.chinaLayers;
  if (!D || !D.layers) return;
  const body = U.frame(host, {
    title: "中国产业链十一层：利润在哪一层结算",
    sub: "蓝 = 证据强（有可验证的股东利润锚点）· 琥珀 = 观察（逻辑成立、缺直接披露）· 灰 = 证据弱（量增利未证）· 点击公司卡原位展开数字行",
    src: "官方披露 · 媒体报道与访谈 · 截至 2026-07-17",
  });

  const P = U.PAL;
  const CLS = {
    "证据强": { col: P.blue,  bg: "rgba(34,81,255,.045)",  bd: "rgba(34,81,255,.4)" },
    "观察":   { col: P.amber, bg: "rgba(185,122,30,.05)",  bd: "rgba(185,122,30,.42)" },
    "证据弱": { col: P.inkLo, bg: "rgba(133,149,166,.06)", bd: "rgba(133,149,166,.45)" },
  };
  const srcOf = L =>
    L.id === "modelapp" ? "官方披露 · 媒体报道与访谈 · 截至 2026-07-17" : "官方披露 · 截至 2026-07-17";

  const css = `
  #chart-chinalayers .cl-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
  #chart-chinalayers .cl-inner{min-width:780px}
  #chart-chinalayers .cl-note{font-size:11.5px;color:var(--ink-lo);line-height:1.7;margin-bottom:14px;max-width:900px}
  #chart-chinalayers .cl-row{display:grid;grid-template-columns:132px 1fr;border:1px solid var(--line-lo);
    margin-bottom:8px;}
  #chart-chinalayers .cl-rail{padding:12px 12px 10px;cursor:pointer;border-right:1px dashed var(--line-lo);}
  #chart-chinalayers .cl-rail:hover{background:rgba(10,31,51,.03)}
  #chart-chinalayers .cl-tag{font-family:var(--mono);font-size:9px;font-weight:700;letter-spacing:.14em;
    border:1px solid;padding:2px 7px;display:inline-block;}
  #chart-chinalayers .cl-lname{font-family:var(--serif);font-weight:900;font-size:14.5px;color:var(--ink);margin-top:7px;line-height:1.3}
  #chart-chinalayers .cl-cos{display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px;align-content:flex-start}
  #chart-chinalayers .cl-co{flex:1 1 236px;max-width:400px;background:var(--paper-hi);border:1px solid var(--line-lo);
    padding:9px 12px 8px;cursor:pointer;transition:box-shadow .15s ease,transform .15s ease}
  #chart-chinalayers .cl-co:hover{box-shadow:0 8px 20px rgba(10,31,51,.12);transform:translateY(-1px)}
  #chart-chinalayers .cl-coname{font-family:var(--serif);font-weight:700;font-size:13px;color:var(--ink)}
  #chart-chinalayers .cl-cofacts{font-size:11px;color:var(--ink-md);line-height:1.6;margin-top:4px}
  #chart-chinalayers .cl-conote{font-size:10.5px;color:var(--ink-lo);line-height:1.55;margin-top:5px;
    border-top:1px dashed var(--line-lo);padding-top:5px}
  #chart-chinalayers .cl-layernote{flex:1 1 auto;font-size:11.5px;color:var(--ink-md);line-height:1.7;
    padding:10px 14px;border:1px dashed var(--line);cursor:pointer}
  #chart-chinalayers .cl-layernote:hover{background:rgba(10,31,51,.03)}
  #chart-chinalayers .cl-strip-h{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.16em;
    color:var(--neg);margin:18px 0 8px}
  #chart-chinalayers .cl-counter{display:flex;flex-wrap:wrap;gap:10px}
  #chart-chinalayers .cl-ce{flex:1 1 300px;border:1px solid var(--neg);
    background:rgba(194,47,78,.04);padding:11px 14px 10px;cursor:pointer;transition:box-shadow .15s ease,transform .15s ease}
  #chart-chinalayers .cl-ce:hover{box-shadow:0 8px 20px rgba(10,31,51,.12);transform:translateY(-1px)}
  #chart-chinalayers .cl-cename{font-family:var(--serif);font-weight:700;font-size:13px;color:var(--neg)}
  #chart-chinalayers .cl-hw{margin-top:14px;border:1px dashed var(--ink-lo);
    padding:11px 14px 10px;cursor:pointer;font-size:11.5px;color:var(--ink-md);line-height:1.65}
  #chart-chinalayers .cl-hw:hover{background:rgba(10,31,51,.03)}
  #chart-chinalayers .cl-hw b{font-family:var(--serif);color:var(--ink)}
  #chart-chinalayers .cl-hw .cl-hwtier{font-family:var(--mono);font-size:9.5px;color:var(--ink-lo);letter-spacing:.1em;display:block;margin-top:5px}
  #chart-chinalayers .cl-co .cl-caret{float:right;font-family:var(--mono);font-size:10px;color:var(--ink-lo);
    transition:transform .22s ease}
  #chart-chinalayers .cl-co.open .cl-caret{transform:rotate(90deg);color:var(--blue)}
  #chart-chinalayers .cl-co.open{border-color:var(--blue)}
  #chart-chinalayers .cl-co-x{max-height:0;overflow:hidden;transition:max-height .32s ease}
  #chart-chinalayers .cl-co.open .cl-co-x{max-height:340px}
  #chart-chinalayers .cl-xrows{margin-top:8px;border-top:1px solid var(--line-lo);padding-top:7px}
  #chart-chinalayers .cl-xrow{display:flex;gap:7px;font-family:var(--mono);font-size:10.5px;color:var(--ink);
    line-height:1.65;padding:2.5px 0}
  #chart-chinalayers .cl-xrow::before{content:"▪";color:var(--blue);flex:none}
  #chart-chinalayers .cl-xfoot{margin-top:7px;border-top:1px dashed var(--line-lo);padding-top:6px;
    font-family:var(--mono);font-size:9px;color:var(--ink-lo);line-height:1.6}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const scroll = document.createElement("div"); scroll.className = "cl-scroll";
  const inner = document.createElement("div"); inner.className = "cl-inner";
  scroll.appendChild(inner); body.appendChild(scroll);

  const note = document.createElement("p");
  note.className = "cl-note";
  note.textContent = D.classNote;
  inner.appendChild(note);

  const rows = [];
  D.layers.forEach(L => {
    const c = CLS[L.cls] || CLS["证据弱"];
    const row = document.createElement("div");
    row.className = "cl-row";
    row.style.borderColor = c.col;
    row.style.background = c.bg;

    const rail = document.createElement("div");
    rail.className = "cl-rail";
    rail.setAttribute("data-drill-keep", "1");
    rail.innerHTML =
      `<span class="cl-tag" style="color:${c.col};border-color:${c.bd}">${U.esc(L.cls)}</span>` +
      `<p class="cl-lname">${U.esc(L.name)}</p>`;
    rail.addEventListener("click", e => U.showDrill({
      title: `${L.name} · ${L.cls}`,
      value: L.note || (L.companies.length
        ? `${L.companies.length} 家落位公司：${L.companies.map(co => co.name).join(" / ")}`
        : "暂无可落位公司"),
      sub: D.classNote, source: srcOf(L), x: e.clientX, y: e.clientY }));
    row.appendChild(rail);

    const cos = document.createElement("div");
    cos.className = "cl-cos";
    if (L.companies && L.companies.length) {
      L.companies.forEach(co => {
        const el = document.createElement("div");
        el.className = "cl-co";
        el.style.borderColor = c.col;
        el.setAttribute("data-drill-keep", "1");
        // 数字行：facts 按分号拆成结构化行（毛利率/收入/口径逐行可见，不再藏进下钻卡）
        const factRows = String(co.facts || "").split("；").map(s => s.trim()).filter(Boolean);
        el.innerHTML =
          `<p class="cl-coname">${U.esc(co.name)}<span class="cl-caret">▸</span></p>` +
          `<p class="cl-cofacts">${U.esc(co.facts)}</p>` +
          (co.note ? `<p class="cl-conote">${U.esc(co.note)}</p>` : "") +
          `<div class="cl-co-x"><div class="cl-xrows">` +
          factRows.map(f => `<div class="cl-xrow">${U.esc(f)}</div>`).join("") +
          `</div><div class="cl-xfoot">层级判定：${U.esc(L.cls)}（${U.esc(D.classNote.split("。")[0])}）<br/>` +
          `${U.esc(U.fmtSrc(srcOf(L)))} · 再次点击收起</div></div>`;
        el.addEventListener("click", () => el.classList.toggle("open"));
        cos.appendChild(el);
      });
    } else {
      const el = document.createElement("div");
      el.className = "cl-layernote";
      el.setAttribute("data-drill-keep", "1");
      el.textContent = L.note || "暂无可落位公司。";
      el.addEventListener("click", e => U.showDrill({
        title: `${L.name} · ${L.cls}`,
        value: L.note || "暂无可落位公司。",
        sub: D.classNote, source: srcOf(L), x: e.clientX, y: e.clientY }));
      cos.appendChild(el);
    }
    row.appendChild(cos);
    inner.appendChild(row);
    rows.push(row);
  });

  // ── 反例卡：放量 ≠ 稀缺利润 ──
  if (D.counterExamples && D.counterExamples.length) {
    const h = document.createElement("p");
    h.className = "cl-strip-h";
    h.textContent = "反例 · 放量 ≠ 稀缺利润";
    inner.appendChild(h);
    const strip = document.createElement("div");
    strip.className = "cl-counter";
    D.counterExamples.forEach(ce => {
      const el = document.createElement("div");
      el.className = "cl-ce";
      el.setAttribute("data-drill-keep", "1");
      el.innerHTML =
        `<p class="cl-cename">${U.esc(ce.name)}</p>` +
        `<p class="cl-cofacts">${U.esc(ce.facts)}</p>` +
        (ce.note ? `<p class="cl-conote">${U.esc(ce.note)}</p>` : "");
      el.addEventListener("click", e => U.showDrill({
        title: `反例 · ${ce.name}`, value: ce.facts, sub: ce.note,
        source: "官方披露 · 2025 年报", x: e.clientX, y: e.clientY }));
      strip.appendChild(el);
      rows.push(el);
    });
    inner.appendChild(strip);
    rows.push(h);
  }

  // ── 华为观察名单卡 ──
  if (D.huaweiNote) {
    const hw = document.createElement("div");
    hw.className = "cl-hw";
    hw.setAttribute("data-drill-keep", "1");
    hw.innerHTML =
      `<b>观察名单 · 华为韬（τ）定律</b>　${U.esc(D.huaweiNote.claim)}` +
      `<span class="cl-hwtier">${U.esc(D.huaweiNote.tier)} · ${U.esc(D.huaweiNote.note)}</span>`;
    hw.addEventListener("click", e => U.showDrill({
      title: "观察名单 · 华为韬（τ）定律",
      value: D.huaweiNote.claim,
      sub: U.esc(D.huaweiNote.note),
      source: "公司声称/预印本 · 未经第三方验证", x: e.clientX, y: e.clientY }));
    inner.appendChild(hw);
    rows.push(hw);
  }

  // 入场：逐层错峰
  rows.forEach(r => r.classList.add("rv"));
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    rows.forEach((r, i) => setTimeout(() => r.classList.add("in"), i * 80));
  }, { threshold: 0.08 });
  io.observe(scroll);
})();
