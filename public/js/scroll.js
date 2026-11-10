// Scroll-driven interactions: smooth scroll, headline masks, reveals,
// hero parallax, type band, pinned bestsellers, full-screen theme panels,
// journey route drawing and the footer wordmark.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const HEADER = 72;
  // Pages with their own header script (the tour page) keep it; this file only adds the scroll effects there
  const ownHeader = document.body.classList.contains("page-tour");

  // ---------- Smooth scroll (Lenis) ----------
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    window.ejLenis = lenis; // lets other scripts scroll without fighting the smoothing
    // In-page links glide instead of jumping
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (a && !ownHeader && a.getAttribute("href").length > 1) {
        const target = document.querySelector(a.getAttribute("href"));
        if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -HEADER }); }
      }
      if (e.target.closest("#to-top")) { e.stopImmediatePropagation(); lenis.scrollTo(0); }
    }, true);
    Element.prototype.scrollIntoView = function () { lenis.scrollTo(this, { offset: -(HEADER + 16) }); };
    // Freeze page scroll while a modal is open
    const modal = $("#modal");
    if (modal) new MutationObserver(() => (modal.hidden ? lenis.start() : lenis.stop()))
      .observe(modal, { attributes: true, attributeFilter: ["hidden"] });
    // Tour-page lightbox locks the page the same way
    new MutationObserver(() => (document.documentElement.classList.contains("tp-lb-open") ? lenis.stop() : lenis.start()))
      .observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  }
  if (!reduce) document.documentElement.classList.add("js-motion");

  // ---------- Back to top (every page) ----------
  const toTop = $("#to-top");
  if (toTop) {
    addEventListener("scroll", () => toTop.classList.toggle("show", scrollY > 900), { passive: true });
    if (!lenis) toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
  }

  // ---------- Tap areas (Material 3: aim for 48×48) ----------
  // Each control's invisible hit area grows towards 48px but stops halfway to its nearest neighbour,
  // so packed lists never steal each other's taps. Uses whichever pseudo-element the control leaves free.
  const HIT_SEL = 'a[href], button, summary, [role="button"], label.opt, label.tpill, label.leadform__check, .pp-check, label:has(> input[type="checkbox"]), label:has(> input[type="radio"])';
  function sizeTargets() {
    const els = $$(HIT_SEL).filter((e) => e.offsetParent !== null && !e.closest("#intro"));
    const rects = new Map(els.map((e) => [e, e.getBoundingClientRect()]));
    for (const e of els) {
      const r = rects.get(e); if (!r.width || !r.height) continue;
      const nx = Math.max(0, (48 - r.width) / 2), ny = Math.max(0, (48 - r.height) / 2);
      if (!nx && !ny) continue;
      let slot = e.dataset.m3slot;
      if (!slot) {
        slot = getComputedStyle(e, "::before").content === "none" ? "before" : getComputedStyle(e, "::after").content === "none" ? "after" : "none";
        e.dataset.m3slot = slot;
        if (slot !== "none" && getComputedStyle(e).position === "static") e.classList.add("m3-rel");
      }
      if (slot === "none") continue;
      let t = ny, b = ny, l = nx, rt = nx;
      for (const [o, q] of rects) {
        if (o === e || o.contains(e) || e.contains(o) || !q.width) continue;
        if (q.left < r.right + nx && q.right > r.left - nx) { if (q.bottom <= r.top) t = Math.min(t, (r.top - q.bottom) / 2); else if (q.top >= r.bottom) b = Math.min(b, (q.top - r.bottom) / 2); }
        if (q.top < r.bottom + ny && q.bottom > r.top - ny) { if (q.right <= r.left) l = Math.min(l, (r.left - q.right) / 2); else if (q.left >= r.right) rt = Math.min(rt, (q.left - r.right) / 2); }
      }
      e.classList.add(slot === "before" ? "m3-hit" : "m3-hit--after");
      e.style.setProperty("--hit-t", `${Math.max(0, t)}px`); e.style.setProperty("--hit-b", `${Math.max(0, b)}px`);
      e.style.setProperty("--hit-l", `${Math.max(0, l)}px`); e.style.setProperty("--hit-r", `${Math.max(0, rt)}px`);
    }
  }
  let hitTimer;
  const queueTargets = () => { clearTimeout(hitTimer); hitTimer = setTimeout(sizeTargets, 250); };
  addEventListener("load", queueTargets); addEventListener("resize", queueTargets); queueTargets();
  // Only when elements are added or removed (countdowns change text every second and don't need it)
  new MutationObserver((ms) => { if (ms.some((m) => [...m.addedNodes, ...m.removedNodes].some((n) => n.nodeType === 1))) queueTargets(); })
    .observe(document.body, { childList: true, subtree: true });
  document.addEventListener("pointerover", (e) => { if (e.target.closest && e.target.closest(".nav__item, .fdrop, details")) queueTargets(); }, { passive: true });
  document.addEventListener("toggle", queueTargets, true);

  // ---------- Newsletter form on pages without the homepage script ----------
  const news = document.getElementById("news-form");
  if (news && !document.getElementById("lead-form")) news.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = news.querySelector('input[type="email"], input[name="email"]'); if (!input) return;
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    let err = news.querySelector(".field__error"), out = news.querySelector(".form-msg") || document.getElementById("news-msg");
    input.setAttribute("aria-invalid", String(!ok));
    if (!ok) { if (!err) { err = document.createElement("p"); err.className = "field__error"; err.id = "news-err"; news.appendChild(err); } err.textContent = "Enter an email like name@example.com."; input.setAttribute("aria-describedby", err.id); input.focus(); return; }
    if (err) err.remove(); input.removeAttribute("aria-describedby");
    if (out) { out.textContent = "Thanks! You'll hear about new tours and sales first. (Preview: nothing was sent.)"; out.className = "form-msg ok"; } news.reset();
  });

  // ---------- Page transitions: fade to the intro colour before leaving for another page ----------
  if (!reduce) {
    const fade = document.createElement("div"); fade.className = "page-fade"; fade.setAttribute("aria-hidden", "true"); document.body.appendChild(fade);
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/\.html?$|\/$/.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page (hash links etc.)
      e.preventDefault(); document.documentElement.classList.add("is-leaving");
      setTimeout(() => { location.href = url.href; }, 380);
    });
    addEventListener("pageshow", (e) => { if (e.persisted) document.documentElement.classList.remove("is-leaving"); });
  }

  // ---------- Intro: logo reveal on every page load ----------
  const intro = $("#intro");
  if (!intro) { /* no intro screen on this page */ }
  else if (reduce) intro.remove();
  else {
    if (lenis) lenis.stop();
    requestAnimationFrame(() => intro.classList.add("play"));
    setTimeout(() => { intro.classList.add("out"); if (lenis) lenis.start(); }, 1600);
    setTimeout(() => intro.remove(), 2500);
  }


  // ---------- Headline word masks ----------
  function split(el) {
    let i = 0;
    const walk = (node, into) => {
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { into.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "w";
            const inner = document.createElement("span"); inner.textContent = part; inner.style.setProperty("--i", i++);
            w.appendChild(inner); into.appendChild(w);
          });
        } else if (n.nodeType === 1) {
          const clone = n.cloneNode(false); into.appendChild(clone); walk(n, clone);
        }
      });
    };
    const frag = document.createElement("div"); walk(el, frag);
    el.innerHTML = ""; [...frag.childNodes].forEach((c) => el.appendChild(c));
    el.classList.add("split");
  }
  const heads = $$(".section-head h2:not(#results-title), .section-head h3, .seasonal h2, .lead h2, .faq__side h2, .reviews__summary h2, .atlas__head h2, .ontour__title, .tp-sec h2");
  if (!reduce) heads.forEach(split);

  // ---------- Reveal on enter ----------
  const REVEAL = [
    ".section-head .eyebrow", ".section-head .sub", ".card", ".post", ".theme__content", ".city", ".inc", ".review", ".promo", ".live__row", ".dep",
    ".quick a", ".jl", ".cat", ".sched__state", ".sched__list", ".filters", ".leadform__intro > *", ".leadform__card", ".atlas__head p", ".atlas__item", ".atlas__map", ".ontour__tabs", ".ribbon__item", ".why200__col", ".whycard", ".compare tbody tr", ".trustband__copy > *", ".sign", ".seasonal__copy > p", ".seasonal__copy > .row", ".reviews__summary > :not(h2)",
    ".lead p", ".lead__form", ".qa2", ".mini", ".slider", ".dots", ".footer__top > *", ".footer__regions > div", ".tabs",
    ".tp-sec",
  ].join(",");
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  function arm(root) {
    if (reduce) return;
    const els = root.matches && root.matches(REVEAL) ? [root] : [];
    els.push(...$$(REVEAL, root));
    els.forEach((el) => {
      if (el.classList.contains("reveal") || el.closest(".hscroll__sticky .track") && false) return;
      const sibs = el.parentElement ? [...el.parentElement.children] : [el];
      el.style.setProperty("--d", `${(sibs.indexOf(el) % 6) * 0.08}s`);
      el.classList.add("reveal"); io.observe(el);
    });
  }
  arm(document.body);
  heads.forEach((h) => io.observe(h));
  // Content that app.js re-renders (tabs, filters, search) gets the same treatment
  new MutationObserver((muts) => muts.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && arm(n))))
    .observe($("main") || document.body, { childList: true, subtree: true });
  // Hero headline plays on load
  const heroH1 = $(".hero h1");
  if (heroH1) setTimeout(() => heroH1.classList.add("in"), intro && intro.isConnected ? 1750 : 150);

  // ---------- Footer wordmark letters ----------
  const mark = $("#wordmark") || document.createElement("div");
  mark.innerHTML = [...mark.childNodes].map((n) => {
    const letters = [...n.textContent].map((ch) => `<span>${ch}</span>`).join("");
    return n.nodeType === 1 ? `<em>${letters}</em>` : letters;
  }).join("");
  const markLetters = $$("span", mark);

  // ---------- Per-frame updates ----------
  const hero = $(".hero"), heroInner = $(".hero__inner"), bar = $("#progress");
  const rows = $$(".marquee__row"), marquee = $(".marquee");

  // ---------- Header: hide on scroll down, show on scroll up, and read
  // what is behind it so the logo and links stay legible ----------
  const head = ownHeader ? null : $("#header");
  let lastY = scrollY, probeAt = 0;
  const lum = (c) => { const m = c.match(/[\d.]+/g); if (!m) return null; const [r, g, b, a = 1] = m.map(Number); return a < 0.5 ? null : (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
  const headLogo = head && $(".logo", head);
  function toneBehind() {
    // Sample what sits directly behind the logo, since that is what has to stay legible
    const r = head.getBoundingClientRect(), lr = headLogo.getBoundingClientRect();
    const x = lr.left + lr.width / 2, y = Math.max(0, r.top) + r.height / 2; // where it sits when shown
    for (const el of document.elementsFromPoint(x, y)) {
      if (head.contains(el) || el.closest("#intro, .modal, .toast, .to-top")) continue;
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.backgroundImage.includes("url(")) return "photo";
        const l = lum(cs.backgroundColor);
        if (l !== null) return l < 0.45 ? "dark" : "light";
      }
    }
    return "light";
  }
  function updateHeader(y) {
    if (!head) return;
    const dy = y - lastY;
    const menuOpen = !!$(".mega.open");
    if (y < 120 || menuOpen) head.classList.remove("is-hidden");
    else if (dy > 4) head.classList.add("is-hidden");
    else if (dy < -4) head.classList.remove("is-hidden");
    if (Math.abs(dy) > 0.5 || !probeAt) { probeAt = 1; head.dataset.tone = toneBehind(); }
    lastY = y;
  }
  addEventListener("scroll", () => updateHeader(scrollY), { passive: true });
  if (head) {
    const retone = () => { head.dataset.tone = toneBehind(); };
    retone();
    addEventListener("load", retone);
    setTimeout(retone, 2600); // after the intro screen has gone
  }

  function update() {
    const y = scrollY, vh = innerHeight;
    updateHeader(y);
    if (bar) bar.style.transform = `scaleX(${clamp(y / (document.documentElement.scrollHeight - vh))})`;
    if (reduce) return;

    // Hero: background drifts slower, copy lifts and fades
    if (hero && heroInner && y < hero.offsetHeight + 200) {
      hero.style.backgroundPositionY = `calc(95% + ${y * 0.35}px)`;
      heroInner.style.transform = `translateY(${y * 0.22}px)`;
      heroInner.style.opacity = clamp(1 - y / (hero.offsetHeight * 0.85));
    }


    // Type band: rows slide in opposite directions
    const mr = marquee ? marquee.getBoundingClientRect() : null;
    if (mr && mr.bottom > 0 && mr.top < vh) {
      const t = vh - mr.top;
      rows.forEach((r) => { const s = +r.dataset.speed; r.style.transform = `translateX(${(s < 0 ? -1100 : 0) - t * s}px)`; });
    }





    // Footer wordmark: letters rise one after another
    const wr = mark.getBoundingClientRect();
    const wp = clamp((vh - wr.top) / wr.height, 0, 1.5);
    markLetters.forEach((l, i) => { l.style.transform = `translateY(${(1 - clamp(wp * 1.5 - i * 0.04)) * 100}%)`; });
  }

  function frame(t) { if (lenis) lenis.raf(t); update(); requestAnimationFrame(frame); }
  requestAnimationFrame(frame);
})();
