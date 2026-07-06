// ===== 視差 + 葉子滑鼠浮動 =====
(function parallax() {
  const hero = document.getElementById("hero");
  const layers = Array.from(document.querySelectorAll("[data-depth]"));
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 手機停用視差：避免 inline transform 蓋過手機版的置中排版
  const isMobile = window.matchMedia("(max-width: 860px)").matches;
  if (prefersReduced || isMobile) return;

  const state = layers.map((el) => ({
    el,
    depth: parseFloat(el.getAttribute("data-depth")) || 0.3,
    base: el.getAttribute("data-base") || "",   // 保留 CSS 既有的置中 transform
    cx: 0, cy: 0,
  }));

  let mouseX = 0, mouseY = 0;

  if (!prefersReduced) {
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      mouseX = (e.clientX - r.left) / r.width - 0.5;   // -0.5 ~ 0.5
      mouseY = (e.clientY - r.top) / r.height - 0.5;
    });
    hero.addEventListener("mouseleave", () => { mouseX = 0; mouseY = 0; });
  }

  let scrollY = 0;
  window.addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });

  function tick() {
    state.forEach((s) => {
      // depth 越大 → 對滑鼠越靈敏（葉子在前，背景在後）
      const mx = -mouseX * 34 * s.depth;
      const my = -mouseY * 30 * s.depth;
      const sy = -scrollY * s.depth * 0.15;

      // 平滑跟隨
      s.cx += (mx - s.cx) * 0.08;
      s.cy += (my + sy - s.cy) * 0.08;

      s.el.style.transform =
        `${s.base} translate3d(${s.cx.toFixed(2)}px, ${s.cy.toFixed(2)}px, 0)`;
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// ===== 客製化飲品：按鈕切換 → 換圖 + 上色 + 更新摘要 =====
(function customizeDrink() {
  const section = document.getElementById("customize");
  if (!section) return;

  const cup = document.getElementById("cz-cup");
  const summary = document.getElementById("cz-summary");

  const state = { base: "milkgreen", topping: "pearl", ice: "normal" };

  const NAMES = {
    zh: {
      milkgreen: "奶綠", milktea: "奶茶", blacktea: "紅茶",
      pearl: "Q彈珍珠", grass: "仙草凍",
      normal: "正常冰", less: "少冰", light: "微冰",
    },
    en: {
      milkgreen: "Milk Green Tea", milktea: "Milk Tea", blacktea: "Black Tea",
      pearl: "Tapioca Pearls", grass: "Grass Jelly",
      normal: "Regular Ice", less: "Less Ice", light: "Light Ice",
    },
  };
  const NAME = () => NAMES[window.__lang === "en" ? "en" : "zh"];

  // 每個「基底-配料」組合對應一張去背真照片
  const IMAGES = {
    "milkgreen-pearl": "assets/milk-green-tea-boba.png",
    "milkgreen-grass": "assets/milk-green-tea-jelly.png",
    "milktea-pearl":   "assets/milk-tea-boba.png",
    "milktea-grass":   "assets/milk-tea-jelly.png",
    "blacktea-pearl":  "assets/black-tea-boba.png",
    "blacktea-grass":  "assets/black-tea-jelly.png",
  };

  let swapToken = 0;
  function render() {
    const n = NAME();
    summary.textContent = `${n[state.base]} · ${n[state.topping]} · ${n[state.ice]}`;

    const src = IMAGES[`${state.base}-${state.topping}`];
    if (cup.getAttribute("src").endsWith(src)) return;

    const my = ++swapToken;
    // 離場：縮小淡出
    cup.classList.remove("is-in");
    cup.classList.add("is-out");

    // 淡出後換圖 → 彈跳進場
    setTimeout(() => {
      if (my !== swapToken) return;         // 被更新的點擊取代就放棄
      cup.onload = () => {
        if (my !== swapToken) return;
        cup.classList.remove("is-out", "is-in");
        void cup.offsetWidth;               // 觸發 reflow，重啟動畫
        cup.classList.add("is-in");
      };
      cup.src = src;
    }, 150);
  }

  section.querySelectorAll(".cz-btns").forEach((group) => {
    const key = group.getAttribute("data-group") === "base" ? "base"
      : group.getAttribute("data-group");
    group.addEventListener("click", (e) => {
      const btn = e.target.closest(".cz-btn");
      if (!btn) return;
      group.querySelectorAll(".cz-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      state[group.getAttribute("data-group")] = btn.getAttribute("data-value");
      render();
    });
  });

  // 語言切換時，重繪摘要文字
  document.addEventListener("langchange", render);
})();

// ===== 中 / 英 語言切換 =====
(function i18n() {
  const I18N = {
    eb:    { zh: '清新茶香 <em>×</em> 濃郁奶香', en: 'FRESH TEA AROMA <em>×</em> RICH CREAMY MILK' },
    title: { zh: '<span class="tz-line">極致</span><span class="tz-line">奶綠</span>',
             en: '<span class="tz-line">Ultimate</span><span class="tz-line">Milk</span><span class="tz-line">Green Tea</span>' },
    titleScript: { zh: 'Milk Green<br>Tea', en: 'Silky Smooth<br>Milk Green Tea' },
    sub:   { zh: '茶香清新・奶香濃郁・口感滑順', en: 'Refreshing tea notes, rich milky flavour, and a silky-smooth finish' },
    cta:   { zh: '立即品嚐 →', en: 'Order Now →' },
    bTop:  { zh: '每日現泡', en: 'FRESHLY BREWED DAILY' },
    bBot:  { zh: '安心好茶', en: 'QUALITY YOU CAN TRUST' },
    tagSm: { zh: '一口，讓你愛上', en: "One sip, and you'll" },
    tagLg: { zh: '這個味道！', en: 'fall in love' },
    f1:  { zh: '嚴選茶葉', en: 'Selected Tea Leaves' },
    f2:  { zh: '香醇鮮奶', en: 'Premium Fresh Milk' },
    f3:  { zh: 'Q彈珍珠', en: 'Chewy Pearls' },
    f4:  { zh: '完美比例', en: 'Perfect Balance' },
    f1d: { zh: '茶香清新自然', en: 'Naturally fresh aroma' },
    f2d: { zh: '濃郁順滑口感', en: 'Rich and creamy texture' },
    f3d: { zh: '每日現煮製作', en: 'Cooked fresh every day' },
    f4d: { zh: '茶奶黃金比例', en: 'Golden ratio of tea and milk' },
    sEb:    { zh: '— 職人製茶 · 誠意滿分 —', en: '— CRAFTED WITH CARE —' },
    sTitle: { zh: '每一杯，都是對品質的堅持', en: 'Every cup, a commitment to quality' },
    sLead:  { zh: '從一片茶葉到一杯手搖，我們只用最實在的用料，日日新鮮、真材實料，喝得到的安心。',
              en: 'From a single tea leaf to a finished cup, we use only the most honest ingredients — fresh every day, real and wholesome, peace of mind you can taste.' },
    s1h: { zh: '高山茶園直送', en: 'Straight from Highland Tea Gardens' },
    s1p: { zh: '精選南投海拔 800m 高山茶菁，日光萎凋、手工烘焙，茶香清新回甘不苦澀。',
           en: 'Hand-picked high-mountain leaves from Nantou at 800m, sun-withered and hand-roasted for a clean, mellow finish.' },
    s2h: { zh: '當日契作鮮乳', en: 'Same-Day Contract-Farm Milk' },
    s2p: { zh: '在地契作牧場當日直送生乳，乳香濃醇滑順，與茶香完美交融不甜膩。',
           en: 'Fresh milk delivered the same day from local partner farms — rich, smooth and never cloying.' },
    s3h: { zh: '每日新鮮現煮', en: 'Freshly Cooked Every Day' },
    s3p: { zh: '珍珠、仙草每日職人現做現煮，Q彈軟糯只賣當天，賣完為止絕不隔夜。',
           en: 'Pearls and grass jelly cooked fresh by hand each morning — chewy, tender, and only ever sold on the day.' },
    czTitle:   { zh: '客製你的專屬飲品', en: 'Customise Your Own Drink' },
    czSub:     { zh: '選基底 · 加配料 · 調冰量，一杯剛剛好', en: 'Pick a base · add a topping · choose your ice — made just right' },
    czBase:    { zh: '基底', en: 'Base' },
    czTopping: { zh: '配料', en: 'Topping' },
    czIce:     { zh: '冰量', en: 'Ice' },
    bMilkgreen:{ zh: '奶綠', en: 'Milk Green Tea' },
    bMilktea:  { zh: '奶茶', en: 'Milk Tea' },
    bBlacktea: { zh: '紅茶', en: 'Black Tea' },
    tPearl:    { zh: 'Q彈珍珠', en: 'Tapioca Pearls' },
    tGrass:    { zh: '仙草凍', en: 'Grass Jelly' },
    iNormal:   { zh: '正常冰', en: 'Regular Ice' },
    iLess:     { zh: '少冰', en: 'Less Ice' },
    iLight:    { zh: '微冰', en: 'Light Ice' },
    czResult:  { zh: '你的組合', en: 'Your combo' },
    czCta:     { zh: '加入購物車 →', en: 'Add to Cart →' },
  };

  const toggle = document.getElementById("langToggle");

  function setLang(lang) {
    window.__lang = lang;
    document.documentElement.lang = lang === "en" ? "en" : "zh-Hant";

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const t = I18N[el.getAttribute("data-i18n")];
      if (t && t[lang] != null) el.innerHTML = t[lang];
    });

    if (toggle) toggle.classList.toggle("is-en", lang === "en");
    try { localStorage.setItem("mgt-lang", lang); } catch (e) {}
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      setLang(window.__lang === "en" ? "zh" : "en");
    });
  }

  // 初始語言：讀取上次選擇（預設中文）
  let saved = "zh";
  try { saved = localStorage.getItem("mgt-lang") || "zh"; } catch (e) {}
  if (saved === "en") setLang("en");
  else window.__lang = "zh";
})();
