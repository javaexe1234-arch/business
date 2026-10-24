import crypto from "node:crypto";

const COOKIE = "atelier_admin";
const MAX_AGE_MS = 1000 * 60 * 60 * 12;

function secret() {
  return process.env.SESSION_SECRET || "dev-only-secret";
}

function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret()).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verify(token) {
  if (!token || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", secret()).update(data).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (!payload?.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setSession(res) {
  const token = sign({ role: "admin", exp: Date.now() + MAX_AGE_MS });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE_MS,
    path: "/",
  });
}

export function clearSession(res) {
  res.clearCookie(COOKIE, { path: "/" });
}

export function requireAdmin(req, res, next) {
  const payload = verify(req.cookies?.[COOKIE]);
  if (!payload) {
    return res.status(401).json({ error: "Требуется вход в админку" });
  }
  req.admin = payload;
  next();
}

export function checkPassword(password) {
  const expected = process.env.ADMIN_PASSWORD || "change-me";
  const a = Buffer.from(String(password || ""));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
