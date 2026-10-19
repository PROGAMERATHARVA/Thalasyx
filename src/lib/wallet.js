// Lightweight identity for quiz creators & players: an optional account
// (username + password) or an automatic device key. The "owner key" is what
// ties quizzes, coins and owned avatar packs together.

const DEVICE_KEY = "bq_device";
const SESSION_KEY = "bq_session";

export function ensureDeviceKey() {
  if (typeof window === "undefined") return "";
  let k = window.localStorage.getItem(DEVICE_KEY);
  if (!k) {
    k = "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem(DEVICE_KEY, k);
  }
  return k;
}

export function getSession() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

// "acct:<id>" when signed in, otherwise "dev:<deviceKey>"
export function getOwnerKey() {
  if (typeof window === "undefined") return "";
  const s = getSession();
  if (s?.account_id && s?.token) return `acct:${s.account_id}`;
  return `dev:${ensureDeviceKey()}`;
}