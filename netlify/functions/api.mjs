/* ==========================================================
   ROYAL SUITS — API (Netlify Function única)
   ----------------------------------------------------------
   Todas as rotas ficam em /api/* (ver netlify.toml).

   AUTENTICAÇÃO
     POST   /api/auth/register
     POST   /api/auth/login
     GET    /api/auth/me
     PATCH  /api/auth/profile
     POST   /api/auth/forgot-password
     POST   /api/auth/reset-password

   CATÁLOGO
     GET    /api/products
     GET    /api/products/:idOuSlug

   CARRINHO / FAVORITOS
     GET    /api/cart
     POST   /api/cart/items
     PATCH  /api/cart/items/:productId
     DELETE /api/cart/items/:productId
     DELETE /api/cart
     GET    /api/favorites
     POST   /api/favorites
     DELETE /api/favorites/:productId

   CHECKOUT
     POST   /api/shipping/quote
     POST   /api/coupons/validate
     POST   /api/orders
     GET    /api/orders
     GET    /api/orders/:numero
     POST   /api/orders/:numero/cancel

   CONTATO / NEWSLETTER
     POST   /api/contact
     POST   /api/newsletter

   ADMIN (Bearer de admin)
     POST   /api/admin/bootstrap
     GET    /api/admin/stats
     GET    /api/admin/orders
     PATCH  /api/admin/orders/:numero/status
     GET    /api/admin/messages
     PATCH  /api/admin/messages/:id
     GET    /api/admin/newsletter
     POST   /api/admin/products
     PATCH  /api/admin/products/:id
     DELETE /api/admin/products/:id
     GET    /api/admin/coupons
     POST   /api/admin/coupons
     DELETE /api/admin/coupons/:codigo

   SAÚDE
     GET    /api/health
   ========================================================== */

import crypto from "node:crypto";
import {
  json,
  ok,
  fail,
  preflight,
  body,
  isEmail,
  digits,
  isCep,
  text,
  num,
  money,
  sanitizeUser,
  getClientIp,
} from "../lib/http.mjs";
import * as db from "../lib/db.mjs";
import {
  createUser,
  authenticate,
  findUserByEmail,
  currentUser,
  requireUser,
  requireAdmin,
  tokenFor,
  hashPassword,
} from "../lib/auth.mjs";
import { cotarFrete, calcularDescontos, DESCONTO_PIX } from "../lib/frete.mjs";
import { gerarPixCopiaECola } from "../lib/pix.mjs";
import { enviarEmail, templatePedido } from "../lib/mail.mjs";
import { PRODUTOS_SEED } from "../lib/products-seed.mjs";

/* ==========================================================
   INFRA
   ========================================================== */

const STATUS = {
  pix: "Aguardando pagamento PIX",
  cartao: "Pagamento em análise",
  boleto: "Aguardando pagamento do boleto",
};

const PAGOS = ["Pago", "Em separação", "Enviado", "Entregue"];

let seeded = false;

async function ensureSeed() {
  if (seeded) return;
  const total = await db.count("products");
  if (total === 0) {
    for (const produto of PRODUTOS_SEED) {
      await db.put("products", produto.slug, produto);
    }
  }
  seeded = true;
}

function ownerKey(request, data = {}) {
  const session = request.headers.get("x-session-id") || data.sessionId;
  return session ? `guest:${String(session).slice(0, 80)}` : null;
}

async function resolveOwner(request, data = {}) {
  const user = await currentUser(request);
  if (user) return { tipo: "user", chave: user.id, user };
  const guest = ownerKey(request, data);
  if (guest) return { tipo: "guest", chave: guest, user: null };
  return null;
}

async function getCoupon(codigo) {
  if (!codigo) return null;
  return db.get("coupons", String(codigo).toUpperCase().trim());
}

function novoNumeroPedido() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `RS-${ymd}-${rand}`;
}

/* ==========================================================
   HANDLERS — AUTH
   ========================================================== */

async function register(ctx) {
  const data = await body(ctx.request);
  const nome = text(data.nome, 120);
  const email = text(data.email, 160).toLowerCase();
  const telefone = digits(data.telefone).slice(0, 11);
  const senha = String(data.senha || "");

  const erros = {};
  if (nome.length < 3) erros.nome = "Informe seu nome completo.";
  if (!isEmail(email)) erros.email = "E-mail inválido.";
  if (senha.length < 6) erros.senha = "A senha precisa ter pelo menos 6 caracteres.";
  if (data.confirmarSenha != null && data.confirmarSenha !== senha)
    erros.confirmarSenha = "As senhas não conferem.";
  if (Object.keys(erros).length) return fail("Verifique os dados informados.", 422, erros);

  const { user, error } = await createUser({ nome, email, telefone, senha });
  if (error) return fail(error, 409);

  await enviarEmail({
    para: email,
    assunto: "Bem-vindo(a) à Royal Suits",
    html: `<p>Olá, ${nome}!</p><p>Sua conta na Royal Suits foi criada com sucesso.</p>`,
  });

  return json({ ok: true, token: tokenFor(user), usuario: sanitizeUser(user) }, 201);
}

