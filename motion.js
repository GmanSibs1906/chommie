/* motion.js — Albert design studio runtime. Do not edit; call it. */
(function (root) {
  "use strict";
  var doc = root.document;

  /* Was this load the studio reloading the canvas mid-build?
   *
   * While a build runs, the canvas reloads every time the page settles — and
   * a page that has been rewritten thirteen times in fourteen minutes gets
   * reloaded a lot. Each reload replayed the entire entrance choreography:
   * the headline split into words and reassembled, every section faded up
   * again. Watching that on a loop is what "the design is glitching" meant.
   *
   * The flag is set by studio-agent.js immediately before it reloads, and is
   * read exactly once — so the FIRST load a person opens themselves still
   * gets the full entrance, which is the whole point of having one. */
  function quietReload() {
    try {
      if (root.sessionStorage && root.sessionStorage.getItem("__ds_quiet__")) {
        root.sessionStorage.removeItem("__ds_quiet__");
        return true;
      }
    } catch (e) {
      /* storage can throw outright in a partitioned frame; never break boot */
    }
    return false;
  }

  /* `reduced` already gates every animation in this file, and skipping them
   * is safe rather than merely quiet: everything here is `gsap.from`, so an
   * animation that never runs leaves the element in its natural, visible
   * state. Not animating can hide nothing. */
  var reduced =
    (root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches) ||
    quietReload();
  var hasGsap = typeof root.gsap !== "undefined";
  var hasST = hasGsap && typeof root.ScrollTrigger !== "undefined";
  var hasLenis = typeof root.Lenis !== "undefined";
  var hasSplit = typeof root.SplitType !== "undefined";
  if (hasST) root.gsap.registerPlugin(root.ScrollTrigger);

  // The energy dial. Amplitudes are the router's numbers, not a guess.
  // Four levels, and they have to FEEL different: calm is entrances and
  // hovers only; composed adds reveals; expressive adds split headlines,
  // image settles and ambient drift; cinematic turns everything up and adds
  // a parallax to every large image. Four cinematic pages shipped with the
  // same modest stagger-and-reveal, and the verdict was "motion is minimal".
  // `rich` is the switch for the expensive choreography.
  var LEVELS = {
    calm:       { travel: 20, dur: 0.6,  stagger: 0.06, drift: 0,   marquee: 0,   hover: 2,  rich: false, settle: 1.0,  parallax: 0  },
    composed:   { travel: 32, dur: 0.7,  stagger: 0.07, drift: 40,  marquee: 50,  hover: 4,  rich: false, settle: 1.03, parallax: 0  },
    expressive: { travel: 56, dur: 0.85, stagger: 0.09, drift: 70,  marquee: 80,  hover: 6,  rich: true,  settle: 1.06, parallax: 8  },
    cinematic:  { travel: 72, dur: 1.0,  stagger: 0.11, drift: 110, marquee: 120, hover: 8,  rich: true,  settle: 1.1,  parallax: 14 }
  };
  function level() {
    var e = (doc.body && doc.body.getAttribute("data-energy")) || "composed";
    return LEVELS[e] || LEVELS.composed;
  }
  function q(sel, scope) { return Array.prototype.slice.call((scope || doc).querySelectorAll(sel)); }
  function ease() { return "power3.out"; }

  var A = { level: level, reduced: reduced };

  // ── Smooth scroll ──────────────────────────────────────────────────────
  A.smooth = function () {
    if (reduced || !hasLenis || level().drift === 0) return null;
    var lenis = new root.Lenis({ lerp: 0.1, smoothWheel: true });
    function raf(t) { lenis.raf(t); root.requestAnimationFrame(raf); }
    root.requestAnimationFrame(raf);
    if (hasST) lenis.on("scroll", root.ScrollTrigger.update);
    A.lenis = lenis;
    return lenis;
  };

  // ── Entrance: the hero choreographs in. Never hides content in CSS. ───
  // If the page forgot to mark its hero, mark it: the first section's
  // headline, its paragraph, its buttons and its image. A page that ships
  // with no entrance because a hook was missed is a static page with a nice
  // load, and the runtime can see the hero perfectly well.
  function autoMark() {
    if (q("[data-enter]").length) return;
    var first = doc.querySelector("main > section, section, header + *, body > *:not(script):not(header):not(nav)");
    if (!first) return;
    var h = first.querySelector("h1, h2");
    if (h) { h.setAttribute("data-enter", ""); if (level().rich) h.setAttribute("data-split", ""); }
    q("p, a.button, .button, button, img, picture, video", first).slice(0, 6).forEach(function (el) { el.setAttribute("data-enter", ""); });
    q("section").forEach(function (s) { if (s !== first && !s.hasAttribute("data-reveal")) s.setAttribute("data-reveal", ""); });
  }

  A.enter = function (sel) {
    var L = level();
    var els = q(sel || "[data-enter]");
    if (!els.length) return;
    if (reduced || !hasGsap) { return; }
    els.forEach(function (el, i) {
      var isMedia = /^(IMG|PICTURE|VIDEO|FIGURE)$/.test(el.tagName);
      var delay = 0.1 + i * L.stagger;
      if (hasSplit && (el.hasAttribute("data-split") || (L.rich && /^H[12]$/.test(el.tagName)))) {
        var split = new root.SplitType(el, { types: L.rich ? "lines,words" : "words" });
        // Split words must still read as words. Grouping them into lines
        // dropped the spaces between some of them, and two finished designs
        // shipped "Rand.Writtendown" and "heretohelp" in their headlines.
        (split.words || []).forEach(function (w) {
          var next = w.nextSibling;
          if (next && next.nodeType === 1 && next.classList && next.classList.contains("word")) {
            w.parentNode.insertBefore(doc.createTextNode(" "), next);
          }
        });
        // Rich: lines rise from behind a mask, each word a beat behind the
        // last. Plain: words fade up.
        if (L.rich && split.lines) split.lines.forEach(function (ln) { ln.style.overflow = "hidden"; ln.style.display = "block"; });
        root.gsap.from(split.words, { yPercent: L.rich ? 110 : 0, y: L.rich ? 0 : L.travel, opacity: L.rich ? 1 : 0, duration: L.dur, stagger: L.rich ? 0.035 : 0.03, ease: L.rich ? "power4.out" : ease(), delay: delay });
      } else if (isMedia && L.rich) {
        // The image settles: it rises out of a mask and eases to rest.
        //
        // The mask is a WRAPPER with overflow hidden, and the movement is a
        // transform — not an animated clip-path. Animating clip-path repaints
        // the element on every frame; transform and opacity are the only two
        // properties the compositor can handle on its own. The first version
        // of this animated clip-path on every image of a cinematic page, and
        // the canvas stuttered exactly as if it were dropping frames, because
        // it was. The router's own rule is "transform and opacity only" and
        // this runtime has to obey it too.
        var mask = el.parentNode;
        if (!mask || !mask.hasAttribute || !mask.hasAttribute("data-mask")) {
          mask = doc.createElement("div");
          mask.setAttribute("data-mask", "");
          mask.style.overflow = "hidden";
          mask.style.display = "block";
          el.parentNode.insertBefore(mask, el);
          mask.appendChild(el);
        }
        root.gsap.from(el, { yPercent: 14, scale: L.settle, duration: L.dur * 1.4, ease: "power3.out", delay: delay, force3D: true });
      } else {
        root.gsap.from(el, { y: L.travel, opacity: 0, duration: L.dur, ease: ease(), delay: delay });
      }
    });
  };

  // ── Reveal on scroll, gsap.from so the content is never hidden ────────
  A.reveal = function (sel) {
    var L = level();
    var els = q(sel || "[data-reveal]");
    if (!els.length || reduced) return;
    if (hasST) {
      els.forEach(function (el, i) {
        var st = { trigger: el, start: "top 85%", once: true };
        if (L.rich) {
          // Inside a revealed section the pieces arrive in order — heading,
          // then copy, then media — rather than the block fading as one.
          var kids = q(":scope > *", el);
          if (kids.length > 1 && kids.length < 14) {
            root.gsap.from(kids, { y: L.travel, opacity: 0, duration: L.dur, stagger: L.stagger, ease: ease(), scrollTrigger: st });
            q("img, picture, video", el).forEach(function (m) {
              root.gsap.from(m, { scale: L.settle, duration: L.dur * 1.6, ease: "power2.out", scrollTrigger: { trigger: m, start: "top 90%", once: true } });
            });
            return;
          }
        }
        root.gsap.from(el, { y: L.travel, opacity: 0, duration: L.dur, ease: ease(), scrollTrigger: st });
      });
      // Every large image drifts against the scroll at the top two levels —
      // the cheapest way a page stops being a stack of stills.
      // The BIGGEST few, not every image. A scrubbed ScrollTrigger per image
      // is a per-frame transform per image, and on a page with several large
      // photographs that is enough continuous work to make the canvas stutter.
      // Two is a moving page; six is a slideshow that drops frames.
      if (L.parallax) {
        q("img, video")
          .filter(function (m) {
            if (m.closest("[data-parallax], [data-scrub], [data-marquee], nav, header, footer")) return false;
            return m.getBoundingClientRect().height >= 320;
          })
          .sort(function (a, b) { return b.getBoundingClientRect().height - a.getBoundingClientRect().height; })
          .slice(0, 2)
          .forEach(function (m) {
            root.gsap.fromTo(m, { yPercent: -L.parallax }, { yPercent: L.parallax, ease: "none", force3D: true, scrollTrigger: { trigger: m, start: "top bottom", end: "bottom top", scrub: 0.8 } });
          });
      }
    } else if ("IntersectionObserver" in root) {
      var io = new root.IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.style.transition = "transform " + L.dur + "s cubic-bezier(.2,.7,.2,1), opacity " + L.dur + "s";
          en.target.style.transform = "none"; en.target.style.opacity = "1";
          io.unobserve(en.target);
        });
      }, { rootMargin: "0px 0px -12% 0px" });
      els.forEach(function (el) { el.style.transform = "translateY(" + L.travel + "px)"; el.style.opacity = "0"; io.observe(el); });
    }
  };

  // ── Hover that answers: lift + the accent, transform/opacity only ─────
  A.hover = function (sel) {
    var L = level();
    // The transition is set ON HOVER, never at load. Set at load, it sat on
    // an element that a section reveal (gsap.from) was also animating; the
    // reveal's refresh read the half-transitioned state as the element's
    // final look, and the element faded from invisible to invisible — the
    // empty trailer section on Nightfall, 26 Sept.
    var LIFT = "transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s";
    q(sel || "[data-hover], a.button, .button, .card").forEach(function (el) {
      var own = el.style.transition, timer = 0;
      el.addEventListener("pointerenter", function () {
        clearTimeout(timer);
        el.style.transition = own || LIFT;
        el.style.transform = "translateY(-" + L.hover + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
        timer = setTimeout(function () { el.style.transition = own; }, 400);
      });
    });
  };

  // ── Signature moments. Call ONE. ──────────────────────────────────────
  A.signature = {
    "sticky-stack": function (sel) {
      if (!hasST || reduced) return;
      var items = q(sel || "[data-stack] > *");
      items.forEach(function (el, i) {
        root.gsap.to(el, { scale: 1 - (items.length - i) * 0.02, scrollTrigger: { trigger: el, start: "top top+=80", end: "bottom top", scrub: true, pin: i < items.length - 1, pinSpacing: false } });
      });
    },
    "scrub-hero": function (sel) {
      if (!hasST || reduced) return;
      var el = doc.querySelector(sel || "[data-scrub]"); if (!el) return;
      root.gsap.to(el, { yPercent: 18, scale: 1.08, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 } });
    },
    "marquee": function (sel) {
      var L = level(); if (L.marquee === 0) return;
      q(sel || "[data-marquee]").forEach(function (track) {
        var inner = track.firstElementChild; if (!inner) return;
        inner.parentNode.appendChild(inner.cloneNode(true));
        var w = inner.scrollWidth; var x = 0; var last = null;
        function step(t) { if (last != null && !reduced) { x -= L.marquee * ((t - last) / 1000); if (-x >= w) x += w; track.style.setProperty("--mx", x + "px"); } last = t; root.requestAnimationFrame(step); }
        track.style.display = "flex"; track.style.overflow = "hidden";
        Array.prototype.forEach.call(track.children, function (c) { c.style.flexShrink = "0"; c.style.transform = "translateX(var(--mx, 0))"; });
        root.requestAnimationFrame(step);
      });
    },
    "counter": function (sel) {
      q(sel || "[data-count]").forEach(function (el) {
        var target = parseFloat(el.getAttribute("data-count")); var dec = (String(target).split(".")[1] || "").length;
        var suffix = el.getAttribute("data-suffix") || "";
        function run() {
          if (reduced || !hasGsap) { el.textContent = target.toFixed(dec) + suffix; return; }
          var o = { v: 0 };
          root.gsap.to(o, { v: target, duration: 1.6, ease: "power2.out", onUpdate: function () { el.textContent = o.v.toFixed(dec) + suffix; } });
        }
        if (hasST) root.ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: run }); else run();
      });
    },
    "split-ground": function (sel) {
      if (!hasST || reduced) return;
      var el = doc.querySelector(sel || "[data-split-ground]"); if (!el) return;
      root.gsap.fromTo(el, { "--seam": "62%" }, { "--seam": "38%", ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    },
    "parallax-band": function (sel) {
      if (!hasST || reduced) return;
      q(sel || "[data-parallax]").forEach(function (el) {
        var img = el.querySelector("img, video") || el;
        root.gsap.fromTo(img, { yPercent: -12 }, { yPercent: 12, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });
    },
    "underline-draw": function (sel) {
      q(sel || "[data-underline]").forEach(function (el) {
        el.style.backgroundImage = "linear-gradient(currentColor, currentColor)";
        el.style.backgroundRepeat = "no-repeat"; el.style.backgroundPosition = "0 100%";
        el.style.backgroundSize = "0% 2px"; el.style.transition = "background-size .8s cubic-bezier(.2,.7,.2,1)";
        function draw() { el.style.backgroundSize = "100% 2px"; }
        if (hasST) root.ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: draw }); else draw();
      });
    },
    "image-reveal": function (sel) {
      // A wipe made of transform, for the same reason as the settle above:
      // an animated clip-path repaints every frame.
      if (reduced) return;
      q(sel || "[data-image-reveal]").forEach(function (el) {
        var mask = doc.createElement("div");
        mask.style.overflow = "hidden";
        mask.style.display = "block";
        el.parentNode.insertBefore(mask, el);
        mask.appendChild(el);
        el.style.transform = "translateX(-101%)";
        el.style.transition = "transform 1s cubic-bezier(.2,.7,.2,1)";
        function open() { el.style.transform = "translateX(0)"; }
        if (hasST) root.ScrollTrigger.create({ trigger: mask, start: "top 85%", once: true, onEnter: open }); else setTimeout(open, 120);
      });
    },
    "text-scramble": function (sel) {
      if (reduced) return;
      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      q(sel || "[data-scramble]").forEach(function (el) {
        var final = el.textContent; var frame = 0; var total = 28;
        function tick() {
          frame++;
          el.textContent = final.split("").map(function (ch, i) {
            if (ch === " ") return " ";
            return i < (frame / total) * final.length ? ch : chars[Math.floor(Math.random() * chars.length)];
          }).join("");
          if (frame < total) root.requestAnimationFrame(tick); else el.textContent = final;
        }
        root.requestAnimationFrame(tick);
      });
    },
    "cursor-follow": function (sel) {
      if (reduced || !("PointerEvent" in root)) return;
      var el = doc.querySelector(sel || "[data-cursor]"); if (!el) return;
      var tx = 0, ty = 0, x = 0, y = 0;
      doc.addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; });
      (function loop() { x += (tx - x) * 0.12; y += (ty - y) * 0.12; el.style.transform = "translate(" + x + "px," + y + "px) translate(-50%,-50%)"; root.requestAnimationFrame(loop); })();
    }
  };

  // ── Ambient: something still moves ten seconds after load ─────────────
  A.ambient = function (sel) {
    var L = level(); if (L.drift === 0 || reduced || !hasGsap) return;
    q(sel || "[data-drift]").forEach(function (el, i) {
      root.gsap.to(el, { y: (i % 2 ? -1 : 1) * L.drift * 0.4, x: (i % 3 - 1) * L.drift * 0.2, duration: 6 + i, ease: "sine.inOut", yoyo: true, repeat: -1 });
    });
  };

  // ── One call does the standard four. Signature is chosen by name. ─────
  A.boot = function (opts) {
    opts = opts || {};
    autoMark();
    A.smooth();
    A.enter(opts.enter);
    A.reveal(opts.reveal);
    A.hover(opts.hover);
    A.ambient(opts.ambient);
    if (opts.signature && A.signature[opts.signature]) A.signature[opts.signature](opts.signatureTarget);
    if (hasST) root.ScrollTrigger.refresh();

    // The safety net. Nothing a reader needs may DEPEND on an animation
    // having run — and one did: a hero's buy button sat at inline opacity 0
    // with no tween attached, in view, forever. The page's own camera forces
    // reveals, so every screenshot showed a button no visitor ever saw. So:
    // a beat after boot, anything marked for motion that is on screen and
    // still invisible is simply made visible. An entrance that played is
    // untouched; one that silently died is repaired instead of shipped.
    setTimeout(function () {
      var marked = doc.querySelectorAll("[data-enter],[data-reveal],[data-split]");
      Array.prototype.forEach.call(marked, function (el) {
        var r = el.getBoundingClientRect();
        var onScreen = r.top < root.innerHeight && r.bottom > 0 && r.width > 0;
        if (!onScreen) return;
        if (parseFloat(root.getComputedStyle(el).opacity) > 0.05) return;
        if (root.gsap && root.gsap.getTweensOf(el).length) return; // mid-flight is fine
        if (root.gsap) root.gsap.set(el, { clearProps: "opacity,transform,visibility" });
        el.style.opacity = ""; el.style.transform = ""; el.style.visibility = "";
      });
    }, 2500);
  };

  root.albert = A;
})(window);
