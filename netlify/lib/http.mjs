/* ==========================================================
   ROYAL SUITS — HTTP (respostas, CORS, validação)
   ========================================================== */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Session-Id",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
};

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...CORS,
      ...extraHeaders,
    },
  });
}

export function ok(data = {}) {
  return json({ ok: true, ...data });
}

export function fail(message, status = 400, details = null) {
  return json({ ok: false, erro: message, ...(details ? { detalhes: details } : {}) }, status);
}

export function preflight() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function body(request) {
  if (!request.body) return {};
  try {
    const data = await request.json();
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

/* ------------------------ VALIDAÇÃO ------------------------ */

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v || "").trim());

export const digits = (v) => String(v || "").replace(/\D/g, "");

export function isCep(v) {
  return digits(v).length === 8;
}

export function isCpfCnpj(v) {
  const d = digits(v);
  return d.length === 11 || d.length === 14;
}

export function text(v, max = 500) {
  return String(v == null ? "" : v).trim().slice(0, max);
}

export function num(v, fallback = 0) {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function money(v) {
  return Math.round(num(v) * 100) / 100;
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { senhaHash, resetToken, ...safe } = user;
  return safe;
}

export function getClientIp(request) {
  return (
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-forwarded-for") ||
    "desconhecido"
  );
}
