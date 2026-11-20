/**
 * Popula o banco local (driver de memória) com os produtos reais do site.
 * Útil para rodar `npm run dev` já com catálogo e cupons de exemplo.
 *
 * Uso:  node scripts/seed-local.mjs
 *       npm run dev        (o dev-server também faz o seed automático)
 */
process.env.RS_MEMORY_DB = "1";
process.env.JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@royalsuits.com.br";
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123456";

const { PRODUTOS_SEED } = await import("../netlify/lib/products-seed.mjs");
const db = await import("../netlify/lib/db.mjs");

let inseridos = 0;
for (const produto of PRODUTOS_SEED) {
  const slug = produto.slug || db.slugify(produto.nome);
  const existente = await db.getIndex("product-slug", slug);
  if (existente) continue;

  const id = db.newId("prod");
  const registro = {
    id,
    slug,
    nome: produto.nome,
    descricao: produto.descricao || "",
    preco: Number(produto.preco) || 0,
    precoAntigo: Number(produto.precoAntigo) || 0,
    imagem: produto.imagem || "",
    categoria: produto.categoria || "",
    colecao: produto.colecao || "",
    tipo: produto.tipo || "",
    tamanhos: produto.tamanhos || ["P", "M", "G", "GG"],
    cores: produto.cores || [],
    destaque: !!produto.destaque,
    ativo: produto.ativo !== false,
    estoque: Number(produto.estoque ?? 10),
    criadoEm: new Date().toISOString()
  };

  await db.put("products", id, registro);
  await db.setIndex("product-slug", slug, id);
  inseridos++;
}

const cupons = [
  { codigo: "BEMVINDO10", tipo: "percentual", valor: 10, minimo: 0, ativo: true },
  { codigo: "ROYAL50", tipo: "fixo", valor: 50, minimo: 500, ativo: true }
];
for (const cupom of cupons) {
  const existente = await db.get("coupons", cupom.codigo);
  if (existente) continue;
  await db.put("coupons", cupom.codigo, { ...cupom, criadoEm: new Date().toISOString() });
}

console.log(`Seed concluído: ${inseridos} produtos inseridos, ${await db.count("products")} no total.`);
console.log("Cupons disponíveis: BEMVINDO10 (10%) e ROYAL50 (R$50 acima de R$500).");
