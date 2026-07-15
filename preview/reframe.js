/* reframe.js — 場景框架互動層（2026-07-15 定案版）
   1) 間歇脊線節點／織帶站牌：捲入視野點亮
   2) AB 卡：注入 SVG 描邊框（真實 px 圓角，縮放不變形）
   3) 行者：hover 沿框整圈歸位；觸控裝置捲入時自動跑一圈 */
(function () {
  "use strict";

  /* 1. 點亮 */
  var lit = document.querySelectorAll(".rf-joint, .rf-ribbon");
  if ("IntersectionObserver" in window && lit.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add("lit"); });
    }, { threshold: 0.9 });
    lit.forEach(function (el) { io.observe(el); });
  }

  /* 2. AB 卡描邊框注入＋尺寸同步 */
  var cards = document.querySelectorAll(".rf-card");
  cards.forEach(function (card) {
    if (card.querySelector("svg.rf-edge")) return;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "rf-edge");
    svg.setAttribute("aria-hidden", "true");
    ["base", "runner"].forEach(function (cls) {
      var r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      r.setAttribute("class", cls);
      r.setAttribute("pathLength", "100");
      svg.appendChild(r);
    });
    card.insertBefore(svg, card.firstChild);
    var dot = document.createElement("span");
    dot.className = "rf-dot";
    dot.setAttribute("aria-hidden", "true");
    card.appendChild(dot);
  });

  function fitEdges() {
    cards.forEach(function (card) {
      var w = card.offsetWidth, h = card.offsetHeight;
      var svg = card.querySelector("svg.rf-edge");
      if (!svg || !w) return;
      svg.setAttribute("viewBox", "0 0 " + w + " " + h);
      svg.querySelectorAll("rect").forEach(function (r) {
        r.setAttribute("x", 0.75); r.setAttribute("y", 0.75);
        r.setAttribute("width", w - 1.5); r.setAttribute("height", h - 1.5);
        r.setAttribute("rx", 19);
      });
    });
  }
  fitEdges();
  window.addEventListener("resize", fitEdges);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitEdges);

  /* 3. 觸控裝置：捲入視野自動跑一圈 */
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced && window.matchMedia("(hover: none)").matches && "IntersectionObserver" in window) {
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var run = e.target.querySelector("svg.rf-edge .runner");
        if (run) {
          run.style.opacity = 1;
          run.style.strokeDashoffset = -88;
          setTimeout(function () { run.style.opacity = 0; }, 1700);
        }
        io2.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    cards.forEach(function (c) { io2.observe(c); });
  }
})();
