// §13 六条结论徽章卡（宿主 #chart-conclusions）
// 六卡 × 强度徽章：蓝 = 已验证（方向已验证）/ 琥珀 = 有证据有争议 / 灰 = 假说待裁决
// （与 §12 同一套强度语言）；点卡 scrollIntoView 跳对应章并闪烁定位。数据：RPT.conclusions。
(() => {
  const host = document.getElementById("chart-conclusions");
  if (!host || !window.RPT || !window.U) return;
  const CC = RPT.conclusions;
  if (!CC || !CC.length) return;
  const body = U.frame(host, {
    title: "六条结论：强度标在徽章上",
    sub: "徽章 = 判断强度（蓝 = 已验证 · 琥珀 = 有证据有争议 · 灰 = 假说待裁决）· 点击卡片跳到对应章证据",
    src: "官方披露 · 本报告测算 · 截至 2026-07-17",
  });

  const P = U.PAL;
  // 结论 → 对应章锚点（导航结构映射；结论为跨章合成，取其主要证据章）
  const CH = {
    1: ["§9 利润池", "sec-pool"],
    2: ["§6–§7 瓶颈接力", "sec-power"],
    3: ["§2–§3 计量与定价", "sec-meter"],
    4: ["§8 资产负债表", "sec-balance"],
    5: ["§10 中国链", "sec-china"],
    6: ["§8 资产负债表", "sec-balance"],
  };
  const sCol = s => /已验证/.test(s) ? P.blue : /假说待裁决/.test(s) ? P.inkLo : P.amber;

  const css = `
  #chart-conclusions .cc-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
  @media (max-width:1020px){#chart-conclusions .cc-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media (max-width:620px){#chart-conclusions .cc-grid{grid-template-columns:1fr}}
  #chart-conclusions .cc-card{border:1px solid var(--line);background:var(--paper);
    padding:15px 17px 13px;cursor:pointer;display:flex;flex-direction:column;
    transition:box-shadow .16s ease,transform .16s ease}
  #chart-conclusions .cc-card:hover{box-shadow:0 10px 26px rgba(10,31,51,.12);transform:translateY(-2px)}
  #chart-conclusions .cc-badge{align-self:flex-start;font-family:var(--mono);font-size:9.5px;font-weight:700;
    letter-spacing:.12em;padding:3px 10px;border:1px solid}
  #chart-conclusions .cc-text{font-family:var(--serif);font-size:13.5px;color:var(--ink);
    line-height:1.8;margin-top:11px}
  #chart-conclusions .cc-ch{margin-top:auto;padding-top:11px;font-family:var(--mono);
    font-size:10px;font-weight:700;color:var(--blue);letter-spacing:.06em}
  @keyframes ccFlash{0%{box-shadow:0 0 0 3px rgba(34,81,255,.55)}100%{box-shadow:0 0 0 3px rgba(34,81,255,0)}}
  .sec-jump-flash{animation:ccFlash 1.7s ease-out 1}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const grid = document.createElement("div");
  grid.className = "cc-grid";
  body.appendChild(grid);

  const cards = [];
  CC.forEach(c => {
    const col = sCol(c.strength);
    const ch = CH[c.id] || ["§13 总结", "sec-conclusion"];
    const el = document.createElement("div");
    el.className = "cc-card";
    el.style.borderColor = col;
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.innerHTML =
      `<span class="cc-badge" style="color:${col};border-color:${col}">${U.esc(c.strength)}</span>` +
      `<p class="cc-text">${U.esc(c.text)}</p>` +
      `<p class="cc-ch">证据见 ${U.esc(ch[0])} →</p>`;
    const jump = () => {
      const tgt = document.getElementById(ch[1]);
      if (!tgt) return;
      tgt.scrollIntoView({ behavior: U.reduced() ? "auto" : "smooth", block: "start" });
      setTimeout(() => {
        tgt.classList.add("sec-jump-flash");
        setTimeout(() => tgt.classList.remove("sec-jump-flash"), 1800);
      }, U.reduced() ? 60 : 650);
    };
    el.addEventListener("click", jump);
    el.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jump(); }
    });
    grid.appendChild(el);
    cards.push(el);
  });

  cards.forEach(c => c.classList.add("rv"));
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    cards.forEach((c, i) => setTimeout(() => c.classList.add("in"), i * 100));
  }, { threshold: 0.12 });
  io.observe(grid);
})();
