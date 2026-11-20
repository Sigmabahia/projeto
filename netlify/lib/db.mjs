/* ==========================================================
   ROYAL SUITS — CAMADA DE DADOS
   ----------------------------------------------------------
   Driver principal: Netlify Blobs (nativo, sem banco externo).
   Driver de teste: memória (RS_MEMORY_DB=1) para rodar a API
   localmente com `node scripts/test-api.mjs`.

   Organização das chaves:
     <colecao>/<id>.json      -> documentos
     idx/<nome>/<chave>       -> índices simples (lookup O(1))
   ========================================================== */

const STORE_NAME = process.env.BLOBS_STORE || "royalsuits";
const USE_MEMORY = process.env.RS_MEMORY_DB === "1";

/* ---------------------- DRIVERS ---------------------- */

const memory = new Map();

const memoryDriver = {
  async get(key) {
    return memory.has(key) ? memory.get(key) : null;
  },
  async set(key, value) {
    memory.set(key, value);
  },
  async delete(key) {
    memory.delete(key);
  },
  async list(prefix) {
    return [...memory.keys()].filter((k) => k.startsWith(prefix)).sort();
  },
};

let _driver = null;

async function driver() {
  if (_driver) return _driver;
  if (USE_MEMORY) {
    _driver = memoryDriver;
    return _driver;
  }
  const { getStore } = await import("@netlify/blobs");
  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  _driver = {
    get: (key) => store.get(key),
    set: (key, value) => store.set(key, value),
    delete: (key) => store.delete(key),
    list: async (prefix) => {
      const { blobs } = await store.list({ prefix });
      return blobs.map((b) => b.key);
    },
  };
  return _driver;
}

const docKey = (col, id) => `${col}/${id}.json`;

/* ------------------------- CRUD ------------------------- */

export async function put(col, id, data) {
  const d = await driver();
  const now = new Date().toISOString();
  const doc = { ...data, id, createdAt: data.createdAt || now, updatedAt: now };
  await d.set(docKey(col, id), JSON.stringify(doc));
  return doc;
}

export async function get(col, id) {
  if (!id) return null;
  const d = await driver();
  const raw = await d.get(docKey(col, id));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function remove(col, id) {
  const d = await driver();
  await d.delete(docKey(col, id));
}

export async function list(col, prefix = "") {
  const d = await driver();
  const keys = await d.list(`${col}/${prefix}`);
  if (!keys.length) return [];
  const docs = await Promise.all(keys.map((k) => d.get(k)));
  return docs
    .filter(Boolean)
    .map((raw) => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export async function count(col) {
  const d = await driver();
  const keys = await d.list(`${col}/`);
  return keys.length;
}

/* ------------------------ ÍNDICES ------------------------ */

const idxKey = (name, key) => `idx/${name}/${encodeURIComponent(String(key).toLowerCase())}`;

export async function setIndex(name, key, value) {
  const d = await driver();
  await d.set(idxKey(name, key), JSON.stringify(value));
}

export async function getIndex(name, key) {
  const d = await driver();
  const raw = await d.get(idxKey(name, key));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function delIndex(name, key) {
  const d = await driver();
  await d.delete(idxKey(name, key));
}

/* ------------------------- HELPERS ------------------------- */

export function newId(prefix = "") {
  const rand = Math.random().toString(36).slice(2, 8);
  const stamp = Date.now().toString(36);
  return `${prefix}${stamp}${rand}`;
}

export function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function allProducts() {
  return list("products");
}

export async function findProduct({ id, slug, nome }) {
  if (id) {
    const p = await get("products", id);
    if (p) return p;
  }
  const products = await allProducts();
  if (slug) return products.find((p) => p.slug === slug) || null;
  if (nome) {
    const alvo = String(nome).trim().toLowerCase();
    return products.find((p) => String(p.nome).trim().toLowerCase() === alvo) || null;
  }
  return null;
}

export async function clearAll() {
  const d = await driver();
  const keys = await d.list("");
  await Promise.all(keys.map((k) => d.delete(k)));
}
