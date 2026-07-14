const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (header) {
  const syncHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();
}

// ===== 全站導覽：依目前網址標記所在頁面的母項（暖陽黃底框）；只動 header，不碰子頁導覽 =====
(() => {
  const nav = document.querySelector(".desktop-nav");
  if (!nav) return;
  const here = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (here === "" || here === "index.html") return; // 首頁不標記任何母項
  for (const item of nav.querySelectorAll(".nav-item")) {
    const hit = [...item.querySelectorAll("a[href]")].some((a) => {
      const file = (a.getAttribute("href") || "").split("#")[0].split("/").pop().toLowerCase();
      return file && file === here;
    });
    if (hit) {
      item.classList.add("is-current");
      break; // 只標記第一個命中的母項，避免重複頁面（如 for-companies）雙重高亮
    }
  }
})();

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    mobileMenu.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      mobileMenu.classList.remove("is-open");
      document.body.classList.remove("menu-open");
    });
  });

  mobileMenu.querySelectorAll("[data-m-toggle]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const group = toggle.closest("[data-m-group]");
      if (!group) return;
      const expanded = group.classList.toggle("is-expanded");
      toggle.setAttribute("aria-expanded", String(expanded));
    });
  });
}

function activateTab(buttons, panels, key, attr) {
  buttons.forEach((button) => {
    const active = button.dataset[key] === attr;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset[`${key}Panel`] === attr);
  });
}

const actTabs = document.querySelectorAll("[data-tab]");
const actPanels = document.querySelectorAll("[data-tab-panel]");
actTabs.forEach((button) => {
  button.addEventListener("click", () => activateTab(actTabs, actPanels, "tab", button.dataset.tab));
});

const audienceTabs = document.querySelectorAll("[data-audience]");
const audiencePanels = document.querySelectorAll("[data-audience-panel]");
audienceTabs.forEach((button) => {
  button.addEventListener("click", () =>
    activateTab(audienceTabs, audiencePanels, "audience", button.dataset.audience)
  );
});

// 報名分頁（programs.html「如何報名」：常見問題 FAQ／開課學校選修／線上課程即將推出）
const applyTabs = document.querySelectorAll("[data-apply]");
const applyPanels = document.querySelectorAll("[data-apply-panel]");
applyTabs.forEach((button) => {
  button.addEventListener("click", () =>
    activateTab(applyTabs, applyPanels, "apply", button.dataset.apply)
  );
});

function scrollToHashTarget(behavior = "smooth") {
  const hash = window.location.hash;
  if (!hash || hash === "#top") return;
  const target = document.querySelector(hash);
  if (!target) return;
  let offset = 82;
  // 行動版的出口牌導覽是頂部 sticky 列，落點需再扣掉它的高度
  const subnav = document.querySelector(".exit-nav");
  if (subnav && window.matchMedia("(max-width: 960px)").matches) {
    offset += subnav.offsetHeight;
  }
  const top = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? "auto" : behavior });
}

window.addEventListener("hashchange", () => scrollToHashTarget());
window.addEventListener("load", () => {
  window.setTimeout(() => scrollToHashTarget("auto"), 80);
});

// ===== 出口牌章節導覽 scroll-spy（story.html）：捲到哪一章節，左側對應出口牌高亮 =====
const exitSigns = document.querySelectorAll(".exit-sign[data-exit-target]");
if (exitSigns.length) {
  const isCompact = () => window.matchMedia("(max-width: 960px)").matches;
  const signTargets = [...exitSigns]
    .map((sign) => document.getElementById(sign.dataset.exitTarget))
    .filter(Boolean);
  // 無對應出口牌的收尾區段（如 CTA）：捲進去時清空高亮，避免謊報位置
  const clearZones = [...document.querySelectorAll("[data-exit-clear]")];

  const setActive = (id) => {
    exitSigns.forEach((sign) => {
      const on = sign.dataset.exitTarget === id;
      sign.classList.toggle("is-active", on);
      if (on) sign.setAttribute("aria-current", "location");
      else sign.removeAttribute("aria-current");
      // 手機橫向列：把高亮的牌捲進視線
      if (on && isCompact() && typeof sign.scrollIntoView === "function") {
        sign.scrollIntoView({ inline: "center", block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
      }
    });
  };

  let activeId = signTargets[0] ? signTargets[0].id : null;
  if (activeId) setActive(activeId);

  // 點擊出口牌：立即高亮並同步 activeId（避免平滑捲動途中閃爍）
  exitSigns.forEach((sign) => {
    sign.addEventListener("click", () => {
      activeId = sign.dataset.exitTarget;
      setActive(activeId);
    });
  });

  if (signTargets.length && "IntersectionObserver" in window) {
    const visible = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        });
        // 帶內若有出口牌章節 → 高亮它；否則若已進入收尾區段 → 清空
        const current = signTargets.find((t) => visible.has(t));
        if (current) {
          if (current.id !== activeId) {
            activeId = current.id;
            setActive(current.id);
          }
        } else if (clearZones.some((z) => visible.has(z)) && activeId !== null) {
          activeId = null;
          setActive(null);
        }
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 }
    );
    [...signTargets, ...clearZones].forEach((t) => observer.observe(t));
  }
}

