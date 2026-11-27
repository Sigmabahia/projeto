#!/usr/bin/env node
/* ==========================================================
   ROYAL SUITS — VERIFICADOR DE DEPLOY
   ----------------------------------------------------------
   Confere se o site publicado está realmente funcionando:
   páginas, API, chatbot e bloqueio de arquivos de código.

   Uso:
     node scripts/verificar-deploy.mjs https://seu-site.netlify.app
     node scripts/verificar-deploy.mjs http://localhost:8888
   ========================================================== */

const base = (process.argv[2] || "").replace(/\/+$/, "");

if (!base) {
  console.error("Informe a URL do site. Ex.: node scripts/verificar-deploy.mjs https://seu-site.netlify.app");
  process.exit(1);
}

let falhas = 0;
let total = 0;

function linha(status, texto, detalhe) {
  total += 1;
  if (!status) falhas += 1;
  const icone = status ? "OK  " : "FALHA";
  console.log(`  ${icone}  ${texto}${detalhe ? " — " + detalhe : ""}`);
}

async function pegar(caminho, opcoes) {
  const inicio = Date.now();
  const resposta = await fetch(base + caminho, { redirect: "manual", ...(opcoes || {}) });
  const corpo = await resposta.text();
  return { status: resposta.status, corpo, ms: Date.now() - inicio };
}

async function checarPagina(caminho, precisaConter) {
  try {
    const r = await pegar(caminho);
    const achou = !precisaConter || r.corpo.includes(precisaConter);
    linha(r.status === 200 && achou, `Página ${caminho}`, `${r.status}, ${r.ms}ms`);
  } catch (erro) {
    linha(false, `Página ${caminho}`, erro.message);
  }
}

async function checarBloqueado(caminho) {
  try {
    const r = await pegar(caminho);
    linha(r.status === 404 || r.status === 403, `Arquivo de código bloqueado ${caminho}`, `status ${r.status}`);
  } catch (erro) {
    linha(false, `Arquivo de código bloqueado ${caminho}`, erro.message);
  }
}

async function principal() {
  console.log(`\nVerificando ${base}\n`);

  console.log("Site estático");
  await checarPagina("/", "ROYAL");
  await checarPagina("/ternos.html", "ROYAL");
  await checarPagina("/vestidos.html", "ROYAL");
  await checarPagina("/carrinho.html", "ROYAL");
  await checarPagina("/contato.html", "ROYAL");
  await checarPagina("/js/rs-chat.js", "rsChatAtivo");

  console.log("\nAPI (Netlify Function)");
  try {
    const r = await pegar("/api/health");
    const json = JSON.parse(r.corpo);
    linha(r.status === 200 && json.ok === true, "GET /api/health", `${r.status}, ${r.ms}ms`);
  } catch (erro) {
    linha(false, "GET /api/health", erro.message);
  }

  try {
    const r = await pegar("/api/products");
    const json = JSON.parse(r.corpo);
    const qtd = Array.isArray(json.produtos) ? json.produtos.length : 0;
    linha(r.status === 200 && qtd > 0, "GET /api/products", `${qtd} produtos`);
  } catch (erro) {
    linha(false, "GET /api/products", erro.message);
  }

  try {
    const r = await pegar("/api/shipping/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep: "01310100", subtotal: 900 }),
    });
    const json = JSON.parse(r.corpo);
    linha(r.status === 200 && json.ok === true, "POST /api/shipping/quote", `${json.opcoes ? json.opcoes.length : 0} opções`);
  } catch (erro) {
    linha(false, "POST /api/shipping/quote", erro.message);
  }

  try {
    const r = await pegar("/api/rota-inexistente");
    linha(r.status === 404, "Rota inválida responde 404", `status ${r.status}`);
  } catch (erro) {
    linha(false, "Rota inválida responde 404", erro.message);
  }

  console.log("\nSegurança");
  await checarBloqueado("/netlify/lib/auth.mjs");
  await checarBloqueado("/scripts/seed-local.mjs");
  await checarBloqueado("/package.json");
  await checarBloqueado("/netlify.toml");

  console.log("\nCabeçalhos");
  try {
    const r = await fetch(base + "/api/health");
    linha(
      r.headers.get("cache-control") === "no-store",
      "Cache-Control no-store na API",
      r.headers.get("cache-control") || "ausente"
    );
    const home = await fetch(base + "/");
    linha(
      home.headers.get("x-content-type-options") === "nosniff",
      "X-Content-Type-Options",
      home.headers.get("x-content-type-options") || "ausente"
    );
  } catch (erro) {
    linha(false, "Cabeçalhos", erro.message);
  }

  console.log(`\n${falhas === 0 ? "TUDO CERTO" : "ATENÇÃO"}: ${total - falhas}/${total} verificações passaram.\n`);
  process.exit(falhas === 0 ? 0 : 1);
}

principal().catch((erro) => {
  console.error("Erro inesperado:", erro);
  process.exit(1);
});
