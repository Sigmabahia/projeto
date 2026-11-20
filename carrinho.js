/* ==========================================================
   CARRINHO — ROYAL SUITS (carrinho.js)
   Usa o núcleo compartilhado loja.js
========================================================== */

(function () {
    "use strict";

    var L = window.Loja;

    if (!L) {
        console.error("loja.js não carregado.");
        return;
    }

    var estado = {
        cep: localStorage.getItem("cepEntrega") || "",
        frete: null
    };

    function el(id) { return document.getElementById(id); }

    function toast(msg) {
        if (window.rsToast) window.rsToast(msg);
        else alert(msg);
    }

    /* ======================================================
       RENDERIZAÇÃO DOS PRODUTOS
    ====================================================== */

    function renderizarCarrinho() {
        var lista = el("lista-produtos");
        var vazio = el("carrinho-vazio");
        var quantidade = el("quantidade-produtos");
        var botaoFinalizar = el("finalizar-btn");

        if (!lista) return;

        var carrinho = L.obterCarrinho();
        lista.innerHTML = "";

        if (!carrinho.length) {
            if (vazio) vazio.style.display = "block";
            if (quantidade) quantidade.textContent = "0 itens";
            if (botaoFinalizar) botaoFinalizar.disabled = true;

            var opcoesVazias = el("opcoes-frete");
            if (opcoesVazias) opcoesVazias.innerHTML = "";

            atualizarTotais();
            L.atualizarContador();
            return;
        }

        if (vazio) vazio.style.display = "none";

        carrinho.forEach(function (produto) {
            var qtd = Number(produto.quantidade) || 1;
            var preco = Number(produto.preco) || 0;

            var item = document.createElement("div");
            item.className = "item-carrinho";

            item.innerHTML = '' +
                '<div class="item-imagem">' +
                    '<img src="' + L.escaparHtml(produto.imagem || "imagens/ternos/terno-azul-01.png") + '" alt="' + L.escaparHtml(produto.nome) + '">' +
                '</div>' +
                '<div class="item-info">' +
                    '<h3>' + L.escaparHtml(produto.nome) + '</h3>' +
                    '<p class="item-preco">' + (preco > 0 ? L.formatarPreco(preco) : "Sob consulta") + '</p>' +
                    '<div class="quantidade">' +
                        '<button type="button" class="menos" aria-label="Diminuir quantidade">−</button>' +
                        '<span>' + qtd + '</span>' +
                        '<button type="button" class="mais" aria-label="Aumentar quantidade">+</button>' +
                    '</div>' +
                '</div>' +
                '<div class="item-acoes">' +
                    '<button type="button" class="remover">REMOVER</button>' +
                '</div>';

            item.querySelector(".menos").addEventListener("click", function () {
                L.alterarQuantidade(produto.nome, -1);
                renderizarCarrinho();
            });

            item.querySelector(".mais").addEventListener("click", function () {
                L.alterarQuantidade(produto.nome, 1);
                renderizarCarrinho();
            });

            item.querySelector(".remover").addEventListener("click", function () {
                L.removerDoCarrinho(produto.nome);
                renderizarCarrinho();
                toast(produto.nome + " removido do carrinho.");
            });

            lista.appendChild(item);
        });

        var itens = L.totalItens();
        if (quantidade) quantidade.textContent = itens + (itens === 1 ? " item" : " itens");
        if (botaoFinalizar) botaoFinalizar.disabled = false;

        atualizarTotais();
        L.atualizarContador();
    }

    /* ======================================================
       TOTAIS
    ====================================================== */

    function atualizarTotais() {
        var subtotal = L.subtotalCarrinho();
        var frete = estado.frete ? Number(estado.frete.preco) : 0;
        var total = subtotal + frete;

        var campSubtotal = el("subtotal");
        var campFrete = el("frete");
        var campTotal = el("total");

        if (campSubtotal) campSubtotal.textContent = L.formatarPreco(subtotal);

        if (campFrete) {
            if (!estado.frete) campFrete.textContent = "A calcular";
            else if (frete === 0) campFrete.textContent = "Grátis";
            else campFrete.textContent = L.formatarPreco(frete);
        }

        if (campTotal) campTotal.textContent = L.formatarPreco(total);

        // Se o subtotal mudou, o frete grátis pode ter mudado
        if (estado.frete && estado.cep) {
            var opcoes = L.calcularFrete(estado.cep, subtotal);
            var mesmaOpcao = opcoes.filter(function (o) { return o.id === estado.frete.id; })[0];
            if (mesmaOpcao && mesmaOpcao.preco !== estado.frete.preco) {
                estado.frete = mesmaOpcao;
                renderizarOpcoesFrete(opcoes);
                if (campFrete) campFrete.textContent = mesmaOpcao.preco > 0 ? L.formatarPreco(mesmaOpcao.preco) : "Grátis";
                if (campTotal) campTotal.textContent = L.formatarPreco(subtotal + mesmaOpcao.preco);
            }
        }
    }

    /* ======================================================
       FRETE
    ====================================================== */

    function renderizarOpcoesFrete(opcoes) {
        var container = el("opcoes-frete");
        if (!container) return;

        container.innerHTML = opcoes.map(function (opcao) {
            var selecionado = estado.frete && estado.frete.id === opcao.id;
            var precoTexto = opcao.preco > 0 ? L.formatarPreco(opcao.preco) : "Grátis";
            var prazo = opcao.id === "retirada"
                ? "1 a 2 dias úteis"
                : opcao.prazoMin + " a " + opcao.prazoMax + " dias úteis";

            return '' +
                '<label class="opcao-frete' + (selecionado ? " selecionada" : "") + '" data-id="' + opcao.id + '">' +
                    '<input type="radio" name="frete-carrinho" value="' + opcao.id + '"' + (selecionado ? " checked" : "") + '>' +
                    '<span class="opcao-frete-nome">' + opcao.nome + '<small>' + prazo + '</small></span>' +
                    '<strong class="' + (opcao.preco === 0 ? "gratis" : "") + '">' + precoTexto + '</strong>' +
                '</label>';
        }).join("");

        L.$$(".opcao-frete", container).forEach(function (rotulo) {
            rotulo.addEventListener("click", function () {
                var id = rotulo.dataset.id;
                var opcao = opcoes.filter(function (o) { return o.id === id; })[0];
                if (!opcao) return;

                L.$$(".opcao-frete", container).forEach(function (r) { r.classList.remove("selecionada"); });
                rotulo.classList.add("selecionada");
                rotulo.querySelector("input").checked = true;

                estado.frete = opcao;
                salvarEstadoFrete();
                atualizarTotais();
            });
        });
    }

    function salvarEstadoFrete() {
        try {
            localStorage.setItem("cepEntrega", estado.cep);
            localStorage.setItem("freteSelecionado", JSON.stringify(estado.frete));
        } catch (e) {}
    }

    function calcularFrete() {
        var input = el("cep-frete");
        var botao = el("btn-calcular-frete");
        var cep = input.value;

        if (!L.validarCEP(cep)) {
            toast("Digite um CEP válido com 8 números.");
            input.focus();
            return;
        }

        botao.disabled = true;
        botao.textContent = "…";

        estado.cep = L.apenasNumeros(cep);

        var opcoes = L.calcularFrete(estado.cep, L.subtotalCarrinho());
        estado.frete = opcoes[0];
        renderizarOpcoesFrete(opcoes);
        salvarEstadoFrete();
        atualizarTotais();

        botao.disabled = false;
        botao.textContent = "CALCULAR";

        L.buscarCEP(estado.cep)
            .then(function (endereco) {
                toast("Frete para " + endereco.cidade + "/" + endereco.uf + " calculado.");
            })
            .catch(function () {
                toast("Frete calculado pela região do CEP.");
            });
    }

    /* ======================================================
       INICIALIZAÇÃO
    ====================================================== */

    document.addEventListener("DOMContentLoaded", function () {

        renderizarCarrinho();

        var inputCep = el("cep-frete");
        var botao = el("btn-calcular-frete");

        if (inputCep) {
            L.aplicarMascara(inputCep, "cep");

            if (estado.cep) {
                inputCep.value = L.formatarCEP(estado.cep);
                var opcoes = L.calcularFrete(estado.cep, L.subtotalCarrinho());
                var salvo = null;
                try {
                    salvo = JSON.parse(localStorage.getItem("freteSelecionado"));
                } catch (e) {}

                estado.frete = (salvo && opcoes.filter(function (o) { return o.id === salvo.id; })[0]) || opcoes[0];
                renderizarOpcoesFrete(opcoes);
                atualizarTotais();
            }

            inputCep.addEventListener("keydown", function (evento) {
                if (evento.key === "Enter") {
                    evento.preventDefault();
                    calcularFrete();
                }
            });
        }

        if (botao) botao.addEventListener("click", calcularFrete);

        var botaoFinalizar = el("finalizar-btn");

        if (botaoFinalizar) {
            botaoFinalizar.addEventListener("click", function () {
                if (!L.obterCarrinho().length) return;

                if (estado.cep) salvarEstadoFrete();

                window.location.href = "checkout.html";
            });
        }

        document.addEventListener("carrinhoAtualizado", atualizarTotais);
    });

})();
