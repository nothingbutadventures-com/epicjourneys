"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { ConfirmationResult, RecaptchaVerifier, getAuth, signInWithPhoneNumber } from "firebase/auth";

// Browser side of mobile login. Firebase sends the SMS and checks the code; we then hand its ID token to our server.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseClientConfigured = () => Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

const auth = () => getAuth(getApps().length ? getApp() : initializeApp(config as any));

let verifier: RecaptchaVerifier | null = null;

// Development only: remember the body of Firebase's last refused request, so the real reason can be shown on screen.
let lastRefusal = "";
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production" && !(window as any).__fbFetchWrapped) {
  (window as any).__fbFetchWrapped = true;
  const orig = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const res = await orig(...args);
    const url = typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url || "";
    if (!res.ok && url.includes("identitytoolkit.googleapis.com")) {
      res.clone().text().then((t) => {
        try {
          const j = JSON.parse(t);
          lastRefusal = j?.error?.message || t;
        } catch {
          lastRefusal = t.slice(0, 300);
        }
        console.error("Firebase refused the request:", url.split("?")[0], t);
      }).catch(() => {});
    }
    return res;
  };
}

let verifierVisible = false;

/** Starts an SMS to +91<phone>. Returns the handle needed to check the code the user types. */
export async function sendFirebaseCode(phone: string, containerId: string, visible = false): Promise<ConfirmationResult> {
  const a = auth();
  // One reCAPTCHA is kept and reused between attempts (tearing it down mid-load breaks Google's script). It is only
  // rebuilt when switching between the invisible and the "I'm not a robot" version.
  if (!verifier || verifierVisible !== visible) {
    try {
      verifier?.clear();
    } catch {
      /* already gone */
    }
    const holder = document.createElement("div");
    const parent = document.getElementById(containerId);
    if (parent) {
      parent.innerHTML = "";
      parent.appendChild(holder);
    }
    verifier = new RecaptchaVerifier(a, holder, { size: visible ? "normal" : "invisible" });
    verifierVisible = visible;
  }
  try {
    return await signInWithPhoneNumber(a, `+91${phone}`, verifier);
  } catch (e) {
    // A reCAPTCHA token works once, so reset it for the next attempt.
    try {
      const id = await verifier.render();
      (window as any).grecaptcha?.reset(id);
    } catch {
      /* ignore */
    }
    throw e;
  }
}

/** Checks the typed code and returns the signed ID token for our server. */
export async function confirmFirebaseCode(confirmation: ConfirmationResult, code: string): Promise<string> {
  const cred = await confirmation.confirm(code);
  const token = await cred.user.getIdToken();
  // We keep our own session; the Firebase one isn't needed any more.
  await auth().signOut().catch(() => {});
  return token;
}

/** Plain-language message for a Firebase error. While developing, the raw error code is added so a failure can be diagnosed. */
export function firebaseMessage(e: any): string {
  const msg = friendly(e);
  // Firebase puts the real reason (e.g. which API or key setting refused the request) in the server response.
  const detail: string = e?.customData?._serverResponse?.error?.message || e?.customData?._serverResponse?.error?.status || lastRefusal || "";
  console.error("Firebase phone auth error:", e?.code, e?.message, e?.customData);
  return process.env.NODE_ENV !== "production" && e?.code ? `${msg} (${e.code}${detail ? ` — ${detail}` : ""})` : msg;
}

function friendly(e: any): string {
  switch (e?.code) {
    case "auth/invalid-phone-number":
      return "That mobile number isn't valid.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/invalid-verification-code":
      return "That code isn't right.";
    case "auth/code-expired":
    case "auth/session-expired":
      return "That code has expired. Ask for a new one.";
    case "auth/captcha-check-failed":
    case "auth/missing-app-credential":
      return "We couldn't confirm you're not a robot. Refresh the page and try again.";
    case "auth/quota-exceeded":
      return "We can't send more codes right now. Please try again later.";
    case "auth/operation-not-allowed":
      return "Mobile login isn't turned on yet.";
    case "auth/network-request-failed":
      return "Network problem. Check your connection and try again.";
    case "auth/billing-not-enabled":
      return "SMS sending needs billing turned on for this Firebase project.";
    case "auth/unauthorized-domain":
      return "This website address isn't in Firebase's authorized domains yet.";
    case "auth/invalid-app-credential":
      return "Firebase couldn't verify this browser. Check the API key restrictions and reCAPTCHA / App Check settings in the Firebase and Google Cloud consoles.";
    case "auth/app-not-authorized":
    case "auth/invalid-api-key":
      return "Firebase doesn't accept this site's web keys. Check the web app values in .env.";
    default:
      return e?.message ? "Couldn't send the code. Please try again." : "Something went wrong. Please try again.";
  }
}
