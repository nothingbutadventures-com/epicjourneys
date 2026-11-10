(() => {
  const D = window.EJ;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const img = (k) => (/^(https?:)?\/\/|^\//.test(k) ? k : `img/${k}.jpg?v=2`);

  // ---------- Storage (per-browser conveniences only) ----------
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  // ---------- Currency ----------
  // All prices are in Indian rupees
  const fmt = (inr) => "₹" + Number(inr).toLocaleString("en-IN");
  const price = (inr) => `<b data-price="${inr}">${fmt(inr)}</b>`;
  function updatePrices() { $$("[data-price]").forEach((el) => (el.textContent = fmt(el.dataset.price))); }

  // ---------- Language switch (English / हिंदी) ----------
  // Remembers the choice (same "ej_lang" key the tour page reads), so tour pages open in Hindi.
  // Choosing a language reloads the page so js/i18n.js can redraw it in that language.
  const langBtns = $$(".lang-switch [data-lang]");
  const setLangUI = (l) => langBtns.forEach((b) => { const on = b.dataset.lang === l; b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on)); });
  setLangUI(store.get("ej_lang", "en"));
  langBtns.forEach((b) => b.addEventListener("click", () => {
    const l = b.dataset.lang;
    if (l === store.get("ej_lang", "en")) return;
    store.set("ej_lang", l); location.reload();
  }));

  // ---------- Toast ----------
  let toastTimer;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 4000); // M3 snackbar: 4–10 s
  }

  // ---------- Tour catalogue (for search, modals, recently viewed) ----------
  const catalogue = [];
  const addTour = (t) => { if (!catalogue.some((c) => c.name === t.name)) catalogue.push(t); return t; };
  D.tours.forEach((t) => addTour({ ...t, meta: `${t.dur} · ${t.loc}`, tags: `${t.loc} ${t.city} ${t.themes.join(" ")} ${(t.for || []).join(" ")}${t.off ? " Sale" : ""}` }));
  Object.keys(D.regions).forEach((k) => D.regions[k].forEach((r) => addTour({ name: `${r.name} Tours`, img: r.img, price: r.from, meta: `${r.tours} tour${r.tours > 1 ? "s" : ""} · ${r.note}`, tags: `${r.name} ${r.note}`, region: true, filter: r.name })));
  const byName = (n) => catalogue.find((t) => t.name === n);

  // ---------- Cards ----------
  const wishes = new Set(store.get("ej_wish", []));
  // Tour card, from the Figma design (948:925): photo, save button, sale tag,
  // title, uppercase meta, then price and a "View tours" button under a rule.
  const heart = '<svg class="ico-line ico-line--wishlist-heart" viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M28.0006 47.2457C17.5006 40.2457 7.5 30.5 7 22C6.99948 19 7.45826 16.3429 8.81204 13.9225C10.1658 11.5021 12.4256 9.71866 15.0944 8.96445C17.7631 8.21024 20.6222 8.54708 23.0426 9.90085C25.463 11.2546 27.2464 13.5145 28.0006 16.1832C28.7548 13.5145 30.5383 11.2546 32.9587 9.90085C35.3791 8.54708 38.2381 8.21024 40.9069 8.96445C43.5756 9.71866 45.8354 11.5021 47.1892 13.9225C48.543 16.3429 49 17.5 49 21C49 31.5 38.5006 40.2457 28.0006 47.2457Z" stroke-dasharray="118 6 400 6"/><path class="a" d="M14.8745 21C14.857 19.7467 15.2885 18.5286 16.0909 17.5657C16.8933 16.6028 18.0137 15.9588 19.2495 15.75"/><path class="a" d="M46.375 4.375V8.75M44.1875 6.5625H48.5625M50.75 13.125H53.375"/></svg>';
  // Next upcoming departure of a tour (sample schedule), for the badges on its card
  const nextDeparture = (name) => (D.schedule || [])
    .filter((d) => d.name === name && new Date(`${d.date}T06:00:00+05:30`) > Date.now())
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const shieldTick = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 5 6v5c0 4.4 3 8.2 7 10 4-1.8 7-5.6 7-10V6l-7-3Z"/><path d="m8.8 12.2 2.3 2.3 4.3-4.6"/></svg>';
  function card(t, { cta = "View tour", sub = "per person" } = {}) {
    const dep = t.region ? null : nextDeparture(t.name);
    return `<article class="card" data-tour="${t.name}">
      <div class="card__media">
        <div class="card__img"><i class="card__pic" style="background-image:url(${img(t.img)})"></i></div>
        <button class="card__wish ${wishes.has(t.name) ? "on" : ""}" data-wish="${t.name}" aria-label="Save ${t.name}">${heart}</button>
        ${t.off ? `<span class="card__tag">Sale</span>` : ""}
        ${t.region ? "" : `<span class="kind kind--tour">Tour${t.dur ? ` · ${t.dur}` : ""}</span>`}
        ${dep && dep.guaranteed ? `<span class="card__guarantee" title="This departure will run, whatever the final group size">${shieldTick}Guaranteed departure</span>` : ""}
      </div>
      <div class="card__body">
        <h3 class="card__title" title="${t.name}">${t.name}</h3>
        ${dep ? `<p class="card__seats${dep.seats <= 4 ? " card__seats--low" : ""}"><i aria-hidden="true"></i>${dep.seats <= 4 ? `Only ${dep.seats} seats left` : `${dep.seats} seats left`} on ${new Date(dep.date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>` : ""}
        <p class="card__meta" title="${t.meta}">${t.meta.split(" · ").map((m) => `<span>${m}</span>`).join("")}</p>
        <div class="card__foot">
          <div class="card__price"><small>Starting from</small><span class="card__amount">${price(t.price).replace("<b", "<strong").replace("</b>", "</strong>")}${t.was ? `<s class="card__was" data-price="${t.was}">${fmt(t.was)}</s>` : ""}<span class="card__per">/ ${sub}</span></span></div>
          <button class="card__cta" data-view="${t.name}">${cta}</button>
        </div>
      </div></article>`;
  }

  // ---------- Header: sticky shadow + mega menus ----------
  const header = $("#header");
  addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 10), { passive: true });
  let megaTimer;
  $$(".nav__item[data-mega]").forEach((item) => {
    const menu = $("#mega-" + item.dataset.mega);
    item.addEventListener("mouseenter", () => {
      clearTimeout(megaTimer);
      $$(".mega").forEach((m) => m.classList.toggle("open", m === menu));
      $$(".nav__item").forEach((n) => n.classList.toggle("open", n === item));
      document.body.classList.add("mega-open");
    });
  });
  const closeMega = () => { $$(".mega").forEach((m) => m.classList.remove("open")); $$(".nav__item").forEach((n) => n.classList.remove("open")); document.body.classList.remove("mega-open"); };
  header.addEventListener("mouseleave", () => (megaTimer = setTimeout(closeMega, 150)));
  $$(".nav__item:not([data-mega])").forEach((n) => n.addEventListener("mouseenter", closeMega));
  $$(".mega__col a").forEach((a) => a.addEventListener("click", () => { closeMega(); runSearch(a.textContent.split(" ")[0]); }));

  // ---------- Search ----------
  function runSearch(q, title) {
    const query = (q || "").trim().toLowerCase();
    const words = query.split(/\s+/).filter(Boolean);
    const hits = query
      ? catalogue.filter((t) => !t.region && words.every((w) => `${t.name} ${t.tags || ""} ${t.meta}`.toLowerCase().includes(w)))
      : catalogue.filter((t) => !t.region).slice(0, 8);
    $("#results-title").innerHTML = title || (query ? `${hits.length} result${hits.length === 1 ? "" : "s"} for <em>“${q}”</em>` : "Popular tours <em>for you</em>");
    $("#results-grid").innerHTML = hits.length ? hits.slice(0, 12).map((t) => card(t)).join("")
      : `<div class="empty">No tours match “${q}” yet. <button class="link" data-modal="enquire" data-topic="${q}">Ask an expert to plan it →</button></div>`;
    $("#results-note").hidden = true;
    $("#results-request").hidden = true;
    $("#results").hidden = false;
    $("#results").scrollIntoView({ behavior: "smooth" });
  }
  // One search field. Empty and focused, it offers a single "Near you" option
  // that asks for the visitor's location and lists tours by distance from
  // them. Typing shows matching tours and places instead.
  const searchForm = $("#search"), searchInput = $("#search [name=q]"), drop = $("#search-drop");
  const pin = '<svg class="ico-line ico-line--location-pin" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="a" d="M32 40s-10-9.5-10-18a10 10 0 0 1 20 0c0 8.5-10 18-10 18z"/><circle class="a" cx="32" cy="22" r="3.6"/><path d="M8 47l14-5 20 5 14-5v11l-14 5-20-5-14 5z"/><path d="M22 42v11M42 47v11"/><path d="M14 36h6M44 36h6" stroke-dasharray="0.1 4"/></svg>';
  function showDrop(html) { drop.innerHTML = html; drop.hidden = false; searchInput.setAttribute("aria-expanded", "true"); }
  function hideDrop() { drop.hidden = true; searchInput.setAttribute("aria-expanded", "false"); }
  const nearOption = (sub = "Enable location to see tours starting near you") =>
    `<button type="button" class="drop__item drop__item--near" data-near role="option">${pin}<span><strong>Near you</strong><small>${sub}</small></span><i aria-hidden="true">›</i></button>`;
  function updateDrop() {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return showDrop(nearOption());
    const words = q.split(/\s+/);
    const hits = catalogue.filter((t) => words.every((w) => `${t.name} ${t.tags || ""} ${t.meta}`.toLowerCase().includes(w))).slice(0, 5);
    // Typed a town? Offer "Tours from <town>" first.
    const from = q.length > 1 ? places.filter((p) => p.name.toLowerCase().startsWith(q)).slice(0, 2) : [];
    const fromItems = from.map((p) => `<button type="button" class="drop__item drop__item--near" data-from="${p.name}" role="option">${pin}<span><strong>Tours from ${p.name}</strong><small>${departsFrom(p).length ? `${departsFrom(p).length} tour${departsFrom(p).length > 1 ? "s" : ""} depart from here` : "No departures here yet: see the nearest ones"}</small></span><i aria-hidden="true">›</i></button>`).join("");
    showDrop(fromItems + (hits.length
      ? hits.map((t) => `<button type="button" class="drop__item" data-pick="${t.name}" role="option"><span><strong>${t.name}</strong><small>${t.meta}</small></span><i aria-hidden="true">›</i></button>`).join("")
      : from.length ? "" : `<p class="drop__note">No tours match “${searchInput.value.trim()}”. Press Search to ask our team.</p>`));
  }
  searchInput.addEventListener("focus", updateDrop);
  searchInput.addEventListener("input", updateDrop);
  searchInput.addEventListener("keydown", (e) => { if (e.key === "Escape") { hideDrop(); searchInput.blur(); } });
  // A clicked dropdown item may already be replaced (e.g. "Near you"), so a
  // detached target doesn't count as a click outside.
  document.addEventListener("click", (e) => { if (e.target.isConnected && !searchForm.contains(e.target)) hideDrop(); });
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault(); hideDrop();
    const p = findPlace(searchInput.value);
    p ? showFrom(p) : runSearch(searchInput.value);
  });
  drop.addEventListener("click", (e) => {
    const from = e.target.closest("[data-from]");
    if (from) { hideDrop(); searchInput.value = from.dataset.from; return showFrom(findPlace(from.dataset.from)); }
    const pick = e.target.closest("[data-pick]");
    if (pick) {
      const t = byName(pick.dataset.pick); hideDrop();
      if (t.region) { searchInput.value = t.filter; return runSearch(t.filter); }
      searchInput.value = t.name; return openModal("tour", t.name);
    }
    if (e.target.closest("[data-near]")) findNearMe();
  });
  // Nearest LocalStart Lounge to a point, with its distance (lounge finder)
  const nearestLounge = (pt) => D.lounges.map((l) => ({ ...l, km: kmBetween(pt, l) })).sort((a, b) => a.km - b.km)[0];

  // Distance in km between two points on the globe
  function kmBetween(a, b) {
    const R = 6371, rad = (d) => d * Math.PI / 180;
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(h)));
  }
  function locate(done, fail) {
    if (!navigator.geolocation) return fail({ code: 0 });
    navigator.geolocation.getCurrentPosition((pos) => done({ lat: pos.coords.latitude, lng: pos.coords.longitude }), fail,
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 });
  }
  const locError = (err) => err.code === 1 ? "Location is blocked. Allow it for this site in your browser settings, or type a place."
    : err.code === 0 ? "Location isn't available in this browser. Type a place instead." : "Couldn't find your location. Try again, or type a place.";
  function findNearMe() {
    showDrop(`<p class="drop__note drop__note--busy">${pin}Finding your location…</p>`);
    locate((me) => {
      // Within 40 km of a known town, treat the visitor as being in it;
      // otherwise work from their exact position.
      const here = places.map((p) => ({ ...p, km: kmBetween(me, p) })).sort((a, b) => a.km - b.km)[0];
      nearDrop(here.km <= 40 ? here : { name: "", ...me });
    }, (err) => showDrop(nearOption(locError(err))));
  }
  // "Near you" answers inside the dropdown: tours from the visitor's town,
  // or, if none depart there, the nearest ones and a way to ask for it.
  function nearDrop(place) {
    const label = place.name || "you";
    if (place.name) $(".utility__left a").innerHTML = `📍 Near ${place.name}${place.state ? `, ${place.state}` : ""} · <u>Change</u>`;
    const own = departsFrom(place);
    const tours = (own.length ? own : D.tours).map((t) => ({ t, km: kmBetween(place, cityXY[t.city]) })).sort((a, b) => a.km - b.km).slice(0, 5);
    const item = ({ t, km: d }) => `<button type="button" class="drop__item" data-pick="${t.name}" role="option"><span><strong>${t.name}</strong><small>Departs ${t.city} · ${km(d)} km from ${label} · ${t.dur} · from ${fmt(t.price)}</small></span><i aria-hidden="true">›</i></button>`;
    const nearest = [...new Set(tours.map((x) => x.t.city))].slice(0, 2).map((c) => `${c} (${km(kmBetween(place, cityXY[c]))} km)`).join(", ");
    showDrop(own.length
      ? `<p class="drop__head">Departing from ${place.name}</p>${tours.map(item).join("")}`
      : `<p class="drop__note">${pin}<span>No departures from ${place.name || "your location"} yet. Nearest: ${nearest}.</span></p>
         <p class="drop__head">Nearest tours to ${place.name || "you"}</p>${tours.map(item).join("")}
         <button type="button" class="drop__item drop__item--request" data-modal="enquire" data-topic="Departures from ${place.name || "my town"}" role="option"><span><strong>Request departures from ${place.name || "your town"}</strong><small>Tell us, and we'll let you know when tours start near you</small></span><i aria-hidden="true">›</i></button>`);
  }

  // ---------- Departures from a place ----------
  // Places a visitor can start from: LocalStart Lounge towns plus the
  // departure cities. A place with no departures of its own gets the nearest
  // departure cities instead, and a form to ask for departures from there.
  const places = [
    ...D.lounges.map((l) => ({ name: l.city, state: l.state, lat: l.lat, lng: l.lng })),
    ...D.cities.filter((c) => !D.lounges.some((l) => l.city === c.name)).map((c) => ({ name: c.name, lat: c.lat, lng: c.lng })),
  ];
  const findPlace = (q) => {
    const s = (q || "").trim().toLowerCase();
    return s && places.find((p) => p.name.toLowerCase() === s || p.name.toLowerCase().replace(/\s*\(.*\)$/, "") === s);
  };
  const departsFrom = (p) => D.tours.filter((t) => t.city === p.name);
  const km = (n) => n.toLocaleString("en-IN");
  function showFrom(place, viaLocation) {
    const label = place.name || "your location";
    const own = departsFrom(place);
    const cityKm = Object.fromEntries(D.cities.map((c) => [c.name, kmBetween(place, c)]));
    const nearest = [...D.cities].filter((c) => c.name !== place.name).sort((a, b) => cityKm[a.name] - cityKm[b.name]);
    if (place.name) $(".utility__left a").innerHTML = `📍 Near ${place.name}${place.state ? `, ${place.state}` : ""} · <u>Change</u>`;
    if (own.length) {
      runSearch("", `Tours departing from <em>${label}</em>`);
      $("#results-grid").innerHTML = own.map((t) => card({ ...byName(t.name), meta: `Departs ${t.city} · ${t.dur}` })).join("");
      if (viaLocation) toast(`Showing tours departing from ${label}`);
      return;
    }
    const tours = D.tours.map((t) => ({ ...byName(t.name), km: cityKm[t.city] })).sort((a, b) => a.km - b.km)
      .map((t) => ({ ...t, meta: `Departs ${t.city} · ${km(t.km)} km from ${place.name || "you"} · ${t.dur}` }));
    runSearch("", place.name ? `No departures from <em>${label}</em> yet` : `No departures <em>near you</em> yet`);
    $("#results-grid").innerHTML = tours.map((t) => card(t)).join("");
    const note = $("#results-note");
    note.innerHTML = `<b>Nearest departures to ${label}:</b> ${nearest.slice(0, 3).map((c) => `${c.name} (${km(cityKm[c.name])} km)`).join(", ")}. The tours below are sorted by distance from ${label}.`;
    note.hidden = false;
    const req = $("#results-request");
    req.innerHTML = `<div class="request__text">
        <span class="request__eyebrow">${pin}Not near you yet</span>
        <h3>Want tours to start from <em>${place.name || "your town"}</em>?</h3>
        <p>Tell us where you live and where you'd like to go. When enough travellers from a town ask, we open a LocalStart pickup there, and we'll let you know first.</p>
      </div>
      <form class="mform request__form" id="request-form" novalidate>
        <input name="name" placeholder="Your name" autocomplete="name">
        <input name="phone" placeholder="Mobile number" inputmode="numeric" maxlength="10" autocomplete="tel-national">
        <input name="city" placeholder="Your town or city" value="${place.name}" autocomplete="address-level2">
        <select name="dest"><option value="">Where would you like to go? (optional)</option>${D.tours.map((t) => `<option>${t.loc}</option>`).filter((o, i, a) => a.indexOf(o) === i).join("")}<option>Anywhere, show me options</option></select>
        <button class="btn btn--accent">Request departures from ${place.name || "my town"}</button>
        <p class="form-msg" id="request-msg" role="status"></p>
      </form>`;
    req.hidden = false;
    if (viaLocation) toast(`No departures from ${label} yet. Showing the nearest: ${nearest[0].name}`);
  }
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "request-form") return;
    e.preventDefault(); const f = e.target;
    if (!check(f, { name: (v) => v.length > 1, phone: validPhone, city: (v) => v.length > 1 }))
      return msg($("#request-msg"), "Please fill in the highlighted fields. The phone number should be a 10-digit Indian mobile number.", false);
    const city = f.elements.city.value.trim();
    msg($("#request-msg"), `Thanks ${f.elements.name.value.split(" ")[0]}! We've noted your request for departures from ${city} and will message +91 ${f.elements.phone.value} when they open. (Preview: nothing is sent.)`, true);
    f.querySelectorAll("input, select, button").forEach((el) => (el.disabled = true));
  });
  $("#results-clear").addEventListener("click", () => { $("#results").hidden = true; $("#search").reset(); window.ejLenis ? window.ejLenis.scrollTo(0) : scrollTo({ top: 0, behavior: "smooth" }); });

  // ---------- A day on tour: numbered tabs that advance on their own ----------
  const otTabs = $$(".ontour__tab"), otPanels = $$(".ontour__panel"), otBgs = $$(".ontour__bg");
  let otIndex = 0, otTimer = null;
  function showOnTour(i) {
    otIndex = i;
    otTabs[i].classList.remove("on"); void otTabs[i].offsetWidth; // restart the progress bar
    [otTabs, otPanels, otBgs].forEach((set) => set.forEach((el, j) => el.classList.toggle("on", j === i)));
    otTabs.forEach((t, j) => t.setAttribute("aria-selected", String(j === i)));
    clearTimeout(otTimer);
    otTimer = setTimeout(() => showOnTour((otIndex + 1) % otTabs.length), 7000);
  }
  otTabs.forEach((t) => t.addEventListener("click", () => showOnTour(+t.dataset.i)));
  // Only start the timer once the section is on screen
  new IntersectionObserver((en, obs) => { if (en[0].isIntersecting) { showOnTour(0); obs.disconnect(); } }, { threshold: 0.4 }).observe($("#ontour"));

  // ---------- Blog ----------
  $("#blog-grid").innerHTML = D.blog.map((b) => `<article class="post" data-modal="post" data-topic="${b.title}" tabindex="0">
      <div class="post__img"><i class="post__pic" style="background-image:url(${img(b.img)})"></i></div>
      <div class="post__body"><span class="post__tag">${b.tag} · ${b.read} min read</span>
        <h3 class="post__title">${b.title}</h3><p class="post__excerpt">${b.excerpt}</p>
        <span class="post__more">Read guide <i>→</i></span></div></article>`).join("");

  // ---------- Recently viewed ----------
  function renderRecent() {
    const recent = store.get("ej_recent", []).map(byName).filter(Boolean).slice(0, 4);
    $("#continue").hidden = recent.length === 0;
    $("#continue-row").innerHTML = recent.map((t) => `
      <a class="mini" data-view="${t.name}"><div class="mini__img" style="background-image:url(${img(t.img)})"></div>
      <div><strong>${t.name}</strong><span>${t.dur ? t.dur + " · " : ""}${price(t.price)} /person</span><em>Continue →</em></div></a>`).join("");
  }
  function addRecent(name) {
    const list = [name, ...store.get("ej_recent", []).filter((n) => n !== name)].slice(0, 8);
    store.set("ej_recent", list); renderRecent();
  }
  $("#recent-clear").addEventListener("click", () => { store.set("ej_recent", []); renderRecent(); toast("History cleared"); });

  // ---------- Stats count-up ----------
  const countObs = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const el = en.target, end = +el.dataset.count, start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / 1400), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = (el.dataset.prefix || "") + v.toLocaleString("en-IN") + el.dataset.suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step); countObs.unobserve(el);
  }), { threshold: 0.5 });
  $$("[data-count]").forEach((el) => countObs.observe(el));

  // ---------- Cities ----------
  D.cities.forEach((c) => {
    const ts = D.tours.filter((t) => t.city === c.name);
    c.tours = ts.length; c.from = Math.min(...ts.map((t) => t.price));
  });
  // ---------- Popular tours near you: filters + results ----------
  // Tours are sorted by distance from the visitor's city (picker, "Use my
  // location", or the last choice saved in this browser) and can be filtered
  // by destination, type of trip, length, budget, month and sale.
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthLabel = (m) => `${MONTHS[+m.slice(5) - 1]} ${m.slice(0, 4)}`;
  const cityXY = Object.fromEntries(D.cities.map((c) => [c.name, c]));
  const loungeStates = [...new Set(D.lounges.map((l) => l.state))];
  $("#dep-select").innerHTML = loungeStates.map((st) => `<optgroup label="${st}">${D.lounges.filter((l) => l.state === st)
    .map((l) => `<option value="${l.city}">${l.city}</option>`).join("")}</optgroup>`).join("");
  const CATS = [
    ["spiritual", "Spiritual & pilgrimage", (t) => t.themes.includes("Spiritual & Wellness")],
    ["women", "Women's special", (t) => (t.for || []).includes("Women's Special")],
    ["culture", "Cultural wonders", (t) => t.themes.includes("Heritage & Culture")],
    ["adventure", "Easy adventures", (t) => t.themes.includes("Adventure & Thrill")],
    ["family", "Family", (t) => (t.for || []).includes("Family")],
    ["beach", "Beach & leisure", (t) => t.themes.includes("Coastal & Beach Leisure")],
  ];
  const LENS = [["", "Any length"], ["short", "Up to 4 days"], ["long", "5 days or more"]];
  const BUDGETS = [["", "Any budget"], ["lt10", "Under ₹10,000"], ["10to15", "₹10,000 – ₹15,000"], ["gt15", "Over ₹15,000"]];
  const days = (t) => parseInt(t.dur, 10);
  const inBudget = (p, b) => !b || (b === "lt10" ? p < 10000 : b === "10to15" ? p >= 10000 && p <= 15000 : p > 15000);
  const tourStates = [...new Set(D.tours.map((t) => t.state))];
  const allMonths = [...new Set(D.tours.flatMap((t) => t.months || []))].sort();
  const count = (fn) => D.tours.filter(fn).length;
  $("#f-state").innerHTML = tourStates.map((st) => `<label class="opt"><input type="checkbox" name="state" value="${st}"><span>${st}</span><em>${count((t) => t.state === st)}</em></label>`).join("");
  $("#f-cat").innerHTML = CATS.map(([v, l, fn]) => `<label class="opt"><input type="checkbox" name="cat" value="${v}"><span>${l}</span><em>${count(fn)}</em></label>`).join("");
  $("#f-len").innerHTML = LENS.map(([v, l], i) => `<label class="opt opt--radio"><input type="radio" name="len" value="${v}"${i ? "" : " checked"}><span>${l}</span></label>`).join("");
  $("#f-budget").innerHTML = BUDGETS.map(([v, l], i) => `<label class="opt opt--radio"><input type="radio" name="budget" value="${v}"${i ? "" : " checked"}><span>${l}</span></label>`).join("");
  $("#f-month").insertAdjacentHTML("beforeend", allMonths.map((m) => `<option value="${m}">${monthLabel(m)}</option>`).join(""));
  let fromCity = null;
  // Filter dropdowns: each button shows its current choice ("Any", the one picked, or "3 selected")
  function updateFilterLabels() {
    $$("#tour-filters .fdrop[data-kind]").forEach((d) => {
      const on = $$("input:checked", d), val = $(".fdrop__val", d);
      const first = $("input", d);
      const picked = d.dataset.kind === "one" ? (on[0] && on[0] !== first ? on.map((i) => i.nextElementSibling.textContent) : [])
        : on.map((i) => i.nextElementSibling.textContent);
      const lower = (t) => (d.hasAttribute("data-lower") ? t.charAt(0).toLowerCase() + t.slice(1) : t);
      val.textContent = !picked.length ? (d.dataset.any || "Any") : picked.length === 1 ? lower(picked[0]) : (d.dataset.many || "{n} selected").replace("{n}", picked.length);
      d.classList.toggle("is-set", picked.length > 0);
    });
    $(".fdrop--select").classList.toggle("is-set", !!$("#f-month").value);
  }
  const filtersNow = () => {
    const f = $("#tour-filters");
    return { states: $$("input[name=state]:checked", f).map((i) => i.value), cats: $$("input[name=cat]:checked", f).map((i) => i.value),
      len: f.elements.len.value, budget: f.elements.budget.value, month: $("#f-month").value, sale: $("#f-sale").checked, sort: $("#tour-sort").value };
  };
  function renderTours() {
    const F = filtersNow();
    const list = D.tours.map((t) => ({ t, km: Math.round(kmBetween(fromCity, cityXY[t.city]) * 1.2) }))
      .filter(({ t }) => (!F.states.length || F.states.includes(t.state))
        && (!F.cats.length || F.cats.some((c) => CATS.find((x) => x[0] === c)[2](t)))
        && (!F.len || (F.len === "short" ? days(t) <= 4 : days(t) >= 5))
        && inBudget(t.price, F.budget)
        && (!F.month || (t.months || []).includes(F.month))
        && (!F.sale || t.off));
    const next = (t) => F.month || (t.months || [])[0] || "9999";
    list.sort((a, b) => F.sort === "popular" ? (D.popularity[b.t.name] || 0) - (D.popularity[a.t.name] || 0)
      : F.sort === "price" ? a.t.price - b.t.price : F.sort === "soon" ? next(a.t).localeCompare(next(b.t)) || a.km - b.km : a.km - b.km);
    $("#tour-grid").innerHTML = list.length ? list.map(({ t, km }) => card({ ...byName(t.name),
      meta: [`${km.toLocaleString("en-IN")} km away`, `from ${t.city}`, next(t) !== "9999" ? `${F.month ? "Departs" : "Next"}: ${monthLabel(next(t))}` : ""].filter(Boolean).join(" · ") })).join("")
      : `<div class="tours__empty"><strong>No tours match these filters yet.</strong><span>Try removing a filter, or ask us and we'll plan it from ${fromCity.city}.</span>
         <div><button class="btn btn--primary" type="button" id="tours-clear">Clear filters</button><button class="link" type="button" data-modal="enquire" data-topic="Custom tour from ${fromCity.city}">Ask an expert →</button></div></div>`;
    $("#tour-count").textContent = `${list.length} of ${D.tours.length} tours`;
    // Active filters as removable chips
    const chips = [
      ...F.states.map((v) => [`state:${v}`, v]),
      ...F.cats.map((v) => [`cat:${v}`, CATS.find((x) => x[0] === v)[1]]),
      ...(F.len ? [["len", LENS.find((x) => x[0] === F.len)[1]]] : []),
      ...(F.budget ? [["budget", BUDGETS.find((x) => x[0] === F.budget)[1]]] : []),
      ...(F.month ? [["month", monthLabel(F.month)]] : []),
      ...(F.sale ? [["sale", "On sale"]] : []),
    ];
    $("#tour-chips").innerHTML = chips.map(([k, l]) => `<button type="button" class="fchip" data-chip="${k}">${l}<i aria-hidden="true">×</i><span class="visually-hidden">Remove filter</span></button>`).join("")
      + (chips.length > 1 ? `<button type="button" class="fchip fchip--clear" data-chip="all">Clear all</button>` : "");
    updatePrices();
    updateFilterLabels();
  }
  function setCity(from) {
    fromCity = from;
    $("#dep-city").textContent = from.city;
    $("#dep-sub").textContent = `Tours closest to ${from.city} first. Filter by destination, type of trip, length, budget or month.`;
    if ([...$("#dep-select").options].some((o) => o.value === from.city)) $("#dep-select").value = from.city;
    $(".utility__left a").innerHTML = `📍 Near ${from.city}${from.state ? `, ${from.state}` : ""} · <u>Change</u>`;
    store.set("ej_city", from.city);
    renderTours();
    document.dispatchEvent(new CustomEvent("ej:city", { detail: from }));
  }
  const lounge = (name) => D.lounges.find((l) => l.city === name);
  $("#tour-filters").addEventListener("change", renderTours);
  // Only one filter dropdown open at a time; close on outside click or Escape; single-choice ones close on pick
  const drops = $$("#tour-filters details.fdrop");
  drops.forEach((d) => d.addEventListener("toggle", () => { if (d.open) drops.forEach((o) => o !== d && (o.open = false)); }));
  document.addEventListener("click", (e) => { if (!e.target.closest("#tour-filters details.fdrop")) drops.forEach((d) => (d.open = false)); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") drops.forEach((d) => { if (d.open) { d.open = false; $("summary", d).focus(); } }); });
  $("#tour-filters").addEventListener("change", (e) => { const d = e.target.closest('details.fdrop[data-kind="one"]'); if (d) d.open = false; });
  $("#tour-sort").addEventListener("change", renderTours);
  $("#tour-filters").addEventListener("reset", () => setTimeout(renderTours));
  $("#tour-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-chip]"); if (!b) return;
    const [k, v] = b.dataset.chip.split(":"); const f = $("#tour-filters");
    if (k === "all") return f.reset();
    if (k === "state" || k === "cat") $(`input[name=${k}][value="${CSS.escape(v)}"]`, f).checked = false;
    if (k === "len" || k === "budget") $(`input[name=${k}][value=""]`, f).checked = true;
    if (k === "month") $("#f-month").value = "";
    if (k === "sale") $("#f-sale").checked = false;
    renderTours();
  });
  $("#tour-grid").addEventListener("click", (e) => { if (e.target.closest("#tours-clear")) $("#tour-filters").reset(); });
  // Category cards above jump here with that category selected
  window.ejFilterCategory = (cat) => {
    const f = $("#tour-filters"); f.reset();
    setTimeout(() => { const i = $(`input[name=cat][value="${cat}"]`, f); if (i) i.checked = true; renderTours(); $("#tours").scrollIntoView(); });
  };
  setCity(lounge(store.get("ej_city", "Meerut")) || lounge("Meerut") || D.lounges[0]);
  $("#dep-select").addEventListener("change", (e) => setCity(lounge(e.target.value)));
  $("#dep-locate").addEventListener("click", () => {
    $("#dep-locate").textContent = "Finding you…";
    locate((me) => { const l = nearestLounge(me); setCity(l); $("#dep-locate").textContent = "Use my location"; toast(`Showing tours nearest you, from ${l.city}`); },
      (err) => { $("#dep-locate").textContent = "Use my location"; toast(locError(err)); });
  });
  $$("[data-scroll]").forEach((b) => b.addEventListener("click", () => {
    const tr = document.getElementById(b.dataset.scroll);
    const w = tr.firstElementChild ? tr.firstElementChild.getBoundingClientRect().width + 22 : 300;
    tr.scrollBy({ left: w * +b.dataset.dir, behavior: "smooth" });
  }));

  // ---------- Ongoing tours schedule ----------
  // States on the left filter the departures on the right.
  const sched = D.schedule.map((d) => ({ ...d, tour: D.tours.find((t) => t.name === d.name) })).filter((d) => d.tour)
    .sort((a, b) => a.date.localeCompare(b.date));
  const schedStates = [...new Set(sched.map((d) => d.tour.state))]
    .map((st) => ({ st, n: sched.filter((d) => d.tour.state === st).length })).sort((a, b) => b.n - a.n);
  $("#sched-states").innerHTML = [{ st: "All states", n: sched.length }, ...schedStates].map(({ st, n }, i) =>
    `<button class="sched__state${i ? "" : " on"}" role="tab" aria-selected="${!i}" data-state="${i ? st : ""}"><span>${st}</span><em>${n} departure${n === 1 ? "" : "s"}</em></button>`).join("");
  function renderSchedule(state) {
    const rows = sched.filter((d) => !state || d.tour.state === state);
    $("#sched-rows").innerHTML = rows.map((d) => {
      const dt = new Date(d.date + "T00:00:00"), low = d.seats <= 3;
      return `<li class="sched__row${low ? " sched__row--low" : ""}">
        <time class="sched__date" datetime="${d.date}"><strong>${String(dt.getDate()).padStart(2, "0")}</strong><span>${MONTHS[dt.getMonth()]}</span></time>
        <div class="sched__tour"><strong>${d.name}</strong><span>${d.tour.dur} · from ${d.tour.city} · ${d.tour.state}</span>${d.guaranteed ? `<em class="sched__guarantee">${shieldTick}Guaranteed departure</em>` : ""}</div>
        <div class="sched__seats"><span>${low ? "Filling fast · " : ""}${d.seats} of ${d.of} seats left</span><i role="progressbar" aria-label="Seats booked" aria-valuemin="0" aria-valuemax="${d.of}" aria-valuenow="${d.of - d.seats}"><b style="width:${Math.round((1 - d.seats / d.of) * 100)}%"></b></i></div>
        <div class="sched__price">from <strong>${price(d.tour.price)}</strong></div>
        <button class="btn btn--primary sched__book" data-modal="book" data-topic="${d.name} · ${dt.getDate()} ${MONTHS[dt.getMonth()]}">Book now</button>
      </li>`;
    }).join("");
    $("#sched-count").textContent = `${rows.length} departure${rows.length === 1 ? "" : "s"} · sample dates`;
  }
  $("#sched-states").addEventListener("click", (e) => {
    const b = e.target.closest(".sched__state"); if (!b) return;
    $$(".sched__state").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", String(x === b)); });
    renderSchedule(b.dataset.state);
  });
  renderSchedule("");

  // ---------- Reviews ----------
  // Traveller reviews: rating summary, filters by who travelled, a featured
  // review with its trip photo, then the rest as cards
  (() => {
    const R = D.stories || [], list = $("#rv-list");
    if (!list || !R.length) return;
    const TYPES = [["all", "All travellers"], ["families", "Families"], ["women", "Women's groups"], ["seniors", "Seniors"], ["friends", "Friends & couples"]];
    const stars = (n) => `<span class="rv__stars" aria-label="${n} out of 5">${"★".repeat(n)}<i>${"★".repeat(5 - n)}</i></span>`;
    const initials = (n) => n.replace(/[^A-Za-z &]/g, "").split(/\s+|&/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    const verified = '<span class="rv__verified"><svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M8 1.2 9.9 2.6l2.4-.1.7 2.3 1.9 1.5-.8 2.2.8 2.2-1.9 1.5-.7 2.3-2.4-.1L8 16.8l-1.9-1.4-2.4.1-.7-2.3-1.9-1.5.8-2.2-.8-2.2 1.9-1.5.7-2.3 2.4.1z" fill="currentColor" transform="scale(.94) translate(.5 -.6)"/><path d="m5.3 8.3 1.8 1.8 3.6-3.8" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Verified traveller</span>';
    const meta = (r) => `<p class="rv__trip"><b>${r.town}</b> → ${r.trip}</p><p class="rv__facts">${r.when} · ${r.who} · Picked up ${r.pickup}</p>`;
    const head = (r) => `<header class="rv__head"><span class="rv__avatar" aria-hidden="true">${initials(r.name)}</span><div><strong>${r.name}</strong>${verified}</div>${stars(r.rating)}</header>`;
    // Summary
    const avg = R.reduce((a, r) => a + r.rating, 0) / R.length;
    $("#rv-avg").textContent = avg.toFixed(1);
    $("#rv-stars").innerHTML = "★★★★★";
    $("#rv-stars").style.setProperty("--fill", `${(avg / 5) * 100}%`);
    $("#rv-count").textContent = `Average from ${R.length} reviews`;
    $("#rv-bars").innerHTML = [5, 4, 3, 2, 1].map((n) => { const c = R.filter((r) => r.rating === n).length; return `<li><span>${n} ★</span><i><b style="width:${(c / R.length) * 100}%"></b></i><em>${c}</em></li>`; }).join("");
    // Filters + list
    let current = "all";
    $("#rv-filters").innerHTML = TYPES.map(([k, l]) => { const c = k === "all" ? R.length : R.filter((r) => r.type === k).length; return `<button type="button" role="tab" data-rv="${k}" aria-selected="${k === "all"}">${l} <em>${c}</em></button>`; }).join("");
    function render() {
      const rows = R.filter((r) => current === "all" || r.type === current);
      const [f, ...rest] = rows;
      list.innerHTML = (f ? `<article class="rv__featured">
          <div class="rv__photo" style="background-image:url(${img(f.img)})"><span class="story__pickup">Picked up ${f.pickup}</span></div>
          <div class="rv__body">${head(f)}<h3 class="rv__title">“${f.title}”</h3><p class="rv__text">${f.text}</p>${meta(f)}</div>
        </article>` : "") + (rest.length ? `<div class="rv__grid">${rest.map((r) => `<article class="rv__card">${head(r)}<h3 class="rv__title">“${r.title}”</h3><p class="rv__text">${r.text}</p>${meta(r)}</article>`).join("")}</div>` : "");
    }
    $("#rv-filters").addEventListener("click", (e) => {
      const b = e.target.closest("[data-rv]");
      if (!b) return;
      current = b.dataset.rv;
      $$("#rv-filters [data-rv]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      render();
    });
    render();
  })();

  // ---------- FAQ ----------
  // Native <details>: opening one question closes the others
  $$(".qa2").forEach((d) => d.addEventListener("toggle", () => { if (d.open) $$(".qa2").forEach((o) => { if (o !== d) o.open = false; }); }));

  // ---------- Forms ----------
  const validPhone = (v) => /^[6-9]\d{9}$/.test(v.replace(/\D/g, ""));
  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  // Each invalid field gets its own error line saying how to fix it (Material 3 text-field supporting text)
  const FIX = { name: "Enter your name.", phone: "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.", city: "Enter the town or city you'll travel from.",
    dest: "Enter a place, or type “not sure yet”.", email: "Enter an email like name@example.com." };
  function check(form, rules) {
    let ok = true;
    Object.entries(rules).forEach(([name, test]) => {
      const el = form.elements[name]; const good = test(el.value.trim());
      el.classList.toggle("invalid", !good); if (!good) ok = false;
      el.setAttribute("aria-invalid", String(!good));
      const holder = el.closest(".field") || el.parentElement; let err = holder.querySelector(".field__error");
      if (!good && FIX[name]) {
        if (!err) { err = document.createElement("p"); err.className = "field__error"; err.id = `${el.id || name}-err`; holder.appendChild(err); }
        err.textContent = FIX[name]; el.setAttribute("aria-describedby", err.id);
      } else if (err) { err.remove(); el.removeAttribute("aria-describedby"); }
    });
    return ok;
  }
  function msg(el, text, good) { el.textContent = text; el.className = "form-msg " + (good ? "ok" : "err"); }
  $("#lead-form").addEventListener("submit", (e) => {
    e.preventDefault(); const f = e.target;
    if (!check(f, { name: (v) => v.length > 1, phone: validPhone, city: (v) => v.length > 1, dest: (v) => v.length > 1 }))
      return msg($("#lead-msg"), "Please fill in the highlighted fields. The phone number should be a 10-digit Indian mobile number.", false);
    msg($("#lead-msg"), `Thanks ${f.elements.name.value.split(" ")[0]}! A travel expert will call you on +91 ${f.elements.phone.value} within 24 hours. (Preview: nothing is sent.)`, true); f.reset();
  });
  $("#news-form").addEventListener("submit", (e) => {
    e.preventDefault(); const f = e.target;
    if (!check(f, { email: validEmail })) return msg($("#news-msg"), "Please enter a valid email address.", false);
    msg($("#news-msg"), "You're subscribed! (Preview: nothing is sent.)", true); f.reset();
  });

  // ---------- Modal ----------
  const modal = $("#modal"), body = $("#modal-body");
  // Tours open their product page (tour.html); only entries without one keep the modal
  const tourPage = (name) => Object.keys(D.tourPages || {}).find((k) => D.tourPages[k].name === name) || (D.tours.find((t) => t.name === name) || {}).slug;
  function openModal(type, topic = "") {
    if (type === "tour") {
      const t = byName(topic); addRecent(t.name);
      const page = tourPage(t.name);
      if (page) { location.href = `/tours/${page}`; return; }
      body.innerHTML = `<div class="card__img" style="background-image:url(${img(t.img)});height:200px;border-radius:12px;margin-bottom:18px"></div>
        <h3>${t.name}</h3><p class="sub">${t.meta}</p>
        <p style="margin-bottom:6px">Starting from <strong style="font-size:24px">${fmt(t.price)}</strong> per person${t.was ? ` <s>${fmt(t.was)}</s>` : ""}.</p>
        <p class="sub">${t.blurb || "Run by a verified local partner. Prices per person in ₹."}</p>
        <div class="row"><button class="btn btn--accent" data-modal="book" data-topic="${t.name}">Book now</button><button class="btn btn--outline" data-modal="enquire" data-topic="${t.name}">Enquire</button></div>`;
    } else if (type === "credits") {
      body.innerHTML = `<h3>Photo <em>credits</em></h3><p class="sub">Photos from Unsplash and Wikimedia Commons, used under their listed licences.</p><ul class="credits" id="credit-list"><li>Loading…</li></ul>`;
      fetch("img/credits.json").then((r) => r.json()).then((c) => {
        $("#credit-list").innerHTML = Object.values(c).map((x) => `<li><a href="${x.source}" target="_blank" rel="noopener">${x.title}</a> by ${x.author || "unknown"} · ${x.license}</li>`).join("");
      }).catch(() => ($("#credit-list").innerHTML = "<li>Credits are listed in img/credits.json.</li>"));
    } else if (type === "post") {
      const b = D.blog.find((x) => x.title === topic);
      body.innerHTML = `<div class="card__img" style="background-image:url(${img(b.img)});height:200px;border-radius:12px;margin-bottom:18px"></div>
        <span class="post__tag">${b.tag} · ${b.read} min read</span><h3>${b.title}</h3>
        ${b.body.map((p) => `<p class="post__para">${p}</p>`).join("")}
        <div class="row"><button class="btn btn--accent" data-view="${b.tour}">See the ${b.tour} tour</button></div>`;
    } else if (type === "lounges") {
      const states = [...new Set(D.lounges.map((l) => l.state))];
      body.innerHTML = `<h3>Find your <em>LocalStart Lounge</em></h3>
        <p class="sub">Certified partner offices where your tour group boards. Walk in to book face to face, or wait here on departure day. Partner names are samples.</p>
        <button class="btn btn--accent" type="button" id="lounge-near">${pin} Find the one nearest me</button><p class="form-msg" id="lounge-msg"></p>
        <div class="lounges">${states.map((st) => `<div class="lounges__state"><h4>${st}</h4>${D.lounges.filter((l) => l.state === st).map((l) =>
          `<p class="lounges__row" data-lounge="${l.city}"><strong>${l.city}</strong><span>${l.partner}</span></p>`).join("")}</div>`).join("")}</div>`;
      $("#lounge-near").addEventListener("click", () => {
        $("#lounge-msg").textContent = "Finding your location…"; $("#lounge-msg").className = "form-msg";
        locate((me) => {
          const n = nearestLounge(me);
          $$(".lounges__row").forEach((r) => r.classList.toggle("on", r.dataset.lounge === n.city));
          msg($("#lounge-msg"), `Nearest: ${n.city}, ${n.km.toLocaleString("en-IN")} km away (${n.partner}).`, true);
          $(`.lounges__row[data-lounge="${n.city}"]`).scrollIntoView({ block: "nearest" });
        }, (err) => msg($("#lounge-msg"), locError(err), false));
      });
    } else if (type === "login") {
      body.innerHTML = `<h3>Login <em>or sign up</em></h3><p class="sub">Use your mobile number to view bookings.</p>
        <form class="mform" data-form="login" novalidate><input name="phone" placeholder="Mobile number" inputmode="numeric" maxlength="10"><button class="btn btn--accent">Send OTP</button><p class="form-msg"></p></form>`;
    } else {
      const book = type === "book";
      body.innerHTML = `<h3>${book ? "Reserve your <em>seats</em>" : "Talk to a <em>travel expert</em>"}</h3>
        <p class="sub">${topic ? `About: <b>${topic}</b>` : "Tell us a little about your trip."}</p>
        <form class="mform" data-form="${type}" novalidate>
          <input name="name" placeholder="Full name"><input name="phone" placeholder="Mobile number" inputmode="numeric" maxlength="10">
          ${book ? `<select name="pax"><option>2 adults</option><option>2 adults, 1 child</option><option>2 adults, 2 children</option><option>Family of 6+</option></select>`
                 : `<textarea name="note" placeholder="Dates, budget, who's travelling…"></textarea>`}
          <button class="btn btn--accent">${book ? "Hold my seats" : "Request a callback"}</button><p class="form-msg"></p></form>`;
    }
    modal.hidden = false; document.body.style.overflow = "hidden";
  }
  function closeModal() { modal.hidden = true; document.body.style.overflow = ""; }
  modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest(".modal__close")) closeModal(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  body.addEventListener("submit", (e) => {
    e.preventDefault(); const f = e.target, out = $(".form-msg", f), type = f.dataset.form;
    const rules = type === "login" ? { phone: validPhone } : { name: (v) => v.length > 1, phone: validPhone };
    if (!check(f, rules)) return msg(out, "Please check the highlighted fields.", false);
    msg(out, type === "login" ? "Preview only: OTP sending is turned off." : type === "book" ? "Seats held for 24 hours! Our team will call to confirm. (Preview: nothing is sent.)" : "Thanks! An expert will call you shortly. (Preview: nothing is sent.)", true);
    if (type !== "login") $$("input, textarea", f).forEach((i) => (i.value = ""));
  });

  // ---------- Global click delegation ----------
  document.addEventListener("click", (e) => {
    const wish = e.target.closest("[data-wish]");
    if (wish) {
      e.stopPropagation(); const n = wish.dataset.wish;
      wishes.has(n) ? wishes.delete(n) : wishes.add(n); store.set("ej_wish", [...wishes]);
      $$(`[data-wish="${CSS.escape(n)}"]`).forEach((w) => { w.classList.toggle("on", wishes.has(n)); });
      return toast(wishes.has(n) ? `Saved ${n} to your wishlist` : "Removed from wishlist");
    }
    const view = e.target.closest("[data-view]");
    if (view) { e.preventDefault(); return openModal("tour", view.dataset.view); }
    const m = e.target.closest("[data-modal]");
    if (m) { e.preventDefault(); return openModal(m.dataset.modal, m.dataset.topic || ""); }
    const cat = e.target.closest("[data-cat]");
    if (cat) { e.preventDefault(); return window.ejFilterCategory(cat.dataset.cat); }
    const s = e.target.closest("[data-search]");
    if (s) { searchInput.value = s.dataset.search; return runSearch(s.dataset.search); }
    const c = e.target.closest(".card[data-tour]");
    if (c && !e.target.closest("button")) openModal("tour", c.dataset.tour);
  });

  // ---------- Back to top ----------
  const toTop = $("#to-top");
  addEventListener("scroll", () => toTop.classList.toggle("show", scrollY > 900), { passive: true });
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

  // ---------- Nav highlight for the section in view ----------
  const navFor = (id) => $(`.nav a[href="#${id}"]`);
  const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    $$(".nav__item > a").forEach((a) => a.classList.remove("active"));
    const link = navFor(en.target.id); if (link) link.classList.add("active");
  }), { rootMargin: "-45% 0px -50% 0px" });
  // Watch every section so the highlight clears on sections without a nav link
  $$("main > section, footer").forEach((s) => spy.observe(s));

  renderRecent();
  updatePrices();
})();

// Hero search dropdown: cap its height to the room left below the search bar,
// so it never runs off screen and scrolls inside itself instead.
(() => {
  const drop = document.getElementById("search-drop");
  if (!drop) return;
  const fit = () => {
    if (drop.hidden) return;
    const room = innerHeight - drop.getBoundingClientRect().top - 16;
    drop.style.maxHeight = `${Math.max(150, Math.min(360, room))}px`;
  };
  new MutationObserver(fit).observe(drop, { attributes: true, attributeFilter: ["hidden"], childList: true });
  addEventListener("resize", fit);
  addEventListener("scroll", fit, { passive: true });
})();
