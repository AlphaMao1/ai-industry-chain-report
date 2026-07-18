// 主编排 v2（全量重写）：
// ① 章节状态机（16 态 data-win，IntersectionObserver -38% 中位激活 → DASH.set）
// ② 顶部 2px 阅读进度条  ③ 封面 chips 锚点跳转  ④ 键盘 ←/→ 跳章
// ⑤ 封面 key-band 数字 count-up + 下钻（全部读 window.RPT.keyNumbers，不硬编码）
// ⑥ 引文卡五段式渲染（blockquote.quote-card[data-quote] → window.RPT.quotes）
// ⑦ 右栏仪表盘滚动驱动入场  ⑧ 章节块渐次入场
// RPT 依赖件防御性读取：数据未就绪时静默跳过，DOMContentLoaded 后重试一次。
(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ── ① 章节状态机：cover|exec|task|meter|price|monetize|gap|relay|power|balance|pool|china|export|verdict|conclusion|method ── */
  const winSecs = $$("[data-win]");
  let activeWin = null;
  const winObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      activeWin = en.target.dataset.win;
      winSecs.forEach(x => x.classList.toggle("active-step", x === en.target));
      if (window.DASH && typeof window.DASH.set === "function") window.DASH.set(activeWin);
    });
  }, { rootMargin: "-38% 0px -38% 0px" });   // 进入视口中段才算"当前章"
  winSecs.forEach(s => winObs.observe(s));

  /* ── ② 顶部阅读进度条（rAF 节流） ── */
  const prog = document.createElement("div");
  prog.id = "read-progress";
  document.body.appendChild(prog);
  let progTick = false;
  const updProg = () => {
    progTick = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = (max > 0 ? Math.min(100, window.scrollY / max * 100) : 0) + "%";
  };
  window.addEventListener("scroll", () => {
    if (!progTick) { progTick = true; requestAnimationFrame(updProg); }
  }, { passive: true });
  updProg();

  /* ── ③ 封面 chips：button[data-goto] 锚点直达 ── */
  $$("[data-goto]").forEach(c => {
    c.addEventListener("click", () => {
      const t = document.querySelector(c.dataset.goto);
      if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ── ④ 键盘 ←/→ 顺序跳章（按 DOM 序，含封面） ── */
  document.addEventListener("keydown", e => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const t = e.target;
    if (t && t.closest && t.closest("input, textarea, select, [contenteditable]")) return;
    if (!winSecs.length) return;
    let i = winSecs.findIndex(s => s.dataset.win === activeWin);
    if (i < 0) {   // 状态机尚未激活（极少见）：按视口中位找当前章
      const mid = window.innerHeight * 0.5;
      i = winSecs.findIndex(s => s.getBoundingClientRect().bottom > mid);
      if (i < 0) i = 0;
    }
    const n = i + (e.key === "ArrowRight" ? 1 : -1);
    if (n >= 0 && n < winSecs.length) {
      e.preventDefault();
      winSecs[n].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  /* ── ⑤ 封面 key-band：数字全部读 window.RPT.keyNumbers 并绑定下钻（不硬编码） ──
     数据契约（与 data.js 对齐；键名 = HTML 中 [data-kb] 的值）：
     RPT.keyNumbers[key] = {
       value: number | [number, number],   // count-up 终点；双值用于 "$695–725B" 类区间
       fmt: (v) => html | (a, b) => html,  // 终值格式化（可含 <span class="u"> 等）
       label?: string,
       drill: { title, value, sub, source }
     }
     键缺席：保留 HTML 终值、不滚动不绑定；RPT 整体缺席：静默跳过重试一次。 */
  function initKeyBand() {
    const band = document.getElementById("key-band");
    if (!band) return true;
    const KN = window.RPT && window.RPT.keyNumbers;
    if (!KN) return false;
    // 下钻绑定（点击/键盘）
    band.querySelectorAll("[data-kb]").forEach(el => {
      const kn = KN[el.dataset.kb];
      if (!kn || !kn.drill) return;
      const item = el.closest(".kb-item") || el;
      if (item.dataset.kbBound) return;
      item.dataset.kbBound = "1";
      item.setAttribute("data-drill-keep", "1");
      item.setAttribute("role", "button");
      item.tabIndex = 0;
      const open = e => window.U && U.showDrill({
        title: kn.drill.title, value: kn.drill.value, sub: kn.drill.sub, source: kn.drill.source,
        x: e.clientX, y: e.clientY,
      });
      item.addEventListener("click", open);
      item.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); }
      });
    });
    // count-up（入视口 40% 后级联滚动，终值即 fmt(1)）
    if (band.dataset.kbPlayed) return true;
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      band.dataset.kbPlayed = "1";
      band.querySelectorAll("[data-kb]").forEach((el, i) => {
        const kn = KN[el.dataset.kb];
        if (!kn || kn.value == null || !window.U) return;
        const fmt = kn.fmt || (v => String(Math.round(v * 100) / 100));
        const fmtT = Array.isArray(kn.value)
          ? t => fmt(kn.value[0] * t, kn.value[1] * t)
          : t => fmt(kn.value * t);
        setTimeout(() => U.countUp(el, { dur: 1200, fmt: fmtT }), i * 120);
      });
    }, { threshold: 0.4 });
    io.observe(band);
    return true;
  }

  /* ── ⑥ 引文卡五段式：顶标签 → 原文斜体 → 中文译文 → small-caps 出处带日期 → 语境/为何重要双行 + 出处↗ ──
     数据契约：RPT.quotes[key] = { quote, quote_cn, speaker_or_source, published_at,
       context_note, why_it_matters, source_url, source, paraphrase }
     （兼容 v1 字段：zh / who / when / ctx / why / src）
     转述类引文（paraphrase=true 或 verbatim=false）：不渲染引号、标签改"转述"、非斜体。 */
  function renderQuotes() {
    const Q = window.RPT && window.RPT.quotes;
    if (!Q) return false;
    $$("blockquote.quote-card[data-quote]").forEach(el => {
      const q = Q[el.dataset.quote];
      if (!q || el.dataset.done) return;
      el.dataset.done = "1";
      const para = !!(q.paraphrase || q.verbatim === false);
      let text = q.quote || "";
      if (para) text = text.replace(/^[“"'\s]+|[”"'\s]+$/g, "");   // 转述类不渲染引号
      const zh = q.quote_cn || q.zh || "";
      const who = q.speaker_or_source || q.who || "";
      const when = q.published_at || q.date || q.when || "";
      const ctx = q.context_note || q.ctx || "";
      const why = q.why_it_matters || q.why || "";
      const url = q.source_url || q.url || "";
      const src = q.source || q.src || "";
      el.classList.toggle("paraphrase", para);
      el.innerHTML =
        `<p class="q-tag">${para ? "转述 · 非逐字原文" : "原文照录"}</p>` +
        (text ? `<p class="q-text">${text}</p>` : "") +
        (zh ? `<p class="q-zh">${zh}</p>` : "") +
        (who || when ? `<p class="q-who">— <b>${who}</b>${when ? `, ${when}` : ""}</p>` : "") +
        `<div class="q-why">` +
        (ctx ? `<p class="q-wline"><span class="q-lab">语境</span>${ctx}</p>` : "") +
        (why ? `<p class="q-wline"><span class="q-lab why">为何重要</span>${why}${url ? ` <a class="q-src" href="${url}" target="_blank" rel="noreferrer">出处 ↗</a>` : ""}</p>` : "") +
        (src ? `<p class="q-wline"><span class="q-lab">出处</span>${src}</p>` : "") +
        `</div>`;
    });
    return true;
  }

  /* RPT 依赖件：未就绪 → DOMContentLoaded 后重试一次（之后仍无则静默跳过） */
  const bootData = () => {
    const a = initKeyBand();
    const b = renderQuotes();
    return a && b;
  };
  if (!bootData()) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootData, { once: true });
    else setTimeout(bootData, 0);
  }

  /* ── ⑦ 右栏仪表盘入场：封面底边 80%vh → 30%vh，smoothstep 淡入 + 18px 滑移 ── */
  const rail = document.getElementById("dash-rail");
  const cover = document.getElementById("cover") || winSecs[0];
  if (rail && cover && window.U) {
    let railTick = false;
    const updRail = () => {
      railTick = false;
      if (U.reduced()) { rail.style.opacity = 1; rail.style.transform = "none"; rail.style.pointerEvents = "auto"; return; }
      const r = cover.getBoundingClientRect();
      const p = U.smooth(U.clamp((window.innerHeight * 0.8 - r.bottom) / (window.innerHeight * 0.5), 0, 1));
      rail.style.opacity = p.toFixed(3);
      rail.style.transform = `translateX(${((1 - p) * 18).toFixed(1)}px)`;
      rail.style.pointerEvents = p > 0.5 ? "auto" : "none";
    };
    window.addEventListener("scroll", () => {
      if (!railTick) { railTick = true; requestAnimationFrame(updRail); }
    }, { passive: true });
    updRail();
  }

  /* ── ⑧ 章节块渐次入场（JS 加类，无 JS 不隐藏） ── */
  const blocks = $$("section.band .prose, section.band .wide");
  blocks.forEach(b => b.classList.add("rv"));
  const so = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      so.unobserve(en.target);
      en.target.classList.add("in");
    });
  }, { threshold: 0.08 });
  blocks.forEach(b => so.observe(b));
})();
