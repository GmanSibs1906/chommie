/* Chommie — Home */
(function () {
  if (window.albert && albert.boot) albert.boot({ signature: "cursor-follow" });

  // Cursor halo only shows once a real pointer moves
  var halo = document.querySelector(".hero-halo");
  if (halo) document.addEventListener("pointermove", function () { halo.classList.add("is-live"); }, { once: true });

  // Header appears after the first scroll (no chrome on the fold)
  var head = document.querySelector(".site-head");
  function onScroll() { head.classList.toggle("is-shown", window.scrollY > window.innerHeight * 0.6); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // Step tabs: click to switch, gently auto-advance until the reader takes over
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs [role="tab"]'));
  var auto = true, idx = 0, timer;
  function show(i, focus) {
    idx = (i + tabs.length) % tabs.length;
    tabs.forEach(function (t, n) {
      var on = n === idx;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).classList.toggle("is-on", on);
    });
    if (focus) tabs[idx].focus();
    var strip = tabs[idx].parentNode;
    strip.scrollTo({ left: tabs[idx].offsetLeft - 20, behavior: "smooth" });
  }
  tabs.forEach(function (t, n) {
    t.addEventListener("click", function () { auto = false; show(n); });
    t.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { auto = false; show(idx + 1, true); }
      if (e.key === "ArrowLeft") { auto = false; show(idx - 1, true); }
    });
  });
  timer = setInterval(function () { if (auto && !document.hidden) show(idx + 1); }, 6500);

  // Signature: the ATP photo turns into a term plan — topics snap onto days
  var sig = document.querySelector(".sig");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (sig && window.gsap && window.ScrollTrigger && !reduced) {
    gsap.from(".plan-row i", {
      opacity: 0, x: -48, scale: 0.94, duration: 0.7, ease: "expo.out",
      stagger: 0.09,
      scrollTrigger: { trigger: ".plan", start: "top 75%", once: true,
        onEnter: function () { sig.classList.add("is-planned"); } }
    });
    gsap.from(".atp-paper", {
      rotate: -9, y: 30, opacity: 0.4, duration: 1, ease: "expo.out",
      scrollTrigger: { trigger: ".sig-grid", start: "top 80%", once: true }
    });
  } else if (sig) { sig.classList.add("is-planned"); }
})();
