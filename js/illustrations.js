// §4.5 插画系统：11 幅发丝线矢量简笔画（内联 SVG，IIFE，零依赖注入）
// 风格铁律：1.5px 发丝线 / 主墨 #0a1f33 单描边 / 每幅至多一处电蓝 #2251ff 点缀 /
// 无填充色块、无渐变、无阴影、无圆角卡片、无 emoji；数字一律等宽字体。
// 移动端纪律：I1–I5、I8–I11 为装饰性插画，≤760px 整体隐藏（host 加 .illus-deco，
// style.css 暂无该规则，故在本文件顶部注入）；I6 机柜爆炸图 / I7 电力交付链为论证级
// 插画，移动端保留并加横滚容器（.illus-scroll）。
// 交互：I6 逐层 / I7 逐点可点击，统一 U.showDrill 下钻；数字防御性读取
// window.RPT.relay / RPT.powerMap / RPT.powerHard，缺失时回退常量、静默降级。
// draw-in：U.play 逐笔描边入场；prefers-reduced-motion 由 U.play 自动落静态终帧。
(() => {
  "use strict";

  /* ── 样式注入（仅当 style.css 尚未提供 .illus-deco 规则时；幂等）── */
  if (!document.getElementById("illus-css")) {
    const st = document.createElement("style");
    st.id = "illus-css";
    st.textContent = [
      ".illus-frame{margin:20px 0 12px}",
      ".illus-frame svg.illus{display:block;width:100%;max-width:300px;height:auto;margin:0 auto}",
      ".illus-frame .illus-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px}",
      ".illus-frame .illus-scroll svg.illus{max-width:560px;min-width:440px}",
      "svg.illus text{font-family:var(--mono);fill:var(--ink);stroke:none;user-select:none}",
      ".illus-cap{font-family:var(--mono);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;",
      "  color:var(--ink-lo);margin-top:6px;text-align:center}",
      "svg.illus .illu-hit{cursor:pointer}",
      "svg.illus .illu-hit:hover{opacity:.66}",
      "@media (max-width:760px){.illus-deco{display:none}}",
    ].join("\n");
    document.head.appendChild(st);
  }

  const INK = "#0a1f33", BLUE = "#2251ff";
  const CN = ["一", "二", "三", "四"];

  /* ── 防御性数据读取 ── */
  const R = window.RPT || {};
  const relay = Array.isArray(R.relay) ? R.relay : [];
  const powerHard = Array.isArray(R.powerHard) ? R.powerHard : [];
  const powerMap = R.powerMap || {};
  const grab = (s, re, fb) => {
    const m = String(s == null ? "" : s).match(re);
    return m ? m[1] : fb;
  };

  // I6 侧注数字（从 RPT.relay 提取，回退常量）
  const baton = i => (relay[i] && relay[i].rank ? `第${CN[relay[i].rank - 1] || relay[i].rank}棒` : `第${CN[i]}棒`);
  const gpuNum = "加价 " + grab(relay[0] && relay[0].trigger, /加价约\s*([\d.]+–[\d.]+)\s*倍/, "7.5–9") + " 倍";
  const hbmNum = "利润率 " + grab(relay[1] && relay[1].profitPeak, /利润率\s*(\d+)%/, "49") + "%";
  const cowosNum = grab(relay[2] && relay[2].trigger, /(12–13\s*万片\/月)/, "12–13 万片/月");
  const pwrNum = "燃机订单 " + grab(relay[3] && relay[3].profitPeak, /(100GW)/, "100GW");
  const rackDrill = i =>
    (relay[i] && relay[i].drill) ||
    [{ title: "第一棒 · GPU", value: "加价约 7.5–9 倍" },
     { title: "第二棒 · 高带宽内存", value: "利润率 49%" },
     { title: "第三棒 · 先进封装", value: "产能向 12–13 万片/月爬坡" },
     { title: "第四棒 · 电力", value: "唯一资本无法速成的约束" }][i];

  // I7 交期数字（从 RPT.powerHard / RPT.powerMap 提取，回退常量）
  const ph = i => powerHard[i] || null;
  const dcNode = (Array.isArray(powerMap.nodes) ? powerMap.nodes : [])[0] || null;
  const dGas = ph(2) ? { title: ph(2).label, value: ph(2).value, sub: ph(2).note, source: ph(2).source }
                     : { title: "大型燃机交付", value: "2028 年" };
  const dTra = ph(1) ? { title: ph(1).label, value: ph(1).value, sub: ph(1).note, source: ph(1).source }
                     : { title: "大型变压器交期", value: "36–48 个月" };
  const dQue = ph(0) ? { title: ph(0).label, value: ph(0).value, sub: ph(0).note, source: ph(0).source }
                     : { title: "并网排队（建成项目中位）", value: "5 年" };
  const dDc = dcNode && dcNode.drill ? dcNode.drill
                                     : { title: "负荷侧接网", value: "热点枢纽 4–7 年" };
  const nGas = grab(dGas.value, /(\d{4})/, "2028") + " 交付";
  const nTra = grab(dTra.value, /(\d+–\d+)\s*个?月/, "36–48") + " 月";
  const nQue = grab(dQue.value, /(\d+)\s*年/, "5") + " 年";
  const nDc = "接网 " + grab(dcNode && dcNode.value, /(4–7)\s*年/, "4–7") + " 年";

  /* ── SVG 组装工具 ── */
  // 文本（等宽；blue=true 时为该幅唯一电蓝点缀）
  const T = (x, y, s, o) => {
    o = o || {};
    return `<text x="${x}" y="${y}" font-size="${o.fs || 8}" text-anchor="${o.a || "middle"}"` +
      (o.blue ? ` style="fill:${BLUE}"` : "") + `>${s}</text>`;
  };
  // 通用挂载：host（已是 .illus-frame）→ svg(+横滚) + 图题；bind 挂交互；drawIn 入场
  const svgOpen = `<svg class="illus" viewBox="0 0 240 160" role="img" aria-label="章节插画">` +
    `<g fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">`;
  function mount(id, cfg) {
    const host = document.getElementById(id);
    if (!host) return;
    try {
      if (cfg.deco) host.classList.add("illus-deco");
      const svgHtml = svgOpen + cfg.body + "</g></svg>";
      host.innerHTML =
        (cfg.scroll ? `<div class="illus-scroll">${svgHtml}</div>` : svgHtml) +
        `<p class="illus-cap">${cfg.cap}</p>`;
      const svg = host.querySelector("svg.illus");
      if (cfg.bind && svg) cfg.bind(svg);
      if (svg) drawIn(host);
    } catch (e) { /* 单幅失败静默，不影响其余插画与全站 */ }
  }

  /* ── draw-in：逐笔描边 + 文字淡入；U.play 滚动触发一次，reduced-motion 落终帧 ── */
  function drawIn(host) {
    if (!window.U || typeof U.play !== "function") return;
    const geos = [...host.querySelectorAll("path,line,circle,rect,polyline,polygon")];
    const texts = [...host.querySelectorAll("text")];
    const anims = [];
    geos.forEach((el, i) => {
      let len = 0;
      try { len = el.getTotalLength(); } catch (e) { len = 0; }
      if (!len || !isFinite(len)) return;
      el.style.strokeDasharray = String(len);
      anims.push({ start: i * 0.045, dur: 0.62, set: p => { el.style.strokeDashoffset = String(len * (1 - p)); } });
    });
    texts.forEach((el, i) => {
      anims.push({ start: 0.45 + i * 0.05, dur: 0.4, set: p => { el.style.opacity = String(p); } });
    });
    if (anims.length) U.play(anims, host, { threshold: 0.25 });
  }

  /* ── 下钻绑定（I6 / I7 共用）── */
  function bindHits(svg, drills) {
    if (!window.U || typeof U.showDrill !== "function") return;
    svg.querySelectorAll(".illu-hit").forEach(g => {
      g.setAttribute("data-drill-keep", "1");
      g.addEventListener("click", e => {
        const d = drills[+g.getAttribute("data-k")];
        if (!d) return;
        U.showDrill({ title: d.title, value: d.value, sub: d.sub, source: d.source, x: e.clientX, y: e.clientY });
      });
    });
  }

  /* ═══════════ I1 · §1 #illu-task：对话气泡→文档→机器人手臂 三级阶梯 ═══════════ */
  mount("illu-task", {
    deco: true,
    cap: "任务阶梯 · 对话 → 文档 → 执行",
    body:
      // 阶梯（略带手绘抖动）
      `<path d="M22,136 L86,136.5 L86,112 L148,111.5 L148,86 L212,86"/>` +
      // 对话气泡（平台一）
      `<path d="M40,82 L70,82 L70,102 L56,102 L50,110 L48.5,102 L40,102 Z"/>` +
      `<path d="M46,89 L64,89 M46,95 L60,95.5"/>` +
      // 文档（平台二）
      `<path d="M105,80 L123,80 L129,86 L129,112 L105,112 Z"/>` +
      `<path d="M123,80 L123,86 L129,86"/>` +
      `<path d="M110,92 L124,92 M110,99 L124,99 M110,106 L120,106.5"/>` +
      // 机器人手臂（平台三）
      `<path d="M166,86 L194,86 L194,77 L166,77 Z"/>` +
      `<circle cx="180" cy="73" r="3"/>` +
      `<path d="M180,73 L172,54"/><circle cx="172" cy="54" r="2.5"/>` +
      `<path d="M172,54 L192,44"/><path d="M192,44 L201,39 M192,44 L202,47"/>` +
      // 上行箭头（本幅唯一电蓝点缀）
      `<path d="M212,82 L212,62 M212,62 L207.5,69 M212,62 L216.5,69" stroke="${BLUE}"/>` +
      T(54, 150, "对话", { fs: 8.5 }) + T(117, 150, "文档", { fs: 8.5 }) + T(180, 150, "执行", { fs: 8.5 }),
  });

  /* ═══════════ I2 · §2 #illu-meter：老式电表（呼应 1897 两部制电价） ═══════════ */
  mount("illu-meter", {
    deco: true,
    cap: "计量即定价权 · 1897",
    body:
      `<path d="M88,26 L152,26 L152,140 L88,140 L88,26"/>` +           // 表壳
      `<path d="M88,118 L152,118"/>` +                                 // 端子区分隔
      `<path d="M120,26 L120,14"/><circle cx="120" cy="12" r="1.5"/>` + // 顶部进线
      `<circle cx="120" cy="62" r="19"/>` +                            // 表盘
      // 表盘刻度（上半周五档）
      `<path d="M105.9,56.9 L102.1,55.5 M110.4,50.5 L107.8,47.4 M120,47 L120,43 ` +
      `M129.6,50.5 L132.2,47.4 M134.1,56.9 L137.9,55.5"/>` +
      // 指针（本幅唯一电蓝点缀）
      `<path d="M120,62 L128.4,52" stroke="${BLUE}"/><circle cx="120" cy="62" r="1.6" stroke="${BLUE}"/>` +
      `<path d="M100,92 L140,92 L140,108 L100,108 Z"/>` +              // 计数窗
      T(120, 103.5, "1897", { fs: 11 }) +
      T(120, 115, "KWH", { fs: 6 }) +
      `<circle cx="104" cy="129" r="3"/><circle cx="136" cy="129" r="3"/>` + // 接线端子
      `<path d="M104,132 L104,138 M136,132 L136,138"/>`,
  });

  /* ═══════════ I3 · §3 #illu-pricetag：价格标签 V 形排列 ═══════════ */
  (() => {
    const cx = [40, 80, 120, 160, 200], top = [44, 62, 80, 62, 44];
    const price = ["$5", "$2.5", "$1.25", "$5", "$30"];
    let body = `<path d="M20,28 Q120,34.5 220,28"/>`; // 挂绳（微垂）
    cx.forEach((x, i) => {
      const t = top[i], blue = i === 2; // 谷底标签 = 本幅唯一电蓝点缀
      body +=
        `<path d="M${x},29 L${x},${t + 2}"/>` +
        `<g${blue ? ` stroke="${BLUE}"` : ""}>` +
        `<path d="M${x - 12},${t + 9} L${x},${t + 1} L${x + 12},${t + 9} L${x + 12},${t + 36} L${x - 12},${t + 36} Z"/>` +
        `<circle cx="${x}" cy="${t + 9}" r="2"/></g>` +
        T(x, t + 25, price[i], { fs: 7, blue: blue });
    });
    mount("illu-pricetag", { deco: true, cap: "价格 · V 形反转", body });
  })();

  /* ═══════════ I4 · §4 #illu-bill：收银机 + “一个任务”账单 ═══════════ */
  (() => {
    let keys = "";
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++)
        keys += `<path d="M${120 + c * 9},${106 + r * 8} h5 v5 h-5 Z"/>`;
    mount("illu-bill", {
      deco: true,
      cap: "账单 · 按任务收钱",
      body:
        `<path d="M64,98 L182,98 L182,142 L64,142 L64,98"/>` +            // 机身
        `<path d="M64,98 L76,86 L170,86 L182,98"/>` +                    // 顶面斜台
        `<path d="M102,92 L102,48 l4,-4 l4,4 l4,-4 l4,4 l4,-4 l4,4 l4,-4 l4,4 L134,92"/>` + // 账单纸条（锯齿撕口）
        `<path d="M108,58 L128,58 M108,66 L124,66.5 M108,86 L128,86"/>` +
        T(118, 79, "一个任务", { fs: 8, blue: true }) +                   // 账单一行（本幅唯一电蓝点缀）
        `<path d="M160,86 L160,66"/>` +                                  // 显示器立杆
        `<path d="M146,52 L176,52 L176,66 L146,66 Z"/>` +
        T(161, 62, "×1", { fs: 8 }) +
        keys +                                                           // 按键 3×3
        `<path d="M64,130 L182,130 M114,136 L132,136"/>`,                // 钱箱缝 + 拉手
    });
  })();

  /* ═══════════ I5 · §5 #illu-scale：天平（需求 vs 供给，逼近平衡） ═══════════ */
  mount("illu-scale", {
    deco: true,
    cap: "供需 · 逼近平衡",
    body:
      `<path d="M92,136 L148,136 M120,136 L120,54"/>` +                  // 底座与立柱
      `<circle cx="120" cy="52" r="2.5"/>` +                             // 支点
      `<path d="M54,60 L186,53.5"/>` +                                   // 横梁（微倾=逼近平衡）
      `<path d="M54,60 L42,90 M54,60 L66,90"/>` +                        // 左盘吊绳
      `<path d="M40,90 Q54,101 68,90"/>` +                               // 左盘
      `<path d="M186,53.5 L174,83 M186,53.5 L198,83"/>` +                // 右盘吊绳
      `<path d="M172,83 Q186,94 200,83"/>` +                             // 右盘
      T(120, 40, "0.97", { fs: 10, blue: true }) +                       // 缺口比（本幅唯一电蓝点缀）
      T(54, 114, "需求", { fs: 8.5 }) + T(186, 108, "供给", { fs: 8.5 }),
  });

  /* ═══════════ I6 · §6 #illu-rack：AI 服务器机柜爆炸图（核心插画，逐层下钻） ═══════════ */
  (() => {
    const X0 = 92, X1 = 196, H = 15, ys = [12, 38, 64, 90, 116];
    const note = (i, l1, l2) =>
      `<path d="M86,${ys[i] + 7.5} L${X0},${ys[i] + 7.5}"/>` +
      T(84, ys[i] + 6, l1, { fs: 7.5, a: "end" }) + T(84, ys[i] + 13.5, l2, { fs: 7, a: "end" });
    const slab = (i, inner, blue) =>
      `<g class="illu-hit" data-k="${i}"${blue ? ` stroke="${BLUE}"` : ""}>` +
      `<path d="M${X0},${ys[i]} L${X1},${ys[i]} L${X1},${ys[i] + H} L${X0},${ys[i] + H} Z"/>${inner}</g>`;
    // 各层内部结构（纯发丝线）
    const gpu = [0, 1, 2, 3].map(c => `<path d="M${100 + c * 12},${ys[0] + 4} h7 v7 h-7 Z"/>`).join("") +
      `<path d="M100,${ys[0] + 13} L146,${ys[0] + 13}"/>`;
    const hbm = [0, 1, 2, 3, 4, 5].map(c => `<path d="M${100 + c * 7},${ys[1] + 3} h3 v9 h-3 Z"/>`).join("") +
      `<path d="M98,${ys[1] + 13} L144,${ys[1] + 13}"/>`;
    const cowos = `<path d="M100,${ys[2] + 10.5} L150,${ys[2] + 10.5}"/>` +
      `<path d="M118,${ys[2] + 3} h14 v7 h-14 Z"/>` +
      [104, 110, 138, 144].map(x => `<circle cx="${x}" cy="${ys[2] + 9.5}" r="0.9"/>`).join("");
    const net = [0, 1, 2, 3].map(c => `<path d="M${100 + c * 10},${ys[3] + 4} h6 v5 h-6 Z"/>`).join("") +
      `<path d="M100,${ys[3] + 12.5} L140,${ys[3] + 2.5} M100,${ys[3] + 2.5} L140,${ys[3] + 12.5}"/>`;
    const pwr = [0, 1, 2].map(c => `<path d="M${100 + c * 7},${ys[4] + 3} h4 v9 h-4 Z"/>`).join("") +
      `<path d="M126,${ys[4] + 7.5} q4,-4.5 8,0 q4,4.5 8,0 q4,-4.5 8,0 q4,4.5 8,0"/>`;
    mount("illu-rack", {
      scroll: true, // 论证级插画：移动端保留 + 横滚
      cap: "机柜解剖 · 四棒的位置",
      body:
        `<path d="M144,6 L144,150" stroke-dasharray="2 4"/>` +           // 爆炸轴
        `<path d="M140,10 L144,6 L148,10 M140,146 L144,150 L148,146"/>` + // 轴向箭头
        slab(0, gpu) + slab(1, hbm) + slab(2, cowos) + slab(3, net) + slab(4, pwr, true) + // 第四棒=当前棒，电蓝点缀
        // 侧注（第几棒 + 关键数字，数字从 RPT.relay 读取）
        note(0, baton(0) + " · GPU", gpuNum) +
        note(1, baton(1) + " · HBM", hbmNum) +
        note(2, baton(2) + " · 封装", cowosNum) +
        note(3, "网络交换", "未接棒") +
        note(4, baton(3) + " · 电力", pwrNum),
      bind: svg => bindHits(svg, [
        rackDrill(0), rackDrill(1), rackDrill(2),
        { title: "网络交换层", value: "机柜内高速互联：GPU 计算板与网络交换的连接层",
          sub: "瓶颈接力当前不在此棒——四棒为 GPU→高带宽内存→先进封装→电力。" },
        rackDrill(3),
      ]),
    });
  })();

  /* ═══════════ I7 · §7 #illu-power：电站与电力交付链（四点一线，逐点下钻） ═══════════ */
  (() => {
    mount("illu-power", {
      scroll: true, // 论证级插画：移动端保留 + 横滚
      cap: "电力交付链 · 卡在哪",
      body:
        `<path d="M14,126 L226,125.5"/>` +                               // 地面
        // ① 燃气电站（锯齿屋顶厂房 + 烟囱 + 烟）
        `<g class="illu-hit" data-k="0">` +
        `<path d="M24,126 L24,102 L30,96 L36,102 L42,96 L48,102 L54,96 L60,102 L60,126"/>` +
        `<path d="M64,126 L64,88 L72,88 L72,126"/>` +
        `<path d="M68,84 Q64.5,80 68,76 Q71.5,72 68,68"/>` +
        `<path d="M38,126 L38,114 L46,114 L46,126"/></g>` +
        // ② 升压变压器（箱体 + 散热片 + 顶部套管）
        `<g class="illu-hit" data-k="1">` +
        `<path d="M92,100 L120,100 L120,126 L92,126 Z"/>` +
        `<path d="M97,104 L97,122 M103,104 L103,122 M109,104 L109,122 M115,104 L115,122"/>` +
        `<path d="M98,100 L98,92 M106,100 L106,90 M114,100 L114,92"/>` +
        `<circle cx="98" cy="90.5" r="1.5"/><circle cx="106" cy="88.5" r="1.5"/><circle cx="114" cy="90.5" r="1.5"/></g>` +
        // ③ 输电塔（格构塔 + 输电线弧垂）
        `<g class="illu-hit" data-k="2">` +
        `<path d="M158,60 L142,126 M158,60 L174,126"/>` +
        `<path d="M138,76 L178,76 M146,90 L170,90"/>` +
        `<path d="M152,64 L164,76 M164,64 L152,76 M150,76 L166,90 M166,76 L150,90 M148,90 L168,126 M168,90 L148,126"/>` +
        `<path d="M138,76 L138,82 M178,76 L178,82"/>` +
        `<path d="M138,78 Q126,88 114,92 M178,78 Q188,88 196,94 M170,90 Q184,100 196,100"/></g>` +
        // ④ 数据中心机房（厂房 + 机柜方阵 + 门）
        `<g class="illu-hit" data-k="3">` +
        `<path d="M192,96 L226,94.5 L226,126 L192,126 Z"/>` +
        [0, 1, 2].map(c => `<path d="M${196 + c * 6},102 h4 v4 h-4 Z M${196 + c * 6},110 h4 v4 h-4 Z"/>`).join("") +
        `<path d="M216,126 L216,114 L222,114 L222,126"/></g>` +
        // 交期标注（数字从 RPT.powerHard / RPT.powerMap 读取；“5 年”= 本幅唯一电蓝点缀）
        T(44, 137, "燃气电站", { fs: 7.5 }) + T(44, 146.5, nGas, { fs: 7 }) +
        T(106, 137, "升压变", { fs: 7.5 }) + T(106, 146.5, nTra, { fs: 7 }) +
        T(158, 137, "并网排队", { fs: 7.5 }) + T(158, 146.5, nQue, { fs: 7, blue: true }) +
        T(209, 137, "数据中心", { fs: 7.5 }) + T(209, 146.5, nDc, { fs: 7 }),
      bind: svg => bindHits(svg, [dGas, dTra, dQue, dDc]),
    });
  })();

  /* ═══════════ I8 · §8 #illu-leverage：杠杆天平（现金 vs 债） ═══════════ */
  mount("illu-leverage", {
    deco: true,
    cap: "杠杆 · 现金与债",
    body:
      `<path d="M60,132 L180,132"/>` +                                   // 地面
      `<path d="M108,132 L132,132 L120,110 Z"/>` +                       // 支点三角
      `<path d="M40,86 L200,104"/>` +                                    // 杠杆（债端下沉）
      `<path d="M112,118 Q120,114.5 128,116" stroke="${BLUE}"/>` +       // 倾角弧（本幅唯一电蓝点缀）
      // 现金端：一叠钞票
      `<path d="M44,86.5 L44,84"/>` +
      `<path d="M28,78 L56,78 L56,84 L28,84 Z M30,71 L58,71 L58,77 L30,77 Z M32,64 L60,64 L60,70 L32,70 Z"/>` +
      `<path d="M42,64 L42,70 M43,71 L43,77 M44,78 L44,84"/>` +
      T(44, 57, "现金", { fs: 8.5 }) +
      // 债端：链条吊着债券
      `<circle cx="196" cy="110" r="3.5"/><circle cx="196" cy="116.5" r="3.5"/>` +
      `<path d="M184,121 L208,121 L208,138 L184,138 Z"/>` +
      `<path d="M189,126 L203,126 M189,130 L199,130"/>` +
      T(196, 136.5, "债", { fs: 8 }),
  });

  /* ═══════════ I9 · §10 #illu-strata：地层剖面（呼应 §10 分层） ═══════════ */
  mount("illu-strata", {
    deco: true,
    cap: "利润分层 · 地层剖面",
    body:
      `<path d="M34,32 L34,132 L206,132 L206,32"/>` +                    // 剖面框（上口为地表）
      `<path d="M34,32 L206,32"/>` +
      `<path d="M44,32 L42,27 M58,32 L56.5,27 M120,32 L118.5,27 M180,32 L178,27"/>` + // 地表草线
      // 四条波状岩层界线
      `<path d="M34,54 Q70,50 104,54 Q140,58 174,54 Q196,51 206,53"/>` +
      `<path d="M34,76 Q68,72 100,76 Q136,80 170,75 Q192,72 206,74"/>` +
      `<path d="M34,98 Q70,102 104,98 Q140,94 172,99 Q192,102 206,100"/>` +
      `<path d="M34,118 Q68,115 100,118 Q138,121 170,117 Q192,115 206,116"/>` +
      // 岩屑细节
      `<circle cx="60" cy="64" r="1"/><circle cx="90" cy="108" r="1"/><circle cx="150" cy="88" r="1"/>` +
      `<path d="M70,86 l6,2 M128,124 l6,-1.5"/>` +
      // 利润层标记（本幅唯一电蓝点缀）
      `<path d="M104,72 l4,4 l-4,4 l-4,-4 Z" stroke="${BLUE}"/>` +
      T(112, 71, "利润层", { fs: 6.5, a: "start", blue: true }),
  });

  /* ═══════════ I10 · §11 #illu-gate：闸门 / 关卡 ═══════════ */
  mount("illu-gate", {
    deco: true,
    cap: "闸门 · 管制的边界",
    body:
      `<path d="M40,132 L200,132"/>` +                                   // 地面
      `<path d="M62,56 L70,56 L70,132 L62,132 Z M170,56 L178,56 L178,132 L170,132 Z"/>` + // 双门柱
      `<path d="M60,52 L74,52 M166,52 L180,52"/>` +                      // 柱帽
      `<path d="M70,60 L170,60"/>` +                                     // 顶部连梁
      // 横杆（落下状态，微斜）
      `<path d="M70,86 L170,94 L170,99 L70,91 Z"/>` +
      `<path d="M88,87.8 L88,92.8 M106,89 L106,94 M124,90.2 L124,95.2 M142,91.4 L142,96.4 M160,92.6 L160,97.6"/>` +
      `<circle cx="70" cy="88.5" r="3" stroke="${BLUE}"/>` +             // 转轴（本幅唯一电蓝点缀）
      // 悬挂告示牌
      `<path d="M116,60 L116,68 M128,60 L128,68"/>` +
      `<path d="M108,68 L136,68 L136,82 L108,82 Z"/>` +
      T(122, 77.5, "关卡", { fs: 8 }),
  });

  /* ═══════════ I11 · §13 #illu-compass：罗盘 / 方向标 ═══════════ */
  mount("illu-compass", {
    deco: true,
    cap: "方向 · 哑铃两端",
    body:
      `<circle cx="120" cy="82" r="46"/>` +                              // 外盘
      `<circle cx="120" cy="82" r="39"/>` +                              // 内圈
      // 方位刻度（四正长、四隅短）
      `<path d="M120,36 L120,43 M120,121 L120,128 M74,82 L81,82 M159,82 L166,82"/>` +
      `<path d="M152.5,49.5 L148.8,53.2 M87.5,49.5 L91.2,53.2 M152.5,114.5 L148.8,110.8 M87.5,114.5 L91.2,110.8"/>` +
      T(120, 31, "N", { fs: 7 }) +
      // 菱形指针（指向东北）
      `<path d="M147,55 L122.8,84.8 L93,109 L117.2,79.2 Z"/>` +
      `<path d="M120,82 L147,55 M147,55 L139.5,57 M147,55 L144.5,63" stroke="${BLUE}"/>` + // 北半针（本幅唯一电蓝点缀）
      `<circle cx="120" cy="82" r="2"/>`,
  });
})();
