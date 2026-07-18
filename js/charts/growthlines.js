// §5 需求增长线 · 权重 × 增速复合条（宿主 #chart-growthlines）
// 六线：左 = 权重条（长度 ∝ 精确权重，显示取整 20/55/9/8/1/6），右 = 增速浮动条
// （悲观–乐观区间浮于 0–15x 刻度，基准值为实心刻标）。
// 悬停/点击实时显示该线贡献份额（口径 A，取自数据 shareA）；脚注"合计 99% 为显示舍入"。
// 数据：RPT.growthLines。
(() => {
  const host = document.getElementById("chart-growthlines");
  if (!host || !window.RPT) return;
  const body = U.frame(host, {
    title: `需求六条增长线：权重 × 增速（base 情景合成 ${RPT.growthLines.synth.demand.toFixed(2)}x/年）`,
    sub: "左条 = 权重 · 右浮动条 = 增速区间（竖刻 = 基准）· 悬停或点击任意行查看该线贡献份额",
    src: "本报告测算 · 官方披露 · 截至 2026-07-17",
  });

  const P = U.PAL;
  const GL = RPT.growthLines;
  const lines = GL.lines;
  const G_MAX = Math.max(...lines.map(l => l.high)); // 增速刻度上限（15x）

  const css = `
  #chart-growthlines .gl-row { display:grid; grid-template-columns: 176px 1fr 214px; gap:16px;
    align-items:center; padding:14px 8px; border-bottom:1px solid var(--line-lo); cursor:pointer; }
  #chart-growthlines .gl-row:first-of-type { border-top:1px solid var(--line-lo); }
  #chart-growthlines .gl-row:hover { background: rgba(34,81,255,.04); }
  #chart-growthlines .gl-name { font-family:var(--serif); font-weight:700; font-size:13.5px; color:var(--ink); line-height:1.35; }
  #chart-growthlines .gl-tag { display:inline-block; font-family:var(--mono); font-size:8.5px; color:var(--neg);
    border:1px solid var(--neg); border-radius:3px; padding:1px 5px; margin-left:6px; vertical-align:2px; letter-spacing:.06em; }
  #chart-growthlines .gl-track { position:relative; height:26px; }
  #chart-growthlines .gl-bar { position:absolute; left:0; top:0; height:100%; border-radius:2px;
    transform-origin:left center; transform:scaleX(0); transition:transform .8s cubic-bezier(.2,.8,.3,1); }
  #chart-growthlines .gl-wlab { position:absolute; left:7px; top:50%; transform:translateY(-50%);
    font-family:var(--mono); font-size:10px; color:var(--paper-hi); white-space:nowrap; }
  #chart-growthlines .gl-wlab.out { left:auto; right:-7px; transform:translate(100%,-50%); color:var(--ink-md); }
  #chart-growthlines .gl-gtrack { position:relative; height:26px; border-left:1px solid var(--line); }
  #chart-growthlines .gl-gtick { position:absolute; top:24px; font-family:var(--mono); font-size:8px;
    color:var(--ink-lo); transform:translateX(-50%); }
  #chart-growthlines .gl-ggrid { position:absolute; top:0; bottom:4px; width:1px; background:var(--line-lo); }
  #chart-growthlines .gl-grange { position:absolute; top:8px; height:10px; border-radius:2px;
    background:rgba(34,81,255,.14); border:1px solid var(--blue-lo);
    transform-origin:left center; transform:scaleX(0); transition:transform .8s cubic-bezier(.2,.8,.3,1); }
  #chart-growthlines .gl-gbase { position:absolute; top:4px; width:3px; height:18px; border-radius:1px;
    background:var(--blue); transform:scaleY(0); transition:transform .5s ease; }
  #chart-growthlines .gl-glab { position:absolute; top:-1px; transform:translateX(-50%);
    font-family:var(--mono); font-weight:700; font-size:10.5px; color:var(--ink); white-space:nowrap; }
  #chart-growthlines .gl-info { margin-top:14px; padding:9px 12px; border:1px dashed var(--line);
    font-family:var(--mono); font-size:11px; color:var(--ink-md); min-height:36px; line-height:1.6; }
  #chart-growthlines .gl-info b { color:var(--blue); }
  #chart-growthlines .gl-foot { margin-top:8px; font-family:var(--mono); font-size:9.5px; color:var(--ink-lo); line-height:1.6; }
  @media (max-width:760px){
    #chart-growthlines .gl-row{ grid-template-columns:118px 1fr 150px; gap:8px; padding:12px 4px; }
    #chart-growthlines .gl-name{ font-size:12px; }
  }
  `;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const list = document.createElement("div");
  body.appendChild(list);
  const info = document.createElement("div");
  info.className = "gl-info";
  const defaultInfo = `六线加权合成基准需求增速 <b>${GL.synth.demand.toFixed(2)}x/年</b>（精确 ${GL.synth.demandExact}x，对照缺口模型基准 ${RPT.gap.cases.find(c => c.key === "base").demand}x）· 悬停或点击任意行查看该线贡献份额（口径 A）`;
  info.innerHTML = defaultInfo;
  body.appendChild(info);
  const foot = document.createElement("div");
  foot.className = "gl-foot";
  foot.textContent = GL.footnote;
  body.appendChild(foot);

  const maxW = Math.max(...lines.map(l => l.weight));
  const rows = [];
  lines.forEach((l, i) => {
    const row = document.createElement("div");
    row.className = "gl-row";
    row.setAttribute("data-drill-keep", "1");
    const isKey = l.id === "chinaModel";
    const barCol = isKey ? P.blue : P.ink;
    // 权重条
    const wPctOfMax = (l.weight / maxW * 100).toFixed(1);
    const wlabOut = l.weight < 0.09;
    // 增速浮动条（low–high 区间 + base 刻标）
    const gL = (l.low / G_MAX * 100).toFixed(1);
    const gW = ((l.high - l.low) / G_MAX * 100).toFixed(1);
    const gB = (l.base / G_MAX * 100).toFixed(1);
    const gridTicks = [5, 10, 15].filter(v => v <= G_MAX)
      .map(v => `<span class="gl-ggrid" style="left:${(v / G_MAX * 100).toFixed(1)}%"></span>` +
        `<span class="gl-gtick" style="left:${(v / G_MAX * 100).toFixed(1)}%">${v}x</span>`).join("");
    row.innerHTML =
      `<div><div class="gl-name">${U.esc(l.name)}${isKey ? '<span class="gl-tag">承重假设</span>' : ""}</div>` +
      `<div style="font-family:var(--mono);font-size:9px;color:${isKey ? "var(--blue)" : "var(--ink-lo)"};margin-top:3px">` +
      `基准 ${l.base.toFixed(1)}x（区间 ${l.low}–${l.high}）· 贡献 ${U.esc(l.shareA)}</div></div>` +
      `<div class="gl-track"><div class="gl-bar" style="width:${wPctOfMax}%;background:${barCol};opacity:${isKey ? .92 : .72}">` +
      `<span class="gl-wlab ${wlabOut ? "out" : ""}">权重 ${U.esc(l.weightDisplay)}</span></div></div>` +
      `<div class="gl-gtrack">${gridTicks}` +
      `<div class="gl-grange" style="left:${gL}%;width:${gW}%"></div>` +
      `<div class="gl-gbase" style="left:${gB}%"></div>` +
      `<span class="gl-glab" style="left:${gB}%">${l.base.toFixed(1)}x</span></div>`;
    const showShare = () => {
      info.innerHTML = `<b>${U.esc(l.name)}</b> · 权重 ${U.esc(l.weightDisplay)}（精确 ${(l.weight * 100).toFixed(2)}%）× 基准增速 ${l.base.toFixed(1)}x（区间 ${l.low}–${l.high}x）→ 对基准合成增速的贡献份额 <b>${U.esc(l.shareA)}</b>（口径 A）`;
    };
    row.addEventListener("mouseenter", showShare);
    row.addEventListener("click", e => {
      showShare();
      U.showDrill({ title: l.drill.title, value: l.drill.value, sub: l.drill.sub,
        source: l.drill.source, x: e.clientX, y: e.clientY });
    });
    row.addEventListener("mouseleave", () => { info.innerHTML = defaultInfo; });
    list.appendChild(row);
    rows.push(row);
  });

  // 入场：行渐入 + 权重条/增速条生长
  rows.forEach(r => r.classList.add("rv"));
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    rows.forEach((r, i) => setTimeout(() => {
      r.classList.add("in");
      r.querySelector(".gl-bar").style.transform = "scaleX(1)";
      r.querySelector(".gl-grange").style.transform = "scaleX(1)";
      const gb = r.querySelector(".gl-gbase");
      setTimeout(() => { gb.style.transform = "scaleY(1)"; }, 300);
    }, i * 110));
  }, { threshold: 0.18 });
  io.observe(list);
})();
