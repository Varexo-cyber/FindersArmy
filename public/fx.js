/*
 * FindersArmy interaction layer. Dependency-free, ~3 KB, progressive enhancement only:
 * every page is complete without it. Honors prefers-reduced-motion.
 *
 *   [data-spot]      light spot that follows the pointer (sets --mx/--my on the element)
 *   [data-magnetic]  element leans toward the pointer
 *   [data-tilt]      subtle 3D tilt toward the pointer
 *   [data-flow]      container whose --fx/--fy follow the pointer with easing (hero light blobs)
 *   [data-reveal]    slides in when scrolled into view (only if it starts below the fold)
 *   [data-count]     counts up to its euro value (cents) when scrolled into view
 *   [data-calc]      live earnings calculator (rules in data-rules JSON)
 */
(function () {
  if (window.__faFx) return;
  window.__faFx = true;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var nf = new Intl.NumberFormat(document.documentElement.lang === "en" ? "en-IE" : "nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  function euro(cents) { return nf.format(Math.round(cents / 100)).replace(/ /g, " "); }

  // Pointer-driven effects, delegated so they work for content rendered later too.
  document.addEventListener("pointermove", function (e) {
    var t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    var spot = t.closest("[data-spot]");
    if (spot) {
      var r = spot.getBoundingClientRect();
      spot.style.setProperty("--mx", e.clientX - r.left + "px");
      spot.style.setProperty("--my", e.clientY - r.top + "px");
    }
    if (reduce || !fine) return;
    var mag = t.closest("[data-magnetic]");
    if (mag) {
      var m = mag.getBoundingClientRect();
      var dx = (e.clientX - (m.left + m.width / 2)) / m.width;
      var dy = (e.clientY - (m.top + m.height / 2)) / m.height;
      mag.style.transform = "translate(" + dx * 6 + "px," + dy * 6 + "px)";
    }
    var tilt = t.closest("[data-tilt]");
    if (tilt) {
      var q = tilt.getBoundingClientRect();
      var x = (e.clientX - q.left) / q.width - 0.5;
      var y = (e.clientY - q.top) / q.height - 0.5;
      tilt.style.transform = "perspective(900px) rotateX(" + -y * 5 + "deg) rotateY(" + x * 5 + "deg) translateY(-2px)";
    }
  }, { passive: true });
  document.addEventListener("pointerout", function (e) {
    var t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    var rel = e.relatedTarget instanceof Element ? e.relatedTarget : null;
    ["[data-magnetic]", "[data-tilt]"].forEach(function (sel) {
      var el = t.closest(sel);
      if (el && !(rel && el.contains(rel))) el.style.transform = "";
    });
  });

  // Flowing light: eased follow of the pointer inside [data-flow] containers.
  function flow(el) {
    var tx = 0.65, ty = 0.35, x = tx, y = ty, raf = 0;
    function tick() {
      x += (tx - x) * 0.06; y += (ty - y) * 0.06;
      el.style.setProperty("--fx", (x * 100).toFixed(2) + "%");
      el.style.setProperty("--fy", (y * 100).toFixed(2) + "%");
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0;
    }
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  function countUp(el) {
    var to = Number(el.getAttribute("data-count"));
    if (!isFinite(to)) return;
    if (reduce) { el.textContent = euro(to); return; }
    var start = performance.now(), dur = 1100;
    function step(now) {
      var p = Math.min(1, (now - start) / dur), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = euro(to * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Fee maths mirrors src/lib/fees.ts (integer cents, half-up rounding).
  function bps(c, b) { return Math.round((c * b) / 10000); }
  function fee(rule, deal) {
    if (deal < rule.minJob) return 0;
    if (rule.type === "PERCENTAGE") return Math.max(rule.minFee, bps(deal, rule.pct));
    if (rule.type === "FIXED") return Math.max(rule.minFee, rule.fixed);
    var f = 0;
    rule.tiers.forEach(function (t) { if (deal >= t[0]) f = t[1]; });
    return f ? Math.max(rule.minFee, f) : 0;
  }
  function calc(root) {
    var rules = JSON.parse(root.getAttribute("data-rules") || "[]");
    var share = Number(root.getAttribute("data-share") || 7500);
    var sel = root.querySelector("[data-calc-category]");
    var range = root.querySelector("[data-calc-amount]");
    var jobOut = root.querySelector("[data-calc-job]");
    var feeOut = root.querySelector("[data-calc-fee]");
    var youOut = root.querySelector("[data-calc-you]");
    function update(fromSelect) {
      var rule = rules[Number(sel.value)] || rules[0];
      if (fromSelect) { range.min = rule.min; range.max = rule.max; range.step = rule.step; range.value = rule.job; }
      var deal = Number(range.value) * 100;
      var f = fee(rule, deal), you = bps(f, share);
      jobOut.textContent = euro(deal);
      feeOut.textContent = euro(f);
      youOut.textContent = euro(you);
      var span = Number(range.max) - Number(range.min);
      range.style.setProperty("--p", span > 0 ? ((Number(range.value) - Number(range.min)) / span).toFixed(3) : "0.5");
      root.classList.remove("is-bump"); void root.offsetWidth; root.classList.add("is-bump");
    }
    sel.addEventListener("change", function () { update(true); });
    range.addEventListener("input", function () { update(false); });
    update(true);
  }

  // Elements are tracked in memory, never marked with attributes: the server-rendered HTML must
  // stay byte-identical to what React hydrates.
  var seen = new WeakSet();
  function fresh(el) { if (seen.has(el)) return false; seen.add(el); return true; }
  function init(scope) {
    scope.querySelectorAll("[data-flow]").forEach(function (el) { if (fresh(el) && !reduce && fine) flow(el); });
    scope.querySelectorAll("[data-calc]").forEach(function (el) { if (fresh(el)) calc(el); });
    var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        if (el.hasAttribute("data-count")) countUp(el);
        el.classList.add("is-in");
      });
    }, { rootMargin: "0px 0px -8% 0px" }) : null;
    var vh = window.innerHeight;
    scope.querySelectorAll("[data-reveal], [data-count]").forEach(function (el) {
      if (!fresh(el) || !io || reduce) return;
      // Only content that starts below the fold animates in; what is visible at load stays put.
      if (el.hasAttribute("data-reveal") && el.getBoundingClientRect().top > vh) el.classList.add("is-pre");
      io.observe(el);
    });
  }
  // Start after load and an idle tick, so React has finished hydrating before anything changes.
  function boot() {
    var go = function () { init(document); watch(); };
    if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 1200 }); else setTimeout(go, 200);
  }
  if (document.readyState === "complete") boot(); else window.addEventListener("load", boot);
  // Client-side navigations (Next.js) add new content: pick it up.
  function watch() {
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; init(document); });
    }).observe(document.body, { childList: true, subtree: true });
  }
})();
