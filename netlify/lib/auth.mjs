/* ==========================================================
   ROYAL SUITS — AUTENTICAÇÃO
   ----------------------------------------------------------
   - Senhas: scrypt (Node crypto) com salt aleatório
   - Sessões: JWT HS256 assinado com JWT_SECRET
   - Papéis: "cliente" | "admin"
   ========================================================== */

import crypto from "node:crypto";
import { get, put, setIndex, getIndex } from "./db.mjs";

const SECRET = process.env.JWT_SECRET || "royal-suits-dev-secret-mude-em-producao";
const TOKEN_TTL_DAYS = 7;

/* Em produção, um JWT_SECRET ausente permitiria forjar tokens de admin.
   Não derrubamos a API (o site continua navegável), mas avisamos alto
   no log da função para o problema aparecer no painel da Netlify. */
if (!process.env.JWT_SECRET && process.env.NETLIFY) {
  console.error(
    "[auth] JWT_SECRET não configurado. Defina a variável em " +
      "Site configuration > Environment variables e faça um novo deploy."
  );
}

/* ------------------------- SENHAS ------------------------- */

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  try {
    const [algo, salt, hash] = String(stored || "").split("$");
    if (algo !== "scrypt" || !salt || !hash) return false;
    const calc = crypto.scryptSync(String(password), salt, 64);
    const expected = Buffer.from(hash, "hex");
    return calc.length === expected.length && crypto.timingSafeEqual(calc, expected);
  } catch {
    return false;
  }
}

/* --------------------------- JWT --------------------------- */

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromB64url = (str) =>
  Buffer.from(String(str).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

function hmac(data) {
  return crypto.createHmac("sha256", SECRET).update(data).digest();
}

export function signToken(payload, days = TOKEN_TTL_DAYS) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(
    JSON.stringify({ ...payload, iat: now, exp: now + days * 24 * 60 * 60 })
  );
  const signature = b64url(hmac(`${header}.${body}`));
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token) {
  try {
    const [header, body, signature] = String(token || "").split(".");
    if (!header || !body || !signature) return null;
    const expected = b64url(hmac(`${header}.${body}`));
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(fromB64url(body));
    if (!payload.exp || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ------------------------- USUÁRIOS ------------------------- */

export async function findUserByEmail(email) {
  const ref = await getIndex("user-email", email);
  if (!ref) return null;
  return get("users", ref.id || ref);
}

export async function createUser({ nome, email, telefone, senha, role = "cliente" }) {
  const existing = await findUserByEmail(email);
  if (existing) return { error: "Já existe uma conta com este e-mail." };

  const id = crypto.randomUUID();
  const user = await put("users", id, {
    nome,
    email: String(email).toLowerCase().trim(),
    telefone: telefone || "",
    senhaHash: hashPassword(senha),
    role,
    ativo: true,
  });
  await setIndex("user-email", email, { id });
  return { user };
}

export function isAdminCredentials(email, senha) {
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const adminPass = process.env.ADMIN_PASSWORD || "";
  return Boolean(
    adminEmail &&
      adminPass &&
      String(email).toLowerCase().trim() === adminEmail &&
      String(senha) === adminPass
  );
}

export async function authenticate(email, senha) {
  // 1) Admin "virtual" via variáveis de ambiente (não precisa existir no banco)
  if (isAdminCredentials(email, senha)) {
    const real = await findUserByEmail(email);
    return {
      user: real || {
        id: "admin-env",
        nome: "Administrador",
        email: String(email).toLowerCase().trim(),
        role: "admin",
      },
    };
  }

  // 2) Usuário comum
  const user = await findUserByEmail(email);
  if (!user || !user.ativo) return { error: "E-mail ou senha inválidos." };
  if (!verifyPassword(senha, user.senhaHash)) return { error: "E-mail ou senha inválidos." };
  return { user };
}

/* ---------------------- MIDDLEWARE ---------------------- */

export function bearer(request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export async function currentUser(request) {
  const token = bearer(request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;

  if (payload.role === "admin" && payload.sub === "admin-env") {
    return { id: "admin-env", nome: "Administrador", email: payload.email, role: "admin" };
  }

  const user = await get("users", payload.sub);
  if (!user || !user.ativo) return null;
  return user;
}

export async function requireUser(request) {
  const user = await currentUser(request);
  if (!user) return { error: "Faça login para continuar.", status: 401 };
  return { user };
}

export async function requireAdmin(request) {
  const user = await currentUser(request);
  if (!user) return { error: "Faça login para continuar.", status: 401 };
  if (user.role !== "admin") return { error: "Acesso restrito ao administrador.", status: 403 };
  return { user };
}

export function tokenFor(user) {
  return signToken({ sub: user.id, email: user.email, role: user.role, nome: user.nome });
}
