/*
 * FindersArmy motion layer. Plain JS so it also runs in static previews.
 *   custom cursor        a ring that follows the pointer with easing, grows over links and shows
 *                        [data-cursor] labels ("Bekijk")
 *   [data-depth="n"]     layers that drift with the pointer, deeper layers further (hero)
 *   [data-unveil]        photos that open up (clip + zoom) as they scroll into view
 *   [data-hscroll]       section that scrolls sideways while you scroll down (desktop)
 *   [data-theme-toggle]  light/dark switch that also works without React
 *   scroll progress      thin signal-coloured bar at the top of the page
 * Nothing here changes content; everything degrades to a normal page without JS or with
 * reduced motion.
 */
(function () {
  if (window.__faMotion) return;
  window.__faMotion = true;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var mx = window.innerWidth / 2, my = window.innerHeight / 2;
  window.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });

  // Theme switch without React (static previews); the React toggle does the same in the app.
  document.addEventListener("click", function (e) {
    var b = e.target instanceof Element ? e.target.closest("[data-theme-toggle]") : null;
    if (!b || window.__faReact) return;
    var d = document.documentElement;
    var next = d.getAttribute("data-theme") === "dark" ? "light" : "dark";
    d.setAttribute("data-theme", next);
    try { localStorage.setItem("fa-theme", next); } catch (err) { /* ignore */ }
  });

  function start() {
    // Scroll progress.
    var bar = document.createElement("div");
    bar.className = "fa-progress";
    bar.setAttribute("aria-hidden", "true");
    document.documentElement.appendChild(bar);

    var cursor = null, label = null, cx = mx, cy = my, scale = 1, targetScale = 1;
    if (fine && !reduce) {
      cursor = document.createElement("div");
      cursor.className = "fa-cursor";
      cursor.setAttribute("aria-hidden", "true");
      label = document.createElement("span");
      cursor.appendChild(label);
      document.documentElement.appendChild(cursor);
      document.documentElement.classList.add("has-fa-cursor");
    }

    // Money board: hover/focus picks a row; otherwise it cycles slowly.
    function board(root) {
      if (root.__faB) return;
      root.__faB = true;
      var rows = [].slice.call(root.querySelectorAll("[data-board-row]"));
      var panels = [].slice.call(root.querySelectorAll("[data-board-panel]"));
      var cur = 0, held = false;
      function pick(i) {
        cur = i;
        rows.forEach(function (r, j) { r.classList.toggle("is-active", j === i); });
        panels.forEach(function (p, j) { p.classList.toggle("is-active", j === i); });
      }
      rows.forEach(function (r, i) {
        r.addEventListener("pointerenter", function () { held = true; pick(i); });
        r.addEventListener("focus", function () { held = true; pick(i); });
      });
      root.addEventListener("pointerleave", function () { held = false; });
      if (!reduce) setInterval(function () { if (!held && !document.hidden) pick((cur + 1) % rows.length); }, 3200);
    }

    var layers = [], hs = [];
    function scan() {
      layers = [].slice.call(document.querySelectorAll("[data-depth]")).map(function (el) {
        return el.__fa || (el.__fa = { el: el, d: parseFloat(el.getAttribute("data-depth")) || 1, x: 0, y: 0 });
      });
      hs = [].slice.call(document.querySelectorAll("[data-hscroll]"));
      document.querySelectorAll("[data-board]").forEach(board);
      if (!("IntersectionObserver" in window) || reduce) return;
      document.querySelectorAll("[data-unveil]").forEach(function (el) {
        if (el.__faU) return;
        el.__faU = true;
        if (el.getBoundingClientRect().top < window.innerHeight) return;
        el.classList.add("fa-unveil");
        var io = new IntersectionObserver(function (en) {
          if (!en[0].isIntersecting) return;
          io.disconnect();
          el.classList.add("is-open");
        }, { rootMargin: "0px 0px -10% 0px" });
        io.observe(el);
      });
    }
    scan();
    new MutationObserver(function () { requestAnimationFrame(scan); }).observe(document.body, { childList: true, subtree: true });

    function layoutH() {
      hs.forEach(function (wrap) {
        var track = wrap.querySelector("[data-hscroll-track]");
        if (!track) return;
        var desktop = window.innerWidth >= 1024 && !reduce;
        if (!desktop) { wrap.style.height = ""; track.style.transform = ""; wrap.classList.remove("is-pinned"); return; }
        wrap.classList.add("is-pinned");
        var dist = Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
        wrap.__dist = dist;
        wrap.style.height = window.innerHeight + dist + "px";
      });
    }
    layoutH();
    window.addEventListener("resize", layoutH);

    (function frame() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";

      if (!reduce) {
        var nx = mx / window.innerWidth - 0.5, ny = my / window.innerHeight - 0.5;
        layers.forEach(function (l) {
          l.x = lerp(l.x, nx * l.d * 18, 0.08);
          l.y = lerp(l.y, ny * l.d * 14, 0.08);
          l.el.style.translate = l.x.toFixed(2) + "px " + l.y.toFixed(2) + "px";
        });
        hs.forEach(function (wrap) {
          if (!wrap.__dist) return;
          var track = wrap.querySelector("[data-hscroll-track]");
          var top = wrap.getBoundingClientRect().top;
          var p = Math.min(1, Math.max(0, -top / wrap.__dist));
          track.style.transform = "translate3d(" + (-p * wrap.__dist).toFixed(1) + "px,0,0)";
        });
      }

      if (cursor) {
        var t = document.elementFromPoint(mx, my);
        var lab = t && t.closest ? t.closest("[data-cursor]") : null;
        var link = t && t.closest ? t.closest("a, button, [role=button], select, input, textarea, label") : null;
        targetScale = lab ? 3 : link ? 1.6 : 1;
        label.textContent = lab ? lab.getAttribute("data-cursor") : "";
        cursor.classList.toggle("is-label", !!lab);
        cursor.classList.toggle("is-link", !!link && !lab);
        cx = lerp(cx, mx, 0.2); cy = lerp(cy, my, 0.2); scale = lerp(scale, targetScale, 0.18);
        cursor.style.transform = "translate3d(" + cx + "px," + cy + "px,0) translate(-50%,-50%) scale(" + scale.toFixed(3) + ")";
      }
      requestAnimationFrame(frame);
    })();
  }
  // Start only once React has hydrated (HydrationMark), or, on static pages without React
  // (previews), shortly after load.
  function whenReady(fn) {
    var done = false;
    // React hydrates streamed pages in chunks; give the remaining chunks an idle tick too.
    var go = function () {
      if (done) return;
      done = true;
      var later = function () { setTimeout(fn, 600); };
      if ("requestIdleCallback" in window) requestIdleCallback(later, { timeout: 1500 }); else later();
    };
    if (window.__faHydrated) go(); else window.addEventListener("fa:hydrated", go, { once: true });
    window.addEventListener("load", function () {
      if (!self.__next_f) setTimeout(go, 50);
    });
  }
  whenReady(start);
})();