// ===== 旅程時間軸：橘色圓點隨捲動移動到目前節點（與 about「認識鄉育」一致）=====
// 套用到全站每一條 .journey-line。所有時間軸都隨捲動動態點亮目前節點（並隨滑鼠 hover 變色，
// 見 styles.css）：
//   直式（about 里程碑、story 的 .is-vertical、窄螢幕單欄）＝節點由上到下，取最後一個頂端越過
//     視窗 45% 判定線的節點。
//   橫式（桌機 programs／for-*／合作頁的三欄水平線）＝節點同在一條水平線、無法逐點越線，改用整條
//     時間軸通過視窗的捲動進度，由左到右依序點亮（捲到區段上緣＝第一點、下緣＝最後一點）。
// 方向用實際幾何判斷（isStacked），resize 自動切換。
const journeyLines = [...document.querySelectorAll(".journey-line")]
  .map((line) => ({ line, nodes: [...line.querySelectorAll(".journey-node")] }))
  .filter((entry) => entry.nodes.length > 1);
if (journeyLines.length) {
  // 直式＝每個節點都明顯低於前一個（自成一列）。這樣才能排除桌機的橫向三欄，
  // 也能排除「四欄時間軸折成兩列」這種仍非單欄直列的情況（同列節點 top 幾乎相等）。
  const isStacked = (nodes) =>
    nodes.every(
      (node, i) =>
        i === 0 ||
        node.getBoundingClientRect().top - nodes[i - 1].getBoundingClientRect().top > 24
    );
  let journeyTicking = false;
  const updateJourneyDots = () => {
    journeyTicking = false;
    const vh = window.innerHeight;
    const markLine = vh * 0.45; // 直式：視窗 45% 高度為判定線
    journeyLines.forEach(({ line, nodes }) => {
      line.classList.add("is-spy");
      let current;
      if (isStacked(nodes)) {
        // 直式：取最後一個頂端已越過判定線的節點
        current = nodes[0];
        nodes.forEach((node) => {
          if (node.getBoundingClientRect().top <= markLine) current = node;
        });
      } else {
        // 橫式：整條時間軸通過視窗的捲動進度 → 由左到右依序點亮
        const r = line.getBoundingClientRect();
        const span = vh * 0.6 || 1;
        const prog = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / span));
        current = nodes[Math.min(nodes.length - 1, Math.floor(prog * nodes.length))];
      }
      nodes.forEach((node) => node.classList.toggle("is-active", node === current));
    });
  };
  const onJourneyScroll = () => {
    if (journeyTicking) return;
    journeyTicking = true;
    window.requestAnimationFrame(updateJourneyDots);
  };
  window.addEventListener("scroll", onJourneyScroll, { passive: true });
  window.addEventListener("resize", onJourneyScroll, { passive: true });
  updateJourneyDots();
}


// ===== 首頁 四階段圓盤：滑鼠移入／鍵盤聚焦／點擊扇形 → 顯示該階段賦能重點（index.html #method）=====
const mcWedges = document.querySelectorAll(".mc-wedge[data-stage]");
const mcDetails = document.querySelectorAll(".mc-detail-item[data-stage]");
if (mcWedges.length && mcDetails.length) {
  const showStage = (stage) => {
    mcWedges.forEach((w) => w.classList.toggle("is-active", w.dataset.stage === stage));
    mcDetails.forEach((d) => d.classList.toggle("is-active", d.dataset.stage === stage));
  };
  mcWedges.forEach((wedge) => {
    const stage = wedge.dataset.stage;
    wedge.addEventListener("mouseenter", () => showStage(stage));
    wedge.addEventListener("focus", () => showStage(stage));
    wedge.addEventListener("click", () => showStage(stage));
    wedge.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showStage(stage);
      }
    });
  });
}


// ===== 首頁 四階段三層圖：上層能力／下層成果＝獨立手風琴折疊（方向 A，index.html #method）=====
const mcCycle = document.querySelector(".method-cycle");
const mcFoldBars = document.querySelectorAll(".mc-fold-bar[aria-controls]");
if (mcCycle && mcFoldBars.length) {
  // 啟用折疊（無 JS 時 .mc-fold-bar 隱藏、兩層維持全展）；fold-init 抑制首載瞬間的收合動畫
  mcCycle.classList.add("is-enhanced", "fold-init");
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => mcCycle.classList.remove("fold-init"));
  });
  mcFoldBars.forEach((bar) => {
    bar.addEventListener("click", () => {
      const body = document.getElementById(bar.getAttribute("aria-controls"));
      if (!body) return;
      const open = bar.getAttribute("aria-expanded") === "true";
      bar.setAttribute("aria-expanded", String(!open));
      body.classList.toggle("open", !open);
    });
  });
}

