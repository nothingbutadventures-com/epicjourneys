/* Partners page: territory tracker, apply form, header tone.
   Reads EJ.lounges (taken territories) and EJ.towns (open ones) from data.js.
   The form validates in the browser and sends nothing in this preview. */
(function () {
  const EJ = window.EJ || {};
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- Territory tracker ---------- */
  const rows = [
    ...(EJ.lounges || []).map((l) => ({ city: l.city, state: l.state, partner: l.partner, open: false, id: l.id })),
    ...(EJ.towns || []).map((t) => ({ city: t.city, state: t.state, partner: "", open: true, id: t.id })),
  ].sort((a, b) => a.state.localeCompare(b.state) || a.city.localeCompare(b.city));

  const body = $("#pp-terr");
  const find = $("#pp-find");
  const empty = $("#pp-empty");
  let filter = "all";

  function render() {
    const q = find.value.trim().toLowerCase();
    const list = rows.filter((r) => (filter === "all" || (filter === "open") === r.open)
      && (!q || r.city.toLowerCase().includes(q) || r.state.toLowerCase().includes(q)));
    body.innerHTML = list.map((r) => `<tr>
      <th scope="row">${esc(r.city)}<small>${esc(r.state)}</small></th>
      <td><span class="pp-status pp-status--${r.open ? "open" : "taken"}">${r.open ? "Open" : "Taken"}</span></td>
      <td>${r.open ? "" : esc(r.partner)}</td>
      <td><a href="#apply" class="pp-claim${r.open ? " pp-claim--open" : ""}" data-claim="${esc(r.city + ", " + r.state)}">${r.open ? "Claim this territory" : "Join the waiting list"}</a></td>
    </tr>`).join("");
    empty.hidden = list.length > 0;
    const link = $("a", empty);
    link.dataset.claim = q ? find.value.trim() : "";
  }
  find.addEventListener("input", render);
  document.querySelectorAll(".pp-filters button").forEach((b) => b.addEventListener("click", () => {
    filter = b.dataset.filter;
    document.querySelectorAll(".pp-filters button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    render();
  }));
  render();

  // Any claim link prefills the city field and puts the cursor in the form
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-claim]");
    if (!a) return;
    if (a.dataset.claim) $("#pf-city").value = a.dataset.claim;
    setTimeout(() => $("#pf-name").focus({ preventScroll: true }), 450);
  });

  /* ---------- Apply form ---------- */
  const form = $("#pp-form");
  const msg = $("#pp-msg");
  const digits = (el, n) => el.addEventListener("input", () => { el.value = el.value.replace(/\D/g, "").slice(0, n); });
  digits($("#pf-phone"), 10);
  digits($("#pf-pin"), 6);

  const rules = {
    name: (v) => v.trim().length >= 2 || "Please enter your full name.",
    phone: (v) => /^[6-9]\d{9}$/.test(v) || "Enter a 10-digit mobile number.",
    email: (v) => /^\S+@\S+\.\S+$/.test(v.trim()) || "Enter a valid email address.",
    biz: (v) => v.trim().length >= 2 || "Please enter your business name.",
    industry: (v) => !!v || "Choose your current business.",
    address: (v) => v.trim().length >= 8 || "Please enter the full office address.",
    city: (v) => v.trim().length >= 2 || "Enter your city and state.",
    pin: (v) => /^\d{6}$/.test(v) || "Enter a 6-digit pincode.",
  };

  function check(el) {
    const rule = rules[el.name];
    if (!rule) return true;
    const field = el.closest(".pp-field");
    const res = rule(el.value);
    let err = $(".pp-err", field);
    if (res === true) {
      field.classList.remove("bad");
      el.removeAttribute("aria-invalid");
      if (err) err.remove();
      return true;
    }
    field.classList.add("bad");
    el.setAttribute("aria-invalid", "true");
    if (!err) {
      err = document.createElement("span");
      err.className = "pp-err";
      err.id = el.id + "-err";
      field.appendChild(err);
      el.setAttribute("aria-describedby", err.id);
    }
    err.textContent = res;
    return false;
  }
  form.addEventListener("blur", (e) => { if (e.target.closest(".pp-field.bad")) check(e.target); }, true);
  form.addEventListener("input", (e) => { if (e.target.closest(".pp-field.bad")) check(e.target); });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const els = [...form.querySelectorAll("input[name], select[name]")].filter((el) => rules[el.name]);
    const bad = els.filter((el) => !check(el));
    const box = form.elements.certify;
    const boxOk = box.checked;
    box.closest(".pp-check").classList.toggle("bad", !boxOk);
    msg.className = "pp-msg";
    if (bad.length || !boxOk) {
      msg.classList.add("no");
      msg.textContent = bad.length ? "Please fix the highlighted fields." : "Please confirm your office meets the three requirements.";
      (bad[0] || box).focus();
      return;
    }
    const first = form.elements.name.value.trim().split(/\s+/)[0];
    const where = form.elements.city.value.trim();
    const [cityName, ...rest] = where.split(",").map((x) => x.trim());
    const match = rows.find((r) => `${r.city}, ${r.state}`.toLowerCase() === where.toLowerCase());
    const btn = form.querySelector(".pp-submit");
    btn.disabled = true;
    fetch("/api/partner-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.elements.name.value, email: form.elements.email.value, phone: form.elements.phone.value,
        companyName: form.elements.biz.value, address: form.elements.address.value,
        experience: form.elements.industry.value, city: match ? match.city : cityName, state: match ? match.state : rest.join(", "),
        destinationId: match && match.open ? match.id : undefined, message: `Pincode ${form.elements.pin.value}`,
      }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok && d.success, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || "Couldn't send your application. Please try again.");
        msg.classList.add("ok");
        msg.textContent = `Thank you, ${first}. Your application for ${where} is in. Our partner team will message you on WhatsApp within 2 working hours.`;
      })
      .catch((err) => {
        btn.disabled = false;
        msg.classList.add("no");
        msg.textContent = err.message;
      });
  });

  /* ---------- Header shadow on scroll ---------- */
  const header = $("#header");
  const onScroll = () => header.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Nav: underline the section in view ---------- */
  const links = [...document.querySelectorAll(".pp-nav a")];
  const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((a) => { const sec = $(a.getAttribute("href")); if (sec) spy.observe(sec); });
})();
