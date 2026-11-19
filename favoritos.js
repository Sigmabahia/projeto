/* =================================
   FAVORITOS - ROYAL SUITS
================================= */

function obterFavoritos() {
    try {
        return JSON.parse(localStorage.getItem("favoritos")) || [];
    } catch (erro) {
        return [];
    }
}

function salvarFavoritos(lista) {
    localStorage.setItem("favoritos", JSON.stringify(lista));
}

function adicionarAoCarrinho(nome, preco, imagem) {

    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    const existente = carrinho.find(produto => produto.nome === nome);

    if (existente) {
        existente.quantidade = (existente.quantidade || 1) + 1;
    } else {
        carrinho.push({
            nome: nome,
            preco: preco,
            imagem: imagem,
            quantidade: 1
        });
    }

    localStorage.setItem("carrinho", JSON.stringify(carrinho));

    alert(nome + " foi adicionado ao carrinho!");
}

function removerFavorito(nome) {

    const lista = obterFavoritos().filter(produto => produto.nome !== nome);

    salvarFavoritos(lista);

    renderizarFavoritos();
}

function renderizarFavoritos() {

    const lista = document.getElementById("lista-favoritos");
    const vazio = document.getElementById("favoritos-vazio");

    if (!lista) return;

    const favoritos = obterFavoritos();

    lista.innerHTML = "";

    if (favoritos.length === 0) {

        if (vazio) vazio.style.display = "block";
        return;

    }

    if (vazio) vazio.style.display = "none";

    favoritos.forEach(produto => {

        const card = document.createElement("div");
        card.className = "produto-favorito";

        const imagem = produto.imagem || "imagens/ternos/terno-azul-01.png";
        const preco = Number(produto.preco) > 0
            ? "R$ " + Number(produto.preco).toFixed(2).replace(".", ",")
            : "Sob consulta";

        card.innerHTML = `
            <img src="${imagem}" alt="${produto.nome}">
            <div class="info-produto">
                <h3>${produto.nome}</h3>
                <p class="preco">${preco}</p>
                <div class="acoes-produto">
                    <button class="botao-carrinho">ADICIONAR AO CARRINHO</button>
                    <button class="botao-remover">REMOVER</button>
                </div>
            </div>
        `;

        card.querySelector(".botao-carrinho").addEventListener("click", function () {
            adicionarAoCarrinho(produto.nome, produto.preco, imagem);
        });

        card.querySelector(".botao-remover").addEventListener("click", function () {
            removerFavorito(produto.nome);
        });

        lista.appendChild(card);

    });

}

document.addEventListener("DOMContentLoaded", renderizarFavoritos);
