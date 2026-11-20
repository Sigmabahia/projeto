/* ==========================================================
   MEUS PEDIDOS — ROYAL SUITS
========================================================== */

(function () {
    "use strict";

    var L = window.Loja;

    if (!L) return;

    function el(id) { return document.getElementById(id); }

    function formatarData(iso) {
        try {
            return new Date(iso).toLocaleDateString("pt-BR", {
                day: "2-digit", month: "long", year: "numeric"
            });
        } catch (e) {
            return "";
        }
    }

    function nomePagamento(tipo) {
        return { pix: "PIX", cartao: "Cartão de crédito", boleto: "Boleto bancário" }[tipo] || tipo;
    }

    function renderizar() {
        var pedidos = L.obterPedidos();
        var container = el("lista-pedidos");

        if (!pedidos.length) {
            container.innerHTML = '' +
                '<div class="vazio-pedidos">' +
                    '<div class="icone">🛍</div>' +
                    '<h2>Você ainda não tem pedidos</h2>' +
                    '<p>Quando finalizar uma compra, ela aparece aqui com todas as informações de pagamento e entrega.</p>' +
                    '<a href="paginainicial.html" class="ck-btn">Explorar modelos</a>' +
                '</div>';
            return;
        }

        container.innerHTML = pedidos.map(function (pedido, indice) {
            var pago = /pago|confirmado/i.test(pedido.status || "");
            var itens = (pedido.itens || []).map(function (item) {
                var qtd = Number(item.quantidade) || 1;
                return '' +
                    '<div class="ck-item">' +
                        '<div class="ck-item-img"><img src="' + L.escaparHtml(item.imagem || "imagens/ternos/terno-azul-01.png") + '" alt="' + L.escaparHtml(item.nome) + '"></div>' +
                        '<div class="ck-item-info">' +
                            '<strong>' + L.escaparHtml(item.nome) + '</strong>' +
                            '<small>Qtd. ' + qtd + ' • ' + (Number(item.preco) > 0 ? L.formatarPreco(item.preco) : "Sob consulta") + '</small>' +
                        '</div>' +
                        '<div class="ck-item-preco">' + (Number(item.preco) > 0 ? L.formatarPreco(item.preco * qtd) : "—") + '</div>' +
                    '</div>';
            }).join("");

            var freteNome = pedido.frete ? pedido.frete.nome : "—";
            var total = pedido.totais ? pedido.totais.total : 0;

            return '' +
                '<article class="pedido-card" data-indice="' + indice + '">' +
                    '<div class="pedido-topo">' +
                        '<div>' +
                            '<div class="pedido-numero">' + L.escaparHtml(pedido.numero) + '</div>' +
                            '<div class="pedido-data">' + formatarData(pedido.data) + '</div>' +
                        '</div>' +
                        '<span class="pedido-status' + (pago ? " pago" : "") + '">' + L.escaparHtml(pedido.status) + '</span>' +
                    '</div>' +
                    '<div class="pedido-corpo">' +
                        '<div class="pedido-itens">' + itens + '</div>' +
                        '<div class="pedido-totais">' +
                            '<div>' +
                                '<small>Pagamento</small>' +
                                '<strong style="font-size:12px;">' + nomePagamento(pedido.pagamento ? pedido.pagamento.tipo : "") + '</strong>' +
                            '</div>' +
                            '<div>' +
                                '<small>Entrega</small>' +
                                '<strong style="font-size:12px;">' + L.escaparHtml(freteNome) + '</strong>' +
                            '</div>' +
                            '<div style="text-align:right;">' +
                                '<small>Total</small>' +
                                '<strong>' + L.formatarPreco(total) + '</strong>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="pedido-acoes">' +
                        (pedido.pagamento && pedido.pagamento.pixCopiaECola
                            ? '<button type="button" data-acao="pix" data-indice="' + indice + '">Copiar código PIX</button>'
                            : '') +
                        '<button type="button" data-acao="recomprar" data-indice="' + indice + '">Comprar novamente</button>' +
                        '<a href="https://wa.me/' + L.CONFIG.whatsapp + '?text=' +
                            encodeURIComponent("Olá! Gostaria de falar sobre o pedido " + pedido.numero + ".") +
                            '" target="_blank" rel="noopener">Falar no WhatsApp</a>' +
                    '</div>' +
                '</article>';
        }).join("");

        container.addEventListener("click", function (evento) {
            var botao = evento.target.closest("[data-acao]");
            if (!botao) return;

            var pedido = L.obterPedidos()[Number(botao.dataset.indice)];
            if (!pedido) return;

            if (botao.dataset.acao === "pix") {
                if (navigator.clipboard) navigator.clipboard.writeText(pedido.pagamento.pixCopiaECola);
                if (window.rsToast) window.rsToast("Código PIX copiado!");
            }

            if (botao.dataset.acao === "recomprar") {
                (pedido.itens || []).forEach(function (item) {
                    L.adicionarAoCarrinho(item.nome, item.preco, item.imagem, item.quantidade);
                });
                if (window.rsToast) window.rsToast("Itens adicionados ao carrinho!");
                setTimeout(function () { window.location.href = "carrinho.html"; }, 900);
            }
        });
    }

    document.addEventListener("DOMContentLoaded", renderizar);

})();
