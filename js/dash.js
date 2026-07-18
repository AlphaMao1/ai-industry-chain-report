// 常驻右栏仪表盘 v2（新增 · DOM + mini-SVG，不引第三方库）
// 契约：outline《AI研究报告大纲》§4.1 —— 章节状态机驱动的全局读数栏。
// 自上而下：① 报告地图（16 章迷你轨）② 四主线读数牌 ③ 缺口比迷你 sparkline
// ④ 资本开支灯号盘 ⑤ 八条红线紧凑列表 ⑥ 底行"截至 2026-07-17 · 每个读数可点下钻"。
// 数据全部取自 window.RPT（keyNumbers / gap / profitPool / revenuePool / capex / triggers），
// 防御性读取：RPT 未就绪时只渲染结构件并静默跳过，DOMContentLoaded 后重试一次。
(() => {
  if (!window.U) return;   // 依赖 utils.js（加载序：utils → dash）

  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, cls, parent) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  };
  const svg = (n, a, parent) => {
    const e = document.createElementNS(NS, n);
    for (const k in a) e.setAttribute(k, a[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const RPT = () => window.RPT || null;
  const drill = (d, e) => U.showDrill({ title: d.title, value: d.value, sub: d.sub, source: d.source, x: e.clientX, y: e.clientY });

  /* ══ 宿主（缺则自建 aside，CSS 固定定位右栏） ══ */
  const host = document.getElementById("dash-rail") || (() => {
    const a = document.createElement("aside");
    a.id = "dash-rail";
    document.body.appendChild(a);
    return a;
  })();
  const inner = el("div", "dash-inner", host);

  /* ══ ① 报告地图：16 章迷你轨（结构件，不依赖数据） ══ */
  const MAP = [
    ["cover", "封面"], ["exec", "§0 · 执行摘要"], ["task", "§1 · 任务通胀"],
    ["meter", "§2 · 计量战争"], ["price", "§3 · 价格分层"], ["monetize", "§4 · 变现证据"],
    ["gap", "§5 · 供需缺口"], ["relay", "§6 · 瓶颈接力"], ["power", "§7 · 电力"],
    ["balance", "§8 · 资产负债表"], ["pool", "§9 · 利润池"], ["china", "§10 · 中国链"],
    ["export", "§11 · 出口管制"], ["verdict", "§12 · 裁决与反证"],
    ["conclusion", "§13 · 总结"], ["method", "方法与边界"],
  ];
  const secMap = el("section", "d-sec d-map", inner);
  el("p", "d-h", secMap).textContent = "报告地图";
  const mapWrap = el("div", "dm-track", secMap);
  const mapItems = MAP.map(([win, label]) => {
    const it = el("button", "dm-item", mapWrap);
    it.type = "button";
    it.dataset.win = win;
    it.innerHTML = `<span class="dm-tick"></span><span class="dm-label">${label}</span>`;
    it.addEventListener("click", () => {
      const t = document.querySelector(`[data-win="${win}"]`);
      if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return it;
  });

  /* ══ ② 四主线读数牌（数据缺席 → "—"，不渲染下钻、不硬编码数字） ══ */
  const CARDS = [
    {
      id: "share", label: "利润池上游份额", wins: ["exec", "pool"],
      read() {
        const R = RPT(); if (!R) return null;
        const kn = R.keyNumbers && R.keyNumbers.share;
        const layer = R.profitPool && R.profitPool.layers && R.profitPool.layers.find(l => l.id === "semiconductor");
        const v = (kn && kn.display) || (layer && layer.share && layer.share.base);
        if (!v) return null;
        return { v, sub: "半导体 · base 情景", drill: (kn && kn.drill) || (layer && layer.drill) };
      },
    },
    {
      id: "gap", label: "供需缺口比 12 个月", wins: ["gap"],
      read() {
        const R = RPT(); if (!R) return null;
        const kn = R.keyNumbers && R.keyNumbers.gap;
        const g = R.gap;
        // 情景点名兼容：data.js 用中文名（基准/收紧/放松），旧契约用英文名
        const isBase = c => c.name === "base" || c.name === "基准";
        const base = g && g.cases && g.cases.find(isBase);
        const v = (kn && kn.display) || (g && base ? `${g.current}→${base.ratio12m}` : null);
        if (!v) return null;
        const t = g.cases.find(c => c.name === "tightening" || c.name === "收紧");
        const l = g.cases.find(c => c.name === "loosening" || c.name === "放松");
        return {
          v, sub: `base 情景 · 走廊 ${l ? l.ratio12m : "?"}–${t ? t.ratio12m : "?"}`,
          drill: (kn && kn.drill) || {
            title: "供需缺口比（base 情景）", value: `${g.current} → ${base.ratio12m}（12 个月）`,
            sub: `走廊 ${l ? l.ratio12m : "?"}–${t ? t.ratio12m : "?"}；缺口比 <1 = 紧平衡，不等于短缺。` +
                 (g.supplyNote ? "<br/>" + g.supplyNote : ""),
            source: "自研模型",
          },
        };
      },
    },
    {
      id: "ds", label: "需求 vs 供给增速", wins: ["gap"],
      read() {
        const R = RPT(); if (!R) return null;
        const kn = R.keyNumbers && R.keyNumbers.ds;
        const base = R.gap && R.gap.cases && R.gap.cases.find(c => c.name === "base" || c.name === "基准");
        const v = (kn && kn.display) || (base ? `${base.demand}x vs ${base.supply}x` : null);
        if (!v) return null;
        return {
          v, sub: "base 情景 · 年化",
          drill: (kn && kn.drill) || {
            title: "需求 vs 供给（base 情景）", value: `需求 ${base.demand}x/年 · 供给 ${base.supply}x/年`,
            sub: "需求 = 六条增长线按 base 体量加权合成；供给 = 产能增速 × 服务速率增速。" +
                 (R.gap.supplyNote ? "<br/>" + R.gap.supplyNote : ""),
            source: "自研模型",
          },
        };
      },
    },
    {
      id: "rev", label: "推理收入池", wins: ["price", "monetize"],
      read() {
        const R = RPT(); if (!R) return null;
        const kn = R.keyNumbers && R.keyNumbers.rev;
        const rp = R.revenuePool && R.revenuePool.current;
        const v = (kn && kn.display) || (rp ? "$" + Math.round(rp.base) + "B" : null);
        if (!v) return null;
        return {
          v, sub: rp ? `base 情景 · 走廊 $${Math.round(rp.low)}B–$${Math.round(rp.high)}B` : "base 情景",
          drill: (kn && kn.drill) || {
            title: "MaaS 收入池（base 情景）", value: `$${rp.base}B（年化 run-rate）`,
            sub: `走廊 $${rp.low}B–$${rp.high}B。` + (R.revenuePool.reconcile ? "<br/>" + R.revenuePool.reconcile : ""),
            source: "自研模型",
          },
        };
      },
    },
  ];
  const secCards = el("section", "d-sec d-cards", inner);
  el("p", "d-h", secCards).textContent = "四条主线 · 读数可点";
  const cardWrap = el("div", "dc4-grid", secCards);
  const cardNodes = CARDS.map(c => {
    const b = el("button", "dc4", cardWrap);
    b.type = "button";
    b.innerHTML = `<span class="dc4-label">${c.label}</span><span class="dc4-v">—</span><span class="dc4-sub"></span>`;
    return b;
  });

  /* ══ ③ 缺口比迷你 sparkline（RPT.gap 三路径 + 1.0 参考线；进 §5 放大描边） ══ */
  const secSpark = el("section", "d-sec d-spark", inner);
  el("p", "d-h", secSpark).textContent = "缺口比 · 三情景路径";
  const sparkBox = el("div", null, secSpark);
  secSpark.style.display = "none";
  function drawSpark(g) {
    sparkBox.innerHTML = "";
    const W = 344, H = 96, P = { l: 6, r: 40, t: 8, b: 8 };
    const YMAX = 2.4;
    const x = m => P.l + (m / 12) * (W - P.l - P.r);
    const y = v => P.t + (1 - v / YMAX) * (H - P.t - P.b);
    const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "d-spark-svg", role: "img",
      "aria-label": "缺口比三情景迷你路径图" }, sparkBox);
    svg("line", { x1: P.l, x2: W - P.r, y1: y(1), y2: y(1), class: "sp-ref" }, s);
    const refLab = svg("text", { x: P.l + 2, y: y(1) - 3, class: "sp-lab" }, s);
    refLab.textContent = "1.0 = 越买越缺";
    const COL = { tightening: U.PAL.red, base: U.PAL.blue, loosening: U.PAL.inkLo };
    (g.cases || []).forEach(c => {
      const col = COL[c.name] || U.PAL.ink;
      let d = "";
      for (let m = 0; m <= 12; m++) {
        const v = g.current * Math.pow(c.ratio12m / g.current, m / 12);   // 月度指数插值
        d += (m ? "L" : "M") + x(m).toFixed(1) + " " + y(v).toFixed(1);
      }
      svg("path", { d, class: `sp-path sp-${c.name}`, stroke: col }, s);
      svg("circle", { cx: x(12), cy: y(c.ratio12m), r: 2.4, fill: col }, s);
      const lt = svg("text", { x: W - P.r + 5, y: y(c.ratio12m) + 3, class: `sp-lab sp-lab-${c.name}` }, s);
      lt.textContent = String(c.ratio12m);
    });
    s.addEventListener("click", e => {
      const b = g.cases.find(c => c.name === "base") || {};
      const t = g.cases.find(c => c.name === "tightening") || {};
      const l = g.cases.find(c => c.name === "loosening") || {};
      drill({
        title: "缺口比三情景（12 个月路径）",
        value: `base ${g.current} → ${b.ratio12m}`,
        sub: `tightening ${t.ratio12m} · loosening ${l.ratio12m}；1.0 参考线之上为"越买越缺"。` +
             (g.supplyNote ? "<br/>" + g.supplyNote : ""),
        source: "自研模型",
      }, e);
    });
    const cap = el("p", "d-cap", sparkBox);
    cap.textContent = `起点 ${g.current} · 横轴 0–12 个月 · 点击下钻`;
    secSpark.style.display = "";
  }

  /* ══ ④ 资本开支灯号盘（黄橙灯总灯 + 四公司点；进 §8 展开注记） ══ */
  const secLamp = el("section", "d-sec d-lamp", inner);
  el("p", "d-h", secLamp).textContent = "资本开支 · 回收灯号";
  const lampHead = el("button", "dl-head", secLamp);
  lampHead.type = "button";
  lampHead.innerHTML = `<span class="dl-master" aria-hidden="true"></span>` +
    `<span class="dl-total">—</span><span class="dl-tag">黄橙灯</span>`;
  const coWrap = el("div", "dl-cos", secLamp);
  const lampNotes = el("div", "dl-notes", secLamp);
  secLamp.style.display = "none";
  function fillLamp(R) {
    const cx = R.capex;
    if (!cx) return;
    const kn = R.keyNumbers && R.keyNumbers.capex;
    lampHead.querySelector(".dl-total").textContent =
      (kn && kn.display) || (cx.total2026e ? `四大 2026E $${cx.total2026e}B` : "—");
    lampHead.addEventListener("click", e => {
      const d = (kn && kn.drill) || cx.drill;
      if (d) drill(d, e);
    });
    // 点色编码：Microsoft/Google 墨 · Amazon 橙 · Meta 琥珀（仅灯号组件用色）
    const dotCol = name => /amazon/i.test(name) ? U.PAL.orange : /meta/i.test(name) ? U.PAL.amber : U.PAL.ink;
    (cx.companies || []).forEach(co => {
      const b = el("button", "dl-co", coWrap);
      b.type = "button";
      b.innerHTML = `<span class="dl-dot" style="background:${dotCol(co.name)}"></span>` +
        `<span class="dl-name">${co.name}</span>` +
        (co.fy2026e != null ? `<span class="dl-val">$${co.fy2026e}B</span>` : "");
      b.addEventListener("click", e => drill({
        title: `${co.name} · 资本开支`, value: co.fy2026e != null ? `2026E ~$${co.fy2026e}B` : co.name,
        sub: co.note || "", source: (cx.drill && cx.drill.source) || "公司披露 · 券商研究",
      }, e));
      if (co.note) el("div", "dl-note", lampNotes).textContent = `${co.name}：${co.note}`;
    });
    secLamp.style.display = "";
  }

  /* ══ ⑤ 八条红线紧凑列表（RPT.triggers 人话标签 + 当前读数；进 §12 全展开） ══ */
  const secTrig = el("section", "d-sec d-trig", inner);
  el("p", "d-h", secTrig).textContent = "八条红线 · 越线即重估";
  const trigWrap = el("div", "dt-list", secTrig);
  secTrig.style.display = "none";
  function fillTrig(R) {
    const list = R.triggers || R.signals;   // 新数据用 triggers；v1 signals 兜底
    if (!Array.isArray(list) || !list.length) return;
    list.forEach(t => {
      const row = el("div", "dt-row", trigWrap);
      const label = t.label || t.name || "";
      row.innerHTML =
        `<div class="dt-label">${label}</div>` +
        (t.cur ? `<div class="dt-cur">当前读数 · ${t.cur}</div>` : "") +
        (t.threshold ? `<div class="dt-thr"><b>越线</b> ${t.threshold}${t.action ? `　<b>→</b> ${t.action}` : ""}</div>` : "");
      row.addEventListener("click", e => {
        const d = t.drill || {
          title: label, value: t.cur || label,
          sub: (t.threshold ? `<b>阈值：</b>${t.threshold}` : "") + (t.action ? `<br/><b>触发动作：</b>${t.action}` : ""),
          source: t.source || "自研模型",
        };
        drill(d, e);
      });
    });
    secTrig.style.display = "";
  }

  /* ══ ⑥ 底行 ══ */
  const foot = el("p", "d-foot", inner);
  const asof = () => (RPT() && RPT().meta && RPT().meta.asof) || "2026-07-17";
  foot.textContent = `截至 ${asof()} · 每个读数可点下钻`;

  /* ══ 数据填充（防御性；RPT 未就绪 → DOMContentLoaded 重试一次） ══ */
  let filled = false;
  function fillData() {
    if (filled) return true;
    const R = RPT();
    if (!R) return false;
    filled = true;
    CARDS.forEach((c, i) => {
      const d = c.read();
      if (!d) return;
      const n = cardNodes[i];
      n.querySelector(".dc4-v").textContent = d.v;
      n.querySelector(".dc4-sub").textContent = d.sub || "";
      if (d.drill) n.addEventListener("click", e => drill(d.drill, e));
    });
    if (R.gap && Array.isArray(R.gap.cases) && R.gap.current != null) drawSpark(R.gap);
    fillLamp(R);
    fillTrig(R);
    foot.textContent = `截至 ${asof()} · 每个读数可点下钻`;
    return true;
  }
  if (!fillData()) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fillData, { once: true });
    else setTimeout(fillData, 0);
  }

  /* ══ 入场兜底：正常由 main.js 滚动驱动（会写入内联 opacity）；
        若加载顺序异常导致无人驱动，load 后自行可见，避免右栏永久隐身 ══ */
  window.addEventListener("load", () => {
    if (!host.style.opacity) {
      host.style.opacity = 1;
      host.style.transform = "none";
      host.style.pointerEvents = "auto";
    }
  });

  /* ══ 状态机接口：main.js 章节切换时调用 ══ */
  let cur = null;
  window.DASH = {
    set(win) {
      cur = win;
      mapItems.forEach(it => it.classList.toggle("on", it.dataset.win === win));
      CARDS.forEach((c, i) => cardNodes[i].classList.toggle("on", c.wins.includes(win)));
      secSpark.classList.toggle("focus", win === "gap");     // 进 §5 放大描边
      secLamp.classList.toggle("open", win === "balance");   // 进 §8 展开注记
      secTrig.classList.toggle("open", win === "verdict");   // 进 §12 全部展开
    },
    get current() { return cur; },
  };
})();
