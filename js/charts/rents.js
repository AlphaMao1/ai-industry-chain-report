// §9 六种"租"产业链地图（宿主 #chart-rents）
// 分层架构图：稀缺租 → 调度租 → 智能租 → 集成租 → 智能体工具租 → 工作流租 + 转型服务费。
// 玩家落位在行内；左色条编码哑铃结构（电蓝 = 哑铃两端当前结算到利润；语义红 = 利润未证明；墨阶 = 中间层/服务费）。
// 点行展开含义与风险（手风琴单开，触屏可点）。数据：RPT.rents。
(() => {
  const host = document.getElementById("chart-rents");
  if (!host || !window.RPT || !window.U) return;
  const RENTS = RPT.rents;
  if (!RENTS || !RENTS.length) return;
  const P = U.PAL;

  const body = U.frame(host, {
    title: "六种「租」：产业链上的利润按什么逻辑分配",
    sub: "从上游到下游分层落位 · 点击任意一行展开当前含义与风险",
    src: "本报告测算框架 · 截至 2026-07-17",
  });

  // 色条编码（哑铃结构视觉化；红仅用于"利润未证明"语义）
  const CHIP = {
    scarcity: { col: P.blue, tag: "哑铃 · 上游" },
    scheduling: { col: P.ink, tag: "中间层" },
    intelligence: { col: P.red, tag: "利润未证明" },
    integration: { col: P.inkMd, tag: "中间层" },
    agenttools: { col: P.inkMd, tag: "中间层" },
    workflow: { col: P.blue, tag: "哑铃 · 下游" },
    servicefee: { col: P.inkLo, tag: "服务费" },
  };

  const css =
    "#chart-rents .rt-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}" +
    "#chart-rents .rt-list{min-width:680px;border-top:1.5px solid var(--ink)}" +
    "#chart-rents .rt-row{border-bottom:1px solid var(--line);cursor:pointer;transition:background .14s ease}" +
    "#chart-rents .rt-row:hover{background:rgba(34,81,255,.045)}" +
    "#chart-rents .rt-main{display:grid;grid-template-columns:8px 170px 1fr 130px;align-items:center;gap:14px;" +
    "padding:14px 12px 14px 0}" +
    "#chart-rents .rt-chip{width:8px;align-self:stretch;border-radius:0}" +
    "#chart-rents .rt-name{font-family:var(--serif);font-weight:700;font-size:14.5px;color:var(--ink);line-height:1.35}" +
    "#chart-rents .rt-players{font-family:var(--mono);font-size:11px;color:var(--ink-md);line-height:1.6}" +
    "#chart-rents .rt-tag{font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-align:right}" +
    "#chart-rents .rt-panel{max-height:0;overflow:hidden;transition:max-height .35s ease}" +
    "#chart-rents .rt-row.open .rt-panel{max-height:240px}" +
    "#chart-rents .rt-inner{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:0 12px 15px 22px}" +
    "@media(max-width:680px){#chart-rents .rt-inner{grid-template-columns:1fr}}" +
    "#chart-rents .rt-k{font-family:var(--mono);font-size:9px;letter-spacing:.14em;color:var(--ink-lo);margin-bottom:4px}" +
    "#chart-rents .rt-v{font-size:12px;color:var(--ink-md);line-height:1.7}" +
    "#chart-rents .rt-row .rt-caret{transition:transform .25s ease;display:inline-block;margin-left:6px;color:var(--ink-lo)}" +
    "#chart-rents .rt-row.open .rt-caret{transform:rotate(90deg)}" +
    "#chart-rents .rt-leg{display:flex;gap:18px;flex-wrap:wrap;margin-top:12px;font-family:var(--mono);" +
    "font-size:10px;color:var(--ink-md)}";
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const scroll = document.createElement("div"); scroll.className = "rt-scroll"; body.appendChild(scroll);
  const list = document.createElement("div"); list.className = "rt-list"; scroll.appendChild(list);

  const rows = [];
  RENTS.forEach((r, i) => {
    const c = CHIP[r.id] || { col: P.inkMd, tag: "" };
    const el = document.createElement("div");
    el.className = "rt-row";
    el.setAttribute("data-drill-keep", "1");
    el.innerHTML =
      "<div class='rt-main'>" +
      "<div class='rt-chip' style='background:" + c.col + "'></div>" +
      "<div class='rt-name'>" + (i + 1) + ". " + U.esc(r.name) + "<span class='rt-caret'>▸</span></div>" +
      "<div class='rt-players'>" + U.esc(r.players) + "</div>" +
      "<div class='rt-tag' style='color:" + c.col + "'>" + U.esc(c.tag) + "</div>" +
      "</div>" +
      "<div class='rt-panel'><div class='rt-inner'>" +
      "<div><div class='rt-k'>当前含义</div><div class='rt-v'>" + U.esc(r.meaning) + "</div></div>" +
      "<div><div class='rt-k'>风险</div><div class='rt-v'>" + U.esc(r.risk) + "</div></div>" +
      "</div></div>";
    el.querySelector(".rt-main").addEventListener("click", () => {
      const wasOpen = el.classList.contains("open");
      rows.forEach(o => o.classList.remove("open")); // 手风琴单开
      if (!wasOpen) el.classList.add("open");
    });
    list.appendChild(el); rows.push(el);
  });

  // 图例（哑铃结构说明）
  const leg = document.createElement("div"); leg.className = "rt-leg";
  leg.innerHTML =
    "<span><span style='display:inline-block;width:9px;height:9px;background:" + P.blue + ";margin-right:5px;vertical-align:-1px'></span>电蓝 = 哑铃两端（当前结算到利润）</span>" +
    "<span><span style='display:inline-block;width:9px;height:9px;background:" + P.red + ";margin-right:5px;vertical-align:-1px'></span>语义红 = 利润未证明（智能租）</span>" +
    "<span><span style='display:inline-block;width:9px;height:9px;background:" + P.inkMd + ";margin-right:5px;vertical-align:-1px'></span>墨阶 = 中间层与服务费（最易被挤压 / 可持续性弱）</span>";
  body.appendChild(leg);

  // 入场渐次显现
  rows.forEach(r => r.classList.add("rv"));
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    rows.forEach((r, i) => setTimeout(() => r.classList.add("in"), i * 80));
  }, { threshold: 0.12 });
  io.observe(list);
})();
