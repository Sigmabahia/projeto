/* Teste de integração da API (driver de memória, sem Netlify). */
process.env.RS_MEMORY_DB = "1";
process.env.JWT_SECRET = "segredo-de-teste";
process.env.ADMIN_EMAIL = "admin@royalsuits.com.br";
process.env.ADMIN_PASSWORD = "admin123456";
process.env.ADMIN_BOOTSTRAP_TOKEN = "bootstrap-token";
process.env.PIX_CHAVE = "contato@royalsuits.com.br";
process.env.PIX_NOME = "ROYAL SUITS";
process.env.PIX_CIDADE = "SAO PAULO";

const { default: handler } = await import("../netlify/functions/api.mjs");

let passou = 0;
let falhou = 0;
let token = null;
let adminToken = null;
const sessao = "sessao-teste-123";

async function call(method, path, { body, auth, headers = {} } = {}) {
  const req = new Request(`https://site.test/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-session-id": sessao,
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const res = await handler(req);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function check(nome, cond, extra = "") {
  if (cond) {
    passou++;
    console.log(`  ✅ ${nome}`);
  } else {
    falhou++;
    console.log(`  ❌ ${nome} ${extra}`);
  }
}

console.log("\n=== 1. Saúde e catálogo ===");
let r = await call("GET", "/health");
check("GET /health", r.status === 200 && r.data.ok);

r = await call("GET", "/products");
check("GET /products retorna seed", r.status === 200 && r.data.produtos.length >= 18, `(${r.data.produtos?.length})`);
const produto = r.data.produtos.find((p) => p.preco > 0);
check("Produto com preço encontrado", Boolean(produto), JSON.stringify(r.data.produtos?.[0]));

r = await call("GET", "/products?colecao=casamentos");
check("Filtro por coleção", r.data.produtos.every((p) => p.colecao === "casamentos"));

r = await call("GET", `/products/${produto.slug}`);
check("GET /products/:slug", r.status === 200 && r.data.produto.slug === produto.slug);

console.log("\n=== 2. Autenticação ===");
r = await call("POST", "/auth/register", {
  body: { nome: "Maria Teste", email: "maria@teste.com", telefone: "11999998888", senha: "senha123" },
});
check("Cadastro", r.status === 201 && r.data.token, JSON.stringify(r.data));
token = r.data.token;

r = await call("POST", "/auth/register", {
  body: { nome: "Maria Teste", email: "maria@teste.com", senha: "senha123" },
});
check("E-mail duplicado bloqueado", r.status === 409);

r = await call("POST", "/auth/login", { body: { email: "maria@teste.com", senha: "errada" } });
check("Senha errada bloqueada", r.status === 401);

r = await call("POST", "/auth/login", { body: { email: "maria@teste.com", senha: "senha123" } });
check("Login", r.status === 200 && r.data.token);
token = r.data.token;

r = await call("GET", "/auth/me", { auth: token });
check("GET /auth/me", r.status === 200 && r.data.usuario.email === "maria@teste.com");
check("Senha não vaza na resposta", !JSON.stringify(r.data).includes("scrypt$"));

r = await call("GET", "/orders");
check("Pedidos exige login", r.status === 401);

console.log("\n=== 3. Carrinho e favoritos ===");
r = await call("POST", "/cart/items", { body: { productId: produto.id, quantidade: 2 } });
check("Adicionar ao carrinho", r.status === 200 && r.data.itens.length === 1);

r = await call("POST", "/cart/items", { body: { productId: produto.id, quantidade: 1 } });
check("Mesmo item soma quantidade", r.data.itens[0].quantidade === 3);

r = await call("PATCH", `/cart/items/${produto.id}`, { body: { quantidade: 2 } });
check("Atualizar quantidade", r.data.itens[0].quantidade === 2);

r = await call("GET", "/cart");
check("Subtotal do carrinho", r.data.subtotal === produto.preco * 2, `(${r.data.subtotal})`);

r = await call("POST", "/favorites", { body: { productId: produto.id } });
check("Adicionar favorito", r.status === 200 && r.data.itens.length === 1);

r = await call("GET", "/favorites");
check("Listar favoritos", r.data.itens.length === 1);

r = await call("DELETE", `/favorites/${produto.id}`);
check("Remover favorito", r.data.itens.length === 0);

console.log("\n=== 4. Frete e cupons ===");
r = await call("POST", "/shipping/quote", { body: { cep: "01310-100", subtotal: 600 } });
check("Frete PAC grátis acima de 500", r.status === 200 && r.data.opcoes[0].preco === 0);
r = await call("POST", "/shipping/quote", { body: { cep: "40000-000", subtotal: 100 } });
check("Frete por região (Bahia)", r.data.opcoes[0].preco > 0 && /Bahia/.test(r.data.regiao));
r = await call("POST", "/shipping/quote", { body: { cep: "123" } });
check("CEP inválido rejeitado", r.status === 422);

r = await call("POST", "/admin/bootstrap", {
  body: {},
  headers: { "x-bootstrap-token": "bootstrap-token" },
});
check("Bootstrap admin", r.status === 200 && r.data.usuario.role === "admin", JSON.stringify(r.data));

r = await call("POST", "/auth/login", { body: { email: "admin@royalsuits.com.br", senha: "admin123456" } });
check("Login admin", r.status === 200 && r.data.usuario.role === "admin");
adminToken = r.data.token;

r = await call("POST", "/admin/coupons", {
  auth: adminToken,
  body: { codigo: "ROYAL10", tipo: "percentual", valor: 10, minimo: 100 },
});
check("Criar cupom", r.status === 201);

r = await call("POST", "/coupons/validate", { body: { codigo: "ROYAL10", subtotal: 500 } });
check("Validar cupom", r.status === 200 && r.data.desconto === 50, JSON.stringify(r.data));

r = await call("POST", "/coupons/validate", { body: { codigo: "NAOEXISTE", subtotal: 500 } });
check("Cupom inexistente", r.status === 404);

console.log("\n=== 5. Pedido ===");
const pedidoBody = {
  itens: [{ productId: produto.id, quantidade: 1 }],
  cliente: { nome: "Maria Teste", email: "maria@teste.com", telefone: "11999998888", cpf: "12345678909" },
  endereco: { cep: "01310-100", rua: "Av. Paulista", numero: "1000", bairro: "Bela Vista", cidade: "São Paulo", uf: "SP" },
  frete: { id: "pac" },
  pagamento: { tipo: "pix" },
  cupom: "ROYAL10",
};
r = await call("POST", "/orders", { body: pedidoBody, auth: token });
check("Criar pedido", r.status === 201, JSON.stringify(r.data).slice(0, 300));
const pedido = r.data.pedido;
check("Número do pedido", /^RS-\d{8}-\d{4}$/.test(pedido.numero), pedido.numero);
check("PIX copia e cola gerado", pedido.pagamento.pixCopiaECola?.startsWith("000201"));
check("CRC16 do PIX válido", (() => {
  const p = pedido.pagamento.pixCopiaECola;
  const base = p.slice(0, -4);
  let crc = 0xffff;
  for (let i = 0; i < base.length; i++) {
    crc ^= base.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0") === p.slice(-4);
})());
check("Desconto PIX aplicado (5%)", pedido.totais.descontoPix === Math.round(produto.preco * 0.05 * 100) / 100);
check("Desconto cupom aplicado", pedido.totais.descontoCupom === Math.round(produto.preco * 0.1 * 100) / 100);
check("Frete grátis no total", pedido.totais.frete === 0);
check("Carrinho esvaziado após pedido", (await call("GET", "/cart", { auth: token })).data.itens.length === 0);

r = await call("GET", "/orders", { auth: token });
check("Listar meus pedidos", r.data.pedidos.length === 1);

r = await call("GET", `/orders/${pedido.numero}?email=maria@teste.com`);
check("Consultar pedido por e-mail", r.status === 200);
r = await call("GET", `/orders/${pedido.numero}`);
check("Pedido sem e-mail é protegido", r.status === 401);

r = await call("GET", "/admin/orders", { auth: adminToken });
check("Admin lista pedidos", r.data.pedidos.length === 1);

r = await call("PATCH", `/admin/orders/${pedido.numero}/status`, {
  auth: adminToken,
  body: { status: "Pago", notificar: false },
});
check("Admin atualiza status", r.data.pedido.status === "Pago");

r = await call("GET", "/admin/stats", { auth: adminToken });
check("Stats admin", r.status === 200 && r.data.stats.pedidos === 1 && r.data.stats.receita > 0);

r = await call("GET", "/admin/stats", { auth: token });
check("Cliente não acessa admin", r.status === 403);

console.log("\n=== 6. Contato e newsletter ===");
r = await call("POST", "/contact", {
  body: { nome: "João", email: "joao@teste.com", mensagem: "Gostaria de um orçamento para formatura." },
});
check("Contato", r.status === 201);
r = await call("POST", "/contact", { body: { nome: "João", email: "invalido", mensagem: "curta" } });
check("Contato valida campos", r.status === 422);

r = await call("POST", "/newsletter", { body: { email: "news@teste.com" } });
check("Newsletter", r.status === 201);
r = await call("POST", "/newsletter", { body: { email: "news@teste.com" } });
check("Newsletter não duplica", r.status === 200);

r = await call("GET", "/admin/messages", { auth: adminToken });
check("Admin lê mensagens", r.data.mensagens.length === 1);
r = await call("GET", "/admin/newsletter", { auth: adminToken });
check("Admin lê newsletter", r.data.inscritos.length === 1);

console.log("\n=== 7. Recuperação de senha ===");
r = await call("POST", "/auth/forgot-password", { body: { email: "maria@teste.com" } });
check("Solicitar recuperação", r.status === 200);

console.log("\n=== 8. Rota inexistente ===");
r = await call("GET", "/nao-existe");
check("404 para rota inválida", r.status === 404);

console.log(`\n${"=".repeat(50)}\nRESULTADO: ${passou} passaram, ${falhou} falharam\n`);
process.exit(falhou ? 1 : 0);
