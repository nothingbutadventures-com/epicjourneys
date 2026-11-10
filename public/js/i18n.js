// Shows the homepage in Hindi when the visitor picked हिंदी (localStorage "ej_lang" = "hi").
// Loads after data.js, tour-hi.js and home-hi.js and before app.js, so text is translated before
// scroll.js splits headings into words. Text rendered later is caught by a MutationObserver.
// Text is matched exactly (trimmed); anything without a translation stays in English.
(() => {
  let lang = "en";
  try { lang = JSON.parse(localStorage.getItem("ej_lang")) || "en"; } catch {}
  if (lang !== "hi" || !window.EJ) return;
  document.documentElement.lang = "hi";

  const dict = Object.assign({}, EJ.hi || {}, EJ.hiHome || {});
  const MONTHS = { Jan: "जन॰", Feb: "फ़र॰", Mar: "मार्च", Apr: "अप्रैल", May: "मई", Jun: "जून", Jul: "जुल॰", Aug: "अग॰", Sep: "सित॰", Oct: "अक्टू॰", Nov: "नव॰", Dec: "दिस॰",
    January: "जनवरी", February: "फ़रवरी", March: "मार्च", April: "अप्रैल", June: "जून", July: "जुलाई", August: "अगस्त", September: "सितंबर", October: "अक्टूबर", November: "नवंबर", December: "दिसंबर" };
  const word = (s) => dict[s] || MONTHS[s] || s;
  const rx = (s) => s.replace(/[.*+?^$()|[\]\\]/g, "\\$&");

  // Dictionary keys with {city}-style slots become patterns, and the slot value is translated too.
  const templates = Object.keys(EJ.hiHome || {}).filter((k) => /\{\w+\}/.test(k)).map((k) => {
    const names = [];
    const re = new RegExp("^" + rx(k).replace(/\\?\{(\w+)\\?\}/g, (_, n) => (names.push(n), "(.+?)")) + "$");
    return { re, names, out: dict[k] };
  });

  const P = [
    [/^(\d[\d,]*) km away$/, (m) => `${m[1]} किमी दूर`],
    [/^from (.+)$/, (m) => `${word(m[1])} से`],
    [/^(Next|Departs): (\w+) (\d{4})$/, (m) => `${m[1] === "Next" ? "अगला" : "रवाना"}: ${word(m[2])} ${m[3]}`],
    [/^(\w+) (\d{4})$/, (m) => (MONTHS[m[1]] ? `${MONTHS[m[1]]} ${m[2]}` : null)],
    [/^(Only )?(\d+) seats? left on (\d+) (\w+)$/, (m) => `${m[3]} ${word(m[4])} को ${m[1] ? "सिर्फ़ " : ""}${m[2]} सीटें बचीं`],
    [/^(\d+) departures?$/, (m) => `${m[1]} प्रस्थान`],
    [/^· (.+)$/, (m) => { const o = tr(m[1]); return o ? "· " + o : null; }],
    [/^→ (.+)$/, (m) => { const o = tr(m[1]); return o ? "→ " + o : null; }],
    [/^Every tour starts at a LocalStart Lounge in your own town(?:\. In (.+), that’s (.+?))?, so the holiday begins with chai, not a 4 am bus\.$/,
      (m) => `हर टूर आपके अपने शहर के LocalStart लाउंज से शुरू होता है${m[1] ? `। ${word(m[1])} में, यह ${m[2]} है` : ""}, यानी छुट्टी चाय से शुरू होती है, सुबह 4 बजे की बस से नहीं।`],
    [/^Only (\d+) seats? left at this price$/, (m) => `इस कीमत पर सिर्फ़ ${m[1]} सीटें बचीं`],
    [/^(\d+) seats? left$/, (m) => `${m[1]} सीटें बचीं`],
    [/^(\d+) of (\d+) seats left$/, (m) => `${m[2]} में से ${m[1]} सीटें बचीं`],
    [/^(\d+) of (\d+) tours$/, (m) => `${m[2]} में से ${m[1]} टूर`],
    [/^(\d+) departures? · sample dates$/, (m) => `${m[1]} प्रस्थान · नमूना तारीख़ें`],
    [/^(\d+) results? for$/, (m) => `${m[1]} नतीजे:`],
    [/^(\d+) tours?$/, (m) => `${m[1]} टूर`],
    [/^(\d+)D \/ (\d+)N$/, (m) => `${m[1]} दिन / ${m[2]} रात`],
    [/^(\d+) days?$/, (m) => `${m[1]} दिन`],
    [/^(\d+) out of 5$/, (m) => `5 में से ${m[1]}`],
    [/^(\d+) min read$/, (m) => `${m[1]} मिनट पढ़ाई`],
    [/^Slide (\d+): (.+)$/, (m) => `स्लाइड ${m[1]}: ${word(m[2])}`],
    [/^Save (.+)$/, (m) => `${m[1]} बचाएँ`],
    [/^Saved (.+) to your wishlist$/, (m) => `${word(m[1])} विशलिस्ट में सेव किया`],
    [/^(.+) Tours$/, (m) => (dict[m[1]] ? `${dict[m[1]]} टूर` : null)],
    [/^Average from (\d+) reviews$/, (m) => `${m[1]} रिव्यू का औसत`],
    [/^Picked up (\d+) min from home$/, (m) => `घर से ${m[1]} मिनट पर पिकअप`],
    [/^(\d+) adults? × (.+)$/, (m) => `${m[1]} वयस्क × ${m[2]}`],
    [/^(\d+) child(?:ren)? × (.+)$/, (m) => `${m[1]} बच्चे × ${m[2]}`],
    [/^(\d+) infants?$/, (m) => `${m[1]} शिशु`],
    [/^Coach from the (.+) lounge and back$/, (m) => `${word(m[1])} लाउंज से कोच, आना-जाना`],
    [/^(.+) per paying traveller, and nothing is added later\.$/, (m) => `${m[1]} प्रति भुगतान करने वाला यात्री, बाद में कुछ नहीं जुड़ता।`],
    [/^Departs (.+)$/, (m) => `रवाना: ${word(m[1])}`],
    [/^(\d[\d,]*) km from (.+)$/, (m) => `${word(m[2] === "you" ? "आप" : m[2])} से ${m[1]} किमी`],
    [/^📍 Near (.+?)(?:, (.+?))?( ·)?$/, (m) => `📍 ${word(m[1])}${m[2] ? ", " + word(m[2]) : ""} के पास${m[3] || ""}`],
    [/^Near (.+)$/, (m) => `${word(m[1])} के पास`],
    [/^Tours closest to (.+) first\. Filter by destination, type of trip, length, budget or month\.$/,
      (m) => `${word(m[1])} के सबसे पास वाले टूर पहले। जगह, यात्रा के प्रकार, अवधि, बजट या महीने से छाँटें।`],
    [/^Showing tours nearest you, from (.+)$/, (m) => `आपके सबसे पास के टूर, ${word(m[1])} से`],
    [/^Showing tours departing from (.+)$/, (m) => `${word(m[1])} से रवाना होने वाले टूर`],
    [/^Nearest: (.+), (\d[\d,]*) km away \((.+)\)\.$/, (m) => `सबसे पास: ${word(m[1])}, ${m[2]} किमी दूर (${m[3]})।`],
    [/^(.+) \((\d[\d,]*) km\)$/, (m) => `${word(m[1])} (${m[2]} किमी)`],
    [/^(.+) → (.+)$/, (m) => `${word(m[1])} → ${word(m[2])}`],
    [/^Filling fast$/, () => "तेज़ी से भर रहा है"],
  ];

  function tr(s) {
    if (dict[s]) return dict[s];
    if (MONTHS[s]) return MONTHS[s];
    for (const t of templates) {
      const m = s.match(t.re);
      if (m) { let o = t.out; t.names.forEach((nm, i) => (o = o.replace(`{${nm}}`, word(m[i + 1])))); return o; }
    }
    for (const [re, f] of P) { const m = s.match(re); if (m) { const o = f(m); if (o) return o; } }
    // "A · B · C": translate each part when every part is known
    if (s.includes(" · ")) {
      const parts = s.split(" · ").map((p) => tr(p) ?? (/^[\d₹,.\s★%+–-]+$/.test(p) ? p : null));
      if (parts.every((p) => p !== null)) return parts.join(" · ");
    }
    return null;
  }

  const fix = (raw) => {
    const t = raw.trim();
    if (!t || !/[A-Za-z]/.test(t)) return null;
    const o = tr(t);
    return o && o !== t ? raw.replace(t, o) : null;
  };

  // Headlines that hold an <em> are swapped whole so the Hindi word order works.
  const heads = Object.entries(EJ.hiHomeHtml || {}).map(([k, v]) => {
    const re = new RegExp("^" + rx(k).replace(/\\\{x\\\}|\{x\}/, "([^<]*)") + "$");
    return { re, v };
  });
  function doHeads(root) {
    root.querySelectorAll("h1, h2, h3").forEach((h) => {
      if (h.dataset.hi) return;
      const html = h.innerHTML.replace(/\s+/g, " ").trim();
      for (const { re, v } of heads) {
        const m = html.match(re);
        if (m) { h.innerHTML = v.replace("{x}", word(m[1] || "")); h.dataset.hi = "1"; return; }
      }
    });
  }

  const ATTRS = ["placeholder", "aria-label", "title", "alt"];
  const SKIP = /^(SCRIPT|STYLE|NOSCRIPT|CODE)$/;
  function run(root) {
    if (root.nodeType === 3) { const o = fix(root.nodeValue); if (o) root.nodeValue = o; return; }
    if (root.nodeType !== 1 || SKIP.test(root.nodeName)) return;
    doHeads(root.parentNode || root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (x) => (SKIP.test(x.parentNode.nodeName) ? 2 : 1) });
    const list = []; while (w.nextNode()) list.push(w.currentNode);
    list.forEach((x) => { const o = fix(x.nodeValue); if (o) x.nodeValue = o; });
    [root, ...root.querySelectorAll("[placeholder],[aria-label],[title],[alt]")].forEach((el) => ATTRS.forEach((a) => {
      const v = el.getAttribute && el.getAttribute(a); if (!v) return;
      const o = fix(v); if (o) el.setAttribute(a, o);
    }));
  }

  (EJ.heroSlides || []).forEach((h) => { if (dict[h.line]) h.line = dict[h.line]; });
  (EJ.ugc || []).forEach((u) => (u.chat || u.msgs || []).forEach((m) => { if (Array.isArray(m) && dict[m[2]]) m[2] = dict[m[2]]; }));

  const tt = fix(document.title); if (tt) document.title = tt;
  run(document.body);
  new MutationObserver((recs) => recs.forEach((r) => {
    if (r.type === "characterData") run(r.target);
    else if (r.type === "attributes") { const o = fix(r.target.getAttribute(r.attributeName) || ""); if (o) r.target.setAttribute(r.attributeName, o); }
    else r.addedNodes.forEach(run);
  })).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
})();
