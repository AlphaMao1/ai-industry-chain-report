// §13 方向地图 · 全报告收束图（宿主 #chart-direction）
// 产业链五层（硬约束上游 → 云/调度 → 模型 → 工作流软件 → 服务）× 超配/中性/回避落位；
// 哑铃两端电蓝、中间挤压段语义红；左侧纵贯线 + 落位点；点层下钻理由、失效条件与对应章。
// 数据：RPT.directionMap。
(() => {
  const host = document.getElementById("chart-direction");
  if (!host || !window.RPT || !window.U) return;
  const D = RPT.directionMap;
  if (!D || !D.layers) return;
  const body = U.frame(host, {
    title: "方向地图：哑铃配置——利润在两端结算",
    sub: "电蓝 = 超配（当前利润与稀缺所在，哑铃两端）· 灰 = 中性 · 语义红 = 回避 / 挤压段 · 点击层查看理由、失效条件与对应章",
    src: "本报告测算 · 截至 2026-07-17",
  });

  const P = U.PAL;
  const stCol = s => s === "超配" ? P.blue : /回避/.test(s) ? P.red : P.inkLo;
  const stBg = s => s === "超配" ? "rgba(34,81,255,.08)" : /回避/.test(s) ? "rgba(194,47,78,.08)" : "rgba(133,149,166,.1)";
  const roleOf = s => s === "超配" ? "哑铃端" : /回避/.test(s) ? "挤压 / 脆弱段" : "过渡段";

  const css = `
  #chart-direction .dm-disc{font-size:11px;color:var(--ink-lo);line-height:1.7;margin-bottom:14px;max-width:860px;
    border:1px solid var(--line);padding:9px 14px}
  #chart-direction .dm-stack{position:relative;padding-left:26px}
  #chart-direction .dm-stack::before{content:"";position:absolute;left:8px;top:10px;bottom:10px;width:2px;background:var(--line)}
  #chart-direction .dm-card{position:relative;border:1px solid var(--line);
    background:var(--paper);margin-bottom:12px;padding:13px 16px 11px;cursor:pointer;
    transition:box-shadow .16s ease,transform .16s ease}
  #chart-direction .dm-card::before{content:"";position:absolute;left:-24px;top:24px;width:10px;height:10px;
    border-radius:50%;border:2px solid var(--paper);background:var(--dm-dot,#8595a6)}
  #chart-direction .dm-card:hover{box-shadow:0 10px 26px rgba(10,31,51,.12);transform:translateY(-2px)}
  #chart-direction .dm-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  #chart-direction .dm-stance{font-family:var(--mono);font-size:10px;font-weight:700;letter-spacing:.1em;
    padding:3px 10px;border:1px solid}
  #chart-direction .dm-role{font-family:var(--mono);font-size:9px;letter-spacing:.14em;color:var(--ink-lo)}
  #chart-direction .dm-ch{margin-left:auto;font-family:var(--mono);font-size:10.5px;font-weight:700;color:var(--blue)}
  #chart-direction .dm-name{font-family:var(--serif);font-weight:900;font-size:15px;color:var(--ink);margin-top:7px;line-height:1.4}
  #chart-direction .dm-reason{font-size:12px;color:var(--ink-md);line-height:1.65;margin-top:6px}
  #chart-direction .dm-inv{font-size:11px;color:var(--ink-md);line-height:1.6;margin-top:8px;
    border-top:1px dashed var(--line);padding-top:7px}
  #chart-direction .dm-inv b{color:var(--neg);font-family:var(--mono);font-size:9px;letter-spacing:.1em}
  #chart-direction .dm-cn{margin-top:16px;border:1px solid var(--blue);
    background:rgba(34,81,255,.04);padding:12px 15px 10px}
  #chart-direction .dm-eye{font-family:var(--mono);font-size:9px;font-weight:700;letter-spacing:.16em;color:var(--blue)}
  #chart-direction .dm-cn p{font-size:11.5px;color:var(--ink-md);line-height:1.7;margin-top:5px}
  #chart-direction .dm-shift{margin-top:12px;border:1px dashed var(--neg);
    padding:12px 15px 10px}
  #chart-direction .dm-shift .dm-eye{color:var(--neg)}
  #chart-direction .dm-shift li{font-size:11.5px;color:var(--ink-md);line-height:1.7;margin-top:5px;
    list-style:none;padding-left:14px;position:relative}
  #chart-direction .dm-shift li::before{content:"→";position:absolute;left:0;color:var(--neg)}
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  if (D.disclaimer) {
    const disc = document.createElement("p");
    disc.className = "dm-disc";
    disc.textContent = D.disclaimer;
    body.appendChild(disc);
  }

  const stack = document.createElement("div");
  stack.className = "dm-stack";
  body.appendChild(stack);

  const cards = [];
  D.layers.forEach(L => {
    const col = stCol(L.stance);
    const el = document.createElement("div");
    el.className = "dm-card";
    el.style.borderColor = col;
    el.style.setProperty("--dm-dot", col);
    el.setAttribute("data-drill-keep", "1");
    el.innerHTML =
      `<div class="dm-head">` +
      `<span class="dm-stance" style="color:${col};border-color:${col};background:${stBg(L.stance)}">${U.esc(L.stance)}</span>` +
      `<span class="dm-role">${roleOf(L.stance)}</span>` +
      `<span class="dm-ch">证据见 ${U.esc(L.chapter)}</span>` +
      `</div>` +
      `<p class="dm-name">${U.esc(L.name)}</p>` +
      `<p class="dm-reason">${U.esc(L.reason)}</p>` +
      `<p class="dm-inv"><b>失效条件</b>　${U.esc(L.invalidate)}</p>`;
    el.addEventListener("click", e => U.showDrill({
      title: `${L.stance} · ${L.name}`,
      value: L.reason,
      sub: `<b>失效条件：</b>${U.esc(L.invalidate)}<br/><b>对应章证据：</b>${U.esc(L.chapter)}`,
      source: "本报告测算 · 截至 2026-07-17", x: e.clientX, y: e.clientY }));
    stack.appendChild(el);
    cards.push(el);
  });

  // 中国侧补充
  if (D.chinaNote) {
    const cn = document.createElement("div");
    cn.className = "dm-cn";
    cn.innerHTML = `<span class="dm-eye">中国侧</span><p>${U.esc(D.chinaNote)}</p>`;
    body.appendChild(cn);
    cards.push(cn);
  }

  // 方向切换条件
  if (D.shiftConditions && D.shiftConditions.length) {
    const sh = document.createElement("div");
    sh.className = "dm-shift";
    sh.innerHTML =
      `<span class="dm-eye">方向切换条件 · 与红线联动</span>` +
      `<ul>${D.shiftConditions.map(s => `<li>${U.esc(s)}</li>`).join("")}</ul>`;
    body.appendChild(sh);
    cards.push(sh);
  }

  cards.forEach(c => c.classList.add("rv"));
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    cards.forEach((c, i) => setTimeout(() => c.classList.add("in"), i * 110));
  }, { threshold: 0.1 });
  io.observe(stack);
})();
