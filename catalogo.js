/* ==========================================================
   ROYAL SUITS — CATÁLOGO (ternos.html / vestidos.html)
   Filtro por coleção (formatura / casamento) + carrinho + favoritos
========================================================== */

(function () {
    "use strict";

    var filtros = document.querySelectorAll(".filtro");
    var produtos = document.querySelectorAll(".produto-card");

    filtros.forEach(function (filtro) {
        filtro.addEventListener("click", function () {
            filtros.forEach(function (item) { item.classList.remove("ativo"); });
            this.classList.add("ativo");

            var colecao = this.dataset.filtro;

            produtos.forEach(function (produto) {
                var mostrar = colecao === "todos" || produto.dataset.colecao === colecao;
                produto.style.display = mostrar ? "" : "none";
            });
        });
    });

    /* ---------------- CARRINHO ---------------- */
    window.adicionarCarrinho = function (nome, preco, imagem) {
        var carrinho = [];
        try {
            carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
        } catch (e) {
            carrinho = [];
        }

        var existente = carrinho.find(function (p) { return p.nome === nome; });

        if (existente) {
            existente.quantidade = (existente.quantidade || 1) + 1;
        } else {
            carrinho.push({ nome: nome, preco: preco, imagem: imagem, quantidade: 1 });
        }

        localStorage.setItem("carrinho", JSON.stringify(carrinho));

        if (window.rsToast) {
            window.rsToast(nome + " foi adicionado ao carrinho!");
        } else {
            alert(nome + " foi adicionado ao carrinho!");
        }
    };

    window.consultarProduto = function (nome) {
        var msg = "Entre em contato com a ROYAL SUITS para consultar " + nome + ".";
        if (window.rsToast) {
            window.rsToast(msg);
        } else {
            alert(msg);
        }
    };

    /* ---------------- FAVORITOS ---------------- */
    function obterFavoritos() {
        try {
            return JSON.parse(localStorage.getItem("favoritos")) || [];
        } catch (e) {
            return [];
        }
    }

    function alternarFavorito(botao) {
        var nome = botao.dataset.nome;
        var imagem = botao.dataset.imagem;
        var preco = Number(botao.dataset.preco) || 0;

        var favoritos = obterFavoritos();
        var existe = favoritos.some(function (p) { return p.nome === nome; });

        if (existe) {
            favoritos = favoritos.filter(function (p) { return p.nome !== nome; });
            botao.classList.remove("ativo");
        } else {
            favoritos.push({ nome: nome, imagem: imagem, preco: preco });
            botao.classList.add("ativo");
        }

        localStorage.setItem("favoritos", JSON.stringify(favoritos));

        if (window.rsSyncFavorito) {
            window.rsSyncFavorito(nome, !existe);
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        var favoritos = obterFavoritos();

        document.querySelectorAll(".favorito").forEach(function (botao) {
            if (favoritos.some(function (p) { return p.nome === botao.dataset.nome; })) {
                botao.classList.add("ativo");
            }
            botao.addEventListener("click", function () {
                alternarFavorito(botao);
            });
        });
    });
})();