// ===== 首頁 合作夥伴牆＋初衷痛點卡：捲入時依序淡入（index.html #partners／.initiative-cards）=====
document.querySelectorAll(".partner-logos:not(.partner-marquee), .home .problem-section .initiative-cards").forEach((wall) => {
  const items = wall.querySelectorAll("li");
  if (!items.length) return;
  items.forEach((li, i) => li.style.setProperty("--i", i));
  wall.classList.add("reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    wall.classList.add("in");
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          wall.classList.add("in");
          io.disconnect();
        }
      });
    },
    { threshold: 0.18 }
  );
  io.observe(wall);
});

// ===== 媒體報導頁「精選頭條牆」：分類 chip 篩選（press.html）=====
const pressFilters = document.querySelectorAll("[data-press-filter]");
if (pressFilters.length) {
  const pressCards = document.querySelectorAll("[data-press-cat]");
  const applyPressFilter = (cat) => {
    pressFilters.forEach((button) => {
      const on = button.dataset.pressFilter === cat;
      button.classList.toggle("is-active", on);
      button.setAttribute("aria-pressed", String(on));
    });
    pressCards.forEach((card) => {
      const cats = (card.dataset.pressCat || "").split(" ");
      card.hidden = cat !== "all" && !cats.includes(cat);
    });
  };
  pressFilters.forEach((button) => {
    button.addEventListener("click", () => applyPressFilter(button.dataset.pressFilter));
  });
}

// ===== 媒體報導頁：依日期排序（最新／最舊；只重排網格卡，精選頭條不動）=====
const pressSortButtons = document.querySelectorAll("[data-press-sort]");
if (pressSortButtons.length) {
  const list = document.querySelector(".news-list");
  if (list) {
    const cards = [...list.querySelectorAll(".news-card")];
    const dateOf = (card) => {
      const t = card.querySelector("time");
      return (t && t.getAttribute("datetime")) || "";
    };
    const applyPressSort = (dir) => {
      pressSortButtons.forEach((button) => {
        const on = button.dataset.pressSort === dir;
        button.classList.toggle("is-active", on);
        button.setAttribute("aria-pressed", String(on));
      });
      const sorted = [...cards].sort((a, b) =>
        dir === "oldest" ? dateOf(a).localeCompare(dateOf(b)) : dateOf(b).localeCompare(dateOf(a))
      );
      sorted.forEach((card) => list.appendChild(card));
    };
    pressSortButtons.forEach((button) => {
      button.addEventListener("click", () => applyPressSort(button.dataset.pressSort));
    });
  }
}

// ===== 全站快速入口 float-dock：手機點書籤展開／收合（桌機常駐直 dock，不需 JS）=====
const floatDock = document.querySelector("[data-float-dock]");
if (floatDock) {
  const dockTab = floatDock.querySelector(".float-dock__tab");
  const setDockOpen = (open) => {
    floatDock.classList.toggle("is-open", open);
    if (dockTab) {
      dockTab.setAttribute("aria-expanded", String(open));
      dockTab.setAttribute("aria-label", open ? "收起快速入口" : "開啟快速入口：捐款、學習登入、聯絡");
    }
  };
  if (dockTab) {
    dockTab.addEventListener("click", () => setDockOpen(!floatDock.classList.contains("is-open")));
  }
  // 點任一入口即收合（連結照常跳頁）
  floatDock.querySelectorAll(".float-dock__item").forEach((link) => {
    link.addEventListener("click", () => setDockOpen(false));
  });
  // 點 dock 以外的空白處收合
  document.addEventListener("click", (event) => {
    if (floatDock.classList.contains("is-open") && !floatDock.contains(event.target)) setDockOpen(false);
  });
  // Esc 收合
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && floatDock.classList.contains("is-open")) setDockOpen(false);
  });
}

// ===== 大學專案頁 合作摘要：企業／大學 橫式展開鈕（方案 2，預設全收合、單開；programs.html）=====
// 兩顆橫排鈕預設都收合；點一顆＝展開該面板並收起另一顆；再點同一顆＝收合（key 傳 null）。
const collabTabs = document.querySelectorAll("[data-collab]");
if (collabTabs.length) {
  const collabPanels = document.querySelectorAll("[data-collab-panel]");
  const setCollab = (key) => {
    collabTabs.forEach((tab) => tab.setAttribute("aria-expanded", String(tab.dataset.collab === key)));
    collabPanels.forEach((panel) => {
      panel.hidden = panel.dataset.collabPanel !== key;
    });
  };
  collabTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const open = tab.getAttribute("aria-expanded") === "true";
      setCollab(open ? null : tab.dataset.collab);
    });
  });
  // 深連結：從其他頁／導覽選單帶 #companies-summary-title 或 #universities-summary-title 進來時，自動展開對應面板
  const collabHashMap = {
    "companies-summary-title": "company",
    "universities-summary-title": "university",
  };
  const openCollabFromHash = () => {
    const key = collabHashMap[window.location.hash.slice(1)];
    if (key) setCollab(key);
  };
  openCollabFromHash();
  window.addEventListener("hashchange", openCollabFromHash);
}


