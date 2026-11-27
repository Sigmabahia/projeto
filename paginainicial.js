
/* =================================
   CARRINHO DE COMPRAS
================================= */

function adicionarCarrinho(nome, preco, imagem) {

    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    const produtoExistente = carrinho.find(
        produto => produto.nome === nome
    );

    if (produtoExistente) {

        produtoExistente.quantidade =
            (produtoExistente.quantidade || 1) + 1;

    } else {

        carrinho.push({
            nome: nome,
            preco: preco,
            imagem: imagem,
            quantidade: 1
        });

    }

    localStorage.setItem("carrinho", JSON.stringify(carrinho));

    atualizarContadorCarrinho();

    alert(nome + " foi adicionado ao carrinho!");
}


/* =================================
   CONTADOR DO CARRINHO
================================= */

function atualizarContadorCarrinho() {

    const contador = document.getElementById("contador-carrinho");

    if (!contador) return;

    const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    const quantidadeTotal = carrinho.reduce(
        (total, produto) => total + (Number(produto.quantidade) || 1),
        0
    );

    contador.textContent = quantidadeTotal;
}


/* =================================
   CARROSSEL
================================= */

let slideAtual = 0;

function mostrarSlide(indice) {

    const slides = document.querySelectorAll(".slide");
    const pontos = document.querySelectorAll(".ponto");

    if (slides.length === 0) return;

    if (indice >= slides.length) {
        slideAtual = 0;
    } else if (indice < 0) {
        slideAtual = slides.length - 1;
    } else {
        slideAtual = indice;
    }

    slides.forEach(slide => slide.classList.remove("active"));
    pontos.forEach(ponto => ponto.classList.remove("active"));

    slides[slideAtual].classList.add("active");

    if (pontos[slideAtual]) {
        pontos[slideAtual].classList.add("active");
    }
}

function mudarSlide(direcao) {
    mostrarSlide(slideAtual + direcao);
}

function irParaSlide(indice) {
    mostrarSlide(indice);
}



/* =================================
   CONSULTAR MODELO
================================= */

function consultarModelo(nome) {

    const botaoChat = document.getElementById("rs-chat-button");

    if (botaoChat) botaoChat.click();

    if (window.rsToast) {
        window.rsToast("Fale com a equipe pelo chat ou WhatsApp para consultar " + nome + ".");
    }
}


/* =================================
   FILTROS DA VITRINE
================================= */

function aplicarFiltro(rotulo) {

    const termo = String(rotulo || "").toLowerCase();

    document.querySelectorAll(".produtos-grid .produto-card").forEach(function (card) {

        const categoria = (card.getAttribute("data-categoria") || "").toLowerCase();
        const colecao = (card.getAttribute("data-colecao") || "").toLowerCase();

        let mostrar = termo === "todos" ||
            categoria === termo ||
            colecao === termo ||
            (termo === "masculino" && categoria === "ternos");

        card.style.display = mostrar ? "" : "none";
    });
}

function ativarFiltros() {

    const botoes = document.querySelectorAll(".filtros .filtro");

    botoes.forEach(function (botao) {

        botao.addEventListener("click", function () {

            botoes.forEach(function (outro) { outro.classList.remove("ativo"); });

            botao.classList.add("ativo");

            aplicarFiltro(botao.textContent.trim());
        });
    });
}

/* =================================
   INICIALIZAÇÃO
================================= */

document.addEventListener("DOMContentLoaded", function () {

    atualizarContadorCarrinho();

    mostrarSlide(0);

    ativarFiltros();

});
