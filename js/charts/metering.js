// §2 计量方式三层站位矩阵（宿主 #chart-metering）
// 三列站位：按量付费 / 按任务量计费 / 席位捆绑 × 厂商落位（价格 + 日期，待核项标"待核"）。
// 底部：Futurum 持平读数 + 计量漂移警示。"历史先例"切换层叠加 1897–2026 六锚（同 RPT.metering.precedents）。
// 点格下钻。数据全部来自 RPT.metering。
(() => {
  const host = document.getElementById("chart-metering");
  if (!host || !window.RPT || !RPT.metering) return;
  const MT = RPT.metering;
  const body = U.frame(host, {
    title: "计量方式三层站位：按量 / 按任务量 / 席位",
    sub: "三列收敛中 · 当前赢家是混合制 · 待核 = 券商研究转述未独立核验 · 点击任意落位下钻",
    src: "官方披露 · 券商研究",
  });

  const P = U.PAL;
  const css = `
  #chart-metering .mt-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
  @media (max-width:900px){ #chart-metering .mt-grid { grid-template-columns:1fr; } }
  #chart-metering .mt-colhead { border-top:2px solid var(--ink); padding:10px 2px 8px; }
  #chart-metering .mt-colhead.mid { border-top-color:var(--blue); }
  #chart-metering .mt-tier { font-family:var(--serif); font-weight:700; font-size:15px; color:var(--ink); }
  #chart-metering .mt-tdesc { font-family:var(--mono); font-size:9.5px; color:var(--ink-lo); margin-top:3px; }
  #chart-metering .mt-player { border-bottom:1px solid var(--line-lo); padding:10px 2px; cursor:pointer; }
  #chart-metering .mt-player:hover { background:var(--paper-hi); }
  #chart-metering .mt-pname { font-family:var(--serif); font-weight:700; font-size:13px; color:var(--ink);
    display:flex; justify-content:space-between; gap:8px; align-items:baseline; }
  #chart-metering .mt-badge { font-family:var(--mono); font-size:8.5px; letter-spacing:.1em; color:var(--ink-lo);
    border:1px solid var(--line); padding:1px 5px; white-space:nowrap; }
  #chart-metering .mt-badge.pending { color:var(--neg); border:1px dashed var(--neg); }
  #chart-metering .mt-price { font-family:var(--mono); font-size:11.5px; font-weight:700; color:var(--ink); margin-top:4px; }
  #chart-metering .mt-date { font-family:var(--mono); font-size:9px; color:var(--ink-lo); margin-top:2px; }
  #chart-metering .mt-note { margin-top:20px; border-top:1px solid var(--line); padding-top:12px; }
  #chart-metering .mt-nrow { padding:8px 2px; cursor:pointer; border-bottom:1px dashed var(--line-lo); }
  #chart-metering .mt-nrow:hover { background:var(--paper-hi); }
  #chart-metering .mt-ntag { font-family:var(--mono); font-size:9px; color:var(--blue); letter-spacing:.12em; }
  #chart-metering .mt-ntxt { font-family:var(--serif); font-size:12.5px; color:var(--ink-md); line-height:1.7; margin-top:3px; }
  #chart-metering .mt-ntxt b { color:var(--ink); }
  #chart-metering .mt-ptoggle { margin-top:18px; background:none; border:none; cursor:pointer;
    border-bottom:2px solid transparent; padding:2px 1px;
    font-family:var(--mono); font-weight:700; font-size:11.5px; color:var(--ink-lo); letter-spacing:.06em; }
  #chart-metering .mt-ptoggle.on { color:var(--blue); border-bottom-color:var(--blue); }
  #chart-metering .mt-prec { display:none; margin-top:10px; grid-template-columns:repeat(6,1fr); gap:14px; }
  #chart-metering .mt-prec.on { display:grid; }
  @media (max-width:900px){ #chart-metering .mt-prec.on { grid-template-columns:repeat(2,1fr); } }
  #chart-metering .mt-pchip { border-top:1.5px solid var(--ink-md); padding:7px 2px; cursor:pointer; }
  #chart-metering .mt-pchip:hover { background:var(--paper-hi); }
  #chart-metering .mt-pyear { font-family:var(--mono); font-size:10px; font-weight:700; color:var(--ink); }
  #chart-metering .mt-pname2 { font-family:var(--serif); font-size:11.5px; color:var(--ink-md); margin-top:2px; }
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

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

  // ── 三层站位矩阵 ──
  const grid = document.createElement("div");
  grid.className = "mt-grid";
  body.appendChild(grid);
  MT.tiers.forEach((tier, ti) => {
    const col = document.createElement("div");
    grid.appendChild(col);
    const head = document.createElement("div");
    head.className = "mt-colhead" + (ti === 1 ? " mid" : "");
    head.innerHTML = `<div class="mt-tier">${U.esc(tier.name)}</div><div class="mt-tdesc">${U.esc(tier.desc)}</div>`;
    col.appendChild(head);
    tier.players.forEach(pl => {
      const el = document.createElement("div");
      el.className = "mt-player";
      const pending = pl.status === "待核";
      el.innerHTML =
        `<div class="mt-pname"><span>${U.esc(pl.name)}</span>` +
        `<span class="mt-badge${pending ? " pending" : ""}">${pending ? "待核" : U.esc(pl.status)}</span></div>` +
        `<div class="mt-price">${U.esc(pl.price)}</div>` +
        `<div class="mt-date">${U.esc(pl.date)}</div>`;
      bind(el, {
        title: pl.name + " · " + tier.name,
        value: pl.price,
        sub: pl.note + "（时间：" + pl.date + "）",
        source: pending ? "券商研究 · 待核" : "官方披露 · " + pl.date,
      });
      col.appendChild(el);
    });
  });

  // ── Futurum 持平读数 + 计量漂移（可下钻注记行）──
  const note = document.createElement("div");
  note.className = "mt-note";
  body.appendChild(note);
  if (MT.futurum) {
    const f = document.createElement("div");
    f.className = "mt-nrow";
    f.innerHTML = `<div class="mt-ntag">市场共识检验 · N=${MT.futurum.n}</div>` +
      `<div class="mt-ntxt"><b>${U.esc(MT.futurum.outcome)}</b>　${U.esc(MT.futurum.caveat)}</div>`;
    bind(f, { title: "按结果计费 vs 席位（偏好口径）", value: MT.futurum.outcome,
      sub: MT.futurum.caveat, source: MT.futurum.source });
    note.appendChild(f);
  }
  if (MT.drift) {
    const d = document.createElement("div");
    d.className = "mt-nrow";
    d.innerHTML = `<div class="mt-ntag">计量漂移警示</div>` +
      `<div class="mt-ntxt">${U.esc(MT.drift.text)}</div>`;
    bind(d, { title: "计量漂移警示", value: MT.drift.text, source: MT.drift.source });
    note.appendChild(d);
  }

  // ── 历史先例叠加层（切换显隐；完整时间轴见下方专图）──
  if (MT.precedents && MT.precedents.length) {
    const tg = document.createElement("button");
    tg.type = "button";
    tg.className = "mt-ptoggle";
    tg.textContent = "叠加历史先例（1897–2026 六锚）";
    tg.setAttribute("aria-pressed", "false");
    body.appendChild(tg);
    const prec = document.createElement("div");
    prec.className = "mt-prec";
    body.appendChild(prec);
    MT.precedents.forEach(pr => {
      const c = document.createElement("div");
      c.className = "mt-pchip";
      c.innerHTML = `<div class="mt-pyear">${U.esc(pr.year)}</div><div class="mt-pname2">${U.esc(pr.name)}</div>`;
      bind(c, pr.drill);
      prec.appendChild(c);
    });
    tg.addEventListener("click", () => {
      const on = !prec.classList.contains("on");
      prec.classList.toggle("on", on);
      tg.classList.toggle("on", on);
      tg.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  U.reveal(body, ".mt-player, .mt-nrow", 70);
})();
