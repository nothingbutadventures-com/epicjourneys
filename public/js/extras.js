// Homepage extras: full-screen destination slides that name the visitor's city,
// the festive offer with live countdowns to the next departures, muted video
// clips that play when in view, and the all-inclusive price calculator.
// The city comes from app.js ("ej:city" event) so everything follows the
// "Starting from" choice.
(() => {
  const D = window.EJ;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const rupee = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
  const pad = (n) => String(n).padStart(2, "0");

  let city = ($("#dep-city")?.textContent || "").trim() || "your city";
  const onCity = [];
  document.addEventListener("ej:city", (e) => { city = e.detail.city; onCity.forEach((f) => f()); });
  const paintCity = () => $$(".js-city").forEach((el) => (el.textContent = city));
  onCity.push(paintCity); paintCity();

  // ---------- Hero: destination slides with city-specific text ----------
  const slides = D.heroSlides || [];
  const wrap = $("#hero-slides"), nav = $("#hero-nav"), line = $("#hero-line"), place = $("#hero-place");
  if (wrap && slides.length) {
    const DUR = 7000;
    wrap.innerHTML = slides.map((s) => `<div class="hero__slide" data-bg="img/${s.img}.jpg"></div>`).join("");
    nav.innerHTML = slides.map((s, i) => `<button type="button" role="tab" aria-selected="false" aria-label="Slide ${i + 1}: ${esc(s.label)}"><span>${pad(i + 1)}</span><b>${esc(s.label)}</b><i><em></em></i></button>`).join("");
    nav.style.setProperty("--dur", `${DUR}ms`);
    const els = $$(".hero__slide", wrap), btns = $$("button", nav), hero = $("#hero");
    let cur = -1, timer = 0, paused = false;
    const text = (i) => slides[i].line.split("{city}").map(esc).join(`<span class="hero__hl">${esc(city)}</span>`);
    // Load a slide's photo only when it is shown or about to be
    const load = (i) => { const el = els[i]; if (el && el.dataset.bg) { el.style.backgroundImage = `url(${el.dataset.bg})`; delete el.dataset.bg; } };
    function restart() {
      clearTimeout(timer);
      btns.forEach((b) => { const bar = $("em", b); bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; });
      if (!reduce && !paused && !document.hidden) timer = setTimeout(() => show(cur + 1), DUR);
    }
    function show(i) {
      const first = cur < 0;
      cur = (i + slides.length) % slides.length;
      load(cur); load((cur + 1) % slides.length);
      els.forEach((el, k) => el.classList.toggle("is-on", k === cur));
      btns.forEach((b, k) => { b.classList.toggle("is-on", k === cur); b.setAttribute("aria-selected", String(k === cur)); });
      place.textContent = slides[cur].place;
      if (first) { line.innerHTML = text(cur); line.classList.add("is-in"); }
      else { line.classList.remove("is-in"); setTimeout(() => { line.innerHTML = text(cur); line.classList.add("is-in"); }, 280); }
      restart();
    }
    btns.forEach((b, k) => b.addEventListener("click", () => show(k)));
    // Hold the slide while someone is reading or typing in the hero
    hero.addEventListener("mouseenter", () => { paused = true; clearTimeout(timer); nav.classList.add("is-paused"); });
    hero.addEventListener("mouseleave", () => { paused = false; nav.classList.remove("is-paused"); restart(); });
    hero.addEventListener("focusin", () => { paused = true; clearTimeout(timer); nav.classList.add("is-paused"); });
    hero.addEventListener("focusout", () => { if (!hero.matches(":hover")) { paused = false; nav.classList.remove("is-paused"); restart(); } });
    document.addEventListener("visibilitychange", () => (document.hidden ? clearTimeout(timer) : restart()));
    onCity.push(() => { line.innerHTML = text(cur); });
    show(0);
  }

  // ---------- Filter sentence: inline selects as wide as the chosen word ----------
  const fitSelect = (sel) => {
    if (!sel || !sel.selectedOptions[0]) return;
    const cs = getComputedStyle(sel), m = document.createElement("span");
    m.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${cs.font};letter-spacing:${cs.letterSpacing}`;
    m.textContent = sel.selectedOptions[0].text;
    document.body.appendChild(m);
    sel.style.width = `${Math.ceil(m.getBoundingClientRect().width) + parseFloat(cs.paddingRight) + 2}px`;
    m.remove();
  };
  const inlineSelects = ["#dep-select", "#f-month", "#tour-sort"].map((q) => $(q)).filter(Boolean);
  const fitAll = () => inlineSelects.forEach(fitSelect);
  inlineSelects.forEach((sel) => sel.addEventListener("change", () => fitSelect(sel)));
  $("#tour-filters")?.addEventListener("reset", () => setTimeout(fitAll));
  onCity.push(() => requestAnimationFrame(fitAll));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fitAll);
  fitAll();

  // ---------- Live countdowns (offer end and departures) ----------
  function tick() {
    const now = Date.now();
    $$(".cd[data-until]").forEach((el) => {
      if (!el.dataset.until) return;
      const ms = new Date(el.dataset.until) - now;
      if (ms <= 0) { el.textContent = "Departed"; return; }
      const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
      el.innerHTML = `${pad(d)}<small>d</small> : ${pad(h)}<small>h</small> : ${pad(m)}<small>m</small> : ${pad(s)}<small>s</small>`;
    });
  }
  setInterval(tick, 1000);

  // ---------- Festive offer + next departures from the visitor's city ----------
  const P = D.promo;
  if (P && $("#offer")) {
    $("#offer-tag").textContent = P.tag;
    $("#offer-title").textContent = P.title;
    $("#offer-detail").textContent = P.detail;
    $("#offer-note").textContent = P.note;
    $("#offer-cd").dataset.until = P.ends;
    $("#offer-cta").addEventListener("click", () => window.ejFilterCategory && window.ejFilterCategory(P.cat));
  }
  function renderDepartures() {
    const list = $("#offer-deps");
    if (!list) return;
    const now = Date.now();
    const next = (D.schedule || [])
      .map((d) => ({ ...d, t: D.tours.find((x) => x.name === d.name), at: new Date(`${d.date}T06:00:00+05:30`) }))
      .filter((d) => d.t && d.at > now)
      .sort((a, b) => a.at - b.at)
      .slice(0, 3);
    list.innerHTML = next.map((d) => `<li class="dep-cd">
        <div class="dep-cd__main"><strong>${esc(city)} → ${esc(d.t.loc.split(",")[0])}</strong><span>${esc(d.name)} · ${esc(d.t.dur)}</span></div>
        <div class="dep-cd__timer"><span>Leaves in</span><b class="cd" data-until="${d.at.toISOString()}"></b></div>
        <div class="dep-cd__meta">${d.guaranteed ? '<em class="tag-guarantee">Guaranteed departure</em>' : ""}<span class="${d.seats <= 4 ? "is-low" : ""}">${d.seats <= 4 ? `Only ${d.seats} seats left at this price` : `${d.seats} seats left`}</span></div>
        <button class="btn btn--primary dep-cd__book" type="button" data-modal="book" data-topic="${esc(d.name)} · ${d.date} · from ${esc(city)}">Book</button>
      </li>`).join("");
    tick();
  }
  onCity.push(renderDepartures);
  renderDepartures();

  // ---------- Family voice: traveller stories as chats, reels, voice notes and posts ----------
  const wall = $("#ugc-wall");
  function renderUgc() {
    if (!wall || !D.ugc) return;
    const c = (t) => esc(t).replace(/\{city\}/g, esc(city));
    const by = (u) => `<p class="ugc__by"><b>${esc(u.who)}</b> · ${esc(u.city)}${u.trip ? ` <span>${esc(u.trip)}</span>` : ""}</p>`;
    const card = (u) => {
      if (u.type === "chat") return `<article class="ugc__card ugc__card--chat"><header><i aria-hidden="true">←</i><b>${esc(u.title)}</b><span>Maa, Papa, Didi, You</span></header>
        <div class="chat">${u.msgs.map(([side, name, text, time]) => `<p class="chat__msg chat__msg--${side}">${name ? `<em>${esc(name)}</em>` : ""}${c(text)}<time>${time}${side === "me" ? " ✓✓" : ""}</time></p>`).join("")}</div></article>`;
      if (u.type === "reel") return `<article class="ugc__card ugc__card--reel"><video muted loop playsinline preload="none" data-src="${u.video}" aria-label="Traveller video"></video>
        <div class="reel__ui"><p class="reel__text">${c(u.text)}</p>${by(u)}<span class="reel__likes" aria-label="${esc(u.likes)} likes">♥ ${esc(u.likes)}</span></div></article>`;
      if (u.type === "voice") return `<article class="ugc__card ugc__card--voice"><div class="voice"><span class="voice__play" aria-hidden="true">▶</span><span class="voice__wave" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => `<i style="height:${6 + Math.round(Math.abs(Math.sin(i * 1.7)) * 18)}px"></i>`).join("")}</span><span class="voice__len">${esc(u.length)}</span></div>
        <p class="ugc__text">“${c(u.text)}”</p><p class="ugc__by"><b>${esc(u.who)}’s voice note</b> · ${esc(u.city)}</p></article>`;
      if (u.type === "photo") return `<article class="ugc__card ugc__card--photo"><div class="polaroid"><i style="background-image:url(img/${u.img}.jpg)"></i><p>${c(u.text)}</p></div>${by(u)}</article>`;
      if (u.type === "note") return `<article class="ugc__card ugc__card--note"><span class="stars" aria-label="${u.stars} out of 5">${"★".repeat(u.stars)}</span><p class="ugc__text">“${c(u.text)}”</p>${by(u)}</article>`;
      return `<article class="ugc__card ugc__card--post"><p class="ugc__text">${c(u.text)}</p>${by(u)}</article>`;
    };
    // First paint builds every card; after a city change only the city-specific text is redrawn,
    // so the video in the reel card keeps playing
    // Three columns: chat + rating, the reel, voice note + post
    const COLS = [["chat", "note"], ["reel"], ["voice", "post"]];
    if (!wall.children.length) wall.innerHTML = COLS.map((types) => `<div class="ugc__col">${types.map((t) => D.ugc.filter((u) => u.type === t).map(card).join("")).join("")}</div>`).join("");
    else {
      const chat = D.ugc.find((u) => u.type === "chat"), el = $(".ugc__card--chat", wall);
      if (chat && el) el.outerHTML = card(chat);
    }
    const lounge = (D.lounges || []).find((l) => l.city === city);
    const sub = $("#ugc-sub");
    if (sub) sub.textContent = `Every tour starts at a LocalStart Lounge in your own town${lounge ? `. In ${city}, that’s ${lounge.partner}` : ""}, so the holiday begins with chai, not a 4 am bus.`;
  }
  renderUgc();
  onCity.push(renderUgc);

  // ---------- Video clips: load near the viewport, play only while visible ----------
  const vids = $$(".clip video, .ugc video");
  vids.forEach((v) => {
    const start = +v.dataset.start || 0, end = +v.dataset.end || 0;
    if (start || end) {
      v.addEventListener("loadedmetadata", () => { v.currentTime = start; });
      v.addEventListener("timeupdate", () => { if (end && v.currentTime >= end) v.currentTime = start; });
      v.addEventListener("ended", () => { v.currentTime = start; v.play().catch(() => {}); });
    }
  });
  const near = new IntersectionObserver((entries) => entries.forEach((en) => {
    const v = en.target;
    if (en.isIntersecting && !v.src) { v.src = v.dataset.src; v.preload = "auto"; if (reduce) v.controls = true; }
  }), { rootMargin: "400px 0px" });
  const seen = new IntersectionObserver((entries) => entries.forEach((en) => {
    const v = en.target;
    v.dataset.visible = en.isIntersecting ? "1" : "";
    if (reduce) return;
    if (en.isIntersecting) v.play().catch(() => {}); else v.pause();
  }), { threshold: 0.35 });
  // A clip that came into view before it had loaded starts as soon as it can
  vids.forEach((v) => v.addEventListener("canplay", () => { if (!reduce && v.dataset.visible && v.paused) v.play().catch(() => {}); }));
  vids.forEach((v) => { near.observe(v); seen.observe(v); });

  // ---------- Calculator drawer: opened from the floating button ----------
  const drawer = $("#calc"), fab = $("#calc-open");
  if (drawer && fab) {
    let lastFocus = null;
    const open = () => {
      lastFocus = document.activeElement;
      drawer.hidden = false;
      requestAnimationFrame(() => drawer.classList.add("is-open"));
      window.ejLenis && window.ejLenis.stop();
      setTimeout(() => $("#calc-tour")?.focus(), 250);
    };
    const close = () => {
      drawer.classList.remove("is-open");
      window.ejLenis && window.ejLenis.start();
      setTimeout(() => { drawer.hidden = true; }, 300);
      lastFocus && lastFocus.focus && lastFocus.focus();
    };
    fab.addEventListener("click", open);
    $$("[data-calc-open]").forEach((b) => b.addEventListener("click", open));
    drawer.addEventListener("click", (e) => { if (e.target.closest("[data-calc-close]")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !drawer.hidden) close(); });
    // Booking from the calculator: step aside so the booking form is on top
    $("#calc-cta")?.addEventListener("click", () => setTimeout(close, 0));
    // The button appears once the visitor is past the hero
    const showFab = () => fab.classList.toggle("is-shown", scrollY > innerHeight * 0.6);
    addEventListener("scroll", showFab, { passive: true });
    showFab();
  }

  // ---------- All-inclusive price calculator ----------
  const form = $("#calc-form");
  if (form) {
    const tourSel = $("#calc-tour"), citySel = $("#calc-city"), R = D.pricing;
    const n = { adults: 2, kids: 0, infants: 0 };
    tourSel.innerHTML = D.tours.map((t) => `<option value="${esc(t.name)}">${esc(t.name)} · ${esc(t.dur)}</option>`).join("");
    const fillCities = () => {
      const src = $("#dep-select");
      citySel.innerHTML = src && src.options.length ? src.innerHTML : `<option>${esc(city)}</option>`;
      if ([...citySel.options].some((o) => o.value === city)) citySel.value = city;
    };
    const spiritual = (t) => (t.themes || []).includes("Spiritual & Wellness");
    function calc() {
      const t = D.tours.find((x) => x.name === tourSel.value) || D.tours[0];
      const from = citySel.value || city, paying = n.adults + n.kids;
      $("#calc-adults").textContent = n.adults; $("#calc-kids").textContent = n.kids; $("#calc-infants").textContent = n.infants;
      const childPrice = Math.round(t.price * R.childShare);
      const promoOn = P && new Date(P.ends) > Date.now() && spiritual(t) && paying >= 2;
      const disc = promoOn ? P.perFamily : 0;
      const total = t.price * n.adults + childPrice * n.kids - disc;
      const row = (label, sub, val, cls = "") => `<li class="${cls}"><span><b>${label}</b>${sub ? `<small>${sub}</small>` : ""}</span><span class="val">${val}</span></li>`;
      $("#calc-lines").innerHTML = [
        row(`${n.adults} adult${n.adults === 1 ? "" : "s"} × ${rupee(t.price)}`, esc(t.name), rupee(t.price * n.adults)),
        n.kids ? row(`${n.kids} child${n.kids === 1 ? "" : "ren"} × ${rupee(childPrice)}`, "Ages 5–11", rupee(childPrice * n.kids)) : "",
        n.infants ? row(`${n.infants} infant${n.infants === 1 ? "" : "s"}`, "Under 5, no seat or bed", "Free") : "",
        ...R.included.map(([name, sub], i) => row(esc(name), i === 0 ? `Coach from the ${esc(from)} lounge and back` : esc(sub), "Included", "is-inc")),
        disc ? row(esc(P.tag), esc(`${P.title} ${P.detail}`), `− ${rupee(disc)}`, "is-off") : "",
      ].join("");
      $("#calc-total").textContent = rupee(total);
      $("#calc-small").textContent = `${rupee(total / paying)} per paying traveller, and nothing is added later.`;
      $("#calc-cta").dataset.topic = `${t.name} · ${n.adults} adult${n.adults === 1 ? "" : "s"}${n.kids ? `, ${n.kids} child${n.kids === 1 ? "" : "ren"}` : ""}${n.infants ? `, ${n.infants} infant${n.infants === 1 ? "" : "s"}` : ""} · from ${from} · ${rupee(total)}`;
    }
    form.addEventListener("click", (e) => {
      const b = e.target.closest("[data-step]");
      if (!b) return;
      const [k, dv] = b.dataset.step.split(":");
      n[k] = Math.max(k === "adults" ? 1 : 0, Math.min(12, n[k] + Number(dv)));
      calc();
    });
    form.addEventListener("change", calc);
    onCity.push(() => { if ([...citySel.options].some((o) => o.value === city)) citySel.value = city; calc(); });
    fillCities(); calc();
  }
})();
