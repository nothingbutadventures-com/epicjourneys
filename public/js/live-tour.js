/* Maps the live tour (window.EJ_LIVE, from the API) onto the shapes tour.js expects.
   Runs after data.js and tour-hi.js, before tour.js. */
(function () {
  const LV = window.EJ_LIVE;
  if (!LV || !LV.tour) return;
  const D = window.EJ, raw = LV.tour;
  const iso = (s) => new Date(s).toISOString().slice(0, 10);
  const slug = raw.slug || raw._id;
  const place = raw.targetCity || raw.state || "";
  const FOOD = { "pure-veg": 0, "strict-jain": 1, "home-comfort": 2 };

  D.live = { slug };
  Object.assign(D.company || (D.company = {}), LV.company && LV.company.whatsapp ? { whatsapp: LV.company.whatsapp } : {}, LV.company && LV.company.tel ? { tel: LV.company.tel, phone: LV.company.tel } : {});
  D.promo = null;                 // real offers arrive as each date's own discount
  D.pricing.childShare = 1;       // checkout charges every traveller the same price

  // Lounges are the cities that have a partner; the tour's own start is added when none exist
  const base = raw.baseStartCity;
  D.lounges = (raw.startCities || []).map((c) => ({ id: c.id, city: c.name, state: c.state, partner: (c.partner && c.partner.name) || "LocalStart Lounge, " + c.name, lat: c.lat, lng: c.lng }));
  if (!D.lounges.length && base) D.lounges = [{ id: "base", city: base.name, state: base.state, partner: "EpicJourneys", lat: base.lat, lng: base.lng }];
  D.towns = [];
  D.metros = base ? [{ city: base.name, meet: "the tour's starting point", lat: base.lat, lng: base.lng }] : [];

  const dep = (d) => {
    const off = d.discountPercentage || 0, list = d.price;
    return { id: d._id, date: iso(d.startDate), seats: d.available, of: d.seats, guaranteed: false, price: Math.round(list * (1 - off / 100)), was: off ? list : undefined, off, cityId: d.cityId, isBase: !!d.isBase, raw: d };
  };
  const liveDeps = (raw.departures || []).filter((d) => d.available > 0).map(dep);
  const byCity = {};
  liveDeps.filter((d) => !d.isBase).forEach((d) => (byCity[d.cityId] = byCity[d.cityId] || []).push(d));
  const baseDeps = liveDeps.filter((d) => d.isBase);
  if (D.lounges.length === 1 && D.lounges[0].id === "base") byCity.base = baseDeps;

  const day = (d) => ({ title: d.title || "", text: d.description || "", stay: d.stay || "", meals: d.meals || "" });
  const mainDays = raw.itinerary || [];
  const itineraryFor = (d) => {
    const r = (d && d.raw) || {};
    return [...(r.startItinerary || []), ...mainDays, ...(r.endItinerary || [])].map(day);
  };

  const reviews = (LV.reviews || []).filter((r) => (r.tourId && r.tourId === raw._id) || r.tourTitle === raw.title).map((r) => ({
    name: r.userName || r.name || "Traveller", town: r.location || "India", who: "", when: new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
    rating: r.rating, pickup: "", title: "", text: r.comment, km: 9999,
  }));
  const avg = reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;
  const lowest = (liveDeps.length ? liveDeps : [{ price: raw.priceInr }]).reduce((m, d) => Math.min(m, d.price), Infinity);
  const fp = raw.foodPlan in FOOD ? FOOD[raw.foodPlan] : 0;

  D.tours = (LV.others || []).map((t) => ({
    name: t.title, slug: t.slug || t._id, img: t.coverImage, loc: [t.targetCity, t.state].filter(Boolean).join(", "), state: t.state, city: t.targetCity,
    dur: `${t.durationDays}D / ${t.durationNights}N`, price: t.priceInr, was: t.discountPercentage > 0 ? t.listPriceInr : undefined, off: t.discountPercentage || 0, themes: t.travelStyles || [],
  }));

  const gallery = [raw.coverImage, ...(raw.images || [])].filter(Boolean);
  D.galleries = D.galleries || {};
  D.galleries[slug] = gallery.map((img, i) => ({ img, cap: i ? raw.title : [place, raw.state].filter(Boolean).join(", ") }));

  D.tourPages = {
    [slug]: {
      live: true, outline: true, slug, id: raw._id,
      name: raw.title, short: place, img: raw.coverImage, loc: [raw.targetCity, raw.state].filter(Boolean).join(", "), state: raw.state, themes: raw.travelStyles || [],
      dest: raw.destinationId && raw.destinationId.coordinates ? { lat: raw.destinationId.coordinates.lat, lng: raw.destinationId.coordinates.lng } : undefined,
      days: raw.durationDays, nights: raw.durationNights, pace: raw.physicalRating || "Easy pace", meals: "Breakfast & dinner included", pickup: "6:00 am",
      rating: avg || 0, ratingCount: reviews.length, price: lowest, deposit: 0, depositType: raw.depositType, depositValue: raw.depositValue, singleFlat: raw.singleRoomPriceInr || 0,
      summary: raw.shortDescription || raw.description || "", highlights: raw.highlights || [],
      depsByCity: byCity, baseDeps, departures: [], itineraryFor,
      itinerary: itineraryFor(null),
      includes: (raw.inclusions || []).length ? raw.inclusions.map((x) => [x, ""]) : D.pricing.included,
      excludes: (raw.exclusions || []).length ? raw.exclusions : D.tourDefaults.excludes,
      food: D.tourDefaults.food, foodIdx: fp,
      reviews,
      faq: (raw.faqs || []).length ? raw.faqs.map((f) => [f.question, f.answer]) : [...(D.faq.Booking || []), ...(D.faq.Cancellations || [])].slice(0, 5),
      similar: D.tours.slice(0, 4).map((x) => ({ name: x.name })),
    },
  };
})();
