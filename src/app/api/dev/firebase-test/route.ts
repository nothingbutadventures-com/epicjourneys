import { NextRequest, NextResponse } from "next/server";

// Development-only diagnostic: a bare Firebase phone-auth page using Firebase's own script and none of the site's code.
// If it fails the same way as the login screen, the problem is in the Firebase / Google Cloud project, not this app.
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (new URL(req.url).searchParams.get("config") === "1") {
    // Only the public web values (they are visible to every visitor of the site anyway).
    return NextResponse.json({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  }

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Firebase phone test</title></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 16px">
<h2>Firebase phone test (no site code)</h2>
<p style="color:#555">Plain Firebase SDK, straight from Google. Enter a mobile number and press Send. Reload the page between tests.</p>
<p><input id="ph" placeholder="10-digit mobile number" style="padding:8px;width:230px"> <label><input type="checkbox" id="vis"> visible reCAPTCHA</label></p>
<p><button id="go" style="padding:8px 16px">Send code</button></p>
<div id="rc"></div>
<pre id="out" style="background:#f4f4f4;padding:12px;white-space:pre-wrap;word-break:break-word"></pre>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"></script>
<script>
const out = document.getElementById("out");
const log = (m) => { out.textContent += m + "\\n"; };
let verifier;
(async () => {
  const cfg = await (await fetch("/api/dev/firebase-test?config=1")).json();
  log("Project: " + cfg.projectId + " | auth domain: " + cfg.authDomain + " | origin: " + location.origin);
  firebase.initializeApp(cfg);
  const auth = firebase.auth();
  const origFetch = window.fetch;
  window.fetch = async (...a) => {
    const r = await origFetch(...a);
    const u = typeof a[0] === "string" ? a[0] : (a[0] && a[0].url) || "";
    if (u.includes("identitytoolkit") && !r.ok) r.clone().text().then((t) => log("Firebase replied " + r.status + ": " + t.replace(/\\s+/g, " ")));
    return r;
  };
  document.getElementById("go").onclick = async () => {
    const n = document.getElementById("ph").value.replace(/\\D/g, "").replace(/^91(?=\\d{10}$)/, "");
    if (!/^[6-9]\\d{9}$/.test(n)) return log("Enter a valid 10-digit Indian mobile number.");
    try {
      if (!verifier) verifier = new firebase.auth.RecaptchaVerifier("rc", { size: document.getElementById("vis").checked ? "normal" : "invisible" });
      log("Asking Firebase to text +91" + n + " ...");
      const conf = await auth.signInWithPhoneNumber("+91" + n, verifier);
      log("SUCCESS: Firebase accepted the request. Check the phone for the code. (verificationId received: " + Boolean(conf.verificationId) + ")");
    } catch (e) {
      log("FAILED: " + e.code + " - " + e.message);
    }
  };
})();
</script></body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
