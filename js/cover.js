// 封面主视觉：利润地层图（新增 · 宿主 #cover-strata）
// 契约：outline《AI研究报告大纲》§4.2 / 封面节 ——
// 六层水平地层条，宽度（× 恒定高度 = 面积）编码 base 情景份额（71.3/11.3/8.7/6.5/2.2/-5.8）；
// 模型层红色下凹表示负值；入场逐级 draw-in；reduced-motion 直接落完成帧（U.play 内置）；
// 每层点击跳转 #sec-pool 并可下钻；读 window.RPT.strata（防御性，缺省用硬编码兜底）。
(() => {
  if (!window.U) return;   // 依赖 utils.js（加载序：utils → cover）

  /* ── 硬编码兜底（仅当 RPT.strata / RPT.profitPool 均缺席时启用；
        数字唯一权威：js/data.js profitPool base 份额，对齐 outline《数字校准表》第四节） ── */
  const FALLBACK = [
    { id: "semiconductor", name: "半导体 · GPU/HBM/封装/设备", share: 71.3, val: "$65.33B/季" },
    { id: "cloud", name: "云 / AI 算力", share: 11.3, val: "$10.36B/季" },
    { id: "dcpower", name: "数据中心 / 电力 / 液冷", share: 8.7, val: "$8.0B/季" },
    { id: "workflow", name: "工作流软件", share: 6.5, val: "$6.0B/季" },
    { id: "services", name: "服务 / 集成", share: 2.2, val: "$2.0B/季" },
    { id: "modellab", name: "模型 / 接口层（净利润口径）", share: -5.8, val: "-$5.0B/季" },
  ];

  // 防御性读取：优先 RPT.strata；其次由 RPT.profitPool.layers 派生；最后硬编码兜底
  // 注意：data.js 的 strata 字段为 shareBase/valueBase/name/drill/negative（非 share/val）
  function readStrata() {
    const R = window.RPT;
    if (R && Array.isArray(R.strata) && R.strata.length >= 2) {
      return R.strata.map((s, i) => {
        // 字段兜底链：shareBase → share；valueBase → val/value；任一环缺失再退回 FALLBACK 同位项
        const fb = FALLBACK[i] || {};
        let share = typeof s.shareBase === "number" ? s.shareBase
          : (typeof s.share === "number" ? s.share : parseFloat(s.shareBase != null ? s.shareBase : s.share));
        if (!isFinite(share)) share = typeof fb.share === "number" ? fb.share : 0;
        const vb = s.valueBase != null ? s.valueBase : (s.val != null ? s.val : s.value);
        const val = typeof vb === "number" ? (vb < 0 ? "−$" + Math.abs(vb) + "B/季" : "$" + vb + "B/季")
          : (vb || fb.val || "");
        return {
          id: s.id || fb.id || "layer" + i,
          name: s.name || fb.name || "",
          share,
          val,
          negative: s.negative === true || share < 0,
          drill: s.drill || null,
        };
      });
    }
    if (R && R.profitPool && Array.isArray(R.profitPool.layers) && R.profitPool.layers.length >= 2) {
      return R.profitPool.layers.map(l => ({
        id: l.id, name: l.name,
        share: parseFloat(String(l.share && l.share.base).replace("%", "")) || 0,
        val: "", drill: l.drill || null,
      }));
    }
    return FALLBACK;
  }

  /* ── 宿主（缺则自动插到封面 lede 之后；仍无则静默退出） ── */
  let host = document.getElementById("cover-strata");
  if (!host) {
    const inner = document.querySelector("#cover .cover-inner");
    if (!inner) return;
    host = document.createElement("div");
    host.id = "cover-strata";
    const lede = inner.querySelector(".cover-lede");
    inner.insertBefore(host, lede ? lede.nextSibling : inner.firstChild);
  }

  const LAYERS = readStrata();
  const POS = LAYERS.filter(l => l.share >= 0);
  const NEG = LAYERS.filter(l => l.share < 0);

  /* ── 头部（衬线标题 + 等宽大写副题，与 U.frame 同语言） ── */
  const head = document.createElement("div");
  head.className = "strata-head";
  head.innerHTML = `<p class="strata-title">利润地层</p>` +
    `<p class="strata-sub">PROFIT STRATA · BASE 情景份额 · 点击地层下钻并跳 §9</p>`;
  host.appendChild(head);
  const box = document.createElement("div");
  host.appendChild(box);

  /* ── 几何 ── */
  const W = 940, GUT = 178, X0 = GUT, X1 = 924, TRACK = X1 - X0;
  const BH = 40, GAP = 9, TOP = 8;
  const baseY = TOP + POS.length * (BH + GAP) + 4;      // 零轴（正利润池基准线）
  const NH = 30;                                         // 负值层下凹高度
  const H = baseY + 10 + NH + 26;
  const wOf = share => Math.abs(share) / 100 * TRACK;    // 宽度 ∝ 份额（恒定高度 → 面积编码）

  // 色族纪律：墨阶 + 电蓝 + 语义红（琥珀/野橙不进此图）
  const POS_FILL = ["#2251ff", "rgba(10,31,51,.74)", "rgba(10,31,51,.58)", "rgba(10,31,51,.42)", "rgba(10,31,51,.28)"];
  const POS_TXT = ["#2251ff", "#0a1f33", "#0a1f33", "#46586a", "#46586a"];

  const svgEl = U.svgEl("svg", {
    viewBox: `0 0 ${W} ${H}`, class: "strata-svg", role: "img",
    "aria-label": "利润地层图：六层产业链 base 情景份额，模型层为负",
  });
  box.appendChild(svgEl);

  const goPool = () => {
    const t = document.getElementById("sec-pool") || document.querySelector('[data-win="pool"]');
    if (t) t.scrollIntoView({ behavior: U.reduced() ? "auto" : "smooth", block: "start" });
  };
  const openDrill = (L, e) => {
    const d = L.drill || {
      title: L.name,
      value: `${L.share > 0 ? "+" : ""}${L.share}%（base 情景）${L.val ? " · " + L.val : ""}`,
      sub: "利润地层 = 六层 base 情景份额；面积编码，模型层按净利润口径为负（红色下凹）。",
      source: "本报告测算",
    };
    U.showDrill({ title: d.title, value: d.value, sub: d.sub, source: d.source, x: e.clientX, y: e.clientY });
  };

  const animated = [];
  const drawLayer = (L, i, y, h, fill, txtCol, isNeg) => {
    const g = U.svgEl("g", { class: "st-layer", tabindex: "0", role: "button",
      "aria-label": `${L.name} ${L.share}%，点击下钻并跳利润池章` });
    // 层名（左侧栏，右对齐）
    const name = U.svgEl("text", { x: X0 - 12, y: y + h / 2 + 4.5, "text-anchor": "end", class: "st-name" });
    name.textContent = L.name;
    g.appendChild(name);
    // 地层条（宽度从 0 逐级 draw-in）
    const full = wOf(L.share);
    const rect = U.svgEl("rect", { x: X0, y, width: 0, height: h, fill, class: "st-bar" });
    g.appendChild(rect);
    animated.push({ start: i * 0.14, dur: 0.6, set: p => rect.setAttribute("width", (full * p).toFixed(1)) });
    // 份额标签（条尾外侧，等宽数字）
    const share = U.svgEl("text", { x: X0 + full + 8, y: y + h / 2 + 4.5, class: "st-share", fill: txtCol });
    share.textContent = (isNeg ? "−" : "") + Math.abs(L.share).toFixed(1) + "%";
    g.appendChild(share);
    const act = e => { openDrill(L, e); goPool(); };
    g.addEventListener("click", act);
    g.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(e); }
    });
    svgEl.appendChild(g);
  };

  // 五层正值地层（自上而下 = 链路上游 → 下游）
  POS.forEach((L, i) => {
    drawLayer(L, i, TOP + i * (BH + GAP), BH, POS_FILL[i % POS_FILL.length], POS_TXT[i % POS_TXT.length], false);
  });

  // 零轴基准线
  svgEl.appendChild(U.svgEl("line", { x1: X0, x2: X1, y1: baseY, y2: baseY,
    stroke: "rgba(10,31,51,.35)", "stroke-width": 1 }));
  const bl = U.svgEl("text", { x: X0 - 12, y: baseY + 3, "text-anchor": "end", class: "st-base-lab" });
  bl.textContent = "0 轴";
  svgEl.appendChild(bl);

  // 模型层：红色下凹（负值挂在零轴之下）
  NEG.forEach((L, j) => {
    drawLayer(L, POS.length + j, baseY + 8, NH, "#c22f4e", "#c22f4e", true);
  });

  /* ── 入场：逐级 draw-in（reduced-motion 由 U.play 直接落完成帧） ── */
  U.play(animated, host, { threshold: 0.3 });

  /* ── 图注 ── */
  const cap = document.createElement("p");
  cap.className = "strata-cap";
  cap.textContent = "面积 = base 情景正利润池份额（%）· 模型层按净利润口径为负（红色下凹）· 点击任一地层跳 §9 利润池";
  host.appendChild(cap);
})();