async function login(ctx) {
  const data = await body(ctx.request);
  const email = text(data.email, 160).toLowerCase();
  const senha = String(data.senha || "");

  if (!isEmail(email) || !senha) return fail("Informe e-mail e senha.", 422);

  const { user, error } = await authenticate(email, senha);
  if (error) return fail(error, 401);

  return ok({ token: tokenFor(user), usuario: sanitizeUser(user) });
}

async function me(ctx) {
  const user = await currentUser(ctx.request);
  if (!user) return fail("Não autenticado.", 401);
  return ok({ usuario: sanitizeUser(user) });
}

async function updateProfile(ctx) {
  const auth = await requireUser(ctx.request);
  if (auth.error) return fail(auth.error, auth.status);

  const data = await body(ctx.request);
  const patch = {};
  if (data.nome != null) patch.nome = text(data.nome, 120);
  if (data.telefone != null) patch.telefone = digits(data.telefone).slice(0, 11);
  if (data.endereco && typeof data.endereco === "object") patch.endereco = data.endereco;

  const atualizado = await db.put("users", auth.user.id, { ...auth.user, ...patch });
  return ok({ usuario: sanitizeUser(atualizado) });
}

async function forgotPassword(ctx) {
  const data = await body(ctx.request);
  const email = text(data.email, 160).toLowerCase();
  if (!isEmail(email)) return fail("E-mail inválido.", 422);

  const user = await findUserByEmail(email);
  const resposta = { ok: true, mensagem: "Se o e-mail existir, enviaremos as instruções." };

  if (user) {
    const token = crypto.randomBytes(24).toString("hex");
    await db.put("resets", token, {
      userId: user.id,
      expiraEm: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    const base = process.env.SITE_URL || ctx.url.origin;
    const link = `${base}/recuperar-senha.html?token=${token}`;

    await enviarEmail({
      para: email,
      assunto: "Redefinição de senha — Royal Suits",
      html: `<p>Olá, ${user.nome}.</p><p>Para criar uma nova senha, acesse:</p><p><a href="${link}">${link}</a></p><p>O link expira em 1 hora.</p>`,
    });

    if (process.env.EXPOSE_RESET_LINK === "1") resposta.link = link;
  }

  return ok(resposta);
}

async function resetPassword(ctx) {
  const data = await body(ctx.request);
  const token = text(data.token, 200);
  const senha = String(data.senha || "");
  if (senha.length < 6) return fail("A senha precisa ter pelo menos 6 caracteres.", 422);

  const reset = await db.get("resets", token);
  if (!reset) return fail("Link inválido ou já utilizado.", 400);
  if (new Date(reset.expiraEm) < new Date()) return fail("Link expirado. Solicite outro.", 400);

  const user = await db.get("users", reset.userId);
  if (!user) return fail("Usuário não encontrado.", 404);

  await db.put("users", user.id, { ...user, senhaHash: hashPassword(senha) });
  await db.remove("resets", token);
  return ok({ mensagem: "Senha alterada com sucesso." });
}

/* ==========================================================
   HANDLERS — PRODUTOS
   ========================================================== */

async function listProducts(ctx) {
  await ensureSeed();
  const q = ctx.url.searchParams;
  let produtos = (await db.allProducts()).filter((p) => p.ativo !== false);

  const colecao = q.get("colecao");
  const tipo = q.get("tipo");
  const publico = q.get("publico");
  const busca = q.get("q");
  const destaque = q.get("destaque");

  if (colecao) produtos = produtos.filter((p) => p.colecao === colecao);
  if (tipo) produtos = produtos.filter((p) => p.tipo === tipo);
  if (publico) produtos = produtos.filter((p) => p.publico === publico);
  if (destaque === "1" || destaque === "true") produtos = produtos.filter((p) => p.destaque);
  if (busca) {
    const alvo = busca.toLowerCase();
    produtos = produtos.filter((p) =>
      `${p.nome} ${p.descricao} ${p.colecao} ${p.tipo}`.toLowerCase().includes(alvo)
    );
  }

  const ordem = q.get("ordem");
  if (ordem === "preco-asc") produtos.sort((a, b) => a.preco - b.preco);
  else if (ordem === "preco-desc") produtos.sort((a, b) => b.preco - a.preco);
  else if (ordem === "nome") produtos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const limit = Math.min(num(q.get("limit"), 100), 200);
  return ok({ total: produtos.length, produtos: produtos.slice(0, limit) });
}

async function getProduct(ctx) {
  await ensureSeed();
  const produto = await db.findProduct({ id: ctx.params.id, slug: ctx.params.id });
  if (!produto) return fail("Produto não encontrado.", 404);
  return ok({ produto });
}

/* ==========================================================
   HANDLERS — CARRINHO
   ========================================================== */

async function cartGet(ctx) {
  const owner = await resolveOwner(ctx.request);
  if (!owner) return ok({ itens: [], subtotal: 0 });

  const carrinho = (await db.get("carts", owner.chave)) || { itens: [] };
  const itens = carrinho.itens || [];
  const subtotal = itens.reduce((s, i) => s + num(i.preco) * num(i.quantidade, 1), 0);
  return ok({ itens, subtotal: money(subtotal), totalItens: itens.reduce((s, i) => s + num(i.quantidade, 1), 0) });
}

async function cartAdd(ctx) {
  const data = await body(ctx.request);
  const owner = await resolveOwner(ctx.request, data);
  if (!owner) return fail("Sessão não identificada.", 400);

  await ensureSeed();
  const produto = await db.findProduct({
    id: data.productId,
    nome: data.nome,
    slug: data.slug,
  });
  if (!produto) return fail("Produto não encontrado.", 404);

  const quantidade = Math.min(Math.max(num(data.quantidade, 1), 1), 20);
  const tamanho = text(data.tamanho, 10);

  const carrinho = (await db.get("carts", owner.chave)) || { itens: [] };
  const itens = carrinho.itens || [];
  const idx = itens.findIndex(
    (i) => i.productId === produto.id && String(i.tamanho || "") === tamanho
  );

  if (idx >= 0) itens[idx].quantidade = Math.min(itens[idx].quantidade + quantidade, 20);
  else
    itens.push({
      productId: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.imagem,
      quantidade,
      tamanho,
    });

  await db.put("carts", owner.chave, { itens });
  return ok({ itens, adicionado: produto.nome });
}

async function cartUpdate(ctx) {
  const data = await body(ctx.request);
  const owner = await resolveOwner(ctx.request, data);
  if (!owner) return fail("Sessão não identificada.", 400);

  const carrinho = (await db.get("carts", owner.chave)) || { itens: [] };
  const itens = carrinho.itens || [];
  const item = itens.find((i) => i.productId === ctx.params.productId);
  if (!item) return fail("Item não encontrado no carrinho.", 404);

  const quantidade = num(data.quantidade, 1);
  if (quantidade <= 0) itens.splice(itens.indexOf(item), 1);
  else item.quantidade = Math.min(quantidade, 20);

  await db.put("carts", owner.chave, { itens });
  return ok({ itens });
}

async function cartRemove(ctx) {
  const owner = await resolveOwner(ctx.request);
  if (!owner) return fail("Sessão não identificada.", 400);

  const carrinho = (await db.get("carts", owner.chave)) || { itens: [] };
  const itens = (carrinho.itens || []).filter((i) => i.productId !== ctx.params.productId);
  await db.put("carts", owner.chave, { itens });
  return ok({ itens });
}

async function cartClear(ctx) {
  const owner = await resolveOwner(ctx.request);
  if (!owner) return ok({ itens: [] });
  await db.put("carts", owner.chave, { itens: [] });
  return ok({ itens: [] });
}

/* ==========================================================
   HANDLERS — FAVORITOS
   ========================================================== */

async function favoritesGet(ctx) {
  const owner = await resolveOwner(ctx.request);
  if (!owner) return ok({ itens: [] });
  const doc = (await db.get("favorites", owner.chave)) || { itens: [] };
  return ok({ itens: doc.itens || [] });
}

async function favoritesAdd(ctx) {
  const data = await body(ctx.request);
  const owner = await resolveOwner(ctx.request, data);
  if (!owner) return fail("Sessão não identificada.", 400);

  await ensureSeed();
  const produto = await db.findProduct({ id: data.productId, nome: data.nome, slug: data.slug });
  if (!produto) return fail("Produto não encontrado.", 404);

  const doc = (await db.get("favorites", owner.chave)) || { itens: [] };
  const itens = doc.itens || [];
  if (!itens.some((i) => i.productId === produto.id)) {
    itens.push({
      productId: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      imagem: produto.imagem,
    });
  }
  await db.put("favorites", owner.chave, { itens });
  return ok({ itens });
}

async function favoritesRemove(ctx) {
  const owner = await resolveOwner(ctx.request);
  if (!owner) return fail("Sessão não identificada.", 400);
  const doc = (await db.get("favorites", owner.chave)) || { itens: [] };
  const itens = (doc.itens || []).filter((i) => i.productId !== ctx.params.productId);
  await db.put("favorites", owner.chave, { itens });
  return ok({ itens });
}

/* ==========================================================
   HANDLERS — FRETE / CUPOM
   ========================================================== */

async function shippingQuote(ctx) {
  const data = await body(ctx.request);
  const cep = digits(data.cep);
  if (!isCep(cep)) return fail("Informe um CEP válido.", 422);
  return ok(cotarFrete(cep, num(data.subtotal, 0)));
}

async function couponValidate(ctx) {
  const data = await body(ctx.request);
  const cupom = await getCoupon(data.codigo);
  if (!cupom || cupom.ativo === false) return fail("Cupom inválido.", 404);
  if (cupom.validade && new Date(cupom.validade) < new Date())
    return fail("Este cupom expirou.", 400);

  const subtotal = num(data.subtotal, 0);
  if (cupom.minimo && subtotal < Number(cupom.minimo))
    return fail(`Cupom válido a partir de R$ ${Number(cupom.minimo).toFixed(2)}.`, 400);

  const { descontoCupom } = calcularDescontos({
    subtotal,
    tipoPagamento: data.tipoPagamento || "pix",
    cupom,
  });

  return ok({
    cupom: { codigo: cupom.codigo, tipo: cupom.tipo, valor: cupom.valor },
    desconto: descontoCupom,
  });
}

/* ==========================================================
   HANDLERS — PEDIDOS
   ========================================================== */

async function createOrder(ctx) {
  await ensureSeed();
  const data = await body(ctx.request);
  const user = await currentUser(ctx.request);

  const itensEntrada = Array.isArray(data.itens) ? data.itens : [];
  if (!itensEntrada.length) return fail("Seu carrinho está vazio.", 422);

  const itens = [];
  for (const entrada of itensEntrada.slice(0, 30)) {
    const produto = await db.findProduct({
      id: entrada.productId,
      nome: entrada.nome,
      slug: entrada.slug,
    });
    const quantidade = Math.min(Math.max(num(entrada.quantidade, 1), 1), 20);
    const preco = produto ? num(produto.preco) : num(entrada.preco);
    itens.push({
      productId: produto ? produto.id : null,
      nome: produto ? produto.nome : text(entrada.nome, 140),
      preco: money(preco),
      imagem: produto ? produto.imagem : text(entrada.imagem, 300),
      quantidade,
      tamanho: text(entrada.tamanho, 10),
    });
  }

  const subtotal = money(itens.reduce((s, i) => s + i.preco * i.quantidade, 0));

  const cliente = data.cliente || {};
  const erros = {};
  if (text(cliente.nome, 120).length < 3) erros.nome = "Informe o nome do comprador.";
  if (!isEmail(cliente.email)) erros.email = "E-mail inválido.";
  if (digits(cliente.telefone).length < 10) erros.telefone = "Telefone inválido.";
  if (Object.keys(erros).length) return fail("Verifique os dados do cliente.", 422, erros);

  const endereco = data.endereco || {};
  const cep = digits(endereco.cep);
  if (!isCep(cep)) return fail("CEP de entrega inválido.", 422);

  const pagamento = data.pagamento || {};
  const tipoPagamento = ["pix", "cartao", "boleto"].includes(pagamento.tipo)
    ? pagamento.tipo
    : "pix";

  /* Frete recalculado no servidor (nunca confiar no preço do cliente) */
  const cotacao = cotarFrete(cep, subtotal);
  const freteId = data.frete && data.frete.id ? data.frete.id : "pac";
  const freteServidor = cotacao.opcoes.find((o) => o.id === freteId) || cotacao.opcoes[0];
  const frete = {
    id: freteServidor.id,
    nome: freteServidor.nome,
    preco: money(freteServidor.preco),
    prazo: freteServidor.prazo,
  };

  const cupom = data.cupom ? await getCoupon(data.cupom) : null;
  const { desconto, descontoPix, descontoCupom, cupom: cupomAplicado } = calcularDescontos({
    subtotal,
    tipoPagamento,
    cupom,
  });

  const total = money(Math.max(subtotal + frete.preco - desconto, 0));
  const numero = novoNumeroPedido();

  const pedido = {
    numero,
    userId: user ? user.id : null,
    status: STATUS[tipoPagamento],
    itens,
    cliente: {
      nome: text(cliente.nome, 120),
      email: text(cliente.email, 160).toLowerCase(),
      telefone: digits(cliente.telefone).slice(0, 11),
      cpf: digits(cliente.cpf).slice(0, 14),
    },
    endereco: {
      cep,
      rua: text(endereco.rua, 160),
      numero: text(endereco.numero, 20),
      complemento: text(endereco.complemento, 80),
      bairro: text(endereco.bairro, 80),
      cidade: text(endereco.cidade, 80),
      uf: text(endereco.uf, 2).toUpperCase(),
    },
    frete,
    pagamento: {
      tipo: tipoPagamento,
      parcelas: tipoPagamento === "cartao" ? Math.min(Math.max(num(pagamento.parcelas, 1), 1), 12) : 1,
      bandeira: text(pagamento.bandeira, 20),
      finalCartao: digits(pagamento.finalCartao).slice(-4),
    },
    totais: {
      subtotal,
      frete: frete.preco,
      desconto,
      descontoPix,
      descontoCupom,
      total,
    },
    cupom: cupomAplicado,
    historico: [{ status: STATUS[tipoPagamento], data: new Date().toISOString() }],
    ip: getClientIp(ctx.request),
  };

  if (tipoPagamento === "pix") {
    pedido.pagamento.pixCopiaECola = gerarPixCopiaECola({
      valor: total,
      txid: numero.replace(/\D/g, "").slice(0, 25),
      descricao: `Pedido ${numero}`,
    });
  }

  await db.put("orders", numero, pedido);

  if (cupomAplicado) {
    await db.put("coupons", cupom.codigo, {
      ...cupom,
      usos: num(cupom.usos, 0) + 1,
    });
  }

  /* Limpa carrinho do comprador */
  const owner = await resolveOwner(ctx.request, data);
  if (owner) await db.put("carts", owner.chave, { itens: [] });

  await enviarEmail({
    para: pedido.cliente.email,
    assunto: `Pedido ${numero} recebido — Royal Suits`,
    html: templatePedido(pedido),
  });

  return json({ ok: true, pedido }, 201);
}

async function listOrders(ctx) {
  const auth = await requireUser(ctx.request);
  if (auth.error) return fail(auth.error, auth.status);

  const pedidos = (await db.list("orders"))
    .filter((p) => p.userId === auth.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return ok({ total: pedidos.length, pedidos });
}

async function getOrder(ctx) {
  const pedido = await db.get("orders", ctx.params.numero);
  if (!pedido) return fail("Pedido não encontrado.", 404);

  const user = await currentUser(ctx.request);
  const email = (ctx.url.searchParams.get("email") || "").toLowerCase();
  const autorizado =
    (user && (user.id === pedido.userId || user.role === "admin")) ||
    (email && email === String(pedido.cliente.email).toLowerCase());

  if (!autorizado) return fail("Informe o e-mail usado na compra.", 401);
  return ok({ pedido });
}

async function cancelOrder(ctx) {
  const auth = await requireUser(ctx.request);
  if (auth.error) return fail(auth.error, auth.status);

  const pedido = await db.get("orders", ctx.params.numero);
  if (!pedido) return fail("Pedido não encontrado.", 404);
  if (pedido.userId !== auth.user.id && auth.user.role !== "admin")
    return fail("Sem permissão para este pedido.", 403);
  if (PAGOS.includes(pedido.status) || pedido.status === "Cancelado")
    return fail("Este pedido não pode mais ser cancelado.", 400);

  const atualizado = await db.put("orders", pedido.numero, {
    ...pedido,
    status: "Cancelado",
    historico: [
      ...(pedido.historico || []),
      { status: "Cancelado", data: new Date().toISOString() },
    ],
  });
  return ok({ pedido: atualizado });
}

/* ==========================================================
   HANDLERS — CONTATO / NEWSLETTER
   ========================================================== */

async function contact(ctx) {
  const data = await body(ctx.request);
  const nome = text(data.nome, 120);
  const email = text(data.email, 160).toLowerCase();
  const mensagem = text(data.mensagem, 3000);

  const erros = {};
  if (nome.length < 3) erros.nome = "Informe seu nome.";
  if (!isEmail(email)) erros.email = "E-mail inválido.";
  if (mensagem.length < 10) erros.mensagem = "Escreva ao menos 10 caracteres.";
  if (Object.keys(erros).length) return fail("Verifique os dados.", 422, erros);

  const id = db.newId("msg_");
  const registro = await db.put("messages", id, {
    nome,
    email,
    telefone: digits(data.telefone).slice(0, 11),
    assunto: text(data.assunto, 160) || "Contato pelo site",
    mensagem,
    status: "novo",
    ip: getClientIp(ctx.request),
  });

  const destino = process.env.EMAIL_NOTIFICACAO;
  if (destino) {
    await enviarEmail({
      para: destino,
      assunto: `Novo contato: ${registro.assunto}`,
      html: `<p><strong>${nome}</strong> (${email} / ${registro.telefone})</p><p>${mensagem}</p>`,
    });
  }

  return json({ ok: true, mensagem: "Mensagem enviada! Responderemos em até 1 dia útil." }, 201);
}

async function newsletter(ctx) {
  const data = await body(ctx.request);
  const email = text(data.email, 160).toLowerCase();
  if (!isEmail(email)) return fail("E-mail inválido.", 422);

  const existente = await db.getIndex("newsletter-email", email);
  if (existente) return ok({ mensagem: "Você já está inscrito(a)." });

  const id = db.newId("news_");
  await db.put("newsletter", id, { email, origem: text(data.origem, 60) || "site" });
  await db.setIndex("newsletter-email", email, { id });
  return json({ ok: true, mensagem: "Inscrição confirmada!" }, 201);
}

/* ==========================================================
   HANDLERS — ADMIN
   ========================================================== */

async function bootstrap(ctx) {
  const token = ctx.request.headers.get("x-bootstrap-token");
  const esperado = process.env.ADMIN_BOOTSTRAP_TOKEN;
  if (!esperado) return fail("ADMIN_BOOTSTRAP_TOKEN não configurado.", 500);
  if (token !== esperado) return fail("Token inválido.", 403);

  const data = await body(ctx.request);
  const email = text(data.email, 160) || process.env.ADMIN_EMAIL;
  const senha = String(data.senha || process.env.ADMIN_PASSWORD || "");
  if (!isEmail(email) || senha.length < 6) return fail("Informe e-mail e senha válidos.", 422);

  let user = await findUserByEmail(email);
  if (user) {
    user = await db.put("users", user.id, { ...user, role: "admin", senhaHash: hashPassword(senha) });
  } else {
    const criado = await createUser({ nome: "Administrador", email, senha, role: "admin" });
    if (criado.error) return fail(criado.error, 409);
    user = criado.user;
  }
  return ok({ usuario: sanitizeUser(user) });
}

async function adminStats(ctx) {
  const auth = await requireAdmin(ctx.request);
  if (auth.error) return fail(auth.error, auth.status);

  const [produtos, usuarios, pedidos, mensagens, newsletter] = await Promise.all([
    db.count("products"),
    db.count("users"),
    db.list("orders"),
    db.count("messages"),
    db.count("newsletter"),
  ]);

  const pagos = pedidos.filter((p) => PAGOS.includes(p.status));
  const receita = money(pagos.reduce((s, p) => s + num(p.totais && p.totais.total), 0));

  return ok({
    stats: {
      produtos,
      usuarios,
      pedidos: pedidos.length,
      pedidosPagos: pagos.length,
      receita,
      ticketMedio: pagos.length ? money(receita / pagos.length) : 0,
      mensagens,
      newsletter,
    },
    ultimosPedidos: pedidos
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10),
  });
}

async function adminOrders(ctx) {
  const auth = await requireAdmin(ctx.request);
  if (auth.error) return fail(auth.error, auth.status);

  let pedidos = await db.list("orders");
  const status = ctx.url.searchParams.get("status");
  if (status) pedidos = pedidos.filter((p) => p.status === status);
  pedidos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return ok({ total: pedidos.length, pedidos });
}

async function adminOrderStatus(ctx) {
  const auth = await requireAdmin(ctx.request);
  if (auth.error) return fail(auth.error, auth.status);

  const data = await body(ctx.request);
  const status = text(data.status, 60);
  if (!status) return fail("Informe o novo status.", 422);

  const pedido = await db.get("orders", ctx.params.numero);
  if (!pedido) return fail("Pedido não encontrado.", 404);

  const atualizado = await db.put("orders", pedido.numero, {
    ...pedido,
    status,
    codigoRastreio: text(data.codigoRastreio, 60) || pedido.codigoRastreio || "",
    historico: [
      ...(pedido.historico || []),
      { status, data: new Date().toISOString() },
    ],
  });

  if (data.notificar !== false) {
    await enviarEmail({
      para: pedido.cliente.email,
      assunto: `Atualização do pedido ${pedido.numero}`,
      html: `<p>Seu pedido <strong>${pedido.numero}</strong> agora está: <strong>${status}</strong>.</p>`,
    });
  }

  return ok({ pedido: atualizado });
}

async function adminMessages(ctx) {
  const auth = await requireAdmin(ctx.request);
  if (auth.error) return fail(auth.error, auth.status);
  const mensagens = (await db.list("messages")).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return ok({ total: mensagens.length, mensagens });
}

async function adminMessageUpdate(ctx) {
  const auth = await requireAdmin(ctx.request);
  if (auth.error) return fail(auth.error, auth.status);
  const data = await body(ctx.request);
  const msg = await db.get("messages", ctx.params.id);
  if (!msg) return fail("Mensagem não encontrada.", 404);
  const atualizada = await db.put("messages", msg.id, {
    ...msg,
    status: text(data.status, 30) || "lido",
  });
  return ok({ mensagem: atualizada });
}

async function adminNewsletter(ctx) {
  const auth = await requireAdmin(ctx.request);
  if (auth.error) return fail(auth.error, auth.status);
  const inscritos = (await db.list("newsletter")).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return ok({ total: inscritos.length, inscritos });
}

async function adminProductCreate(ctx) {
  const auth = await requireAdmin(ctx.request);
  if (auth.error) return fail(auth.error, auth.status);

  const data = await body(ctx.request);
  const nome = text(data.nome, 140);
  if (nome.length < 3) return fail("Informe o nome do produto.", 422);

  const slug = db.slugify(data.slug || nome);
  const existente = await db.get("products", slug);
  if (existente) return fail("Já existe um produto com este nome/slug.", 409);

  const produto = await db.put("products", slug, {
    nome,
    slug,
    descricao: text(data.descricao, 1000),
    preco: money(data.preco),
    precoSobConsulta: num(data.preco) === 0,
    imagem: text(data.imagem, 300),
    colecao: text(data.colecao, 40) || "formaturas",
    tipo: text(data.tipo, 20) || "vestido",
    publico: text(data.publico, 20) || "feminino",
    categoria: text(data.categoria, 40),
    destaque: Boolean(data.destaque),
    novidade: Boolean(data.novidade),
    ativo: data.ativo !== false,
    estoque: num(data.estoque, 10),
    tamanhos: Array.isArray(data.tamanhos) ? data.tamanhos : [],
  });

  return json({ ok: true, produto }, 201);
}

async function adminProductUpdate(ctx) {
  const auth = await requireAdmin(ctx.request);
  if (auth.error) return fail(auth.error, auth.status);

  const produto = await db.get("products", ctx.params.id);
  if (!produto) return fail("Produto não encontrado.", 404);

  const data = await body(ctx.request);
  const patch = {};
  const campos = [
    "nome", "descricao", "imagem", "colecao", "tipo", "publico",
    "categoria", "destaque", "novidade", "ativo", "estoque", "tamanhos",
  ];
  for (const campo of campos) if (data[campo] !== undefined) patch[campo] = data[campo];
  if (data.preco !== undefined) {
    patch.preco = money(data.preco);
    patch.precoSobConsulta = patch.preco === 0;
  }

  const atualizado = await db.put("products", produto.id, { ...produto, ...patch });
  return ok({ produto: atualizado });
}

async function adminProductDelete(ctx) {
  const auth = await requireAdmin(ctx.request);
  if (auth.error) return fail(auth.error, auth.status);
  const produto = await db.get("products", ctx.params.id);
  if (!produto) return fail("Produto não encontrado.", 404);
  await db.put("products", produto.id, { ...produto, ativo: false });
  return ok({ mensagem: "Produto desativado." });
}

async function adminCoupons(ctx) {
  const auth = await requireAdmin(ctx.request);
  if (auth.error) return fail(auth.error, auth.status);
  const cupons = await db.list("coupons");
  return ok({ total: cupons.length, cupons });
}

async function adminCouponCreate(ctx) {
  const auth = await requireAdmin(ctx.request);
  if (auth.error) return fail(auth.error, auth.status);

  const data = await body(ctx.request);
  const codigo = text(data.codigo, 30).toUpperCase();
  if (!codigo) return fail("Informe o código do cupom.", 422);

  const cupom = await db.put("coupons", codigo, {
    codigo,
    tipo: data.tipo === "fixo" ? "fixo" : "percentual",
    valor: num(data.valor),
    minimo: num(data.minimo, 0),
    validade: data.validade || null,
    ativo: data.ativo !== false,
    usos: 0,
  });
  return json({ ok: true, cupom }, 201);
}

async function adminCouponDelete(ctx) {
  const auth = await requireAdmin(ctx.request);
  if (auth.error) return fail(auth.error, auth.status);
  await db.remove("coupons", String(ctx.params.codigo).toUpperCase());
  return ok({ mensagem: "Cupom removido." });
}

/* ==========================================================
   ROTEADOR
   ========================================================== */

const routes = [
  ["GET", /^\/health$/, async () => ok({ servico: "Royal Suits API", versao: "1.0.0", hora: new Date().toISOString() })],

  ["POST", /^\/auth\/register$/, register],
  ["POST", /^\/auth\/login$/, login],
  ["GET", /^\/auth\/me$/, me],
  ["PATCH", /^\/auth\/profile$/, updateProfile],
  ["POST", /^\/auth\/forgot-password$/, forgotPassword],
  ["POST", /^\/auth\/reset-password$/, resetPassword],

  ["GET", /^\/products$/, listProducts],
  ["GET", /^\/products\/(?<id>[^/]+)$/, getProduct],

  ["GET", /^\/cart$/, cartGet],
  ["POST", /^\/cart\/items$/, cartAdd],
  ["PATCH", /^\/cart\/items\/(?<productId>[^/]+)$/, cartUpdate],
  ["DELETE", /^\/cart\/items\/(?<productId>[^/]+)$/, cartRemove],
  ["DELETE", /^\/cart$/, cartClear],

  ["GET", /^\/favorites$/, favoritesGet],
  ["POST", /^\/favorites$/, favoritesAdd],
  ["DELETE", /^\/favorites\/(?<productId>[^/]+)$/, favoritesRemove],

  ["POST", /^\/shipping\/quote$/, shippingQuote],
  ["POST", /^\/coupons\/validate$/, couponValidate],

  ["POST", /^\/orders$/, createOrder],
  ["GET", /^\/orders$/, listOrders],
  ["GET", /^\/orders\/(?<numero>[^/]+)$/, getOrder],
  ["POST", /^\/orders\/(?<numero>[^/]+)\/cancel$/, cancelOrder],

  ["POST", /^\/contact$/, contact],
  ["POST", /^\/newsletter$/, newsletter],

  ["POST", /^\/admin\/bootstrap$/, bootstrap],
  ["GET", /^\/admin\/stats$/, adminStats],
  ["GET", /^\/admin\/orders$/, adminOrders],
  ["PATCH", /^\/admin\/orders\/(?<numero>[^/]+)\/status$/, adminOrderStatus],
  ["GET", /^\/admin\/messages$/, adminMessages],
  ["PATCH", /^\/admin\/messages\/(?<id>[^/]+)$/, adminMessageUpdate],
  ["GET", /^\/admin\/newsletter$/, adminNewsletter],
  ["POST", /^\/admin\/products$/, adminProductCreate],
  ["PATCH", /^\/admin\/products\/(?<id>[^/]+)$/, adminProductUpdate],
  ["DELETE", /^\/admin\/products\/(?<id>[^/]+)$/, adminProductDelete],
  ["GET", /^\/admin\/coupons$/, adminCoupons],
  ["POST", /^\/admin\/coupons$/, adminCouponCreate],
  ["DELETE", /^\/admin\/coupons\/(?<codigo>[^/]+)$/, adminCouponDelete],
];

/* Rota pública da função (Netlify Functions v2).
   Com isto, /api e /api/qualquer-coisa chegam direto aqui, sem depender
   de redirect e sem expor /.netlify/functions/api. */
export const config = {
  path: ["/api", "/api/*"],
};

export default async function handler(request) {
  if (request.method === "OPTIONS") return preflight();

  const url = new URL(request.url);
  const path = url.pathname
    .replace(/^\/\.netlify\/functions\/api/, "")
    .replace(/^\/api/, "")
    .replace(/\/+$/, "") || "/";

  for (const [method, pattern, fn] of routes) {
    if (method !== request.method) continue;
    const match = path.match(pattern);
    if (!match) continue;
    try {
      return await fn({ request, url, method: request.method, params: match.groups || {} });
    } catch (erro) {
      console.error("[api] erro:", erro);
      return fail("Erro interno. Tente novamente em instantes.", 500);
    }
  }

  return fail(`Rota não encontrada: ${request.method} ${path}`, 404);
}
