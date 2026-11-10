/* Product (tour detail) page. Renders tour.html?t=<slug> from window.EJ.
   Loads data.js and tour-hi.js only: none of the homepage scripts run here. */
(() => {
  const D = window.EJ;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const img = (k) => (/^(https?:)?\/\/|^\//.test(k) ? k : `/img/${k}.jpg?v=2`);
  const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN");
  const WA = "910000000000"; // placeholder WhatsApp number until the owner confirms one

  // ---------- Language ----------
  // English is the source text. Hindi comes from EJ.hi (js/tour-hi.js), keyed by the
  // English string; anything missing falls back to English.
  const HI = D.hi || {};
  const firstVisit = store.get("ej_lang", null) === null;
  let lang = store.get("ej_lang", (navigator.language || "").toLowerCase().startsWith("hi") ? "hi" : "en");
  const asked = new URLSearchParams(location.search).get("lang"); // shared links can carry the language
  if (asked === "hi" || asked === "en") { lang = asked; store.set("ej_lang", lang); }
  const t = (s, v = {}) => {
    let out = (lang === "hi" && HI[s]) || s;
    for (const k in v) out = out.split(`{${k}}`).join(v[k]);
    return out;
  };
  const NO_TR = new Set(["img", "video", "date", "slug", "icon", "name", "code", "themes", "lat", "lng", "for_en"]);
  const tr = (x) => lang !== "hi" ? x
    : typeof x === "string" ? (HI[x] || x)
    : Array.isArray(x) ? x.map(tr)
    : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, NO_TR.has(k) ? v : tr(v)]))
    : x;
  const tc = (city) => t(city); // place names have Hindi entries too
  const locale = () => (lang === "hi" ? "hi-IN" : "en-IN");
  const plural = (n, one, many) => t(n === 1 ? one : many, { n });

  // ---------- Tour + visitor's city ----------
  const params = new URLSearchParams(location.search);
  const pages = D.tourPages || {};
  const LIVE = !!D.live;
  const lounge = (name) => D.lounges.find((l) => l.city === name || l.id === name);
  const fromQ = params.get("from"), fromL = fromQ && lounge(fromQ);
  if (fromL) store.set("ej_city", fromL.city);
  let L = lounge(store.get("ej_city", "Meerut")) || lounge("Meerut") || D.lounges[0];

  const places = [...D.lounges.map((l) => ({ ...l, lounge: true })), ...(D.towns || [])];
  const km = (a, b) => { // road distance, roughly 1.15 × straight line
    const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) * 1.15);
  };
  const drive = (k) => {
    const m = Math.round(k / 45 * 60 / 15) * 15, h = Math.floor(m / 60), r = m % 60;
    if (m < 60) return t("{m} min", { m });
    return r ? t("{h} hr {m} min", { h, m: r }) : t("{h} hr", { h });
  };
  const nearby = () => places.filter((p) => p.city !== L.city).map((p) => ({ ...p, km: km(L, p) }))
    .filter((p) => p.km <= 100).sort((a, b) => a.km - b.km);
  const fill = (s) => s.split("{city}").join(tc(L.city)).split("{lounge}").join(L.partner);

  // A homepage tour without its own page (EJ.tourPages) gets one built from its
  // card data, the sample schedule and stories, and EJ.tourDefaults
  const DAY = 864e5, iso = (ms) => new Date(ms).toISOString().slice(0, 10);
  function fromTour(tour) {
    const [days, nights] = (tour.dur.match(/\d+/g) || [3, 2]).map(Number);
    const place = tour.loc.split(",")[0];
    const next = (D.schedule || []).find((d) => d.name === tour.name);
    const first = next ? Date.parse(next.date) : Date.now() + 10 * DAY;
    // The schedule has one sample date per tour; two more follow it, two weeks apart
    const departures = [next || { date: iso(first), seats: 12, of: 20, guaranteed: false },
      { date: iso(first + 14 * DAY), seats: 14, of: 20, guaranteed: false },
      { date: iso(first + 28 * DAY), seats: 18, of: 20, guaranteed: false }].map((d) => ({ ...d, price: tour.price, was: tour.was }));
    const shares = (x) => x.themes.some((th) => tour.themes.includes(th)) ? 0 : 1;
    return {
      ...tour, short: place, days, nights, pace: "Easy pace", deposit: 2000, summary: tour.blurb, departures, outline: true, pickup: "6:00 am",
      meals: "Breakfast & dinner included", dest: (D.cities || []).find((c) => c.name === tour.city),
      reviews: (D.stories || []).filter((r) => tour.name.startsWith(r.trip.split(" · ")[0])),
      faq: [...(D.faq.Booking || []), ...(D.faq.Cancellations || [])].slice(0, 5),
      similar: D.tours.filter((x) => x !== tour).sort((a, b) => shares(a) - shares(b)).slice(0, 4).map((x) => ({ name: x.name })),
    };
  }
  const want = LIVE ? D.live.slug : params.get("t"), home = D.tours.find((x) => x.slug === want);
  const T = { ...D.tourDefaults, ...(pages[want] || (home ? fromTour(home) : pages[Object.keys(pages)[0]])) };
  const T_EN = JSON.parse(JSON.stringify(T)); // English source; T holds the current language
  const localize = () => Object.assign(T, tr(JSON.parse(JSON.stringify(T_EN))));
  const G_EN = ((D.galleries || {})[pages[want] ? want : home ? home.slug : Object.keys(pages)[0]] || [{ img: T.img, cap: T.loc }])
    .concat((D.tourStay || []).map((m) => ({ ...m, stay: true }))); // stay cards sit after the place photos, so their indexes follow
  let G = G_EN, GP = G;

  // How a built page's group gets there from the visitor's city: by AC coach when it
  // is a day's drive, otherwise a feeder to the nearest airport and a group flight
  const FLY_KM = 700;
  const nearestHub = (p) => (D.hubs || []).map((h) => ({ ...h, km: km(p, h) })).sort((a, b) => a.km - b.km)[0];
  function outlinePlan() {
    const place = T.short, far = T.dest && km(L, T.dest) > FLY_KM;
    const from = far && nearestHub(L), to = far && nearestHub(T.dest);
    const fly = far && from.code !== to.code;
    const day = (title, text, stay, meals, effort) => ({ title, text, stay, meals, ...effort });
    const middle = () => day(t("Around {place}", { place }), t("Sightseeing at an easy pace with a local guide, one place at a time, and the afternoon free to rest."), place, t("Breakfast, dinner"),
      { drive: t("Short drives between sights"), walk: t("Easy, about 2 km at a slow pace") });
    const road = T.dest ? { drive: t("About {time} by AC coach, with stops", { time: drive(km(L, T.dest)) }), walk: t("Very little"), long: km(L, T.dest) > 400 } : { walk: t("Very little") };
    if (!fly) return {
      sub: t("our AC coach takes you straight to {place}.", { place }), pickup: t("6:00 am"),
      journey: [
        { icon: "lounge", time: t("6:00 am"), title: t("LocalStart Lounge, {city}"), text: t("Tea and check-in at {lounge}. Your coordinator loads the bags and hands over the trip kit.") },
        { icon: "bus", time: t("6:30 am"), title: t("AC coach to {place}", { place }), text: t("Pushback seats, a washroom stop every 90 minutes and a planned meal stop. Live location shared with family.") },
        { icon: "home", time: t("Evening"), title: t("Check in at {place}", { place }), text: t("Straight to the hotel. No changing trains, no finding your own way from a metro.") },
      ],
      itinerary: Array.from({ length: T.days }, (_, i) => i === 0
        ? day(t("{city} to {place}", { place }), t("Pickup at your LocalStart Lounge, then the AC coach to {place} with stops every 90 minutes. Check in and rest.", { place }), place, t("Dinner"), road)
        : i === T.days - 1 && T.days > 1
          ? day(t("{place} to {city}", { place }), t("Breakfast, a last stroll and the coach back to your lounge. Your coordinator stays until the last bag is collected."), t("Home"), t("Breakfast"), road)
          : middle()),
      includes: tr(D.pricing.included),
    };
    const hub = (h) => tc(h.name);
    const feeder = from.km < 15 ? t("A short transfer") : t("{time} on the AC feeder coach", { time: drive(from.km) });
    const air = { drive: t("About {h} hrs door to hotel: {first}, flight, {road} by road", { h: Math.round((from.km + to.km) / 45 + 5), first: from.km < 15 ? t("short transfer") : t("{time} feeder", { time: drive(from.km) }), road: drive(to.km) }), walk: t("Very little. Wheelchair help at airports on request"), long: true };
    return {
      sub: t("our AC feeder coach takes you to {hub} airport, where your group and captain are waiting.", { hub: hub(from) }), pickup: t("5:30 am"),
      journey: [
        { icon: "lounge", time: t("5:30 am"), title: t("LocalStart Lounge, {city}"), text: t("Tea and check-in at {lounge}. Your coordinator weighs bags and hands over the trip kit.") },
        { icon: "bus", time: t("6:00 am"), title: t("AC feeder to {hub} airport", { hub: hub(from) }), text: t("{feeder}, with a washroom stop every 90 minutes. Live location shared with family.", { feeder }) },
        { icon: "group", time: t("Late morning"), title: t("Meet the group at {hub} ({code})", { hub: hub(from), code: from.code }), text: t("Your captain meets you at the gate and handles check-in for the whole group.") },
        { icon: "plane", time: t("Afternoon"), title: t("Fly to {hub}, coach to {place}", { hub: hub(to), place }), text: t("One group flight, then {time} by coach to the hotel. No platform changes, no metro hotel nights.", { time: drive(to.km) }) },
      ],
      itinerary: Array.from({ length: T.days }, (_, i) => i === 0
        ? day(t("{city} to {place}", { place }), t("Pickup at your LocalStart Lounge, AC feeder to {from} airport, group flight to {to} and the coach to your hotel in {place}.", { from: hub(from), to: hub(to), place }), place, t("Dinner"), air)
        : i === T.days - 1 && T.days > 1
          ? day(t("{place} to {city}", { place }), t("Coach to {to} airport, group flight to {from} and the AC feeder back to your lounge. Your coordinator stays until the last bag is collected.", { from: hub(from), to: hub(to) }), t("Home"), t("Breakfast"), air)
          : middle()),
      includes: [
        [t("Pickup and drop at your LocalStart Lounge"), t("AC feeder to {hub} airport and back", { hub: hub(from) })],
        [t("{from} – {to} group flights", { from: hub(from), to: hub(to) }), t("Economy, 15 kg check-in bag")],
        ...tr(D.pricing.included.slice(1)),
      ],
    };
  }

  // ---------- Icons (line, 64 grid, red accent) ----------
  const ico = (body, cls = "") => `<svg class="ico-line ${cls}" viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
  const I = {
    moon: ico('<path d="M40 10a22 22 0 1 0 14 34A18 18 0 0 1 40 10z"/><path class="a" d="M46 16v6M43 19h6"/>'),
    home: ico('<path d="M10 30 32 12l22 18"/><path d="M16 26v26h32V26"/><path class="a" d="M27 52V38h10v14"/>'),
    pace: ico('<circle cx="32" cy="34" r="20"/><path d="M32 22v12l8 5"/><path class="a" d="M26 8h12"/>'),
    food: ico('<path d="M10 34h44a22 22 0 0 1-44 0z"/><path d="M8 56h48"/><path class="a" d="M24 26c-2-3 2-5 0-8M32 26c-2-3 2-5 0-8M40 26c-2-3 2-5 0-8"/>'),
    shield: ico('<path d="M32 7 12 15v14c0 12 8 22 20 28 12-6 20-16 20-28V15z"/><path class="a" d="m23 32 6 6 12-13"/>'),
    gps: ico('<path d="M32 56s-17-16-17-29a17 17 0 0 1 34 0c0 13-17 29-17 29z"/><circle class="a" cx="32" cy="27" r="6"/>'),
    pill: ico('<rect x="9" y="22" width="46" height="20" rx="10" transform="rotate(-35 32 32)"/><path class="a" d="m26 22 12 20"/>'),
    person: ico('<circle cx="32" cy="20" r="10"/><path d="M12 56c0-11 9-19 20-19s20 8 20 19"/><path class="a" d="M44 10h10M49 5v10"/>'),
    wa: ico('<path d="M12 52l3-11a20 20 0 1 1 8 8z"/><path class="a" d="M25 24c0 9 6 15 15 15l3-4-5-3-2 2c-3-1-5-3-6-6l2-2-3-5z"/>'),
    call: ico('<path d="M20 10h-6a4 4 0 0 0-4 4c0 22 18 40 40 40a4 4 0 0 0 4-4v-6l-11-5-5 5c-7-3-12-8-15-15l5-5z"/><path class="a" d="M38 10a16 16 0 0 1 16 16M38 18a8 8 0 0 1 8 8"/>'),
    bus: ico('<path d="M14 47V18a7 7 0 0 1 7-7h22a7 7 0 0 1 7 7v29"/><path d="M14 47h36"/><rect x="19" y="19" width="26" height="12" rx="2"/><circle cx="21.5" cy="40" r="2"/><circle cx="42.5" cy="40" r="2"/><path class="a" d="M6 56h52" stroke-dasharray="0.1 6.2"/>'),
    plane: ico('<path d="M8 36 56 14l-8 34-14-8-8 10v-14z"/><path class="a" d="m34 40 22-26"/>'),
    lounge: ico('<path d="M13 32V22a5 5 0 0 1 5-5h14a5 5 0 0 1 5 5v10"/><path d="M9 33a3.5 3.5 0 0 1 7 0v5h18v-5a3.5 3.5 0 0 1 7 0v10a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2z"/><path d="M14 45v4M36 45v4"/><path d="M45 37h12v5a6 6 0 0 1-12 0z"/><path class="a" d="M49 32c-1.6-2 1.6-3 0-5M54 32c-1.6-2 1.6-3 0-5"/>'),
    grid: ico('<rect x="9" y="9" width="20" height="20" rx="2"/><rect x="35" y="9" width="20" height="20" rx="2"/><rect x="9" y="35" width="20" height="20" rx="2"/><rect class="a" x="35" y="35" width="20" height="20" rx="2"/>'),
    play: ico('<circle cx="32" cy="32" r="24"/><path class="a" d="M27 22v20l16-10z"/>'),
    group: ico('<circle cx="22" cy="22" r="8"/><circle cx="44" cy="24" r="6"/><path d="M8 52c0-9 6-15 14-15s14 6 14 15M36 40c2-2 5-3 8-3 7 0 12 5 12 13"/><path class="a" d="M52 8v8M48 12h8"/>'),
    globe: ico('<circle cx="32" cy="32" r="22"/><path d="M10 32h44M32 10c7 7 10 14 10 22s-3 15-10 22c-7-7-10-14-10-22s3-15 10-22z"/><path class="a" d="M50 12l4-4"/>'),
  };
  const shieldTick = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 5 6v5c0 4.4 3 8.2 7 10 4-1.8 7-5.6 7-10V6l-7-3Z"/><path d="m8.8 12.2 2.3 2.3 4.3-4.6"/></svg>';
  const stars = (n) => `<span class="tp-stars" aria-label="${t("{n} out of 5", { n })}">${"★".repeat(Math.round(n))}<i>${"★".repeat(5 - Math.round(n))}</i></span>`;
  const head = (eyebrow, h2, sub = "") => `<div class="section-head"><div><span class="eyebrow">${eyebrow}</span><h2>${h2}</h2>${sub ? `<p class="sub">${sub}</p>` : ""}</div></div>`;
  const dt = (d) => new Date(d + "T00:00:00");
  // Hindi reads better with full month names ("14 नवंबर") than the short forms
  const dfmt = (d, o) => new Intl.DateTimeFormat(locale(), lang === "hi" && o.month === "short" ? { ...o, month: "long" } : o).format(dt(d));
  const longDate = (d) => dfmt(d, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const shortDate = (d) => dfmt(d, { day: "numeric", month: "short" });
  let upcoming = [];
  const future = (list) => list.filter((d) => dt(d.date) > Date.now());
  const upMetro = () => (LIVE ? future(T.baseDeps) : upcoming);
  // Live tours keep their dates per lounge city; the tour's own start has its own list (Standard departures)
  function setDeps() {
    if (LIVE) {
      if (!(T.depsByCity[L.id] || []).length) L = D.lounges.find((l) => (T.depsByCity[l.id] || []).length) || L;
      const own = T.depsByCity[L.id] || [];
      T.departures = own.length ? own : T.baseDeps.length ? T.baseDeps : [{ id: "", date: iso(Date.now() + 30 * DAY), seats: 0, of: 0, price: T.price, none: true }];
      T.itinerary = T.itineraryFor(T.departures[0]);
      T_EN.departures = T.departures;
    }
    upcoming = future(T.departures);
  }
  setDeps();

  // ---------- Booking state ----------
  const C = D.company || {};
  const state = { date: (upcoming[0] || T.departures[0]).date, adults: 2, kids: 0, infants: 0, tab: "direct", from: null, metro: null, touched: false };
  if (LIVE && fromQ === "base" && T.baseDeps.length) { state.tab = "metro"; state.metro = D.metros[0]; state.date = (upMetro()[0] || T.baseDeps[0]).date; }
  const dep = () => (state.metro && LIVE ? T.baseDeps : T.departures).find((d) => d.date === state.date) || T.departures[0];
  const metroPrice = (p) => (LIVE ? p : p - (T.metroSaving || 0)); // standard departures skip the lounge pickup
  const unit = () => (state.metro ? metroPrice(dep().price) : dep().price);
  const kidPrice = () => Math.round(unit() * D.pricing.childShare);
  const payers = () => state.adults + state.kids; // everyone with a seat and a bed
  const rooms = () => Math.ceil(payers() / 2);
  const single = () => (payers() === 1 ? (LIVE ? T.singleFlat : Math.round(unit() * T.singleShare)) : 0);
  // The festive offer applies to tours of its theme, for 2 or more travellers, until it ends
  const offer = () => { const P = D.promo; return P && (T_EN.themes || []).some((x) => x.toLowerCase().includes(P.cat)) && Date.parse(P.ends) > Date.now() ? tr(P) : null; };
  const offerOff = () => (offer() && payers() >= 2 ? offer().perFamily : 0);
  const total = () => state.adults * unit() + state.kids * kidPrice() + single() - offerOff();
  const depPP = () => (LIVE ? Math.round(depositNow() / Math.max(1, payers())) : T.deposit);
  const depositNow =() => (LIVE ? Math.min(total(), Math.round(T.depositType === "amount" ? (T.depositValue || 0) * payers() : (total() * Math.min(T.depositValue || 0, 100)) / 100)) : Math.min(total(), T.deposit * payers()));
  const daysBefore = (n) => iso(Date.parse(state.date) - n * DAY);
  const who = () => [plural(state.adults, "{n} adult", "{n} adults"), state.kids && plural(state.kids, "{n} child", "{n} children"), state.infants && t("{n} under 5", { n: state.infants })].filter(Boolean).join(", ");
  const travellers = () => state.adults + state.kids + state.infants;
  const tripCode = `EJ-${T_EN.short.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase()}${T.days}`;
  const waLink = (msg) => `https://wa.me/${C.whatsapp || WA}?text=${encodeURIComponent(msg)}`;
  const bookMsg = () => t("Hi EpicJourneys, I'd like to book {tour} ({code}) on {date} from {from}. {who}, {rooms}. Total shown: {total}{offer}.", {
    tour: t(T.name), code: tripCode, date: longDate(state.date),
    from: state.metro ? t("{metro} (standard departure, meeting at {meet})", { metro: tc(state.metro.city), meet: t(state.metro.meet) })
      : state.from ? t("{town} (feeder to {city})", { town: tc(state.from.city), city: tc(L.city) }) : tc(L.city),
    who: who(), rooms: plural(rooms(), "{n} room", "{n} rooms"), total: fmt(total()),
    offer: offerOff() ? t(" after {tag} {amount} off", { tag: offer().tag, amount: fmt(offerOff()) }) : "",
  });
  const askMsg = () => t("Hi EpicJourneys, I have a question about {tour} ({code}) from {city}.", { tour: t(T.name), code: tripCode, city: tc(L.city) });
  const bookUrl = () => {
    const d = dep();
    return "/checkout?" + new URLSearchParams({ tour: T.slug, from: state.metro ? "base" : L.id, departure: d.id || "", travellers: String(state.adults + state.kids), step: "travellers" });
  };
  const bookAttrs = () => (LIVE ? `href="${bookUrl()}"` : `target="_blank" rel="noopener" href="${waLink(bookMsg())}"`);
  const BOOK = () => (LIVE ? "Book now" : t("Book on WhatsApp")); // the one booking label used everywhere

  // ---------- Render ----------
  function render() {
    if (LIVE) { setDeps(); if (!dep() || (state.metro ? false : !T.departures.some((d) => d.date === state.date))) state.date = (upcoming[0] || T.departures[0]).date; }
    if (T.outline) { const o = outlinePlan(); if (LIVE) { delete o.itinerary; delete o.includes; } Object.assign(T, o); }
    G = tr(G_EN); GP = G.filter((m) => !m.stay);
    document.documentElement.lang = lang;
    document.title = t("{tour}, {days} days from {city} · EpicJourneys", { tour: t(T.name), days: T.days, city: tc(L.city) });
    const near = nearby();
    const delhi = { lat: 28.5562, lng: 77.1000 };
    const cheapest = Math.min(...upcoming.map((d) => d.price));
    const ratingAvg = T.rating;
    const city = tc(L.city);

    $("#tp").innerHTML = `
    <section class="tp-hero" style="background-image:url(${img(T.img)})" aria-label="${T.loc}">
      <div class="container tp-hero__bar"><button type="button" class="tp-hero__all" data-gal="0">${I.grid}${G.length > 1 ? t("See all {n} photos &amp; videos", { n: G.length }) : t("See photos")}</button></div>
    </section>

    <div class="container tp-layout">
      <div class="tp-main">
        <header class="tp-title">
        <nav class="tp-crumbs" aria-label="${t("Breadcrumb")}"><a href="index.html">${t("Home")}</a><span>/</span><a href="index.html#tours">${t(T_EN.state)}</a><span>/</span><b>${t(T.name)}</b></nav>
        <h1>${t("{place} in {days} days, starting from {city}", { place: T.short, days: T.days, city: `<span class="tp-hl">${city}</span>` })}</h1>
        <p class="tp-hero__sub">${t("No train platform changes. No paying your own way to a metro. Step into your LocalStart Lounge in {city} and {rest}", { city, rest: T.sub || t("our AC feeder coach takes you straight to the main tour group.") })}</p>
        <div class="tp-hero__facts">
          ${ratingAvg ? `<span class="tp-rating">${stars(ratingAvg)}<b>${ratingAvg}</b> · <a href="#reviews">${t("{n} reviews", { n: T.ratingCount })}</a></span>` : ""}
          ${upcoming.some((d) => d.guaranteed) ? `<span class="tp-badge">${shieldTick}${t("Guaranteed departures")}</span>` : ""}
          <span class="tp-hero__loc">${T.loc}</span>
        </div>
        </header>

        <nav class="tp-nav" id="tp-nav" aria-label="${t("On this page")}">${[["gallery", "Media"], ["dates", "Dates"], ["journey", "Route"], ["itinerary", "Itinerary"], ["costs", "Included"], ["care", "Safety"], ["food", "Food"], ["reviews", "Reviews"], ["faq", "FAQs"]]
          .map(([id, label]) => `<a href="#${id}" data-spy="${id}">${t(label)}</a>`).join("")}</nav>

        <section class="tp-sec tp-overview" id="overview">
          <ul class="tp-facts">
            <li>${I.moon}<div><strong>${t("{nights} Nights / {days} Days", { nights: T.nights, days: T.days })}</strong><span>${T.loc.split(",")[0]}</span></div></li>
            <li>${I.home}<div><strong>${t("Roundtrip from {city}", { city })}</strong><span>${L.partner}</span></div></li>
            <li>${I.pace}<div><strong>${T.pace}</strong><span>${t("Made for families &amp; seniors")}</span></div></li>
            <li>${I.food}<div><strong>${t("Veg &amp; Jain meals")}</strong><span>${T.meals || t("All meals included")}</span></div></li>
          </ul>
          <p class="tp-summary">${T.summary}</p>
          ${T.highlights ? `<ul class="tp-highlights">${T.highlights.map((h) => `<li>${h}</li>`).join("")}</ul>` : ""}
        </section>

        <section class="tp-sec" id="gallery">
          ${head(t("Photos &amp; videos"), t("See it <em>before you go</em>"))}
          <div class="tp-gal tp-gal--n${Math.min(GP.length, 5)}">${GP.slice(0, 5).map((m, i) => `
            <button type="button" class="tp-gal__item${i ? "" : " tp-gal__item--big"}${m.video ? " tp-gal__item--video" : ""}" data-gal="${i}" aria-label="${t(m.video ? "Open video: {cap}" : "Open photo: {cap}", { cap: m.cap })}"${m.img ? ` style="background-image:url(${img(m.img)})"` : ""}>
              ${m.video ? `<video src="${m.video}#t=1" muted playsinline loop preload="metadata" aria-hidden="true"></video><span class="tp-gal__play">${I.play}</span>` : ""}
              ${i === 4 && GP.length > 5 ? `<span class="tp-gal__more">${t("+{n} more", { n: GP.length - 5 })}</span>` : `<span class="tp-gal__cap">${m.cap}</span>`}
            </button>`).join("")}</div>
          <h3 class="tp-gal__sub">${t("Where you'll stay, ride and eat")}</h3>
          <ul class="tp-stay">${G.map((m, i) => [m, i]).filter(([m]) => m.stay).map(([m, i]) => {
            const [ic, label] = { room: [I.home, t("Hotel rooms")], coach: [I.bus, t("The coach")], meal: [I.food, t("Meals")], lounge: [I.lounge, t("Lounge in {city}", { city })] }[m.key];
            return `<li><button type="button" class="tp-stay__card" data-gal="${i}" aria-label="${t("Open photo: {cap}", { cap: m.cap })}">
              <span class="tp-stay__img" style="background-image:url(${img(m.img)})"></span>
              <span class="tp-stay__txt">${ic}<strong>${label}</strong><small>${t("Sample photo. Our partners' own photos coming soon.")}</small></span></button></li>`;
          }).join("")}</ul>
          <p class="tp-note">${t("Photos of the places on this tour. Traveller photos from our own groups will be added after each departure.")}</p>
        </section>

        <section class="tp-sec tp-plan" id="dates">
          ${head(t("Plan your trip"), t("Dates, travellers and <em>your total</em>"), t("Everything from {city} and back is in the price. Reserve your seats with a small deposit.", { city }))}
          <div class="tp-plan__step">
            <h3><span>1</span>${t("Pick a departure")}</h3>
            <div class="tp-tabs" role="tablist" aria-label="${t("Where you start")}">${[
              ["direct", I.home, t("From {city}", { city }), t("Pickup at your lounge"), t("Recommended")],
              ["near", I.bus, t("From nearby towns"), t("Free feeder, under 100 km")],
              ["metro", I.plane, t("Standard departures"), t("From metro cities")],
            ].map(([id, ic, label, sub, badge]) => `<button role="tab" data-tab="${id}" aria-selected="${state.tab === id}" class="${state.tab === id ? "on" : ""}">${ic}<span><b>${label}</b><small>${sub}</small></span>${badge ? `<em class="tp-tabs__badge">${badge}</em>` : ""}</button>`).join("")}
            </div>
            <div class="tp-tabpanel" id="tp-tabpanel"></div>
          </div>
          <div class="tp-plan__step"><h3><span>2</span>${t("Who's travelling")}</h3><div id="tp-who"></div></div>
          <div class="tp-plan__step" id="tp-sum"></div>
        </section>

        <section class="tp-sec" id="journey">
          ${head(t("How you reach the group"), t("From your street <em>to the main group</em>"), t("The part other operators leave to you. {place} is {km} km from {city}: we cover all of it.", { place: T.dest ? T.short : tc("Delhi"), km: km(L, T.dest || delhi), city }))}
          <ol class="tp-path" style="grid-template-columns:repeat(${T.journey.length}, 1fr)">${T.journey.map((s, i) => `<li><i>${I[s.icon] || [I.lounge, I.bus, I.group, I.plane][i]}</i><time>${s.time}</time><strong>${fill(s.title)}</strong><p>${fill(s.text)}</p></li>`).join("")}</ol>
        </section>

        <section class="tp-sec" id="itinerary">
          ${head(t("Day by day"), t("What each day <em>looks like</em>"))}
          <div class="tp-days">${T.itinerary.map((d, i) => `
            <details class="tp-day"${i ? "" : " open"}>
              <summary><span class="tp-day__n">${t("Day {n}", { n: i + 1 })}</span><strong>${fill(d.title)}</strong>${d.long ? `<em class="tp-day__long">${t("Long travel day")}</em>` : ""}<i aria-hidden="true"></i></summary>
              <div class="tp-day__body"><p>${fill(d.text)}</p><dl>
                ${d.drive ? `<div><dt>${t("Travel")}</dt><dd>${d.drive}</dd></div>` : ""}${d.walk ? `<div><dt>${t("Walking")}</dt><dd>${d.walk}</dd></div>` : ""}
                <div><dt>${t("Stay")}</dt><dd>${fill(d.stay)}</dd></div><div><dt>${t("Meals")}</dt><dd>${d.meals}</dd></div></dl></div>
            </details>`).join("")}</div>
          ${T.hotels ? `<ul class="tp-hotels">${T.hotels.map((h) => `<li><strong>${h.name}</strong><span>${plural(h.nights, "{n} night", "{n} nights")} · ${"★".repeat(h.stars)}</span></li>`).join("")}</ul>
          <p class="tp-note">${t("Sample hotels. Final list shared 15 days before departure, same category or better.")}</p>` : ""}
          ${T.outline && !LIVE ? `<p class="tp-note">${t("Sample outline. The detailed day plan and hotels for this tour are being written.")}</p>` : ""}
        </section>

        <section class="tp-sec" id="costs">
          ${head(t("Zero hidden costs"), t("{price} is <em>the whole price</em>", { price: fmt(cheapest) }), t("From the moment you leave home in {city} to the moment you are back.", { city }))}
          <div class="tp-costs">
            <div class="tp-costs__in"><h3>${t("Already paid for")}</h3><ul>${T.includes.map(([a, b]) => `<li><strong>${a}</strong><span>${b}</span></li>`).join("")}</ul></div>
            <div class="tp-costs__out"><h3>${t("Not included")}</h3><ul>${T.excludes.map((x) => `<li>${x}</li>`).join("")}</ul></div>
          </div>
        </section>

        <section class="tp-sec" id="care">
          ${head(t("Safety &amp; comfort"), t("Planned around <em>you and your parents</em>"))}
          <div class="tp-care${T.captain ? "" : " tp-care--solo"}">
            ${T.captain ? `<article class="tp-captain">
              <div class="tp-captain__top"><span class="tp-captain__avatar" aria-hidden="true">${T_EN.captain.name.split(" ").map((w) => w[0]).join("")}</span>
                <div><small>${T.captain.role}</small><strong>${t("Captain {name}", { name: t(T.captain.name) })}</strong><span>${t("{years} years · {trips} group trips", { years: T.captain.years, trips: T.captain.trips })}</span></div></div>
              <blockquote>“${T.captain.quote}”</blockquote>
              <p class="tp-captain__langs"><b>${t("Speaks")}</b> ${T.captain.langs.join(", ")}</p>
            </article>` : ""}
            <p class="tp-access">${I.person}<span>${T.access}</span></p>
            <ul class="tp-protocols">${T.safety.map(([a, b], i) => `<li>${[I.pace, I.gps, I.pill, I.shield][i]}<div><strong>${a}</strong><p>${b}</p></div></li>`).join("")}</ul>
          </div>
        </section>

        <section class="tp-sec" id="food">
          ${head(t("Food planner"), t("Food that tastes <em>like home</em>"), t("Tell us once when you book. Every kitchen on the route gets your list before you arrive."))}
          <div class="tp-food" role="radiogroup" aria-label="${t("Your food preference")}">${T.food.map(([a, b], i) => `
            <label class="tp-food__opt"><input type="radio" name="food" value="${T_EN.food[i][0]}"${i === (T.foodIdx || 0) ? " checked" : ""}><span><strong>${a}</strong><small>${b}</small></span></label>`).join("")}</div>
        </section>

        <section class="tp-sec" id="reviews">
          ${head(t("Reviews"), t("Travellers <em>near {city}</em>", { city }))}
          <div class="tp-reviews" id="tp-reviews"></div>
          <p class="tp-note">${t("Sample reviews, shown until our first {place} travellers share theirs. Only travellers who booked will be able to review.", { place: T.short })}</p>
        </section>

        <section class="tp-sec" id="faq">
          ${head(t("Questions"), t("Before <em>you book</em>"))}
          <div class="tp-faq">${T.faq.map(([q, a], i) => `<details${i ? "" : " open"} data-q="${T_EN.faq[i][0]}"><summary>${q}<i aria-hidden="true"></i></summary><p>${a}</p></details>`).join("")}</div>
        </section>
      </div>

      <aside class="tp-aside"><div class="tp-aside__in"><div class="tp-card" id="tp-card"></div><div id="tp-offers"></div><div id="tp-trust"></div></div></aside>
    </div>

    <section class="section tp-similar">
      <div class="container">
        ${head(t("More from {city}", { city }), t("Other tours <em>leaving from {city}</em>", { city }))}
        <div class="tp-cards">${T_EN.similar.map(simCard).join("")}</div>
      </div>
    </section>

    <section class="section leadform" id="lead">
      <div class="container leadform__inner">
        <div class="leadform__intro">
          <span class="eyebrow">${t("Ask for your city or dates")}</span>
          <h2>${t("Different dates? <em>Or a lounge closer to home?</em>")}</h2>
          <p>${t("Tell us your town and when you'd like to travel. A coordinator for {state} will call you back. New lounges open where enough families ask.", { state: tc(L.state) })}</p>
        </div>
        <form class="leadform__card" id="tp-lead" novalidate>
          <h3 class="leadform__title">${t("Request dates or a city")}</h3>
          <p class="leadform__hint">${t("Takes under a minute. Fields marked * are required.")}</p>
          <div class="field"><label for="tl-name">${t("Your name *")}</label><input id="tl-name" name="name" placeholder="${t("e.g. Sushma Agarwal")}" autocomplete="name" required></div>
          <div class="field"><label for="tl-phone">${t("Phone number *")}</label><div class="field__phone"><span>+91</span><input id="tl-phone" name="phone" placeholder="${t("10-digit mobile number")}" inputmode="numeric" maxlength="10" autocomplete="tel-national" required></div></div>
          <div class="field"><label for="tl-city">${t("Your town *")}</label><input id="tl-city" name="city" value="${city}" autocomplete="address-level2" required></div>
          <div class="field"><label for="tl-month">${t("When would you like to go?")}</label><select id="tl-month" name="month">${["Any time", "2026-12", "2027-01", "2027-02", "2027-03", "2027-04", "2027-05"].map((m) => `<option value="${m}">${m.includes("-") ? dfmt(`${m}-01`, { month: "short", year: "numeric" }) : t(m)}</option>`).join("")}</select></div>
          <button class="btn btn--accent leadform__submit" type="submit">${t("Send my request")}</button>
          <p class="form-msg" id="tl-msg" role="status"></p>
          <p class="leadform__privacy">${t("We'll only use your number to call you about this trip.")}</p>
        </form>
      </div>
    </section>`;

    renderTab(near);
    renderPlan();
    renderTrust();
    renderReviews();
  }

  function simCard(s) {
    const x = s.sample ? s : D.tours.find((y) => y.name === s.name);
    if (!x) return "";
    return `<article class="card">
      <div class="card__media"><div class="card__img"><i class="card__pic" style="background-image:url(${img(x.img)})"></i></div>${x.off ? `<span class="card__tag">${t("Sale")}</span>` : ""}</div>
      <div class="card__body">
        <h3 class="card__title">${t(x.name)}</h3>
        <p class="card__meta"><span>${t(x.dur)}</span><span>${t(x.loc)}</span></p>
        <p class="tp-card__from">${I.home}${t("Starts at your lounge in {city}", { city: tc(L.city) })}</p>
        <div class="card__foot">
          <div class="card__price"><small>${t("Starting from")}</small><span class="card__amount"><strong>${fmt(x.price)}</strong>${x.was ? `<s class="card__was">${fmt(x.was)}</s>` : ""}<span class="card__per">${t("/ per person")}</span></span></div>
          <a class="card__cta" href="${s.sample ? "#lead" : `tour.html?t=${x.slug}`}">${s.sample ? t("Ask for dates") : t("View tour")}</a>
        </div>
      </div></article>`;
  }

  function depRow(d, from, metro) {
    const low = d.seats <= 4;
    const sel = d.date === state.date && (state.from ? state.from.city : null) === (from ? from.city : null) && (state.metro ? state.metro.city : null) === (metro ? metro.city : null);
    const price = metro ? metroPrice(d.price) : d.price;
    return `<li class="tp-dep${sel ? " on" : ""}${low ? " tp-dep--low" : ""}" data-pick="${d.date}"${from ? ` data-from="${from.city}"` : ""}${metro ? ` data-metro="${metro.city}"` : ""} role="radio" aria-checked="${sel}" tabindex="0">
      <i class="tp-dep__radio" aria-hidden="true"></i>
      <time datetime="${d.date}"><strong>${String(dt(d.date).getDate()).padStart(2, "0")}</strong><span>${dfmt(d.date, { month: "short", year: "numeric" })}</span><small>${dfmt(d.date, { weekday: "short" })}</small></time>
      <div class="tp-dep__what">
        <span class="tp-pickup${metro ? " tp-pickup--metro" : ""}">${metro ? t("Meet at {meet}", { meet: t(metro.meet) }) : from ? t("Feeder from {town} · {time}", { town: tc(from.city), time: drive(from.km) }) : t("Direct hometown pickup")}</span>
        ${d.guaranteed ? `<em class="tp-badge tp-badge--dark">${shieldTick}${t("Guaranteed")}</em>` : `<em class="tp-dep__open">${t("Runs at 12 travellers")}</em>`}
        <div class="tp-seats"><span>${low ? t("Filling fast · ") : ""}${t("{n} of {of} seats left", { n: d.seats, of: d.of })}</span><i role="progressbar" aria-label="Seats booked" aria-valuemin="0" aria-valuemax="${d.of}" aria-valuenow="${d.of - d.seats}"><b style="width:${Math.round((1 - d.seats / d.of) * 100)}%"></b></i></div>
      </div>
      <div class="tp-dep__price">${metro && !LIVE ? `<s>${fmt(d.price)}</s>` : d.was ? `<s>${fmt(d.was)}</s>` : ""}<strong>${fmt(price)}</strong><small>${metro ? t("no pickup") : t("per person")}</small></div>
    </li>`;
  }

  function renderTab(near = nearby()) {
    const panel = $("#tp-tabpanel"), city = tc(L.city);
    if (state.tab === "direct") {
      panel.innerHTML = `<p class="tp-tabnote">${I.lounge}<span>${t("Pickup at <b>{lounge}</b>, your LocalStart Lounge in {city}, {time}. Drop back at the same door.", { lounge: L.partner, city, time: T.pickup || t("5:30 am") })}</span></p>
        <ol class="tp-deps" role="radiogroup" aria-label="${t("Departures from {city}", { city })}">${upcoming.map((d) => depRow(d)).join("")}</ol>`;
    } else if (state.tab === "near") {
      panel.innerHTML = near.length
        ? `<p class="tp-tabnote">${I.bus}<span>${t("Live within 100 km of {city}? A free AC feeder brings you to the {city} lounge. Choose your town to see its dates.", { city })}</span></p>
          <ul class="tp-near">${near.map((p) => `<li${state.from && state.from.city === p.city ? ' class="on"' : ""}><div><strong>${tc(p.city)}</strong><span>${t("{km} km · about {time}", { km: p.km, time: drive(p.km) })} · ${p.lounge ? t("own lounge: {name}", { name: p.partner }) : t("free feeder shuttle")}</span></div><button class="tp-link" data-near="${p.city}">${t("Show dates from {town}", { town: tc(p.city) })}</button></li>`).join("")}</ul>
          <ol class="tp-deps" id="tp-near-deps" role="radiogroup" aria-label="${t("Departures with a feeder")}"${state.from ? "" : " hidden"}>${state.from ? upcoming.map((d) => depRow(d, state.from)).join("") : ""}</ol>`
        : `<p class="tp-tabnote">${I.bus}<span>${t("No other towns within 100 km of {city} yet. Ask for yours below.", { city })}</span></p>`;
    }
    if (state.tab === "metro") {
      const M = D.metros || [];
      panel.innerHTML = `<p class="tp-tabnote">${I.plane}<span>${LIVE ? t("Join the group at the tour's own starting point. You make your own way there, so there is no lounge pickup.") : t("Live in a metro? Join the same group at a meeting point in your city. You make your own way there, so it costs {amount} less per person.", { amount: fmt(T.metroSaving) })}</span></p>
        <ul class="tp-near tp-metros">${M.map((m) => `<li${state.metro && state.metro.city === m.city ? ' class="on"' : ""}><div><strong>${tc(m.city)}</strong><span>${t("Meet at {meet}", { meet: t(m.meet) })}</span></div><button class="tp-link" data-metro-show="${m.city}">${t("Show dates from {town}", { town: tc(m.city) })}</button></li>`).join("")}</ul>
        <ol class="tp-deps" id="tp-metro-deps" role="radiogroup" aria-label="${t("Standard departures")}"${state.metro ? "" : " hidden"}>${state.metro ? upMetro().map((d) => depRow(d, null, state.metro)).join("") : ""}</ol>
        <p class="tp-tabnote tp-tabnote--small">${t("Prefer to be picked up? Our LocalStart Lounges cover {n} towns.", { n: D.lounges.length })} <a href="#lead">${t("Ask for a lounge near you")}</a></p>`;
    }
  }

  // Step 2, step 3, the card, the offers and the phone bar all follow the same booking state
  function renderPlan() {
    const d = dep();
    const step = (k, label, sub) => `<div class="tp-step"><div><strong>${label}</strong><small>${sub}</small></div>
      <div class="tp-step__ctl"><button type="button" data-step="${k}" data-d="-1" aria-label="${t("Fewer: {label}", { label })}">−</button><output aria-live="polite">${state[k]}</output><button type="button" data-step="${k}" data-d="1" aria-label="${t("More: {label}", { label })}">+</button></div></div>`;
    const odd = payers() > 1 && payers() % 2;
    const roomNote = payers() === 1 ? t("Travelling alone, you get a room to yourself for {amount} more", { amount: fmt(single()) })
      : odd ? t("One room is shared by 3 with an extra bed, or ask for a single room ({amount} more)", { amount: fmt(LIVE ? T.singleFlat : Math.round(unit() * T.singleShare)) }) : "";
    $("#tp-who").innerHTML = `<div class="tp-who">
        ${step("adults", t("Adults"), t("12 years and over"))}
        ${step("kids", t("Children"), t("5–11 years · {amount} each (" + Math.round(D.pricing.childShare * 100) + "%)", { amount: fmt(kidPrice()) }))}
        ${step("infants", t("Under 5"), t("Free, on your lap"))}
      </div>
      <ul class="tp-plan__notes">
        <li>${I.home}<span><b>${plural(rooms(), "{n} room", "{n} rooms")}</b>, ${t("twin sharing")}${roomNote ? `. ${roomNote}` : ""}.</span></li>
        <li>${I.person}<span>${T.seniorNote} <a href="#care">${t("How we pace the trip")}</a></span></li>
        ${state.infants ? `<li>${I.group}<span>${T.infantNote}</span></li>` : ""}
      </ul>`;

    const bal = total() - depositNow(), balDue = daysBefore(21), late = Date.parse(balDue) < Date.now();
    // Say which cancellation rule applies if they book today, in rupees
    const cancelLine = (fd, hd, hs) => {
      const left = (Date.parse(state.date) - Date.now()) / DAY;
      if (left >= fd) return `<b>${t("Free cancellation")}</b><span>${t("until {date}. After that {amount} is charged until {until}, then no refund.", { date: longDate(daysBefore(fd)), amount: fmt(Math.round(total() * hs)), until: shortDate(daysBefore(hd)) })}`;
      if (left >= hd) return `<b>${fmt(Math.round(total() * hs))}</b><span>${t("is charged if you cancel before {until}, as this date is less than {days} days away. After that, no refund.", { until: shortDate(daysBefore(hd)), days: fd })}`;
      return `<b>${t("No refund")}</b><span>${t("if you cancel, as this date is less than {days} days away. Pick a later date for free cancellation.", { days: hd })}`;
    };
    const [[fd], [hd, hs]] = T.cancel;
    $("#tp-sum").innerHTML = `<h3><span>3</span>${t("Your price")}</h3>
      <div class="tp-sum">
        <dl>
          <div><dt>${longDate(state.date)}${state.metro ? ` · ${t("standard departure from {metro}", { metro: tc(state.metro.city) })}` : state.from ? ` · ${t("feeder from {town}", { town: tc(state.from.city) })}` : ""}</dt><dd><a href="#dates">${t("Change")}</a></dd></div>
          <div><dt>${plural(state.adults, "{n} adult", "{n} adults")} × ${fmt(unit())}</dt><dd>${fmt(state.adults * unit())}</dd></div>
          ${state.kids ? `<div><dt>${plural(state.kids, "{n} child", "{n} children")} × ${fmt(kidPrice())}</dt><dd>${fmt(state.kids * kidPrice())}</dd></div>` : ""}
          ${state.infants ? `<div><dt>${t("{n} under 5", { n: state.infants })}</dt><dd>${t("Free")}</dd></div>` : ""}
          ${single() ? `<div><dt>${t("Single room")}</dt><dd>${fmt(single())}</dd></div>` : ""}
          ${offerOff() ? `<div class="tp-sum__off"><dt>${offer().tag}: ${offer().title}</dt><dd>− ${fmt(offerOff())}</dd></div>` : offer() ? `<div class="tp-sum__hint"><dt>${t("{tag}: {amount} off when 2 or more travel", { tag: offer().tag, amount: fmt(offer().perFamily) })}</dt><dd></dd></div>` : ""}
          <div class="tp-sum__total"><dt>${t("Total, all inclusive")}<small>${state.metro ? t("Taxes, hotels, meals and sightseeing from the meeting point.") : t("Taxes, pickup, hotels, meals and sightseeing.")} <a href="#costs">${t("See everything included")}</a></small></dt><dd>${fmt(total())}</dd></div>
        </dl>
        <ul class="tp-sum__pay">
          ${late ? `<li><b>${fmt(total())}</b><span>${t("to pay now. Departure is less than 21 days away")}</span></li>`
            : `<li><b>${fmt(depositNow())}</b><span>${t("to hold your seats today ({amount} per person)", { amount: fmt(depPP()) })}</span></li>
               <li><b>${fmt(bal)}</b><span>${t("by {date}. Pay by UPI, card or bank transfer; ask us about card EMI", { date: longDate(balDue) })}</span></li>`}
          <li>${cancelLine(fd, hd, hs)} <a href="#faq" data-faq="cancel">${t("Cancellation rules")}</a></span></li>
        </ul>
        <a class="btn btn--accent tp-plan__cta" ${bookAttrs()}>${LIVE ? "" : I.wa}${BOOK()}</a>
        <a class="tp-book__call" href="tel:${C.tel}">${I.call}${t("Prefer to talk? Call {phone}", { phone: C.phone })}</a>
        <ol class="tp-next" aria-label="${t("What happens next")}">
          <li><span>${t("<b>We reply in {mins} minutes</b> on WhatsApp, 8 am – 9 pm, and confirm seats.", { mins: T.replyMins })}</span></li>
          <li><span>${t("<b>You pay {amount} by UPI</b> to EpicJourneys only. Nothing is charged before this.", { amount: fmt(late ? total() : depositNow()) })}</span></li>
          <li><span>${t("<b>Seats are held</b>. You get a receipt and your coordinator's number.")}</span></li>
        </ol>
      </div>`;
    renderCard();
  }

  function renderCard() {
    const lowest = upcoming.reduce((m, x) => (x.price < m.price ? x : m), upcoming[0]);
    const rank = Object.entries(D.popularity || {}).sort((a, b) => b[1] - a[1]).findIndex(([n]) => n === T.name);
    const off = lowest.was && Math.round((1 - lowest.price / lowest.was) * 100);
    const tags = [rank > -1 && rank < 3 && [t("Bestseller"), "hot"], off && [t("Sale {n}%", { n: off }), "dark"], ...(T.for || []).map((f) => [f, ""])].filter(Boolean).slice(0, 3);
    const wished = store.get("ej_wish", []).includes(T.name);
    const city = tc(L.city);
    const row = (href, label, value) => `<a class="tp-crow" href="${href}"><span>${label}</span><b>${value}</b><i aria-hidden="true">›</i></a>`;
    const n = travellers(), trip = `${shortDate(state.date)} · ${plural(n, "{n} traveller", "{n} travellers")}`;
    $("#tp-card").innerHTML = `
      <div class="tp-card__top">
        <div class="tp-tags">${tags.map(([x, k]) => `<span class="tp-tag${k ? ` tp-tag--${k}` : ""}">${x}</span>`).join("")}</div>
        <div class="tp-card__icons">
          <button type="button" data-share aria-label="${t("Share this tour on WhatsApp")}">${ico('<path d="M32 40V10M22 20l10-10 10 10"/><path d="M20 30h-6v26h36V30h-6"/>')}</button>
          <button type="button" data-wish aria-pressed="${wished}" aria-label="${wished ? t("Remove from wishlist") : t("Save to wishlist")}">${ico('<path d="M32 52C20 44 9 35 9 23a11 11 0 0 1 23-5 11 11 0 0 1 23 5c0 12-11 21-23 29z"/>')}</button>
        </div>
      </div>
      <p class="tp-card__dur">${t("{days} Days · {nights} Nights", { days: T.days, nights: T.nights })}</p>
      <div class="tp-card__price"><div><small>${t("From")}</small><strong>${fmt(lowest.price)}</strong><span>${t("per person")}</span></div>${lowest.was ? `<p>${t("was")} <s>${fmt(lowest.was)}</s></p>` : ""}</div>
      <p class="tp-card__valid">${t("On {date} · all inclusive from {city}", { date: longDate(lowest.date), city })}</p>
      <div class="tp-crows">
        ${T.rating ? row("#reviews", `${stars(T.rating)} ${T.rating}`, t("{n} reviews", { n: T.ratingCount })) : row("#reviews", t("Traveller reviews"), t("Read"))}
        ${row("#journey", t("Pickup {time}", { time: T.pickup || t("5:30 am") }), `${L.partner}, ${city}`)}
        ${row("#dates", t("Hold seats with {amount}", { amount: fmt(depPP()) }), t("per person"))}
      </div>
      ${state.touched ? `<div class="tp-card__mine"><div><small>${t("Your trip")}</small><strong>${trip}</strong></div><div><small>${t("Total")}</small><strong>${fmt(total())}</strong></div></div>
        <a class="btn btn--accent tp-card__cta" ${bookAttrs()}>${LIVE ? "" : I.wa}${BOOK()}</a>
        <a class="tp-card__link" href="#tp-sum">${t("See price details or change")}</a>`
      : `<a class="btn btn--accent tp-card__cta" href="#dates">${t("Check dates &amp; prices")}</a>`}
      <p class="tp-card__help">${t("Questions? {wa} or {call}", { wa: `<a target="_blank" rel="noopener" href="${waLink(askMsg())}">${t("WhatsApp us")}</a>`, call: `<a href="tel:${C.tel}">${t("call {phone}", { phone: C.phone })}</a>` })}</p>
      <p class="tp-card__code">${t("Trip code <b>{code}</b>. Quote it when you call.", { code: tripCode })}</p>`;

    // Deals: the sale on the cheapest date, and the festive offer when this tour qualifies
    const P = offer(), left = P && Math.ceil((Date.parse(P.ends) - Date.now()) / DAY);
    $("#tp-offers").innerHTML = lowest.was || P ? `<div class="tp-offers"><span class="tp-tag tp-tag--hot">${t("Deals &amp; offers")}</span>
      ${lowest.was ? `<a class="tp-offer" href="#dates"><span class="tp-tag tp-tag--soft">${t("Save {n}%", { n: off })}</span>${t("Departure {date}", { date: longDate(lowest.date) })}</a>` : ""}
      ${P ? `<a class="tp-offer" href="#tp-sum"><span class="tp-tag tp-tag--soft">${P.tag}</span>${t("{amount} off per family · ends in {n} days", { amount: fmt(P.perFamily), n: left })}</a>` : ""}
    </div>` : "";

    $("#tp-mbar").innerHTML = state.touched
      ? `<div><small>${trip}</small><strong>${fmt(total())}</strong></div><a class="btn btn--accent" ${bookAttrs()}>${LIVE ? "" : I.wa}${BOOK()}</a>`
      : `<div><small>${t("From, per person")}</small><strong>${fmt(lowest.price)}</strong></div><a class="btn btn--accent" href="#dates">${t("Check dates &amp; prices")}</a>`;
    $("#tp-wa-head").href = waLink(askMsg());
  }

  // Who the visitor is paying, and where they can walk in
  function renderTrust() {
    $("#tp-trust").innerHTML = `<div class="tp-trust">
      <h3>${t("Who you're booking with")}</h3>
      ${LIVE && (state.metro || L.id === "base") ? "" : `<a class="tp-trust__row" href="https://www.google.com/maps?q=${L.lat},${L.lng}" target="_blank" rel="noopener">${I.lounge}<span><b>${L.partner}</b>${t("Your LocalStart Lounge in {city}. Drop in before you book, {hours}.", { city: tc(L.city), hours: t(C.loungeHours) })} <u>${t("Open in Maps")}</u></span></a>`}
      ${T.captain ? `<a class="tp-trust__row" href="#care">${I.person}<span><b>${t("Captain {name}", { name: t(T.captain.name) })}</b>${t("{years} years, {trips} group trips. Travels with you the whole way.", { years: T.captain.years, trips: T.captain.trips })}</span></a>` : ""}
      <p class="tp-trust__row">${I.shield}<span><b>${C.name}</b>${t(C.reg)} · ${t(C.gst)}. ${t("Pay only to this company by UPI or card. We never ask for money on a personal number.")}</span></p>
    </div>`;
  }

  function renderReviews() {
    const coords = (town) => places.find((p) => p.city === town);
    const dist = (r) => ({ ...r, km: coords(r.town) ? km(L, coords(r.town)) : 9999 });
    // This tour's reviews first; a tour with few gets other stories from nearby, labelled with their trip
    const own = T_EN.reviews;
    const others = own.length >= 4 ? [] : (D.stories || []).filter((r) => !own.some((o) => o.title === r.title)).map((r) => ({ ...dist(r), other: true }));
    const R = [...own.map(dist).sort((a, b) => a.km - b.km), ...others.sort((a, b) => a.km - b.km)].slice(0, 4).map((r) => ({ ...tr(r), km: r.km, other: r.other }));
    $("#tp-reviews").innerHTML = R.map((r) => `<article class="tp-rv">
      <header><span class="tp-rv__avatar" aria-hidden="true">${r.name.split(" ").map((w) => w[0]).join("")}</span><div><strong>${r.name}</strong><span>${tc(r.town)}${r.km < 9999 && r.km > 0 ? ` · ${t("{km} km from you", { km: r.km })}` : r.km === 0 ? ` · ${t("your town")}` : ""}</span></div>${stars(r.rating)}</header>
      <h3>“${r.title}”</h3><p>${r.text}</p>
      <footer>${r.other ? `<b>${r.trip}</b> · ` : ""}${r.when} · ${r.who} · ${t("Picked up {how}", { how: r.pickup })}</footer>
    </article>`).join("");
  }

  // ---------- Events ----------
  function pick(li) {
    state.date = li.dataset.pick; state.touched = true;
    state.from = li.dataset.from ? nearby().find((x) => x.city === li.dataset.from) : null;
    state.metro = li.dataset.metro ? (D.metros || []).find((x) => x.city === li.dataset.metro) : null;
    $$(".tp-dep").forEach((r) => { const on = r === li; r.classList.toggle("on", on); r.setAttribute("aria-checked", String(on)); });
    if (LIVE) renderTrust();
    renderPlan();
  }
  document.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (tab) { state.tab = tab.dataset.tab; $$("[data-tab]").forEach((b) => { b.classList.toggle("on", b === tab); b.setAttribute("aria-selected", String(b === tab)); }); renderTab(); return; }
    const nearBtn = e.target.closest("[data-near]");
    if (nearBtn) {
      const p = nearby().find((x) => x.city === nearBtn.dataset.near), list = $("#tp-near-deps");
      $$(".tp-near li").forEach((li) => li.classList.toggle("on", li.contains(nearBtn)));
      list.innerHTML = upcoming.map((d) => depRow(d, p)).join(""); list.hidden = false;
      return;
    }
    const mBtn = e.target.closest("[data-metro-show]");
    if (mBtn) {
      const m = (D.metros || []).find((x) => x.city === mBtn.dataset.metroShow), list = $("#tp-metro-deps");
      $$(".tp-metros li").forEach((li) => li.classList.toggle("on", li.contains(mBtn)));
      list.innerHTML = upMetro().map((d) => depRow(d, null, m)).join(""); list.hidden = false;
      return;
    }
    const li = e.target.closest("[data-pick]");
    if (li) return pick(li);
    const st = e.target.closest("[data-step]");
    if (st) {
      const k = st.dataset.step, min = k === "adults" ? 1 : 0;
      state[k] = Math.max(min, Math.min(9, state[k] + Number(st.dataset.d))); state.touched = true; renderPlan(); return;
    }
    if (e.target.closest("[data-share]")) {
      const u = new URL(location.href.split("#")[0]); u.searchParams.set("lang", lang); const url = u.toString();
      if (navigator.share) navigator.share({ title: t(T.name), url }).catch(() => {});
      else open(`https://wa.me/?text=${encodeURIComponent(`${t(T.name)}, ${t("{n} days from {city}", { n: T.days, city: tc(L.city) })}: ${url}`)}`, "_blank", "noopener");
      return;
    }
    if (e.target.closest("[data-wish]")) {
      const w = new Set(store.get("ej_wish", [])), had = w.has(T.name);
      had ? w.delete(T.name) : w.add(T.name); store.set("ej_wish", [...w]);
      renderCard(); toast(had ? t("Removed from your wishlist") : t("Saved to your wishlist"));
      return;
    }
    const faq = e.target.closest("[data-faq]");
    if (faq) $$("#faq details").forEach((d) => { if (/cancel/i.test(d.dataset.q)) d.open = true; });
    const lb = e.target.closest("[data-lang]");
    if (lb) setLang(lb.dataset.lang);
  });
  document.addEventListener("keydown", (e) => {
    const li = e.target.closest && e.target.closest("[data-pick]");
    if (li && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(li); }
  });
  document.addEventListener("change", (e) => {
    if (e.target.id === "tp-city") { L = lounge(e.target.value); store.set("ej_city", L.city); state.from = null; state.metro = null; render(); toast(t("Showing departures from {city}", { city: tc(L.city) })); }
  });
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "tp-lead") return;
    e.preventDefault();
    const f = e.target, msg = $("#tl-msg");
    // Each wrong field gets its own line saying how to fix it (Material 3 text-field supporting text)
    const fieldErr = (el, text) => {
      const holder = el.closest(".field"); let err = holder.querySelector(".field__error");
      el.setAttribute("aria-invalid", String(!!text)); el.classList.toggle("invalid", !!text);
      if (text) { if (!err) { err = document.createElement("p"); err.className = "field__error"; err.id = el.id + "-err"; holder.appendChild(err); } err.textContent = text; el.setAttribute("aria-describedby", err.id); }
      else if (err) { err.remove(); el.removeAttribute("aria-describedby"); }
    };
    fieldErr(f.name, f.name.value.trim() ? "" : t("Enter your name."));
    fieldErr(f.phone, /^\d{10}$/.test(f.phone.value.trim()) ? "" : t("Enter a 10-digit mobile number."));
    fieldErr(f.city, f.city.value.trim() ? "" : t("Enter the town you'll travel from."));
    const ok = f.name.value.trim() && /^\d{10}$/.test(f.phone.value.trim()) && f.city.value.trim();
    msg.className = "form-msg " + (ok ? "ok" : "err");
    msg.textContent = ok ? t("Thanks, {name}. A coordinator will call you within 24 hours. (Preview: nothing was sent.)", { name: f.name.value.trim().split(" ")[0] }) : t("Please add your name, a 10-digit phone number and your town.");
  });

  // ---------- Gallery viewer ----------
  const lb = document.createElement("div");
  lb.className = "tp-lb"; lb.hidden = true;
  lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true");
  const chev = (d) => `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  function lbShell() {
    lb.setAttribute("aria-label", t("Photos and videos"));
    lb.innerHTML = `<div class="tp-lb__top"><span class="tp-lb__count"></span><button type="button" class="tp-lb__close" aria-label="${t("Close")}">${chev("M6 6l12 12M18 6 6 18")}<span>${t("Close")}</span></button></div>
      <button type="button" class="tp-lb__nav tp-lb__prev" aria-label="${t("Previous")}">${chev("m15 5-7 7 7 7")}</button>
      <figure class="tp-lb__stage"><div class="tp-lb__media"></div><figcaption class="tp-lb__cap"></figcaption></figure>
      <button type="button" class="tp-lb__nav tp-lb__next" aria-label="${t("Next")}">${chev("m9 5 7 7-7 7")}</button>
      <div class="tp-lb__thumbs"></div>`;
  }
  lbShell();
  document.body.appendChild(lb);
  let gi = 0, lastFocus = null;
  function showGal(i) {
    gi = (i + G.length) % G.length;
    const m = G[gi];
    $(".tp-lb__media", lb).innerHTML = m.video
      ? `<video src="${m.video}" controls autoplay muted playsinline></video>`
      : `<img src="${img(m.img)}" alt="${m.cap}">`;
    $(".tp-lb__cap", lb).innerHTML = `<strong>${m.cap}</strong>${m.by ? `<span>${t(m.video ? "Video: {by}" : "Photo: {by}", { by: m.by })}</span>` : ""}`;
    $(".tp-lb__count", lb).textContent = t("{i} of {n}", { i: gi + 1, n: G.length });
    $$(".tp-lb__thumbs button", lb).forEach((b, j) => b.classList.toggle("on", j === gi));
    $$(".tp-lb__nav", lb).forEach((b) => (b.hidden = G.length < 2));
  }
  function openGal(i) {
    lastFocus = document.activeElement;
    $(".tp-lb__thumbs", lb).innerHTML = G.length > 1 ? G.map((m, j) => `<button type="button" data-thumb="${j}" aria-label="${t("Show {cap}", { cap: m.cap })}"${m.img ? ` style="background-image:url(${img(m.img)})"` : ""}>${m.video ? `<video src="${m.video}#t=1" muted preload="metadata" aria-hidden="true"></video>${I.play}` : ""}</button>`).join("") : "";
    lb.hidden = false; document.documentElement.classList.add("tp-lb-open");
    showGal(i); $(".tp-lb__close", lb).focus();
  }
  function closeGal() {
    lb.hidden = true; document.documentElement.classList.remove("tp-lb-open");
    $(".tp-lb__media", lb).innerHTML = "";
    if (lastFocus) lastFocus.focus();
  }
  lb.addEventListener("click", (e) => {
    if (e.target.closest(".tp-lb__close") || e.target === lb) return closeGal();
    if (e.target.closest(".tp-lb__prev")) return showGal(gi - 1);
    if (e.target.closest(".tp-lb__next")) return showGal(gi + 1);
    const th = e.target.closest("[data-thumb]"); if (th) showGal(Number(th.dataset.thumb));
  });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeGal();
    else if (e.key === "ArrowLeft") showGal(gi - 1);
    else if (e.key === "ArrowRight") showGal(gi + 1);
    else if (e.key === "Tab") { // keep focus inside the viewer
      const f = $$("button:not([hidden]), video[controls]", lb), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener("click", (e) => { const g = e.target.closest("[data-gal]"); if (g) openGal(Number(g.dataset.gal)); });
  // Video tiles play a silent preview on hover
  document.addEventListener("mouseover", (e) => { const v = e.target.closest(".tp-gal__item--video")?.querySelector("video"); if (v) v.play().catch(() => {}); });
  document.addEventListener("mouseout", (e) => { const x = e.target.closest(".tp-gal__item--video"); if (x && !x.contains(e.relatedTarget)) x.querySelector("video").pause(); });

  let toastTimer;
  function toast(m) { const el = $("#toast"); el.textContent = m; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2400); }

  // ---------- Header (copied behaviour, not the homepage scripts) ----------
  const header = $("#header");
  // Fixed text in tour.html (header, menu, footer): its English is kept so it can switch back
  $$("[data-price]").forEach((el) => (el.textContent = fmt(el.dataset.price)));
  const STATIC = ".mega__promo span, .utility__left > span:first-child, .utility__right a, .nav__item > a, .mega__col h4, .mega__col a, .mega__promo strong, .tp-from > span, .footer__tagline, .footer__contact > p:nth-of-type(2), .footer h4, .footer__col a, .footer__regions h5, .footer__regions a, .footer__pay-label, .footer__warn, .footer__legal span:first-child, .footer__legal a, .footer__news button, .footer__news input, .tp-mbar";
  $$(STATIC).forEach((el) => { if (el.matches(".tp-mbar")) return; el.dataset.en = el.matches("input") ? el.placeholder : el.innerHTML; });
  // Payment labels sit beside an icon, so only their own text is swapped
  const payText = $$(".footer__pay .pay").map((el) => { const n = [...el.childNodes].reverse().find((c) => c.nodeType === 3 && c.textContent.trim()); return n && { n, en: n.textContent.trim() }; }).filter(Boolean);
  function headerText() {
    payText.forEach(({ n, en }) => (n.textContent = t(en)));
    $$(STATIC).forEach((el) => {
      if (!("en" in el.dataset)) return;
      if (el.matches("input")) el.placeholder = t(el.dataset.en); else el.innerHTML = t(el.dataset.en);
    });
    $("#tp-city").innerHTML = D.lounges.map((l) => `<option value="${l.city}"${l.city === L.city ? " selected" : ""}>${tc(l.city)}</option>`).join("");
    $("#tp-city").setAttribute("aria-label", t("Departing from"));
    $(".tp-hbtn:not(.tp-hbtn--call)").innerHTML = `${I.wa}<span>${t("WhatsApp us")}</span>`;
    $(".tp-hbtn:not(.tp-hbtn--call)").setAttribute("aria-label", t("WhatsApp us"));
    $(".tp-hbtn--call").innerHTML = `${I.call}<span>${C.phone}</span>`;
    $(".tp-hbtn--call").setAttribute("aria-label", t("Call {phone}", { phone: C.phone }));
    $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    $(".tp-lang").setAttribute("aria-label", t("Language"));
    $("#toast").setAttribute("lang", lang);
  }

  // Switching language keeps the reader where they are on the page
  function setLang(next) {
    if (next === lang) return;
    const anchor = $$(".tp-sec").find((s) => s.getBoundingClientRect().bottom > 140);
    const offset = anchor ? anchor.getBoundingClientRect().top : 0;
    lang = next; store.set("ej_lang", lang);
    hideHint();
    localize(); headerText(); lbShell(); render();
    if (anchor && anchor.id) { const again = document.getElementById(anchor.id); if (again) scrollTo({ top: again.getBoundingClientRect().top + scrollY - offset, behavior: "auto" }); }
    toast(lang === "hi" ? "अब पेज हिंदी में है" : "Page is now in English");
  }
  // A one-time pointer to the switch for first-time English readers
  const hint = $("#tp-lang-hint");
  function hideHint() { if (hint) hint.hidden = true; store.set("ej_lang_hint", 1); }
  if (hint && firstVisit && lang === "en" && !store.get("ej_lang_hint", 0)) {
    hint.hidden = false;
    hint.addEventListener("click", () => setLang("hi"));
    setTimeout(hideHint, 9000);
  }

  let megaTimer;
  const closeMega = () => { $$(".mega").forEach((m) => m.classList.remove("open")); $$(".nav__item").forEach((n) => n.classList.remove("open")); document.body.classList.remove("mega-open"); };
  $$(".nav__item[data-mega]").forEach((item) => item.addEventListener("mouseenter", () => {
    clearTimeout(megaTimer);
    $$(".mega").forEach((m) => m.classList.toggle("open", m.id === "mega-" + item.dataset.mega));
    $$(".nav__item").forEach((n) => n.classList.toggle("open", n === item));
    document.body.classList.add("mega-open");
  }));
  header.addEventListener("mouseleave", () => (megaTimer = setTimeout(closeMega, 150)));
  $$(".nav__item:not([data-mega])").forEach((n) => n.addEventListener("mouseenter", closeMega));

  // Header tone: "photo" over the hero, "light" elsewhere; hides on scroll down
  let lastY = scrollY;
  function updateHeader() {
    const y = scrollY, dy = y - lastY, hero = $(".tp-hero");
    header.classList.toggle("scrolled", y > 10);
    if (y < 120 || $(".mega.open")) header.classList.remove("is-hidden");
    else if (dy > 4) header.classList.add("is-hidden");
    else if (dy < -4) header.classList.remove("is-hidden");
    const footer = $("#footer").getBoundingClientRect();
    header.dataset.tone = hero && hero.getBoundingClientRect().bottom > 40 ? "photo" : footer.top < 40 ? "dark" : "light";
    lastY = y;
    spy();
  }
  addEventListener("scroll", updateHeader, { passive: true });

  // Section bar: marks the section being read, and jumps to one on click
  const NAV_GAP = 156; // header + 12px gap + floating section bar
  function spy() {
    const links = $$("#tp-nav a");
    let on = null;
    links.forEach((a) => { const sec = document.getElementById(a.dataset.spy); if (sec && sec.getBoundingClientRect().top < NAV_GAP + 20) on = a; });
    links.forEach((a) => a.classList.toggle("on", a === on));
    if (on && on.offsetLeft !== undefined) on.parentElement.scrollLeft = on.offsetLeft - 40;
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a || a.getAttribute("href") === "#") return;
    const sec = document.getElementById(a.getAttribute("href").slice(1)); if (!sec) return;
    e.preventDefault();
    if (window.ejLenis) return window.ejLenis.scrollTo(sec, { offset: -NAV_GAP + 10 });
    scrollTo({ top: sec.getBoundingClientRect().top + scrollY - NAV_GAP + 10, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });

  localize();
  headerText();
  if (lang === "hi") lbShell();
  render();
  // Links like tour.html?t=…#dates land on that section once the page is drawn
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) target.scrollIntoView();
  updateHeader();
})();
