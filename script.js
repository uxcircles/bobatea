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

  const NAME = {
    milkgreen: "奶綠", milktea: "奶茶", blacktea: "紅茶",
    pearl: "Q彈珍珠", grass: "仙草凍",
    normal: "正常冰", less: "少冰", light: "微冰",
  };

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
    summary.textContent = `${NAME[state.base]} · ${NAME[state.topping]} · ${NAME[state.ice]}`;

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
})();
