// 主编排：引文块渲染 / 封面 chips / 关键数字 count-up / 阅读进度 / 章节渐次入场
(() => {
  if (!window.RPT) return;

  // ── 引文块：原文 + 中文译 + 语境/为何重要/出处 ──
  const QUOTES = {
    wei: {
      quote: "“…severely supply-constrained.”",
      zh: "「（先进封装）严重供不应求——已经成为限制客户成长的瓶颈。」",
      who: "魏哲家（C.C. Wei） · TSMC 法说会",
      when: "2026-07-16",
      ctx: "TSMC 2026Q2 法说会。同场宣布 2026 capex 上调至 $60-64B，并称 2029-2030 前需求持续强劲。",
      why: "供给刚性的最高级别官方确认——「severely supply-constrained」出自守门人自己，不是卖方。这是 §6 闸门排序与 §2 利润池守在上游的物理基础。",
      src: "公司披露（TSMC 2026-07-16 法说会）",
    },
    nadella: {
      quote: "“…warm shells sitting around that I can't plug into power.”",
      zh: "「……一堆『暖壳』——建好通电的数据中心建筑——却插不进电。」",
      who: "Satya Nadella · BG2 podcast",
      when: "2025-11",
      ctx: "BG2 播客对谈，谈 AI 基础设施的真实瓶颈：不是芯片堆不出来，而是电力与机房交付跟不上。",
      why: "第一人称的约束证词：短缺正在从硅片前移到电网与「有电可插的壳体」。这是 §3 供给端只合成 2.85x、以及 §6 把电力交付列为第三级闸门的直接证据。",
      src: "公司披露（BG2 podcast，2025-11）",
    },
  };
  document.querySelectorAll(".quote-card").forEach(el => {
    const q = QUOTES[el.dataset.quote];
    if (!q) return;
    el.innerHTML =
      `<p class="q-text">${q.quote}</p>` +
      `<p class="q-zh">${q.zh}</p>` +
      `<p class="q-who">— <b>${q.who}</b>，${q.when}</p>` +
      `<div class="q-why"><p class="q-wline"><span class="q-lab">语境</span>${q.ctx}</p>` +
      `<p class="q-wline"><span class="q-lab why">为何重要</span>${q.why}</p>` +
      `<p class="q-wline"><span class="q-lab">出处</span>${q.src}</p></div>`;
  });

  // ── 封面章节 chips ──
  document.querySelectorAll(".chip[data-goto]").forEach(c => {
    c.onclick = () => document.querySelector(c.dataset.goto)?.scrollIntoView({ behavior: "smooth" });
  });

  // ── 关键数字带 count-up（终值全部取自 RPT）──
  const KB = {
    share: { parse: () => 71.3, fmt: v => v.toFixed(1) + "%" },
    gap: { parse: () => RPT.gap.cases.find(c => c.name === "base").ratio12m, fmt: v => v.toFixed(2) },
    ds: { parse: () => 3.94, fmt: v => v.toFixed(2) + 'x<span class="u"> vs </span>2.85x' },
    rev: { parse: () => 326, fmt: v => "$" + Math.round(v) + "B" },
  };
  const band = document.getElementById("key-band");
  if (band) {
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      band.querySelectorAll("[data-kb]").forEach((el, i) => {
        const k = KB[el.dataset.kb];
        if (!k) return;
        const target = k.parse();
        setTimeout(() => U.countUp(el, { dur: 1200, fmt: t => k.fmt(target * t) }), i * 140);
      });
    }, { threshold: 0.4 });
    io.observe(band);
  }

  // ── 顶部阅读进度条 ──
  const prog = document.createElement("div");
  prog.id = "read-progress";
  document.body.appendChild(prog);
  let tick = false;
  const upd = () => {
    tick = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = (max > 0 ? Math.min(100, window.scrollY / max * 100) : 0) + "%";
  };
  window.addEventListener("scroll", () => {
    if (!tick) { tick = true; requestAnimationFrame(upd); }
  }, { passive: true });
  upd();

  // ── 章节渐次入场（prose 块级淡入）──
  const secs = [...document.querySelectorAll("section.band .prose, section.band .wide")];
  secs.forEach(s => { s.style.opacity = 0; s.style.transform = "translateY(14px)";
    s.style.transition = "opacity .6s ease, transform .6s cubic-bezier(.2,.8,.3,1)"; });
  const so = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      so.unobserve(en.target);
      en.target.style.opacity = 1;
      en.target.style.transform = "none";
    });
  }, { threshold: 0.08 });
  secs.forEach(s => so.observe(s));

  // ── 点击空白任意处（非热区）关闭下钻卡：由 dc-back 承担，此处兜底 ──
  document.addEventListener("click", e => {
    const dc = document.getElementById("drill-card");
    if (!dc || dc.hidden) return;
    if (e.target.closest("[data-drill-keep]")) return;
    if (e.target === dc || e.target.classList.contains("dc-back")) U.closeDrill();
  });
})();
