/* ==========================================================
   ROYAL SUITS — CLIENTE DA API (js/rs-api.js)
   ----------------------------------------------------------
   Uso:
     await RS.login(email, senha)
     await RS.register({nome, email, telefone, senha})
     await RS.criarPedido(pedido)
     await RS.meusPedidos()
   ========================================================== */

(function (window) {
  "use strict";

  var API = "/api";
  var TOKEN_KEY = "rs_token";
  var USER_KEY = "rs_user";
  var SESSION_KEY = "rs_session";

  function sessionId() {
    var id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        (window.crypto && crypto.randomUUID && crypto.randomUUID()) ||
        "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  function token() {
    return localStorage.getItem(TOKEN_KEY) || "";
  }

  function usuario() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) || null;
    } catch (e) {
      return null;
    }
  }

  function salvarSessao(dados) {
    if (dados.token) localStorage.setItem(TOKEN_KEY, dados.token);
    if (dados.usuario) {
      localStorage.setItem(USER_KEY, JSON.stringify(dados.usuario));
      if (dados.usuario.email) localStorage.setItem("usuarioLogado", dados.usuario.email);
    }
  }

  function limparSessao() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("usuarioLogado");
  }

  async function api(caminho, opcoes) {
    opcoes = opcoes || {};
    var headers = {
      "Content-Type": "application/json",
      "X-Session-Id": sessionId(),
    };
    if (token()) headers.Authorization = "Bearer " + token();

    var resposta;
    try {
      resposta = await fetch(API + caminho, {
        method: opcoes.method || "GET",
        headers: headers,
        body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
        cache: "no-store",
      });
    } catch (erro) {
      throw new Error("Não foi possível conectar ao servidor. Verifique sua internet.");
    }

    var dados = {};
    try {
      dados = await resposta.json();
    } catch (e) {
      dados = {};
    }

    if (!resposta.ok) {
      var erro = new Error(dados.erro || "Erro ao processar a solicitação.");
      erro.status = resposta.status;
      erro.detalhes = dados.detalhes || null;
      throw erro;
    }
    return dados;
  }

  /* ------------------------- AUTH ------------------------- */

  async function login(email, senha) {
    var dados = await api("/auth/login", { method: "POST", body: { email: email, senha: senha } });
    salvarSessao(dados);
    return dados;
  }

  async function register(dadosCadastro) {
    var dados = await api("/auth/register", { method: "POST", body: dadosCadastro });
    salvarSessao(dados);
    return dados;
  }

  async function me() {
    if (!token()) return null;
    try {
      var dados = await api("/auth/me");
      if (dados.usuario) localStorage.setItem(USER_KEY, JSON.stringify(dados.usuario));
      return dados.usuario;
    } catch (erro) {
      if (erro.status === 401) limparSessao();
      return null;
    }
  }

  function logout() {
    limparSessao();
    window.location.href = "paginainicial.html";
  }

  function logado() {
    return Boolean(token());
  }

  /* ------------------------ PEDIDOS ------------------------ */

  function normalizarPedido(p) {
    if (!p) return p;
    return Object.assign({}, p, {
      data: p.data || p.createdAt,
      status: p.status || "Aguardando pagamento",
    });
  }

  async function criarPedido(pedido) {
    var dados = await api("/orders", {
      method: "POST",
      body: {
        itens: (pedido.itens || []).map(function (i) {
          return {
            productId: i.productId,
            nome: i.nome,
            preco: i.preco,
            imagem: i.imagem,
            quantidade: i.quantidade,
            tamanho: i.tamanho,
          };
        }),
        cliente: pedido.cliente,
        endereco: pedido.endereco,
        frete: pedido.frete,
        pagamento: pedido.pagamento,
        cupom: pedido.cupom || null,
      },
    });
    return normalizarPedido(dados.pedido);
  }

  async function meusPedidos() {
    var dados = await api("/orders");
    return (dados.pedidos || []).map(normalizarPedido);
  }

  async function consultarPedido(numero, email) {
    var dados = await api("/orders/" + encodeURIComponent(numero) + "?email=" + encodeURIComponent(email || ""));
    return normalizarPedido(dados.pedido);
  }

  /* --------------------- CARRINHO/FAVORITOS --------------------- */

  async function carrinho() {
    return api("/cart");
  }

  async function sincronizarCarrinho(itens) {
    for (var i = 0; i < itens.length; i++) {
      await api("/cart/items", {
        method: "POST",
        body: {
          nome: itens[i].nome,
          quantidade: itens[i].quantidade || 1,
          tamanho: itens[i].tamanho || "",
        },
      });
    }
  }

  async function favoritos() {
    var dados = await api("/favorites");
    return dados.itens || [];
  }

  async function favoritar(valor) {
    var corpo =
      valor && typeof valor === "object" ? { productId: valor.productId, nome: valor.nome } : { nome: valor };
    var dados = await api("/favorites", { method: "POST", body: corpo });
    return dados.itens || [];
  }

  async function desfavoritar(productId) {
    var dados = await api("/favorites/" + encodeURIComponent(productId), { method: "DELETE" });
    return dados.itens || [];
  }

  /* ------------------------- EXTRAS ------------------------- */

  async function cotarFrete(cep, subtotal) {
    return api("/shipping/quote", { method: "POST", body: { cep: cep, subtotal: subtotal } });
  }

  async function validarCupom(codigo, subtotal, tipoPagamento) {
    return api("/coupons/validate", {
      method: "POST",
      body: { codigo: codigo, subtotal: subtotal, tipoPagamento: tipoPagamento },
    });
  }

  async function contato(dados) {
    return api("/contact", { method: "POST", body: dados });
  }

  async function newsletter(email) {
    return api("/newsletter", { method: "POST", body: { email: email } });
  }

  window.RS = {
    api: api,
    token: token,
    usuario: usuario,
    logado: logado,
    login: login,
    register: register,
    me: me,
    logout: logout,
    criarPedido: criarPedido,
    meusPedidos: meusPedidos,
    consultarPedido: consultarPedido,
    carrinho: carrinho,
    sincronizarCarrinho: sincronizarCarrinho,
    favoritos: favoritos,
    favoritar: favoritar,
    desfavoritar: desfavoritar,
    cotarFrete: cotarFrete,
    validarCupom: validarCupom,
    contato: contato,
    newsletter: newsletter,
  };
})(window);