// ===== 合作夥伴 Logo 輪播：JS 啟用後變單行等寬卡片、左右箭頭循環（university-partnership.html）=====
// 無 JS 時 track 換行全展(箭頭隱藏)；JS 加 .is-enhanced→單行、量測單格步距位移、到頭/到尾循環。
document.querySelectorAll("[data-logo-carousel]").forEach((root) => {
  const carousel = root.querySelector(".logo-carousel");
  const track = root.querySelector("[data-logo-track]");
  const prevBtn = root.querySelector("[data-logo-prev]");
  const nextBtn = root.querySelector("[data-logo-next]");
  if (!carousel || !track) return;
  const slides = [...track.children];
  if (!slides.length) return;

  root.classList.add("is-enhanced");
  let index = 0;

  const perView = () => {
    const w = window.innerWidth;
    if (w <= 560) return 1;
    if (w <= 920) return 2;
    return 3;
  };

  const render = () => {
    const per = perView();
    track.style.setProperty("--per", per);
    const maxIndex = Math.max(0, slides.length - per);
    if (index > maxIndex) index = maxIndex;
    if (index < 0) index = 0;
    carousel.classList.toggle("is-static", slides.length <= per);
    const step = slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : 0;
    track.style.transform = "translateX(" + (-index * step) + "px)";
  };

  const go = (dir) => {
    const per = perView();
    const maxIndex = Math.max(0, slides.length - per);
    index += dir;
    if (index > maxIndex) index = 0;
    if (index < 0) index = maxIndex;
    render();
  };

  if (prevBtn) prevBtn.addEventListener("click", () => go(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => go(1));

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 120);
  }, { passive: true });

  render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
  window.addEventListener("load", render);
});

// ===== 鄉育官方 IG 貼文左右輪播（partner-voices.html）=====
// 橫向 scroll-snap 軌 + 下方圓形箭頭。箭頭以 scrollBy 位移一張卡（卡寬由 CSS 固定 336px）；
// 觸控可直接滑，但跨源 IG iframe 會吃掉滑動，故箭頭在所有尺寸皆保留；到頭／到尾 disabled。
document.querySelectorAll("[data-ig-carousel]").forEach((root) => {
  const track = root.querySelector("[data-ig-track]");
  const prevBtn = root.querySelector("[data-ig-prev]");
  const nextBtn = root.querySelector("[data-ig-next]");
  if (!track) return;

  const stride = () => {
    const cards = track.children;
    if (cards.length < 2) return track.clientWidth;
    return cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
  };

  const update = () => {
    const maxScroll = track.scrollWidth - track.clientWidth - 2;
    if (prevBtn) prevBtn.disabled = track.scrollLeft <= 2;
    if (nextBtn) nextBtn.disabled = track.scrollLeft >= maxScroll;
  };

  if (prevBtn) prevBtn.addEventListener("click", () => track.scrollBy({ left: -stride(), behavior: "smooth" }));
  if (nextBtn) nextBtn.addEventListener("click", () => track.scrollBy({ left: stride(), behavior: "smooth" }));

  let scrollTimer;
  track.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(update, 80);
  }, { passive: true });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(update, 120);
  }, { passive: true });

  update();
  window.addEventListener("load", update);
});

// ===== 首頁合作夥伴：依年份分塊，塊內 logo 可拖曳＋緩速自動流動（<4 個則靜態置中）=====
// 業主 2026-06-30：以拖曳＋緩捲取代偏慢跑馬燈；2026-07-14 改「一個年份一個矩形」，
// 每個年份塊（[data-pyear-win]）各一條循環；某年 logo 數 < 4 → 不流動、置中靜態排列。
// 2026-07-14b 業主「要完全連貫」：改用 transform translateX（subpixel、GPU 合成）取代
// scrollLeft——scrollLeft 會被瀏覽器取整，累加小數造成「時走時停」不連貫；並改由
// 單一 requestAnimationFrame 同步驅動所有塊。作法：JS 複製 li 填滿 → transform 無縫環繞。
(function setupPartnerYears() {
  const MIN_FOR_SCROLL = 4; // 少於 4 個 logo → 靜態置中
  const AUTO_SPEED = 0.8;   // px/frame；~48px/s 的環境緩捲
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const blocks = [];

  // 環繞到 [0, period)；transform 位移（subpixel，不取整→完全連貫）
  const wrap = (x, p) => (p > 0 ? ((x % p) + p) % p : 0);
  const apply = (st) => { st.track.style.transform = "translateX(" + (-st.offset) + "px)"; };

  document.querySelectorAll("[data-pyear-win]").forEach((win) => {
    const track = win.querySelector(".pyear-track");
    if (!track) return;
    const originals = Array.prototype.slice.call(track.querySelectorAll("li"));

    // 數量不足 → 靜態置中，不啟動任何流動（CSS .is-static：置中、去羽化）
    if (originals.length < MIN_FOR_SCROLL) {
      win.classList.add("is-static");
      return;
    }

    const st = {
      win, track, originals,
      period: 0, offset: 0, velocity: 0,
      dragging: false, hovering: false, lastX: 0, moved: 0, resumeAt: 0, started: false,
    };

    // 複製整組 li 填滿（≥ 視窗寬 + 一個循環寬），供 transform 無縫環繞
    st.buildLoop = () => {
      track.querySelectorAll('li[data-clone="1"]').forEach((n) => n.remove());
      const addGroup = () => originals.forEach((li) => {
        const c = li.cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        c.setAttribute("data-clone", "1");
        track.appendChild(c);
      });
      addGroup();
      st.period = track.children[originals.length].offsetLeft - originals[0].offsetLeft;
      let guard = 0;
      while (st.period > 0 && track.scrollWidth < win.clientWidth + st.period + 8 && guard < 16) {
        addGroup();
        guard++;
      }
      st.offset = wrap(st.offset, st.period);
      apply(st);
    };

    win.addEventListener("mouseenter", () => { st.hovering = true; });
    win.addEventListener("mouseleave", () => { st.hovering = false; });
    win.addEventListener("pointerdown", (e) => {
      st.dragging = true; st.moved = 0; st.velocity = 0; st.lastX = e.clientX;
      win.classList.add("is-grabbing");
      try { win.setPointerCapture(e.pointerId); } catch (_) {}
    });
    win.addEventListener("pointermove", (e) => {
      if (!st.dragging) return;
      const dx = e.clientX - st.lastX;
      st.lastX = e.clientX;
      st.velocity = dx;
      st.moved += Math.abs(dx);
      st.offset = wrap(st.offset - dx, st.period); // 跟手：往右拖→內容往右
      apply(st);
    });
    const release = (e) => {
      if (!st.dragging) return;
      st.dragging = false;
      win.classList.remove("is-grabbing");
      st.resumeAt = performance.now() + 1500; // 互動後稍等再自動流動
      try { win.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    win.addEventListener("pointerup", release);
    win.addEventListener("pointercancel", release);
    // 拖曳後抑制誤觸點擊（logo 目前非連結，仍保險留著）
    win.addEventListener("click", (e) => {
      if (st.moved > 6) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    blocks.push(st);

    // 等塊內圖片載入後量寬較準（含保險 timeout）
    const imgs = track.querySelectorAll("img");
    let pending = 0;
    imgs.forEach((img) => { if (!img.complete) pending++; });
    const doBuild = () => { if (st.started) return; st.started = true; st.buildLoop(); };
    if (pending === 0) {
      doBuild();
    } else {
      let done = 0;
      imgs.forEach((img) => {
        if (img.complete) return;
        const h = () => { if (++done >= pending) doBuild(); };
        img.addEventListener("load", h, { once: true });
        img.addEventListener("error", h, { once: true });
      });
      setTimeout(doBuild, 1200);
    }
  });

  if (!blocks.length) return;

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => blocks.forEach((st) => { if (st.started) st.buildLoop(); }), 200);
  });

  // 單一 rAF 同步驅動所有塊：transform 連貫（subpixel）；拖曳／hover／reduce-motion 暫停
  const tick = (now) => {
    for (const st of blocks) {
      if (!st.started || st.period <= 0 || st.dragging) continue;
      if (Math.abs(st.velocity) > 0.2) {
        st.offset = wrap(st.offset - st.velocity, st.period); // 放手後慣性
        st.velocity *= 0.93;
        apply(st);
      } else if (!reduceMotion && !st.hovering && now >= st.resumeAt) {
        st.offset = wrap(st.offset + AUTO_SPEED, st.period); // 環境緩捲
        apply(st);
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

/* =========================================================================
   貫穿脊線產生器（全站共用）— 僅 body.rspine 執行。
   首頁另有自己的 inline 版（body.home-remake），不走這裡、互不干擾。
   做法：量『實際版面』畫一條單一連續蛇形 SVG 當背景脊線（從頁首 y=0 到頁尾，絕不斷線）；
        再對每個 .sheet 段畫一層覆蓋（深底描白／淺底描綠），讓主線經過色片仍看得到。
   自適應：自動抓 .story-flow>section（無則抓 main>section/article），段數不論多少都均勻左右擺盪。
   回退：各頁 <body> 去掉 rspine class 即可（本段自動不執行）。
   ========================================================================= */
(function () {
  if (!document.body || !document.body.classList.contains("rspine")) return;
  var NS = "http://www.w3.org/2000/svg";
  /* 白字深底色片（脊線經過要描白）；其餘淺底色片描綠 */
  var DARK_SHEETS = ["sheet--forest", "sheet--brand-green", "sheet--sunset", "sheet--earth", "sheet--path", "sheet--leaf-700"];
  function isDark(el) { return DARK_SHEETS.some(function (c) { return el.classList.contains(c); }); }

  function collect(main) {
    var flow = main.querySelector(".story-flow");
    var scope = flow || main;
    var out = [];
    Array.prototype.forEach.call(scope.children, function (el) {
      var t = el.tagName;
      if ((t === "SECTION" || t === "ARTICLE") && el.offsetHeight > 40) out.push(el);
    });
    return out;
  }

  function mkSvg(W, H) {
    var s = document.createElementNS(NS, "svg");
    s.setAttribute("width", W); s.setAttribute("height", H);
    s.setAttribute("viewBox", "0 0 " + W + " " + H);
    s.style.cssText = "position:absolute;top:0;left:0;display:block";
    return s;
  }
  function path(svg, dd, w, color, op, dash) {
    var p = document.createElementNS(NS, "path");
    p.setAttribute("d", dd); p.setAttribute("fill", "none");
    p.setAttribute("stroke", color); p.setAttribute("stroke-width", w);
    p.setAttribute("stroke-linecap", "round"); p.setAttribute("stroke-linejoin", "round");
    if (op != null) p.setAttribute("opacity", op);
    if (dash) p.setAttribute("stroke-dasharray", dash);
    svg.appendChild(p); return p;
  }
  /* 節點：solid 實心／ring 空心環 */
  function dot(svg, cx, cy, r, color, ring, op) {
    var c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", r);
    if (ring) { c.setAttribute("fill", "none"); c.setAttribute("stroke", color); c.setAttribute("stroke-width", 2); }
    else { c.setAttribute("fill", color); }
    if (op != null) c.setAttribute("opacity", op);
    svg.appendChild(c);
  }

  function draw() {
    var main = document.querySelector("main");
    if (!main) return;
    /* 全站下放：若該頁 HTML 未內建 rroute 層，自動建立（僅 body.rspine 執行到這）。
       故只要 <body class="rspine"> 就會有脊線，毋須逐頁插 div。 */
    var base = document.querySelector(".rroute");
    if (!base) { base = document.createElement("div"); base.className = "rroute"; base.setAttribute("aria-hidden", "true"); main.insertBefore(base, main.firstChild); }
    var over = document.querySelector(".rroute-over");
    if (!over) { over = document.createElement("div"); over.className = "rroute-over"; over.setAttribute("aria-hidden", "true"); main.insertBefore(over, main.firstChild); }
    if (!base) return;
    var W = main.clientWidth, H = main.scrollHeight;
    if (!W || !H || W < 340) { base.innerHTML = ""; if (over) over.innerHTML = ""; return; }
    var mobile = W < 701;   /* 手機沉底水印分支 */

    var secs = collect(main);
    if (secs.length < 2) { base.innerHTML = ""; if (over) over.innerHTML = ""; return; }

    var mtop = main.getBoundingClientRect().top;
    var items = secs.map(function (el) {
      var r = el.getBoundingClientRect();
      return { top: Math.round(r.top - mtop), h: Math.round(r.height), sheet: el.classList.contains("sheet"), dark: isDark(el) };
    });

    /* 貼緣小擺盪：量『內容欄右緣』，主線就貼在內容右緣外一點做小幅左右擺盪(不畫大彎)，
       整條線緊鄰內容、離右緣自然留白＝整體不會又空又寬；永遠在內容右方＝全程看得見不斷。 */
    var mleft = main.getBoundingClientRect().left;
    var flowEl = main.querySelector(".story-flow") || main;
    var cRight = flowEl.getBoundingClientRect().right - mleft;
    var CL, CR;
    if (mobile) {
      /* 手機沉底：貼『右緣』小擺盪(圖一原則)——過卡片時被卡片乾淨遮住、不切中央文字；沉在內容之後、於白區與縫隙露出 */
      CR = W - 16;
      CL = W - 52;
    } else {
      /* 桌機貼緣小擺盪：量內容欄右緣，主線貼右緣外一點小擺盪。
         右界＝讓開常駐 float-dock（桌機貼右緣、寬 66px、z-index:20 會蓋住脊線）：
         外擺 clamp 到 dock 左緣內側 8px，脊線走在「內容右緣～dock 左緣」的縫裡＝全程可見。
         縫太窄時縮小擺幅／直行、貼著 dock 內側走；以「不鑽進 dock 底下被蓋」為優先
         （寧可貼近內容右緣，也不落在 dock 之下——最窄寬度 ≤1100 脊線本就淡化）。 */
      var DOCK_W = 66;                    /* .float-dock__item 寬；與 styles.css 同步 */
      var rightMax = W - DOCK_W - 8;      /* 脊線外擺上限：離 dock 左緣留 8px */
      CL = Math.round(cRight + 26);
      CR = CL + 78;
      if (CR > rightMax) CR = rightMax;   /* 讓開 dock */
      if (CL > CR) CL = CR;               /* 縫窄到塞不下＝直行在 dock 內側（不退回被 dock 蓋） */
    }
    var R = 80;

    /* 單一連續 path：M…起筆 → 各段交界圓角擺盪 → V 到頁尾，一氣呵成、絕不斷線。
       修正(2026-07-08)：原本圓角半徑只被『水平擺幅』限制、沒看『段高』，當相鄰兩段的
       上緣距離 < 2×半徑時 V 會反折→出現鉤狀（短段多的頁如 for-students 底部）。
       改為逐段追蹤實際筆尖 x/y：垂直空間夠才擺盪、圓角再依剩餘高度縮放；空間不足就直行
       不擺（xs 記錄各段實際 x，節點與分歧線一律跟隨，不再假設嚴格左右交替）。
       手機從招牌框下方(首段上緣)起筆，避免橙線壓在深色招牌框上。 */
    var startY = mobile ? Math.max(0, items[0].top - 8) : 0;
    var xs = [CR];              // 各段主線實際 x；第 0 段起於外擺位
    var penY = startY;          // 目前筆尖 y（避免下一段圓角反折）
    var segs = [];
    for (var j = 0; j < items.length - 1; j++) {
      var curX = xs[j];
      var wantX = curX === CR ? CL : CR;
      var yb = items[j + 1].top;
      var r = Math.min(R, Math.floor(Math.abs(wantX - curX) / 2) - 4, Math.floor((yb - penY) / 2) - 2);
      if (r >= 14) {
        var sg = wantX > curX ? 1 : -1;
        segs.push(
          "V" + (yb - r),
          "Q" + curX + " " + yb + " " + (curX + sg * r) + " " + yb,
          "H" + (wantX - sg * r),
          "Q" + wantX + " " + yb + " " + wantX + " " + (yb + r)
        );
        xs.push(wantX);
        penY = yb + r;
      } else {
        xs.push(curX);          // 段太短塞不下圓角＝不擺盪、直行
      }
    }
    var d = "M" + xs[0] + " " + startY + (segs.length ? " " + segs.join(" ") : "") + " V" + (H - 20);

    var cs = getComputedStyle(document.documentElement);
    var GREEN = (cs.getPropertyValue("--deep") || "#3d5527").trim();
    var ORANGE = (cs.getPropertyValue("--path") || "#f28c0a").trim();
    var GOLD = (cs.getPropertyValue("--amber") || "#f8cd5f").trim();
    /* 脊線主色：可由各頁 body 的 --spine-c 換色(桌機＋手機共用)；預設路徑橙。全站鋪時每頁改此變數即可。 */
    var SPINE = (getComputedStyle(document.body).getPropertyValue("--spine-c") || "").trim() || ORANGE;

    /* --- 基底層：主線(綠、細) + 首頁設計語彙(橙分歧線／多色多樣節點／金虛線括號)，全收在右側走廊內 --- */
    var svg = mkSvg(W, H);

    /* 主線＝脊線主色 SPINE(桌機＋手機共用、可換色)；手機沉在內容後、調明顯讓縫隙與背景清楚露出 */
    path(svg, d, 2.2, SPINE, mobile ? "0.85" : "0.85");

    /* 節點座標：落在各段的垂直脊線上 */
    var NODES = items.map(function (it, k) {
      return { x: xs[k], y: it.top + Math.min(140, Math.round(it.h * 0.34)) };
    });

    /* 橙色分歧短線(＝首頁 orange-line)：只在桌機畫；手機拿掉(會壓在中央文字上、雜亂——圖一原則) */
    if (!mobile) NODES.forEach(function (nd, k) {
      if (nd.x !== CR) return;   // 只從外擺位(CR)節點朝內容方向伸分歧線
      var xe = CL - 4;
      if (Math.abs(nd.x - xe) > 36) path(svg, "M" + nd.x + " " + nd.y + " H" + xe, 1.8, GREEN, "0.9");
    });

    /* 金色虛線括號(＝首頁 dash-line)：只在桌機走廊畫(手機無走廊、沉底水印不放) */
    if (!mobile) {
      var bi = -1;
      for (var s = 0; s < items.length; s++) { if (items[s].sheet) { bi = s; break; } }
      if (bi < 0) bi = Math.min(2, items.length - 1);
      var bit = items[bi], bx = Math.max(CL + 4, xs[bi] - 30);
      var byA = bit.top + Math.round(bit.h * 0.30), byB = bit.top + Math.round(bit.h * 0.70);
      if (byB - byA > 80) {
        path(svg,
          "M" + (bx + 26) + " " + byA + " H" + (bx + 8) + " Q" + bx + " " + byA + " " + bx + " " + (byA + 18) +
          " V" + (byB - 18) + " Q" + bx + " " + byB + " " + (bx + 8) + " " + byB + " H" + (bx + 26),
          1.6, "rgba(245,182,45,.82)", "0.9", "7 8");
      }
    }

    /* 多色多樣節點(綠實心／橙大實心／金空心環 循環)：只在桌機畫；手機拿掉(節點會壓在文字上、雜亂——圖一原則) */
    var PAL = [
      { c: GREEN, r: 4, ring: false },
      { c: ORANGE, r: 5.5, ring: false },
      { c: GOLD, r: 5, ring: true }
    ];
    if (!mobile) NODES.forEach(function (nd, k) {
      var st = PAL[k % PAL.length];
      dot(svg, nd.x, nd.y, st.r, st.c, st.ring, null);
    });

    base.innerHTML = ""; base.appendChild(svg);

    /* --- 直排浮水印(＝首頁 rhome-vlabel)：右緣一顆，建立一次 --- */
    if (!main.querySelector(".rspine-vlabel")) {
      var vl = document.createElement("div");
      vl.className = "rspine-vlabel"; vl.setAttribute("aria-hidden", "true");
      vl.textContent = "COUNTRYEDU CHARITY FOUNDATION";
      main.appendChild(vl);
    }

    /* --- 段落節拍小裝飾(＝首頁 rsec-mark)：非色片段的右下走廊放 bar/square/block 輪替 --- */
    var deco = main.querySelector(".rroute-deco");
    if (!deco) {
      deco = document.createElement("div");
      deco.className = "rroute-deco"; deco.setAttribute("aria-hidden", "true");
      main.appendChild(deco);
    }
    deco.innerHTML = "";
    var MARKS = ["rspine-mark--bar", "rspine-mark--square", "rspine-mark--block"];
    var mi = 0;
    if (!mobile) items.forEach(function (it, k) {   // 手機無右走廊+沉底水印，不放段落條碼 mark
      if (it.sheet) return;              // 色片段跳過(會被滿版色片蓋住)
      if (k === 0 || k === 1) return;    // 首段/情境照片段跳過，避免過上或壓圖說
      if (it.h < 300) return;            // 太矮的段跳過
      var mk = document.createElement("span");
      mk.className = "rspine-mark " + MARKS[mi % MARKS.length];
      mk.style.left = Math.round(cRight + 12) + "px";           // 內容右緣外一點、落在走廊
      mk.style.top = Math.round(it.top + it.h - 100) + "px";    // 段落底部上方一點
      deco.appendChild(mk);
      mi++;
    });

    /* --- 色片覆蓋層：把『色片段』的主線浮到內容之上(不透明色片會全蓋 base、故浮上來)。
       桌機：只深底 sheet 需描白(base z2 已在淺底色片上)。手機：所有 sheet 段都浮上來——淺底描脊線色、深底描白。 --- */
    if (over) {
      over.innerHTML = "";
      var darkS = items.filter(function (it) { return it.sheet && it.dark; });
      var lightS = mobile ? items.filter(function (it) { return it.sheet && !it.dark; }) : [];
      if (darkS.length || lightS.length) {
        var osvg = mkSvg(W, H);
        var defs = document.createElementNS(NS, "defs");
        function clipRects(id, list) {
          var cp = document.createElementNS(NS, "clipPath"); cp.setAttribute("id", id);
          list.forEach(function (it) {
            var rc = document.createElementNS(NS, "rect");
            rc.setAttribute("x", 0); rc.setAttribute("y", it.top);
            rc.setAttribute("width", W); rc.setAttribute("height", it.h);
            cp.appendChild(rc);
          });
          defs.appendChild(cp);
        }
        if (darkS.length) clipRects("rov-dark", darkS);
        if (lightS.length) clipRects("rov-light", lightS);
        osvg.appendChild(defs);
        if (darkS.length) path(osvg, d, 2.2, "#ffffff", "0.92").setAttribute("clip-path", "url(#rov-dark)");
        if (lightS.length) path(osvg, d, 2.2, SPINE, "0.9").setAttribute("clip-path", "url(#rov-light)");
        over.appendChild(osvg);
      }
    }
  }

  var t;
  function queue() { clearTimeout(t); t = setTimeout(draw, 120); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", draw);
  else draw();
  window.addEventListener("load", draw);
  window.addEventListener("resize", queue);
  if (window.ResizeObserver) { var m = document.querySelector("main"); if (m) new ResizeObserver(queue).observe(m); }
})();
